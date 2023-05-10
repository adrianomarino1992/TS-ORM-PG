
import { Person } from './classes/TestEntity';
import { Operation } from '../src/core/objects/interfaces/IStatement';
import {TruncatePersonTableAsync, CreateContext, SeedAsync} from './TestFunctions';
import { Message } from './classes/RelationEntity';



beforeAll(async()=>{
    await TruncatePersonTableAsync();
})

describe("Context", ()=>{    

    
    test("Testing constructor", async ()=>{
       
        let context = CreateContext();
        
        expect(context).not.toBeNull();

        expect(context.Persons).not.toBeNull();
        
    });


    test("Testing access some collection", async ()=>{

        let context = CreateContext();

        let collection = context.Collection(Person);

        let fail  = context.Collection(String);

        expect(collection).not.toBeNull();

        expect(collection).toBe(context.Persons);

        expect(fail).toBe(undefined);
        
    });
    

    describe("Query", ()=>{

        test("Selecting an entity in real database", async ()=>{
       
            let context = await SeedAsync();
    
            let adrianos = await context.Persons
                                        .Where(
                                            {
                                                Field : 'Name', 
                                                Kind: Operation.EQUALS, 
                                                Value : 'Adriano'
                                            }).Join("MessagesReceived")
                                        .ToListAsync();
    
            let all = await context.Persons.ToListAsync();
                                        
            expect(all.length).toBe(4);
            expect(adrianos.length).toBe(1);   
            expect(adrianos[0].Name).toBe("Adriano");
            expect(adrianos[0].Email).toBe("adriano@test.com");
            expect(adrianos[0].Birth).toEqual(new Date(1992,4,23));
            expect(adrianos[0].Documents).toEqual([123,4,5,678,9]);
            expect(adrianos[0].PhoneNumbers).toEqual(['+55(12)98206-8255']);
            
    
            await TruncatePersonTableAsync();              
    
        });

        

        describe("Quering array", ()=>{

            test("Selecting an entity in real database that documents contains 5", async ()=>{
           
                let context = await SeedAsync();
        
                let persons = await context.Persons
                                            .Where(
                                                {
                                                    Field : 'Documents', 
                                                    Kind: Operation.CONSTAINS, 
                                                    Value : [5]
                                                })
                                            .ToListAsync();               
                                            
                
                expect(persons.length).toBe(1);   
                expect(persons[0].Name).toBe("Adriano");
                expect(persons[0].Email).toBe("adriano@test.com");
                expect(persons[0].Birth).toEqual(new Date(1992,4,23));
                expect(persons[0].Documents).toEqual([123,4,5,678,9]);
                expect(persons[0].PhoneNumbers).toEqual(['+55(12)98206-8255']);
                
        
                await TruncatePersonTableAsync();              
        
            });
        });
    });

    

    describe("Ordenation", ()=>{
        
        test("Testing order by asc and desc", async ()=>{
       
            let context = await SeedAsync();
            context.Collection(Person);
            let all = await context.Persons.OrderBy('Name').ToListAsync();
                                        
            expect(all.length).toBe(4);
            expect(all[0].Name).toBe("Adriano");   
            expect(all[1].Name).toBe("Andre");   
            expect(all[2].Name).toBe("Camila");   
            expect(all[3].Name).toBe("Juliana");  
            
            all = await context.Persons.OrderDescendingBy('Name').ToListAsync();                                       
            
            
            expect(all.length).toBe(4);
            expect(all[3].Name).toBe("Adriano");   
            expect(all[2].Name).toBe("Andre");   
            expect(all[1].Name).toBe("Camila");   
            expect(all[0].Name).toBe("Juliana"); 
            
            await TruncatePersonTableAsync();
    
        });
        
    });
    
    
    describe("Update an entity", ()=>{

        test("Updating an entity in real database", async ()=>{
       
            let context = await SeedAsync();
    
            let adriano = await context.Persons
                                        .Where(
                                            {
                                                Field : 'Name', 
                                                Kind: Operation.EQUALS, 
                                                Value : 'Adriano'
                                            })
                                        .FirstOrDefaultAsync();
    
            expect(adriano).not.toBe(undefined);
    
            adriano!.CEP = 12312000;
            adriano!.Documents = [1, 2, 3, 4, 5, 6];
            adriano!.PhoneNumbers = ["(55)12 98206-8255"];

            await context.Persons.UpdateAsync(adriano!);
    
            adriano = await context.Persons
                                        .Where(
                                            {
                                                Field : 'Name', 
                                                Kind: Operation.EQUALS, 
                                                Value : 'Adriano'
                                            })
                                        .FirstOrDefaultAsync();

            
    
            expect(adriano).not.toBe(undefined);
            expect(adriano!.CEP).toBe(12312000);
            expect(adriano!.Documents).toEqual([1, 2, 3, 4, 5, 6]);
            expect(adriano!.PhoneNumbers).toEqual(["(55)12 98206-8255"]);

            await TruncatePersonTableAsync();              
    
        });
    });

    describe("Delete an entity", ()=>{

        test("Deleting an entity in real database", async ()=>{
       
            let context = await SeedAsync();
    
            let adriano = await context.Persons
                                        .Where(
                                            {
                                                Field : 'Name', 
                                                Kind: Operation.EQUALS, 
                                                Value : 'Adriano'
                                            })
                                        .FirstOrDefaultAsync();
    
            expect(adriano).not.toBe(undefined);   
            
            await context.Persons.DeleteAsync(adriano!);
    
            adriano = await context.Persons
                                        .Where(
                                            {
                                                Field : 'Name', 
                                                Kind: Operation.EQUALS, 
                                                Value : 'Adriano'
                                            })
                                        .FirstOrDefaultAsync();
    
            expect(adriano).toBe(undefined);           
            
            await TruncatePersonTableAsync();              
    
        });
    });

});


