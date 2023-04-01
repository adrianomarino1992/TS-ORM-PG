import SchemasDecorators from '../../src/core/decorators/SchemasDecorators'
import { DBTypes } from '../../src/core/enums/DBTypes';

@SchemasDecorators.Table("person_tb")
export class Person
{
    @SchemasDecorators.PrimaryKey()
    @SchemasDecorators.Column()
    @SchemasDecorators.DataType(DBTypes.SERIAL)
    public Id : number = -1;

    @SchemasDecorators.Column()
    public Name : string;

    @SchemasDecorators.Column("email_address")
    public Email : string;

    @SchemasDecorators.Column()    
    public Age : number; 
    

    @SchemasDecorators.Column()
    @SchemasDecorators.DataType(DBTypes.INTEGER)
    public CEP : number; 

    constructor(name : string = "", email : string = "", age : number = 1)
    {
        this.Name = name;
        this.Email = email;
        this.Age = age;
        this.CEP = -1;        
    }
       

}