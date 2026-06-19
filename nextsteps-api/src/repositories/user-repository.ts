import { randomUUID } from 'crypto';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
import type { NextStepsUser, InsertNextStepsUser } from '../db/schemas.js';
import type { UserRole } from '../types/auth.js';

export interface UserRepository {
  findByEmail(email: string): Promise<NextStepsUser | null>;
  findById(id: string): Promise<NextStepsUser | null>;
  upsertUser(
    email: string,
    data: Omit<InsertNextStepsUser, 'email'>,
  ): Promise<NextStepsUser>;
  updateRole(email: string, role: UserRole): Promise<NextStepsUser | null>;
}

export const createUserRepository = (): UserRepository => {
  const collection = () => getDb().collection<NextStepsUser>(NEXTSTEPS_COLLECTIONS.USERS);

  return {
    async findByEmail(email) {
      const normalized = email.trim().toLowerCase();
      return collection().findOne({
        email: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
    },

    async findById(id) {
      return collection().findOne({ _id: id });
    },

    async upsertUser(email, data) {
      const normalized = email.trim().toLowerCase();
      const now = new Date().toISOString();
      const existing = await this.findByEmail(normalized);

      if (existing) {
        const updated: NextStepsUser = {
          ...existing,
          ...data,
          email: normalized,
          updatedAt: now,
        };
        await collection().updateOne({ _id: existing._id }, { $set: updated });
        return updated;
      }

      const user: NextStepsUser = {
        _id: randomUUID(),
        email: normalized,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      await collection().insertOne(user);
      return user;
    },

    async updateRole(email, role) {
      const user = await this.findByEmail(email);
      if (!user) return null;
      const now = new Date().toISOString();
      await collection().updateOne({ _id: user._id }, { $set: { role, updatedAt: now } });
      return { ...user, role, updatedAt: now };
    },
  };
};
