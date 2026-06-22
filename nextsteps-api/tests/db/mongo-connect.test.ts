import { describe, expect, it } from 'vitest';
import {
  buildMongoClientOptions,
  isCosmosMongoUri,
  isKeyVaultReference,
  isLocalMongoUri,
  validateMongoUri,
} from '../../src/db/mongo-connect.js';

describe('mongo-connect', () => {
  it('detects Key Vault references', () => {
    expect(isKeyVaultReference('@Microsoft.KeyVault(SecretUri=https://vault/secrets/x/)')).toBe(true);
    expect(isKeyVaultReference('mongodb://127.0.0.1:27017')).toBe(false);
  });

  it('detects local Mongo URIs', () => {
    expect(isLocalMongoUri('mongodb://127.0.0.1:27017')).toBe(true);
    expect(isLocalMongoUri('mongodb://localhost:27017/nextsteps')).toBe(true);
    expect(isLocalMongoUri('mongodb+srv://x.mongocluster.cosmos.azure.com/')).toBe(false);
  });

  it('detects Cosmos URIs and applies client options', () => {
    const uri =
      'mongodb+srv://cluster.global.mongocluster.cosmos.azure.com/?authMechanism=MONGODB-OIDC';
    expect(isCosmosMongoUri(uri)).toBe(true);
    expect(buildMongoClientOptions(uri).retryWrites).toBe(false);
    expect(buildMongoClientOptions('mongodb://127.0.0.1:27017')).toEqual({});
  });

  it('rejects unresolved Key Vault references', () => {
    expect(() =>
      validateMongoUri('@Microsoft.KeyVault(SecretUri=https://vault/secrets/MongoDbUri/)'),
    ).toThrow(/Key Vault reference/);
  });
});
