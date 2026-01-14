/* =====================================================
   DOM references
===================================================== */

const graph = document.getElementById("graph");
const svg = document.getElementById("links");
const completionLabel = document.getElementById("completion");

/* =====================================================
   LocalStorage
===================================================== */

const STORAGE_KEY = "digivolution-progress";
let completed = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

/* =====================================================
   UI state
===================================================== */

let expanded = {};

/* =====================================================
   Helpers
===================================================== */

function getRoots() {
  const children = new Set();
  Object.values(DIGIMONS).forEach(d =>
    d.evolvesTo.forEach(c => children.add(c))
  );
  return Object.keys(DIGIMONS).filter(id => !children.has(id));
}

function computeLevels() {
  const levels = {};
  const visited = new Set();

  function walk(id, depth) {
    if (!DIGIMONS[id]) {
      console.error("Digimon manquant :", id);
      return;
    }

    if (!levels[depth]) levels[depth] = [];
    if (!levels[depth].includes(id)) levels[depth].push(id);

    if (visited.has(id)) return;
    visited.add(id);

    if (expanded[id]) {
      DIGIMONS[id].evolvesTo.forEach(child =>
        walk(child, depth + 1)
      );
    }
  }

  getRoots().forEach(root => walk(root, 0));
  return levels;
}

/* =====================================================
   Rendering
===================================================== */

function createCard(id) {
  const d = DIGIMONS[id];
  const card = document.createElement("div");
  card.className = "digimon";

  if (completed[id]) card.classList.add("completed");
  if (d.evolvesTo.length) card.classList.add("has-children");
  if (expanded[id]) card.classList.add("expanded");

  card.innerHTML = `
    <div class="name">${d.name}</div>
    <div class="stage">${d.stage}</div>
    <div class="method">${d.method || ""}</div>
  `;

  let longPressTimer = null;
  let longPressTriggered = false;

  function startPress() {
    longPressTriggered = false;
    longPressTimer = setTimeout(() => {
      longPressTriggered = true;
      completed[id] = !completed[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
      renderGraph();
    }, 500);
  }

  function cancelPress() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  card.addEventListener("mousedown", startPress);
  card.addEventListener("touchstart", startPress);

  card.addEventListener("mouseup", () => {
    if (!longPressTriggered) {
      expanded[id] = !expanded[id];
      renderGraph();
    }
    cancelPress();
  });

  card.addEventListener("mouseleave", cancelPress);
  card.addEventListener("touchend", cancelPress);

  return card;
}


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
      row.appendChild(card);
      nodes[id] = card;
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

  Object.entries(DIGIMONS).forEach(([id, d]) => {
    if (!expanded[id]) return;

    const from = nodes[id];
    if (!from) return;

    d.evolvesTo.forEach(childId => {
      const to = nodes[childId];
      if (!to) return;

      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();

      const x1 = a.left + a.width / 2 - rect.left;
      const y1 = a.bottom - rect.top;
      const x2 = b.left + b.width / 2 - rect.left;
      const y2 = b.top - rect.top;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute(
        "d",
        `M ${x1} ${y1}
         C ${x1} ${y1 + 40},
           ${x2} ${y2 - 40},
           ${x2} ${y2}`
      );
      path.setAttribute("stroke", "var(--branch-color)");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");

      svg.appendChild(path);
    });
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
