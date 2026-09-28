# Fleet Studio Git Diff Exercise

A full-stack TypeScript implementation of the Fleet Studio coding exercise. The application renders a Git commit page and its file-by-file diff for any public GitHub repository.

## Stack

- Frontend: React 19, TypeScript, Vite, React Router
- Backend: Node.js, Express, TypeScript
- Git provider: GitHub REST API
- Tests: Vitest, Supertest, React Testing Library

## Run

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
npm run dev
```

Frontend: http://localhost:1234
Backend: http://localhost:5000

Example page:

```text
http://localhost:1234/repositories/golemfactory/clay/commit/a1bf367b3af680b1182cc52bb77ba095764a11f9
```

The backend exposes the exercise contract at:

```text
GET http://localhost:5000/repositories/:owner/:repository/commits/:oid
GET http://localhost:5000/repositories/:owner/:repository/commits/:oid/diff
```

## GitHub authentication

The app works with public repositories without a token, subject to GitHub's unauthenticated rate limits. For a higher limit, create a GitHub personal access token with read access to the repositories you intend to inspect and set:

```text
GITHUB_TOKEN=...
```

Only the backend uses this token.

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

See [SOLUTION.md](./SOLUTION.md) for architecture, design decisions, limitations and future improvements.
