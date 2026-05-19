import React from 'react';
import { useFsmStore } from '../store/useFsmStore';
import type { FsmType } from '../types/fsm';

export const FsmTypeSelector: React.FC = () => {
  const { fsm, setType } = useFsmStore();

  const types: { value: FsmType; label: string; desc: string }[] = [
    { value: 'DFA', label: 'DFA', desc: 'Deterministic' },
    { value: 'NFA', label: 'NFA', desc: 'Non-Deterministic' },
    { value: 'Moore', label: 'Moore', desc: 'Output by State' },
    { value: 'Mealy', label: 'Mealy', desc: 'Output by Transition' },
  ];

  return (
    <div className="flex bg-zinc-100 p-1 rounded-xl gap-1">
      {types.map((type) => (
        <button
          key={type.value}
          onClick={() => setType(type.value)}
          className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            fsm.type === type.value
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
          }`}
        >
          <div className="uppercase tracking-tight">{type.label}</div>
          <div className="text-[8px] opacity-50 font-medium whitespace-nowrap">{type.desc}</div>
        </button>
      ))}
    </div>
  );
};
