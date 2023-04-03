# TS_ORM_PG

ts_orm_pg is a ORM writen with TypeScript with sintax similar with MyORMForPostgreSQL of .NET

## Installation



```bash
npm install ts_orm_pg
```


## Usage
First of all we need create all entities we will need mapped. To do that we can use the decorators that the __TS_ORM_PG__ provides.
After that we need create a class "Context" that will extends the abstract class __PGDBContext__.  
After that, we need to create all PGDBSets<T> that will need to work with ours mapped types.
Finally, in the application start, we need call the method __PGDBContext.UpdateDatabaseAsync()__. 

### ./entities/Person.ts

```typescript

import {Table, Column, PrimaryKey, DataType, DBTypes} from 'ts_orm_pg';

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
    
    
    constructor(name : string, email : string, age : number)
    {
        this.Name = name;
        this.Email = email;
        this.Age = age;       
    }
       

}
```

### Context.ts

```typescript
import {PGDBSet, PGDBContext, PGDBManager} from "ts_orm_pg";
import { Person } from './entities/Person.ts';


export default class Context extends PGDBContext
{
    public Persons : PGDBSet<Person>;

    constructor(manager : PGDBManager)
    {
        super(manager);  
        this.Persons = new PGDBSet(Person, manager);      
    }
}
```

### Index.ts

```typescript
import Context from './Context.ts';
import { Person } from './entities/Person.ts';

var conn = new 
var context = new Context() 

```

## Dependecy injection service
Consider this abstraction of a service and some imnplementations

### ./services/SampleService.ts

```typescript
export abstract class SampleServiceAbstract
{
    abstract DoSomething() : void;
}

export class SampleService extends SampleServiceAbstract
{
    public DoSomething(): void {
        console.log("Doing in SampleServices");
    }
}

export class AnotherService extends SampleServiceAbstract
{
    public DoSomething(): void {
        console.log("Doing another job in AnotherService");
    }
}
```

We can use the DI service like this

### ./controllers/SampleController.ts

```typescript

import { ControllerBase, HTTPVerbs as verbs, Use, Verb, Route, Action } from "web_api_base";
import {SampleServiceAbstract } from '../services/SampleService.ts';

@Route("/sample")
export default class SampleController extends ControllerBase
{   
    @Inject() // say to DI that this property will be inject on the instance
    public SomeDepency : SampleServiceAbstract;

    constructor(someDependecy : SampleServiceAbstract)
    {
        super();
        this.SomeDepency = someDependecy ;        
    }

    @Verb(verbs.GET)    
    @Action("/hello")
    public Hello() : void
    {
        this.OK({message: "Hello Word!"})
    }
    
}
```

And we can register our dependecies in Application ConfigureAsync method

### App.ts

```typescript 

import { Application, IApplicationConfiguration, DependecyService, } from "web_api_base";

import { SampleService, SampleServiceAbstract } from './service/SampleService';


export default class App extends Application
{
    constructor()
    {
        super();
    }
    
    public override async ConfigureAsync(appConfig: IApplicationConfiguration): Promise<void>
    {
        this.UseCors();

        // everytime some class need a SampleServiceAbstract it will get a intance of SampleService
        DependecyService.RegisterFor(SampleServiceAbstract, SampleService);     

        this.UseControllers();

    }  
}

```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)