

export default interface IStatement<T, K extends keyof T>
{
    Field : K, 
    Kind? : Operation, 
    Value : T[K]
}


export enum Operation
{
    EQUALS = '==', 
    NOTEQUALS = '!=',
    STARTWITH = '%_',
    ENDWITH = '_%',
    CONSTAINS = '%_%',
    GREATHER = '>',
    GREATHEROREQUALS = '>=',
    SMALLER = '<',
    SMALLEROREQUALS = '<='
}