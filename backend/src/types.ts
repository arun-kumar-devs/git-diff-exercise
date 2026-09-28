/** Git author or committer identity and timestamp. */
export interface Signature {
  name: string;
  username?: string;
  email: string;
  date: string;
  avatarUrl: string;
}

/** Normalized commit record returned by the backend API. */
export interface Commit {
  oid: string;
  subject: string;
  body: string;
  parents: Array<{ oid: string }>;
  author: Signature;
  committer: Signature;
}

/** File operation reported for a commit diff. */
export type ChangeKind = 'ADDED' | 'COPIED' | 'DELETED' | 'MODIFIED' | 'RENAMED' | 'TYPE_CHANGED';

/** One diff row; null line numbers indicate that the row is absent on that side. */
export interface DiffLine {
  baseLineNumber: number | null;
  headLineNumber: number | null;
  content: string;
}

/** A unified-diff section and its parsed source lines. */
export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

/** Normalized change to a file, including its optional paths and textual hunks. */
export interface FileDifference {
  changeKind: ChangeKind;
  baseFile: { path: string } | null;
  headFile: { path: string } | null;
  hunks: DiffHunk[];
}
