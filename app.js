/* =====================================================
  DOM references
===================================================== */

const graph = document.getElementById("graph");
const svg = document.getElementById("links");
const completionLabel = document.getElementById("completion");
const completionPercent = document.getElementById("completionPercent");
const progressFill = document.getElementById("progressFill");
const progressBar = document.querySelector(".progress-bar");
const searchMessage = document.getElementById("searchMessage");
const collapseBtn = document.getElementById("collapseBtn");
const helpPanel = document.getElementById("help");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const autocomplete = document.getElementById("autocomplete");

/* =====================================================
  Language (English by default, French if the browser is in French)
===================================================== */

const STRINGS = {
  en: {
    title: "Digimon World: Next Order – Digivolution Tree",
    helpTitle: "How it works",
    help1: "Every Digimon starts as a Baby. <strong>Click a card</strong> to see what it can digivolve into.",
    help2: "Click the <strong>circle</strong> at the bottom right of a card to mark it as obtained. Your progress is saved in this browser.",
    help3: "Under the name, the list shows the <strong>conditions</strong> your partner needs to digivolve into that Digimon. Stars (★) are its key points.",
    help4: "Looking for a specific Digimon? Use the search to see its full evolution line.",
    searchPlaceholder: "Search a Digimon (e.g. Greymon)",
    search: "Search",
    focus: "Focus: only show the selected Digimon's line",
    collapse: "Collapse everything",
    notFound: "No Digimon named “{q}”. Pick one from the suggestions.",
    noMatch: "No Digimon found",
    obtained: "obtained",
    markObtained: "Mark {name} as obtained",
    markNotObtained: "Mark {name} as not obtained",
    conditions: "Conditions",
    keyPoints: "Key points",
  },
  fr: {
    title: "Digimon World: Next Order – Arbre de digivolution",
    helpTitle: "Comment ça marche",
    help1: "Chaque Digimon commence en Baby. <strong>Cliquez sur une carte</strong> pour voir en quoi il peut digivoluer.",
    help2: "Cliquez sur le <strong>rond</strong> en bas à droite d'une carte pour la marquer comme obtenue. Votre progression est gardée dans ce navigateur.",
    help3: "Sous le nom, la liste indique les <strong>conditions</strong> que doit remplir votre partenaire pour digivoluer en ce Digimon. Les étoiles (★) sont ses points clés.",
    help4: "Vous cherchez un Digimon précis ? Utilisez la recherche pour voir toute sa lignée.",
    searchPlaceholder: "Chercher un Digimon (ex. Greymon)",
    search: "Chercher",
    focus: "Focus : n'afficher que la lignée du Digimon choisi",
    collapse: "Tout replier",
    notFound: "Aucun Digimon nommé « {q} ». Choisissez-en un dans les suggestions.",
    noMatch: "Aucun Digimon trouvé",
    obtained: "obtenus",
    markObtained: "Marquer {name} comme obtenu",
    markNotObtained: "Marquer {name} comme non obtenu",
    conditions: "Conditions",
    keyPoints: "Points clés",
  },
};

const LANG = (navigator.language || "en").toLowerCase().startsWith("fr") ? "fr" : "en";
const t = (key, vars = {}) =>
  Object.entries(vars).reduce(
    (text, [k, v]) => text.replace(`{${k}}`, v),
    STRINGS[LANG][key] ?? STRINGS.en[key]
  );

document.documentElement.lang = LANG;
document.title = t("title");
document.querySelectorAll("[data-i18n]").forEach(el => (el.innerHTML = t(el.dataset.i18n)));
document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
  el.placeholder = t(el.dataset.i18nPlaceholder);
  el.setAttribute("aria-label", el.placeholder);
});

/* =====================================================
  LocalStorage
===================================================== */

const STORAGE_KEY = "digivolution-progress";
function readStored(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch (e) {
    return fallback; // JSON corrompu ou stockage indisponible : on repart d'un état vide
  }
}

let completed = readStored(STORAGE_KEY, {});

