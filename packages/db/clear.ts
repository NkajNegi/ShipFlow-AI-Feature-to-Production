import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  await prisma.workspace.updateMany({
    data: {
      githubInstallationId: null,
      githubAccountLogin: null
    }
  })
}
main()
