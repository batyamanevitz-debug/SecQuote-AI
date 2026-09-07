import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string,
  options?: {
    scale?: number;
    backgroundColor?: string;
  }
): Promise<void> {
  const backgroundColor = options?.backgroundColor || '#ffffff';
  const pixelRatio = options?.scale || 3;

  try {
    // 1. Ensure fonts are fully loaded before capturing
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    // 2. Synchronize any form inputs so current values are present in cloned DOM
    element.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
      input.setAttribute('value', input.value);
    });

    // Check for multi-page documents (e.g. 5-page ELIX Systems SOW proposal)
    const pageElements = Array.from(
      element.querySelectorAll<HTMLElement>('[data-pdf-page="true"]')
    );

    if (pageElements.length > 0) {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        let pageImg: string | null = null;
        try {
          pageImg = await toPng(pageEl, {
            quality: 1,
            pixelRatio: 2.5,
            backgroundColor,
            cacheBust: true,
            style: {
              boxShadow: 'none',
              margin: '0',
            },
          });
        } catch {
          const canvas = await html2canvas(pageEl, {
            scale: 2.5,
            backgroundColor,
            useCORS: true,
            allowTaint: true,
            logging: false,
          });
          pageImg = canvas.toDataURL('image/png');
        }

        if (pageImg) {
          // Standard A4: 210mm x 297mm
          pdf.addImage(pageImg, 'PNG', 0, 0, 210, 297, undefined, 'SLOW');
        }
      }

      pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
      return;
    }

    let imgData: string | null = null;

    // 3. First attempt: High-fidelity lossless PNG via html-to-image
    try {
      imgData = await toPng(element, {
        quality: 1,
        pixelRatio,
        backgroundColor,
        cacheBust: true,
        style: {
          boxShadow: 'none',
          margin: '0',
        },
      });
    } catch (toPngErr) {
      console.warn('toPng failed, attempting html2canvas fallback:', toPngErr);
      // Fallback: html2canvas
      const canvas = await html2canvas(element, {
        scale: pixelRatio,
        backgroundColor,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      imgData = canvas.toDataURL('image/png');
    }

    if (!imgData) {
      throw new Error('Could not generate image data from element');
    }

    const rect = element.getBoundingClientRect();
    const width = element.scrollWidth || rect.width || 850;
    const height = element.scrollHeight || rect.height || 1100;

    // A4 standard width in mm: 210
    const pdfWidth = 210;
    const pdfHeight = (height * pdfWidth) / width;

    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: true,
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  } catch (err) {
    console.warn('Direct PDF canvas rasterization fallback triggered:', err);
    // Graceful fallback to browser print dialog
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
  }
}

