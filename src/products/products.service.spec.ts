/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductsRepository } from './repository/products.repository';
import { HttpApiClientService } from '../common/modules/http-api-client/http-api-client.service';
import { FilterProductsDto } from './dto/filter-products.dto';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MessagesService } from '../common/modules/rabbitmq/messages.service';

describe('ProductsService', () => {
  let productsService: ProductsService;
  let productsRepository: ProductsRepository;
  let httpApiClientService: HttpApiClientService;
  let messagesService: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: {
            createProducts: jest.fn().mockResolvedValue(undefined),
            findFilteredProducts: jest.fn().mockResolvedValue(undefined),
            getProductByProductSku: jest.fn().mockResolvedValue(undefined),
            updateProduct: jest.fn().mockResolvedValue(undefined),
            deleteProduct: jest.fn().mockResolvedValue(undefined),
            activateProduct: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: HttpApiClientService,
          useValue: {
            fetchProducts: jest.fn(),
          },
        },
        {
          provide: MessagesService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    productsService = module.get<ProductsService>(ProductsService);
    productsRepository = module.get<ProductsRepository>(ProductsRepository);
    httpApiClientService =
      module.get<HttpApiClientService>(HttpApiClientService);
    messagesService = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(productsService).toBeDefined();
  });

  it('should fetch and save products correctly when the API returns valid data', async () => {
    const mockProducts = [
      {
        fields: {
          sku: '12345',
          name: 'Test Product',
          brand: 'Test Brand',
          model: 'Test Model',
          category: 'Test Category',
          color: 'Test Color',
          price: 100,
          currency: 'USD',
          stock: 10,
        },
      },
    ];

    (httpApiClientService.fetchProducts as jest.Mock).mockResolvedValue({
      items: mockProducts,
    });

    await productsService.fetchAndSaveProductsHourly();

    expect(messagesService.sendMessage).toHaveBeenCalledWith({
      message: {
        sku: '12345',
        name: 'Test Product',
        brand: 'Test Brand',
        model: 'Test Model',
        category: 'Test Category',
        color: 'Test Color',
        price: 100,
        currency: 'USD',
        stock: 10,
      },
    });
  });

  it('should return products correctly', async () => {
    const filterProductsDto: FilterProductsDto = {
      skip: 0,
      limit: 10,
      productBrand: 'Test Brand',
      productCategory: 'Test Category',
    };

    (productsRepository.findFilteredProducts as jest.Mock).mockResolvedValue({
      totalCount: 10,
      products: [
        {
          productSku: '12345',
          productName: 'Test Product',
          productBrand: 'Test Brand',
          productModel: 'Test Model',
          productCategory: 'Test Category',
          productColor: 'Test Color',
          productPrice: 100,
          productCurrency: 'USD',
          productStock: 10,
        },
      ],
    });

    const result =
      await productsService.findFilteredProducts(filterProductsDto);

    expect(result).toEqual({
      data: [
        {
          productSku: '12345',
          productName: 'Test Product',
          productBrand: 'Test Brand',
          productModel: 'Test Model',
          productCategory: 'Test Category',
          productColor: 'Test Color',
          productPrice: 100,
          productCurrency: 'USD',
          productStock: 10,
        },
      ],
      meta: {
        totalItems: 10,
        totalPages: 1,
        currentPage: 1,
        pageSize: 1,
      },
    });
  });

  it('should throw an error when trying to delete a product that does not exist', async () => {
    const productSku = 'nonexistentProduct';

    (productsRepository.getProductByProductSku as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(productsService.deleteProduct(productSku)).rejects.toThrow(
      NotFoundException,
    );

    expect(productsRepository.getProductByProductSku).toHaveBeenCalledWith(
      productSku,
    );
    expect(productsRepository.updateProduct).not.toHaveBeenCalled();
  });

  it('should throw a ConflictException when trying to delete a product that has already been deleted', async () => {
    const productSku = 'alreadyDeletedProduct';

    (productsRepository.getProductByProductSku as jest.Mock).mockResolvedValue({
      productSku: productSku,
    });

    await expect(productsService.deleteProduct(productSku)).rejects.toThrow(
      ConflictException,
    );

    expect(productsRepository.getProductByProductSku).toHaveBeenCalledWith(
      productSku,
    );
  });

  it('should throw an InternalServerErrorException when an error occurs while deleting a product', async () => {
    const productSku = 'testProduct';

    (productsRepository.getProductByProductSku as jest.Mock).mockResolvedValue({
      productSku: productSku,
      productName: 'Test Product',
      productBrand: 'Test Brand',
      productModel: 'Test Model',
      productCategory: 'Test Category',
      productColor: 'Test Color',
      productPrice: 100,
      productCurrency: 'USD',
      productStock: 10,
      productIsActive: true,
    });

    (productsRepository.updateProduct as jest.Mock).mockRejectedValue(
      new Error('Database error'),
    );

    await expect(productsService.deleteProduct(productSku)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(productsRepository.getProductByProductSku).toHaveBeenCalledWith(
      productSku,
    );
    expect(productsRepository.updateProduct).toHaveBeenCalledWith({
      productSku,
      productIsActive: false,
      productStock: 0,
    });
  });

  it('should delete a product successfully', async () => {
    const productSku = 'TEST-SKU-123';
    (productsRepository.getProductByProductSku as jest.Mock).mockResolvedValue({
      productSku,
      productName: 'Test Product',
      productIsActive: true,
    });

    (productsRepository.updateProduct as jest.Mock).mockResolvedValue(
      undefined,
    );

    await productsService.deleteProduct(productSku);

    expect(productsRepository.getProductByProductSku).toHaveBeenCalledWith(
      productSku,
    );
    expect(productsRepository.updateProduct).toHaveBeenCalledWith({
      productSku,
      productIsActive: false,
      productStock: 0,
    });
  });
});
