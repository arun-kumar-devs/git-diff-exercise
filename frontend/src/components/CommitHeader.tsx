import { useState } from 'react';
import type { Commit } from '../types';
import { relativeTime, shortSha } from '../lib/format';
import { Icon } from './Icon';

interface Props {
  commit: Commit;
  owner: string;
  repository: string;
}

export function CommitHeader({ commit, owner, repository }: Props) {
  const [copied, setCopied] = useState(false);
  const copySha = async () => {
    try {
      await navigator.clipboard.writeText(commit.oid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permissions can be unavailable in some browsers/iframes.
    }
  };

  return (
    <header className="commit-header">
      <div className="breadcrumb">
        <span className="breadcrumb-owner">{owner}</span>
        <span className="breadcrumb-slash">/</span>
        <span>{repository}</span>
      </div>
      <div className="commit-main">
        <img className="avatar avatar-large" src={commit.author.avatarUrl} alt="" />
        <div className="commit-copy">
          <h1>{commit.subject}</h1>
          <div className="commit-meta">
            <span>By <strong>{commit.author.name}</strong></span>
            <span>{relativeTime(commit.author.date)}</span>
            <button className="sha-button" onClick={copySha} title="Copy commit SHA">
              <code>{shortSha(commit.oid)}</code>
              <Icon name={copied ? 'check' : 'copy'} />
            </button>
          </div>
        </div>
      </div>
      {commit.body.trim() && <p className="commit-body">{commit.body}</p>}
      <div className="commit-details">
        <span><span className="detail-label">Commit</span> <code>{shortSha(commit.oid)}</code></span>
        {commit.parents[0] && <span><span className="detail-label">Parent</span> <code>{shortSha(commit.parents[0].oid)}</code></span>}
      </div>
    </header>
  );
}
