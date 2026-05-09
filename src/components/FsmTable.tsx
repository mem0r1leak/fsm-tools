import React from 'react';
import { useFsmStore } from '../store/useFsmStore';

export const FsmTable: React.FC = () => {
  const { fsm, updateTransition, addTransition, updateState } = useFsmStore();
  const states = Object.values(fsm.states);
  const alphabet = fsm.alphabet;

  const getTransition = (fromId: string, input: string) => {
    return fsm.transitions.find(t => t.from === fromId && t.input === input);
  };

  const handleCellChange = (fromId: string, input: string, toId: string) => {
    const existing = getTransition(fromId, input);
    if (existing) {
      if (toId === '') {
        // Maybe delete? For now just keep as is or clear target
        updateTransition(existing.id, { to: '' });
      } else {
        updateTransition(existing.id, { to: toId });
      }
    } else if (toId !== '') {
      addTransition({ from: fromId, to: toId, input });
    }
  };

  const handleOutputChange = (transitionId: string, output: string) => {
    updateTransition(transitionId, { output });
  };

  return (
    <div className="p-8 overflow-auto h-full">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 text-sm font-semibold text-zinc-900 border-r border-zinc-200">State</th>
              {fsm.type === 'Moore' && (
                <th className="px-6 py-4 text-sm font-semibold text-zinc-700 bg-emerald-50/50 border-r border-zinc-200">Output</th>
              )}
              {alphabet.map(symbol => (
                <th key={symbol} className="px-6 py-4 text-sm font-semibold text-zinc-900">{symbol}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {states.map(state => (
              <tr key={state.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                <td className="px-6 py-4 text-sm font-medium text-zinc-700 border-r border-zinc-200 bg-zinc-50/30">
                  <div className="flex items-center gap-2">
                    {state.isStart && <span className="w-2 h-2 rounded-full bg-blue-500" title="Start State" />}
                    {state.name}
                    {state.isFinal && <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-bold">FINAL</span>}
                  </div>
                </td>
                {fsm.type === 'Moore' && (
                  <td className="px-4 py-2 border-r border-zinc-200 bg-emerald-50/20">
                    <input 
                      type="text"
                      value={state.output || ''}
                      onChange={(e) => updateState(state.id, { output: e.target.value })}
                      placeholder="out"
                      className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded px-2 py-1 text-sm outline-none text-emerald-700 font-bold"
                    />
                  </td>
                )}
                {alphabet.map(symbol => {
                  const transition = getTransition(state.id, symbol);
                  return (
                    <td key={symbol} className="px-4 py-2">
                      <div className="flex flex-col gap-1">
                        <select
                          value={transition?.to || ''}
                          onChange={(e) => handleCellChange(state.id, symbol, e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 text-sm outline-none font-medium"
                        >
                          <option value="">-</option>
                          {states.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        {fsm.type === 'Mealy' && transition && (
                          <div className="flex items-center gap-1 px-2">
                            <span className="text-[10px] text-zinc-400 font-bold">/</span>
                            <input 
                              type="text"
                              value={transition.output || ''}
                              onChange={(e) => handleOutputChange(transition.id, e.target.value)}
                              placeholder="out"
                              className="w-full bg-zinc-50 border border-zinc-100 rounded px-1 py-0.5 text-[10px] text-emerald-600 font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex flex-col gap-4 max-w-md">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-2">Alphabet Settings</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              defaultValue={fsm.alphabet.join(',')} 
              placeholder="e.g. 0,1,a,b"
              className="flex-1 bg-white border border-blue-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              onBlur={(e) => {
                const newAlphabet = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                if (newAlphabet.length > 0) {
                  useFsmStore.getState().setAlphabet(newAlphabet);
                }
              }}
            />
          </div>
          <p className="text-[11px] text-blue-700 mt-2">Enter symbols separated by commas. Use 'ε' for epsilon transitions in NFA.</p>
        </div>
      </div>
    </div>
  );
};
