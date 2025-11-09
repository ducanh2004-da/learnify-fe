interface Lesson {
  id: string
  lessonName: string
  abstract: string
  courseId: string
  createdAt: string
  updatedAt: string
}

export type LessonContent = {
    url_pdf: string;
    content: string;
};

export type CreateLessonResponse = {
    lesson_id: string;
    content: LessonContent[];
};

export type { Lesson }