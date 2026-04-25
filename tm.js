const MODEL_URL = "https://dh2242.github.io/ELITE_RETRO_GAME/model/";

let model, webcam, maxPredictions;

async function initTM() {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const flip = true;
    webcam = new tmImage.Webcam(260, 260, flip);
    await webcam.setup();
    await webcam.play();

    document.getElementById("webcam").srcObject = webcam.webcam.stream;

    window.requestAnimationFrame(loop);
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

const classToGesture = {
    "left": "left",
    "fist": "fist",
    "nothing": "nothing",
    "right": "right"
};

let cooldown = false;

async function predict() {
    const prediction = await model.predict(webcam.canvas);

    let bestClass = null;
    let bestProb = 0;

    prediction.forEach(p => {
        if (p.probability > bestProb) {
            bestProb = p.probability;
            bestClass = p.className;
        }
    });

    if (!bestClass) return;

    document.getElementById("gestureLabel").textContent = bestClass;

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

