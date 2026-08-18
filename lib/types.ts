export type Grade = "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "E";
export type Course = { id: string; name: string; sks: number | ""; grade: Grade };
export type Semester = { id: number; courses: Course[] };
export type AcademicData = { targetSks: number; semesters: Semester[] };
export type UserProfile = { nim: string; name: string; role: "student" | "admin"; active: boolean };
