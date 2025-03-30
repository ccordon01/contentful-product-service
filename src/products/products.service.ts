import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { Cron } from '@nestjs/schedule';
import { MessagesService } from 'src/common/modules/rabbitmq/messages.service';
import { HttpApiClientService } from 'src/common/modules/http-api-client/http-api-client.service';
import { ProductsResponseDto } from 'src/common/dto/products-response.dto';
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly httpApiClientService: HttpApiClientService,
  ) {}

  /**
   * Fetches and saves products from the API every hour using a cron job.
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
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
}
