'use client';

/* eslint-disable @next/next/no-img-element -- previews are local blob: URLs */

import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faLink, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { formatBytes } from '@/lib/format';
import type { AttachmentDraft } from '@/lib/types';

// Mirrors the backend limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_IMAGES = 10;
export const MAX_LINKS = 20;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateAttachments = ({ links, images }: AttachmentDraft): string | null => {
  if (links.length > MAX_LINKS) return `You can attach at most ${MAX_LINKS} links.`;
  const badLink = links.find((l) => !isValidUrl(l));
  if (badLink) return `"${badLink}" is not a valid http(s) link.`;
  if (images.length > MAX_IMAGES) return `You can attach at most ${MAX_IMAGES} images.`;
  return null;
};

interface AttachmentPickerProps extends AttachmentDraft {
  onChange: (value: AttachmentDraft) => void;
  onError: (message: string) => void;
}

const AttachmentPicker = ({ links, images, onChange, onError }: AttachmentPickerProps) => {
  const [linkDraft, setLinkDraft] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted: File[] = [];
    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        onError(`${file.name} is not a PNG, JPEG, GIF or WebP image.`);
      } else if (file.size > MAX_IMAGE_SIZE) {
        onError(`${file.name} is larger than 5 MB.`);
      } else {
        accepted.push(file);
      }
    }
    const next = [...images, ...accepted];
    if (next.length > MAX_IMAGES) onError(`You can attach at most ${MAX_IMAGES} images.`);
    onChange({ links, images: next.slice(0, MAX_IMAGES) });
  };

  const addLink = () => {
    const value = linkDraft.trim();
    if (!value) return;
    if (!isValidUrl(value)) {
      onError('Enter a full link starting with http:// or https://');
      return;
    }
    if (links.length >= MAX_LINKS) {
      onError(`You can attach at most ${MAX_LINKS} links.`);
      return;
    }
    if (!links.includes(value)) onChange({ links: [...links, value], images });
    setLinkDraft('');
  };

  return (
    <div className="attachment-picker">
      <div
        className={`dropzone ${dragging ? 'is-dragging' : ''}`}
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInput.current?.click()}
      >
        <FontAwesomeIcon icon={faCloudArrowUp} className="dropzone-icon" />
        <div>
          <strong>Drop images here</strong> or <span className="link-text">browse</span>
        </div>
        <span className="muted small">PNG, JPEG, GIF or WebP · up to 5 MB each · max {MAX_IMAGES}</span>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {images.length > 0 && (
        <div className="thumb-grid">
          {images.map((file, i) => (
            <figure key={`${file.name}-${i}`} className="thumb">
              <img src={previews[i]} alt={file.name} />
              <figcaption>
                <span className="truncate">{file.name}</span>
                <span className="muted small">{formatBytes(file.size)}</span>
              </figcaption>
              <button
                type="button"
                className="thumb-remove"
                onClick={() => onChange({ links, images: images.filter((_, j) => j !== i) })}
                aria-label={`Remove ${file.name}`}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </figure>
          ))}
        </div>
      )}

      <div className="link-input">
        <div className="input-icon">
          <FontAwesomeIcon icon={faLink} />
          <input
            className="input"
            type="url"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="https://example.com/related-page"
          />
        </div>
        <button type="button" className="btn btn-secondary" onClick={addLink}>
          <FontAwesomeIcon icon={faPlus} />
          Add link
        </button>
      </div>

      {links.length > 0 && (
        <ul className="chip-list">
          {links.map((link) => (
            <li key={link} className="chip">
              <FontAwesomeIcon icon={faLink} />
              <span className="truncate">{link}</span>
              <button
                type="button"
                className="chip-remove"
                onClick={() => onChange({ links: links.filter((l) => l !== link), images })}
                aria-label="Remove link"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttachmentPicker;
