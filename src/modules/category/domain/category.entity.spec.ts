import { describe, it, expect } from '@jest/globals';
import { Category } from './category.entity';
import {
  InvalidCategoryNameException,
  CategoryCircularReferenceException,
  CategoryDepthExceededException,
} from '../../../../common';

describe('Category Entity', () => {
  describe('create', () => {
    it('TC-UNIT-001: [P0] should create a category with valid data', () => {
      // Given: 유효한 name, 옵션 parentId
      const name = '전자기기';
      const parentId = null;

      // When: Category.create(name, parentId)
      const category = Category.create({ name, parentId });

      // Then: Category 인스턴스 생성, 모든 속성 정상 설정
      expect(category).toBeInstanceOf(Category);
      expect(category.name).toBe(name);
      expect(category.parentId).toBe(parentId);
      expect(category.level).toBe(0);
      expect(category.isActive).toBe(true);
    });

    it('TC-UNIT-001: [P0] should create a child category with valid parentId', () => {
      // Given: 부모 카테고리 ID와 유효한 하위 카테고리 이름
      const name = '노트북';
      const parentId = 1;

      // When: Category.create with parentId
      const category = Category.create({ name, parentId, parentLevel: 0 });

      // Then: level이 1로 설정됨
      expect(category.name).toBe(name);
      expect(category.parentId).toBe(parentId);
      expect(category.level).toBe(1);
    });

    it('TC-UNIT-002: [P1] should throw exception when name is null', () => {
      // Given: name이 null
      const name = null as unknown as string;
      const parentId = null;

      // When & Then: Category.create(null, parentId) throws InvalidArgumentException
      expect(() => Category.create({ name, parentId })).toThrow(InvalidCategoryNameException);
    });

    it('TC-UNIT-003: [P1] should throw exception when name is empty string', () => {
      // Given: name이 빈 문자열
      const name = '';
      const parentId = null;

      // When & Then: Category.create("", parentId) throws InvalidArgumentException
      expect(() => Category.create({ name, parentId })).toThrow(InvalidCategoryNameException);
    });

    it('should throw exception when name is whitespace only', () => {
      // Given: name이 공백만
      const name = '   ';
      const parentId = null;

      // When & Then
      expect(() => Category.create({ name, parentId })).toThrow(InvalidCategoryNameException);
    });

    it('should throw exception when name exceeds max length', () => {
      // Given: name이 101자
      const name = 'a'.repeat(101);
      const parentId = null;

      // When & Then
      expect(() => Category.create({ name, parentId })).toThrow(InvalidCategoryNameException);
    });

    it('should create category when name is exactly max length (100)', () => {
      // Given: name이 100자
      const name = 'a'.repeat(100);
      const parentId = null;

      // When
      const category = Category.create({ name, parentId });

      // Then
      expect(category.name).toBe(name);
    });

    it('should throw exception when level exceeds 2 (max depth 3)', () => {
      // Given: parentLevel이 2 (level 3 생성 시도)
      const name = '하위카테고리';
      const parentId = 1;
      const parentLevel = 2;

      // When & Then
      expect(() => Category.create({ name, parentId, parentLevel })).toThrow(
        CategoryDepthExceededException,
      );
    });

    it('should create category with isActive = false', () => {
      // Given: isActive가 false
      const name = '비활성카테고리';
      const parentId = null;
      const isActive = false;

      // When
      const category = Category.create({ name, parentId, isActive });

      // Then
      expect(category.isActive).toBe(false);
    });
  });

  describe('hasProducts', () => {
    it('TC-UNIT-004: [P0] should return true when products array has items', () => {
      // Given: products 배열이 1개 이상인 카테고리
      const category = Category.create({ name: '전자기기', parentId: null });
      (category as any)._products = [{ id: 1, name: '노트북' }];

      // When: category.hasProducts()
      const result = category.hasProducts();

      // Then: true 반환
      expect(result).toBe(true);
    });

    it('TC-UNIT-005: [P0] should return false when products array is empty', () => {
      // Given: products 배열이 비어있는 카테고리
      const category = Category.create({ name: '전자기기', parentId: null });
      (category as any)._products = [];

      // When: category.hasProducts()
      const result = category.hasProducts();

      // Then: false 반환
      expect(result).toBe(false);
    });
  });

  describe('hasChildren', () => {
    it('TC-UNIT-006: [P1] should return true when children array has items', () => {
      // Given: children 배열이 1개 이상인 카테고리
      const category = Category.create({ name: '전자기기', parentId: null });
      (category as any)._children = [{ id: 2, name: '노트북' }];

      // When: category.hasChildren()
      const result = category.hasChildren();

      // Then: true 반환
      expect(result).toBe(true);
    });

    it('TC-UNIT-007: [P1] should return false when children array is empty', () => {
      // Given: children 배열이 비어있는 카테고리
      const category = Category.create({ name: '전자기기', parentId: null });
      (category as any)._children = [];

      // When: category.hasChildren()
      const result = category.hasChildren();

      // Then: false 반환
      expect(result).toBe(false);
    });
  });

  describe('getLevel', () => {
    it('TC-UNIT-008: [P1] should return 0 for root category (no parent)', () => {
      // Given: parentId가 null인 카테고리
      const category = Category.create({ name: '전자기기', parentId: null });

      // When: category.getLevel()
      const result = category.getLevel();

      // Then: 0 반환
      expect(result).toBe(0);
    });

    it('TC-UNIT-009: [P1] should return 1 or more for child category', () => {
      // Given: parentId가 있는 카테고리
      const category = Category.create({ name: '노트북', parentId: 1, parentLevel: 0 });

      // When: category.getLevel()
      const result = category.getLevel();

      // Then: 1 이상 반환
      expect(result).toBe(1);
    });

    it('should return 2 for second level child', () => {
      // Given: parentLevel이 1인 카테고리
      const category = Category.create({ name: '게이밍노트북', parentId: 2, parentLevel: 1 });

      // When
      const result = category.getLevel();

      // Then: 2 반환
      expect(result).toBe(2);
    });
  });

  describe('canDelete', () => {
    it('TC-UNIT-010: [P2] should return true when category can be deleted', () => {
      // Given: 상품 없고, 하위 카테고리 없고, 유일한 카테고리 아님
      const category = Category.create({ name: '전자기기', parentId: null });
      (category as any)._products = [];
      (category as any)._children = [];

      // When: category.canDelete(totalCategoryCount)
      const result = category.canDelete(2);

      // Then: true 반환
      expect(result).toBe(true);
    });

    it('TC-UNIT-011: [P2] should return false when category has products', () => {
      // Given: 상품이 있는 카테고리
      const category = Category.create({ name: '전자기기', parentId: null });
      (category as any)._products = [{ id: 1, name: '노트북' }];

      // When: category.canDelete(totalCategoryCount)
      const result = category.canDelete(2);

      // Then: false 반환
      expect(result).toBe(false);
    });

    it('TC-UNIT-012: [P2] should return false when it is the last category', () => {
      // Given: totalCategoryCount가 1인 경우
      const category = Category.create({ name: '전자기기', parentId: null });
      (category as any)._products = [];
      (category as any)._children = [];

      // When: category.canDelete(1)
      const result = category.canDelete(1);

      // Then: false 반환
      expect(result).toBe(false);
    });

    it('should return false when category has children', () => {
      // Given: 하위 카테고리가 있는 카테고리
      const category = Category.create({ name: '전자기기', parentId: null });
      (category as any)._products = [];
      (category as any)._children = [{ id: 2, name: '노트북' }];

      // When
      const result = category.canDelete(2);

      // Then: false 반환
      expect(result).toBe(false);
    });
  });

  describe('changeName', () => {
    it('should change name successfully', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null });
      const newName = '가전제품';

      // When
      category.changeName(newName);

      // Then
      expect(category.name).toBe(newName);
    });

    it('should throw exception when new name is empty', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null });

      // When & Then
      expect(() => category.changeName('')).toThrow(InvalidCategoryNameException);
    });

    it('should emit CategoryNameChangedEvent', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null });
      const newName = '가전제품';

      // When
      category.changeName(newName);

      // Then
      const events = category.domainEvents;
      expect(events.length).toBeGreaterThan(0);
      expect(events[events.length - 1].constructor.name).toContain('NameChanged');
    });
  });

  describe('changeParent', () => {
    it('should change parent successfully', () => {
      // Given
      const category = Category.create({ name: '노트북', parentId: 1, parentLevel: 0 });
      const newParentId = 5;
      const newParentLevel = 0;

      // When
      category.changeParent(newParentId, newParentLevel);

      // Then
      expect(category.parentId).toBe(newParentId);
      expect(category.level).toBe(1);
    });

    it('should throw exception when new level exceeds 2', () => {
      // Given: 현재 level 1인 카테고리
      const category = Category.create({ name: '노트북', parentId: 1, parentLevel: 0 });
      const newParentId = 5;
      const newParentLevel = 2; // 새로운 level은 3이 되어야 함

      // When & Then
      expect(() => category.changeParent(newParentId, newParentLevel)).toThrow(
        CategoryDepthExceededException,
      );
    });

    it('should throw exception when circular reference detected (self)', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null });
      (category as any)._id = 1;

      // When & Then: 자기 자신을 부모로 설정 시도
      expect(() => category.changeParent(1, 0)).toThrow(CategoryCircularReferenceException);
    });
  });

  describe('activate', () => {
    it('should set isActive to true', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null, isActive: false });

      // When
      category.activate();

      // Then
      expect(category.isActive).toBe(true);
    });

    it('should emit CategoryActivatedEvent', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null, isActive: false });

      // When
      category.activate();

      // Then
      const events = category.domainEvents;
      const activatedEvent = events.find(
        (e: any) => e.constructor.name === 'CategoryActivatedEvent',
      );
      expect(activatedEvent).toBeDefined();
    });

    it('should not emit event when already active', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null, isActive: true });
      const eventsBefore = category.domainEvents.length;

      // When
      category.activate();

      // Then: 이벤트가 추가되지 않음
      expect(category.domainEvents.length).toBe(eventsBefore);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null, isActive: true });

      // When
      category.deactivate();

      // Then
      expect(category.isActive).toBe(false);
    });

    it('should emit CategoryDeactivatedEvent', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null, isActive: true });

      // When
      category.deactivate();

      // Then
      const events = category.domainEvents;
      const deactivatedEvent = events.find(
        (e: any) => e.constructor.name === 'CategoryDeactivatedEvent',
      );
      expect(deactivatedEvent).toBeDefined();
    });

    it('should not emit event when already inactive', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null, isActive: false });
      const eventsBefore = category.domainEvents.length;

      // When
      category.deactivate();

      // Then: 이벤트가 추가되지 않음
      expect(category.domainEvents.length).toBe(eventsBefore);
    });
  });

  describe('markAsDeleted', () => {
    it('should emit CategoryDeletedEvent', () => {
      // Given
      const category = Category.create({ name: '전자기기', parentId: null });
      (category as any)._id = 1;

      // When
      category.markAsDeleted();

      // Then
      const events = category.domainEvents;
      const deletedEvent = events.find((e: any) => e.constructor.name === 'CategoryDeletedEvent');
      expect(deletedEvent).toBeDefined();
    });
  });
});
