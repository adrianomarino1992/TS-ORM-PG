import Context from './classes/TestContext';
import PGConnection from "../src/implementations/PGDBConnection";
import PGDBManager from "../src/implementations/PGDBManager";
import { Person } from './classes/TestEntity';
import { Operation } from '../src/core/objects/interfaces/IStatement';
import Type from '../src/core/design/Type';
import { TryAsync ,CreateConnection } from './TestFunctions';
import { Message } from './classes/RelationEntity';


function CreateContext() : Context
{
    return new Context(new PGDBManager(CreateConnection()));
}


async function TruncateTablesAsync()
{
    let conn = CreateConnection();
    await conn.Open();
    await conn.ExecuteNonQuery(`truncate table ${Type.GetTableName(Person)}`);
    await conn.ExecuteNonQuery(`truncate table ${Type.GetTableName(Message)}`);
    await conn.Close();
}

beforeAll(async ()=> await TruncateTablesAsync());


describe("Add objects with relations", ()=>{

    test("Add Message", async()=>{
        
        await TryAsync(async () =>{

            var context = CreateContext();

            let msg = new Message("some message", new Person("Adriano", "adriano@test.com"));
    
            await context.Messages.AddAsync(msg);

            let msgfromDB = await context.Messages
            .Join('From')
            .Join('To')
            .Join('Writer')
            .FirstOrDefaultAsync();

            let person = await context.Persons.Where({
                Field : "Id", 
                Kind : Operation.EQUALS, 
                Value : msgfromDB!.From!.Id
            }).Join("Message").FirstOrDefaultAsync();
            

            expect(msgfromDB).not.toBe(undefined);
            expect(msgfromDB?.To).toBe(undefined);
            expect(msgfromDB?.From).not.toBe(undefined);
            expect(person).not.toBe(undefined);
            expect(person?.Message?.Id).toEqual(msgfromDB?.Id);
            expect(person?.Message?.Message).toEqual(msgfromDB?.Message);
            
            let metadata = Type.ExtractMetadata(msgfromDB);

            expect(metadata.length).toBe(1);

            await TruncateTablesAsync();

        }, err => 
        {
            throw err;
        });        
        
    }, 500000);


    // describe("Update objects with relations", ()=>{

    //     test("Update Message", async()=>{
            
    //         await TryAsync(async () =>{
    
    //             var context = CreateContext();
    
    //             let msg = new Message("some message", new Person("Adriano", "adriano@test.com"));
        
    //             await context.Messages.AddAsync(msg);
    
    //             let msgfromDB = await context.Messages
    //             .Join('From')
    //             .FirstOrDefaultAsync();
    
    //             expect(msgfromDB).not.toBe(undefined);
    //             expect(msgfromDB?.To).toBe(undefined);
                
    //             msgfromDB!.Message = "Changed";
    //             msgfromDB!.From = undefined;
    
    //             await context.Messages.UpdateAsync(msgfromDB!);
    
    //             msgfromDB = await context.Messages
    //             .Join('From')
    //             .FirstOrDefaultAsync();
                
    //             expect(msgfromDB).not.toBe(undefined);
    //             expect(msgfromDB!.Message).toBe("Changed");
    //             expect(msgfromDB?.To).toBe(undefined);
    //             expect(msgfromDB?.From).toBe(undefined);
    
    //             let metadata = Type.ExtractMetadata(msgfromDB);
    
    //             expect(metadata.length).toBe(2);

    //             await TruncateTablesAsync();
    
    //         }, err => 
    //         {
    //             throw err;
    //         });      
            
    //     });
        
    //     describe("Update a relational object", ()=>{

    //         test("App Person message relation", async()=>{
            
    //             await TryAsync(async () =>{
        
    //                 var context = CreateContext();
        
    //                 let msg = new Message("some message", new Person("Adriano", "adriano@test.com"));
            
    //                 await context.Messages.AddAsync(msg);
        
    //                 let msgfromDB = await context.Messages
    //                 .Join('From')
    //                 .FirstOrDefaultAsync();
                    
    //                 expect(msgfromDB).not.toBe(undefined);
    //                 expect(msgfromDB?.To).toBe(undefined);
    //                 expect(msgfromDB?.From).not.toBe(undefined);
        
    //                 let metadata = Type.ExtractMetadata(msgfromDB);
        
    //                 expect(metadata.length).toBe(2);
        
    //                 await TruncateTablesAsync();
        
    //             }, err => 
    //             {
    //                 throw err;
    //             });      
                
    //         });
    //     });
    // });
  
    
});

