const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  idSender: {
    type: Number,
    required: false
  },
  idReceiver: {
    type: Number,
    required: function() {
      return !this.isBroadcast;
    }
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'REQUEST_LINK_PARENT_CHILD',
      'NEW_POST', 
      'NEW_LIKE',
      'NEW_COMMENT',
      'NEW_FOLLOW',
      'NEW_REPLY',
      'URGENT_NOTIFICATION',
      'NEW_MESSAGE',
      'NEW_RECOMMENDATION',
      'SYSTEM',
    ],
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isBroadcast: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const NotificationModel = mongoose.model('Notification', NotificationSchema);

module.exports = NotificationModel;