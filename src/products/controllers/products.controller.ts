import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsService } from '../products.service';
import { ProductFieldsDto } from 'src/common/dto/products-response.dto';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { ResponseDeletedProductsPercentageDto } from '../dto/response-deleted-products-percentage.dto';
import { ResponseNonDeletedProductsPercentageDto } from '../dto/response-non-deleted-products-percentage.dto';
import { NonDeletedProductsReportDto } from '../dto/count-products-for-non-deleted-products-report.dto';
import { ResponseTotalProductsByProductBrandDto } from '../dto/reponse-total-products-by-proudct-brand.dto';

@Controller({
  path: 'products',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('create-products')
  createProducts(message: { message: ProductFieldsDto }) {
    this.productsService.saveProduct(message).catch((error) => {
      this.logger.error(error);
    });
  }

  @Post('fetch')
  fetchAndSaveProducts(): Promise<void> {
    return this.productsService.fetchAndSaveProductsHourly();
  }

  @ApiResponse({
    status: 200,
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
  })
  @Delete(':productSku')
  deleteProduct(@Param('productSku') productSku: string): Promise<void> {
    return this.productsService.deleteProduct(productSku);
  }

  @ApiResponse({
    status: 200,
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
  })
  @Post(':productSku/activate')
  activateProduct(@Param('productSku') productSku: string): Promise<void> {
    return this.productsService.activateProduct(productSku);
  }

  @Get('deleted-percentage')
  percentageDeletedProducts(): Promise<ResponseDeletedProductsPercentageDto> {
    return this.productsService.percentageDeletedProducts();
  }

  @Get('non-deleted-percentage')
  percentageNonDeletedProducts(
    @Query()
    nonDeletedProductsReportDto: NonDeletedProductsReportDto,
  ): Promise<ResponseNonDeletedProductsPercentageDto> {
    return this.productsService.percentageNonDeletedProducts(
      nonDeletedProductsReportDto,
    );
  }

  @Get('total-products-by-brand')
  totalProductsByProductBrand(): Promise<ResponseTotalProductsByProductBrandDto> {
    return this.productsService.totalProductsByProductBrand();
  }
}
