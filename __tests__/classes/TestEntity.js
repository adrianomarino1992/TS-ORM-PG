"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Person = void 0;
const Index_1 = require("../../src/Index");
const RelationEntity_1 = require("./RelationEntity");
let Person = class Person {
    constructor(name = "", email = "", age = 1) {
        this.Id = -1;
        this.Name = name;
        this.Email = email;
        this.Age = age;
        this.CEP = -1;
        this.PhoneNumbers = [];
        this.Birth = new Date(1992, 4, 23);
        this.Documents = [];
        this.MessagesReceived = [];
        this.MessagesWriten = [];
        this.LinkTestValueInPerson = -1;
        this.LinkTestArrayInPerson = [];
        this.Message = undefined;
    }
};
exports.Person = Person;
__decorate([
    (0, Index_1.PrimaryKey)(),
    (0, Index_1.Column)(),
    (0, Index_1.DataType)(Index_1.DBTypes.SERIAL),
    __metadata("design:type", Number)
], Person.prototype, "Id", void 0);
__decorate([
    (0, Index_1.Column)(),
    __metadata("design:type", String)
], Person.prototype, "Name", void 0);
__decorate([
    (0, Index_1.Column)("email_address"),
    __metadata("design:type", String)
], Person.prototype, "Email", void 0);
__decorate([
    (0, Index_1.Column)(),
    __metadata("design:type", Number)
], Person.prototype, "Age", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.DataType)(Index_1.DBTypes.INTEGER),
    __metadata("design:type", Number)
], Person.prototype, "CEP", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.OneToOne)(() => RelationEntity_1.Message, "User"),
    __metadata("design:type", RelationEntity_1.Message)
], Person.prototype, "Message", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.DataType)(Index_1.DBTypes.TEXTARRAY),
    __metadata("design:type", Array)
], Person.prototype, "PhoneNumbers", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.DataType)(Index_1.DBTypes.INTEGERARRAY),
    __metadata("design:type", Array)
], Person.prototype, "Documents", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.DataType)(Index_1.DBTypes.DATE),
    __metadata("design:type", Date)
], Person.prototype, "Birth", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.OneToMany)(() => RelationEntity_1.Message, "From"),
    __metadata("design:type", Array)
], Person.prototype, "MessagesWriten", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.ManyToMany)(() => RelationEntity_1.Message, "To"),
    __metadata("design:type", Array)
], Person.prototype, "MessagesReceived", void 0);
__decorate([
    (0, Index_1.Column)(),
    __metadata("design:type", Number)
], Person.prototype, "LinkTestValueInPerson", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.DataType)(Index_1.DBTypes.INTEGERARRAY),
    __metadata("design:type", Array)
], Person.prototype, "LinkTestArrayInPerson", void 0);
exports.Person = Person = __decorate([
    (0, Index_1.Table)("person_tb"),
    __metadata("design:paramtypes", [String, String, Number])
], Person);
//# sourceMappingURL=TestEntity.js.map