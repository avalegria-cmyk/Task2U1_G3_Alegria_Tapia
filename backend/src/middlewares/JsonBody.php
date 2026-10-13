<?php
declare(strict_types=1);
namespace App\middlewares;
final class JsonBody {
 public static function read(string $method): array {
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
    return $input;
 }
}
