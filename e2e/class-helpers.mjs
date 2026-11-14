// Shared class setup for the e2e tests, using the "Add Students" pages of the class.
// classUrl is the class page (/teacher/classes/<id>).

/** Adds a level under "Levels" on the class page. */
export async function addLevel(page, classUrl, name) {
  if (page.url() !== classUrl) await page.goto(classUrl);
  await page.locator("summary:has-text('Levels')").click();
  await page.fill('input[aria-label="New level"]', name);
  await page.click("button:text-is('Add level')");
  await page.waitForSelector(`p:text-is('${name}')`);
}

/** Creates an empty group (Create Group page), in the given level when there is more than one. */
export async function addGroup(page, classUrl, name, level) {
  await page.goto(`${classUrl}/groups/new`);
  await page.fill("#group-name", name);
  if (level && (await page.locator("#group-level").count())) await page.selectOption("#group-level", { label: level });
  await page.click("button:text-is('Create group')");
  await page.waitForURL(classUrl);
  await page.waitForSelector(`a:has-text('${name}')`);
}

/** Adds one student (Add Student page) and returns the PIN shown once. */
export async function addStudent(page, classUrl, firstName, { initial, group, loginType } = {}) {
  if (!page.url().endsWith("/students/new")) await page.goto(`${classUrl}/students/new`);
  await page.fill('input[aria-label="First name"]', firstName);
  if (initial) await page.fill('input[aria-label="Last initial"]', initial);
  if (group) await page.selectOption('select[aria-label="Group"]', { label: group });
  if (loginType) await page.selectOption('select[aria-label="Login Type"]', loginType);
  await page.click("button:text-is('Add student')");
  return (await page.locator(`[role=status]:has-text('${firstName}') [data-testid=new-secret]`).textContent()).trim();
}
