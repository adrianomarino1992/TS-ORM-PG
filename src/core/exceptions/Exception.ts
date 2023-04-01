export default class Exception extends Error
{
    public Message! : string

    constructor(message : string)
    {
        super(message);
        this.Message = message;
    }
}