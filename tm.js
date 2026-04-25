const MODEL_URL = "https://dh2242.github.io/ELITE_RETRO_GAME/model/";

let model, tmWebcam, maxPredictions;

async function initTM() {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const flip = true;
    tmWebcam = new tmImage.Webcam(260, 260, flip);
    await tmWebcam.setup();
    await tmWebcam.play();

    // Stop the stream that game.js started on the <video> element
    const videoEl = document.getElementById("webcam");
    if (videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach(t => t.stop());
    }

    // Swap the <video> for TM's canvas so the feed actually renders
    tmWebcam.canvas.style.width = "100%";
    tmWebcam.canvas.style.borderRadius = "12px";
    tmWebcam.canvas.style.marginBottom = "10px";
    videoEl.replaceWith(tmWebcam.canvas);
    tmWebcam.canvas.id = "webcam";

    window.requestAnimationFrame(loop);
}

async function loop() {
    tmWebcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

const classToGesture = {
    "left": "left",
    "fist": "fist",
    "right": "right"
    // "nothing" is intentionally omitted — no hit triggered
};
let cooldown = false;

async function predict() {
    const prediction = await model.predict(tmWebcam.canvas);

    let bestClass = null;
    let bestProb = 0;

    for (const p of prediction) {
        if (p.probability > bestProb) {
            bestProb = p.probability;
            bestClass = p.className;
        }
    }

    if (!bestClass) return;

    document.getElementById("gestureLabel").textContent =
        `${bestClass} (${(bestProb * 100).toFixed(0)}%)`;

    if (bestProb > 0.85 && !cooldown) {
        const gesture = classToGesture[bestClass];
        if (gesture) {
            window.handleModelInput(gesture);
            cooldown = true;
            setTimeout(() => cooldown = false, 300);
        }
    }
}

initTM();