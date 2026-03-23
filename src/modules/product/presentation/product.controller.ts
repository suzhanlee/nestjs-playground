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
import { ProductApplicationService } from '../application/services/product.application.service';
import {
  CreateProductRequest,
  UpdateProductRequest,
  DecreaseStockRequest,
  IncreaseStockRequest,
  ChangePriceRequest,
  ProductResponseDto,
} from '../application';

/**
 * Product Controller
 *
 * This is a thin HTTP layer that:
 * - Maps HTTP requests to application service methods
 * - Handles HTTP-specific concerns (status codes, response format)
 * - NO business logic here
 *
 * Spring Equivalent:
 * @RestController
 * @RequestMapping("/products")
 * public class ProductController {
 *     @Autowired
 *     private ProductService productService;
 *
 *     @PostMapping
 *     public ResponseEntity<Product> create(@RequestBody @Valid CreateProductRequest request) {
 *         return ResponseEntity.status(201).body(productService.create(request));
 *     }
 * }
 */
@Controller('products')
export class ProductController {
  constructor(private readonly applicationService: ProductApplicationService) {}

  /**
   * Create a new product
   * POST /products
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() request: CreateProductRequest): Promise<ProductResponseDto> {
    return await this.applicationService.create(request);
  }

  /**
   * Get all products
   * GET /products
   */
  @Get()
  async findAll(): Promise<ProductResponseDto[]> {
    return await this.applicationService.findAll();
  }

  /**
   * Get product by ID
   * GET /products/:id
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductResponseDto> {
    return await this.applicationService.findById(+id);
  }

  /**
   * Search products by name
   * GET /products/search?name=value
   */
  @Get('search')
  async searchByName(@Query('name') name: string): Promise<ProductResponseDto[]> {
    return await this.applicationService.searchByName(name);
  }

  /**
   * Get products with low stock
   * GET /products/low-stock?threshold=10
   */
  @Get('low-stock')
  async findLowStock(@Query('threshold') threshold?: string): Promise<ProductResponseDto[]> {
    const thresholdNum = threshold ? +threshold : 10;
    return await this.applicationService.findLowStock(thresholdNum);
  }

  /**
   * Update product
   * PATCH /products/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() request: UpdateProductRequest,
  ): Promise<ProductResponseDto> {
    return await this.applicationService.update(+id, request);
  }

  /**
   * Delete product
   * DELETE /products/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.applicationService.delete(+id);
  }

  /**
   * Decrease product stock
   * POST /products/:id/decrease-stock
   */
  @Post(':id/decrease-stock')
  async decreaseStock(
    @Param('id') id: string,
    @Body() request: DecreaseStockRequest,
  ): Promise<ProductResponseDto> {
    return await this.applicationService.decreaseStock(+id, request);
  }

  /**
   * Increase product stock
   * POST /products/:id/increase-stock
   */
  @Post(':id/increase-stock')
  async increaseStock(
    @Param('id') id: string,
    @Body() request: IncreaseStockRequest,
  ): Promise<ProductResponseDto> {
    return await this.applicationService.increaseStock(+id, request);
  }

  /**
   * Change product price
   * POST /products/:id/change-price
   */
  @Post(':id/change-price')
  async changePrice(
    @Param('id') id: string,
    @Body() request: ChangePriceRequest,
  ): Promise<ProductResponseDto> {
    return await this.applicationService.changePrice(+id, request);
  }

  /**
   * Get product count
   * GET /products/count/total
   */
  @Get('count/total')
  async count(): Promise<{ count: number }> {
    const count = await this.applicationService.count();
    return { count };
  }
}
