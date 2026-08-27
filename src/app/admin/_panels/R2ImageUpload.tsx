'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

interface R2ImageUploadProps {
  /** Current image URL (empty string if none). */
  value: string;
  /** Called with the new R2 URL after successful upload. */
  onChange: (url: string) => void;
  /** R2 key prefix, e.g. "products/boot-001". */
  prefix: string;
  /** Optional disabled state. */
  disabled?: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || 'jpg';
}

export function R2ImageUpload({ value, onChange, prefix, disabled }: R2ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const ext = getExt(file.name);
      const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const base64 = await fileToBase64(file);

      const resp = await fetch('/api/admin/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload', key, file: base64, contentType: file.type }),
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || 'Upload failed');
      onChange(data.data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }, [prefix, onChange]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Max file size is 10MB');
      return;
    }
    upload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div className="flex gap-2 items-stretch">
        <input
          type="text"
          value={value}
          readOnly
          className="flex-1 h-10 px-3 rounded-[10px] border border-stone-200 bg-stone-50 text-[13px] text-obsidian/70"
          placeholder="No image uploaded"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="h-10 px-4 rounded-[10px] bg-lime/20 text-obsidian text-[12px] font-medium flex items-center gap-1.5 hover:bg-lime/40 transition-colors disabled:opacity-50"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="h-10 w-10 rounded-[10px] bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
            title="Remove image"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Drag zone */}
      {dragOver && (
        <div className="mt-2 border-2 border-dashed border-lime rounded-[12px] p-4 text-center text-[12px] text-lime-700 bg-lime/10">
          Drop image here
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="mt-2 relative w-full h-32 rounded-[12px] overflow-hidden bg-stone-100 border">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded-full bg-obsidian/70 text-white text-[10px] flex items-center gap-1">
            <ImageIcon size={10} />
            {value.includes('r2.dev') ? 'R2' : value.includes('unsplash') ? 'External' : 'Image'}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-[11px] text-red-500">{error}</p>
      )}
    </div>
  );
}
