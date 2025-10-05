import { Body, Controller, Post } from '@nestjs/common';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly svc: RecommendationsService) {}

  @Post()
  async create(@Body() dto: CreateRecommendationDto) {
    return this.svc.getRecommendations(dto);
  }
}
