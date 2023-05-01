

export default interface IDBConnection
{
    HostName : string;
    Port : number;
    DataBaseName : string;
    UserName : string;
    PassWord : string;    
    IsOpen : boolean;
    Open() : Promise<void>;
    Query(query : string) : Promise<any>;
    Close() : void;
    ExecuteNonQuery(query : string) : Promise<void>;    
    Execute(query : string) : Promise<any>;
     
}