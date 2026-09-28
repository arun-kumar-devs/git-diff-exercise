import type { Commit } from '../types';
import { relativeTime } from '../lib/format';

/** Commit data required to render the commit summary and identity details. */
interface Props {
  commit: Commit;
}

/** Displays the commit message, author, committer, and parent identifiers. */
export function CommitHeader({ commit }: Props) {
  const authorDate = relativeTime(commit.author.date);
  const committerDate = relativeTime(commit.committer.date);

  const showCommitter =
    commit.committer.name !== commit.author.name ||
    commit.committer.date !== commit.author.date;

  return (
    <header className="commit-header">
      <div className="commit-main">
        <img
          className="avatar avatar-large"
          src={commit.author.avatarUrl}
          alt=""
        />

        <div className="commit-content">
          <span className="commit-subject">{commit.subject}</span>

          <div className="commit-meta">
            <span>
              Authored by <strong>{commit.author.username ?? commit.author.name}</strong>
            </span>
            <span>{authorDate}</span>
          </div>

          {commit.body.trim() && (
            <span className="commit-body">{commit.body}</span>
          )}
        </div>

        <div className="commit-details">
          {showCommitter && (
            <div className="committer-meta">
              <span>
                Committed by{' '}
                <strong>{commit.committer.name}</strong>
              </span>
              <span>{committerDate}</span>
            </div>
          )}

          <div className="current-commit-detail">
            <span className="detail-label">Commit</span>
            <code>{commit.oid}</code>
          </div>

          {commit.parents[0] && (
            <div className="parent-commit-detail">
              <span className="detail-label">Parent</span>
              <code>{commit.parents[0].oid}</code>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}