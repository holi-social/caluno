import { registerEnumType } from '@nestjs/graphql';
import {
  ContractStatus,
  DocumentEventType,
  DocumentKind,
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

registerEnumType(DocumentEventType, {
  name: 'DocumentEventType',
});
