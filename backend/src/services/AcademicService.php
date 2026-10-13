<?php
declare(strict_types=1);
namespace App\services;
use App\middlewares\HttpError;
use App\repositories\AcademicRepository;
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
        $first = isset($data['firstName']) ? self::text($data, 'firstName') : self::text($data, 'name');
        $last = isset($data['lastName']) ? self::text($data, 'lastName') : '';
        $name = self::text(['name' => trim($first . ' ' . $last)], 'name');
        $group = isset($data['group']) && $data['group'] !== '' ? self::text($data, 'group') : null;
        if ($group !== null && strlen($group) > 30) throw new HttpError(422, 'Group must not exceed 30 characters.');
        return $this->repository->insertStudent($name, $first, $last, self::text($data, 'major'), self::integer($data, 'semester', 12), $group);
    }
    public function createCourse(array $data): array
    {
        $name = self::text($data, 'name');
        $capacity = self::integer($data, 'capacity', 1000);
        $instructorId = isset($data['instructorId']) ? self::integer($data, 'instructorId') : null;
        $instructor = $instructorId ? $this->repository->findInstructor($instructorId) : null;
        if ($instructorId && !$instructor) throw new HttpError(422, 'Select a valid instructor account.');
        $teacherName = $instructor ? $instructor['name'] : self::text($data, 'instructor');
        $code = isset($data['code']) ? self::text($data, 'code') : null;
        $category = isset($data['category']) ? self::text($data, 'category') : '';
        if ($code !== null && strlen($code) > 20) throw new HttpError(422, 'Course code must not exceed 20 characters.');
        try {
            return $this->repository->insertCourse($name, $teacherName, $capacity, $instructorId, $code, $category);
        } catch (\PDOException $error) {
            if ($error->getCode() === '23505') throw new HttpError(409, 'A course with this code already exists.');
            throw $error;
        }
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
    public function authorizedCourse(int $courseId, array $user): array
    {
        foreach ($this->repository->courses($user, true) as $course) {
            if ($course["id"] === $courseId) {
                return $course;
            }
        }
        throw new HttpError(403, "You cannot access this course.");
    }
    public function roster(int $courseId, array $user): array
    {
        $this->authorizedCourse($courseId, $user);
        return $this->repository->query(
            "SELECT 'student-' || s.id AS id, s.id AS student_id, s.campus_id, s.name, s.first_name, s.last_name, 'student' AS role, e.group_name, a.last_access_at FROM enrollments e JOIN students s ON s.id=e.student_id LEFT JOIN users u ON u.student_id=s.id AND u.role='student' LEFT JOIN course_access a ON a.user_id=u.id AND a.course_id=e.course_id WHERE e.course_id=? UNION ALL SELECT 'instructor-' || u.id AS id, NULL AS student_id, NULL AS campus_id, u.name, u.first_name, u.last_name, u.role, NULL AS group_name, a.last_access_at FROM courses c JOIN users u ON u.id=c.instructor_user_id LEFT JOIN course_access a ON a.user_id=u.id AND a.course_id=c.id WHERE c.id=? ORDER BY last_name, first_name",
            [$courseId, $courseId],
        );
    }
    public function recordAccess(int $courseId, array $user): array
    {
        $this->authorizedCourse($courseId, $user);
        $this->repository->query(
            "INSERT INTO course_access(user_id,course_id) VALUES (?,?) ON CONFLICT(user_id,course_id) DO UPDATE SET last_access_at=now()",
            [$user["id"], $courseId],
        );
        return ["message" => "Course visit recorded."];
    }
    public function enroll(array $data, array $user): array
    {
        if ($user["role"] !== "admin") {
            throw new HttpError(
                403,
                "Only administrators can enroll students.",
            );
        }
        $ids = isset($data["studentIds"])
            ? $data["studentIds"]
            : [self::integer($data, "studentId")];
        if (
            !is_array($ids) ||
            !array_is_list($ids) ||
            count($ids) < 1 ||
            count($ids) > 100
        ) {
            throw new HttpError(422, "Select between 1 and 100 students.");
        }
        foreach ($ids as $id) {
            self::integer(["id" => $id], "id");
        }
        $ids = array_values(array_unique($ids));
        $courseId = self::integer($data, "courseId");
        $db = $this->repository->db;
        $db->beginTransaction();
        try {
            $course =
                $this->repository->query(
                    "SELECT * FROM courses WHERE id=? FOR UPDATE",
                    [$courseId],
                )[0] ?? null;
            if (!$course) {
                throw new HttpError(404, "Course not found.");
            }
            $students = [];
            foreach ($ids as $id) {
                $student = $this->repository->students($id)[0] ?? null;
                if (!$student) {
                    throw new HttpError(404, "Student not found.");
                }
                if (
                    $this->repository->query(
                        "SELECT id FROM enrollments WHERE student_id=? AND course_id=?",
                        [$id, $courseId],
                    )
                ) {
                    throw new HttpError(
                        409,
                        "One or more selected students are already enrolled in this course.",
                    );
                }
                $students[] = $student;
            }
            $count = (int) $this->repository->query(
                "SELECT count(*) AS total FROM enrollments WHERE course_id=?",
                [$courseId],
            )[0]["total"];
            if ($count + count($students) > $course["capacity"]) {
                throw new HttpError(
                    409,
                    "The course does not have enough available seats.",
                );
            }
            $enrollments = [];
            $notifications = new NotificationService($this->repository);
            foreach ($students as $student) {
                $enrollment = $this->repository->query(
                    "INSERT INTO enrollments(student_id,course_id,group_name) VALUES (?,?,?) RETURNING *",
                    [$student["id"], $courseId, $student["default_group"]],
                )[0];
                $notifications->enrollmentCreated(
                    $enrollment,
                    $course,
                    $student["name"],
                );
                $enrollments[] = $enrollment;
            }
            $db->commit();
            return [
                "message" => "Students enrolled successfully.",
                "enrollments" => $enrollments,
            ];
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
