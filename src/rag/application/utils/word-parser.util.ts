import * as mammoth from 'mammoth';

async function extractWordText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export { extractWordText };
