import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/signup", priority: 0.8 },
    { path: "/student", priority: 0.6 },
    { path: "/login", priority: 0.5 },
    { path: "/privacy", priority: 0.4 },
  ];
  return pages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
