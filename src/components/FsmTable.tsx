import React from 'react';
import { useFsmStore } from '../store/useFsmStore';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const FsmTable: React.FC = () => {
  const { fsm, updateTransition, addTransition, deleteTransition, updateState, setAlphabet, errors } = useFsmStore();
  const states = Object.values(fsm.states);
  const alphabet = fsm.alphabet;

  const getTransition = (fromId: string, input: string) => {
    return fsm.transitions.find(t => t.from === fromId && t.input === input);
  };

  const handleCellChange = (fromId: string, input: string, toId: string) => {
    const existing = getTransition(fromId, input);
    if (existing) {
      if (toId === '') {
        deleteTransition(existing.id);
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

  const isMissingTransition = (stateId: string, symbol: string) => {
    if (fsm.type !== 'DFA') return false;
    return !fsm.transitions.some(t => t.from === stateId && t.input === symbol);
  };

  return (
    <div className="p-8 overflow-auto h-full bg-zinc-50/50">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-800">Transition Table</h2>
          <p className="text-xs text-zinc-500">View and edit transitions in a tabular format</p>
        </div>
        
        <div className="flex flex-col gap-2 min-w-[200px]">
          {errors.length > 0 ? (
            <div className="flex gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 text-[11px] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.length} logic errors found</span>
            </div>
          ) : (
            <div className="flex gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 text-[11px] font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>FSM is valid</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-100/50 border-b border-zinc-200">
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider border-r border-zinc-200">State</th>
              {fsm.type === 'Moore' && (
                <th className="px-6 py-4 text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50/30 border-r border-zinc-200">Output</th>
              )}
              {alphabet.map(symbol => (
                <th key={symbol} className="px-6 py-4 text-xs font-bold text-zinc-900 uppercase tracking-wider">{symbol}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {states.map(state => (
              <tr key={state.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-zinc-700 border-r border-zinc-200 bg-zinc-50/30">
                  <div className="flex items-center gap-2">
                    {state.isStart && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200" title="Start State" />}
                    {state.name}
                    {state.isFinal && <span className="text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-black tracking-tighter">FINAL</span>}
                  </div>
                </td>
                {fsm.type === 'Moore' && (
                  <td className="px-4 py-2 border-r border-zinc-200 bg-emerald-50/10">
                    <input 
                      type="text"
                      value={state.output || ''}
                      onChange={(e) => updateState(state.id, { output: e.target.value })}
                      placeholder="out"
                      className="w-full bg-transparent border-0 focus:ring-2 focus:ring-emerald-500/20 rounded px-2 py-1.5 text-sm outline-none text-emerald-700 font-bold placeholder:text-emerald-200 transition-all"
                    />
                  </td>
                )}
                {alphabet.map(symbol => {
                  const transition = getTransition(state.id, symbol);
                  const missing = isMissingTransition(state.id, symbol);
                  return (
                    <td key={symbol} className={`px-4 py-2 transition-colors ${missing ? 'bg-red-50/50' : ''}`}>
                      <div className="flex flex-col gap-1">
                        <select
                          value={transition?.to || ''}
                          onChange={(e) => handleCellChange(state.id, symbol, e.target.value)}
                          className={`w-full bg-transparent border-0 focus:ring-2 focus:ring-blue-500/20 rounded px-2 py-1.5 text-sm outline-none font-semibold transition-all ${!transition?.to ? 'text-zinc-300 italic' : 'text-zinc-700'}`}
                        >
                          <option value="">-</option>
                          {states.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        {fsm.type === 'Mealy' && transition && (
                          <div className="flex items-center gap-1 px-2 border-t border-zinc-100 pt-1 mt-1">
                            <span className="text-[9px] text-zinc-400 font-bold">OUT</span>
                            <input 
                              type="text"
                              value={transition.output || ''}
                              onChange={(e) => handleOutputChange(transition.id, e.target.value)}
                              placeholder="val"
                              className="w-full bg-zinc-50 border border-zinc-100 rounded px-1.5 py-0.5 text-[10px] text-emerald-600 font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
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
      
      <div className="max-w-md">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 mb-2">Alphabet Settings</h3>
          <p className="text-xs text-zinc-500 mb-4">Define the input symbols for your FSM. Separate with commas.</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              defaultValue={fsm.alphabet.join(', ')} 
              placeholder="e.g. 0, 1, a, b"
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              onBlur={(e) => {
                const newAlphabet = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                if (newAlphabet.length > 0) {
                  setAlphabet(newAlphabet);
                }
              }}
            />
          </div>
          <p className="text-[10px] text-zinc-400 mt-3 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            Use 'ε' for epsilon transitions in NFA models.
          </p>
        </div>
      </div>
    </div>
  );
};
