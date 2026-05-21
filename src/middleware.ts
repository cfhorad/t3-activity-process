import { type NextRequest, NextResponse } from "next/server";
import { auth } from "./server/better-auth";

export default async function middleware(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		return NextResponse.redirect(new URL("/auth", request.url));
	}

	const { status } = session.user as { status?: string };

	// If pending-approval page itself, let them pass
	if (request.nextUrl.pathname === "/pending-approval") {
		return NextResponse.next();
	}

	// Redirect to pending-approval page if they are not active
	if (status === "pending" || status === "suspended") {
		return NextResponse.redirect(new URL("/pending-approval", request.url));
	}

	return NextResponse.next();
}

export const config = {
	runtime: "nodejs",
	matcher: ["/", "/activity/:path*", "/process/:path*", "/pending-approval"],
};
