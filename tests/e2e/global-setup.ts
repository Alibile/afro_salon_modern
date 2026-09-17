import { execSync } from "node:child_process";

export default async function globalSetup() {
  execSync("dotenv -e .env.test -- prisma migrate deploy", { stdio: "inherit" });
  execSync("dotenv -e .env.test -- tsx prisma/seed.ts", { stdio: "inherit" });
  execSync("dotenv -e .env.test -- tsx tests/e2e/open-all-day.ts", { stdio: "inherit" });
}
