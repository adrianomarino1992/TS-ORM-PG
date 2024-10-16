export default class OwnMetaDataContainer
{
    private  static _metadas : IMetaData[] = [];

    public static Get(target : any, key : string, member? : string) : IMetaData | undefined
    {
        let meta =  this._metadas.filter(s => s.Key == key && (s.CTor == target || s.CTor == target.constructor) && (s.Member == member || (s.Member == undefined && member == undefined)));  
        
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

    
}

export interface IMetaData
{
    CTor : Function;
    Member? : string;
    Key : string;
    Value? : any
}

