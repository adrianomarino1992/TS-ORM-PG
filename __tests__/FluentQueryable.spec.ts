
import { Person } from './classes/TestEntity';
import { Operation } from '../src/core/objects/interfaces/IStatement';
import {TruncatePersonTableAsync, CreateContext, SeedAsync} from './TestFunctions';



beforeAll(async()=>{
    await TruncatePersonTableAsync();
})

describe("Query", ()=>{

    test("Selecting an entity in real database", async ()=>{
   
        let context = await SeedAsync();

        await context.Persons.AddAsync(new Person("Adriano Balera", "balera@test.com", 30));
        await context.Persons.AddAsync(new Person("Adriano Marino", "marino@test.com", 31));

        let fAdrianos = await context.Persons
                                     .WhereField("Name")
                                     .Constains("Adriano")
                                     .AndLoadAll("MessagesReceived")
                                     .ToListAsync();

        let adrianos = await context.Persons.Where(
                                        {
                                            Field : 'Name',
                                            Kind : Operation.CONSTAINS,
                                            Value : 'Adriano'
                                        }).Join("MessagesReceived")
                                    .ToListAsync();

        expect(adrianos.length).toBe(3);
        expect(fAdrianos.length).toBe(3);

        for(let i = 0; i < adrianos.length; i++)
        {
            expect(adrianos[i].Name == fAdrianos[i].Name);
            expect(adrianos[i].Age == fAdrianos[i].Age);
            expect(adrianos[i].Email == fAdrianos[i].Email);            
        }

        let array = adrianos;        
        expect(array[0].Name).toBe("Adriano");
        expect(array[0].Email).toBe("adriano@test.com");
        expect(array[0].Birth).toEqual(new Date(1992,4,23));
        expect(array[0].Documents).toEqual([123,4,5,678,9]);
        expect(array[0].PhoneNumbers).toEqual(['+55(12)98206-8255']);

        array = fAdrianos;       
        expect(array[0].Name).toBe("Adriano");
        expect(array[0].Email).toBe("adriano@test.com");
        expect(array[0].Birth).toEqual(new Date(1992,4,23));
        expect(array[0].Documents).toEqual([123,4,5,678,9]);
        expect(array[0].PhoneNumbers).toEqual(['+55(12)98206-8255']);       

        await TruncatePersonTableAsync();              

    });


    describe("Query with range operator", ()=>{

        test("Selecting entities using range of values", async ()=>{
       
            let context = await CreateContext();
    
            await context.Persons.AddAsync(new Person("Adriano1", "balera@test.com", 30));
            await context.Persons.AddAsync(new Person("Adriano2", "balera@test.com", 12));
            await context.Persons.AddAsync(new Person("Adriano3", "balera@test.com", 56));
            await context.Persons.AddAsync(new Person("Adriano4", "balera@test.com", 32));
            await context.Persons.AddAsync(new Person("Adriano5", "balera@test.com", 11));
            await context.Persons.AddAsync(new Person("Adriano6", "marino@test.com", 45));
            await context.Persons.AddAsync(new Person("Adriano7", "marino@test.com", 40));
    
            let fAdrianos = await context.Persons
                                         .WhereField("Age")
                                         .IsInsideIn([1,30, 12, 40, 120])                                         
                                         .ToListAsync();
    
            let adrianos = await context.Persons
                                        .Where({Field : 'Age', Value : 1})
                                        .Or({Field : 'Age', Value : 30})
                                        .Or({Field : "Age" , Value : 12})
                                        .Or({Field : "Age" , Value : 40})
                                        .Or({Field : "Age" , Value : 120})
                                        .ToListAsync();
    
            expect(adrianos.length).toBe(3);
            expect(fAdrianos.length).toBe(3);
    
            for(let i = 0; i < adrianos.length; i++)
            {
                expect(adrianos[i].Name == fAdrianos[i].Name);
                expect(adrianos[i].Age == fAdrianos[i].Age);
                expect(adrianos[i].Email == fAdrianos[i].Email);            
            }
    
            await TruncatePersonTableAsync();              
    
        });
    
        
    
       
    });   

    
});