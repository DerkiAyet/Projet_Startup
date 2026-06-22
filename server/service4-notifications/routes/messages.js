const express = require('express')
const router = express.Router()
const MessageModel = require('../models/Message')
const ConversationModel = require('../models/Conversation')
const { getIO, getActiveConversations } = require('../config/socket')
const { handleCreateNotification } = require('./notify')
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

router.post('/:conversationId', async (req, res) => {
    try {
        const senderId = req.headers['x-user-id']
        const { content } = req.body

        const room = await ConversationModel.findById(req.params.conversationId)
        if (!room) return res.status(404).json({ error: "room doesn't exist" })

        const userExist = room.members.some((m) => m.userId == senderId)
        if (!userExist) return res.status(403).json({ error: "user doesn't exist in the room" })

        const newMessage = await MessageModel.create({
            conversationId: room._id,
            senderId,
            content,
            readBy: [{ userId: senderId }]
        })

        room.lastMessage = newMessage._id;
        await room.save()

        const sender = await resolveUser(senderId);
        const enrichedMessage = {
            ...newMessage.toObject(),
            senderInfo: {
                userId: senderId,
                givenName: sender.givenName,
                familyName: sender.familyName,
                userName: sender.userName,
                userImg: sender.userImg ?? null,
            }
        };

        const io = getIO();
        const activeConversations = getActiveConversations();

        await Promise.all(
            room.members
                .filter(member => String(member.userId) !== String(senderId))
                .map(async (member) => {
                    const isInConversation = activeConversations[member.userId] === String(room._id);
                    if (isInConversation) {
                        io.to(`user:${member.userId}`).emit('receive_message', {
                            conversationId: room._id,
                            message: enrichedMessage
                        });
                    } else {
                        io.to(`user:${member.userId}`).emit('receive_message', {
                            conversationId: room._id,
                            message: enrichedMessage
                        });
                        await handleCreateNotification({
                            idReceiver: member.userId,
                            type: 'NEW_MESSAGE',
                            title: 'New message',
                            conversationId: room._id,
                            message: `New message from ${enrichedMessage.senderInfo.givenName}`,
                            metadata: {
                                link: '/chats'
                            }
                        });
                    }
                })
        );

        io.to(`user:${senderId}`).emit('message_sent', {
            conversationId: room._id,
            message: enrichedMessage   
        });

        return res.status(200).json(enrichedMessage)

    } catch (error) {
        console.log("error while sending message", error.message)
        res.status(500).json('Internal Server Error', error)
    }
})

router.get('/:conversationId/messages', async (req, res) => {
    try {
        const messages = await MessageModel.find({ 
            conversationId: req.params.conversationId 
        }).sort({ createdAt: 1 });

        const enriched = await Promise.all(
            messages.map(async (msg) => {
                try {
                    const sender = await resolveUser(msg.senderId);
                    return {
                        ...msg.toObject(),
                        senderInfo: {
                            userId: msg.senderId,
                            givenName: sender.givenName,
                            familyName: sender.familyName,
                            userName: sender.userName,
                            userImg: sender.uerImg ?? null,
                        }
                    };
                } catch {
                    return msg.toObject(); // fallback if user lookup fails
                }
            })
        );

        return res.status(200).json(enriched);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:conversationId/read', async (req, res) => {
    try {
        const myId = req.headers['x-user-id'];

        await MessageModel.updateMany(
            {
                conversationId: req.params.conversationId,
                'readBy.userId': { $ne: myId }
            },
            {
                $push: { readBy: { userId: myId } }
            }
        );

        res.status(200).json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:messageId', async (req, res) => {
    try {
        const myId = req.headers['x-user-id'];
        const message = await MessageModel.findById(req.params.messageId);
        if (!message) return res.status(404).json({ error: 'Message not found' });

        if (String(member.userId) !== String(myId)) return res.status(403).json({ error: 'Not allowed' });

        await message.deleteOne()
        res.status(200).json({ message: 'Message deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router