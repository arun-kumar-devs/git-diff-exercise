export interface Signature {
  name: string;
  email: string;
  date: string;
  avatarUrl: string;
}

export interface Commit {
  oid: string;
  subject: string;
  body: string;
  parents: Array<{ oid: string }>;
  author: Signature;
  committer: Signature;
}

export type ChangeKind = 'ADDED' | 'COPIED' | 'DELETED' | 'MODIFIED' | 'RENAMED' | 'TYPE_CHANGED';

export interface DiffLine {
  baseLineNumber: number | null;
  headLineNumber: number | null;
  content: string;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface FileDifference {
  changeKind: ChangeKind;
  baseFile: { path: string } | null;
  headFile: { path: string } | null;
  hunks: DiffHunk[];
}
