/* =====================================================
  DOM references
===================================================== */

const graph = document.getElementById("graph");
const svg = document.getElementById("links");
const completionLabel = document.getElementById("completion");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

/* =====================================================
  LocalStorage
===================================================== */

const STORAGE_KEY = "digivolution-progress";
let completed = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

/* =====================================================
  UI state
===================================================== */

let expanded = {};
let ignoreNextTap = false;
let lineageColors = {};

/* =====================================================
  Reverse graph (parents)
===================================================== */

const PARENTS = {};

Object.entries(DIGIMONS).forEach(([id, d]) => {
  d.evolvesTo.forEach(child => {
    if (!PARENTS[child]) PARENTS[child] = [];
    PARENTS[child].push(id);
  });
});

/* =====================================================
  Helpers
===================================================== */

function getRoots() {
  const children = new Set();
  Object.values(DIGIMONS).forEach(d =>
    d.evolvesTo.forEach(id => children.add(id))
  );
  return Object.keys(DIGIMONS).filter(id => !children.has(id));
}

function colorFromSeed(seed) {
  const hue = (seed * 137.508) % 360; // golden angle
  return `hsl(${hue}, 70%, 60%)`;
}

function computeLevels() {
  const levels = {};
  const visited = new Set();

  function walk(id, depth, colorSeed) {
    if (!levels[depth]) levels[depth] = [];
    if (!levels[depth].includes(id)) levels[depth].push(id);

    if (!lineageColors[id]) {
      lineageColors[id] = colorFromSeed(colorSeed);
    }

    if (visited.has(id)) return;
    visited.add(id);

    if (expanded[id]) {
      DIGIMONS[id].evolvesTo.forEach((child, index) => {
        // 🔀 divergence = nouvelle couleur
        walk(child, depth + 1, colorSeed + index + 1);
      });
    }
  }

  getRoots().forEach((root, i) => walk(root, 0, i * 10));
  return levels;
}

/* =====================================================
  Card creation
===================================================== */

function createCard(id) {
  const d = DIGIMONS[id];
  const card = document.createElement("div");
  card.className = "digimon";
  card.dataset.id = id;

  if (completed[id]) card.classList.add("completed");
  if (d.evolvesTo.length) card.classList.add("has-children");
  if (expanded[id]) card.classList.add("expanded");

  const methods = Array.isArray(d.method)
    ? d.method
    : d.method ? [d.method] : [];

  card.innerHTML = `
    <div class="icon">
      <img src="${d.icon || "./assets/placeholder.png"}" alt="${d.name}">
    </div>
    <div class="name">${d.name}</div>
    <div class="stage">${d.stage}</div>
    ${methods.length ? `
      <ul class="method">
        ${methods.map(m => `<li>${m}</li>`).join("")}
      </ul>` : ""}
    <div class="completion-badge">
      ${completed[id] ? "✓" : "○"}
    </div>
  `;

  card.style.setProperty(
    "--lineage-color",
    lineageColors[id] || "var(--branch-color)"
  );

  let timer = null;

  function startPress(e) {
    e.preventDefault();
    ignoreNextTap = false;

    timer = setTimeout(() => {
      ignoreNextTap = true;
      completed[id] = !completed[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
      renderGraph();
    }, 500);
  }

  function cancelPress() {
    clearTimeout(timer);
    timer = null;
  }

  function tap() {
    if (!ignoreNextTap) {
      expanded[id] = !expanded[id];
      renderGraph();
    }
    ignoreNextTap = false;
  }

  card.addEventListener("mousedown", startPress);
  card.addEventListener("mouseup", () => { cancelPress(); tap(); });
  card.addEventListener("mouseleave", cancelPress);

  card.addEventListener("touchstart", startPress, { passive: false });
  card.addEventListener("touchmove", cancelPress);
  card.addEventListener("touchend", () => { cancelPress(); tap(); });
  card.addEventListener("touchcancel", cancelPress);

  return card;
}

/* =====================================================
  Rendering
===================================================== */

function renderGraph() {
  graph.innerHTML = "";
  svg.innerHTML = "";

  const levels = computeLevels();
  const nodes = {};

  Object.values(levels).forEach(level => {
    const row = document.createElement("div");
    row.className = "level";

    level.forEach(id => {
      const card = createCard(id);
      nodes[id] = card;
      row.appendChild(card);
    });

    graph.appendChild(row);
  });

  updateCompletion();
  requestAnimationFrame(() => drawLinks(nodes));
}

/* =====================================================
  SVG links
===================================================== */

function drawLinks(nodes) {
  svg.innerHTML = "";
  const rect = svg.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
  let newCard;

  Object.entries(DIGIMONS).forEach(([id, d]) => {
    if (!expanded[id]) return;
    const from = nodes[id];
    if (!from) return;

    d.evolvesTo.forEach(child => {
      const to = nodes[child];
      if (!to) return;

      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();

      const x1 = a.left + a.width / 2 - rect.left;
      const y1 = a.bottom - rect.top;
      const x2 = b.left + b.width / 2 - rect.left;
      const y2 = b.top - rect.top;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${y1+40}, ${x2} ${y2-40}, ${x2} ${y2}`);
      path.setAttribute(
        "stroke",
        lineageColors[id] || "var(--branch-color)"
      );
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");

      svg.appendChild(path);
      newCard = to;
    });
  });
  requestAnimationFrame(() => {
    if (newCard) newCard.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

/* =====================================================
  Completion
===================================================== */

function updateCompletion() {
  const total = Object.keys(DIGIMONS).length;
  const done = Object.values(completed).filter(Boolean).length;
  completionLabel.textContent = `${Math.round((done / total) * 100)}%`;
}

/* =====================================================
  Search
===================================================== */

function expandParents(id) {
  if (!PARENTS[id]) return;
  PARENTS[id].forEach(parent => {
    expanded[parent] = true;
    expandParents(parent);
  });
}

function searchDigimon() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return;

  const entry = Object.entries(DIGIMONS).find(
    ([_, d]) => d.name.toLowerCase() === q
  );

  if (!entry) {
    alert("Digimon not found");
    return;
  }

  expanded = {};
  const [id] = entry;

  expandParents(id);
  expanded[id] = true;

  renderGraph();

  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

searchBtn.addEventListener("click", searchDigimon);
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchDigimon();
});

/* =====================================================
  Responsive redraw
===================================================== */

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(renderGraph, 100);
});

/* =====================================================
  Init
===================================================== */

renderGraph();
