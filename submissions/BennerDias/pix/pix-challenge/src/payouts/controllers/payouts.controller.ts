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
  constructor(private readonly PayoutsService: PayoutsService) {}

  @Post('batch')
  async processBatch(
    @Body() CreateBatchDto: CreateBatchDto,
  ): Promise<BatchReportDto> {
    try {
      const report = await this.PayoutsService.processBatch(CreateBatchDto);
      return report;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException(
        'Erro ao processar batch',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
