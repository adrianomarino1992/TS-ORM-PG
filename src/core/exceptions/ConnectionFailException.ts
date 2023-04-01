import Exception from "./Exception";

export default class ConnectionFailException extends Exception
{
    constructor(message : string)
    {
        super(message);
    }
}