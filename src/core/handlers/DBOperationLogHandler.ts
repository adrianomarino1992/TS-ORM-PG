export default interface DBOperationLogHandler
{
    (message : string, type : LogType) : void;
}

export enum LogType
{
    CHECKCONNECTION,
    CHECKDATABASE, 
    CREATEDATABASE,
    CHECKTABLE, 
    CREATETABLE, 
    CHECKCOLUMN, 
    CHECKCOLUMNTYPE, 
    CREATECOLUMN, 
    CHANGECOLUMN, 
    CHECKENTITY, 
    QUERY
}