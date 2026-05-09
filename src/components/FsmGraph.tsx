import React, { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useFsmStore } from "../store/useFsmStore";
import { Settings2, Trash2 } from "lucide-react";
import { SmartEdge } from "./SmartEdge";

const edgeTypes = {
  smart: SmartEdge,
};

const FsmGraphInner: React.FC = () => {
  const {
    fsm,
    updateState,
    addState,
    deleteState,
    addTransition,
    deleteTransition,
    updateTransition,
  } = useFsmStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes: Node[] = useMemo(
    () =>
      Object.values(fsm.states).map((state) => ({
        id: state.id,
        data: {
          label: (
            <div className="flex flex-col items-center">
              <span>{state.name}</span>
              {fsm.type === "Moore" && state.output && (
                <span className="text-[10px] text-emerald-600 font-bold border-t border-emerald-100 w-full text-center mt-1 pt-1">
                  {state.output}
                </span>
              )}
            </div>
          ),
        },
        position: { x: state.x, y: state.y },
        selected: selectedNodeId === state.id,
        style: {
          background: state.isStart ? "#eff6ff" : "#fff",
          border: state.isFinal
            ? selectedNodeId === state.id
              ? "2px solid #2563eb"
              : "2px double #2563eb"
            : selectedNodeId === state.id
              ? "2px solid #2563eb"
              : "1px solid #d1d5db",
          borderRadius: "50%",
          width: 60,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: "bold",
          boxShadow: state.isFinal
            ? "0 0 0 2px white, 0 0 0 4px #d1d5db"
            : "none",
        },
      })),
    [fsm.states, selectedNodeId, fsm.type],
  );

  const edges: Edge[] = useMemo(() => {
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

    return Object.entries(grouped).map(([key, transitions]) => {
      const [from, to] = key.split("-");

      // Merge labels
      const mergedLabel = transitions
        .map((t) => t.input + (t.output ? `/${t.output}` : ""))
        .join(", ");

      const hasReverse = fsm.transitions.some(
        (rt) => rt.from === to && rt.to === from,
      );
      const isSelfLoop = from === to;

      // An edge is "selected" if any of its underlying transitions are selected
      const isSelected = transitions.some((t) => selectedEdgeId === t.id);

      return {
        id: `edge-${key}`, // Stable ID based on direction
        source: from,
        target: to,
        label: mergedLabel,
        selected: isSelected,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSelected ? "#2563eb" : "#64748b",
          width: 20,
          height: 20,
        },
        style: {
          stroke: isSelected ? "#2563eb" : "#64748b",
          strokeWidth: isSelected ? 3 : 2,
        },
        type: "smart",
        data: {
          index: 0, // Since we merged, index is always 0
          hasReverse,
          isSelfLoop,
          hasMultiple: false,
          transitionIds: transitions.map((t) => t.id), // Keep track for selection
        },
        animated: false,
      };
    });
  }, [fsm.transitions, selectedEdgeId]);

  const onNodesChange = useCallback(
    (changes: any) => {
      changes.forEach((change: any) => {
        if (change.type === "position" && change.position) {
          updateState(change.id, {
            x: change.position.x,
            y: change.position.y,
          });
        }
        if (change.type === "remove") {
          deleteState(change.id);
          if (selectedNodeId === change.id) setSelectedNodeId(null);
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
    [updateState, deleteState, selectedNodeId],
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      changes.forEach((change: any) => {
        if (change.type === "remove") {
          const match = change.id.match(/^edge-(.+)-(.+)$/);
          if (match) {
            const [, from, to] = match;
            // Important: we need the current transitions from the store
            // but we can't easily get them inside onEdgesChange without adding them to dependencies
            // which might cause loops. Let's use the ids from the edge data if possible,
            // but changes object doesn't have data.
            // We'll rely on the fsm dependency in the useCallback.
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
            const match = change.id.match(/^edge-(.+)-(.+)$/);
            if (match) {
              const [, from, to] = match;
              const isStillSelected = fsm.transitions.some(
                (t) =>
                  t.id === selectedEdgeId && t.from === from && t.to === to,
              );
              if (isStillSelected) setSelectedEdgeId(null);
            }
          }
        }
      });
    },
    [deleteTransition, selectedEdgeId, fsm.transitions],
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
        if (nextAvailable) {
          input = nextAvailable;
        }
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
  const selectedTransition = selectedEdgeId
    ? fsm.transitions.find((t) => t.id === selectedEdgeId)
    : null;

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneContextMenu={onPaneContextMenu}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background color="#f1f5f9" />
        <Controls />
      </ReactFlow>

      {(selectedState || selectedTransition) && (
        <div className="absolute top-4 right-4 w-64 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-xl shadow-xl p-4 z-50">
          {selectedState && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" /> State: {selectedState.name}
                </h3>
                <button
                  onClick={() => deleteState(selectedState.id)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Name
                  </label>
                  <input
                    type="text"
                    value={selectedState.name}
                    onChange={(e) =>
                      updateState(selectedState.id, { name: e.target.value })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
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
                    <span className="text-xs text-zinc-600">Start</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
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
                    <span className="text-xs text-zinc-600">Final</span>
                  </label>
                </div>

                {fsm.type === "Moore" && (
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Output Symbol
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
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {selectedTransition && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" /> Transition
                </h3>
                <button
                  onClick={() => deleteTransition(selectedTransition.id)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Input Symbol
                  </label>
                  <input
                    type="text"
                    value={selectedTransition.input}
                    onChange={(e) =>
                      updateTransition(selectedTransition.id, {
                        input: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                {fsm.type === "Mealy" && (
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Output Symbol
                    </label>
                    <input
                      type="text"
                      value={selectedTransition.output || ""}
                      onChange={(e) =>
                        updateTransition(selectedTransition.id, {
                          output: e.target.value,
                        })
                      }
                      placeholder="e.g. 1"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-zinc-200 text-[10px] text-zinc-500">
        Right click to add state • Drag to connect • Backspace to delete
      </div>
    </div>
  );
};

export const FsmGraph: React.FC = () => (
  <ReactFlowProvider>
    <FsmGraphInner />
  </ReactFlowProvider>
);
