import PGConnection from "../src/implementations/PGDBConnection";

describe("Connection", ()=>{


    test("Test open and close connection", async ()=>{

        var conn = new PGConnection("localhost", 5434, "postgres", "supervisor", "sup");

        expect(conn).not.toBe(null);

        await conn.Open();

        await conn.Close();
       

    });

});