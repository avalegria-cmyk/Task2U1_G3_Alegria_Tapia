<?php
declare(strict_types=1);
require dirname(__DIR__) . "/vendor/autoload.php";
use App\{Database, AcademicRepository, AcademicService, AuthService, HttpError};
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");
try {
    $repository = new AcademicRepository(Database::connect());
    $path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
    $method = $_SERVER["REQUEST_METHOD"];
    if ($path === "/api/health" && $method === "GET") {
        $repository->query("SELECT 1");
        echo '{"status":"ok"}';
        exit();
    }
    $input = [];
    if ($method === "POST") {
        try {
            $decoded = json_decode(
                file_get_contents("php://input"),
                false,
                32,
                JSON_THROW_ON_ERROR,
            );
        } catch (\JsonException) {
            throw new HttpError(400, "A valid JSON object is required.");
        }
        if (!($decoded instanceof \stdClass)) {
            throw new HttpError(400, "A JSON object is required.");
        }
        $input = (array) $decoded;
    }
    $auth = new AuthService($repository);
    if ($path === "/api/auth/login" && $method === "POST") {
        echo json_encode($auth->login($input));
        exit();
    }
    $user = $auth->authenticate();
    $service = new AcademicService($repository);
    $studentId = $user["role"] === "student" ? (int) $user["student_id"] : null;
    if (
        $method === "GET" &&
        preg_match('#^/api/courses/([1-9][0-9]*)/students$#', $path, $matches)
    ) {
        echo json_encode(
            $service->roster((int) $matches[1], $user),
            JSON_THROW_ON_ERROR,
        );
        exit();
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
        echo json_encode(
            $service->assignInstructor((int) $matches[1], $input),
            JSON_THROW_ON_ERROR,
        );
        exit();
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
                "SELECT id, message, created_at FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50",
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
            if (
                $user["role"] !== "admin" &&
                !($path === "/api/enrollments" && $user["role"] === "student")
            ) {
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
    echo json_encode($result, JSON_THROW_ON_ERROR);
} catch (HttpError $error) {
    http_response_code($error->status);
    echo json_encode(["error" => $error->getMessage()]);
} catch (\Throwable $error) {
    error_log((string) $error);
    http_response_code(500);
    echo '{"error":"An unexpected server error occurred."}';
}
