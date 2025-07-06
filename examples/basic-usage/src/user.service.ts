import { Injectable } from '@nestjs/common';
import { Cacheable } from '../../../src/decorators/cacheable.decorator';

@Injectable()
export class UserService {
  // Simulate database calls
  private users = new Map([
    ['1', { id: '1', name: 'John Doe', email: 'john@example.com' }],
    ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com' }],
    ['3', { id: '3', name: 'Bob Johnson', email: 'bob@example.com' }],
  ]);

  private userProfiles = new Map([
    [
      '1',
      {
        id: '1',
        bio: 'Software Engineer',
        location: 'San Francisco',
        skills: ['TypeScript', 'NestJS'],
      },
    ],
    [
      '2',
      {
        id: '2',
        bio: 'Product Manager',
        location: 'New York',
        skills: ['Product Strategy', 'Agile'],
      },
    ],
    [
      '3',
      {
        id: '3',
        bio: 'Designer',
        location: 'Los Angeles',
        skills: ['UI/UX', 'Figma'],
      },
    ],
  ]);

  @Cacheable({ key: 'user', ttl: 300 })
  async getUser(id: string) {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }

  @Cacheable({
    key: 'user:profile',
    ttl: 600,
    scope: 'module',
    moduleName: 'UserModule',
  })
  async getUserProfile(id: string) {
    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    const profile = this.userProfiles.get(id);
    if (!profile) {
      throw new Error(`Profile for user ${id} not found`);
    }

    return profile;
  }

  // Method without caching for comparison
  async getUserWithoutCache(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }
}
