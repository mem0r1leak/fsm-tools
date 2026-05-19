import { create } from 'zustand';
import type { FsmDefinition, FsmState, FsmTransition, FsmType } from '../types/fsm';
import { FsmEngine } from '../engine/fsmEngine';

interface FsmStore {
  fsm: FsmDefinition;
  errors: string[];
  
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
  validate: () => void;
}

const initialFsm: FsmDefinition = {
  type: 'DFA',
  states: {
    'q0': { id: 'q0', name: 'q0', isStart: true, isFinal: false, x: 100, y: 100 }
  },
  transitions: [],
  alphabet: ['0', '1'],
};

export const useFsmStore = create<FsmStore>((set, get) => ({
  fsm: initialFsm,
  errors: [],
  
  setType: (type) => {
    set((state) => ({
      fsm: { ...state.fsm, type }
    }));
    get().validate();
  },
  
  addState: (newState) => {
    set((state) => {
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
    });
    get().validate();
  },
  
  updateState: (id, updates) => {
    set((state) => ({
      fsm: {
        ...state.fsm,
        states: {
          ...state.fsm.states,
          [id]: { ...state.fsm.states[id], ...updates }
        }
      }
    }));
    
    // Only validate if non-position properties changed
    const needsValidation = Object.keys(updates).some(k => k !== 'x' && k !== 'y');
    if (needsValidation) {
      get().validate();
    }
  },
  
  deleteState: (id) => {
    set((state) => {
      const { [id]: _, ...remainingStates } = state.fsm.states;
      return {
        fsm: {
          ...state.fsm,
          states: remainingStates,
          transitions: state.fsm.transitions.filter(t => t.from !== id && t.to !== id)
        }
      };
    });
    get().validate();
  },
  
  addTransition: (t) => {
    set((state) => ({
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
    }));
    get().validate();
  },
  
  updateTransition: (id, updates) => {
    set((state) => ({
      fsm: {
        ...state.fsm,
        transitions: state.fsm.transitions.map(t => t.id === id ? { ...t, ...updates } : t)
      }
    }));
    get().validate();
  },
  
  deleteTransition: (id) => {
    set((state) => ({
      fsm: {
        ...state.fsm,
        transitions: state.fsm.transitions.filter(t => t.id !== id)
      }
    }));
    get().validate();
  },
  
  setAlphabet: (alphabet) => {
    set((state) => ({
      fsm: { ...state.fsm, alphabet }
    }));
    get().validate();
  },
  
  setFsm: (fsm) => {
    set({ fsm });
    get().validate();
  },

  validate: () => {
    const { fsm, errors: oldErrors } = get();
    const engine = new FsmEngine(fsm);
    const newErrors = engine.verify();
    
    // Simple shallow comparison to avoid unnecessary state updates
    if (JSON.stringify(oldErrors) !== JSON.stringify(newErrors)) {
      set({ errors: newErrors });
    }
  }
}));
