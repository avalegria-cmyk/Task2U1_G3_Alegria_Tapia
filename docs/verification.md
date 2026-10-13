# Verification record

Validated locally on October 7, 2026, using Docker Desktop's Linux engine on an ARM64 host.

- Docker built the React/Tailwind frontend and PHP backend successfully with the committed dependency lockfiles.
- PostgreSQL and the HTTP health check became healthy.
- The explicit seed created three student records, three courses, three enrollments, and three role-specific accounts.
- The API integration scenario passed: login, invalid credentials/tokens, ownership, forbidden writes, validation, missing course, duplicate enrollment, concurrent last-seat requests, reports, notification delivery and logout revocation.
- All application PHP files passed `php -l`; the server configuration passed `nginx -t`.
- After restarting the containers, all five students, five courses and five enrollments remained present (the two extra records in each group came from the integration scenario).
- Repeating the seed command skipped existing accounts without creating duplicates.
- After restarting PostgreSQL alone, the worker recovered and the integration scenario passed again, including notification delivery. The final demo database contains seven students, seven courses and seven enrollments because both test runs retained their records.
- Browser verification covered administrator login, the academic report view, search filtering and the course catalog.

The integration test creates timestamped test records and should run only against demonstration or isolated test data. No production deployment, load benchmark, cloud failover exercise or external email delivery was performed.

## Role interface update

The updated Docker build and PHP/Nginx checks passed. The extended integration scenario verified enrolled-course lists, assigned-course lists, authorized class rosters, blocked access to unrelated courses, administrator-only instructor assignment, rejection of non-instructor accounts, and instructor scoping on the legacy reporting endpoints. Migration 002 ran against the existing database and subsequent startup attempts skipped the recorded migration.

Browser checks confirmed the student and instructor course cards and their Software Architecture rosters. The administrator successfully enrolled a test student through the form and opened the corresponding course roster. This verification retained its additional test enrollment. All interface labels remain in English.
