import { Redis } from 'ioredis';

export const isRedisAvailable = async (redisUrl: string): Promise<boolean> => {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    lazyConnect: true,
  });

  try {
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return pong === 'PONG';
  } catch {
    try {
      client.disconnect();
    } catch {
      // ignore cleanup errors
    }
    return false;
  }
};
