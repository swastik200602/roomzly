import pino from "pino";
import { env, isProduction } from "@/config/env.js";

export const logger = pino({
  level: isProduction ? "info" : "debug",
  base: {
    service: "roomzly-backend",
    version: env.APP_VERSION
  },
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard"
        }
      }
});
