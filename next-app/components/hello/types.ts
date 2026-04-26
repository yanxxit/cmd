export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface UserFormValues {
  name: string;
  email: string;
  age: number;
}
