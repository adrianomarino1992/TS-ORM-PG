import Exception from "./Exception";

export default class QueryFailException extends Exception
{
    public Query! : string;

    constructor(message : string, query : string)
    {
        super(message);
        this.Query = query;
    }
}


