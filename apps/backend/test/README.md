# GraphQL Integration Tests

Run GraphQL integration tests with:

```bash
npm run test:e2e
```

## Helpers

- `test/helpers/create-graphql-full-app.ts`
  - Boots a real Nest app from `AppModule`
  - Bypasses auth/permission guards by default
- `test/helpers/graphql-request.ts`
  - Sends GraphQL HTTP requests to `/graphql`
  - Supports variables, headers, and operation names

## Notes

- Set DB env vars for tests if your resolvers hit the database.
