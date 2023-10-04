import IDBSet, {IFluentField, IFluentQueryableObject} from "../core/objects/interfaces/IDBSet";
import Type from "../core/design/Type";
import { DBTypes } from "../core/enums/DBTypes";

import IStatement from "../core/objects/interfaces/IStatement";
import { Operation } from "../core/objects/interfaces/IStatement";

import SchemasDecorators from "../core/decorators/SchemasDecorators";
import PGDBManager from "./PGDBManager";
import NotImpletedException from "../core/exceptions/NotImplementedException";
import TypeNotSuportedException from "../core/exceptions/TypeNotSuportedException";
import PGDBContext from "./PGDBContext";
import InvalidOperationException from "../core/exceptions/InvalidOperationException";
import { RelationType } from "../core/enums/RelationType";
import ConstraintFailException from "../core/exceptions/ConstraintFailException";
import PGFluentField from "./PGFluentField";
import PGSetHelper from "./PGSetHelper";


export default class PGDBSet<T extends Object>  implements IDBSet<T> , IFluentQueryableObject<T, PGDBSet<T>>
{
    
    private _type! : {new (...args : any[]) : T};    
    private _table! : string;
    private _maps! : ReturnType<typeof Type.GetColumnNameAndType>;
    private _manager! : PGDBManager;
    private _context! : PGDBContext;
    private _statements : IPGStatement[] = [];
    private _ordering : IPGOrdenation<T>[] = [];
    private _includes: IPGIncluding<T>[] = []
    private _limit? : IPGLimiter;
    private _offset? : IPGOffset;
    private _whereAsString? : string;

