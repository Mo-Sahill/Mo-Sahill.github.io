console.log('Let’s write JavaScript');

// Global Variables
let currentSong = new Audio();
let songs = [];
let currFolder;

// Convert seconds to MM:SS format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch songs from the specified folder
async function getSongs(folder) {
    currFolder = folder;
    try {
        const response = await fetch(`./songs/${folder}/`);
        const html = await response.text();
        const div = document.createElement("div");
        div.innerHTML = html;
        const links = Array.from(div.getElementsByTagName("a"));

        songs = links
            .filter(link => link.href.endsWith(".mp3"))
            .map(link => decodeURIComponent(link.href.split(`/${folder}/`)[1]));

        // Display the song list
        const songUL = document.querySelector(".songList ul");
        songUL.innerHTML = songs.map(song => `
            <li>
                <img class="invert" width="34" src="images/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div></div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="images/play.svg" alt="">
                </div>
            </li>`).join("");

        // Attach event listeners to each song
        document.querySelectorAll(".songList li").forEach((li, index) => {
            li.addEventListener("click", () => playMusic(songs[index]));
        });

    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

// Play the selected song
function playMusic(track, pause = false) {
    currentSong.src = `./songs/${currFolder}/` + encodeURIComponent(track);
    if (!pause) {
        currentSong.play();
        document.querySelector("#play").src = "images/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// Display album cards and attach event listeners
async function displayAlbums() {
    try {
        const response = await fetch(`./songs/`);
        const html = await response.text();
        const div = document.createElement("div");
        div.innerHTML = html;
        const links = Array.from(div.getElementsByTagName("a"));
        const cardContainer = document.querySelector(".cardContainer");

        links.forEach(async link => {
            const folder = decodeURIComponent(link.href.split("/").slice(-2, -1)[0]);

            if (['happy', 'sad'].includes(folder)) {
                const metadata = await fetch(`./songs/${folder}/info.json`).then(res => res.json());
                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <img src="./songs/${folder}/cover.jpg" alt="">
                        <h2>${metadata.title}</h2>
                        <p>${metadata.description}</p>
                    </div>`;
            }
        });

        // Attach event listeners to cards
        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async () => {
                const folder = card.getAttribute("data-folder");
                await getSongs(folder);
                playMusic(songs[0]);
            });
        });

    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

// Main function to initialize the app
async function main() {
    await getSongs("happy"); // Load initial songs
    playMusic(songs[0], true); // Load first song but don't play

    displayAlbums(); // Display album cards

    // Attach event listeners for playback controls
    document.querySelector("#play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.querySelector("#play").src = "images/pause.svg";
        } else {
            currentSong.pause();
            document.querySelector("#play").src = "images/play.svg";
        }
    });

    // Update the song's time display
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    });

    // Attach event listener for seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Hamburger menu functionality
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Close button functionality
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous and Next button functionality
    document.querySelector("#previous").addEventListener("click", () => {
        currentSong.pause();
        const index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
        if (index > 0) playMusic(songs[index - 1]);
    });

    document.querySelector("#next").addEventListener("click", () => {
        currentSong.pause();
        const index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
        if (index < songs.length - 1) playMusic(songs[index + 1]);
    });

    // Volume control functionality
    document.querySelector(".range input").addEventListener("input", e => {
        currentSong.volume = e.target.value / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume img").src = "images/volume.svg";
        } else {
            document.querySelector(".volume img").src = "images/mute.svg";
        }
    });

    // Mute/Unmute functionality
    document.querySelector(".volume img").addEventListener("click", e => {
        if (currentSong.volume > 0) {
            e.target.src = "images/mute.svg";
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "images/volume.svg";
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
