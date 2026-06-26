export interface OrganizationNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  deletedAt: string | null;
  type: { id: string; name: string; icon: string };
  children: OrganizationNode[];
}
