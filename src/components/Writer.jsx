'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LIMITS } from '@/lib/limits';

export default function Writer() {
  const searchParams = useSearchParams();
  const pageNumber = parseInt(searchParams.get('page') || '', 10);
  const sessionId = searchParams.get('session_id') || '';

  const [format, setFormat] = useState(null); // 'citation' | 'histoire'
  const [text, setText] = useState('');
  const [signature, setSignature] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const limits = format ? LIMITS[format] : null;

  const textValid = useMemo(() => {
    if (!limits) return false;
    const len = text.trim().length;
    return len >= limits.min && len <= limits.max;
  }, [text, limits]);

  // Le lien est facultatif ; s'il est rempli, il doit commencer par http(s).
  const linkTrimmed = link.trim();
  const linkValid = linkTrimmed === '' || /^https?:\/\/.+/i.test(linkTrimmed);

  const canPublish = format && textValid && signature.trim().length >= 1 && linkValid && !busy;

  async function publish() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_number: pageNumber,
          session_id: sessionId,
          content_type: format,
          content_text: text.trim(),
          author_signature: signature.trim(),
          author_link: linkTrimmed,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Something went wrong.');
        setBusy(false);
        return;
      }
      setDone(true);
      setTimeout(() => {
        window.location.href = `/?page=${pageNumber}`;
      }, 900);
    } catch {
      setError('Network unavailable.');
      setBusy(false);
    }
  }

  if (!Number.isInteger(pageNumber) || !sessionId) {
    return (
      <div className="writer">
        <h1>Invalid link</h1>
        <p className="sub">This screen opens after a payment. Go back to the book to unlock a page.</p>
        <a className="link-home" href="/">← Back to the book</a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="writer">
        <h1>Published ✦</h1>
        <p className="sub">Your page is now part of the book, forever. Redirecting…</p>
      </div>
    );
  }

  const len = text.trim().length;
  const over = limits && len > limits.max;

  return (
    <div className="writer">
      <h1>Page {pageNumber} unlocked</h1>
      <p className="sub">Choose a format, write, and sign. Publishing is permanent.</p>

      {error && <div className="msg-error">{error}</div>}

      <div className="formats">
        <button className="format" aria-pressed={format === 'citation'} onClick={() => setFormat('citation')}>
          <strong>Quote</strong>
          <span>A short, striking line — {LIMITS.citation.min} to {LIMITS.citation.max} characters.</span>
        </button>
        <button className="format" aria-pressed={format === 'histoire'} onClick={() => setFormat('histoire')}>
          <strong>Experience / Story</strong>
          <span>A personal story — up to {LIMITS.histoire.max} characters.</span>
        </button>
      </div>

      {format && (
        <>
          <div className="field">
            <label htmlFor="txt">{format === 'citation' ? 'Your quote' : 'Your story'}</label>
            <textarea
              id="txt"
              rows={format === 'citation' ? 3 : 10}
              value={text}
              maxLength={limits.max}
              onChange={(e) => setText(e.target.value)}
              placeholder={format === 'citation' ? 'A line worth remembering…' : 'Once, I…'}
            />
            <div className={`counter${over ? ' over' : ''}`}>
              {len} / {limits.max}
              {len < limits.min ? ` — ${limits.min - len} more to go.` : ''}
            </div>
            <span className="notice-warn">
              Offensive, racist, or politically or religiously charged content will lead to your
              page being removed and refunded.
            </span>
          </div>

          <div className="field">
            <label htmlFor="sig">Signature</label>
            <input
              id="sig"
              type="text"
              maxLength={60}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Your name, @insta_handle, @tiktok_handle, or anonymous"
            />
          </div>

          <div className="field">
            <label htmlFor="lnk">Link (optional)</label>
            <input
              id="lnk"
              type="text"
              maxLength={300}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…  — leave empty for none"
            />
            <p className={`hint${linkValid ? '' : ' warn'}`}>
              {linkValid
                ? 'If set, your signature becomes a clickable link.'
                : 'A link must start with http:// or https://'}
            </p>
          </div>

          <button className="publish" onClick={publish} disabled={!canPublish}>
            {busy ? 'Publishing…' : 'Publish permanently'}
          </button>
        </>
      )}

      <a className="link-home" href="/">← Back to the book</a>
    </div>
  );
}
