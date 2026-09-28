# Git Diff Viewer

A full-stack responsive web application for viewing the code differences introduced by a specific commit from any public GitHub repository.

The application accepts a GitHub repository owner, repository name, and full commit SHA through the URL, retrieves the commit information and changed files through the backend, and renders the resulting diff in a UI based on the supplied Figma design.

---

## Features

- View a specific GitHub commit using its full commit SHA.
- Display commit subject, author, date, and commit metadata.
- Display the committer when the committer information differs from the author.
- Display the full commit SHA and parent commit SHA.
- Display changed files and their change types.
- Render diff hunks with:
  - Added lines
  - Deleted lines
  - Context lines
  - Base/head line numbers
- Support common file change types such as:
  - Added
  - Deleted
  - Modified
  - Renamed
  - Copied
  - Type changed
- Responsive layout based on the supplied Figma design.
- Backend integration with the GitHub REST API.
- Backend normalization of GitHub data into application-specific models.
- API and frontend error handling.
- Automated tests for core backend behaviour.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- CSS

### Backend

- Node.js
- Express
- TypeScript
- GitHub REST API

### Testing

- Vitest
- React Testing Library

---

## Project Structure

```text
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── github.ts
│   │   ├── server.ts
│   │   ├── types.ts
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── package.json
├── README.md
└── SOLUTION.md
```

The frontend and backend are kept as separate workspace applications while sharing a single repository and development workflow.

---

## Prerequisites

Before running the project, make sure you have:

- Node.js installed
- npm installed
- Internet access for GitHub API requests

Check your versions:

```bash
node --version
npm --version
```

Use a current LTS version of Node.js.

---

## Installation

Clone the repository:

```bash
git clone <YOUR_PUBLIC_GITHUB_REPOSITORY_URL>
```

Move into the project:

```bash
cd <REPOSITORY_NAME>
```

Install dependencies from the repository root:

```bash
npm install
```

The project uses npm workspaces, so installing from the root installs the frontend and backend workspace dependencies.

---

## Environment Variables

The backend can use a GitHub token when one is available.

Create a `.env` file for the backend if required by the local setup.

Example:

```env
GITHUB_TOKEN=your_github_token
```

Do not commit the real token to the repository.

If no token is configured, the application can use GitHub's unauthenticated API access, subject to GitHub's applicable rate limits.

---

## Running the Application

Start both frontend and backend in development mode:

```bash
npm run dev
```

The development setup uses:

```text
Frontend: http://localhost:1234
Backend:  http://localhost:5000
```

Open the frontend:

```text
http://localhost:1234
```

The frontend development server proxies API requests to the backend.

---

## Commit URL

The application uses the following route:

```text
/repositories/:owner/:repository/commit/:commitSHA
```

For example:

```text
/repositories/golemfactory/clay/commit/a1bf367b3af680b1182cc52bb77ba095764a11f9
```

The commit SHA should be the full 40-character hexadecimal SHA.

You can replace the owner, repository, and commit SHA with another public GitHub repository and commit:

```text
http://localhost:1234/repositories/<owner>/<repository>/commit/<full-commit-sha>
```

The repository and commit are not hardcoded into the data layer. The URL parameters determine which commit is requested from the backend.

---

## Application Flow

```text
Browser
   │
   │ /repositories/:owner/:repository/commit/:commitSHA
   ▼
React Router
   │
   │ owner / repository / commit SHA
   ▼
Frontend API layer
   │
   │ /api/repositories/...
   ▼
Express backend
   │
   ▼
GitHub REST API
   │
   ├── Commit metadata
   │
   └── Changed files / patches
   │
   ▼
Backend normalization
   │
   ├── Commit
   ├── FileDifference
   ├── DiffHunk
   └── DiffLine
   │
   ▼
React UI
```

The frontend does not send old and new source files to the backend. It sends the repository and commit identity through the URL. The backend obtains the commit information and patch data from GitHub.

---

## API Endpoints

### Get commit information

```http
GET /repositories/:owner/:repository/commits/:oid
```

Example:

```text
/repositories/golemfactory/clay/commits/a1bf367b3af680b1182cc52bb77ba095764a11f9
```

### Get commit diff

```http
GET /repositories/:owner/:repository/commits/:oid/diff
```

Example:

```text
/repositories/golemfactory/clay/commits/a1bf367b3af680b1182cc52bb77ba095764a11f9/diff
```

During frontend development, these backend endpoints are reached through the `/api` Vite proxy.

### Swagger documentation

The backend publishes an OpenAPI 3.0 specification and an interactive Swagger UI. Start the backend from the repository root:

```bash
npm run dev:backend
```

Then open the interactive API documentation at:

```text
http://localhost:5000/api-docs/
```

