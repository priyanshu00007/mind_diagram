import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileIcon,
  FolderIcon,
  PencilIcon,
  Trash2Icon,
  CopyIcon,
  PlusIcon,
  FolderPlusIcon,
  FilePlusIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from 'lucide-react';

export interface ContextMenuItem {
  label: string;
  icon: typeof FileIcon;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 36 - 16);

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-[100] min-w-[180px] bg-brand-sidebar border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden"
        style={{ left: adjustedX, top: adjustedY }}
      >
        {items.map((item, i) =>
          item.divider ? (
            <div key={i} className="border-t border-white/10 my-1" />
          ) : (
            <button
              key={i}
              onClick={() => { item.onClick(); onClose(); }}
              disabled={item.disabled}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                item.danger
                  ? 'text-rose-400 hover:bg-rose-500/10'
                  : item.disabled
                  ? 'text-white/20 cursor-not-allowed'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </button>
          )
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function useContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  const show = (e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  const hide = () => setMenu(null);

  return { menu, show, hide };
}

import { useState } from 'react';
