import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const PRIVACY_POLICY_FILENAME_PATTERN =
  /^datenschutzhinweise-(\d{4}-\d{2}-\d{2})\.pdf$/;

export type PrivacyPolicyDocument = {
  version: string;
  filename: string;
  path: string;
};

export function latestPrivacyPolicyVersionFromFilenames(
  filenames: string[],
): string {
  const versions = filenames
    .map((filename) => filename.match(PRIVACY_POLICY_FILENAME_PATTERN)?.[1])
    .filter((version): version is string => version != null)
    .sort();

  const latest = versions.at(-1);
  if (!latest) {
    throw new Error('No privacy policy PDF found');
  }

  return latest;
}

export function resolvePrivacyPolicyDocument(
  directory: string,
): PrivacyPolicyDocument {
  const filenames = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
  const version = latestPrivacyPolicyVersionFromFilenames(filenames);
  const filename = `datenschutzhinweise-${version}.pdf`;

  return {
    version,
    filename,
    path: join(directory, filename),
  };
}

const getBackendRoot = (): string => {
  const cwd = process.cwd();
  const monorepoBackend = join(cwd, 'apps', 'backend');
  if (existsSync(join(monorepoBackend, 'tsconfig.json'))) {
    return monorepoBackend;
  }
  return cwd;
};

export function defaultPrivacyPolicyDirectory(): string {
  return join(getBackendRoot(), 'legal');
}
