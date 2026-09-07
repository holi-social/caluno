import { registerEnumType } from '@nestjs/graphql';
import { InviteAllowanceState } from '../services/invite-allowance-eligibility';
import {
  ContractStatus,
  DocumentKind,
  DocumentStatusChange,
  InvoiceStatus,
  ReimbursementTypeKey,
  RenewalCadence,
  SigneeType,
} from './index';

registerEnumType(ReimbursementTypeKey, {
  name: 'ReimbursementTypeKey',
});

registerEnumType(DocumentKind, {
  name: 'DocumentKind',
});

registerEnumType(RenewalCadence, {
  name: 'RenewalCadence',
});

registerEnumType(SigneeType, {
  name: 'SigneeType',
});

registerEnumType(ContractStatus, {
  name: 'ContractStatus',
});

registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
});

registerEnumType(DocumentStatusChange, {
  name: 'DocumentStatusChange',
});

registerEnumType(InviteAllowanceState, {
  name: 'InviteAllowanceState',
});
