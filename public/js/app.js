import {
  getSession, login, register, logout,
  getTasks, createTask, toggleTask, deleteTask,
} from './api.js';
import {
  getElements, renderTasks, clearForm, setLoading, showError,
  showAuth, showApp, setAuthMode, showAuthError, setAuthBusy,
  animateLogout, initTheme, toggleTheme, togglePasswordVisibility,
  showToast, setTaskBusy, updateTaskLength, setClearCompletedConfirm,
  resetTasksView, focusSearch, focusComposer, setLogoutBusy,
  animateTaskToggle, animateTaskRemoval, updateContentHeight,
} from './ui.js';

const {
  form, input, list, authForm, logoutBtn, tabs, passwordToggle, themeToggle,
  filterGroup, search, searchClear, clearCompleted, emptyAction, appView, taskContent,
} = getElements();

/* ---------- Estado ---------- */

let tasks = [];
let authMode = 'login';
let filter = 'all';
let query = '';

const busyIds = new Set();
let searchTimer = null;
let clearConfirm = false;
let clearConfirmTimer = null;

const currentView = () => ({ filter, query });
const refresh = () => renderTasks(tasks, currentView());

const firstWord = (name = '') =>
  String(name).trim().split(/\s+/).filter(Boolean)[0] || 'amigo';

function handleSessionError(error) {
  if (error?.status !== 401) return false;

  resetToAuth();
  showToast('Tu sesión expiró. Vuelve a iniciar sesión.', 'info');
  return true;
}

function resetClearConfirm() {
  clearTimeout(clearConfirmTimer);
  clearConfirm = false;
  setClearCompletedConfirm(false);
}

function resetToAuth() {
  tasks = [];
  filter = 'all';
  query = '';
  busyIds.clear();
  clearTimeout(searchTimer);

  resetClearConfirm();
  resetTasksView();
  setLoading(false);
  renderTasks(tasks, currentView());

  authMode = 'login';
  setAuthMode(authMode);
  setAuthBusy(false);
  setLogoutBusy(false);
  showAuth();
}

function clearSearch({ focus = true } = {}) {
  clearTimeout(searchTimer);
  search.value = '';
  query = '';
  refresh();
  if (focus) search.focus();
}

/* ---------- Carga inicial y sesión ---------- */

async function loadTasks() {
  setLoading(true);

  try {
    tasks = await getTasks();
    setLoading(false);
    refresh();
  } catch (error) {
    setLoading(false);

    if (handleSessionError(error)) return;

    showError(error.message || 'No se pudieron cargar las tareas.');
    refresh();
  }
}

async function enterApp(user) {
  authForm.reset();
  tasks = [];
  filter = 'all';
  query = '';

  resetTasksView();
  resetClearConfirm();
  showApp(user);

  await loadTasks();
}

/* ---------- Autenticación ---------- */

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    authMode = tab.dataset.mode === 'register' ? 'register' : 'login';
    setAuthMode(authMode);
    setAuthBusy(false);
  });
});

passwordToggle.addEventListener('click', togglePasswordVisibility);

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const { name, email, password } = Object.fromEntries(new FormData(authForm));

  showAuthError('');
  setAuthBusy(true);

  try {
    const user =
      authMode === 'login'
        ? await login(email, password)
        : await register(name, email, password);

    const mode = authMode;

    await enterApp(user);

    showToast(
      mode === 'register'
        ? `Cuenta creada. Bienvenido, ${firstWord(user.name)}.`
        : `Hola de nuevo, ${firstWord(user.name)}.`,
      'success',
    );
  } catch (error) {
    showAuthError(error.message || 'No pudimos completar la operación.');
  } finally {
    setAuthBusy(false);
  }
});

logoutBtn.addEventListener('click', async () => {
  setLogoutBusy(true);

  await Promise.allSettled([logout(), animateLogout()]);

  resetToAuth();
  showToast('Sesión cerrada. ¡Hasta pronto!', 'info');
});

/* ---------- Tema ---------- */

themeToggle.addEventListener('click', toggleTheme);

/* ---------- Crear tarea ---------- */

input.addEventListener('input', updateTaskLength);
taskContent.addEventListener('input', updateContentHeight);

taskContent.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const title = String(data.get('title') ?? '').trim();
  const content = String(data.get('content') ?? '').trim();

  if (!title) {
    input.focus();
    return;
  }

  showError('');
  setTaskBusy(true);

  try {
    const task = await createTask(title, content);

    tasks = [task, ...tasks];

    // Al añadir, mostramos siempre el resultado recién creado.
    filter = 'all';
    query = '';
    search.value = '';
    clearTimeout(searchTimer);

    refresh();
    clearForm();
    showToast('Tarea añadida a tu lista.', 'success');
  } catch (error) {
    if (handleSessionError(error)) return;
    showError(error.message || 'No se pudo añadir la tarea.');
  } finally {
    setTaskBusy(false);
  }
});

/* ---------- Filtros y búsqueda ---------- */

filterGroup.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;

  const nextFilter = button.dataset.filter;
  if (nextFilter === filter) return;

  filter = nextFilter;
  refresh();
});

search.addEventListener('input', () => {
  query = search.value.trim();

  clearTimeout(searchTimer);
  searchTimer = setTimeout(refresh, 120);
});

searchClear.addEventListener('click', () => clearSearch());

