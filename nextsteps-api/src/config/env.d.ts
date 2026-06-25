import 'dotenv/config';
export declare const env: {
    readonly NodeEnv: string;
    readonly Port: string;
    readonly CorsOrigin: string;
    readonly JwtSecret: string;
    readonly MongoDbUri: string;
    readonly MongoDbDatabase: string;
    readonly AzureTenantId: string;
    readonly AzureClientId: string;
    readonly AzureClientSecret: string;
    readonly AzureOpenAIEndpoint: string;
    readonly AzureOpenAIKey: string;
    readonly AzureOpenAIDeployment: string;
    readonly AzureOpenAIApiVersion: string;
    readonly AppAdminEmails: string;
    readonly RedisUrl: string;
    readonly RedisEnabled: boolean;
    readonly GraphApiEndpoint: "https://graph.microsoft.com/v1.0";
    readonly AppPublicUrl: string;
    readonly SmtpHost: string;
    readonly SmtpPort: number;
    readonly SmtpSecure: boolean;
    readonly SmtpUser: string;
    readonly SmtpPass: string;
    readonly MailFrom: string;
    /** Dev/corporate proxy: set true to allow self-signed certs on SMTP TLS */
    readonly SmtpTlsInsecure: boolean;
};
