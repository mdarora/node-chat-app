const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const authLogin = require('../middleware/authLogin');


const User = require('../db/models/userSchema');



const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : process.env.MAIL,
        pass : process.env.MAIL_PASS
    }
});



//////////////////////////-Global variables-///////////////////////////////////

let regUser = {}
let generatedOTP;
let loginPageResponse = '';
let resetMethod = 'post';
let resetResponse = '';
let generatedresetOTP = 0;
let resetId;

//////////////////////////-Functions-///////////////////////////////////

const sendOtpViaMail = (email, subject, text) =>{
    const sendOTP = new Promise((resolve, reject) =>{
        const otp = Math.floor(Math.random() * 1000000);
        const mailOptions = {
            from : process.env.MAIL,
            to : email,
            subject : subject,
            text : `${text}\n${otp}`
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                reject({error : 'OTP sending failed'});
            } else {
                console.log(info.response);
                resolve({otp});
            }
        });
    });

    return sendOTP
}

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

    regUser = {};
    generatedOTP = 0;
    const {name, email, password, cpassword} = req.body;

    if (!name || !email || !password || !cpassword) {
        return res.render('register', {error : "All fields are required"});
    } else if (password.length < 6){
        return res.render('register', {error : "Password should be atleast 6 characters long."});
    } else if(name.length > 30 || name.length < 3){
        return res.render('register', {error : "Name must be in between 3-30 characters"});
    } else if (password !== cpassword){
        return res.render('register', {error : "Both passwords must be same"});
    }

    try {
        const findByEmail = await User.findOne({email});
        if (findByEmail){
            return res.render('register', {error : "Email already registered"});
        }
        

        regUser = {name, email, password}
        generatedOTP = await sendOtpViaMail(email, 'OTP Verification code for Chat-app', 'Your One Time Password (OTP) for Chat-app is');

        if (generatedOTP.error){
            return res.render('register', {error : "Something went wrong!"});
        } else {
            generatedOTP = generatedOTP.otp;
            res.redirect('/otpverification');
        }

    } catch (error) {
        console.log(error);
        return res.render('register', {error : "Something went wrong!"});
    }
});


router.get('/otpverification', authLogin, (req, res) =>{
    if(!generatedOTP || generatedOTP === 0){
        return res.redirect('/login');
    }
    res.render('otpVerification', {response: `OTP has been sent to your E-mail. (Please check SPAM too.)`});
});

router.post('/otpverification', authLogin, async (req, res) => {
    if (parseInt(req.body.otp) !== generatedOTP) {
        return res.render('otpVerification', {response: 'Invalid OTP'});
    }

    try {
        const hashedPassword = await bcrypt.hash(regUser.password, 12);
        const newUser = new User({
            name : regUser.name,
            email : regUser.email,
            password : hashedPassword
        });

        const result = await newUser.save();
        if (!result._id){
            console.log(result);
            res.render('otpVerification', {response: 'Something went wrong!'});
        }
        regUser = {};
        generatedOTP = 0;
        loginPageResponse = 'Registerated successfully';
        // Todo : send mail of Registeration
        return res.redirect('/login');

    } catch (error) {
        console.log(error);
        res.render('otpVerification', {response: 'Something went wrong!'});
    }
});


router.get('/reset-password', authLogin, (req, res) =>{
    resetMethod = 'post';
    resetResponse = '';
    res.render('resetPassword', {resetMethod, resetResponse});
});


router.post('/reset-password', authLogin, async (req, res) => {
    const email = req.body.email;
    if (!email) {
        resetResponse = 'Please enter your E-mail.';
        return res.render('resetPassword', {resetMethod, resetResponse});
    }

    try {
        const findByEmail = await User.findOne({email: email}, {_id : 1});
        if (!findByEmail){
            resetResponse = 'Invalid E-mail.';
            return res.render('resetPassword', {resetMethod, resetResponse});
        }
        generatedresetOTP = await sendOtpViaMail(email,'Reset Password request for Chat-app account', 'Your One Time Password (OTP) to reset your account\'s password is');

        if (generatedresetOTP.error){
            resetResponse = 'Something went wrong!';
            return res.render('resetPassword', {resetMethod, resetResponse});
        } else {
            generatedresetOTP = generatedresetOTP.otp;
            resetId = findByEmail._id;
        }
        resetResponse = 'OTP sent to your E-mail';
        resetMethod = 'put';
        return res.render('resetPassword', {resetMethod, resetResponse});

    } catch (error) {
        console.log(error);
        resetResponse = 'Something went wrong!';
        return res.render('resetPassword', {resetMethod, resetResponse});
    }
});

router.post('/verify-reset-otp', authLogin, async (req, res) => {
    if(generatedresetOTP == 0 || !resetId){
        return res.redirect('/login');
    }

    const enteredResetOtp = req.body.enteredResetOtp;
    const newPassword = req.body.newPassword;
    const newCPassword = req.body.newCPassword;

    if (!enteredResetOtp || !newPassword || !newCPassword){
        resetResponse = 'All fields are required';
        return res.render('resetPassword', {resetMethod, resetResponse});
    } else if (newPassword !== newCPassword){
        resetResponse = 'Both passwords must be same';
        return res.render('resetPassword', {resetMethod, resetResponse});
    } else if (parseInt(enteredResetOtp) !== generatedresetOTP){
        resetResponse = 'Invalid OTP';
        return res.render('resetPassword', {resetMethod, resetResponse});
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const updatePass = await User.updateOne({_id:resetId}, {
            $set: {
                password: hashedPassword
            }
        });
        if (updatePass.ok){
            generatedresetOTP = 0;
            resetId = '';
            resetMethod = 'post';
            resetResponse = '';
            loginPageResponse = 'Password reset successful';
            // Todo : send mail of password reseting
            return res.redirect('/login');
        } else {
            console.log(updatePass);
            resetResponse = 'Something went wrong!';
            return res.render('resetPassword', {resetMethod, resetResponse});
        }
    } catch (error) {
        console.log(error);
        resetResponse = 'Something went wrong!';
        return res.render('resetPassword', {resetMethod, resetResponse});
    }
});


router.get("/logout", (req, res) => {
    res.clearCookie("jwtoken");
    res.redirect('/login');
});

module.exports = router;