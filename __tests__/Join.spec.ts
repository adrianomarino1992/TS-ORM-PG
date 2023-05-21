
import { Person } from './classes/TestEntity';
import { Operation } from '../src/core/objects/interfaces/IStatement';
import {CompleteSeedAsync} from './TestFunctions';
import { Message } from './classes/RelationEntity';






describe("Context", ()=>{    

    // test("Testing join with right side is array and have relation with left", async ()=>{
       
    //     let context = await CompleteSeedAsync();

    //     let msgs = await context.Join(Person, Message)
    //                            .On(Person, "Id", Message, "To")       
    //                            .Where(Person, 
    //                                 {
    //                                     Field : "Name",
    //                                     Kind : Operation.CONSTAINS, 
    //                                     Value : "camila"
    //                                 })
    //                            .Select(Message).Join("To").ToListAsync();
        
        
    //     expect(msgs.length).toBe(2);
    //     expect(msgs[0].To?.length).toBe(1);
    //     expect(msgs[1].To?.length).toBe(3);        
        
    // });

    // test("Testing the same with array using conventional query sintax", async()=>{

    //     let context = await CompleteSeedAsync();

    //     let camila = await context.Persons.Where({ Field : "Name", Value : "camila"}).FirstOrDefaultAsync();

    //     let msgs = await context.Messages.Where(
    //         {
    //             Field : "To", 
    //             Kind : Operation.CONSTAINS,
    //             Value : [camila!]
    //         }).Join("To").ToListAsync();

    //     expect(msgs.length).toBe(2);
    //     expect(msgs[0].To?.length).toBe(1);
    //     expect(msgs[1].To?.length).toBe(3);   
    // });

    test("Testing the same with conventional query sintax", async()=>{

        let context = await CompleteSeedAsync();

        let adriano = await context.Persons.Where({ Field : "Name", Value : "adriano"}).FirstOrDefaultAsync();

        let msgs = await context.Messages.Where(
            {
                Field : "From",
                Value : adriano!
            }).Join("From").ToListAsync();

        expect(msgs.length).toBe(2);
        expect(msgs[0].To?.length).toBe(1);
        expect(msgs[1].To?.length).toBe(3);   
    })
    
    /*
    test("Testing join with right side is array, but left side nort, and left side have relation with right", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.Join(Person, Message)
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
                               .Select(Message).Join("To").ToListAsync();

        expect(msgs.length).toBe(1);       
        expect(msgs[0].To?.length).toBe(1);        
        expect(msgs[0].To?.[0].Name).toBe("camila");        
        
    });

    test("Testing join with left side is array, but right side not, and left side have relation with right", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.Join(Person, Message)
                               .On(Person, "MessagesReceived", Message, "Id")       
                               .Where(Person, 
                                    {
                                        Field : "Name",
                                        Kind : Operation.CONSTAINS, 
                                        Value : "camila"
                                    })
                               .Select(Message).Join("To").ToListAsync();

        expect(msgs.length).toBe(2);
        expect(msgs[0].To?.length).toBe(3);
        expect(msgs[1].To?.length).toBe(1);        
        
    });

    test("Testing join left with right side with no relation", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.Join(Person, Message)
                               .On(Person, "LinkTestValueInPerson", Message, "LinkTestValueInMessage")       
                               .Where(Person, 
                                    {
                                        Field : "Name",                                        
                                        Value : "adriano"
                                    })
                               .Select(Message)
                               .Join("From")
                               .Join("To")
                               .ToListAsync();

        expect(msgs.length).toBe(1);
        expect(msgs[0].From?.Name).toBe("adriano");       
        expect(msgs[0].To?.length).toBe(3);
               
        
    });

    test("Testing join with left side is array, but right side not, and left side have no one relation with right", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.Join(Person, Message)
                               .On(Person, "LinkTestArrayInPerson", Message, "LinkTestValueInMessage")       
                               .Where(Person, 
                                    {
                                        Field : "Name",                                        
                                        Value : "adriano"
                                    })
                               .Select(Message)
                               .Join("From")
                               .Join("To")
                               .ToListAsync();

        expect(msgs.length).toBe(2);
        expect(msgs[0].From?.Name).toBe("adriano");       
        expect(msgs[1].From?.Name).toBe("adriano");       
        expect(msgs[0].To?.length).toBe(1);
        expect(msgs[1].To?.length).toBe(3);
               
        
    });


    test("Testing join with left side is not array, but right side is, and left side have no one relation with right", async ()=>{
       
        let context = await CompleteSeedAsync();

        let msgs = await context.Join(Person, Message)
                               .On(Person, "LinkTestValueInPerson", Message, "LinkTestArrayInMessage")
                               .Select(Message)
                               .Join("From")
                               .Join("To")
                               .ToListAsync();

        expect(msgs.length).toBe(3);      
                       
    });

    */
});