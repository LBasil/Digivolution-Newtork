/* =====================================================
  DOM references
  We keep direct references to the main UI elements
===================================================== */

const graph = document.getElementById("graph");
const svg = document.getElementById("links");
const completionLabel = document.getElementById("completion");

/* =====================================================
  LocalStorage
  Stores which Digimon are marked as "completed"
===================================================== */

const STORAGE_KEY = "digivolution-progress";
let completed = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

/* =====================================================
  UI State
  - expanded: which Digimon branches are currently opened
===================================================== */

let expanded = {};

/* =====================================================
  Helpers – Graph structure
===================================================== */

/**
 * Returns Digimon IDs that have no parent.
 * Those are the roots of the digivolution trees.
 */
function getRoots() {
  const children = new Set();

  Object.values(DIGIMONS).forEach(d =>
    d.evolvesTo.forEach(id => children.add(id))
  );

  return Object.keys(DIGIMONS).filter(id => !children.has(id));
}

/**
 * Computes which Digimon should appear on each vertical level.
 * Only expanded branches are traversed.
 */
function computeLevels() {
  const levels = {};
  const visited = new Set();

  function walk(id, depth) {
    if (!DIGIMONS[id]) {
      console.error("Missing Digimon:", id);
      return;
    }

    // Create the level if it doesn't exist
    if (!levels[depth]) levels[depth] = [];

    // Prevent duplicates on the same level
    if (!levels[depth].includes(id)) {
      levels[depth].push(id);
    }

    // Prevent infinite loops
    if (visited.has(id)) return;
    visited.add(id);

    // Only continue if this Digimon is expanded
    if (expanded[id]) {
      DIGIMONS[id].evolvesTo.forEach(child =>
        walk(child, depth + 1)
      );
    }
  }

  // Start traversal from roots
  getRoots().forEach(root => walk(root, 0));

  return levels;
}

/* =====================================================
  Rendering – Cards
===================================================== */

let ignoreNextTap = false; // Used to separate tap from long-press

/**
 * Creates a Digimon card DOM element.
 */
function createCard(id) {
  const d = DIGIMONS[id];
  const card = document.createElement("div");
  card.className = "digimon";

  // Visual states
  if (completed[id]) card.classList.add("completed");
  if (d.evolvesTo.length) card.classList.add("has-children");
  if (expanded[id]) card.classList.add("expanded");

  // Normalize methods (string or array → array)
  const methods = Array.isArray(d.method)
    ? d.method
    : d.method ? [d.method] : [];

  card.innerHTML = `
    <div class="icon">
    <img src="${d.icon || './assets/placeholder.png'}" alt="${d.name}" />
    </div>
    <div class="name">${d.name}</div>
    <div class="stage">${d.stage}</div>
    ${methods.length
      ? `<ul class="method">
            ${methods.map(m => `<li>${m}</li>`).join("")}
          </ul>`
      : ""
    }
  `;

  /* -----------------------------------------------------
    Interaction logic
    - Tap: expand / collapse branch
    - Long press: toggle completion
  ----------------------------------------------------- */

  let longPressTimer = null;

  function startPress(e) {
    e.preventDefault();
    ignoreNextTap = false;

    longPressTimer = setTimeout(() => {
      ignoreNextTap = true;

      completed[id] = !completed[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));

      renderGraph();
    }, 500);
  }

  function cancelPress() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  function handleTap() {
    if (!ignoreNextTap) {
      expanded[id] = !expanded[id];
      renderGraph();
    }
    ignoreNextTap = false;
  }

  // Mouse events
  card.addEventListener("mousedown", startPress);
  card.addEventListener("mouseup", () => {
    cancelPress();
    handleTap();
  });
  card.addEventListener("mouseleave", cancelPress);

  // Touch events
  card.addEventListener("touchstart", startPress, { passive: false });
  card.addEventListener("touchmove", cancelPress);
  card.addEventListener("touchend", () => {
    cancelPress();
    handleTap();
  });
  card.addEventListener("touchcancel", cancelPress);

  return card;
}

/* =====================================================
  Rendering – Graph layout
===================================================== */

/**
 * Renders all visible Digimon cards and connections.
 */
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
  SVG Links – Visual connections between Digimon
===================================================== */

/**
 * Draws curved SVG links between expanded Digimon
 * and their visible children.
 */
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

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );

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
  Completion indicator
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
