import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CommitHeader } from './CommitHeader';
import type { Commit } from '../types';

const commit: Commit = {
  oid: 'a1bf367b3af680b1182cc52bb77ba095764a11f9',
  subject: 'Commit subject',
  body: 'Commit details',
  parents: [{ oid: 'b1bf367b3af680b1182cc52bb77ba095764a11f9' }],
  author: { name: 'Author', username: 'author', email: 'author@example.com', date: '2025-01-01T00:00:00Z', avatarUrl: 'https://example.com/avatar.png' },
  committer: { name: 'Author', email: 'author@example.com', date: '2025-01-01T00:00:00Z', avatarUrl: 'https://example.com/avatar.png' },
};

afterEach(() => cleanup());

describe('CommitHeader', () => {
  it('renders commit details, author username, body, and parent', () => {
    render(<CommitHeader commit={commit} />);
    expect(screen.getByText('Commit subject')).toBeInTheDocument();
    expect(screen.getByText('Commit details')).toBeInTheDocument();
    expect(screen.getByText('author')).toBeInTheDocument();
    expect(screen.getByText(commit.parents[0].oid)).toBeInTheDocument();
    expect(screen.queryByText(/Committed by/)).not.toBeInTheDocument();
  });

  it('shows a distinct committer and handles root commits without a parent', () => {
    const rootCommit = {
      ...commit,
      body: '   ',
      parents: [],
      committer: { ...commit.committer, name: 'Different committer' },
    };
    render(<CommitHeader commit={rootCommit} />);
    expect(screen.getByText(/Committed by/)).toHaveTextContent('Different committer');
    expect(screen.queryByText('   ')).not.toBeInTheDocument();
    expect(document.querySelector('.parent-commit-detail')).not.toBeInTheDocument();
  });
});