function saveCompleted() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  } catch (e) {
    /* stockage plein ou désactivé : la progression ne sera pas gardée, l'appli reste utilisable */
  }
}

// Le panneau d'aide est ouvert à la première visite, puis replié.
const HELP_KEY = "digivolution-help-seen";
if (readStored(HELP_KEY, false)) helpPanel.open = false;
helpPanel.addEventListener("toggle", () => {
  if (!helpPanel.open) {
    try { localStorage.setItem(HELP_KEY, "true"); } catch (e) { /* ignoré */ }
  }
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const scrollBehavior = prefersReducedMotion ? "auto" : "smooth";

/* =====================================================
  UI state
===================================================== */

let expanded = {};
let lineageColors = {};
let focusFilterEnabled = readStored("focus-filter-enabled", true);

let visibleSet = null;
const focusCheckbox = document.getElementById("focusFilter");
focusCheckbox.checked = focusFilterEnabled;

focusCheckbox.addEventListener("change", () => {
  focusFilterEnabled = focusCheckbox.checked;
  try {
    localStorage.setItem("focus-filter-enabled", JSON.stringify(focusFilterEnabled));
  } catch (e) { /* ignoré */ }

  if (!focusFilterEnabled) {
    visibleSet = null;
  }

  renderGraph();
});


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
  Digimon List for autocompletion
===================================================== */

const DIGIMON_LIST = Object.entries(DIGIMONS).map(([id, d]) => ({
  id,
  name: d.name
}));


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

function collectParents(id, set) {
  if (!PARENTS[id]) return;
  PARENTS[id].forEach(p => {
    if (!set.has(p)) {
      set.add(p);
      collectParents(p, set);
    }
  });
}

function collectChildren(id, set) {
  DIGIMONS[id].evolvesTo.forEach(c => {
    if (!set.has(c)) {
      set.add(c);
      collectChildren(c, set);
    }
  });
}

function buildVisibleSetFrom(id) {
  const set = new Set([id]);
  collectParents(id, set);
  collectChildren(id, set);
  return set;
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

  const methods = (Array.isArray(d.method) ? d.method : d.method ? [d.method] : [])
    .filter(m => m && m !== "-"); // "-" = aucune condition : rien à afficher
  const stars = d.keyPts ? "★".repeat(d.keyPts) : "";

  card.setAttribute("role", "button");
  card.tabIndex = 0;
  if (d.evolvesTo.length) card.setAttribute("aria-expanded", expanded[id] ? "true" : "false");

  card.innerHTML = `
    <div class="icon">
      <img src="${d.icon || "./assets/placeholder.png"}" alt="">
    </div>
    <div class="name">${d.name}</div>
    <div class="stage">${d.stage}</div>
    ${stars ? `<div class="stars" title="${t("keyPoints")}">${stars}</div>` : ""}
    ${methods.length ? `
      <ul class="method" aria-label="${t("conditions")}">
        ${methods.map(m => `<li>${m}</li>`).join("")}
      </ul>` : ""}
    <button type="button" class="completion-badge" aria-pressed="${completed[id] ? "true" : "false"}"
      aria-label="${t(completed[id] ? "markNotObtained" : "markObtained", { name: d.name })}"
      title="${t(completed[id] ? "markNotObtained" : "markObtained", { name: d.name })}">
      ${completed[id] ? "✓" : ""}
    </button>
  `;

  card.style.setProperty(
    "--lineage-color",
    lineageColors[id] || "var(--branch-color)"
  );

  function toggleExpanded() {
    expanded[id] = !expanded[id];
    if (focusFilterEnabled) {
      visibleSet = buildVisibleSetFrom(id);
    }
    renderGraph(id);
  }

  // Un clic sur le rond marque le Digimon comme obtenu ; un clic ailleurs sur la carte la déplie.
  card.addEventListener("click", e => {
    if (e.target.closest(".completion-badge")) {
      completed[id] = !completed[id];
      saveCompleted();
      renderGraph(id);
      return;
    }
    toggleExpanded();
  });

  card.addEventListener("keydown", e => {
    if (e.target !== card) return; // laisser le bouton du rond gérer ses propres touches
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpanded();
    }
  });

  return card;
}

/* =====================================================
  Rendering
===================================================== */

function renderGraph(focusId) {
  graph.innerHTML = "";
  svg.innerHTML = "";

  const levels = computeLevels();
  const nodes = {};

  Object.values(levels).forEach(level => {
    const row = document.createElement("div");
    row.className = "level";

    level.forEach(id => {
      if (visibleSet && !visibleSet.has(id)) return;

      const card = createCard(id);
      nodes[id] = card;
      row.appendChild(card);
    });

    graph.appendChild(row);
  });

  updateCompletion();
  // Le rendu recrée toutes les cartes : on redonne le focus à celle qu'on vient d'utiliser.
  if (focusId && nodes[focusId]) nodes[focusId].focus({ preventScroll: true });
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
      path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${y1 + 40}, ${x2} ${y2 - 40}, ${x2} ${y2}`);
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
    if (newCard) newCard.scrollIntoView({ behavior: scrollBehavior, block: "center" });
  });
}

/* =====================================================
  Completion
===================================================== */

function updateCompletion() {
  const total = Object.keys(DIGIMONS).length;
  const done = Object.values(completed).filter(Boolean).length;
  const percent = Math.round((done / total) * 100);
  completionLabel.textContent = `${done} / ${total} ${t("obtained")}`;
  completionPercent.textContent = `(${percent} %)`;
  progressFill.style.width = `${percent}%`;
  progressBar.setAttribute("aria-valuenow", String(percent));
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
  searchMessage.textContent = "";
  if (!q) return;

  const entries = Object.entries(DIGIMONS);
  // Nom exact d'abord ; sinon, s'il n'y a qu'un seul Digimon dont le nom contient la saisie, on le prend.
  const partial = entries.filter(([_, d]) => d.name.toLowerCase().includes(q));
  const entry =
    entries.find(([_, d]) => d.name.toLowerCase() === q) ||
    (partial.length === 1 ? partial[0] : null);

  if (!entry) {
    searchMessage.textContent = t("notFound", { q: searchInput.value.trim() });
    return;
  }

  const [id] = entry;

  expanded = {};
  expandParents(id);
  expanded[id] = true;

  if (focusFilterEnabled) {
    visibleSet = buildVisibleSetFrom(id);
  } else {
    visibleSet = null;
  }

  renderGraph();

  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) card.scrollIntoView({ behavior: scrollBehavior, block: "center" });
  });
}

searchBtn.addEventListener("click", searchDigimon);
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchDigimon();
});

searchInput.addEventListener("input", () => {
  searchMessage.textContent = "";
  updateAutocomplete();
});

collapseBtn.addEventListener("click", () => {
  expanded = {};
  visibleSet = null;
  searchMessage.textContent = "";
  renderGraph();
  window.scrollTo({ top: 0, behavior: scrollBehavior });
});
document.addEventListener("click", e => {
  if (!autocomplete.contains(e.target) && e.target !== searchInput) {
    autocomplete.innerHTML = "";
  }
});

function updateAutocomplete() {
  const q = searchInput.value.trim().toLowerCase();
  autocomplete.innerHTML = "";

  if (!q) return;

  const matches = DIGIMON_LIST.filter(d =>
    d.name.toLowerCase().includes(q)
  ).slice(0, 6);

  const list = document.createElement("div");
  list.className = "autocomplete-list";

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "autocomplete-empty";
    empty.textContent = t("noMatch");
    list.appendChild(empty);
  } else {
    matches.forEach(d => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "autocomplete-item";
      item.textContent = d.name;

      item.addEventListener("click", () => {
        searchInput.value = d.name;
        autocomplete.innerHTML = "";
        searchDigimon();
      });

      list.appendChild(item);
    });
  }

  autocomplete.appendChild(list);
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
