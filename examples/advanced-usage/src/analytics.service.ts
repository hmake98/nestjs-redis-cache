import { Injectable } from '@nestjs/common';
import { Cacheable } from '../../../src/decorators/cacheable.decorator';

@Injectable()
export class AnalyticsService {
  // Simulate analytics data
  private dashboardData = {
    '7d': {
      revenue: 125000,
      orders: 1250,
      customers: 890,
      conversionRate: 3.2,
      topProducts: ['iPhone 15 Pro', 'MacBook Air', 'Samsung Galaxy S24'],
    },
    '30d': {
      revenue: 485000,
      orders: 4850,
      customers: 3200,
      conversionRate: 3.1,
      topProducts: ['iPhone 15 Pro', 'MacBook Air', 'Nike Air Max'],
    },
    '90d': {
      revenue: 1420000,
      orders: 14200,
      customers: 8900,
      conversionRate: 3.0,
      topProducts: ['iPhone 15 Pro', 'MacBook Air', 'Adidas Ultraboost'],
    },
  };

  private productAnalytics = new Map([
    [
      '1',
      {
        views: 15420,
        sales: 1250,
        revenue: 1249990,
        conversionRate: 8.1,
        avgRating: 4.5,
        reviews: 890,
      },
    ],
    [
      '2',
      {
        views: 8920,
        sales: 680,
        revenue: 815992,
        conversionRate: 7.6,
        avgRating: 4.7,
        reviews: 450,
      },
    ],
  ]);

  private salesData = {
    '2024-01-01': { revenue: 4500, orders: 45 },
    '2024-01-02': { revenue: 5200, orders: 52 },
    '2024-01-03': { revenue: 4800, orders: 48 },
    '2024-01-04': { revenue: 6100, orders: 61 },
    '2024-01-05': { revenue: 5500, orders: 55 },
  };

  @Cacheable({
    key: 'analytics:dashboard',
    ttl: 1800, // 30 minutes
    scope: 'global',
  })
  async getDashboardAnalytics(period: string = '7d') {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const data = this.dashboardData[period];
    if (!data) {
      throw new Error(`Analytics data for period ${period} not found`);
    }

    return {
      period,
      ...data,
      timestamp: new Date().toISOString(),
    };
  }

  @Cacheable({
    key: 'analytics:product',
    ttl: 3600, // 1 hour
    scope: 'module',
    moduleName: 'AnalyticsModule',
  })
  async getProductAnalytics(id: string, period: string = '30d') {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const analytics = this.productAnalytics.get(id);
    if (!analytics) {
      throw new Error(`Analytics for product ${id} not found`);
    }

    // Simulate period-specific calculations
    const periodMultiplier = period === '7d' ? 0.25 : period === '30d' ? 1 : 3;

    return {
      productId: id,
      period,
      views: Math.floor(analytics.views * periodMultiplier),
      sales: Math.floor(analytics.sales * periodMultiplier),
      revenue: Math.floor(analytics.revenue * periodMultiplier),
      conversionRate: analytics.conversionRate,
      avgRating: analytics.avgRating,
      reviews: Math.floor(analytics.reviews * periodMultiplier),
      timestamp: new Date().toISOString(),
    };
  }

  @Cacheable({
    key: 'analytics:sales',
    ttl: 900, // 15 minutes
    scope: 'global',
  })
  async getSalesAnalytics(start: string, end: string) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const startDate = new Date(start);
    const endDate = new Date(end);
    const sales = [];
    let totalRevenue = 0;
    let totalOrders = 0;

    // Simulate date range calculation
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = this.salesData[dateStr] || { revenue: 0, orders: 0 };

      sales.push({
        date: dateStr,
        ...dayData,
      });

      totalRevenue += dayData.revenue;
      totalOrders += dayData.orders;
    }

    return {
      period: { start, end },
      sales,
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        days: sales.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Method without caching for comparison
  async getDashboardAnalyticsWithoutCache(period: string = '7d') {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const data = this.dashboardData[period];
    if (!data) {
      throw new Error(`Analytics data for period ${period} not found`);
    }

    return {
      period,
      ...data,
      timestamp: new Date().toISOString(),
    };
  }
}
