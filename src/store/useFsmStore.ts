import { create } from 'zustand';
import type { FsmDefinition, FsmState, FsmTransition, FsmType } from '../types/fsm';

interface FsmStore {
  fsm: FsmDefinition;
  
  // Actions
  setType: (type: FsmType) => void;
  addState: (state: Partial<FsmState>) => void;
  updateState: (id: string, updates: Partial<FsmState>) => void;
  deleteState: (id: string) => void;
  
  addTransition: (transition: Partial<FsmTransition>) => void;
  updateTransition: (id: string, updates: Partial<FsmTransition>) => void;
  deleteTransition: (id: string) => void;
  
  setAlphabet: (alphabet: string[]) => void;
  
  // Bulk update (for text sync)
  setFsm: (fsm: FsmDefinition) => void;
}

const initialFsm: FsmDefinition = {
  type: 'DFA',
  states: {
    'q0': { id: 'q0', name: 'q0', isStart: true, isFinal: false, x: 100, y: 100 }
  },
  transitions: [],
  alphabet: ['0', '1'],
};

export const useFsmStore = create<FsmStore>((set) => ({
  fsm: initialFsm,
  
  setType: (type) => set((state) => ({
    fsm: { ...state.fsm, type }
  })),
  
  addState: (newState) => set((state) => {
    const id = newState.id || `q${Object.keys(state.fsm.states).length}`;
    return {
      fsm: {
        ...state.fsm,
        states: {
          ...state.fsm.states,
          [id]: {
            id,
            name: id,
            isStart: false,
            isFinal: false,
            x: 0,
            y: 0,
            ...newState
          } as FsmState
        }
      }
    };
  }),
  
  updateState: (id, updates) => set((state) => ({
    fsm: {
      ...state.fsm,
      states: {
        ...state.fsm.states,
        [id]: { ...state.fsm.states[id], ...updates }
      }
    }
  })),
  
  deleteState: (id) => set((state) => {
    const { [id]: _, ...remainingStates } = state.fsm.states;
    return {
      fsm: {
        ...state.fsm,
        states: remainingStates,
        transitions: state.fsm.transitions.filter(t => t.from !== id && t.to !== id)
      }
    };
  }),
  
  addTransition: (t) => set((state) => ({
    fsm: {
      ...state.fsm,
      transitions: [
        ...state.fsm.transitions,
        {
          id: Math.random().toString(36).substr(2, 9),
          from: '',
          to: '',
          input: '',
          ...t
        } as FsmTransition
      ]
    }
  })),
  
  updateTransition: (id, updates) => set((state) => ({
    fsm: {
      ...state.fsm,
      transitions: state.fsm.transitions.map(t => t.id === id ? { ...t, ...updates } : t)
    }
  })),
  
  deleteTransition: (id) => set((state) => ({
    fsm: {
      ...state.fsm,
      transitions: state.fsm.transitions.filter(t => t.id !== id)
    }
  })),
  
  setAlphabet: (alphabet) => set((state) => ({
    fsm: { ...state.fsm, alphabet }
  })),
  
  setFsm: (fsm) => set({ fsm }),
}));
