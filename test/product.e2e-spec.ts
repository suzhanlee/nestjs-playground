import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { Product } from '../src/modules/product/domain';

/**
 * E2E Tests for Product Module
 *
 * These tests verify the entire flow from HTTP request to database,
 * ensuring all components work together correctly.
 */
describe('ProductController (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set up the same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();

    // Get DataSource for cleanup
    dataSource = app.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up database
    if (dataSource) {
      await dataSource.createQueryBuilder().delete().from(Product).execute();
    }
    await app.close();
  });

  afterEach(async () => {
    // Clean up after each test
    if (dataSource) {
      await dataSource.createQueryBuilder().delete().from(Product).execute();
    }
  });

  describe('POST /api/products', () => {
    it('should create a new product', () => {
      const productData = {
        name: 'Test Laptop',
        description: 'High-performance laptop',
        price: 99999,
        stock: 10,
      };

      return request(app.getHttpServer())
        .post('/api/products')
        .send(productData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(productData.name);
          expect(res.body.description).toBe(productData.description);
          expect(res.body.price).toBe(productData.price);
          expect(res.body.stock).toBe(productData.stock);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          expect(res.body).toHaveProperty('priceFormatted');
          expect(res.body).toHaveProperty('totalValue');
          expect(res.body).toHaveProperty('isInStock');
          expect(res.body).toHaveProperty('isLowStock');
          expect(res.body).toHaveProperty('isOutOfStock');
        });
    });

    it('should create a product without description', () => {
      const productData = {
        name: 'Simple Product',
        price: 5000,
        stock: 5,
      };

      return request(app.getHttpServer())
        .post('/api/products')
        .send(productData)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(productData.name);
          expect(res.body.description).toBeNull();
        });
    });

    it('should reject request with missing required fields', () => {
      const productData = {
        name: 'Incomplete Product',
      };

      return request(app.getHttpServer()).post('/api/products').send(productData).expect(400);
    });

    it('should reject request with negative price', () => {
      const productData = {
        name: 'Invalid Product',
        price: -100,
        stock: 10,
      };

      return request(app.getHttpServer()).post('/api/products').send(productData).expect(400);
    });

    it('should reject request with negative stock', () => {
      const productData = {
        name: 'Invalid Product',
        price: 1000,
        stock: -5,
      };

      return request(app.getHttpServer()).post('/api/products').send(productData).expect(400);
    });

    it('should reject request with extra fields', () => {
      const productData = {
        name: 'Test Product',
        price: 1000,
        stock: 10,
        extraField: 'should be rejected',
      };

      return request(app.getHttpServer()).post('/api/products').send(productData).expect(400);
    });
  });

  describe('GET /api/products', () => {
    it('should return empty array when no products exist', () => {
      return request(app.getHttpServer()).get('/api/products').expect(200).expect([]);
    });

    it('should return all products', async () => {
      // Create test products
      await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Product 1', price: 1000, stock: 5 });

      await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Product 2', price: 2000, stock: 10 });

      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
        });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by id', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Test Product', price: 1000, stock: 10 });

      const productId = createResponse.body.id;

      return request(app.getHttpServer())
        .get(`/api/products/${productId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(productId);
          expect(res.body.name).toBe('Test Product');
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer()).get('/api/products/999999').expect(404);
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update product name', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Original Name', price: 1000, stock: 10 });

      const productId = createResponse.body.id;

      return request(app.getHttpServer())
        .patch(`/api/products/${productId}`)
        .send({ name: 'Updated Name' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Name');
        });
    });

    it('should update product price', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Test Product', price: 10000, stock: 10 });

      const productId = createResponse.body.id;

      return request(app.getHttpServer())
        .patch(`/api/products/${productId}`)
        .send({ price: 14000 }) // Within 50% limit
        .expect(200)
        .expect((res) => {
          expect(res.body.price).toBe(14000);
        });
    });

    it('should reject price increase over 50%', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Test Product', price: 10000, stock: 10 });

      const productId = createResponse.body.id;

      return request(app.getHttpServer())
        .patch(`/api/products/${productId}`)
        .send({ price: 16000 }) // Over 50% increase
        .expect(400);
    });

    it('should return 404 when updating non-existent product', () => {
      return request(app.getHttpServer())
        .patch('/api/products/999999')
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  describe('POST /api/products/:id/change-price', () => {
    it('should change product price', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Test Product', price: 10000, stock: 10 });

      const productId = createResponse.body.id;

      return request(app.getHttpServer())
        .post(`/api/products/${productId}/change-price`)
        .send({ price: 14000 })
        .expect(200)
        .expect((res) => {
          expect(res.body.price).toBe(14000);
        });
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'To Delete', price: 1000, stock: 10 });

      const productId = createResponse.body.id;

      return request(app.getHttpServer()).delete(`/api/products/${productId}`).expect(204);
    });

    it('should return 404 when deleting non-existent product', () => {
      return request(app.getHttpServer()).delete('/api/products/999999').expect(404);
    });

    it('should return 404 when getting deleted product', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'To Delete', price: 1000, stock: 10 });

      const productId = createResponse.body.id;

      await request(app.getHttpServer()).delete(`/api/products/${productId}`).expect(204);

      return request(app.getHttpServer()).get(`/api/products/${productId}`).expect(404);
    });
  });

  describe('POST /api/products/:id/decrease-stock', () => {
    it('should decrease product stock', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Stock Test', price: 1000, stock: 10 });

      const productId = createResponse.body.id;

      return request(app.getHttpServer())
        .post(`/api/products/${productId}/decrease-stock`)
        .send({ quantity: 3 })
        .expect(200)
        .expect((res) => {
          expect(res.body.stock).toBe(7);
        });
    });

    it('should return error for insufficient stock', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Low Stock', price: 1000, stock: 2 });

      const productId = createResponse.body.id;

      return request(app.getHttpServer())
        .post(`/api/products/${productId}/decrease-stock`)
        .send({ quantity: 5 })
        .expect(400);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .post('/api/products/999999/decrease-stock')
        .send({ quantity: 1 })
        .expect(404);
    });
  });

  describe('POST /api/products/:id/increase-stock', () => {
    it('should increase product stock', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Stock Increase', price: 1000, stock: 10 });

      const productId = createResponse.body.id;

      return request(app.getHttpServer())
        .post(`/api/products/${productId}/increase-stock`)
        .send({ quantity: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.stock).toBe(15);
        });
    });
  });

  describe('GET /api/products/count/total', () => {
    it('should return product count', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Product 1', price: 1000, stock: 10 });

      await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Product 2', price: 2000, stock: 5 });

      return request(app.getHttpServer())
        .get('/api/products/count/total')
        .expect(200)
        .expect((res) => {
          expect(res.body.count).toBe(2);
        });
    });

    it('should return 0 when no products', () => {
      return request(app.getHttpServer())
        .get('/api/products/count/total')
        .expect(200)
        .expect((res) => {
          expect(res.body.count).toBe(0);
        });
    });
  });
});
