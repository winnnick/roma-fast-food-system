import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiJwtAuthGuard, ApiPermissionsGuard, RequirePermissions } from '@roma/shared';
import type { ProductView } from '../../application/catalog/catalog.views';
import {
  ChangeProductFeaturedCommand,
  ChangeProductInventoryControlCommand,
  ChangeProductStatusCommand,
  CreateProductCommand,
  UpdateProductCommand,
} from '../../application/products/product.commands';
import { GetProductByIdQuery, ListProductsQuery } from '../../application/products/product.queries';
import {
  ProductFeaturedDto,
  ProductInventoryControlDto,
  ProductStatusDto,
  UpsertProductDto,
} from './dto/product.dto';

@ApiTags('Productos')
@ApiBearerAuth()
@UseGuards(ApiJwtAuthGuard, ApiPermissionsGuard)
@RequirePermissions('PRODUCTOS_VER')
@Controller('productos')
export class ProductsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista los productos del menú.' })
  list(): Promise<ProductView[]> {
    return this.queryBus.execute(new ListProductsQuery());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un producto por identificador.' })
  getById(@Param('id', ParseIntPipe) id: number): Promise<ProductView> {
    return this.queryBus.execute(new GetProductByIdQuery(id));
  }

  @Post()
  @RequirePermissions('PRODUCTOS_CREAR')
  @ApiOperation({ summary: 'Crea un producto del menú.' })
  create(@Body() dto: UpsertProductDto): Promise<ProductView> {
    return this.commandBus.execute(new CreateProductCommand(this.toInput(dto)));
  }

  @Put(':id')
  @RequirePermissions('PRODUCTOS_EDITAR')
  @ApiOperation({ summary: 'Actualiza un producto del menú.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertProductDto,
  ): Promise<ProductView> {
    return this.commandBus.execute(new UpdateProductCommand(id, this.toInput(dto)));
  }

  @Patch(':id/estado')
  @RequirePermissions('PRODUCTOS_DESACTIVAR')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProductStatusDto,
  ): Promise<ProductView> {
    return this.commandBus.execute(new ChangeProductStatusCommand(id, dto.estado));
  }

  @Patch(':id/destacado')
  @RequirePermissions('PRODUCTOS_EDITAR')
  changeFeatured(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProductFeaturedDto,
  ): Promise<ProductView> {
    return this.commandBus.execute(new ChangeProductFeaturedCommand(id, dto.destacado));
  }

  @Patch(':id/control-inventario')
  @RequirePermissions('PRODUCTOS_EDITAR')
  changeInventoryControl(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProductInventoryControlDto,
  ): Promise<ProductView> {
    return this.commandBus.execute(
      new ChangeProductInventoryControlCommand(id, dto.controlInventario),
    );
  }

  private toInput(dto: UpsertProductDto) {
    return {
      code: dto.codigo,
      name: dto.nombre,
      description: dto.descripcion,
      categoryId: dto.categoriaId,
      price: dto.precio,
      availablePedidosYa: dto.disponiblePedidosYa,
      pedidosYaPrice: dto.precioPedidosYa,
      featured: dto.destacado,
      preparationMode: dto.modoPreparacion,
      inventoryControl: dto.controlInventario,
      imageUrl: dto.imagenUrl,
    };
  }
}
