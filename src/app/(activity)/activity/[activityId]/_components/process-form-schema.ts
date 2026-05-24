import { z } from "zod";

export const processFormSchema = z
	.object({
		name: z.string().min(1, "流程名稱為必填"),
		sheetName: z.string(),
		type: z.enum(["PROCESS", "CHECK", "WEB"]),
		processDate: z.string().optional().nullable(),
		processMemo: z.string().optional().nullable(),
		iframeCode: z.string().optional().nullable(),
		checkerUserIds: z.array(z.string()).optional(),
	})
	.superRefine((data, ctx) => {
		if (data.type !== "WEB") {
			if (!data.sheetName || data.sheetName.trim() === "") {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "請輸入發布的 CSV 網址",
					path: ["sheetName"],
				});
			} else if (!data.sheetName.startsWith("http")) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "請輸入有效的網址 (以 http:// 或 https:// 開頭)",
					path: ["sheetName"],
				});
			} else if (!data.sheetName.includes("output=csv")) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "請確認網址包含 output=csv (需在 Google 試算表發布為 CSV)",
					path: ["sheetName"],
				});
			}
		}
	});

export type ProcessFormData = z.infer<typeof processFormSchema>;
