import Exception from "./Exception";

export default class TypeNotSuportedException extends Exception
{
    constructor(message : string)
    {
        super(message);
    }
}


