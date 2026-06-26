pushd apps/backend > /dev/null
echo Checking project: $PWD
bunx license-checker --production --json > used_licenses.json
popd > /dev/null
pushd apps/frontend > /dev/null
echo Checking project: $PWD
bunx license-checker --production --json > used_licenses.json
popd > /dev/null
pushd packages/data > /dev/null
echo Checking project: $PWD
bunx license-checker --production --json > used_licenses.json
popd > /dev/null
pushd packages/ui > /dev/null
echo Checking project: $PWD
bunx license-checker --production --json > used_licenses.json
popd > /dev/null
pushd packages/typescript-config > /dev/null
echo Checking project: $PWD
bunx license-checker --production --json > used_licenses.json
popd > /dev/null

echo ------------------------------------------------------------

FILES=$(find . -name used_licenses.json | tr '\n' ' ')
bun run used_licenses.ts $FILES
find . -name used_licenses.json -exec rm {} +