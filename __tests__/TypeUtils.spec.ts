import { Person } from "./classes/TestEntity";
import TypeUtils from '../src/core/utils/TypeUtils';

describe("Tpe utils functions", ()=>{


    test("Test get type from columns", ()=>{
        
        let keys = TypeUtils.GetColumnNameAndType(Person);

        let table = TypeUtils.GetTableName(Person);

        expect(keys).not.toBeNull();        
        
        expect(table).toBe("person_tb");
        
        expect(keys["Name"]).toEqual(["name", "String"]);

        expect(keys["Age"]).toEqual(["age", "Number"]);

        expect(keys["Email"]).toEqual(["email_address", "String"]);

        expect(keys["CEP"]).toEqual(["cep", "integer"]);

        expect(keys["PhoneNumbers"]).toEqual(["phonenumbers", "text[]"]);

        expect(keys["Documents"]).toEqual(["documents", "integer[]"]);

        expect(keys["Birth"]).toEqual(["birth", "date"]);

    });


});