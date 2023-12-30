import { Message } from './RelationEntity';
export declare class Person {
    Id: number;
    Name: string;
    Email: string;
    Age: number;
    CEP: number;
    Message?: Message;
    PhoneNumbers: string[];
    Documents: number[];
    Birth: Date;
    MessagesWriten?: Message[];
    MessagesReceived?: Message[];
    LinkTestValueInPerson: number;
    LinkTestArrayInPerson: number[];
    constructor(name?: string, email?: string, age?: number);
}
//# sourceMappingURL=TestEntity.d.ts.map