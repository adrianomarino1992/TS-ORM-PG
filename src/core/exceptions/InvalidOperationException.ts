import Exception from "./Exception";

export default class InvalidOperationException extends Exception
{
    public Message! : string

    constructor(message : string)
    {
        super(message);
        this.Message = message;
    }
}