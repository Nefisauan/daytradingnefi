'use client';

import { useState, useEffect, useCallback } from 'react';

interface Screenshot {
  id: string;
  storage_path: string;
  signedUrl: string;
}

interface ScreenshotUploadProps {
  tradeId: string;
  userId: string;
  supabase: any;
  tableName?: string;
}

export default function ScreenshotUpload({ tradeId, userId, supabase, tableName = 'trade_screenshots' }: ScreenshotUploadProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BUCKET = 'trade-screenshots';

  // ---------- load existing screenshots on mount ----------

  const loadScreenshots = useCallback(async () => {
    const { data: rows, error: fetchErr } = await supabase
      .from(tableName)
      .select('id, storage_path')
      .eq('trade_id', tradeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (fetchErr) {
      console.error('Failed to load screenshots:', fetchErr.message);
      return;
    }

    if (!rows || rows.length === 0) {
      setScreenshots([]);
      return;
    }

    // generate a signed url for each screenshot
    const withUrls: Screenshot[] = [];

    for (const row of rows) {
      const { data: signed, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path, 60 * 60); // 1 hour expiry

      if (signErr) {
        console.error('Signed URL error:', signErr.message);
        continue;
      }

      withUrls.push({
        id: row.id,
        storage_path: row.storage_path,
        signedUrl: signed.signedUrl,
      });
    }

    setScreenshots(withUrls);
  }, [supabase, tradeId, userId]);

  useEffect(() => {
    loadScreenshots();
  }, [loadScreenshots]);

  // ---------- upload handler ----------

  const uploadFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Only image files are accepted.');
      return;
    }

    // limit to 10 MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.');
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split('.').pop() || 'png';
      const storagePath = `${userId}/${tradeId}/${Date.now()}.${ext}`;

      // 1. upload to storage
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      // 2. insert metadata row
      const { error: insertErr } = await supabase
        .from(tableName)
        .insert({
          storage_path: storagePath,
          trade_id: tradeId,
          user_id: userId,
        });

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      // 3. refresh the list
      await loadScreenshots();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ---------- event handlers ----------

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  // ---------- delete handler ----------

  const handleDelete = async (screenshot: Screenshot) => {
    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .remove([screenshot.storage_path]);

    if (storageErr) {
      console.error('Storage delete error:', storageErr.message);
    }

    const { error: rowErr } = await supabase
      .from(tableName)
      .delete()
      .eq('id', screenshot.id);

    if (rowErr) {
      console.error('Row delete error:', rowErr.message);
    }

    setScreenshots((prev) => prev.filter((s) => s.id !== screenshot.id));
  };

  // ---------- render ----------

  return (
    <div className="space-y-3">
      {/* drop zone */}
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center gap-2
          w-full min-h-[120px] rounded-xl cursor-pointer
          border-2 border-dashed transition-colors
          ${dragOver
            ? 'border-accent bg-accent/5'
            : 'border-border bg-card hover:border-accent/50 hover:bg-card-hover'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            {/* spinner */}
            <svg
              className="animate-spin h-6 w-6 text-accent"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm text-muted">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-4">
            {/* upload icon */}
            <svg
              className="h-6 w-6 text-muted"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <span className="text-sm text-muted">
              Drop a chart screenshot here or click to browse
            </span>
            <span className="text-xs text-muted/60">PNG, JPG, WEBP up to 10 MB</span>
          </div>
        )}
      </label>

      {/* error message */}
      {error && (
        <p className="text-sm text-red">{error}</p>
      )}

      {/* thumbnail grid */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {screenshots.map((s) => (
            <div
              key={s.id}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-card"
            >
              <img
                src={s.signedUrl}
                alt="Trade screenshot"
                className="w-full h-full object-cover"
              />
              {/* delete overlay */}
              <button
                type="button"
                onClick={() => handleDelete(s)}
                className="
                  absolute inset-0 flex items-center justify-center
                  bg-background/70 opacity-0 group-hover:opacity-100
                  transition-opacity
                "
              >
                <svg
                  className="h-5 w-5 text-red"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
