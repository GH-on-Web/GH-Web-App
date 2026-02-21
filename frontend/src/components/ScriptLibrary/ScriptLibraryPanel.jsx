import React, { useState, useEffect, useCallback } from 'react';
import { listScripts, getScript, deleteScript } from '../../services/scriptsAPI';
import './ScriptLibraryPanel.css';

export default function ScriptLibraryPanel({ isOpen, onClose, onOpenScript, theme }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [openingId, setOpeningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listScripts();
      setScripts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const filtered = scripts.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.author?.toLowerCase().includes(q) ||
      s.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  const handleOpen = async (script) => {
    setOpeningId(script.id);
    try {
      const doc = await getScript(script.id);
      onOpenScript(doc);
    } catch (err) {
      alert('Failed to load script: ' + err.message);
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (script) => {
    if (!window.confirm(`Delete "${script.name}"? This cannot be undone.`)) return;
    setDeletingId(script.id);
    try {
      await deleteScript(script.id);
      setScripts(prev => prev.filter(s => s.id !== script.id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Backdrop — closes panel when clicking outside */}
      {isOpen && <div className="slp-backdrop" onClick={onClose} />}

      <div className={`script-library-panel ${isOpen ? 'open' : ''}`} data-theme={theme}>
        <div className="slp-header">
          <span className="slp-title">Script Library</span>
          <div className="slp-header-actions">
            <button
              className="slp-icon-btn"
              onClick={load}
              disabled={loading}
              title="Refresh"
            >
              ↻
            </button>
            <button className="slp-icon-btn" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="slp-search-wrap">
          <span className="slp-search-icon">🔍</span>
          <input
            className="slp-search"
            type="text"
            placeholder="Search by name, author or tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="slp-search-clear" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        <div className="slp-body">
          {loading && (
            <div className="slp-state">
              <div className="slp-spinner" />
              Loading scripts…
            </div>
          )}

          {!loading && error && (
            <div className="slp-state slp-state-error">
              <span className="slp-state-icon">⚠</span>
              Could not connect to the script database.
              <small>{error}</small>
              <button className="slp-retry-btn" onClick={load}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="slp-state slp-state-empty">
              <span className="slp-state-icon">📂</span>
              {search
                ? 'No scripts match your search.'
                : 'No scripts saved yet.\nUse "Submit" to save your current canvas.'}
            </div>
          )}

          {!loading && !error && filtered.map(script => (
            <ScriptCard
              key={script.id}
              script={script}
              isOpening={openingId === script.id}
              isDeleting={deletingId === script.id}
              onOpen={handleOpen}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <div className="slp-footer">
          {scripts.length > 0 && (
            <span className="slp-count">
              {filtered.length} of {scripts.length} script{scripts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function ScriptCard({ script, isOpening, isDeleting, onOpen, onDelete }) {
  const date = script.created_at
    ? new Date(script.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="slp-card">
      <div className="slp-card-top">
        <span className="slp-card-name">{script.name}</span>
        <span className="slp-card-nodes">
          {script.component_count ?? '?'} nodes
        </span>
      </div>

      {script.description && (
        <p className="slp-card-desc">{script.description}</p>
      )}

      <div className="slp-card-meta">
        {script.author && (
          <span className="slp-meta-item slp-meta-author">
            <span className="slp-meta-icon">👤</span>{script.author}
          </span>
        )}
        {date && (
          <span className="slp-meta-item slp-meta-date">
            <span className="slp-meta-icon">📅</span>{date}
          </span>
        )}
      </div>

      {script.tags?.length > 0 && (
        <div className="slp-card-tags">
          {script.tags.map(tag => (
            <span key={tag} className="slp-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="slp-card-actions">
        <button
          className="slp-btn-open"
          onClick={() => onOpen(script)}
          disabled={isOpening}
        >
          {isOpening ? 'Loading…' : 'Open on Canvas'}
        </button>
        <button
          className="slp-btn-delete"
          onClick={() => onDelete(script)}
          disabled={isDeleting}
          title="Delete script"
        >
          {isDeleting ? '…' : '🗑'}
        </button>
      </div>
    </div>
  );
}
