import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// Readable entries for the audit log (Platform Admin › Recent changes and Activity Log): who did
// what, when, and to which topic, resource, user, school or class.

/** Actions that change platform content or administration (the "important changes"). */
export const ADMIN_ACTION_PREFIXES = ["topic.", "library.", "grade.", "user.", "school.", "settings."] as const;

export const ACTION_GROUPS: Record<string, { label: string; prefixes: string[] }> = {
  content: { label: "Topics & resources", prefixes: ["topic.", "library.", "grade."] },
  users: { label: "Users & schools", prefixes: ["user.", "school.", "teacher."] },
  classes: { label: "Classes & tasks", prefixes: ["classroom.", "group.", "student.", "task.", "assignment.", "review."] },
  settings: { label: "Settings", prefixes: ["settings."] },
};

export function actionWhere(group?: string | null): Prisma.AuditLogWhereInput {
  const prefixes = group && ACTION_GROUPS[group] ? ACTION_GROUPS[group].prefixes : [...ADMIN_ACTION_PREFIXES];
  // Teachers' own lesson orders are not platform changes.
  return { OR: prefixes.map((p) => ({ action: { startsWith: p } })), NOT: { action: "topic.plan" } };
}

const VERB: Record<string, string> = {
  "topic.create": "created",
  "topic.update": "updated",
  "topic.publish": "published",
  "topic.unpublish": "unpublished",
  "topic.archive": "archived",
  "topic.restore": "restored",
  "topic.plan": "lesson order saved",
  "library.create": "created",
  "library.upload": "file uploaded",
  "library.update_meta": "details updated",
  "library.save_draft": "draft saved",
  "library.publish": "published",
  "library.archive": "archived",
  "library.restore": "restored",
  "library.delete": "deleted",
  "library.duplicate": "duplicated",
  "grade.create": "grade created",
  "user.promote_admin": "made administrator",
  "user.revoke_admin": "administrator role removed",
  "user.invite_admin": "invited as administrator",
  "user.move_school": "moved to another school",
  "user.email_verified": "email verified",
  "user.end_sessions": "signed out of every device",
  "school.create": "school created",
  "school.rename": "school renamed",
  "school.merge": "school merged into another",
  "settings.update": "platform settings updated",
  "teacher.signup": "signed up",
  "classroom.create": "class created",
  "classroom.archive": "class archived",
  "classroom.restore": "class restored",
  "classroom.add_coteacher": "co-teacher added",
  "classroom.remove_coteacher": "co-teacher removed",
  "task.assign": "topic assigned",
};

export type ActivityEntry = { id: string; at: string; actor: string; action: string; text: string; kind: "topic" | "resource" | "user" | "school" | "class" | "other"; href: string | null; published: boolean };

type Row = { id: string; actorId: string | null; action: string; entityType: string; entityId: string | null; meta: Prisma.JsonValue; createdAt: Date };

const metaOf = (m: Prisma.JsonValue) => (m && typeof m === "object" && !Array.isArray(m) ? (m as Record<string, unknown>) : {});

/** Loads the names behind the ids of a page of audit rows and turns each row into one readable line. */
export async function describeActivity(rows: Row[]): Promise<ActivityEntry[]> {
  const ids = (type: string, extra: (r: Row) => unknown = () => null) => [
    ...new Set(rows.flatMap((r) => [r.entityType === type ? r.entityId : null, extra(r)]).filter((x): x is string => typeof x === "string")),
  ];
  const resourceIds = ids("LibraryResource", (r) => metaOf(r.meta).resourceId ?? metaOf(r.meta).to);
  const [topics, resources, users, schools, classes] = await Promise.all([
    db.topic.findMany({ where: { id: { in: ids("Topic") } }, select: { id: true, titleEs: true } }),
    db.libraryResource.findMany({ where: { id: { in: resourceIds } }, select: { id: true, title: true, kind: true } }),
    db.user.findMany({ where: { id: { in: [...new Set([...rows.map((r) => r.actorId).filter((x): x is string => !!x), ...ids("User")])] } }, select: { id: true, displayName: true } }),
    db.school.findMany({ where: { id: { in: ids("School") } }, select: { id: true, name: true } }),
    db.classroom.findMany({ where: { id: { in: ids("Classroom") } }, select: { id: true, name: true } }),
  ]);
  const name = <T extends { id: string }>(list: T[], id: string | null | undefined, f: (x: T) => string) => {
    const x = id ? list.find((i) => i.id === id) : undefined;
    return x ? f(x) : null;
  };
  return rows.map((r) => {
    const m = metaOf(r.meta);
    const verb = VERB[r.action] ?? r.action.replace(/^[a-z]+\./, "").replace(/_/g, " ");
    const actor = name(users, r.actorId, (u) => u.displayName) ?? (r.actorId ? "Deleted user" : "System");
    let text = "";
    let kind: ActivityEntry["kind"] = "other";
    let href: string | null = null;
    if (r.entityType === "Topic") {
      kind = "topic";
      const t = name(topics, r.entityId, (x) => x.titleEs) ?? (typeof m.title === "string" ? m.title : "A topic");
      href = r.entityId && topics.some((x) => x.id === r.entityId) ? `/admin/topics/${r.entityId}` : null;
      const resTitle = name(resources, (m.resourceId ?? m.to) as string | undefined, (x) => x.title);
      if (r.action === "topic.add_resource") text = `${resTitle ?? "Resource"} added to ${t}`;
      else if (r.action === "topic.remove_resource") text = `${resTitle ?? "Resource"} removed from ${t}`;
      else if (r.action === "topic.replace_resource") text = `Resource replaced in ${t}`;
      else if (r.action === "topic.add_from_library") text = `Resources added to ${t}`;
      else text = `${t} ${verb}`;
    } else if (r.entityType === "LibraryResource") {
      kind = "resource";
      const t = name(resources, r.entityId, (x) => x.title) ?? "A resource";
      href = r.entityId && resources.some((x) => x.id === r.entityId) ? `/admin/content/${r.entityId}` : null;
      text = `${t} ${verb}${r.action === "library.publish" && typeof m.version === "number" ? ` (version ${m.version})` : ""}`;
    } else if (r.entityType === "User") {
      kind = "user";
      text = `${name(users, r.entityId, (u) => u.displayName) ?? (typeof m.email === "string" ? m.email : "A user")} ${verb}`;
    } else if (r.entityType === "School") {
      kind = "school";
      text = `${name(schools, r.entityId, (s) => s.name) ?? "A school"}: ${verb}`;
    } else if (r.entityType === "Classroom") {
      kind = "class";
      text = `${name(classes, r.entityId, (c) => c.name) ?? "A class"}: ${verb}`;
    } else {
      text = `${r.entityType}: ${verb}`;
    }
    return { id: r.id, at: r.createdAt.toISOString(), actor, action: r.action, text, kind, href, published: r.action.endsWith(".publish") };
  });
}

/** The latest content changes (topics and resources), for the Overview. */
export async function recentContentChanges(take = 5) {
  const rows = await db.auditLog.findMany({
    where: { OR: [{ action: { startsWith: "topic." } }, { action: { startsWith: "library." } }], NOT: { action: { in: ["topic.plan", "library.save_draft"] } } },
    orderBy: { createdAt: "desc" },
    take,
  });
  return describeActivity(rows);
}