    constructor(cTor : { new(...args : any[]) : T}, context : PGDBContext)
    {
        
        this._type = cTor;
        this._table = Type.GetTableName(cTor);
        this._maps = Type.GetColumnNameAndType(cTor);
        this._manager = context["_manager"];
        this._context = context;
    }
       

    
    public AddAsync(obj : T): Promise<T> {

        return this.CreatePromisse(async () => 
        {
            if(!obj)
                throw new InvalidOperationException(`Cannot insert a null reference object of ${this._type.name}`);

            if(!this.IsCorrectType(obj))
                throw new InvalidOperationException(`The object passed as argument is not a ${this._type.name} instance`);

            let sql = `insert into "${this._table}"(`;
            let values = `values (`;
            let returnKey = '';       
            let key : {Property : string, Column : string} | undefined;
            let subTypes : typeof this._maps = [];  

            for(let map of this._maps)
            {
                    if(SchemasDecorators.IsPrimaryKey(this._type, map.Field))
                    {
                        returnKey = `returning ${map.Column}`;
                        key = 
                        {
                            Column : map.Column, 
                            Property : map.Field
                        }
                        continue;
                    }

                    let currPropValue = Reflect.get(obj, map.Field);

                    if(currPropValue == undefined || currPropValue == null)
                    {
                        sql += `"${map.Column}",`;            
                    
                        values += `null,`;

                        continue;
                    }

                    let relation = SchemasDecorators.GetRelationAttribute(this._type, map.Field);
                    let designType = Type.GetDesingType(this._type, map.Field);

                    if((designType && this._context.IsMapped(designType)) || (relation && this._context.IsMapped(relation.TypeBuilder())))
                    {
                        subTypes.push({
                            Column : map.Column, 
                            Field : map.Field, 
                            Type : map.Type
                        });
                        
                        continue;
                    }
                    
                   
                    let colType = Type.CastType(map.Type);

                    sql += `"${map.Column}",`;            
                    
                    values += `${this.CreateValueStatement(colType, Reflect.get(obj, map.Field))},`;
                    
            }

            if(key == undefined)
            {
                throw new InvalidOperationException(`The type ${this._type.name} must have a primary key field`);
            }
            
            sql = sql.substring(0, sql.length - 1) + ") ";
            values = values.substring(0, values.length - 1) + ")";

            let insert = `${sql} ${values} ${returnKey};`;
            
            let retun = await this._manager.Execute(insert);
            

            if(key != undefined && retun.rows.length > 0)
            {
                (obj as any)[key.Property] = retun.rows[0][key.Column];
            }

            
            let subTypesUpdates : string[] = [];
            let updatableFields : string[] = [];
            for(let sub of subTypes)
            {
                let relation = SchemasDecorators.GetRelationAttribute(this._type, sub.Field);
                let subType = Type.GetDesingType(this._type, sub.Field)!;

                if(!subType && !relation)
                    throw new InvalidOperationException(`Can not determine the relation of the property ${this._type}.${sub.Field}`);

                if(!subType && relation)
                {   
                    subType = relation.TypeBuilder();
                }

                let isArray = subType == Array;
                if(isArray)
                {
                    if(!relation)
                        continue;
                    
                    subType = relation?.TypeBuilder();
                }

                let subObj = Reflect.get(obj, sub.Field);

                if(subObj == undefined)
                    continue;

                let subPK = SchemasDecorators.ExtractPrimaryKey(subType);
                
                if(subPK == undefined)
                {
                    throw new InvalidOperationException(`The type ${subType.name} must have a primary key column`);
                }

                let colletion = this._context.Collection(subType as {new (...args: any[]) : Object})!;

                if(key != undefined){
                    for(let subKey of Type.GetProperties(subType))
                    {
                        let subRelation = SchemasDecorators.GetRelationAttribute(subType, subKey);
                        
                        if(subRelation && subRelation.TypeBuilder() == this._type){

                            if(subRelation.Field != undefined && subRelation.Field != sub.Field)
                                continue;

                            if(subRelation.Relation == RelationType.ONE_TO_MANY || subRelation.Relation == RelationType.MANY_TO_MANY)
                            {
                                updatableFields.push(subKey);

                                if(isArray)
                                {
                                    for(let i of subObj as Array<typeof subType>)
                                    {
                                        if(i == undefined)
                                            continue;

                                        let metadata = Type.ExtractMetadata(i).filter(s => s.Field == subKey && s.Loaded);

                                        let value : any[] = []; 

                                        if(metadata.length > 0)
                                        {
                                            value = ((Reflect.get(i, subKey) ?? []) as Array<typeof subType>).filter(s => (s as any)[subPK!] != (obj as any)[subPK!]);  
                                        }else
                                        {
                                            let item = await (colletion as any)["Where"]({Field : subPK, Value : Reflect.get(i, subPK)})["LoadRelationOn"](subKey)["FirstOrDefaultAsync"]();
                                            value = item == undefined ? [] : item![subKey] as any[];
                                        }

                                        value.push(obj);

                                        Reflect.set(i as any, subKey, value);
                                    }
                                }else{

                                    let metadata = Type.ExtractMetadata(subObj).filter(s => s.Field == subKey && s.Loaded);

                                    let value : any[] = []; 

                                    if(metadata.length > 0)
                                    {
                                        value = ((Reflect.get(subObj, subKey) ?? []) as Array<typeof this._type>).filter(s => (s as any)[subPK!] != (obj as any)[subPK!]);    
                                    }else
                                    {
                                        let item = await (colletion as any)["Where"]({Field : subPK, Value : Reflect.get(subObj, subPK)})["LoadRelationOn"](subKey)["FirstOrDefaultAsync"]();

                                        value = item == undefined ? [] : item![subKey] as any[];
                                    }

                                    value.push(obj);                                                                   
                                    
                                    Reflect.set(subObj, subKey, value);
                                }
                               
                            }else{

                                if(subRelation.Relation == RelationType.MANY_TO_ONE && isArray)
                                {
                                    for(let i of subObj as Array<typeof subType>)
                                    {         
                                        if(i == undefined)
                                            continue; 

                                        Reflect.set(i as any, subKey, obj);
                                    }
                                }else{

                                    Reflect.set(subObj as any, subKey, obj);
                                }
                            }

                                                      

                        }
                    }
                }
               
                
                if(isArray)
                {
                    for(let i of subObj as Array<typeof subType>)
                    {
                        if(i == undefined)
                            continue;

                        if(!Type.HasValue(Reflect.get(i as any, subPK)))
                            await (colletion as PGDBSet<typeof subType>)["AddAsync"](i as any);
                        else 
                            await (colletion as PGDBSet<typeof subType>)["UpdateObjectAsync"](i as any, false, updatableFields);
                    }
                }else{

                    if(subObj == undefined)
                        continue;

                    if(!Type.HasValue(Reflect.get(subObj as any, subPK)))
                        await (colletion as PGDBSet<typeof subType>)["AddAsync"](subObj as any);
                    else 
                        await (colletion as PGDBSet<typeof subType>)["UpdateObjectAsync"](subObj as any, false, updatableFields);
                } 
                               

                
                let columnType = Type.CastType(Type.GetDesingTimeTypeName(subType, subPK)!);

                if(relation?.Relation == RelationType.MANY_TO_MANY || relation?.Relation == RelationType.ONE_TO_MANY || isArray)
                    columnType = Type.AsArray(columnType) as DBTypes;
                
                if(subObj == undefined)
                    continue;
                
                let updateValues = [Reflect.get(subObj as any, subPK)];

                if(isArray)
                {
                    updateValues = [];

                    for(let i of subObj as Array<typeof subType>)
                    {
                        if(i == undefined)
                            continue;

                        updateValues.push(Reflect.get(i as any, subPK));
                    }
                }

                subTypesUpdates.push(`"${sub.Column}" = ${this.CreateValueStatement(columnType, isArray ? updateValues : updateValues[0])}`);
                               
            }

            if(subTypesUpdates.length > 0)
            {
                let subUpdate = `update "${Type.GetTableName(this._type)}" set `;

                for(let p of subTypesUpdates)
                {
                    subUpdate += `${p},`;
                }

                subUpdate = `${subUpdate.substring(0, subUpdate.length - 1)} where `;               
                
                subUpdate += this.EvaluateStatement({
                    StatementType : StatementType.WHERE, 
                    Statement : 
                    {
                        Field : key!.Property,
                        Kind : Operation.EQUALS, 
                        Value : Reflect.get(obj, key!.Property)
                    }
                });

                await this._manager.ExecuteNonQuery(subUpdate);
            }

            return obj;

        });              
    }

