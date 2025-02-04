// import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { DataSource, Repository } from 'typeorm';

// @Injectable()
// export class ProductSettingsRepository extends Repository<ProductSettings> {
//   constructor(dataSource: DataSource) {
//     super(ProductSettings, dataSource.createEntityManager());
//   }

//   async createAndUpdateProductSettings(id: number, product: Product, productSettingsDto: productSettingsDto) {
//     try {
//       if (product.product_settings) {
//         this.merge(product.product_settings, productSettingsDto);

//         await this.save(product.product_settings);
//       } else {
//         const newSetting = this.create({ ...productSettingsDto, product: { id } });
//         product.product_settings = newSetting;
//         await this.save(newSetting);
//       }
//     } catch (error) {
//       console.log(error.message);
//       throw new InternalServerErrorException('Failed to create product settings');
//     }
//   }
// }