The raw OpenAPI JSON is available at `http://localhost:5000/openapi.json`. In Swagger UI, expand either endpoint, select **Try it out**, enter a GitHub owner, repository, and full 40-character commit SHA, then select **Execute**. The backend calls GitHub, so internet access is required; unauthenticated requests are subject to GitHub's rate limits. Configure `GITHUB_TOKEN` as described above to use an authenticated GitHub request.

### cURL and Postman

With the backend running, run either command from PowerShell to request the example commit from `golemfactory/clay`:

```powershell
curl.exe --request GET --url "http://localhost:5000/repositories/golemfactory/clay/commits/a1bf367b3af680b1182cc52bb77ba095764a11f9" --header "Accept: application/json"
```

```powershell
curl.exe --request GET --url "http://localhost:5000/repositories/golemfactory/clay/commits/a1bf367b3af680b1182cc52bb77ba095764a11f9/diff" --header "Accept: application/json"
```

To load either request into Postman, select **Import**, choose **Raw text**, paste the complete cURL command, and select **Continue** then **Import**. The imported request targets the local backend; the backend itself contacts GitHub.

---

## API Error Handling

The backend validates the repository and commit parameters before making the GitHub request.

External GitHub failures are converted into application-level HTTP responses so that the frontend does not need to understand GitHub's complete response format.

Examples include:

```text
400  Invalid request
404  Repository or commit not found
429  GitHub rate limit / access limitation
502  Upstream GitHub request failure
500  Unexpected server error
```

---

## Testing

Run the test suite from the repository root:

```bash
npm test
```

Individual workspace tests can also be run with:

```bash
npm run test:backend
npm run test:frontend
```

Backend tests are grouped under `backend/test` by parser, GitHub integration, and HTTP server behavior. Frontend tests live alongside their corresponding helpers and components, with route-level coverage in `frontend/src/App.test.tsx`.

The tests focus on behaviour that is important to preserve, including GitHub response mapping, diff parsing, validation, and UI behaviour.

The test strategy considers:

- Positive scenarios
- Negative scenarios
- Edge cases
- Corner cases

Examples include valid commits, invalid commit IDs, GitHub errors, added/deleted lines, empty commit bodies, missing patches, renamed files, and unusual diff structures.

Tests also provide a safety net for future optimisation. If parsing or rendering is changed to improve performance, the existing behavioural tests can verify that the resulting diff remains correct.

---

## Build

Build both applications:

```bash
npm run build
```

---

## Production Start

After building, the backend can be started with:

```bash
npm start
```

The exact deployment configuration may vary depending on the hosting environment.

---

## Design Reference

The UI was implemented against the Figma design supplied with the exercise.

The implementation uses Figma as the visual reference for:

- Layout
- Typography
- Spacing
- Colours
- Commit metadata placement
- Diff presentation
- Responsive behaviour

The sample repository, commit, author, and diff data shown in the design are treated as design examples rather than hardcoded application data.

---

## Intentional UI Decisions

### Committer

The committer information is displayed only when the committer differs from the author information represented by the commit.

### Breadcrumb

A breadcrumb was not added because it is not part of the supplied commit-page design.

### Copy action

A copy button was not added because it is not part of the required UI.

### Dynamic data

The example commit shown in the design is used as a convenient starting route, but the application can load another public repository and commit through the same URL structure.

---

## GitHub Integration

The backend communicates with GitHub rather than having React communicate directly with GitHub.

This keeps GitHub-specific API handling in one place and prevents UI components from depending directly on GitHub's response structure.

The backend converts the external GitHub representation into application-specific models before returning the data to the frontend.

Patch parsing and line-number calculation are also kept outside the presentation layer.

---

## Why the Repository Is Not Cloned

The application does not clone the GitHub repository and run a local `git diff`.

GitHub already provides the commit metadata and patch information required by the exercise. Using that information avoids repository cloning, local Git process execution, filesystem management, and potentially large repository downloads.

The application therefore focuses on transforming and presenting the diff supplied by GitHub.

---

## Known Limitations

The implementation is intentionally focused on the scope of the exercise.

Areas that could be expanded as the application grows include:

- More comprehensive handling of very large diffs.
- More explicit UI for files where GitHub does not provide patch content.
- More complete merge-commit parent handling.
- Runtime validation of external GitHub responses.
- Caching of immutable commit data.
- Additional accessibility refinement.
- More extensive end-to-end testing.

The reasoning behind these trade-offs and possible improvements is documented in `SOLUTION.md`.

---

## SOLUTION.md

`SOLUTION.md` contains the detailed engineering reasoning behind the implementation, including:

- Architectural decisions
- Technology choices
- GitHub integration approach
- Diff-processing approach
- Figma implementation decisions
- CSS maintainability decisions
- Testing approach
- Performance considerations
- Known limitations and trade-offs
- Potential future improvements

For the detailed reasoning behind the implementation, see:

```text
SOLUTION.md
```

---

## Submission

The project can be run from the repository root using:

```bash
npm install
npm run dev
```

The project can also be packaged using:

```bash
npm pack
```

The generated package does not need to include `node_modules`.
