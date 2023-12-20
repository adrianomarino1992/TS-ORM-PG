
import { Person } from './classes/TestEntity';
import { Operation } from 'myorm_core';
import {TruncatePersonTableAsync, CreateContext, SeedAsync, CompleteSeedAsync, TruncateTablesAsync} from './functions/TestFunctions';
import TypeNotMappedException from '../src/core/exceptions/TypeNotMappedException';
import { Message } from './classes/RelationEntity';



beforeAll(async()=>{
    await TruncateTablesAsync();
})

describe("Context", ()=>{    

    
    test("Testing removing a item from array", async ()=>{
       
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
        .Where({
            Field : "Id", 
            Value : msg.Id
        })
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
        
        let p = msgfromDB!.To![0];

        let index = msgfromDB!.To!.indexOf(p);

        msgfromDB!.To!.splice(index, 1);

        await context.Messages.UpdateAsync(msgfromDB!);


        msgfromDB = await context.Messages
        .Where({
            Field : "Id", 
            Value : msg.Id
        })
        .Join('From')
        .Join('To')            
        .FirstOrDefaultAsync();


        expect(msgfromDB?.To?.length).toBe(2);

    },100000);

});