import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { ScoringService } from './scoring/scoring.service';

@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationsService, ScoringService],
})
export class RecommendationsModule {}
