import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../../apps/backend/src/schema.gql',
  documents: ['src/**/*.graphql'],
  generates: {
    'src/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        skipTypename: false,
        scalars: {
          DateTime: 'string',
        },
        rawRequest: false,
        gqlImport: 'graphql-request#gql',
        dedupeFragments: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
