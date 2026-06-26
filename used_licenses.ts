import { readFileSync } from 'node:fs';

const files = process.argv.slice(2);

let merged = {};

for (const file of files) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  merged = { ...merged, ...json };
}

const licensesSet = new Set<string>();
const licenseStrs: string[] = [];
for (const [key, value] of Object.entries(merged)) {
  if (value && typeof value === 'object' && 'licenses' in value) {
    const str = `${key}: ${value.licenses}`;
    licenseStrs.push(str);
    licensesSet.add(value.licenses as string);
  }
}

console.log(licenseStrs.sort().join('\n'));

licensesSet.delete('UNLICENSED');
const distinctLicenses = Array.from(licensesSet);
console.log('\nLicenses used:\n', distinctLicenses.sort().join(', '));
