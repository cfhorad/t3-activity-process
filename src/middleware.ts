import { type NextRequest, NextResponse } from "next/server";
import { auth } from "./server/better-auth";

export default async function middleware(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		return NextResponse.redirect(new URL("/auth", request.url));
	}
	return NextResponse.next();
}

export const config = {
	runtime: "nodejs",
	matcher: ["/", "/activity/:path*", "/process/:path*"],
};
