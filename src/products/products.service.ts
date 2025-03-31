import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { Cron } from '@nestjs/schedule';
import { MessagesService } from 'src/common/modules/rabbitmq/messages.service';
import { HttpApiClientService } from 'src/common/modules/http-api-client/http-api-client.service';
import {
  ProductFieldsDto,
  ProductsResponseDto,
} from 'src/common/dto/products-response.dto';
import { ProductsRepository } from './repository/products.repository';
import { FilterProductsDto } from './dto/filter-products.dto';
import { ResponseFilterProductsDto } from './dto/response-filter-products.dto';
import { productsRepositoryMapper } from './helpers/mappers/products-repository.mapper';
import { Product } from './repository/schemas/product.schema';

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

    const productData = {
      productSku: product.sku,
      productName: product.name,
      productBrand: product.brand,
      productModel: product.model,
      productCategory: product.category,
      productColor: product.color,
      productPrice: product.price,
      productCurrency: product.currency,
      productStock: product.stock,
    };

    try {
      if (existingProduct) {
        this.logger.log(`Product ${product.sku} already exists`);

        if (existingProduct.productIsActive) {
          this.logger.log(`Product ${product.sku} is active, updating...`);
          await this.productsRepository.updateProduct(productData);
        } else {
          this.logger.log(`Product ${product.sku} is deleted, ignoring...`);
        }
      } else {
        this.logger.log(`Product ${product.sku} does not exist, creating...`);
        await this.productsRepository.createProduct(productData);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Filters products based on the provided filterProductsDto and returns them along with pagination information.
   *
   * @param {FilterProductsDto} filterProductsDto - The filter criteria for products.
   * @returns {Promise<ResponseFilterProductsDto>} - The filtered products and pagination information.
   */
  async findFilteredProducts(
    filterProductsDto: FilterProductsDto,
  ): Promise<ResponseFilterProductsDto> {
    const { skip, limit } = filterProductsDto;

    const { totalCount, products: _products } =
      await this.productsRepository.findFilteredProducts(filterProductsDto);

    if (totalCount === 0) {
      throw new NotFoundException('No products found');
    }

    const products = productsRepositoryMapper(_products as Product[]);

    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = skip / limit + 1;
    return {
      data: products,
      meta: {
        totalItems: totalCount,
        totalPages,
        currentPage,
        pageSize: Array.isArray(products) ? products.length : 0,
      },
    };
  }

  /**
   * Deletes a product with the given productSku.
   *
   * @param {string} productSku - The unique identifier of the product to be deleted.
   * @returns {Promise<void>}
   */
  async deleteProduct(productSku: string): Promise<void> {
    try {
      const product =
        await this.productsRepository.getProductByProductSku(productSku);

      if (!product) {
        throw new NotFoundException('Product not found.');
      }

      if (!product.productIsActive) {
        throw new ConflictException('Product already deleted.');
      }

      await this.productsRepository.updateProduct({
        productSku,
        productIsActive: false,
        productStock: 0,
      });
    } catch (error) {
      this.logger.error('Error deleting product:', error);
      throw new InternalServerErrorException(
        'An error occurred while deleting the product.',
      );
    }
  }

  /**
   * Activates a product with the given productSku.
   *
   * @param {string} productSku - The unique identifier of the product to be activated.
   * @returns {Promise<void>}
   */
  async activateProduct(productSku: string): Promise<void> {
    try {
      const product =
        await this.productsRepository.getProductByProductSku(productSku);

      if (!product) {
        throw new NotFoundException('Product not found.');
      }

      if (product.productIsActive) {
        throw new ConflictException('Product already activated.');
      }

      await this.productsRepository.updateProduct({
        productSku,
        productIsActive: true,
      });
    } catch (error) {
      this.logger.error('Error activating product:', error);
      throw new InternalServerErrorException(
        'An error occurred while activating the product.',
      );
    }
  }
}
