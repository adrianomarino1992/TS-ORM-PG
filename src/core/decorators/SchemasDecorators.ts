
import 'reflect-metadata';
import { DBTypes } from '../enums/DBTypes';
import Type from '../design/Type';
import { RelationType } from '../enums/RelationType';

export default class SchemasDecorators
{
    private static _tableAttribute : string = "compile:schema-table";
    private static _columnAttribute : string = "compile:schema-column";
    private static _dataTypeAttribute : string = "compile:schema-dataType";
    private static _primaryKeyAttribute : string = "compile:schema-primarykey";    
    private static _relationAttribute : string = "compile:schema-relationWith";    
    
    

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

    public static GetColumnAttribute(cTor : Function, propertyName : string) : string | undefined
    {
        return Reflect.getMetadata(SchemasDecorators._columnAttribute, cTor, propertyName);
    }


    public static OneToOne<T>(lazyBuilder : () =>  {new (...args: any[]) : T})
    {
        return SchemasDecorators.Relation<T>(lazyBuilder, RelationType.ONE_TO_ONE);
    }    

    public static OneToMany<T>(lazyBuilder : () =>  {new (...args: any[]) : T})
    {
        return SchemasDecorators.Relation<T>(lazyBuilder, RelationType.ONE_TO_MANY);
    }   

    public static ManyToOne<T>(lazyBuilder : () =>  {new (...args: any[]) : T})
    {
        return SchemasDecorators.Relation<T>(lazyBuilder, RelationType.MANY_TO_ONE);
    }   

    public static ManyToMany<T>(lazyBuilder : () =>  {new (...args: any[]) : T})
    {
        return SchemasDecorators.Relation<T>(lazyBuilder, RelationType.MANY_TO_MANY);
    } 

    private static Relation<T>(lazyBuilder : () =>  {new (...args: any[]) : T}, relation : RelationType)
    {
        return function (target : Object, propertyName : string)
        {
            Reflect.defineMetadata(SchemasDecorators._relationAttribute, { TypeBuilder : lazyBuilder, Relation : relation }, target.constructor, propertyName);
        }
    }

    public static GetRelationAttribute(cTor : Function, propertyName : string) : { TypeBuilder :() => {new (...args: any[]) : unknown}, Relation : RelationType } | undefined
    {
        return Reflect.getMetadata(SchemasDecorators._relationAttribute, cTor, propertyName) as { TypeBuilder : () => {new (...args: any[]) : unknown}, Relation  : RelationType };
    }

       
    
    public static PrimaryKey()
    {
        return function (target : Object, propertyName : string)
        {
            Reflect.defineMetadata(SchemasDecorators._primaryKeyAttribute, true , target.constructor, propertyName);
        }
    }

    public static IsPrimaryKey(cTor : Function, propertyName : string) : boolean 
    {
        return Reflect.getMetadata(SchemasDecorators._primaryKeyAttribute, cTor, propertyName) ?? false;
    }

    public static ExtractPrimaryKey(cTor : {new (...args: any[]) : unknown}) : string | undefined
    {
        for(let prop of  Type.GetProperties(cTor))
        {
            if(SchemasDecorators.IsPrimaryKey(cTor, prop))
                return prop;
        }

        return undefined;
    }


    public static DataType(type : DBTypes) {

        return function (target : Object, propertyName : string)
        {
            Reflect.defineMetadata(SchemasDecorators._dataTypeAttribute, type, target.constructor, propertyName);
        }
    }   

    public static GetDataTypeAttribute(cTor : Function, propertyName : string) : DBTypes | undefined
    {
        let value = Reflect.getMetadata(SchemasDecorators._dataTypeAttribute, cTor, propertyName);

        if(value === undefined)
            return undefined;
        else 
            return value as DBTypes;
    }


}

