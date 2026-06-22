import type { MongoClientOptions } from 'mongodb';

export const isKeyVaultReference = (uri: string): boolean =>
  uri.trim().startsWith('@Microsoft.KeyVault');

export const isLocalMongoUri = (uri: string): boolean =>
  /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(uri.trim());

/** Azure Cosmos DB for MongoDB (shared cluster with Sanctuary). */
export const isCosmosMongoUri = (uri: string): boolean => {
  const trimmed = uri.trim();
  if (isKeyVaultReference(trimmed) || isLocalMongoUri(trimmed)) return false;
  return (
    /^mongodb(\+srv)?:\/\//i.test(trimmed) &&
    (/\.cosmos\.azure\.com/i.test(trimmed) ||
      /\.mongocluster\.cosmos\.azure\.com/i.test(trimmed) ||
      trimmed.includes('authMechanism=MONGODB-OIDC'))
  );
};

export const buildMongoClientOptions = (uri: string): MongoClientOptions => {
  if (!isCosmosMongoUri(uri)) return {};

  return {
    retryWrites: false,
    retryReads: true,
    maxPoolSize: 50,
    minPoolSize: 5,
    maxIdleTimeMS: 120_000,
    serverSelectionTimeoutMS: 30_000,
    socketTimeoutMS: 60_000,
    connectTimeoutMS: 60_000,
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    directConnection: false,
  };
};

export const validateMongoUri = (uri: string): void => {
  const trimmed = uri.trim();
  if (!trimmed) {
    throw new Error('MongoDbUri / MONGODB_URI is not set');
  }

  if (isKeyVaultReference(trimmed)) {
    throw new Error(
      'MongoDbUri is an Azure Key Vault reference (@Microsoft.KeyVault…). ' +
        'It resolves only on Azure App Service with managed identity and Key Vault access. ' +
        'For local dev, set MongoDbUri=mongodb://127.0.0.1:27017 in .env',
    );
  }
};
