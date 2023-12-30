"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TruncateTablesAsync = exports.TruncatePersonTableAsync = exports.CompleteSeedAsync = exports.SeedAsync = exports.CreateContext = exports.CreateConnection = exports.TryAsync = exports.Try = void 0;
const PGDBConnection_1 = __importDefault(require("../../src/implementations/PGDBConnection"));
const TestContext_1 = __importDefault(require("../classes/TestContext"));
const PGDBManager_1 = __importDefault(require("../../src/implementations/PGDBManager"));
const TestEntity_1 = require("../classes/TestEntity");
const Type_1 = __importDefault(require("../../src/core/design/Type"));
const RelationEntity_1 = require("../classes/RelationEntity");
function Try(action, onError) {
    try {
        action();
    }
    catch (ex) {
        if (onError)
            onError(ex);
    }
}
exports.Try = Try;
function TryAsync(action, onError) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield action();
        }
        catch (ex) {
            if (onError)
                onError(ex);
        }
    });
}
exports.TryAsync = TryAsync;
function CreateConnection() {
    return new PGDBConnection_1.default("localhost", 5434, "test_db", "supervisor", "sup");
}
exports.CreateConnection = CreateConnection;
function CreateContext() {
    return new TestContext_1.default(new PGDBManager_1.default(CreateConnection()));
}
exports.CreateContext = CreateContext;
function SeedAsync() {
    return __awaiter(this, void 0, void 0, function* () {
        yield TruncateTablesAsync();
        let context = CreateContext();
        let adriano = new TestEntity_1.Person("Adriano", "adriano@test.com");
        adriano.Birth = new Date(1992, 4, 23);
        adriano.Documents = [123, 4, 5, 678, 9];
        adriano.PhoneNumbers = ['+55(12)98206-8255'];
        yield context.Persons.AddAsync(adriano);
        let camila = new TestEntity_1.Person("Camila", "camila@test.com");
        camila.Documents = [];
        yield context.Persons.AddAsync(camila);
        yield context.Persons.AddAsync(new TestEntity_1.Person("Juliana", "juliana@test.com"));
        yield context.Persons.AddAsync(new TestEntity_1.Person("Andre", "andre@test.com"));
        return context;
    });
}
exports.SeedAsync = SeedAsync;
function CompleteSeedAsync() {
    return __awaiter(this, void 0, void 0, function* () {
        let context = CreateContext();
        yield TruncateTablesAsync();
        let adriano = new TestEntity_1.Person("adriano", "adriano@test.com");
        adriano.Birth = new Date(1992, 4, 23);
        adriano.Documents = [1234432, 443224, 4324322, 32142132, 432432545];
        adriano.LinkTestValueInPerson = 1;
        adriano.LinkTestArrayInPerson = [1, 2, 3, 4, 5];
        yield context.Persons.AddAsync(adriano);
        let camila = new TestEntity_1.Person("camila", "camila@test.com");
        camila.Birth = new Date(1992, 6, 21);
        camila.Documents = [5435436, 76576523, 43256778];
        camila.LinkTestValueInPerson = 2;
        camila.LinkTestArrayInPerson = [1, 2, 3, 4, 5];
        yield context.Persons.AddAsync(camila);
        let juliana = new TestEntity_1.Person("juliana", "juliana@test.com");
        juliana.Birth = new Date(1993, 4, 30);
        juliana.Documents = [1232323, 42321, 51211, 321321, 932432];
        juliana.LinkTestValueInPerson = 3;
        juliana.LinkTestArrayInPerson = [2, 3, 4];
        yield context.Persons.AddAsync(juliana);
        let andre = new TestEntity_1.Person("andre", "andre@test.com");
        andre.Birth = new Date(1995, 4, 18);
        andre.Documents = [4324543, 5543543, 543543543, 954351];
        andre.LinkTestValueInPerson = 4;
        andre.LinkTestArrayInPerson = [1, 2, 3];
        yield context.Persons.AddAsync(andre);
        let msg = new RelationEntity_1.Message('Some message from Adriano', adriano, [camila, juliana, andre]);
        msg.LinkTestValueInMessage = 1;
        msg.LinkTestArrayInMessage = [1, 2, 3, 4, 5];
        yield context.Messages.AddAsync(msg);
        msg = new RelationEntity_1.Message('Some private message from Adriano', adriano, [camila]);
        msg.LinkTestValueInMessage = 2;
        msg.LinkTestArrayInMessage = [1];
        yield context.Messages.AddAsync(msg);
        msg = new RelationEntity_1.Message('Some message from Camila', camila, [adriano, juliana, andre]);
        msg.LinkTestValueInMessage = undefined;
        msg.LinkTestArrayInMessage = [1, 2, 3, 4, 5, 5, 6, 7];
        yield context.Messages.AddAsync(msg);
        msg = new RelationEntity_1.Message('Some message from Adriano to nobody', adriano, []);
        msg.LinkTestValueInMessage = 7;
        msg.LinkTestArrayInMessage = undefined;
        yield context.Messages.AddAsync(msg);
        return context;
    });
}
exports.CompleteSeedAsync = CompleteSeedAsync;
function TruncatePersonTableAsync() {
    return __awaiter(this, void 0, void 0, function* () {
        let conn = CreateConnection();
        yield conn.OpenAsync();
        yield conn.ExecuteNonQueryAsync(`truncate table ${Type_1.default.GetTableName(TestEntity_1.Person)}`);
        yield conn.CloseAsync();
    });
}
exports.TruncatePersonTableAsync = TruncatePersonTableAsync;
function TruncateTablesAsync() {
    return __awaiter(this, void 0, void 0, function* () {
        let conn = CreateConnection();
        yield conn.OpenAsync();
        yield conn.ExecuteNonQueryAsync(`truncate table ${Type_1.default.GetTableName(TestEntity_1.Person)}`);
        yield conn.ExecuteNonQueryAsync(`truncate table ${Type_1.default.GetTableName(RelationEntity_1.Message)}`);
        yield conn.CloseAsync();
    });
}
exports.TruncateTablesAsync = TruncateTablesAsync;
//# sourceMappingURL=TestFunctions.js.map