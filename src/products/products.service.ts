import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { Cron } from '@nestjs/schedule';
import { MessagesService } from '../common/modules/rabbitmq/messages.service';
import { HttpApiClientService } from '../common/modules/http-api-client/http-api-client.service';
import {
  ProductFieldsDto,
  ProductsResponseDto,
} from 'src/common/dto/products-response.dto';
import { ProductsRepository } from './repository/products.repository';
import { FilterProductsDto } from './dto/filter-products.dto';
import { ResponseFilterProductsDto } from './dto/response-filter-products.dto';
import { productsRepositoryMapper } from './helpers/mappers/products-repository.mapper';
import { Product } from './repository/schemas/product.schema';
import { ResponseDeletedProductsPercentageDto } from './dto/response-deleted-products-percentage.dto';
import { ResponseNonDeletedProductsPercentageDto } from './dto/response-non-deleted-products-percentage.dto';
import { NonDeletedProductsReportDto } from './dto/count-products-for-non-deleted-products-report.dto';
import { startOfDayUTC } from '../common/utils/start-of-day-utc';
import { endOfDayUTC } from '../common/utils/end-of-day-utc';
import { ResponseTotalProductsByProductBrandDto } from './dto/reponse-total-products-by-proudct-brand.dto';

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
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
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

  /**
   * Calculates and returns the percentage of deleted products compared to the total number of products.
   *
   * @returns {Promise<ResponseDeletedProductsPercentageDto>} - The percentage of deleted products and additional information.
   */
  async percentageDeletedProducts(): Promise<ResponseDeletedProductsPercentageDto> {
    try {
      const totalDeletedProducts =
        await this.productsRepository.countDeletedProducts();
      const totalProducts = await this.productsRepository.countProducts();

      let percentageDeletedProducts = 0;

      if (totalProducts > 0) {
        percentageDeletedProducts =
          (totalDeletedProducts / totalProducts) * 100;
      }

      return {
        data: {
          totalDeletedProducts,
          totalProducts,
        },
        deletedProductsPercentage: {
          percentageDeletedProducts: `${percentageDeletedProducts.toFixed(2)}%`,
        },
      };
    } catch (error) {
      this.logger.error('Error generating deleted products report:', error);
      throw new InternalServerErrorException(
        'An error occurred while generating deleted products report.',
      );
    }
  }

  /**
   * Calculates and returns the percentage of non-deleted products compared to the total number of products.
   *
   * @param {NonDeletedProductsReportDto} nonDeletedProductsReportDto - The filter criteria for non-deleted products.
   * @returns {Promise<ResponseNonDeletedProductsPercentageDto>} - The percentage of non-deleted products and additional information.
   */
  async percentageNonDeletedProducts(
    nonDeletedProductsReportDto: NonDeletedProductsReportDto,
  ): Promise<ResponseNonDeletedProductsPercentageDto> {
    try {
      const {
        productWithPrice,
        productCreatedAtEndDate,
        productCreatedAtStartDate,
      } = nonDeletedProductsReportDto;

      if (
        (productCreatedAtStartDate && !productCreatedAtEndDate) ||
        (!productCreatedAtStartDate && productCreatedAtEndDate)
      ) {
        throw new BadRequestException(
          'Both start and end dates must be provided together',
        );
      }

      if (
        productCreatedAtStartDate &&
        productCreatedAtEndDate &&
        productCreatedAtStartDate > productCreatedAtEndDate
      ) {
        throw new BadRequestException(
          'Start date cannot be greater than end date.',
        );
      }

      const totalNonDeletedProducts =
        await this.productsRepository.countProductsForNonDeletedProductsReport({
          productWithPrice: productWithPrice ?? true,
          productCreatedAtStartDate:
            productCreatedAtStartDate &&
            startOfDayUTC(productCreatedAtStartDate),
          productCreatedAtEndDate:
            productCreatedAtEndDate && endOfDayUTC(productCreatedAtEndDate),
        });

      const totalProducts = await this.productsRepository.countProducts();

      let percentageNonDeletedProducts = 0;

      if (totalProducts > 0) {
        percentageNonDeletedProducts =
          (totalNonDeletedProducts / totalProducts) * 100;
      }

      return {
        data: {
          totalNonDeletedProducts,
          totalProducts,
        },
        deletedNonProductsPercentage: {
          percentageNonDeletedProducts: `${percentageNonDeletedProducts.toFixed(2)}%`,
        },
      };
    } catch (error) {
      this.logger.error('Error generating non-deleted products report:', error);
      throw new InternalServerErrorException(
        'An error occurred while generating non-deleted products report.',
      );
    }
  }

  /**
   * Calculates and returns the total number of products for each product brand.
   *
   * @returns {Promise<ResponseTotalProductsByProductBrandDto>} - The total number of products for each product brand and additional information.
   */
  async totalProductsByProductBrand(): Promise<ResponseTotalProductsByProductBrandDto> {
    try {
      const totalProductsByProductBrand =
        await this.productsRepository.totalProductsByProductBrand();
      const totalProducts = await this.productsRepository.countProducts();

      return {
        data: {
          totalProducts,
        },
        totalProductsByProductBrand: totalProductsByProductBrand.map(
          (brand) => ({
            productBrand: brand.productBrand,
            totalProducts: brand.count,
          }),
        ),
      };
    } catch (error) {
      this.logger.error('Error fetching product brand report:', error);
      throw new InternalServerErrorException(
        'An error occurred while fetching product brand report.',
      );
    }
  }
}
