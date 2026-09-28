export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Git Diff Viewer API',
    version: '1.0.0',
    description: 'Commit metadata and normalized file diffs from public GitHub repositories.',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local backend' }],
  tags: [{ name: 'Repositories', description: 'GitHub repository commits and diffs' }],
  paths: {
    '/repositories/{owner}/{repository}/commits/{oid}': {
      get: {
        tags: ['Repositories'],
        summary: 'Get commit information',
        description: 'Returns normalized commit metadata in a single-item array.',
        parameters: [
          { name: 'owner', in: 'path', required: true, schema: { type: 'string' }, description: 'GitHub repository owner.' },
          { name: 'repository', in: 'path', required: true, schema: { type: 'string' }, description: 'GitHub repository name.' },
          { name: 'oid', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-f]{40}$' }, description: 'Full 40-character lowercase commit SHA.' },
        ],
        responses: {
          '200': {
            description: 'Commit metadata.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Commit' } } } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimited' },
          '502': { $ref: '#/components/responses/UpstreamFailure' },
          '500': { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/repositories/{owner}/{repository}/commits/{oid}/diff': {
      get: {
        tags: ['Repositories'],
        summary: 'Get commit diff',
        description: 'Returns normalized changed-file records and parsed textual diff hunks. Files without patch text have an empty hunks array.',
        parameters: [
          { name: 'owner', in: 'path', required: true, schema: { type: 'string' }, description: 'GitHub repository owner.' },
          { name: 'repository', in: 'path', required: true, schema: { type: 'string' }, description: 'GitHub repository name.' },
          { name: 'oid', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-f]{40}$' }, description: 'Full 40-character lowercase commit SHA.' },
        ],
        responses: {
          '200': {
            description: 'Changed files and parsed diff hunks.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/FileDifference' } } } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimited' },
          '502': { $ref: '#/components/responses/UpstreamFailure' },
          '500': { $ref: '#/components/responses/ServerError' },
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string', description: 'Error details.' } },
      },
      Signature: {
        type: 'object',
        required: ['name', 'email', 'date', 'avatarUrl'],
        properties: {
          name: { type: 'string' },
          username: { type: 'string', description: 'GitHub username when available.' },
          email: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          avatarUrl: { type: 'string', format: 'uri' },
        },
      },
      Commit: {
        type: 'object',
        required: ['oid', 'subject', 'body', 'parents', 'author', 'committer'],
        properties: {
          oid: { type: 'string', pattern: '^[0-9a-f]{40}$' },
          subject: { type: 'string' },
          body: { type: 'string' },
          parents: { type: 'array', items: { type: 'object', required: ['oid'], properties: { oid: { type: 'string' } } } },
          author: { $ref: '#/components/schemas/Signature' },
          committer: { $ref: '#/components/schemas/Signature' },
        },
      },
      DiffLine: {
        type: 'object',
        required: ['baseLineNumber', 'headLineNumber', 'content'],
        properties: {
          baseLineNumber: { type: 'integer', nullable: true },
          headLineNumber: { type: 'integer', nullable: true },
          content: { type: 'string', description: 'Diff prefix and source line content.' },
        },
      },
      DiffHunk: {
        type: 'object',
        required: ['header', 'lines'],
        properties: {
          header: { type: 'string' },
          lines: { type: 'array', items: { $ref: '#/components/schemas/DiffLine' } },
        },
      },
      FileDifference: {
        type: 'object',
        required: ['changeKind', 'baseFile', 'headFile', 'hunks'],
        properties: {
          changeKind: { type: 'string', enum: ['ADDED', 'COPIED', 'DELETED', 'MODIFIED', 'RENAMED', 'TYPE_CHANGED'] },
          baseFile: { $ref: '#/components/schemas/FilePath' },
          headFile: { $ref: '#/components/schemas/FilePath' },
          hunks: { type: 'array', items: { $ref: '#/components/schemas/DiffHunk' } },
        },
      },
      FilePath: {
        type: 'object',
        nullable: true,
        required: ['path'],
        properties: { path: { type: 'string' } },
      },
    },
    responses: {
      BadRequest: { description: 'Invalid repository parameters or commit SHA.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      NotFound: { description: 'GitHub repository or commit was not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      RateLimited: { description: 'GitHub rejected the request, commonly due to rate limits or access restrictions.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      UpstreamFailure: { description: 'GitHub returned an upstream error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      ServerError: { description: 'Unexpected backend error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  },
} as const;