const video = document.getElementById("camera-view");

const displayCanvas =
    document.getElementById("display-canvas");

const displayCtx =
    displayCanvas.getContext("2d");

const captureCanvas =
    document.getElementById("capture-canvas");

const captureCtx =
    captureCanvas.getContext("2d");

const grainCanvas =
    document.getElementById("grain-canvas");

const grainCtx =
    grainCanvas.getContext("2d");

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

const memorySlider =
    document.getElementById("memory-slider");

const visibilitySlider =
    document.getElementById("visibility-slider");

const blurSlider =
    document.getElementById("blur-slider");

const contrastSlider =
    document.getElementById("contrast-slider");

const brightnessSlider =
    document.getElementById("brightness-slider");

const grainSlider =
    document.getElementById("grain-slider");

let ghostVisibility = 0.35;
let ghostBlur = 6;
let memoryPercent = 50;
let grainAmount = 20;

let stream = null;

let countdownValue = 10;

let countdownInterval = null;

let snapshotInterval = null;

let snapshots = [];

/*
====================
SLIDERS
====================
*/

memorySlider.addEventListener("input", () => {

    memoryPercent =
        parseInt(memorySlider.value);

});

visibilitySlider.addEventListener("input", () => {

    ghostVisibility =
        visibilitySlider.value / 100;

});

blurSlider.addEventListener("input", () => {

    ghostBlur =
        blurSlider.value;

});

grainSlider.addEventListener("input", () => {

    grainAmount =
        parseInt(grainSlider.value);

});

function updateLiveCameraFilters() {

    video.style.filter =
        `
        grayscale(100%)
        contrast(${contrastSlider.value}%)
        brightness(${brightnessSlider.value}%)
        `;

}

contrastSlider.addEventListener(
    "input",
    updateLiveCameraFilters
);

brightnessSlider.addEventListener(
    "input",
    updateLiveCameraFilters
);

/*
====================
LIVE GRAIN
====================
*/

function generateGrain() {

    grainCanvas.width =
        window.innerWidth;

    grainCanvas.height =
        window.innerHeight;

    const imageData =
        grainCtx.createImageData(
            grainCanvas.width,
            grainCanvas.height
        );

    const data =
        imageData.data;

    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        const noise =
            Math.random() * 255;

        data[i] = noise;
        data[i + 1] = noise;
        data[i + 2] = noise;

        data[i + 3] =
            grainAmount;

    }

    grainCtx.putImageData(
        imageData,
        0,
        0
    );

}

/*
====================
CONTROLS PANEL
====================
*/

controlsToggle.addEventListener("click", () => {

    if (
        controlsContent.style.display ===
        "block"
    ) {

        controlsContent.style.display =
            "none";

    } else {

        controlsContent.style.display =
            "block";

    }

});

/*
====================
CAMERA
====================
*/

async function startCamera() {

    try {

        stream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                },

                audio: false

            });

    } catch {

        stream =
            await navigator.mediaDevices.getUserMedia({

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
LOAD COMPOSITE
====================
*/

function showGhostComposite() {

    if (snapshots.length === 0) return;

    displayCanvas.width =
        video.videoWidth;

    displayCanvas.height =
        video.videoHeight;

    let loadedImages = 0;

    const images = [];

    snapshots.forEach((src, index) => {

        const img = new Image();

        img.onload = () => {

            images[index] = img;

            loadedImages++;

            if (
                loadedImages === snapshots.length
            ) {

                renderGhosts(images);

            }

        };

        img.src = src;

    });

}

/*
====================
RENDER GHOSTS
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

    const framesToShow =
        Math.max(
            2,
            Math.round(
                (memoryPercent / 100) * total
            )
        );

    const startIndex =
        total - framesToShow;

    images.forEach((img, index) => {

        if (index < startIndex) return;

        const isFinalFrame =
            index === total - 1;

        if (!isFinalFrame) {

            displayCtx.save();

            displayCtx.globalAlpha =
                ghostVisibility;

            displayCtx.filter =
                `blur(${ghostBlur}px)`;

            displayCtx.drawImage(
                img,
                0,
                0,
                displayCanvas.width,
                displayCanvas.height
            );

            displayCtx.restore();

        }

        if (isFinalFrame) {

            displayCtx.save();

            displayCtx.globalAlpha = 1;

            displayCtx.filter =
                "none";

            displayCtx.drawImage(
                img,
                0,
                0,
                displayCanvas.width,
                displayCanvas.height
            );

            displayCtx.restore();

        }

    });

    /*
    ====================
    VIGNETTE
    ====================
    */

    const vignette =
        displayCtx.createRadialGradient(
            displayCanvas.width / 2,
            displayCanvas.height / 2,
            displayCanvas.width * 0.2,

            displayCanvas.width / 2,
            displayCanvas.height / 2,
            displayCanvas.width * 0.75
        );

    vignette.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
        0.65,
        "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
        1,
        "rgba(0,0,0,0.75)"
    );

    displayCtx.fillStyle =
        vignette;

    displayCtx.fillRect(
        0,
        0,
        displayCanvas.width,
        displayCanvas.height
    );

    displayCanvas.style.filter =
        `
        grayscale(100%)
        contrast(${contrastSlider.value}%)
        brightness(${brightnessSlider.value}%)
        `;

    video.style.display =
        "none";

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

    snapshotInterval =
        setInterval(
            takeSnapshot,
            1000
        );

    takeSnapshot();

    countdownInterval =
        setInterval(() => {

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

                captureBtn.disabled = false;

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
START
====================
*/

updateLiveCameraFilters();

setInterval(
    generateGrain,
    120
);

startCamera();