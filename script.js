const video = document.getElementById("camera-view");

const displayCanvas =
    document.getElementById("display-canvas");

const displayCtx =
    displayCanvas.getContext("2d");

const captureCanvas =
    document.getElementById("capture-canvas");

const captureCtx =
    captureCanvas.getContext("2d");

/*
====================
TRAIL CANVAS
====================
*/

const trailCanvas =
    document.createElement("canvas");

const trailCtx =
    trailCanvas.getContext("2d");

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

let stream = null;

let countdownValue = 10;

let countdownInterval = null;

let captureInterval = null;

let previousFrame = null;

let ghostVisibility = 0.75;
let ghostBlur = 8;
let grainAmount = 20;

/*
====================
SLIDERS
====================
*/

visibilitySlider.addEventListener(
    "input",
    () => {

        ghostVisibility =
            visibilitySlider.value / 100;

    }
);

blurSlider.addEventListener(
    "input",
    () => {

        ghostBlur =
            parseInt(
                blurSlider.value
            );

    }
);

grainSlider.addEventListener(
    "input",
    () => {

        grainAmount =
            parseInt(
                grainSlider.value
            );

    }
);

/*
====================
LIVE CAMERA FILTERS
====================
*/

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
GRAIN
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
CONTROLS
====================
*/

controlsToggle.addEventListener(
    "click",
    () => {

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

    }
);

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
MOTION ACCUMULATION
====================
*/

function accumulateMotion() {

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

    displayCanvas.width =
        video.videoWidth;

    displayCanvas.height =
        video.videoHeight;

    trailCanvas.width =
        video.videoWidth;

    trailCanvas.height =
        video.videoHeight;

    captureCtx.drawImage(
        video,
        0,
        0,
        captureCanvas.width,
        captureCanvas.height
    );

    const currentFrame =
        captureCtx.getImageData(
            0,
            0,
            captureCanvas.width,
            captureCanvas.height
        );

    if (!previousFrame) {

        previousFrame =
            currentFrame;

        return;
    }

    const curr =
        currentFrame.data;

    const prev =
        previousFrame.data;

    const motionCanvas =
        document.createElement("canvas");

    motionCanvas.width =
        captureCanvas.width;

    motionCanvas.height =
        captureCanvas.height;

    const motionCtx =
        motionCanvas.getContext("2d");

    const motionData =
        motionCtx.createImageData(
            captureCanvas.width,
            captureCanvas.height
        );

    const mask =
        motionData.data;

    for (
        let i = 0;
        i < curr.length;
        i += 4
    ) {

        const diff =
            Math.abs(curr[i] - prev[i]) +
            Math.abs(curr[i + 1] - prev[i + 1]) +
            Math.abs(curr[i + 2] - prev[i + 2]);

        if (diff > 12) {

            mask[i] = 255;
            mask[i + 1] = 255;
            mask[i + 2] = 255;
            mask[i + 3] = 255;
        }
    }

    motionCtx.putImageData(
        motionData,
        0,
        0
    );

    /*
    ACCUMULATE INTO TRAIL LAYER
    */

    trailCtx.save();

    trailCtx.globalCompositeOperation =
        "screen";

    trailCtx.globalAlpha =
        ghostVisibility * 0.25;

    trailCtx.filter =
        `blur(${ghostBlur}px)`;

    trailCtx.drawImage(
        motionCanvas,
        0,
        0
    );

    trailCtx.restore();

    previousFrame =
        currentFrame;
}

/*
====================
FINAL COMPOSITE
====================
*/

function freezeResult() {

    displayCtx.clearRect(
        0,
        0,
        displayCanvas.width,
        displayCanvas.height
    );

    /*
    Draw trails FIRST
    */

    displayCtx.drawImage(
        trailCanvas,
        0,
        0
    );

    /*
    Draw body SECOND
    */

    displayCtx.drawImage(
        video,
        0,
        0,
        displayCanvas.width,
        displayCanvas.height
    );

    /*
    VIGNETTE
    */

    const vignette =
        displayCtx.createRadialGradient(

            displayCanvas.width / 2,
            displayCanvas.height / 2,
            displayCanvas.width * 0.15,

            displayCanvas.width / 2,
            displayCanvas.height / 2,
            displayCanvas.width * 0.80
        );

    vignette.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
        1,
        "rgba(0,0,0,.85)"
    );

    displayCtx.fillStyle =
        vignette;

    displayCtx.fillRect(
        0,
        0,
        displayCanvas.width,
        displayCanvas.height
    );

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

captureBtn.addEventListener(
    "click",
    () => {

        previousFrame = null;

        trailCtx.clearRect(
            0,
            0,
            trailCanvas.width,
            trailCanvas.height
        );

        countdownValue = 10;

        countdownDisplay.textContent =
            countdownValue;

        captureBtn.disabled = true;

        captureInterval =
            setInterval(
                accumulateMotion,
                60
            );

        countdownInterval =
            setInterval(() => {

                countdownValue--;

                countdownDisplay.textContent =
                    countdownValue;

                if (
                    countdownValue <= 0
                ) {

                    clearInterval(
                        countdownInterval
                    );

                    clearInterval(
                        captureInterval
                    );

                    freezeResult();

                    captureBtn.disabled =
                        false;
                }

            }, 1000);

    }
);

/*
====================
RESET
====================
*/

resetBtn.addEventListener(
    "click",
    () => {

        clearInterval(
            countdownInterval
        );

        clearInterval(
            captureInterval
        );

        previousFrame = null;

        trailCtx.clearRect(
            0,
            0,
            trailCanvas.width,
            trailCanvas.height
        );

        displayCtx.clearRect(
            0,
            0,
            displayCanvas.width,
            displayCanvas.height
        );

        countdownValue = 10;

        countdownDisplay.textContent =
            "10";

        video.style.display =
            "block";

        displayCanvas.style.display =
            "none";

        captureBtn.disabled =
            false;

    }
);

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