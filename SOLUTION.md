# Fleet Studio Git Diff Exercise — Solution

## 1. Overview

I approached the exercise as a small full-stack application with one clear user journey: a user opens a URL containing a GitHub repository and commit SHA, and the application displays the commit information and the changes introduced by that commit.

The implementation is split into three responsibilities:

- **Frontend:** routing, data loading, page state, and rendering the commit/diff UI.
- **Backend:** GitHub API access, external-response mapping, and patch parsing.
- **GitHub:** the source of the actual commit metadata and changed-file information.

The supplied Figma was used as the visual reference, while the exercise/API contract was used to determine what data the application should expose. I kept the runtime data dynamic rather than hardcoding the sample repository, author, commit, or diff shown in the design.

The main goal was to solve the requested commit page without introducing infrastructure that the current problem does not need. At the same time, I kept the boundaries clear enough that caching, stronger validation, large-diff handling, or additional Git functionality could be added later without replacing the basic data flow.

---

## 2. How I Approached the Problem

I started from the required URL rather than from the UI components:

```text
/repositories/:owner/:repository/commit/:commitSHA
```

From that URL, the application needs three pieces of information:

```text
owner
repository
commitSHA
```

Those values are enough to identify the resource. The frontend does not need to know how GitHub stores the commit or how a patch is represented internally. It asks the backend for application-level data.

The resulting flow is:

```text
Browser URL
   ↓
React Router
   ↓
owner / repository / commit SHA
   ↓
Frontend API layer
   ↓
Backend
   ↓
GitHub REST API
   ↓
GitHub response
   ↓
Backend mapping / patch parsing
   ↓
Application data model
   ↓
React components
   ↓
Figma-based presentation
```

This separation became the main architectural decision for the implementation. It avoids putting GitHub-specific response handling into the UI and keeps the frontend concerned primarily with presenting the data.

---

## 3. Architecture and Project Structure

The repository is organized as an npm workspace with separate frontend and backend packages:

```text
/
├── package.json
├── frontend/
│   ├── package.json
│   └── src/
└── backend/
    ├── package.json
    └── src/
```

I chose this structure because the exercise has both frontend and backend responsibilities, but they still belong to the same application and need a simple shared development workflow.

The root scripts provide a single entry point for common operations such as development, building, testing, and starting the backend. This is simpler for the exercise than maintaining two unrelated repositories or two separate development instructions.

The trade-off is that a workspace introduces a small amount of package-management configuration. For this project, that overhead is lower than the friction of managing two independent projects.

### Frontend responsibility

The frontend is responsible for:

- interpreting the browser route;
- requesting commit and diff data;
- representing loading and error states;
- rendering commit metadata;
- rendering files, hunks, and lines;
- applying the visual design and responsive behavior.

### Backend responsibility

The backend is responsible for:

- validating repository and commit parameters;
- communicating with GitHub;
- keeping GitHub credentials server-side when configured;
- translating GitHub data into the application's model;
- parsing patch text into structured hunks and lines;
- normalizing upstream errors before returning them to the frontend.

This boundary is intentional. If GitHub changes its response shape, the backend integration layer should be the first place that needs to change rather than every React component that displays commit information.

---

## 4. Technology Choices

### React

React fits the structure of the page because the UI naturally breaks down into meaningful levels: commit metadata, file differences, hunks, and diff lines.

I considered the page primarily as a rendering problem rather than as a complex state-management problem. The application is read-only and centered around one commit, so React's component model is sufficient without adding another UI abstraction layer.

### TypeScript

TypeScript provides explicit contracts for the data crossing the backend/frontend boundary. The main application types represent concepts such as `Commit`, `Signature`, `FileDifference`, `DiffHunk`, and `DiffLine`.

This is useful here because the diff has several related structures and nullable values, for example a deleted line has a base line number but no head line number. Expressing that directly in the type makes the rendering logic easier to reason about.

TypeScript is a compile-time contract, not runtime validation. The current implementation therefore still trusts the JSON shape returned by the external API after parsing it, which is noted later as a possible hardening step.

### Express

Express is sufficient for the backend because the server has a small number of read-only endpoints and does not require a large framework or complex middleware architecture.

