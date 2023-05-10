import IDBSet from './IDBSet';
import IStatement from './IStatement';
export default interface IDBContext
{
    Collection<T extends Object>(cTor : {new (...args : any[]) : T}) : IDBSet<T> | undefined;
    UpdateDatabaseAsync() : Promise<void>;
    ExecuteNonQuery(query : string) : Promise<void>;
    ExecuteQuery(query : string) : Promise<any>;        
}

export interface IThreeQueryableObject
{
    From<T1 extends Object, T2 extends Object>
        (cT1 : {new (...args : any[]) : T1}, cT2 :{new (...args : any[]) : T2}) : IJoiningQuery<T1, T2, unknown, unknown, unknown, unknown>;
    From<T1 extends Object, T2 extends Object, T3 extends Object>
        (cT1 : {new (...args : any[]) : T1}, cT2 :{new (...args : any[]) : T2}, cT3 :{new (...args : any[]) : T3}) : IJoiningQuery<T1, T2, T3, unknown, unknown, unknown>;
    From<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object>
        (cT1 : {new (...args : any[]) : T1}, cT2 :{new (...args : any[]) : T2}, cT3 :{new (...args : any[]) : T3}, cT4 :{new (...args : any[]) : T4}) : IJoiningQuery<T1, T2, T3, T4, unknown, unknown>;
    From<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object>
        (cT1 : {new (...args : any[]) : T1}, cT2 :{new (...args : any[]) : T2}, cT3 :{new (...args : any[]) : T3}, cT4 :{new (...args : any[]) : T4}, cT5 :{new (...args : any[]) : T5}) : IJoiningQuery<T1, T2, T3, T4, T5, unknown>;    
    From<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object,T6 extends Object>
        (cT1 : {new (...args : any[]) : T1}, cT2 :{new (...args : any[]) : T2}, cT3 :{new (...args : any[]) : T3}, cT4 :{new (...args : any[]) : T4}, cT5 :{new (...args : any[]) : T5}, cT6 :{new (...args : any[]) : T6}) : IJoiningQuery<T1, T2, T3, T4, T5, T6>;    
    
} 

export interface IJoiningQuery<T1 extends Object, T2 extends Object, T3 extends Object | unknown, T4 extends Object | unknown, T5 extends Object | unknown, T6 extends Object | unknown>
{
    On<C extends T1 | T2 | T3 | T4 | T5 | T6, U extends T1 | T2 | T3 | T4 | T5 | T6>
    (cT : {new (...args : any[]) : C}, cKey : keyof C, uT : {new (...args : any[]) : U}, uKey : keyof U) : IJoiningQuery<T1, T2, T3, T4, T5, T6>;
    Where<C extends T1 | T2 | T3 | T4 | T5 | T6, K extends keyof C>(cT : {new (...args : any[]) : C}, statement : IStatement<C, K>) :  IJoiningQuery<T1, T2, T3, T4, T5, T6>;
    And<C extends T1 | T2 | T3 | T4 | T5 | T6, K extends keyof C>(cT : {new (...args : any[]) : C}, statement : IStatement<C, K>) :  IJoiningQuery<T1, T2, T3, T4, T5, T6>;
    Or<C extends T1 | T2 | T3 | T4 | T5 | T6, K extends keyof C>(cT : {new (...args : any[]) : C}, statement : IStatement<C, K>) :  IJoiningQuery<T1, T2, T3, T4, T5, T6>;   
    ToListAsync<C extends T1 | T2 | T3 | T4 | T5 | T6>(cT : {new (...args : any[]) : C}) : Promise<C[]>;
}

