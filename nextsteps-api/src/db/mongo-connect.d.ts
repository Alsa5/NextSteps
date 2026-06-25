import type { MongoClientOptions } from 'mongodb';
export declare const isKeyVaultReference: (uri: string) => boolean;
export declare const isLocalMongoUri: (uri: string) => boolean;
/** Azure Cosmos DB for MongoDB (shared cluster with Sanctuary). */
export declare const isCosmosMongoUri: (uri: string) => boolean;
export declare const buildMongoClientOptions: (uri: string) => MongoClientOptions;
export declare const isRunningOnAzureAppService: () => boolean;
export declare const validateMongoUri: (uri: string) => void;
