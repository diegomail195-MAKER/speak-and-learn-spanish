import type { ReactNode } from "react";
import { signOut } from "@/lib/actions/auth";
import { VerifyBanner } from "./VerifyBanner";
import { WorkspaceFrame, type Workspace, type WsLink } from "./WorkspaceFrame";

// Navigation of each workspace. Pages outside the list (videos, editors…) keep their own links.
const ADMIN_LINKS: WsLink[] = [
  { href: "/admin", label: "Overview", icon: "home", exact: true },
  { href: "/admin/library", label: "Content Library", icon: "book" },
  { href: "/admin/topics", label: "Topics", icon: "layers" },
  { href: "/admin/content", label: "Resources", icon: "file" },
  { href: "/admin/users", label: "Users & Schools", icon: "users" },
  { href: "/admin/settings", label: "Settings", icon: "gear", match: ["/admin/grades"] },
  { href: "/admin/activity", label: "Activity Log", icon: "clock" },
];

const TEACHER_LINKS: WsLink[] = [
  { href: "/teacher", label: "Dashboard", icon: "home", exact: true },
  { href: "/teacher/classes", label: "My Classes", icon: "users" },
  { href: "/teacher/library", label: "Library", icon: "book" },
  { href: "/teacher/assignments", label: "My Assignments", icon: "clipboard", match: ["/teacher/tasks"] },
  { href: "/teacher/my-activities", label: "My Activities", icon: "bolt", match: ["/teacher/games"] },
  { href: "/teacher/progress", label: "Progress", icon: "chart" },
  { href: "/teacher/account", label: "My Account", icon: "user", match: ["/teacher/billing"] },
];

const TEACHER_EXTRA: WsLink[] = [
  { href: "/teacher/videos", label: "Videos", icon: "video" },
  { href: "/teacher/games/new", label: "Create activity", icon: "plus", exact: true },
];

export function WorkspaceShell({
  workspace,
  user,
  school,
  children,
}: {
  workspace: Workspace;
  user: { displayName: string; email: string | null; emailVerifiedAt: Date | null; role: string; teacher: unknown };
  school: string;
  children: ReactNode;
}) {
  // Both workspaces only for administrators (role ADMIN, given by the server process in
  // src/lib/auth/admin-role.ts) that also have their teacher profile.
  const available: Workspace[] = user.role === "ADMIN" && user.teacher ? ["admin", "teacher"] : [workspace];
  return (
    <WorkspaceFrame
      workspace={workspace}
      available={available}
      title={workspace === "admin" ? "Platform Admin" : "Teacher Dashboard"}
      links={workspace === "admin" ? ADMIN_LINKS : TEACHER_LINKS}
      extraLinks={workspace === "teacher" ? TEACHER_EXTRA : []}
      user={{ name: user.displayName, email: user.email, school }}
      accountHref={user.teacher ? "/teacher/account" : null}
      signOut={signOut}
      banner={user.email && !user.emailVerifiedAt ? <VerifyBanner email={user.email} /> : null}
    >
      {children}
    </WorkspaceFrame>
  );
}
