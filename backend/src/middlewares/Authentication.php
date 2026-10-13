<?php
declare(strict_types=1);
namespace App\middlewares;
use App\services\AuthService;
final class Authentication {
 public static function requireUser(AuthService $auth): array { return $auth->authenticate(); }
}
