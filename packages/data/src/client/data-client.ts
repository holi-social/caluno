import { GraphQLClient } from 'graphql-request';
import { UserRepository } from '../repositories/user/user.repository';
import { OrganizationRepository } from '../repositories/organization/organization.repository';
import type { GraphQLClientConfig } from './graphql-client';

/**
 * Unified data client with all repositories
 * Use in server components, API routes, or any JavaScript environment
 *
 * @example
 * ```typescript
 * // Server component
 * const data = createDataClient({
 *   url: process.env.API_URL!
 * });
 *
 * const user = await data.user.getMe();
 * const orgs = await data.organization.findAll();
 * ```
 */
export class DataClient {
  private graphqlClient: GraphQLClient;

  // Repository instances
  public readonly user: UserRepository;
  public readonly organization: OrganizationRepository;

  constructor(config: GraphQLClientConfig) {
    this.graphqlClient = new GraphQLClient(config.url, {
      credentials: config.credentials,
      headers: config.headers,
    });

    // Initialize all repositories
    this.user = new UserRepository(this.graphqlClient);
    this.organization = new OrganizationRepository(this.graphqlClient);
  }

  /**
   * Get the underlying GraphQL client for advanced usage
   */
  getGraphQLClient(): GraphQLClient {
    return this.graphqlClient;
  }
}

/**
 * Create a data client instance
 * Singleton pattern recommended - create once and reuse
 */
export function createDataClient(config: GraphQLClientConfig): DataClient {
  return new DataClient(config);
}
