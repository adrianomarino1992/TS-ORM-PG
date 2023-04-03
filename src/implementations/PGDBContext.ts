import IDBContext from "../core/objects/interfaces/IDBContext";
import IDBSet from "../core/objects/interfaces/IDBSet";
import TypeUtils from "../core/utils/TypeUtils";
import PGDBManager from "./PGDBManager";
import PGDBSet from "./PGDBSet";

export default abstract class PGDBContext implements IDBContext
{
    protected _manager :PGDBManager;

    constructor(manager : PGDBManager)
    {
        this._manager = manager;
    }

    public Collection<T>(cTor  : {new (...args : any[]) : T}): IDBSet<T> | undefined {

        for(let prop of Object.keys(this))
        {
            let type = (this as any)[prop]["_type"];

            if(type == undefined)
                continue;
            if(type == cTor)
                return (this as any)[prop] as IDBSet<T>;
        }

        return undefined
    }
    public async UpdateDatabaseAsync(): Promise<void> {
       
        let dbName = this._manager["_connection"].DataBaseName;

        if(!await this._manager.CheckDatabase(dbName))
            await this._manager.CreateDataBase(dbName);

        let props = Object.keys(this);

        for(let prop of props)
        {
            if((this as any)[prop].constructor == PGDBSet)
            {
                await this._manager.UpdateDatabaseForEntity((this as any)[prop]["_type"]);
            }
        }

    }
    
}