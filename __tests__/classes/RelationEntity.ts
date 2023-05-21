import { Table, Column, PrimaryKey, DataType, ManyToOne, ManyToMany, DBTypes} from '../../src/Index';
import { Person } from './TestEntity';

@Table("message_tb")
export class Message
{
    @PrimaryKey()
    @Column()
    @DataType(DBTypes.SERIAL)
    public Id : number = -1;

    @Column()
    public Message : string;

    @Column()
    @ManyToOne(()=> Person, "MessagesWriten")
    public From? : Person;

    @Column()  
    @ManyToMany(()=> Person, "MessagesReceived")  
    public To? : Person[];     


    @Column() 
    public LinkTestValueInMessage? : number;

    @Column() 
    @DataType(DBTypes.INTEGERARRAY)
    public LinkTestArrayInMessage? : number[];


    constructor(message : string, from? : Person, to? : Person[])
    {
        this.Message = message;
        this.From = from;
        this.To = to;       
        this.LinkTestValueInMessage = -1;
        this.LinkTestArrayInMessage = [];
    }
       

}