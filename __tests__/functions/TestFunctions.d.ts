import PGDBConnection from "../../src/implementations/PGDBConnection";
import Context from "../classes/TestContext";
export declare function Try(action: () => void, onError?: (e: Error) => void): void;
export declare function TryAsync(action: () => Promise<void>, onError?: (e: Error) => void): Promise<void>;
export declare function CreateConnection(): PGDBConnection;
export declare function CreateContext(): Context;
export declare function SeedAsync(): Promise<Context>;
export declare function CompleteSeedAsync(): Promise<Context>;
export declare function TruncatePersonTableAsync(): Promise<void>;
export declare function TruncateTablesAsync(): Promise<void>;
//# sourceMappingURL=TestFunctions.d.ts.map