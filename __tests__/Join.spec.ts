
import { Person } from './classes/TestEntity';
import { Operation } from '../src/core/objects/interfaces/IStatement';
import {TruncatePersonTableAsync, CreateContext, SeedAsync} from './TestFunctions';
import { Message } from './classes/RelationEntity';
import Context from './classes/TestContext';





describe("Context", ()=>{    

    
    // test("Testing join", async ()=>{
       
    //     let context = CreateContext();

    //     context.From(Person, Message)
    //     .On(Person, "Id", Message, "From")
    //     .Where(Person, 
    //         {
    //             Field : "Name",
    //             Kind : Operation.CONSTAINS, 
    //             Value : "adriano"
    //         })
    //         .ToListAsync(Message);

        

    //     expect(context).not.toBeNull();

    //     expect(context.Persons).not.toBeNull();
        
    // });

    test("Testing join", async ()=>{
       
        let context = CreateContext();

        context.From(Person, Message)
        .On(Person, "Id", Message, "To")
        .Where(Person, 
            {
                Field : "Name",
                Kind : Operation.CONSTAINS, 
                Value : "adriano"
            })
            .ToListAsync(Message);

        
        // await context.Messages.Where(
        //     {
        //         Field : "To", 
        //         Value : [new Person("Deve poder buscar assim", "selecionando todas as mensagens que contenham essas pessoas", 1)]
        //     })

        expect(context).not.toBeNull();

        expect(context.Persons).not.toBeNull();
        
    });
});