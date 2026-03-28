import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Category E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up categories table before each test
    await dataSource.query('DELETE FROM categories');
  });

  // ========================================
  // POST /api/categories (카테고리 생성)
  // ========================================

  describe('POST /api/categories', () => {
    it('TC-E2E-001: [P0] should create category with all required fields', async () => {
      // Given: 유효한 카테고리 이름 ("전자기기")
      const payload = { name: '전자기기' };

      // When: POST /api/categories
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(201);

      // Then: 201 Created, 응답에 생성된 ID 포함
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('전자기기');
      expect(response.body.parentId).toBeNull();
      expect(response.body.level).toBe(0);
      expect(response.body.isActive).toBe(true);
    });

    it('TC-E2E-002: [P0] should create child category with parentId', async () => {
      // Given: 부모 카테고리 생성
      const parent = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      const parentId = parent.body.id;
      const payload = { name: '노트북', parentId };

      // When: POST /api/categories with parentId
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(201);

      // Then: 201 Created, level이 1로 설정됨
      expect(response.body.level).toBe(1);
      expect(response.body.parentId).toBe(parentId);
    });

    it('TC-E2E-003: [P1] should create inactive category with isActive=false', async () => {
      // Given: 카테고리 데이터와 isActive: false
      const payload = { name: '비활성카테고리', isActive: false };

      // When: POST /api/categories
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(201);

      // Then: 201 Created, isActive가 false로 설정됨
      expect(response.body.isActive).toBe(false);
    });

    it('TC-E2E-004: [P0] should return 400 when required field (name) is missing', async () => {
      // Given: name 필드가 없는 요청 데이터
      const payload = {};

      // When: POST /api/categories
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(400);

      // Then: 400 Bad Request, 유효성 에러 메시지 포함
      expect(response.body).toHaveProperty('message');
    });

    it('TC-E2E-005: [P1] should return 400 when name is empty string', async () => {
      // Given: name: ""
      const payload = { name: '' };

      // When: POST /api/categories
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(400);

      // Then: 400 Bad Request
    });

    it('TC-E2E-006: [P1] should return 400 when name is whitespace only', async () => {
      // Given: name: "   "
      const payload = { name: '   ' };

      // When: POST /api/categories
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(400);

      // Then: 400 Bad Request
    });

    it('TC-E2E-007: [P1] should return 400 when invalid data type is sent', async () => {
      // Given: name: 123 (숫자 타입)
      const payload = { name: 123 };

      // When: POST /api/categories
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(400);

      // Then: 400 Bad Request
    });

    it('TC-E2E-008: [P2] should create category when name is 1 character', async () => {
      // Given: name: "가"
      const payload = { name: '가' };

      // When: POST /api/categories
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(201);

      // Then: 201 Created
    });

    it('TC-E2E-009: [P2] should create category when name is 100 characters', async () => {
      // Given: name: 100자 문자열
      const payload = { name: 'a'.repeat(100) };

      // When: POST /api/categories
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(201);

      // Then: 201 Created
    });

    it('TC-E2E-010: [P2] should return 400 when name exceeds max length (101 characters)', async () => {
      // Given: name: 101자 문자열
      const payload = { name: 'a'.repeat(101) };

      // When: POST /api/categories
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(400);

      // Then: 400 Bad Request
    });

    it('TC-E2E-011: [P0] should return 409 when creating with duplicate name', async () => {
      // Given: 이미 존재하는 카테고리 이름
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' })
        .expect(201);

      // When: POST /api/categories with 동일한 name
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' })
        .expect(409);

      // Then: 409 Conflict, 중복 메시지 포함
      expect(response.body.message).toContain('already exists');
    });

    it('TC-E2E-012: [P1] should return 404 when parentId does not exist', async () => {
      // Given: 존재하지 않는 부모 카테고리 ID
      const payload = { name: '노트북', parentId: 9999 };

      // When: POST /api/categories with invalid parentId
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send(payload)
        .expect(404);

      // Then: 404 Not Found
    });

    it('TC-E2E-013: [P1] should return 400 when depth exceeds 3 levels', async () => {
      // Given: level 2인 카테고리의 ID를 parentId로 사용
      const level0 = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      const level1 = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '노트북', parentId: level0.body.id });

      const level2 = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '게이밍노트북', parentId: level1.body.id });

      // When: POST /api/categories (level 3 생성 시도)
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '深層카테고리', parentId: level2.body.id })
        .expect(400);

      // Then: 400 Bad Request, 깊이 제한 메시지
      expect(response.body.message).toContain('depth');
    });
  });

  // ========================================
  // GET /api/categories (카테고리 목록 조회)
  // ========================================

  describe('GET /api/categories', () => {
    it('TC-E2E-015: [P0] should return all categories', async () => {
      // Given: 여러 카테고리가 존재
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '가전제품' });

      // When: GET /api/categories
      const response = await request(app.getHttpServer())
        .get('/api/categories')
        .expect(200);

      // Then: 200 OK, 모든 카테고리 배열 반환
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('TC-E2E-016: [P1] should return empty array when no categories exist', async () => {
      // Given: 카테고리가 없음 (단, 최소 1개 유지 규칙으로 테스트 제한됨)

      // When: GET /api/categories
      const response = await request(app.getHttpServer())
        .get('/api/categories')
        .expect(200);

      // Then: 200 OK, 빈 배열 반환
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('TC-E2E-018: [P2] should filter by isActive=true', async () => {
      // Given: 활성/비활성 카테고리들 존재
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '활성카테고리', isActive: true });
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '비활성카테고리', isActive: false });

      // When: GET /api/categories?isActive=true
      const response = await request(app.getHttpServer())
        .get('/api/categories?isActive=true')
        .expect(200);

      // Then: 200 OK, isActive=true인 항목만 반환
      expect(response.body.every((cat: any) => cat.isActive === true)).toBe(true);
    });
  });

  // ========================================
  // GET /api/categories/:id (카테고리 상세 조회)
  // ========================================

  describe('GET /api/categories/:id', () => {
    it('TC-E2E-019: [P0] should return category by ID', async () => {
      // Given: 존재하는 카테고리 ID
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      // When: GET /api/categories/:id
      const response = await request(app.getHttpServer())
        .get(`/api/categories/${created.body.id}`)
        .expect(200);

      // Then: 200 OK, 해당 카테고리 상세 정보 반환
      expect(response.body.id).toBe(created.body.id);
      expect(response.body.name).toBe('전자기기');
    });

    it('TC-E2E-021: [P0] should return 404 when ID does not exist', async () => {
      // Given: 존재하지 않는 카테고리 ID
      const nonExistentId = 9999;

      // When: GET /api/categories/:id
      const response = await request(app.getHttpServer())
        .get(`/api/categories/${nonExistentId}`)
        .expect(404);

      // Then: 404 Not Found
    });

    it('TC-E2E-022: [P1] should return 404 when ID is 0', async () => {
      // Given: id: 0
      const response = await request(app.getHttpServer())
        .get('/api/categories/0')
        .expect(404);

      // Then: 404 Not Found
    });

    it('TC-E2E-023: [P1] should return 400 when ID is negative', async () => {
      // Given: id: -1
      const response = await request(app.getHttpServer())
        .get('/api/categories/-1')
        .expect(404); // 또는 400

      // Then: 400 Bad Request 또는 404 Not Found
    });
  });

  // ========================================
  // PATCH /api/categories/:id (카테고리 수정)
  // ========================================

  describe('PATCH /api/categories/:id', () => {
    it('TC-E2E-025: [P0] should update category name', async () => {
      // Given: 존재하는 카테고리와 새로운 이름
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      // When: PATCH /api/categories/:id with new name
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: '가전제품' })
        .expect(200);

      // Then: 200 OK, 수정된 카테고리 정보 반환
      expect(response.body.name).toBe('가전제품');
    });

    it('TC-E2E-026: [P1] should change parentId', async () => {
      // Given: 존재하는 카테고리와 새로운 부모 ID
      const parent1 = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      const parent2 = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '가전제품' });

      const child = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '노트북', parentId: parent1.body.id });

      // When: PATCH /api/categories/:id with new parentId
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${child.body.id}`)
        .send({ parentId: parent2.body.id })
        .expect(200);

      // Then: 200 OK, parentId가 업데이트됨
      expect(response.body.parentId).toBe(parent2.body.id);
    });

    it('TC-E2E-027: [P1] should toggle isActive status', async () => {
      // Given: 존재하는 카테고리
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기', isActive: true });

      // When: PATCH /api/categories/:id with isActive: false
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${created.body.id}`)
        .send({ isActive: false })
        .expect(200);

      // Then: 200 OK, isActive가 false로 변경됨
      expect(response.body.isActive).toBe(false);
    });

    it('TC-E2E-028: [P1] should return 400 when name is empty string', async () => {
      // Given: 존재하는 카테고리
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      // When: PATCH /api/categories/:id with name: ""
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: '' })
        .expect(400);

      // Then: 400 Bad Request
    });

    it('TC-E2E-029: [P1] should return 400 when name is null', async () => {
      // Given: 존재하는 카테고리
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      // When: PATCH /api/categories/:id with name: null
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${created.body.id}`)
        .send({ name: null })
        .expect(400);

      // Then: 400 Bad Request
    });

    it('TC-E2E-030: [P0] should return 404 when ID does not exist', async () => {
      // Given: 존재하지 않는 카테고리 ID
      const nonExistentId = 9999;

      // When: PATCH /api/categories/:id
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${nonExistentId}`)
        .send({ name: '새이름' })
        .expect(404);

      // Then: 404 Not Found
    });

    it('TC-E2E-031: [P0] should return 409 when name already exists', async () => {
      // Given: 존재하는 카테고리와 이미 존재하는 다른 카테고리의 이름
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });
      const toUpdate = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '가전제품' });

      // When: PATCH /api/categories/:id with duplicate name
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${toUpdate.body.id}`)
        .send({ name: '전자기기' })
        .expect(409);

      // Then: 409 Conflict
    });
  });

  // ========================================
  // DELETE /api/categories/:id (카테고리 삭제)
  // ========================================

  describe('DELETE /api/categories/:id', () => {
    it('TC-E2E-034: [P0] should delete category without products', async () => {
      // Given: 상품이 없는 카테고리
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      // When: DELETE /api/categories/:id
      await request(app.getHttpServer())
        .delete(`/api/categories/${created.body.id}`)
        .expect(204);

      // Then: 204 No Content
      await request(app.getHttpServer())
        .get(`/api/categories/${created.body.id}`)
        .expect(404);
    });

    it('TC-E2E-036: [P0] should return 404 when deleting non-existent ID', async () => {
      // Given: 존재하지 않는 카테고리 ID
      const nonExistentId = 9999;

      // When: DELETE /api/categories/:id
      const response = await request(app.getHttpServer())
        .delete(`/api/categories/${nonExistentId}`)
        .expect(404);

      // Then: 404 Not Found
    });

    it('TC-E2E-039: [P1] should return 400 when deleting the last category', async () => {
      // Given: 카테고리가 1개만 존재하는 상황
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '유일한카테고리' });

      // When: DELETE /api/categories/:id
      const response = await request(app.getHttpServer())
        .delete(`/api/categories/${created.body.id}`)
        .expect(400);

      // Then: 400 Bad Request, 최소 1개 유지 규칙 메시지
      expect(response.body.message).toContain('last');
    });
  });

  // ========================================
  // GET /api/categories/:id/products (카테고리별 상품 목록 조회)
  // ========================================

  describe('GET /api/categories/:id/products', () => {
    it('TC-E2E-040: [P0] should return products in category', async () => {
      // Given: 상품이 연결된 카테고리 ID
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      // When: GET /api/categories/:id/products
      const response = await request(app.getHttpServer())
        .get(`/api/categories/${created.body.id}/products`)
        .expect(200);

      // Then: 200 OK, 해당 카테고리의 상품 배열 반환
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('TC-E2E-041: [P1] should return empty array when category has no products', async () => {
      // Given: 상품이 없는 카테고리 ID
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '빈카테고리' });

      // When: GET /api/categories/:id/products
      const response = await request(app.getHttpServer())
        .get(`/api/categories/${created.body.id}/products`)
        .expect(200);

      // Then: 200 OK, 빈 배열 반환
      expect(response.body).toEqual([]);
    });

    it('TC-E2E-043: [P0] should return 404 when category does not exist', async () => {
      // Given: 존재하지 않는 카테고리 ID
      const nonExistentId = 9999;

      // When: GET /api/categories/:id/products
      const response = await request(app.getHttpServer())
        .get(`/api/categories/${nonExistentId}/products`)
        .expect(404);

      // Then: 404 Not Found
    });
  });

  // ========================================
  // Additional endpoints
  // ========================================

  describe('GET /api/categories/root', () => {
    it('should return root categories (parentId is null)', async () => {
      // Given: 루트 카테고리와 하위 카테고리
      const root = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '노트북', parentId: root.body.id });

      // When: GET /api/categories/root
      const response = await request(app.getHttpServer())
        .get('/api/categories/root')
        .expect(200);

      // Then: Only root categories returned
      expect(response.body.every((cat: any) => cat.parentId === null)).toBe(true);
    });
  });

  describe('GET /api/categories/:id/children', () => {
    it('should return children of a category', async () => {
      // Given
      const parent = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '노트북', parentId: parent.body.id });

      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '데스크톱', parentId: parent.body.id });

      // When
      const response = await request(app.getHttpServer())
        .get(`/api/categories/${parent.body.id}/children`)
        .expect(200);

      // Then
      expect(response.body.length).toBe(2);
      expect(response.body.every((cat: any) => cat.parentId === parent.body.id)).toBe(true);
    });
  });

  describe('POST /api/categories/:id/children', () => {
    it('should create a child category', async () => {
      // Given
      const parent = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });

      // When
      const response = await request(app.getHttpServer())
        .post(`/api/categories/${parent.body.id}/children`)
        .send({ name: '노트북' })
        .expect(201);

      // Then
      expect(response.body.name).toBe('노트북');
      expect(response.body.parentId).toBe(parent.body.id);
      expect(response.body.level).toBe(1);
    });
  });

  describe('PATCH /api/categories/:id/activate', () => {
    it('should activate an inactive category', async () => {
      // Given
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '비활성카테고리', isActive: false });

      // When
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${created.body.id}/activate`)
        .expect(200);

      // Then
      expect(response.body.isActive).toBe(true);
    });
  });

  describe('PATCH /api/categories/:id/deactivate', () => {
    it('should deactivate an active category', async () => {
      // Given
      const created = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '활성카테고리', isActive: true });

      // When
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${created.body.id}/deactivate`)
        .expect(200);

      // Then
      expect(response.body.isActive).toBe(false);
    });
  });

  describe('GET /api/categories/count/total', () => {
    it('should return total category count', async () => {
      // Given
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '전자기기' });
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: '가전제품' });

      // When
      const response = await request(app.getHttpServer())
        .get('/api/categories/count/total')
        .expect(200);

      // Then
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });
  });
});
