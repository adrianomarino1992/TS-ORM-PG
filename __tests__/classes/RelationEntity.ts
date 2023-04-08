import SchemasDecorators from '../../src/core/decorators/SchemasDecorators'
import { DBTypes } from '../../src/core/enums/DBTypes';
import { Person } from './TestEntity';

@SchemasDecorators.Table("message_tb")
export class Message
{
    @SchemasDecorators.PrimaryKey()
    @SchemasDecorators.Column()
    @SchemasDecorators.DataType(DBTypes.SERIAL)
    public Id : number = -1;

    @SchemasDecorators.Column()
    public Message : string;

    @SchemasDecorators.Column()
    @SchemasDecorators.RelationWith(()=> Person)
    public From? : Person;

    @SchemasDecorators.Column()  
    @SchemasDecorators.RelationWith(()=> Person)  
    public To? : Person; 
    
    
    constructor(message : string, from? : Person, to? : Person)
    {
        this.Message = message;
        this.From = from;
        this.To = to;
    }
       

}