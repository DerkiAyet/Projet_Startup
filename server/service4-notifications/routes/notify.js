const express = require('express')
const router = express.Router()
const NotificationModel = require('../models/Notification')
const { getIO, sendNotification, sendBroadcastNotification } = require('../config/socket')
const { discoverAuthService } = require('../config/discovery.service')
const axios = require('axios')

async function handleCreateNotification(data) {

    const notification = await NotificationModel.create(data);
    await notification.save();

    console.log("Notification created:", notification.id);

    // sendNotification(data.idReceiver, {
    //     ...data,
    //     actionRequired: false,
    // });

    sendBroadcastNotification(data.idReceiver, {
        ...data,
        actionRequired: false,
    })

}

router.post('/notify', async (req, res) => {
    try {
        const { idSender, idReceiver, title, message, type, metadata } = req.body;

        if (!type) {
            return res.status(400).json({
                success: false,
                error: "idSender and type are required"
            });
        }

        const notificationData = {
            idSender,
            idReceiver,
            title: title || getDefaultTitle(type),
            message: message || getDefaultMessage(type, metadata),
            type,
            metadata
        };

        await handleCreateNotification(notificationData);

        res.status(200).json({
            success: true,
            type,
            receiver: idReceiver || 'multiple'
        });

    } catch (error) {
        console.error(`Notification error [${req.body.type}]:`, error);
        res.status(500).json({
            success: false,
            error: error.message,
            type: req.body?.type
        });
    }
});

router.get('/get-notifications', async (req, res) => {

    const userId = req.headers['x-user-id']

    try {

        const notificationsUser = await NotificationModel.find({ idReceiver: userId }).sort({ createdAt: -1 });

        const authServiceBaseUrl = await discoverAuthService();

        const enrichedNotifications = await Promise.all(
            notificationsUser.map(async (notif) => {
                if (notif.idSender) {
                    try {

                        const { data } = await axios.get(
                            `${authServiceBaseUrl}/get_user_byId/${notif.idSender}`,
                            { timeout: 5000 }
                        )

                        return {
                            ...notif.toObject(),
                            user: {
                                userId: data.user.id,
                                userName: data.user.userName,
                                familyName: data.user.familyName,
                                givenName: data.user.givenName,
                                userImg: data.user.uerImg,
                                role: data.user.role
                            } || null
                        };

                    } catch (error) {
                        console.error("Failed to fetch user:", error.message);

                        return {
                            ...notif.toObject(),
                            user: null
                        };
                    }
                }
                //no idSender
                return {
                    ...notif.toObject(),
                    user: "no sender"
                };

            })
        )

        res.status(200).json(enrichedNotifications)

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message });
    }
})

router.put('/mark-as-read/:id', async (req, res) => {

    const idNotification = req.params.id;

    try {

        const notification = await NotificationModel.findById(idNotification);

        if (!notification) {
            return res.status(404).json({ error: "no notification with such id" })
        }

        notification.isRead = true;

        await notification.save();

        res.status(201).json(notification)

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message });
    }

})

router.delete('/delete-notification/:id', async (req, res) => {

    const idNotification = req.params.id;

    try {

        const notification = await NotificationModel.findById(idNotification);

        if (!notification) {
            return res.status(404).json({ error: "no notification with such id" })
        }

        if (notification.idReceiver != req.headers["x-user-id"])
            return res.status(403).json({ error: "Not allowed" });

        await notification.deleteOne()

        res.json({ message: "notification deleted" })

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
})

router.put('/mark-all-as-read', async (req, res) => {

    const userId = req.headers['x-user-id'];

    try {

        const result = await NotificationModel.updateMany(
            { idReceiver: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            message: "All notifications marked as read",
            updatedCount: result.modifiedCount
        });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message });
    }

})

module.exports = router;