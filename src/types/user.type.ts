interface User {
  id?: string
  username?: string
  email?: string
  phoneNumber?: string
  role?: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

export type {
  User
}