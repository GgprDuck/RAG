"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandBusAdapter = void 0;
const common_1 = require("@nestjs/common");
let CommandBusAdapter = class CommandBusAdapter {
    constructor() {
        this.handlers = new Map();
    }
    register(commandClass, handler) {
        const key = commandClass.name;
        if (this.handlers.has(key)) {
            throw new Error(`CommandBus: Handler already registered for "${key}"`);
        }
        this.handlers.set(key, handler);
    }
    async execute(command) {
        const key = command.constructor.name;
        const handler = this.handlers.get(key);
        if (!handler) {
            throw new Error(`CommandBus: No handler registered for command "${key}". ` +
                `Did you forget to call register() in RagCommandBusModule?`);
        }
        return handler.execute(command);
    }
};
exports.CommandBusAdapter = CommandBusAdapter;
exports.CommandBusAdapter = CommandBusAdapter = __decorate([
    (0, common_1.Injectable)()
], CommandBusAdapter);
//# sourceMappingURL=command-bus.adapter.js.map