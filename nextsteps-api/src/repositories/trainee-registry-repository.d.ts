export interface TraineeRegistryEntry {
    _id: string;
    email: string;
    fullName: string;
    batch: string | null;
    status: string;
    signInEligible: boolean;
    externalId?: string;
    updatedAt: string;
}
export interface TraineeRegistryUpsert {
    email: string;
    fullName: string;
    batch: string | null;
    status: string;
    externalId?: string;
}
export interface TraineeRegistryRepository {
    findByEmail(email: string): Promise<TraineeRegistryEntry | null>;
    upsert(entry: TraineeRegistryUpsert): Promise<TraineeRegistryEntry>;
    upsertMany(entries: TraineeRegistryUpsert[]): Promise<number>;
}
export declare const isTraineeSignInEligible: (batch: string | null | undefined) => boolean;
export declare const createTraineeRegistryRepository: () => TraineeRegistryRepository;
