import PGDBConnection from "../src/implementations/PGDBConnection";
import Context from './classes/TestContext';
import PGDBManager from "../src/implementations/PGDBManager";
import { Person } from './classes/TestEntity';
import Type from '../src/core/design/Type';
import { Message } from "./classes/RelationEntity";

export function Try(action : () => void, onError? : (e : Error) => void)
{
    try{

        action();
        
    }catch(ex)
    {
        if(onError)
            onError(ex as Error);
    }
}

export async function TryAsync(action : () => Promise<void>, onError? : (e : Error) => void)
{
    try{

       await action();
        
    }catch(ex)
    {
        if(onError)
            onError(ex as Error);
    }
}

export function CreateConnection()
{
    return new PGDBConnection("localhost", 5434, "test_db", "supervisor", "sup");
}

export function CreateContext() : Context
{
    return new Context(new PGDBManager(CreateConnection()));
}

export async function SeedAsync() : Promise<Context>
{
    let context = CreateContext();
    let adriano = new Person("Adriano", "adriano@test.com");
    adriano.Birth = new Date(1992,4,23);
    adriano.Documents = [123,4,5,678,9];
    adriano.PhoneNumbers = ['+55(12)98206-8255'];
    await context.Persons.AddAsync(adriano);
    let camila = new Person("Camila", "camila@test.com");
    camila.Documents = [];
    await context.Persons.AddAsync(camila);
    await context.Persons.AddAsync(new Person("Juliana", "juliana@test.com"));
    await context.Persons.AddAsync(new Person("Andre", "andre@test.com"));

    return context;
}

export async function TruncatePersonTableAsync()
{
    let conn = CreateConnection();
    await conn.Open();
    await conn.ExecuteNonQuery(`truncate table ${Type.GetTableName(Person)}`);
    await conn.Close();
}

export async function TruncateTablesAsync()
{
    let conn = CreateConnection();
    await conn.Open();
    await conn.ExecuteNonQuery(`truncate table ${Type.GetTableName(Person)}`);
    await conn.ExecuteNonQuery(`truncate table ${Type.GetTableName(Message)}`);
    await conn.Close();
}
