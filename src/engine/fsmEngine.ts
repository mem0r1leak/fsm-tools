import type { FsmDefinition } from '../types/fsm';

export interface SimulationStep {
  activeStates: string[];
  inputRemaining: string;
  outputSequence: string[]; // Total sequence so far
  lastOutput?: string;     // Output produced in THIS step
  consumedSymbol?: string;
}

export class FsmEngine {
  private fsm: FsmDefinition;

  constructor(fsm: FsmDefinition) {
    this.fsm = fsm;
  }

  public getInitialStep(): SimulationStep {
    const startStates = Object.values(this.fsm.states)
      .filter(s => s.isStart)
      .map(s => s.id);

    // If NFA, handle ε-closure
    const initialActive = this.fsm.type === 'NFA' 
      ? this.getEpsilonClosure(startStates)
      : startStates;

    let initialOutput: string[] = [];
    let lastOutput: string | undefined;

    if (this.fsm.type === 'Moore') {
      // Moore machines produce output based on the state. 
      // Usually there is only 1 start state, but we take the first one found.
      const firstStateId = initialActive[0];
      const out = this.fsm.states[firstStateId]?.output;
      if (out) {
        initialOutput.push(out);
        lastOutput = out;
      }
    }

    return {
      activeStates: initialActive,
      inputRemaining: '',
      outputSequence: initialOutput,
      lastOutput,
    };
  }

  public step(current: SimulationStep, symbol: string): SimulationStep {
    let nextStates: string[] = [];
    let currentStepOutput: string | undefined;

    for (const stateId of current.activeStates) {
      const transitions = this.fsm.transitions.filter(t => t.from === stateId && t.input === symbol);
      
      transitions.forEach(t => {
        if (!nextStates.includes(t.to)) {
          nextStates.push(t.to);
        }
        if (this.fsm.type === 'Mealy' && t.output) {
          currentStepOutput = t.output; // Take last one found (for DFA it's unique)
        }
      });
    }

    if (this.fsm.type === 'NFA') {
      nextStates = this.getEpsilonClosure(nextStates);
    }

    if (this.fsm.type === 'Moore' && nextStates.length > 0) {
      const out = this.fsm.states[nextStates[0]]?.output;
      if (out) currentStepOutput = out;
    }

    const newSequence = [...current.outputSequence];
    if (currentStepOutput !== undefined) {
      newSequence.push(currentStepOutput);
    }

    return {
      activeStates: nextStates,
      inputRemaining: current.inputRemaining.slice(1),
      outputSequence: newSequence,
      lastOutput: currentStepOutput,
      consumedSymbol: symbol,
    };
  }

  private getEpsilonClosure(stateIds: string[]): string[] {
    const closure = new Set(stateIds);
    const stack = [...stateIds];

    while (stack.length > 0) {
      const id = stack.pop()!;
      const epsTransitions = this.fsm.transitions.filter(t => t.from === id && (t.input === 'ε' || t.input === ''));
      
      epsTransitions.forEach(t => {
        if (!closure.has(t.to)) {
          closure.add(t.to);
          stack.push(t.to);
        }
      });
    }

    return Array.from(closure);
  }

  public verify(): string[] {
    const errors: string[] = [];
    const states = Object.values(this.fsm.states);
    
    if (states.filter(s => s.isStart).length === 0) {
      errors.push('No start state defined.');
    }
    
    if (this.fsm.type === 'DFA') {
      if (states.filter(s => s.isStart).length > 1) {
        errors.push('DFA cannot have multiple start states.');
      }
      
      // Check for missing transitions
      states.forEach(s => {
        this.fsm.alphabet.forEach(symbol => {
          const count = this.fsm.transitions.filter(t => t.from === s.id && t.input === symbol).length;
          if (count === 0) errors.push(`State ${s.name} is missing transition for "${symbol}".`);
          if (count > 1) errors.push(`State ${s.name} has multiple transitions for "${symbol}" (not a DFA).`);
        });
      });
    }

    return errors;
  }
}
