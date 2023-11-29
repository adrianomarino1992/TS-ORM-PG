import pg  from 'pg';

import ConnectionFailException from "../core/exceptions/ConnectionFailException";
import QueryFailException from "../core/exceptions/QueryFailException";
import AbstractConnection from '../core/objects/abstract/AbstractConnection';

export default class PGDBConnection extends AbstractConnection
{
    public HostName!: string;
    public Port!: number;
    public DataBaseName!: string;
    public UserName!: string;
    public PassWord!: string; 
    public IsOpen: boolean;
    private _conn! : pg.Client;
    private _database! : string;    

    constructor(host : string, port : number, dababase : string, user : string, pass : string)
    {        
        super();
        this.HostName = host;
        this.Port = port;
        this.DataBaseName = dababase;
        this._database = dababase;
        this.UserName = user;
        this.PassWord = pass;  
        this.IsOpen = false;      
    }     
    
    public AsPostgres() : PGDBConnection
    {        
        this.DataBaseName = "postgres";
        return this;
    }
    
    public Open() : Promise<void>
    {

        return new Promise<void>(async (resolve, reject) => 
        {
            if(this.IsOpen)
                await this.Close();

            this._conn = new pg.Client({
                host : this.HostName, 
                port : this.Port, 
                database : this.DataBaseName, 
                user : this.UserName, 
                password: this.PassWord
            });                        
    
            this.DataBaseName = this._database;

            try
            {
                await this._conn.connect();
                this.IsOpen = true;
                resolve();
    
            }catch(err)
            {
                
                reject(new ConnectionFailException((err as Error).message));
            }   
        });      

    }

    public Query(query : string) : Promise<any>
    {
        return new Promise<any>(async (resolve, reject) => 
        {
            try
            {
                resolve(await this._conn.query(query));
                
            }catch(err)
            {
                reject(new ConnectionFailException((err as Error).message));
            }    
        });  
        
        
    }

    public Close()
    {
        return new Promise<void>(async (resolve, reject) => 
        {
            try
            {
                await this._conn.end();
                this.IsOpen = false;
                resolve();
                
            }catch(err)
            {
                reject(new ConnectionFailException((err as Error).message));
            }    
        });  
         
        
    }


    public async ExecuteNonQuery(query: string): Promise<void> {
       
        return new Promise<void>(async (resolve, reject) => 
        {
            try
            {
                await this._conn.query(query)
                resolve();

            }catch(err)
            {
                reject(new QueryFailException((err as Error).message, query));
            }  
        });          

    }


    public async Execute(query: string): Promise<any> {

        return new Promise<any>(async (resolve, reject) => 
        {
            try
            {
                resolve(await this._conn.query(query));

            }catch(err)
            {
                reject(new QueryFailException((err as Error).message, query));
            }  
        });  
    }
}