import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type ModelDelegate = Prisma.TypeMap['model'][keyof Prisma.TypeMap['model']];

type WhereUniqueInput<D extends ModelDelegate> = Prisma.Args<D, 'findUniqueOrThrow'>['where'];
type WhereInput<D extends ModelDelegate> = Prisma.Args<D, 'findMany'>['where'];
type OrderByInput<D extends ModelDelegate> = Prisma.Args<D, 'findMany'>['orderBy'];
type CreateInput<D extends ModelDelegate> = Prisma.Args<D, 'create'>['data'];
type UpdateInput<D extends ModelDelegate> = Prisma.Args<D, 'update'>['data'];
type Include<D extends ModelDelegate> = Prisma.Args<D, 'findUniqueOrThrow'>['include'];
type Select<D extends ModelDelegate> = Prisma.Args<D, 'findUniqueOrThrow'>['select'];

export abstract class BaseRepository<TModel, TDelegate extends ModelDelegate> {
    protected constructor(protected readonly delegate: TDelegate) { }

    async findUnique(params: { where: WhereUniqueInput<TDelegate>; include?: Include<TDelegate>; select?: Select<TDelegate>; }): Promise<TModel | null> {
        try {
            return await (this.delegate as any).findUnique(params) as TModel | null;
        } catch (error) {
            this.logError('findUnique', error, { where: params.where });
            throw new InternalServerErrorException('Error retrieving the record.');
        }
    }

    async findMany(params?: { skip?: number; take?: number; cursor?: WhereUniqueInput<TDelegate>; where?: WhereInput<TDelegate>; orderBy?: OrderByInput<TDelegate>; select?: Select<TDelegate>; include?: Include<TDelegate>; }): Promise<TModel[]> {
        try {
            return await (this.delegate as any).findMany(params) as TModel[];
        } catch (error) {
            this.logError('findMany', error, { params });
            throw new InternalServerErrorException('Error retrieving records.');
        }
    }

    async create(params: { data: CreateInput<TDelegate>; include?: Include<TDelegate>; select?: Select<TDelegate>; }): Promise<TModel> {
        try {
            return await (this.delegate as any).create(params) as TModel;
        } catch (error) {
            this.logError('create', error, { data: params.data });
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(`Unique constraint violation: ${this.getTargetFields(error)}`);
            }
            throw new InternalServerErrorException('Error creating the record.');
        }
    }

    async update(params: { where: WhereUniqueInput<TDelegate>; data: UpdateInput<TDelegate>; include?: Include<TDelegate>; select?: Select<TDelegate>; }): Promise<TModel> {
        try {
            return await (this.delegate as any).update(params) as TModel;
        } catch (error) {
            this.logError('update', error, { where: params.where });
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') throw new NotFoundException('Record to update not found.');
                if (error.code === 'P2002') throw new ConflictException(`Unique constraint violation: ${this.getTargetFields(error)}`);
            }
            throw new InternalServerErrorException('Error updating the record.');
        }
    }

    async delete(params: { where: WhereUniqueInput<TDelegate>; include?: Include<TDelegate>; select?: Select<TDelegate>; }): Promise<TModel> {
        try {
            return await (this.delegate as any).delete(params) as TModel;
        } catch (error) {
            this.logError('delete', error, { where: params.where });
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException('Record to delete not found.');
            }
            throw new InternalServerErrorException('Error deleting the record.');
        }
    }

    async count(params?: { where?: WhereInput<TDelegate>; }): Promise<number> {
        try {
            return await (this.delegate as any).count(params);
        } catch (error) {
            this.logError('count', error, { where: params?.where });
            throw new InternalServerErrorException('Error counting records.');
        }
    }

    protected logError(message: string, error: any, context?: Record<string, unknown>): void {
        console.error(`[${this.constructor.name}] ${message}`, { error: error?.message ?? error, code: error?.code, context });
    }

    protected getTargetFields(error: any): string {
        return error.meta?.target?.join(', ') ?? 'details unavailable';
    }
}