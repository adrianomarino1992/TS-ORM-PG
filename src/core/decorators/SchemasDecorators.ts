
import 'reflect-metadata';
import { DBTypes } from '../enums/DBTypes';

export default class SchemasDecorators
{
    private static _tableAttribute : string = "compile:schema-table";
    private static _columnAttribute : string = "compile:schema-column";
    private static _dataTypeAttribute : string = "compile:schema-dataType";
    private static _primaryKeyAttribute : string = "compile:schema-primarykey";    
    

    public static Table(name? : string)
    {
        return function (target : Object)
        {
            Reflect.defineMetadata(SchemasDecorators._tableAttribute, name ?? target.constructor.name.toLocaleLowerCase(), target);
        }
    }

    public static GetTableAttribute(target : Object) : string | undefined
    {
        return Reflect.getMetadata(SchemasDecorators._tableAttribute, target);
    }
    
    public static Column(name? : string)
    {
        return function (target : Object, propertyName : string)
        {
            Reflect.defineMetadata(SchemasDecorators._columnAttribute, name ?? propertyName.toLocaleLowerCase(), target.constructor, propertyName);
        }
    }    
    
    
    public static PrimaryKey()
    {
        return function (target : Object, propertyName : string)
        {
            Reflect.defineMetadata(SchemasDecorators._primaryKeyAttribute, true , target.constructor, propertyName);
        }
    }

    public static IsPrimaryKey(target : Function, propertyName : string) : boolean 
    {
        return Reflect.getMetadata(SchemasDecorators._primaryKeyAttribute, target, propertyName) ?? false;
    }

    public static DataType(type : DBTypes) {

        return function (target : Object, propertyName : string)
        {
            Reflect.defineMetadata(SchemasDecorators._dataTypeAttribute, type, target.constructor, propertyName);
        }
    }

    public static GetColumnAttribute(target : Function, propertyName : string) : string | undefined
    {
        return Reflect.getMetadata(SchemasDecorators._columnAttribute, target, propertyName);
    }

    

    public static GetDataTypeAttribute(target : Function, propertyName : string) : DBTypes | undefined
    {
        let value = Reflect.getMetadata(SchemasDecorators._dataTypeAttribute, target, propertyName);

        if(value === undefined)
            return undefined;
        else 
            return value as DBTypes;
    }


}