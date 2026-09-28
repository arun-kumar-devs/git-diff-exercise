import type { DiffLine as DiffLineModel } from '../types';

export function DiffLine({ line }: { line: DiffLineModel }) {
  const prefix = line.content.charAt(0);
  const code = line.content.length ? line.content.slice(1) : '';
  const kind = prefix === '+' ? 'addition' : prefix === '-' ? 'deletion' : 'context';
  return (
    <div className={`diff-line ${kind}`}>
      <span className="line-number base-number">{line.baseLineNumber ?? ''}</span>
      <span className="line-number head-number">{line.headLineNumber ?? ''}</span>
      <span className="line-prefix">{prefix === ' ' ? '' : prefix}</span>
      <code className="line-code">{code || '\u00a0'}</code>
    </div>
  );
}
