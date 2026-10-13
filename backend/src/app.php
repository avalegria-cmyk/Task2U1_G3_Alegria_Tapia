<?php
declare(strict_types=1);
use App\repositories\{Database, AcademicRepository};
use App\controllers\AcademicController;
use App\middlewares\{HttpError, JsonBody};
use App\routes\ApiRoutes;
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
try {
 $repository = new AcademicRepository(Database::connect());
 $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
 $method = $_SERVER['REQUEST_METHOD'];
 if ($path === '/api/health' && $method === 'GET') {
  $repository->query('SELECT 1');
  $result = ['status' => 'ok'];
 } else {
  $result = ApiRoutes::dispatch(new AcademicController($repository), $path, $method, JsonBody::read($method));
 }
 echo json_encode($result, JSON_THROW_ON_ERROR);
} catch (HttpError $error) {
 http_response_code($error->status);
 echo json_encode(['error' => $error->getMessage()]);
} catch (Throwable $error) {
 error_log((string)$error);
 http_response_code(500);
 echo '{"error":"An unexpected server error occurred."}';
}
