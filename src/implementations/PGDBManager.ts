import 'reflect-metadata';
import TypeNotSuportedException from '../core/exceptions/TypeNotSuportedException';


import IDBManager from '../core/objects/interfaces/IDBManager';
import TypeUtils from '../core/utils/TypeUtils';
import PGDBConnection from './PGDBConnection';
import SchemasDecorators from '../core/decorators/SchemasDecorators';


export default class PGDBManager implements IDBManager
{
    private _connection! : PGDBConnection;

    public constructor(connection : PGDBConnection)
    {
        this._connection = connection;
    }
    

    public CheckDatabase(dababase: string): Promise<boolean> {
       
        return this.CreatePromisse<boolean>(async ()=>
        {
            await this._connection.AsPostgres().Open();

            let result = await this._connection.Execute(`select * from pg_database where datname = '${dababase}'`);

            return result.rows.length > 0;
        });
    }
    public CreateDataBase(dababase: string): Promise<void> {
        
        return this.CreatePromisse<void>(async ()=>
        {
            await this._connection.AsPostgres().Open();

            await this._connection.Execute(`create database ${dababase} with owner ${this._connection.UserName};`);            
        });
    }
    public CheckTable(cTor : Function): Promise<boolean> {

        return this.CreatePromisse<boolean>(async ()=>
        {
            let table = TypeUtils.GetTableName(cTor);

            await this._connection.Open();

            let result = await this._connection.Execute(`select * from information_schema.tables where table_catalog = '${this._connection.DataBaseName}' and table_name = '${table}';`);

            return result.rows.length > 0;
        });
    }
    public CreateTable(cTor : Function): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = TypeUtils.GetTableName(cTor);

            await this._connection.Open();

            await this._connection.Execute(`create table if not exists ${table}();`);
            
        });
    }
    public CheckColumn(cTor : Function, key : string): Promise<boolean> {

        return this.CreatePromisse<boolean>(async ()=>
        {
            let table = TypeUtils.GetTableName(cTor);

            let column = TypeUtils.GetColumnName(cTor, key);

            await this._connection.Open();

            let result = await this._connection.Execute(`select * from information_schema.columns where table_name = '${table}' and column_name = '${column}';`);

            return result.rows.length > 0;
        });
    }
    public CreateColumn(cTor : Function, key : string): Promise<void> {

        return this.CreatePromisse<void>(async ()=>
        {
            let table = TypeUtils.GetTableName(cTor);

            let column = TypeUtils.GetColumnName(cTor, key);

            let type = this.CastToPostgreSQLType(TypeUtils.GetDesingTimeType(cTor, key)!);
            
            await this._connection.Open();

            await this._connection.Execute(`alter table ${table} add column ${column} ${type};`);

            if(SchemasDecorators.IsPrimaryKey(cTor, key))
            {
                await this._connection.Execute(`alter table ${table} add constraint ${table}_${column}_pk primary key (${column});`);
            }
            
        });
    }
    public UpdateDatabaseForEntity(cTor: Function): Promise<void> {
        
        return this.CreatePromisse<void>(async ()=>
        {
            
            let table_name = TypeUtils.GetTableName(cTor);            
            
            if(table_name == undefined)
                throw new TypeNotSuportedException(`The type ${cTor.name} is not supported. Can not determine the table name of type`);

            await this._connection.Open();

            if(!await this.CheckTable(cTor))
                await this.CreateTable(cTor);
            
            for(let column of TypeUtils.GetProperties(cTor))
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

            await this._connection.Execute(query);
            
        });
    }

    public async Execute(query: string): Promise<any> {

        return this.CreatePromisse<void>(async ()=>
        {           
            await this._connection.Open();

            return await this._connection.Execute(query);           
            
        });
    }

    
    private CreatePromisse<T>(func : ()=> Promise<T>) : Promise<T>
    {
        return new Promise<T>(async (resolve, reject)=>{

            try
            {                
                resolve(await func());
            }
            catch(err)
            {
                reject(err);
            }
            finally
            {
                this._connection.Close();
            }
        });
    }


    private CastToPostgreSQLType(type : string) : string
    {
        switch(type.toLowerCase())
        {
            case "integer" : return "integer";
            case "number" : return "bigint";
            case "long" : return "bigint";
            case "text" : return "text";
            case "string" : return "text";
            case "date" : return "date";
            case "datetime" : return "datetime";
            case "boolean" : return "boolean";
            case "serial" : return "serial";
            default: throw new TypeNotSuportedException(`The type ${type} is not suported`);
        }
    }
     

}