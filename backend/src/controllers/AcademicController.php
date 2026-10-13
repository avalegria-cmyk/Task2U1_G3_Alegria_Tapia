<?php
declare(strict_types=1);
namespace App\controllers;
use App\repositories\AcademicRepository;
use App\services\{AcademicService, AuthService};
use App\middlewares\{HttpError, Authentication};
final class AcademicController {
 public function __construct(private AcademicRepository $repository) {}
 public function handle(string $path, string $method, array $input): array {
 $repository = $this->repository;
    $auth = new AuthService($repository);
    if ($path === "/api/auth/login" && $method === "POST") {
        return $auth->login($input);
    }
    $user = Authentication::requireUser($auth);
    $service = new AcademicService($repository);
    $studentId = $user["role"] === "student" ? (int) $user["student_id"] : null;
    if (
        $method === "POST" &&
        preg_match('#^/api/courses/([1-9][0-9]*)/access$#', $path, $matches)
    ) {
        return $service->recordAccess((int) $matches[1], $user);
    }
    if (
        $method === "POST" &&
        preg_match('#^/api/notifications/([1-9][0-9]*)/read$#', $path, $matches)
    ) {
        $record =
            $repository->query(
                "UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE id=? AND user_id=? RETURNING id, read_at",
                [(int) $matches[1], $user["id"]],
            )[0] ?? null;
        if (!$record) {
            throw new HttpError(404, "Notification not found.");
        }
        return $record;
    }
    if (
        $method === "GET" &&
        preg_match('#^/api/courses/([1-9][0-9]*)/students$#', $path, $matches)
    ) {
        return $service->roster((int) $matches[1], $user);
    }
    if (
        $method === "POST" &&
        preg_match('#^/api/courses/([1-9][0-9]*)/instructor$#', $path, $matches)
    ) {
        if ($user["role"] !== "admin") {
            throw new HttpError(
                403,
                "Only administrators can assign instructors.",
            );
        }
        return $service->assignInstructor((int) $matches[1], $input);
    }
    if ($method === "GET") {
        $result = match ($path) {
            "/api/auth/me" => array_diff_key(
                $user,
                array_flip(["token_id", "expires_at"]),
            ),
            "/api/students" => $repository->visibleStudents($user),
            "/api/my-courses" => $repository->courses($user, true),
            "/api/instructors" => $user["role"] === "admin"
                ? $repository->query(
                    "SELECT id, name FROM users WHERE role='instructor' ORDER BY name",
                )
                : throw new HttpError(
                    403,
                    "Only administrators can list instructor accounts.",
                ),
            "/api/courses" => $repository->courses($user),
            "/api/enrollments" => $repository->enrollments(
                $studentId,
                $user["role"] === "instructor" ? (int) $user["id"] : null,
            ),
            "/api/reports" => $service->report($user),
            "/api/notifications" => $repository->query(
                "SELECT id, message, created_at, read_at FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50",
                [$user["id"]],
            ),
            default => throw new HttpError(404, "Endpoint not found."),
        };
    } elseif ($method === "POST") {
        if ($path === "/api/auth/logout") {
            $auth->logout($user);
            $result = ["message" => "Signed out."];
        } else {
            if (
                !in_array(
                    $path,
                    ["/api/students", "/api/courses", "/api/enrollments"],
                    true,
                )
            ) {
                throw new HttpError(404, "Endpoint not found.");
            }
            if ($user["role"] !== "admin") {
                throw new HttpError(
                    403,
                    "Your role cannot perform this action.",
                );
            }
            $result = match ($path) {
                "/api/students" => $service->createStudent($input),
                "/api/courses" => $service->createCourse($input),
                "/api/enrollments" => $service->enroll($input, $user),
            };
            http_response_code(201);
        }
    } else {
        throw new HttpError(405, "Method not allowed.");
    }
return $result;
}
}
