import { Person } from './TestEntity';
export declare class Message {
    Id: number;
    Message: string;
    From?: Person;
    User?: Person;
    To?: Person[];
    LinkTestValueInMessage?: number;
    LinkTestArrayInMessage?: number[];
    constructor(message: string, from?: Person, to?: Person[]);
}
//# sourceMappingURL=RelationEntity.d.ts.map