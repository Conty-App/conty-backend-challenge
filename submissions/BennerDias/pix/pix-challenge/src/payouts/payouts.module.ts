import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayoutsController } from './controllers/payouts.controller';
import { PayoutsService } from './services/payouts.service';
import { Payout } from './entities/payouts.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payout])],
  controllers: [PayoutsController],
  providers: [PayoutsService],
})
export class PayoutsModule {}
