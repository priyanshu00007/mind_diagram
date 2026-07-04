import React from 'react';
import { 
  Code2Icon, 
  LayoutDashboardIcon, 
  EyeIcon, 
  Share2Icon, 
  Undo2Icon,
  Redo2Icon,
  Wand2Icon,
  DownloadIcon,
  ChevronDownIcon,
  SparklesIcon,
  PanelLeftIcon,
  GitCommitIcon,
  MoreHorizontalIcon,
  MonitorIcon
} from 'lucide-react';

import { useStore } from '../store/useStore';
import { ViewMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { exportDiagram } from '../lib/export';
import { useState } from 'react';
import confetti from 'canvas-confetti';

interface ToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenTemplates: () => void;
  onOpenHistory: () => void;
  onToggleAIChat: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isHistoryOpen: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  viewMode, 
  setViewMode,
  onOpenTemplates,
  onOpenHistory,
  onToggleAIChat,
  isSidebarOpen,
  onToggleSidebar,
  isHistoryOpen
}) => {
  const { activeDiagramId, diagrams, updateDiagram, formatActiveDiagram } = useStore();
  const { undo, redo, pastStates, futureStates } = useStore.temporal.getState();
  const activeDiagram = diagrams.find(d => d.id === activeDiagramId);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeDiagramId) {
      updateDiagram(activeDiagramId, { name: e.target.value });
    }
  };

  const onExport = async (type: 'png' | 'svg' | 'pdf') => {
    const target = document.querySelector('.export-target') as HTMLElement;
    if (!target) { console.error('Diagram container not found'); return; }
    try {
      await exportDiagram(target, type, activeDiagram?.name || 'diagram');
      setIsExportOpen(false);
    } catch (err) {
      alert('Export failed. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!activeDiagramId) return;
    setIsSharing(true);
    const shareUrl = `${window.location.origin}/share/${activeDiagramId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      confetti({ particleCount: 50, spread: 30, origin: { y: 0.8 } });
      alert('Share link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="h-12 sm:h-14 border-b border-white/10 bg-brand-bg/80 backdrop-blur-md flex items-center justify-between px-2 sm:px-4 lg:px-6 gap-1 relative z-10">
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-1 min-w-0">
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 sm:p-2 rounded-lg transition-colors shrink-0 ${isSidebarOpen ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/40'}`}
          title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          <PanelLeftIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
        </button>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <input
            type="text"
            value={activeDiagram?.name || ''}
            onChange={handleNameChange}
            placeholder="Untitled"
            className="bg-transparent border-none text-xs sm:text-sm font-semibold tracking-tight focus:outline-none focus:ring-1 focus:ring-brand-accent/30 rounded px-1 sm:px-2 py-1 min-w-[70px] sm:min-w-[120px] lg:min-w-[200px] text-white truncate"
          />
        </div>

        <div className="h-4 w-px bg-white/10 mx-1 sm:mx-2 hidden sm:block" />

        <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10 shrink-0">
          <button
            onClick={() => undo()}
            disabled={pastStates.length === 0}
            className="p-1 sm:p-1.5 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-md text-white/60 transition-colors"
            title="Undo"
          >
            <Undo2Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </button>
          <button
            onClick={() => redo()}
            disabled={futureStates.length === 0}
            className="p-1 sm:p-1.5 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-md text-white/60 transition-colors"
            title="Redo"
          >
            <Redo2Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

        <div className="flex bg-white/5 p-0.5 sm:p-1 rounded-lg border border-white/10 shrink-0">
          <button
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 lg:px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all ${
              viewMode === 'editor' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-white/40 hover:text-white/80'
            }`}
            title="Editor"
          >
            <Code2Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 lg:px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all ${
              viewMode === 'preview' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-white/40 hover:text-white/80'
            }`}
            title="Preview"
          >
            <EyeIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span className="hidden sm:inline">View</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
        <button
          onClick={onToggleAIChat}
          className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] sm:text-xs font-bold transition-all"
          title="AI Assistant"
        >
          <SparklesIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          <span className="hidden lg:inline">AI</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-brand-accent text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/20 active:scale-95"
            title="Export"
          >
            <DownloadIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDownIcon className={`w-2.5 sm:w-3 h-2.5 sm:h-3 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
          </button>
          {isExportOpen && <div className="fixed inset-0 z-50" onClick={() => setIsExportOpen(false)} />}
          <AnimatePresence>
            {isExportOpen && (
              <motion.div
                key="export-dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-36 sm:w-40 bg-brand-sidebar border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
              >
                <button onClick={() => onExport('png')} className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                  <span className="w-2 h-2 rounded bg-blue-400" />
                  PNG
                </button>
                <button onClick={() => onExport('svg')} className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                  <span className="w-2 h-2 rounded bg-emerald-400" />
                  SVG
                </button>
                <button onClick={() => onExport('pdf')} className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                  <span className="w-2 h-2 rounded bg-rose-400" />
                  PDF
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleShare}
          disabled={isSharing}
          className="items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 hidden sm:flex"
          title="Share"
        >
          <Share2Icon className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isSharing ? 'animate-spin' : ''}`} />
        </button>


        <div className="relative">
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
            title="More"
          >
            <MoreHorizontalIcon className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
          {isMoreOpen && <div className="fixed inset-0 z-50" onClick={() => setIsMoreOpen(false)} />}
          <AnimatePresence>
            {isMoreOpen && (
              <motion.div
                key="more-dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-44 bg-brand-sidebar border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
              >
                <button onClick={() => { formatActiveDiagram(); setIsMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                  <Wand2Icon className="w-4 h-4 text-amber-400" />
                  Format Code
                </button>
                <button onClick={() => { onOpenTemplates(); setIsMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                  <LayoutDashboardIcon className="w-4 h-4 text-blue-400" />
                  Templates
                </button>
                <button onClick={() => { onOpenHistory(); setIsMoreOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors ${
                    isHistoryOpen ? 'text-brand-accent bg-brand-accent/10' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}>
                  <GitCommitIcon className="w-4 h-4 text-emerald-400" />
                  Commits
                </button>
                <div className="border-t border-white/10 my-1" />
                <div className="px-4 py-2.5 flex items-center gap-3 text-xs text-white/50">
                  <MonitorIcon className="w-4 h-4" />
                  Theme
                  <div className="ml-auto flex gap-1">
                    {['dark', 'forest', 'neutral'].map(t => (
                      <button key={t}
                        onClick={() => setIsMoreOpen(false)}
                        className="w-4 h-4 rounded-full border border-white/20 hover:border-white/60 transition-colors"
                        style={{ backgroundColor: t === 'dark' ? '#1a1a1e' : t === 'forest' ? '#2d5a27' : '#8b8b8b' }}
                      />
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
