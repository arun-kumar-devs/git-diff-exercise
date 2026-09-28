import { useState } from 'react';
import type { FileDifference } from '../types';
import { changeLabel } from '../lib/format';
import { Icon } from './Icon';
import { DiffHunk } from './DiffHunk';

/** Renders one changed file with a control to expand or collapse its hunks. */
export function DiffFile({ file, index }: { file: FileDifference; index: number }) {
  const [open, setOpen] = useState(true);
  const path = file.headFile?.path ?? file.baseFile?.path ?? 'Unknown file';
  const oldPath = file.baseFile?.path;
  const renamed = file.changeKind === 'RENAMED' && oldPath && oldPath !== path;

  return (
    <article className="diff-file">
      <button className="file-header" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <span className={`chevron ${open ? 'open' : ''}`}><Icon name="chevron" /></span>
        <span className="file-path">{renamed ? `${oldPath} → ${path}` : path}</span>
      </button>
      {open && (
        <div className="file-content">
          {file.hunks.length ? file.hunks.map((hunk, hunkIndex) => <DiffHunk key={`${index}-${hunkIndex}`} hunk={hunk} />) : (
            <div className="empty-hunk">No textual diff is available for this file.</div>
          )}
        </div>
      )}
    </article>
  );
}
