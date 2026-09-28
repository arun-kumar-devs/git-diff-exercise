/** Author or committer identity attached to a commit. */
export interface Signature {
  name: string;
  username?: string;
  email: string;
  date: string;
  avatarUrl: string;
}

/** Identifier of a direct parent commit. */
export interface ParentCommit {
  oid: string;
}

/** Commit details consumed by the commit header. */
export interface Commit {
  oid: string;
  subject: string;
  body: string;
  parents: ParentCommit[];
  author: Signature;
  committer: Signature;
}

/** Kind of file operation represented by a diff entry. */
export type ChangeKind =
  | 'ADDED'
  | 'COPIED'
  | 'DELETED'
  | 'MODIFIED'
  | 'RENAMED'
  | 'TYPE_CHANGED';

/** One diff row; a null number means that side has no corresponding line. */
export interface DiffLine {
  baseLineNumber: number | null;
  headLineNumber: number | null;
  content: string;
}

/** Header and rows for one unified-diff hunk. */
export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

/** Changed file and its old/new paths and available textual hunks. */
export interface FileDifference {
  changeKind: ChangeKind;
  baseFile: { path: string } | null;
  headFile: { path: string } | null;
  hunks: DiffHunk[];
}
