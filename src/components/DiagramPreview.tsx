import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import {
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
  FileImageIcon,
  FileCodeIcon,
  Maximize2Icon,
  Minimize2Icon,
  CopyIcon,
  CheckIcon,
  ClipboardIcon,
  XIcon,
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { motion } from 'motion/react';

interface DiagramPreviewProps {
  code: string;
  theme: 'default' | 'forest' | 'dark' | 'neutral' | 'base';
}

export const DiagramPreview: React.FC<DiagramPreviewProps> = ({ code, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(100);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: theme || 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter',
    });
  }, [theme]);

  const centerDiagram = useCallback(() => {
    if (transformRef.current) {
      const instance = transformRef.current;
      // Reset to initial state then center
      instance.resetTransform(0);
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        instance.centerView(undefined, 0);
      });
    }
  }, []);

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
        // Center after render completes
        requestAnimationFrame(() => {
          centerDiagram();
        });
      } catch (err: any) {
        console.error('Mermaid Render Error:', err);
        setError('Syntax Error: Please check your Mermaid code.');
      } finally {
        setIsRendering(false);
      }
    };
    const timer = setTimeout(renderDiagram, 300);
    return () => clearTimeout(timer);
  }, [code, centerDiagram]);

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
        const dataUrl = await htmlToImage.toPng(containerRef.current, { backgroundColor: '#1a1a1e', style: { padding: '40px' } });
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
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
      const dataUrl = await htmlToImage.toPng(containerRef.current, { backgroundColor: '#1a1a1e', style: { padding: '40px' } });
      const link = document.createElement('a');
      link.download = 'diagram.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting PNG:', err);
    }
  };

  const previewContent = (zoomIn: () => void, zoomOut: () => void, resetTransform: () => void) => (
    <>
      {/* Top-right: Copy/Download controls */}
      <div className="absolute top-3 right-3 z-20 flex gap-1.5">
        <div className="flex bg-brand-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-lg">
          <button onClick={() => handleCopy('code')} className="p-2 hover:bg-brand-accent transition-colors text-white/60 hover:text-white border-r border-white/5" title="Copy Code">
            {copied === 'code' ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardIcon className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => handleCopy('svg')} className="p-2 hover:bg-brand-accent transition-colors text-white/60 hover:text-white border-r border-white/5" title="Copy SVG">
            {copied === 'svg' ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
          </button>
          <button onClick={downloadPNG} className="p-2 hover:bg-brand-accent transition-colors text-white/60 hover:text-white border-r border-white/5" title="Download PNG">
            <FileImageIcon className="w-3.5 h-3.5" />
          </button>
          <button onClick={downloadSVG} className="p-2 hover:bg-brand-accent transition-colors text-white/60 hover:text-white" title="Download SVG">
            <FileCodeIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 bg-brand-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg hover:bg-brand-accent text-white/60 hover:text-white transition-colors shadow-lg" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <Minimize2Icon className="w-3.5 h-3.5" /> : <Maximize2Icon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bottom-right: Zoom controls */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5">
        <button onClick={() => zoomIn()} className="p-2 bg-brand-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg hover:bg-brand-accent text-white/60 hover:text-white transition-colors shadow-lg" title="Zoom In">
          <ZoomInIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => zoomOut()} className="p-2 bg-brand-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg hover:bg-brand-accent text-white/60 hover:text-white transition-colors shadow-lg" title="Zoom Out">
          <ZoomOutIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => { resetTransform(); centerDiagram(); }} className="p-2 bg-brand-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg hover:bg-brand-accent text-white/60 hover:text-white transition-colors shadow-lg" title="Reset View">
          <RotateCcwIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom-left: Zoom level */}
      <div className="absolute bottom-3 left-3 z-20">
        <div className="px-2 py-1 bg-brand-sidebar/90 backdrop-blur-md border border-white/10 rounded-md text-[10px] text-white/40 font-mono shadow-lg">
          {scale}%
        </div>
      </div>

      <TransformComponent
        wrapperStyle={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
        contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div ref={containerRef} className={`p-8 sm:p-12 transition-opacity duration-300 export-target ${isRendering ? 'opacity-30' : 'opacity-100'}`} />
      </TransformComponent>
    </>
  );

  const handleZoomChange = (state: any) => {
    setScale(Math.round(state.state.scale * 100));
  };

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-[#1a1a1e] flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-brand-bg/80 backdrop-blur-md shrink-0">
          <span className="text-xs font-medium text-white/60">Diagram Preview</span>
          <button onClick={() => setIsFullscreen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 relative">
          <TransformWrapper
            initialScale={1.5}
            minScale={0.1}
            maxScale={10}
            centerOnInit
            limitToBounds={false}
            wheel={{ step: 0.1 }}
            onZoom={handleZoomChange}
            ref={transformRef}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <div className="w-full h-full">
                {previewContent(zoomIn, zoomOut, resetTransform)}
              </div>
            )}
          </TransformWrapper>
        </div>
      </motion.div>
    );
  }

  // Normal mode
  return (
    <div className="h-full w-full flex flex-col bg-[#1a1a1e] overflow-hidden relative group mermaid-preview">
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <TransformWrapper
          initialScale={1.5}
          minScale={0.1}
          maxScale={10}
          centerOnInit
          limitToBounds={false}
          wheel={{ step: 0.1 }}
          onZoom={handleZoomChange}
          ref={transformRef}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <div className="w-full h-full">
              {previewContent(zoomIn, zoomOut, resetTransform)}
            </div>
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
