import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "errors.fullNameMin2").max(80),
  email: z.string().trim().toLowerCase().email("errors.enterValidEmail"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(8, "errors.passwordMin8").max(100),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("errors.enterValidEmail"),
  password: z.string().min(1, "errors.passwordRequired"),
});
export type LoginInput = z.infer<typeof loginSchema>;