The backend mainly acts as an adapter between the browser and GitHub. Introducing a more extensive backend framework would add structure that the current exercise does not need.

### REST rather than GraphQL

I used GitHub's REST API because the required data maps naturally to the commit endpoint and its changed-file information. The application needs a commit, its parents, author/committer information, and the patches associated with changed files.

GraphQL could provide more selective field querying, but for this scope it would introduce another query model without solving a problem the application currently has. If the application later needed to combine many GitHub resources or aggressively customize field selection, GraphQL would become more attractive.

---

## 5. Application Data Model

The backend does not expose the raw GitHub response directly to React. It converts it into an application model:

```text
Commit
 ├── author: Signature
 ├── committer: Signature
 ├── parents: ParentCommit[]
 └── subject/body

FileDifference[]
 ├── changeKind
 ├── baseFile
 ├── headFile
 └── hunks[]
       └── lines[]
```

This was a deliberate boundary rather than a convenience type.

GitHub has its own response structure and naming conventions. The UI has a different concern: it needs to know that a line belongs to the base version, the head version, or both. It should not need to know how GitHub represented that information in its API response.

For example, the frontend consumes:

```ts
interface DiffLine {
  baseLineNumber: number | null;
  headLineNumber: number | null;
  content: string;
}
```

This lets the renderer make a simple decision about how a line should be displayed without understanding raw patch parsing rules.

The trade-off is that the backend contains mapping code. I consider that worthwhile because the mapping creates a stable application boundary and keeps provider-specific knowledge in one place.

---

## 6. Dynamic Repository and Commit URLs

The commit page is driven by route parameters rather than by a hardcoded repository.

For example:

```text
/repositories/golemfactory/clay/commit/a1bf367b3af680b1182cc52bb77ba095764a11f9
```

and another valid public repository/commit can use the same page structure.

The frontend obtains `owner`, `repository`, and `commitSHA` from the route and passes them to the API layer. There is no repository-specific data embedded in the page component.

The commit SHA is used as the primary identifier because it uniquely identifies the commit and does not depend on a branch name continuing to point to the same history.

The backend validates the SHA format before making the external request. This gives an invalid request a predictable response without unnecessarily contacting GitHub.

---

## 7. Default Example Route

The project has a known example commit as a convenient starting point when the application is opened during development.

That default is only an entry point. It is not the source of the application's data model or rendering logic.

The important distinction is:

```text
Default route
     ↓
provides a known example

Actual page logic
     ↓
uses route parameters
     ↓
fetches the requested repository/commit
```

This makes the application easy for a reviewer to run while still supporting arbitrary public repositories and full commit SHAs through the same page.

---

## 8. Frontend Route and Backend API Boundary

The browser-facing route and the backend API represent different concerns.

Frontend:

```text
/repositories/:owner/:repository/commit/:commitSHA
```

Backend resources:

```text
/repositories/:owner/:repository/commits/:oid
/repositories/:owner/:repository/commits/:oid/diff
```

This distinction matters during local development because a Vite development server can proxy matching paths to the backend. The development proxy therefore needs to distinguish browser navigation from API requests rather than treating every `/repositories/...` request as an API call.

The intended development arrangement is to give API requests their own prefix, such as `/api`, and proxy that prefix to the backend. The browser route can then remain a normal frontend route.

This avoids a situation where opening a valid frontend URL directly causes the development server to send the request to Express, where no matching `/commit/...` API route exists.

---

## 9. Frontend API Layer

API calls are kept outside the React components in a small API module.

Instead of a component knowing how to construct every URL and parse every response, it can request the application data through functions such as:

```text
getCommit(owner, repository, oid)
getDiff(owner, repository, oid)
```

This keeps three concerns separate:

```text
Component
   ↓
API function
   ↓
HTTP request
```

The API module also provides a natural place to handle response parsing and request cancellation without mixing those details into presentation code.

If the backend URL structure changes later, the API module is one of the main places that needs updating rather than every component that consumes the data.

---

## 10. Request Lifecycle

A normal page load follows this sequence:

