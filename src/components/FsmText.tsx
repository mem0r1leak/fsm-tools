import React, { useState, useEffect, useRef } from 'react';
import { useFsmStore } from '../store/useFsmStore';
import { parseDSL, serializeFSM } from '../utils/dslParser';
import { AlertCircle, CheckCircle2, RotateCcw, Save, Info, RefreshCw } from 'lucide-react';

export const FsmText: React.FC = () => {
  const { fsm, setFsm, errors: storeErrors } = useFsmStore();
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState<{ message: string; line?: number } | null>(null);
  const isEditing = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync Store -> Text (only when not actively typing)
  useEffect(() => {
    if (!isEditing.current) {
      setText(serializeFSM(fsm));
    }
  }, [fsm]);

  // Auto-sync Text -> Store (debounced)
  useEffect(() => {
    if (!isEditing.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      const { fsm: newFsm, error } = parseDSL(text, fsm.states);
      if (!error) {
        setFsm(newFsm);
        setLocalError(null);
      } else {
        setLocalError(error);
      }
    }, 1000); // 1s debounce

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [text, fsm.states, setFsm]);

  const handleReset = () => {
    isEditing.current = false;
    setText(serializeFSM(fsm));
    setLocalError(null);
  };

  const handleApply = () => {
    const { fsm: newFsm, error } = parseDSL(text, fsm.states);
    if (error) {
      setLocalError(error);
    } else {
      isEditing.current = false;
      setFsm(newFsm);
      setLocalError(null);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col bg-zinc-50/50">
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">DSL Editor</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase rounded-full">
              <RefreshCw className="w-2.5 h-2.5" /> Live Sync
            </div>
          </div>
          <p className="text-xs text-zinc-500 font-medium italic">Changes are automatically synced when valid</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-zinc-800 font-bold text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Current
          </button>
          <button
            onClick={handleApply}
            className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-zinc-200 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Force Sync
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex gap-8 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 relative">
          <textarea
            value={text}
            onChange={(e) => {
              isEditing.current = true;
              setText(e.target.value);
            }}
            onBlur={() => {
              // Only stop editing mode if we are actually in sync or text is same as store
              if (text === serializeFSM(fsm)) {
                isEditing.current = false;
              }
            }}
            className="flex-1 font-mono text-sm bg-white border border-zinc-200 rounded-2xl p-8 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none resize-none shadow-sm transition-all leading-relaxed"
            spellCheck={false}
            placeholder="# Enter your FSM code..."
          />
          {localError?.line && localError.line > 0 && (
            <div 
              className="absolute left-0 right-0 bg-red-500/10 border-y border-red-200 pointer-events-none transition-all"
              style={{ 
                top: `${(localError.line - 1) * 1.5 + 2.1}rem`, 
                height: '1.5rem' 
              }}
            />
          )}
        </div>
...

        <div className="w-80 flex flex-col gap-6 overflow-y-auto pr-2">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Real-time Analysis</h3>
              {localError ? (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            
            {localError ? (
              <div className="space-y-3">
                <div className="flex gap-3 text-red-700 bg-red-50 p-4 rounded-xl border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div className="text-[11px] font-bold leading-relaxed">
                    <p className="uppercase mb-1 opacity-50">Syntax Error {localError.line ? `at line ${localError.line}` : ''}</p>
                    {localError.message}
                  </div>
                </div>
              </div>
            ) : storeErrors.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-3 text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div className="text-[11px] font-bold leading-relaxed">
                    <p className="uppercase mb-1 opacity-50">Logic Warnings ({storeErrors.length})</p>
                    <ul className="list-disc ml-3 space-y-1 mt-2">
                      {storeErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div className="text-[11px] font-bold">
                  <p className="uppercase mb-1 opacity-50">Validation Passed</p>
                  Definition is structurally sound and ready for simulation.
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4 text-zinc-500">
              <Info className="w-3.5 h-3.5" />
              <h4 className="text-[9px] font-black uppercase tracking-widest">Quick Reference</h4>
            </div>
            <div className="space-y-4 font-mono text-[10px]">
              <div>
                <div className="text-zinc-500 mb-1 font-bold">// Configuration</div>
                <div className="text-blue-400">type: <span className="text-white">DFA</span></div>
                <div className="text-blue-400">alphabet: <span className="text-white">0, 1</span></div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1 font-bold">// States</div>
                <div className="text-emerald-400">q0 <span className="text-zinc-400">[start, final]</span></div>
                <div className="text-emerald-400">q1 <span className="text-zinc-400">[output: "1"]</span></div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1 font-bold">// Transitions</div>
                <div className="text-amber-400">q0 -- 0 --&gt; q1</div>
                <div className="text-amber-400">q1 -- 1/out --&gt; q0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
