import { createClient } from 'redis';
import config from '../config/index.js';

export const redisClient = createClient({
  username: config.radis_name,
  password: config.radis_password,
  socket: {
    host: config.radis_host,
    port: Number(config.radis_port),
  },
});
