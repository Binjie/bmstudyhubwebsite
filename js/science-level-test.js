(function () {
  "use strict";

  const root = document.querySelector("[data-science-level-test]");
  if (!root) return;

  const STORAGE_KEY = "bmstudyhub.scienceLevelCheck.v1";
  const DATA_VERSION = 1;
  const DURATION_SECONDS = 60 * 60;
  const EXAM_SIZE = 40;

  const TOPIC_PLAN = [
    ["Scientific Investigation", 4],
    ["Cells and Life Processes", 5],
    ["Human Body Systems", 4],
    ["Ecology and Evolution", 5],
    ["Matter and Chemistry", 6],
    ["Forces and Motion", 5],
    ["Energy and Electricity", 5],
    ["Waves and Light", 3],
    ["Earth and Space Science", 3]
  ];

  let timer = null;

  function makeRng(seed) {
    let value = seed >>> 0;
    return function () {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomSeed() {
    if (window.crypto && crypto.getRandomValues) {
      const data = new Uint32Array(1);
      crypto.getRandomValues(data);
      return data[0];
    }
    return Math.floor(Math.random() * 4294967295);
  }

  function int(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function pick(rng, items) {
    return items[int(rng, 0, items.length - 1)];
  }

  function shuffle(rng, items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = int(rng, 0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function round(value, places) {
    const m = Math.pow(10, places);
    return Math.round(value * m) / m;
  }

  function math(text) {
    return "\\(" + text + "\\)";
  }

  function q(topic, skill, difficulty, type, question, answer, options, tolerance) {
    return {
      id: "",
      topic,
      skill,
      difficulty,
      type,
      question,
      answer: String(answer),
      options: options || null,
      tolerance: tolerance || 0,
      marks: difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1
    };
  }

  function buildChoice(rng, topic, skill, difficulty, question, answer, distractors) {
    const unique = [];
    [answer].concat(distractors).forEach((item) => {
      const text = String(item);
      if (!unique.includes(text)) unique.push(text);
    });
    let guard = 0;
    while (unique.length < 4 && guard < 20) {
      const fallback = "Option " + (guard + 1);
      if (!unique.includes(fallback)) unique.push(fallback);
      guard += 1;
    }
    return q(topic, skill, difficulty, "choice", question, answer, shuffle(rng, unique.slice(0, 4)));
  }

  function displayAnswer(value) {
    const text = String(value || "");
    if (/^[A-Za-z0-9+\-*/=^() .]+$/.test(text) && /[=^*/]/.test(text)) {
      return math(text.replace(/\*/g, "\\times "));
    }
    return escapeHtml(text);
  }

  const generators = {
    "Scientific Investigation": [
      (r) => buildChoice(r, "Scientific Investigation", "Variables", "easy", "In an experiment testing how fertiliser affects plant height, what is the independent variable?", "amount of fertiliser", ["plant height", "type of ruler", "final result"]),
      (r) => buildChoice(r, "Scientific Investigation", "Controls", "medium", "Why should all plants in a fertiliser experiment receive the same amount of water?", "to control another variable", ["to increase fertiliser", "to change the hypothesis", "to avoid measuring height"]),
      (r) => buildChoice(r, "Scientific Investigation", "Reliability", "medium", "Which action most improves reliability in a school science investigation?", "repeat the test and average results", ["use only one trial", "change several variables", "ignore unusual data"]),
      (r) => { const readings = [int(r, 18, 26), int(r, 18, 26), int(r, 18, 26)]; return q("Scientific Investigation", "Averaging data", "easy", "Find the mean of the readings " + readings.join(", ") + ".", round(readings.reduce((a, b) => a + b, 0) / readings.length, 1), null, 0.11); }
    ],
    "Cells and Life Processes": [
      (r) => buildChoice(r, "Cells and Life Processes", "Cell organelles", "easy", "Which cell part controls most cell activities and contains DNA?", "nucleus", ["cell wall", "chloroplast", "vacuole"]),
      (r) => buildChoice(r, "Cells and Life Processes", "Photosynthesis", "medium", "Which word equation best summarises photosynthesis?", "carbon dioxide + water -> glucose + oxygen", ["oxygen + glucose -> carbon dioxide + water", "water + oxygen -> glucose + nitrogen", "glucose -> oxygen + light"]),
      (r) => buildChoice(r, "Cells and Life Processes", "Respiration", "medium", "What is the main purpose of cellular respiration?", "release energy from glucose", ["make food using light", "store DNA", "absorb minerals"]),
      (r) => buildChoice(r, "Cells and Life Processes", "Plant and animal cells", "easy", "Which structure is found in plant cells but not animal cells?", "cell wall", ["nucleus", "cytoplasm", "cell membrane"]),
      (r) => buildChoice(r, "Cells and Life Processes", "Microscopes", "medium", "A microscope has a 10x eyepiece and a 40x objective lens. What is the total magnification?", "400x", ["50x", "40x", "100x"])
    ],
    "Human Body Systems": [
      (r) => buildChoice(r, "Human Body Systems", "Circulation", "easy", "Which organ pumps blood around the body?", "heart", ["lungs", "stomach", "kidney"]),
      (r) => buildChoice(r, "Human Body Systems", "Respiratory system", "easy", "Where does gas exchange mainly occur in the lungs?", "alveoli", ["trachea", "diaphragm", "bronchi"]),
      (r) => buildChoice(r, "Human Body Systems", "Digestive system", "medium", "Which process breaks large food molecules into smaller soluble molecules?", "digestion", ["circulation", "excretion", "ventilation"]),
      (r) => buildChoice(r, "Human Body Systems", "Homeostasis", "hard", "Sweating on a hot day mainly helps the body to:", "cool down by evaporation", ["increase body temperature", "make more glucose", "slow oxygen uptake"])
    ],
    "Ecology and Evolution": [
      (r) => buildChoice(r, "Ecology and Evolution", "Food webs", "easy", "In a food chain, what is the role of grass?", "producer", ["primary consumer", "decomposer", "predator"]),
      (r) => buildChoice(r, "Ecology and Evolution", "Energy flow", "medium", "Why is less energy available at higher trophic levels?", "energy is lost as heat and movement", ["energy is created by predators", "plants absorb animals", "decomposers stop energy flow"]),
      (r) => buildChoice(r, "Ecology and Evolution", "Adaptation", "medium", "A thick waxy leaf surface helps a plant mainly by:", "reducing water loss", ["increasing animal pollination", "making soil minerals", "stopping photosynthesis"]),
      (r) => buildChoice(r, "Ecology and Evolution", "Natural selection", "hard", "Natural selection is most likely when individuals in a population:", "vary in traits that affect survival and reproduction", ["are all genetically identical", "never compete", "cannot pass traits to offspring"]),
      (r) => buildChoice(r, "Ecology and Evolution", "Human impacts", "medium", "Adding too much fertiliser to waterways can cause algal blooms because it increases:", "nutrients", ["oxygen", "salinity", "sunlight"])
    ],
    "Matter and Chemistry": [
      (r) => buildChoice(r, "Matter and Chemistry", "Particles", "easy", "In a solid, particles are usually:", "closely packed and vibrating", ["far apart and moving freely", "destroyed", "not moving at all"]),
      (r) => buildChoice(r, "Matter and Chemistry", "States of matter", "easy", "Changing from liquid to gas is called:", "evaporation", ["freezing", "condensation", "deposition"]),
      (r) => buildChoice(r, "Matter and Chemistry", "Atoms", "medium", "Which subatomic particle has a negative charge?", "electron", ["proton", "neutron", "nucleus"]),
      (r) => buildChoice(r, "Matter and Chemistry", "Acids and bases", "medium", "A solution with pH 3 is best described as:", "acidic", ["neutral", "alkaline", "pure water"]),
      (r) => buildChoice(r, "Matter and Chemistry", "Chemical reactions", "medium", "Which sign suggests a chemical reaction has occurred?", "a gas is produced", ["a solid is cut in half", "water is poured", "sand is mixed with salt"]),
      (r) => { const protons = int(r, 3, 18), neutrons = int(r, 3, 22); return q("Matter and Chemistry", "Mass number", "medium", "An atom has " + protons + " protons and " + neutrons + " neutrons. What is its mass number?", protons + neutrons); }
    ],
    "Forces and Motion": [
      (r) => { const mass = int(r, 2, 12), acceleration = int(r, 2, 8); return q("Forces and Motion", "Newton's second law", "medium", "Find the force when mass is " + mass + " kg and acceleration is " + acceleration + " m/s^2. Use " + math("F = ma") + ".", mass * acceleration); },
      (r) => { const distance = int(r, 20, 180), time = int(r, 2, 12); return q("Forces and Motion", "Speed", "easy", "An object travels " + distance + " m in " + time + " s. Find its average speed in m/s.", round(distance / time, 2), null, 0.03); },
      (r) => buildChoice(r, "Forces and Motion", "Balanced forces", "medium", "If forces on an object are balanced, the object:", "has no change in motion", ["must speed up", "must stop instantly", "has no mass"]),
      (r) => buildChoice(r, "Forces and Motion", "Gravity", "easy", "Weight is the force caused by:", "gravity acting on mass", ["friction acting on air", "sound waves", "magnetism only"]),
      (r) => { const force = int(r, 20, 120), area = int(r, 2, 12); return q("Forces and Motion", "Pressure", "hard", "Find pressure when force is " + force + " N and area is " + area + " m^2. Use " + math("P = F/A") + ".", round(force / area, 2), null, 0.03); }
    ],
    "Energy and Electricity": [
      (r) => buildChoice(r, "Energy and Electricity", "Energy transfers", "easy", "A battery-powered torch mainly changes chemical energy into:", "light and heat energy", ["sound only", "gravitational energy", "nuclear energy"]),
      (r) => { const voltage = int(r, 3, 24), current = int(r, 1, 8); return q("Energy and Electricity", "Electrical power", "medium", "Find power when voltage is " + voltage + " V and current is " + current + " A. Use " + math("P = VI") + ".", voltage * current); },
      (r) => { const voltage = int(r, 6, 24), resistance = pick(r, [2, 3, 4, 6, 8, 12]); return q("Energy and Electricity", "Ohm's law", "medium", "Find current when voltage is " + voltage + " V and resistance is " + resistance + " ohms. Use " + math("I = V/R") + ".", round(voltage / resistance, 2), null, 0.03); },
      (r) => buildChoice(r, "Energy and Electricity", "Circuits", "medium", "In a series circuit, adding more identical bulbs usually makes each bulb:", "dimmer", ["brighter", "unchanged", "turn into a switch"]),
      (r) => buildChoice(r, "Energy and Electricity", "Heat transfer", "easy", "Heat transfer through direct contact is called:", "conduction", ["radiation", "reflection", "evaporation"])
    ],
    "Waves and Light": [
      (r) => buildChoice(r, "Waves and Light", "Reflection", "easy", "When light bounces off a mirror, this is called:", "reflection", ["refraction", "diffusion", "absorption only"]),
      (r) => buildChoice(r, "Waves and Light", "Refraction", "medium", "Light changes direction when it enters water from air because it:", "changes speed", ["stops moving", "becomes sound", "loses all energy"]),
      (r) => { const frequency = int(r, 2, 12), wavelength = int(r, 2, 8); return q("Waves and Light", "Wave speed", "medium", "Find wave speed if frequency is " + frequency + " Hz and wavelength is " + wavelength + " m. Use " + math("v = f\\lambda") + ".", frequency * wavelength); }
    ],
    "Earth and Space Science": [
      (r) => buildChoice(r, "Earth and Space Science", "Rock cycle", "medium", "Sedimentary rock is often formed by:", "compaction and cementation of sediments", ["melting in the Sun", "evaporation of metal", "photosynthesis"]),
      (r) => buildChoice(r, "Earth and Space Science", "Seasons", "medium", "Seasons on Earth are mainly caused by:", "Earth's tilted axis as it orbits the Sun", ["Earth moving closer to the Sun in summer", "the Moon blocking sunlight", "daily rotation only"]),
      (r) => buildChoice(r, "Earth and Space Science", "Plate tectonics", "medium", "Earthquakes are most common near:", "plate boundaries", ["the centre of large oceans only", "cloud layers", "the Moon"])
    ]
  };

  let state = loadState();
  let needsResumeChoice = state.status === "active" && state.startedAt && remainingSeconds() > 0;

  function makeExam() {
    const seed = randomSeed();
    const rng = makeRng(seed);
    const questions = [];
    TOPIC_PLAN.forEach(([topic, count]) => {
      const bank = shuffle(rng, generators[topic]);
      for (let i = 0; i < count; i += 1) {
        const item = bank[i % bank.length](rng);
        item.id = `${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}-${seed}-${questions.length}`;
        questions.push(item);
      }
    });
    return {
      version: DATA_VERSION,
      seed,
      examId: "SLC-" + seed.toString(16).toUpperCase(),
      status: "intro",
      startedAt: null,
      submittedAt: null,
      answers: {},
      questions: shuffle(rng, questions).slice(0, EXAM_SIZE),
      report: null
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const validStatus = ["intro", "active", "submitted", "review"].includes(saved && saved.status);
      const validReport = !["submitted", "review"].includes(saved && saved.status) || saved.report;
      if (saved && saved.version === DATA_VERSION && Array.isArray(saved.questions) && saved.questions.length && validStatus && validReport) return saved;
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
    localStorage.removeItem(STORAGE_KEY);
    return makeExam();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function startExam() {
    needsResumeChoice = false;
    state.status = "active";
    state.startedAt = Date.now();
    state.submittedAt = null;
    state.answers = {};
    state.report = null;
    saveState();
    render();
  }

  function newExam() {
    needsResumeChoice = false;
    state = makeExam();
    saveState();
    render();
  }

  function continueExam() {
    needsResumeChoice = false;
    render();
  }

  function startNewExam() {
    needsResumeChoice = false;
    state = makeExam();
    startExam();
  }

  function remainingSeconds() {
    if (!state.startedAt) return DURATION_SECONDS;
    return Math.max(0, Math.ceil((state.startedAt + DURATION_SECONDS * 1000 - Date.now()) / 1000));
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function normalise(text) {
    return String(text || "").trim().toLowerCase().replace(/\s+/g, "").replace(/->/g, "=").replace(/×/g, "x");
  }

  function parseNumber(text) {
    const value = Number(String(text || "").trim());
    return Number.isNaN(value) ? null : value;
  }

  function isCorrect(question, answer) {
    const expected = normalise(question.answer);
    const actual = normalise(answer);
    if (!actual) return false;
    if (actual === expected) return true;
    const expectedNumber = parseNumber(question.answer);
    const actualNumber = parseNumber(answer);
    if (expectedNumber !== null && actualNumber !== null) {
      return Math.abs(expectedNumber - actualNumber) <= (question.tolerance || 0.001);
    }
    return false;
  }

  function submitExam() {
    const topicMap = {};
    let earned = 0;
    let total = 0;
    const marked = state.questions.map((question) => {
      const answer = state.answers[question.id] || "";
      const correct = isCorrect(question, answer);
      earned += correct ? question.marks : 0;
      total += question.marks;
      if (!topicMap[question.topic]) topicMap[question.topic] = { topic: question.topic, earned: 0, total: 0, skills: {} };
      topicMap[question.topic].earned += correct ? question.marks : 0;
      topicMap[question.topic].total += question.marks;
      if (!topicMap[question.topic].skills[question.skill]) topicMap[question.topic].skills[question.skill] = { earned: 0, total: 0 };
      topicMap[question.topic].skills[question.skill].earned += correct ? question.marks : 0;
      topicMap[question.topic].skills[question.skill].total += question.marks;
      return { id: question.id, correct, answer, expected: question.answer };
    });
    const topics = Object.values(topicMap).map((item) => ({
      topic: item.topic,
      earned: item.earned,
      total: item.total,
      percent: Math.round((item.earned / item.total) * 100),
      skills: Object.entries(item.skills).map(([skill, score]) => ({
        skill,
        percent: Math.round((score.earned / score.total) * 100)
      }))
    })).sort((a, b) => b.percent - a.percent);
    state.status = "submitted";
    state.submittedAt = Date.now();
    state.report = {
      earned,
      total,
      percent: Math.round((earned / total) * 100),
      marked,
      topics
    };
    saveState();
    render();
  }

  function levelLabel(percent) {
    if (percent >= 85) return "Excellent";
    if (percent >= 70) return "Strong";
    if (percent >= 50) return "Developing";
    return "Needs support";
  }

  function introView() {
    root.innerHTML = `
      <section class="math-test-panel">
        <div class="math-test-intro">
          <p class="eyebrow">Generated Diagnostic</p>
          <h2>Science Level Check</h2>
          <p>This 60-minute test generates a fresh paper for each browser and each new attempt. It covers broad New Zealand and Australian school science up to high school level.</p>
          <p class="math-test-paper-id">Current paper: <strong>${state.examId}</strong></p>
          <div class="math-test-stats" aria-label="Test summary">
            <span><strong>40</strong> questions</span>
            <span><strong>60</strong> minutes</span>
            <span><strong>9</strong> topic areas</span>
            <span><strong>Local</strong> autosave</span>
          </div>
          <div class="math-test-actions">
            <button class="math-test-primary" type="button" data-action="start">Start Test</button>
            <button class="math-test-secondary" type="button" data-action="new">Generate New Test</button>
          </div>
        </div>
      </section>
    `;
  }

  function activeView() {
    const answered = Object.values(state.answers).filter(Boolean).length;
    root.innerHTML = `
      <div class="math-test-exam">
        <div class="math-test-toolbar">
          <div>
            <span class="math-test-kicker">Exam ${state.examId}</span>
            <strong>${answered}/${state.questions.length} answered</strong>
          </div>
          <div class="math-test-timer" data-timer>${formatTime(remainingSeconds())}</div>
          <button class="math-test-submit" type="button" data-action="submit">Submit</button>
        </div>
        <ol class="math-test-questions">
          ${state.questions.map(questionView).join("")}
        </ol>
      </div>
    `;
    startTimer();
  }

  function resumeView() {
    const answered = Object.values(state.answers || {}).filter(Boolean).length;
    root.innerHTML = `
      <section class="math-test-panel math-test-resume">
        <div class="math-test-intro">
          <p class="eyebrow">Unfinished Test</p>
          <h2>Continue your saved paper?</h2>
          <p>A previous science test is still in progress on this browser. Your answers and remaining time were saved locally.</p>
          <div class="math-test-stats" aria-label="Saved test summary">
            <span><strong>${answered}/${state.questions.length}</strong> answered</span>
            <span><strong>${formatTime(remainingSeconds())}</strong> left</span>
            <span><strong>${state.examId}</strong> paper</span>
            <span><strong>Local</strong> saved</span>
          </div>
          <div class="math-test-actions">
            <button class="math-test-primary" type="button" data-action="continue">Continue Test</button>
            <button class="math-test-secondary" type="button" data-action="start-new">Start New Test</button>
          </div>
        </div>
      </section>
    `;
  }

  function questionView(question, index) {
    const saved = state.answers[question.id] || "";
    const input = question.type === "choice"
      ? `<div class="math-test-options">${question.options.map((option) => `
          <label>
            <input type="radio" name="${question.id}" value="${escapeHtml(option)}" ${saved === option ? "checked" : ""}>
            <span>${displayAnswer(option)}</span>
          </label>`).join("")}</div>`
      : `<input class="math-test-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeHtml(saved)}" placeholder="Your answer">`;
    return `
      <li class="math-test-question" data-question-id="${question.id}">
        <div class="math-test-question-top">
          <span>Question ${index + 1}</span>
          <span>${question.topic} / ${question.skill}</span>
          <span>${question.marks} mark${question.marks > 1 ? "s" : ""}</span>
        </div>
        <p>${escapeHtml(question.question)}</p>
        ${input}
      </li>
    `;
  }

  function reportView() {
    const report = state.report;
    const strongest = report.topics.filter((t) => t.percent >= 70).slice(0, 3);
    const weakest = report.topics.slice().sort((a, b) => a.percent - b.percent).slice(0, 4);
    root.innerHTML = `
      <div class="math-test-report">
        <section class="math-test-score">
          <p class="eyebrow">Marked Report</p>
          <h2>${report.earned}/${report.total} marks</h2>
          <div class="math-test-percent">${report.percent}%</div>
          <p class="math-test-level">${levelLabel(report.percent)}</p>
          <div class="math-test-actions">
            <button class="math-test-primary" type="button" data-action="new">Start A New Exam</button>
            <button class="math-test-secondary" type="button" data-action="review">Review Answers</button>
          </div>
        </section>
        <section class="math-test-report-grid">
          <div>
            <h3>Strong Areas</h3>
            ${strongest.length ? strongest.map((t) => `<p><strong>${t.topic}</strong>: ${t.percent}%</p>`).join("") : "<p>No strong area yet. Build fluency first, then retest.</p>"}
          </div>
          <div>
            <h3>Needs Work</h3>
            ${weakest.map((t) => `<p><strong>${t.topic}</strong>: ${t.percent}%</p>`).join("")}
          </div>
        </section>
        <section class="math-test-topic-report">
          <h3>Topic Breakdown</h3>
          ${report.topics.map((topic) => `
            <div class="math-test-topic-row">
              <span>${topic.topic}</span>
              <div><i style="width:${topic.percent}%"></i></div>
              <strong>${topic.earned}/${topic.total}</strong>
            </div>`).join("")}
        </section>
        <section class="math-test-advice">
          <h3>Study Focus</h3>
          <p>Start with the lowest topic scores, especially individual skills below 60%. Review core vocabulary, draw diagrams, practise interpreting data, and retest with a new generated paper after revision.</p>
          <p><strong>Priority skills:</strong> ${weakest.flatMap((topic) => topic.skills.filter((skill) => skill.percent < 60).map((skill) => skill.skill)).slice(0, 6).join(", ") || "keep consolidating all areas"}.</p>
        </section>
      </div>
    `;
  }

  function reviewView() {
    root.innerHTML = `
      <div class="math-test-exam">
        <div class="math-test-toolbar">
          <div>
            <span class="math-test-kicker">Review ${state.examId}</span>
            <strong>${state.report.earned}/${state.report.total} marks</strong>
          </div>
          <button class="math-test-secondary" type="button" data-action="results">Back To Report</button>
        </div>
        <ol class="math-test-questions">
          ${state.questions.map(reviewQuestionView).join("")}
        </ol>
      </div>
    `;
  }

  function reviewQuestionView(question, index) {
    const marked = state.report.marked.find((item) => item.id === question.id);
    return `
      <li class="math-test-question ${marked.correct ? "is-correct" : "is-wrong"}">
        <div class="math-test-question-top">
          <span>Question ${index + 1}</span>
          <span>${question.topic} / ${question.skill}</span>
          <span>${marked.correct ? "Correct" : "Check"}</span>
        </div>
        <p>${escapeHtml(question.question)}</p>
        <p><strong>Your answer:</strong> ${escapeHtml(marked.answer || "No answer")}</p>
        <p><strong>Expected answer:</strong> ${displayAnswer(marked.expected)}</p>
      </li>
    `;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      const left = remainingSeconds();
      const timerEl = root.querySelector("[data-timer]");
      if (timerEl) timerEl.textContent = formatTime(left);
      if (left <= 0 && state.status === "active") {
        clearInterval(timer);
        submitExam();
      }
    }, 1000);
  }

  function typesetMath() {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([root]).catch(() => {});
    }
  }

  function render() {
    clearInterval(timer);
    if (state.status === "active" && remainingSeconds() <= 0) {
      submitExam();
      return;
    }
    if (needsResumeChoice) resumeView();
    else if (state.status === "active") activeView();
    else if (state.status === "submitted") reportView();
    else if (state.status === "review") reviewView();
    else introView();
    typesetMath();
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "start") startExam();
    if (action === "new") newExam();
    if (action === "start-new") startNewExam();
    if (action === "continue") continueExam();
    if (action === "submit" && window.confirm("Submit this test for marking?")) submitExam();
    if (action === "review") {
      state.status = "review";
      saveState();
      render();
    }
    if (action === "results") {
      state.status = "submitted";
      saveState();
      render();
    }
  });

  root.addEventListener("input", (event) => {
    const questionEl = event.target.closest("[data-question-id]");
    if (!questionEl || state.status !== "active") return;
    state.answers[questionEl.dataset.questionId] = event.target.value;
    saveState();
    const answered = Object.values(state.answers).filter(Boolean).length;
    const toolbar = root.querySelector(".math-test-toolbar strong");
    if (toolbar) toolbar.textContent = `${answered}/${state.questions.length} answered`;
  });

  root.addEventListener("change", (event) => {
    const questionEl = event.target.closest("[data-question-id]");
    if (!questionEl || state.status !== "active") return;
    state.answers[questionEl.dataset.questionId] = event.target.value;
    saveState();
  });

  saveState();
  render();
})();
