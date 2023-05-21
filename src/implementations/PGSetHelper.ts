import PGDBSet from "./PGDBSet";

export default class PGSetHelper
{

    private static _sqlKey = "__orm__sql__";
    private static _joinKey = "__orm__join__";
    private static _onKey = "__orm__on__";
    private static _whereKey = "__orm__where__";

    public static InjectORMData<T extends Object>(set : PGDBSet<T>, key : string, value : string) : PGDBSet<T>
    {
        (set as any)[key] = value;
        return set;
    }

    public static ExtractORMData<T extends Object>(set : PGDBSet<T>, key : string) : string
    {
        return (set as any)[key] ?? "";         
    }

    public static InjectSQL<T extends Object>(set : PGDBSet<T>, sql : string) : PGDBSet<T>
    {        
        return PGSetHelper.InjectORMData<T>(set, PGSetHelper._sqlKey, sql);
    }

    public static InjectWhere<T extends Object>(set : PGDBSet<T>, where : string) : PGDBSet<T>
    {        
        return PGSetHelper.InjectORMData<T>(set, PGSetHelper._whereKey, where);
    }

    public static InjectJoin<T extends Object>(set : PGDBSet<T>, join : string) : PGDBSet<T>
    {
        return PGSetHelper.InjectORMData<T>(set, PGSetHelper._joinKey, join);
    }

    public static InjectOn<T extends Object>(set : PGDBSet<T>, on : string) : PGDBSet<T>
    {
        return PGSetHelper.InjectORMData<T>(set, PGSetHelper._onKey, on);
    }

    public static ExtractJoinData<T extends Object>(set : PGDBSet<T>) : string
    {
        return PGSetHelper.ExtractORMData(set, PGSetHelper._joinKey);       
    }

    public static ExtractOnData<T extends Object>(set : PGDBSet<T>) : string
    {
        return PGSetHelper.ExtractORMData(set, PGSetHelper._onKey);       
    }

    public static ExtractWhereData<T extends Object>(set : PGDBSet<T>) : string
    {
        return PGSetHelper.ExtractORMData(set, PGSetHelper._whereKey);       
    }

    public static ExtractSQLData<T extends Object>(set : PGDBSet<T>) : string
    {
        return PGSetHelper.ExtractORMData(set, PGSetHelper._sqlKey);       
    }
    
    public static CleanORMData<T extends Object>(set : PGDBSet<T>) : void
    {
        PGSetHelper.InjectJoin(set, "");
        PGSetHelper.InjectSQL(set, "");
        PGSetHelper.InjectOn(set, "");
        PGSetHelper.InjectSQL(set, "");
    }

}