import { Inject, Injectable, Logger } from '@nestjs/common';
import AdmZip from 'adm-zip';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { BadRequestGraphQLError } from '../../graphql/errors';
import { FileService } from '../../storage/services/file.service';
import { ContractStatus, InvoiceStatus } from '../enums';
import { ReimbursementRateService } from './reimbursement-rate.service';

interface BundleEntry {
  name: string;
  fileId: string;
}

interface BuiltBundle {
  buffer: Buffer;
  zipName: string;
}

/**
 * Assembles the ready-to-go documents for a volunteer + reimbursement type
 * into a single downloadable ZIP and records the download (audit row + marking
 * the READY invoices as paid) once the bundle is built.
 *
 * The bundle contains the signed agreement (contract) plus every ready
 * (unpaid, READY) timesheet for that type. Documents are resolved to their
 * stored PDF bytes (public object storage) and zipped on the fly — nothing is
 * persisted, so repeated downloads don't accumulate artifacts (VOLI-1216).
 */
@Injectable()
export class BundleDownloadService {
  private readonly logger = new Logger(BundleDownloadService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly fileService: FileService,
    private readonly reimbursementRateService: ReimbursementRateService,
  ) {}

  async buildAndRecord(
    organizationUnitId: string,
    volunteerId: string,
    reimbursementTypeId: string,
    userId: string,
  ): Promise<BuiltBundle> {
    const [invoices, contract] = await Promise.all([
      this.db.query.invoices.findMany({
        where: {
          volunteerId,
          reimbursementTypeId,
          organizationUnitId,
          invoiceStatus: InvoiceStatus.READY,
          paidAt: { isNull: true },
        },
      }),
      this.db.query.contracts.findFirst({
        where: {
          volunteerId,
          reimbursementTypeId,
          organizationUnitId,
          contractStatus: ContractStatus.ACTIVE,
        },
      }),
    ]);

    const entries: BundleEntry[] = [];
    if (contract?.fileId) {
      entries.push({
        name: `Vereinbarung-${contract.id.slice(0, 8)}-${contract.id.slice(8, 12)}.pdf`,
        fileId: contract.fileId,
      });
    }
    for (const invoice of invoices) {
      if (!invoice.fileId) continue;
      entries.push({
        name: `Stundennachweis-${invoice.id.slice(0, 8)}-${invoice.id.slice(8, 12)}.pdf`,
        fileId: invoice.fileId,
      });
    }

    if (entries.length === 0) {
      throw new BadRequestGraphQLError(
        'No ready documents to download for this volunteer and reimbursement type.',
      );
    }

    const buffer = await this.zipEntries(entries);

    // Record the download (audit row + mark the READY invoices as paid). Only
    // once the ZIP is built, so a failed render never marks anything paid.
    if (invoices.length > 0) {
      await this.reimbursementRateService.recordBundleDownload(
        volunteerId,
        reimbursementTypeId,
        userId,
        invoices.map((i) => i.id),
      );
    }

    return {
      buffer,
      zipName: `Abrechnung-${volunteerId.slice(0, 8)}.zip`,
    };
  }

  private async zipEntries(entries: BundleEntry[]): Promise<Buffer> {
    const zip = new AdmZip();
    for (const entry of entries) {
      const url = await this.fileService.resolvePublicUrlForUploadedFile(
        entry.fileId,
      );
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${entry.name}: ${response.status}`);
        }
        zip.addFile(entry.name, Buffer.from(await response.arrayBuffer()));
      } catch (error) {
        this.logger.warn(
          `Bundle download: skipping ${entry.name} (${entry.fileId}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    return zip.toBuffer();
  }
}
