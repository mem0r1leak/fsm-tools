import React, { useCallback, useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useFsmStore } from "../store/useFsmStore";
import { Settings2, Trash2, AlertCircle, Info } from "lucide-react";
import { SmartEdge } from "./SmartEdge";

const edgeTypes = {
  smart: SmartEdge,
};

const FsmGraphInner: React.FC = () => {
  const fsm = useFsmStore((state) => state.fsm);
  const errors = useFsmStore((state) => state.errors);
  const updateState = useFsmStore((state) => state.updateState);
  const addState = useFsmStore((state) => state.addState);
  const deleteState = useFsmStore((state) => state.deleteState);
  const addTransition = useFsmStore((state) => state.addTransition);
  const deleteTransition = useFsmStore((state) => state.deleteTransition);
  const updateTransition = useFsmStore((state) => state.updateTransition);
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Sync Store -> Local State
  // We only want to sync when the logical structure or external positions change
  useEffect(() => {
    const newNodes: Node[] = Object.values(fsm.states).map((state) => ({
      id: state.id,
      data: {
        label: (
          <div className="flex flex-col items-center select-none">
            <span className="text-zinc-900 font-bold">{state.name}</span>
            {fsm.type === "Moore" && state.output && (
              <span className="text-[9px] text-emerald-600 font-black border-t border-emerald-100 w-full text-center mt-1 pt-0.5 uppercase">
                {state.output}
              </span>
            )}
          </div>
        ),
      },
      position: { x: state.x, y: state.y },
      selected: selectedNodeId === state.id,
      style: {
        background: state.isStart ? "#f0f7ff" : "#fff",
        border: state.isFinal
          ? selectedNodeId === state.id
            ? "2px solid #2563eb"
            : "3px double #2563eb"
          : selectedNodeId === state.id
            ? "2px solid #2563eb"
            : "1.5px solid #e2e8f0",
        borderRadius: "50%",
        width: 60,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        boxShadow: selectedNodeId === state.id ? "0 0 0 4px rgba(37, 99, 235, 0.1)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        transition: "background 0.2s, border 0.2s, box-shadow 0.2s",
      },
    }));

    // Group transitions by from-to pair
    const grouped = fsm.transitions.reduce(
      (acc, t) => {
        const key = `${t.from}-${t.to}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      },
      {} as Record<string, typeof fsm.transitions>,
    );

    const newEdges: Edge[] = Object.entries(grouped).map(([key, transitions]) => {
      const [from, to] = key.split("-");
      const mergedLabel = transitions
        .map((t) => t.input + (t.output ? `/${t.output}` : ""))
        .join(", ");

      const hasReverse = fsm.transitions.some(
        (rt) => rt.from === to && rt.to === from,
      );
      const isSelfLoop = from === to;
      const isSelected = transitions.some((t) => selectedEdgeId === t.id);

      return {
        id: `edge-${key}`, 
        source: from,
        target: to,
        label: mergedLabel,
        selected: isSelected,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSelected ? "#2563eb" : "#94a3b8",
          width: 20,
          height: 20,
        },
        style: {
          stroke: isSelected ? "#2563eb" : "#94a3b8",
          strokeWidth: isSelected ? 2.5 : 1.5,
        },
        type: "smart",
        data: {
          index: 0,
          hasReverse,
          isSelfLoop,
          hasMultiple: false,
          transitionIds: transitions.map((t) => t.id),
        },
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [fsm, selectedNodeId, selectedEdgeId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      
      // Handle deletions and selections immediately in the store
      changes.forEach((change) => {
        if (change.type === "remove") {
          deleteState(change.id);
        }
        if (change.type === "select") {
          if (change.selected) {
            setSelectedNodeId(change.id);
            setSelectedEdgeId(null);
          } else if (selectedNodeId === change.id) {
            setSelectedNodeId(null);
          }
        }
      });
    },
    [deleteState, selectedNodeId],
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      updateState(node.id, {
        x: node.position.x,
        y: node.position.y,
      });
    },
    [updateState],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));

      changes.forEach((change) => {
        if (change.type === "remove") {
          const match = change.id.match(/^edge-(.+)-(.+)$/);
          if (match) {
            const [, from, to] = match;
            fsm.transitions
              .filter((t) => t.from === from && t.to === to)
              .forEach((t) => deleteTransition(t.id));
          }
        }
        if (change.type === "select") {
          if (change.selected) {
            const match = change.id.match(/^edge-(.+)-(.+)$/);
            if (match) {
              const [, from, to] = match;
              const firstT = fsm.transitions.find(
                (t) => t.from === from && t.to === to,
              );
              if (firstT) {
                setSelectedEdgeId(firstT.id);
                setSelectedNodeId(null);
              }
            }
          } else {
            setSelectedEdgeId(null);
          }
        }
      });
    },
    [deleteTransition, fsm.transitions],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      let input = fsm.alphabet[0] || "0";

      if (fsm.type === "DFA") {
        const existingInputs = fsm.transitions
          .filter((t) => t.from === params.source)
          .map((t) => t.input);

        const nextAvailable = fsm.alphabet.find(
          (symbol) => !existingInputs.includes(symbol),
        );
        
        if (!nextAvailable) {
          // No more symbols available for this state in DFA
          return;
        }
        
        input = nextAvailable;
      }

      addTransition({
        from: params.source || "",
        to: params.target || "",
        input,
      });
    },
    [addTransition, fsm.alphabet, fsm.type, fsm.transitions],
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      const clientX = "clientX" in event ? event.clientX : 0;
      const clientY = "clientY" in event ? event.clientY : 0;

      const position = screenToFlowPosition({ x: clientX, y: clientY });

      let nextNum = Object.keys(fsm.states).length;
      let id = `q${nextNum}`;
      while (fsm.states[id]) {
        nextNum++;
        id = `q${nextNum}`;
      }

      addState({
        id,
        name: id,
        x: position.x - 30,
        y: position.y - 30,
      });
    },
    [addState, fsm.states, screenToFlowPosition],
  );

  const selectedState = selectedNodeId ? fsm.states[selectedNodeId] : null;
  
  // Get all transitions for the selected edge direction
  const selectedEdgeTransitions = useMemo(() => {
    if (!selectedEdgeId) return [];
    const mainT = fsm.transitions.find(t => t.id === selectedEdgeId);
    if (!mainT) return [];
    return fsm.transitions.filter(t => t.from === mainT.from && t.to === mainT.to);
  }, [fsm.transitions, selectedEdgeId]);

  return (
    <div className="w-full h-full relative bg-zinc-50/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onPaneContextMenu={onPaneContextMenu}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background color="#cbd5e1" variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
      </ReactFlow>

      {/* Logic Errors Overlay */}
      {errors.length > 0 && (
        <div className="absolute top-4 left-4 z-50">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-lg max-w-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-2 text-amber-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Validation Errors</span>
            </div>
            <ul className="space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="text-[10px] text-amber-700 leading-tight">• {err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {(selectedState || selectedEdgeTransitions.length > 0) && (
        <div className="absolute top-4 right-4 w-80 bg-white/95 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-right-4 duration-200 overflow-y-auto max-h-[calc(100vh-2rem)]">
          {selectedState && (
            <>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800">State Settings</h3>
                    <p className="text-[10px] text-zinc-400 font-medium">{selectedState.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteState(selectedState.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={selectedState.name}
                    onChange={(e) =>
                      updateState(selectedState.id, { name: e.target.value })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer ${selectedState.isStart ? 'bg-blue-50 border-blue-100' : 'bg-zinc-50 border-zinc-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase ${selectedState.isStart ? 'text-blue-600' : 'text-zinc-400'}`}>Start</span>
                      <input
                        type="checkbox"
                        checked={selectedState.isStart}
                        onChange={(e) =>
                          updateState(selectedState.id, {
                            isStart: e.target.checked,
                          })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </label>
                  <label className={`flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer ${selectedState.isFinal ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase ${selectedState.isFinal ? 'text-zinc-100' : 'text-zinc-400'}`}>Final</span>
                      <input
                        type="checkbox"
                        checked={selectedState.isFinal}
                        onChange={(e) =>
                          updateState(selectedState.id, {
                            isFinal: e.target.checked,
                          })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </label>
                </div>

                {fsm.type === "Moore" && (
                  <div>
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 block">
                      Output Value
                    </label>
                    <input
                      type="text"
                      value={selectedState.output || ""}
                      onChange={(e) =>
                        updateState(selectedState.id, {
                          output: e.target.value,
                        })
                      }
                      placeholder="e.g. 1"
                      className="w-full bg-emerald-50/30 border border-emerald-100 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-emerald-700 placeholder:text-emerald-200"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {selectedEdgeTransitions.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800">Edge Transitions</h3>
                    <p className="text-[10px] text-zinc-400 font-medium">
                      {fsm.states[selectedEdgeTransitions[0].from]?.name} → {fsm.states[selectedEdgeTransitions[0].to]?.name}
                    </p>
                  </div>
                </div>
                <button
                  disabled={(() => {
                    if (fsm.type !== 'DFA') return false;
                    const first = selectedEdgeTransitions[0];
                    const existingSymbols = fsm.transitions
                      .filter(t => t.from === first.from)
                      .map(t => t.input);
                    return fsm.alphabet.every(sym => existingSymbols.includes(sym));
                  })()}
                  onClick={() => {
                    const first = selectedEdgeTransitions[0];
                    let nextSymbol = fsm.alphabet[0] || "0";
                    
                    if (fsm.type === 'DFA') {
                      const existingSymbols = fsm.transitions
                        .filter(t => t.from === first.from)
                        .map(t => t.input);
                      const available = fsm.alphabet.find(sym => !existingSymbols.includes(sym));
                      if (!available) return; // Should be disabled anyway
                      nextSymbol = available;
                    }

                    addTransition({ from: first.from, to: first.to, input: nextSymbol });
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all font-bold text-lg disabled:opacity-20 disabled:hover:bg-transparent"
                  title="Add another transition"
                >
                  +
                </button>
              </div>

              <div className="space-y-6">
                {selectedEdgeTransitions.map((t) => (
                  <div key={t.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl relative group">
                    <button
                      onClick={() => deleteTransition(t.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-red-100 text-red-400 rounded-full flex items-center justify-center hover:text-red-600 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">
                          Symbol
                        </label>
                        <select
                          value={t.input}
                          onChange={(e) => updateTransition(t.id, { input: e.target.value })}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                          {fsm.alphabet.map(sym => {
                            // Check if this symbol is already used by ANOTHER transition from this state
                            const isUsedElsewhere = fsm.type === 'DFA' && fsm.transitions.some(
                              otherT => otherT.from === t.from && otherT.input === sym && otherT.id !== t.id
                            );
                            return (
                              <option key={sym} value={sym} disabled={isUsedElsewhere}>
                                {sym} {isUsedElsewhere ? '(assigned)' : ''}
                              </option>
                            );
                          })}
                          {fsm.type === 'NFA' && <option value="ε">ε (epsilon)</option>}
                          {!fsm.alphabet.includes(t.input) && t.input !== 'ε' && (
                            <option value={t.input}>{t.input} (Invalid)</option>
                          )}
                        </select>
                      </div>

                      {fsm.type === "Mealy" && (
                        <div>
                          <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">
                            Output
                          </label>
                          <input
                            type="text"
                            value={t.output || ""}
                            onChange={(e) =>
                              updateTransition(t.id, {
                                output: e.target.value,
                              })
                            }
                            placeholder="out"
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-emerald-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-zinc-200 shadow-xl flex gap-6 text-[10px] text-zinc-500 font-bold uppercase tracking-wider select-none">
        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-300" /> Right click to add state</div>
        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-300" /> Drag to connect</div>
        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-300" /> Backspace to delete</div>
      </div>
    </div>
  );
};

export const FsmGraph: React.FC = () => (
  <ReactFlowProvider>
    <FsmGraphInner />
  </ReactFlowProvider>
);
