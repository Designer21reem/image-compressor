import React, { useState, useRef, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import ComparisonView from './components/ComparisonView';
import SliderCompare from './components/SliderCompare';
import Histogram from './components/Histogram';

function compressImage(img, quality) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(
      (blob) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ src: e.target.result, size: blob.size });
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

function computePixelDiff(originalImg, compressedSrc) {
  return new Promise((resolve) => {
    const origCanvas = document.createElement('canvas');
    const w = originalImg.naturalWidth || originalImg.width;
    const h = originalImg.naturalHeight || originalImg.height;
    origCanvas.width = w;
    origCanvas.height = h;
    const origCtx = origCanvas.getContext('2d');
    origCtx.drawImage(originalImg, 0, 0);
    const origData = origCtx.getImageData(0, 0, w, h).data;

    const compImg = new Image();
    compImg.onload = () => {
      const compCanvas = document.createElement('canvas');
      compCanvas.width = w;
      compCanvas.height = h;
      const compCtx = compCanvas.getContext('2d');
      compCtx.drawImage(compImg, 0, 0, w, h);
      const compData = compCtx.getImageData(0, 0, w, h).data;

      let totalDiff = 0;
      let count = 0;
      for (let i = 0; i < origData.length; i += 4) {
        totalDiff += Math.abs(origData[i]     - compData[i]);
        totalDiff += Math.abs(origData[i + 1] - compData[i + 1]);
        totalDiff += Math.abs(origData[i + 2] - compData[i + 2]);
        count += 3;
      }
      resolve(totalDiff / count);
    };
    compImg.onerror = () => resolve(null);
    compImg.src = compressedSrc;
  });
}

