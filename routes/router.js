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

const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : process.env.MAIL,
        pass : process.env.MAIL_PASS
    }
});




const io = global.socketio;

    
    
///////////////////////////-Routes-/////////////////////////////////////
router.get('/', loginAuth, (req, res) =>{
    res.render('index');
});

router.get('/chat', loginAuth, (req, res) =>{
    res.render('conversation');
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
        ]}).sort({"lastMessage.messageTime": -1});
            
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

router.post('/addChat', loginAuth, async (req,res)=>{
    const loggedUserId = req.id;
    const loggedUserName = req.name;
    const otherUserId = req.body.otherUserId;
    
    if ( !loggedUserId || !otherUserId){
        return res.status(422).json({error: 'Invalid user id'});
    } else if (loggedUserId === otherUserId){
        return res.status(422).json({error: 'Invalid request'});
    }

    try {
        const findById = await User.findOne({_id: otherUserId});
        
        if(!findById){
            return res.status(404).json({error: 'User not found'});
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
            return res.status(422).json({error: 'Chat already exist'});
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
        return res.status(201).json({message: `${findById.name} added to your chats.`});
        

    } catch (error) {
        console.log(error.name , error.message);
        return res.status(500).json({error: 'Something went wrong!'});
    }

});


router.post('/getMessages', loginAuth, async (req, res) =>{
    const loggedUserId = req.id;
    // const loggedUserName = req.name;
    const chatId = req.body.chatId;
    let chatName;

    io.on('connection', socket =>{
        socket.removeAllListeners();
        console.log('Connection found', socket.id);
        
        socket.on('join', (roomId) =>{
            const user = addUser(socket.id, roomId);
            
            socket.join(user.room);
        });

        socket.on('send', async (message)=>{
            const user = getUser(socket.id);

            const newMessage = new Message({
                chatId: message.chatId,
                from: message.from,
                body: message.body
            });
            await newMessage.save();

            await Chat.updateOne({lastMessage:{$set: {message: newMessage.body}}});

            const roomusers = getUsersInRoom(user.room);
            if(roomusers.length === 2){
                const otherUser = roomusers[0].id !==  user.id ? roomusers[0].id : roomusers[1].id;
                socket.to(otherUser).emit('receive', message);
            }
            
        });

        socket.on('disconnect', () =>{
            console.log('client disconnected', socket.id);
            socket.removeAllListeners();
            removeUser(socket.id);
        });
    });
    
    try {
        const FindChatById = await Chat.findOne({_id: chatId});
        if (FindChatById.member1.id === loggedUserId){
            chatName = FindChatById.member2.name;
        } else{
            chatName = FindChatById.member1.name;
        }
        
        const messages = await Message.find({chatId});
        if(!messages || messages.length === 0){
            res.status(404).json({error: "No messages yet.", chatName, loggedUserId});
        } else{
            res.status(200).json({messages, chatName, loggedUserId});
        }
    } catch (error) {
        console.log(error);
        res.status.json({error: 'Something went wrong!', chatName, loggedUserId});
    }
});


module.exports = router;