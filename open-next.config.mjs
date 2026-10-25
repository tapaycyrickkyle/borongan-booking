import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const openNextConfig = {
  ...defineCloudflareConfig(),
  buildCommand: "npm run build:next",
};

export default openNextConfig;
