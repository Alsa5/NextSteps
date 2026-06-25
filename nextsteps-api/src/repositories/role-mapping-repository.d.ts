import type { RoleMapping } from '../db/schemas.js';
export interface RoleMappingRepository {
    findByEmail(email: string): Promise<RoleMapping | null>;
    findAll(): Promise<RoleMapping[]>;
    seedDefaults(defaults: Omit<RoleMapping, '_id' | 'createdAt'>[]): Promise<void>;
}
export declare const createRoleMappingRepository: () => RoleMappingRepository;
export declare const DEFAULT_DESIGNATION_MAPPINGS: Omit<RoleMapping, '_id' | 'createdAt'>[];
