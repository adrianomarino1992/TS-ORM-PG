import { IFluentField } from "../interfaces/IDBSet";
import AbstractSet from "./AbastractSet";

export default abstract class AbstractFluentField<T extends object, K extends keyof T, P extends AbstractSet<T>> implements IFluentField<T, K, P>
{
    abstract IsGreaterThan(value: T[K]): P ;
    abstract IsEqualTo(value: T[K]): P ;
    abstract IsNotEqualTo(value: T[K]): P ;
    abstract IsSmallerThan(value: T[K]): P ;
    abstract IsInsideIn(value: T[K][]): P ;
    abstract Constains(value: T[K]): P ;
    abstract StartsWith(value: T[K]): P ;
    abstract EndsWith(value: T[K]): P ;
    abstract IsNull(): P ;
    
}