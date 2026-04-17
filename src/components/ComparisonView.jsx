import React from 'react';

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ImageCard({ title, src, size, badge, badgeColor, label }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden flex flex-col animate-slide-up">
      {/* Header */}
      <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
        <div>
          <h3 className="font-display text-ink-900 text-lg">{title}</h3>
          {label && <p className="text-xs text-ink-400 font-body mt-0.5">{label}</p>}
        </div>
        {badge && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold font-mono ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative bg-ink-50 flex items-center justify-center" style={{ minHeight: 220 }}>
        {src ? (
          <img
            src={src}
            alt={title}
            className="w-full object-contain"
            style={{ maxHeight: 320 }}
          />
        ) : (
          <div className="w-full h-48 shimmer" />
        )}
        {/* Checkerboard for transparent areas */}
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #d0c8be 25%, transparent 25%), linear-gradient(-45deg, #d0c8be 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d0c8be 75%), linear-gradient(-45deg, transparent 75%, #d0c8be 75%)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
          }}
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-4 mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-400 font-body uppercase tracking-wider">File size</span>
          <span className="font-mono text-ink-900 font-semibold text-sm">{formatSize(size)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonView({
  originalSrc,
  originalSize,
  compressedSrc,
  compressedSize,
  isLoading,
  pixelDiff,
  savings,
}) {
  return (
    <div className="space-y-4">
      {/* Educational note */}
      <div className="px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl flex gap-3 items-start">
        <span className="text-teal-500 text-lg leading-none mt-0.5">🔬</span>
        <p className="text-sm text-ink-700 font-body leading-relaxed">
          <span className="font-semibold text-ink-900">What does "quality" mean?</span>{' '}
          The quality slider controls how aggressively JPEG discards image information. At 1.0 (100%),
          almost no data is removed. At 0.1 (10%), heavy compression artifacts appear — but the file
          is tiny. The sweet spot for most images is 0.7–0.85.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageCard
          title="Original"
          src={originalSrc}
          size={originalSize}
          label="Uncompressed source"
          badge="RAW"
          badgeColor="bg-ink-100 text-ink-600"
        />
        <ImageCard
          title="Compressed"
          src={isLoading ? null : compressedSrc}
          size={isLoading ? null : compressedSize}
          label="JPEG re-encoded"
          badge={isLoading ? 'Processing…' : savings !== null ? `Saved ${savings.toFixed(1)}%` : 'JPEG'}
          badgeColor={
            isLoading
              ? 'bg-amber-100 text-amber-600 animate-pulse-slow'
              : savings > 0
              ? 'bg-teal-100 text-teal-700'
              : 'bg-ink-100 text-ink-600'
          }
        />
      </div>

      {/* Stats row */}
      {!isLoading && compressedSrc && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in">
          {/* Savings */}
          <div className="bg-white border border-ink-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-ink-400 uppercase tracking-wider font-body mb-1">Space Saved</p>
            <p className={`text-2xl font-display ${savings > 0 ? 'text-teal-600' : 'text-ink-900'}`}>
              {savings !== null ? `${savings.toFixed(1)}%` : '—'}
            </p>
            <p className="text-xs text-ink-400 mt-1 font-body">
              {originalSize && compressedSize
                ? `${formatSize(originalSize - compressedSize)} freed`
                : ''}
            </p>
          </div>

          {/* Pixel Diff */}
          <div className="bg-white border border-ink-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-ink-400 uppercase tracking-wider font-body mb-1">
              Pixel Difference Score
            </p>
            <p className="text-2xl font-display text-ink-900">
              {pixelDiff !== null ? pixelDiff.toFixed(2) : '—'}
            </p>
            <p className="text-xs text-ink-400 mt-1 font-body">avg RGB Δ per pixel</p>
          </div>

          {/* Compression ratio */}
          <div className="bg-white border border-ink-100 rounded-xl p-4 shadow-sm col-span-2 md:col-span-1">
            <p className="text-xs text-ink-400 uppercase tracking-wider font-body mb-1">
              Compression Ratio
            </p>
            <p className="text-2xl font-display text-ink-900">
              {originalSize && compressedSize
                ? `${(originalSize / compressedSize).toFixed(2)}×`
                : '—'}
            </p>
            <p className="text-xs text-ink-400 mt-1 font-body">original ÷ compressed</p>
          </div>
        </div>
      )}

      {/* Pixel diff explainer */}
      {!isLoading && compressedSrc && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 items-start animate-fade-in">
          <span className="text-rose-400 text-lg leading-none mt-0.5">📐</span>
          <p className="text-sm text-ink-700 font-body leading-relaxed">
            <span className="font-semibold text-ink-900">What is the Pixel Difference Score?</span>{' '}
            For each pixel, we compute the absolute difference in R, G, and B channels between the
            original and compressed image, then average them. A score of 0 means identical images.
            Higher scores indicate more visual loss from compression.
          </p>
        </div>
      )}
    </div>
  );
}