import 'reflect-metadata';
import TypeNotSuportedException from '../core/exceptions/TypeNotSuportedException';


import IDBManager from '../core/objects/interfaces/IDBManager';
import Type from '../core/design/Type';
import PGDBConnection from './PGDBConnection';
import SchemasDecorators from '../core/decorators/SchemasDecorators';
import InvalidOperationException from '../core/exceptions/InvalidOperationException';
import { DBTypes } from '../Index';
import { RelationType } from '../core/enums/RelationType';
import DBOperationLogHandler, { LogType } from '../core/objects/DBOperationLogHandler';


export default class PGDBManager implements IDBManager
{
    private _connection! : PGDBConnection;   
    private _logger? : DBOperationLogHandler;

    public constructor(connection : PGDBConnection)
    {
        this._connection = connection;
    }

    public async CheckConnection(): Promise<boolean> {
        
        this.Log("Checking connection", LogType.CHECKCONNECTION);

        try
        {
            await this._connection.Open();
            return true;

        }
        catch
        { 
            return false;
        }
        finally
        {
            await this._connection.Close();
        }
    }
    
    public CheckDatabase(dababase: string): Promise<boolean> {
       
        return this.CreatePromisse<boolean>(async ()=>
        {
            this.Log(`Checking database ${dababase}`, LogType.CHECKDATABASE);

            await this._connection.AsPostgres().Open();

            let result = await this._connection.Execute(`select * from pg_database where datname = '${dababase}'`);

            return result.rows.length > 0;
        });
    }
    public CreateDataBase(dababase: string): Promise<void> {
        
        return this.CreatePromisse<void>(async ()=>
        {
            this.Log(`Creating database ${dababase}`, LogType.CREATEDATABASE);

            await this._connection.AsPostgres().Open();

            await this._connection.Execute(`create database ${dababase} with owner ${this._connection.UserName};`);            
        });
    }
    public CheckTable(cTor : Function): Promise<boolean> {

        return this.CreatePromisse<boolean>(async ()=>
        {           

            let table = Type.GetTableName(cTor);

            this.Log(`Checking table ${table}`, LogType.CHECKTABLE);

            await this._connection.Open();

            let result = await this._connection.Execute(`select * from information_schema.tables where table_catalog = '${this._connection.DataBaseName}' and table_name = '${table}';`);

            return result.rows.length > 0;
        });
    }
    public CreateTable(cTor : Function): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            this.Log(`Creating table ${table}`, LogType.CREATETABLE);

            await this._connection.Open();

