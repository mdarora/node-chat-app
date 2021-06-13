const socket = io();
const messageResponse = document.getElementById('messageResponse');
const messagesList = document.getElementById('messages-list');

const chatId = location.pathname.substring(6);

socket.on('connect', ()=>{
    socket.emit('join', chatId);
});

socket.on('receive', (message)=>{

    messageResponse.hidden = true;
    let messageTime = new Date(message.messageTime);
    messageTime = messageTime.toLocaleTimeString();

    messagesList.innerHTML += `<li class='other-user'>
        <p class='conv-message'>${message.body}<br/> 
            <span class='message-time'>${messageTime}</span>
        </p>
    </li>`;
    
});

document.getElementById('message-form').addEventListener('submit', (e)=>{
    e.preventDefault();

    const message = e.target[0].value;
    if(message){
        socket.emit('send', {chatId, body: message});
        e.target.reset();
    
        const date = new Date()
        const messageTime = date.toLocaleTimeString();
        messageResponse.hidden = true;
        messagesList.innerHTML += `<li class='log-user'>
            <p class='conv-message'>${message}<br/> 
                <span class='message-time'>${messageTime}</span>
            </p>
        </li>`;
        
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
        } else if(result.messages){
            messageResponse.hidden = true;
            result.messages.forEach(message => {
                let messageTime = new Date(message.messageTime);
                messageTime = messageTime.toLocaleTimeString();

                if(result.loggedUserId === message.from.id){
                    messagesList.innerHTML += `<li class='log-user'>
                        <p class='conv-message'>${message.body}<br/> 
                            <span class='message-time'>${messageTime}</span>
                        </p>
                    </li>`;
                } else {
                    messagesList.innerHTML += `<li class='other-user'>
                        <p class='conv-message'>${message.body}<br/> 
                            <span class='message-time'>${messageTime}</span>
                        </p>
                    </li>`;
                }
            });

            document.querySelector('#messages-list > li:last-child').scrollIntoView();
        }

        
        
    } catch (error) {
        console.log(error);
        
    }
};

window.addEventListener('load', getMessages);