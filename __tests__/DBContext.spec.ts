import Context from './classes/TestContext';
import PGConnection from "../src/implementations/PGDBConnection";
import PGDBManager from "../src/implementations/PGDBManager";
import { Person } from './classes/TestEntity';
import { Operation } from '../src/core/objects/interfaces/IStatement';
import TypeUtils from '../src/core/utils/TypeUtils';


async function TruncatePersonTableAsync()
{
    let conn = new PGConnection("localhost", 5434, "test_db", "supervisor", "sup");
    await conn.Open();
    await conn.ExecuteNonQuery(`truncate table ${TypeUtils.GetTableName(Person)}`);
    await conn.Close();
}

async function SeedAsync() : Promise<Context>
{
    let context = new Context(new PGDBManager(new PGConnection("localhost", 5434, "test_db", "supervisor", "sup")));

    await context.Persons.AddAsync(new Person("Adriano", "adriano@test.com"));
    await context.Persons.AddAsync(new Person("Camila", "camila@test.com"));
    await context.Persons.AddAsync(new Person("Juliana", "juliana@test.com"));
    await context.Persons.AddAsync(new Person("Andre", "andre@test.com"));

    return context;
}


describe("Context", ()=>{    

    
    test("Testing constructor", async ()=>{
       
        var manager = new PGDBManager(new PGConnection("localhost", 5434, "test_db", "supervisor", "sup"));

        let context = new Context(manager);

        expect(context).not.toBeNull();

        expect(context.Persons).not.toBeNull();
        
    });


    test("Testing access some collection", async ()=>{

        let context = new Context(new PGDBManager(new PGConnection("localhost", 5434, "test_db", "supervisor", "sup")));

        let collection = context.Collection(Person);

        let fail  = context.Collection(String);

        expect(collection).not.toBeNull();

        expect(collection).toBe(context.Persons);

        expect(fail).toBe(undefined);
        
    });


    test("Adding an entity in real database", async ()=>{
       
        let context = await SeedAsync();

        let adrianos = await context.Persons
                                    .Where(
                                        {
                                            Field : 'Name', 
                                            Kind: Operation.EQUALS, 
                                            Value : 'Adriano'
                                        })
                                    .ToListAsync();

        let all = await context.Persons.ToListAsync();
                                    
        expect(all.length).toBe(4);
        expect(adrianos.length).toBe(1);   
        expect(adrianos[0].Name).toBe("Adriano");
        expect(adrianos[0].Email).toBe("adriano@test.com");

        await TruncatePersonTableAsync();              

    });


    

    describe("Ordenation", ()=>{
        
        test("Testing order by asc", async ()=>{
       
            let context = await SeedAsync();
    
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

