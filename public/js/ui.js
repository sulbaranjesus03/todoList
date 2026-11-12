/* =========================================================
   TaskFlow · ui.js
   Capa de vista: referencias del DOM, render y utilidades.
   No conoce api.js (solo app.js la coordina).
   ========================================================= */

const $ = (id) => document.getElementById(id);

const els = {
  // Vistas
  authView: $('auth-view'),
  appView: $('app-view'),
  taskPanel: $('task-panel'),

  // Topbar
  userArea: $('user-area'),
  userName: $('user-name'),
  userInitial: $('user-initial'),
  logoutBtn: $('logout-btn'),
  themeToggle: $('theme-toggle'),

  // Autenticación
  authForm: $('auth-form'),
  authTitle: $('auth-title'),
  authSubtitle: $('auth-subtitle'),
  authError: $('auth-error'),
  authErrorText: $('auth-error-text'),
  authSubmit: $('auth-submit'),
  authSubmitLabel: $('auth-submit-label'),
  authSubmitSpinner: $('auth-submit-spinner'),
  nameWrap: $('name-wrap'),
  nameInput: $('auth-name'),
  emailInput: $('auth-email'),
  passwordInput: $('auth-password'),
  passwordHint: $('password-hint'),
  passwordToggle: $('password-toggle'),
  tabs: document.querySelectorAll('[data-mode]'),
  authTabIndicator: $('auth-tab-indicator'),

  // Cabecera de la app
  greetingText: $('greeting-text'),
  greetingName: $('greeting-name'),
  todayLabel: $('today-label'),
  counter: $('counter'),

  // Estadísticas
  statPending: $('stat-pending'),
  statCompleted: $('stat-completed'),
  statProgress: $('stat-progress'),
  progressTrack: $('progress-track'),
  progressBar: $('progress-bar'),
  progressRingValue: $('progress-ring-value'),
  progressPercent: $('progress-percent'),
  progressBadge: $('progress-badge'),
  progressMessage: $('progress-message'),
  progressSummary: $('progress-summary'),
  asidePending: $('aside-pending'),
  asideCompleted: $('aside-completed'),

  // Tareas
  form: $('task-form'),
  input: $('task-input'),
  taskContent: $('task-content'),
  taskSubmit: $('task-submit'),
  taskSubmitLabel: $('task-submit-label'),
  taskSubmitSpinner: $('task-submit-spinner'),
  taskSubmitIcon: $('task-submit-icon'),
  taskLength: $('task-length'),
  list: $('task-list'),
  loading: $('loading'),
  empty: $('empty'),
  emptyTitle: $('empty-title'),
  emptyText: $('empty-text'),
  emptyAction: $('empty-action'),
  emptyActionLabel: $('empty-action-label'),
  error: $('error'),
  filterGroup: $('filter-group'),
  search: $('task-search'),
  searchClear: $('search-clear'),
  clearCompleted: $('clear-completed'),
  clearCompletedLabel: $('clear-completed-label'),

  // Notificaciones
  toastContainer: $('toast-container'),
};

export const getElements = () => els;


/* =========================================================
   UTILIDADES GENERALES
   ========================================================= */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const nextFrame = (callback) => {
  requestAnimationFrame(() => requestAnimationFrame(callback));
};

/**
 * Anima un elemento con Web Animations API.
 * `fill: 'backwards'` mantiene el primer keyframe durante el delay
 * y devuelve el control a CSS al terminar (no bloquea hovers).
 */
const animateElement = (element, keyframes, duration = 300, options = {}) => {
  if (!element || prefersReducedMotion()) return Promise.resolve();

  const animation = element.animate(keyframes, {
    duration,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'backwards',
    ...options,
  });

  return animation.finished.catch(() => {});
};

const capitalize = (text) =>
  text ? text.charAt(0).toLocaleUpperCase('es') + text.slice(1) : '';

const ICONS = {
  clock: `
    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>`,
  check: `
    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>`,
  trash: `
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
    </svg>`,
};


/* =========================================================
   FECHAS
   ========================================================= */

function parseSqliteDate(value) {
  if (!value) return null;

  // SQLite guarda CURRENT_TIMESTAMP en UTC y sin zona horaria.
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const normalized = hasZone ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCreatedAt(value) {
  const date = parseSqliteDate(value);
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const time = new Intl.DateTimeFormat('es', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) return `Hoy · ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Ayer · ${time}`;

  const days = Math.floor(diffMs / 86400000);
  if (days < 7) {
    return capitalize(
      new Intl.DateTimeFormat('es', { weekday: 'long' }).format(date),
    );
  }

  return capitalize(
    new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
    }).format(date),
  );
}

