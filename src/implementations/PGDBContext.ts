import {IStatement, AbstractContext, IJoiningQuery, IJoinSelectable, IDBSet} from "myorm_core";


import SchemasDecorators from "../core/decorators/SchemasDecorators";
import Type from "../core/design/Type";
import ConstraintFailException from "../core/exceptions/ConstraintFailException";
import InvalidOperationException from "../core/exceptions/InvalidOperationException";
import TypeNotMappedException from "../core/exceptions/TypeNotMappedException";
import PGDBManager from "./PGDBManager";
import PGDBSet from "./PGDBSet";
import PGSetHelper from "./PGSetHelper";

export default abstract class PGDBContext extends AbstractContext
{
    protected _manager :PGDBManager;    

    private _mappedTypes! : {new (...args: any[]) : unknown}[];

    constructor(manager : PGDBManager)
    {
        super();
        this._manager = manager;  
    }      
    
    
    public GetMappedTypes()
    {
        if(this._mappedTypes != undefined)
            return this._mappedTypes;

        this._mappedTypes = [];

        let props = Object.keys(this);

        for(let prop of props)
        {
            if((this as any)[prop].constructor == PGDBSet)
            {
                this._mappedTypes.push((this as any)[prop]["_type"]);
            }
        }

        return this._mappedTypes;
    }

    public IsMapped(type : {new (...args: any[]) : unknown}) : boolean
    {
        return this.GetMappedTypes().filter(t => t == type).length > 0;
    }

    public Collection<T extends Object>(cTor  : {new (...args : any[]) : T}): IDBSet<T> 
    {

        for(let prop of Object.keys(this))
        {
            let type = (this as any)[prop]["_type"];

            if(type == undefined)
                continue;
            if(type == cTor)
                return (this as any)[prop] as IDBSet<T>;
        }

        throw new TypeNotMappedException(`${cTor.name} is not mapped in this context`);
    }

    public async UpdateDatabaseAsync(): Promise<void> {
       
        let dbName = this._manager["_connection"].DataBaseName;

        if(!await this._manager.CheckDatabase(dbName))
            await this._manager.CreateDataBase(dbName);

        for(let type of this.GetMappedTypes())
        {
            await this._manager.UpdateDatabaseForEntity(type);
        }

    }

    public async ExecuteNonQuery(query : string): Promise<void> {
       await this._manager.ExecuteNonQuery(query);
    }

    public async ExecuteQuery(query : string): Promise<any> {
        return await this._manager.Execute(query);
    }    


    Join(...args: (new (...args: any[]) => Object)[]): IJoiningQuery {
        
        return new JoiningQuery(this, args);
    }   
          
    

}

export class JoiningQuery implements IJoiningQuery
{

    private _context : PGDBContext;
    private _stack : IUnion[] = [];
    private _onStatements : [string, string][] = [];
    

    constructor(context : PGDBContext, stack :  (new (...args: any[]) => Object)[])
    {
        this._context = context;
        this._stack.push(...stack.map(s => {return { Type : s as unknown}}));
        
        let notMappedTypes = this._stack.filter(s => this._context.Collection(s.Type as new (...args: any[]) => Object ) == undefined);

       
        if(notMappedTypes.length > 0)
        {
            this._stack = [];
            throw new InvalidOperationException(`The type ${(notMappedTypes[0].Type as any).name} is not mapped`);
        }


       
    }
    On<C extends Object, U extends Object>(cT: { new(...args: any[]): C }, cKey: keyof C, uT: { new(...args: any[]): U}, uKey: keyof U): IJoiningQuery {
       
        this.CheckIfTypeIsAllowed(cT); 
        this.CheckIfTypeIsAllowed(cT); 

        let leftIndex = this._stack.findIndex(s => s.Type == cT);
        let rightIndex = this._stack.findIndex(s => s.Type == uT);

        if(rightIndex - leftIndex != 1)
            throw new InvalidOperationException(`The On statement must follow the same order than Join`);
        
        this._onStatements.push([cKey.toString(), uKey.toString()]);

        return this;
    }
   
