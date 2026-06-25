import { z } from 'zod';
export declare const userRoleSchema: z.ZodEnum<["maverick", "trainer", "ld", "manager"]>;
export declare const nextstepsUserSchema: z.ZodObject<{
    _id: z.ZodString;
    email: z.ZodString;
    fullName: z.ZodString;
    role: z.ZodEnum<["maverick", "trainer", "ld", "manager"]>;
    jobTitle: z.ZodOptional<z.ZodString>;
    designation: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    hexId: z.ZodOptional<z.ZodString>;
    authProvider: z.ZodDefault<z.ZodEnum<["azure", "email"]>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    _id: string;
    email: string;
    fullName: string;
    role: "maverick" | "trainer" | "ld" | "manager";
    authProvider: "email" | "azure";
    createdAt: string;
    updatedAt: string;
    jobTitle?: string | undefined;
    designation?: string | undefined;
    department?: string | undefined;
    hexId?: string | undefined;
}, {
    _id: string;
    email: string;
    fullName: string;
    role: "maverick" | "trainer" | "ld" | "manager";
    createdAt: string;
    updatedAt: string;
    jobTitle?: string | undefined;
    designation?: string | undefined;
    department?: string | undefined;
    hexId?: string | undefined;
    authProvider?: "email" | "azure" | undefined;
}>;
export type NextStepsUser = z.infer<typeof nextstepsUserSchema>;
export declare const roleMappingSchema: z.ZodObject<{
    _id: z.ZodString;
    type: z.ZodEnum<["email", "designation"]>;
    value: z.ZodString;
    role: z.ZodEnum<["maverick", "trainer", "ld", "manager"]>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    _id: string;
    role: "maverick" | "trainer" | "ld" | "manager";
    createdAt: string;
    value: string;
    type: "email" | "designation";
    keywords?: string[] | undefined;
}, {
    _id: string;
    role: "maverick" | "trainer" | "ld" | "manager";
    createdAt: string;
    value: string;
    type: "email" | "designation";
    keywords?: string[] | undefined;
}>;
export type RoleMapping = z.infer<typeof roleMappingSchema>;
export type InsertNextStepsUser = Omit<NextStepsUser, '_id' | 'createdAt' | 'updatedAt'>;
export type InsertRoleMapping = Omit<RoleMapping, '_id' | 'createdAt'>;
