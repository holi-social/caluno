export interface OrganizationNode {
  id: string;
  name: string;
  parentId: string | null;
  children: OrganizationNode[];
}
