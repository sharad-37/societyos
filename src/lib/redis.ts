// src/lib/redis.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Redis Client ─────────────────────────────────────────────
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Dev mode check ───────────────────────────────────────────
const isDev = process.env.NODE_ENV === "development";

// ─── Rate Limiters ────────────────────────────────────────────

export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(isDev ? 1000 : 100, "1 m"),
  prefix: "rl:api",
});

export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(isDev ? 100 : 10, "1 h"),
  prefix: "rl:auth",
});

export const otpRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(isDev ? 50 : 3, "1 h"),
  prefix: "rl:otp",
});

// ─── OTP Store ────────────────────────────────────────────────
const OTP_PREFIX = "otp:";
const OTP_EXPIRY = 10 * 60; // 10 minutes in seconds

export const otpStore = {
  // Save OTP to Redis
  async set(email: string, otp: string): Promise<void> {
    const key = `${OTP_PREFIX}${email}`;
    await redis.setex(
      key,
      OTP_EXPIRY,
      JSON.stringify({
        otp,
        attempts: 0,
        createdAt: Date.now(),
      }),
    );
  },

  // Get OTP from Redis
  async get(email: string): Promise<{
    otp: string;
    attempts: number;
    createdAt: number;
  } | null> {
    const key = `${OTP_PREFIX}${email}`;
    const data = await redis.get<string>(key);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  },

  // Increment failed attempts
  async incrementAttempts(email: string): Promise<number> {
    const key = `${OTP_PREFIX}${email}`;
    const data = await otpStore.get(email);
    if (!data) return 0;
    const updated = { ...data, attempts: data.attempts + 1 };
    const ttl = await redis.ttl(key);
    await redis.setex(key, ttl > 0 ? ttl : OTP_EXPIRY, JSON.stringify(updated));
    return updated.attempts;
  },

  // Delete after successful verify
  async delete(email: string): Promise<void> {
    await redis.del(`${OTP_PREFIX}${email}`);
  },
};
