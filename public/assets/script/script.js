const form_login = document.getElementById("form_login");
const form_signup = document.getElementById("form_signup");

const log_to_signup = document.getElementById("log_to_signup");
const signup_to_log = document.getElementById("signup_to_log");

log_to_signup.addEventListener("click", () => {
    form_login.classList.add("hidden");
    form_signup.classList.remove("hidden");
})


signup_to_log.addEventListener("click", () => {
    form_signup.classList.add("hidden");
    form_login.classList.remove("hidden");
})





const register = () =>
    fetch("http://localhost:3000/register", {
        method: "POST",
        body: JSON.stringify({
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            confirm_password: document.getElementById("confirm_password").value
        }),
        headers: {
            "Accept": "*/*",
            "Content-type": "application/json; charset=UTF-8"
        }
    }).then(res => {
        if (res.ok)
            var msg = ("TI SEI REGISTRATO!");
        else if (res.status == 409)
            var msg = ("EMAIL GIA REGISTRATA")
        else if (res.status == 400)
            var msg = ("LE PASSWORD NON CORRISPONDONO")
        else
            var msg = ("GENERIC ERROR")
    })
        .catch(_ => {
            var msg = ("GENERIC ERROR")
        })





const login = () =>
    fetch("http://localhost:3000/login", {
        method: "POST",
        body: JSON.stringify({
            email: document.getElementById("lgn_email").value,
            password: document.getElementById("lgn_password").value,
        }),
        headers: {
            "Accept": "*/*",
            "Content-type": "application/json; charset=UTF-8"
        }

    }).then(res => {
        if (res.ok && res.status === 200) {
            const username = document.getElementById("lgn_email").value;
            localStorage.clear();
            localStorage.setItem('username', username);
            window.location.assign("http://localhost:3000/pages/home.html");
        }

        if(res.status===403){
            alert("Password errata")
        }
        if(res.status===404){
            alert("Utente non registrato")
        }
            
    })


