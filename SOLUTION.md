# SOLUTION.md

## 1. Approach

The implementation treats the supplied Figma file as the UI source of truth and the supplied OpenAPI contract as the backend contract. The browser route is intentionally separate from the backend API route.

Browser route:

`/repositories/:owner/:repository/commit/:commitSHA`

Backend contract:

`GET /repositories/:owner/:repository/commits/:oid`

`GET /repositories/:owner/:repository/commits/:oid/diff`

The frontend makes two requests in parallel after validating the route parameters. The backend translates GitHub's commit representation into the exercise's `Commit` model and translates GitHub unified patches into `CombinedFileDifference`/`DiffHunk`/diff-line models.

## 2. Architecture

```text
React Router
    |
    v
CommitPage
    |
    +--> GET /repositories/:owner/:repository/commits/:oid
    |
    +--> GET /repositories/:owner/:repository/commits/:oid/diff
                  |
                  v
             Express API
                  |
                  v
             GitHub REST
```

The frontend does not call GitHub directly. This keeps provider credentials, provider-specific response shapes, and transformation logic on the server.

## 3. GitHub integration

The GitHub REST commit endpoint is used for commit metadata and changed-file metadata. GitHub returns unified patches for textual file changes. The backend parses each patch into the exact diff-line representation required by the exercise API.

For every diff line:

- ` ` increments both base and head line numbers.
- `-` increments the base line number only.
- `+` increments the head line number only.
- `\\ No newline at end of file` is ignored as a metadata marker.

The hunk header is retained verbatim.

## 4. Figma implementation

The UI is implemented as reusable React components rather than a single large page component:

- `CommitHeader`
- `DiffFile`
- `DiffHunk`
- `DiffLine`
- `LoadingState`
- `ErrorState`

The diff is rendered with separate number and code columns, contextual lines, additions, deletions and hunk headers. File sections can be collapsed to keep large commits navigable. The layout becomes horizontally scrollable for long code lines on small screens rather than wrapping source code.

## 5. Validation and errors

The backend validates the SHA against the OpenAPI contract (`^[0-9a-f]{40}$`). Provider errors are mapped to useful HTTP responses. The frontend distinguishes invalid routes, loading failures and an empty diff.

## 6. Testing

Backend tests cover:

- unified patch parsing
- additions/deletions/context line numbers
- hunk parsing
- API response transformation
- invalid SHA handling

Frontend tests cover:

- commit metadata rendering
- additions/deletions/context styling
- collapsed file behavior
- loading and error states

## 7. Limitations / trade-offs

### GitHub patch availability

GitHub does not always provide a `patch` for binary files and may omit patches for very large changes. Those files are still represented in the API, but without line-level hunks. A future implementation could use Git blob/tree APIs to provide richer binary/file metadata where appropriate.

### Rate limits

Unauthenticated GitHub requests are subject to GitHub's rate limits. The backend supports `GITHUB_TOKEN` so the evaluator can run with authenticated API access.

### Caching

There is intentionally no persistent cache. Commit data is immutable for a specific SHA, so a production version could add a short-lived or content-addressed cache keyed by `owner/repository/sha` to reduce provider traffic.

### Comments/actions

The design contains visual affordances around the diff, but the exercise only requires displaying the commit and diff. No review/comment workflow is persisted because there is no corresponding backend contract.

## 8. What I would add with more time

1. **Contract validation** using a generated OpenAPI client or runtime schema validation so provider transformation regressions are detected at the boundary.
2. **Accessible keyboard interactions** for file collapse/expand and richer focus states.
3. **Virtualized rendering** for unusually large commits so thousands of diff lines do not all remain mounted.
4. **GitHub conditional requests** using ETags to reduce repeated API traffic.
5. **Observability** around GitHub latency, rate-limit responses and transformation failures.
6. **Visual regression tests** against exported Figma reference frames.
7. **Repository-level integration tests** using deterministic mocked GitHub responses so CI does not depend on external network availability.
