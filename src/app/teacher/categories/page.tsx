import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/categories";
import { requireTeacherPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const { user } = await requireTeacherPage();
  const all = await db.category.findMany({ where: { schoolId: user.schoolId }, include: { _count: { select: { games: true } } }, orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }] });
  const roots = all.filter((c) => !c.parentId);
  const kids = (id: string) => all.filter((c) => c.parentId === id);

  const Row = ({ c, depth }: { c: (typeof all)[number]; depth: number }) => (
    <li className={depth ? "ml-6 border-l-2 border-line pl-4" : ""}>
      <details className="py-2">
        <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3">
          <span className="font-bold">{c.nameEn}</span>
          <span className="text-ink-2">{c.nameEs}</span>
          <span className="text-xs text-muted">{c._count.games} games</span>
          <span className="ml-auto text-xs font-bold text-muted">Edit</span>
        </summary>
        <div className="mt-2 flex flex-wrap items-end gap-3 rounded-xl bg-paper p-3">
          <form action={updateCategory} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={c.id} />
            <Input name="nameEn" defaultValue={c.nameEn} required aria-label="English name" className="w-44 py-1.5" />
            <Input name="nameEs" defaultValue={c.nameEs} required aria-label="Spanish name" className="w-44 py-1.5" lang="es" />
            <Button size="sm" variant="secondary">Save</Button>
          </form>
          {depth === 0 && (
            <form action={createCategory} className="flex flex-wrap gap-2">
              <input type="hidden" name="parentId" value={c.id} />
              <Input name="nameEn" placeholder="Subcategory (EN)" required className="w-40 py-1.5" aria-label="Subcategory English name" />
              <Input name="nameEs" placeholder="Subcategoría (ES)" required className="w-40 py-1.5" lang="es" aria-label="Subcategory Spanish name" />
              <Button size="sm" variant="secondary">Add subcategory</Button>
            </form>
          )}
          <form action={deleteCategory} className="flex items-center gap-2 text-xs">
            <input type="hidden" name="id" value={c.id} />
            <label className="flex items-center gap-1"><input type="checkbox" name="confirm" value="yes" required /> confirm</label>
            <Button size="sm" variant="danger">Delete</Button>
          </form>
        </div>
      </details>
      {kids(c.id).length > 0 && <ul>{kids(c.id).map((k) => <Row key={k.id} c={k} depth={depth + 1} />)}</ul>}
    </li>
  );

  return (
    <>
      <PageHeader eyebrow="Content" title="Categories" subtitle="Bilingual names, fully editable. Deleting a category keeps its games." />
      <Panel className="mb-6">
        <form action={createCategory} className="flex flex-wrap items-end gap-3">
          <Input name="nameEn" placeholder="Category (English)" required className="w-56" aria-label="English name" />
          <Input name="nameEs" placeholder="Categoría (español)" required className="w-56" lang="es" aria-label="Spanish name" />
          <Button>Add category</Button>
        </form>
      </Panel>
      <Panel>
        <ul className="divide-y divide-line">{roots.map((c) => <Row key={c.id} c={c} depth={0} />)}</ul>
      </Panel>
    </>
  );
}