1. React Router identifies the repository and commit from the URL.
2. The page starts loading the required data.
3. The frontend requests commit metadata and diff data from the backend.
4. The backend validates the parameters.
5. The backend requests the corresponding GitHub data.
6. GitHub-specific responses are mapped into application types.
7. Patch text is parsed into hunks and lines.
8. The normalized result is returned to the frontend.
9. React renders the commit information and file differences.

The frontend therefore does not need to reconstruct the Git history itself.

Request cancellation is also useful when the route changes while a request is in progress. The previous request is no longer relevant to the new page, so cancellation prevents unnecessary work and reduces the chance of stale data being applied after navigation.

---

## 11. GitHub Integration

The backend uses GitHub's REST API as the external data source.

The integration is isolated in `github.ts`. That module is responsible for making GitHub requests, interpreting the response, and converting it into the application's model.

The GitHub token, when provided, is read from the backend environment rather than being included in browser code. This keeps credentials out of the client bundle.

### Why I did not clone the repository

Another possible implementation would have been to clone the repository on the server, check out the parent and target commits, and run a local `git diff`.

I did not choose that approach because GitHub already provides the changed-file and patch information required by the exercise. Cloning introduces additional work and operational concerns:

- downloading potentially large repositories;
- invoking and managing Git processes;
- temporary filesystem management;
- additional server resource consumption;
- more complicated cleanup and failure handling.

For the requested read-only diff page, using GitHub's existing commit data is a more direct solution.

The trade-off is that the application works from the patch information supplied by GitHub rather than having complete local access to both repository states. That is sufficient for the exercise's diff viewer, but it would be a limitation if future requirements needed arbitrary file reconstruction or repository-wide analysis.

---

## 12. Why the Browser Does Not Send Before/After Files

The frontend only needs to send the repository identity and commit SHA.

It does not send an old file and a new file to the backend.

The data flow is:

```text
Browser
  ↓
owner + repository + commit SHA
  ↓
Backend
  ↓
GitHub
  ↓
changed files + patches
```

The patch already contains the information needed to render the relevant changed sections. The backend parses that patch into a structure that is easier for the frontend to consume.

This avoids transferring complete source files when the requirement is to display the commit diff.

---

## 13. Commit Mapping and Message Handling

GitHub's commit message is split into a subject and body. The first line is treated as the subject and the remaining message content as the body.

This matches the structure shown in the design: the subject is the primary heading, while the optional body belongs with the main commit content.

The commit object also retains the parent SHA values, allowing the UI to display the parent information without requiring another lookup just to identify the parent.

The mapping layer also distinguishes the Git commit signature from GitHub's associated user object. This matters because the name stored in the Git commit and the GitHub login are not guaranteed to be the same value.

---

## 14. Author and Committer Handling

Git commits have both an author and a committer. GitHub can also associate those signatures with GitHub user accounts.

I use the commit signature information for the displayed name and date because that represents the actual Git commit metadata. The associated GitHub user data is used where available for the avatar.

This also explains why the displayed author name may differ from a GitHub username. A commit can contain a name such as `Michael Lively` while the associated GitHub account can have a login such as `Yoyokrayz`. Those values represent different pieces of information and should not be assumed to be interchangeable.

### Conditional committer display

The Figma design indicates that the committer row is only shown when the committer information differs from the author information.

The implementation therefore compares the author and committer name/date and only renders the additional committer row when there is a meaningful difference.

This keeps the normal case visually simpler while still representing commits where the person who committed differs from the person who authored the change.

---

## 15. Commit Body Placement

The commit subject, author information, and optional commit body belong to the main content area rather than being treated as unrelated metadata.

The right-side details area is reserved for information such as the committer, commit SHA, and parent SHA.

This follows the structure of the supplied design instead of reorganizing the information merely because the data model happens to contain those fields.

---

## 16. Intentional UI Scope

I treated the supplied Figma as the visual source of truth for the required commit page and avoided adding functionality that was not part of that design or exercise scope.

In particular, I did not add a breadcrumb or a copy button when those elements were not part of the intended final design.

I also did not turn the application into a general GitHub browser. Repository browsing, branch navigation, commit history, pull-request views, and other GitHub features are outside the requested page.

