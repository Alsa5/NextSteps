import { randomUUID } from 'crypto';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
export const createRoleMappingRepository = () => {
    const collection = () => getDb().collection(NEXTSTEPS_COLLECTIONS.ROLE_MAPPINGS);
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
                if (existing)
                    continue;
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
export const DEFAULT_DESIGNATION_MAPPINGS = [
    {
        type: 'designation',
        value: 'manager',
        role: 'manager',
        keywords: ['manager', 'delivery manager', 'people manager', 'dm', 'head'],
    },
    {
        type: 'designation',
        value: 'ld',
        role: 'ld',
        keywords: ['l&d', 'learning', 'talent development', 'ld executive', 'learning and development'],
    },
    {
        type: 'designation',
        value: 'trainer',
        role: 'trainer',
        keywords: ['trainer', 'instructor', 'facilitator', 'coach', 'training'],
    },
    {
        type: 'designation',
        value: 'maverick',
        role: 'maverick',
        keywords: ['trainee', 'intern', 'associate', 'maverick', 'fresher', 'graduate'],
    },
];
