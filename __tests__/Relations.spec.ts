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

    test("Add Message with persons", async()=>{
        
        await TryAsync(async () =>{

            var context = CreateContext();

            let msg = new Message("some message", 
                new Person("Adriano", "adriano@test.com"), 
                [
                    new Person("Camila", "camila@test.com"), 
                    new Person("Juliana", "juliana@test.com"), 
                    new Person("Andre", "andre@test.com")

                ]
                );
    
            await context.Messages.AddAsync(msg);

            let msgfromDB = await context.Messages
            .Join('From')
            .Join('To')            
            .FirstOrDefaultAsync();
           
            expect(msgfromDB).not.toBe(undefined);            
            expect(msgfromDB?.From).not.toBe(undefined);
            expect(msgfromDB?.From?.Name).toBe("Adriano");
            expect(msgfromDB?.To?.length).toBe(3);
            expect(msgfromDB!.To![0].Name).toBe("Camila");
            expect(msgfromDB!.To![1].Name).toBe("Juliana");
            expect(msgfromDB!.To![2].Name).toBe("Andre");


        }, err => 
        {
            throw err;
        });        
        
    }, 500000);


    
    describe("Update objects with relations", ()=>{

        test("Update Message", async()=>{
            
            await TryAsync(async () =>{
    
                var context = CreateContext();
    
                let msg = new Message("some message", new Person("Adriano", "adriano@test.com"));
        
                await context.Messages.AddAsync(msg);
    
                let msgfromDB = await context.Messages
                .Where({
                    Field : "Id", 
                    Kind: Operation.EQUALS, 
                    Value : msg.Id
                })
                .Join('From')
                .FirstOrDefaultAsync();
    
                expect(msgfromDB).not.toBe(undefined);
                expect(msgfromDB?.To).toBe(undefined);
                
                msgfromDB!.Message = "Changed";
                msgfromDB!.From = undefined;
    
                await context.Messages.UpdateAsync(msgfromDB!);
    
                msgfromDB = await context.Messages
                .Where({
                    Field : "Id", 
                    Kind: Operation.EQUALS, 
                    Value : msg.Id
                })
                .Join('From')
                .FirstOrDefaultAsync();
                
                expect(msgfromDB).not.toBe(undefined);
                expect(msgfromDB!.Message).toBe("Changed");
                expect(msgfromDB?.To).toBe(undefined);
                expect(msgfromDB?.From).toBe(undefined);
    
               

                await TruncateTablesAsync();
    
            }, err => 
            {
                throw err;
            });      
            
        });
        
        describe("Update a relational object", ()=>{

            test("App Person message relation", async()=>{
            
                await TryAsync(async () =>{
        
                    var context = CreateContext();
        
                    let msg = new Message("some message", new Person("Adriano", "adriano@test.com"));
            
                    await context.Messages.AddAsync(msg);
        
                    let msgfromDB = await context.Messages
                    .Join('From')
                    .FirstOrDefaultAsync();
                    
                    expect(msgfromDB).not.toBe(undefined);
                    expect(msgfromDB?.To).toBe(undefined);
                    expect(msgfromDB?.From).not.toBe(undefined);       
                    
        
                    await TruncateTablesAsync();
        
                }, err => 
                {
                    throw err;
                });      
                
            });
        });
    });
    
  
    
});

