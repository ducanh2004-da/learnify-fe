import { Course } from '@/features/courses'

export const courses: Course[] = [
  {
    id: 'a4a5b1ec-62c3-4ee2-981c-97e27fdc3595',
    courseName: 'NestJS GraphQL',
    abstract: 'Learn GraphQL in NestJS with hands-on projects and real-world examples. Master schema design, resolvers, and authentication in a modern backend framework.',
    createdAt: '2025-03-21T17:01:44.981Z',
    updatedAt: '2025-03-21T17:01:44.981Z',
    keyLearnings: [
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
    ],
    // instructor: 'Thomas Smith',
    // level: 'Intermediate',
    // duration: '10 weeks',
    // rating: 4.8,
    // students: 1245,
    // price: 79.99,
    // category: 'Backend',
    image: {
      name: 'nestjs-graphql',
      folder: 'courses'
    }
  },
  {
    id: 'b5f4c8d7-9a1e-5bf3-871d-46e58d2c9874',
    courseName: 'React with TypeScript',
    abstract: 'Build robust frontend applications with React and TypeScript. Learn component patterns, state management, and advanced typing techniques.',
    createdAt: '2025-02-15T09:30:22.345Z',
    updatedAt: '2025-03-10T14:15:33.789Z',
    keyLearnings: [
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
    ],
    // instructor: 'Emma Johnson',
    // level: 'Intermediate',
    // duration: '8 weeks',
    // rating: 4.9,
    // students: 2340,
    // price: 89.99,
    // category: 'Frontend',
    image: {
      name: 'react-typescript',
      folder: 'courses'
    }
  },
  {
    id: 'c7e6d2f1-4b5a-6c7d-982e-34f56d7e8901',
    courseName: 'Full Stack JavaScript',
    abstract: 'Master both frontend and backend development with JavaScript. Build complete applications from database to user interface.',
    createdAt: '2025-01-05T11:20:55.123Z',
    updatedAt: '2025-03-15T16:40:12.456Z',
    keyLearnings: [
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
    ],
    // instructor: 'Michael Williams',
    // level: 'Advanced',
    // duration: '12 weeks',
    // rating: 4.7,
    // students: 1876,
    // price: 99.99,
    // category: 'Fullstack',
    image: {
      name: 'fullstack-javascript',
      folder: 'courses'
    }
  },
  {
    id: 'd9f8e7c6-5b4a-3d2e-193f-87e65d4c3b2a',
    courseName: 'Machine Learning Fundamentals',
    abstract: 'Introduction to machine learning algorithms and techniques. Learn data preprocessing, model training, and deployment.',
    createdAt: '2025-03-01T08:45:30.789Z',
    updatedAt: '2025-03-18T10:25:40.123Z',
    keyLearnings: [
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
    ],
    // instructor: 'Sophia Chen',
    // level: 'Beginner',
    // duration: '6 weeks',
    // rating: 4.6,
    // students: 957,
    // price: 69.99,
    // category: 'Data Science',
    image: {
      name: 'machine-learning',
      folder: 'courses'
    }
  },
  {
    id: 'e1d2c3b4-a5f6-7e8d-490c-1b2a3c4d5e6f',
    courseName: 'DevOps & CI/CD Pipeline',
    abstract: 'Learn to implement continuous integration and deployment pipelines. Master Docker, Kubernetes, and cloud services.',
    createdAt: '2025-02-20T13:15:22.456Z',
    updatedAt: '2025-03-05T09:30:44.789Z',
    keyLearnings: [
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
    ],
    // instructor: 'David Kim',
    // level: 'Advanced',
    // duration: '9 weeks',
    // rating: 4.8,
    // students: 1123,
    // price: 94.99,
    // category: 'DevOps',
    image: {
      name: 'devops-cicd',
      folder: 'courses'
    }
  },
  {
    id: 'f2e3d4c5-b6a7-8f9e-012d-3e4f5a6b7c8d',
    courseName: 'Mobile App Development with Flutter',
    abstract: 'Build cross-platform mobile applications with Flutter. Create beautiful UIs and integrate with backend services.',
    createdAt: '2025-01-25T15:40:33.123Z',
    updatedAt: '2025-03-12T11:20:55.456Z',
    keyLearnings: [
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
      'Learn how to preprocess data for machine learning',
      'Understand the basics of machine learning algorithms',
    ],
    // instructor: 'Olivia Davis',
    // level: 'Intermediate',
    // duration: '8 weeks',
    // rating: 4.7,
    // students: 1543,
    // price: 84.99,
    // category: 'Mobile',
    image: {
      name: 'flutter-mobile',
      folder: 'courses'
    }
  }
]

export const categories = [
  'All Categories',
  'Frontend',
  'Backend',
  'Fullstack',
  'Mobile',
  'DevOps',
  'Data Science'
]

export const levels = [
  'All Levels',
  'Beginner',
  'Intermediate',
  'Advanced'
]

export const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  // { value: 'popular', label: 'Most Popular' },
  // { value: 'price-asc', label: 'Price: Low to High' },
  // { value: 'price-desc', label: 'Price: High to Low' },
  // { value: 'rating', label: 'Highest Rated' }
]

export const mockCourseImage: Record<string, string> = {
  'a4a5b1ec-62c3-4ee2-981c-97e27fdc3595': 'nestjs-graphql',
  '5b28193a-2307-4232-9108-48c7c07a569e': 'nhap-mon-lap-trinh',
  '4d17dad2-a34f-46ae-83a7-abb7826d047b': 'ctdl-giaithuat'
}

export const teamMembers = [
  // Web members
  { name: 'Do Duc Anh', jobTitle: 'Fullstack Developer', image: { name: 'ducanhdo', folder: 'teammates' } },
  // A.I members
  { name: 'Luu Trong Dung', jobTitle: 'AI Developer', image: { name: 'trongdung', folder: 'teammates' } },
]