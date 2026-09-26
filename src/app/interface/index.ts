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
