
document.getElementById('login-form').addEventListener('submit', (event)=>{
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;

    const resText = document.getElementById('resText');

    if(!email || !password){
        return resText.textContent = 'All fields arre required.';
    }
    event.target.submit();
});


document.getElementById('show-pass').addEventListener('click', (event)=>{
    if(event.target.checked){
        document.getElementById('login-password').setAttribute('type', 'text');
    } else {
        document.getElementById('login-password').setAttribute('type', 'password');
    }
});