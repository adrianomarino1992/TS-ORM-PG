
import { Person } from './classes/TestEntity';
import { Operation } from 'myorm_core';
import {CompleteSeedAsync} from './functions/TestFunctions';
import { Message } from './classes/RelationEntity';


describe("Context", ()=>{    

    test("Testing join with right side is array and have relation with left", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "Id", Message, "To")       
                               .Where(Person, 
                                    {
                                        Field : "Name",
                                        Kind : Operation.CONSTAINS, 
                                        Value : "camila"
                                    })
                               .Select(Message).Load("To").ToListAsync();
        
        
        expect(msgs.length).toBe(2);
        expect(msgs.findIndex(s => s.To?.length == 3)).toBeGreaterThan(-1);
        expect(msgs.findIndex(s => s.To?.length == 1)).toBeGreaterThan(-1);          
        
    },5^100000);

    test("Testing the same with array using conventional query sintax", async()=>{

        let context = await CompleteSeedAsync();

        let camila = await context.Persons.Where({ Field : "Name", Value : "camila"}).FirstOrDefaultAsync();

        let msgs = await context.Messages.Where(
            {
                Field : "To", 
                Kind : Operation.CONSTAINS,
                Value : [camila!]
            }).Load("To").ToListAsync();

        expect(msgs.length).toBe(2);
        expect(msgs.findIndex(s => s.To?.length == 3)).toBeGreaterThan(-1);
        expect(msgs.findIndex(s => s.To?.length == 1)).toBeGreaterThan(-1);           
    },5^100000);

    test("Testing the same with conventional query sintax", async()=>{

        let context = await CompleteSeedAsync();

        let adriano = await context.Persons.Where({ Field : "Name", Value : "adriano"}).FirstOrDefaultAsync();

        let msgs = await context.Messages.Where(
            {
                Field : "From",
                Value : adriano!
            }).Load("From").ToListAsync();

        expect(msgs.length).toBe(3);
        expect(msgs[0].From?.Name).toBe("adriano");
        expect(msgs[1].From?.Name).toBe("adriano");
        expect(msgs[2].From?.Name).toBe("adriano");
        
    },5^100000);    
    
    test("Testing join with right side is array, but left side nort, and left side have relation with right", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "Id", Message, "To")       
                               .Where(Person, 
                                    {
                                        Field : "Name",
                                        Kind : Operation.CONSTAINS, 
                                        Value : "camila"
                                    }).Where(Message, 
                                        {
                                            Field : "Message",
                                            Kind : Operation.CONSTAINS, 
                                            Value : "private"
                                        })
                               .Select(Message).Load("To").ToListAsync();
     

        expect(msgs.length).toBe(1);       
        expect(msgs[0].To?.length).toBe(1);        
        expect(msgs[0].To?.[0].Name).toBe("camila");        
        
    },5^100000);

    test("Testing join with left side is array, but right side not, and left side have relation with right", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "MessagesReceived", Message, "Id")       
                               .Where(Person, 
                                    {
                                        Field : "Name",
                                        Kind : Operation.CONSTAINS, 
                                        Value : "camila"
                                    })
                               .Select(Message).Load("To").ToListAsync();

        expect(msgs.length).toBe(2);
        expect(msgs.findIndex(s => s.To?.length == 3)).toBeGreaterThan(-1);
        expect(msgs.findIndex(s => s.To?.length == 1)).toBeGreaterThan(-1);            
        
    },5^100000);

    test("Testing join left with right side with no relation", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "LinkTestValueInPerson", Message, "LinkTestValueInMessage")       
                               .Where(Person, 
                                    {
                                        Field : "Name",                                        
                                        Value : "adriano"
                                    })
                               .Select(Message)
                               .Load("From")
                               .Load("To")
                               .ToListAsync();

        expect(msgs.length).toBe(1);
        expect(msgs[0].From?.Name).toBe("adriano");       
        expect(msgs[0].To?.length).toBe(3);
               
        
    },5^100000);

    test("Testing join with left side is array, but right side not, and left side have no one relation with right", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "LinkTestArrayInPerson", Message, "LinkTestValueInMessage")       
                               .Where(Person, 
                                    {
                                        Field : "Name",                                        
                                        Value : "adriano"
                                    })
                               .Select(Message)
                               .Load("From")
                               .Load("To")
                               .ToListAsync();

        expect(msgs.length).toBe(2);
        expect(msgs[0].From?.Name).toBe("adriano");       
        expect(msgs[1].From?.Name).toBe("adriano");       
        expect(msgs.findIndex(s => s.To?.length == 3)).toBeGreaterThan(-1);
        expect(msgs.findIndex(s => s.To?.length == 1)).toBeGreaterThan(-1);    
               
        
    },5^100000);


    test("Testing join with left side is not array, but right side is, and left side have no one relation with right", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "LinkTestValueInPerson", Message, "LinkTestArrayInMessage")
                               .Select(Message)
                               .Load("From")
                               .Load("To")
                               .ToListAsync();

        expect(msgs.length).toBe(3);      
                       
    },100000);
    

    test("Testing order by desc", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgsFromAdriano = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "MessagesWriten", Message, "Id")
                               .Where(Person, {Field: 'Name', Value : "adriano"})
                               .Select(Message)
                               .OrderDescendingBy("Message")
                               .ToListAsync();

        expect(msgsFromAdriano.length).toBe(3);   
        expect(msgsFromAdriano[0].Message).toBe('Some private message from Adriano');  
        expect(msgsFromAdriano[1].Message).toBe('Some message from Adriano to nobody');  
        expect(msgsFromAdriano[2].Message).toBe('Some message from Adriano');  
                       
    },100000);


    test("Testing take", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgsFromAdriano = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "MessagesWriten", Message, "Id")
                               .Where(Person, {Field: 'Name', Value : "adriano"})
                               .Select(Message)
                               .OrderDescendingBy("Message")
                               .Take(1)
                               .ToListAsync();

        expect(msgsFromAdriano.length).toBe(1);   
        expect(msgsFromAdriano[0].Message).toBe('Some private message from Adriano');         
                       
    },100000);

    test("Testing limit", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgsFromAdriano = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "MessagesWriten", Message, "Id")
                               .Where(Person, {Field: 'Name', Value : "adriano"})
                               .Select(Message)
                               .OrderDescendingBy("Message")
                               .Limit(2)
                               .ToListAsync();

        expect(msgsFromAdriano.length).toBe(2);   
        expect(msgsFromAdriano[0].Message).toBe('Some private message from Adriano');  
        expect(msgsFromAdriano[1].Message).toBe('Some message from Adriano to nobody');         
                       
    },100000);


    test("Testing offset", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgsFromAdriano = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "MessagesWriten", Message, "Id")
                               .Where(Person, {Field: 'Name', Value : "adriano"})
                               .Select(Message)
                               .OrderDescendingBy("Message")
                               .Offset(1)
                               .ToListAsync();

        expect(msgsFromAdriano.length).toBe(2);   
        expect(msgsFromAdriano[0].Message).toBe('Some message from Adriano to nobody');  
        expect(msgsFromAdriano[1].Message).toBe('Some message from Adriano');          
                       
    },100000);


    test("Testing count", async ()=>{
       
        let context = await CompleteSeedAsync();

        let count = await context.From(Person)
                               .InnerJoin(Message)
                               .On(Person, "MessagesWriten", Message, "Id")
                               .Where(Person, {Field: 'Name', Value : "adriano"})
                               .Select(Message)
                               .OrderDescendingBy("Message")
                               .CountAsync()

        expect(count).toBe(3);               
                       
    },100000);
    
    
});