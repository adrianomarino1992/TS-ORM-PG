import { PGDBManager } from "../src/Index";
import InvalidOperationException from "../src/core/exceptions/InvalidOperationException";
import PGConnection from "../src/implementations/PGDBConnection";
import Context from "./classes/TestContext";

describe("Connection", ()=>{


    test("Test open and close connection", async ()=>{

        var conn = new PGConnection("localhost", 5432, "db", "user", "password");

        expect(conn).not.toBe(null);

        await conn.OpenAsync();

        await conn.CloseAsync();
       

    });


    test("Test open and close connection using enviroment variables", async ()=>{

      process.env.DB_HOST = "localhost";      
      process.env.DB_PORT = "5432";
      process.env.DB_USER = "user";
      process.env.DB_PASS = "password";
      process.env.DB_NAME = "db";

      let context = new Context(PGDBManager.BuildFromEnviroment());

      let now = await context.ExecuteQuery("select now()");

      expect(now).not.toBeUndefined();

    });

    describe("Should fail", ()=> {

        test("Test open and close connection with no one enviroment variables", async ()=>{

            process.env.DB_HOST = "";      
            process.env.DB_PORT = "";
            process.env.DB_USER = "";
            process.env.DB_PASS = "";
            process.env.DB_NAME = "";              

            try
            {
                let context = new Context(PGDBManager.BuildFromEnviroment());  

                throw new Error("Shouyld have failed");

            }catch(exception)
            {
                if(!(exception instanceof InvalidOperationException))
                {
                    throw new Error("Some unespected error");
                }
            }    
      
          });
      })
    
  

});