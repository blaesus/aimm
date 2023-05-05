import { prisma } from "@/app/api/shared/prisma";

export async function GET(request: Request) {
  const count = await prisma.repository.count()
  return new Response(`Hello, world from ${count} repositories!`)
}
