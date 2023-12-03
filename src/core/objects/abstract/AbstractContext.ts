import IDBContext, { IJoiningQuery, IThreeQueryableObject } from "../interfaces/IDBContext";
import IDBSet from "../interfaces/IDBSet";


export default abstract class AbstractContext implements IDBContext , IThreeQueryableObject
{
    abstract Collection<T extends Object>(cTor: new (...args: any[]) => T): IDBSet<T>;
    abstract UpdateDatabaseAsync(): Promise<void> ;
    abstract ExecuteNonQuery(query: string): Promise<void> ;
    abstract ExecuteQuery(query: string): Promise<any> ;
    abstract Join(...args: (new (...args: any[]) => Object)[]): IJoiningQuery ;
    
}

