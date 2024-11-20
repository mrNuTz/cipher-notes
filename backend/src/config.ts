import { createConfig } from "express-zod-api";

export const config = createConfig({
  http: {
    listen: 5100,
  },
  cors: true,
});
