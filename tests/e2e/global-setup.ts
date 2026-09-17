import { execSync } from "node:child_process";

export default async function globalSetup() {
  execSync("dotenv -e .env.test --override -- prisma migrate deploy", { stdio: "inherit" });
  execSync("dotenv -e .env.test --override -- tsx prisma/seed.ts", { stdio: "inherit" });
  execSync("dotenv -e .env.test --override -- tsx tests/e2e/open-all-day.ts", { stdio: "inherit" });
}
