import { Injectable } from '@nestjs/common';
import { Cacheable } from '../../../src/decorators/cacheable.decorator';

@Injectable()
export class EcommerceService {
  // Simulate database data
  private products = new Map([
    [
      '1',
      {
        id: '1',
        name: 'iPhone 15 Pro',
        price: 999.99,
        category: 'Electronics',
        brand: 'Apple',
      },
    ],
    [
      '2',
      {
        id: '2',
        name: 'MacBook Air',
        price: 1199.99,
        category: 'Electronics',
        brand: 'Apple',
      },
    ],
    [
      '3',
      {
        id: '3',
        name: 'Samsung Galaxy S24',
        price: 899.99,
        category: 'Electronics',
        brand: 'Samsung',
      },
    ],
    [
      '4',
      {
        id: '4',
        name: 'Nike Air Max',
        price: 129.99,
        category: 'Shoes',
        brand: 'Nike',
      },
    ],
    [
      '5',
      {
        id: '5',
        name: 'Adidas Ultraboost',
        price: 179.99,
        category: 'Shoes',
        brand: 'Adidas',
      },
    ],
  ]);

  private reviews = new Map([
    [
      '1',
      [
        { id: '1', rating: 5, comment: 'Amazing phone!', userId: 'user1' },
        {
          id: '2',
          rating: 4,
          comment: 'Great camera quality',
          userId: 'user2',
        },
        { id: '3', rating: 5, comment: 'Best iPhone ever', userId: 'user3' },
      ],
    ],
    [
      '2',
      [
        { id: '4', rating: 5, comment: 'Perfect for work', userId: 'user4' },
        {
          id: '5',
          rating: 4,
          comment: 'Lightweight and fast',
          userId: 'user5',
        },
      ],
    ],
  ]);

  private categories = new Map([
    ['Electronics', ['1', '2', '3']],
    ['Shoes', ['4', '5']],
  ]);

  @Cacheable({ key: 'product', ttl: 1800 }) // 30 minutes
  async getProduct(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const product = this.products.get(id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }

    return product;
  }

  @Cacheable({
    key: 'product:reviews',
    ttl: 3600, // 1 hour
    scope: 'module',
    moduleName: 'EcommerceModule',
  })
  async getProductReviews(id: string, page: number = 1) {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const reviews = this.reviews.get(id) || [];
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      reviews: reviews.slice(start, end),
      pagination: {
        page,
        pageSize,
        total: reviews.length,
        totalPages: Math.ceil(reviews.length / pageSize),
      },
    };
  }

  @Cacheable({
    key: 'product:related',
    ttl: 7200, // 2 hours
    scope: 'global',
  })
  async getRelatedProducts(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const product = this.products.get(id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }

    // Simulate finding related products by category
    const related = Array.from(this.products.values())
      .filter((p) => p.category === product.category && p.id !== id)
      .slice(0, 5);

    return related;
  }

  @Cacheable({
    key: 'category:products',
    ttl: 900, // 15 minutes
    scope: 'module',
    moduleName: 'EcommerceModule',
  })
  async getCategoryProducts(id: string, sort: string = 'name') {
    await new Promise((resolve) => setTimeout(resolve, 120));

    const productIds = this.categories.get(id) || [];
    const products = productIds
      .map((id) => this.products.get(id))
      .filter(Boolean);

    // Sort products
    if (sort === 'price') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'name') {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      category: id,
      products,
      total: products.length,
      sort,
    };
  }

  @Cacheable({
    key: 'search:products',
    ttl: 300, // 5 minutes
    scope: 'global',
  })
  async searchProducts(query: string, category?: string) {
    await new Promise((resolve) => setTimeout(resolve, 80));

    let products = Array.from(this.products.values());

    // Filter by category if specified
    if (category) {
      products = products.filter((p) => p.category === category);
    }

    // Filter by query
    const queryLower = query.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(queryLower) ||
        p.brand.toLowerCase().includes(queryLower),
    );

    return {
      query,
      category,
      results: products,
      total: products.length,
    };
  }
}
