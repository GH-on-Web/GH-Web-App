import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubmitScriptModal from './SubmitScriptModal';
import * as api from '../../services/scriptsAPI';

jest.mock('../../services/scriptsAPI');

const SAMPLE_GRAPH = {
  nodes: [
    { id: 'slider_x', guid: 'g1', nickname: 'X', x: 40, y: 40 },
    { id: 'pt',       guid: 'g2', nickname: 'Pt', x: 200, y: 40 },
  ],
  links: [
    { fromNode: 'slider_x', fromParam: '0', toNode: 'pt', toParam: 'X' },
  ],
};

const EMPTY_GRAPH = { nodes: [], links: [] };

function renderModal(props = {}) {
  return render(
    <SubmitScriptModal
      isOpen={true}
      onClose={jest.fn()}
      graph={SAMPLE_GRAPH}
      theme="light"
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
describe('SubmitScriptModal — rendering', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SubmitScriptModal isOpen={false} onClose={jest.fn()} graph={SAMPLE_GRAPH} theme="light" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the dialog title', () => {
    renderModal();
    expect(screen.getByText('Save to Script Library')).toBeInTheDocument();
  });

  it('shows current canvas node and connection counts', () => {
    renderModal();
    expect(screen.getByText(/2/)).toBeInTheDocument(); // node count
    expect(screen.getByText(/1/)).toBeInTheDocument(); // connection count
  });

  it('shows empty canvas warning when graph has no nodes', () => {
    renderModal({ graph: EMPTY_GRAPH });
    expect(screen.getByText(/canvas is empty/i)).toBeInTheDocument();
  });

  it('shows all form fields', () => {
    renderModal();
    expect(screen.getByPlaceholderText(/parametric box/i)).toBeInTheDocument(); // name
    expect(screen.getByPlaceholderText(/what does this script do/i)).toBeInTheDocument(); // description
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument(); // author
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('SubmitScriptModal — validation', () => {
  it('Save Script button is disabled when name is empty', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /save script/i })).toBeDisabled();
  });

  it('Save Script button is disabled when canvas is empty', () => {
    renderModal({ graph: EMPTY_GRAPH });
    expect(screen.getByRole('button', { name: /save script/i })).toBeDisabled();
  });

  it('Save Script button becomes enabled once name is typed', async () => {
    renderModal();
    const nameInput = screen.getByPlaceholderText(/parametric box/i);
    await userEvent.type(nameInput, 'My Script');
    expect(screen.getByRole('button', { name: /save script/i })).not.toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('SubmitScriptModal — tag input', () => {
  it('adds a tag chip on Enter', async () => {
    renderModal();
    const tagInput = screen.getByPlaceholderText(/type a tag/i);
    await userEvent.type(tagInput, 'parametric{enter}');
    expect(screen.getByText('parametric')).toBeInTheDocument();
  });

  it('adds a tag chip on comma', async () => {
    renderModal();
    const tagInput = screen.getByPlaceholderText(/type a tag/i);
    await userEvent.type(tagInput, 'geometry,');
    expect(screen.getByText('geometry')).toBeInTheDocument();
  });

  it('removes a tag chip when its × is clicked', async () => {
    renderModal();
    const tagInput = screen.getByPlaceholderText(/type a tag/i);
    await userEvent.type(tagInput, 'parametric{enter}');
    expect(screen.getByText('parametric')).toBeInTheDocument();

    // The tag chip's remove button is a child of the .ssm-tag span;
    // use getAllByRole and pick the one inside the tag (last ✕ after the header close)
    const removeBtns = screen.getAllByRole('button', { name: '✕' });
    const removeBtn = removeBtns.find(b => b.className === 'ssm-tag-remove');
    await userEvent.click(removeBtn);
    expect(screen.queryByText('parametric')).not.toBeInTheDocument();
  });

  it('does not add duplicate tags', async () => {
    renderModal();
    const tagInput = screen.getByPlaceholderText(/type a tag/i);
    await userEvent.type(tagInput, 'geo{enter}');
    await userEvent.type(tagInput, 'geo{enter}');
    expect(screen.getAllByText('geo')).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('SubmitScriptModal — submission', () => {
  beforeEach(() => {
    api.submitScript.mockResolvedValue({ docId: 'saved-doc-id', componentCount: 2, wireCount: 1 });
  });

  afterEach(() => jest.resetAllMocks());

  it('calls submitScript with name, description, author, tags, and graph', async () => {
    renderModal();

    await userEvent.type(screen.getByPlaceholderText(/parametric box/i), 'My Script');
    await userEvent.type(screen.getByPlaceholderText(/what does this script do/i), 'A description');
    await userEvent.type(screen.getByPlaceholderText(/your name/i), 'Nicolas');
    await userEvent.type(screen.getByPlaceholderText(/type a tag/i), 'parametric{enter}');

    await userEvent.click(screen.getByRole('button', { name: /save script/i }));

    await waitFor(() => {
      expect(api.submitScript).toHaveBeenCalledWith({
        name: 'My Script',
        description: 'A description',
        author: 'Nicolas',
        tags: ['parametric'],
        graph: SAMPLE_GRAPH,
      });
    });
  });

  it('shows success screen after successful submission', async () => {
    renderModal();
    await userEvent.type(screen.getByPlaceholderText(/parametric box/i), 'Test');
    await userEvent.click(screen.getByRole('button', { name: /save script/i }));

    await waitFor(() => {
      expect(screen.getByText('Script saved!')).toBeInTheDocument();
    });
    expect(screen.getByText('saved-doc-id')).toBeInTheDocument();
    expect(screen.getByText(/2 components/i)).toBeInTheDocument();
  });

  it('shows error message when API call fails', async () => {
    api.submitScript.mockRejectedValue(new Error('Neo4j unavailable'));
    renderModal();

    await userEvent.type(screen.getByPlaceholderText(/parametric box/i), 'Test');
    await userEvent.click(screen.getByRole('button', { name: /save script/i }));

    await waitFor(() => {
      expect(screen.getByText(/neo4j unavailable/i)).toBeInTheDocument();
    });
  });

  it('shows Saving… while submitting', async () => {
    // Make submitScript hang so we can catch the intermediate state
    api.submitScript.mockReturnValue(new Promise(() => {}));
    renderModal();

    await userEvent.type(screen.getByPlaceholderText(/parametric box/i), 'Test');
    await userEvent.click(screen.getByRole('button', { name: /save script/i }));

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('SubmitScriptModal — close behaviour', () => {
  it('calls onClose when Cancel is clicked', async () => {
    const onClose = jest.fn();
    render(
      <SubmitScriptModal isOpen={true} onClose={onClose} graph={SAMPLE_GRAPH} theme="light" />
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the × button is clicked', async () => {
    const onClose = jest.fn();
    render(
      <SubmitScriptModal isOpen={true} onClose={onClose} graph={SAMPLE_GRAPH} theme="light" />
    );
    // The close × button is the first one in the header
    const closeBtn = screen.getAllByRole('button').find(b => b.textContent === '✕');
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('resets form fields after close + reopen', async () => {
    const { rerender } = render(
      <SubmitScriptModal isOpen={true} onClose={jest.fn()} graph={SAMPLE_GRAPH} theme="light" />
    );

    await userEvent.type(screen.getByPlaceholderText(/parametric box/i), 'Typed Name');
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelBtn);

    // Reopen
    rerender(
      <SubmitScriptModal isOpen={true} onClose={jest.fn()} graph={SAMPLE_GRAPH} theme="light" />
    );

    expect(screen.getByPlaceholderText(/parametric box/i).value).toBe('');
  });
});
