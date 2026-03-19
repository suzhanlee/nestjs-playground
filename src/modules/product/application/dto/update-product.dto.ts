import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * DTO for updating a product
 * (similar to @RequestBody in Spring for PUT/PATCH)
 *
 * Spring Equivalent:
 * public class UpdateProductRequest {
 *     private String name;
 *     private String description;
 *     private Integer price;
 *     private Integer stock;
 * }
 *
 * Uses PartialType to make all fields optional (like PATCH semantics)
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
