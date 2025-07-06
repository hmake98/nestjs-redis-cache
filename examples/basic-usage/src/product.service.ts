import { Injectable } from '@nestjs/common';
import { Cacheable } from '../../../src/decorators/cacheable.decorator';

@Injectable()
export class ProductService {
  // Simulate database calls
  private products = new Map([
    ['1', { id: '1', name: 'Laptop', price: 999.99, category: 'Electronics' }],
    [
      '2',
      { id: '2', name: 'Smartphone', price: 699.99, category: 'Electronics' },
    ],
    [
      '3',
      { id: '3', name: 'Headphones', price: 199.99, category: 'Electronics' },
    ],
    ['4', { id: '4', name: 'Coffee Mug', price: 19.99, category: 'Home' }],
    ['5', { id: '5', name: 'Desk Chair', price: 299.99, category: 'Office' }],
  ]);

  private productDetails = new Map([
    [
      '1',
      {
        id: '1',
        description: 'High-performance laptop with latest specs',
        specifications: { cpu: 'Intel i7', ram: '16GB', storage: '512GB SSD' },
        reviews: [{ rating: 5, comment: 'Great laptop!' }],
      },
    ],
    [
      '2',
      {
        id: '2',
        description: 'Latest smartphone with advanced camera',
        specifications: { screen: '6.1"', camera: '48MP', battery: '4000mAh' },
        reviews: [{ rating: 4, comment: 'Good phone' }],
      },
    ],
    [
      '3',
      {
        id: '3',
        description: 'Wireless noise-canceling headphones',
        specifications: {
          type: 'Over-ear',
          connectivity: 'Bluetooth 5.0',
          battery: '30h',
        },
        reviews: [{ rating: 5, comment: 'Excellent sound quality' }],
      },
    ],
  ]);

  @Cacheable({ key: 'product', ttl: 180 })
  async getProduct(id: string) {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 80));

    const product = this.products.get(id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }

    return product;
  }

  @Cacheable({
    key: 'product:details',
    ttl: 900, // 15 minutes
    scope: 'global',
  })
  async getProductDetails(id: string) {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 120));

    const details = this.productDetails.get(id);
    if (!details) {
      throw new Error(`Details for product ${id} not found`);
    }

    return details;
  }

  // Method without caching for comparison
  async getProductWithoutCache(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 80));

    const product = this.products.get(id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }

    return product;
  }
}