/* ---------- Acciones sobre tareas ---------- */

async function handleToggle(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  const wasCompleted = task.completed;
  busyIds.add(id);

  // Actualización optimista: respuesta inmediata en la interfaz.
  tasks = tasks.map((item) =>
    item.id === id ? { ...item, completed: !wasCompleted } : item,
  );
  refresh();

  const updatedItem = list.querySelector(`li[data-id="${id}"]`);
  animateTaskToggle(updatedItem);

  try {
    await toggleTask(id);

    showToast(
      wasCompleted ? 'Tarea reabierta.' : '¡Tarea completada!',
      'success',
    );
  } catch (error) {
    // Rollback solo de esta tarea, sin afectar a otras acciones en curso.
    tasks = tasks.map((item) =>
      item.id === id ? { ...item, completed: wasCompleted } : item,
    );
    refresh();

    if (handleSessionError(error)) return;

    showToast(error.message || 'No se pudo actualizar la tarea.', 'error');
  } finally {
    busyIds.delete(id);
  }
}

async function handleDelete(id, item) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return;

  const removed = tasks[index];
  busyIds.add(id);

  // Adjuntamos el manejo de la promesa de inmediato para evitar
  // rechazos no controlados mientras corre la animación.
  const request = deleteTask(id).then(
    () => ({ ok: true }),
    (error) => ({ ok: false, error }),
  );

  await animateTaskRemoval(item);

  tasks = tasks.filter((task) => task.id !== id);
  refresh();

  const result = await request;

  if (result.ok) {
    showToast('Tarea eliminada.', 'success');
  } else {
    const restored = [...tasks];
    restored.splice(Math.min(index, restored.length), 0, removed);
    tasks = restored;
    refresh();

    if (!handleSessionError(result.error)) {
      showToast(result.error?.message || 'No se pudo eliminar la tarea.', 'error');
    }
  }

  busyIds.delete(id);
}


list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const item = button.closest('li');
  if (!item) return;

  const id = Number(item.dataset.id);
  if (!Number.isFinite(id) || busyIds.has(id)) return;

  if (button.dataset.action === 'toggle') {
    handleToggle(id);
  } else if (button.dataset.action === 'delete') {
    handleDelete(id, item);
  }
});

/* ---------- Limpiar completadas (con confirmación) ---------- */

async function clearCompletedTasks() {
  const completedTasks = tasks.filter((task) => task.completed);
  if (completedTasks.length === 0) return;

  const previous = tasks;
  const completedIds = new Set(completedTasks.map((task) => task.id));

  tasks = tasks.filter((task) => !task.completed);
  refresh();

  const results = await Promise.allSettled(
    completedTasks.map((task) => deleteTask(task.id)),
  );

  const failedTasks = [];
  let sessionExpired = false;

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      failedTasks.push(completedTasks[index]);
      if (result.reason?.status === 401) sessionExpired = true;
    }
  });

  if (failedTasks.length === 0) {
    showToast(
      `${completedTasks.length} tarea${completedTasks.length === 1 ? '' : 's'} eliminada${completedTasks.length === 1 ? '' : 's'}.`,
      'success',
    );
    return;
  }

  const failedIds = new Set(failedTasks.map((task) => task.id));
  tasks = previous.filter(
    (task) => !completedIds.has(task.id) || failedIds.has(task.id),
  );
  refresh();

  if (sessionExpired) {
    resetToAuth();
    showToast('Tu sesión expiró. Vuelve a iniciar sesión.', 'info');
    return;
  }

  showToast(
    `No se pudieron eliminar ${failedTasks.length} tarea${failedTasks.length === 1 ? '' : 's'}.`,
    'error',
  );
}

clearCompleted.addEventListener('click', async () => {
  if (!clearConfirm) {
    clearConfirm = true;
    setClearCompletedConfirm(true);

    clearTimeout(clearConfirmTimer);
    clearConfirmTimer = setTimeout(() => {
      clearConfirm = false;
      setClearCompletedConfirm(false);
    }, 3500);
    return;
  }

  resetClearConfirm();
  await clearCompletedTasks();
});

/* ---------- Estado vacío ---------- */

emptyAction.addEventListener('click', () => {
  if (query) {
    clearSearch();
    return;
  }

  if (filter !== 'all') {
    filter = 'all';
    refresh();
    return;
  }

  focusComposer();
});

/* ---------- Atajos de teclado ---------- */

document.addEventListener('keydown', (event) => {
  if (appView.classList.contains('hidden')) return;

  const target = event.target;
  const isField =
    target instanceof HTMLElement &&
    (target.matches('input, textarea, select') || target.isContentEditable);

  if (event.key === '/' && !isField) {
    event.preventDefault();
    focusSearch();
    return;
  }

  if (
    event.key.toLocaleLowerCase('es') === 'n' &&
    !isField &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    event.preventDefault();
    focusComposer();
    return;
  }

  if (event.key === 'Escape') {
    if (search.value) {
      clearSearch({ focus: document.activeElement === search });
    } else if (isField) {
      target.blur();
    }
  }
});

/* ---------- Arranque ---------- */

initTheme();
setAuthMode(authMode);

(async function init() {
  try {
    const user = await getSession();

    if (user) {
      await enterApp(user);
    } else {
      showAuth();
    }
  } catch {
    showAuth();
  }
})();
