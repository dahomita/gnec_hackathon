import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BaseRepository, ModelDelegate } from '../database/base.repository';
import { Prisma } from '@prisma/client';

type IdType = string | number | any;
type RepositoryDelegateType<R extends BaseRepository<unknown, ModelDelegate>> =
  R extends BaseRepository<any, infer D> ? D : never;
type WhereUniqueInputFromRepo<R extends BaseRepository<unknown, ModelDelegate>> =
  Prisma.Args<RepositoryDelegateType<R>, 'findUniqueOrThrow'>['where'];

type WhereInputFromRepo<R extends BaseRepository<unknown, ModelDelegate>> =
  Prisma.Args<RepositoryDelegateType<R>, 'findMany'>['where'];

type OrderByInputFromRepo<R extends BaseRepository<unknown, ModelDelegate>> =
  Prisma.Args<RepositoryDelegateType<R>, 'findMany'>['orderBy'];

type IncludeFromRepo<R extends BaseRepository<unknown, ModelDelegate>> =
  Prisma.Args<RepositoryDelegateType<R>, 'findUniqueOrThrow'>['include'];

type SelectFromRepo<R extends BaseRepository<unknown, ModelDelegate>> =
  Prisma.Args<RepositoryDelegateType<R>, 'findUniqueOrThrow'>['select'];

@Injectable()
export abstract class BaseService<
  // Add TModel as an explicit generic parameter
  TModel,
  // Constrain TRepository using TModel
  TRepository extends BaseRepository<TModel, ModelDelegate>,
  TCreateDto,
  TUpdateDto
// Remove inferred TEntity
> {
  protected constructor(
    protected readonly repository: TRepository,
    // idKey constraint now indirectly depends on TModel via TRepository's delegate type inference
    protected readonly idKey: keyof WhereUniqueInputFromRepo<TRepository> = 'id' as any,
  ) { }

  async create(
    createDto: TCreateDto,
    repoParams?: {
      include?: IncludeFromRepo<TRepository>;
      select?: SelectFromRepo<TRepository>;
    },
  ): Promise<TModel> { // Use TModel
    try {
      const data = createDto as Prisma.Args<
        RepositoryDelegateType<TRepository>,
        'create'
      >['data'];
      // Return type is Promise<TModel>
      return await this.repository.create({ data, ...repoParams });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      console.error(`[${this.constructor.name}] Error during create:`, error);
      throw new InternalServerErrorException(`Could not create ${this.getEntityName()}.`);
    }
  }

  async findMany(repoParams?: {
    skip?: number;
    take?: number;
    cursor?: WhereUniqueInputFromRepo<TRepository>;
    where?: WhereInputFromRepo<TRepository>;
    orderBy?: OrderByInputFromRepo<TRepository>;
    select?: SelectFromRepo<TRepository>;
    include?: IncludeFromRepo<TRepository>;
  }): Promise<TModel[]> { // Use TModel[]
    try {
      // Return type is Promise<TModel[]>
      return await this.repository.findMany(repoParams);
    } catch (error) {
      console.error(`[${this.constructor.name}] Error during findMany:`, error);
      throw new InternalServerErrorException(`Could not retrieve ${this.getEntityName(true)}.`);
    }
  }

  async findOneById(
    id: IdType,
    repoParams?: {
      include?: IncludeFromRepo<TRepository>;
      select?: SelectFromRepo<TRepository>;
    },
  ): Promise<TModel> { // Use TModel
    const where = { [this.idKey]: id } as WhereUniqueInputFromRepo<TRepository>;
    // Use TModel here for the variable type
    let entity: TModel | null = null;

    try {
      // Await returns TModel | null, which is assignable to entity
      entity = await this.repository.findUnique({ where, ...repoParams });
    } catch (error) {
      console.error(`[${this.constructor.name}] Error during findOneById lookup for ID ${id}:`, error);
      throw new InternalServerErrorException(`An error occurred while retrieving ${this.getEntityName()} with ID ${id}.`);
    }

    if (!entity) {
      throw new NotFoundException(`${this.getEntityName()} with ID ${id} not found.`);
    }
    // No cast needed now, as entity is TModel after the null check
    return entity;
  }

  async findUnique(params: {
    where: WhereUniqueInputFromRepo<TRepository>;
    include?: IncludeFromRepo<TRepository>;
    select?: SelectFromRepo<TRepository>;
  }): Promise<TModel | null> { // Use TModel | null
    try {
      // Return type is Promise<TModel | null>
      return await this.repository.findUnique(params);
    } catch (error) {
      console.error(`[${this.constructor.name}] Error during findUnique:`, error);
      throw new InternalServerErrorException(`Could not retrieve ${this.getEntityName()}.`);
    }
  }

  async update(
    id: IdType,
    updateDto: TUpdateDto,
    repoParams?: {
      include?: IncludeFromRepo<TRepository>;
      select?: SelectFromRepo<TRepository>;
    },
  ): Promise<TModel> { // Use TModel
    const where = { [this.idKey]: id } as WhereUniqueInputFromRepo<TRepository>;
    const data = updateDto as Prisma.Args<
      RepositoryDelegateType<TRepository>,
      'update'
    >['data'];
    try {
      // Return type is Promise<TModel>
      return await this.repository.update({ where, data, ...repoParams });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      console.error(`[${this.constructor.name}] Error during update for ID ${id}:`, error);
      throw new InternalServerErrorException(`Could not update ${this.getEntityName()} with ID ${id}.`);
    }
  }

  async delete(id: IdType): Promise<TModel> { // Use TModel
    const where = { [this.idKey]: id } as WhereUniqueInputFromRepo<TRepository>;
    try {
      // Return type is Promise<TModel>
      return await this.repository.delete({ where });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`[${this.constructor.name}] Error during delete for ID ${id}:`, error);
      throw new InternalServerErrorException(`Could not delete ${this.getEntityName()} with ID ${id}.`);
    }
  }

  protected abstract getEntityName(plural?: boolean): string;
}