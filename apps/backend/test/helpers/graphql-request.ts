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

  const response = await req.expect(200);
  return response.body as GraphqlResponse<TData>;
};
