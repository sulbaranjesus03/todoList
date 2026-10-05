const $ = (id) => document.getElementById(id);

const els = {
  // tareas
  form: $('task-form'),
  input: $('task-input'),
  list: $('task-list'),
  loading: $('loading'),
  empty: $('empty'),
  error: $('error'),
  counter: $('counter'),

  // vistas y topbar
  authView: $('auth-view'),
  appView: $('app-view'),
  userArea: $('user-area'),
  userName: $('user-name'),
  userInitial: $('user-initial'),
  logoutBtn: $('logout-btn'),

  // auth
  authForm: $('auth-form'),
  authError: $('auth-error'),
  authSubmit: $('auth-submit'),
  nameWrap: $('name-wrap'),
  nameInput: $('auth-name'),
  passwordInput: $('auth-password'),
  passwordHint: $('password-hint'),
  tabs: document.querySelectorAll('[data-mode]'),
  
};

export const getElements = () => els;


/* =========================================================
   ANIMACIONES
   ========================================================= */

const nextFrame = (callback) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
};

const animateElement = (element, animation, duration = 300) => {
  if (!element) return;

  element.animate(animation, {
    duration,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'both',
  });
};


/* =========================================================
   TAREAS
   ========================================================= */

function createTaskItem(task) {
  const li = document.createElement('li');

  li.dataset.id = task.id;

  /*
   * Estado inicial de la animación.
   * Se elimina después de entrar.
   */
  li.className =
    'group flex items-center gap-3 rounded-xl border border-slate-200 ' +
    'bg-white px-4 py-3 opacity-0 translate-y-2 ' +
    'transition-all duration-200 ' +
    'hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm';


  /* ---------- Checkbox ---------- */

  const check = document.createElement('button');

  check.type = 'button';
  check.dataset.action = 'toggle';
  check.setAttribute('aria-label', 'Cambiar estado');

  check.className =
    'cursor-pointer flex h-6 w-6 shrink-0 items-center justify-center rounded-full ' +
    'border-2 text-xs font-bold transition-all duration-200 ' +
    'active:scale-75 ' +
    (task.completed
      ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-200'
      : 'border-slate-300 text-transparent hover:scale-110 hover:border-indigo-500 hover:bg-indigo-50');

  check.textContent = '✓';


  /* ---------- Título ---------- */

  const title = document.createElement('span');

  title.className =
    'flex-1 break-words transition-all duration-300 ' +
    (task.completed
      ? 'text-slate-400 line-through'
      : 'text-slate-800');

  title.textContent = task.title;


  /* ---------- Estado ---------- */

  const badge = document.createElement('span');

  badge.className =
    'rounded-full px-2.5 py-1 text-xs font-semibold ' +
    'transition-all duration-300 ' +
    (task.completed
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700');

  badge.textContent = task.completed
    ? 'Hecha'
    : 'Pendiente';


  /* ---------- Eliminar ---------- */

  const del = document.createElement('button');

  del.type = 'button';
  del.dataset.action = 'delete';
  del.setAttribute('aria-label', 'Eliminar tarea');

  del.className =
    'cursor-pointer rounded-lg px-2 py-1.5 text-slate-400 ' +
    'transition-all duration-200 ' +
    'hover:bg-red-50 hover:text-red-600 hover:scale-110 ' +
    'active:scale-90 ' +
    'sm:opacity-0 sm:group-hover:opacity-100';

  del.innerHTML = `
    <svg
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  `;


  li.append(check, title, badge, del);

  return li;
}


/* =========================================================
   RENDER DE TAREAS
   ========================================================= */

export function renderTasks(tasks) {
  els.list.replaceChildren(
    ...tasks.map(createTaskItem)
  );

  /*
   * Animación escalonada.
   * Cada tarea aparece ligeramente después de la anterior.
   */
  const items = [...els.list.children];

  items.forEach((item, index) => {
    setTimeout(() => {
      item.classList.remove('opacity-0', 'translate-y-2');

      item.classList.add(
        'opacity-100',
        'translate-y-0'
      );
    }, index * 45);
  });


  toggleEmpty(tasks.length === 0);


  /* ---------- Contador ---------- */

  const pending = tasks.filter(
    (task) => !task.completed
  ).length;

  const newCounter = tasks.length
    ? `${pending} pendiente${pending === 1 ? '' : 's'} de ${tasks.length}`
    : '';

  if (els.counter.textContent !== newCounter) {
    animateElement(
      els.counter,
      [
        {
          opacity: 0.3,
          transform: 'translateY(-4px) scale(0.95)',
        },
        {
          opacity: 1,
          transform: 'translateY(0) scale(1)',
        },
      ],
      250
    );
  }

  els.counter.textContent = newCounter;
}


/* =========================================================
   ANIMACIÓN DE UNA TAREA
   ========================================================= */

export function animateTaskToggle(taskElement) {
  if (!taskElement) return;

  animateElement(
    taskElement,
    [
      {
        transform: 'scale(1)',
      },
      {
        transform: 'scale(1.025)',
      },
      {
        transform: 'scale(1)',
      },
    ],
    300
  );
}


/* =========================================================
   ANIMACIÓN DE ELIMINACIÓN
   ========================================================= */

export function animateTaskRemoval(taskElement) {
  if (!taskElement) return Promise.resolve();

  return new Promise((resolve) => {
    const animation = taskElement.animate(
      [
        {
          opacity: 1,
          transform: 'translateX(0) scale(1)',
          maxHeight: '100px',
        },
        {
          opacity: 0,
          transform: 'translateX(35px) scale(0.95)',
          maxHeight: '0px',
        },
      ],
      {
        duration: 250,
        easing: 'ease-in',
        fill: 'forwards',
      }
    );

    animation.onfinish = resolve;
  });
}


/* =========================================================
   FORMULARIO
   ========================================================= */

export const clearForm = () => {
  els.form.reset();

  /*
   * Pequeña animación al limpiar el formulario.
   */
  animateElement(
    els.input,
    [
      {
        transform: 'scale(1)',
      },
      {
        transform: 'scale(1.01)',
      },
      {
        transform: 'scale(1)',
      },
    ],
    200
  );

  els.input.focus();
};


/* =========================================================
   LOADING
   ========================================================= */

export const setLoading = (isLoading) => {
  els.loading.classList.toggle(
    'hidden',
    !isLoading
  );

  if (isLoading) {
    els.loading.classList.add(
      'animate-pulse'
    );
  } else {
    els.loading.classList.remove(
      'animate-pulse'
    );
  }
};


/* =========================================================
   ESTADO VACÍO
   ========================================================= */

export const toggleEmpty = (isEmpty) => {
  const wasHidden = els.empty.classList.contains('hidden');

  els.empty.classList.toggle(
    'hidden',
    !isEmpty
  );

  if (isEmpty && wasHidden) {
    nextFrame(() => {
      animateElement(
        els.empty,
        [
          {
            opacity: 0,
            transform: 'translateY(10px) scale(0.98)',
          },
          {
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          },
        ],
        350
      );
    });
  }
};


/* =========================================================
   ERROR DE TAREAS
   ========================================================= */

export function showError(message) {
  els.error.textContent = message;

  els.error.classList.toggle(
    'hidden',
    !message
  );

  if (message) {
    nextFrame(() => {
      animateElement(
        els.error,
        [
          {
            opacity: 0,
            transform: 'translateY(-6px)',
          },
          {
            opacity: 1,
            transform: 'translateY(0)',
          },
        ],
        250
      );
    });
  }
}


/* =========================================================
   VISTAS Y TOPBAR
   ========================================================= */

export function showAuth() {
  els.authView.classList.remove('hidden');

  els.appView.classList.add('hidden');

  els.userArea.classList.add('hidden');
  els.userArea.classList.remove('flex');

  /*
   * Entrada suave del formulario de autenticación.
   */
  nextFrame(() => {
    animateElement(
      els.authView,
      [
        {
          opacity: 0,
          transform: 'translateY(12px)',
        },
        {
          opacity: 1,
          transform: 'translateY(0)',
        },
      ],
      350
    );
  });
}


export function showApp(user) {
  els.authView.classList.add('hidden');

  els.appView.classList.remove('hidden');

  els.userArea.classList.remove('hidden');
  els.userArea.classList.add('flex');

  els.userName.textContent = user.name;

  els.userInitial.textContent =
    user.name.trim().charAt(0).toUpperCase();


  /*
   * Animación de entrada de la aplicación.
   */
  nextFrame(() => {
    animateElement(
      els.appView,
      [
        {
          opacity: 0,
          transform: 'translateY(12px)',
        },
        {
          opacity: 1,
          transform: 'translateY(0)',
        },
      ],
      350
    );


    /*
     * Animación del usuario del Topbar.
     */
    animateElement(
      els.userArea,
      [
        {
          opacity: 0,
          transform: 'translateX(10px)',
        },
        {
          opacity: 1,
          transform: 'translateX(0)',
        },
      ],
      300
    );
  });
}


/* =========================================================
   FORMULARIO DE AUTENTICACIÓN
   ========================================================= */

const TAB_ACTIVE = [
  'bg-white',
  'text-slate-900',
  'shadow',
];

const TAB_INACTIVE = [
  'text-slate-500',
  'hover:text-slate-700',
];


export function setAuthMode(mode) {
  const isRegister = mode === 'register';

  els.tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;

    tab.classList.remove(
      ...TAB_ACTIVE,
      ...TAB_INACTIVE
    );

    tab.classList.add(
      ...(active
        ? TAB_ACTIVE
        : TAB_INACTIVE)
    );


    /*
     * Animación del tab seleccionado.
     */
    if (active) {
      animateElement(
        tab,
        [
          {
            transform: 'scale(0.97)',
          },
          {
            transform: 'scale(1)',
          },
        ],
        180
      );
    }
  });


  /* ---------- Nombre ---------- */

  const nameWasHidden =
    els.nameWrap.classList.contains('hidden');

  els.nameWrap.classList.toggle(
    'hidden',
    !isRegister
  );

  if (isRegister && nameWasHidden) {
    nextFrame(() => {
      animateElement(
        els.nameWrap,
        [
          {
            opacity: 0,
            height: 0,
            transform: 'translateY(-6px)',
          },
          {
            opacity: 1,
            height: 'auto',
            transform: 'translateY(0)',
          },
        ],
        250
      );
    });
  }


  /* ---------- Configuración ---------- */

  els.nameInput.required = isRegister;

  els.passwordHint.classList.toggle(
    'hidden',
    !isRegister
  );

  els.passwordInput.autocomplete =
    isRegister
      ? 'new-password'
      : 'current-password';

  els.authSubmit.textContent =
    isRegister
      ? 'Crear cuenta'
      : 'Iniciar sesión';


  showAuthError('');
}


