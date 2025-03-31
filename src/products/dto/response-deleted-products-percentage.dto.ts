export class ResponseDeletedProductsPercentageDto {
  data: {
    totalDeletedProducts: number;
    totalProducts: number;
  };
  deletedProductsPercentage: {
    percentageDeletedProducts: string;
  };
}
