import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
// Adjust path to your actual base repository file
import { BaseRepository, ModelDelegate } from './base.repository';
// Keep Prisma import only if needed for specific error types (like PrismaClientKnownRequestError)
// import { Prisma } from '@prisma/client';

// Simple type alias for ID
type IdType = string | number | any; // Use 'any' or more specific union if possible

// Utility types deriving specific args from Prisma.Args are removed due to complexity/instability

/**
* Abstract Base Service class providing common business logic operations.
* Relies on the BaseRepository for data access. Handles common exceptions.
* Uses an explicit TModel generic parameter.
*
* @template TModel The Prisma Model type (e.g., User, Post).
* @template TRepository The specific BaseRepository implementation type.
* @template TCreateDto The DTO type for creating entities.
* @template TUpdateDto The DTO type for updating entities.
*/
@Injectable()
export abstract class BaseService<
  TModel,
  TRepository extends BaseRepository<TModel, ModelDelegate>,
  TCreateDto,
  TUpdateDto
> {
  /**
   * Base Service Constructor
   * @param repository The repository instance for data access.
   * @param idKey The name of the primary key field (default: 'id').
   */
  protected constructor(
    protected readonly repository: TRepository,
    protected readonly idKey: string = 'id', // Use string as specific type isn't easily available
  ) { }

  /**
   * Creates a new entity using the provided DTO.
   * Handles ConflictException from the repository.
   */
  async create(
    createDto: TCreateDto,
    repoParams?: { include?: object; select?: object },
  ): Promise<TModel> {
    try {
      // Mapping/validation of createDto should ideally happen before this call
      // Cast to object assumes DTO is compatible or mapped beforehand
      const data = createDto as object;
      return await this.repository.create({ data, ...repoParams });
    } catch (error) {
      // Re-throw known exceptions from repository
      if (error instanceof ConflictException) throw error;
      // Log and wrap unexpected errors
      console.error(`[${this.constructor.name}] Error during create:`, error);
      throw new InternalServerErrorException(`Could not create ${this.getEntityName()}.`);
    }
  }

  /**
   * Retrieves multiple entities based on specified criteria.
   */
  async findMany(repoParams?: {
    skip?: number;
    take?: number;
    cursor?: object;
    where?: object;
    orderBy?: object | object[];
    select?: object;
    include?: object;
  }): Promise<TModel[]> {
    try {
      return await this.repository.findMany(repoParams);
    } catch (error) {
      console.error(`[${this.constructor.name}] Error during findMany:`, error);
      throw new InternalServerErrorException(`Could not retrieve ${this.getEntityName(true)}.`);
    }
  }

  /**
   * Finds a single entity by its primary identifier.
   * Throws NotFoundException if the entity does not exist.
   */
  async findOneById(
    id: IdType,
    repoParams?: { include?: object; select?: object },
  ): Promise<TModel> {
    const where = { [this.idKey]: id };
    let entity: TModel | null = null;

    try {
      // Call repository's findUnique
      entity = await this.repository.findUnique({ where, ...repoParams });
    } catch (error) {
      // Handle errors during the lookup itself
      console.error(`[${this.constructor.name}] Error during findOneById lookup for ID ${id}:`, error);
      throw new InternalServerErrorException(`An error occurred while retrieving ${this.getEntityName()} with ID ${id}.`);
    }

    // Check if entity was found after the potentially throwing call
    if (!entity) {
      throw new NotFoundException(`${this.getEntityName()} with ID ${id} not found.`);
    }
    return entity;
  }

  /**
   * Finds a single entity based on unique criteria.
   * Returns null if not found (doesn't throw NotFoundException itself).
   */
  async findUnique(params: {
    where: object;
    include?: object;
    select?: object;
  }): Promise<TModel | null> {
    try {
      return await this.repository.findUnique(params);
    } catch (error) {
      console.error(`[${this.constructor.name}] Error during findUnique:`, error);
      throw new InternalServerErrorException(`Could not retrieve ${this.getEntityName()}.`);
    }
  }

  /**
   * Updates an existing entity identified by its primary key.
   * Handles NotFoundException and ConflictException from the repository.
   */
  async update(
    id: IdType,
    updateDto: TUpdateDto,
    repoParams?: { include?: object; select?: object },
  ): Promise<TModel> {
    const where = { [this.idKey]: id };
    // Mapping/validation of updateDto should ideally happen before this call
    const data = updateDto as object; // Cast DTO to object

    try {
      // Repository's update method handles P2025 (NotFound) and P2002 (Conflict)
      return await this.repository.update({ where, data, ...repoParams });
    } catch (error) {
      // Re-throw known exceptions from repository
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      // Log and wrap unexpected errors
      console.error(`[${this.constructor.name}] Error during update for ID ${id}:`, error);
      throw new InternalServerErrorException(`Could not update ${this.getEntityName()} with ID ${id}.`);
    }
  }

  /**
   * Deletes an entity identified by its primary key.
   * Handles NotFoundException from the repository.
   */
  async delete(id: IdType): Promise<TModel> {
    const where = { [this.idKey]: id };
    try {
      // Repository's delete method handles P2025 (NotFound)
      return await this.repository.delete({ where });
    } catch (error) {
      // Re-throw known exception from repository
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Log and wrap unexpected errors
      console.error(`[${this.constructor.name}] Error during delete for ID ${id}:`, error);
      throw new InternalServerErrorException(`Could not delete ${this.getEntityName()} with ID ${id}.`);
    }
  }

  /**
   * Abstract method to get the entity name (singular).
   * Used for generating user-friendly error messages.
   * Concrete services MUST implement this.
   * @param plural - If true, should return the plural form. Defaults to false.
   */
  protected abstract getEntityName(plural?: boolean): string;
}