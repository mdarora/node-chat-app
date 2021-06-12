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

                const {member1, member2, lastMessage, _id} = element;
                let lastmessageTime = new Date(lastMessage.messageTime).toLocaleTimeString();

                let lastMsg;
                if(!lastMessage.message){
                    lastMsg = 'No messages yet.';
                } else {
                    lastMsg = lastMessage.message;
                }

                if(result.loggedUserId === member1.id){
                    return {_id, lastMsg, lastmessageTime, name : member2.name}
                } else {
                    return {_id, lastMsg, lastmessageTime, name : member1.name}
                }
            });

            spinner.hidden = true;

            allChats.forEach(element => {
                chatList.innerHTML += `
                    <li class="chats-list-item" >
                         <a href="/chat/${element._id}" >
                           <div class="Chat-avtaar" >
                                 <figure>
                                     <i class="fas fa-user-circle"></i>
                                 </figure>
                           </div>
                           <div class="chat-content  text-truncate" >
                                <h5 class='chat-name text-truncate' >
                                        ${element.name}
                                        <span  class='last-message-time'>${element.lastmessageTime}</span>
                                </h5>
                                <p class="chat-last-msg text-truncate" >
                                        ${element.lastMsg}
                                </p>
                           </div>
                         </a>
                     </li>
                `
            });
            
            
        }

    } catch (error) {
        spinner.hidden = true;
        console.log('catch : ',error);
        resArea.hidden = false;
        resText.textContent = 'Something went wrong!';
    }
}

window.addEventListener('load', getChats);