'use client';

import { useEffect, useState } from 'react';
import { LIMITS } from '@/lib/limits';

function statusOf(p) {
  const now = Date.now();
  if (p.is_paid && p.content_text) return { label: 'Published', tone: 'ok' };
  if (p.is_paid && !p.content_text) return { label: 'Paid — awaiting text', tone: 'warn' };
  if (p.reserved_until && new Date(p.reserved_until).getTime() > now) return { label: 'Reserved', tone: 'muted' };
  return { label: 'Blank', tone: 'muted' };
}

export default function Admin() {
  const [authed, setAuthed] = useState(null); // null = vérification, false = login, true = ok
  const [password, setPassword] = useState('');
  const [pages, setPages] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // page_number en édition
  const [draft, setDraft] = useState({});

  async function loadPages() {
    const res = await fetch('/api/admin/pages');
    if (res.status === 401) { setAuthed(false); return; }
    const json = await res.json();
    setPages(json.pages || []);
    setAuthed(true);
  }

  useEffect(() => { loadPages(); }, []);

  async function login(e) {
    e?.preventDefault();
    setMsg('');
    setBusy(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(json.error || 'Login failed.'); return; }
    setPassword('');
    loadPages();
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setPages([]);
    setAuthed(false);
  }

  async function act(url, page_number, confirmText, successText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setMsg('');
    setBusy(true);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_number }),
    });
    const json = await res.json();
    setBusy(false);
    setMsg(res.ok ? successText : (json.error || 'Something went wrong.'));
    if (res.ok) loadPages();
  }

  function startEdit(p) {
    setEditing(p.page_number);
    setDraft({
      content_type: p.content_type || 'citation',
      content_text: p.content_text || '',
      author_signature: p.author_signature || '',
      author_link: p.author_link || '',
    });
  }

  async function saveEdit(pn) {
    setMsg('');
    setBusy(true);
    const res = await fetch('/api/admin/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_number: pn, ...draft }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(json.error || 'Save failed.'); return; }
    setEditing(null);
    setMsg(`Page ${pn} updated.`);
    loadPages();
  }

  // ── Écran de connexion ──────────────────────────────────
  if (authed === null) {
    return <div className="admin"><div className="admin__panel admin__center">Loading…</div></div>;
  }

  if (authed === false) {
    return (
      <div className="admin">
        <form className="admin__login" onSubmit={login}>
          <h1>Admin</h1>
          <p className="admin__sub">Enter your password to manage the book.</p>
          {msg && <div className="admin__msg admin__msg--err">{msg}</div>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
          />
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? 'Checking…' : 'Log in'}
          </button>
          <a className="admin__home" href="/">← Back to the book</a>
        </form>
      </div>
    );
  }

  // ── Tableau de gestion ──────────────────────────────────
  return (
    <div className="admin">
      <div className="admin__panel">
        <div className="admin__topbar">
          <h1>Book admin</h1>
          <div className="admin__actions-top">
            <a className="btn btn--muted" href="/">Open the book</a>
            <button className="btn btn--muted" onClick={logout}>Log out</button>
          </div>
        </div>

        {msg && <div className="admin__msg">{msg}</div>}

        {pages.length === 0 ? (
          <p className="admin__empty">No pages yet.</p>
        ) : (
          <div className="admin__list">
            {pages.map((p) => {
              const st = statusOf(p);
              const isEditing = editing === p.page_number;
              return (
                <div className="admin__row" key={p.page_number}>
                  <div className="admin__row-head">
                    <span className="admin__pn">Page {p.page_number}</span>
                    <span className={`admin__tag admin__tag--${st.tone}`}>{st.label}</span>
                    <span className="admin__type">{p.content_type || '—'}</span>
                  </div>

                  {!isEditing ? (
                    <>
                      <p className="admin__text">{p.content_text || <em>— empty —</em>}</p>
                      <p className="admin__meta">
                        <strong>{p.author_signature || '—'}</strong>
                        {p.author_link ? <span className="admin__link"> · {p.author_link}</span> : null}
                      </p>
                      <div className="admin__row-actions">
                        {p.content_text && (
                          <button className="btn btn--muted" onClick={() => startEdit(p)} disabled={busy}>
                            Edit
                          </button>
                        )}
                        <button
                          className="btn btn--muted"
                          disabled={busy || !p.stripe_session_id}
                          onClick={() => act('/api/admin/refund', p.page_number,
                            `Refund €1 for page ${p.page_number}? (Stripe fees are not returned.)`,
                            `Page ${p.page_number} refunded.`)}
                        >
                          Refund
                        </button>
                        <button
                          className="btn btn--danger"
                          disabled={busy}
                          onClick={() => act('/api/admin/delete', p.page_number,
                            `Delete page ${p.page_number}? It becomes blank and buyable again.`,
                            `Page ${p.page_number} deleted.`)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="admin__edit">
                      <div className="admin__edit-formats">
                        <label>
                          <input type="radio" name={`t-${p.page_number}`} checked={draft.content_type === 'citation'}
                            onChange={() => setDraft((d) => ({ ...d, content_type: 'citation' }))} /> Quote
                        </label>
                        <label>
                          <input type="radio" name={`t-${p.page_number}`} checked={draft.content_type === 'histoire'}
                            onChange={() => setDraft((d) => ({ ...d, content_type: 'histoire' }))} /> Story
                        </label>
                      </div>
                      <textarea
                        rows={draft.content_type === 'citation' ? 3 : 8}
                        maxLength={LIMITS[draft.content_type].max}
                        value={draft.content_text}
                        onChange={(e) => setDraft((d) => ({ ...d, content_text: e.target.value }))}
                      />
                      <input type="text" placeholder="Signature" maxLength={60}
                        value={draft.author_signature}
                        onChange={(e) => setDraft((d) => ({ ...d, author_signature: e.target.value }))} />
                      <input type="text" placeholder="Link (optional)" maxLength={300}
                        value={draft.author_link}
                        onChange={(e) => setDraft((d) => ({ ...d, author_link: e.target.value }))} />
                      <div className="admin__row-actions">
                        <button className="btn btn--primary" onClick={() => saveEdit(p.page_number)} disabled={busy}>Save</button>
                        <button className="btn btn--muted" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
