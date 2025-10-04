import { BatchReportDto } from '../dto/batch-report-dto';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { PayoutsService } from './../services/payouts.service';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutService: PayoutsService) {}

  @Post('batch')
  async processBatch(
    @Body() createBatchDto: CreateBatchDto,
  ): Promise<BatchReportDto> {
    try {
      const report = await this.payoutService.processBatch(createBatchDto);
      return report;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException(
        'Erro ao processar o batch',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
