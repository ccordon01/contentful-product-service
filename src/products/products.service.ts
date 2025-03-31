import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { Cron } from '@nestjs/schedule';
import { MessagesService } from 'src/common/modules/rabbitmq/messages.service';
import { HttpApiClientService } from 'src/common/modules/http-api-client/http-api-client.service';
import {
  ProductFieldsDto,
  ProductsResponseDto,
} from 'src/common/dto/products-response.dto';
import { ProductsRepository } from './repository/products.repository';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly httpApiClientService: HttpApiClientService,
    private readonly productsRepository: ProductsRepository,
  ) {}

  /**
   * Fetches and saves products from the API every hour using a cron job.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async fetchAndSaveProductsHourly() {
    this.logger.log('Initiating Product Synchronization.');
    const PRODUCTS_PER_PAGE = 10;
    const products: ProductsResponseDto =
      await this.httpApiClientService.fetchProducts();
    this.sendProductsToQueue(products);
    const productsPages = Math.ceil(products.total / PRODUCTS_PER_PAGE);

    for (let i = 1; i <= productsPages; i++) {
      this.logger.log(`Fetching products page ${i} of ${productsPages}`);
      const products = await this.httpApiClientService.fetchProducts(
        i * PRODUCTS_PER_PAGE,
        PRODUCTS_PER_PAGE,
      );
      this.sendProductsToQueue(products);
    }
  }

  private sendProductsToQueue(products: ProductsResponseDto) {
    for (const product of products.items) {
      const productFields = product.fields;
      this.messagesService.sendMessage({
        message: productFields,
      });
    }
  }

  async saveProduct(message: { message: ProductFieldsDto }) {
    const product: ProductFieldsDto = { ...message.message };

    const existingProduct =
      await this.productsRepository.getProductByProductSku(product.sku);
    if (existingProduct) {
      this.logger.log(`Product ${product.sku} already exists`);

      if (existingProduct.productIsActive) {
        this.logger.log(`Product ${product.sku} is active, updating...`);
        await this.productsRepository.updateProduct({
          productSku: product.sku,
          productName: product.name,
          productBrand: product.brand,
          productModel: product.model,
          productCategory: product.category,
          productColor: product.color,
          productPrice: product.price,
          productCurrency: product.currency,
          productStock: product.stock,
        });
      } else {
        this.logger.log(`Product ${product.sku} is deleted, ignoring...`);
      }
    } else {
      this.logger.log(`Product ${product.sku} does not exist, creating...`);
      await this.productsRepository.createProduct({
        productSku: product.sku,
        productName: product.name,
        productBrand: product.brand,
        productModel: product.model,
        productCategory: product.category,
        productColor: product.color,
        productPrice: product.price,
        productCurrency: product.currency,
        productStock: product.stock,
      });
    }
  }
}