    public async UpdateAsync(obj : T) : Promise<T>
    {
        return await this.UpdateObjectAsync(obj, false);
    }
    private UpdateObjectAsync(obj : T, cascade? : boolean, fieldsAllowed? : string[]): Promise<T> {
        
        return this.CreatePromisse(async() => 
        {
            fieldsAllowed = fieldsAllowed ?? [];

            if(!this.IsCorrectType(obj))
                throw new InvalidOperationException(`The object passed as argument is not a ${this._type.name} instance`);
            
            if(!obj)
                throw new InvalidOperationException(`Cannot update a null reference object of ${this._type.name}`);


            let keys = Type.GetProperties(this._type).filter(p => SchemasDecorators.IsPrimaryKey(this._type, p));
            let wheres : IPGStatement[] = [];

            if(keys && keys.length > 0)
            {

                keys.forEach((w, i) => 
                {
                    let keyValue = Reflect.get(obj, w);

                    if(!keyValue)
                        throw new ConstraintFailException(`The field ${this._type.name}.${w} is a primary key but has no value`);

                    wheres.push({
                        Statement : {
                            Field : w, 
                            Kind : Operation.EQUALS, 
                            Value : Reflect.get(obj, w)
                        }, 
                        StatementType : i == 0 ? StatementType.WHERE : StatementType.AND
                    })
                });
            }

            let update = `update "${this._table}" set`;
            let values = "";

            let key : {Property : string, Column : string} | undefined;
            let subTypes : typeof this._maps = [];

            for(let map of this._maps)
            {
                let designType = Type.GetDesingType(this._type, map.Field);
                let relation = SchemasDecorators.GetRelationAttribute(this._type, map.Field);
                if((designType && this._context.IsMapped(designType)) || (relation && this._context.IsMapped(relation.TypeBuilder())))
                {
                    subTypes.push({
                        Column : map.Column, 
                        Field : map.Field, 
                        Type : map.Type
                    });
                    
                    continue;
                }

                let colType = Type.CastType(map.Type);

                if(SchemasDecorators.IsPrimaryKey(this._type, map.Field))
                {
                    key = 
                        {
                            Column : map.Column, 
                            Property : map.Field
                        }
                    continue;
                }

                values += `"${map.Column}" = ${this.CreateValueStatement(colType, Reflect.get(obj, map.Field))},`;

            }
            
            update = `${update} ${values.substring(0, values.length - 1)}`;

            for(let where of wheres)
            {
                update += ` ${where.StatementType} ${this.EvaluateStatement(where)} `;
            }  

            await this._manager.ExecuteNonQuery(update);
            
            let subTypesUpdates : string[] = [];
            for(let sub of subTypes)
            {
                let relation = SchemasDecorators.GetRelationAttribute(this._type, sub.Field);
                let subType = Type.GetDesingType(this._type, sub.Field)!;

                if(!subType && !relation)
                    throw new InvalidOperationException(`Can not determine the relation of the property ${this._type}.${sub.Field}`);
                    

                if(!subType && relation)
                {   
                    subType = relation.TypeBuilder();
                }

                let isArray = subType == Array;
                if(isArray)
                {
                    if(!relation)
                        continue;
                    
                    subType = relation?.TypeBuilder();
                }

                let subObj = Reflect.get(obj, sub.Field);
                

                let subPK = SchemasDecorators.ExtractPrimaryKey(subType);

                let metadata = Type.ExtractMetadata(obj);
                let meta = metadata.filter(s => s.Field == sub.Field && s.Loaded);

                if(meta.length > 0 && subObj == undefined)
                {
                    if(meta[0].Loaded)
                        subTypesUpdates.push(`"${sub.Column}" = null`);
                        
                    continue;
                }           
                
                if(meta.length == 0 && fieldsAllowed.filter(s => s == sub.Field).length == 0)
                    continue;
                

                if(subObj == undefined)
                    continue;

                if(subPK == undefined)
                {
                    throw new InvalidOperationException(`The type ${subType.name} must have a primary key column`);
                }

                if(key != undefined){
                    for(let subKey of Type.GetProperties(subType))
                    {
                        let subRelation = SchemasDecorators.GetRelationAttribute(subType, subKey);
                        
                        if(subRelation && subRelation.TypeBuilder() == this._type){

                            if(subRelation.Field != undefined && subRelation.Field != sub.Field)
                                continue;

                            if(subRelation.Relation == RelationType.ONE_TO_MANY || subRelation.Relation == RelationType.MANY_TO_MANY)
                            {
                                if(isArray)
                                {
                                    for(let i of subObj as Array<typeof subType>)
                                    {
                                        if(i == undefined)
                                            continue;

                                        let value : any[] = ((Reflect.get(i, subKey) ?? []) as Array<typeof subType>).filter(s => (s as any)[subPK!] != (obj as any)[subPK!]);                                
                                        value.push(obj);
                                        Reflect.set(i as any, subKey, value);
                                    }
                                }
                               
                            }else{

                                if(subRelation.Relation == RelationType.MANY_TO_ONE)
                                {
                                    for(let i of subObj as Array<typeof subType>)
                                    {           
                                        if(i == undefined)
                                            continue;  

                                        Reflect.set(i as any, subKey, obj);
                                    }
                                }else{

                                    Reflect.set(subObj as any, subKey, obj);
                                }
                            }

                                                      

                        }
                    }
                }


                let colletion = this._context.Collection(subType as {new (...args: any[]) : Object})!;
                
                if(isArray)
                {
                    for(let i of subObj as Array<typeof subType>)
                    {
                        if(i == undefined)
                            continue;

                        if(!Type.HasValue(Reflect.get(i as any, subPK)))
                            await (colletion as PGDBSet<typeof subType>)["AddAsync"](i as any);
                        else if(cascade || fieldsAllowed.filter(s => s == sub.Field).length > 0)
                            await (colletion as PGDBSet<typeof subType>)["UpdateObjectAsync"](i as any, false);
                    }
                }else{

                    if(subObj == undefined)
                        continue;

                    if(!Type.HasValue(Reflect.get(subObj as any, subPK)))
                        await (colletion as PGDBSet<typeof subType>)["AddAsync"](subObj as any);
                    else if(cascade || fieldsAllowed.filter(s => s == sub.Field).length > 0)
                        await (colletion as PGDBSet<typeof subType>)["UpdateObjectAsync"](subObj as any, false);
                } 
                               

                
                let columnType = Type.CastType(Type.GetDesingTimeTypeName(subType, subPK)!);

                if(relation?.Relation == RelationType.MANY_TO_MANY || relation?.Relation == RelationType.ONE_TO_MANY)
                    columnType = Type.AsArray(columnType) as DBTypes;
                    
                    if(subObj == undefined)
                        continue;

                    let updateValues = [Reflect.get(subObj as any, subPK)];

                    if(isArray)
                    {
                        updateValues = [];
    
                        for(let i of subObj as Array<typeof subType>)
                        {
                            if(i == undefined)
                                continue;

                            updateValues.push(Reflect.get(i as any, subPK));
                        }
                    }
    
                    subTypesUpdates.push(`"${sub.Column}" = ${this.CreateValueStatement(columnType, isArray ? updateValues : updateValues[0])}`);
                               
            }

            if(subTypesUpdates.length > 0)
            {
                let subUpdate = `update "${Type.GetTableName(this._type)}" set `;

                for(let p of subTypesUpdates)
                {
                    subUpdate += `${p},`;
                }

                subUpdate = `${subUpdate.substring(0, subUpdate.length - 1)} where `;               
                
                subUpdate += this.EvaluateStatement({
                    StatementType : StatementType.WHERE, 
                    Statement : 
                    {
                        Field : key!.Property,
                        Kind : Operation.EQUALS, 
                        Value : Reflect.get(obj, key!.Property)
                    }
                });

                await this._manager.ExecuteNonQuery(subUpdate);
            }

            return obj;
        });

    }
    DeleteAsync(obj : T): Promise<T> {
        return this.CreatePromisse(async() => 
        {
            if(!obj)
                throw new InvalidOperationException(`Cannot delete a null reference object of ${this._type.name}`);

            if(!this.IsCorrectType(obj))
                throw new InvalidOperationException(`The object passed as argument is not a ${this._type.name} instance`);
            
            let keys = Type.GetProperties(this._type).filter(p => SchemasDecorators.IsPrimaryKey(this._type, p));
            let wheres : IPGStatement[] = [];

            if(keys && keys.length > 0)
            {
                keys.forEach((w, i) => 
                {
                    wheres.push({
                        Statement : {
                            Field : w, 
                            Kind : Operation.EQUALS, 
                            Value : Reflect.get(obj, w)
                        }, 
                        StatementType : i == 0 ? StatementType.WHERE : StatementType.AND
                    })
                });
            }

            let del = `delete from "${this._table}" `;           
           

            for(let where of wheres)
            {
                del += ` ${where.StatementType} ${this.EvaluateStatement(where)} `;
            }  

            await this._manager.ExecuteNonQuery(del);

            return obj;
        });
    }
    Where<K extends keyof T>(statement : IStatement<T, K>): IDBSet<T> {

        this.ResetFilters();
       
       this._statements.push(
        {
            Statement : 
            {
                Field : statement.Field.toString(), 
                Kind : statement.Kind ?? Operation.EQUALS, 
                Value : statement.Value
            }, 
            StatementType : StatementType.WHERE
        });

        return this;
    }

