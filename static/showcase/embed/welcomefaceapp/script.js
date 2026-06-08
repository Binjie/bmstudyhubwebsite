/**
 * script.js - Integrated AI Lab Logic
 */

const video = document.getElementById('video');
const statusBar = document.getElementById('status-bar');
const dataEditor = document.getElementById('dataEditor');
const imageUpload = document.getElementById('imageUpload');
const personName = document.getElementById('personName');
const captureBtn = document.getElementById('captureBtn');
const clearNameBtn = document.getElementById('clearNameBtn');
const welcomeLog = document.getElementById('welcomeLog');
const thumbs = document.getElementById('preview-thumbs');

const STORAGE_KEY = 'custom_face_data';
const MATCH_THRESHOLD = 0.6;

let faceMatcher = null;
let faceDB = [];
let recognitionStarted = false;
let availableVoices = [];

async function init() {
    try {
        if (window.tf) faceapi.tf.env().set('DEBUG', false);
        initSpeechVoices();

        setStatus('Loading AI Models...');
        const MODEL_PATH = 'models';
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH)
        ]);

        setStatus('Loading Local Data...');
        faceDB = readStoredData();
        syncDatabaseViews();

        setStatus('Starting Camera...');
        startCamera();
    } catch (err) {
        setStatus('Initialization Error: ' + err.message);
        console.error(err);
    }
}

imageUpload.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const label = getRequestedName();
    if (!label) {
        setStatus('Please enter a name before uploading photos.');
        imageUpload.value = '';
        personName.focus();
        return;
    }

    setStatus(`Processing ${files.length} image(s) for ${label}...`);
    let added = 0;
    let skipped = 0;

    for (const file of files) {
        try {
            const image = await faceapi.bufferToImage(file);
            const preview = await fileToDataUrl(file);
            const descriptor = await extractDescriptor(image);

            if (!descriptor) {
                skipped += 1;
                continue;
            }

            addSample(label, descriptor, preview);
            added += 1;
        } catch (err) {
            skipped += 1;
            console.error(err);
        }
    }

    persistAndRefresh();
    imageUpload.value = '';
    setStatus(`Added ${added} photo(s). ${skipped ? `${skipped} skipped: no usable face found.` : 'Database updated live.'}`);
});

captureBtn.addEventListener('click', async () => {
    const label = getRequestedName();
    if (!label) {
        setStatus('Please enter a name before capturing a photo.');
        personName.focus();
        return;
    }

    if (!video.videoWidth || !video.videoHeight) {
        setStatus('Camera is not ready yet.');
        return;
    }

    captureBtn.disabled = true;
    setStatus(`Capturing photo for ${label}...`);

    try {
        const capture = document.createElement('canvas');
        capture.width = video.videoWidth;
        capture.height = video.videoHeight;
        capture.getContext('2d').drawImage(video, 0, 0, capture.width, capture.height);

        const descriptor = await extractDescriptor(capture);
        if (!descriptor) {
            setStatus('No usable face found in the captured image.');
            return;
        }

        addSample(label, descriptor, capture.toDataURL('image/jpeg', 0.82));
        persistAndRefresh();
        setStatus(`Captured and added ${label}. Database updated live.`);
    } catch (err) {
        setStatus('Capture Error: ' + err.message);
        console.error(err);
    } finally {
        captureBtn.disabled = false;
    }
});

clearNameBtn.addEventListener('click', () => {
    personName.value = '';
    personName.focus();
});

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                runRecognitionLoop();
            };
        })
        .catch(() => setStatus('Camera Access Denied.'));
}

async function runRecognitionLoop() {
    if (recognitionStarted) return;
    recognitionStarted = true;

    const canvas = faceapi.createCanvasFromMedia(video);
    document.getElementById('videoWrapper').append(canvas);

    const resizeCanvas = () => {
        faceapi.matchDimensions(canvas, { width: video.clientWidth, height: video.clientHeight });
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let lastSpoken = '';
    let lastTime = 0;

    setInterval(async () => {
        if (video.paused || video.ended) return;

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        const currentDisplaySize = { width: video.clientWidth, height: video.clientHeight };
        const resizedDetections = faceapi.resizeResults(detections, currentDisplaySize);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!faceMatcher) {
            if (detections.length) welcomeLog.innerText = 'No enrolled faces in database.';
            return;
        }

        resizedDetections.forEach(det => {
            const match = faceMatcher.findBestMatch(det.descriptor);
            const label = match.label === 'unknown' ? 'Unknown' : match.label;

            new faceapi.draw.DrawBox(det.detection.box, { label }).draw(canvas);

            if (label === 'Unknown') {
                welcomeLog.innerText = 'Recent: Unknown face detected';
                return;
            }

            if (label !== lastSpoken || Date.now() - lastTime > 10000) {
                welcomeLog.innerText = `Recent: ${getWelcomeText(label)}`;
                speakWelcome(label);
                lastSpoken = label;
                lastTime = Date.now();
            }
        });
    }, 200);
}

async function extractDescriptor(image) {
    const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
    return detection ? Array.from(detection.descriptor) : null;
}

function addSample(label, descriptor, preview) {
    const cleanLabel = label.trim();
    let entry = faceDB.find(item => item.label === cleanLabel);
    if (!entry) {
        entry = { label: cleanLabel, descriptors: [], samples: [] };
        faceDB.push(entry);
    }

    const sample = {
        id: createId(),
        descriptor,
        image: preview || ''
    };

    entry.samples = normalizeSamples(entry).concat(sample);
    entry.descriptors = entry.samples.map(item => item.descriptor);
}

