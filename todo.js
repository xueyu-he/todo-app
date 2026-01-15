function $(id){ return document.getElementById(id); }

const form = $("form");
const input = $("input");
const listEl = $("list");
const emptyEl = $("empty");
const clearDoneBtn = $("clearDone");
const clearAllBtn = $("clearAll");
const markAllDoneBtn = $("markAllDone");
const statsEl = $("stats");

let filter = "all"; // all | open | done
let todos = loadTodos();

// ---------- storage ----------
function loadTodos(){
  try{
    const raw = localStorage.getItem("todos_v2");
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    return [];
  }
}

function saveTodos(){
  localStorage.setItem("todos_v2", JSON.stringify(todos));
}

// ---------- utils ----------
function uid(){
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function nowText(){
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,"0");
  const mi = String(d.getMinutes()).padStart(2,"0");
  return `${dd}.${mm}.${yy} ${hh}:${mi}`;
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getFilteredTodos(){
  if(filter === "open") return todos.filter(t => !t.done);
  if(filter === "done") return todos.filter(t => t.done);
  return todos;
}

function updateStats(){
  const open = todos.filter(t => !t.done).length;
  const done = todos.filter(t => t.done).length;
  statsEl.textContent = `Open: ${open} • Done: ${done}`;
}

// ---------- render ----------
function render(){
  const items = getFilteredTodos();
  listEl.innerHTML = "";

  emptyEl.style.display = items.length === 0 ? "block" : "none";

  for(const t of items){
    const li = document.createElement("li");
    li.className = "item" + (t.done ? " is-done" : "");
    li.dataset.id = t.id;

    li.innerHTML = `
      <div class="leftSide">
        <input class="check" type="checkbox" ${t.done ? "checked": ""} />
        <div style="min-width:0">
          <div class="text" data-action="edit" title="Double click to edit">
            ${escapeHtml(t.text)}
          </div>
          <div class="meta">${t.createdAt}</div>
        </div>
      </div>
      <button class="iconBtn" type="button" data-action="delete">Delete</button>
    `;

    listEl.appendChild(li);
  }

  updateStats();
}

function findTodo(id){
  return todos.find(t => t.id === id);
}

// ---------- CRUD ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;

  todos.unshift({
    id: uid(),
    text,
    done: false,
    createdAt: nowText()
  });

  input.value = "";
  saveTodos();
  render();
});

listEl.addEventListener("click", (e) => {
  const li = e.target.closest(".item");
  if(!li) return;
  const id = li.dataset.id;

  if(e.target.classList.contains("check")){
    toggleDone(id);
    return;
  }

  if(e.target.dataset.action === "delete"){
    removeTodo(id);
    return;
  }
});

listEl.addEventListener("change", (e) => {
  if(!e.target.classList.contains("check")) return;
  const li = e.target.closest(".item");
  if(!li) return;
  toggleDone(li.dataset.id);
});

function toggleDone(id){
  const t = findTodo(id);
  if(!t) return;
  t.done = !t.done;
  saveTodos();
  render();
}

function removeTodo(id){
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  render();
}

clearDoneBtn.addEventListener("click", () => {
  todos = todos.filter(t => !t.done);
  saveTodos();
  render();
});

clearAllBtn.addEventListener("click", () => {
  todos = [];
  saveTodos();
  render();
});

markAllDoneBtn.addEventListener("click", () => {
  todos = todos.map(t => ({ ...t, done: true }));
  saveTodos();
  render();
});

// ---------- filters ----------
document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    filter = btn.dataset.filter;
    render();
  });
});

// ---------- Inline Edit (Double Click) ----------
listEl.addEventListener("dblclick", (e) => {
  const target = e.target;
  if(!target || target.dataset.action !== "edit") return;

  const li = target.closest(".item");
  if(!li) return;

  const id = li.dataset.id;
  const todo = findTodo(id);
  if(!todo) return;

  // prevent editing when already editing
  if(li.querySelector("input[type='text']")) return;

  const oldText = todo.text;

  const inputEdit = document.createElement("input");
  inputEdit.type = "text";
  inputEdit.value = oldText;
  inputEdit.style.width = "100%";
  inputEdit.style.padding = "10px 12px";
  inputEdit.style.borderRadius = "12px";
  inputEdit.style.border = "1px solid rgba(255,255,255,.12)";
  inputEdit.style.background = "rgba(11,15,23,.35)";
  inputEdit.style.color = "rgba(255,255,255,.9)";
  inputEdit.style.outline = "none";

  target.replaceWith(inputEdit);
  inputEdit.focus();
  inputEdit.select();

  function saveEdit(){
    const newText = inputEdit.value.trim();
    todo.text = newText ? newText : oldText;
    saveTodos();
    render();
  }

  function cancelEdit(){
    render();
  }

  inputEdit.addEventListener("keydown", (ev) => {
    if(ev.key === "Enter") saveEdit();
    if(ev.key === "Escape") cancelEdit();
  });

  inputEdit.addEventListener("blur", () => {
    // blur = click outside, also save
    saveEdit();
  });
});

// init
render();
