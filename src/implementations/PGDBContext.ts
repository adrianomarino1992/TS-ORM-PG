import { DBTypes } from "../Index";
import SchemasDecorators from "../core/decorators/SchemasDecorators";
import Type from "../core/design/Type";
import ConstraintFailException from "../core/exceptions/ConstraintFailException";
import InvalidOperationException from "../core/exceptions/InvalidOperationException";
import IDBContext, {IThreeQueryableObject,IJoiningQuery} from "../core/objects/interfaces/IDBContext";
import IDBSet from "../core/objects/interfaces/IDBSet";
import IStatement from "../core/objects/interfaces/IStatement";
import PGDBManager from "./PGDBManager";
import PGDBSet from "./PGDBSet";
import PGSetHelper from "./PGSetHelper";

export default abstract class PGDBContext implements IDBContext , IThreeQueryableObject
{
    protected _manager :PGDBManager;    

    private _mappedTypes! : {new (...args: any[]) : unknown}[];

    constructor(manager : PGDBManager)
    {
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

    public Collection<T extends Object>(cTor  : {new (...args : any[]) : T}): IDBSet<T> | undefined {

        for(let prop of Object.keys(this))
        {
            let type = (this as any)[prop]["_type"];

            if(type == undefined)
                continue;
            if(type == cTor)
                return (this as any)[prop] as IDBSet<T>;
        }

        return undefined
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


    From<T1 extends Object, T2 extends Object>(cT1: new (...args: any[]) => T1, cT2: new (...args: any[]) => T2): IJoiningQuery<T1, T2, unknown, unknown, unknown, unknown>;
    From<T1 extends Object, T2 extends Object, T3 extends Object>(cT1: new (...args: any[]) => T1, cT2: new (...args: any[]) => T2, cT3: new (...args: any[]) => T3): IJoiningQuery<T1, T2, T3, unknown, unknown, unknown>;
    From<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object>(cT1: new (...args: any[]) => T1, cT2: new (...args: any[]) => T2, cT3: new (...args: any[]) => T3, cT4: new (...args: any[]) => T4): IJoiningQuery<T1, T2, T3, T4, unknown, unknown>;
    From<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object>(cT1: new (...args: any[]) => T1, cT2: new (...args: any[]) => T2, cT3: new (...args: any[]) => T3, cT4: new (...args: any[]) => T4, cT5: new (...args: any[]) => T5): IJoiningQuery<T1, T2, T3, T4, T5, unknown>;
    From<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object, T6 extends Object>(cT1: new (...args: any[]) => T1, cT2: new (...args: any[]) => T2, cT3: new (...args: any[]) => T3, cT4: new (...args: any[]) => T4, cT5: new (...args: any[]) => T5, cT6: new (...args: any[]) => T6): IJoiningQuery<T1, T2, T3, T4, T5, T6>;
    From<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object, T6 extends Object>(cT1: T1, cT2: T2, cT3?: T3, cT4?: T4, cT5?: T5, cT6?: T6): IJoiningQuery<T1, T2, unknown, unknown, unknown, unknown> | IJoiningQuery<T1, T2, T3, unknown, unknown, unknown> | IJoiningQuery<T1, T2, T3, T4, unknown, unknown> | IJoiningQuery<T1, T2, T3, T4, T5, unknown> | IJoiningQuery<T1, T2, T3, T4, T5, T6> {
       
        return new JoiningQuery(this, cT1, cT2, cT3, cT4, cT5, cT6);
    }
   
          
    

}

export class JoiningQuery<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object, T6 extends Object> implements IJoiningQuery<T1, T2, T3, T4, T5, T6>
{

    private _context : PGDBContext;
    private _stack : IUnion[] = [];
    private _onStatements : [string, string][] = [];
    

    constructor(context : PGDBContext, cT1: T1, cT2: T2, cT3?: T3, cT4?: T4, cT5?: T5, cT6?: T6)
    {
        this._context = context;
        this._stack.push({Type : cT1 as unknown });
        this._stack.push({Type : cT2 as unknown});
        
        if(cT3)
            this._stack.push({Type : cT3 as unknown});
        if(cT4)
            this._stack.push({Type : cT4 as unknown});
        if(cT5)
            this._stack.push({Type : cT5 as unknown});
        if(cT6)
            this._stack.push({Type : cT6 as unknown});
       
    }
    On<C extends T1 | T2 | T3 | T4 | T5 | T6, U extends T1 | T2 | T3 | T4 | T5 | T6>(cT: { new(...args: any[]): C }, cKey: keyof C, uT: { new(...args: any[]): U}, uKey: keyof U): IJoiningQuery<T1, T2, T3, T4, T5, T6> {
       
        
        let table = this._stack.filter(s => s.Type == cT);

        if(table.length == 0)
            throw new InvalidOperationException(`The is no ${cT.name} table in From statement`); 
            

        let leftIndex = this._stack.indexOf(table[0]);

        table = this._stack.filter(s => s.Type == uT);

        if(table.length == 0)
            throw new InvalidOperationException(`The is no ${uT.name} table in From statement`);

        let rightIndex = this._stack.indexOf(table[0]);

        if(rightIndex - leftIndex != 1)
            throw new InvalidOperationException(`The On statement must follow the same order than From`);
        
        this._onStatements.push([cKey.toString(), uKey.toString()]);

        return this;
    }
   
    Where<C extends T1 | T2 | T3 | T4 | T5 | T6, K extends keyof C>(cT: new (...args: any[]) => C, statement: IStatement<C, K>): IJoiningQuery<T1, T2, T3, T4, T5, T6> {
        
        let set = this._context.Collection(cT);

        if(!set)
            throw new InvalidOperationException(`The type ${cT.name} is not mapped`);
        
        set.Where(statement);

        return this;

    }
    And<C extends T1 | T2 | T3 | T4 | T5 | T6, K extends keyof C>(cT: new (...args: any[]) => C, statement: IStatement<C, K>): IJoiningQuery<T1, T2, T3, T4, T5, T6> {
        let set = this._context.Collection(cT);

        if(!set)
            throw new InvalidOperationException(`The type ${cT.name} is not mapped`);
        
        set.And(statement);

        return this;
    }
    Or<C extends T1 | T2 | T3 | T4 | T5 | T6, K extends keyof C>(cT: new (...args: any[]) => C, statement: IStatement<C, K>): IJoiningQuery<T1, T2, T3, T4, T5, T6> {

        let set = this._context.Collection(cT);

        if(!set)
            throw new InvalidOperationException(`The type ${cT.name} is not mapped`);
        
        set.Or(statement);

        return this;
    }
    public async ToListAsync<C extends T1 | T2 | T3 | T4 | T5 | T6>(cT: new (...args: any[]) => C): Promise<C[]> {

        if(this._stack.length > this._onStatements.length + 1)
            throw new InvalidOperationException(`There is no enought On clausules to join all selected types`);

        if(this._stack.length < this._onStatements.length + 1)
            throw new InvalidOperationException(`There is more On clausules than join types selecteds`);

        let selectedSideSet = this._context.Collection(cT);

        let leftSideType = this._stack[0].Type as Function;

        let selectedTable = Type.GetTableName(cT);

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
                query += ` "${leftSideTable}".${Type.GetColumnName(leftSideType, leftSideField)} = "${rigthSideTable}".${Type.GetColumnName(rightSideType, leftSideField)} `

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
                   let leftColumnName =  relationMap.filter(s => s.Field == key)[0].Column;
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

                    if(elementType != rightSideDBType)
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

                    if(elementType != leftSideDBType)
                        throw new InvalidOperationException(`${leftSideType.name}.${leftSideField} and ${rightSideType.name}.${rightSideField} must be the same type to join`);

                        
                    query += ` "${leftSideTable}".${leftColumnName} = ANY("${rigthSideTable}".${rightColumnName})`;             
                }
            }

            leftSideType = this._stack[i].Type as Function;
        }
        

        PGSetHelper.InjectJoin(selectedSideSet! as PGDBSet<C>, query);
        
        return await selectedSideSet!.ToListAsync();        
        
    }

   
}



interface IUnion
{
    Type : unknown,
    Key?  : string
}
