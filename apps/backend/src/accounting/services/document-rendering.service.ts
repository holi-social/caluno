import { Injectable } from '@nestjs/common';
import type { ContractWithRelations, InvoiceWithRelations } from '../accounting.types';

/**
 * Renders a fully-signed contract or invoice to PDF and stores it via FileService,
 * returning the resulting fileId.
 *
 * NOT YET IMPLEMENTED. The rendering technology (headless-browser render of the
 * frontend preview component vs. an independent server-side HTML/PDF template) is
 * an open decision — see docs/superpowers/specs/2026-08-25-bundle-download-tracking-design.md.
 * Not called from any resolver, service, or listener yet.
 */
@Injectable()
export class DocumentRenderingService {
  async generatePdfForDocument(
    document: ContractWithRelations | InvoiceWithRelations,
  ): Promise<string> {
    throw new Error(
      'DocumentRenderingService.generatePdfForDocument is not yet implemented',
    );
  }
}
