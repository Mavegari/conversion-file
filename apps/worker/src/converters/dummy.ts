import { Converter, ConverterContext } from './index';

export class DummyConverter implements Converter {
  async handle(context: ConverterContext): Promise<string> {
    const { jobId, logger, job } = context;

    logger.info(`[${jobId}] Processing with dummy converter (placeholder)`);

    // Simular progreso
    await job.updateProgress(50);

    logger.info(`[${jobId}] Dummy conversion completed`);

    // Por ahora, devolver un outputPath ficticio
    // En Fases 5-8, esto será reemplazado con conversiones reales
    return `${jobId}_output.bin`;
  }
}