function deleteSample(label, sampleId) {
    const entry = faceDB.find(item => item.label === label);
    if (!entry) return;

    entry.samples = normalizeSamples(entry).filter(sample => sample.id !== sampleId);
    entry.descriptors = entry.samples.map(sample => sample.descriptor);
    faceDB = faceDB.filter(item => item.descriptors.length > 0);
    persistAndRefresh();
    setStatus(`Deleted one photo for ${label}. Database updated live.`);
}

function syncDatabaseViews() {
    faceDB = normalizeDatabase(faceDB);
    dataEditor.value = JSON.stringify(faceDB, null, 2);
    renderThumbs();
    rebuildMatcher();
}

function persistAndRefresh() {
    syncDatabaseViews();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(faceDB));
}

function rebuildMatcher() {
    const descriptors = faceDB
        .filter(item => item.descriptors.length > 0)
        .map(item => new faceapi.LabeledFaceDescriptors(
            item.label,
            item.descriptors.map(descriptor => new Float32Array(descriptor))
        ));

    faceMatcher = descriptors.length ? new faceapi.FaceMatcher(descriptors, MATCH_THRESHOLD) : null;
}

function renderThumbs() {
    thumbs.innerHTML = '';

    faceDB.forEach(entry => {
        normalizeSamples(entry).forEach((sample, index) => {
            const card = document.createElement('div');
            card.className = 'thumb-card';

            const img = document.createElement('img');
            img.className = 'thumb';
            img.alt = entry.label;
            img.src = sample.image || makePlaceholderImage(entry.label);

            const name = document.createElement('div');
            name.className = 'thumb-name';
            name.title = entry.label;
            name.innerText = `${entry.label} #${index + 1}`;

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.title = `Delete ${entry.label} photo ${index + 1}`;
            remove.innerText = 'X';
            remove.addEventListener('click', () => deleteSample(entry.label, sample.id));

            card.append(img, name, remove);
            thumbs.appendChild(card);
        });
    });
}

function readStoredData() {
    const local = localStorage.getItem(STORAGE_KEY);
    if (!local) return [];

    try {
        return normalizeDatabase(JSON.parse(local));
    } catch (e) {
        return [];
    }
}

function normalizeDatabase(data) {
    if (!Array.isArray(data)) return [];

    return data
        .filter(item => item && item.label)
        .map(item => {
            const samples = normalizeSamples(item);
            return {
                label: String(item.label).trim(),
                descriptors: samples.map(sample => sample.descriptor),
                samples
            };
        })
        .filter(item => item.label && item.descriptors.length > 0);
}

function normalizeSamples(entry) {
    if (Array.isArray(entry.samples) && entry.samples.length) {
        return entry.samples
            .filter(sample => sample && Array.isArray(sample.descriptor))
            .map(sample => ({
                id: sample.id || createId(),
                descriptor: sample.descriptor,
                image: sample.image || ''
            }));
    }

    return (entry.descriptors || [])
        .filter(descriptor => Array.isArray(descriptor))
        .map(descriptor => ({
            id: createId(),
            descriptor,
            image: ''
        }));
}

function getRequestedName() {
    return personName.value.trim();
}

function setStatus(message) {
    statusBar.innerText = 'Status: ' + message;
}

function initSpeechVoices() {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
        availableVoices = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

function speakWelcome(label) {
    if (!window.speechSynthesis) return;

    const isChineseName = containsChinese(label);
    const msg = new SpeechSynthesisUtterance(getWelcomeText(label));
    msg.lang = isChineseName ? 'zh-CN' : 'en-US';
    msg.rate = isChineseName ? 0.92 : 1;
    msg.pitch = 1;

    const voice = pickVoice(isChineseName ? ['zh-CN', 'zh-Hans', 'zh-HK', 'zh-TW', 'zh'] : ['en-US', 'en-GB', 'en']);
    if (voice) msg.voice = voice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
}

function getWelcomeText(label) {
    return `Welcome, ${label}!`;
}

function containsChinese(value) {
    return /[\u3400-\u9fff]/.test(value);
}

function pickVoice(languageCodes) {
    if (!availableVoices.length && window.speechSynthesis) {
        availableVoices = window.speechSynthesis.getVoices();
    }

    return languageCodes
        .map(code => availableVoices.find(voice => voice.lang && voice.lang.toLowerCase().startsWith(code.toLowerCase())))
        .find(Boolean);
}

function createId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function makePlaceholderImage(label) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#20262e"/><text x="80" y="86" text-anchor="middle" font-family="Arial" font-size="18" fill="#d7e2ee">${escapeSvg(label.slice(0, 12))}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function escapeSvg(value) {
    return value.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

window.saveAndReload = () => {
    try {
        faceDB = normalizeDatabase(JSON.parse(dataEditor.value || '[]'));
        persistAndRefresh();
        setStatus('JSON applied. Database updated live.');
    } catch (e) {
        setStatus('JSON Error: ' + e.message);
    }
};

window.clearData = () => {
    if (confirm('Delete all face records?')) {
        faceDB = [];
        localStorage.removeItem(STORAGE_KEY);
        syncDatabaseViews();
        welcomeLog.innerText = 'Waiting for recognition...';
        setStatus('All face records deleted. Database updated live.');
    }
};

init();
