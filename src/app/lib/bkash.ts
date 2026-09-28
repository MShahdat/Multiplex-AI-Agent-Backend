import config from "../config/index.js";
import { redisClient } from "./redis.js";


const prefix = 'multiplex'

export const getBkashIdToken = async () => {
  const redisIdTokenKey = `${prefix}_bkash: id_token`;
  const redisRefreshKey = `${prefix}_bkash: refresh_token`;

  const redisIdToken = await redisClient.get(redisIdTokenKey);
  const redisIdTokenTTL = await redisClient.ttl(redisIdTokenKey);

  const redisRefreshToken = await redisClient.get(redisRefreshKey);
  const redisRefreshTokenTTL = await redisClient.ttl(redisRefreshKey);

  console.log(
    "redis id token ttl and refres token ttl ",
    redisIdTokenTTL,
    redisRefreshTokenTTL,
  );

  if (redisIdToken && redisIdTokenTTL > 600) {
    return redisIdToken;
  }

  if (
    redisIdTokenTTL <= 600 &&
    redisRefreshToken &&
    redisRefreshTokenTTL > 600
  ) {
    const res = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config.bkash_username,
          password: config.bkash_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
          refresh_token: redisRefreshToken,
        }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      await redisClient.set(redisIdTokenKey, data.id_token, {
        expiration: {
          type: "EX",
          value: 60 * 60,
        },
      });
      return data.id_token;
    }
  }

  const res = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/token/grant`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: config.bkash_username,
        password: config.bkash_password,
      },
      body: JSON.stringify({
        app_key: config.bkash_app_key,
        app_secret: config.bkash_app_secret,
      }),
    },
  );

  if (res.ok) {
    const data = await res.json();

    await redisClient.set(redisIdTokenKey, data.id_token, {
      expiration: {
        type: "EX",
        value: 60 * 60,
      },
    });
    await redisClient.set(redisRefreshKey, data.refresh_token, {
      expiration: {
        type: "EX",
        value: 60 * 60 * 24 * 28,
      },
    });

    return data.id_token;
  }

  return null;
};
