import React from 'react';
import { PaletteIcon } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ThemeSelector: React.FC = () => {
  const { activeDiagramId, diagrams, updateDiagram } = useStore();
  const activeDiagram = diagrams.find(d => d.id === activeDiagramId);
  const [isOpen, setIsOpen] = React.useState(false);

  if (!activeDiagram) return null;

  const themes: Array<'default' | 'forest' | 'dark' | 'neutral' | 'base'> = [
    'default', 'forest', 'dark', 'neutral', 'base'
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg text-xs font-medium text-white/60 transition-colors"
      >
        <PaletteIcon className="w-3.5 h-3.5" />
        Theme: <span className="text-brand-accent capitalize">{activeDiagram.mermaidTheme}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-40 bg-brand-sidebar border border-white/10 rounded-xl shadow-2xl z-20 py-2 overflow-hidden">
            {themes.map(t => (
              <button
                key={t}
                onClick={() => {
                  updateDiagram(activeDiagram.id, { mermaidTheme: t });
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs capitalize transition-colors ${
                  activeDiagram.mermaidTheme === t 
                    ? 'bg-brand-accent/20 text-brand-accent' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
