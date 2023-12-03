import Exception from "./Exception";



export default class TypeNotMappedException extends Exception {
    constructor(message: string) {
        super(message);
    }
}
