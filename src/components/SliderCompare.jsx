import React, { useRef, useState, useCallback, useEffect } from 'react';

export default function SliderCompare({ originalSrc, compressedSrc }) {
  const containerRef = useRef(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);

  const updateSlider = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) updateSlider(e.clientX);
    },
    [isDragging, updateSlider]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchMove = useCallback(
    (e) => {
      if (isDragging) updateSlider(e.touches[0].clientX);
    },
    [isDragging, updateSlider]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  if (!originalSrc || !compressedSrc) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Note */}
      <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start">
        <span className="text-amber-500 text-lg leading-none mt-0.5">🖱️</span>
        <p className="text-sm text-ink-700 font-body leading-relaxed">
          <span className="font-semibold text-ink-900">Before / After Comparison</span>{' '}
          Drag the divider left and right to reveal the original vs. compressed image.
        </p>
      </div>

      <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
        <h3 className="font-display text-ink-900 text-lg mb-4">Before / After Slider</h3>

        {/* Comparison container */}
        <div
          ref={containerRef}
          className="relative w-full h-[400px] overflow-hidden rounded-xl cursor-ew-resize"
          style={{ userSelect: 'none' }}
          onMouseDown={handleMouseDown}
          onTouchStart={(e) => { setIsDragging(true); updateSlider(e.touches[0].clientX); }}
        >
          {/* Original (background) */}
          <img
            src={originalSrc}
            alt="Original"
            className="absolute top-0 left-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Compressed (overlay) */}
          <div
            className="absolute top-0 left-0 h-full overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={compressedSrc}
              alt="Compressed"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>

          {/* Divider */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
            style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl border-2 border-ink-200 flex items-center justify-center gap-0.5">
              <span className="text-ink-400 text-xs">◀</span>
              <span className="text-ink-400 text-xs">▶</span>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-ink-900/80 text-white text-xs font-mono rounded-md backdrop-blur-sm">
            Original
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500/90 text-white text-xs font-mono rounded-md backdrop-blur-sm">
            Compressed
          </div>
        </div>

        {/* Indicator */}
        <div className="mt-3 flex items-center justify-between text-xs text-ink-400 font-mono">
          <span>← Original</span>
          <span className="bg-ink-100 px-2 py-0.5 rounded">{sliderPos.toFixed(0)}%</span>
          <span>Compressed →</span>
        </div>
      </div>
    </div>
  );
}