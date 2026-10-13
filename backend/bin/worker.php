<?php
declare(strict_types=1);
require dirname(__DIR__) . "/vendor/autoload.php";
$repository = new App\AcademicRepository(App\Database::connect());
while (true) {
    try {
        $repository->db->beginTransaction();
        $events = $repository->query(
            "SELECT * FROM domain_events WHERE processed_at IS NULL ORDER BY id LIMIT 20 FOR UPDATE SKIP LOCKED",
        );
        foreach ($events as $event) {
            $payload = json_decode(
                $event["payload"],
                true,
                512,
                JSON_THROW_ON_ERROR,
            );
            $repository->query(
                "INSERT INTO notifications(user_id,event_id,message) SELECT id, ?, ? FROM users WHERE role='admin' OR student_id=? ON CONFLICT DO NOTHING",
                [
                    $event["id"],
                    "Enrollment #" .
                    $payload["id"] .
                    " was created successfully.",
                    $payload["student_id"],
                ],
            );
            $repository->query(
                "UPDATE domain_events SET processed_at=now() WHERE id=?",
                [$event["id"]],
            );
        }
        $repository->db->commit();
    } catch (Throwable $error) {
        error_log((string) $error);
        // Closing the connection rolls back pending work; Docker restarts with a fresh connection.
        exit(1);
    }
    sleep(2);
}
