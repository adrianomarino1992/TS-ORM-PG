


export default interface IDBManager 
{
    CheckConnection() : Promise<boolean>;

    CheckDatabase(dababase : string) : Promise<boolean>;
    
    CreateDataBase(dababase : string) : Promise<void>;

    CheckTable(cTor : Function) : Promise<boolean>;

    CreateTable(cTor : Function) : Promise<void>;

    CheckColumn(cTor : Function, key : string) : Promise<boolean>;
    
    CreateColumn(cTor : Function, key : string) : Promise<void>;

    UpdateDatabaseForEntity(cTor : Function) : Promise<void>;

    ExecuteNonQuery(query : string) : Promise<void>;   
     
    Execute(query : string) : Promise<any>;
    
}