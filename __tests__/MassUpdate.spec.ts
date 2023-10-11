
import { Operation } from '../src/core/objects/interfaces/IStatement';
import {CompleteSeedAsync, TruncateTablesAsync} from './TestFunctions';


describe("Mass operations", ()=>{    

    test("Testing a mass update in all table", async ()=>{
       
        let context = await CompleteSeedAsync();

        await context.Persons.Set("Age", 30).UpdateSelectionAsync();
        
        let all = await context.Persons.ToListAsync();
        
        for(let c of all)
            expect(c.Age).toBe(30);             
        
    });   

    test("Testing a mass update in some lines of table", async ()=>{
       
        let context = await CompleteSeedAsync();

        await context.Persons.Set("Age", 30).Where({Field : "Name", Kind : Operation.STARTWITH, Value : "a"}).UpdateSelectionAsync();
        
        let all = await context.Persons.ToListAsync();
        
        let withA : string[]= [];

        for(let c of all)
        {
            if(c.Name.indexOf('a') == 0){
                expect(c.Age).toBe(30);
                withA.push(c.Name);
            }
        }  
        
        expect(all.length).not.toBe(withA.length);       
        
    });       

    
    describe("Delete some lines", ()=>{   

        test("Deleting some lines of table", async ()=>{
            
            let context = await CompleteSeedAsync();            

            await context.Persons.Where({Field : "Name", Kind : Operation.STARTWITH, Value : "a"}).DeleteSelectionAsync();
            
            let all = await context.Persons.ToListAsync();
                        
            expect(all.length).toBe(2);     
            expect(all.filter(s => s.Name.indexOf("a") == 0).length).toBe(0)  
            
        });  
    });
    
});
