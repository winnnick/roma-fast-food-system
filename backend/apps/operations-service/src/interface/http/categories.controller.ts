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
import {
  ChangeCategoryStatusCommand,
  CreateCategoryCommand,
  UpdateCategoryCommand,
} from '../../application/categories/category.commands';
import {
  GetCategoryByIdQuery,
  ListCategoriesQuery,
} from '../../application/categories/category.queries';
import type { CategoryView } from '../../application/catalog/catalog.views';
import { CategoryStatusDto, UpsertCategoryDto } from './dto/category.dto';

@ApiTags('Categorías')
@ApiBearerAuth()
@UseGuards(ApiJwtAuthGuard, ApiPermissionsGuard)
@RequirePermissions('PRODUCTOS_VER')
@Controller('categorias')
export class CategoriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista las categorías del menú.' })
  list(): Promise<CategoryView[]> {
    return this.queryBus.execute(new ListCategoriesQuery());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene una categoría por identificador.' })
  getById(@Param('id', ParseIntPipe) id: number): Promise<CategoryView> {
    return this.queryBus.execute(new GetCategoryByIdQuery(id));
  }

  @Post()
  @RequirePermissions('CATEGORIAS_GESTIONAR')
  @ApiOperation({ summary: 'Crea una categoría del menú.' })
  create(@Body() dto: UpsertCategoryDto): Promise<CategoryView> {
    return this.commandBus.execute(new CreateCategoryCommand(dto.nombre, dto.descripcion));
  }

  @Put(':id')
  @RequirePermissions('CATEGORIAS_GESTIONAR')
  @ApiOperation({ summary: 'Actualiza una categoría del menú.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertCategoryDto,
  ): Promise<CategoryView> {
    return this.commandBus.execute(new UpdateCategoryCommand(id, dto.nombre, dto.descripcion));
  }

  @Patch(':id/estado')
  @RequirePermissions('CATEGORIAS_GESTIONAR')
  @ApiOperation({ summary: 'Activa o desactiva una categoría.' })
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CategoryStatusDto,
  ): Promise<CategoryView> {
    return this.commandBus.execute(new ChangeCategoryStatusCommand(id, dto.estado));
  }
}
