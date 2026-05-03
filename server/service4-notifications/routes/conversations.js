const express = require('express')
const router = express.Router()
const ConversationModel = require('../models/Conversation')
const MessageModel = require('../models/Message')
const { sendBroadcastNotification } = require('../config/socket')
const { getUser } = require('../config/kafka/consumer')
const { discoverAuthService } = require('../config/discovery.service')
const axios = require('axios')

async function resolveUser(userId) {
    let user = getUser(String(userId));
    if (!user) {
        const authServiceBaseUrl = await discoverAuthService();
        const { data } = await axios.get(
            `${authServiceBaseUrl}/get_user_byId/${userId}`,
            { timeout: 5000 }
        );
        user = data.user;
    }
    return user;
}

router.post('/create-direct', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        const { targetUserId } = req.body

        if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });
        if (userId == targetUserId) return res.status(400).json({ error: 'Cannot chat with yourself' });


        const existing = await ConversationModel.findOne({
            isGroup: false,
            'members.userId': { $all: [Number(userId), Number(targetUserId)] },
            $expr: { $eq: [{ $size: '$members' }, 2] }
        });

        if (existing) return res.status(200).json(existing)

        const newRoom = await ConversationModel.create({
            isGroup: false,
            members: [
                { userId: userId, role: 'admin' },
                { userId: targetUserId, role: 'member' }
            ]
        })

        res.status(200).json(newRoom)

    } catch (error) {
        console.log("error while creating new room", error.message)
        res.status(500).json({ error: error });
    }
})

router.post('/create-groupe', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        const { title, membersIds } = req.body

        if (!membersIds) return res.status(400).json({ error: "you should pass the members ids" })

        const existing = await ConversationModel.findOne({
            title: title,
            isGroup: true,
            "members.userId": { $all: [Number(userId), ...membersIds.map(Number)] },
            $expr: { $eq: [{ $size: '$members' }, (membersIds.length + 1)] }
        })
        if (existing) return res.status(200).json(existing)

        const members = [
            { userId: userId, role: 'admin' },
            ...membersIds
                .filter(id => id !== userId)
                .map(id => ({ userId: Number(id), role: 'member' }))
        ];

        const newRoom = await ConversationModel.create({
            title: title,
            isGroup: true,
            members
        })

        return res.status(200).json(newRoom)
    } catch (error) {
        console.log("error while creating new room", error.message)
        res.status(500).json({ error: error });
    }
})

router.get('/my-conversations', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']

        const rooms = await ConversationModel.find({
            "members.userId": userId
        }).sort({ updatedAt: -1 });

        const enrichedRooms = await Promise.all(
            rooms.map(async (r) => {
                const members = await Promise.all(
                    r.members.map(async (m) => {
                        try {

                            const user = await resolveUser(m.userId)
                            return {
                                userId: m.userId,
                                role: m.role,
                                userName: user.userName,
                                givenName: user.givenName,
                                familyName: user.familyName,
                                userImg: user.uerImg,
                            }

                        } catch (error) {
                            res.status(500).json("error while fetching users", error.message)
                        }

                    }
                    )
                )

                let lastMessage = null;
                if (r.lastMessage) {
                    lastMessage = await MessageModel.findById(r.lastMessage);
                }

                return {
                    ...r.toObject(),
                    members,
                    lastMessage
                };
            }
            ))

        return res.status(200).json(enrichedRooms)
    } catch (error) {
        console.log("error while fetching the conversations", error.message)
        res.status(500).json({ error: error.message });
    }
})

router.put('/:conversationId/add-member', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { newMemberId } = req.body;

        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        if (!conversation.isGroup) return res.status(400).json({ error: 'Cannot add members to a direct conversation' });

        // verify if the current user is the admin
        const me = conversation.members.find(m => m.userId == userId);
        if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Only admins can add members' });

        const alreadyMember = conversation.members.some(m => m.userId == newMemberId);
        if (alreadyMember) return res.status(400).json({ error: 'User is already a member' });

        conversation.members.push({ userId: newMemberId, role: 'member' });
        await conversation.save();

        res.status(200).json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

router.put('/:conversationId/leave', async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        const { conversationId } = req.params

        const room = await ConversationModel.findById(conversationId)
        if (!room) return res.status(404).json("room doesn't exist")

        const userExist = room.members.some((m) => m.userId == userId)
        if (!userExist) return res.status(404).json({ error: "you don't already exist in this room" })

        room.members = room.members.filter((m) => m.userId !== userId)

        if (room.members.length === 0) { // if no member rest then we delete the conversation
            await MessageModel.deleteMany({ conversationId: room._id })
            await room.deleteOne()
            return res.status(200).json({ message: 'Conversation and all its messages deleted' });
        }

        const stillHasAdmin = room.members.some((m) => m.role === "admin")
        if (!stillHasAdmin) {
            room.members[0].role = "admin" // in case the admin leaves we assign the admin the first member in list
        }

        await room.save()
        return res.status(200).json({ message: 'Left conversation', room });

    } catch (error) {
        console.log("error while leaving from room", error.message)
        res.status(500).json({ error: error });
    }
})

module.exports = router