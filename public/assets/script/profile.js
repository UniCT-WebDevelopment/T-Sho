



window.onload = () => {

    const logo = document.querySelector(".logo");
    logo.addEventListener("click", () => {
        window.location.assign("/pages/home.html")
    })


    const profile_name = document.querySelector(".username");
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user');
    profile_name.innerHTML = username;


    const usernameAttuale = localStorage.getItem("username");
    const bottoneFollow = document.querySelector(".follow-button");
    const bottoneUnfollow = document.querySelector(".unfollow-button");

    bottoneFollow.addEventListener("click", () => { followRequest() });
    bottoneUnfollow.addEventListener("click", () => { unfollowRequest() });


    const followers_text = document.querySelector(".followers-text");
    const following_text = document.querySelector(".following-text");

    followers_text.addEventListener("click", () => { showFollowers() });
    following_text.addEventListener("click", () => { showFollowings() });


    const profile = document.querySelector(".profile");
    profile.addEventListener("click", () => {
        const username = localStorage.getItem("username");
        const url = `http://localhost:3000/pages/profile.html?user=${encodeURIComponent(username)}`;
        window.location.href = url;
    })

    const profile_txt = document.querySelector(".profile-box span");
    profile_txt.addEventListener("click", () => {
        const username = localStorage.getItem("username");
        const url = `http://localhost:3000/pages/profile.html?user=${encodeURIComponent(username)}`;
        window.location.href = url;
    })


    async function showFollowers() {
        const followersListUL = document.getElementById('followers-list-ul');
        if (followersListUL.innerHTML === "") {
            const urlParams = new URLSearchParams(window.location.search);
            const username = urlParams.get('user');
            try {
                const followersRaw = await axios.post('http://localhost:3000/api/show-followers', { username })

                followersListUL.innerHTML = '';

                followersRaw.data.results[0].forEach(follower => {
                    const followerLi = document.createElement('li');
                    followerLi.textContent = follower.username_seguiti;
                    followerLi.addEventListener("click", () => {
                        const url = `http://localhost:3000/pages/profile.html?user=${encodeURIComponent(follower.username_seguiti)}`;
                        window.location.href = url;
                        followersListUL.innerHTML = '';
                    })
                    followersListUL.appendChild(followerLi);
                });
            } catch (error) {
                console.error("Si è verificato un errore durante la richiesta:", error);
            }
        }
        else{
            followersListUL.innerHTML="";
        }
    }

    async function showFollowings() {
        const followingListUL = document.getElementById('following-list-ul');
        if (followingListUL.innerHTML === "") {
            const urlParams = new URLSearchParams(window.location.search);
            const username = urlParams.get('user');
            try {


                const followingRaw = await axios.post('http://localhost:3000/api/show-followings', { username })

                followingRaw.innerHTML = '';

                followingRaw.data.results[0].forEach(following => {
                    const followingLi = document.createElement('li');
                    followingLi.textContent = following.username;
                    followingLi.addEventListener("click", () => {
                        const url = `http://localhost:3000/pages/profile.html?user=${encodeURIComponent(following.username)}`;
                        window.location.href = url;
                        followingLi.innerHTML = '';

                    })
                    
                    followingListUL.appendChild(followingLi);
                });
            } catch (error) {
                console.error("Si è verificato un errore durante la richiesta:", error);
            }
        }
        else{
            followingListUL.innerHTML="";
        }
    }

    async function followRequest() {
        const response = await axios.post('http://localhost:3000/api/follow-request', { usernameAttuale, username })
        if (response.data.message === 'Follow effettuato con successo') {
            bottoneFollow.classList.add("hidden");
            bottoneUnfollow.classList.remove("hidden");
        }
    }

    async function unfollowRequest() {
        const response = await axios.post('http://localhost:3000/api/unfollow-request', { usernameAttuale, username })

        if (response.data.message === 'unfollow effettuato con successo') {
            bottoneUnfollow.classList.add("hidden");
            bottoneFollow.classList.remove("hidden");
        }
    }

    async function alreadyFollow() {
        const response = await axios.post('http://localhost:3000/api/already-following', { usernameAttuale, username })
        if (username === usernameAttuale) {
            bottoneFollow.classList.add("hidden");
            return;
        } else if (response.data.alreadyFollowing === true) {
            bottoneFollow.classList.add("hidden");
            bottoneUnfollow.classList.remove("hidden");
        }
        else {
            bottoneUnfollow.classList.add("hidden");
            bottoneFollow.classList.remove("hidden");
        }
    }

    async function followersUtente(username) {
        try {
            const response = await axios.post('http://localhost:3000/api/get-followers', { username })

            const followers = document.querySelector(".followers-text");
            followers.innerHTML = response.data.length + " followers";

        } catch (error) {
            console.error("Si è verificato un errore durante la richiesta:", error);
        }
    }

    async function followingUtente(username) {
        try {
            const response = await axios.post('http://localhost:3000/api/get-following', { username })

            const following = document.querySelector(".following-text");

            following.innerHTML = response.data.length + " following";
        } catch (error) {
            console.error("Si è verificato un errore durante la richiesta:", error);
        }
    }

    async function trovaFilmVisti(username) {
        try {
            const response = await axios.post('http://localhost:3000/api/get-watched', { username })

            const div_film = document.querySelector(".film .count");
            div_film.innerHTML = response.data.tot_film;

            const div_tempo_film = document.querySelector(".tempo-film .count");
            const tempoFilmInMinuti = response.data.tempo_film;
            const tempoFilmInOre = convertiMinutiInOre(tempoFilmInMinuti);
            div_tempo_film.innerHTML = tempoFilmInOre;

            const div_serie = document.querySelector(".serie .count ");
            div_serie.innerHTML = response.data.tot_serie;

        } catch (error) {
            console.error("Si è verificato un errore durante la richiesta:", error);
        }
    }

    async function commentiUtente(username) {
        try {
            const response = await axios.post('http://localhost:3000/api/get-comments-number', { username })


            const div_commenti = document.querySelector(".comment-count");
            div_commenti.innerHTML = response.data + " commenti";
        } catch (error) {
            console.error("Si è verificato un errore durante la richiesta:", error);
        }
    }

    async function generateFilmSlides(username) {
        const filmWrapper = document.querySelector("#film");
        filmWrapper.innerHTML = "";
        const swiperContainer = document.querySelector('#film-swiper');

        const prev = document.createElement("button");
        prev.textContent = "<";
        prev.classList.add("swiper-button-prev")

        const next = document.createElement("button");
        next.textContent = ">";
        next.classList.add("swiper-button-next");

        const response = await axios.post("http://localhost:3000/api/seen-films", { username })
        const risposta = response.data.resultsMedia;
        if (response.data.message === "nessun risultato") {
            filmWrapper.innerHTML = "Nessun film visto";
            return;
        }
        for (let i = risposta.length - 1; i >= 0; i--) {
            const movie = risposta[i];

            if (movie.Type === "movie") {
                const swiperSlide = document.createElement("div");
                swiperSlide.classList.add("swiper-slide");

                const filmImg = document.createElement("img");
                filmImg.setAttribute("src", movie.Poster);


                swiperSlide.appendChild(filmImg);
                filmWrapper.appendChild(swiperSlide);

                currentPositionFilm = 0;
                let slideWidth = 150;

                swiperContainer.appendChild(prev);
                swiperContainer.appendChild(next);

                prev.addEventListener('click', () => {
                    currentPositionFilm = Math.max(currentPositionFilm - slideWidth, 0);
                    updateSwiperPositionFilm();
                });

                next.addEventListener('click', () => {
                    let maxPosition = filmWrapper.scrollWidth - swiperContainer.offsetWidth;
                    currentPositionFilm = Math.min(currentPositionFilm + slideWidth, maxPosition);
                    updateSwiperPositionFilm();
                });
                function updateSwiperPositionFilm() {
                    filmWrapper.style.transform = `translateX(-${currentPositionFilm}px)`;
                }
            }
        }
    }



    async function generateSerieSlides(username) {
        const serieWrapper = document.querySelector("#serie");
        serieWrapper.innerHTML = "";
        const swiperContainer = document.querySelector('#serie-swiper');

        const prev = document.createElement("button");
        prev.textContent = "<";
        prev.classList.add("swiper-button-prev")


        const next = document.createElement("button");
        next.textContent = ">";
        next.classList.add("swiper-button-next");

        const response = await axios.post("http://localhost:3000/api/seen-films", { username })
        const risposta = response.data.resultsMedia;

        if (response.data.message === "nessun risultato") {
            serieWrapper.innerHTML = "Nessuna serie vista";
            return;
        }

        for (let i = risposta.length - 1; i >= 0; i--) {
            const movie = risposta[i];

            if (movie.Type === "series") {
                const swiperSlide = document.createElement("div");
                swiperSlide.classList.add("swiper-slide");

                const serieImg = document.createElement("img");
                serieImg.setAttribute("src", movie.Poster);



                swiperSlide.appendChild(serieImg);
                serieWrapper.appendChild(swiperSlide);


                currentPositionserie = 0;
                let slideWidth = 150;


                swiperContainer.appendChild(prev);
                swiperContainer.appendChild(next);

                prev.addEventListener('click', () => {
                    currentPositionserie = Math.max(currentPositionserie - slideWidth, 0);
                    updateSwiperPositionserie();
                });

                next.addEventListener('click', () => {
                    let maxPosition = serieWrapper.scrollWidth - swiperContainer.offsetWidth;
                    currentPositionserie = Math.min(currentPositionserie + slideWidth, maxPosition);
                    updateSwiperPositionserie();
                });
                function updateSwiperPositionserie() {
                    serieWrapper.style.transform = `translateX(-${currentPositionserie}px)`;
                }
            }
        }
    }

    


    generateFilmSlides(username);
    generateSerieSlides(username);
    trovaFilmVisti(username);
    commentiUtente(username);
    alreadyFollow();
    followersUtente(username);
    followingUtente(username);

}

function convertiMinutiInOre(minuti) {
    const ore = Math.floor(minuti / 60);
    const minutiRimasti = minuti % 60;
    return `${ore}h ${minutiRimasti}min`;
}

function logout() {
    localStorage.clear();
    location.href = "login.html";
}