function todayLabel() {
  return capitalize(
    new Intl.DateTimeFormat('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date()),
  );
}

function greetingByHour() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function initialsFrom(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toLocaleUpperCase('es');
}

function firstNameFrom(name = '') {
  return name.trim().split(/\s+/).filter(Boolean)[0] || 'amigo';
}


/* =========================================================
   TEMA CLARO / OSCURO
   ========================================================= */

const THEME_KEY = 'taskflow-theme';

function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(theme) {
  const dark = theme === 'dark';

  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';

  document
    .querySelectorAll('[data-theme-icon]')
    .forEach((icon) => {
      icon.classList.toggle('hidden', icon.dataset.themeIcon !== (dark ? 'sun' : 'moon'));
    });

  if (els.themeToggle) {
    els.themeToggle.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
    els.themeToggle.setAttribute('aria-pressed', String(dark));
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#070b16' : '#f8fafc');
}

export function initTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (_) { /* almacenamiento no disponible */ }

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored === 'dark' || stored === 'light' ? stored : systemDark ? 'dark' : 'light');

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (event) => {
      let saved = null;
      try {
        saved = localStorage.getItem(THEME_KEY);
      } catch (_) { /* ignorar */ }

      if (saved !== 'dark' && saved !== 'light') {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    });
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';

  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (_) { /* ignorar */ }

  applyTheme(next);

  animateElement(
    els.themeToggle,
    [
      { transform: 'rotate(0deg) scale(1)' },
      { transform: 'rotate(-18deg) scale(0.88)' },
      { transform: 'rotate(0deg) scale(1)' },
    ],
    320,
  );
}


/* =========================================================
   NOTIFICACIONES (TOASTS)
   ========================================================= */

const TOAST_TYPES = {
  success: {
    wrapper:
      'border-emerald-200/80 bg-white/95 text-slate-700 dark:border-emerald-400/20 dark:bg-slate-900/95 dark:text-slate-200',
    badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    icon: `
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.5 2.5 4.5-4.5" />
      </svg>`,
  },
  error: {
    wrapper:
      'border-red-200/80 bg-white/95 text-slate-700 dark:border-red-400/20 dark:bg-slate-900/95 dark:text-slate-200',
    badge: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
    icon: `
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>`,
  },
  info: {
    wrapper:
      'border-indigo-200/80 bg-white/95 text-slate-700 dark:border-indigo-400/20 dark:bg-slate-900/95 dark:text-slate-200',
    badge: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    icon: `
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>`,
  },
};

