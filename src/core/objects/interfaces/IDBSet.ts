import IStatement from "./IStatement";


export default interface IDBSet<T extends Object>
{
    AddAsync(obj : T) : Promise<T>;
    UpdateAsync(obj : T) : Promise<T>;
    UpdateSelectionAsync() : Promise<void>;
    Set<K extends keyof T>(key: K, value : T[K]) : IDBSet<T>;
    UpdateObjectAndRelationsAsync(obj : T, relations : (keyof T)[]) : Promise<T>;
    DeleteAsync(obj : T) : Promise<T>;
    DeleteSelectionAsync() : Promise<void>;
    Where<K extends keyof T>(statement : IStatement<T, K>) : IDBSet<T>;
    And<K extends keyof T>(statement : IStatement<T, K>) : IDBSet<T>;
    Or<K extends keyof T>(statement : IStatement<T, K>) : IDBSet<T>;
    OrderBy<K extends keyof T>(key : K) : IDBSet<T>;    
    OrderDescendingBy<K extends keyof T>(key : K) : IDBSet<T>;
    Take(quantity : number) : IDBSet<T>;
    Offset(offset : number) : IDBSet<T>;
    Join<K extends keyof T>(key : K) : IDBSet<T>;
    Limit(limit : number) : IDBSet<T>;
    CountAsync() : Promise<number>;
    ToListAsync() : Promise<T[]>;
    FirstOrDefaultAsync() : Promise<T | undefined>;
    CleanQueryTree() : void;
}


export interface IFluentQueryableObject<T extends Object, R extends IDBSet<T>>
{
    WhereField<K extends keyof T>(field : K) : IFluentField<T, K, R>
    WhereAsString(where : string) : R;
    AndField<K extends keyof T>(field : K) : IFluentField<T, K, R>
    OrField<K extends keyof T>(field : K) : IFluentField<T, K, R>
    LoadRelationOn<K extends keyof T>(field : K) : R;    
}


export interface IFluentField<T extends Object, K extends keyof T, R extends IDBSet<T>>
{
    IsGreaterThan(value : T[K]) : R;
    IsEqualTo(value : T[K]) : R;
    IsNotEqualTo(value : T[K]) : R;
    IsSmallerThan(value : T[K]) : R;
    IsInsideIn(value : T[K][]) : R;
    Constains(value : T[K]) : R;
    StartsWith(value : T[K]) : R;
    EndsWith(value : T[K]) : R;
    IsNull() : R;    
}