# University Academic Portal

React, Tailwind CSS, PHP, PostgreSQL, JWT, Nginx and Docker. Code and interface labels are English.

## Run

For a new installation, copy `.env.example` to `.env` and configure `POSTGRES_PASSWORD` and a random `JWT_SECRET` of at least 32 characters.

```sh
docker compose up -d --build
```

Open [localhost:8080](http://localhost:8080). Docker runs three containers: `university_web`, `university_php`, and `university_db`.

## Database and accounts

`database/schema.sql` is the only database source file. It contains the final schema and all initial data: 13 students, one instructor, one administrator, four courses and 44 enrollments. PostgreSQL loads it automatically on the first startup with an empty data volume. Existing volumes retain their current data; restarting never resets records. The SQL is an initialization script, not an incremental migration or a reset command.

Initial demonstration accounts share the password `UniversityDemo2026!`, stored as a bcrypt hash in the SQL:

- Administrator: `admin@example.edu`
- Instructor: `kevin.chuquitarco@example.edu`
- Student example: `adonis.alegria@example.edu`

Each supplied student has an individual account listed in the SQL. Addresses under `example.edu` are demonstration identifiers. Database connection credentials remain in `.env`; the demo login password is defined by the SQL fixture.

## Modules

Students and instructors have Courses and Notifications. Administrators have Dashboard, Enrollments, Course rosters, Students, Courses & instructors, Reports and Notifications.

To enroll a student: open Enrollments, click Register enrollment, select a student and course, review the summary and register. Duplicate enrollment and capacity checks run in the API. Registering a new student creates an academic record, not a sign-in account.

## Structure

```text
frontend/src/
  components/      Shared UI elements
  pages/           Application screens
  layouts/         Sidebar and header
  services/        HTTP API client
  styles/          Tailwind styling
backend/src/
  routes/          HTTP routes
  controllers/     Request handling
  services/        Business rules
  repositories/    Database access
  middlewares/     Authentication and input validation
  app.php          Application composition
backend/public/    Web entrypoint
database/schema.sql Final schema and initial data
infra/nginx/       Web server configuration
infra/docker/      Container images
tests/             API integration tests
```

## Optional integration tests

`tests/api.test.mjs` checks API authentication, role permissions, enrollment, capacity, notifications and reports. These are integration tests rather than isolated unit tests. `tests/run.sh` starts a temporary Docker project with its own volume, uses the SQL initialization data, and removes that temporary project afterward. It does not modify the main application's database.

Run manually when wanted:

```sh
docker compose build
sh tests/run.sh
```
