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
  Put,
  Query,
} from '@nestjs/common';
import { ProductService } from '../application/services/product.service';
import { CreateProductDto } from '../application/dto/create-product.dto';
import { UpdateProductDto } from '../application/dto/update-product.dto';
import { DecreaseStockDto } from '../application/dto/decrease-stock.dto';
import { ProductResponseDto } from '../application/dto/product-response.dto';

/**
 * Product Controller
 * (similar to @RestController in Spring)
 *
 * Spring Equivalent:
 * @RestController
 * @RequestMapping("/products")
 * public class ProductController {
 *     @Autowired
 *     private ProductService productService;
 *
 *     @GetMapping
 *     public List<Product> getAll() { ... }
 *
 *     @PostMapping
 *     public ResponseEntity<Product> create(@RequestBody CreateProductRequest request) { ... }
 * }
 */
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Create a new product
   * POST /products
   * Spring: @PostMapping public ResponseEntity<Product> create(@RequestBody @Valid CreateProductRequest request)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return await this.productService.create(dto);
  }

  /**
   * Get all products
   * GET /products
   * Spring: @GetMapping public List<Product> getAll()
   */
  @Get()
  async findAll(): Promise<ProductResponseDto[]> {
    return await this.productService.findAll();
  }

  /**
   * Get product by ID
   * GET /products/:id
   * Spring: @GetMapping("/{id}") public Product getById(@PathVariable Long id)
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductResponseDto> {
    return await this.productService.findById(+id);
  }

  /**
   * Search products by name
   * GET /products/search?name=value
   * Spring: @GetMapping("/search") public List<Product> searchByName(@RequestParam String name)
   */
  @Get('search')
  async searchByName(@Query('name') name: string): Promise<ProductResponseDto[]> {
    return await this.productService.searchByName(name);
  }

  /**
   * Get products with low stock
   * GET /products/low-stock?threshold=10
   */
  @Get('low-stock')
  async findLowStock(@Query('threshold') threshold?: string): Promise<ProductResponseDto[]> {
    const thresholdNum = threshold ? +threshold : 10;
    return await this.productService.findLowStock(thresholdNum);
  }

  /**
   * Update product (full update)
   * PUT /products/:id
   * Spring: @PutMapping("/{id}") public Product update(@PathVariable Long id, @RequestBody UpdateProductRequest request)
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productService.update(+id, dto);
  }

  /**
   * Partial update (PATCH)
   * PATCH /products/:id
   */
  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<ProductResponseDto> {
    return await this.productService.update(+id, dto);
  }

  /**
   * Delete product
   * DELETE /products/:id
   * Spring: @DeleteMapping("/{id}") public void delete(@PathVariable Long id)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.productService.delete(+id);
  }

  /**
   * Decrease product stock
   * POST /products/:id/decrease-stock
   */
  @Post(':id/decrease-stock')
  async decreaseStock(
    @Param('id') id: string,
    @Body() dto: DecreaseStockDto,
  ): Promise<ProductResponseDto> {
    return await this.productService.decreaseStock(+id, dto);
  }

  /**
   * Increase product stock
   * POST /products/:id/increase-stock
   */
  @Post(':id/increase-stock')
  async increaseStock(
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ): Promise<ProductResponseDto> {
    return await this.productService.increaseStock(+id, body.quantity);
  }

  /**
   * Get product count
   * GET /products/count/total
   */
  @Get('count/total')
  async count(): Promise<{ count: number }> {
    const count = await this.productService.count();
    return { count };
  }
}
