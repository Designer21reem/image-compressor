import React, { useRef, useState } from 'react';

export default function ImageUploader({ onImageLoad }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageLoad({ src: e.target.result, size: file.size, name: file.name, img });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    processFile(e.target.files[0]);
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Educational note */}
      <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start">
        <span className="text-amber-500 text-lg leading-none mt-0.5">💡</span>
        <p className="text-sm text-ink-700 font-body leading-relaxed">
          <span className="font-semibold text-ink-900">What is image compression?</span>{' '}
          Compression reduces file size by encoding pixel data more efficiently. JPEG compression is
          "lossy" — it discards some visual detail that the human eye barely notices, achieving
          dramatic size savings.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center gap-4 
          border-2 border-dashed rounded-2xl p-12 cursor-pointer
          transition-all duration-200
          ${dragging
            ? 'border-amber-400 bg-amber-50 scale-[1.01]'
            : 'border-ink-200 bg-white hover:border-amber-300 hover:bg-amber-50/40'}
        `}
      >
        {/* Icon */}
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
          transition-all duration-200
          ${dragging ? 'bg-amber-100 rotate-3' : 'bg-ink-100'}
        `}>
          🖼️
        </div>

        <div className="text-center">
          <p className="text-ink-800 font-semibold font-body text-lg">
            {dragging ? 'Drop your image here' : 'Upload an image'}
          </p>
          <p className="text-ink-400 text-sm mt-1 font-body">
            Drag & drop or click to browse · JPEG, PNG, WebP
          </p>
        </div>

        <div className="px-5 py-2 bg-ink-900 text-ink-50 rounded-full text-sm font-medium font-body hover:bg-ink-700 transition-colors">
          Choose File
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
}