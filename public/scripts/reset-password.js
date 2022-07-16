// document.getElementById('reset-pass-form').addEventListener('submit', (event)=>{
//     event.preventDefault();
//     const otp = event.target[0].value;
//     const password = event.target[1].value;
//     const cpassword = event.target[2].value;

//     const resText = document.getElementById('passResText');

//     if(!otp || !password || !cpassword ){
//         resText.classList.add('text-danger');
//         return resText.textContent = 'All fields are required.';
//     } else if (password !== cpassword){
//         resText.classList.add('text-danger');
//         return resText.textContent = 'Both passwords must be same.';
//     } else if (password.length < 6){
//         resText.classList.add('text-danger');
//         return resText.textContent = 'Password should be atleast 6 character long.';
//     }
//     resText.classList.remove('text-danger');
//     event.target.submit();
// });

if(document.getElementById('show-pass')){
    document.getElementById('show-pass').addEventListener('click', (event)=>{
        if(event.target.checked){
            document.getElementById('new-password').setAttribute('type', 'text');
            document.getElementById('new-cpassword').setAttribute('type', 'text');
        } else {
            document.getElementById('new-password').setAttribute('type', 'password');
            document.getElementById('new-cpassword').setAttribute('type', 'password');
        }
    });
};