The sample data in Figma is treated as design content, not as application state. The actual page is populated from the repository and commit in the URL.

---

## 17. Git Diff Processing

GitHub provides file-level information and patch text. The backend converts that information into the application's diff model.

The resulting hierarchy is:

```text
FileDifference
   ↓
DiffHunk
   ↓
DiffLine
```

A file records its change type and old/new path information. A hunk records the hunk header and the lines belonging to that hunk. A line records the base and head line numbers and the original line content.

This structure maps closely to what the UI needs to render.

### Why patch parsing belongs in the backend

Raw patch syntax is a data-format concern rather than a presentation concern.

If React received raw patch text, the UI would need to understand:

- hunk headers;
- `+`, `-`, and context prefixes;
- base and head line counters;
- special patch markers.

That would couple the presentation layer to Git patch syntax.

Instead, the backend converts the patch once and sends a representation that is already meaningful to the UI. React can then concentrate on layout, styling, and interaction.

### Hunk and line numbers

A hunk header such as:

```text
@@ -10,4 +10,5 @@
```

provides the starting positions for the base and head versions.

The parser maintains two counters. A removed line advances the base counter, an added line advances the head counter, and a context line advances both. The result is stored explicitly on each `DiffLine`.

This is important because the UI has two line-number columns: one for the previous version and one for the new version.

### Change classification

GitHub statuses are mapped into the application's `ChangeKind` values such as `ADDED`, `DELETED`, `MODIFIED`, and `RENAMED`.

For added files there is no base path, while deleted files have no head path. Renamed files can use GitHub's previous filename to preserve both sides of the path information.

The UI therefore does not need to understand GitHub's status strings directly.

---

## 18. Files Without Patch Data

A GitHub file response does not always contain a patch that can be displayed as normal text. Binary or otherwise unavailable diff content is an example.

The current model represents this by producing a file with no parsed hunks when patch data is unavailable.

This is sufficient for the current scope, but the UI could be more explicit in a future iteration by showing that a file was changed but that a textual diff is unavailable. That would avoid making an empty diff area ambiguous.

---

## 19. Multiple Parents and Merge Commits

The backend model preserves all parent SHAs returned by GitHub rather than reducing the data model to a single parent.

The current presentation focuses on the first parent because the exercise only requires the commit page and does not define parent-selection behavior.

For merge commits, a future version could expose the available parents and allow the user to choose which parent the diff should be compared against. That would be a product decision as well as a UI change, so I did not invent that interaction for the current exercise.

---

## 20. Frontend Component Structure

The UI is divided around meaningful responsibilities rather than individual HTML elements.

The main conceptual structure is:

```text
Commit page
 ├── CommitHeader
 └── FileDiff[]
       └── DiffHunk[]
             └── DiffLine[]
```

`CommitHeader` owns commit-level information such as the subject, author, optional committer, SHA, and parent.

`FileDiff` represents a changed file and its file-level metadata.

`DiffHunk` represents one hunk within a file.

`DiffLine` is responsible for the visual representation of an individual diff row.

These boundaries correspond to the actual structure of the data and the visual design, which makes them easier to reason about than a single component containing all of the rendering logic.

I also avoided turning every small visual element into a separate component. The purpose of a component boundary here is to isolate a meaningful responsibility, not to maximize the number of files.

---

## 21. State Management and Data Loading

The page has a small amount of state: loading, commit data, diff data, and errors. There is no current requirement for shared client state across many pages or for complex mutations.

For that reason, I kept the state local to the page rather than introducing Redux or another global state library.

The API layer is also deliberately small instead of introducing a dedicated data-fetching framework. A framework such as React Query would become more useful if the application grew to multiple resources requiring caching, background refetching, invalidation, or mutations.

For the current read-only page, introducing that additional abstraction would add configuration and concepts without solving a current problem.

---

## 22. Figma to Implementation

I treated the Figma file as the visual reference rather than attempting to infer the design from the API data.

The implementation follows the main visual relationships shown in the design:

- commit information is presented as the page header/content area;
- author and date information are visually secondary to the commit subject;
- commit and parent identifiers are presented as metadata;
- the diff is organized by file and hunk;
- added and removed lines have distinct visual treatments;
- the layout adapts when the available width becomes smaller.

