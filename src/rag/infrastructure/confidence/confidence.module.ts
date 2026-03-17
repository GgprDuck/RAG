import { ConfidenceService } from "src/rag/application/services/confidence.service";

export const CONFIDENCE_PROVIDERS = [
  ConfidenceService,
  {
    provide: 'IConfidencePort',
    useExisting: ConfidenceService,
  },
];

export const confidenceConfig = () => ({
  rag: {
    confidence: {
      high: parseFloat(process.env.CONFIDENCE_THRESHOLD_HIGH ?? '0.85'),
      low: parseFloat(process.env.CONFIDENCE_THRESHOLD_LOW ?? '0.65'),
    },
  },
});