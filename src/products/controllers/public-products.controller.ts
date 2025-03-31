import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from '../products.service';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { FilterProductsDto } from '../dto/filter-products.dto';
import { ResponseFilterProductsDto } from '../dto/response-filter-products.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';

@ApiTags('Public')
@Controller({
  path: 'products',
  version: '1',
})
export class PublicProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiResponse({
    status: 200,
    type: ResponseFilterProductsDto,
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
  })
  findFilteredProducts(
    @Query() filterProductsDto: FilterProductsDto,
  ): Promise<ResponseFilterProductsDto> {
    return this.productsService.findFilteredProducts(filterProductsDto);
  }
}
