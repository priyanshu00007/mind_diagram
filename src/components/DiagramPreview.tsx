import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import {
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
  FileImageIcon,
  FileCodeIcon,
  FileTextIcon,
  Maximize2Icon,
  Minimize2Icon,
  CopyIcon,
  CheckIcon,
  ClipboardIcon,
  XIcon,
  DownloadIcon,
  ChevronDownIcon,
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { motion } from 'motion/react';

// ---------- Diagram editing helpers (drag nodes, keep edges connected) ----------

type Connector = {
  el: SVGGraphicsElement;
  isLine: boolean;
  type: 'edge' | 'lifeline';
  labelEl: SVGGraphicsElement | null;
};

function parsePathPoints(d: string): number[][] {
  const re = /([MLCQZTASmlcqzta])([^MLCQZTASmlcqzta]*)/g;
  let m: RegExpExecArray | null;
  const pts: number[][] = [];
  while ((m = re.exec(d))) {
    const cmd = m[1].toUpperCase();
    const nums = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === 'M' || cmd === 'L' || cmd === 'C' || cmd === 'Q' || cmd === 'T' || cmd === 'S') {
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
    } else if (cmd === 'H') {
      nums.forEach((x) => pts.push([x, 0]));
    } else if (cmd === 'V') {
      nums.forEach((y) => pts.push([0, y]));
    }
  }
  return pts;
}

function shiftPathEnds(d: string, dsx: number, dsy: number, dex: number, dey: number): string {
  const re = /([MLHVCQTSZAmlhvcqtsza])([^MLHVCQTSZAmlhvcqtsza]*)/g;
  let m: RegExpExecArray | null;
  let out = '';
  let first = true;
  while ((m = re.exec(d))) {
    const cmd = m[1];
    const upper = cmd.toUpperCase();
    const nums = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (upper === 'Z') {
      out += cmd + ' ';
      continue;
    }
    if ((upper === 'M' || upper === 'L') && first) {
      if (nums.length >= 2) { nums[0] += dsx; nums[1] += dsy; }
      first = false;
    } else if (upper === 'C' || upper === 'S') {
      if (first) { nums[0] += dsx; nums[1] += dsy; first = false; }
      const n = nums.length;
      nums[n - 4] += dex; nums[n - 3] += dey;
      nums[n - 2] += dex; nums[n - 1] += dey;
    } else if (upper === 'Q' || upper === 'T') {
      if (first) { nums[0] += dsx; nums[1] += dsy; first = false; }
      const n = nums.length;
      nums[n - 4] += dex; nums[n - 3] += dey;
      nums[n - 2] += dex; nums[n - 1] += dey;
    } else if (upper === 'H') {
      nums[nums.length - 1] += dex;
    } else if (upper === 'V') {
      nums[nums.length - 1] += dey;
    }
    out += cmd + (nums.length ? ' ' + nums.join(' ') : '') + ' ';
  }
  return out.trim();
}

interface DiagramPreviewProps {
  code: string;
  theme: 'default' | 'forest' | 'dark' | 'neutral' | 'base';
  isSelectMode?: boolean;
  onElementSelect?: (element: { id: string; type: 'node' | 'edge' | 'subgraph'; label: string; shape?: string; details?: Record<string, string>; codeId?: string } | null) => void;
  selectedElementId?: string | null;
}

