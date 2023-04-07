import IStatement from "./IStatement";


export default interface IDBSet<T>
{
    AddAsync(obj : T) : Promise<T>;
    UpdateAsync(obj : T) : Promise<T>;
    DeleteAsync(obj : T) : Promise<T>;
    Where<K extends keyof T>(statement : IStatement<T, K>) : IDBSet<T>;
    And<K extends keyof T>(statement : IStatement<T, K>) : IDBSet<T>;
    Or<K extends keyof T>(statement : IStatement<T, K>) : IDBSet<T>;
    OrderBy<K extends keyof T>(key : K) : IDBSet<T>;    
    OrderDescendingBy<K extends keyof T>(key : K) : IDBSet<T>;
    Join<K extends keyof T>(key : K) : IDBSet<T>;
    Limit(limit : number) : IDBSet<T>;
    ToListAsync() : Promise<T[]>;
    FirstOrDefaultAsync() : Promise<T | undefined>;
}