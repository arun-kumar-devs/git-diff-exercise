import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { fetchCommit, fetchDiff, GitHubApiError } from './github.js';
import { openApiDocument } from './openapi.js';

/** Express application exposing the commit and diff endpoints. */
export const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.get('/openapi.json', (_req, res) => res.json(openApiDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

const SHA_PATTERN = /^[0-9a-f]{40}$/;

/** Validates route identifiers before making a request to GitHub. */
function validateParams(owner: string, repository: string, oid: string) {
  if (!owner || !repository) return 'Repository owner and name are required.';
  if (!SHA_PATTERN.test(oid)) return 'The commit ID must be a 40-character lowercase hexadecimal SHA.';
  return null;
}

/** Returns normalized commit metadata as a single-item array per the API contract. */
app.get('/repositories/:owner/:repository/commits/:oid', async (req, res) => {
  const { owner, repository, oid } = req.params;
  const validation = validateParams(owner, repository, oid);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const commit = await fetchCommit(owner, repository, oid);
    return res.json([commit]);
  } catch (error) {
    return handleError(error, res);
  }
});

/** Returns normalized per-file changes for the requested commit. */
app.get('/repositories/:owner/:repository/commits/:oid/diff', async (req, res) => {
  const { owner, repository, oid } = req.params;
  const validation = validateParams(owner, repository, oid);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const diff = await fetchDiff(owner, repository, oid);
    return res.json(diff);
  } catch (error) {
    return handleError(error, res);
  }
});

/** Maps provider failures to API statuses and hides unexpected server details. */
function handleError(error: unknown, res: express.Response) {
  if (error instanceof GitHubApiError) {
    const status = error.status === 404 ? 404 : error.status === 403 ? 429 : 502;
    return res.status(status).json({ message: `GitHub request failed: ${error.message}` });
  }
  return res.status(500).json({ message: 'Unexpected server error.' });
}

const port = Number(process.env.PORT ?? 5000);
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Git diff API listening on http://localhost:${port}`));
}
