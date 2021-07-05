const jwt = require('jsonwebtoken');

const authLogin = (req, res, next) =>{
    const jwtoken = req.cookies.jwtoken;
    if (!jwtoken){
        return next();
    }

    try {
        const verifyJwtoken = jwt.verify(jwtoken, process.env.SECRET_KEY);
        req.id = verifyJwtoken._id;
        req.name = verifyJwtoken.name;
        return res.redirect('/');
        
        
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return next();
        } else {
            console.log(error);
        }
        return next();
    }
}

module.exports = authLogin;