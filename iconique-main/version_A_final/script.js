// --- INITIALISATION ET ETAT DE L'APPLICATION ---
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let activeTimer = null;
let isDraggingCurtain = false;
let focusInterval = null; // <-- Ajoute cette ligne
let openBufferTaskId = null;
const suggestedSubtasks = [
  "Faire semblant de travailler",
  "Procrastiner",
  "Compter les nuages",
  "Paniquer à propos de la date limite",
  "Faire une pause",
  "Essayer de toucher son nez avec sa langue"
];


// --- NAVIGATION ---
function showView(viewId) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));

  document.getElementById(viewId).classList.add("active");
  // Gestion du style des boutons de la sidebar
  if (viewId === "task-list")
    document.getElementById("btn-list").classList.add("active");
  else document.getElementById("btn-cal").classList.add("active");

  renderAll();
}

// --- GESTION DES CATEGORIES ---
function checkNewCategory(val) {
  const newInp = document.getElementById("task-cat-new");
  newInp.style.display = val === "NEW" ? "block" : "none";
}

function updateCategoryUI() {
  const select = document.getElementById("task-cat-select");
  const filter = document.getElementById("filter-cat");
  const currentSelect = select.value;
  const currentFilter = filter.value;

  // 1. Définir tes catégories par défaut ici
  const defaultCats = ["Travail", "Personnel", "Études", "Loisirs"];

  // 2. Récupérer les catégories créées par l'utilisateur dans ses tâches
  const userCats = [...new Set(tasks.map((t) => t.category))];

  // 3. Fusionner les deux listes sans doublons
  const allCats = [...new Set([...defaultCats, ...userCats])];

  // --- Mise à jour du formulaire (Ajout/Modif) ---
  // On garde l'option "NEW" et "Général" en haut
  let selectHTML = '<option value="Général">Général</option>';
  selectHTML += '<option value="NEW">+ Nouvelle catégorie...</option>';

  allCats.forEach((c) => {
    if (c !== "Général") {
      selectHTML += `<option value="${c}">${c}</option>`;
    }
  });
  select.innerHTML = selectHTML;

  // --- Mise à jour du filtre (Sidebar) ---
  let filterHTML = '<option value="all">Toutes</option>';
  allCats.forEach((c) => {
    filterHTML += `<option value="${c}">${c}</option>`;
  });
  filter.innerHTML = filterHTML;

  // Restaurer les sélections précédentes
  select.value = currentSelect;
  filter.value = currentFilter;
}

// --- LOGIQUE DES TACHES ---
function saveTask() {
  const id = document.getElementById("task-id").value;
  const title = document.getElementById("task-title").value;
  const date = document.getElementById("task-date").value;
  const start = document.getElementById("task-start").value;
  const duration = parseInt(document.getElementById("task-duration").value);
  const existingTask = id ? tasks.find((t) => t.id === id) : null;

  // Récupération de la catégorie
  const selectVal = document.getElementById("task-cat-select").value;
  const category =
    selectVal === "NEW"
      ? document.getElementById("task-cat-new").value
      : selectVal;

  if (!title || !date || !start)
    return alert("Remplissez les champs obligatoires");

  const taskData = {
    id: id || Date.now().toString(),
    title,
    desc: document.getElementById("task-desc").value,
    date,
    start,
    duration: duration || 30,
    category: category || "Général",
    completed: existingTask ? existingTask.completed : false,
    subtasks: existingTask ? existingTask.subtasks || [] : [],
    bufferTime: existingTask ? existingTask.bufferTime || 0 : 0,
  };

  if (id) {
    const idx = tasks.findIndex((t) => t.id === id);
    tasks[idx] = taskData;
  } else {
    tasks.push(taskData);
  }

  resetForm();
  saveAndRender();
}

function resetForm() {
  document.getElementById("task-id").value = "";
  document.getElementById("task-title").value = "";
  document.getElementById("task-desc").value = "";
  document.getElementById("task-cat-new").value = "";
  document.getElementById("task-cat-new").style.display = "none";
  document.getElementById("task-cat-select").value = "Général";
}

// --- RENDU ---
function renderList() {
  const container = document.getElementById("list-container");
  const filter = document.getElementById("filter-cat").value;
  container.innerHTML = "";

  tasks
    .filter((t) => filter === "all" || t.category === filter)
    .forEach((task) => {
      const div = document.createElement("div");
      div.className = `card task-item ${task.completed ? "done" : ""}`;
      div.innerHTML = `
            <div class="task-main">
                <small style="color:var(--primary)">#${task.category}</small>
                <h4>${task.title}</h4>
                <div id="sub-list-${task.id}"></div>
                <div id="buffer-box-${task.id}"></div>
                <input type="text" placeholder="+ Sous-tâche" onkeydown="if(event.key==='Enter') addSubtask('${task.id}', this.value)">
            </div>
            <div class="task-actions">
                <button class="btn" style="background:#10B981" onclick="startFocus('${task.id}')">⚡ Focus</button>
                <button onclick="generateSubtasks('${task.id}')">🪄</button>
                <button onclick="editTask('${task.id}')">✏️</button>
                <button onclick="toggleTask('${task.id}')">✔️</button>
                <button onclick="deleteTask('${task.id}')">🗑️</button>
            </div>
        `;
      container.appendChild(div);
      renderSubtasks(task);
      renderBufferBox(task);
    });
}

