/**
 * script.js - Integrated AI Lab Logic
 */

const video = document.getElementById('video');
const statusBar = document.getElementById('status-bar');
const dataEditor = document.getElementById('dataEditor');
const imageUpload = document.getElementById('imageUpload');
const welcomeLog = document.getElementById('welcomeLog');

let faceMatcher = null;

// --- A. Initialization / 系统初始化 ---

async function init() {
    try {
        // Disable TF storage to prevent "Access to storage" error
        if (window.tf) faceapi.tf.env().set('DEBUG', false);

        statusBar.innerText = "Status: Loading AI Models...";
        const MODEL_PATH = 'models'; 
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH)
        ]);

        statusBar.innerText = "Status: Loading Local Data...";
        const descriptors = await loadDataFromLocal();
        if (descriptors.length > 0) {
            faceMatcher = new faceapi.FaceMatcher(descriptors, 0.6);
        }

        // Initialize Textarea
        dataEditor.value = localStorage.getItem('custom_face_data') || "[]";
        
        statusBar.innerText = "Status: Starting Camera...";
        startCamera();
    } catch (err) {
        statusBar.innerText = "Initialization Error: " + err.message;
        console.error(err);
    }
}

// --- B. Bulk Enrollment Logic / 批量录入逻辑 ---

imageUpload.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const thumbs = document.getElementById('preview-thumbs');
    thumbs.innerHTML = ''; 
    statusBar.innerText = `Status: Processing ${files.length} images...`;

    const tempDB = {}; 

    for (let file of files) {
        // Filename to Label (e.g., "Zhang_San_1.jpg" -> "Zhang_San")
        let label = file.name.split('.')[0].split('_')[0];
        
        const img = await faceapi.bufferToImage(file);
        
        // Thumbnail preview
        const t = document.createElement('img');
        t.src = URL.createObjectURL(file);
        t.className = 'thumb';
        thumbs.appendChild(t);

        // Feature extraction (using SSD for better accuracy on static photos)
        const d = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        
        if (d) {
            if (!tempDB[label]) tempDB[label] = [];
            tempDB[label].push(Array.from(d.descriptor));
        }
    }

    const newEntries = Object.keys(tempDB).map(name => ({
        label: name,
        descriptors: tempDB[name]
    }));

    // Update Textarea (Merge)
    try {
        let currentDB = JSON.parse(dataEditor.value || "[]");
        // Update or Add
        newEntries.forEach(newEnt => {
            const idx = currentDB.findIndex(item => item.label === newEnt.label);
            if (idx > -1) currentDB[idx].descriptors = [...currentDB[idx].descriptors, ...newEnt.descriptors];
            else currentDB.push(newEnt);
        });
        dataEditor.value = JSON.stringify(currentDB, null, 2);
        statusBar.innerText = "Status: Batch processed. Click 'Apply' to save.";
    } catch (e) {
        dataEditor.value = JSON.stringify(newEntries, null, 2);
    }
});

// --- C. Recognition Logic / 识别逻辑 ---

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
            // Only start detection once video is actually rendering
            video.onloadedmetadata = () => {
                video.play();
                runRecognitionLoop();
            };
        })
        .catch(err => statusBar.innerText = "Camera Access Denied.");
}

async function runRecognitionLoop() {
    // Create canvas based on video
    const canvas = faceapi.createCanvasFromMedia(video);
    document.getElementById('videoWrapper').append(canvas);

    // CRITICAL: Ensure dimensions match exactly for the box alignment
    const displaySize = { width: video.clientWidth, height: video.clientHeight };
    faceapi.matchDimensions(canvas, displaySize);

    let lastSpoken = "";
    let lastTime = 0;

    // Use resize listener to keep box aligned if window changes
    window.addEventListener('resize', () => {
        const newSize = { width: video.clientWidth, height: video.clientHeight };
        faceapi.matchDimensions(canvas, newSize);
    });

    setInterval(async () => {
        if (video.paused || video.ended) return;

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        // Sync drawing layer with current video display size
        const currentDisplaySize = { width: video.clientWidth, height: video.clientHeight };
        const resizedDetections = faceapi.resizeResults(detections, currentDisplaySize);
        
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        resizedDetections.forEach(det => {
            if (!faceMatcher) return;
            const match = faceMatcher.findBestMatch(det.descriptor);
            const label = match.label;

            // Draw Rect
            new faceapi.draw.DrawBox(det.detection.box, { 
                label: label === 'unknown' ? "Stranger" : label 
            }).draw(canvas);

            // Audio Welcome
            if (label !== 'unknown' && (label !== lastSpoken || Date.now() - lastTime > 10000)) {
                welcomeLog.innerText = `Recent: Welcome, ${label}!`;
                const msg = new SpeechSynthesisUtterance(`Welcome, ${label}`);
                msg.lang = 'en-US';
                window.speechSynthesis.speak(msg);
                lastSpoken = label;
                lastTime = Date.now();
            }
        });
    }, 200);
}

// --- D. Helper Functions / 工具函数 ---

async function loadDataFromLocal() {
    const local = localStorage.getItem('custom_face_data');
    if (!local) return [];
    try {
        const data = JSON.parse(local);
        return data.map(item => new faceapi.LabeledFaceDescriptors(
            item.label, 
            item.descriptors.map(d => new Float32Array(d))
        ));
    } catch (e) { return []; }
}

window.saveAndReload = () => {
    localStorage.setItem('custom_face_data', dataEditor.value);
    location.reload();
};

window.clearData = () => {
    if (confirm("Delete all face records?")) {
        localStorage.removeItem('custom_face_data');
        location.reload();
    }
};

init();