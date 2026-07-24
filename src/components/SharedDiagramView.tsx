import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, Edit3Icon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DiagramPreview } from './DiagramPreview';

export const SharedDiagramView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const diagram = useStore((s) => s.diagrams.find((d) => d.id === id));
  const setActiveDiagram = useStore((s) => s.setActiveDiagram);

  if (!diagram) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1a1a1e]">
        <div className="text-center max-w-md p-8">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-semibold text-white/80 mb-2">Diagram Not Found</h2>
          <p className="text-white/40 text-sm mb-6">
            This shared diagram could not be found. It may have been deleted, or the link may be invalid.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent/80 text-white transition-colors text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1a1a1e]">
      {/* Nav bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-brand-bg/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
            title="Back to Home"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-medium text-white/80">{diagram.name}</h1>
            <p className="text-[10px] text-white/30">Shared diagram</p>
          </div>
        </div>
        <button
          onClick={() => {
            setActiveDiagram(diagram.id);
            navigate('/editor');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-accent hover:bg-brand-accent/80 text-white transition-colors text-xs"
        >
          <Edit3Icon className="w-3.5 h-3.5" />
          Open in Editor
        </button>
      </div>

      {/* Diagram preview */}
      <div className="flex-1 relative">
        <DiagramPreview
          code={diagram.mermaidCode}
          theme={diagram.mermaidTheme || 'dark'}
        />
      </div>
    </div>
  );
};
