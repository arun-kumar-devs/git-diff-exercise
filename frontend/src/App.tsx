import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getCommit, getDiff } from './lib/api';
import type { Commit, FileDifference } from './types';
import { CommitHeader } from './components/CommitHeader';
import { DiffFile } from './components/DiffFile';
import { LoadingState, ErrorState } from './components/States';

const SHA_PATTERN = /^[0-9a-f]{40}$/;

export function CommitPage() {
  const { owner, repository, commitSHA } = useParams();
  const [commit, setCommit] = useState<Commit | null>(null);
  const [files, setFiles] = useState<FileDifference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!owner || !repository || !commitSHA) return;
    if (!SHA_PATTERN.test(commitSHA)) {
      setLoading(false);
      setError('The commit SHA must be a 40-character lowercase hexadecimal value.');
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([getCommit(owner, repository, commitSHA, controller.signal), getDiff(owner, repository, commitSHA, controller.signal)])
      .then(([commits, diff]) => {
        if (!commits.length) throw new Error('The API returned no commit metadata.');
        setCommit(commits[0]);
        setFiles(diff);
      })
      .catch((cause: unknown) => {
        if ((cause as { name?: string }).name !== 'AbortError') setError(cause instanceof Error ? cause.message : 'Something went wrong.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [owner, repository, commitSHA]);

  if (!owner || !repository || !commitSHA) return <Navigate to="/" replace />;

  return (
    <main className="page-shell">
      <div className="content-column">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && commit && (
          <>
            <CommitHeader commit={commit} owner={owner} repository={repository} />
            <section className="diff-summary">
              <div><strong>{files.length}</strong> {files.length === 1 ? 'changed file' : 'changed files'}</div>
              <div className="diff-legend"><span><i className="legend-add" />Added</span><span><i className="legend-remove" />Removed</span></div>
            </section>
            <section className="diff-list" aria-label="Commit diff">
              {files.length ? files.map((file, index) => <DiffFile key={`${file.headFile?.path ?? file.baseFile?.path}-${index}`} file={file} index={index} />) : <div className="empty-diff">This commit has no textual file differences.</div>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export function App() {
  return <CommitPage />;
}
