# 🧬 Digimon Digivolution Graph

An interactive, visual Digimon digivolution tree built with **vanilla JavaScript**, **HTML**, **CSS**, and **SVG**.

This project lets you:

* Explore Digimon evolution trees progressively
* Expand / collapse branches
* Visually follow evolution paths
* Mark Digimon as *completed* (persisted in LocalStorage)
* Handle **232+ Digimon** without visual overload

This README explains **everything**, from architecture to rendering, for someone who is **not familiar with the technologies**.

---

## 🧠 Core Concept

Digimon evolution trees are **not linear**:

* One Digimon can evolve into several others
* Some Digimon have multiple parents
* Showing everything at once becomes unreadable

### 👉 Solution

We use a **progressive tree**:

* Only root Digimon are visible at first
* Tapping a Digimon expands its evolution branch
* SVG curves visually connect parents to children

---

## 🗂 Project Structure

```text
index.html      # Main HTML structure
style.css       # Visual theme and layout
data.js         # DIGIMONS database (232 entries)
app.js          # Logic, rendering, interactions
```

---

## 🧱 index.html

### Responsibilities

* Defines the static layout
* Loads styles and scripts
* Hosts both HTML cards and SVG overlay

### Important Elements

```html
<svg id="links"></svg>
<div id="graph"></div>
```

* `graph` → contains Digimon cards (HTML)
* `links` → SVG layer drawing evolution branches

The SVG is positioned **above the graph** using CSS, but ignores pointer events.

---

## 🎨 style.css

### Design Goals

* Dark sci‑fi / Digimon terminal vibe
* Responsive layout (desktop + mobile)
* Cards remain readable at any depth

### Key Concepts

* CSS variables for theme consistency
* Flexbox for level rows
* SVG sits absolutely behind cards

### Visual States

| State           | Effect                  |
| --------------- | ----------------------- |
| `.completed`    | Green outline           |
| `.has-children` | Arrow indicator         |
| `.expanded`     | Arrow direction changes |

---

## 🧠 data.js

Contains a global constant:

```js
const DIGIMONS = {
agumon: {
    name: "Agumon",
    stage: "Rookie",
    method: "Level up",
    evolvesTo: ["greymon"]
},
...
}
```

### Data Rules

* `id` is the unique key
* `evolvesTo` is always an array
* `method` can be string or array

---

## 🧠 app.js – Global Architecture

The logic is split into **clear layers**:

```text
State
│
├── Data helpers (tree structure)
├── Rendering (cards & layout)
├── SVG drawing (links)
├── Interaction handling
└── Persistence (LocalStorage)
```

---

## 🧠 State Management

### Expanded branches

```js
let expanded = {};
```

* `expanded[id] = true` → branch is open
* Only expanded Digimon reveal children

### Completion state

```js
let completed = { agumon: true };
```

Persisted in `localStorage`, so progress survives reloads.

---

## 🌳 Tree Computation

### Root Detection

```js
getRoots()
```

* Finds Digimon that are never children
* These start the tree

### Level Computation

```js
computeLevels()
```

* Traverses the tree **depth by depth**
* Stops traversal when a Digimon is not expanded
* Prevents infinite loops using a `visited` set

Result:

```js
{
0: ["botamon", "koromon"],
1: ["agumon"],
2: ["greymon"]
}
```

---

## 🃏 Digimon Cards

Each card is generated dynamically:

```js
createCard(id)
```

### Interaction Model

| Action             | Result                   |
| ------------------ | ------------------------ |
| Tap                | Expand / collapse branch |
| Long press (500ms) | Toggle completion        |

### Why long press?

* Mobile has no right‑click
* Prevents accidental completion toggles

---

## 🧩 SVG Rendering (Most Important Part)

### Why SVG?

* Perfect for curves and lines
* Scales without quality loss
* Can be layered above HTML

### How it works

1. Cards are positioned normally in HTML
2. SVG covers the entire graph
3. For each expanded Digimon:

* Get screen coordinates of parent and child
* Convert to SVG coordinates
* Draw a Bezier curve between them

### Bezier Curve

```text
M x y       → move to start
C a b c d e f → curved line to end
```

This creates organic, tree‑like branches.

---

## 📐 Coordinate Conversion

HTML uses **viewport coordinates**.
SVG uses **its own coordinate system**.

To match them:

```js
svg.getBoundingClientRect()
```

This lets us convert screen pixels → SVG units exactly.

---

## 📊 Completion Indicator

```js
updateCompletion()
```

* Counts completed Digimon
* Displays global progress percentage

---

## 📱 Mobile Considerations

### Challenges

* Screen space is limited
* Large trees become overwhelming
* Precision taps are difficult

### Solutions used

* Progressive expansion only
* Long press instead of buttons
* Cards stack vertically

Future ideas:

* Focus mode (single branch)
* Zoom / pan SVG
* Breadcrumb navigation

---

## 🧪 Why redraw everything?

Instead of updating parts of the graph:

* We **fully rerender** after each interaction

Benefits:

* No sync bugs
* No stale SVG paths
* Simple mental model

Cost:

* Slightly more CPU (acceptable for this scale)

---

## 🏁 Final Notes

This project intentionally avoids:

* Frameworks
* Virtual DOM
* Complex state managers

Why?

* Full control
* Maximum learning
* Clear cause → effect logic

---

## 🚀 Possible Next Evolutions

* Animation when expanding branches
* Search by Digimon name
* Timeline / stage filters
* Export completion data

---

If you read this entire README: congratulations 🎉
