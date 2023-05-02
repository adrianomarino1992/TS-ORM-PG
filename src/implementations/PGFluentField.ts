import { IFluentField } from "../core/objects/interfaces/IDBSet";
import {Operation} from "../core/objects/interfaces/IStatement";
import PGDBSet from "./PGDBSet";


export default class PGFluentField<T extends object, K extends keyof T, P extends PGDBSet<T>> implements IFluentField<T, K, P>
{
    private _pgSet : P;
    private _field : keyof T;

    constructor(pgSet : P, field : keyof T)
    {
        this._pgSet = pgSet;
        this._field = field;
    }

    IsGreaterThan(value: T[K]): P {

        this._pgSet.Where({
            Field : this._field,
            Kind : Operation.GREATHER, 
            Value : value 
        });

        return this._pgSet;
    }
    IsEqualTo(value: T[K]): P  {

        this._pgSet.Where({
            Field : this._field,            
            Value : value
        });

        return this._pgSet;
    }

    IsNotEqualTo(value: T[K]): P {

        this._pgSet.Where({
            Field : this._field, 
            Kind : Operation.NOTEQUALS,           
            Value : value 
        });

        return this._pgSet;
    }

    IsSmallerThan(value: T[K]): P  {
        this._pgSet.Where({
            Field : this._field,
            Kind : Operation.SMALLER, 
            Value : value 
        });

        return this._pgSet;
    }
    IsInsideIn(value: T[K][]): P  {

       for(let i = 0; i < value.length; i++)
       {
            if(i == 0)
            {
                this._pgSet.Where({
                    Field : this._field,                 
                    Value : value[i]
                });
            }
            else 
            {
                this._pgSet.Or({
                    Field : this._field,                 
                    Value : value[i]
                });
            }            
        }

        return this._pgSet;
    }
    Constains(value: T[K]): P  {

        this._pgSet.Where({
            Field : this._field,  
            Kind : Operation.CONSTAINS,               
            Value : value
        });     

        return this._pgSet;
    }
    
}