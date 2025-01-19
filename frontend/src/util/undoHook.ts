import {useReducer, useEffect} from 'react'

type State = {
  history: string[]
  currentIndex: number
  lastChangeTime: number
  prevKey?: string | number | null
  prevValue: string
}

type Action =
  | {
      type: 'RESET'
      externalValue: string
      timestamp: number
      key?: string | number | null
    }
  | {
      type: 'SET_VALUE'
      externalValue: string
      chunkThreshold: number
      timestamp: number
    }
  | {
      type: 'UPDATE_INDEX'
      index: number
    }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'RESET':
      return {
        history: [action.externalValue],
        currentIndex: 0,
        lastChangeTime: action.timestamp,
        prevKey: action.key,
        prevValue: action.externalValue,
      }
    case 'SET_VALUE': {
      const timeSinceLast = action.timestamp - state.lastChangeTime
      const currentText = state.history[state.currentIndex]
      if (currentText === action.externalValue) return state
      if (timeSinceLast < action.chunkThreshold) {
        const newHistory = [...state.history]
        newHistory[state.currentIndex] = action.externalValue
        return {
          ...state,
          history: newHistory,
          lastChangeTime: action.timestamp,
          prevValue: action.externalValue,
        }
      } else {
        const sliced = state.history.slice(0, state.currentIndex + 1)
        sliced.push(action.externalValue)
        return {
          ...state,
          history: sliced,
          currentIndex: state.currentIndex + 1,
          lastChangeTime: action.timestamp,
          prevValue: action.externalValue,
        }
      }
    }
    case 'UPDATE_INDEX':
      return {
        ...state,
        currentIndex: action.index,
      }
    default:
      return state
  }
}

interface UseUndoRedoReturn {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

export function useUndoRedo(
  externalValue: string,
  onUndoRedo: (historyValue: string) => void,
  chunkThreshold = 500,
  key?: string | number | null
): UseUndoRedoReturn {
  const [state, dispatch] = useReducer(reducer, {
    history: [externalValue],
    currentIndex: 0,
    lastChangeTime: Date.now(),
    prevKey: key,
    prevValue: externalValue,
  })

  useEffect(() => {
    if (state.prevKey !== key) {
      dispatch({
        type: 'RESET',
        externalValue,
        timestamp: Date.now(),
        key,
      })
    } else if (externalValue !== state.prevValue) {
      dispatch({
        type: 'SET_VALUE',
        externalValue,
        chunkThreshold,
        timestamp: Date.now(),
      })
    }
  }, [key, externalValue, state.prevKey, state.prevValue, chunkThreshold])

  function undo() {
    if (state.currentIndex <= 0) return
    const newIndex = state.currentIndex - 1
    if (state.history[newIndex] !== undefined) {
      onUndoRedo(state.history[newIndex])
      dispatch({type: 'UPDATE_INDEX', index: newIndex})
    }
  }

  function redo() {
    if (state.currentIndex >= state.history.length - 1) return
    const newIndex = state.currentIndex + 1
    if (state.history[newIndex] !== undefined) {
      onUndoRedo(state.history[newIndex])
      dispatch({type: 'UPDATE_INDEX', index: newIndex})
    }
  }

  const canUndo = state.currentIndex > 0
  const canRedo = state.currentIndex < state.history.length - 1

  return {
    canUndo,
    canRedo,
    undo,
    redo,
  }
}
