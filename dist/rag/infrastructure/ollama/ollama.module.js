"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ollama_service_1 = require("./ollama.service");
const console_logger_adapter_1 = require("../../shared/application/ports/console.logger.adapter");
const cache_module_1 = require("../redis/cache.module");
let OllamaModule = class OllamaModule {
};
exports.OllamaModule = OllamaModule;
exports.OllamaModule = OllamaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            cache_module_1.CacheModule,
        ],
        providers: [
            ollama_service_1.OllamaService,
            {
                provide: 'LoggerPort',
                useClass: console_logger_adapter_1.ConsoleLoggerAdapter,
            },
        ],
        exports: [ollama_service_1.OllamaService],
    })
], OllamaModule);
//# sourceMappingURL=ollama.module.js.map