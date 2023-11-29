import { PGDBSet } from "../../../Index";
import IDBSet, { IFluentField, IFluentQueryableObject } from "../interfaces/IDBSet";
import IStatement from "../interfaces/IStatement";

export default abstract class AbstractSet<T extends object> implements IDBSet<T> , IFluentQueryableObject<T, PGDBSet<T>>
{
    abstract AddAsync(obj: T): Promise<T> ;
    abstract UpdateAsync(obj: T): Promise<T> ;
    abstract UpdateSelectionAsync(): Promise<void> ;
    abstract Set<K extends keyof T>(key: K, value: T[K]): IDBSet<T>;
    abstract UpdateObjectAndRelationsAsync(obj: T, relations: (keyof T)[]): Promise<T> ;
    abstract DeleteAsync(obj: T): Promise<T> ;
    abstract DeleteSelectionAsync(): Promise<void> ;
    abstract Where<K extends keyof T>(statement: IStatement<T, K>): IDBSet<T> ;
    abstract And<K extends keyof T>(statement: IStatement<T, K>): IDBSet<T> ;
    abstract Or<K extends keyof T>(statement: IStatement<T, K>): IDBSet<T>;
    abstract OrderBy<K extends keyof T>(key: K): IDBSet<T> ;
    abstract OrderDescendingBy<K extends keyof T>(key: K): IDBSet<T>;
    abstract Take(quantity: number): IDBSet<T> ;
    abstract Offset(offset: number): IDBSet<T>;
    abstract Join<K extends keyof T>(key: K): IDBSet<T> ;
    abstract Limit(limit: number): IDBSet<T> ;
    abstract CountAsync(): Promise<number> ;
    abstract ToListAsync(): Promise<T[]> ;
    abstract FirstOrDefaultAsync(): Promise<T | undefined> ;
    abstract CleanQueryTree(): void ;
    abstract WhereField<K extends keyof T>(field: K): IFluentField<T, K, PGDBSet<T>> ;
    abstract WhereAsString(where: string): PGDBSet<T> ;
    abstract AndField<K extends keyof T>(field: K): IFluentField<T, K, PGDBSet<T>> ;
    abstract OrField<K extends keyof T>(field: K): IFluentField<T, K, PGDBSet<T>>;
    abstract LoadRelationOn<K extends keyof T>(field: K): PGDBSet<T> ;

}
