const socket = io();
const messageResponse = document.getElementById('messageResponse');
const messagesList = document.getElementById('messages-list');

let loggedUserId;

const msgTune = document.getElementById('msg-tune');

const chatId = location.pathname.substring(6);

socket.on('connect', ()=>{
    socket.emit('join', chatId);
});

socket.on('receive', (message)=>{

    messageResponse.hidden = true;
    msgTune.play();
    let date = new Date(message.messageTime);
    const messageTime = timeago.format(date);

    messagesList.innerHTML += `<li class='other-user'>
        <p class='conv-message'>${message.body}<br/> 
            <span datetime='${message.messageTime}' class='message-time'>${messageTime}</span>
        </p>
    </li>`;
    document.querySelector('#messages-list > li:last-child').scrollIntoView();
    timeago.render(document.querySelectorAll('.message-time'));
    
});

document.getElementById('message-form').addEventListener('submit', (e)=>{
    e.preventDefault();

    const message = e.target[0].value;
    if(message){
        socket.emit('send', {chatId, body: message, loggedUserId});
        e.target.reset();
    
        const date = new Date()
        const messageTime = timeago.format(date);
        messageResponse.hidden = true;
        messagesList.innerHTML += `<li class='log-user'>
            <p class='conv-message'>${message}<br/> 
                <span datetime='${date}' class='message-time'>${messageTime}</span>
            </p>
        </li>`;
        document.querySelector('#messages-list > li:last-child').scrollIntoView();
        timeago.render(document.querySelectorAll('.message-time'));
    }
    
});


const getMessages = async () =>{

    try {
        const res = await fetch(location.pathname, {
            method: 'POST',
            credentials: 'include'
        });
        const result = await res.json();

        if(result.error){
            messageResponse.textContent = result.error;
            messageResponse.hidden = false;
            loggedUserId = result.loggedUserId;
        } else if(result.messages){
            loggedUserId = result.loggedUserId;
            messageResponse.hidden = true;
            result.messages.forEach(message => {
                let messageTime = timeago.format(new Date(message.messageTime));

                if(result.loggedUserId === message.from.id){
                    messagesList.innerHTML += `<li class='log-user'>
                        <p class='conv-message'>${message.body}<br/> 
                            <span datetime='${message.messageTime}' class='message-time'>${messageTime}</span>
                        </p>
                    </li>`;
                } else {
                    messagesList.innerHTML += `<li class='other-user'>
                        <p class='conv-message'>${message.body}<br/> 
                            <span datetime='${message.messageTime}' class='message-time'>${messageTime}</span>
                        </p>
                    </li>`;
                }
            });

            document.querySelector('#messages-list > li:last-child').scrollIntoView();
        }
        
    } catch (error) {
        console.log(error);
        
    }
    timeago.render(document.querySelectorAll('.message-time'));
};




window.addEventListener('load', getMessages);