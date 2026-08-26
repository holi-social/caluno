import { describe, expect, it } from 'bun:test';
import { DocumentRenderingService } from './document-rendering.service';

describe('DocumentRenderingService', () => {
  it('throws — rendering is not yet implemented', async () => {
    const service = new DocumentRenderingService();
    await expect(service.generatePdfForDocument({} as never)).rejects.toThrow(
      'DocumentRenderingService.generatePdfForDocument is not yet implemented',
    );
  });
});
