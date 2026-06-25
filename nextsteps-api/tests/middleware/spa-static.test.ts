import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { registerSpaStatic } from '../../src/middleware/spa-static.js';
import { createAuthMiddleware } from '../../src/middleware/auth.js';

describe('registerSpaStatic', () => {
  let tempDir = '';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nextsteps-spa-'));
    fs.writeFileSync(path.join(tempDir, 'index.html'), '<html><body>spa</body></html>');
    fs.writeFileSync(path.join(tempDir, 'asset.txt'), 'static-file');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns false when index.html is missing', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nextsteps-empty-'));
    const app = express();

    expect(registerSpaStatic(app, emptyDir)).toBe(false);

    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it('serves static assets and falls back to index.html for client routes', async () => {
    const app = express();
    registerSpaStatic(app, tempDir);

    await request(app).get('/asset.txt').expect(200, 'static-file');
    await request(app).get('/maverick/dashboard').expect(200, '<html><body>spa</body></html>');
  });

  it('does not intercept /api routes', async () => {
    const app = express();
    app.get('/api/v1/health', (_req, res) => {
      res.status(200).json({ status: 'ok' });
    });
    registerSpaStatic(app, tempDir);

    await request(app).get('/api/v1/health').expect(200, { status: 'ok' });
    await request(app).get('/api/v1/missing').expect(404);
  });

  it('serves / without JWT when auth is scoped to /api/v1 only', async () => {
    const app = express();
    const requireAuth = createAuthMiddleware('test-secret');
    registerSpaStatic(app, tempDir);
    app.use('/api/v1', requireAuth);

    await request(app).get('/').expect(200, '<html><body>spa</body></html>');
    await request(app).get('/favicon.ico').expect(404);
  });
});
