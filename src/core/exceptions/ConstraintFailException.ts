import Exception from "./Exception";

export default class ConstraintFailExceptionException extends Exception
{
    constructor(message : string)
    {
        super(message);
    }
}