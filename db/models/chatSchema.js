const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    member1: {
        name:{
            type: String,
            required: true
        },
        id:{
            type: String,
            required: true
        }
    },
    member2: {
        name:{
            type: String,
            required: true
        },
        id:{
            type: String,
            required: true
        }
    },
    lastMessage: {
        type: String,
        default: 'No messages yet.'
    }
}, {timestamps: true});

const Chat = new mongoose.model('Chat', chatSchema);

module.exports = Chat;