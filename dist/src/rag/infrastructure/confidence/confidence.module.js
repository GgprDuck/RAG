"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confidenceConfig = exports.CONFIDENCE_PROVIDERS = void 0;
const confidence_service_1 = require("../../application/services/confidence.service");
exports.CONFIDENCE_PROVIDERS = [
    confidence_service_1.ConfidenceService,
    {
        provide: 'IConfidencePort',
        useExisting: confidence_service_1.ConfidenceService,
    },
];
const confidenceConfig = () => ({
    rag: {
        confidence: {
            high: parseFloat(process.env.CONFIDENCE_THRESHOLD_HIGH ?? '0.85'),
            low: parseFloat(process.env.CONFIDENCE_THRESHOLD_LOW ?? '0.65'),
        },
    },
});
exports.confidenceConfig = confidenceConfig;
//# sourceMappingURL=confidence.module.js.map