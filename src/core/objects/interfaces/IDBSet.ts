import IStatement from "./IStatement";


export default interface IDBSet<T>
{
    AddAsync(obj : T) : Promise<T>;
    UpdateAsync(obj : T) : Promise<T>;
    DeleteAsync(obj : T) : Promise<T>;
    Where(statement : IStatement<T>) : IDBSet<T>;
    And(statement : IStatement<T>) : IDBSet<T>;
    Or(statement : IStatement<T>) : IDBSet<T>;
    OrderBy<K extends keyof T>(key : K) : IDBSet<T>;
    OrderDescendingBy<K extends keyof T>(key : K) : IDBSet<T>;
    Limit(limit : number) : IDBSet<T>;
    ToListAsync() : Promise<T[]>;
    FirstOrDefaultAsync() : Promise<T | undefined>;
}