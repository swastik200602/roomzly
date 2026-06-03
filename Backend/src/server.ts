import { createServer } from "node:http";
import { createApp } from "@/app.js";
import { env } from "@/config/env.js";
import { logger } from "@/lib/logger.js";
import { createSocketServer } from "@/socket/socket.js";

const app = createApp();
const server = createServer(app);

createSocketServer(server);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Roomzly backend listening");
});
