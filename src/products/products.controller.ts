import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsService } from './products.service';
import { ProductFieldsDto } from 'src/common/dto/products-response.dto';
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('create-products')
  createProducts(message: { message: ProductFieldsDto }) {
    this.productsService.saveProduct(message).catch((error) => {
      this.logger.error(error);
    });
  }
}
