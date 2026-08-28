export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface UpdateUserDto {
  username: string;
  email: string;
  password: string;
}
