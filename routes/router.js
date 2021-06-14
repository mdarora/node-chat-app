const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const loginAuth = require('../middleware/loginAuth');

const User = require('../db/models/userSchema');
const Chat = require('../db/models/chatSchema');
const Message = require('../db/models/messageSchema');

const { addUser, removeUser, getUser, getUsersInRoom } = require('../middleware/users');


const io = global.socketio;

let indexResponse = '';
    
///////////////////////////-Routes-/////////////////////////////////////
router.get('/', loginAuth, (req, res) =>{
    res.render('index', {indexResponse: indexResponse});
});

router.get("/getChats", loginAuth, async  (req, res)=>{
    
    try {
        const loggedUserId = req.id;
        const loggedUserName = req.name;
        const getChats = await Chat.find({$or: [
            {"member1.id": {
                $eq : loggedUserId
            }},
            {"member2.id": {
                $eq : loggedUserId
            }}
        ]}).sort({updatedAt: -1});
            
        if(!getChats){
            return res.status(404).json({error: 'No chats found'});
        } else if(getChats.length === 0){
            return res.status(404).json({error: 'No chats found'});
        }
        res.status(200).json({message : getChats, loggedUserId, loggedUserName});

    } catch (error) {
        console.log(error.name, error.message);
        return res.status(500).json({error: 'Something went wrong!'});
    }

});

router.post('/searchUsers', loginAuth, async (req, res) =>{
    const loggedUserId = req.id;
    const queryName = req.body.queryName;

    if(!queryName){
        return res.status(422).json({error:'Invalid input'});
    }

    try {
        const findUsersByName = await User.find({
            name: {
                $regex: new RegExp(queryName, 'i')
            },
            _id:{
                $ne: loggedUserId
            }
        },{
            password: 0
        });

        if(!findUsersByName || findUsersByName.length === 0){
            return res.status(404).json({error: 'No user found'});
        }

        res.status(200).json(findUsersByName);

    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Something went wrong!'});
    }
});

router.get('/addChat/:id', loginAuth, async (req,res)=>{
    const loggedUserId = req.id;
    const loggedUserName = req.name;
    const otherUserId = req.params.id;
    
    if ( !loggedUserId || !otherUserId){
        indexResponse = 'Invalid request.';
        return res.redirect('/');
    } else if (loggedUserId === otherUserId){
        indexResponse = 'Invalid request.';
        return res.redirect('/');
    }

    try {
        const findById = await User.findOne({_id: otherUserId});
        
        if(!findById){
            indexResponse = 'User not found.';
            return res.redirect('/');
        };

        const findChatByMembers = await Chat.findOne({$and: [
            {"member1.id": {
                $in : [loggedUserId, otherUserId]
            }},
            {"member2.id": {
                $in : [otherUserId, loggedUserId]
            }}
        ]});
        
        if(findChatByMembers){
            indexResponse = 'Chat already exist.';
            return res.redirect('/');
        }

        const newChat = new Chat({
            member1: {
                name:loggedUserName,
                id:loggedUserId
            },
            member2: {
                name:findById.name,
                id:findById._id
            },
        });
        const saveChat = await newChat.save();
        indexResponse = '';
        return res.redirect('/');
        

    } catch (error) {
        console.log(error.name , error.message);
        indexResponse = 'Something went wrong!';
        return res.redirect('/');
    }

});

router.get('/chat/:id', loginAuth, async (req, res) =>{
    loggedUserId = req.id;
    loggedUserName = req.name;
    const chatId = req.params.id;
    let chatName;

    
    try {
        const FindChatById = await Chat.findOne({_id: chatId});
        if (FindChatById.member1.id === loggedUserId){
            chatName = FindChatById.member2.name;
        } else{
            chatName = FindChatById.member1.name;
        }
        
        return res.render('conversation', {chatName});

    } catch (error) {
        console.log(error);
        return res.render('conversation', {chatName});
    }
});


router.post('/chat/:id', loginAuth, async (req, res)=>{

    const chatId = req.params.id;
    try {
        const messages = await Message.find({chatId});
        if(!messages || messages.length === 0){
            return res.status(404).json({error: 'No messages yet.', loggedUserId});
        }
        
        return res.status(200).json({messages, loggedUserId});

    } catch (error) {
        console.log(error);
        return res.status(200).json({messages, loggedUserId});
    }
    

});


/////////////////////////////////////////////////////////////

io.on('connection', socket =>{
    
    
    socket.on('join', (roomId) =>{
        const user = addUser(socket.id, roomId);
        socket.join(user.room);
    });

    socket.on('send', async (message)=>{
        const user = getUser(socket.id);

        try {
            const newMessage = new Message({
                chatId: message.chatId,
                from: {id: message.loggedUserId},
                body: message.body
            });
            const savedMsg = await newMessage.save();
            
            const chatUpdate = await Chat.updateOne({_id: savedMsg.chatId},{$set: {lastMessage: savedMsg.body}});
            
            const roomusers = getUsersInRoom(user.room);
            if(roomusers.length === 2){
                const otherUser = roomusers[0].id !==  user.id ? roomusers[0].id : roomusers[1].id;
                socket.to(otherUser).emit('receive', savedMsg);
            }
        } catch (error) {
            console.log(error.name, error.message)
        }
        
    });

    socket.on('disconnect', () =>{
        removeUser(socket.id);
    });
});



module.exports = router;