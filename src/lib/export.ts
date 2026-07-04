import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';

export const exportDiagram = async (container: HTMLElement | null, type: 'png' | 'svg' | 'pdf', fileName: string = 'diagram') => {
  if (!container) return;

  try {
    const svg = container.querySelector('svg');
    if (!svg) throw new Error('No SVG found in container');

    if (type === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } 
    else if (type === 'png') {
      const dataUrl = await htmlToImage.toPng(container, {
        backgroundColor: '#1a1a1e',
        style: { padding: '40px' }
      });
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } 
    else if (type === 'pdf') {
      const dataUrl = await htmlToImage.toPng(container, {
        backgroundColor: '#ffffff',
        style: { padding: '40px' }
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const padding = 80;
      const imgW = img.width;
      const imgH = img.height;

      const pdf = new jsPDF({
        orientation: imgW > imgH ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgW + padding, imgH + padding]
      });

      pdf.addImage(dataUrl, 'PNG', padding / 2, padding / 2, imgW, imgH);
      pdf.save(`${fileName}.pdf`);
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#6366f1']
    });

  } catch (err) {
    console.error(`Export failed for ${type}:`, err);
    throw err;
  }
};