function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  const selectedDate = document.getElementById("calendar-date-picker").value;
  const filter = document.getElementById("filter-cat").value;
  grid.innerHTML = "";

  for (let i = 0; i < 24; i++) {
    const row = document.createElement("div");
    row.className = "hour-row";
    row.innerText = i + ":00";
    grid.appendChild(row);
  }

  const dayTasks = tasks.filter(
    (t) => t.date === selectedDate && (filter === "all" || t.category === filter)
  );

  // 1. Calcul de la position verticale de chaque tâche (début/fin en minutes)
  const taskMeta = dayTasks.map((task) => {
    const [h, m] = task.start.split(":").map(Number);
    const startMin = h * 60 + m;
    const endMin = startMin + task.duration;
    return { task, startMin, endMin, col: 0, totalCols: 1 };
  });

  // 2. Algorithme de détection de chevauchements et assignation des colonnes
  // On trie par heure de début
  taskMeta.sort((a, b) => a.startMin - b.startMin);

  // Pour chaque tâche, on trouve le groupe de tâches qui se chevauchent
  const groups = [];
  for (const meta of taskMeta) {
    let placed = false;
    for (const group of groups) {
      // Le groupe est actif si au moins une tâche du groupe chevauche "meta"
      const overlapsGroup = group.some(
        (g) => meta.startMin < g.endMin && meta.endMin > g.startMin
      );
      if (overlapsGroup) {
        // On trouve la première colonne libre dans ce groupe
        const usedCols = group
          .filter((g) => meta.startMin < g.endMin && meta.endMin > g.startMin)
          .map((g) => g.col);
        let col = 0;
        while (usedCols.includes(col)) col++;
        meta.col = col;
        group.push(meta);
        placed = true;
        break;
      }
    }
    if (!placed) {
      meta.col = 0;
      groups.push([meta]);
    }
  }

  // 3. Calcul du nombre total de colonnes par groupe
  for (const group of groups) {
    const maxCol = Math.max(...group.map((g) => g.col));
    group.forEach((g) => (g.totalCols = maxCol + 1));
  }

  // 4. Rendu avec position et largeur calculées
  const COLUMN_WIDTH = grid.offsetWidth || 300; // largeur réelle de la grille

  for (const { task, startMin, col, totalCols } of taskMeta) {
    const top = (startMin / 60) * 50;
    const height = (task.duration / 60) * 50;

    const colWidth = 100 / totalCols;
    const leftPercent = col * colWidth;

    const rect = document.createElement("div");
    rect.className = "task-rect";
    rect.style.top = top + "px";
    rect.style.height = height + "px";
    rect.style.left  = `calc(60px + (100% - 80px) * ${col / totalCols})`;
    rect.style.width = `calc((100% - 80px) / ${totalCols})`;
    rect.innerHTML = `<b>${task.title}</b><br>${task.start}`;

    const resizer = document.createElement("div");
    resizer.className = "resizer";
    resizer.onmousedown = (e) => {
      e.stopPropagation();
      initResize(e, task);
    };

    rect.onmousedown = (e) => initMove(e, task);
    rect.appendChild(resizer);
    grid.appendChild(rect);
  }
}

