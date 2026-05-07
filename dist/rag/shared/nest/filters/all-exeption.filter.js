"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status;
        let message;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'object' &&
                res !== null &&
                'message' in res &&
                typeof res.message === 'string') {
                message = res.message;
            }
            else if (typeof res === 'string') {
                message = res;
            }
            else {
                message = exception.message || 'Internal server error';
            }
        }
        else {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
        }
        const method = typeof request === 'object' && request !== null && 'method' in request
            ? request.method
            : 'UNKNOWN';
        const url = typeof request === 'object' && request !== null && 'originalUrl' in request
            ? request.originalUrl
            : typeof request === 'object' && request !== null && 'url' in request
                ? request.url
                : 'UNKNOWN';
        if (status === 500) {
            const trace = exception instanceof Error ? exception.stack : JSON.stringify(exception);
            this.logger.error(`[UNHANDLED ERROR] ${method} ${url} at ${new Date().toISOString()}`, trace);
        }
        else {
            this.logger.warn(`[${status}] ${method} ${url}: ${message}`);
        }
        if (typeof response === 'object' &&
            response !== null &&
            typeof response.status === 'function') {
            response
                .status(status)
                .json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: url,
                message: status === 500 ? 'Internal server error' : message,
            });
        }
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exeption.filter.js.map