import React, { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  /** Existing signature to display, as a data URL. */
  value?: string;
  /** Fires with a PNG data URL, or '' once cleared. */
  onChange?: (dataUrl: string) => void;
  /** Read-only rendering of an already-captured signature. */
  readOnly?: boolean;
  className?: string;
}

/**
 * A small draw-to-sign canvas. Works with mouse, finger and stylus via
 * pointer events, and exports a PNG data URL that is stored alongside the
 * approval so the signed document can be re-rendered later.
 */
export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  readOnly = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(!!value);

  // Size the bitmap to the element so strokes are not blurry on retina.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';

    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
      setHasInk(true);
    }
  }, [value]);

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pointFrom(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || readOnly) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = pointFrom(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && onChange) onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    if (onChange) onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        // Without this the browser scrolls the page instead of drawing.
        style={{ touchAction: 'none' }}
        className={`w-full h-24 rounded-lg bg-white border border-slate-400 ${
          readOnly ? '' : 'cursor-crosshair'
        }`}
      />

      {!hasInk && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-slate-400">
          {readOnly ? 'לא נחתם' : 'חתמו כאן באצבע או בעכבר'}
        </span>
      )}

      {!readOnly && hasInk && (
        <button
          type="button"
          onClick={clear}
          className="absolute top-1 left-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 bg-white/90 border border-slate-300 hover:bg-slate-100 cursor-pointer"
        >
          <Eraser className="w-3 h-3" />
          נקה
        </button>
      )}
    </div>
  );
};
