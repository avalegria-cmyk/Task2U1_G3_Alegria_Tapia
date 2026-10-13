<?php
declare(strict_types=1);
namespace App\services;
use App\middlewares\HttpError;
use App\repositories\AcademicRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
final class AuthService
{
    private string $secret;
    public function __construct(private AcademicRepository $repository)
    {
        $this->secret = (string) getenv("JWT_SECRET");
        if (strlen($this->secret) < 32) {
            throw new \RuntimeException(
                "JWT_SECRET must contain at least 32 characters.",
            );
        }
    }
    public function login(array $input): array
    {
        $user =
            $this->repository->query("SELECT * FROM users WHERE email = ?", [
                is_string($input["email"] ?? null)
                    ? strtolower(trim($input["email"]))
                    : "",
            ])[0] ?? null;
        if (
            !$user ||
            !is_string($input["password"] ?? null) ||
            !password_verify($input["password"], $user["password_hash"])
        ) {
            throw new HttpError(401, "Invalid email or password.");
        }
        $now = time();
        $token = JWT::encode(
            [
                "iss" => "academic-manager",
                "aud" => "academic-web",
                "sub" => (string) $user["id"],
                "iat" => $now,
                "exp" => $now + 3600,
                "jti" => bin2hex(random_bytes(16)),
                "version" => (int) $user["session_version"],
            ],
            $this->secret,
            "HS256",
        );
        unset($user["password_hash"]);
        return ["token" => $token, "user" => $user, "expiresIn" => 3600];
    }
    public function authenticate(): array
    {
        $header = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
        if (!preg_match('/^Bearer (\S+)$/', $header, $matches)) {
            throw new HttpError(401, "Authentication required.");
        }
        try {
            $claims = JWT::decode($matches[1], new Key($this->secret, "HS256"));
        } catch (\Throwable) {
            throw new HttpError(401, "Invalid or expired session.");
        }
        if (
            ($claims->iss ?? "") !== "academic-manager" ||
            ($claims->aud ?? "") !== "academic-web" ||
            !isset($claims->jti, $claims->exp, $claims->sub)
        ) {
            throw new HttpError(401, "Invalid session.");
        }
        if (
            $this->repository->query(
                "SELECT token_id FROM revoked_tokens WHERE token_id=?",
                [$claims->jti],
            )
        ) {
            throw new HttpError(401, "Session has ended.");
        }
        $user =
            $this->repository->query(
                "SELECT id, name, email, role, student_id, session_version FROM users WHERE id=?",
                [$claims->sub],
            )[0] ?? null;
        if (
            !$user ||
            (int) ($claims->version ?? 0) !== (int) $user["session_version"]
        ) {
            throw new HttpError(401, "Account not found.");
        }
        return $user + [
            "token_id" => $claims->jti,
            "expires_at" => $claims->exp,
        ];
    }
    public function logout(array $user): void
    {
        $this->repository->query(
            "INSERT INTO revoked_tokens (token_id, expires_at) VALUES (?, to_timestamp(?)) ON CONFLICT DO NOTHING",
            [$user["token_id"], $user["expires_at"]],
        );
        $this->repository->query(
            "DELETE FROM revoked_tokens WHERE expires_at < now()",
        );
    }
}
