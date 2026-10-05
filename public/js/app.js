import {
  getSession, login, register, logout,
  getTasks, createTask, toggleTask, deleteTask,
} from './api.js';
import {
  getElements, renderTasks, clearForm, setLoading, showError,
  showAuth, showApp, setAuthMode, showAuthError, setAuthBusy,
} from './ui.js';

const { form, input, list, authForm, logoutBtn, tabs } = getElements();

let tasks = [];
let authMode = 'login';

/* ---------- Utilidades ---------- */

function resetToAuth() {
  tasks = [];
  renderTasks(tasks);
  authMode = 'login';
  setAuthMode(authMode);
  showAuth();
}

async function run(action) {
  showError('');
  try {
    await action();
  } catch (err) {
    if (err.status === 401) return resetToAuth(); // sesión expirada
    showError(err.message);
  }
}

async function loadTasks() {
  setLoading(true);
  await run(async () => {
    tasks = await getTasks();
    renderTasks(tasks);
  });
  setLoading(false);
}

async function enterApp(user) {
  authForm.reset();
  showApp(user);
  await loadTasks();
}

/* ---------- Autenticación ---------- */

tabs.forEach((tab) =>
  tab.addEventListener('click', () => {
    authMode = tab.dataset.mode;
    setAuthMode(authMode);
  })
);

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { name, email, password } = Object.fromEntries(new FormData(authForm));

  showAuthError('');
  setAuthBusy(true);
  try {
    const user =
      authMode === 'login'
        ? await login(email, password)
        : await register(name, email, password);
    await enterApp(user);
  } catch (err) {
    showAuthError(err.message);
  } finally {
    setAuthBusy(false);
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await logout();
  } finally {
    resetToAuth();
  }
});

/* ---------- Tareas ---------- */

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;

  run(async () => {
    const task = await createTask(title);
    tasks = [task, ...tasks];
    renderTasks(tasks);
    clearForm();
  });
});

list.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = Number(btn.closest('li').dataset.id);

  run(async () => {
    if (btn.dataset.action === 'toggle') {
      const updated = await toggleTask(id);
      tasks = tasks.map((t) => (t.id === id ? updated : t));
    } else if (btn.dataset.action === 'delete') {
      await deleteTask(id);
      tasks = tasks.filter((t) => t.id !== id);
    }
    renderTasks(tasks);
  });
});

/* ---------- Arranque ---------- */

(async function init() {
  setAuthMode(authMode);
  try {
    const user = await getSession();
    user ? await enterApp(user) : showAuth();
  } catch {
    showAuth();
  }
})();