<?php
declare(strict_types=1);
require dirname(__DIR__) . "/vendor/autoload.php";
$db = App\Database::connect();
$password = getenv("DEMO_PASSWORD");
if (!$password || strlen($password) < 12) {
    throw new RuntimeException("Set DEMO_PASSWORD to at least 12 characters.");
}
$db->beginTransaction();
try {
    $db->exec(
        "LOCK TABLE users, students, courses, enrollments IN EXCLUSIVE MODE",
    );
    if ($db->query("SELECT count(*) FROM users")->fetchColumn() > 0) {
        $db->rollBack();
        echo "Seed skipped: accounts already exist.\n";
        exit();
    }
    if (
        $db->query("SELECT count(*) FROM students")->fetchColumn() > 0 ||
        $db->query("SELECT count(*) FROM courses")->fetchColumn() > 0
    ) {
        throw new RuntimeException("Seed requires an empty academic database.");
    }
    $student = $db->prepare(
        "INSERT INTO students(name,major,semester) VALUES (?,?,?) RETURNING id",
    );
    $ids = [];
    foreach (
        [
            ["Ana Torres", "Software Engineering", 8],
            ["Luis Perez", "Software Engineering", 8],
            ["Maria Gomez", "Information Technology", 6],
        ]
        as $row
    ) {
        $student->execute($row);
        $ids[] = $student->fetchColumn();
    }
    $course = $db->prepare(
        "INSERT INTO courses(name,instructor,capacity) VALUES (?,?,?) RETURNING id",
    );
    $courseIds = [];
    foreach (
        [
            ["Software Architecture", "Carlos Ruiz", 30],
            ["Databases", "Laura Vera", 25],
            ["Web Development", "Pedro Leon", 35],
        ]
        as $row
    ) {
        $course->execute($row);
        $courseIds[] = $course->fetchColumn();
    }
    $enrollment = $db->prepare(
        "INSERT INTO enrollments(student_id,course_id) VALUES (?,?)",
    );
    foreach (
        [
            [$ids[0], $courseIds[0]],
            [$ids[1], $courseIds[0]],
            [$ids[0], $courseIds[1]],
        ]
        as $row
    ) {
        $enrollment->execute($row);
    }
    $user = $db->prepare(
        "INSERT INTO users(name,email,password_hash,role,student_id) VALUES (?,?,?,?,?)",
    );
    foreach (
        [
            ["Demo Administrator", "admin@example.edu", "admin", null],
            ["Carlos Ruiz", "instructor@example.edu", "instructor", null],
            ["Ana Torres", "student@example.edu", "student", $ids[0]],
        ]
        as [$name, $email, $role, $id]
    ) {
        $user->execute([
            $name,
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $role,
            $id,
        ]);
    }
    $assignment = $db->prepare(
        "UPDATE courses SET instructor_user_id=(SELECT id FROM users WHERE email='instructor@example.edu') WHERE id=?",
    );
    $assignment->execute([$courseIds[0]]);
    $db->commit();
    echo "Demo data seeded.\n";
} catch (Throwable $error) {
    $db->rollBack();
    throw $error;
}
