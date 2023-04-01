
import 'reflect-metadata';

import SchemasDecorators from '../decorators/SchemasDecorators';
import { DBTypes } from '../enums/DBTypes';
import TypeNotSuportedException from '../exceptions/TypeNotSuportedException';

export default class TypeUtils
{
    public static GetProperties(cTor : Function)
    {
        let empty = Reflect.construct(cTor, []);

        return Object.keys(empty);
    }


    public static GetDesingTimeType(cTor : Function, propertyName : string) : string | undefined
    {
        let empty = Reflect.construct(cTor, []);

        let type = SchemasDecorators.GetDataTypeAttribute(empty, propertyName);

        if(type == undefined)
            type = Reflect.getMetadata("design:type", empty, propertyName);

            if(typeof type === "function")
                type = (type as any).name;

        return type?.toString();
        
    }
   

    public static GetTableName(cTor : Function) : string 
    {
        let empty = Reflect.construct(cTor, []);

        return SchemasDecorators.GetTableAttribute(empty.constructor) ?? cTor.name;
    }

    public static GetColumnName(cTor : Function, key : string) : string 
    {
        return SchemasDecorators.GetColumnAttribute(cTor, key)!;
    }


    public static GetColumnNameAndType(cTor : Function) : { [key : string] : string[] }
    {  
        let keys = TypeUtils.GetProperties(cTor);

        let values : { [key : string] : string[]} = {} 

        for(let key of keys)
        {
            let meta = TypeUtils.GetColumnName(cTor, key);
            let type = TypeUtils.GetDesingTimeType(cTor, key);

            if(meta != undefined && type)
            {               
                values[key.toString()] = [meta, type];
            }            
        }

        return values;

    }

    public static IsNumber(dbType : string)
    {
        switch(dbType.toLocaleLowerCase())
        {
            case DBTypes.LONG : return true;
            case DBTypes.SERIAL : return true;
            case DBTypes.INTEGER : return true;
            case DBTypes.DOUBLE : return true;
        }

        return false;
    }

    public static CastType(type : string) : DBTypes
    {
        switch(type.toLowerCase())
        {
            case "integer" : return DBTypes.INTEGER;
            case "serial" : return DBTypes.LONG;
            case "number" : return DBTypes.DOUBLE;
            case "long" : return DBTypes.LONG;
            case "text" : return DBTypes.TEXT;
            case "string" : return DBTypes.TEXT;
            case "date" : return DBTypes.DATE;
            case "datetime" : return DBTypes.DATETIME;
            case "boolean" : return DBTypes.BOOLEAN;
            case "object" : return DBTypes.CLASS;
            default: throw new TypeNotSuportedException(`The type ${type} is not suported`);
        }
    }
}