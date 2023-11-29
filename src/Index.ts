import { DBTypes } from "./core/enums/DBTypes";
import SchemasDecorators from "./core/decorators/SchemasDecorators";
import PGDBConnection from "./implementations/PGDBConnection";
import PGDBContext from "./implementations/PGDBContext";
import PGDBManager from "./implementations/PGDBManager";
import PGDBSet from "./implementations/PGDBSet";
import { Operation } from './core/objects/interfaces/IStatement';
import { LogType } from "./core/objects/DBOperationLogHandler";
import DBOperationLogHandler from "./core/objects/DBOperationLogHandler";
import AbstractConnection from "./core/objects/abstract/AbstractConnection";
import AbstractContext from "./core/objects/abstract/AbstractContext";
import AbstractFluentField from "./core/objects/abstract/AbstractFluentField";
import AbstractManager from "./core/objects/abstract/AbstractManager";
import AbstractSet from "./core/objects/abstract/AbastractSet";

export {DBTypes};
export {PGDBConnection}
export {PGDBContext}
export {PGDBManager}
export {PGDBSet}
export {Operation}
export {DBOperationLogHandler}
export {LogType}

export {AbstractConnection}
export {AbstractContext}
export {AbstractFluentField}
export {AbstractManager}
export {AbstractSet}

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



