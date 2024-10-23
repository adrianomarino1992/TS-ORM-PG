import Exception from "./Exception";



export default class ColumnNotExistsException extends Exception {
        constructor(message: string) {
        super(message);        
    }
}
