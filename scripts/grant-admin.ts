// Gives LaxtroSpeak administrator access to an email, through the server process in
// src/lib/admin-grant.ts (grantAdmin):
//   verified account → ADMIN now · unverified → verification email, ADMIN once verified ·
//   no account → admin invitation email.
// Usage: npm run admin:grant -- someone@example.com   (uses DATABASE_URL/DIRECT_URL, RESEND_*)
import { grantAdmin } from "../src/lib/admin-grant";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run admin:grant -- <email>");
  process.exit(1);
}
grantAdmin(email)
  .then((r) => {
    console.log(`admin:grant ${email.replace(/(.).*(@.*)/, "$1***$2")} → ${r}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
