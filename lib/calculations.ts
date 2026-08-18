import type { Course, Semester } from "./types";

export const gradeScale = { A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, D: 1, E: 0 } as const;
export const grades = Object.keys(gradeScale) as (keyof typeof gradeScale)[];
export const isPassed = (course: Course) => course.grade !== "D" && course.grade !== "E";
const courseKey = (name: string) => name.trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");

export function semesterStats(courses: Course[]) {
  const attempted = courses.filter((c) => Number(c.sks) > 0 && c.name.trim());
  const attemptedSks = attempted.reduce((sum, c) => sum + Number(c.sks), 0);
  const passedSks = attempted.filter(isPassed).reduce((sum, c) => sum + Number(c.sks), 0);
  const points = attempted.reduce((sum, c) => sum + Number(c.sks) * gradeScale[c.grade], 0);
  return { sks: passedSks, attemptedSks, points, ips: attemptedSks ? points / attemptedSks : 0 };
}

// The latest attempt replaces an earlier attempt with the same normalized name.
// D/E affect GPA, but do not add to passed credits.
export function cumulativeStats(semesters: Semester[]) {
  const selected = new Map<string, Course>();
  semesters.forEach((semester) => semester.courses.forEach((course) => {
    if (Number(course.sks) <= 0 || !course.name.trim()) return;
    selected.set(courseKey(course.name), course);
  }));
  const courses = [...selected.values()];
  const attemptedSks = courses.reduce((sum, c) => sum + Number(c.sks), 0);
  const sks = courses.filter(isPassed).reduce((sum, c) => sum + Number(c.sks), 0);
  const points = courses.reduce((sum, c) => sum + Number(c.sks) * gradeScale[c.grade], 0);
  return { sks, attemptedSks, points, ipk: attemptedSks ? points / attemptedSks : 0 };
}
