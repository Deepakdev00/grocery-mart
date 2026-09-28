import { definePrismaConfig } from "prisma/config";

export default definePrismaConfig({
  orm: {
    adapter: {
      type: "postgresql",
    },
  },
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});
