
import { Person } from './classes/TestEntity';
import { Operation } from 'myorm_core';
import {TruncatePersonTableAsync, CreateContext, SeedAsync} from './functions/TestFunctions';
import Type from '../src/core/design/Type';



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
                                     .LoadRelationOn("MessagesReceived")
                                     .ToListAsync();

        let adrianos = await context.Persons.Where(
                                        {
                                            Field : 'Name',
                                            Kind : Operation.CONSTAINS,
                                            Value : 'Adriano'
                                        }).Load("MessagesReceived")
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
    
        describe("Free string query", ()=>{

            test("Selecting entities using a free string query", async ()=>{
           
                let context = await CreateContext();
        
                await context.Persons.AddAsync(new Person("Adriano1", "balera@test.com", 30));
                await context.Persons.AddAsync(new Person("Adriano2", "balera@test.com", 12));
                await context.Persons.AddAsync(new Person("Adriano3", "balera@test.com", 56));
                await context.Persons.AddAsync(new Person("Adriano4", "balera@test.com", 32));
                await context.Persons.AddAsync(new Person("Adriano5", "balera@test.com", 11));
                await context.Persons.AddAsync(new Person("Adriano6", "marino@test.com", 45));
                await context.Persons.AddAsync(new Person("Adriano7", "marino@test.com", 40));
        
                let ageColumn = Type.GetColumnName(Person, "Age");

                let adrianos = await context.Persons.WhereAsString(`${ageColumn} > 30`).ToListAsync();
        
               expect(adrianos.length).toBe(4);
               
               for(let a of adrianos)
               {
                    expect(a.Age).toBeGreaterThan(30);
               }
        
                await TruncatePersonTableAsync();              
        
            });


            describe("Testing queries with arrays", ()=>{

                test("Selecting itens inside array", async ()=>{
               
                    let context = await CreateContext();
            
                    let p1 = new Person("Adriano marino", "balera@test.com", 30);
                    let p2 = new Person("Adriano balera", "balera@test.com", 30);
                    let p3 = new Person("Camila Pereira ", "balera@test.com", 30);
                    let p4 = new Person("Camila Sales", "balera@test.com", 30);
                    let p5 = new Person("Sales Marino", "balera@test.com", 30);

                    p1.Documents = [1, 3, 5, 7, 8, 9, 10];
                    p2.Documents = [54, 66, 43,21,7];
                    p3.Documents = [1, 1, 2, 77, 8, 9, 10];
                    p4.Documents = [1, 22, 5, 79, 8, 96, 1011];
                    p5.Documents = [111, 23, 35, 47, 86, 94, 10];      
                    
                    p1.MessagesReceived = undefined;

                    await context.Persons.AddAsync(p1);
                    await context.Persons.AddAsync(p2);
                    await context.Persons.AddAsync(p3);
                    await context.Persons.AddAsync(p4);
                    await context.Persons.AddAsync(p5);
                
                   let persons = await context.Persons.WhereField("Documents").Constains([7]).ToListAsync();  
                                      

                   expect(persons.length).toBe(2);
                   
                   for(let a of persons)
                   {
                        expect(a.Documents).toContain(7);
                   }

                   persons = await context.Persons.WhereField("Name").Constains("marino").ToListAsync();                   

                   expect(persons.length).toBe(2);
                   
                   for(let a of persons)
                   {
                        expect(a.Name.toLowerCase()).toContain("");
                   }

                   persons = await context.Persons.WhereField("MessagesReceived").IsNull().ToListAsync();                   

                   expect(persons.length).toBe(1);
                   expect(persons[0].Id).toBe(p1.Id);
            
            
                    await TruncatePersonTableAsync();              
            
                });
               
            });   
           
        });   
    
    
       
    });   

    
});