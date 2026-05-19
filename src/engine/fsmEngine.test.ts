import { describe, it, expect } from 'vitest';
import { FsmEngine } from './fsmEngine';
import type { FsmDefinition } from '../types/fsm';

describe('FSM Engine', () => {
  const dfa: FsmDefinition = {
    type: 'DFA',
    alphabet: ['0', '1'],
    states: {
      'q0': { id: 'q0', name: 'q0', isStart: true, isFinal: false, x: 0, y: 0 },
      'q1': { id: 'q1', name: 'q1', isStart: false, isFinal: true, x: 0, y: 0 }
    },
    transitions: [
      { id: '1', from: 'q0', to: 'q1', input: '0' },
      { id: '2', from: 'q0', to: 'q0', input: '1' },
      { id: '3', from: 'q1', to: 'q0', input: '0' },
      { id: '4', from: 'q1', to: 'q1', input: '1' }
    ]
  };

  it('should simulate a simple DFA correctly', () => {
    const engine = new FsmEngine(dfa);
    let step = engine.getInitialStep();
    expect(step.activeStates).toEqual(['q0']);

    step = engine.step(step, '0');
    expect(step.activeStates).toEqual(['q1']);
    expect(step.consumedSymbol).toBe('0');

    step = engine.step(step, '1');
    expect(step.activeStates).toEqual(['q1']);

    step = engine.step(step, '0');
    expect(step.activeStates).toEqual(['q0']);
  });

  const nfa: FsmDefinition = {
    type: 'NFA',
    alphabet: ['0'],
    states: {
      'q0': { id: 'q0', name: 'q0', isStart: true, isFinal: false, x: 0, y: 0 },
      'q1': { id: 'q1', name: 'q1', isStart: false, isFinal: true, x: 0, y: 0 }
    },
    transitions: [
      { id: '1', from: 'q0', to: 'q0', input: '0' },
      { id: '2', from: 'q0', to: 'q1', input: '' } // Epsilon
    ]
  };

  it('should handle epsilon closures in NFA', () => {
    const engine = new FsmEngine(nfa);
    let step = engine.getInitialStep();
    // q0 is start, q1 is reachable via epsilon
    expect(step.activeStates).toContain('q0');
    expect(step.activeStates).toContain('q1');

    step = engine.step(step, '0');
    // From q0 on '0' -> q0. From q0 epsilon -> q1. So {q0, q1}
    expect(step.activeStates).toContain('q0');
    expect(step.activeStates).toContain('q1');
  });

  it('should verify DFA correctly', () => {
    const engine = new FsmEngine(dfa);
    expect(engine.verify()).toHaveLength(0);

    const invalidDfa: FsmDefinition = {
      ...dfa,
      transitions: dfa.transitions.slice(0, 1) // Only 1 transition
    };
    const engine2 = new FsmEngine(invalidDfa);
    expect(engine2.verify().length).toBeGreaterThan(0);
    expect(engine2.verify()[0]).toContain('missing transition');
  });
});
