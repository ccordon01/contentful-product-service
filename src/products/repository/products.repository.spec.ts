/* eslint-disable @typescript-eslint/unbound-method */
import { CreateProductDto } from '../dto/create-product.dto';
import { FilterProductsDto } from '../dto/filter-products.dto';
import { ProductsRepository } from './products.repository';
import { Product } from './schemas/product.schema';
import { Model } from 'mongoose';

describe('ProductsRepository', () => {
  let productModel: jest.Mocked<Model<Product>>;
  let productsRepository: ProductsRepository;

  beforeEach(() => {
    const mockDocument = {
      save: jest.fn().mockResolvedValue({}),
    };

    productModel = {
      create: jest.fn().mockResolvedValue(mockDocument),
      insertMany: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      }),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      }),
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      aggregate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    } as unknown as jest.Mocked<Model<Product>>;

    productsRepository = new ProductsRepository(productModel);
  });

  it('should successfully create a new product entry in the database', async () => {
    const createProductDto: CreateProductDto = {
      productSku: '12345',
      productName: 'Test Product',
      productBrand: 'Test Brand',
      productModel: 'Test Model',
      productCategory: 'Test Category',
      productColor: 'Test Color',
      productPrice: 100,
      productCurrency: 'USD',
      productStock: 10,
    };

    (productModel.create as jest.Mock).mockResolvedValue(createProductDto);

    const result = await productsRepository.createProduct(createProductDto);

    expect(result).toEqual(createProductDto);
    expect(productModel.create).toHaveBeenCalledWith(createProductDto);
  });

  it('should successfully count products in the database', async () => {
    const mockCount = 10;

    (productModel.countDocuments as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockCount),
    });

    const result = await productsRepository.countProducts();

    expect(result).toEqual(mockCount);
    expect(productModel.countDocuments().exec).toHaveBeenCalled();
  });

  it('should return all products when no filter is provided', async () => {
    const filterProductsDto: FilterProductsDto = {
      skip: 0,
      limit: 10,
    };

    const mockProducts = [
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
    ];

    (productModel.find().exec as jest.Mock).mockResolvedValue(mockProducts);
    (productModel.countDocuments().exec as jest.Mock).mockResolvedValue(
      mockProducts.length,
    );

    const result =
      await productsRepository.findFilteredProducts(filterProductsDto);

    expect(result).toMatchObject({
      totalCount: mockProducts.length,
      products: mockProducts,
    });
  });

  it('should apply filters and return filtered products', async () => {
    const filterProductsDto: FilterProductsDto = {
      skip: 0,
      limit: 10,
      productName: 'Test Product',
      productMinPrice: 50,
      productMaxPrice: 150,
      productCurrency: 'USD',
      productMinStock: 5,
      productMaxStock: 15,
    };

    const mockFilteredProducts = [
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
    ];

    (productModel.find().exec as jest.Mock).mockResolvedValue(
      mockFilteredProducts,
    );
    (productModel.countDocuments().exec as jest.Mock).mockResolvedValue(
      mockFilteredProducts.length,
    );

    const result =
      await productsRepository.findFilteredProducts(filterProductsDto);

    expect(result).toMatchObject({
      totalCount: mockFilteredProducts.length,
      products: mockFilteredProducts,
    });
  });

  it('should apply filters and return filtered products by product SKU', async () => {
    const filterProductsDto: FilterProductsDto = {
      skip: 0,
      limit: 10,
      productSku: '12345',
    };

    const mockFilteredProducts = [
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
    ];

    (productModel.find().exec as jest.Mock).mockResolvedValue(
      mockFilteredProducts,
    );
    (productModel.countDocuments().exec as jest.Mock).mockResolvedValue(
      mockFilteredProducts.length,
    );

    const result =
      await productsRepository.findFilteredProducts(filterProductsDto);

    expect(result).toMatchObject({
      totalCount: mockFilteredProducts.length,
      products: mockFilteredProducts,
    });
  });

  it('should apply filters and return filtered products excluding specified product SKUs', async () => {
    const filterProductsDto: FilterProductsDto = {
      skip: 0,
      limit: 10,
      productMinPrice: 50,
      productMaxPrice: 150,
    };

    const mockFilteredProducts = [
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
    ];

    (productModel.find as jest.Mock).mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockFilteredProducts),
    });

    (productModel.countDocuments as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockFilteredProducts.length),
    });

    const result =
      await productsRepository.findFilteredProducts(filterProductsDto);

    expect(result).toMatchObject({
      totalCount: mockFilteredProducts.length,
      products: mockFilteredProducts,
    });
  });

  it('should apply filters and return filtered products by product price', async () => {
    const filterProductsDto: FilterProductsDto = {
      skip: 0,
      limit: 10,
      productMinPrice: 50,
      productMaxPrice: 150,
    };

    const mockFilteredProducts = [
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
    ];

    (productModel.find().exec as jest.Mock).mockResolvedValue(
      mockFilteredProducts,
    );
    (productModel.countDocuments().exec as jest.Mock).mockResolvedValue(
      mockFilteredProducts.length,
    );

    const result =
      await productsRepository.findFilteredProducts(filterProductsDto);

    expect(result).toMatchObject({
      totalCount: mockFilteredProducts.length,
      products: mockFilteredProducts,
    });
  });

  it('should apply filters and return filtered products by product stock', async () => {
    const filterProductsDto: FilterProductsDto = {
      skip: 0,
      limit: 10,
      productMinStock: 5,
      productMaxStock: 15,
    };

    const mockFilteredProducts = [
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
    ];

    (productModel.find().exec as jest.Mock).mockResolvedValue(
      mockFilteredProducts,
    );
    (productModel.countDocuments().exec as jest.Mock).mockResolvedValue(
      mockFilteredProducts.length,
    );

    const result =
      await productsRepository.findFilteredProducts(filterProductsDto);

    expect(result).toMatchObject({
      totalCount: mockFilteredProducts.length,
      products: mockFilteredProducts,
    });
  });

  it('should apply filters and return filtered products by product brand, model, category, and color', async () => {
    const filterProductsDto: FilterProductsDto = {
      skip: 0,
      limit: 10,
      productBrand: 'Test Brand',
      productModel: 'Test Model',
      productCategory: 'Test Category',
      productColor: 'Test Color',
    };

    const mockFilteredProducts = [
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
    ];

    (productModel.find().exec as jest.Mock).mockResolvedValue(
      mockFilteredProducts,
    );
    (productModel.countDocuments().exec as jest.Mock).mockResolvedValue(
      mockFilteredProducts.length,
    );

    const result =
      await productsRepository.findFilteredProducts(filterProductsDto);

    expect(result).toMatchObject({
      totalCount: mockFilteredProducts.length,
      products: mockFilteredProducts,
    });
  });

  it('should find a product by product SKU successfully', async () => {
    const productSku = '12345';
    const mockProduct = {
      productSku: productSku,
      productName: 'Test Product',
      productBrand: 'Test Brand',
      productModel: 'Test Model',
      productCategory: 'Test Category',
      productColor: 'Test Color',
      productPrice: 100,
      productCurrency: 'USD',
      productStock: 10,
    };

    (productModel.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProduct),
    });

    const result = await productsRepository.getProductByProductSku(productSku);

    expect(result).toEqual(mockProduct);
    expect(productModel.findOne).toHaveBeenCalledWith({ productSku });
  });

  it('should count products by product SKUs successfully', async () => {
    const expectedCount = 3;

    (productModel.countDocuments as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(expectedCount),
    });

    const result = await productsRepository.countProducts();

    expect(result).toEqual(expectedCount);
  });
});