export function showToast(message, type = 'info') {
  if (!els.toastContainer || !message) return () => {};

  const config = TOAST_TYPES[type] || TOAST_TYPES.info;

  const toast = document.createElement('div');
  toast.className =
    'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5 ' +
    'shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:shadow-black/30 ' +
    config.wrapper;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const badge = document.createElement('span');
  badge.className =
    `mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${config.badge}`;
  badge.innerHTML = config.icon;

  const text = document.createElement('p');
  text.className = 'min-w-0 flex-1 text-sm font-medium leading-relaxed';
  text.textContent = message;

  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', 'Cerrar notificación');
  close.className =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition ' +
    'hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300';
  close.innerHTML =
    '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  toast.append(badge, text, close);

  while (els.toastContainer.children.length >= 3) {
    els.toastContainer.firstElementChild?.remove();
  }

  els.toastContainer.append(toast);

  animateElement(
    toast,
    [
      { opacity: 0, transform: 'translateY(14px) scale(0.97)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ],
    260,
  );

  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(timer);

    if (prefersReducedMotion()) {
      toast.remove();
      return;
    }

    const exit = toast.animate(
      [
        { opacity: 1, transform: 'translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateY(8px) scale(0.97)' },
      ],
      { duration: 200, easing: 'ease-in', fill: 'forwards' },
    );

    exit.finished.then(() => toast.remove()).catch(() => toast.remove());
  };

  const timer = setTimeout(dismiss, 4000);

  close.addEventListener('click', dismiss);
  toast.addEventListener('click', (event) => {
    if (!event.target.closest('button')) dismiss();
  });

  return dismiss;
}


/* =========================================================
   AUTENTICACIÓN
   ========================================================= */

let authMode = 'login';

const TAB_ACTIVE = ['text-slate-900', 'dark:text-white'];
const TAB_INACTIVE = [
  'text-slate-500',
  'hover:text-slate-800',
  'dark:text-slate-400',
  'dark:hover:text-slate-200',
];

function resetPasswordVisibility() {
  if (!els.passwordInput || !els.passwordToggle) return;

  els.passwordInput.type = 'password';
  els.passwordToggle.setAttribute('aria-pressed', 'false');
  els.passwordToggle.setAttribute('aria-label', 'Mostrar contraseña');

  document.querySelectorAll('[data-password-icon]').forEach((icon) => {
    icon.classList.toggle('hidden', icon.dataset.passwordIcon !== 'eye');
  });
}

export function togglePasswordVisibility() {
  if (!els.passwordInput) return;

  const show = els.passwordInput.type === 'password';

  els.passwordInput.type = show ? 'text' : 'password';
  els.passwordToggle.setAttribute('aria-pressed', String(show));
  els.passwordToggle.setAttribute(
    'aria-label',
    show ? 'Ocultar contraseña' : 'Mostrar contraseña',
  );

  document.querySelectorAll('[data-password-icon]').forEach((icon) => {
    icon.classList.toggle(
      'hidden',
      icon.dataset.passwordIcon !== (show ? 'eye-off' : 'eye'),
    );
  });

  els.passwordInput.focus();
}

export function setAuthMode(mode) {
  authMode = mode === 'register' ? 'register' : 'login';
  const isRegister = authMode === 'register';

  els.tabs.forEach((tab) => {
    const active = tab.dataset.mode === authMode;

    tab.classList.remove(...TAB_ACTIVE, ...TAB_INACTIVE);
    tab.classList.add(...(active ? TAB_ACTIVE : TAB_INACTIVE));
    tab.setAttribute('aria-selected', String(active));
  });

  els.authTabIndicator?.classList.toggle('translate-x-full', isRegister);

  const nameWasHidden = els.nameWrap.classList.contains('hidden');
  els.nameWrap.classList.toggle('hidden', !isRegister);

  if (isRegister && nameWasHidden) {
    nextFrame(() => {
      animateElement(
        els.nameWrap,
        [
          { opacity: 0, transform: 'translateY(-6px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        240,
      );
    });
  }

  els.nameInput.required = isRegister;
  els.passwordHint.classList.toggle('hidden', !isRegister);
  els.passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password';

  els.authTitle.textContent = isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo';
  els.authSubtitle.textContent = isRegister
    ? 'Solo necesitas un nombre, un correo y una contraseña.'
    : 'Inicia sesión o crea una cuenta para retomar tu día.';

  els.authSubmitLabel.textContent = isRegister ? 'Crear cuenta' : 'Iniciar sesión';

  resetPasswordVisibility();
  showAuthError('');
}

export function showAuthError(message) {
  const hasError = Boolean(message);

  els.authError.classList.toggle('hidden', !hasError);
  els.authErrorText.textContent = message || '';

  if (!hasError) return;

  nextFrame(() => {
    animateElement(
      els.authError,
      [
        { opacity: 0, transform: 'translateX(-7px)' },
        { opacity: 1, transform: 'translateX(6px)' },
        { opacity: 1, transform: 'translateX(-4px)' },
        { opacity: 1, transform: 'translateX(2px)' },
        { opacity: 1, transform: 'translateX(0)' },
      ],
      380,
    );
  });
}

export function setAuthBusy(busy) {
  els.authSubmit.disabled = busy;
  els.authForm.setAttribute('aria-busy', String(busy));

  els.authSubmitSpinner.classList.toggle('hidden', !busy);

  const isRegister = authMode === 'register';

  els.authSubmitLabel.textContent = busy
    ? isRegister
      ? 'Creando cuenta...'
      : 'Entrando...'
    : isRegister
      ? 'Crear cuenta'
      : 'Iniciar sesión';
}

export function setLogoutBusy(busy) {
  els.logoutBtn.disabled = busy;
  els.logoutBtn.classList.toggle('pointer-events-none', busy);
  els.logoutBtn.classList.toggle('opacity-60', busy);
}

export function animateLogout() {
  if (!els.userArea || prefersReducedMotion()) return Promise.resolve();

  const animation = els.userArea.animate(
    [
      { opacity: 1, transform: 'translateX(0)' },
      { opacity: 0, transform: 'translateX(16px)' },
    ],
    { duration: 180, easing: 'ease-in', fill: 'forwards' },
  );

  return animation.finished
    .then(() => animation.cancel())
    .catch(() => {});
}


/* =========================================================
   TAREAS · CREACIÓN DE NODOS
   ========================================================= */

function appendHighlightedText(node, text, query) {
  const needle = query.trim();

  if (!needle) {
    node.textContent = text;
    return;
  }

  const haystack = text.toLocaleLowerCase('es');
  const lowerNeedle = needle.toLocaleLowerCase('es');
  let cursor = 0;
  let index = haystack.indexOf(lowerNeedle);

  if (index === -1) {
    node.textContent = text;
    return;
  }

  while (index !== -1) {
    if (index > cursor) {
      node.append(document.createTextNode(text.slice(cursor, index)));
    }

    const mark = document.createElement('mark');
    mark.className =
      'rounded bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-300/25 dark:text-amber-100';
    mark.textContent = text.slice(index, index + lowerNeedle.length);
    node.append(mark);

    cursor = index + lowerNeedle.length;
    index = haystack.indexOf(lowerNeedle, cursor);
  }

  if (cursor < text.length) {
    node.append(document.createTextNode(text.slice(cursor)));
  }
}

function createTaskItem(task, query) {
  const completed = Boolean(task.completed);
  const contentText = String(task.content ?? '').trim();

  const li = document.createElement('li');
  li.dataset.id = String(task.id);
  li.dataset.completed = String(completed);
  li.className =
    'group relative flex items-start gap-3 rounded-2xl border p-3.5 ' +
    'shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 ' +
    'hover:-translate-y-0.5 hover:shadow-md sm:p-4 ' +
    (completed
      ? 'border-slate-200/70 bg-slate-50/70 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/15'
      : 'border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-indigo-500/5 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-400/25');

  /* Checkbox */
  const check = document.createElement('button');
  check.type = 'button';
  check.dataset.action = 'toggle';
  check.setAttribute('role', 'checkbox');
  check.setAttribute('aria-checked', String(completed));
  check.setAttribute('aria-label', completed ? 'Marcar como pendiente' : 'Marcar como completada');
  check.className =
    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ' +
    'transition-all duration-200 focus-visible:outline-none active:scale-90 ' +
    (completed
      ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 hover:border-emerald-600 hover:bg-emerald-600'
      : 'border-slate-300 text-transparent hover:border-indigo-500 hover:bg-indigo-50 dark:border-slate-600 dark:hover:border-indigo-400 dark:hover:bg-indigo-500/10');
  check.innerHTML = ICONS.check;

  /* Contenido */
  const content = document.createElement('div');
  content.className = 'min-w-0 flex-1';

  const title = document.createElement('p');
  title.className =
    'break-words text-[15px] font-medium leading-snug transition-colors duration-200 ' +
    (completed
      ? 'text-slate-400 line-through decoration-slate-300 dark:text-slate-500 dark:decoration-slate-600'
      : 'text-slate-800 dark:text-slate-100');
  appendHighlightedText(title, String(task.title), query);

  const note = document.createElement('p');
  note.className =
    'mt-1 whitespace-pre-line break-words text-sm leading-relaxed ' +
    (completed
      ? 'text-slate-400/90 dark:text-slate-500'
      : 'text-slate-500 dark:text-slate-400');
  if (contentText) appendHighlightedText(note, contentText, query);

  const meta = document.createElement('div');
  meta.className = 'mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]';

  const time = document.createElement('span');
  time.className =
    'inline-flex items-center gap-1 text-slate-400 dark:text-slate-500';
  time.innerHTML = ICONS.clock;
  time.append(document.createTextNode(formatCreatedAt(task.created_at)));

  const badge = document.createElement('span');
  badge.className =
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ' +
    'uppercase tracking-wide ring-1 ring-inset ' +
    (completed
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20'
      : 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20');
  badge.textContent = completed ? 'Hecha' : 'Pendiente';

  meta.append(time, badge);
  content.append(title);

  if (contentText) content.append(note);

  content.append(meta);

  /* Eliminar */
  const del = document.createElement('button');
  del.type = 'button';
  del.dataset.action = 'delete';
  del.setAttribute('aria-label', 'Eliminar tarea');
  del.className =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 ' +
    'transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-90 ' +
    'dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-300 ' +
    'sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100';
  del.innerHTML = ICONS.trash;

  li.append(check, content, del);

  return li;
}


/* =========================================================
   ESTADÍSTICAS Y FILTROS
   ========================================================= */

function setStatValue(element, value) {
  if (!element) return;

  const next = String(value);
  if (element.textContent === next) return;

  element.textContent = next;

  animateElement(
    element,
    [
      { opacity: 0.35, transform: 'translateY(-3px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    220,
  );
}

function updateFilterButtons(filter, counts) {
  els.filterGroup.querySelectorAll('[data-filter]').forEach((button) => {
    const active = button.dataset.filter === filter;
    const base =
      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all duration-200';

    button.className = active
      ? `${base} bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:bg-white/10 dark:text-white dark:ring-white/10`
      : `${base} text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200`;

    button.setAttribute('aria-selected', String(active));
  });

  Object.entries(counts).forEach(([key, value]) => {
    const counter = els.filterGroup.querySelector(`[data-count="${key}"]`);
    if (counter) counter.textContent = String(value);
  });
}

function updateStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  setStatValue(els.statPending, pending);
  setStatValue(els.statCompleted, completed);
  setStatValue(els.statProgress, `${percent}%`);

  if (els.progressBar) els.progressBar.style.width = `${percent}%`;
  if (els.progressTrack) {
    els.progressTrack.setAttribute('aria-valuenow', String(percent));
  }
  if (els.progressPercent) els.progressPercent.textContent = `${percent}%`;
  if (els.progressBadge) els.progressBadge.textContent = `${percent}%`;
  if (els.asidePending) els.asidePending.textContent = String(pending);
  if (els.asideCompleted) els.asideCompleted.textContent = String(completed);

  // Círculo de progreso (radio 34 → circunferencia 213.63)
  if (els.progressRingValue) {
    const circumference = 213.63;
    els.progressRingValue.style.strokeDashoffset = String(
      circumference * (1 - percent / 100),
    );
  }

  const pendingLabel = pending === 1 ? '1 tarea' : `${pending} tareas`;

  let message = 'Aún no hay tareas';
  let summary = 'Añade tu primera tarea para empezar.';

  if (total > 0) {
    if (percent === 100) {
      message = '¡Todo completado!';
      summary = 'Buen trabajo. Tu lista está en cero.';
    } else if (percent >= 70) {
      message = 'Casi lo tienes';
      summary = `Te queda${pending === 1 ? '' : 'n'} ${pendingLabel} por completar.`;
    } else if (percent >= 35) {
      message = 'Vas por buen camino';
      summary = `Te queda${pending === 1 ? '' : 'n'} ${pendingLabel}. Sigue así.`;
    } else if (percent > 0) {
      message = 'Buen comienzo';
      summary = `Has completado ${completed} de ${total} tareas. Te queda${pending === 1 ? '' : 'n'} ${pendingLabel}.`;
    } else {
      message = 'Empieza con una tarea';
      summary = `Tienes ${pendingLabel} por delante. Un paso a la vez.`;
    }
  }

  if (els.progressMessage) els.progressMessage.textContent = message;
  if (els.progressSummary) els.progressSummary.textContent = summary;

  const counterText =
    total === 0
      ? 'Sin tareas todavía'
      : `${pending} pendiente${pending === 1 ? '' : 's'} de ${total}`;

  if (els.counter.textContent !== counterText) {
    els.counter.textContent = counterText;

    animateElement(
      els.counter,
      [
        { opacity: 0.3, transform: 'translateY(-4px) scale(0.96)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      240,
    );
  }
}

function updateEmpty(visibleCount, total, filter, query) {
  const isLoading = !els.loading.classList.contains('hidden');
  const shouldHide = isLoading || visibleCount > 0;
  const wasHidden = els.empty.classList.contains('hidden');

  els.empty.classList.toggle('hidden', shouldHide);

  if (shouldHide) return;

  let title = 'Tu lista está vacía';
  let text = 'Añade tu primera tarea y empieza a avanzar.';
  let action = 'Crear mi primera tarea';

  if (query) {
    title = 'Sin coincidencias';
    text = `No encontramos tareas que coincidan con «${query}».`;
    action = 'Limpiar búsqueda';
  } else if (total === 0) {
    title = 'Tu lista está vacía';
    text = 'Añade tu primera tarea y empieza a avanzar.';
    action = 'Crear mi primera tarea';
  } else if (filter === 'pending') {
    title = '¡Todo al día!';
    text = 'No tienes tareas pendientes. Disfruta el momento.';
    action = 'Ver todas las tareas';
  } else if (filter === 'completed') {
    title = 'Aún nada por aquí';
    text = 'Marca una tarea como completada y aparecerá en esta lista.';
    action = 'Ver tareas pendientes';
  }

  els.emptyTitle.textContent = title;
  els.emptyText.textContent = text;
  els.emptyActionLabel.textContent = action;

  if (wasHidden) {
    nextFrame(() => {
      animateElement(
        els.empty,
        [
          { opacity: 0, transform: 'translateY(10px) scale(0.985)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ],
        300,
      );
    });
  }
}


/* =========================================================
   TAREAS · RENDER
   ========================================================= */

export function renderTasks(tasks, { filter = 'all', query = '' } = {}) {
  const validFilter = ['all', 'pending', 'completed'].includes(filter)
    ? filter
    : 'all';
  const search = query.trim();
  const lowerSearch = search.toLocaleLowerCase('es');

  const visible = tasks.filter((task) => {
    const matchesFilter =
      validFilter === 'all' ||
      (validFilter === 'pending' ? !task.completed : task.completed);

    const matchesQuery =
      !lowerSearch ||
      String(task.title).toLocaleLowerCase('es').includes(lowerSearch) ||
      String(task.content ?? '').toLocaleLowerCase('es').includes(lowerSearch);

    return matchesFilter && matchesQuery;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
  };

  els.list.replaceChildren(...visible.map((task) => createTaskItem(task, search)));

  // Al buscar no animamos para evitar parpadeos en cada pulsación.
  if (!search) {
    [...els.list.children].forEach((item, index) => {
      animateElement(
        item,
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        240,
        { delay: Math.min(index, 10) * 28 },
      );
    });
  }

  updateStats(tasks);
  updateFilterButtons(validFilter, counts);
  updateEmpty(visible.length, tasks.length, validFilter, search);

  const hasSearch = Boolean(search);
  els.searchClear.classList.toggle('hidden', !hasSearch);
  els.searchClear.classList.toggle('flex', hasSearch);

  setClearCompletedVisible(counts.completed > 0);

  if (counts.completed === 0) setClearCompletedConfirm(false);
}


/* =========================================================
   TAREAS · ANIMACIONES Y ESTADOS
   ========================================================= */

export function animateTaskToggle(taskElement) {
  if (!taskElement) return;

  animateElement(
    taskElement,
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.012)' },
      { transform: 'scale(1)' },
    ],
    240,
  );
}

export function animateTaskRemoval(taskElement) {
  if (!taskElement) return Promise.resolve();

  if (prefersReducedMotion()) {
    taskElement.remove();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const animation = taskElement.animate(
      [
        {
          opacity: 1,
          transform: 'translateX(0) scale(1)',
          maxHeight: '180px',
        },
        {
          opacity: 0,
          transform: 'translateX(32px) scale(0.96)',
          maxHeight: '0px',
        },
      ],
      { duration: 220, easing: 'ease-in', fill: 'forwards' },
    );

    animation.finished
      .then(() => {
        animation.cancel();
        resolve();
      })
      .catch(() => resolve());
  });
}

export const clearForm = () => {
  els.form.reset();
  updateTaskLength();
  updateContentHeight();

  animateElement(
    els.input,
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.008)' },
      { transform: 'scale(1)' },
    ],
    200,
  );

  els.input.focus();
};

export function updateTaskLength() {
  if (!els.taskLength) return;

  const length = els.input.value.length;
  const nearLimit = length >= 230;

  els.taskLength.textContent = `${length}/255`;
  els.taskLength.className =
    'shrink-0 text-[11px] font-medium tabular-nums ' +
    (nearLimit
      ? 'text-amber-500 dark:text-amber-400'
      : 'text-slate-400 dark:text-slate-500');
}

/**
 * Ajusta la altura del textarea de contenido a su texto, con un máximo
 * marcado por CSS (`max-h-52`). Si está oculto, quita la altura inline.
 */
export function updateContentHeight() {
  if (!els.taskContent) return;

  els.taskContent.style.height = 'auto';

  const height = els.taskContent.scrollHeight;
  els.taskContent.style.height = height > 0 ? `${height}px` : '';
}

export function setTaskBusy(busy) {
  els.taskSubmit.disabled = busy;
  els.taskSubmitSpinner.classList.toggle('hidden', !busy);
  els.taskSubmitIcon.classList.toggle('hidden', busy);
  els.taskSubmitLabel.textContent = busy ? 'Añadiendo...' : 'Añadir tarea';
}

export const setLoading = (isLoading) => {
  els.loading.classList.toggle('hidden', !isLoading);
  els.list.classList.toggle('hidden', isLoading);
  els.taskPanel.setAttribute('aria-busy', String(isLoading));

  if (isLoading && els.empty) {
    els.empty.classList.add('hidden');
  }
};

let errorTimer = null;

export function showError(message) {
  clearTimeout(errorTimer);

  els.error.textContent = message || '';
  const hasError = Boolean(message);

  els.error.classList.toggle('hidden', !hasError);

  if (!hasError) return;

  nextFrame(() => {
    animateElement(
      els.error,
      [
        { opacity: 0, transform: 'translateY(-6px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      240,
    );
  });

  errorTimer = setTimeout(() => {
    els.error.classList.add('hidden');
  }, 6500);
}

function setClearCompletedVisible(visible) {
  els.clearCompleted.classList.toggle('hidden', !visible);
  els.clearCompleted.classList.toggle('inline-flex', visible);
}

const CLEAR_IDLE = [
  'text-slate-400',
  'hover:bg-red-50',
  'hover:text-red-600',
  'dark:text-slate-500',
  'dark:hover:bg-red-500/10',
  'dark:hover:text-red-300',
];

const CLEAR_CONFIRM = [
  'bg-red-50',
  'text-red-600',
  'ring-1',
  'ring-red-200',
  'dark:bg-red-500/10',
  'dark:text-red-300',
  'dark:ring-red-400/20',
];

export function setClearCompletedConfirm(active) {
  els.clearCompleted.classList.remove(...CLEAR_IDLE, ...CLEAR_CONFIRM);
  els.clearCompleted.classList.add(...(active ? CLEAR_CONFIRM : CLEAR_IDLE));

  els.clearCompletedLabel.textContent = active
    ? '¿Confirmar?'
    : 'Limpiar completadas';

  els.clearCompleted.setAttribute(
    'aria-label',
    active
      ? 'Confirmar eliminación de tareas completadas'
      : 'Eliminar tareas completadas',
  );
}

export function resetTasksView() {
  els.form.reset();
  els.list.replaceChildren();
  els.search.value = '';
  els.searchClear.classList.add('hidden');
  els.searchClear.classList.remove('flex');
  setClearCompletedConfirm(false);
  setClearCompletedVisible(false);
  updateTaskLength();
  updateContentHeight();
  showError('');
}

export const focusSearch = () => {
  els.search.focus();
  els.search.select();
};

export const focusComposer = () => {
  els.input.focus();
};


/* =========================================================
   VISTAS PRINCIPALES
   ========================================================= */

export function showAuth() {
  els.appView.classList.add('hidden');
  els.authView.classList.remove('hidden');

  els.userArea.getAnimations().forEach((animation) => animation.cancel());
  els.userArea.classList.add('hidden');
  els.userArea.classList.remove('flex');

  document.title = 'Iniciar sesión · TaskFlow';

  nextFrame(() => {
    animateElement(
      els.authView,
      [
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      320,
    );
  });
}

export function showApp(user) {
  const name = String(user?.name || 'amigo').trim() || 'amigo';

  els.authView.classList.add('hidden');
  els.appView.classList.remove('hidden');

  els.userArea.getAnimations().forEach((animation) => animation.cancel());
  els.userArea.classList.remove('hidden');
  els.userArea.classList.add('flex');

  els.userName.textContent = name;
  els.userInitial.textContent = initialsFrom(name);
  els.greetingName.textContent = firstNameFrom(name);
  els.greetingText.textContent = greetingByHour();
  els.todayLabel.textContent = todayLabel();

  document.title = 'Mis tareas · TaskFlow';

  nextFrame(() => {
    animateElement(
      els.appView,
      [
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      320,
    );

    animateElement(
      els.userArea,
      [
        { opacity: 0, transform: 'translateX(10px)' },
        { opacity: 1, transform: 'translateX(0)' },
      ],
      280,
    );
  });
}

updateTaskLength();
updateContentHeight();

