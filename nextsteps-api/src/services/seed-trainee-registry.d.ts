import type { TraineeRegistryRepository } from '../repositories/trainee-registry-repository.js';
/** Mirrors frontend ldTraineeStore defaults — queue blocked, roster allowed. */
export declare const buildTraineeSeedEntries: () => {
    email: string;
    fullName: string;
    batch: string | null;
    status: string;
    externalId: string;
}[];
export declare const seedTraineeRegistry: (registry: TraineeRegistryRepository) => Promise<void>;
