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
import { ResponseFilterProductsDto } from '../dto/response-filter-products.dto';
import { FilterProductsDto } from '../dto/filter-products.dto';
@Controller({
  path: 'products',
  version: '1',
})
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

  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    type: ResponseFilterProductsDto,
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
  })
  @Get('deleted-products')
  getDeletedProducts(
    @Query() filterProductsDto: FilterProductsDto,
  ): Promise<ResponseFilterProductsDto> {
    return this.productsService.getDeletedProducts(filterProductsDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('fetch')
  fetchAndSaveProducts(): Promise<void> {
    return this.productsService.fetchAndSaveProductsHourly();
  }

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
  @Get('deleted-percentage')
  percentageDeletedProducts(): Promise<ResponseDeletedProductsPercentageDto> {
    return this.productsService.percentageDeletedProducts();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('non-deleted-percentage')
  percentageNonDeletedProducts(
    @Query()
    nonDeletedProductsReportDto: NonDeletedProductsReportDto,
  ): Promise<ResponseNonDeletedProductsPercentageDto> {
    return this.productsService.percentageNonDeletedProducts(
      nonDeletedProductsReportDto,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('total-products-by-brand')
  totalProductsByProductBrand(): Promise<ResponseTotalProductsByProductBrandDto> {
    return this.productsService.totalProductsByProductBrand();
  }
}
