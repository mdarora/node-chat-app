const getChats = async () =>{
    const resText = document.getElementById('res-text');
    const resArea = document.getElementById('res-area');
    const spinner = document.getElementById('spinner');
    const chatList = document.getElementById('chat-list');


    try {
        spinner.hidden = false;
        const res = await fetch('/getChats');
        const result = await res.json();

        if(result.loginError){
            spinner.hidden = true;
            resArea.hidden = true;
            return window.location.href = '/login';
        }
        else if(result.error){
            spinner.hidden = true;
            resArea.hidden = false;
            resText.textContent = result.error;
        }
        else if (result.message) {
            spinner.hidden = true;
            resArea.hidden = true;
            
            const allChats = result.message.map((element, index) =>{

                const {member1, member2, lastMessage, updatedAt, _id} = element;

                if(result.loggedUserId === member1.id){
                    return {_id, lastMessage, updatedAt, name : member2.name}
                } else {
                    return {_id, lastMessage, updatedAt, name : member1.name}
                }
            });

            spinner.hidden = true;

            allChats.forEach(element => {
                chatList.innerHTML += `
                    <li class="chats-list-item" >
                         <a id="${element._id}" href="/chat/${element._id}" >
                           <div class="Chat-avtaar" >
                                 <figure>
                                     <i class="fas fa-user-circle"></i>
                                 </figure>
                           </div>
                           <div class="chat-content  text-truncate" >
                                <h5 class='chat-name text-truncate' >
                                        ${element.name}
                                        <span datetime='${element.updatedAt}' class='last-message-time'>${element.updatedAt}</span>
                                </h5>
                                <p class="chat-last-msg text-truncate" >
                                        ${element.lastMessage}
                                </p>
                           </div>
                         </a>
                     </li>
                `
            });
            timeago.render(document.querySelectorAll('.last-message-time'));
            
        }

    } catch (error) {
        spinner.hidden = true;
        console.log('catch : ',error);
        resArea.hidden = false;
        resText.textContent = 'Something went wrong!';
    }
}

window.addEventListener('load', getChats);

document.getElementById('searchUserForm').addEventListener('submit', async (e) =>{
    e.preventDefault();
    const queryName = e.target[0].value;
    const newSearchRes = document.getElementById('new-search-res');
    const userListSpinner = document.getElementById('userListSpinner');
    const newUserList = document.getElementById('new-users-list');


    try {
        newUserList.innerHTML = '';
        userListSpinner.hidden = false;
        newSearchRes.hidden = true;
        const res = await fetch('/searchUsers', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({queryName})
        });
        const result = await res.json();
    
        if(result.error){
            userListSpinner.hidden = true;
            newSearchRes.hidden = false;
            newSearchRes.textContent = result.error;
            newSearchRes.classList.add('text-danger');
        } else {
            const allusers = result.map((element, index)=>{
                const {name, _id, email} = element;
               return {name, _id, email}
            });
            userListSpinner.hidden = true;
            newSearchRes.hidden = true;

            allusers.forEach(element => {
                newUserList.innerHTML += `
                    <li class="chats-list-item" >
                         <a href="/addChat/${element._id}" >
                           <div class="Chat-avtaar" >
                                 <figure>
                                     <i class="fas fa-user-circle"></i>
                                 </figure>
                           </div>
                           <div class="chat-content  text-truncate" >
                                <h5 class='chat-name text-truncate' >
                                        ${element.name}
                                </h5>
                                <p class="chat-last-msg text-truncate" >
                                        ${element.email}
                                </p>
                           </div>
                         </a>
                     </li>
                `
            });
        }
        
    } catch (error) {
        console.log(error);
        newSearchRes.hidden = false;
        newSearchRes.textContent = 'Something went wrong!';
        userListSpinner.hidden = true;
    }
});
    

document.getElementById('chat-search').addEventListener('input', (e)=>{
    const queryChat = e.target.value;

    // Declare variables
    let filter, ul, li, name, i, txtValue;
    filter = queryChat.toUpperCase();
    ul = document.getElementById("chat-list");
    li = ul.getElementsByTagName('li');

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        name = li[i].getElementsByTagName("h5")[0];
        txtValue = name.textContent || name.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
        li[i].hidden = false;
        } else {
        li[i].hidden = true;
        }
    }
    
});

document.getElementById("more").addEventListener('click', ()=>{
    document.getElementById("more-list").hidden = !document.getElementById("more-list").hidden;
});



// **************************************************************************************************

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

    updateChatList(chatId, message.body, message.messageTime);

    document.querySelector('#messages-list > li:last-child').scrollIntoView();
    timeago.render(document.querySelectorAll('.message-time'));
    
});

if (document.getElementById('message-form')) {

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

            
            updateChatList(chatId, message, date);

            document.querySelector('#messages-list > li:last-child').scrollIntoView();
            timeago.render(document.querySelectorAll('.message-time'));
        }
        
    });
}


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


const updateChatList = (id, lastMessage, date) => {
    const currentChat = document.getElementById(id);
    const chatList = document.getElementById('chat-list');

    currentChat.querySelector("p").textContent = lastMessage;
    currentChat.querySelector("span").setAttribute("datetime", date);
    timeago.render(document.querySelectorAll('.last-message-time'));

    const liEl = currentChat.parentElement;
    currentChat.parentElement.remove();
    chatList.insertBefore(liEl, chatList.childNodes[0]);
}

