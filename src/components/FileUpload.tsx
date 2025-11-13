'use client';

import { useState, useRef } from 'react';
import { parseSvenskaSpelFile, ParsedCoupon } from '@/lib/svenskaSpelParser';

interface FileUploadProps {
  onFileLoaded: (coupon: ParsedCoupon) => void | Promise<void>;
}

export default function FileUpload({ onFileLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');

    if (!file.name.endsWith('.txt')) {
      setError('Endast .txt filer stöds');
      return;
    }

    try {
      const content = await file.text();
      const parsed = parseSvenskaSpelFile(content);

      if (parsed.matches.length === 0) {
        setError('Inga matcher hittades i filen');
        return;
      }

      await onFileLoaded(parsed);
    } catch (err) {
      setError(`Fel vid läsning av fil: ${err instanceof Error ? err.message : 'Okänt fel'}`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-900/20'
            : 'border-blue-700/50 hover:border-blue-600 bg-[#1e2745]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          <p className="text-lg font-medium text-white">
            Ladda upp Svenska Spel fil
          </p>
          <p className="text-sm text-gray-300">
            Klicka här eller dra och släpp en .txt fil
          </p>
          <p className="text-xs text-gray-400">
            Stödjer: Topptipset, Stryktipset, Europatipset, Powerplay
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
