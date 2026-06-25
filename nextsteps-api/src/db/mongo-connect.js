export const isKeyVaultReference = (uri) => uri.trim().startsWith('@Microsoft.KeyVault');
export const isLocalMongoUri = (uri) => /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(uri.trim());
/** Azure Cosmos DB for MongoDB (shared cluster with Sanctuary). */
export const isCosmosMongoUri = (uri) => {
    const trimmed = uri.trim();
    if (isKeyVaultReference(trimmed) || isLocalMongoUri(trimmed))
        return false;
    return (/^mongodb(\+srv)?:\/\//i.test(trimmed) &&
        (/\.cosmos\.azure\.com/i.test(trimmed) ||
            /\.mongocluster\.cosmos\.azure\.com/i.test(trimmed) ||
            trimmed.includes('authMechanism=MONGODB-OIDC')));
};
export const buildMongoClientOptions = (uri) => {
    if (!isCosmosMongoUri(uri))
        return {};
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
export const isRunningOnAzureAppService = () => Boolean(process.env.WEBSITE_INSTANCE_ID ?? process.env.WEBSITE_SITE_NAME);
export const validateMongoUri = (uri) => {
    const trimmed = uri.trim();
    if (!trimmed) {
        throw new Error('MongoDbUri / MONGODB_URI is not set');
    }
    if (!isKeyVaultReference(trimmed)) {
        return;
    }
    if (!isRunningOnAzureAppService()) {
        throw new Error('MongoDbUri is an Azure Key Vault reference (@Microsoft.KeyVault…). ' +
            'It resolves only on Azure App Service with managed identity and Key Vault access. ' +
            'For local dev, set MongoDbUri=mongodb://127.0.0.1:27017 in .env');
    }
    throw new Error('MONGODB_URI is still an unresolved Key Vault reference (@Microsoft.KeyVault…). ' +
        'App Service should resolve this before Node starts. Enable system-assigned managed ' +
        'identity on the Web App, grant Key Vault Secrets User on the vault, and verify the secret URI.');
};