    And<K extends keyof T>(statement : IStatement<T, K>): IDBSet<T> {

        this._statements.push(
            {
                Statement : 
                {
                    Field : statement.Field.toString(), 
                    Kind : statement.Kind ?? Operation.EQUALS, 
                    Value : statement.Value
                },  
                StatementType : StatementType.AND
            });
    
            return this;
    }

    Or<K extends keyof T>(statement : IStatement<T, K>): IDBSet<T> {

        this._statements.push(
        {
            Statement : 
            {
                Field : statement.Field.toString(), 
                Kind : statement.Kind ?? Operation.EQUALS, 
                Value : statement.Value
            }, 
            StatementType : StatementType.OR
        });

        return this;
    }
    
    OrderBy<K extends keyof T>(key : K): IDBSet<T> {
       
        this._ordering.push(
            {
                Field : key, 
                Order : OrderDirection.ASC
            });

        return this;

    }

    Join<K extends keyof T>(key : K): IDBSet<T> {
       
        this._includes.push(
            {
                Field : key                
            });

        return this;

    }

    OrderDescendingBy<K extends keyof T>(key : K): IDBSet<T> {
       
        this._ordering.push(
            {
                Field : key, 
                Order : OrderDirection.DESC
            });

        return this;

    }

    Limit(limit : number): IDBSet<T> {

        this._limit = limit >= 1 ? { Limit : limit} : undefined; 
        return this;
    }  