// --- LOGIQUE DRAG & RESIZE CALENDRIER ---
function initResize(e, task) {
  const startY = e.clientY;
  const startDur = task.duration;
  const onMove = (me) => {
    const diff = me.clientY - startY;
    task.duration = Math.max(15, startDur + Math.round((diff / 50) * 60));
    renderCalendar();
  };
  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp); // Bonne pratique : retirer le listener de souris aussi
    task.duration = parseInt(task.duration); // Force le format nombre
    saveAndRender(); // C'est ICI que la liste se synchronise avec le calendrier
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function initMove(e, task) {
  const startY = e.clientY;
  const [h, m] = task.start.split(":").map(Number);
  const startTotal = h * 60 + m;
  const onMove = (me) => {
    const diff = me.clientY - startY;
    const newTotal = startTotal + Math.round((diff / 50) * 60);
    const newH = Math.floor(newTotal / 60);
    const newM = Math.floor((newTotal % 60) / 5) * 5;
    task.start = `${String(Math.max(0, Math.min(23, newH))).padStart(2, "0")}:${String(Math.max(0, Math.min(55, newM))).padStart(2, "0")}`;
    renderCalendar();
  };
  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    saveAndRender();
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

// --- MODE FOCUS (RIDEAU INTERACTIF) ---
function startFocus(id) {
  console.log("Tentative de focus sur l'ID:", id);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    console.error("Tâche non trouvée ! Liste actuelle:", tasks);
    return;
  }

  activeTimer = {
    task,
    totalSeconds: parseInt(task.duration) * 60,
    remainingSeconds: parseInt(task.duration) * 60,
  };

  document.getElementById("focus-task-title").innerText = task.title;
  document.getElementById("focus-overlay").style.display = "flex";

  updateFocusUI();

  // On s'assure qu'aucun ancien timer ne tourne
  if (focusInterval) clearInterval(focusInterval);

  focusInterval = setInterval(() => {
    if (!isDraggingCurtain && activeTimer) {
      activeTimer.remainingSeconds--;
      updateFocusUI();
      if (activeTimer.remainingSeconds <= 0) {
        closeFocus();
      }
    }
  }, 1000);
}

function updateFocusUI() {
  if (!activeTimer) return;
  const percent =
    ((activeTimer.totalSeconds - activeTimer.remainingSeconds) /
      activeTimer.totalSeconds) *
    100;

  const curtain = document.getElementById("focus-curtain");
  const handle = document.getElementById("focus-handle");

  curtain.style.height = percent + "%";
  handle.style.top = percent + "%";

  // Changement de couleur
  if (percent < 50) curtain.style.backgroundColor = "#6366F1";
  else if (percent < 85) curtain.style.backgroundColor = "#F59E0B";
  else curtain.style.backgroundColor = "#EF4444";

  const m = Math.floor(activeTimer.remainingSeconds / 60);
  const s = Math.floor(activeTimer.remainingSeconds % 60);
  document.getElementById("timer-display").innerText =
    `${m}:${String(s).padStart(2, "0")}`;
}

// Gestion du drag sur le rideau
document
  .getElementById("focus-handle")
  .addEventListener("mousedown", () => (isDraggingCurtain = true));
window.addEventListener("mousemove", (e) => {
  if (!isDraggingCurtain || !activeTimer) return;
  const overlay = document.getElementById("focus-overlay");
  const rect = overlay.getBoundingClientRect();
  const y = e.clientY - rect.top;
  let percent = (y / rect.height) * 100;
  percent = Math.max(0, Math.min(100, percent));

  activeTimer.remainingSeconds = Math.round(
    activeTimer.totalSeconds * (1 - percent / 100),
  );
  updateFocusUI();
});
window.addEventListener("mouseup", () => (isDraggingCurtain = false));

function closeFocus() {
  if (focusInterval) {
    clearInterval(focusInterval);
    focusInterval = null;
  }
  activeTimer = null;
  document.getElementById("focus-overlay").style.display = "none";
}

// --- FONCTIONS SECONDAIRES ---
function addSubtask(id, text) {
  if (!text) return;
  tasks.find((t) => t.id === id).subtasks.push({ text, completed: false });
  saveAndRender();
}

function toggleBuffer(id) {
  openBufferTaskId = openBufferTaskId === id ? null : id;
  renderList();
}

function updateTaskMinutes(id, value) {
  const input = document.getElementById(`task-minutes-${id}`);
  if (!input) return;
  input.value = Math.max(1, parseInt(value) || 1);
  updateBufferPreview(id);
}

function updateBufferMinutes(id, value) {
  const input = document.getElementById(`buffer-minutes-${id}`);
  if (!input) return;
  input.value = Math.max(0, parseInt(value) || 0);
  updateBufferPreview(id);
}

function addQuickBuffer(id, minutes) {
  const input = document.getElementById(`buffer-minutes-${id}`);
  if (!input) return;
  input.value = (parseInt(input.value) || 0) + minutes;
  updateBufferPreview(id);
}

function updateBufferPreview(id) {
  const summary = document.getElementById(`buffer-summary-${id}`);
  const taskInput = document.getElementById(`task-minutes-${id}`);
  const bufferInput = document.getElementById(`buffer-minutes-${id}`);
  if (!summary || !taskInput || !bufferInput) return;

  const taskMinutes = Math.max(1, parseInt(taskInput.value) || 1);
  const bufferMinutes = Math.max(0, parseInt(bufferInput.value) || 0);
  summary.innerText = `🕒 Task: ${taskMinutes}m · Buffer: ${bufferMinutes}m · Total: ${taskMinutes + bufferMinutes}m`;
}

