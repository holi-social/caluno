import type { IncomingMessage, ServerResponse } from 'node:http';
import { Writable } from 'node:stream';
import * as Sentry from '@sentry/nestjs';
import { pinoHttp } from 'pino-http';
import { buildPinoHttpOptions } from './pino-options';

jest.mock('@sentry/nestjs', () => ({
  getActiveSpan: jest.fn(() => ({
    spanContext: () => ({ traceId: 'sentry-span-trace' }),
  })),
  getCurrentScope: jest.fn(() => ({
    getPropagationContext: () => ({ traceId: 'sentry-prop-trace' }),
  })),
}));

const getActiveSpan = Sentry.getActiveSpan as jest.Mock;

const asReq = (value: unknown) => value as unknown as IncomingMessage;
const asRes = (value: unknown) => value as unknown as ServerResponse;

const graphqlPostRequest = {
  id: 'req-1',
  method: 'POST',
  url: '/graphql',
  headers: {
    host: 'api.caluno.org',
    'user-agent': 'graphql-client',
    'x-organization-unit-id': 'unit-1',
    authorization: 'Bearer secret-token',
    cookie: 'session=abc',
  },
  body: {
    operationName: 'SignIn',
    query:
      'mutation SignIn($email: String!, $password: String!) { signIn(email: $email, password: $password) { id } }',
    variables: { email: 'john@example.com', password: 'hunter2' },
  },
  user: { id: 'u1' },
};

