import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().min(1, "電子郵件為必填欄位").email("無效的電子郵件格式"),
	password: z.string().min(8, "密碼太短 (至少 8 個字元)"),
});

export const registerSchema = loginSchema.extend({
	name: z.string().min(1, "姓名為必填欄位"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
