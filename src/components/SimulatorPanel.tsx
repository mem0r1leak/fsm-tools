import React, { useState, useMemo } from 'react';
import { useFsmStore } from '../store/useFsmStore';
import { FsmEngine, type SimulationStep } from '../engine/fsmEngine';
import { Play, FastForward, SkipForward, RotateCcw, AlertCircle, CheckCircle2, XCircle, History, Cpu } from 'lucide-react';

export const SimulatorPanel: React.FC = () => {
  const { fsm, errors } = useFsmStore();
  const [inputString, setInputString] = useState('');
  const [currentStep, setCurrentStep] = useState<SimulationStep | null>(null);
  const [history, setHistory] = useState<SimulationStep[]>([]);
  
  const engine = useMemo(() => new FsmEngine(fsm), [fsm]);

  const handleStart = () => {
    const initial = engine.getInitialStep();
    initial.inputRemaining = inputString;
    setCurrentStep(initial);
    setHistory([initial]);
  };

  const handleStep = () => {
    if (!currentStep || currentStep.inputRemaining.length === 0) return;
    
    const symbol = currentStep.inputRemaining[0];
    const next = engine.step(currentStep, symbol);
    setCurrentStep(next);
    setHistory([...history, next]);
  };

  const handleRun = () => {
    let step = currentStep;
    if (!step) {
      step = engine.getInitialStep();
      step.inputRemaining = inputString;
    }
    
    const newHistory = [...history];
    if (history.length === 0) newHistory.push(step);

    while (step.inputRemaining.length > 0) {
      const symbol = step.inputRemaining[0];
      step = engine.step(step, symbol);
      newHistory.push(step);
    }

    setCurrentStep(step);
    setHistory(newHistory);
  };

  const handleReset = () => {
    setCurrentStep(null);
    setHistory([]);
  };

  const isAccepted = currentStep && currentStep.inputRemaining.length === 0 && 
    currentStep.activeStates.some(id => fsm.states[id]?.isFinal);

  return (
    <div className="flex flex-col h-full p-8 bg-white border-l border-zinc-200">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-200">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-800">Simulator</h2>
          <p className="text-xs text-zinc-500">Test your machine with input strings</p>
        </div>
      </div>

      {/* Verification */}
      <div className="mb-8">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">System Status</h3>
        {errors.length > 0 ? (
          <div className="space-y-2">
            <div className="flex gap-3 text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div className="text-[11px] font-medium leading-tight">
                <p className="font-bold mb-1">Configuration Issues</p>
                {errors.length} logical errors preventing optimal simulation.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <div className="text-[11px] font-medium">
              <p className="font-bold mb-1">Ready for Test</p>
              Machine logic is sound.
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mb-8">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Input String</h3>
        <input
          type="text"
          value={inputString}
          onChange={(e) => setInputString(e.target.value)}
          placeholder="e.g. 1011"
          disabled={!!currentStep && currentStep.inputRemaining.length === 0}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:opacity-50 transition-all"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {!currentStep ? (
            <>
              <button
                onClick={handleStart}
                className="bg-zinc-900 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200"
              >
                <Play className="w-4 h-4 fill-current" /> Initialize
              </button>
              <button
                onClick={handleRun}
                className="bg-blue-600 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
              >
                <FastForward className="w-4 h-4 fill-current" /> Auto-Run
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStep}
                disabled={currentStep.inputRemaining.length === 0}
                className="bg-zinc-900 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                <SkipForward className="w-4 h-4 fill-current" /> Step
              </button>
              <button
                onClick={handleRun}
                disabled={currentStep.inputRemaining.length === 0}
                className="bg-blue-600 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                <FastForward className="w-4 h-4 fill-current" /> Finish
              </button>
              <button
                onClick={handleReset}
                className="col-span-2 bg-zinc-100 text-zinc-600 rounded-xl py-2 text-xs font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Simulation
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results & History */}
      {currentStep && (
        <div className="flex-1 flex flex-col min-h-0">
          {currentStep.inputRemaining.length === 0 && (
            <div className="mb-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Execution Result</h3>
              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                isAccepted ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isAccepted ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white shadow-red-100 shadow-lg'}`}>
                  {isAccepted ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-black text-base leading-none mb-1">{isAccepted ? 'ACCEPTED' : 'REJECTED'}</div>
                  <div className="text-[11px] font-medium opacity-70 tracking-tight">
                    {isAccepted ? 'Input string successfully processed' : 'Failed to reach an accepting state'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Step-by-Step History
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-3 space-y-2 font-mono text-[10px]">
              {history.map((step, i) => (
                <div key={i} className={`p-3 rounded-xl border flex items-center gap-4 transition-all ${
                  i === history.length - 1 ? 'bg-blue-50/50 border-blue-200 text-blue-900 ring-2 ring-blue-500/10' : 'bg-zinc-50/30 border-zinc-100 text-zinc-500'
                }`}>
                  <div className="w-4 text-zinc-300 font-black text-right">{i}</div>
                  <div className="flex-1 flex items-center gap-3 overflow-hidden">
                    <span className={`px-2 py-1 rounded-lg font-bold min-w-[24px] text-center ${i === 0 ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 shadow-sm'}`}>
                      {step.consumedSymbol || 'STR'}
                    </span>
                    <span className="text-zinc-300">→</span>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                      {step.activeStates.map(id => (
                        <span key={id} className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap border ${
                          fsm.states[id]?.isFinal ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-200'
                        }`}>
                          {fsm.states[id]?.name || id}
                        </span>
                      ))}
                    </div>
                  </div>
                  {(fsm.type === 'Moore' || fsm.type === 'Mealy') && step.lastOutput !== undefined && (
                    <div className="flex items-center gap-1.5 bg-emerald-100/50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-200 font-black">
                      <span className="text-[8px] opacity-50 uppercase">Out</span>
                      {step.lastOutput}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(fsm.type === 'Moore' || fsm.type === 'Mealy') && (
              <div className="mt-6 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl">
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Cumulative Output Sequence</div>
                <div className="text-emerald-400 font-mono text-sm font-bold tracking-[0.2em] break-all leading-relaxed">
                  {currentStep.outputSequence.join('') || '-'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
