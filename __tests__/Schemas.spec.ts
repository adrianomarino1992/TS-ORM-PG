

import { TryAsync, CreateConnection } from "./TestFunctions";
import Type from "../src/core/design/Type";
import PGConnection from "../src/implementations/PGDBConnection";
import PGDBManager from "../src/implementations/PGDBManager";
import Context from "./classes/TestContext";
import {Person} from './classes/TestEntity';



describe("Types and metadata", ()=>{
    

    test("Testing if a database exists", async ()=>{

        var conn = CreateConnection();

        var manager = new PGDBManager(conn);

        let postgres = await manager.CheckDatabase('postgres');
        let mysql = await manager.CheckDatabase('mysql');
       
        expect(postgres).toBeTruthy();
        expect(mysql).toBeFalsy();

    });


    test("Testing create a database", async ()=>{

        var conn = CreateConnection();

        var manager = new PGDBManager(conn);

        let test_db = await manager.CheckDatabase('test_db');

        if(test_db)
        {
            await conn.AsPostgres().Open();
            await conn.ExecuteNonQuery(`select pg_terminate_backend(pid) from pg_stat_activity where datname = 'test_db';`)
            await conn.ExecuteNonQuery(`drop database test_db;`);
            await conn.Close();
        }

        await manager.CreateDataBase('test_db');
       
        test_db = await manager.CheckDatabase('test_db');

        expect(test_db).toBeTruthy();        

    });


    describe("Schemas", ()=>{
       
    
        test("Testing create a table and checking if it was created", async ()=>{
    
            var conn = CreateConnection();
    
            var manager = new PGDBManager(conn);
    
            let test_table = await manager.CheckTable(Person);
    
            if(test_table)
            {
                await conn.Open();
                await conn.ExecuteNonQuery(`drop table person_tb;`);
                await conn.Close();
            }
            
            await manager.CreateTable(Person);
           
            test_table = await manager.CheckTable(Person);
    
            expect(test_table).toBeTruthy();        
    
        });


        describe("Testing columns", ()=>{


            test("Testing if a column exists", async ()=>{
    
                var conn = CreateConnection();

                var manager = new PGDBManager(conn);
        
                let table = await manager.CheckColumn(Person, 'Name');
               
                expect(table).toBeFalsy();        
        
            });
        
        
            test("Testing create a column and checking if it was created", async ()=>{
        
                var conn = new PGConnection("localhost", 5434, "test_db", "supervisor", "sup");
        
                var manager = new PGDBManager(conn);
        
                let test_column = await manager.CheckColumn(Person, 'Name');
        
                if(test_column)
                {
                    await conn.Open();
                    await conn.ExecuteNonQuery(`alter table test_table drop column name;`);
                    await conn.Close();
                }
                
                await manager.CreateColumn(Person, 'Name');
               
                test_column = await manager.CheckColumn(Person, 'Name');
        
                expect(test_column).toBeTruthy();        
        
            });
    
        });



        describe("Schemas within context", ()=>{


            test("Testing crete columns from a objetc", async ()=>{
    
                await TryAsync(async()=>{

                    var conn = new PGConnection("localhost", 5434, "test_db", "supervisor", "sup");
        
                    var manager = new PGDBManager(conn);
            
                    var context = new Context(manager);  

                    for(let t of context.GetMappedTypes())
                    {
                        if(await manager.CheckTable(t))
                        {
                            await conn.Open();
                            await conn.ExecuteNonQuery(`drop table ${Type.GetTableName(t)};`);
                            await conn.Close();
                        }
                    } 

                     await context.UpdateDatabaseAsync();

                    for(let t of context.GetMappedTypes())
                    {
                        expect(await manager.CheckTable(t)).toBeTruthy();

                        for(let c of Type.GetColumnNameAndType(t))
                        {
                            expect(await manager.CheckColumn(t, c.Field)).toBeTruthy();
                        }
                    
                    }
                }, err => 
                {
                    throw err;
                });
                
        
            });
        
    
        });

    });

});