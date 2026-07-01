import { existsSync } from 'node:fs';
import { join } from 'node:path';

const localePathCandidates = (moduleDir: string) => [
  join(moduleDir, 'locales'),
  join(moduleDir, '..', '..', 'i18n', 'locales'),
  join(process.cwd(), 'src', 'i18n', 'locales'),
];

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
