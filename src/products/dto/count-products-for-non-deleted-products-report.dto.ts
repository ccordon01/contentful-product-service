import { IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { INonDeletedProducts } from '../interfaces/non-deleted-products.interface';

export class CountProductsForNonDeletedProductsReportRepositoryDto
  implements INonDeletedProducts
{
  productWithPrice?: boolean;
  productCreatedAtStartDate?: Date;
  productCreatedAtEndDate?: Date;
}

export class NonDeletedProductsReportDto implements INonDeletedProducts {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : (value as boolean),
  )
  @ApiProperty({ default: true })
  productWithPrice?: boolean;

  @IsOptional()
  @IsDateString()
  productCreatedAtStartDate?: Date;

  @IsOptional()
  @IsDateString()
  productCreatedAtEndDate?: Date;
}
