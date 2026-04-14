import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { type INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';

type CreateGraphqlTestAppOptions = Record<string, never>;

export const createGraphqlTestApp = async (
  _options: CreateGraphqlTestAppOptions = {},
): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        typeDefs: `
          type Query {
            healthcheck: String!
          }
        `,
        resolvers: {
          Query: {
            healthcheck: () => 'ok',
          },
        },
        graphiql: false,
      }),
    ],
  }).compile();
  const app = moduleRef.createNestApplication();

  await app.init();
  return app;
};
