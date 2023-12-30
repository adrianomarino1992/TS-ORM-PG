"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Index_1 = require("../../src/Index");
const RelationEntity_1 = require("./RelationEntity");
const TestEntity_1 = require("./TestEntity");
class Context extends Index_1.PGDBContext {
    constructor(manager) {
        super(manager);
        this.Persons = new Index_1.PGDBSet(TestEntity_1.Person, this);
        this.Messages = new Index_1.PGDBSet(RelationEntity_1.Message, this);
    }
}
exports.default = Context;
//# sourceMappingURL=TestContext.js.map