The Figma sample repository and commit are not treated as fixed application values. They are examples used to establish the visual structure.

Where the design included a behavior annotation, such as the conditional committer row, I treated that as part of the intended behavior rather than as decorative text.

---

## 23. Styling and CSS Architecture

The styling approach is based on regular CSS classes and shared CSS custom properties rather than scattering visual values throughout component code.

For example, repeated design values can be represented through variables such as:

```css
:root {
  --muted: #6D727C;
  --body: #39496A;
}
```

The purpose of this is primarily consistency and maintainability. If a design value changes, it can be updated in one place rather than searching through many unrelated selectors.

Where a visual treatment has a reusable semantic meaning, a class such as `.muted` can be combined with an existing component class:

```tsx
<span className="commit-date muted">...</span>
```

This is preferable to duplicating the same color value in `.commit-date`, `.detail-label`, and other selectors.

I would not create a reusable abstraction for every individual CSS property. Reuse is most useful when it represents a real design concept or repeated visual pattern. Otherwise it can make simple styles harder to locate and understand.

### Controlled styling extension

Reusable components can expose a `className` or a small semantic variant when an outside context needs to adjust presentation.

This keeps styling decisions from becoming coupled to component logic. A design adjustment should normally be possible by changing styles or an explicitly supported styling extension rather than rewriting the component's data or rendering behavior.

At the same time, I would avoid exposing a separate styling prop for every internal element because that would make the component's implementation details part of its public API.

---

## 24. Responsive Design

The Figma reference is primarily desktop-oriented, but the page is implemented as a responsive layout rather than assuming a fixed desktop width.

The main consideration is preserving the hierarchy of information as the viewport becomes narrower. Secondary commit metadata can move or stack, while the code diff itself needs to remain readable and may require horizontal scrolling rather than aggressively wrapping source code.

This is an important distinction for a code viewer: wrapping long source lines can make the relationship between code and line numbers harder to follow. Preserving the code's horizontal structure is generally more useful than forcing every line into the viewport.

---

## 25. Error Handling

There are two main classes of failure: invalid application input and failure while communicating with GitHub.

The backend validates the repository parameters and commit SHA before making an external request. GitHub failures are then mapped into a smaller set of application-level responses instead of exposing the entire upstream response contract to the frontend.

For example, a missing repository or commit can be represented as a not-found response, while an upstream rate-limit condition can be represented separately from an unexpected GitHub failure.

This gives the frontend a predictable error shape and keeps GitHub-specific status handling inside the backend.

A future UI improvement would make these states more actionable, for example distinguishing “commit not found” from “GitHub rate limit reached” and providing an appropriate retry path where retrying makes sense.

---

## 26. Security and Reliability Considerations

The GitHub token is kept on the server when authentication is configured. It is not part of the frontend application or browser request.

The API validates route parameters at the backend boundary rather than relying only on GitHub to reject malformed input.

The current CORS configuration is convenient for local development. If the service were deployed publicly, I would restrict it to the known frontend origin rather than allowing unrestricted cross-origin requests.

A publicly deployed API would also need application-level rate limiting so that one client cannot generate an excessive number of upstream GitHub requests.

The current external-response handling uses TypeScript types to describe the expected data but does not perform runtime schema validation. That is acceptable for the exercise, but a production service could validate GitHub responses before mapping them into the internal model.

---

## 27. Performance Considerations

I treated performance primarily as a matter of avoiding unnecessary work rather than adding optimizations everywhere.

At the network level, the application requests only the commit information and diff information needed for the page. At the data-processing level, the patch is parsed once on the backend before being sent to React.

At the rendering level, the component structure keeps file, hunk, and line responsibilities separated. I would not add `useMemo`, `useCallback`, or `React.memo` everywhere without evidence that repeated rendering is a problem. Those tools are useful when they address a measured cost, but they also add dependency and maintenance complexity.

The largest potential rendering problem is an unusually large diff. If real usage showed that thousands of rendered rows were causing slow scrolling or excessive memory use, virtualization would be a reasonable next step. It is not necessary to introduce that complexity simply because it is technically possible.

