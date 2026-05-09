import React from 'react';
import { useFsmStore } from '../store/useFsmStore';
import type { FsmType } from '../types/fsm';

export const FsmTypeSelector: React.FC = () => {
  const { fsm, setType } = useFsmStore();

  const types: FsmType[] = ['DFA', 'NFA', 'Moore', 'Mealy'];

  return (
    <div className="flex gap-2">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => setType(type)}
          className={`px-3 py-1 rounded-md text-xs font-semibold border ${
            fsm.type === type
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
};
