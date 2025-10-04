import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBatchDto, PayoutItemDto } from '../dto/create-batch.dto';
import { BatchReportDto, PayoutDetailDto } from '../dto/batch-report-dto';
import { Payout } from '../entities/payouts.entity';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    @InjectRepository(Payout)
    private payoutRepository: Repository<Payout>,
  ) {}

  async processBatch(dto: CreateBatchDto): Promise<BatchReportDto> {
    const { batch_id, items } = dto;
    let processed = 0,
      successful = 0,
      failed = 0,
      duplicates = 0;
    const details: PayoutDetailDto[] = [];

    for (const item of items) {
      processed++;
      const existing = await this.payoutRepository.findOne({
        where: { externalId: item.external_id },
      });

      if (existing) {
        duplicates++;
        details.push({
          external_id: item.external_id,
          status: 'DUPLICATE',
          amount_cents: item.amount_cents,
        });
        continue;
      }

      const paymentResult = await this.simulatePixPayment(item);
      const status = paymentResult.success ? 'PAID' : 'FAILED';

      try {
        const payout = this.payoutRepository.create({
          externalId: item.external_id,
          batch_id,
          userId: item.user_id,
          amountCents: item.amount_cents,
          pixKey: item.pix_key,
          status,
        });
        await this.payoutRepository.save(payout);

        if (status === 'PAID') successful++;
        else failed++;

        details.push({
          external_id: item.external_id,
          status: status,
          amount_cents: item.amount_cents,
        });
        this.logger.log(`Processed ${item.external_id} with status ${status}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          duplicates++;
          details.push({
            external_id: item.external_id,
            status: 'DUPLICATE',
            amount_cents: item.amount_cents,
          });
        } else {
          failed++;
          details.push({
            external_id: item.external_id,
            status: 'FAILED',
            amount_cents: item.amount_cents,
          });
          this.logger.error(
            `Error saving ${item.external_id}: ${error.message}`,
          );
        }
      }
    }

    return {
      batch_id,
      processed,
      successful,
      failed,
      duplicates,
      details,
    };
  }

  private async simulatePixPayment(
    item: PayoutItemDto,
  ): Promise<{ success: boolean }> {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 400 + 100),
    );
    const success = Math.random() > 0.1;
    if (!success) {
      this.logger.warn(`Simulated failure for ${item.external_id}`);
    }
    return { success };
  }
}
