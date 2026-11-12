const video = document.getElementById("camera-view");

const captureBtn = document.getElementById("capture-btn");
const resetBtn = document.getElementById("reset-btn");

const controlsToggle =
    document.getElementById("controls-toggle");

const controlsContent =
    document.getElementById("controls-content");

let stream = null;

/*
====================
CONTROLS DROPDOWN
====================
*/

controlsToggle.addEventListener("click", () => {

    if (
        controlsContent.style.display === "block"
    ) {

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
            }
        });

    } catch (error) {

        stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });

    }

    video.srcObject = stream;

}

captureBtn.addEventListener("click", () => {
    console.log("Capture");
});

resetBtn.addEventListener("click", () => {
    console.log("Reset");
});

startCamera();