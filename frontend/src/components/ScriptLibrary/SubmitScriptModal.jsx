import React, { useState } from 'react';
import { submitScript } from '../../services/scriptsAPI';
import './SubmitScriptModal.css';

export default function SubmitScriptModal({ isOpen, onClose, graph, theme }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const nodeCount = graph?.nodes?.length ?? 0;
  const linkCount = graph?.links?.length ?? 0;
  const isEmpty = nodeCount === 0;

  // ── tag helpers ────────────────────────────────────────────────────────
  const addTag = (raw) => {
    const tag = raw.trim().replace(/,+$/, '');
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]);
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag));

  // ── submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim() || isEmpty) return;

    // Flush any uncommitted tag text
    if (tagInput.trim()) addTag(tagInput);

    setSubmitting(true);
    setError(null);
    try {
      const res = await submitScript({
        name: name.trim(),
        description: description.trim(),
        author: author.trim(),
        tags,
        graph,
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setAuthor('');
    setTagInput('');
    setTags([]);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div
      className="ssm-overlay"
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div className="ssm-dialog" data-theme={theme}>
        {/* Header */}
        <div className="ssm-header">
          <span className="ssm-title">Save to Script Library</span>
          <button className="ssm-close-btn" onClick={handleClose}>✕</button>
        </div>

        {/* Success screen */}
        {result ? (
          <div className="ssm-success">
            <div className="ssm-success-icon">✓</div>
            <div className="ssm-success-heading">Script saved!</div>
            <div className="ssm-success-stats">
              {result.componentCount} components · {result.wireCount} wires
            </div>
            <div className="ssm-success-id">
              <span className="ssm-id-label">ID</span>
              <code className="ssm-id-value">{result.docId}</code>
            </div>
            <button className="ssm-btn-primary" onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Canvas preview banner */}
            <div className={`ssm-canvas-preview ${isEmpty ? 'ssm-preview-empty' : ''}`}>
              {isEmpty
                ? '⚠ The canvas is empty — add some components first.'
                : <>Canvas: <strong>{nodeCount}</strong> node{nodeCount !== 1 ? 's' : ''} · <strong>{linkCount}</strong> connection{linkCount !== 1 ? 's' : ''}</>
              }
            </div>

            {/* Form */}
            <div className="ssm-form">
              <label className="ssm-field">
                <span className="ssm-label">
                  Name <span className="ssm-required">*</span>
                </span>
                <input
                  className="ssm-input"
                  type="text"
                  placeholder="e.g. Parametric Box Grid"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isEmpty && name.trim() && handleSubmit()}
                  autoFocus
                />
              </label>

              <label className="ssm-field">
                <span className="ssm-label">Description</span>
                <textarea
                  className="ssm-input ssm-textarea"
                  placeholder="What does this script do?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </label>

              <label className="ssm-field">
                <span className="ssm-label">Author</span>
                <input
                  className="ssm-input"
                  type="text"
                  placeholder="Your name"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                />
              </label>

              <div className="ssm-field">
                <span className="ssm-label">Tags</span>
                <div className="ssm-tags-wrap">
                  {tags.map(tag => (
                    <span key={tag} className="ssm-tag">
                      {tag}
                      <button
                        className="ssm-tag-remove"
                        onClick={() => removeTag(tag)}
                        type="button"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <input
                    className="ssm-tags-input"
                    type="text"
                    placeholder={tags.length === 0 ? 'Type a tag and press Enter' : ''}
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => tagInput.trim() && addTag(tagInput)}
                  />
                </div>
                <span className="ssm-hint">Press Enter or comma to add a tag</span>
              </div>
            </div>

            {error && <div className="ssm-error">⚠ {error}</div>}

            {/* Footer */}
            <div className="ssm-footer">
              <button className="ssm-btn-cancel" onClick={handleClose}>
                Cancel
              </button>
              <button
                className="ssm-btn-primary"
                onClick={handleSubmit}
                disabled={!name.trim() || isEmpty || submitting}
              >
                {submitting ? 'Saving…' : 'Save Script'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
