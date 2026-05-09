import React, { useState, useMemo } from 'react';
import { useFsmStore } from '../store/useFsmStore';
import { FsmEngine, type SimulationStep } from '../engine/fsmEngine';
import { Play, FastForward, SkipForward, RotateCcw, AlertCircle, CheckCircle2, XCircle, History } from 'lucide-react';

export const SimulatorPanel: React.FC = () => {
  const { fsm } = useFsmStore();
  const [inputString, setInputString] = useState('');
  const [currentStep, setCurrentStep] = useState<SimulationStep | null>(null);
  const [history, setHistory] = useState<SimulationStep[]>([]);
  
  const engine = useMemo(() => new FsmEngine(fsm), [fsm]);
  const validationErrors = useMemo(() => engine.verify(), [engine]);

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
    <div className="flex flex-col h-full p-6">
      <h2 className="text-lg font-bold text-zinc-800 mb-6">Simulator</h2>

      {/* Verification */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Validation</h3>
        {validationErrors.length > 0 ? (
          <div className="space-y-2">
            {validationErrors.map((err, i) => (
              <div key={i} className="flex gap-2 text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Machine is valid.</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Test String</h3>
        <input
          type="text"
          value={inputString}
          onChange={(e) => setInputString(e.target.value)}
          placeholder="e.g. 01011"
          disabled={!!currentStep && currentStep.inputRemaining.length === 0}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
        />
        <div className="mt-4 flex gap-2">
          {!currentStep ? (
            <>
              <button
                onClick={handleStart}
                className="flex-1 bg-zinc-900 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
              >
                <Play className="w-4 h-4" /> Start
              </button>
              <button
                onClick={handleRun}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FastForward className="w-4 h-4" /> Run
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStep}
                disabled={currentStep.inputRemaining.length === 0}
                className="flex-1 bg-zinc-900 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <SkipForward className="w-4 h-4" /> Step
              </button>
              <button
                onClick={handleRun}
                disabled={currentStep.inputRemaining.length === 0}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FastForward className="w-4 h-4" /> Run
              </button>
              <button
                onClick={handleReset}
                className="bg-zinc-100 text-zinc-600 rounded-lg px-4 py-2 hover:bg-zinc-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results & History */}
      {currentStep && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Result</h3>
            {currentStep.inputRemaining.length === 0 && (
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                isAccepted ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                {isAccepted ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                <div>
                  <div className="font-bold text-sm">{isAccepted ? 'Accepted' : 'Rejected'}</div>
                  <div className="text-xs opacity-80">{isAccepted ? 'Reached final state' : 'No final state reached'}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> History Log
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 font-mono text-[11px]">
              {history.map((step, i) => (
                <div key={i} className={`p-2 rounded border flex items-center gap-3 ${
                  i === history.length - 1 ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-white border-zinc-100 text-zinc-600'
                }`}>
                  <div className="w-4 text-zinc-300 font-bold">{i}</div>
                  <div className="flex-1 flex items-center gap-2 overflow-hidden">
                    <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 min-w-[20px] text-center">
                      {step.consumedSymbol || 'start'}
                    </span>
                    <span className="text-zinc-400">→</span>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                      {step.activeStates.map(id => (
                        <span key={id} className="bg-white border border-zinc-200 px-1 rounded font-bold">
                          {fsm.states[id]?.name || id}
                        </span>
                      ))}
                    </div>
                  </div>
                  {(fsm.type === 'Moore' || fsm.type === 'Mealy') && step.lastOutput !== undefined && (
                    <div className="text-emerald-600 font-bold">
                      out: {step.lastOutput}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(fsm.type === 'Moore' || fsm.type === 'Mealy') && (
              <div className="mt-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Output Sequence</div>
                <div className="text-emerald-400 font-mono text-sm tracking-widest break-all">
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
