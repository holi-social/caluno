import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { FormSubmission } from './types';

function jsonPath(): string {
  return path.join(process.cwd(), 'data', 'submissions.json');
}

async function readSubmissions(): Promise<FormSubmission[]> {
  const file = jsonPath();
  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as FormSubmission[];
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeSubmissions(
  submissions: FormSubmission[],
): Promise<void> {
  const file = jsonPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(
    file,
    `${JSON.stringify(submissions, null, 2)}\n`,
    'utf8',
  );
}

let chain: Promise<unknown> = Promise.resolve();

function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function createSubmission(data: {
  formConfigId: string;
  formSlug: string;
  data: Record<string, string | boolean | string[]>;
}): Promise<FormSubmission> {
  return runExclusive(async () => {
    const submissions = await readSubmissions();
    const submission: FormSubmission = {
      id: randomUUID(),
      formConfigId: data.formConfigId,
      formSlug: data.formSlug,
      data: data.data,
      submittedAt: new Date().toISOString(),
    };
    submissions.push(submission);
    await writeSubmissions(submissions);
    return submission;
  });
}

export async function listSubmissions(): Promise<FormSubmission[]> {
  return runExclusive(async () => {
    const submissions = await readSubmissions();
    return [...submissions].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime(),
    );
  });
}

export async function listSubmissionsByForm(
  formSlug: string,
): Promise<FormSubmission[]> {
  return runExclusive(async () => {
    const submissions = await readSubmissions();
    return submissions
      .filter((s) => s.formSlug === formSlug)
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() -
          new Date(a.submittedAt).getTime(),
      );
  });
}
