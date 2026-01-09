const LOCAL_KEY = 'is-lazied';
const LOCAL_VALUE = '1';
// Window events to be attached initially which can trigger lazy
const WINDOW_INITIAL_EVENTS = ['scroll', 'click'] as const;
// Window events to be attached after window is fully loaded which can trigger lazy
const WINDOW_ONLOAD_EVENTS = ['keydown', 'mouseover', 'touchmove', 'touchstart'] as const;
// All window events which will be attached
const WINDOW_EVENTS = [...WINDOW_INITIAL_EVENTS, ...WINDOW_ONLOAD_EVENTS] as const;

export type LazyEventType = (typeof WINDOW_EVENTS)[number] | 'local';

export function getLazy() {
  try {
    return localStorage.getItem(LOCAL_KEY) === LOCAL_VALUE;
  } catch (_) {
    return true;
  }
}

export function setLazy(lazied = true) {
  try {
    if (lazied) {
      localStorage.setItem(LOCAL_KEY, LOCAL_VALUE);
    } else {
      localStorage.removeItem(LOCAL_KEY);
    }
  } catch (_) {
    // do nothing
  }
}

export const lazy = new Promise<{ type: LazyEventType }>((resolve) => {
  function execute(data: { type: string }) {
    setLazy(true);
    resolve({ type: data.type.toLowerCase() as LazyEventType });
    // detach event listeners
    for (const type of WINDOW_EVENTS) {
      window.removeEventListener(type, execute);
    }
  }

  if (getLazy()) {
    resolve({ type: 'local' });
  } else {
    // check if document is already scrolled
    if (document.documentElement.scrollTop !== 0 || (document.body && document.body.scrollTop !== 0)) {
      execute({ type: 'scroll' });
    } else {
      // events to be attached after window is loaded
      const onLoad = () => {
        window.removeEventListener('load', onLoad);
        for (const type of WINDOW_ONLOAD_EVENTS) {
          window.addEventListener(type, execute);
        }
      };
      window.addEventListener('load', onLoad);

      // events to be attached initially
      for (const type of WINDOW_INITIAL_EVENTS) {
        window.addEventListener(type, execute);
      }
    }
  }
});
