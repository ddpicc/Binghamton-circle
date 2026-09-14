function createStore(initialState = {}) {
  let state = { ...initialState }
  const listeners = new Set()

  const getState = () => state

  const setState = (partialState = {}) => {
    state = { ...state, ...partialState }
    listeners.forEach((listener) => listener(state))
  }

  const resetState = () => {
    state = { ...initialState }
    listeners.forEach((listener) => listener(state))
  }

  const subscribe = (listener) => {
    if (typeof listener !== 'function') {
      return () => {}
    }
    listeners.add(listener)
    listener(state)
    return () => listeners.delete(listener)
  }

  return { getState, setState, resetState, subscribe }
}

module.exports = { createStore }
