import Exception from "./Exception";

export default class ConstraintFailException extends Exception
{
    constructor(message : string)
    {
        super(message);
    }
}