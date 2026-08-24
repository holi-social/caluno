import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import type { ContractWithRelations } from '../accounting.types';
import { ContractService } from '../services';
import { settleEach } from './settle-each';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class ContractLoader {
  constructor(private readonly contractService: ContractService) {}

  // Backfills documentTemplate/reimbursementType/signatures/statusChanges for
  // contracts fetched via a list query, which don't come with those relations
  // eager-loaded the way a single findContract() call does.
  public readonly contractWithRelationsById = new DataLoader<
    string,
    ContractWithRelations
  >((ids) => settleEach(ids, (id) => this.contractService.findContract(id)));
}
