import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = join(root, 'nextsteps-app');
const apiDir = join(root, 'nextsteps-api');
const appDist = join(appDir, 'dist');
const apiPublic = join(apiDir, 'public');
const apiIndex = join(apiDir, 'dist', 'index.js');
const publicIndex = join(apiPublic, 'index.html');
const deployZip = join(root, 'nextsteps-api-deploy.zip');
const stagingDir = join(root, '.azure-deploy-staging');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const run = (cwd, args) => {
  execSync(`${npmCmd} ${args}`, { cwd, stdio: 'inherit' });
};

const removeIfExists = (target) => {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
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

if (!existsSync(apiIndex)) {
  throw new Error(`Missing ${apiIndex}. Did the API TypeScript build succeed?`);
}

console.log('Copying SPA dist → nextsteps-api/public/');
removeIfExists(apiPublic);
mkdirSync(apiPublic, { recursive: true });
cpSync(appDist, apiPublic, { recursive: true });

// Vite copies public/ into dist; drop .git metadata if galaxy-sim was vendored with history.
removeIfExists(join(apiPublic, 'galaxy-sim', '.git'));

if (!existsSync(publicIndex)) {
  throw new Error(`Missing ${publicIndex}. Did the SPA copy succeed?`);
}

const deployPaths = ['dist', 'public', 'package.json', 'package-lock.json'];
for (const relPath of deployPaths) {
  if (!existsSync(join(apiDir, relPath))) {
    throw new Error(`Missing ${relPath} — required for Azure deploy`);
  }
}

console.log('Staging deploy artifact (Oryx-safe package.json)...');
removeIfExists(stagingDir);
mkdirSync(stagingDir, { recursive: true });
cpSync(join(apiDir, 'dist'), join(stagingDir, 'dist'), { recursive: true });
cpSync(join(apiDir, 'public'), join(stagingDir, 'public'), { recursive: true });
cpSync(join(apiDir, 'package-lock.json'), join(stagingDir, 'package-lock.json'));

const sourcePkg = JSON.parse(readFileSync(join(apiDir, 'package.json'), 'utf8'));
const deployPkg = {
  ...sourcePkg,
  scripts: {
    start: sourcePkg.scripts?.start ?? 'node dist/index.js',
    // Oryx runs `npm run build` after production `npm install` (no devDeps / no tsc).
    build:
      "node --input-type=module -e \"import{existsSync}from'fs';if(!existsSync('dist/index.js')){console.error('Missing dist/index.js');process.exit(1)}console.log('Using pre-built dist')\"",
  },
};
writeFileSync(join(stagingDir, 'package.json'), `${JSON.stringify(deployPkg, null, 2)}\n`);

console.log('Creating Azure deploy zip (no node_modules — Oryx installs on Linux)...');
rmSync(deployZip, { force: true });

execFileSync('tar', ['-caf', deployZip, ...deployPaths], {
  cwd: stagingDir,
  stdio: 'inherit',
});

removeIfExists(stagingDir);

if (!existsSync(deployZip)) {
  throw new Error(`Failed to create ${deployZip}`);
}

const zipMb = (statSync(deployZip).size / (1024 * 1024)).toFixed(1);

console.log('');
console.log(`Deploy artifact: ${deployZip} (${zipMb} MB)`);
console.log('Portal: App Service → Advanced Tools → Zip Push Deploy');
console.log('  - UNCHECK "Skip Server-Side Build (Pre Built App)" — let Azure run npm install on Linux');
console.log('  - Or set App Setting SCM_DO_BUILD_DURING_DEPLOYMENT=true');
console.log('  - Startup command: node dist/index.js');
console.log('');
console.log('Why: Windows node_modules in a zip breaks on Linux (bullmq/debug MODULE_NOT_FOUND).');
console.log('Deploy package.json uses a no-op build — dist is compiled locally; Oryx must not run tsc.');
console.log(
  'First deploy may take a few minutes while Oryx runs npm install. Use WEBSITES_CONTAINER_START_TIME_LIMIT=600 if needed.',
);
console.log('');
