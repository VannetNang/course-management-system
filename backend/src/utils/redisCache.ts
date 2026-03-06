import { createClient } from 'redis';
import config from '../config/config';

export const redis = createClient();

// Error message
redis.on('error', (err) => console.log('Redis Client Error', err));

// Redis connection
redis.connect();

export const redisCache = async (
  key: string,
  cb: Function,
  expiration: number = config.redis_expiration,
) => {
  const cachedData = await redis.get(key);

  // Check if already have cached data
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // Else, cache new data
  const freshData = await cb();
  redis.setEx(key, expiration, JSON.stringify(freshData));

  return freshData;
};
