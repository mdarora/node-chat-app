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
            console.log(result.message);
            
            const allChats = result.message.map((element, index) =>{

                const {member1, member2, lastMessage, updatedAt, _id} = element;
                let updatedTime = new Date(updatedAt).toLocaleTimeString();

                if(result.loggedUserId === member1.id){
                    return {_id, lastMessage, updatedTime, name : member2.name}
                } else {
                    return {_id, lastMessage, updatedTime, name : member1.name}
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
                                        <span  class='last-message-time'>${element.updatedTime}</span>
                                </h5>
                                <p class="chat-last-msg text-truncate" >
                                        ${element.lastMessage}
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
    
    



window.addEventListener('load', getChats);