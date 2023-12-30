import { PGDBManager, PGDBContext, PGDBSet } from '../../src/Index';
import { Message } from './RelationEntity';
import { Person } from './TestEntity';
export default class Context extends PGDBContext {
    Persons: PGDBSet<Person>;
    Messages: PGDBSet<Message>;
    constructor(manager: PGDBManager);
}
//# sourceMappingURL=TestContext.d.ts.map