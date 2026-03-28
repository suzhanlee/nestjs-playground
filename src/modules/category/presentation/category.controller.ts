import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CategoryApplicationService } from '../application/services/category.application.service';
import {
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
  CategoryResponseDto,
} from '../application';

/**
 * Category Controller
 *
 * This is a thin HTTP layer that:
 * - Maps HTTP requests to application service methods
 * - Handles HTTP-specific concerns (status codes, response format)
 * - NO business logic here
 *
 * Spring Equivalent:
 * @RestController
 * @RequestMapping("/categories")
 * public class CategoryController {
 *     @Autowired
 *     private CategoryService categoryService;
 *
 *     @PostMapping
 *     public ResponseEntity<Category> create(@RequestBody @Valid CreateCategoryRequest request) {
 *         return ResponseEntity.status(201).body(categoryService.create(request));
 *     }
 * }
 */
@Controller('categories')
export class CategoryController {
  constructor(private readonly applicationService: CategoryApplicationService) {}

  /**
   * Create a new category
   * POST /categories
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() request: CreateCategoryRequestDto): Promise<CategoryResponseDto> {
    return await this.applicationService.create(request);
  }

  /**
   * Get all categories
   * GET /categories
   * Query params: isActive (optional filter)
   */
  @Get()
  async findAll(@Query('isActive') isActive?: string): Promise<CategoryResponseDto[]> {
    if (isActive !== undefined) {
      return await this.applicationService.findAll({
        isActive: isActive === 'true',
      });
    }
    return await this.applicationService.findAll();
  }

  /**
   * Get root categories (no parent)
   * GET /categories/root
   */
  @Get('root')
  async findRootCategories(): Promise<CategoryResponseDto[]> {
    return await this.applicationService.findRootCategories();
  }

  /**
   * Get category tree (all categories with hierarchy)
   * GET /categories/tree
   */
  @Get('tree')
  async findTree(): Promise<CategoryResponseDto[]> {
    return await this.applicationService.findTree();
  }

  /**
   * Get children of a category
   * GET /categories/:id/children
   */
  @Get(':id/children')
  async findChildren(@Param('id') id: string): Promise<CategoryResponseDto[]> {
    return await this.applicationService.findChildren(+id);
  }

  /**
   * Get products in a category
   * GET /categories/:id/products
   * Query params: includeDescendants (include products from subcategories)
   */
  @Get(':id/products')
  async findProducts(
    @Param('id') id: string,
    @Query('includeDescendants') includeDescendants?: string,
  ): Promise<any[]> {
    return await this.applicationService.findProducts(
      +id,
      includeDescendants === 'true',
    );
  }

  /**
   * Get category by ID
   * GET /categories/:id
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<CategoryResponseDto> {
    return await this.applicationService.findById(+id);
  }

  /**
   * Update category
   * PATCH /categories/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() request: UpdateCategoryRequestDto,
  ): Promise<CategoryResponseDto> {
    return await this.applicationService.update(+id, request);
  }

  /**
   * Delete category
   * DELETE /categories/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.applicationService.delete(+id);
  }

  /**
   * Create a child category
   * POST /categories/:id/children
   */
  @Post(':id/children')
  async createChild(
    @Param('id') id: string,
    @Body() body: { name: string; isActive?: boolean },
  ): Promise<CategoryResponseDto> {
    return await this.applicationService.createChild(+id, body.name, body.isActive);
  }

  /**
   * Move category to different parent
   * PATCH /categories/:id/move
   */
  @Patch(':id/move')
  async moveCategory(
    @Param('id') id: string,
    @Body() body: { parentId: number | null },
  ): Promise<CategoryResponseDto> {
    return await this.applicationService.moveCategory(+id, body.parentId);
  }

  /**
   * Activate category
   * PATCH /categories/:id/activate
   */
  @Patch(':id/activate')
  async activate(@Param('id') id: string): Promise<CategoryResponseDto> {
    return await this.applicationService.activate(+id);
  }

  /**
   * Deactivate category
   * PATCH /categories/:id/deactivate
   */
  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string): Promise<CategoryResponseDto> {
    return await this.applicationService.deactivate(+id);
  }

  /**
   * Get category count
   * GET /categories/count/total
   */
  @Get('count/total')
  async count(): Promise<{ count: number }> {
    const count = await this.applicationService.count();
    return { count };
  }
}
