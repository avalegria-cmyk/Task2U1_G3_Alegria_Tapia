<?php
declare(strict_types=1);
require dirname(__DIR__) . "/vendor/autoload.php";
$db = App\Database::connect();
$db->beginTransaction();
try {
    $db->exec("SELECT pg_advisory_xact_lock(7042026)");
    $db->exec(
        "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    foreach (glob(dirname(__DIR__) . "/migrations/*.sql") as $file) {
        $version = basename($file);
        $check = $db->prepare(
            "SELECT version FROM schema_migrations WHERE version=?",
        );
        $check->execute([$version]);
        if ($check->fetchColumn()) {
            continue;
        }
        $db->exec(file_get_contents($file));
        $record = $db->prepare(
            "INSERT INTO schema_migrations(version) VALUES (?)",
        );
        $record->execute([$version]);
        echo "Applied $version\n";
    }
    $db->commit();
} catch (Throwable $error) {
    $db->rollBack();
    throw $error;
}
