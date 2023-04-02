
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

        let type = SchemasDecorators.GetDataTypeAttribute(cTor, propertyName);

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


    public static IsArray(dbType : string)
    {
        switch(dbType.toLocaleLowerCase())
        {
            case DBTypes.INTEGERARRAY : return true;
            case DBTypes.TEXTARRAY : return true;            
            case DBTypes.BOOLEANARRAY : return true;            
            case DBTypes.DATEARRAY : return true;            
            case DBTypes.DATETIMEARRAY : return true;            
            case DBTypes.LONGARRAY : return true;            
            case DBTypes.DOUBLEARRAY : return true;            
        }
        return false;
    }

    public static ExtractElementType(dbType : string)
    {
       return dbType.toLocaleLowerCase().toString().replace('[]', '') as DBTypes;
    }

    public static IsDate(dbType : string)
    {
        switch(dbType.toLocaleLowerCase())
        {
            case DBTypes.DATE : return true;
            case DBTypes.DATETIME : return true;            
        }

        return false;
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

    /**
     * 
     * @method
     * @param {string} type the type from desing type to be converted to a DBTypes enum
     * @returns the DBTypes correspondent
     */
    public static CastType(type : string) : DBTypes
    {
        
        for(let k in DBTypes)
        {
            if((DBTypes as any)[k] == type.toLocaleLowerCase().trim())
                return (DBTypes as any)[k]
        }

        switch(type.toLowerCase())
        {           
            case "number" : return DBTypes.DOUBLE;            
            case "string" : return DBTypes.TEXT;            
            case "object" : return DBTypes.CLASS;

            default: throw new TypeNotSuportedException(`The type ${type} is not suported`);
        }
    }
}