function Section({ title, number, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-ink-900 text-amber-400 flex items-center justify-center font-mono text-sm font-semibold flex-shrink-0">
          {number}
        </div>
        <h2 className="font-display text-xl text-ink-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [original, setOriginal] = useState(null);
  const [compressed, setCompressed] = useState(null);
  const [quality, setQuality] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [pixelDiff, setPixelDiff] = useState(null);
  const debounceRef = useRef(null);

  const savings =
    original && compressed
      ? ((original.size - compressed.size) / original.size) * 100
      : null;

  const runCompression = useCallback(async (img, originalSize, originalSrc, q) => {
    setIsLoading(true);
    setPixelDiff(null);
    try {
      const result = await compressImage(img, q);

      // KEY FIX: if compressed is bigger or equal, keep the original
      if (result.size >= originalSize) {
        setCompressed({ src: originalSrc, size: originalSize, usedOriginal: true });
        setPixelDiff(0);
      } else {
        setCompressed({ ...result, usedOriginal: false });
        const diff = await computePixelDiff(img, result.src);
        setPixelDiff(diff);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!original) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runCompression(original.img, original.size, original.src, quality);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [quality, original, runCompression]);

  const handleImageLoad = useCallback(
    (data) => {
      setOriginal(data);
      setCompressed(null);
      setPixelDiff(null);
      runCompression(data.img, data.size, data.src, quality);
    },
    [quality, runCompression]
  );

  const handleDownload = () => {
    if (!compressed) return;
    const a = document.createElement('a');
    a.href = compressed.src;
    a.download = compressed.usedOriginal
      ? 'original_kept.jpg'
      : `compressed_q${Math.round(quality * 100)}.jpg`;
    a.click();
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-ink-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
          <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs font-mono uppercase tracking-widest mb-5">
            Multimedia Seminar · Interactive Demo
          </div>
          <h1 className="font-display text-3xl md:text-5xl text-white leading-tight">
            From Pixels to Perception
          </h1>
          <p className="font-display italic text-2xl md:text-3xl text-amber-400 mt-1">
            Fundamentals of Image Compression
          </p>
          <p className="text-ink-300 font-body mt-4 max-w-xl leading-relaxed text-sm md:text-base">
            Upload any image and explore how JPEG compression works in real-time. Adjust quality,
            inspect histograms, measure pixel-level differences, and compare results side by side.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        <Section number="1" title="Upload an Image">
          <ImageUploader onImageLoad={handleImageLoad} />
        </Section>

        {original && (
          <Section number="2" title="Adjust Compression Quality">
            <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm space-y-5 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-ink-800 font-semibold">
                    Quality:{' '}
                    <span className="font-mono text-amber-600 text-lg">
                      {Math.round(quality * 100)}%
                    </span>
                  </p>
                  <p className="text-xs text-ink-400 font-body mt-0.5">
                    {quality >= 0.85
                      ? '✨ Near-lossless — high quality, larger file'
                      : quality >= 0.6
                      ? '⚖️ Balanced — good quality, noticeable savings'
                      : '🗜️ Heavy compression — small file, visible artifacts'}
                  </p>
                </div>
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 font-body animate-pulse-slow">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing…
                  </div>
                )}
              </div>

              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full"
              />

              <div className="flex justify-between text-[10px] text-ink-300 font-mono px-0.5">
                {[5, 20, 40, 60, 80, 100].map((v) => (
                  <span key={v}>{v}%</span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: 'Low (30%)', val: 0.3 },
                  { label: 'Medium (60%)', val: 0.6 },
                  { label: 'High (80%)', val: 0.8 },
                  { label: 'Max (95%)', val: 0.95 },
                ].map((p) => (
                  <button
                    key={p.val}
                    onClick={() => setQuality(p.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-all duration-150
                      ${Math.abs(quality - p.val) < 0.02
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Warning: compression would increase size */}
              {!isLoading && compressed?.usedOriginal && (
                <div className="px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl flex gap-3 items-start animate-fade-in">
                  <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
                  <p className="text-sm text-ink-700 font-body leading-relaxed">
                    <span className="font-semibold text-ink-900">Original is already smaller.</span>{' '}
                    Compressing at this quality would <em>increase</em> the file size, so the original
                    is kept as-is. Lower the quality slider to achieve real size savings.
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {original && (
          <Section number="3" title="Side-by-Side Comparison">
            <ComparisonView
              originalSrc={original.src}
              originalSize={original.size}
              compressedSrc={compressed?.src}
              compressedSize={compressed?.size}
              isLoading={isLoading}
              pixelDiff={pixelDiff}
              savings={savings}
              usedOriginal={compressed?.usedOriginal}
            />
          </Section>
        )}

        {original && compressed && !isLoading && !compressed.usedOriginal && (
          <Section number="4" title="Interactive Before / After">
            <SliderCompare
              originalSrc={original.src}
              compressedSrc={compressed.src}
            />
          </Section>
        )}

        {original && (
          <Section number="5" title="Histogram Analysis">
            <Histogram
              originalImg={original.img}
              compressedSrc={isLoading ? null : (compressed?.usedOriginal ? null : compressed?.src)}
            />
          </Section>
        )}

        {compressed && !isLoading && (
          <Section number="6" title="Download Result">
            <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-body text-ink-800 font-medium">
                    {compressed.usedOriginal ? (
                      <>
                        Original file kept —{' '}
                        <span className="font-mono text-ink-600">{formatSize(compressed.size)}</span>
                        <span className="ml-2 text-amber-600 font-semibold text-sm">
                          (no size reduction at this quality)
                        </span>
                      </>
                    ) : (
                      <>
                        Compressed file ready —{' '}
                        <span className="font-mono text-teal-600">{formatSize(compressed.size)}</span>
                        {savings !== null && savings > 0 && (
                          <span className="ml-2 text-teal-600 font-semibold">
                            ({savings.toFixed(1)}% smaller)
                          </span>
                        )}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-ink-400 font-body mt-1">
                    {compressed.usedOriginal
                      ? 'Original kept — compression would have increased size'
                      : `Saved as JPEG at ${Math.round(quality * 100)}% quality`}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-ink-900 hover:bg-ink-700 text-white rounded-xl font-body font-medium text-sm transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          </Section>
        )}

        {!original && (
          <div className="text-center py-12 text-ink-300 font-body">
            <div className="text-5xl mb-3">⬆️</div>
            <p>Upload an image above to begin exploring compression</p>
          </div>
        )}
      </main>

      <footer className="border-t border-ink-200 mt-16 py-8 px-6 text-center">
        <p className="text-xs text-ink-400 font-body">
          From Pixels to Perception · Multimedia Seminar Project · All processing happens
          client-side in your browser. No data is uploaded.
        </p>
      </footer>
    </div>
  );
}