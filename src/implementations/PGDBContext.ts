import IDBContext from "../core/objects/interfaces/IDBContext";
import IDBSet from "../core/objects/interfaces/IDBSet";
import PGDBManager from "./PGDBManager";

export default abstract class PGDBContext implements IDBContext
{
    protected _manager :PGDBManager;

    constructor(manager : PGDBManager)
    {
        this._manager = manager;
    }

    Collection<T>(cTor  : {new (...args : any[]) : T}): IDBSet<T> | undefined {

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
    UpdateDatabaseAsync(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
}