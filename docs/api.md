# REST API

Base path: `/api`. Request and response bodies use JSON. Authenticated endpoints require `Authorization: Bearer <token>`.

| Method | Path           | Access            | Request or response                                                                                   |
| ------ | -------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| GET    | /health        | Public            | Database connectivity, `{ "status": "ok" }`                                                           |
| POST   | /auth/login    | Public, throttled | `{ "email": "...", "password": "..." }`; returns token, user, expiresIn                               |
| GET    | /auth/me       | Authenticated     | Current account without password hash                                                                 |
| POST   | /auth/logout   | Authenticated     | `{}`; revokes current token                                                                           |
| GET    | /students      | Authenticated     | Students; student role sees only own record                                                           |
| POST   | /students      | Admin             | `{ "name": "Alex Smith", "major": "Software Engineering", "semester": 4 }`                            |
| GET    | /courses       | Authenticated     | Courses with capacity and enrolled count                                                              |
| POST   | /courses       | Admin             | `{ "name": "Networks", "instructor": "Sam Reed", "capacity": 30 }`                                    |
| GET    | /enrollments   | Authenticated     | Enrollment records; student role sees only own                                                        |
| POST   | /enrollments   | Admin or student  | `{ "studentId": 1, "courseId": 3 }`; studentId is derived from the authenticated account for students |
| GET    | /reports       | Authenticated     | Students with major and course-name arrays; own record for students                                   |
| GET    | /notifications | Authenticated     | Latest 50 notifications belonging to the current account                                              |

Successful reads return 200; new academic records return 201. API errors use `{ "error": "English message" }`: 400 for malformed/non-object JSON, 401 for authentication failures, 403 for forbidden operations, 404 for missing resources, 405 for unsupported HTTP methods, 409 for duplicate/full enrollments, and 422 for invalid fields. Infrastructure-level errors such as Nginx request-size limits or throttling can return HTML; the client presents a generic error if a response is not JSON.

Names, majors and instructor fields must contain non-whitespace text and at most 120 UTF-8 bytes. Numeric fields must be JSON integers, not numeric strings. Semester is 1–12, capacity is 1–1000, and identifiers are positive 32-bit integers. The UI converts number inputs before sending them.

Search filters the already loaded table in the browser; there is no server-side search or pagination. Changing a role in the database applies on the next request. Tokens expire after 3600 seconds and cannot be refreshed automatically.

## Role-specific course views

See [role interfaces](role-interfaces.md) for `/my-courses`, per-course rosters and instructor assignment endpoints. Instructor reads of `/courses`, `/students`, `/enrollments` and `/reports` now include only assigned courses and their enrolled students. Students can view classmates through authorized per-course rosters.