    public Offset(offset: number): IDBSet<T> {
        
        this._offset = offset >= 1 ? { OffSet : offset} : undefined;
        return this;
    }

    public Take(quantity: number): IDBSet<T> {
        
        return this.Limit(quantity);
    }

    public async CountAsync(): Promise<number> {

        return this.CreatePromisse(async () => 
        { 

            let query = `select count(*) from "${this._table}"`; 

            if(this._whereAsString != undefined && this._statements.length > 0)
            {
                throw new InvalidOperationException("Is not possible combine free and structured queries");
            }

            if(this._whereAsString != undefined)
            {
                query += ` ${this._whereAsString} `;                
            }

            query += this.EvaluateWhere();        
                
            let ordenation = "";

            for(let orderby of this._ordering)
            {
                ordenation += `${this.EvaluateOrderBy(orderby)},`;
            }   

            if(this._ordering.length > 0)
            {
                query += ` order by ${ordenation.substring(0, ordenation.length - 1)}`
            }

            if(this._offset != undefined)
            {
                query += ` offset ${this._offset.OffSet}`;
            }
            
            if(this._limit != undefined)
            {
                query += ` limit ${this._limit.Limit}`;
            }

            var r = await this._manager.Execute(query);

            this.Reset();

            return r.rows[0].count;            

        });       
    } 
   
    public async ToListAsync(): Promise<T[]> {

        return this.CreatePromisse(async () => 
        {            
            let whereSrt = PGSetHelper.ExtractWhereData(this);
            let sqlSrt = PGSetHelper.ExtractSQLData(this);

            let query = `select "${this._table}".* from "${this._table}"`;  
            
            if(sqlSrt && sqlSrt.toLowerCase().trim().startsWith(`select distinct "${this._table}".*`))
                query = sqlSrt;

            if(!whereSrt){

                if(this._whereAsString != undefined && this._statements.length > 0)
                {
                    throw new InvalidOperationException("Is not possible combine free and structured queries");
                }

                if(this._whereAsString != undefined)
                {
                    query += ` ${this._whereAsString} `;                
                }

                query += this.EvaluateWhere();

            }else
            {
                query += whereSrt;
            }                
                
            let ordenation = "";

            for(let orderby of this._ordering)
            {
                ordenation += `${this.EvaluateOrderBy(orderby)},`;
            }   

            if(this._ordering.length > 0)
            {
                query += ` order by ${ordenation.substring(0, ordenation.length - 1)}`
            }
            
            if(this._offset != undefined)
            {
                query += ` offset ${this._offset.OffSet}`;
            }

            if(this._limit != undefined)
            {
                query += ` limit ${this._limit.Limit}`;
            }

            var r = await this._manager.Execute(query);

            if(r.rows.length == 0)
            {
                this.Reset();
                return [];                
            }

            let list : T[] = [];

            list = await this.BuildObjects(r);

            this.Reset();

            return list; 

        });       
    }    

    public async FirstOrDefaultAsync(): Promise<T | undefined> 
    {
        return this.CreatePromisse(async()=>{
            
            let rows = await this.Limit(1).ToListAsync();

            if(rows && rows.length > 0)
                return rows[0];

            return undefined;
        });
    }

    public WhereField<U extends keyof T, R extends PGDBSet<T>>(field: U): IFluentField<T, U, R> {        
        
        this.ResetFilters();

        return new PGFluentField(this as any as R, field, false);
    }
    public AndField<U extends keyof T, R extends PGDBSet<T>>(field: U): IFluentField<T, U, R> {        
        return new PGFluentField(this as any as R, field, false);
    }
    public OrField<U extends keyof T, R extends PGDBSet<T>>(field: U): IFluentField<T, U, R> {        
        return new PGFluentField(this as any as R, field, true);
    }
    

    public WhereAsString<R extends PGDBSet<T>>(where : string) : R
    {
        this.ResetFilters();

        if(where && !where.trim().toLocaleLowerCase().startsWith("where"))
        {
            where = `where ${where}`;
        }

        this._whereAsString = where;

        return this as any as R;
    }

