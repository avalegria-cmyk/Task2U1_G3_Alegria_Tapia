<?php
declare(strict_types=1);
namespace App\services;
use App\middlewares\HttpError;
use App\repositories\AcademicRepository;
final class NotificationService
{
    public function __construct(private AcademicRepository $repository) {}
    public function enrollmentCreated(
        array $enrollment,
        array $course,
        string $studentName,
    ): void {
        $event = $this->repository->query(
            "INSERT INTO domain_events(type,payload,processed_at) VALUES (?,?,now()) RETURNING id",
            [
                "enrollment.created",
                json_encode($enrollment, JSON_THROW_ON_ERROR),
            ],
        )[0];
        $this->repository->query(
            "INSERT INTO notifications(user_id,event_id,message) SELECT id,?,? FROM users WHERE role='admin' OR student_id=? OR id=? ON CONFLICT DO NOTHING",
            [
                $event["id"],
                $studentName .
                " was enrolled in " .
                $course["code"] .
                " — " .
                $course["name"] .
                ".",
                $enrollment["student_id"],
                $course["instructor_user_id"],
            ],
        );
    }
}