export const DiagramPreview: React.FC<DiagramPreviewProps> = ({ code, theme, isSelectMode, onElementSelect, selectedElementId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportTheme, setExportTheme] = useState<'neutral' | 'dark'>('dark');
  const [exporting, setExporting] = useState(false);
  const [scale, setScale] = useState(100);
  const nodeCentersRef = useRef<Map<string, { x: number; y: number; hw: number; hh: number; tx: number; ty: number; orig: string }>>(new Map());
  const nodeOffsetsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const connectorsRef = useRef<Connector[]>([]);

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
        const id = `mermaid-${Math.random().toString(36).substr(9)}`;
        const { svg } = await mermaid.render(id, code);
        containerRef.current.innerHTML = svg;

        // Add selection + drag handlers if in select mode
        if (isSelectMode && onElementSelect) {
          const svgEl = containerRef.current.querySelector('svg') as SVGSVGElement | null;
          if (svgEl) {
            const style = document.createElement('style');
            style.textContent = `
              .selectable-element { cursor: move; transition: filter 0.15s ease; }
              .selectable-element:hover { filter: brightness(1.25); }
              .selectable-element.selected > * { outline: 2px solid #6366f1; outline-offset: 2px; }
              .selectable-element.selected { filter: brightness(1.15); }
              .selectable-edge { cursor: pointer; }
              .selectable-edge:hover path, .selectable-edge:hover line, .selectable-edge:hover polygon { stroke-width: 3px !important; }
              .selectable-edge.selected path, .selectable-edge.selected line, .selectable-edge.selected polygon { stroke: #6366f1 !important; stroke-width: 3px !important; }
            `;
            svgEl.prepend(style);

            const nodeCenters = nodeCentersRef.current;
            const nodeOffsets = nodeOffsetsRef.current;
            nodeCenters.clear();
            nodeOffsets.clear();
            const connectors = connectorsRef.current;
            connectors.length = 0;

            const nodeGroups = Array.from(svgEl.querySelectorAll('g.node')) as SVGGraphicsElement[];
            nodeGroups.forEach((el) => {
              const id = el.id;
              if (!id) return;
              const m = id.match(/[_-]([A-Za-z0-9_]+)-\d+$/);
              const codeId = m ? m[1] : id;
              const bbox = el.getBBox();
              const tMatch = (el.getAttribute('transform') || '').match(/translate\(([-\d.]+)[ ,]([-\d.]+)\)/);
              const tx = tMatch ? parseFloat(tMatch[1]) : 0;
              const ty = tMatch ? parseFloat(tMatch[2]) : 0;
              nodeCenters.set(codeId, {
                x: bbox.x + bbox.width / 2,
                y: bbox.y + bbox.height / 2,
                hw: bbox.width / 2,
                hh: bbox.height / 2,
                tx, ty,
                orig: el.getAttribute('transform') || '',
              });
              nodeOffsets.set(codeId, { x: 0, y: 0 });
              el.classList.add('selectable-element');
            });

            // Build connectors: edges (paths outside nodes) + lifelines
            svgEl.querySelectorAll('path').forEach((p) => {
              if ((p as SVGElement).closest('g.node')) return;
              const d = p.getAttribute('d') || '';
              if (!d.trim()) return;
              const edgeG = (p as SVGElement).closest('g.edge, g.messageLineGroup');
              const labelEl = (edgeG?.querySelector('.edgeLabel, .messageText') as SVGGraphicsElement) || null;
              connectors.push({ el: p as SVGGraphicsElement, isLine: false, type: 'edge', labelEl });
            });
            svgEl.querySelectorAll('g.lifeline path').forEach((p) => {
              connectors.push({ el: p as SVGGraphicsElement, isLine: false, type: 'lifeline', labelEl: null });
            });

            const updateConnectorsForNode = (codeId: string, dx: number, dy: number) => {
              const center = nodeCenters.get(codeId);
              const off = nodeOffsets.get(codeId) || { x: 0, y: 0 };
              if (!center) return;
              const cx = center.x + center.tx + off.x;
              const cy = center.y + center.ty + off.y;
              const hw = center.hw + 14;
              const hh = center.hh + 14;
              connectors.forEach((conn) => {
                const cel = conn.el;
                let sx = 0, sy = 0, ex = 0, ey = 0;
                if (conn.isLine) {
                  const line = cel as SVGLineElement;
                  sx = +(line.getAttribute('x1') || 0);
                  sy = +(line.getAttribute('y1') || 0);
                  ex = +(line.getAttribute('x2') || 0);
                  ey = +(line.getAttribute('y2') || 0);
                } else {
                  const pts = parsePathPoints(cel.getAttribute('d') || '');
                  if (!pts.length) return;
                  [sx, sy] = pts[0];
                  [ex, ey] = pts[pts.length - 1];
                }
                if (conn.type === 'lifeline') {
                  if (Math.abs(sx - cx) < 30) {
                    cel.setAttribute('d', shiftPathEnds(cel.getAttribute('d') || '', dx, 0, dx, 0));
                  }
                  return;
                }
                const startNear = sx >= cx - hw && sx <= cx + hw && sy >= cy - hh && sy <= cy + hh;
                const endNear = ex >= cx - hw && ex <= cx + hw && ey >= cy - hh && ey <= cy + hh;
                if (!startNear && !endNear) return;
                const dsx = startNear ? dx : 0;
                const dsy = startNear ? dy : 0;
                const dex = endNear ? dx : 0;
                const dey = endNear ? dy : 0;
                if (conn.isLine) {
                  const line = cel as SVGLineElement;
                  if (startNear) { line.setAttribute('x1', String(sx + dx)); line.setAttribute('y1', String(sy + dy)); }
                  if (endNear) { line.setAttribute('x2', String(ex + dx)); line.setAttribute('y2', String(ey + dy)); }
                } else {
                  cel.setAttribute('d', shiftPathEnds(cel.getAttribute('d') || '', dsx, dsy, dex, dey));
                }
                if (conn.labelEl) {
                  const mx = (sx + ex) / 2 + (dsx + dex) / 2;
                  const my = (sy + ey) / 2 + (dsy + dey) / 2;
                  conn.labelEl.setAttribute('transform', `translate(${mx}, ${my})`);
                }
              });
            };

            const codeIdOf = (el: Element) => {
              const id = (el as SVGElement).id;
              const m = id.match(/[_-]([A-Za-z0-9_]+)-\d+$/);
              return m ? m[1] : id;
            };

            const selectNode = (el: Element) => {
              const id = (el as SVGElement).id;
              const label = el.textContent?.trim() || id;
              const shape = el.querySelector('rect') ? 'rectangle' :
                           el.querySelector('circle') ? 'circle' :
                           el.querySelector('polygon') ? 'diamond' :
                           el.querySelector('path') ? 'path' : 'default';
              onElementSelect({
                id,
                type: 'node',
                label: label.substring(0, 50),
                shape,
                codeId: codeIdOf(el),
                details: { 'Element ID': id, 'Mermaid ID': codeIdOf(el), 'Shape': shape },
              });
            };

            let suppressBgClick = false;

            nodeGroups.forEach((el) => {
              let startClientX = 0, startClientY = 0, lastClientX = 0, lastClientY = 0, moved = false;
              const onPointerDown = (e: PointerEvent) => {
                e.stopPropagation();
                (el as any).setPointerCapture?.(e.pointerId);
                moved = false;
                startClientX = lastClientX = e.clientX;
                startClientY = lastClientY = e.clientY;
                const codeId = codeIdOf(el);
                const onMove = (ev: PointerEvent) => {
                  if (Math.abs(ev.clientX - startClientX) > 3 || Math.abs(ev.clientY - startClientY) > 3) moved = true;
                  const ctm = svgEl.getScreenCTM();
                  if (!ctm) return;
                  const inv = ctm.inverse();
                  const p1 = new DOMPoint(lastClientX, lastClientY).matrixTransform(inv);
                  const p2 = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(inv);
                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  if (dx === 0 && dy === 0) return;
                  lastClientX = ev.clientX;
                  lastClientY = ev.clientY;
                  const off = nodeOffsets.get(codeId) || { x: 0, y: 0 };
                  off.x += dx;
                  off.y += dy;
                  nodeOffsets.set(codeId, off);
                  const center = nodeCenters.get(codeId);
                  el.setAttribute('transform', `${center?.orig || ''} translate(${off.x}, ${off.y})`);
                  updateConnectorsForNode(codeId, dx, dy);
                };
                const onUp = () => {
                  window.removeEventListener('pointermove', onMove);
                  window.removeEventListener('pointerup', onUp);
                  suppressBgClick = moved;
                  selectNode(el);
                };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
              };
              el.addEventListener('pointerdown', onPointerDown);
            });

            // Mermaid renders edges as <g class="edge ..."> (or [class*="edge"])
            const edgeGroups = svgEl.querySelectorAll('g.edge, g[class*="edge"]');
            edgeGroups.forEach((el, idx) => {
              el.classList.add('selectable-edge');
              el.addEventListener('click', (e) => {
                e.stopPropagation();
                const labelEl = el.querySelector('.edgeLabel, .edgeLabel p');
                const label = labelEl?.textContent?.trim() || `Edge ${idx + 1}`;
                const edgeId = (el as SVGElement).id || `edge-${idx}`;
                onElementSelect({
                  id: edgeId,
                  type: 'edge',
                  label,
                  details: { 'Connection': label, 'Edge Index': String(idx + 1) },
                });
              });
            });

            // Click on background to deselect
            svgEl.addEventListener('click', () => {
              if (suppressBgClick) { suppressBgClick = false; return; }
              onElementSelect(null);
            });
          }
        }

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
    const isEmpty = containerRef.current && !containerRef.current.querySelector('svg');
    const timer = setTimeout(renderDiagram, isEmpty ? 0 : 300);
    return () => clearTimeout(timer);
  }, [code, centerDiagram, isSelectMode, onElementSelect, isFullscreen]);

  // Reactively apply/remove the `.selected` class when the selected element changes
  useEffect(() => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;
    svgEl.querySelectorAll('.selectable-element, .selectable-edge').forEach((el) => {
      el.classList.remove('selected');
    });
    if (selectedElementId) {
      const selected = svgEl.querySelector(`#${CSS.escape(selectedElementId)}`);
      if (selected) selected.classList.add('selected');
    }
  }, [selectedElementId, code]);

  /** Render a themed offscreen SVG and return it plus bgColor */
  const renderExport = useCallback(async (targetTheme: 'neutral' | 'dark'): Promise<{ svgString: string; bgColor: string } | null> => {
    const offscreen = document.createElement('div');
    offscreen.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;overflow:visible;background:transparent;';
    document.body.appendChild(offscreen);

    try {
      const savedTheme = theme;
      await mermaid.initialize({ startOnLoad: false, theme: targetTheme, securityLevel: 'loose', fontFamily: 'Inter' });

      const id = `mermaid-export-${Date.now()}`;
      const { svg } = await mermaid.render(id, code, offscreen);
      offscreen.innerHTML = svg;

      const svgEl = offscreen.querySelector('svg');
      if (!svgEl) { await mermaid.initialize({ startOnLoad: false, theme: savedTheme, securityLevel: 'loose', fontFamily: 'Inter' }); return null; }

      // Ensure proper xmlns for standalone SVG
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgEl.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

      const isDark = targetTheme === 'dark';
      const bgColor = isDark ? '#1a1a1e' : '#ffffff';

      // Add background rect for dark exports (neutral/light gets transparent bg)
      if (isDark) {
        const vb = (svgEl.getAttribute('viewBox') || '0 0 800 600').split(/\s+/).map(Number);
        const vbX = vb[0] ?? 0;
        const vbY = vb[1] ?? 0;
        const vbW = vb[2] ?? 800;
        const vbH = vb[3] ?? 600;
        const pad = Math.max(vbW, vbH) * 0.08;
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', String(vbX - pad));
        bg.setAttribute('y', String(vbY - pad));
        bg.setAttribute('width', String(vbW + pad * 2));
        bg.setAttribute('height', String(vbH + pad * 2));
        bg.setAttribute('fill', '#1a1a1e');
        bg.setAttribute('rx', '10');
        svgEl.insertBefore(bg, svgEl.firstChild);
      }

      const svgString = new XMLSerializer().serializeToString(svgEl);
      await mermaid.initialize({ startOnLoad: false, theme: savedTheme, securityLevel: 'loose', fontFamily: 'Inter' });
      return { svgString, bgColor };
    } catch (e) {
      console.error('Export render failed:', e);
      await mermaid.initialize({ startOnLoad: false, theme, securityLevel: 'loose', fontFamily: 'Inter' });
      return null;
    } finally {
      document.body.removeChild(offscreen);
    }
  }, [theme, code]);

  /** Capture a high-res PNG of the themed export */
  const captureThemedPNG = useCallback(async (pixelRatio = 5): Promise<string | null> => {
    const result = await renderExport(exportTheme);
    if (!result) return null;

    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:fixed;left:-9999px;top:0;display:inline-block;';
    tempDiv.innerHTML = result.svgString;
    document.body.appendChild(tempDiv);
    try {
      const dataUrl = await htmlToImage.toPng(tempDiv, {
        backgroundColor: result.bgColor,
        pixelRatio,
        style: { padding: '0' },
      });
      return dataUrl;
    } finally {
      document.body.removeChild(tempDiv);
    }
  }, [renderExport, exportTheme]);

  /** Copy a themed SVG to clipboard */
  const copyThemedSVG = useCallback(async (): Promise<void> => {
    const result = await renderExport(exportTheme);
    if (!result?.svgString) return;
    const fullSVG = '<?xml version="1.0" encoding="UTF-8"?>\n' + result.svgString;
    await navigator.clipboard.writeText(fullSVG);
  }, [renderExport, exportTheme]);

  /** Download a themed SVG file */
  const downloadThemedSVG = useCallback(async (): Promise<void> => {
    const result = await renderExport(exportTheme);
    if (!result?.svgString) return;
    const fullSVG = '<?xml version="1.0" encoding="UTF-8"?>\n' + result.svgString;
    const blob = new Blob([fullSVG], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [renderExport, exportTheme]);

  const handleCopy = async (type: 'svg' | 'png' | 'code') => {
    try {
      if (type === 'code') {
        await navigator.clipboard.writeText(code);
      } else if (type === 'svg') {
        await copyThemedSVG();
      } else if (type === 'png') {
        const dataUrl = await captureThemedPNG(5);
        if (!dataUrl) return;
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

  const downloadSVG = () => { downloadThemedSVG(); };

  const downloadPNG = async () => {
    try {
      const dataUrl = await captureThemedPNG(5);
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.download = 'diagram.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting PNG:', err);
    }
  };

  const downloadPDF = async () => {
    const rawName = code.split('\n')[0]?.replace(/^(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|stateDiagram|gantt|pie|journey|gitGraph|mindmap|quadrantChart|xychart|summary)\s*/i, '').trim() || 'diagram';
    const name = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'diagram';
    setExporting(true);
    try {
      const dataUrl = await captureThemedPNG(6);
      if (!dataUrl) return;
      const { jsPDF } = await import('jspdf');
      const imgProps = jsPDF.prototype.getImageProperties ? undefined : null;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a3' });
      const imgW = pdf.internal.pageSize.getWidth();
      const imgH = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const drawW = imgW - margin * 2;
      // Get natural image dimensions via Image
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });
      const imgRatio = img.width / img.height;
      const pageRatio = drawW / (imgH - margin * 2);
      let w: number, h: number;
      if (imgRatio > pageRatio) {
        w = drawW; h = w / imgRatio;
      } else {
        h = imgH - margin * 2; w = h * imgRatio;
      }
      pdf.addImage(dataUrl, 'PNG', (imgW - w) / 2, (imgH - h) / 2, w, h);
      pdf.save(`${name}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  const previewContent = (zoomIn: () => void, zoomOut: () => void, resetTransform: () => void) => (
    <>
      {/* Top-right: Export dropdown + Fullscreen */}
      <div className="absolute top-3 right-3 z-20 flex gap-1.5">
        <div className="relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg hover:bg-brand-accent text-white/60 hover:text-white transition-colors shadow-lg text-xs font-medium"
            title="Export"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDownIcon className={`w-3 h-3 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
          </button>

          {isExportOpen && (
            <>
              {/* Backdrop to close on outside click */}
              <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
              <div className="absolute top-full right-0 mt-1.5 z-20 min-w-[190px] bg-brand-sidebar/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                 {/* Theme selector */}
                 <div className="px-3 pt-2 pb-1 flex gap-1.5">
                   <button
                     onClick={() => setExportTheme('dark')}
                     className={`flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${exportTheme === 'dark' ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                   >
                     Dark
                   </button>
                   <button
                     onClick={() => setExportTheme('neutral')}
                     className={`flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${exportTheme === 'neutral' ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                   >
                     Light
                   </button>
                 </div>

                 {/* Copy section */}
                 <div className="px-3 pt-1 pb-1 text-[10px] font-semibold text-white/30 tracking-wider uppercase">Copy</div>
                <button
                  onClick={() => { handleCopy('svg'); setIsExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <FileCodeIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1">Copy SVG</span>
                  {copied === 'svg' && <CheckIcon className="w-3 h-3 text-emerald-400" />}
                </button>
                <button
                  onClick={() => { handleCopy('png'); setIsExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <FileImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1">Copy PNG</span>
                  {copied === 'png' && <CheckIcon className="w-3 h-3 text-emerald-400" />}
                </button>
                <button
                  onClick={() => { handleCopy('code'); setIsExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <ClipboardIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1">Copy Code</span>
                  {copied === 'code' && <CheckIcon className="w-3 h-3 text-emerald-400" />}
                </button>

                {/* Divider */}
                <div className="mx-3 my-1 border-t border-white/5" />

                {/* Download section */}
                <div className="px-3 pt-1 pb-1 text-[10px] font-semibold text-white/30 tracking-wider uppercase">Download</div>
                <button
                  onClick={() => { downloadPNG(); setIsExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <FileImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1">PNG (5×)</span>
                </button>
                <button
                  onClick={() => { downloadPDF(); setIsExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <FileTextIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1">PDF (A3)</span>
                </button>
                <button
                  onClick={() => { downloadSVG(); setIsExportOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <FileCodeIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1">SVG (themed)</span>
                </button>

                <div className="px-3 pb-2 pt-1 mt-1 border-t border-white/5 text-[9px] text-white/20 text-center">
                  PNG 5× · PDF A3 · SVG themed (Mermaid) · 6 dpi PDF
                </div>
              </div>
            </>
          )}
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

  // Re-center when entering/exiting fullscreen
  useEffect(() => {
    requestAnimationFrame(() => centerDiagram());
  }, [isFullscreen, centerDiagram]);

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
            panning={{ excluded: isSelectMode ? ['.selectable-element'] : [] }}
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
      <div className={`flex-1 w-full h-full relative ${isSelectMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}>
        <TransformWrapper
          initialScale={1.5}
          minScale={0.1}
          maxScale={10}
          centerOnInit
          limitToBounds={false}
          wheel={{ step: 0.1 }}
          panning={{ excluded: isSelectMode ? ['.selectable-element'] : [] }}
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
