import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';
import { DiagramEditor } from './Editor';
import { DiagramPreview } from './DiagramPreview';
import { AICommandBar } from './AICommandBar';
import { AIChat } from './AIChat';
import { VersionHistory } from './VersionHistory';
import { TemplatesLibrary } from './TemplatesLibrary';
import { ViewMode } from '../types';
import { useCollaboration } from '../hooks/useCollaboration';
import { motion, AnimatePresence } from 'motion/react';

export default function DiagramEditorView() {
  const navigate = useNavigate();
  const { activeDiagramId, diagrams, updateDiagram, saveVersion, isSyncing } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  const { broadcastUpdate } = useCollaboration(activeDiagramId);
  const [localCode, setLocalCode] = useState('');
  const activeDiagram = diagrams.find((d) => d.id === activeDiagramId);

  useEffect(() => {
    const ad = diagrams.find(d => d.id === activeDiagramId);
    if (ad && localCode !== ad.mermaidCode) setLocalCode(ad.mermaidCode);
  }, [activeDiagramId]);

  useEffect(() => {
    if (!activeDiagramId || !localCode) return;
    const ad = diagrams.find(d => d.id === activeDiagramId);
    if (ad?.mermaidCode === localCode) return;
    useStore.setState({ isSyncing: true });
    const timer = setTimeout(() => {
      updateDiagram(activeDiagramId, { mermaidCode: localCode });
      setLastSaved(new Date());
      useStore.setState({ isSyncing: false });
    }, 800);
    return () => clearTimeout(timer);
  }, [localCode, activeDiagramId, updateDiagram]);

  useEffect(() => {
    if (!activeDiagramId) return;
    const interval = setInterval(() => {
      const d = useStore.getState().diagrams.find(dd => dd.id === activeDiagramId);
      if (!d) return;
      const versions = d.versions || [];
      const lastVersion = versions[versions.length - 1];
      if (!lastVersion || lastVersion.code !== d.mermaidCode) {
        saveVersion(activeDiagramId, 'Autosave');
        setLastSaved(new Date());
      }
    }, 120000);
    return () => clearInterval(interval);
  }, [activeDiagramId, saveVersion]);

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setLocalCode(value);
      broadcastUpdate(value);
    }
  };

  useEffect(() => {
    if (!activeDiagramId || !activeDiagram) {
      navigate('/', { replace: true });
    }
  }, [activeDiagramId, activeDiagram, navigate]);

  if (!activeDiagramId || !activeDiagram) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-brand-bg">
        <div className="w-6 h-6 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-white">
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            className="fixed left-0 top-0 bottom-0 z-40 lg:relative lg:z-auto"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            <div className="relative z-10 h-full">
              <Sidebar viewMode={viewMode} setViewMode={setViewMode} onClose={() => setIsSidebarOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <Toolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenTemplates={() => setShowTemplates(true)}
          onOpenHistory={() => setShowHistory(!showHistory)}
          onToggleAIChat={() => setShowAIChat(!showAIChat)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isHistoryOpen={showHistory}
        />

        <div className="flex-1 flex overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4">
          <div className="flex-1 flex flex-col gap-2 sm:gap-4 overflow-hidden">
            <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 overflow-hidden">
              {viewMode === 'editor' && (
                <>
                  <section className="w-full lg:w-5/12 h-1/2 lg:h-full flex flex-col border border-white/10 bg-brand-sidebar rounded-2xl overflow-hidden shadow-2xl">
                    <div className="h-8 sm:h-10 border-b border-white/5 flex items-center px-3 sm:px-4 justify-between bg-white/[0.02]">
                      <span className="text-[9px] sm:text-[10px] font-mono text-white/30 uppercase tracking-widest font-bold">mermaid.code</span>
                      <div className="flex gap-1 sm:gap-1.5">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500/30 border border-rose-500/50" />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500/30 border border-amber-500/50" />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <DiagramEditor code={localCode} onChange={handleCodeChange} />
                    </div>
                  </section>
                  <section className="w-full lg:w-7/12 h-1/2 lg:h-full border border-white/10 bg-brand-card rounded-2xl overflow-hidden shadow-2xl relative">
                    <DiagramPreview code={localCode} theme={activeDiagram.mermaidTheme || 'dark'} />
                  </section>
                </>
              )}

              {viewMode === 'preview' && (
                <section className="flex-1 border border-white/10 bg-brand-card rounded-2xl overflow-hidden shadow-2xl relative">
                  <DiagramPreview code={localCode} theme={activeDiagram.mermaidTheme || 'dark'} />
                </section>
              )}
            </div>

            <AICommandBar />
          </div>

          {showAIChat && (
            <>
              <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setShowAIChat(false)} />
              <div className="fixed right-0 top-0 bottom-0 z-40 w-full sm:w-80 lg:relative lg:inset-auto lg:z-auto lg:flex lg:h-full lg:border-l lg:border-white/10">
                <AIChat onClose={() => setShowAIChat(false)} />
              </div>
            </>
          )}

          {showHistory && (
            <>
              <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setShowHistory(false)} />
              <div className="fixed right-0 top-0 bottom-0 z-40 w-full sm:w-80 lg:relative lg:inset-auto lg:z-auto lg:flex lg:h-full lg:border-l lg:border-white/10">
                <VersionHistory onClose={() => setShowHistory(false)} />
              </div>
            </>
          )}
        </div>

        {showTemplates && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-8 bg-black/80 backdrop-blur-sm">
            <div className="bg-brand-bg border border-white/10 rounded-3xl w-full max-w-4xl h-[90vh] sm:h-[80vh] shadow-2xl overflow-hidden relative">
              <TemplatesLibrary onClose={() => setShowTemplates(false)} />
            </div>
          </div>
        )}

        <footer className="hidden sm:flex h-10 border-t border-white/10 bg-brand-bg items-center px-4 gap-3 overflow-hidden shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className={`text-[10px] font-medium ${isSyncing ? 'text-amber-400/80' : 'text-emerald-400/80'}`}>
            {isSyncing ? 'Syncing...' : `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </footer>
      </main>
    </div>
  );
}
