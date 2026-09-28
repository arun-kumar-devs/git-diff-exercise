/** Loading feedback shown while commit metadata and diff requests are pending. */
export function LoadingState() {
  return <div className="state-card" role="status"><div className="spinner" /><h2>Loading commit</h2><p>Fetching commit metadata and file differences…</p></div>;
}

/** Error feedback with the message returned by the failed operation. */
export function ErrorState({ message }: { message: string }) {
  return <div className="state-card error-card" role="alert"><div className="error-mark">!</div><h2>Unable to load commit</h2><p>{message}</p><a href="/">Try another commit</a></div>;
}
