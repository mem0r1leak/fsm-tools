import React, { useState, useEffect } from 'react';
import { useFsmStore } from '../store/useFsmStore';
import type { FsmDefinition } from '../types/fsm';

export const FsmText: React.FC = () => {
  const { fsm, setFsm } = useFsmStore();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Serialize FSM to text
  useEffect(() => {
    const lines = [];
    lines.push(`type: ${fsm.type}`);
    lines.push(`alphabet: ${fsm.alphabet.join(', ')}`);
    lines.push('states:');
    Object.values(fsm.states).forEach(s => {
      let props = [];
      if (s.isStart) props.push('start');
      if (s.isFinal) props.push('final');
      if (s.output) props.push(`output: "${s.output}"`);
      const propStr = props.length > 0 ? ` [${props.join(', ')}]` : '';
      lines.push(`  ${s.id}${propStr}`);
    });
    lines.push('transitions:');
    fsm.transitions.forEach(t => {
      const outputStr = t.output ? `/${t.output}` : '';
      lines.push(`  ${t.from} --${t.input}${outputStr}--> ${t.to}`);
    });
    setText(lines.join('\n'));
  }, [fsm]);

  const handleApply = () => {
    try {
      const newFsm: Partial<FsmDefinition> = {
        states: {},
        transitions: [],
        alphabet: [],
      };

      const lines = text.split('\n');
      let currentSection = '';

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        if (trimmed.startsWith('type:')) {
          newFsm.type = trimmed.split(':')[1].trim() as any;
        } else if (trimmed.startsWith('alphabet:')) {
          newFsm.alphabet = trimmed.split(':')[1].split(',').map(s => s.trim());
        } else if (trimmed === 'states:') {
          currentSection = 'states';
        } else if (trimmed === 'transitions:') {
          currentSection = 'transitions';
        } else if (currentSection === 'states' && trimmed.startsWith(' ')) {
          // Parse state: id [props]
          const match = trimmed.match(/^(\w+)(?:\s+\[(.*)\])?$/);
          if (match) {
            const id = match[1];
            const props = match[2] || '';
            newFsm.states![id] = {
              id,
              name: id,
              isStart: props.includes('start'),
              isFinal: props.includes('final'),
              x: Math.random() * 400,
              y: Math.random() * 400,
            };
            const outputMatch = props.match(/output:\s*"([^"]*)"/);
            if (outputMatch) newFsm.states![id].output = outputMatch[1];
          }
        } else if (currentSection === 'transitions' && trimmed.startsWith(' ')) {
          // Parse transition: from --input/output--> to
          const match = trimmed.match(/^(\w+)\s+--([^/->]+)(?:\/([^/->]+))?-->\s+(\w+)$/);
          if (match) {
            newFsm.transitions!.push({
              id: Math.random().toString(36).substr(2, 9),
              from: match[1],
              input: match[2].trim(),
              output: match[3],
              to: match[4],
            });
          }
        }
      });

      setFsm(newFsm as FsmDefinition);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-zinc-800">DSL Editor</h2>
        <button
          onClick={handleApply}
          className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          Apply Changes
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 font-mono text-sm bg-white border border-zinc-200 rounded-xl p-6 focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-sm"
        spellCheck={false}
      />
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};
