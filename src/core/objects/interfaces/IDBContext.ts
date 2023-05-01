import IDBSet from './IDBSet';
export default interface IDBContext
{
    Collection<T>(cTor : {new (...args : any[]) : T}) : IDBSet<T> | undefined;
    UpdateDatabaseAsync() : Promise<void>;
    ExecuteNonQuery(query : string) : Promise<void>;
    ExecuteQuery(query : string) : Promise<any>;        
}
