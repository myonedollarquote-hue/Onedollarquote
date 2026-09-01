'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function Signature({ text, link }) {
  if (!text) return null;
  return (
    <div className="signature">
      <span className="signature__rule" aria-hidden="true" />
      <span className="signature__name">
        {link ? (
          <a className="signature__link" href={link} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        ) : (
          text
        )}
      </span>
    </div>
  );
}

// Icône agrandir / réduire
function ZoomIcon({ expanded }) {
  return expanded ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 3H3v6M15 21h6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 3l7 7M21 21l-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9V4h5M20 15v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 4l6 6M20 20l-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Half({ pageNumber, data, onUnlock, busy, error, side, focused, onToggleFocus }) {
  let inner;
  if (data === undefined) {
    inner = <div className="half loading">…</div>;
  } else if (data === null) {
    inner = (
      <div className="half available">
        <p className="available__hint">This page is waiting for its author.</p>
        <button className="unlock" onClick={() => onUnlock(pageNumber)} disabled={busy}>
          {busy ? 'Redirecting…' : 'Unlock this page for €1'}
        </button>
        {error && <p className="available__error">{error}</p>}
      </div>
    );
  } else {
    inner = (
      <article className={`half content content--${data.content_type}`}>
        <div className="content__body">
          <p className="text">{data.content_text}</p>
        </div>
        <Signature text={data.author_signature} link={data.author_link} />
      </article>
    );
  }

  return (
    <>
      {inner}
      <button
        className="leaf__zoom"
        onClick={() => onToggleFocus(side)}
        aria-label={focused ? 'Show both pages' : 'Enlarge this page'}
      >
        <ZoomIcon expanded={focused} />
      </button>
    </>
  );
}

export default function Book() {
  const searchParams = useSearchParams();

  const startPage = parseInt(searchParams.get('page') || '1', 10);
  const startSheet = Number.isInteger(startPage) && startPage > 0 ? Math.ceil(startPage / 2) : 1;

  const [sheet, setSheet] = useState(startSheet);
  const left = sheet * 2 - 1;
  const right = sheet * 2;

  const [pages, setPages] = useState({});
  const [busyPage, setBusyPage] = useState(null);
  const [errors, setErrors] = useState({});
  const [focus, setFocus] = useState(null); // null | 'left' | 'right'

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  const load = useCallback(async (l, r) => {
    setPages({ [l]: undefined, [r]: undefined });
    setErrors({});
    const { data, error } = await supabase
      .from('pages')
      .select('page_number, content_type, content_text, author_signature, author_link')
      .in('page_number', [l, r]);
    const map = { [l]: null, [r]: null };
    if (!error && data) for (const row of data) map[row.page_number] = row;
    setPages(map);
  }, []);

  useEffect(() => {
    load(left, right);
    window.history.replaceState(null, '', `/?page=${left}`);
  }, [left, right, load]);

  function go(delta) {
    setSheet((s) => Math.max(1, s + delta));
  }

  function toggleFocus(side) {
    setFocus((f) => (f === side ? null : side));
  }

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults(null);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('page_number, author_signature')
        .ilike('author_signature', `%${q}%`)
        .order('page_number', { ascending: true })
        .limit(12);
      if (!active) return;
      setResults(error ? [] : data || []);
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  function openResult(pageNum) {
    setSheet(Math.ceil(pageNum / 2));
    setQuery('');
    setResults(null);
  }

  async function unlock(pageNumber) {
    setBusyPage(pageNumber);
    setErrors({});
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_number: pageNumber }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors({ [pageNumber]: json.error || 'Something went wrong.' });
        setBusyPage(null);
        return;
      }
      window.location.href = json.url;
    } catch {
      setErrors({ [pageNumber]: 'Network unavailable.' });
      setBusyPage(null);
    }
  }

  const bookClass =
    'book' + (focus === 'left' ? ' is-focus-left' : focus === 'right' ? ' is-focus-right' : '');

  return (
    <>
      <div className="search">
        <div className="search__bar">
          <svg className="search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            className="search__input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by signature…"
            aria-label="Search by signature"
          />
          {query && (
            <button
              className="search__clear"
              onClick={() => { setQuery(''); setResults(null); }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {results !== null && (
          <div className="search__results">
            {results.length === 0 ? (
              <div className="search__empty">No page found.</div>
            ) : (
              results.map((r) => (
                <button
                  key={r.page_number}
                  className="search__item"
                  onClick={() => openResult(r.page_number)}
                >
                  <span className="search__sig">{r.author_signature || '—'}</span>
                  <span className="search__page">Page {r.page_number}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="scene">
        <div className={bookClass}>
          <div className="leaf leaf--left">
            <Half
              pageNumber={left}
              data={pages[left]}
              onUnlock={unlock}
              busy={busyPage === left}
              error={errors[left]}
              side="left"
              focused={focus === 'left'}
              onToggleFocus={toggleFocus}
            />
          </div>
          <div className="leaf leaf--right">
            <Half
              pageNumber={right}
              data={pages[right]}
              onUnlock={unlock}
              busy={busyPage === right}
              error={errors[right]}
              side="right"
              focused={focus === 'right'}
              onToggleFocus={toggleFocus}
            />
          </div>
        </div>
      </div>

      <nav className="nav" aria-label="Book navigation">
        <button
          className="nav__arrow"
          onClick={() => go(-1)}
          disabled={sheet <= 1}
          aria-label="Previous pages"
        >
          ‹
        </button>
        <span className="nav__page">Pages {left}–{right}</span>
        <button className="nav__arrow" onClick={() => go(1)} aria-label="Next pages">
          ›
        </button>
      </nav>
    </>
  );
}
