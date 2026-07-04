import React from 'react';
import { useStore } from '../store/useStore';
import { HistoryIcon, RotateCcwIcon, ClockIcon, MessageSquareIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const VersionHistory: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { activeDiagramId, diagrams, restoreVersion, saveVersion } = useStore();
  const activeDiagram = diagrams.find(d => d.id === activeDiagramId);

  if (!activeDiagram) return null;

  return (
    <div className="flex flex-col h-full bg-brand-bg text-white p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-brand-accent" />
          Version History
        </h2>
        <button onClick={onClose} className="text-white/40 hover:text-white text-sm">Close</button>
      </div>

      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Current State</p>
          <p className="text-xs text-white/90">Manually save a snapshot of the current diagram.</p>
        </div>
        <button
          onClick={() => {
            const msg = prompt('Enter a message for this version:');
            if (msg !== null) saveVersion(activeDiagram.id, msg);
          }}
          className="px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover rounded-lg text-xs font-bold transition-all shadow-lg shadow-brand-accent/20"
        >
          Save Snapshot
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {(!activeDiagram.versions || activeDiagram.versions.length === 0) ? (
          <div className="text-center py-12 text-white/20">
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-sm">No versions saved yet.</p>
          </div>
        ) : (
          [...(activeDiagram.versions || [])].reverse().map((version) => (
            <div
              key={version.id}
              className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:border-brand-accent/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-brand-accent">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">
                    {formatDistanceToNow(version.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Restore this version? Unsaved changes in the current diagram will be lost.')) {
                      restoreVersion(activeDiagram.id, version.id);
                      onClose();
                    }
                  }}
                  className="p-2 hover:bg-brand-accent rounded-lg text-white/40 hover:text-white transition-all"
                  title="Restore this version"
                >
                  <RotateCcwIcon className="w-4 h-4" />
                </button>
              </div>
              
              {version.message && (
                <div className="flex items-start gap-2 mb-3">
                  <MessageSquareIcon className="w-3.5 h-3.5 text-white/20 mt-0.5" />
                  <p className="text-xs text-white/70 italic leading-relaxed">
                    "{version.message}"
                  </p>
                </div>
              )}

              <div className="bg-black/40 p-2 rounded border border-white/5 font-mono text-[10px] text-white/30 truncate">
                {version.code.slice(0, 100)}...
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
