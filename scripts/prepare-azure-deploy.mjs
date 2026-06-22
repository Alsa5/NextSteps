import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = join(root, 'nextsteps-app');
const apiDir = join(root, 'nextsteps-api');
const appDist = join(appDir, 'dist');
const apiPublic = join(apiDir, 'public');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const run = (cwd, args) => {
  execSync(`${npmCmd} ${args}`, { cwd, stdio: 'inherit' });
};

console.log('Building nextsteps-app (production)...');
run(appDir, 'ci');
run(appDir, 'run build');

if (!existsSync(appDist)) {
  throw new Error(`Missing ${appDist}. Did the Vite build succeed?`);
}

console.log('Building nextsteps-api...');
run(apiDir, 'ci');
run(apiDir, 'run build');

console.log('Copying SPA dist → nextsteps-api/public/');
rmSync(apiPublic, { recursive: true, force: true });
mkdirSync(apiPublic, { recursive: true });
cpSync(appDist, apiPublic, { recursive: true });

console.log('');
console.log('Ready for Azure ZIP deploy from nextsteps-api/:');
console.log('  cd nextsteps-api');
console.log('  Compress-Archive -Path * -DestinationPath ..\\nextsteps-api-deploy.zip -Force');
console.log('');
console.log('Portal: App Service → Advanced Tools → Zip Push Deploy');