function saveBuffer(id) {
  const task = tasks.find((t) => t.id === id);
  const taskInput = document.getElementById(`task-minutes-${id}`);
  const bufferInput = document.getElementById(`buffer-minutes-${id}`);
  if (!task || !taskInput || !bufferInput) return;

  task.duration = Math.max(1, parseInt(taskInput.value) || 1);
  task.bufferTime = Math.max(0, parseInt(bufferInput.value) || 0);
  openBufferTaskId = null;
  saveAndRender();
}

function generateSubtasks(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const existing = task.subtasks.map((st) => st.text);
  const startIndex = task.title.length % suggestedSubtasks.length;

  for (let i = 0; i < 3; i++) {
    const text = suggestedSubtasks[(startIndex + i) % suggestedSubtasks.length];
    if (!existing.includes(text)) {
      task.subtasks.push({ text, completed: false });
    }
  }

  saveAndRender();
}

function toggleSubtask(id, idx) {
  const t = tasks.find((x) => x.id === id);
  t.subtasks[idx].completed = !t.subtasks[idx].completed;
  saveAndRender();
}

function deleteSubtask(id, idx) {
  const t = tasks.find((x) => x.id === id);
  t.subtasks.splice(idx, 1);
  saveAndRender();
}

function renderSubtasks(task) {
  const subContainer = document.getElementById(`sub-list-${task.id}`);
  subContainer.innerHTML = "";
  task.subtasks.forEach((st, i) => {
    subContainer.innerHTML += `<div class="subtask-row"><input class="subtask-check" type="checkbox" ${st.completed ? "checked" : ""} onchange="toggleSubtask('${task.id}',${i})"><span class="subtask-text ${st.completed ? "done" : ""}">${st.text}</span><button class="subtask-delete" onclick="deleteSubtask('${task.id}',${i})">×</button></div>`;
  });
}

function renderBufferBox(task) {
  const container = document.getElementById(`buffer-box-${task.id}`);
  if (!container) return;

  const bufferTime = task.bufferTime || 0;
  const total = task.duration + bufferTime;

  if (openBufferTaskId !== task.id) {
    container.innerHTML = `
            <button class="buffer-toggle" onclick="toggleBuffer('${task.id}')">🕒 Task: ${task.duration}m · Buffer: ${bufferTime}m · Total: ${total}m</button>
        `;
    return;
  }

  container.innerHTML = `
        <div class="buffer-box">
            <button class="buffer-toggle open" onclick="toggleBuffer('${task.id}')">🕒 Task: ${task.duration}m · Buffer: ${bufferTime}m · Total: ${total}m</button>
            <div class="buffer-grid">
                <div>
                    <label>Task Time (min)</label>
                    <input id="task-minutes-${task.id}" type="number" min="1" value="${task.duration}" oninput="updateTaskMinutes('${task.id}', this.value)">
                </div>
                <div>
                    <label>Buffer Time (min)</label>
                    <input id="buffer-minutes-${task.id}" type="number" min="0" value="${bufferTime}" oninput="updateBufferMinutes('${task.id}', this.value)">
                </div>
            </div>
            <div class="buffer-quick">
                <button onclick="addQuickBuffer('${task.id}', 5)">+5m (shoes)</button>
                <button onclick="addQuickBuffer('${task.id}', 10)">+10m (prep)</button>
                <button onclick="addQuickBuffer('${task.id}', 15)">+15m (travel)</button>
                <button onclick="addQuickBuffer('${task.id}', 20)">+20m (commute)</button>
            </div>
            <button class="btn" onclick="saveBuffer('${task.id}')">Save</button>
        </div>
    `;
}

function editTask(id) {
  const t = tasks.find((x) => x.id === id);
  document.getElementById("task-id").value = t.id;
  document.getElementById("task-title").value = t.title;
  document.getElementById("task-desc").value = t.desc;
  document.getElementById("task-date").value = t.date;
  document.getElementById("task-start").value = t.start;
  document.getElementById("task-duration").value = t.duration;
  document.getElementById("task-cat-select").value = t.category;
  showView("task-list");
}

function toggleTask(id) {
  const t = tasks.find((x) => x.id === id);
  t.completed = !t.completed;
  saveAndRender();
}

function deleteTask(id) {
  if (confirm("Supprimer ?")) {
    tasks = tasks.filter((t) => t.id !== id);
    saveAndRender();
  }
}

function saveAndRender() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  updateCategoryUI();
  renderList(); // Recrée la liste (et donc les boutons Focus)
  renderCalendar(); // Recrée le calendrier
}

function renderAll() {
  renderList();
  renderCalendar();
}

// Initialisation
document.getElementById("task-date").valueAsDate = new Date();
document.getElementById("calendar-date-picker").valueAsDate = new Date();
saveAndRender();
