import { loadState, saveState } from './persistence.js';

/**
 * Минимальный реактивный store: одно состояние на всё приложение.
 * Подписчики вызываются после каждого изменения.
 */
export function createStore(initialState = loadState()) {
  let state = initialState;
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(updater) {
    const nextState = typeof updater === 'function' ? updater(state) : updater;
    if (!nextState || nextState === state) return;

    state = nextState;
    saveState(state);
    listeners.forEach((listener) => listener(state));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}
