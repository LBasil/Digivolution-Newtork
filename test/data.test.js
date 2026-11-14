// Vérifie l'intégrité de data.js (le graphe des digivolutions) : liens, icônes, étapes.
// Lancer : node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n;this.DIGIMONS = DIGIMONS;', context);
const DIGIMONS = context.DIGIMONS;
const entries = Object.entries(DIGIMONS);

test('le jeu de données n\'est pas vide', () => assert.ok(entries.length > 100));

test('chaque évolution pointe vers un Digimon qui existe', () => {
  const broken = [];
  for (const [id, d] of entries) for (const target of d.evolvesTo || []) if (!DIGIMONS[target]) broken.push(`${id} -> ${target}`);
  assert.deepEqual(broken, []);
});

test('aucun Digimon n\'évolue vers lui-même, et pas de doublon dans une liste', () => {
  const problems = [];
  for (const [id, d] of entries) {
    const list = d.evolvesTo || [];
    if (list.includes(id)) problems.push(`${id} s'évolue lui-même`);
    if (new Set(list).size !== list.length) problems.push(`${id} a un doublon`);
  }
  assert.deepEqual(problems, []);
});

test('chaque icône référencée existe dans assets/', () => {
  const missing = entries
    .filter(([, d]) => d.icon && !fs.existsSync(path.join(root, d.icon)))
    .map(([id, d]) => `${id}: ${d.icon}`);
  assert.deepEqual(missing, []);
});

test('chaque Digimon a un nom, une étape et au moins une méthode', () => {
  const bad = entries.filter(([, d]) => !d.name || !d.stage || !Array.isArray(d.method) || d.method.length === 0).map(([id]) => id);
  assert.deepEqual(bad, []);
});

// Sukamon et PlatinumSukamon n'ont aucun parent dans data.js : données incomplètes, connues, à compléter.
const SANS_PARENT_CONNUS = ['sukamon', 'platinumSukamon'];

test('tout Digimon est atteignable depuis un bébé (hors exceptions connues)', () => {
  const babies = entries.filter(([, d]) => d.stage === 'Baby').map(([id]) => id);
  const seen = new Set(babies);
  const queue = [...babies];
  while (queue.length) for (const next of DIGIMONS[queue.shift()].evolvesTo || []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  const unreachable = entries.map(([id]) => id).filter(id => !seen.has(id) && !SANS_PARENT_CONNUS.includes(id));
  assert.deepEqual(unreachable, []);
});
