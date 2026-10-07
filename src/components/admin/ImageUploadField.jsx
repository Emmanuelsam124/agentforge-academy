import { useRef, useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  IMAGE_BUCKET,
  ALLOWED_IMAGE_TYPES,
  TARGET_IMAGE_WIDTH,
  TARGET_IMAGE_HEIGHT,
  publicImageUrl,
  storagePathFor,
  imageRejectionReason,
  readImageSize,
  imageSizeWarning,
} from '../../lib/articleImages';

/**
 * Header-image control for the news and guide editors.
 *
 * The URL text box stays — pasting a link to an image hosted anywhere still
 * works, and the news pipeline writes image_url directly — but the upload
 * button covers the common case without a trip to the Supabase dashboard.
 *
 * Writing to the bucket from a browser depends on the admin storage policies
 * in supabase/article-images-setup.sql; the pipeline's own uploads go
 * through service_role and bypass them.
 */
export default function ImageUploadField({ value, onChange, slug, placeholder, disabled }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    // Reset immediately so picking the same file twice still fires onChange.
    e.target.value = '';
    if (!file) return;

    setError('');
    setWarning('');

    const rejection = imageRejectionReason(file);
    if (rejection) {
      setError(rejection);
      return;
    }

    setUploading(true);
    try {
      const path = storagePathFor(slug, file);
      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      onChange(publicImageUrl(path));
      // Advisory only, and shown after a successful upload rather than
      // before it — the image works either way, it just gets cropped.
      setWarning(imageSizeWarning(await readImageSize(file)) || '');
    } catch (err) {
      setError(
        /row-level security|not authorized|Unauthorized/i.test(err.message || '')
          ? 'Upload denied — this account needs admin rights on the image bucket.'
          : err.message || 'Upload failed.',
      );
    } finally {
      setUploading(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0C1420] focus:outline-none focus:ring-2 focus:ring-brand/40';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 min-w-0 ${inputCls}`}
        />
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={pick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border border-border text-body-strong hover:border-brand/40 disabled:opacity-40 transition-colors"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      {value && (
        <div className="flex items-start gap-2">
          <img
            src={value}
            alt=""
            className="w-40 aspect-[16/9] object-cover rounded-lg border border-border-soft flex-shrink-0"
          />
          <button
            type="button"
            onClick={() => { onChange(''); setWarning(''); setError(''); }}
            className="flex items-center gap-1 text-[11px] font-semibold text-body-strong hover:text-rose-600 transition-colors"
          >
            <X className="w-3 h-3" /> Remove
          </button>
        </div>
      )}

      {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}
      {warning && <p className="text-[11px] text-amber-600 dark:text-amber-500">{warning}</p>}
      {!error && !warning && (
        <p className="text-[11px] text-gray-400">
          {TARGET_IMAGE_WIDTH}x{TARGET_IMAGE_HEIGHT} (16:9) fits every card and header exactly. JPG, PNG or WebP, up to 2MB.
        </p>
      )}
    </div>
  );
}
