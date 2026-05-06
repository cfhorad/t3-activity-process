"use client";

import type { SVGProps } from "react";

export function LockIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>鎖頭圖示</title>
			<path
				d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
			<title>Google 圖標</title>
			<path
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				fill="#4285F4"
			/>
			<path
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				fill="#34A853"
			/>
			<path
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				fill="#EA4335"
			/>
		</svg>
	);
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>顯示密碼</title>
			<path
				d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>隱藏密碼</title>
			<path
				d="M13.878 15.526a3 3 0 01-4.243-4.243m-1.414-1.415L3 3m18 18l-5.657-5.657m0 0a9 9 0 10-12.728 0M9.9 4.244A9 9 0 1118 12.9"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
