import type { DiffHunk as DiffHunkModel } from '../types';
import { DiffLine } from './DiffLine';

/** Renders a unified-diff hunk header followed by its numbered source lines. */
export function DiffHunk({ hunk }: { hunk: DiffHunkModel }) {
  return (
    <section className="diff-hunk">
      <div className="hunk-header"><span>{hunk.header}</span></div>
      <div className="diff-lines">
        {hunk.lines.map((line, index) => <DiffLine key={`${index}-${line.baseLineNumber}-${line.headLineNumber}`} line={line} />)}
      </div>
    </section>
  );
}
