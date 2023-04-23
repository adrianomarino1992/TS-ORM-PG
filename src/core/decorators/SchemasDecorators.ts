
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
            OwnMetaDataContainer.Set(target.constructor, SchemasDecorators._tableAttribute, undefined, name ?? (target as Function).name.toLocaleLowerCase());
            Reflect.defineMetadata(SchemasDecorators._tableAttribute, name ?? (target as Function).name.toLocaleLowerCase(), target);
        }
    }

    public static GetTableAttribute(target : Object) : string | undefined
    {
        let meta = Reflect.getMetadata(SchemasDecorators._tableAttribute, target);

        if(!meta)
            meta = OwnMetaDataContainer.Get(target.constructor, SchemasDecorators._tableAttribute, undefined)?.Value;
        
        return meta;
    }

    
    public static Column(name? : string)
    {
        return function (target : Object, propertyName : string)
        {
            OwnMetaDataContainer.Set(target.constructor, SchemasDecorators._columnAttribute, propertyName, name ?? propertyName.toLocaleLowerCase());
            Reflect.defineMetadata(SchemasDecorators._columnAttribute, name ?? propertyName.toLocaleLowerCase(), target.constructor, propertyName);
        }
    }    

    public static GetColumnAttribute(cTor : Function, propertyName : string) : string | undefined
    {
        let meta =  Reflect.getMetadata(SchemasDecorators._columnAttribute, cTor, propertyName);

        if(!meta)
            meta = OwnMetaDataContainer.Get(cTor, SchemasDecorators._columnAttribute, propertyName)?.Value;
        
        return meta;
    }


    public static OneToOne<T>(lazyBuilder : () =>  {new (...args: any[]) : T}, property? : keyof T & string)
    {
        return SchemasDecorators.Relation<T>(lazyBuilder, RelationType.ONE_TO_ONE, property);
    }    

    public static OneToMany<T>(lazyBuilder : () =>  {new (...args: any[]) : T}, property? : keyof T & string)
    {
        return SchemasDecorators.Relation<T>(lazyBuilder, RelationType.ONE_TO_MANY, property);
    }   

    public static ManyToOne<T>(lazyBuilder : () =>  {new (...args: any[]) : T}, property? : keyof T & string)
    {
        return SchemasDecorators.Relation<T>(lazyBuilder, RelationType.MANY_TO_ONE,property);
    }   

    public static ManyToMany<T>(lazyBuilder : () =>  {new (...args: any[]) : T}, property? : keyof T & string)
    {
        return SchemasDecorators.Relation<T>(lazyBuilder, RelationType.MANY_TO_MANY, property);
    } 

    private static Relation<T>(lazyBuilder : () =>  {new (...args: any[]) : T}, relation : RelationType, property? : keyof T & string)
    {
        return function (target : Object, propertyName : string)
        {
            OwnMetaDataContainer.Set(target.constructor, SchemasDecorators._relationAttribute, propertyName,  { TypeBuilder : lazyBuilder, Relation : relation, Field : property });
            Reflect.defineMetadata(SchemasDecorators._relationAttribute, { TypeBuilder : lazyBuilder, Relation : relation, Field : property }, target.constructor, propertyName);
        }
    }

    public static GetRelationAttribute(cTor : Function, propertyName : string) : { TypeBuilder :() => {new (...args: any[]) : unknown}, Relation : RelationType, Field? : string } | undefined
    {
        let meta = Reflect.getMetadata(SchemasDecorators._relationAttribute, cTor, propertyName) as { TypeBuilder : () => {new (...args: any[]) : unknown}, Relation  : RelationType, Field? : string };
        
        if(!meta)
            meta = OwnMetaDataContainer.Get(cTor, SchemasDecorators._relationAttribute, propertyName)?.Value  as { TypeBuilder :() => {new (...args: any[]) : unknown}, Relation : RelationType, Field? : string }; 
    
        return meta;
    }

       
    
    public static PrimaryKey()
    {
        return function (target : Object, propertyName : string)
        {
            OwnMetaDataContainer.Set(target.constructor, SchemasDecorators._primaryKeyAttribute, propertyName,  true);
            Reflect.defineMetadata(SchemasDecorators._primaryKeyAttribute, true , target.constructor, propertyName);
        }
    }

    public static IsPrimaryKey(cTor : Function, propertyName : string) : boolean 
    {
        let meta =  Reflect.getMetadata(SchemasDecorators._primaryKeyAttribute, cTor, propertyName);

        if(!meta)
            meta = Reflect.getMetadata(SchemasDecorators._primaryKeyAttribute, cTor.prototype, propertyName);

        if(!meta)
            meta = Reflect.getMetadata(SchemasDecorators._primaryKeyAttribute, Reflect.construct(cTor, []), propertyName);
        
        if(!meta)
            meta = OwnMetaDataContainer.Get(cTor, SchemasDecorators._primaryKeyAttribute, propertyName)?.Value ?? false; 
        
        return meta;
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
            OwnMetaDataContainer.Set(target.constructor, SchemasDecorators._dataTypeAttribute, propertyName,  type);
            Reflect.defineMetadata(SchemasDecorators._dataTypeAttribute, type, target.constructor, propertyName);
        }
    }   

    public static GetDataTypeAttribute(cTor : Function, propertyName : string) : DBTypes | undefined
    {
        let value = Reflect.getMetadata(SchemasDecorators._dataTypeAttribute, cTor, propertyName);

        if(!value)
            value = OwnMetaDataContainer.Get(cTor, SchemasDecorators._dataTypeAttribute, propertyName)?.Value; 

        if(value === undefined)
            return undefined;
        else 
            return value as DBTypes;
    }


}


class OwnMetaDataContainer
{
    private  static _metadas : IMetaData[] = [];

    public static Get(target : Function, key : string, member? : string) : IMetaData | undefined
    {
        let meta =  this._metadas.filter(s => s.Key == key && (s.CTor == target || s.CTor == target.prototype) && s.Member == member);  
        
        if(meta && meta.length > 0)
            return meta[0];

        return undefined;
    }

    public static Set(target : Function, key : string, member? : string, value? : any) : void
    {
        let meta = this.Get(target, key, member);

        if(meta)
        {
            meta.Value = value;
        } 
        else
        {
            this._metadas.push(
                {
                    CTor : target, 
                    Key : key, 
                    Member : member, 
                    Value : value
                });
        }
    }
}

interface IMetaData
{
    CTor : Function;
    Member? : string;
    Key : string;
    Value? : any
}