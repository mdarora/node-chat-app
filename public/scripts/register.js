
document.getElementById('reg-form').addEventListener('submit', (event)=>{
    event.preventDefault();
    const name = event.target[0].value;
    const email = event.target[1].value;
    const password = event.target[2].value;
    const cpassword = event.target[3].value;

    const resText = document.getElementById('resText');

    if(!name || !email || !password || !cpassword){
        return resText.textContent = 'All fields arre required.';
    } else if (password !== cpassword){
        return resText.textContent = 'Both passwords must be same.';
    } else if (password.length < 6){
        return resText.textContent = 'Password should be atleast 6 character long.';
    }
    event.target.submit();
});


document.getElementById('show-pass').addEventListener('click', (event)=>{
    if(event.target.checked){
        document.getElementById('register-password').setAttribute('type', 'text');
        document.getElementById('register-Cpassword').setAttribute('type', 'text');
    } else {
        document.getElementById('register-password').setAttribute('type', 'password');
        document.getElementById('register-Cpassword').setAttribute('type', 'password');
    }
});