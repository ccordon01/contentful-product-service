import { Injectable } from '@nestjs/common';
import { Product } from './schemas/product.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

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
}
