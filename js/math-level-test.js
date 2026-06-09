(function () {
  "use strict";

  const root = document.querySelector("[data-math-level-test]");
  if (!root) return;

  const STORAGE_KEY = "bmstudyhub.mathLevelCheck.v1";
  const DATA_VERSION = 2;
  const DURATION_SECONDS = 60 * 60;
  const EXAM_SIZE = 40;

  const TOPIC_PLAN = [
    ["Number", 5],
    ["Algebra", 7],
    ["Functions and Graphs", 4],
    ["Geometry", 5],
    ["Measurement", 4],
    ["Trigonometry", 3],
    ["Probability", 3],
    ["Statistics", 4],
    ["Financial Maths", 3],
    ["Problem Solving", 2]
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

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  function frac(n, d) {
    const g = gcd(n, d);
    const sign = n * d < 0 ? "-" : "";
    n = Math.abs(n / g);
    d = Math.abs(d / g);
    return d === 1 ? sign + n : sign + n + "/" + d;
  }

  function round(value, places) {
    const m = Math.pow(10, places);
    return Math.round(value * m) / m;
  }

  function money(value) {
    return "$" + value.toFixed(2);
  }

  function math(text) {
    return "\\(" + text + "\\)";
  }

  function signed(value) {
    return value >= 0 ? "+ " + value : "- " + Math.abs(value);
  }

  function signedConstant(value) {
    return value === 0 ? "" : " " + signed(value);
  }

  function signedTight(value) {
    return value >= 0 ? "+" + value : "-" + Math.abs(value);
  }

  function variableTerm(coefficient, variable) {
    if (coefficient === 1) return variable;
    if (coefficient === -1) return "-" + variable;
    return `${coefficient}${variable}`;
  }

  function nonZeroInt(rng, min, max) {
    let value = 0;
    while (value === 0) value = int(rng, min, max);
    return value;
  }

  function fracText(n, d) {
    return "\\frac{" + n + "}{" + d + "}";
  }

  function sqrtText(n) {
    return "\\sqrt{" + n + "}";
  }

  function displayAnswer(value) {
    const text = String(value || "");
    const sqrtMatch = text.match(/^(-?\d*)sqrt\(([^)]+)\)$/);
    if (sqrtMatch) {
      const coefficient = sqrtMatch[1] && sqrtMatch[1] !== "1" ? sqrtMatch[1] : "";
      return math(`${coefficient}${sqrtText(sqrtMatch[2])}`);
    }
    const fractionMatch = text.match(/^(-?\d+)\/(-?\d+)$/);
    if (fractionMatch) return math(fracText(fractionMatch[1], fractionMatch[2]));
    if (/[xyabk]|\^/.test(text)) {
      return math(text.replace(/\*/g, "\\times "));
    }
    return escapeHtml(text);
  }

  function countFromPercent(rng, pct, min, max) {
    const step = 100 / gcd(pct, 100);
    return step * int(rng, Math.ceil(min / step), Math.floor(max / step));
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
    const numericAnswer = Number(answer);
    let guard = 0;
    while (unique.length < 4 && guard < 24) {
      const fallback = Number.isFinite(numericAnswer)
        ? String(numericAnswer + int(rng, -12, 12))
        : "None of these " + (guard + 1);
      if (!unique.includes(fallback)) unique.push(fallback);
      guard += 1;
    }
    return q(topic, skill, difficulty, "choice", question, answer, shuffle(rng, unique.slice(0, 4)));
  }

  const generators = {
    Number: [
      (r) => { const a = int(r, 24, 96), b = int(r, 12, 48), c = int(r, 6, 35); return buildChoice(r, "Number", "Integer operations", "easy", `Calculate ${a} - ${b} + ${c}.`, a - b + c, [a - b, a + b, b - a]); },
      (r) => { const a = int(r, 2, 9), b = int(r, 2, 9), c = int(r, 2, 9), d = int(r, 2, 9); return q("Number", "Fraction addition", "medium", "fill", `Calculate ${math(`${fracText(a, b)} + ${fracText(c, d)}`)}. Give your answer as a simplified fraction.`, frac(a * d + c * b, b * d)); },
      (r) => { const p = pick(r, [12, 15, 18, 20, 25, 30, 35, 40]), n = int(r, 40, 260); return buildChoice(r, "Number", "Percentages", "easy", `What is ${p}% of ${n}?`, round(n * p / 100, 2), [round(n * (p + 5) / 100, 2), round(n / p, 2), round(n * p / 10, 2)]); },
      (r) => { const a = int(r, 2, 12), b = int(r, 2, 4), c = int(r, 1, 3); return buildChoice(r, "Number", "Indices", "medium", `Simplify ${math(`${a}^{${b}} \\times ${a}^{${c}}`)} as a single power.`, `${a}^${b + c}`, [`${a}^${b}`, `${a * a}^${b}`, `${a}^${b - 1}`]); },
      (r) => { const a = int(r, 2, 12), b = int(r, 2, 12); return q("Number", "Surds", "medium", "fill", `Simplify ${math(sqrtText(a * a * b))} in the form ${math(`k${sqrtText("n")}`)}.`, `${a}sqrt(${b})`); },
      (r) => { const a = int(r, 2, 12), b = int(r, 2, 12), c = int(r, 2, 8); return q("Number", "Order of operations", "easy", "fill", `Calculate ${math(`${a} + ${b} \\times ${c}`)}.`, a + b * c); }
    ],
    Algebra: [
      (r) => { const a = int(r, 2, 9), x = int(r, -8, 12), b = int(r, -12, 18); return q("Algebra", "Linear equations", "easy", "fill", `Solve for ${math("x")}: ${math(`${a}x${signedConstant(b)} = ${a * x + b}`)}.`, x); },
      (r) => { const a = int(r, 2, 8), b = int(r, 1, 9), c = int(r, 2, 7), d = int(r, 1, 9); return buildChoice(r, "Algebra", "Expanding brackets", "medium", `Expand ${math(`(${a}x + ${b})(${c}x + ${d})`)}.`, `${a * c}x^2 + ${a * d + b * c}x + ${b * d}`, [`${a * c}x^2 + ${a * d}x + ${b * d}`, `${a + c}x^2 + ${b + d}`, `${a * c}x^2 + ${b * d}`]); },
      (r) => { const m = nonZeroInt(r, -6, 6), b = int(r, -10, 10); return buildChoice(r, "Algebra", "Linear graphs", "medium", `For ${math(`y = ${variableTerm(m, "x")}${signedConstant(b)}`)}, what is the gradient?`, m, [b, -m, m + b]); },
      (r) => { const r1 = int(r, -8, 4), r2 = int(r, 1, 9), bx = -(r1 + r2), c = r1 * r2, middle = bx === 0 ? "" : ` ${signed(bx)}x`; return buildChoice(r, "Algebra", "Quadratics", "hard", `What are the solutions of ${math(`x^2${middle}${signedConstant(c)} = 0`)}?`, `${r1}, ${r2}`, [`${-r1}, ${-r2}`, `${r1 + r2}, ${r1 * r2}`, `${r1 - 1}, ${r2 + 1}`]); },
      (r) => { const x = int(r, 1, 9), y = int(r, 1, 9), a = int(r, 2, 8), b = int(r, 2, 8), c = int(r, 1, 7), d = int(r, 1, 7); return q("Algebra", "Simultaneous equations", "hard", "fill", `Solve for ${math("x")}: ${math(`${a}x + ${b}y = ${a * x + b * y}`)}, and ${math(`${c}x - ${d}y = ${c * x - d * y}`)}.`, x); },
      (r) => { const a = int(r, 2, 12), b = int(r, 2, 12), n = int(r, 2, 6); return q("Algebra", "Substitution", "easy", "fill", `If ${math(`a = ${a}`)} and ${math(`b = ${b}`)}, find ${math(`${n}a + 2b`)}.`, n * a + 2 * b); },
      (r) => { const a = int(r, 2, 9), b = int(r, 1, 9); return buildChoice(r, "Algebra", "Factorising", "medium", `Factorise ${math(`${a}x + ${a * b}`)}.`, `${a}(x + ${b})`, [`${a}x(${b})`, `x(${a} + ${b})`, `${b}(x + ${a})`]); }
    ],
    "Functions and Graphs": [
      (r) => { const m = nonZeroInt(r, -5, 5), b = int(r, -8, 8), x = int(r, -4, 7); return q("Functions and Graphs", "Function values", "easy", "fill", `If ${math(`f(x) = ${variableTerm(m, "x")}${signedConstant(b)}`)}, find ${math(`f(${x})`)}.`, m * x + b); },
      (r) => { const a = int(r, 1, 4), h = nonZeroInt(r, -5, 5), k = int(r, -6, 6), lead = a === 1 ? "" : a; return buildChoice(r, "Functions and Graphs", "Quadratic vertex", "hard", `The vertex of ${math(`y = ${lead}(x ${signed(-h)})^2${signedConstant(k)}`)} is:`, `(${h}, ${k})`, [`(${-h}, ${k})`, `(${h}, ${-k})`, `(${a}, ${k})`]); },
      (r) => { const a = int(r, 2, 9), d = int(r, -5, 9) || 4, n = int(r, 5, 12); return q("Functions and Graphs", "Sequences", "medium", "fill", `The sequence starts ${a}, ${a + d}, ${a + 2 * d}, ... Find term ${n}.`, a + (n - 1) * d); },
      (r) => { const m = int(r, 1, 7), b = int(r, -10, 10); return q("Functions and Graphs", "Intercepts", "medium", "fill", `Find the ${math("y")}-intercept of ${math(`y = ${variableTerm(m, "x")}${signedConstant(b)}`)}.`, b); }
    ],
    Geometry: [
      (r) => { const a = int(r, 25, 85), b = int(r, 25, 85); return q("Geometry", "Triangle angles", "easy", "fill", `Two angles in a triangle are ${a} degrees and ${b} degrees. Find the third angle.`, 180 - a - b); },
      (r) => { const rds = int(r, 3, 12); return q("Geometry", "Circle area", "medium", "fill", `A circle has radius ${rds} cm. Find its area to 1 decimal place.`, round(Math.PI * rds * rds, 1), null, 0.12); },
      (r) => { const a = int(r, 3, 14), b = int(r, 3, 14); return q("Geometry", "Pythagoras", "medium", "fill", `A right triangle has shorter sides ${a} cm and ${b} cm. Find the hypotenuse to 2 decimal places.`, round(Math.sqrt(a * a + b * b), 2), null, 0.03); },
      (r) => { const scale = int(r, 2, 6), side = int(r, 3, 12); return q("Geometry", "Similarity", "medium", "fill", `A shape is enlarged by scale factor ${scale}. If one original side is ${side} cm, what is the matching new side?`, scale * side); },
      (r) => { const n = int(r, 5, 12); return buildChoice(r, "Geometry", "Polygons", "hard", `What is the sum of the interior angles of a ${n}-sided polygon?`, (n - 2) * 180, [n * 180, (n - 1) * 180, (n - 2) * 90]); }
    ],
    Measurement: [
      (r) => { const km = int(r, 2, 18), m = int(r, 100, 900); return q("Measurement", "Metric conversion", "easy", "fill", `Convert ${km}.${m} km to metres.`, km * 1000 + m); },
      (r) => { const l = int(r, 5, 24), w = int(r, 4, 18), h = int(r, 3, 15); return q("Measurement", "Volume", "easy", "fill", `Find the volume of a rectangular prism ${l} cm by ${w} cm by ${h} cm.`, l * w * h); },
      (r) => { const speed = int(r, 40, 110), time = int(r, 2, 6); return q("Measurement", "Speed distance time", "medium", "fill", `A car travels at ${speed} km/h for ${time} hours. How far does it travel?`, speed * time); },
      (r) => { const area = int(r, 24, 160), base = pick(r, [4, 5, 6, 8, 10]); return q("Measurement", "Triangle area", "medium", "fill", `A triangle has area ${math(`${area}\\text{ cm}^2`)} and base ${base} cm. Find its height.`, round((2 * area) / base, 2), null, 0.03); }
    ],
    Trigonometry: [
      (r) => { const angle = pick(r, [25, 30, 35, 40, 45, 50, 60]), adj = int(r, 5, 22); return q("Trigonometry", "Right triangle tangent", "medium", "fill", `In a right triangle, an angle is ${angle} degrees and the adjacent side is ${adj} cm. Find the opposite side to 1 decimal place.`, round(Math.tan(angle * Math.PI / 180) * adj, 1), null, 0.12); },
      (r) => { const angle = pick(r, [25, 30, 35, 40, 45, 50, 60]), hyp = int(r, 8, 30); return q("Trigonometry", "Right triangle sine", "medium", "fill", `In a right triangle, an angle is ${angle} degrees and the hypotenuse is ${hyp} cm. Find the opposite side to 1 decimal place.`, round(Math.sin(angle * Math.PI / 180) * hyp, 1), null, 0.12); },
      (r) => { const opp = int(r, 4, 18), adj = int(r, 5, 20); return q("Trigonometry", "Finding an angle", "hard", "fill", `In a right triangle, the opposite side is ${opp} cm and the adjacent side is ${adj} cm. Find the angle to the nearest degree.`, Math.round(Math.atan(opp / adj) * 180 / Math.PI), null, 1); }
    ],
    Probability: [
      (r) => { const red = int(r, 2, 9), blue = int(r, 2, 9); return q("Probability", "Simple probability", "easy", "fill", `A bag has ${red} red counters and ${blue} blue counters. What is P(red)? Give a simplified fraction.`, frac(red, red + blue)); },
      (r) => { const sides = pick(r, [4, 6, 8, 10, 12]), target = int(r, 1, sides); return q("Probability", "Complement", "easy", "fill", `A fair ${sides}-sided die is rolled. What is the probability of not rolling ${target}? Give a simplified fraction.`, frac(sides - 1, sides)); },
      (r) => { const a = int(r, 2, 5), b = int(r, 6, 12), c = int(r, 2, 5), d = int(r, 6, 12); return q("Probability", "Independent events", "medium", "fill", `Event A has probability ${a}/${b}. Event B has probability ${c}/${d}. If independent, find P(A and B) as a simplified fraction.`, frac(a * c, b * d)); }
    ],
    Statistics: [
      (r) => { const nums = shuffle(r, [int(r, 4, 18), int(r, 5, 20), int(r, 8, 25), int(r, 10, 28), int(r, 12, 30)]); return q("Statistics", "Mean", "easy", "fill", `Find the mean of ${nums.join(", ")}.`, round(nums.reduce((a, b) => a + b, 0) / nums.length, 2), null, 0.03); },
      (r) => { const nums = shuffle(r, [int(r, 1, 8), int(r, 9, 15), int(r, 16, 22), int(r, 23, 30), int(r, 31, 40)]); const sorted = nums.slice().sort((a, b) => a - b); return q("Statistics", "Median", "easy", "fill", `Find the median of ${nums.join(", ")}.`, sorted[2]); },
      (r) => { const nums = [int(r, 4, 9), int(r, 10, 17), int(r, 18, 25), int(r, 26, 35)]; return q("Statistics", "Range", "easy", "fill", `Find the range of ${nums.join(", ")}.`, Math.max(...nums) - Math.min(...nums)); },
      (r) => { const pct = pick(r, [20, 25, 30, 40, 60, 75]), total = countFromPercent(r, pct, 40, 160); return q("Statistics", "Interpreting percentages", "medium", "fill", `${pct}% of ${total} surveyed students chose maths. How many students is that?`, total * pct / 100); }
    ],
    "Financial Maths": [
      (r) => { const price = int(r, 40, 240), pct = pick(r, [10, 15, 20, 25, 30]); return q("Financial Maths", "Discounts", "easy", "fill", `An item costs ${money(price)} and is discounted by ${pct}%. What is the sale price?`, round(price * (1 - pct / 100), 2), null, 0.03); },
      (r) => { const p = int(r, 200, 2000), rate = pick(r, [3, 4, 5, 6, 7]), years = int(r, 1, 5); return q("Financial Maths", "Simple interest", "medium", "fill", `Find the simple interest on ${money(p)} at ${rate}% per year for ${years} years.`, round(p * rate * years / 100, 2), null, 0.03); },
      (r) => { const ex = pick(r, [0.91, 0.93, 0.95, 1.08, 1.1]), amount = int(r, 50, 500); return q("Financial Maths", "Exchange rates", "medium", "fill", `Using 1 NZD = ${ex} AUD, convert NZD ${amount} to AUD.`, round(amount * ex, 2), null, 0.03); }
    ],
    "Problem Solving": [
      (r) => { const adults = int(r, 2, 8), children = int(r, 3, 16), adultCost = int(r, 12, 28), childCost = int(r, 6, 15); return q("Problem Solving", "Multi-step cost", "medium", "fill", `${adults} adults and ${children} children visit a museum. Adult tickets cost ${money(adultCost)} and child tickets cost ${money(childCost)}. Find the total cost.`, adults * adultCost + children * childCost); },
      (r) => { const start = int(r, 12, 40), add = int(r, 3, 12), weeks = int(r, 5, 14); return q("Problem Solving", "Linear pattern application", "medium", "fill", `A student saves ${money(start)} first, then adds ${money(add)} each week. How much is saved after ${weeks} weeks in total?`, start + add * weeks); }
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
      examId: "MLC-" + seed.toString(16).toUpperCase(),
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
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\$/g, "");
  }

  function parseFraction(text) {
    const value = normalise(text);
    if (/^-?\d+\/-?\d+$/.test(value)) {
      const parts = value.split("/").map(Number);
      if (parts[1] !== 0) return parts[0] / parts[1];
    }
    const numeric = Number(value.replace("%", ""));
    if (!Number.isNaN(numeric)) return value.includes("%") ? numeric / 100 : numeric;
    return null;
  }

  function isCorrect(question, answer) {
    const expected = normalise(question.answer);
    const actual = normalise(answer);
    if (!actual) return false;
    if (actual === expected) return true;
    const expectedNumber = parseFraction(expected);
    const actualNumber = parseFraction(actual);
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
          <h2>Mathematics Level Check</h2>
          <p>This 60-minute test generates a fresh paper for each browser and each new attempt. It covers broad New Zealand and Australian school mathematics up to high school level.</p>
          <p class="math-test-paper-id">Current paper: <strong>${state.examId}</strong></p>
          <div class="math-test-stats" aria-label="Test summary">
            <span><strong>40</strong> questions</span>
            <span><strong>60</strong> minutes</span>
            <span><strong>10</strong> topic areas</span>
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
          <p>A previous test is still in progress on this browser. Your answers and remaining time were saved locally.</p>
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
          <p>Start with the lowest topic scores, especially individual skills below 60%. Revisit worked examples, practise short mixed sets, and retest with a new generated paper after revision.</p>
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
