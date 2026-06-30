const fs = require('fs');
let schema = fs.readFileSync('packages/db/prisma/schema.prisma', 'utf8');

const enums = `
enum PlanTier {
  FREE
  PRO
}

enum NotifyType {
  SLACK
  DISCORD
}

enum WorkspaceRole {
  ADMIN
  LEAD
  MEMBER
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  REVOKED
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
}

enum FeatureSource {
  UI
  EMAIL
  TICKET
  API
  SLACK
}

enum FeatureStatus {
  DISCOVERY
  GENERATING_PRD
  PLANNING
  PLANNED
  IN_PROGRESS
  IN_REVIEW
  FIX_NEEDED
  APPROVED
  SHIPPED
  REJECTED
}

enum JobStatus {
  PENDING
  COMPLETED
  FAILED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum PullRequestState {
  OPEN
  CLOSED
  MERGED
}

enum WorkflowStatus {
  RUNNING
  COMPLETED
  FAILED
}

enum CodegenStatus {
  PENDING
  DRAFTING
  CRITIQUING
  READY
  PUSHED
  FAILED
}

enum ReviewStatus {
  PENDING
  APPROVED
  CHANGES_REQUESTED
}
`;

// Replacements
schema = schema.replace(/planTier\s+String\s+@default\("FREE"\)/, 'planTier  PlanTier @default(FREE)');
schema = schema.replace(/notifyType\s+String\?\s+@map\("notify_type"\)/, 'notifyType  NotifyType? @map("notify_type")');
schema = schema.replace(/role\s+String\s+@default\("MEMBER"\)/g, 'role      WorkspaceRole @default(MEMBER)');
schema = schema.replace(/status\s+String\s+@default\("PENDING"\) \/\/ PENDING, ACCEPTED, REVOKED/, 'status      InvitationStatus @default(PENDING)');
schema = schema.replace(/plan\s+String\s+@default\("FREE"\)/, 'plan      PlanTier @default(FREE)');
schema = schema.replace(/status\s+String\s+@default\("ACTIVE"\)/, 'status    SubscriptionStatus @default(ACTIVE)');
schema = schema.replace(/source\s+String\s+@default\("UI"\)/, 'source    FeatureSource @default(UI)');
schema = schema.replace(/status\s+String\s+@default\("DISCOVERY"\)/, 'status    FeatureStatus @default(DISCOVERY)');
schema = schema.replace(/readinessStatus\s+String\?\s+@map\("readiness_status"\)/, 'readinessStatus    JobStatus?   @map("readiness_status")');
schema = schema.replace(/status\s+String\s+@default\("TODO"\)/, 'status    TaskStatus @default(TODO)');
schema = schema.replace(/priority\s+String\s+@default\("MEDIUM"\)/, 'priority  TaskPriority @default(MEDIUM)');
schema = schema.replace(/status\s+String\s+@default\("PENDING"\)\n\s+summary/, 'status        JobStatus   @default(PENDING)\n  summary'); // CommitReview status
schema = schema.replace(/state\s+String\s+@default\("OPEN"\)/, 'state     PullRequestState  @default(OPEN)');
schema = schema.replace(/status\s+String\s+@default\("RUNNING"\)/, 'status    WorkflowStatus   @default(RUNNING)');
schema = schema.replace(/status\s+String\s+@default\("PENDING"\)\n\s+\/\/ \{ files/, 'status           CodegenStatus  @default(PENDING)\n  // { files'); // CodegenRun status
schema = schema.replace(/status\s+String\s+@default\("PENDING"\)\n\s+summary/, 'status        ReviewStatus   @default(PENDING)\n  summary'); // Review status

fs.writeFileSync('packages/db/prisma/schema.prisma', schema + enums);
console.log('Schema modified!');
