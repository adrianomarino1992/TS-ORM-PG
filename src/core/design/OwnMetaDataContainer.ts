export default class OwnMetaDataContainer
{
    private  static _metadas : IMetaData[] = [];

    public static Get(target : any, key : string, member? : string) : IMetaData | undefined
    {
        let meta =  this._metadas.filter(s => s.Key == key && OwnMetaDataContainer.TryFindCtor(s.CTor, target) && (s.Member == member || (s.Member == undefined && member == undefined)));  
        
        if(meta && meta.length > 0)
            return meta[0];

        return undefined;
    }

    public static Set(target : Function, key : string, member? : string, value? : any) : void
    {
        let meta = this.Get(target, key, member);

        if(meta)
        {
            meta.Value = value;
        } 
        else
        {
            this._metadas.push(
                {
                    CTor : target, 
                    Key : key, 
                    Member : member, 
                    Value : value
                });
        }
    }

    private static TryFindCtor(cTor : Function, target : any) : boolean
    {
        let sameType = cTor == target || cTor == target.constructor;
        let sameProto = (target.prototype && target.prototype.constructor == cTor);
        let sameAssign = (target.prototype && target.prototype.constructor.toString() == cTor.toString());
        let found = sameType || sameProto || sameAssign;

        if(found)
            return true;

        let current = typeof target == typeof Function ? target.prototype : target;

        while(current)
        {
            if(cTor == current || (current.constructor && current.constructor == cTor))
            {
                return true;
            }
            current = current.__proto__;
        }        

        return false
    }

    
}

export interface IMetaData
{
    CTor : Function;
    Member? : string;
    Key : string;
    Value? : any
}

