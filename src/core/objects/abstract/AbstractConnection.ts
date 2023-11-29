import IDBConnection from "../interfaces/IDBConnection";

export default abstract class AbstractConnection implements IDBConnection
{
    abstract HostName: string;
    abstract Port: number;
    abstract DataBaseName: string;
    abstract UserName: string;
    abstract PassWord: string;
    abstract IsOpen: boolean;
    abstract Open(): Promise<void> ;
    abstract Query(query: string): Promise<any>;
    abstract Close(): void ;
    abstract ExecuteNonQuery(query: string): Promise<void> ;
    abstract Execute(query: string): Promise<any> ;
    
}