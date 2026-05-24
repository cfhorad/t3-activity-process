"use client";

import dynamic from "next/dynamic";
import type { Session } from "~/server/better-auth/config";

const NavbarComponent = dynamic(
	() => import("./navbar").then((mod) => mod.NavbarComponent),
	{ ssr: false },
);

export function NavbarClient({ session }: { session?: Session | null }) {
	return <NavbarComponent session={session} />;
}
