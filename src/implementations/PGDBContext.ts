import ConnectionFailException from "../core/exceptions/ConnectionFailException";
import InvalidOperationException from "../core/exceptions/InvalidOperationException";
import IDBContext from "../core/objects/interfaces/IDBContext";
import IDBSet from "../core/objects/interfaces/IDBSet";
import PGDBManager from "./PGDBManager";
import PGDBSet from "./PGDBSet";

export default abstract class PGDBContext implements IDBContext
{
    protected _manager :PGDBManager;    

    private _mappedTypes! : {new (...args: any[]) : unknown}[];

    constructor(manager? : PGDBManager)
    {
        let host = process.env.DB_HOST || "";
        let port = process.env.DB_PORT || "0";
        let username = process.env.DB_USER || "";
        let password = process.env.DB_PASS || "";
        let database = process.env.DB_NAME || "";
        let intPort = 0;
        try{
            intPort = Number.parseInt(port);
        }catch{}
        
        if(!host && !manager)
            throw new InvalidOperationException(`DB_HOST enviroment variable was no value and no one PGDBManager instance was suplied`);

        if((!port || Number.isNaN(intPort)) && !manager)
            throw new InvalidOperationException(`DB_PORT enviroment variable was no value and no one PGDBManager instance was suplied`);

        if(!username && !manager)
            throw new InvalidOperationException(`DB_USER enviroment variable was no value and no one PGDBManager instance was suplied`);

        if(!password && !manager)
            throw new InvalidOperationException(`DB_PASS enviroment variable was no value and no one PGDBManager instance was suplied`);
            
        if(!database && !manager)
            throw new InvalidOperationException(`DB_NAME enviroment variable was no value and no one PGDBManager instance was suplied`);   

        this._manager = manager ?? PGDBManager.Build(host, intPort, database, username, password);  
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

        for(let type of this.GetMappedTypes())
        {
            await this._manager.UpdateDatabaseForEntity(type);
        }

    }

    public async ExecuteNonQuery(query : string): Promise<void> {
       await this._manager.ExecuteNonQuery(query);
    }

    public async ExecuteQuery(query : string): Promise<any> {
        return await this._manager.Execute(query);
    }
    
}