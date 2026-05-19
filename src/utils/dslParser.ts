import type { FsmDefinition, FsmState } from '../types/fsm';

export interface ParseResult {
  fsm: FsmDefinition;
  error?: { message: string; line: number };
}

export const serializeFSM = (fsm: FsmDefinition): string => {
  const lines = [];
  lines.push(`# FSM Definition`);
  lines.push(`type: ${fsm.type}`);
  lines.push(`alphabet: ${fsm.alphabet.join(', ')}`);
  lines.push('');
  lines.push('states:');
  
  // Create a mapping from ID to Name for transitions
  const idToName: Record<string, string> = {};
  Object.values(fsm.states).forEach(s => {
    idToName[s.id] = s.name;
    
    let props = [];
    if (s.isStart) props.push('start');
    if (s.isFinal) props.push('final');
    if (s.output) props.push(`output: "${s.output}"`);
    const propStr = props.length > 0 ? ` [${props.join(', ')}]` : '';
    lines.push(`  ${s.name}${propStr}`);
  });
  
  lines.push('');
  lines.push('transitions:');
  fsm.transitions.forEach(t => {
    const fromName = idToName[t.from] || t.from;
    const toName = idToName[t.to] || t.to;
    const outputStr = t.output ? `/${t.output}` : '';
    const symbol = t.input === '' ? 'ε' : t.input;
    lines.push(`  ${fromName} -- ${symbol}${outputStr} --> ${toName}`);
  });
  return lines.join('\n');
};

export const parseDSL = (text: string, existingStates: Record<string, FsmState>): ParseResult => {
  const newFsm: FsmDefinition = {
    type: 'DFA',
    states: {},
    transitions: [],
    alphabet: [],
  };

  const lines = text.split('\n');
  let currentSection = '';

  try {
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const lowerTrimmed = trimmed.toLowerCase();
      if (lowerTrimmed.startsWith('type:')) {
        const typeStr = trimmed.split(':')[1].trim().toLowerCase();
        if (typeStr === 'dfa') newFsm.type = 'DFA';
        else if (typeStr === 'nfa') newFsm.type = 'NFA';
        else if (typeStr === 'moore') newFsm.type = 'Moore';
        else if (typeStr === 'mealy') newFsm.type = 'Mealy';
        else newFsm.type = 'DFA';
        return;
      }
      if (lowerTrimmed.startsWith('alphabet:')) {
        newFsm.alphabet = trimmed.split(':')[1].split(',').map(s => s.trim()).filter(Boolean);
        return;
      }
      if (lowerTrimmed === 'states:') {
        currentSection = 'states';
        return;
      }
      if (lowerTrimmed === 'transitions:') {
        currentSection = 'transitions';
        return;
      }

      if (currentSection === 'states') {
        const match = trimmed.match(/^([\w\d]+)(?:\s*\[(.*)\])?$/);
        if (match) {
          const name = match[1];
          const props = match[2] || '';
          
          // Try to find existing state by NAME or ID to preserve coordinates
          const existing = Object.values(existingStates).find(s => s.name === name || s.id === name);

          newFsm.states[name] = {
            id: name, // In DSL, the name acts as the unique identifier
            name: name,
            isStart: props.toLowerCase().includes('start'),
            isFinal: props.toLowerCase().includes('final'),
            x: existing?.x ?? 100 + Math.random() * 300,
            y: existing?.y ?? 100 + Math.random() * 300,
          };
          const outputMatch = props.match(/output:\s*"([^"]*)"/i);
          if (outputMatch) newFsm.states[name].output = outputMatch[1];
        } else {
          throw { message: `Invalid state format: "${trimmed}"`, line: index + 1 };
        }
      } else if (currentSection === 'transitions') {
        const match = trimmed.match(/^([\w\d]+)\s*--\s*(.*?)\s*-->\s*([\w\d]+)$/);
        
        if (match) {
          const from = match[1];
          const fullInput = match[2].trim();
          const to = match[3];

          let input = fullInput;
          let output = undefined;
          
          if (fullInput.includes('/')) {
            const parts = fullInput.split('/');
            input = parts[0].trim();
            output = parts[1].trim();
          }

          if (input === 'ε' || input === 'epsilon' || input === '') {
            input = 'ε';
          }

          newFsm.transitions.push({
            id: Math.random().toString(36).substr(2, 9),
            from,
            input,
            output,
            to,
          });
        } else {
          throw { message: `Invalid transition format: "${trimmed}"`, line: index + 1 };
        }
      }
    });

    // Semantic Validation
    newFsm.transitions.forEach(t => {
      if (!newFsm.states[t.from]) throw { message: `Transition from non-existent state: ${t.from}`, line: 0 };
      if (!newFsm.states[t.to]) throw { message: `Transition to non-existent state: ${t.to}`, line: 0 };

      // Normalization: store epsilon as empty string for the engine if it matches our conventions
      if (t.input === 'ε') t.input = '';

      const isValidSymbol = t.input === '' || newFsm.alphabet.includes(t.input);
      if (!isValidSymbol) {
        throw { message: `Invalid symbol "${t.input}". Not in alphabet: ${newFsm.alphabet.join(', ')}`, line: 0 };
      }
    });

    return { fsm: newFsm };
  } catch (e: any) {
    return { fsm: newFsm, error: e };
  }
};
