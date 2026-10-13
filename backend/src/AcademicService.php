<?php
declare(strict_types=1);
namespace App;
final class AcademicService
{
    public function __construct(private AcademicRepository $repository) {}
    public static function text(array $data, string $key): string
    {
        $value = $data[$key] ?? null;
        if (!is_string($value) || trim($value) === "" || strlen($value) > 120) {
            throw new HttpError(
                422,
                "$key must contain between 1 and 120 characters.",
            );
        }
        return trim($value);
    }
    public static function integer(
        array $data,
        string $key,
        int $max = 2147483647,
    ): int {
        $value = $data[$key] ?? null;
        if (!is_int($value) || $value < 1 || $value > $max) {
            throw new HttpError(
                422,
                "$key must be an integer between 1 and $max.",
            );
        }
        return $value;
    }
    public function createStudent(array $data): array
    {
        return $this->repository->query(
            "INSERT INTO students (name, major, semester) VALUES (?, ?, ?) RETURNING *",
            [
                self::text($data, "name"),
                self::text($data, "major"),
                self::integer($data, "semester", 12),
            ],
        )[0];
    }
    public function createCourse(array $data): array
    {
        return $this->repository->query(
            "INSERT INTO courses (name, instructor, capacity) VALUES (?, ?, ?) RETURNING *",
            [
                self::text($data, "name"),
                self::text($data, "instructor"),
                self::integer($data, "capacity", 1000),
            ],
        )[0];
    }
    public function assignInstructor(int $courseId, array $data): array
    {
        $instructorId = self::integer($data, "instructorId");
        $instructor =
            $this->repository->query(
                "SELECT id, name FROM users WHERE id=? AND role='instructor'",
                [$instructorId],
            )[0] ?? null;
        if (!$instructor) {
            throw new HttpError(422, "Select a valid instructor account.");
        }
        $course =
            $this->repository->query(
                "UPDATE courses SET instructor_user_id=?, instructor=? WHERE id=? RETURNING *",
                [$instructorId, $instructor["name"], $courseId],
            )[0] ?? null;
        if (!$course) {
            throw new HttpError(404, "Course not found.");
        }
        return $course;
    }
    public function roster(int $courseId, array $user): array
    {
        $allowed = array_filter(
            $this->repository->courses($user, true),
            static fn($course) => $course["id"] === $courseId,
        );
        if (!$allowed) {
            throw new HttpError(
                403,
                "You cannot access the roster for this course.",
            );
        }
        return $this->repository->query(
            "SELECT s.id, s.name, s.major, s.semester FROM enrollments e JOIN students s ON s.id=e.student_id WHERE e.course_id=? ORDER BY s.name, s.id",
            [$courseId],
        );
    }
    public function enroll(array $data, array $user): array
    {
        $studentId =
            $user["role"] === "student"
                ? (int) $user["student_id"]
                : self::integer($data, "studentId");
        $courseId = self::integer($data, "courseId");
        $db = $this->repository->db;
        $db->beginTransaction();
        try {
            $course =
                $this->repository->query(
                    "SELECT * FROM courses WHERE id=? FOR UPDATE",
                    [$courseId],
                )[0] ?? null;
            if (!$course || !$this->repository->students($studentId)) {
                throw new HttpError(404, "Student or course not found.");
            }
            if (
                $this->repository->query(
                    "SELECT id FROM enrollments WHERE student_id=? AND course_id=?",
                    [$studentId, $courseId],
                )
            ) {
                throw new HttpError(
                    409,
                    "The student is already enrolled in this course.",
                );
            }
            $count = $this->repository->query(
                "SELECT count(*) AS total FROM enrollments WHERE course_id=?",
                [$courseId],
            )[0]["total"];
            if ($count >= $course["capacity"]) {
                throw new HttpError(409, "The course has no available seats.");
            }
            $enrollment = $this->repository->query(
                "INSERT INTO enrollments (student_id,course_id) VALUES (?,?) RETURNING *",
                [$studentId, $courseId],
            )[0];
            $this->repository->query(
                "INSERT INTO domain_events (type, payload) VALUES (?, ?)",
                [
                    "enrollment.created",
                    json_encode($enrollment, JSON_THROW_ON_ERROR),
                ],
            );
            $db->commit();
            return $enrollment;
        } catch (\Throwable $error) {
            $db->rollBack();
            throw $error;
        }
    }
    public function report(array $user): array
    {
        $students = $this->repository->visibleStudents($user);
        $enrollments = $this->repository->enrollments(
            $user["role"] === "student" ? (int) $user["student_id"] : null,
            $user["role"] === "instructor" ? (int) $user["id"] : null,
        );
        return array_map(
            static fn($student) => $student + [
                "courses" => array_values(
                    array_map(
                        static fn($row) => $row["course"],
                        array_filter(
                            $enrollments,
                            static fn($row) => $row["student_id"] ===
                                $student["id"],
                        ),
                    ),
                ),
            ],
            $students,
        );
    }
}
