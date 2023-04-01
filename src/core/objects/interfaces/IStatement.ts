

export default interface IStatement<T>
{
    Field : keyof T, 
    Kind : Operation, 
    Value : any
}


export enum Operation
{
    EQUALS = '==', 
    NOTEQUALS = '!=',
    STARTWITH = '%_',
    ENDWITH = '_%',
    CONSTAINS = '%_%',
    GREATHER = '>',
    SMALLER = '<'
}