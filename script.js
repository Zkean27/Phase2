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

let stream = null;

let countdownValue = 10;

let countdownInterval = null;

let captureInterval = null;

let previousFrame = null;

let ghostVisibility = 0.5;
let ghostBlur = 6;
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
            blurSlider.value;

    }
);

grainSlider.addEventListener(
    "input",
    () => {

        grainAmount =
            parseInt(grainSlider.value);

    }
);

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
MOTION DETECTION
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

    if (
        displayCanvas.width === 0
    ) {

        displayCanvas.width =
            video.videoWidth;

        displayCanvas.height =
            video.videoHeight;

    }

    captureCtx.drawImage(
        video,
        0,
        0
    );

    const currentFrame =
        captureCtx.getImageData(
            0,
            0,
            captureCanvas.width,
            captureCanvas.height
        );

    if (!previousFrame) {

        previousFrame = currentFrame;
        return;

    }

    const current =
        currentFrame.data;

    const previous =
        previousFrame.data;

    const motion =
        displayCtx.createImageData(
            currentFrame
        );

    const pixels =
        motion.data;

    for (
        let i = 0;
        i < current.length;
        i += 4
    ) {

        const diff =
            Math.abs(
                current[i] -
                previous[i]
            ) +

            Math.abs(
                current[i + 1] -
                previous[i + 1]
            ) +

            Math.abs(
                current[i + 2] -
                previous[i + 2]
            );

        if (diff > 20) {

            pixels[i] = 255;
            pixels[i + 1] = 255;
            pixels[i + 2] = 255;

            pixels[i + 3] =
                255 * ghostVisibility;

        }

    }

    displayCtx.save();

    displayCtx.filter =
        `blur(${ghostBlur}px)`;

    displayCtx.putImageData(
        motion,
        0,
        0
    );

    displayCtx.restore();

    previousFrame =
        currentFrame;

}

/*
====================
FINAL IMAGE
====================
*/

function freezeResult() {

    displayCtx.drawImage(
        video,
        0,
        0,
        displayCanvas.width,
        displayCanvas.height
    );

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

captureBtn.addEventListener(
    "click",
    () => {

        previousFrame = null;

        displayCtx.clearRect(
            0,
            0,
            displayCanvas.width,
            displayCanvas.height
        );

        countdownValue = 10;

        countdownDisplay.textContent =
            countdownValue;

        captureBtn.disabled = true;

        captureInterval =
            setInterval(
                accumulateMotion,
                80
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