import React from 'react';
import { SparklesIcon, SendIcon, Loader2Icon } from 'lucide-react';
import { useStore } from '../store/useStore';

export const AICommandBar: React.FC = () => {
  const [prompt, setPrompt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { activeDiagramId, updateDiagram } = useStore();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading || !activeDiagramId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'auto-detect' }),
      });

      const data = await response.json();
      if (data.mermaid) {
        updateDiagram(activeDiagramId, { mermaidCode: data.mermaid });
        setPrompt('');
      } else if (data.error) {
        alert(`AI Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Generation failed:', err);
      alert('Failed to connect to AI service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-white/10 bg-brand-sidebar/50 p-4">
      <form onSubmit={handleGenerate} className="max-w-4xl mx-auto flex gap-3">
        <div className="relative flex-1">
          <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent animate-pulse" />
          <input 
            type="text" 
            placeholder="AI Diagram Assistant: describe your architecture..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-brand-accent/50 transition-all placeholder:text-white/20 text-white"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit"
          disabled={isLoading || !prompt.trim() || !activeDiagramId}
          className="bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-30 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-brand-accent/20"
        >
          {isLoading ? (
            <Loader2Icon className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Generate
              <SendIcon className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
