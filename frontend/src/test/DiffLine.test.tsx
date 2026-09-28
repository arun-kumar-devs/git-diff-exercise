import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DiffLine } from '../components/DiffLine';

describe('DiffLine', () => {
  it('renders an added line with a head line number', () => {
    render(<DiffLine line={{ baseLineNumber: null, headLineNumber: 42, content: '+const answer = 42;' }} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('const answer = 42;')).toBeInTheDocument();
    expect(document.querySelector('.addition')).toBeInTheDocument();
  });

  it('renders a removed line with a base line number', () => {
    render(<DiffLine line={{ baseLineNumber: 41, headLineNumber: null, content: '-const answer = 41;' }} />);
    expect(screen.getByText('41')).toBeInTheDocument();
    expect(screen.getByText('const answer = 41;')).toBeInTheDocument();
    expect(document.querySelector('.deletion')).toBeInTheDocument();
  });
});
