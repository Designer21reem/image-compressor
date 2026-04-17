import React, { useEffect, useRef } from 'react';

function computeGrayscaleHistogram(imageData) {
  const histogram = new Array(256).fill(0);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[gray]++;
  }
  return histogram;
}

function HistogramBars({ histogram, color, label }) {
  if (!histogram) {
    return (
      <div className="flex items-end gap-px h-24 shimmer rounded-lg" />
    );
  }

  const maxVal = Math.max(...histogram);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
        <span className="text-xs text-ink-500 font-body uppercase tracking-wider">{label}</span>
      </div>
      <div
        className="flex items-end gap-px rounded-lg overflow-hidden bg-ink-50 p-2"
        style={{ height: '80px' }}
        title="Grayscale intensity histogram"
      >
        {histogram.map((val, i) => {
          const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-300"
              style={{
                height: `${heightPct}%`,
                backgroundColor: color,
                minHeight: val > 0 ? '1px' : '0',
                opacity: 0.7 + 0.3 * (i / 255),
              }}
            />
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between px-1">
        <span className="text-[10px] text-ink-300 font-mono">0</span>
        <span className="text-[10px] text-ink-300 font-mono">128</span>
        <span className="text-[10px] text-ink-300 font-mono">255</span>
      </div>
    </div>
  );
}

export default function Histogram({ originalImg, compressedSrc }) {
  const origHistRef = useRef(null);
  const compHistRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));

  const [histograms, setHistograms] = React.useState({ original: null, compressed: null });

  // Compute histogram from an img element
  const computeFromImg = (img) => {
    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    try {
      return computeGrayscaleHistogram(ctx.getImageData(0, 0, canvas.width, canvas.height));
    } catch {
      return null;
    }
  };

  // Compute histogram from a data URL
  const computeFromDataURL = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(computeFromImg(img));
      img.onerror = () => resolve(null);
      img.src = src;
    });

  useEffect(() => {
    if (!originalImg) return;
    const orig = computeFromImg(originalImg);
    setHistograms((prev) => ({ ...prev, original: orig }));
  }, [originalImg]);

  useEffect(() => {
    if (!compressedSrc) return;
    computeFromDataURL(compressedSrc).then((hist) => {
      setHistograms((prev) => ({ ...prev, compressed: hist }));
    });
  }, [compressedSrc]);

  return (
    <div className="space-y-4">
      {/* Educational note */}
      <div className="px-4 py-3 bg-ink-900 rounded-xl flex gap-3 items-start">
        <span className="text-amber-400 text-lg leading-none mt-0.5">📊</span>
        <p className="text-sm text-ink-200 font-body leading-relaxed">
          <span className="font-semibold text-white">What is a histogram?</span>{' '}
          A grayscale histogram shows the distribution of brightness values (0 = black, 255 = white)
          across all pixels. A spike at the edges means a very dark or very bright image. Compression
          shifts and smooths these distributions — compare original vs. compressed to see how JPEG
          encoding alters pixel intensity patterns.
        </p>
      </div>

      {/* Histograms */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm space-y-5">
        <h3 className="font-display text-ink-900 text-lg">Grayscale Histograms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HistogramBars
            histogram={histograms.original}
            color="#4a3f38"
            label="Original"
          />
          <HistogramBars
            histogram={compressedSrc ? histograms.compressed : null}
            color="#f59e0b"
            label="Compressed"
          />
        </div>
        <p className="text-xs text-ink-400 font-body pt-1 border-t border-ink-100">
          X-axis: pixel intensity (0–255) · Y-axis: relative frequency of pixels at that brightness
        </p>
      </div>
    </div>
  );
}