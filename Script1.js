const video = document.getElementById("camera-view");

const captureBtn = document.getElementById("capture-btn");
const resetBtn = document.getElementById("reset-btn");

let stream = null;

/*
=================================
START CAMERA
=================================
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
    catch (error) {

        console.log(
            "Rear camera unavailable. Using available camera."
        );

        stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

    }

    video.srcObject = stream;

}

/*
=================================
CAPTURE BUTTON
=================================
*/

captureBtn.addEventListener("click", () => {

    console.log("Capture button pressed");

});

/*
=================================
RESET BUTTON
=================================
*/

resetBtn.addEventListener("click", () => {

    console.log("Reset button pressed");

});

/*
=================================
APP START
=================================
*/

startCamera();