            await this._connection.Execute(`create table if not exists "${table}"();`);
            
        });
    }
    public CheckColumn(cTor : Function, key : string): Promise<boolean> {

        return this.CreatePromisse<boolean>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            let column = Type.GetColumnName(cTor, key);

            this.Log(`Checking column ${table}.${column}`, LogType.CHECKCOLUMN);

            await this._connection.Open();

            let result = await this._connection.Execute(`select * from information_schema.columns where table_name = '${table}' and column_name = '${column}';`);

            return result.rows.length > 0;
        });
    }
    public CreateColumn(cTor : Function, key : string): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = Type.GetTableName(cTor);

            let column = Type.GetColumnName(cTor, key);

            this.Log(`Creating column ${table}.${column}`, LogType.CHECKCOLUMN);

            let type = "";

            try{

                type = this.CastToPostgreSQLType(Type.GetDesingTimeTypeName(cTor, key)!);

            }catch(ex)
            {               
                
                let subType = Type.GetDesingType(cTor, key);

                let relation = SchemasDecorators.GetRelationAttribute(cTor, key);

                if(subType == undefined || subType == Array){
                    
                    if(relation)
                        subType = relation.TypeBuilder();
                    
                    if(relation == undefined)
                    {
                        throw new InvalidOperationException(`Can not determine the relation of porperty ${cTor.name}${key}`);
                    }
                }                

                let relatedKey = SchemasDecorators.ExtractPrimaryKey(subType!);

                if(!relatedKey)
                    throw new InvalidOperationException(`Can not determine the primary key of ${subType!.name}`); 

                if(relation?.Relation == RelationType.ONE_TO_MANY || relation?.Relation == RelationType.MANY_TO_MANY)
                {
                    type = this.CastToPostgreSQLType(Type.AsArray(Type.GetDesingTimeTypeName(subType!, relatedKey)!));

                }else{

                    type = this.CastToPostgreSQLType(Type.GetDesingTimeTypeName(subType!, relatedKey)!);
                }               
                

                if(type == DBTypes.SERIAL)
                    type = this.CastToPostgreSQLType(DBTypes.INTEGER);
                
            }
            
            await this._connection.Open();

            await this._connection.Execute(`alter table "${table}" add column "${column}" ${type};`);

            if(SchemasDecorators.IsPrimaryKey(cTor, key))
            {
                await this._connection.Execute(`alter table "${table}" add constraint ${table}_${column}_pk primary key (${column});`);
            }
            
        });
    }
    public UpdateDatabaseForEntity(cTor: Function): Promise<void> {
        
        return this.CreatePromisse<void>(async ()=>
        {
            
            this.Log(`Checking entity ${cTor.name}`, LogType.CHECKENTITY);

            let table_name = Type.GetTableName(cTor);            
            
            if(table_name == undefined)
                throw new TypeNotSuportedException(`The type ${cTor.name} is not supported. Can not determine the table name of type`);

            await this._connection.Open();

            if(!await this.CheckTable(cTor))
                await this.CreateTable(cTor);
            
            for(let column of Type.GetProperties(cTor))
            {
                if(!await this.CheckColumn(cTor, column))
                {
                    await this.CreateColumn(cTor, column);
                }
            }            
        });

    }

    public async ExecuteNonQuery(query: string): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {   
            await this._connection.Open();

            this.Log(query, LogType.QUERY);
            
            await this._connection.Execute(query);
            
        });
    }

    public async Execute(query: string): Promise<any> {

        return this.CreatePromisse<void>(async ()=>
        {           
            await this._connection.Open();

            this.Log(query, LogType.QUERY);

            return await this._connection.Execute(query);           
            
        });
    }

    public static Build(host : string, port : number, dababase : string, user : string, pass : string) : PGDBManager
    {
        return new PGDBManager(new PGDBConnection(host, port, dababase, user, pass));
    }

    public static BuildFromEnviroment()
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
        
        if(!host)
            throw new InvalidOperationException(`DB_HOST enviroment variable was no value`);

        if(!port || Number.isNaN(intPort))
            throw new InvalidOperationException(`DB_PORT enviroment variable was no value`);

        if(!username)
            throw new InvalidOperationException(`DB_USER enviroment variable was no value`);

        if(!password)
            throw new InvalidOperationException(`DB_PASS enviroment variable was no value`);
            
        if(!database)
            throw new InvalidOperationException(`DB_NAME enviroment variable was no value`);

        return PGDBManager.Build(host, intPort, database, username, password)
    }
    
    private CreatePromisse<T>(func : ()=> Promise<T>) : Promise<T>
    {
        return new Promise<T>(async (resolve, reject)=>{

            let success = true;
            let result : any;
            try
            {                
                result = await func();
            }
            catch(err)
            {
                success = false;
                result = err;
            }
            finally
            {
                await this._connection.Close();
                
                if(success)
                    resolve(result);
                else
                    reject(result);
            }
        });
    }

    /**
     * @private
     * @method
     * @param {string} type the desing type of class property
     * @returns {string} the postgres type correspondent
     */
    private CastToPostgreSQLType(type : string) : string
    {
        switch(type.toLowerCase())
        {
            case "integer" : return "integer";
            case "number" : return "bigint";
            case "long" : return "bigint";
            case "double" : return "float";
            case "text" : return "text";
            case "string" : return "text";
            case "date" : return "date";
            case "datetime" : return "timestamp";
            case "boolean" : return "boolean";
            case "serial" : return "serial";
            case "integer[]" : return "integer[]";
            case "number[]" : return "bigint[]";
            case "long[]" : return "bigint[]";
            case "text[]" : return "text[]";
            case "string[]" : return "text[]";
            case "date[]" : return "date[]";
            case "datetime[]" : return "timestamp[]";
            case "boolean[]" : return "boolean[]";  
            case "double[]" : return "float[]";          
            default: throw new TypeNotSuportedException(`The type ${type} is not suported`);
        }
    }
     
    public SetLogger(logger : DBOperationLogHandler) : void { this._logger = logger;}

    private Log(message : string, type : LogType)
    {
        if(this._logger)
            try{this._logger(message, type);}catch{}
    }

}