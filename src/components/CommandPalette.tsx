import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import {
  SearchIcon,
  FileIcon,
  FolderIcon,
  PlusIcon,
  Code2Icon,
  Trash2Icon,
  ArrowRightIcon,
  SparklesIcon,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  label: string;
  icon: typeof FileIcon;
  action: () => void;
  category: string;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { diagrams, folders, addDiagram, setActiveDiagram, deleteDiagram } = useStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const commands: Command[] = useMemo(() => {
    const cmds: Command[] = [
      { id: 'new', label: 'New Diagram', icon: PlusIcon, action: () => { addDiagram('Untitled Diagram'); navigate('/editor'); onClose(); }, category: 'Actions' },
      { id: 'editor', label: 'Open Editor', icon: Code2Icon, action: () => { navigate('/editor'); onClose(); }, category: 'Navigation' },
      { id: 'home', label: 'Go to Home', icon: PlusIcon, action: () => { navigate('/'); onClose(); }, category: 'Navigation' },
    ];

    diagrams.forEach((d) => {
      cmds.push({
        id: `diagram-${d.id}`,
        label: d.name,
        icon: FileIcon,
        action: () => { setActiveDiagram(d.id); navigate('/editor'); onClose(); },
        category: 'Diagrams',
      });
    });

    folders.forEach((f) => {
      cmds.push({
        id: `folder-${f.id}`,
        label: f.name,
        icon: FolderIcon,
        action: () => { navigate('/'); onClose(); },
        category: 'Folders',
      });
    });

    return cmds;
  }, [diagrams, folders, addDiagram, setActiveDiagram, navigate, onClose]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      filtered[selected].action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    filtered.forEach((c) => {
      if (!map.has(c.category)) map.set(c.category, []);
      map.get(c.category)!.push(c);
    });
    return map;
  }, [filtered]);

  let globalIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[151] w-full max-w-lg"
          >
            <div className="bg-brand-sidebar border border-white/10 rounded-2xl shadow-2xl overflow-hidden mx-4">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <SearchIcon className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search commands, diagrams, folders..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-white/20 bg-white/5 rounded border border-white/10">ESC</kbd>
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-white/30">No results found</p>
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([category, items]) => (
                    <div key={category}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 px-2 py-1.5">{category}</p>
                      {items.map((cmd) => {
                        globalIndex++;
                        const idx = globalIndex;
                        return (
                          <button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelected(idx)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                              selected === idx ? 'bg-brand-accent/10 text-brand-accent' : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <cmd.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="flex-1 text-left truncate">{cmd.label}</span>
                            <ArrowRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-[10px] text-white/20">
                <div className="flex items-center gap-3">
                  <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
                  <span><kbd className="font-mono">↵</kbd> Select</span>
                </div>
                <span><kbd className="font-mono">ESC</kbd> Close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
