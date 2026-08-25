import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { TemplateSigneeMapper } from '../mappers';
import type { TemplateSignee } from '../models/template-signee.model';
import { DocumentTemplateService } from '../services';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class DocumentTemplateSigneesLoader {
  constructor(
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly templateSigneeMapper: TemplateSigneeMapper,
  ) {}

  // Both DocumentTemplateService list/single fetches already eager-load
  // signees, so this loader only exists as a fallback for other call sites
  // (e.g. findActiveTemplate) that don't.
  public readonly signeesByTemplateId = new DataLoader<
    string,
    TemplateSignee[]
  >((templateIds) =>
    Promise.all(
      templateIds.map(async (id) => {
        try {
          const signees =
            await this.documentTemplateService.findOrderedTemplateSignees(id);
          return this.templateSigneeMapper.toArray(signees);
        } catch {
          return [];
        }
      }),
    ),
  );
}
