import { describe, it, expect } from 'vitest';
import { serializeFSM, parseDSL } from './dslParser';
import type { FsmDefinition } from '../types/fsm';

describe('FSM Synchronization', () => {
  it('should reflect state name changes in serialized text', () => {
    const fsm: FsmDefinition = {
      type: 'DFA',
      alphabet: ['0'],
      states: {
        'q0': { id: 'q0', name: 'StartNode', isStart: true, isFinal: false, x: 0, y: 0 }
      },
      transitions: [
        { id: 't1', from: 'q0', to: 'q0', input: '0' }
      ]
    };

    const text = serializeFSM(fsm);
    
    // The text should use the 'name' (StartNode), not the 'id' (q0)
    expect(text).toContain('StartNode');
    expect(text).not.toContain('q0');
    expect(text).toContain('StartNode -- 0 --> StartNode');
  });

  it('should maintain name-id consistency during round-trip', () => {
    const dsl = `
      type: DFA
      alphabet: 0
      states:
        MyState [start]
      transitions:
        MyState -- 0 --> MyState
    `;
    
    const { fsm } = parseDSL(dsl, {});
    const state = Object.values(fsm.states)[0];
    
    expect(state.id).toBe('MyState');
    expect(state.name).toBe('MyState');
    
    const serialized = serializeFSM(fsm);
    expect(serialized).toContain('MyState');
  });
});
