import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { WelcomeScreen } from './components/WelcomeScreen';
import DiagramEditorView from './components/DiagramEditorView';
import { CommandPalette } from './components/CommandPalette';
import { useStore } from './store/useStore';

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

export function AppShell() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const addDiagram = useStore((s) => s.addDiagram);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Ctrl+K — Command Palette
      if (mod && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }

      // Ctrl+N — New Diagram
      if (mod && e.key === 'n') {
        e.preventDefault();
        addDiagram('Untitled Diagram');
        navigate('/editor');
      }

      // Escape — Close palette
      if (e.key === 'Escape' && cmdOpen) {
        setCmdOpen(false);
      }
    };

    const handleOpenPalette = () => setCmdOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenPalette);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenPalette);
    };
  }, [cmdOpen, addDiagram, navigate]);

  return (
    <>
      <Routes location={location}>
        <Route path="/" element={<PageTransition><WelcomeScreen /></PageTransition>} />
        <Route path="/editor" element={<PageTransition><DiagramEditorView /></PageTransition>} />
      </Routes>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
