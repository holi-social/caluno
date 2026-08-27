import { describe, expect, it } from 'bun:test';
import { deriveDocumentStatus } from './accounting.repository';

const baseContract = {
  contractStatus: 'AWAITING_VOLUNTEER_SIGNATURE' as const,
  declinedAtSigneeType: null,
  signatures: [
    { id: 's1', order: 0, signeeType: 'VOLUNTEER' as const, signedAt: null },
    {
      id: 's2',
      order: 1,
      signeeType: 'PERMISSION_HOLDER' as const,
      signedAt: null,
    },
  ],
};

describe('deriveDocumentStatus', () => {
  it('reports awaiting-volunteer-signature when the volunteer has not signed', () => {
    expect(deriveDocumentStatus(baseContract)).toBe(
      'awaiting-volunteer-signature',
    );
  });

  it('reports awaiting-ngo-signature once the volunteer has signed but the NGO has not', () => {
    const doc = {
      ...baseContract,
      contractStatus: 'AWAITING_NGO_SIGNATURE' as const,
      signatures: [
        {
          id: 's1',
          order: 0,
          signeeType: 'VOLUNTEER' as const,
          signedAt: '2026-08-20T10:00:00Z',
        },
        {
          id: 's2',
          order: 1,
          signeeType: 'PERMISSION_HOLDER' as const,
          signedAt: null,
        },
      ],
    };
    expect(deriveDocumentStatus(doc)).toBe('awaiting-ngo-signature');
  });

  it('reports active once every signature is present', () => {
    const doc = {
      ...baseContract,
      contractStatus: 'ACTIVE' as const,
      signatures: baseContract.signatures.map((s) => ({
        ...s,
        signedAt: '2026-08-20T10:00:00Z',
      })),
    };
    expect(deriveDocumentStatus(doc)).toBe('active');
  });

  it('reports declined regardless of signature state', () => {
    const doc = {
      ...baseContract,
      contractStatus: 'DECLINED' as const,
      declinedAtSigneeType: 'VOLUNTEER' as const,
    };
    expect(deriveDocumentStatus(doc)).toBe('declined');
  });

  it('reports expired for expired contracts', () => {
    const doc = { ...baseContract, contractStatus: 'EXPIRED' as const };
    expect(deriveDocumentStatus(doc)).toBe('expired');
  });

  it('handles invoices the same way via invoiceStatus', () => {
    const invoice = {
      invoiceStatus: 'READY' as const,
      declinedAtSigneeType: null,
      signatures: baseContract.signatures.map((s) => ({
        ...s,
        signedAt: '2026-08-20T10:00:00Z',
      })),
    };
    expect(deriveDocumentStatus(invoice)).toBe('ready');
  });
});
