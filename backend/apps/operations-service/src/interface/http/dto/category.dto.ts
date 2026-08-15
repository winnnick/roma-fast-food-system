import { IsIn, IsString, Length } from 'class-validator';

export class UpsertCategoryDto {
  @IsString()
  @Length(3, 100)
  nombre!: string;

  @IsString()
  @Length(5, 300)
  descripcion!: string;
}

export class CategoryStatusDto {
  @IsIn(['Activo', 'Inactivo'])
  estado!: 'Activo' | 'Inactivo';
}