The CSS variables and reusable classes discussed earlier are primarily maintainability optimizations. I would not describe them as a major runtime performance optimization.

---

## 28. Testing Approach

The most important tests are around the transformations where incorrect logic could produce a visually incorrect diff even though the application itself appears to work.

### Unit-level logic

Functions such as patch parsing, commit-message splitting, and GitHub file mapping are deterministic and therefore good candidates for focused tests.

For patch parsing, tests should cover at least:

- context lines;
- additions;
- deletions;
- multiple hunks;
- line-number progression;
- files without patch content;
- the “no newline at end of file” marker.

### API behavior

Backend tests should verify parameter validation and the mapping of external failures to application responses.

### Component behavior

The UI tests should focus on behavior that comes directly from the requirements and design, such as rendering the commit subject, showing the optional commit body, conditionally showing the committer, and representing added/deleted/context lines correctly.

### Browser-level testing

A small end-to-end test would be useful for verifying that a real route can be opened and results in the expected page state. This is especially useful for catching development/proxy routing problems that isolated component tests cannot detect.

---

## 29. Why GitHub Calls Should Be Mocked in Tests

Tests should not depend on GitHub being available at the exact moment the test suite runs.

Calling the real service from every test would make the suite sensitive to:

- network availability;
- GitHub rate limits;
- changes in public repositories;
- upstream response timing.

Mocking the GitHub boundary allows the tests to focus on the application's behavior. The GitHub adapter can be tested with representative responses, while the rest of the application can be tested without an external network dependency.

This also makes it possible to create deterministic cases that may be difficult to reproduce reliably with public repositories, such as malformed data or particular patch structures.

---

## 30. Known Limitations and Trade-offs

### GitHub remains an external dependency

The page depends on GitHub being available and on the requested repository and commit being accessible. A valid application request can therefore still fail because of an upstream problem or rate limit.

I accepted this because GitHub is the required source of repository data for the exercise. Adding a persistent cache or mirrored repository service would be disproportionate to the current scope.

### Patch data is not equivalent to complete repository contents

The application displays the patch supplied by GitHub rather than reconstructing both complete repository states locally. This keeps the architecture simple but means it is not intended to be a full source-history analysis tool.

### Large diffs can increase browser rendering cost

A diff viewer can naturally produce a large number of DOM elements. The current implementation is appropriate for normal commit sizes, but very large commits may eventually require virtualization or incremental rendering.

### Files without textual patches are not fully represented visually

The data model can represent a changed file without parsed hunks, but the UI could communicate the reason more clearly. This is particularly relevant for binary files or changes for which GitHub does not provide normal patch text.

### Merge commits are only partially represented in the UI

All parents are preserved in the backend model, but the current page does not provide a parent-selection interaction. Supporting that fully would require a clearer product decision about how a merge diff should be presented.

### External responses are not runtime-validated

The TypeScript interfaces describe the expected response, but they do not validate the actual JSON at runtime. This is acceptable for the exercise and is a clear place for production hardening.

---

## 31. Deliberate Non-Goals

I intentionally kept the implementation focused on the required commit page.

The following are outside the current scope:

- repository browsing;
- branch browsing;
- commit history navigation;
- pull-request pages;
- authentication UI;
- repository cloning;
- full repository file reconstruction;
- collaborative editing or commenting;
- general GitHub administration features.

Not implementing these features was a scope decision rather than a technical limitation. Adding them would increase the amount of application state and navigation without improving the required commit-diff experience.

---

## 32. What I Would Add With More Time

I would prioritize improvements based on actual user impact rather than adding infrastructure simply because it is available.

### Better handling of unavailable diffs

I would make the UI explicitly state when a file changed but GitHub did not provide displayable patch content. This would remove ambiguity from an empty diff area and make binary-file behavior clearer.

### Runtime validation at the GitHub boundary

I would add runtime schema validation to the external response before mapping it into the application's types. The reason is different from TypeScript: TypeScript protects the code at development time, while runtime validation protects the running application from unexpected external data.

### Caching for repeated commit requests

If the application were deployed and multiple users frequently opened the same commits, I would cache commit/diff results using the repository and immutable commit SHA as the key. This would reduce repeated GitHub requests and improve response time. I would add it only when actual usage justified the operational complexity of a cache.

