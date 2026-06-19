import { randomUUID } from 'crypto';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
import type { RoleMapping } from '../db/schemas.js';
import type { UserRole } from '../types/auth.js';

export interface RoleMappingRepository {
  findByEmail(email: string): Promise<RoleMapping | null>;
  findAll(): Promise<RoleMapping[]>;
  seedDefaults(defaults: Omit<RoleMapping, '_id' | 'createdAt'>[]): Promise<void>;
}

export const createRoleMappingRepository = (): RoleMappingRepository => {
  const collection = () =>
    getDb().collection<RoleMapping>(NEXTSTEPS_COLLECTIONS.ROLE_MAPPINGS);

  return {
    async findByEmail(email) {
      const normalized = email.trim().toLowerCase();
      return collection().findOne({ type: 'email', value: normalized });
    },

    async findAll() {
      return collection().find({}).toArray();
    },

    async seedDefaults(defaults) {
      const now = new Date().toISOString();
      for (const mapping of defaults) {
        const existing = await collection().findOne({
          type: mapping.type,
          value: mapping.value.toLowerCase(),
        });
        if (existing) continue;

        await collection().insertOne({
          _id: randomUUID(),
          ...mapping,
          value: mapping.type === 'email' ? mapping.value.toLowerCase() : mapping.value,
          createdAt: now,
        });
      }
    },
  };
};

export const DEFAULT_DESIGNATION_MAPPINGS: Omit<RoleMapping, '_id' | 'createdAt'>[] = [
  {
    type: 'designation',
    value: 'manager',
    role: 'manager' as UserRole,
    keywords: ['manager', 'delivery manager', 'people manager', 'dm', 'head'],
  },
  {
    type: 'designation',
    value: 'ld',
    role: 'ld' as UserRole,
    keywords: ['l&d', 'learning', 'talent development', 'ld executive', 'learning and development'],
  },
  {
    type: 'designation',
    value: 'trainer',
    role: 'trainer' as UserRole,
    keywords: ['trainer', 'instructor', 'facilitator', 'coach', 'training'],
  },
  {
    type: 'designation',
    value: 'maverick',
    role: 'maverick' as UserRole,
    keywords: ['trainee', 'intern', 'associate', 'maverick', 'fresher', 'graduate'],
  },
];
