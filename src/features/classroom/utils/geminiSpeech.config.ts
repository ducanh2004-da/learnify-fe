import { GoogleGenAI } from '@google/genai';
import mime from 'mime';

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function createWavHeader(dataLength: number, options: WavConversionOptions) {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0); // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
  buffer.write('WAVE', 8); // Format
  buffer.write('fmt ', 12); // Subchunk1ID
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
  buffer.write('data', 36); // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size

  return buffer;
}

function parseMimeType(mimeType: string) {
  const [fileType, ...params] = mimeType.split(';').map((s) => s.trim());
  const [_, format] = fileType.split('/');

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map((s) => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

function convertToWav(rawData: string, mimeType: string) {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(rawData.length, options);
  const buffer = Buffer.from(rawData, 'base64');
  return Buffer.concat([wavHeader, buffer]);
}

export function initializeGeminiSpeech() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const config = {
    temperature: 1,
    responseModalities: ['audio'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Zephyr',
        },
      },
    },
  };

  return {
    ai,
    config,
    model: 'gemini-2.5-pro-preview-tts',
  };
}

export async function generateSpeech(text: string) {
  const { ai, config, model } = initializeGeminiSpeech();

  const contents = [
    {
      role: 'user',
      parts: [{ text }],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });

  for await (const chunk of response) {
    if (!chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      continue;
    }

    const inlineData = chunk.candidates[0].content.parts[0].inlineData;
    let fileExtension = mime.getExtension(inlineData.mimeType || '');
    let buffer = Buffer.from(inlineData.data || '', 'base64');

    if (!fileExtension) {
      fileExtension = 'wav';
      buffer = convertToWav(inlineData.data || '', inlineData.mimeType || '');
    }

    // Create audio blob and return URL
    const blob = new Blob([buffer], { type: `audio/${fileExtension}` });
    return URL.createObjectURL(blob);
  }

  throw new Error('No audio data generated');
}