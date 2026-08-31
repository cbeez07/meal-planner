import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username: string;
      displayName: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    displayName?: string;
  }
}
