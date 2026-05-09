import React, { useState } from 'react';
import { FsmGraph } from './components/FsmGraph';
import { FsmTable } from './components/FsmTable';
import { FsmText } from './components/FsmText';
import { SimulatorPanel } from './components/SimulatorPanel';
import { FsmTypeSelector } from './components/FsmTypeSelector';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'graph' | 'table' | 'text'>('graph');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-zinc-800">FSM Tool</h1>
          <FsmTypeSelector />
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-lg">
          {(['graph', 'table', 'text'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-zinc-50">
          {activeTab === 'graph' && <FsmGraph />}
          {activeTab === 'table' && <FsmTable />}
          {activeTab === 'text' && <FsmText />}
        </div>
        
        {/* Sidebar Simulator */}
        <aside className="w-80 border-l border-zinc-200 bg-white flex flex-col shrink-0">
          <SimulatorPanel />
        </aside>
      </main>
    </div>
  );
};

export default App;
