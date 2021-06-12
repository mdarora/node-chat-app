const jwt = require('jsonwebtoken');

const loginAuth = (req, res, next) =>{
    const jwtoken = req.cookies.jwtoken;
    if (!jwtoken){
        res.status(422).json({loginError: 'Login first'});
        return res.redirect('/login');
    }

    try {
        const verifyJwtoken = jwt.verify(jwtoken, process.env.SECRET_KEY);
        req.id = verifyJwtoken._id;
        req.name = verifyJwtoken.name;
        return next();
        
    } catch (error) {
        console.log(error);
        return res.redirect('/login');
    }
}

module.exports = loginAuth;