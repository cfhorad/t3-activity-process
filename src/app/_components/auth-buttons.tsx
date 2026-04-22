"use client";

import { Button } from "@heroui/react";

import { authClient } from "~/server/better-auth/client";

export function SignInButton() {
	return (
		<Button
			// className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
			onPress={async () => {
				await authClient.signIn.social({
					provider: "github",
					callbackURL: "/",
				});
			}}
			type="button"
		>
			Sign in with Github
		</Button>
	);
}

export function SignOutButton() {
	return (
		<Button
			// className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
			onPress={async () => {
				await authClient.signOut({
					fetchOptions: {
						onSuccess: () => {
							window.location.href = "/";
						},
					},
				});
			}}
			type="button"
		>
			Sign out
		</Button>
	);
}
