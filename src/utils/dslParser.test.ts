import { describe, it, expect } from 'vitest';
import { parseDSL } from './dslParser';
import type { FsmState } from '../types/fsm';

describe('DSL Parser', () => {
  const existingStates: Record<string, FsmState> = {
    'q0': { id: 'q0', name: 'q0', isStart: true, isFinal: false, x: 10, y: 10 }
  };

  it('should parse a valid DFA definition', () => {
    const dsl = `
      type: DFA
      alphabet: 0, 1
      
      states:
        q0 [start]
        q1 [final]
        
      transitions:
        q0 -- 0 --> q1
        q1 -- 1 --> q0
    `;
    
    const { fsm, error } = parseDSL(dsl, existingStates);
    
    expect(error).toBeUndefined();
    expect(fsm.type).toBe('DFA');
    expect(fsm.alphabet).toEqual(['0', '1']);
    expect(Object.keys(fsm.states)).toHaveLength(2);
    expect(fsm.states['q0'].isStart).toBe(true);
    expect(fsm.states['q1'].isFinal).toBe(true);
    expect(fsm.transitions).toHaveLength(2);
    expect(fsm.transitions[0].from).toBe('q0');
    expect(fsm.transitions[0].input).toBe('0');
    expect(fsm.transitions[0].to).toBe('q1');
  });

  it('should preserve coordinates of existing states', () => {
    const dsl = `
      type: DFA
      alphabet: 0
      states:
        q0 [start]
      transitions:
        q0 -- 0 --> q0
    `;
    const { fsm } = parseDSL(dsl, existingStates);
    expect(fsm.states['q0'].x).toBe(10);
    expect(fsm.states['q0'].y).toBe(10);
  });

  it('should throw error for invalid transition format', () => {
    const dsl = `
      type: DFA
      alphabet: 0
      states:
        q0 [start]
      transitions:
        q0 -> q0
    `;
    const { error } = parseDSL(dsl, existingStates);
    expect(error).toBeDefined();
    expect(error?.message).toContain('Invalid transition format');
  });

  it('should throw error for non-existent states in transitions', () => {
    const dsl = `
      type: DFA
      alphabet: 0
      states:
        q0 [start]
      transitions:
        q0 -- 0 --> q1
    `;
    const { error } = parseDSL(dsl, existingStates);
    expect(error).toBeDefined();
    expect(error?.message).toContain('non-existent state: q1');
  });

  it('should throw error for invalid symbols in transitions', () => {
    const dsl = `
      type: DFA
      alphabet: 0
      states:
        q0 [start]
      transitions:
        q0 -- 1 --> q0
    `;
    const { error } = parseDSL(dsl, existingStates);
    expect(error).toBeDefined();
    expect(error?.message).toContain('Invalid symbol "1"');
  });

  it('should support Moore machine outputs', () => {
    const dsl = `
      type: MOORE
      alphabet: 0
      states:
        q0 [start, output: "A"]
      transitions:
        q0 -- 0 --> q0
    `;
    const { fsm } = parseDSL(dsl, existingStates);
    expect(fsm.states['q0'].output).toBe('A');
  });

  it('should support Mealy machine outputs', () => {
    const dsl = `
      type: MEALY
      alphabet: 0
      states:
        q0 [start]
      transitions:
        q0 -- 0/out --> q0
    `;
    const { fsm } = parseDSL(dsl, existingStates);
    expect(fsm.transitions[0].output).toBe('out');
  });
});
