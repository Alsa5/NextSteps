import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type RequestHandler } from 'express';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/** Built Vite output copied here before Azure ZIP deploy. */
export const resolvePublicDir = (): string => path.join(moduleDir, '..', '..', 'public');

export const registerSpaStatic = (app: Express, publicDir = resolvePublicDir()): boolean => {
  const indexPath = path.join(publicDir, 'index.html');

  if (!fs.existsSync(indexPath)) {
    return false;
  }

  app.use(express.static(publicDir, { index: false, maxAge: '1h' }));

  const spaFallback: RequestHandler = (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    if (req.path.startsWith('/api')) {
      next();
      return;
    }

    res.sendFile(indexPath);
  };

  app.use(spaFallback);
  console.log(`Serving SPA static files from ${publicDir}`);
  return true;
};
