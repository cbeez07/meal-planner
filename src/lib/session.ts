import { auth } from "@/auth";
import { ApiError } from "@/lib/api";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError("unauthorized", "Sign in required", 401);
  }
  return session.user;
}
