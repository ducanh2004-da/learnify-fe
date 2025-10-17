// src/features/courses/services/createCourse.service.ts
import { apiConfig } from '@/configs';

export type CreateCourseResult = { id: string; raw: any };

function findFirstIdInObject(obj: any): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  if (typeof obj.id === 'string' && obj.id.trim() !== '') return obj.id;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (!v) continue;
    if (typeof v === 'object') {
      const found = findFirstIdInObject(v);
      if (found) return found;
    } else if (typeof v === 'string' && /^(?:[0-9a-fA-F-]{8,}|[0-9]+)$/.test(v)) {
      // heuristic: uuid-like or numeric id
      return v;
    }
  }
  return undefined;
}

export const createCourseService = {
  /**
   * Create a course and return a stable object { id, raw }.
   * IMPORTANT: the GraphQL selection now requests `id` so we can reliably return it.
   */
  createCourse: async (
    abstract: string,
    courseName: string,
    creatorId: string
  ): Promise<CreateCourseResult> => {
    const mutation = `
      mutation CreateCourse($data: CreateCourseDto!) {
        createCourse(data: $data) {
          id
          abstract
          courseName
          keyLearnings
        }
      }
    `;

    const variables = {
      data: {
        abstract,
        courseName,
        creatorId,
      },
    };

    const response = await apiConfig.post('', {
      query: mutation,
      variables,
    });

    // axios response typically in response.data
    const json = response.data;

    // GraphQL responses often nested under json.data
    const payloadRoot = json?.data ?? json;

    // common path
    const created = payloadRoot?.createCourse ?? payloadRoot?.create_course ?? payloadRoot;

    // Try direct id first
    if (created && typeof created === 'object' && typeof created.id === 'string' && created.id.trim() !== '') {
      return { id: created.id, raw: json };
    }

    // fallback search inside payloadRoot
    const found = findFirstIdInObject(payloadRoot);
    if (found) return { id: found, raw: json };

    // If still not found -> helpful error with raw logged
    console.error('createCourseService: cannot find course id in response', json);
    throw new Error('Không lấy được courseId từ response tạo course. Kiểm tra console để xem raw response.');
  },
};