    public LoadRelationOn<U extends keyof T, R extends PGDBSet<T>>(field: U): R {   

        return this.Join(field) as any as R;        
    }

    private CreatePromisse<T>(func : ()=> Promise<T>) : Promise<T>
    {
        return new Promise<T>(async (resolve, reject)=>{

            try
            {                
                resolve(await func());
            }
            catch(err)
            {
                reject(err);
            }            
        });
    }

    public CleanQueryTree(): void {

        this.Reset();
    }
   
    private CreateValueStatement(colType : DBTypes, value : any) : string
    {
        
        if(value == undefined || value == null)
            return 'null';

        if(colType == DBTypes.TEXT)
        {
            return `$$${value}$$`;

        }else if(colType == DBTypes.BOOLEAN)
        {
            return `${value.toString().toLowerCase()}`;
        }
        else if(Type.IsNumber(colType))
        {
            if(isNaN(value))
                throw new InvalidOperationException(`Can not cast the value "${value}" in a number`);

            return `${value}`.replace(',','.');

        }else if(Type.IsDate(colType))
        { 
            let dt : Date | undefined; 

            if(value.constructor == Date)
                dt = value as unknown as Date;
            else
                dt = new Date(value.toString());

            if(!dt)
                throw new InvalidOperationException(`Can not cast the value: "${value}" in a valid date`);

            let dtStr = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
                        
            if(colType == DBTypes.DATE)
            {
               return `'${dtStr}'::date`;
            }
            else
            {
                return `'${dtStr} ${dt.getHours()}:${dt.getMinutes()}'::timestamp` ;
            }
                        
        }else if (Type.IsArray(colType))
        {
            let valuesStr = 'array[';
            let elementType = Type.ExtractElementType(colType);
            let hasItens = false;

            for(let i in value)
            {   
                hasItens = true;
                valuesStr += `${this.CreateValueStatement(elementType, value[i])},`;
            }

            if(hasItens)
                valuesStr = valuesStr.substring(0, valuesStr.length - 1);
            
                valuesStr += `]::${this._manager["CastToPostgreSQLType"](colType)}`;

            return valuesStr;
        }

        throw new TypeNotSuportedException(`The type ${colType} is not suported`);
    }

    private EvaluateWhere()
    {
        let query = "";
        for(let i = 0; i < this._statements.length; i++)
        {
            let where = this._statements[i];

            if(i == 0 && where.StatementType != StatementType.WHERE)
                throw new InvalidOperationException(`The query three must start with a WHERE statement`);
                
            if(i > 0 && where.StatementType == StatementType.WHERE)
            where.StatementType = StatementType.AND;

            query += ` ${where.StatementType} ${this.EvaluateStatement(where)} `;
        }  
        return query;   
    }

