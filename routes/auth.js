const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authLogin = require('../middleware/authLogin');


const User = require('../db/models/userSchema');



//////////////////////////-Global variables-///////////////////////////////////

let loginPageResponse = '';

///////////////////////////-Routes-/////////////////////////////////////
router.get('/login', authLogin, (req, res)=>{
    res.render('login', {loginPageResponse: loginPageResponse});
});

router.post('/login', authLogin, async (req, res) =>{
    const {email, password} = req.body;
    if (!email || !password){
        return res.render('login', {loginPageResponse: 'All fields are required.'});
    }

    try {
        
        const findByEmail = await User.findOne({email});
        if (!findByEmail){
            return res.render('login', {loginPageResponse: 'Invalid details'});
        }

        const matchPass = await bcrypt.compare(password, findByEmail.password);
        if(!matchPass){
            return res.render('login', {loginPageResponse: 'Invalid details'});
        }

        const token = jwt.sign({_id : findByEmail._id, name: findByEmail.name}, process.env.SECRET_KEY);
        res.cookie('jwtoken', token);
        loginPageResponse = '';
        return res.redirect('/');

    } catch (error) {
        console.log(error);
        return res.render('login', {loginPageResponse: 'Something went wrong!'});
    }
});


router.get('/register', authLogin,  (req, res) =>{
    res.render('register', {error: ''});
});

router.post("/register", authLogin,  async (req, res)=>{

    const {name, email, password, cpassword, secureQuestion, secureAnswer} = req.body;

    if (!name || !email || !password || !cpassword || !secureQuestion || !secureAnswer) {
        return res.render('register', {error : "All fields are required"});
    } else if (password.length < 6){
        return res.render('register', {error : "Password should be atleast 6 characters long."});
    } else if(name.length > 30 || name.length < 3){
        return res.render('register', {error : "Name must be in between 3-30 characters"});
    } else if (password !== cpassword){
        return res.render('register', {error : "Both passwords must be same"});
    } else if(secureAnswer.length < 5){
        return res.render('register', {error : "At least 5 characters for security answer are required!"});
    }

    try {
        const findByEmail = await User.findOne({email});
        if (findByEmail){
            return res.render('register', {error : "Email already registered"});
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const regUser = {
            name,
            email,
            password : hashedPassword,
            secureQuestion,
            secureAnswer
        }
        const newUser = new User(regUser);

        const result = await newUser.save();
        if (!result._id){
            console.log(result);
            res.render('register', {response: 'Something went wrong!'});
        }
        loginPageResponse = 'Registerated successfully';
        return res.redirect('/login');

    } catch (error) {
        console.log(error);
        return res.render('register', {error : "Something went wrong!"});
    }
});
 
router.get('/reset-password', authLogin, (req, res) =>{
    res.render('resetPassword', {resetResponse: '', secureQuestion:  '', email: ''});
});


router.post('/reset-password', authLogin, async (req, res) => {
    let resetResponse = '';
    const {email, newPassword, newCPassword, secureQuestion, secureAnswer} = req.body;

    if (!email && !secureAnswer){
        resetResponse = 'Enter Email';
        return res.render('resetPassword', {resetResponse});
    } 
    

    try {
        const findByEmail = await User.findOne({email: email}, {_id : 1, secureQuestion : 1, secureAnswer : 1});
        if (!findByEmail){
            resetResponse = 'Invalid E-mail.';
            return res.render('resetPassword', {resetResponse, secureQuestion: '', email: ''});
        } else if(!secureAnswer) {
            resetResponse = 'Please enter your security answer';
            return res.render('resetPassword', {resetResponse, secureQuestion: findByEmail.secureQuestion, email});
        }

        if(findByEmail.secureAnswer !== secureAnswer){
            resetResponse = 'Incorrect Answer';
            return res.render('resetPassword', {resetResponse, secureQuestion: findByEmail.secureQuestion, email});
        } else if (newPassword !== newCPassword){
            resetResponse = 'Both passwords must be same';
            return res.render('resetPassword', {resetResponse, secureQuestion: findByEmail.secureQuestion, email});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const updatePass = await User.updateOne({_id:findByEmail._id}, {
            $set: {
                password: hashedPassword
            }
        });
        if (updatePass.ok){
            resetResponse = '';
            loginPageResponse = 'Password reset successful';
            return res.redirect('/login');
        } else {
            console.log(updatePass);
            resetResponse = 'Something went wrong!';
            return res.render('resetPassword', {resetResponse});
        }

    } catch (error) {
        console.log(error);
        resetResponse = 'Something went wrong!';
        return res.render('resetPassword', {resetResponse});
    }
});

router.get("/logout", (req, res) => {
    res.clearCookie("jwtoken");
    res.redirect('/login');
});

module.exports = router;