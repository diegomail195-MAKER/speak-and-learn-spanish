import bcrypt from "bcryptjs";

export const hashSecret = (plain: string) => bcrypt.hash(plain, 12);
export const verifySecret = (plain: string, hash: string) => bcrypt.compare(plain, hash);
