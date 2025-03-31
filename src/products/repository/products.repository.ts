import { Injectable } from '@nestjs/common';
import { Product } from './schemas/product.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { FilterProductsDto } from '../dto/filter-products.dto';
import { CountProductsForNonDeletedProductsReportRepositoryDto } from '../dto/count-products-for-non-deleted-products-report.dto';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async getProductByProductSku(productSku: string): Promise<Product | null> {
    return this.productModel.findOne({ productSku }).exec();
  }

  async createProduct(createProudctDto: CreateProductDto): Promise<Product> {
    return this.productModel.create(createProudctDto);
  }

  async updateProduct(
    updateProductDto: UpdateProductDto,
  ): Promise<Product | null> {
    return this.productModel.findOneAndUpdate(
      { productSku: updateProductDto.productSku },
      updateProductDto,
      { new: true },
    );
  }

  async findFilteredProducts(
    filterProductsDto: FilterProductsDto,
  ): Promise<any> {
    const { skip, limit } = filterProductsDto;
    const query = {
      productIsActive: true,
    };

    if (filterProductsDto.productSku) {
      query['productSku'] = filterProductsDto.productSku;
    }

    if (filterProductsDto.productName) {
      query['productName'] = filterProductsDto.productName;
    }

    if (filterProductsDto.productBrand) {
      query['productBrand'] = filterProductsDto.productBrand;
    }

    if (filterProductsDto.productModel) {
      query['productModel'] = filterProductsDto.productModel;
    }

    if (filterProductsDto.productCategory) {
      query['productCategory'] = filterProductsDto.productCategory;
    }

    if (filterProductsDto.productColor) {
      query['productColor'] = filterProductsDto.productColor;
    }

    if (
      filterProductsDto.productMinPrice &&
      filterProductsDto.productMaxPrice
    ) {
      query['productPrice'] = {
        $gte: filterProductsDto.productMinPrice,
        $lte: filterProductsDto.productMaxPrice,
      };
    } else if (filterProductsDto.productMinPrice) {
      query['productPrice'] = { $gte: filterProductsDto.productMinPrice };
    } else if (filterProductsDto.productMaxPrice) {
      query['productPrice'] = { $lte: filterProductsDto.productMaxPrice };
    }

    if (filterProductsDto.productCurrency) {
      query['productCurrency'] = filterProductsDto.productCurrency;
    }

    if (
      filterProductsDto.productMinStock &&
      filterProductsDto.productMaxStock
    ) {
      query['productStock'] = {
        $gte: filterProductsDto.productMinStock,
        $lte: filterProductsDto.productMaxStock,
      };
    } else if (filterProductsDto.productMinStock) {
      query['productStock'] = { $gte: filterProductsDto.productMinStock };
    } else if (filterProductsDto.productMaxStock) {
      query['productStock'] = { $lte: filterProductsDto.productMaxStock };
    }

    const totalCount = await this.productModel.countDocuments(query).exec();
    const products = await this.productModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      totalCount,
      products,
    };
  }

  async countProducts(): Promise<number> {
    const count = await this.productModel.countDocuments().exec();
    return count;
  }

  async countDeletedProducts(): Promise<number> {
    const count = await this.productModel
      .countDocuments({
        productIsActive: false,
      })
      .exec();
    return count;
  }

  async countProductsForNonDeletedProductsReport(
    countProductsForNonDeletedProductsReportRepositoryDto: CountProductsForNonDeletedProductsReportRepositoryDto,
  ): Promise<number> {
    const {
      productWithPrice,
      productCreatedAtStartDate,
      productCreatedAtEndDate,
    } = countProductsForNonDeletedProductsReportRepositoryDto;
    const query = {};

    if (productWithPrice === true) {
      query['productPrice'] = { $exists: true, $ne: null };
    } else if (productWithPrice === false) {
      query['$or'] = [
        { productPrice: { $exists: false } },
        { productPrice: null },
      ];
    }

    if (productCreatedAtStartDate && productCreatedAtEndDate) {
      query['productCreatedAt'] = {
        $gte: productCreatedAtStartDate,
        $lte: productCreatedAtEndDate,
      };
    }

    const count = await this.productModel.countDocuments(query).exec();

    return count;
  }

  async totalProductsByProductBrand(): Promise<
    { productBrand: string; count: number }[]
  > {
    const result = await this.productModel
      .aggregate([
        {
          $group: {
            _id: '$productBrand',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            productBrand: '$_id',
            count: 1,
          },
        },
        {
          $sort: { productBrand: 1 },
        },
      ])
      .exec();

    return result as { productBrand: string; count: number }[];
  }
}
