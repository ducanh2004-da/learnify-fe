
interface User {
  userId: string | null;
  username: string;
  email: string;
  phoneNumber?: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
  // stats?: {
  //   coursesCompleted: number;
  //   inProgress: number;
  //   totalHours: number;
  //   certificates: number;
  // };
}

export type { User }