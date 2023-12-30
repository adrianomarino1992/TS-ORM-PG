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
exports.Message = void 0;
const Index_1 = require("../../src/Index");
const TestEntity_1 = require("./TestEntity");
let Message = class Message {
    constructor(message, from, to) {
        this.Id = -1;
        this.Message = message;
        this.From = from;
        this.To = to;
        this.LinkTestValueInMessage = -1;
        this.LinkTestArrayInMessage = [];
        this.User = undefined;
    }
};
exports.Message = Message;
__decorate([
    (0, Index_1.PrimaryKey)(),
    (0, Index_1.Column)(),
    (0, Index_1.DataType)(Index_1.DBTypes.SERIAL),
    __metadata("design:type", Number)
], Message.prototype, "Id", void 0);
__decorate([
    (0, Index_1.Column)(),
    __metadata("design:type", String)
], Message.prototype, "Message", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.ManyToOne)(() => TestEntity_1.Person, "MessagesWriten"),
    __metadata("design:type", TestEntity_1.Person)
], Message.prototype, "From", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.OneToOne)(() => TestEntity_1.Person, "Message"),
    __metadata("design:type", TestEntity_1.Person)
], Message.prototype, "User", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.ManyToMany)(() => TestEntity_1.Person, "MessagesReceived"),
    __metadata("design:type", Array)
], Message.prototype, "To", void 0);
__decorate([
    (0, Index_1.Column)(),
    __metadata("design:type", Number)
], Message.prototype, "LinkTestValueInMessage", void 0);
__decorate([
    (0, Index_1.Column)(),
    (0, Index_1.DataType)(Index_1.DBTypes.INTEGERARRAY),
    __metadata("design:type", Array)
], Message.prototype, "LinkTestArrayInMessage", void 0);
exports.Message = Message = __decorate([
    (0, Index_1.Table)("message_tb"),
    __metadata("design:paramtypes", [String, TestEntity_1.Person, Array])
], Message);
//# sourceMappingURL=RelationEntity.js.map