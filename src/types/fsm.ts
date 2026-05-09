export type FsmType = 'DFA' | 'NFA' | 'Moore' | 'Mealy';

export interface FsmState {
  id: string;
  name: string;
  isStart: boolean;
  isFinal: boolean;
  output?: string; // For Moore machines
  x: number;
  y: number;
}

export interface FsmTransition {
  id: string;
  from: string;
  to: string;
  input: string; // symbol or 'ε'
  output?: string; // For Mealy machines
}

export interface FsmDefinition {
  type: FsmType;
  states: Record<string, FsmState>;
  transitions: FsmTransition[];
  alphabet: string[];
  outputs?: string[]; // Possible output symbols for Moore/Mealy
}
