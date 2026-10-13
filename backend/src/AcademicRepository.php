<?php
declare(strict_types=1);
namespace App;
use PDO;
final class AcademicRepository
{
    public function __construct(public readonly PDO $db) {}
    public function query(string $sql, array $parameters = []): array
    {
        $statement = $this->db->prepare($sql);
        $statement->execute($parameters);
        return $statement->fetchAll();
    }
    public function students(?int $studentId): array
    {
        return $this->query(
            "SELECT * FROM students" .
                ($studentId !== null ? " WHERE id = ?" : "") .
                " ORDER BY id",
            $studentId !== null ? [$studentId] : [],
        );
    }
    public function courses(array $user, bool $enrolledOnly = false): array
    {
        $where = "";
        $parameters = [];
        if ($user["role"] === "instructor") {
            $where = " WHERE c.instructor_user_id=?";
            $parameters = [$user["id"]];
        } elseif ($user["role"] === "student" && $enrolledOnly) {
            $where =
                " WHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id=c.id AND e.student_id=?)";
            $parameters = [$user["student_id"]];
        }
        return $this->query(
            "SELECT c.id, c.name, c.capacity, c.instructor_user_id, COALESCE(u.name,c.instructor) AS instructor, (SELECT count(*)::int FROM enrollments e WHERE e.course_id=c.id) AS enrolled FROM courses c LEFT JOIN users u ON u.id=c.instructor_user_id" .
                $where .
                " ORDER BY c.id",
            $parameters,
        );
    }
    public function visibleStudents(array $user): array
    {
        if ($user["role"] !== "instructor") {
            return $this->students(
                $user["role"] === "student" ? (int) $user["student_id"] : null,
            );
        }
        return $this->query(
            "SELECT s.* FROM students s WHERE EXISTS (SELECT 1 FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.student_id=s.id AND c.instructor_user_id=?) ORDER BY s.id",
            [$user["id"]],
        );
    }
    public function enrollments(
        ?int $studentId,
        ?int $instructorId = null,
    ): array {
        return $this->query(
            "SELECT e.id, e.student_id, e.course_id, s.name AS student, c.name AS course FROM enrollments e JOIN students s ON s.id=e.student_id JOIN courses c ON c.id=e.course_id" .
                ($studentId !== null
                    ? " WHERE e.student_id=?"
                    : ($instructorId !== null
                        ? " WHERE c.instructor_user_id=?"
                        : "")) .
                " ORDER BY e.id",
            $studentId !== null
                ? [$studentId]
                : ($instructorId !== null
                    ? [$instructorId]
                    : []),
        );
    }
}