    private EvaluateStatement(pgStatement : IPGStatement)
    {
        let column = Type.GetColumnName(this._type, pgStatement.Statement.Field.toString());
        let typeName = Type.GetDesingTimeTypeName(this._type, pgStatement.Statement.Field.toString());
        let operation = this.GetOperators(pgStatement.Statement.Kind);
        let type = Type.GetDesingType(this._type, pgStatement.Statement.Field.toString());
        let isArray = type == Array;
        let relation = SchemasDecorators.GetRelationAttribute(this._type, pgStatement.Statement.Field.toString());
        
        if(!type)
        {   
            if(!relation)
            {
                throw new InvalidOperationException(`Can not determine the correct type conversion for propety ${pgStatement.Statement.Field.toString()}`);
            }

            type = relation.TypeBuilder();
        } 

        if(pgStatement.Statement.Value == undefined)
            return `"${this._table}".${column} is null`;   
        
        if(this._context.IsMapped(type) || (relation && this._context.IsMapped(relation.TypeBuilder())))
        {
            if(!relation)
                throw new InvalidOperationException(`Can not determine the correct type conversion for propety ${pgStatement.Statement.Field.toString()}`);            

            if(isArray)
            {
                if(pgStatement.Statement.Value.lenght == 0)
                    return `coalesce(array_length("${this._table}".${column}, 1), 0) = 0`;

                if((pgStatement.Statement.Value as any[]).filter(s => s == undefined || s == null).length > 0)
                    throw new InvalidOperationException(`Can not compare relations with null or undefined objets`);

                let c = pgStatement.Statement.Value[0];

                let k = SchemasDecorators.ExtractPrimaryKey(c.constructor);
                if(!k)
                    throw new ConstraintFailException(`The type ${c.constructor.name} must have a key field`);

                let elementType = Type.GetDesingTimeTypeName(c.constructor, k);

                let internalType = Type.CastType(elementType!);

                let keyType = DBTypes.LONGARRAY;

                if(Type.IsNumber(internalType))
                    keyType = DBTypes.LONGARRAY;
                else if(Type.IsText(internalType))
                    keyType = DBTypes.TEXTARRAY;
                else if(Type.IsDate(internalType))
                    keyType = DBTypes.DATEARRAY;
                else 
                    throw new InvalidOperationException(`Can not determine the correct type conversion for propety ${pgStatement.Statement.Field.toString()}`);
                    
                let newValues : any[] = [];

                for(let e of pgStatement.Statement.Value)
                {       
                    newValues = [e[k]];             
                }

                typeName = keyType;
                pgStatement.Statement.Value = newValues as any;

            }else{

                let k = SchemasDecorators.ExtractPrimaryKey(pgStatement.Statement.Value.constructor);
                if(!k)
                    throw new ConstraintFailException(`The type ${pgStatement.Statement.Value.constructor.name} must have a key field`);
                
                let elementType = Type.GetDesingTimeTypeName(pgStatement.Statement.Value.constructor, k);

                let internalType = Type.CastType(elementType!);

                typeName = internalType;
                pgStatement.Statement.Value = pgStatement.Statement.Value[k];
            }
        }
        
        if(isArray)
        {
            if(!typeName)
                throw new InvalidOperationException(`Can not determine the correct type conversion for propety ${pgStatement.Statement.Field.toString()}`);

            if(pgStatement.Statement.Kind == Operation.EQUALS)
            {
                return `"${this._table}".${column} = ${this.CreateValueStatement(typeName as DBTypes, pgStatement.Statement.Value)}`; 
            }

            if(pgStatement.Statement.Kind == Operation.NOTEQUALS)
            {
                return `"${this._table}".${column} != ${this.CreateValueStatement(typeName as DBTypes, pgStatement.Statement.Value)}`; 
            }

            if(pgStatement.Statement.Kind == Operation.SMALLER || pgStatement.Statement.Kind == Operation.SMALLEROREQUALS)
            {
                return `"${this._table}".${column} <@ ${this.CreateValueStatement(typeName as DBTypes, pgStatement.Statement.Value)}`; 
            }

            if([Operation.STARTWITH, Operation.CONSTAINS, Operation.ENDWITH, Operation.GREATHER, Operation.GREATHEROREQUALS].includes(pgStatement.Statement.Kind))
            {
                return `"${this._table}".${column} @> ${this.CreateValueStatement(typeName as DBTypes, pgStatement.Statement.Value)}`; 
            }           
        }
        
        if(Type.IsNumber(Type.CastType(typeName!.toString())) || Type.IsDate(Type.CastType(typeName!.toString())))
        {

            operation[1] = "";
            operation[2] = "";  

            if(Type.IsDate(Type.CastType(typeName!.toString()))){                  
            
                   
                    let dt : Date = pgStatement.Statement.Value as unknown as Date;

                    if(!dt)
                        throw new InvalidOperationException(`Can not cast the value: "${pgStatement.Statement.Value}" in a valid date`);
        
                    let dtStr = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
                                
                    if(Type.CastType(typeName!.toString()) == DBTypes.DATE)
                    {
                        pgStatement.Statement.Value = `'${dtStr}'::date`;
                    }
                    else
                    {
                        pgStatement.Statement.Value = `'${dtStr} ${dt.getHours()}:${dt.getMinutes()}'::timestamp` ;
                    }
            }

            if([Operation.CONSTAINS, Operation.ENDWITH, Operation.STARTWITH].filter(s => s == pgStatement.Statement.Kind).length > 0)
            {
               throw new InvalidOperationException(`Can execute ${pgStatement.Statement.Kind.toString().toLocaleLowerCase()} only with text and array fields`);
            }        

        }else
        {
            operation[1] = `$$${operation[1]}`;
            operation[2] = `${operation[2]}$$`;
        }

        return `"${this._table}".${column} ${operation[0]} ${operation[1]}${pgStatement.Statement.Value}${operation[2]}`;
    }

    private EvaluateOrderBy(ordering : IPGOrdenation<T>)
    {
        let column = Type.GetColumnName(this._type, ordering.Field.toString());
        
        return ` "${this._table}".${column} ${ordering.Order}`;
    }


    private GetOperators(operation : Operation) : string[]
    {
        switch(operation)
        {
            case Operation.EQUALS : return ["=", "", ""];
            case Operation.CONSTAINS : return ["ilike", "%", "%"];
            case Operation.STARTWITH : return ["ilike", "", "%"];;
            case Operation.ENDWITH : return ["ilike", "%", ""];;
            case Operation.GREATHER : return [">", "", ""];;
            case Operation.GREATHEROREQUALS : return [">=", "", ""];;
            case Operation.SMALLER : return ["<", "", ""];;
            case Operation.SMALLEROREQUALS : return ["<=", "", ""];;
            case Operation.NOTEQUALS : return ["!=", "", ""];;
            default: throw new NotImpletedException(`The operation ${operation} is not supported`);
        }
    }

    private Reset() : void
    {       
        this._ordering = [];
        this._includes = [];
        this._limit = undefined;       
        this.ResetFilters();
    }

    private ResetFilters() : void
    {
        this._statements = [];       
        this._whereAsString = undefined;
        PGSetHelper.CleanORMData(this);
    }