/* =========================================================
   ERROR DE AUTENTICACIÓN
   ========================================================= */

export function showAuthError(message) {
  els.authError.textContent = message;

  els.authError.classList.toggle(
    'hidden',
    !message
  );

  if (message) {
    nextFrame(() => {
      animateElement(
        els.authError,
        [
          {
            opacity: 0,
            transform: 'translateX(-8px)',
          },
          {
            opacity: 1,
            transform: 'translateX(8px)',
          },
          {
            opacity: 1,
            transform: 'translateX(-5px)',
          },
          {
            opacity: 1,
            transform: 'translateX(3px)',
          },
          {
            opacity: 1,
            transform: 'translateX(0)',
          },
        ],
        400
      );
    });
  }
}


/* =========================================================
   ESTADO DEL BOTÓN DE AUTENTICACIÓN
   ========================================================= */

export const setAuthBusy = (busy) => {
  els.authSubmit.disabled = busy;

  if (busy) {
    els.authSubmit.classList.add(
      'cursor-wait',
      'scale-[0.98]'
    );
  } else {
    els.authSubmit.classList.remove(
      'cursor-wait',
      'scale-[0.98]'
    );
  }
};


/* =========================================================
   LOGOUT
   ========================================================= */

export function animateLogout() {
  animateElement(
    els.userArea,
    [
      {
        opacity: 1,
        transform: 'translateX(0)',
      },
      {
        opacity: 0,
        transform: 'translateX(15px)',
      },
    ],
    200
  );
}
