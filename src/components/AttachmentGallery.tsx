'use client';

/* eslint-disable @next/next/no-img-element -- images come from the authenticated /api attachment
   endpoint, which next/image's optimizer can't fetch with the user's cookie */

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faChevronLeft,
  faChevronRight,
  faExpand,
  faLink,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { attachmentUrl } from '@/lib/api';
import { formatBytes } from '@/lib/format';
import type { Attachment } from '@/lib/types';
import { Modal } from './ui';

interface ImageViewerProps {
  images: Attachment[];
  index: number;
  onIndex: Dispatch<SetStateAction<number>>;
  onClose: () => void;
}

const ImageViewer = ({ images, index, onIndex, onClose }: ImageViewerProps) => {
  const image = images[index];
  const many = images.length > 1;
  const step = (delta: number) => onIndex((index + delta + images.length) % images.length);

  useEffect(() => {
    if (!many) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') onIndex((i) => (i + 1) % images.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [many, images.length, onIndex]);

  return (
    <Modal
      title={image.file_name ?? 'Image'}
      subtitle={`${many ? `Image ${index + 1} of ${images.length} · ` : ''}${formatBytes(image.size)}`}
      onClose={onClose}
      size="xl"
      footer={
        <>
          <a href={attachmentUrl(image)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
            Open original
          </a>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="viewer-stage">
        <img src={attachmentUrl(image)} alt={image.file_name ?? ''} />
        {many && (
          <>
            <button className="stage-nav prev" onClick={() => step(-1)} aria-label="Previous image">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button className="stage-nav next" onClick={() => step(1)} aria-label="Next image">
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

interface AttachmentGalleryProps {
  attachments: Attachment[];
  canRemove: boolean;
  onRemove: (attachment: Attachment) => void;
}

const AttachmentGallery = ({ attachments, canRemove, onRemove }: AttachmentGalleryProps) => {
  const images = attachments.filter((a) => a.type === 'image');
  const links = attachments.filter((a) => a.type === 'link');
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Keep the selection valid when an image is removed
  const index = Math.min(active, Math.max(images.length - 1, 0));
  const current = images[index];
  const many = images.length > 1;
  const step = (delta: number) => setActive((index + delta + images.length) % images.length);

  return (
    <div className="gallery">
      {current && (
        <>
          <figure className="gallery-stage">
            <button
              className="gallery-open"
              onClick={() => setViewerOpen(true)}
              aria-label={`View ${current.file_name} full size`}
            >
              <img src={attachmentUrl(current)} alt={current.file_name ?? ''} />
              <span className="gallery-zoom">
                <FontAwesomeIcon icon={faExpand} />
                Click to enlarge
              </span>
            </button>

            {many && (
              <>
                <button className="stage-nav prev" onClick={() => step(-1)} aria-label="Previous image">
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button className="stage-nav next" onClick={() => step(1)} aria-label="Next image">
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </>
            )}

            <figcaption className="gallery-caption">
              <span className="truncate">
                <strong>{current.file_name}</strong>
                <span className="muted"> · {formatBytes(current.size)}</span>
              </span>
              {many && (
                <span className="muted small nowrap">
                  {index + 1} / {images.length}
                </span>
              )}
              {canRemove && (
                <button
                  className="btn btn-danger-ghost btn-sm"
                  onClick={() => onRemove(current)}
                  aria-label={`Remove ${current.file_name}`}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span className="hide-sm">Remove</span>
                </button>
              )}
            </figcaption>
          </figure>

          {many && (
            <div className="gallery-strip" role="tablist" aria-label="Images">
              {images.map((a, i) => (
                <button
                  key={a.id}
                  role="tab"
                  aria-selected={i === index}
                  className={`strip-thumb ${i === index ? 'is-active' : ''}`}
                  onClick={() => setActive(i)}
                  title={a.file_name ?? undefined}
                >
                  <img src={attachmentUrl(a)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {links.length > 0 && (
        <ul className="link-list">
          {links.map((a) => (
            <li key={a.id}>
              <FontAwesomeIcon icon={faLink} className="muted" />
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="truncate">
                {a.url}
              </a>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="muted small" />
              {canRemove && (
                <button className="icon-btn icon-btn-sm" onClick={() => onRemove(a)} aria-label="Remove link">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {viewerOpen && current && (
        <ImageViewer images={images} index={index} onIndex={setActive} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  );
};

export default AttachmentGallery;
