import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

type GraphqlRequestOptions = {
  query: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
  operationName?: string;
};

export type GraphqlResponse<TData> = {
  data?: TData;
  errors?: Array<{ message: string }>;
};

export const requireGraphqlData = <TData>(
  response: GraphqlResponse<TData>,
  operation: string,
): TData => {
  if (response.errors) {
    throw new Error(
      `Expected ${operation} to return data, got GraphQL errors: ${JSON.stringify(
        response.errors,
      )}`,
    );
  }

  if (!response.data) {
    throw new Error(`Expected ${operation} to return data.`);
  }

  return response.data;
};

export const graphqlRequestRequiringData = async <TData>(
  app: INestApplication,
  options: GraphqlRequestOptions,
  operation: string,
): Promise<TData> => {
  return requireGraphqlData(await graphqlRequest(app, options), operation);
};

export const graphqlRequest = async <TData>(
  app: INestApplication,
  options: GraphqlRequestOptions,
): Promise<GraphqlResponse<TData>> => {
  let req = request(app.getHttpServer()).post('/graphql').send({
    query: options.query,
    variables: options.variables,
    operationName: options.operationName,
  });

  for (const [header, value] of Object.entries(options.headers ?? {})) {
    req = req.set(header, value);
  }

  const response = await req;
  if (response.status !== 200) {
    throw new Error(
      `GraphQL request failed with status ${response.status}.\nResponse body: ${JSON.stringify(response.body)}`,
    );
  }

  return response.body as GraphqlResponse<TData>;
};
