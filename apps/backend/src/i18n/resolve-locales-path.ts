import { existsSync } from 'node:fs';
import { join } from 'node:path';

const getBackendRoot = (): string => {
  const cwd = process.cwd();
  const monorepoBackend = join(cwd, 'apps', 'backend');
  if (existsSync(join(monorepoBackend, 'tsconfig.json'))) {
    return monorepoBackend;
  }
  return cwd;
};

const localePathCandidates = (moduleDir: string) => {
  const backendRoot = getBackendRoot();
  return [
    join(moduleDir, 'locales'),
    join(moduleDir, '..', '..', 'i18n', 'locales'),
    join(backendRoot, 'src', 'i18n', 'locales'),
    join(process.cwd(), 'src', 'i18n', 'locales'),
  ];
};

export function resolveI18nLocalesPath(moduleDir = __dirname): string {
  const found = localePathCandidates(moduleDir).find((path) =>
    existsSync(path),
  );

  if (!found) {
    throw new Error(
      `i18n locales directory not found. Tried:\n${localePathCandidates(
        moduleDir,
      )
        .map((path) => `  - ${path}`)
        .join('\n')}`,
    );
  }

  return found;
}
