<?php
declare(strict_types=1);
namespace App\routes;
use App\controllers\AcademicController;
use App\middlewares\HttpError;
final class ApiRoutes {
 public static function dispatch(AcademicController $controller, string $path, string $method, array $input): array {
  $routes = [
   'GET' => ['#^/api/(auth/me|students|my-courses|instructors|courses|enrollments|reports|notifications)$#', '#^/api/courses/[1-9][0-9]*/students$#'],
   'POST' => ['#^/api/(auth/login|auth/logout|students|courses|enrollments)$#', '#^/api/courses/[1-9][0-9]*/(access|instructor)$#', '#^/api/notifications/[1-9][0-9]*/read$#']
  ];
  if (!isset($routes[$method])) throw new HttpError(405, 'Method not allowed.');
  foreach ($routes[$method] as $pattern) {
   if (preg_match($pattern, $path)) return $controller->handle($path, $method, $input);
  }
  throw new HttpError(404, 'Endpoint not found.');
 }
}
