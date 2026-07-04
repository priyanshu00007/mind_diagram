import React from 'react';
import { templates } from '../data/templates';
import { useStore } from '../store/useStore';
import { LayoutDashboardIcon, FileIcon } from 'lucide-react';

export const TemplatesLibrary: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addDiagram } = useStore();

  const handleSelect = (template: typeof templates[0]) => {
    const id = addDiagram(template.name);
    // The store should handle setting the code, but addDiagram currently uses a default.
    // I should probably update addDiagram to accept optional initial code or update it after.
    const { updateDiagram } = useStore.getState();
    updateDiagram(id, { mermaidCode: template.code, description: template.description });
    onClose();
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <div className="flex flex-col h-full bg-brand-bg text-white p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <LayoutDashboardIcon className="w-5 h-5 text-brand-accent" />
          Diagram Templates
        </h2>
        <button onClick={onClose} className="text-white/40 hover:text-white text-sm">Close</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        {categories.map(category => (
          <div key={category} className="space-y-4">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest">{category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.filter(t => t.category === category).map(template => (
                <button
                  key={template.name}
                  onClick={() => handleSelect(template)}
                  className="group relative flex flex-col items-start text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:border-brand-accent/50 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-brand-accent/20 rounded-lg text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-colors">
                      <FileIcon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">{template.name}</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
