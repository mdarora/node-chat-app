const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true
    },
    from: {
        name:{
            type: String,
        },
        id: {
            type: String,
            required: true
        }
    },
    body: {
        type: String,
        required: true
    },
    isDeleted:{
        type: Boolean,
        default: false
    },
    messageTime: {
        type: Date,
        default: Date.now
    }
});

const Message = new mongoose.model("Message", messageSchema);

module.exports = Message;