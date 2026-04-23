import { Academy } from "@/lib/types";

export type AcademyWithMeta = Academy & {
  instructor_count: number;
  owner_email: string | null;
};