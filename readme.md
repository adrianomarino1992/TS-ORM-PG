# myorm_pg

myorm_pg is a ORM writen with TypeScript with sintax similar with MyORMForPostgreSQL of .NET

## Installation



```bash
npm install myorm_pg
```


## Usage
This ORM is based on https://www.nuget.org/packages/Adr.MyORMForPostgreSQL for .NET. The usage is similar.

### ./entities/Person.ts

```typescript
import { Table, Column, PrimaryKey, DataType, OneToMany, OneToOne, ManyToMany, DBTypes} from 'myorm_pg';
import { Message } from './Message';

@Table("person_tb")
export class Person
{
    @PrimaryKey()
    @Column()
    @DataType(DBTypes.SERIAL)
    public Id : number;

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

  
    constructor(name : string = "", email : string = "", age : number = 1)
    {
        this.Id = -1;
        this.Name = name;
        this.Email = email;
        this.Age = age;
        this.CEP = -1;
        this.PhoneNumbers = [];
        this.Birth = new Date(1992,4,23);       
        this.Documents = []; 
        this.MessagesReceived = [];
        this.MessagesWriten = [];
       
    }
       

}
```

### ./entities/Message.ts

```typescript
import { Table, Column, PrimaryKey, DataType, ManyToOne, ManyToMany, DBTypes} from 'myorm_pg';
import { Person } from './Person';

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


    constructor(message : string, from? : Person, to? : Person[])
    {
        this.Message = message;
        this.From = from;
        this.To = to;       
    }
       

}
```

### Context.ts

```typescript
import { PGDBManager, PGDBContext, PGDBSet} from 'myorm_pg';
import { Message } from './entities/Message';
import { Person } from './entities/Person';


export default class Context extends PGDBContext
{
    public Persons : PGDBSet<Person>;
    public Messages : PGDBSet<Message>;

    constructor(manager : PGDBManager)
    {
        super(manager);  
        this.Persons = new PGDBSet(Person, this);      
        this.Messages = new PGDBSet(Message, this);      
    }
}
```

### Create a instance of context and update or creare database

```typescript

var context = new Context(PGDBManager.Build("localhost", 5434, "test_db", "supervisor", "sup"));

await context.UpdateDatabaseAsync();


```

### Insert entities

```typescript

let person = new Person();
person.Name = "Adriano";
person.Email = "adriano@test.com";
person.Birth = new Date(1992,4,23);
person.Documents = [123,4,5,678,9];
person.PhoneNumbers = ['+55(12)98206-8255'];

await context.Persons.AddAsync(adriano);

```


### Insert entities with relation
In this case, all persons will be saved automatically. All persons of __Message.To__ property will have a reference to this message on property 
__Person.MessagesReceived__ and the person of __Message.From__ will have a reference to this message on __Person.MessagesWriten__ property

```typescript
let msg = new Message(
               "some message to my friends", 
                new Person("Adriano", "adriano@test.com"), 
                [
                    new Person("Camila", "camila@test.com"), 
                    new Person("Juliana", "juliana@test.com"), 
                    new Person("Andre", "andre@test.com")

                ]
                );

await context.Messages.AddAsync(msg);

```


### Quering entities

```typescript

let persons = await context.Persons
                                     .Where(
                                           {
                                                Field : 'Name',                                                 
                                                Value : 'Adriano'
                                            })
                                        .ToListAsync();

```


### Join

```typescript

let persons = await context.Persons
                                     .Where(
                                           {
                                                Field : 'Name',                                                 
                                                Value : 'Adriano'
                                            })
                                        .Join("MessagesReceived")
                                        .ToListAsync();

```
This query will retrieve from database all persons with name "Adriano" and load all mensagens that this persons are in "To" list.


### Order by

```typescript
let all = await context.Persons
                              .OrderBy('Name')
                              .ToListAsync();
```

### Order by descending

```typescript
let all = await context.Persons
                              .OrderByDescending('Name')
                              .ToListAsync();
```


### Limit

```typescript
let all = await context.Persons
                              .OrderBy('Name')
                              .Limit(10)
                              .ToListAsync();
```

### Get first or default 

```typescript
let person : Person | undefined = await context.Persons
                              .Where(
                                     {
                                        Field : 'Name',                                                 
                                        Value : 'Adriano'
                                     })
                              .FirstOrDefaultAsync();
```


### Update person

```typescript
let person : Person | undefined = await context.Persons
                              .Where(
                                     {
                                        Field : 'Name',                                                 
                                        Value : 'Adriano'
                                     })
   
                           .FirstOrDefaultAsync();

if(person)
{
     person.Name = "Adriano Marino";

     await context.Persons.UpdateAsync(person);
}
```




### Delete

```typescript
let person : Person | undefined = await context.Persons
                              .Where(
                                     {
                                        Field : 'Name',                                                 
                                        Value : 'Adriano'
                                     })
   
                           .FirstOrDefaultAsync();

if(person)
{
     await context.Persons.DeleteAsync(person);
}
```
## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)