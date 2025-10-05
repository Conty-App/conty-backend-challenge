import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class AudienceTargetDto {
  @IsString()
  country: string;

  @IsArray()
  @Type(() => Number)
  age_range: [number, number];
}

class CampaignDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsString()
  goal: string;

  @IsArray()
  tags_required: string[];

  @ValidateNested()
  @Type(() => AudienceTargetDto)
  audience_target: AudienceTargetDto;

  @IsInt()
  budget_cents: number;

  @IsString()
  deadline: string;
}

export class CreateRecommendationDto {
  @ValidateNested()
  @Type(() => CampaignDto)
  campaign: CampaignDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  top_k?: number = 10;
}
