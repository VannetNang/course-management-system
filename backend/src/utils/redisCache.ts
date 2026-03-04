import { createClient } from 'redis';
import config from '../config/config';

const redis = createClient();

export const redisCache = async (key: string, cb: Function) => {
  const cachedData = await redis.get(key);

  // Check if already have cached data
  if (cachedData) {
    console.log('Cache Hit');
    return JSON.parse(cachedData);
  }

  // Else, cache new data
  console.log('Cache Miss');
  const freshData = await cb();
  redis.setEx(key, config.redis_expiration, JSON.stringify(freshData));

  return freshData;
};
