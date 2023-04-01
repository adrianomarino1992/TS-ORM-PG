import Exception from "./Exception";

export default class NotImpletedException extends Exception
{
    constructor(message : string)
    {
        super(message);
    }
}