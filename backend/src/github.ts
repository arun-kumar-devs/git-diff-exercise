import type { Commit, DiffHunk, DiffLine, FileDifference, Signature, ChangeKind } from './types.js';

const API_BASE = 'https://api.github.com';

export class GitHubApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string } | null;
    committer: { name: string; email: string; date: string } | null;
  };
  author: { login?: string; avatar_url?: string } | null;
  committer: { login?: string; avatar_url?: string } | null;
  parents: Array<{ sha: string }>;
  files?: GitHubFile[];
}

export interface GitHubFile {
  status: string;
  filename: string;
  previous_filename?: string;
  patch?: string;
}

function headers() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: headers() });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json() as { message?: string };
      if (body.message) detail = body.message;
    } catch {
      // Keep status text.
    }
    throw new GitHubApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

function splitMessage(message: string): { subject: string; body: string } {
  const [subject = '', ...rest] = message.split(/\r?\n/);
  while (rest.length && rest[0] === '') rest.shift();
  return { subject, body: rest.join('\n') };
}

function signature(raw: GitHubCommitResponse['commit']['author'], user: GitHubCommitResponse['author'] | null): Signature {
  const value = raw ?? { name: user?.login ?? 'Unknown', email: '', date: new Date(0).toISOString() };
  return {
    name: value.name,
    email: value.email,
    date: value.date,
    avatarUrl: user?.avatar_url ?? `https://github.com/${encodeURIComponent(user?.login ?? 'ghost')}.png`,
  };
}

export async function fetchCommit(owner: string, repository: string, oid: string): Promise<Commit> {
  const raw = await githubGet<GitHubCommitResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${oid}`);
  const { subject, body } = splitMessage(raw.commit.message);
  return {
    oid: raw.sha,
    subject,
    body,
    parents: raw.parents.map(parent => ({ oid: parent.sha })),
    author: signature(raw.commit.author, raw.author),
    committer: signature(raw.commit.committer, raw.committer),
  };
}

async function githubGetFilesPage(owner: string, repository: string, oid: string, page: number): Promise<GitHubFile[]> {
  const raw = await githubGet<GitHubCommitResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${oid}?per_page=100&page=${page}`);
  return raw.files ?? [];
}

export async function fetchFiles(owner: string, repository: string, oid: string): Promise<GitHubFile[]> {
  const files: GitHubFile[] = [];
  for (let page = 1; page <= 30; page += 1) {
    const pageFiles = await githubGetFilesPage(owner, repository, oid, page);
    files.push(...pageFiles);
    if (pageFiles.length < 100) break;
  }
  return files;
}

function parseHunkHeader(header: string) {
  const match = header.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
  if (!match) return null;
  return { base: Number(match[1]), head: Number(match[3]) };
}

export function parsePatch(patch: string | undefined): DiffHunk[] {
  if (!patch) return [];
  const lines = patch.replace(/\r\n/g, '\n').split('\n');
  const hunks: DiffHunk[] = [];
  let current: DiffHunk | null = null;
  let baseLine = 0;
  let headLine = 0;

  for (const rawLine of lines) {
    if (rawLine.startsWith('@@ ')) {
      const parsed = parseHunkHeader(rawLine);
      if (!parsed) continue;
      current = { header: rawLine, lines: [] };
      hunks.push(current);
      baseLine = parsed.base;
      headLine = parsed.head;
      continue;
    }

    if (!current || rawLine === '\\ No newline at end of file') continue;

    const prefix = rawLine.charAt(0);
    const content = prefix === '+' || prefix === '-' || prefix === ' ' ? rawLine : ` ${rawLine}`;
    if (prefix === '-') {
      current.lines.push({ baseLineNumber: baseLine++, headLineNumber: null, content });
    } else if (prefix === '+') {
      current.lines.push({ baseLineNumber: null, headLineNumber: headLine++, content });
    } else {
      current.lines.push({ baseLineNumber: baseLine++, headLineNumber: headLine++, content });
    }
  }
  return hunks;
}

function mapChangeKind(status: string): ChangeKind {
  switch (status) {
    case 'added': return 'ADDED';
    case 'copied': return 'COPIED';
    case 'removed': return 'DELETED';
    case 'renamed': return 'RENAMED';
    case 'changed': return 'TYPE_CHANGED';
    default: return 'MODIFIED';
  }
}

export function mapFile(file: GitHubFile): FileDifference {
  const deleted = file.status === 'removed';
  const added = file.status === 'added';
  const basePath = added ? null : (file.previous_filename ?? file.filename);
  const headPath = deleted ? null : file.filename;
  return {
    changeKind: mapChangeKind(file.status),
    baseFile: basePath ? { path: basePath } : null,
    headFile: headPath ? { path: headPath } : null,
    hunks: parsePatch(file.patch),
  };
}

export async function fetchDiff(owner: string, repository: string, oid: string): Promise<FileDifference[]> {
  const files = await fetchFiles(owner, repository, oid);
  return files.map(mapFile);
}
