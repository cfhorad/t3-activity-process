import { z } from "zod";

export const processFormSchema = z.object({
	name: z.string().min(1, "流程名稱為必填"),
	sheetName: z.string().min(1, "請選擇工作表"),
	type: z.enum(["PROCESS", "CHECK", "WEB"]),
	processDate: z.string().optional().nullable(),
	processMemo: z.string().optional().nullable(),
	iframeCode: z.string().optional().nullable(),
});

export type ProcessFormData = z.infer<typeof processFormSchema>;
