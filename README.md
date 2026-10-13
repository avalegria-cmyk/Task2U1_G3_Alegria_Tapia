# University Academic Manager

A university application for managing students, courses, enrollments, and academic reports. The original Express application has been replaced with a layered PHP API, a React interface, and persistent PostgreSQL storage. All application code, UI labels, API fields, validation messages, and technical documentation are in English.

## Run with Docker

Prerequisites: Docker Engine 29.x (or Docker Desktop with its Linux engine), Docker Compose v2 or compatible later version, and an available local port 8080. PHP, Node.js, Composer, and PostgreSQL do not need to be installed on the host.

From this project directory:

```sh
cp .env.example .env
```

Edit `.env`: set a database password, a random JWT secret of at least 32 characters, and a demo password of at least 12 characters. Do not commit this file. Then run:

```sh
docker compose up -d --build --wait
docker compose --profile tools run --rm seed
```

Open [Academic Manager](http://localhost:8080). Sign in using one of these accounts and the `DEMO_PASSWORD` configured in `.env`:

| Account                | Role          | Access                                                   |
| ---------------------- | ------------- | -------------------------------------------------------- |
| admin@example.edu      | Administrator | Read all records; add students, courses, and enrollments |
| instructor@example.edu | Instructor    | Read assigned courses and their student rosters          |
| student@example.edu    | Student       | View enrolled courses and classmates                     |

The local `.env` prepared during development uses `UniversityDemo2026!` for these demo accounts. A fresh installation should choose its own demo password. Changing `DEMO_PASSWORD` after seeding does not change existing password hashes.

The token lasts one hour and is held in browser memory. Reloading the page requires signing in again. Sign out revokes the token on the server. New notifications appear after the background worker processes enrollment events; use **Refresh** to update the list.

## Technologies

| Component      | Implementation                                   | Purpose                                                                 |
| -------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| Frontend       | React 19.3.0 and JavaScript, ES2023 build target | Components, forms, state and role-aware views                           |
| Styles         | Tailwind CSS 4.3.3                               | Responsive layout and consistent styling                                |
| Frontend build | Node.js 24.21 and Vite 7.3.7                     | Build static assets inside Docker                                       |
| Backend        | PHP 8.4, PHP-FPM, PDO PostgreSQL                 | REST API, validation and business rules                                 |
| Database       | PostgreSQL 18.6                                  | Persistent relational data and transactions                             |
| Authentication | JWT, firebase/php-jwt 7.2.1                      | Signed, expiring sessions with server-side revocation                   |
| Web server     | Nginx 1.30                                       | Static frontend, security headers, login throttling and FastCGI routing |
| Containers     | Docker Engine 29.x and Docker Compose            | Build and run the complete application                                  |

The requested technologies and version families come from `Tarea2U1_G3_Alegria_Tapia.docx`. React, Tailwind and JWT dependencies are fixed by committed lockfiles. PHP and Nginx image tags track patch releases in their requested version families. Composer and Vite are build tools, not replacement backend technologies. Node is not the application server.

## Project structure

```text
backend/
  public/index.php           HTTP routing and response handling
  src/AuthService.php        JWT authentication and revocation
  src/AcademicService.php    Validation, enrollment rules and reports
  src/AcademicRepository.php SQL access
  src/Database.php           PostgreSQL connection
  src/HttpError.php          HTTP error representation
  bin/seed.php               Explicit demo data initialization
  bin/worker.php             Transactional enrollment notification worker
frontend/
  src/main.jsx               React application and screens
  src/components.jsx         Reusable fields, tables and panels
  src/api.js                 HTTP client and in-memory token
  src/styles.css             Tailwind styles
  package-lock.json          Reproducible JavaScript dependencies
database/001-schema.sql      Initial relational schema
docker/                     PHP and web Dockerfiles; Nginx configuration
tests/api.test.mjs           API integration and concurrency checks
docs/                       Architecture, API, data and deployment notes
compose.yaml                Services and persistent database volume
```

## Validation

Run the integration suite only against a demo/test database. It creates additional students, courses, enrollments and notifications with timestamped names; it does not delete existing data.

```sh
docker compose --profile tools run --rm test
docker compose exec api sh -c 'find src public bin -name "*.php" -exec php -l {} \;'
docker compose exec web nginx -t
docker compose ps
```

The suite checks authentication, tampered tokens, role restrictions, student ownership, input validation, foreign references, duplicate enrollments, concurrent competition for the last seat, reports, asynchronous notifications, and logout revocation. `docker compose up --build` compiles the frontend as part of the web image.

## Operation

```sh
docker compose logs --tail=100 api worker web
docker compose stop
docker compose start
```

Database records survive container restarts and `docker compose down`. Avoid `docker compose down -v`: it deletes the project's database volume. The initial schema runs only when the volume is empty. The `migrate` service then applies pending versioned migrations before the API and worker start, preserving existing records.

## Documentation

- [Role interfaces and course assignments](docs/role-interfaces.md)
- [Architecture decisions](docs/architecture.md)
- [Seed data and database model](docs/data.md)
- [REST API](docs/api.md)
- [Deployment and recovery](docs/deployment.md)
- [Verification results](docs/verification.md)

This teaching application implements creation and consultation workflows. Editing/deleting records, account provisioning, password recovery, pagination, email delivery, and automatic cloud failover are not implemented.
