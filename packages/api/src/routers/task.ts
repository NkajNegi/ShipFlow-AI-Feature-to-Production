import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertWorkspaceMember } from "../lib/access";

export const taskRouter = createTRPCRouter({
  listByWorkspace: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        assigneeId: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId
      );

      const where: any = {
        AND: [
          {
            OR: [
              { project: { workspaceId: input.workspaceId } },
              { prd: { featureRequest: { project: { workspaceId: input.workspaceId } } } },
            ],
          }
        ]
      };

      if (input.projectId) {
        where.AND.push({
          OR: [
            { projectId: input.projectId },
            { prd: { featureRequest: { projectId: input.projectId } } },
          ]
        });
      }
      if (input.assigneeId) {
        where.AND.push({ assigneeId: input.assigneeId });
      }
      if (input.search) {
        where.AND.push({
          OR: [
            { title: { contains: input.search, mode: "insensitive" } },
            { description: { contains: input.search, mode: "insensitive" } },
          ]
        });
      }

      return ctx.prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          project: { select: { id: true, name: true } },
          labels: { include: { label: true } },
          comments: { 
            include: { author: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' }
          },
          prd: {
            include: {
              featureRequest: {
                select: {
                  id: true,
                  title: true,
                  project: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      });
    }),

  getDashboardMetrics: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceMember(ctx.prisma, ctx.session.user.id, input.workspaceId);

      const whereBase = {
        OR: [
          { project: { workspaceId: input.workspaceId } },
          { prd: { featureRequest: { project: { workspaceId: input.workspaceId } } } },
        ]
      };

      // 1. My open tasks
      const myTasks = await ctx.prisma.task.findMany({
        where: {
          AND: [whereBase, { assigneeId: ctx.session.user.id, status: { not: "DONE" } }]
        },
        take: 10,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          project: { select: { name: true } },
          prd: { select: { featureRequest: { select: { title: true } } } }
        }
      });

      // 2. Overdue tasks
      const now = new Date();
      const overdueTasks = await ctx.prisma.task.findMany({
        where: {
          AND: [whereBase, { dueDate: { lt: now }, status: { not: "DONE" } }]
        },
        take: 10,
        orderBy: { dueDate: "asc" },
        include: {
          assignee: { select: { name: true, image: true } },
          project: { select: { name: true } }
        }
      });

      // 3. Status distribution
      const allTasks = await ctx.prisma.task.findMany({
        where: whereBase,
        select: { status: true }
      });
      const statusCounts = allTasks.reduce((acc: Record<string, number>, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});

      return { myTasks, overdueTasks, statusCounts, totalTasks: allTasks.length };
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string(),
        status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).default("TODO"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        assigneeId: z.string().optional(),
        dueDate: z.string().optional(),
        labelIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
        select: { workspaceId: true },
      });
      if (project) {
        await assertWorkspaceMember(
          ctx.prisma,
          ctx.session.user.id,
          project.workspaceId
        );
      }
      return ctx.prisma.task.create({
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          assigneeId: input.assigneeId,
          projectId: input.projectId,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          labels: input.labelIds ? {
            create: input.labelIds.map(id => ({ labelId: id }))
          } : undefined
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        assigneeId: z.string().nullable().optional(),
        projectId: z.string().nullable().optional(),
        position: z.number().optional(),
        dueDate: z.string().nullable().optional(),
        labelIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.taskId },
        include: {
          project: { select: { workspaceId: true } },
          prd: {
            select: {
              featureRequest: { select: { project: { select: { workspaceId: true } } } },
            },
          },
        },
      });

      if (task) {
        const workspaceId =
          task.project?.workspaceId ||
          task.prd?.featureRequest?.project?.workspaceId;
        if (workspaceId) {
          await assertWorkspaceMember(
            ctx.prisma,
            ctx.session.user.id,
            workspaceId
          );
        }
      }

      return ctx.prisma.task.update({
        where: { id: input.taskId },
        data: {
          status: input.status,
          priority: input.priority,
          title: input.title,
          description: input.description,
          assigneeId: input.assigneeId,
          projectId: input.projectId,
          position: input.position,
          dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,
          ...(input.labelIds && {
            labels: {
              deleteMany: {},
              create: input.labelIds.map(id => ({ labelId: id }))
            }
          })
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.taskId },
        include: {
          project: { select: { workspaceId: true } },
          prd: { select: { featureRequest: { select: { project: { select: { workspaceId: true } } } } } }
        },
      });
      if (task) {
        const workspaceId = task.project?.workspaceId || task.prd?.featureRequest?.project?.workspaceId;
        if (workspaceId) {
          await assertWorkspaceMember(ctx.prisma, ctx.session.user.id, workspaceId);
        }
      }
      return ctx.prisma.task.delete({ where: { id: input.taskId } });
    }),

  syncGithub: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceMember(
        ctx.prisma,
        ctx.session.user.id,
        input.workspaceId
      );
      // In a full implementation, this would iterate over Repositories in the workspace,
      // fetch recent PRs from GitHub, and update task statuses.
      // For now, it returns success to unblock the UI.
      return { success: true, synced: 0 };
    }),
});
