import { Role } from "../../../generated/prisma/enums.js";


export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
};


declare global {
  namespace Express {
    interface User extends AuthenticatedUser { }
  }
}


export interface IQuery {
  search?: string;
  sortOrder?: string;
  sortBy?: string;
  limit?: string;
  page?: string;
  [key: string]: any;
}



export interface IMeta {
  total: number
  page: number
  limit: number
  totalPages: number
};