import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller('products')
export class ProductsController {
  @MessagePattern('create-products')
  createProducts(message: any) {
    console.log('Mensaje recibido:', message);
    return `Mensaje recibido: ${message}`;
  }
}
