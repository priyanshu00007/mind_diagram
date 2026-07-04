import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { 
  ZoomInIcon, 
  ZoomOutIcon, 
  RotateCcwIcon, 
  DownloadIcon, 
  FileImageIcon, 
  FileCodeIcon, 
  Maximize2Icon,
  CopyIcon,
  CheckIcon,
  ClipboardIcon
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface DiagramPreviewProps {
  code: string;
  theme: 'default' | 'forest' | 'dark' | 'neutral' | 'base';
}

export const DiagramPreview: React.FC<DiagramPreviewProps> = ({ code, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: theme || 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter',
    });
  }, [theme]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !code) return;

      try {
        setIsRendering(true);
        setError(null);
        containerRef.current.innerHTML = '';
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        containerRef.current.innerHTML = svg;
      } catch (err: any) {
        console.error('Mermaid Render Error:', err);
        setError('Syntax Error: Please check your Mermaid code.');
      } finally {
        setIsRendering(false);
      }
    };

    const timer = setTimeout(renderDiagram, 300);
    return () => clearTimeout(timer);
  }, [code]);

  const handleCopy = async (type: 'svg' | 'png' | 'code') => {
    if (!containerRef.current) return;

    try {
      if (type === 'code') {
        await navigator.clipboard.writeText(code);
      } else if (type === 'svg') {
        const svg = containerRef.current.querySelector('svg');
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          await navigator.clipboard.writeText(svgData);
        }
      } else if (type === 'png') {
        const dataUrl = await htmlToImage.toPng(containerRef.current, {
          backgroundColor: '#1a1a1e',
          style: { padding: '40px' }
        });
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
      }
      
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const downloadSVG = () => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPNG = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(containerRef.current, {
        backgroundColor: '#1a1a1e',
        style: {
          padding: '40px',
        }
      });
      const link = document.createElement('a');
      link.download = 'diagram.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting PNG:', err);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1a1a1e] overflow-hidden relative group mermaid-preview">
      <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex bg-brand-sidebar/80 backdrop-blur border border-white/10 rounded-lg overflow-hidden">
          <button 
            onClick={() => handleCopy('code')}
            className="p-2 hover:bg-brand-accent transition-colors text-white/60 hover:text-white border-r border-white/5" 
            title="Copy Mermaid Code"
          >
            {copied === 'code' ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <ClipboardIcon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => handleCopy('svg')}
            className="p-2 hover:bg-brand-accent transition-colors text-white/60 hover:text-white border-r border-white/5" 
            title="Copy SVG to Clipboard"
          >
            {copied === 'svg' ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
          </button>
          <button 
            onClick={downloadPNG}
            className="p-2 hover:bg-brand-accent transition-colors text-white/60 hover:text-white border-r border-white/5" 
            title="Download PNG"
          >
            <FileImageIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={downloadSVG}
            className="p-2 hover:bg-brand-accent transition-colors text-white/60 hover:text-white" 
            title="Download SVG"
          >
            <FileCodeIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          centerOnInit
          limitToBounds={false}
          wheel={{ step: 0.1 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => zoomIn()} className="p-2 bg-brand-sidebar/80 backdrop-blur border border-white/10 rounded-lg hover:bg-brand-accent text-white/60 hover:text-white transition-colors" title="Zoom In">
                  <ZoomInIcon className="w-4 h-4" />
                </button>
                <button onClick={() => zoomOut()} className="p-2 bg-brand-sidebar/80 backdrop-blur border border-white/10 rounded-lg hover:bg-brand-accent text-white/60 hover:text-white transition-colors" title="Zoom Out">
                  <ZoomOutIcon className="w-4 h-4" />
                </button>
                <button onClick={() => resetTransform()} className="p-2 bg-brand-sidebar/80 backdrop-blur border border-white/10 rounded-lg hover:bg-brand-accent text-white/60 hover:text-white transition-colors" title="Reset View">
                  <Maximize2Icon className="w-4 h-4" />
                </button>
              </div>
              
              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'transparent',
                }}
                contentStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div 
                  ref={containerRef} 
                  className={`p-12 transition-opacity duration-300 export-target ${isRendering ? 'opacity-30' : 'opacity-100'}`}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-xs backdrop-blur-sm z-20 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[10px] uppercase font-bold hover:text-white transition-colors">Dismiss</button>
        </div>
      )}
    </div>
  );
};
