const graph = document.getElementById("graph");
const svg = document.getElementById("links");
const completion = document.getElementById("completion");

/* ===============================
   LocalStorage for obtained Digimon
================================ */
const STORAGE_KEY = "digivolution_obtained";
const obtained = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"));
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify([...obtained])); }
function updateCompletion(){
  const total = Object.keys(DIGIMONS).length;
  completion.textContent = Math.floor(obtained.size/total*100)+"%";
}

/* ===============================
   Find root Digimons
================================ */
function getRoots(){
  const children = new Set();
  Object.values(DIGIMONS).forEach(d=>d.evolvesTo.forEach(c=>children.add(c)));
  return Object.keys(DIGIMONS).filter(id=>!children.has(id));
}

/* ===============================
   Compute levels (depth by stage)
================================ */
function computeLevels(){
  const levels={};
  const visited=new Set();
  function walk(id,depth){
    if(!levels[depth]) levels[depth]=[];
    if(!levels[depth].includes(id)) levels[depth].push(id);
    if(visited.has(id)) return;
    visited.add(id);
    DIGIMONS[id].evolvesTo.forEach(child=>walk(child,depth+1));
  }
  getRoots().forEach(root=>walk(root,0));
  return levels;
}

/* ===============================
   Create a Digimon card
================================ */
function createCard(id){
  const d=DIGIMONS[id];
  const el=document.createElement("div");
  el.className="digimon";
  if(obtained.has(id)) el.classList.add("obtained");
  el.innerHTML=`
    <div class="name">${d.name}</div>
    <div class="stage">${d.stage}</div>
    <div class="method">${d.method}</div>`;
  el.addEventListener("click",()=>{
    el.classList.toggle("obtained");
    obtained.has(id)?obtained.delete(id):obtained.add(id);
    save(); updateCompletion();
  });
  return el;
}

/* ===============================
   Draw SVG paths between parent and children
================================ */
function drawLinks(nodes){
  svg.innerHTML="";
  const box = svg.getBoundingClientRect();

  Object.entries(DIGIMONS).forEach(([id,d])=>{
    const from=nodes[id]; if(!from) return;
    d.evolvesTo.forEach(childId=>{
      const to=nodes[childId]; if(!to) return;
      const a=from.getBoundingClientRect();
      const b=to.getBoundingClientRect();
      const x1=a.left+a.width/2-box.left;
      const y1=a.bottom-box.top;
      const x2=b.left+b.width/2-box.left;
      const y2=b.top-box.top;

      const path=document.createElementNS("http://www.w3.org/2000/svg","path");
      path.setAttribute("d",`M ${x1} ${y1} C ${x1} ${y1+50}, ${x2} ${y2-50}, ${x2} ${y2}`);
      path.setAttribute("stroke","rgba(125,211,252,0.5)");
      path.setAttribute("stroke-width","2");
      path.setAttribute("fill","none");
      svg.appendChild(path);
    });
  });
}

/* ===============================
   Render the graph level by level
================================ */
function renderGraph(){
  const levels = computeLevels();
  graph.innerHTML="";
  const nodes={};

  Object.keys(levels).forEach(depth=>{
    const row=document.createElement("div");
    row.className="level";
    levels[depth].forEach(id=>{
      const card=createCard(id);
      row.appendChild(card);
      nodes[id]=card;
    });
    graph.appendChild(row);
  });

  // Wait one frame to ensure layout is rendered before drawing links
  requestAnimationFrame(()=>drawLinks(nodes));
}

/* ===============================
   Init
================================ */
renderGraph();
updateCompletion();
