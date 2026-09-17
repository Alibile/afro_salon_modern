import { beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
