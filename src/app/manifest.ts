import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "活動管理與報到系統",
		short_name: "活動管理",
		description: "一個現代化的活動管理與報到系統，支援與 Google 試算表同步。",
		start_url: "/",
		display: "standalone",
		background_color: "#030712", // Dark background matching modern styling
		theme_color: "#006fee", // Primary brand color (HeroUI blue)
		icons: [
			{
				src: "/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icon-maskable.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
