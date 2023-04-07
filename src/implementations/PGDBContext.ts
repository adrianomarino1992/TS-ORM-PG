import Type from "../core/design/Type";
import IDBContext from "../core/objects/interfaces/IDBContext";
import IDBSet from "../core/objects/interfaces/IDBSet";
import PGDBManager from "./PGDBManager";
import PGDBSet from "./PGDBSet";

export default abstract class PGDBContext implements IDBContext
{
    protected _manager :PGDBManager;

    private _mappedTypes! : {new (...args: any[]) : unknown}[];

    constructor(manager : PGDBManager)
    {
        this._manager = manager;       
       
    }

    public GetMappedTypes()
    {
        if(this._mappedTypes != undefined)
            return this._mappedTypes;

        this._mappedTypes = [];

        let props = Object.keys(this);

        for(let prop of props)
        {
            if((this as any)[prop].constructor == PGDBSet)
            {
                this._mappedTypes.push((this as any)[prop]["_type"]);
            }
        }

        return this._mappedTypes;
    }

    public IsMapped(type : {new (...args: any[]) : unknown}) : boolean
    {
        return this.GetMappedTypes().filter(t => t == type).length > 0;
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

        for(let type of this._mappedTypes)
        {
            await this._manager.UpdateDatabaseForEntity(type);
        }

    }
    
}