import { Table, Column, PrimaryKey, DataType, OneToMany, OneToOne, ManyToMany, DBTypes} from '../../src/Index';
import { Message } from './RelationEntity';

@Table("person_tb")
export class Person
{
    @PrimaryKey()
    @Column()
    @DataType(DBTypes.SERIAL)
    public Id : number = -1;

    @Column()
    public Name : string;

    @Column("email_address")
    public Email : string;

    @Column()    
    public Age : number; 
    

    @Column()
    @DataType(DBTypes.INTEGER)
    public CEP : number; 


    @Column()
    @DataType(DBTypes.TEXTARRAY)
    public PhoneNumbers : string[];

    @Column()
    @DataType(DBTypes.INTEGERARRAY)
    public Documents : number[];

    @Column()
    @DataType(DBTypes.DATE)
    public Birth : Date;


    @Column()
    @OneToMany(()=> Message, "From")
    public MessagesWriten? : Message[];

    @Column()
    @OneToMany(()=> Message, "To")
    public MessagesReceived? : Message[];

    
    @Column() 
    public LinkTestValueInPerson : number;

    @Column() 
    @DataType(DBTypes.INTEGERARRAY)
    public LinkTestArrayInPerson : number[];
  
    constructor(name : string = "", email : string = "", age : number = 1)
    {
        this.Name = name;
        this.Email = email;
        this.Age = age;
        this.CEP = -1;
        this.PhoneNumbers = [];
        this.Birth = new Date(1992,4,23);       
        this.Documents = []; 
        this.MessagesReceived = [];
        this.MessagesWriten = [];
        this.LinkTestValueInPerson = -1;
        this.LinkTestArrayInPerson = [];
       
    }
       

}