    Where<C extends Object, K extends keyof C>(cT: new (...args: any[]) => C, statement: IStatement<C, K>): IJoiningQuery {
        
        this.CheckIfTypeIsAllowed(cT);
        
        let set = this._context.Collection(cT)!;
        set.Where(statement);

        return this;

    }
    And<C extends Object, K extends keyof C>(cT: new (...args: any[]) => C, statement: IStatement<C, K>): IJoiningQuery {
        this.CheckIfTypeIsAllowed(cT);
        
        let set = this._context.Collection(cT)!;
        set.And(statement);

        return this;
    }
    Or<C extends Object, K extends keyof C>(cT: new (...args: any[]) => C, statement: IStatement<C, K>): IJoiningQuery {

        this.CheckIfTypeIsAllowed(cT);
        
        let set = this._context.Collection(cT)!;
        set.Or(statement);

        return this;
    }

    Select<C extends Object>(cT: new (...args: any[]) => C): IJoinSelectable<C> {

        return new JoinSelectable(cT, this._context, this._stack, this._onStatements);
    }

    private CheckIfTypeIsAllowed(cT: new (...args: any[]) => Object)
    {
        let set = this._context.Collection(cT);

        if(!set)
            throw new InvalidOperationException(`The type ${cT.name} is not mapped`);
        
        let index = this._stack.findIndex(s => s.Type == cT);

        if(index == -1)
            throw new InvalidOperationException(`The type ${cT.name} is not inside the Join list`);
    }
   
}


export class JoinSelectable<T extends Object> implements IJoinSelectable<T>
{
    private _context : PGDBContext;
    private _stack : IUnion[] = [];
    private _onStatements : [string, string][] = [];
    private _firstOrDefault : boolean = false;
    private _type : new (...args: any[]) => T;
    constructor(cT : new (...args: any[]) => T,  context : PGDBContext, stack : IUnion[], onStack : [string, string][])
    {
        this._type = cT;
        this._context = context;
        this._stack = stack;
        this._onStatements = onStack;
    }
   
    Join<K extends keyof T>(key: K): IJoinSelectable<T> {

       this._context.Collection(this._type)?.Join(key);
       return this;
    }
    OrderBy<K extends keyof T>(key: K): IJoinSelectable<T> {
        this._context.Collection(this._type)?.OrderBy(key);
        return this;
    }
    OrderDescendingBy<K extends keyof T>(key: K): IJoinSelectable<T> {
        this._context.Collection(this._type)?.OrderDescendingBy(key);
       return this;
    }

