import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PayoutItemDto {
  @IsString()
  @IsNotEmpty()
  external_id: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsNumber()
  amount_cents: number;

  @IsString()
  @IsNotEmpty()
  pix_key: string;
}

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  batch_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayoutItemDto)
  items: PayoutItemDto[];
}
