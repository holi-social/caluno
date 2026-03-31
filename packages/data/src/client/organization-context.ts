/**
 * Platform-agnostic organization context interface
 *
 * Allows DataClient to automatically inject organizationId into mutations
 * Each platform (Next.js, Expo) implements this interface
 *
 * @example
 * ```typescript
 * // next implementation
 * class NextJsOrgContext implements OrganizationContext {
 *   async getCurrentOrganizationId() {
 *     const cookies = await cookies();
 *     return cookies.get('org_id')?.value ?? null;
 *   }
 * }
 *
 * // expo implementation
 * class ExpoOrgContext implements OrganizationContext {
 *   async getCurrentOrganizationId() {
 *     return await AsyncStorage.getItem('org_id');
 *   }
 * }
 * ```
 */
export interface OrganizationContext {
  getCurrentOrganizationId(): Promise<string | null>;
  setCurrentOrganizationId(orgUId: string): Promise<void>;
}
