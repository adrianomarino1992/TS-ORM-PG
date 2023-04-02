import IDBSet from "../core/objects/interfaces/IDBSet";
import TypeUtils from "../core/utils/TypeUtils";
import { DBTypes } from "../core/enums/DBTypes";

import IStatement from "../core/objects/interfaces/IStatement";
import { Operation } from "../core/objects/interfaces/IStatement";

import SchemasDecorators from "../core/decorators/SchemasDecorators";
import PGDBManager from "./PGDBManager";
import NotImpletedException from "../core/exceptions/NotImplementedException";
import TypeNotSuportedException from "../core/exceptions/TypeNotSuportedException";


export default class PGDBSet<T extends object>  implements IDBSet<T>
{
    
    private _type! : {new (...args : any[]) : T};
    private _table! : string;
    private _columns! : {[key : string] : string[]};
    private _manager! : PGDBManager;
    private _statements : IPGStatement<T>[] = [];
    private _ordering : IPGOrdenation<T>[] = [];
    private _limit? : IPGLimiter;
    
    constructor(cTor : { new(...args : any[]) : T}, manager : PGDBManager)
    {
        this._type = cTor;
        this._table = TypeUtils.GetTableName(cTor);
        this._columns = TypeUtils.GetColumnNameAndType(cTor);
        this._manager = manager;
    }
    

    public AddAsync(obj : T): Promise<T> {


        return this.CreatePromisse(async () => 
        {

            let sql = `insert into ${this._table}(`;
            let values = `values (`;
            let returnKey = '';       
            let key : string | undefined;
            
            for(let column in this._columns)
            {
                    if(SchemasDecorators.IsPrimaryKey(this._type, column))
                    {
                        returnKey = `returning ${this._columns[column][0]}`;
                        key = this._columns[column][0];
                        continue;
                    }

                    let colType = TypeUtils.CastType(this._columns[column][1]);

                    sql += `${this._columns[column][0]},`;            
                    
                    values += `${this.CreateValueStatement(colType, Reflect.get(obj, column))},`;
                    
            }
            
            sql = sql.substring(0, sql.length - 1) + ") ";
            values = values.substring(0, values.length - 1) + ")";

            let insert = `${sql} ${values} ${returnKey};`;
            
            let retun = await this._manager.Execute(insert);

            if(key != undefined && retun.rows.length > 0)
            {
                (obj as any)[key] = retun.rows[0][key];
            }

            return obj;

        });              
    }

    
    UpdateAsync(obj : T): Promise<T> {
        
        return this.CreatePromisse(async() => 
        {
            
            let keys = TypeUtils.GetProperties(this._type).filter(p => SchemasDecorators.IsPrimaryKey(this._type, p));
            let wheres : IPGStatement<T>[] = [];

            if(keys && keys.length > 0)
            {
                keys.forEach((w, i) => 
                {
                    wheres.push({
                        Statement : {
                            Field : w as keyof T, 
                            Kind : Operation.EQUALS, 
                            Value : Reflect.get(obj, w)
                        }, 
                        StatementType : i == 0 ? StatementType.WHERE : StatementType.AND
                    })
                });
            }

            let update = `update ${this._table} set`;
            let values = "";

            for(let column in this._columns)
            {
                let colType = TypeUtils.CastType(this._columns[column][1]);

                if(SchemasDecorators.IsPrimaryKey(this._type, column))
                {
                    continue;
                }

                values += `${this._columns[column][0]} = ${this.CreateValueStatement(colType, Reflect.get(obj, column))},`;

            }
            
            update = `${update} ${values.substring(0, values.length - 1)}`;

            for(let where of wheres)
            {
                update += ` ${where.StatementType} ${this.EvaluateStatement(where.Statement)} `;
            }  

            await this._manager.ExecuteNonQuery(update);

            return obj;
        });

    }
    DeleteAsync(obj : T): Promise<T> {
        return this.CreatePromisse(async() => 
        {
            
            let keys = TypeUtils.GetProperties(this._type).filter(p => SchemasDecorators.IsPrimaryKey(this._type, p));
            let wheres : IPGStatement<T>[] = [];

            if(keys && keys.length > 0)
            {
                keys.forEach((w, i) => 
                {
                    wheres.push({
                        Statement : {
                            Field : w as keyof T, 
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
                del += ` ${where.StatementType} ${this.EvaluateStatement(where.Statement)} `;
            }  

            await this._manager.ExecuteNonQuery(del);

            return obj;
        });
    }
    Where(statement : IStatement<T>): IDBSet<T> {


       this._statements.push(
        {
            Statement : statement, 
            StatementType : StatementType.WHERE
        });

        return this;
    }

    And(statement : IStatement<T>): IDBSet<T> {

        this._statements.push(
            {
                Statement : statement, 
                StatementType : StatementType.AND
            });
    
            return this;
    }

    Or(statement : IStatement<T>): IDBSet<T> {

        this._statements.push(
        {
            Statement : statement, 
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
                query += ` ${where.StatementType} ${this.EvaluateStatement(where.Statement)} `;
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
                return [];
            }

            let list : T[] = [];

            for(let row of r.rows)
            {
                let instance = Reflect.construct(this._type, []) as T;

                for(let column in this._columns)
                {
                    Reflect.set(instance, column, Reflect.get(row, this._columns[column][0]));
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

        }else if(TypeUtils.IsNumber(colType))
        {
            return `${value}`.replace(',','.');

        }else if(TypeUtils.IsDate(colType))
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
                        
        }else if (TypeUtils.IsArray(colType))
        {
            let valuesStr = 'array[';
            let elementType = TypeUtils.ExtractElementType(colType);
            let hasItens = false;

            for(let i in value)
            {   
                hasItens = true;
                valuesStr += `${this.CreateValueStatement(elementType, value[i])},`;
            }

            if(hasItens)
                valuesStr = valuesStr.substring(0, valuesStr.length - 1);
            
                valuesStr += `]::${colType}`;

            return valuesStr;
        }

        throw new TypeNotSuportedException(`The type ${colType} is not suported`);
    }

    private EvaluateStatement(statement : IStatement<T>)
    {
        let column = TypeUtils.GetColumnName(this._type, statement.Field.toString());
        let type = TypeUtils.GetDesingTimeType(this._type, statement.Field.toString());
        let operation = this.GetOperators(statement.Kind);

        if(TypeUtils.IsNumber(TypeUtils.CastType(type!.toString())))
        {
            operation[1] = "";
            operation[2] = "";            
        }else
        {

            operation[1] = `$$${operation[1]}`;
            operation[2] = `${operation[2]}$$`;
        }

        return `${column} ${operation[0]} ${operation[1]}${statement.Value}${operation[2]}`;
    }

    private EvaluateOrderBy(ordering : IPGOrdenation<T>)
    {
        let column = TypeUtils.GetColumnName(this._type, ordering.Field.toString());
        
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
        this._limit = undefined;
    }

    
    
}

interface IPGStatement<T>
{
    StatementType : StatementType;
    Statement : IStatement<T>;
}

interface IPGOrdenation<T>
{
    Field : keyof T,
    Order : OrderDirection
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