### Improved error states

I would give the frontend more specific states for cases such as a missing commit, GitHub rate limiting, and temporary upstream failures. The goal would be to tell the user what happened and whether retrying is useful instead of presenting every failure in the same way.

### Large-diff rendering

If profiling showed that large commits were causing noticeable browser slowdown, I would introduce virtualization or incremental rendering for diff lines. I would not add it before that because a virtualized code viewer is more complex than a normal list and can affect scrolling, accessibility, and variable-height content.

### Accessibility improvements

I would add stronger keyboard navigation, focus behavior, semantic structure, and non-color indicators for added/removed lines. A code diff currently communicates a lot visually, so accessibility needs to ensure that meaning is not dependent only on background color.

### Merge-parent support

If the product needed to support merge commits more completely, I would expose the available parent commits and let the user choose the comparison parent. This should be driven by an explicit product requirement because there are different reasonable ways to present merge diffs.

### Production hardening

For a deployed service, I would restrict CORS, add API rate limiting, add structured logging/monitoring, and add CI checks for type checking, tests, and builds. These changes improve operational reliability rather than changing the core UI architecture.

---

## 33. Why These Improvements Were Not Added Immediately

The exercise is centered on one read-only commit page. I therefore prioritized correctness of the data flow, fidelity to the supplied design, clean separation between GitHub integration and presentation, and testable transformation logic.

Some future improvements are valuable only after the application has evidence that they are needed. For example, caching is most useful when the same data is requested repeatedly, and virtualization is most useful when large diffs actually create a rendering problem.

This was the general trade-off throughout the implementation: prefer a simple solution that directly satisfies the current requirement, but keep the boundaries clean enough that a more sophisticated solution can be introduced later without rewriting the whole page.

---

## 34. Final Engineering Summary

The implementation is intentionally focused, but the boundaries are designed around the actual responsibilities of the application.

The browser identifies the commit through the URL. The backend owns GitHub communication and converts provider-specific data into an application model. Patch parsing happens before presentation so the React layer does not need to understand Git's patch syntax. The frontend then renders that model according to the supplied Figma design.

I avoided adding global state, repository cloning, a second API abstraction, or large performance frameworks because the current problem does not require them. Where those tools could become useful at a larger scale, the document identifies the condition that would justify introducing them.

The main trade-off is therefore deliberate simplicity: the solution is designed to solve the requested commit-diff problem cleanly rather than prematurely turning the exercise into a full GitHub client or production-scale code-hosting platform.


### Test coverage as a way to validate behaviour and guide optimisation

I would expand the test coverage around the parts of the application where incorrect data or unusual input can produce incorrect UI results. The tests would not be limited to successful API responses.

I would cover the following categories:

- **Positive scenarios:** valid repository, valid 40-character commit SHA, successful commit metadata, normal modified files, added/deleted files, and patches containing context/addition/deletion lines.
- **Negative scenarios:** invalid SHA, missing repository/commit, GitHub 404 responses, upstream failures, rate-limit responses, and malformed or unavailable patch data.
- **Edge scenarios:** empty commit message body, commits with no changed files, files without a patch, renamed files, copied files, and unusually large numbers of changed lines.
- **Corner cases:** multiple parents on merge commits, unusual hunk ranges, consecutive additions/deletions, files containing spaces or special characters in their paths, and patches with a missing final newline.

The main value of these tests is not simply increasing the test count. They establish the expected behaviour at the boundaries of the application and make future changes safer. In particular, the patch parser and GitHub-to-application mapping are good candidates for focused tests because a small parsing or mapping change can affect the rendered diff substantially.

Tests can also support optimisation work. Before changing rendering or data-processing behaviour for performance, I would establish tests that verify the output remains identical for representative normal, large, and unusual inputs. This allows implementation details to be optimised without changing the functional contract. Performance-specific checks can then be added where there is an actual measured bottleneck rather than optimising code speculatively.

For example, if a large diff later requires a different rendering strategy, the existing parser and component tests can verify that additions, deletions, context lines, line numbers, and file boundaries remain correct after the optimisation.

