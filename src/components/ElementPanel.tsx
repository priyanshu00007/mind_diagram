import React from 'react';
import { XIcon, CopyIcon, Trash2Icon, FileTextIcon, ArrowRightIcon, SquareIcon, CircleIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion } from 'motion/react';

export interface SelectedElement {
  id: string;
  type: 'node' | 'edge' | 'subgraph';
  label: string;
  shape?: string;
  details?: Record<string, string>;
  /** The Mermaid syntax identifier (e.g. `A` for a node) used to map back to code */
  codeId?: string;
}

interface ElementPanelProps {
  element: SelectedElement | null;
  onClose: () => void;
  onCopyId: () => void;
  onDelete: () => void;
}

const shapeIcons: Record<string, React.ReactNode> = {
  rectangle: <SquareIcon className="w-4 h-4" />,
  rounded: <SquareIcon className="w-4 h-4 rounded-md" />,
  circle: <CircleIcon className="w-4 h-4" />,
  diamond: <div className="w-4 h-4 rotate-45 border-2 border-current" />,
  default: <FileTextIcon className="w-4 h-4" />,
};

export const ElementPanel: React.FC<ElementPanelProps> = ({ element, onClose, onCopyId, onDelete }) => {
  const { activeDiagramId, updateDiagram, diagrams } = useStore();
  const activeDiagram = diagrams.find(d => d.id === activeDiagramId);

  if (!element) return null;

  const handleLabelChange = (newLabel: string) => {
    if (!activeDiagramId || !activeDiagram) return;
    const code = activeDiagram.mermaidCode;

    if (element.type === 'node' && element.codeId) {
      // Replace the label inside the brackets for the node's mermaid id
      const regex = new RegExp(`(${element.codeId}\\[)[^\\]]*(\\])`, 'g');
      const newCode = code.replace(regex, `$1${newLabel}$2`);
      if (newCode !== code) updateDiagram(activeDiagramId, { mermaidCode: newCode });
    } else if (element.type === 'edge') {
      // For edges, update the label between -->
      const lines = code.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(element.id) || (lines[i].includes('-->') && lines[i].includes(element.label))) {
          lines[i] = lines[i].replace(element.label, newLabel);
          break;
        }
      }
      updateDiagram(activeDiagramId, { mermaidCode: lines.join('\n') });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-64 bg-[#0f0f12] border-l border-white/[0.06] h-full flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              element.type === 'node' ? 'bg-blue-500/10 text-blue-400' :
              element.type === 'edge' ? 'bg-emerald-500/10 text-emerald-400' :
              'bg-amber-500/10 text-amber-400'
            }`}>
              {element.type === 'node' && (shapeIcons[element.shape || 'default'] || shapeIcons.default)}
              {element.type === 'edge' && <ArrowRightIcon className="w-4 h-4" />}
              {element.type === 'subgraph' && <FileTextIcon className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-white capitalize">{element.type}</h3>
              <p className="text-[10px] text-white/30 font-mono">{element.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 block mb-2">Label</label>
          <input
            type="text"
            defaultValue={element.label}
            onBlur={(e) => handleLabelChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLabelChange(e.currentTarget.value); }}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-accent/30 transition-colors"
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 block mb-2">Type</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg">
            <span className={`w-2 h-2 rounded-full ${
              element.type === 'node' ? 'bg-blue-400' :
              element.type === 'edge' ? 'bg-emerald-400' : 'bg-amber-400'
            }`} />
            <span className="text-xs text-white/60 capitalize">{element.type}</span>
            {element.shape && (
              <span className="text-[10px] text-white/30 ml-auto capitalize">{element.shape}</span>
            )}
          </div>
        </div>

        {/* Details */}
        {element.details && Object.keys(element.details).length > 0 && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 block mb-2">Details</label>
            <div className="space-y-2">
              {Object.entries(element.details).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                  <span className="text-[10px] text-white/30 uppercase">{key}</span>
                  <span className="text-xs text-white/60 font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 block mb-2">Actions</label>
          <div className="space-y-1">
            <button
              onClick={onCopyId}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <CopyIcon className="w-3.5 h-3.5" />
              Copy ID to clipboard
            </button>
            <button
              onClick={onDelete}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
            >
              <Trash2Icon className="w-3.5 h-3.5" />
              Delete element
            </button>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-white/[0.06]">
        <p className="text-[10px] text-white/20 text-center">
          Press <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-white/30">V</kbd> to toggle select mode
        </p>
      </div>
    </motion.div>
  );
};