    private IsCorrectType(obj : any) : boolean
    {
        let sameCTor = obj && obj.constructor && obj.constructor == this._type;

        if(sameCTor)
            return true;
        
        if(obj.prototype == this._type)
            return true;
        
        if(obj.prototype && obj.prototype.constructor == this._type)
            return true;
        
        let objectKeys = Object.keys(obj);

        for(let map of this._maps)
        {
            let v = obj[map.Field];

            if(v == undefined)
            {
                let exists = objectKeys.filter(s => s == map.Field).length > 0;

                if(!exists)
                {
                    let allowNull = SchemasDecorators.AllowNullValue(this._type, map.Field);

                    if(!allowNull)
                        return false;
                }
            }
        }

        obj.__proto__ = this._type;
        return true;
    }

    private async BuildObjects(r : any) : Promise<T[]>
    {
        let list : T[] = [];

        for(let row of r.rows)
        {
            let instance = Reflect.construct(this._type, []) as T;

            for(let map of this._maps)
            {
                let type = Type.GetDesingType(this._type, map.Field);
                let relation = SchemasDecorators.GetRelationAttribute(this._type, map.Field);
                if((!type || type === Array) && relation)
                    type = relation.TypeBuilder();

                if(!this._context.IsMapped(type!)){

                    let v = Reflect.get(row, map.Column);

                    let vType = Type.CastType(map.Type);

                    if(v != undefined){

                        if([DBTypes.INTEGER, DBTypes.LONG, DBTypes.SERIAL].includes(vType))
                            Reflect.set(instance, map.Field,  Number.parseInt(v));
                        else if(DBTypes.DOUBLE == vType)
                            Reflect.set(instance, map.Field,  Number.parseFloat(v));
                        else if([DBTypes.DATE, DBTypes.DATETIME].includes(vType)){

                            try{
                                v = new Date(v);
                            }catch{}

                            Reflect.set(instance, map.Field, v);
                        }  
                        else if(DBTypes.TEXT == vType)
                            Reflect.set(instance, map.Field, v.toString());
                        else 
                            Reflect.set(instance, map.Field, v);                          
                        
                    }
                    else 
                        Reflect.set(instance, map.Field, v);
                    
                    
                    
                }
                else {                   

                    if(Reflect.get(row, map.Column) == undefined)
                    {
                        if(this._includes.filter(s => s.Field == map.Field).length > 0)
                        {
                            Type.InjectMetadata(
                                instance, 
                                {
                                    Field: map.Field, 
                                    Type: map.Type as DBTypes,
                                    Value : Reflect.get(row, map.Column), 
                                    Loaded : true                                
                                }
                            );
                        }

                        continue;
                    }

                    let includeType = this._includes.filter(s => s.Field == map.Field);

                    let loaded : boolean = false;

                    if(includeType.length > 0)
                    {
                        loaded = true;
                        
                        let colletion = this._context.Collection(type! as {new (...args: any[]) : Object})!;

                        if(colletion == undefined)
                            continue;

                        let subKey = SchemasDecorators.ExtractPrimaryKey(type!)!;

                        if(relation?.Relation == RelationType.MANY_TO_MANY || relation?.Relation == RelationType.ONE_TO_MANY)
                        {
                            let values = Reflect.get(row, map.Column);

                            if(!values || values.length == 0)
                                continue;

                            colletion.Where({
                                Field : subKey as keyof typeof type, 
                                Kind : Operation.EQUALS, 
                                Value : values[0] as typeof type[keyof typeof type & string]
                            });

                            for(let i = 0; i < values.length; i++)
                            {
                                if(i == 0)
                                    continue;

                                colletion.Or({
                                    Field : subKey as keyof typeof type, 
                                    Kind : Operation.EQUALS, 
                                    Value : values[i] as typeof type[keyof typeof type & string]
                                });
                            }

                            let subObjets = await colletion.ToListAsync();
                            Reflect.set(instance, map.Field, subObjets);

                        }else{

                            colletion.Where({
                                Field : subKey as keyof typeof type, 
                                Kind : Operation.EQUALS, 
                                Value : Reflect.get(row, map.Column) as typeof type[keyof typeof type & string]
                            });

                            let subObjet = await colletion.FirstOrDefaultAsync();
                            Reflect.set(instance, map.Field, subObjet);

                        }

                        
                    }

                    Type.InjectMetadata(
                        instance, 
                        {
                            Field: map.Field, 
                            Type: map.Type as DBTypes,
                            Value : Reflect.get(row, map.Column), 
                            Loaded : loaded                                
                        }
                    );

                }
            }
                          
            list.push(instance);
        }

        return list;
    }
    
}

interface IPGStatement
{
    StatementType : StatementType;
    Statement : 
    {
        Field : string;
        Kind : Operation, 
        Value : any
    }
}

interface IPGOrdenation<T>
{
    Field : keyof T,
    Order : OrderDirection
}

interface IPGIncluding<T>
{
    Field : keyof T    
}

interface IPGLimiter
{
    Limit : number
}

interface IPGOffset
{
    OffSet : number
}


enum OrderDirection
{
    ASC = 'asc', 
    DESC = 'desc'
}

enum StatementType
{
    WHERE = "where",
    OR = "or", 
    AND = "and"
}

