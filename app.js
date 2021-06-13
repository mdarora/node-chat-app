const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

dotenv.config({path:".env"});
const app = express();


const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

global.socketio = io;

app.use(express.static(__dirname + '/public/'));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());


app.use(require("./routes/auth"));
app.use(require("./routes/router"));


require('./db/dbConn');
server.listen(process.env.PORT, process.env.HOSTNAME,  ()=>{
    console.log(`Listening on port : ${process.env.PORT}`); 
});

