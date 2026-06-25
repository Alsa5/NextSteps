import 'dotenv/config';
function getEnv(primary, legacy) {
    const value = process.env[primary];
    if (value !== undefined && value !== '')
        return value;
    if (legacy)
        return process.env[legacy];
    return undefined;
}
export const env = {
    NodeEnv: getEnv('NodeEnv', 'NODE_ENV') ?? 'development',
    Port: getEnv('Port', 'PORT') ?? '3001',
    CorsOrigin: getEnv('CorsOrigin', 'CORS_ORIGIN') ?? 'http://localhost:5173',
    JwtSecret: getEnv('JwtSecret', 'JWT_SECRET') ?? 'dev-only-change-me',
    MongoDbUri: getEnv('MongoDbUri', 'MONGODB_URI') ?? 'mongodb://127.0.0.1:27017',
    MongoDbDatabase: getEnv('MongoDbDatabase', 'MONGODB_DATABASE') ?? 'nextsteps',
    AzureTenantId: getEnv('AzureTenantId', 'AZURE_TENANT_ID') ?? '',
    AzureClientId: getEnv('AzureClientId', 'AZURE_CLIENT_ID') ?? '',
    AzureClientSecret: getEnv('AzureClientSecret', 'AZURE_CLIENT_SECRET') ?? '',
    AzureOpenAIEndpoint: getEnv('AzureOpenAIEndpoint', 'AZURE_OPENAI_ENDPOINT') ?? '',
    AzureOpenAIKey: getEnv('AzureOpenAIKey', 'AZURE_OPENAI_KEY') ?? '',
    AzureOpenAIDeployment: getEnv('AzureOpenAIDeployment', 'AZURE_OPENAI_DEPLOYMENT') ?? 'gpt-5',
    AzureOpenAIApiVersion: getEnv('AzureOpenAIApiVersion', 'AZURE_OPENAI_API_VERSION') ?? '2025-01-01-preview',
    AppAdminEmails: getEnv('AppAdminEmails', 'APP_ADMIN_EMAILS') ?? '',
    RedisUrl: getEnv('RedisUrl', 'REDIS_URL') ?? 'redis://127.0.0.1:6379',
    RedisEnabled: getEnv('RedisEnabled', 'REDIS_ENABLED') !== 'false',
    GraphApiEndpoint: 'https://graph.microsoft.com/v1.0',
    AppPublicUrl: getEnv('AppPublicUrl', 'APP_PUBLIC_URL') ?? getEnv('CorsOrigin', 'CORS_ORIGIN') ?? 'http://localhost:5173',
    SmtpHost: getEnv('SmtpHost', 'SMTP_HOST') ?? '',
    SmtpPort: Number(getEnv('SmtpPort', 'SMTP_PORT') ?? '587'),
    SmtpSecure: getEnv('SmtpSecure', 'SMTP_SECURE') === 'true',
    SmtpUser: getEnv('SmtpUser', 'SMTP_USER') ?? '',
    SmtpPass: getEnv('SmtpPass', 'SMTP_PASS') ?? '',
    MailFrom: getEnv('MailFrom', 'MAIL_FROM') ?? '',
    /** Dev/corporate proxy: set true to allow self-signed certs on SMTP TLS */
    SmtpTlsInsecure: getEnv('SmtpTlsInsecure', 'SMTP_TLS_INSECURE') === 'true',
};
