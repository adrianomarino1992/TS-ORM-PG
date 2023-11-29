import IDBManager from "../interfaces/IDBManager";

export default abstract class AbstractManager implements IDBManager
{
    abstract CheckConnection(): Promise<boolean> ;
    abstract CheckDatabase(dababase: string): Promise<boolean> ;
    abstract CreateDataBase(dababase: string): Promise<void> ;
    abstract CheckTable(cTor: Function): Promise<boolean> ;
    abstract CreateTable(cTor: Function): Promise<void> ;
    abstract CheckColumn(cTor: Function, key: string): Promise<boolean> ;
    abstract CreateColumn(cTor: Function, key: string): Promise<void> ;
    abstract UpdateDatabaseForEntity(cTor: Function): Promise<void> ;
    abstract ExecuteNonQuery(query: string): Promise<void> ;
    abstract Execute(query: string): Promise<any> ;
    
}