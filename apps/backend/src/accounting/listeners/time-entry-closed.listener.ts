import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { OrganizationUnitDataService } from '../../organization/organization-unit-data.service';
import { AccountingEvent } from '../../shared/accounting-events';
import type { CreateInvoiceInput } from '../inputs/create-invoice.input';
import { InvoiceService } from '../services/invoice.service';

@Injectable()
export class TimeEntryClosedListener {
  private readonly logger = new Logger(TimeEntryClosedListener.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly invoiceService: InvoiceService,
    private readonly organizationUnitDataService: OrganizationUnitDataService,
  ) {}

  @OnEvent(AccountingEvent.TIME_ENTRY_CLOSED)
  async handleTimeEntryClosed(payload: { timeEntryId: string }): Promise<void> {
    try {
      const entry = await this.db.query.timeEntries.findFirst({
        where: { id: payload.timeEntryId },
      });
      if (!entry?.endedAt || !entry.reimbursementTypeId) return;

      const claimed = await this.db.query.invoiceTimeEntries.findFirst({
        where: { timeEntryId: entry.id, released: false },
      });
      if (claimed) return;

      const organization =
        await this.organizationUnitDataService.findOrganizationByUnitId(
          entry.organizationUnitId,
        );
      if (!organization) return;

      const startedAt = new Date(entry.startedAt);
      const input: CreateInvoiceInput = {
        organizationUnitId: entry.organizationUnitId,
        volunteerId: entry.volunteerId,
        reimbursementTypeId: entry.reimbursementTypeId,
        periodStart: new Date(
          Date.UTC(startedAt.getUTCFullYear(), startedAt.getUTCMonth(), 1),
        ),
        periodEnd: new Date(
          Date.UTC(startedAt.getUTCFullYear(), startedAt.getUTCMonth() + 1, 1),
        ),
        timeEntryIds: [entry.id],
      };

      await this.invoiceService.createDraftInvoice(
        organization.id,
        input,
        entry.volunteerId,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to auto-draft invoice for time entry ${payload.timeEntryId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
