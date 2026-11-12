const video = document.getElementById("camera-view");

const displayCanvas =
    document.getElementById("display-canvas");

const displayCtx =
    displayCanvas.getContext("2d");

const captureCanvas =
    document.getElementById("capture-canvas");

const captureCtx =
    captureCanvas.getContext("2d");

const captureBtn =
    document.getElementById("capture-btn");

const resetBtn =
    document.getElementById("reset-btn");

const countdownDisplay =
    document.getElementById("countdown");

const controlsToggle =
    document.getElementById("controls-toggle");

const controlsContent =
    document.getElementById("controls-content");

let stream = null;

let countdownValue = 10;

let countdownInterval = null;

let snapshotInterval = null;

let snapshots = [];

/*
====================
CONTROLS
====================
*/

controlsToggle.addEventListener("click", () => {

    if (controlsContent.style.display === "block") {

        controlsContent.style.display = "none";

    } else {

        controlsContent.style.display = "block";

    }

});

/*
====================
CAMERA
====================
*/

async function startCamera() {

    try {

        stream = await navigator.mediaDevices.getUserMedia({

            video: {
                facingMode: {
                    ideal: "environment"
                }
            },

            audio: false

        });

    }
    catch {

        stream = await navigator.mediaDevices.getUserMedia({

            video: true,
            audio: false

        });

    }

    video.srcObject = stream;

}

/*
====================
SNAPSHOT
====================
*/

function takeSnapshot() {

    if (
        video.videoWidth === 0 ||
        video.videoHeight === 0
    ) {
        return;
    }

    captureCanvas.width =
        video.videoWidth;

    captureCanvas.height =
        video.videoHeight;

    captureCtx.drawImage(
        video,
        0,
        0,
        captureCanvas.width,
        captureCanvas.height
    );

    snapshots.push(
        captureCanvas.toDataURL("image/jpeg")
    );

}

/*
====================
GHOST COMPOSITE
====================
*/

function showGhostComposite() {

    if (snapshots.length === 0) return;

    displayCanvas.width =
        video.videoWidth;

    displayCanvas.height =
        video.videoHeight;

    displayCtx.clearRect(
        0,
        0,
        displayCanvas.width,
        displayCanvas.height
    );

    let loadedImages = 0;

    const images = [];

    snapshots.forEach((src, index) => {

        const img = new Image();

        img.onload = () => {

            images[index] = img;

            loadedImages++;

            if (loadedImages === snapshots.length) {

                renderGhosts(images);

            }

        };

        img.src = src;

    });

}

/*
====================
RENDER POSITIONS
====================
*/

function renderGhosts(images) {

    displayCtx.clearRect(
        0,
        0,
        displayCanvas.width,
        displayCanvas.height
    );

    const total = images.length;

    images.forEach((img, index) => {

        /*
        Earlier positions still visible
        */

        let opacity = 0.45;

        /*
        Final body stronger
        */

        if (index === total - 1) {

            opacity = 1;

        }

        displayCtx.globalAlpha =
            opacity;

        displayCtx.drawImage(
            img,
            0,
            0,
            displayCanvas.width,
            displayCanvas.height
        );

    });

    displayCtx.globalAlpha = 1;

    video.style.display = "none";

    displayCanvas.style.display =
        "block";

}

/*
====================
CAPTURE
====================
*/

captureBtn.addEventListener("click", () => {

    if (countdownInterval) return;

    snapshots = [];

    countdownValue = 10;

    countdownDisplay.textContent =
        countdownValue;

    captureBtn.disabled = true;

    /*
    1 snapshot per second
    */

    snapshotInterval = setInterval(
        takeSnapshot,
        1000
    );

    takeSnapshot();

    countdownInterval = setInterval(() => {

        countdownValue--;

        countdownDisplay.textContent =
            countdownValue;

        if (countdownValue <= 0) {

            clearInterval(
                countdownInterval
            );

            clearInterval(
                snapshotInterval
            );

            countdownInterval = null;
            snapshotInterval = null;

            showGhostComposite();

            captureBtn.disabled =
                false;

        }

    }, 1000);

});

/*
====================
RESET
====================
*/

resetBtn.addEventListener("click", () => {

    clearInterval(
        countdownInterval
    );

    clearInterval(
        snapshotInterval
    );

    countdownInterval = null;

    snapshotInterval = null;

    snapshots = [];

    countdownValue = 10;

    countdownDisplay.textContent =
        "10";

    displayCtx.clearRect(
        0,
        0,
        displayCanvas.width,
        displayCanvas.height
    );

    video.style.display =
        "block";

    displayCanvas.style.display =
        "none";

    captureBtn.disabled =
        false;

});

/*
====================
START APP
====================
*/

startCamera();