<?php
declare(strict_types=1);
namespace App;
use PDO;
final class Database
{
    public static function connect(): PDO
    {
        return new PDO(
            "pgsql:host=database;port=5432;dbname=" . getenv("POSTGRES_DB"),
            getenv("POSTGRES_USER"),
            getenv("POSTGRES_PASSWORD"),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ],
        );
    }
}
