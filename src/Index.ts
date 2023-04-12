import { DBTypes } from "./core/enums/DBTypes";
import SchemasDecorators from "./core/decorators/SchemasDecorators";
import PGDBConnection from "./implementations/PGDBConnection";
import PGDBContext from "./implementations/PGDBContext";
import PGDBManager from "./implementations/PGDBManager";
import PGDBSet from "./implementations/PGDBSet";



export {DBTypes};
export {PGDBConnection}
export {PGDBContext}
export {PGDBManager}
export {PGDBSet}

export function Column(name? : string)
{
    return SchemasDecorators.Column(name);
}

export function Table(name? : string)
{
    return SchemasDecorators.Table(name);
}

export function DataType(dbType : DBTypes)
{
    return SchemasDecorators.DataType(dbType);
}

export function PrimaryKey()
{
    return SchemasDecorators.PrimaryKey();
}

export function OneToMany<T>(typeBuilder :  () =>  {new (...args: any[]) : T}, property? : keyof T & string)
{
    return SchemasDecorators.OneToMany(typeBuilder, property);
}

export function OneToOne<T>(typeBuilder :  () =>  {new (...args: any[]) : T}, property? : keyof T & string)
{
    return SchemasDecorators.OneToOne(typeBuilder, property);
}

export function ManyToMany<T>(typeBuilder :  () =>  {new (...args: any[]) : T}, property? : keyof T & string)
{
    return SchemasDecorators.ManyToMany(typeBuilder, property);
}

export function ManyToOne<T>(typeBuilder :  () =>  {new (...args: any[]) : T}, property? : keyof T & string)
{
    return SchemasDecorators.ManyToOne(typeBuilder, property);
}