    public async ToListAsync(): Promise<T[]> {

        if(this._stack.length > this._onStatements.length + 1)
            throw new InvalidOperationException(`There is no enought On clausules to join all selected types`);

        if(this._stack.length < this._onStatements.length + 1)
            throw new InvalidOperationException(`There is more On clausules than join types selecteds`);

        let selectedSideSet = this._context.Collection(this._type);

        let leftSideType = this._stack[0].Type as Function;

        let selectedTable = Type.GetTableName(this._type);

        let query = `select distinct "${selectedTable}".* from "${Type.GetTableName(leftSideType)}" `;

        for(let i = 1; i < this._stack.length; i++)
        {           
            let rightSideType = this._stack[i].Type as Function;
            let leftSideTable = Type.GetTableName(leftSideType);
            let rigthSideTable = Type.GetTableName(rightSideType); 
            let onStatement = this._onStatements[i-1];            
            let leftSideField = onStatement[0];
            let rightSideField = onStatement[1];
            let leftSideIsArray = Type.GetDesingType(leftSideType, leftSideField) == Array;
            let rightSideIsArray = Type.GetDesingType(rightSideType, rightSideField) == Array;
            let rightSideTypeMap = Type.GetColumnNameAndType(rightSideType);
            let leftSideTypeMap = Type.GetColumnNameAndType(leftSideType);

            query += ` inner join "${rigthSideTable}" on `;

            if((leftSideIsArray && rightSideIsArray) || (!leftSideIsArray && !rightSideIsArray))
            {
                query += ` "${leftSideTable}".${Type.GetColumnName(leftSideType, leftSideField)} = "${rigthSideTable}".${Type.GetColumnName(rightSideType, rightSideField)} `

            }else if (leftSideIsArray && !rightSideIsArray)
            {
               let relation = SchemasDecorators.GetRelationAttribute(leftSideType, leftSideField);
               

               if(relation)
               {
                    let rType = relation.TypeBuilder();
                    let key = SchemasDecorators.ExtractPrimaryKey(rType);

                    if(!key)
                        throw new ConstraintFailException(`The type ${rType.name} was no one primary key field`);
                    
                    let relationMap = Type.GetColumnNameAndType(rType);

                   let leftSideDBType = Type.CastType(relationMap.filter(s => s.Field == key)[0].Type);
                   let rightSideDBType = Type.CastType(rightSideTypeMap.filter(s => s.Field == rightSideField)[0].Type);
                   let leftColumnName =  leftSideTypeMap.filter(s => s.Field == leftSideField)[0].Column;
                   let rightColumnName =  rightSideTypeMap.filter(s => s.Field == rightSideField)[0].Column;

                   if(leftSideDBType != rightSideDBType)
                   {
                        throw new InvalidOperationException(`${leftSideType.name}.${leftSideField} and ${rightSideType.name}.${rightSideField} must be the same type to join`);
                   }

                   query += ` "${rigthSideTable}".${rightColumnName} = ANY("${leftSideTable}".${leftColumnName})`;


               }
               else
               {
                    let dataType = SchemasDecorators.GetDataTypeAttribute(leftSideType, leftSideField);

                    if(!dataType)
                    {
                        throw new InvalidOperationException(`Can not find the DataAttributeof ${leftSideType.name}.${leftSideField}`);
                    }

                    let elementType = Type.ExtractElementType(dataType);

                    if(!elementType)
                        throw new InvalidOperationException(`Can not determine the array element type of ${leftSideType.name}.${leftSideField}`);
                       
                    let leftColumnName =  leftSideTypeMap.filter(s => s.Field == leftSideField)[0].Column;
                    let rightSideDBType = Type.CastType(rightSideTypeMap.filter(s => s.Field == rightSideField)[0].Type);                        
                    let rightColumnName =  rightSideTypeMap.filter(s => s.Field == rightSideField)[0].Column;

                    let areNumbers = Type.IsNumber(Type.CastType(elementType)) && Type.IsNumber(rightSideDBType);
                    let areString = Type.IsText(Type.CastType(elementType)) && Type.IsText(rightSideDBType)
                    let areDate = Type.IsDate(Type.CastType(elementType)) && Type.IsDate(rightSideDBType)
                    let areArray = Type.IsArray(Type.CastType(elementType)) && Type.IsArray(rightSideDBType)
                    let areSameType =  this._context["_manager"]["CastToPostgreSQLType"](elementType) == this._context["_manager"]["CastToPostgreSQLType"](rightSideDBType);
                    let areSerial =  this._context["_manager"]["CastToPostgreSQLType"](elementType) == "serial" && this._context["_manager"]["CastToPostgreSQLType"](rightSideDBType) == "serial";
                    

                    if(!(areNumbers || areString || areDate || areArray || areSameType || areSerial))
                        throw new InvalidOperationException(`${leftSideType.name}.${leftSideField} and ${rightSideType.name}.${rightSideField} must be the same type to join`);

                    query += ` "${rigthSideTable}".${rightColumnName} = ANY("${leftSideTable}".${leftColumnName})`;

               }
            }
            else if (rightSideIsArray && !leftSideIsArray)
            {
               let relation = SchemasDecorators.GetRelationAttribute(rightSideType, rightSideField);
               

               if(relation)
               {
                    let rType = relation.TypeBuilder();
                    let key = SchemasDecorators.ExtractPrimaryKey(rType);

                    if(!key)
                        throw new ConstraintFailException(`The type ${rType.name} was no one primary key field`);
                    
                    let relationMap = Type.GetColumnNameAndType(rType);
                    
                   let rightSideDBType = Type.CastType(relationMap.filter(s => s.Field == key)[0].Type);
                   let leftSideDBType = Type.CastType(rightSideTypeMap.filter(s => s.Field == leftSideField)[0].Type);
                   let leftColumnName =  leftSideTypeMap.filter(s => s.Field == leftSideField)[0].Column;
                   let rightColumnName =  rightSideTypeMap.filter(s => s.Field == rightSideField)[0].Column;
                   
                   if(leftSideDBType != rightSideDBType)
                   {
                        throw new InvalidOperationException(`${leftSideType.name}.${leftSideField} and ${rightSideType.name}.${rightSideField} must be the same type to join`);
                   }

                   query += ` "${leftSideTable}".${leftColumnName} = ANY("${rigthSideTable}".${rightColumnName})`;
               }
               else
               {
                    let dataType = SchemasDecorators.GetDataTypeAttribute(rightSideType, rightSideField);

                    if(!dataType)
                    {
                        throw new InvalidOperationException(`Can not find the DataAttributeof ${rightSideType.name}.${rightSideField}`);
                    }

                    let elementType = Type.ExtractElementType(dataType);

                    if(!elementType)
                        throw new InvalidOperationException(`Can not determine the array element type of ${rightSideType.name}.${rightSideField}`);
                       
                    let leftColumnName =  leftSideTypeMap.filter(s => s.Field == leftSideField)[0].Column;
                    let leftSideDBType = Type.CastType(leftSideTypeMap.filter(s => s.Field == leftSideField)[0].Type);                        
                    let rightColumnName =  rightSideTypeMap.filter(s => s.Field == rightSideField)[0].Column;

                    let areNumbers = Type.IsNumber(Type.CastType(elementType)) && Type.IsNumber(leftSideDBType);
                    let areString = Type.IsText(Type.CastType(elementType)) && Type.IsText(leftSideDBType)
                    let areDate = Type.IsDate(Type.CastType(elementType)) && Type.IsDate(leftSideDBType)
                    let areArray = Type.IsArray(Type.CastType(elementType)) && Type.IsArray(leftSideDBType)
                    let areSameType =  this._context["_manager"]["CastToPostgreSQLType"](elementType) == this._context["_manager"]["CastToPostgreSQLType"](leftSideDBType);
                    let areSerial =  this._context["_manager"]["CastToPostgreSQLType"](elementType) == "serial" && this._context["_manager"]["CastToPostgreSQLType"](leftSideDBType) == "serial";

                    if(!(areNumbers || areString || areDate || areArray || areSameType || areSerial))
                        throw new InvalidOperationException(`${leftSideType.name}.${leftSideField} and ${rightSideType.name}.${rightSideField} must be the same type to join`);

                        
                    query += ` "${leftSideTable}".${leftColumnName} = ANY("${rigthSideTable}".${rightColumnName})`;             
                }
            }

            leftSideType = this._stack[i].Type as Function;
        }
        
        let where = "";

        for(let type of this._stack)
        {
            let set = this._context.Collection(type.Type as {new (...args: any[]) : Object})! as PGDBSet<Object>;

            let statements = set["_statements"];

            for(let s of statements)
            {
                let operation = s.StatementType.toString();

                if(operation == "where" && where.length > 0)
                    operation = "and";
                
                where += ` ${operation} ${set["EvaluateStatement"](s)}`;
            }
        }

        PGSetHelper.InjectSQL<T>(selectedSideSet! as PGDBSet<T>, query);
        PGSetHelper.InjectWhere<T>(selectedSideSet! as PGDBSet<T>, where);
        
        if(this._firstOrDefault)
            selectedSideSet!.Limit(1);
            
        return await selectedSideSet!.ToListAsync();        
        
    }

    public async FirstOrDefaultAsync(): Promise<T | undefined> {

        this._firstOrDefault = true;

        let d = await this.ToListAsync();

        this.Reset();

        if(d.length > 0)
            return d[0];
        
        return undefined;
    }

    private Reset() : void
    {
        for(let i = 1; i < this._stack.length; i++)
        {
            let type = this._stack[i].Type as Function;
            let set = this._context.Collection(type as {new (...args: any[]) : Object})! as PGDBSet<Object>;
            set["Reset"]();
        }

        this._stack = [];
        this._firstOrDefault = false;
        this._onStatements = [];
    }
    
}


interface IUnion
{
    Type : unknown,
    Key?  : string
}
