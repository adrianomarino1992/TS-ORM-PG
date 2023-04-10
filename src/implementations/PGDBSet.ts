import IDBSet from "../core/objects/interfaces/IDBSet";
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


export default class PGDBSet<T extends object>  implements IDBSet<T>
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

            let sql = `insert into ${this._table}(`;
            let values = `values (`;
            let returnKey = '';       
            let key : {Property : string, Column : string} | undefined;
            let subTypes : typeof this._maps = [];  

            for(let map of this._maps)
            {
                    if(Reflect.get(obj, map.Field) == undefined)
                        continue;

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

                    sql += `${map.Column},`;            
                    
                    values += `${this.CreateValueStatement(colType, Reflect.get(obj, map.Field))},`;
                    
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
                                        let value : any[] = ((Reflect.get(i, subKey) ?? []) as Array<typeof subType>).filter(s => (s as any)[subPK!] != (obj as any)[subPK!]);                                
                                        value.push(obj);
                                        Reflect.set(i as any, subKey, value);
                                    }
                                }else{

                                    let value : any[] = ((Reflect.get(subObj, subKey) ?? []) as Array<typeof this._type>).filter(s => (s as any)[subPK!] != (obj as any)[subPK!]);                                
                                    value.push(obj);
                                    Reflect.set(subObj, subKey, value);

                                }
                               
                            }else{

                                if(subRelation.Relation == RelationType.MANY_TO_ONE)
                                {
                                    for(let i of subObj as Array<typeof subType>)
                                    {                                        
                                        Reflect.set(i as any, subKey, obj);
                                    }
                                }else{

                                    Reflect.set(subObj as any, subKey, obj);
                                }
                            }

                                                      

                        }
                    }
                }

                let colletion = this._context.Collection(subType)!;
                
                if(isArray)
                {
                    for(let i of subObj as Array<typeof subType>)
                    {
                        if(!Type.HasValue(Reflect.get(i as any, subPK)))
                            await (colletion as PGDBSet<typeof subType>)["AddAsync"](i as any);
                        else 
                            await (colletion as PGDBSet<typeof subType>)["UpdateObjectAsync"](i as any, false);
                    }
                }else{

                    if(!Type.HasValue(Reflect.get(subObj as any, subPK)))
                        await (colletion as PGDBSet<typeof subType>)["AddAsync"](subObj as any);
                    else 
                        await (colletion as PGDBSet<typeof subType>)["UpdateObjectAsync"](subObj as any, false);
                } 
                               

                
                let columnType = Type.CastType(Type.GetDesingTimeTypeName(subType, subPK)!);

                if(relation?.Relation == RelationType.MANY_TO_MANY || relation?.Relation == RelationType.ONE_TO_MANY)
                    columnType = Type.AsArray(columnType) as DBTypes;
                
                let updateValues = [Reflect.get(subObj as any, subPK)];

                if(isArray)
                {
                    updateValues = [];

                    for(let i of subObj as Array<typeof subType>)
                    {
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
    private UpdateObjectAsync(obj : T, cascade? : boolean): Promise<T> {
        
        return this.CreatePromisse(async() => 
        {
            
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

            let update = `update ${this._table} set`;
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

                values += `${map.Column} = ${this.CreateValueStatement(colType, Reflect.get(obj, map.Field))},`;

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
                let meta = metadata.filter(s => s.Field == sub.Field);

                if(meta.length > 0 && subObj == undefined)
                {
                    if(meta[0].Loaded)
                        subTypesUpdates.push(`"${sub.Column}" = null`);
                        
                    continue;
                }           
                
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
                                        Reflect.set(i as any, subKey, obj);
                                    }
                                }else{

                                    Reflect.set(subObj as any, subKey, obj);
                                }
                            }

                                                      

                        }
                    }
                }


                let colletion = this._context.Collection(subType)!;
                
                if(isArray)
                {
                    for(let i of subObj as Array<typeof subType>)
                    {
                        if(!Type.HasValue(Reflect.get(i as any, subPK)))
                            await (colletion as PGDBSet<typeof subType>)["AddAsync"](i as any);
                        else if(cascade)
                            await (colletion as PGDBSet<typeof subType>)["UpdateObjectAsync"](i as any, false);
                    }
                }else{

                    if(!Type.HasValue(Reflect.get(subObj as any, subPK)))
                        await (colletion as PGDBSet<typeof subType>)["AddAsync"](subObj as any);
                    else if(cascade)
                        await (colletion as PGDBSet<typeof subType>)["UpdateObjectAsync"](subObj as any, false);
                } 
                               

                
                let columnType = Type.CastType(Type.GetDesingTimeTypeName(subType, subPK)!);

                if(relation?.Relation == RelationType.MANY_TO_MANY || relation?.Relation == RelationType.ONE_TO_MANY)
                    columnType = Type.AsArray(columnType) as DBTypes;
                    
                    let updateValues = [Reflect.get(subObj as any, subPK)];

                    if(isArray)
                    {
                        updateValues = [];
    
                        for(let i of subObj as Array<typeof subType>)
                        {
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

            let del = `delete from ${this._table} `;           
           

            for(let where of wheres)
            {
                del += ` ${where.StatementType} ${this.EvaluateStatement(where)} `;
            }  

            await this._manager.ExecuteNonQuery(del);

            return obj;
        });
    }
    Where<K extends keyof T>(statement : IStatement<T, K>): IDBSet<T> {


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
  

    async ToListAsync(): Promise<T[]> {

        return this.CreatePromisse(async () => 
        {
            let query = `select * from ${this._table}`;

            for(let where of this._statements)
            {
                query += ` ${where.StatementType} ${this.EvaluateStatement(where)} `;
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

            for(let row of r.rows)
            {
                let instance = Reflect.construct(this._type, []) as T;

                for(let map of this._maps)
                {
                    let type = Type.GetDesingType(this._type, map.Field);
                    let relation = SchemasDecorators.GetRelationAttribute(this._type, map.Field);
                    if((!type || type === Array) && relation)
                        type = relation.TypeBuilder();

                    if(!this._context.IsMapped(type!))
                        Reflect.set(instance, map.Field, Reflect.get(row, map.Column));
                    else {                   

                        if(Reflect.get(row, map.Column) == undefined)
                            continue;

                        let includeType = this._includes.filter(s => s.Field == map.Field);

                        let loaded : boolean = false;

                        if(includeType.length > 0)
                        {
                            loaded = true;
                            
                            let colletion = this._context.Collection(type!)!;

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

            this.Reset();

            return list; 

        });       
    }

    async FirstOrDefaultAsync(): Promise<T | undefined> 
    {
        return this.CreatePromisse(async()=>{

            let rows = await this.ToListAsync();

            if(rows && rows.length > 0)
                return rows[0];

            return undefined;
        });
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
   
    private CreateValueStatement(colType : DBTypes, value : any) : string
    {
                    
        if(colType == DBTypes.TEXT)
        {
            return `$$${value}$$`;

        }else if(Type.IsNumber(colType))
        {
            return `${value}`.replace(',','.');

        }else if(Type.IsDate(colType))
        {
            let dt : Date = value as unknown as Date;
            let dtStr = `'${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}'`;
                        
            if(colType == DBTypes.DATE)
            {
               return `${dtStr}`;
            }
            else
            {
                return `${dtStr} ${dt.getHours()}:${dt.getMinutes()}` ;
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

    private EvaluateStatement(pgStatement : IPGStatement)
    {
        let column = Type.GetColumnName(this._type, pgStatement.Statement.Field.toString());
        let type = Type.GetDesingTimeTypeName(this._type, pgStatement.Statement.Field.toString());
        let operation = this.GetOperators(pgStatement.Statement.Kind);

        if(pgStatement.Statement.Value == undefined)
            return `${column} is null`;

        if(Type.IsNumber(Type.CastType(type!.toString())))
        {
            operation[1] = "";
            operation[2] = "";            
        }else
        {

            operation[1] = `$$${operation[1]}`;
            operation[2] = `${operation[2]}$$`;
        }

        return `${column} ${operation[0]} ${operation[1]}${pgStatement.Statement.Value}${operation[2]}`;
    }

    private EvaluateOrderBy(ordering : IPGOrdenation<T>)
    {
        let column = Type.GetColumnName(this._type, ordering.Field.toString());
        
        return ` ${column} ${ordering.Order}`;
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
            case Operation.SMALLER : return ["<", "", ""];;
            case Operation.NOTEQUALS : return ["!=", "", ""];;
            default: throw new NotImpletedException(`The operation ${operation} is not supported`);
        }
    }

    private Reset() : void
    {
        this._statements = [];
        this._ordering = [];
        this._includes = [];
        this._limit = undefined;
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

