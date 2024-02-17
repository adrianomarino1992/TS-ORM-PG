import { InvalidOperationException } from "../src/Index";
import { Message } from "./classes/RelationEntity";
import { CompleteSeedAsync, TruncatePersonTableAsync } from "./functions/TestFunctions";


beforeAll(async()=>{
    await TruncatePersonTableAsync();
})
describe("Tpe utils functions", ()=>{

    

    test("Should load all TO persons in all messages", async()=>{
        
        let context = await CompleteSeedAsync();

        let messagesWithToPersons = await context.Messages.Load("To").ToListAsync();
        
        let messages = await context.Messages.ToListAsync();

        expect(messages.filter(s => s.To == undefined).length).toBe(messages.length);

        await context.Messages.ReloadCachedRealitionsAsync(messages, ["To"]);

        
        for(let m of messages)
        {
            let mWithToPersons = messagesWithToPersons.filter(s => s.Id == m.Id)[0];

            if(mWithToPersons.To == undefined)
                continue;

            expect(m.To).not.toBeUndefined();

            expect(m.To!.filter(s => mWithToPersons.To!.filter(u => u.Id == s.Id).length > 0).length).toBe(m.To!.length);
        }
        
    });


    test("Should load all TO persons in one message", async()=>{
        
        let context = await CompleteSeedAsync();

        let messagesWithToPersons = await context.Messages.Load("To").ToListAsync();
        
        let messageWithPerson = messagesWithToPersons.filter(s => s.To && s.To!.length > 1)[0];

        let message = (await context.Messages.WhereField("Id").IsEqualTo(messageWithPerson.Id).FirstOrDefaultAsync())!;       

        
        await context.Messages.ReloadCachedRealitionsAsync(message, ["To"]);

        expect(message.To).not.toBeUndefined();

        expect(message.To!.length).toBe(messageWithPerson.To!.length);

        expect(message.To?.filter(s => messageWithPerson.To!.filter(u => u.Id == s.Id).length > 0).length).toBe(messageWithPerson.To!.length);
        
        
    });
    
    test("Should throw a InvalidOperationException", async()=>{
        
        let context = await CompleteSeedAsync();        
        
        let message =  new Message("Test Message");        

        try{
            await context.Messages.ReloadCachedRealitionsAsync(message, ["To"]);

        }catch(e)
        {
            expect(e instanceof InvalidOperationException).toBeTruthy();
        }

        
    });



});