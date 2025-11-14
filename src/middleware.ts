export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/tours/:path*"],
};
