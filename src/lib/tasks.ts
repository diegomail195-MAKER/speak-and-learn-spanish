// Pure helpers for "Assign Task".

export type GroupInfo = { id: string; memberIds: string[] };

/**
 * Recipients for one task. A student chosen individually who is also in a chosen group is
 * dropped from the individual list, so each student gets the task exactly once.
 */
export function dedupeRecipients(groups: GroupInfo[], studentIds: string[]) {
  const viaGroup = new Set(groups.flatMap((g) => g.memberIds));
  const individual = [...new Set(studentIds)].filter((id) => !viaGroup.has(id));
  const covered = new Set([...viaGroup, ...individual]);
  return { groupIds: [...new Set(groups.map((g) => g.id))], studentIds: individual, dropped: [...new Set(studentIds)].filter((id) => viaGroup.has(id)), studentCount: covered.size, allStudentIds: [...covered] };
}
