import PGDBConnection from "../src/implementations/PGDBConnection";

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