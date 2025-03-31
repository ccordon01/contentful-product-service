import { Controller, Delete, Logger, Param, Post } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsService } from '../products.service';
import { ProductFieldsDto } from 'src/common/dto/products-response.dto';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';

@Controller({
  path: 'products',
  version: '1',
})
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
}