describe('buildPinoHttpOptions', () => {
  it('logs GraphQL requests without body, query text or variables', () => {
    const opts = buildPinoHttpOptions({ nodeEnv: 'production' });
    const serialized = opts.serializers?.req?.(graphqlPostRequest);

    expect(serialized).toBeDefined();
    expect(serialized?.url).toBe('/graphql');
    expect(serialized?.graphql).toEqual({ operationName: 'SignIn' });
    // Body / query / variables never reach the log.
    expect(serialized).not.toHaveProperty('body');
    expect(serialized).not.toHaveProperty('query');
    expect(serialized).not.toHaveProperty('variables');
    // Credentials and cookies are not part of the serialized headers.
    const headers = serialized?.headers as Record<string, unknown>;
    expect(headers).not.toHaveProperty('authorization');
    expect(headers).not.toHaveProperty('cookie');
    expect(headers['x-organization-unit-id']).toBe('unit-1');

    const json = JSON.stringify(serialized);
    expect(json).not.toContain('hunter2');
    expect(json).not.toContain('john@example.com');
    expect(json).not.toContain('SignIn($email');
  });

  it('strips query strings (tokens, codes, GraphQL GET) from logged urls', () => {
    const opts = buildPinoHttpOptions({ nodeEnv: 'production' });
    const serializer = opts.serializers?.req;
    expect(serializer).toBeDefined();

    const auth = serializer?.({
      method: 'GET',
      url: '/api/auth/verify-email?token=abc123&callbackURL=/reset',
      headers: {},
    });
    expect(auth?.url).toBe('/api/auth/verify-email');
    expect(JSON.stringify(auth)).not.toContain('abc123');

    const graphqlGet = serializer?.({
      method: 'GET',
      url: '/graphql?operationName=SignIn&query=mutation%20SignIn',
      query: { operationName: 'SignIn' },
      headers: {},
    });
    expect(graphqlGet?.url).toBe('/graphql');
    expect(graphqlGet?.graphql).toEqual({ operationName: 'SignIn' });
  });

  it('accepts a well-formed x-request-id and ignores unsafe values', () => {
    const opts = buildPinoHttpOptions({ nodeEnv: 'production' });
    const genReqId = opts.genReqId;
    expect(genReqId).toBeDefined();

    expect(
      genReqId?.(asReq({ headers: { 'x-request-id': 'abc-123' } }), asRes({})),
    ).toBe('abc-123');

    // Log forging attempt via control characters -> falls back to a UUID.
    const forged = genReqId?.(
      asReq({ headers: { 'x-request-id': 'abc\nINFO injected' } }),
      asRes({}),
    );
    expect(forged).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/);

    // Missing header -> UUID.
    const fallback = genReqId?.(asReq({ headers: {} }), asRes({}));
    expect(fallback).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/);
  });

  it('attaches trace_id and user_id as request properties', () => {
    const opts = buildPinoHttpOptions({ nodeEnv: 'production' });
    const props = opts.customProps?.(asReq(graphqlPostRequest), asRes({}));

    expect(props).toEqual({ trace_id: 'sentry-span-trace', user_id: 'u1' });
  });

  it('falls back to the propagation context when no span is active', () => {
    const opts = buildPinoHttpOptions({ nodeEnv: 'production' });
    getActiveSpan.mockReturnValueOnce(undefined);

    const props = opts.customProps?.(
      asReq({ headers: {}, user: { id: 'u2' } }),
      asRes({}),
    );
    expect(props).toEqual({ trace_id: 'sentry-prop-trace', user_id: 'u2' });
  });

  it('maps status codes to log levels', () => {
    const opts = buildPinoHttpOptions({ nodeEnv: 'production' });
    const customLogLevel = opts.customLogLevel;
    expect(customLogLevel).toBeDefined();

    expect(customLogLevel?.(asReq({}), asRes({ statusCode: 200 }))).toBe(
      'info',
    );
    expect(customLogLevel?.(asReq({}), asRes({ statusCode: 401 }))).toBe(
      'warn',
    );
    expect(customLogLevel?.(asReq({}), asRes({ statusCode: 500 }))).toBe(
      'error',
    );
    expect(
      customLogLevel?.(asReq({}), asRes({ statusCode: 200 }), new Error('x')),
    ).toBe('error');
  });

  it('selects level by environment and honours LOG_LEVEL', () => {
    expect(buildPinoHttpOptions({ nodeEnv: 'production' }).level).toBe('info');
    expect(buildPinoHttpOptions({ nodeEnv: 'staging' }).level).toBe('info');
    expect(buildPinoHttpOptions({ nodeEnv: 'development' }).level).toBe(
      'debug',
    );
    expect(buildPinoHttpOptions({ nodeEnv: 'test' }).level).toBe('silent');
    expect(
      buildPinoHttpOptions({ nodeEnv: 'production', logLevel: 'debug' }).level,
    ).toBe('debug');
    expect(
      buildPinoHttpOptions({ nodeEnv: 'test', logLevel: 'debug' }).level,
    ).toBe('debug');
    // Invalid override is ignored.
    expect(
      buildPinoHttpOptions({ nodeEnv: 'production', logLevel: 'bogus' }).level,
    ).toBe('info');
  });

  it('uses JSON transport in production/test and pretty transport in dev', () => {
    expect(
      buildPinoHttpOptions({ nodeEnv: 'production' }).transport,
    ).toBeUndefined();
    expect(buildPinoHttpOptions({ nodeEnv: 'test' }).transport).toBeUndefined();
    expect(buildPinoHttpOptions({ nodeEnv: 'development' }).transport).toEqual({
      target: 'pino-pretty',
      options: { singleLine: true },
    });
  });

  it('emits Loki-friendly records: string level, service and env labels, redacted PII', () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk: Buffer, _encoding: unknown, callback: () => void) {
        lines.push(chunk.toString());
        callback();
      },
    });

    const { logger } = pinoHttp({
      ...buildPinoHttpOptions({ nodeEnv: 'production' }),
      stream,
    });

    logger.info({
      email: 'john@example.com',
      password: 'hunter2',
      token: 'reset-token',
      tokenCount: 5,
      user: { name: 'John', email: 'john@example.com' },
    });

    expect(lines).toHaveLength(1);
    const record = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;

    expect(record.level).toBe('info');
    expect(record.service).toBe('caluno-backend');
    expect(record.env).toBe('production');
    expect(record.email).toBe('[Redacted]');
    expect(record.password).toBe('[Redacted]');
    expect(record.token).toBe('[Redacted]');
    expect(record.user).toEqual({
      name: '[Redacted]',
      email: '[Redacted]',
    });
    // Exact-key matching only: not a substring matcher.
    expect(record.tokenCount).toBe(5);
  });
});
