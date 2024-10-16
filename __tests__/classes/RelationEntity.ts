import { Table, Column, PrimaryKey, DataType, ManyToOne, ManyToMany, DBTypes, OneToOne} from '../../src/Index';
import { Entity } from './Entity';
import { Person } from './TestEntity';

@Table("message_tb")
export class Message extends Entity
{

    @Column()
    public Message : string;

    @Column()
    @ManyToOne(()=> Person, "MessagesWriten")
    public From? : Person;


    @Column()
    @OneToOne(()=> Person, "Message")
    public User? : Person;

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
        super();
        this.Message = message;
        this.From = from;
        this.To = to;       
        this.LinkTestValueInMessage = -1;
        this.LinkTestArrayInMessage = [];        
    }
       

}