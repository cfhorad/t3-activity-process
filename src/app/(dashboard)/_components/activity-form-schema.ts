import { z } from "zod";

export const activityFormSchema = z.object({
	name: z.string().min(1, "活動名稱為必填"),
	googleSheetId: z.string().min(1, "Google 試算表 ID 為必填"),
	activityDate: z.string().min(1, "活動日期為必填"),
	areaId: z.string().min(1, "營運分會為必填"),
	activityMemo: z.string().optional().nullable(),
});

export type ActivityFormData = z.infer<typeof activityFormSchema>;
