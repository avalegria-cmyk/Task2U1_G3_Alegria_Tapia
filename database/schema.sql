-- University Academic Portal: final schema and initial demonstration data.
-- Run once against an empty PostgreSQL database. Existing Docker volumes are preserved.
-- Demonstration sign-in password: UniversityDemo2026! (stored below as a bcrypt hash).
BEGIN;

CREATE TABLE students (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(120) NOT NULL,
    first_name varchar(120) NOT NULL DEFAULT '',
    last_name varchar(120) NOT NULL DEFAULT '',
    campus_id integer UNIQUE,
    default_group varchar(30),
    major varchar(120) NOT NULL,
    semester integer NOT NULL CHECK (semester BETWEEN 1 AND 12)
);
CREATE TABLE users (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(120) NOT NULL,
    first_name varchar(120) NOT NULL DEFAULT '',
    last_name varchar(120) NOT NULL DEFAULT '',
    email varchar(150) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role varchar(20) NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
    student_id integer REFERENCES students(id),
    session_version integer NOT NULL DEFAULT 1,
    CHECK (role <> 'student' OR student_id IS NOT NULL)
);
CREATE TABLE courses (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code varchar(20) UNIQUE,
    name varchar(120) NOT NULL,
    category varchar(120) NOT NULL DEFAULT '',
    instructor varchar(120) NOT NULL,
    instructor_user_id integer REFERENCES users(id) ON DELETE SET NULL,
    capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 1000)
);
CREATE INDEX courses_instructor_user_idx ON courses(instructor_user_id);
CREATE TABLE enrollments (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id integer NOT NULL REFERENCES students(id),
    course_id integer NOT NULL REFERENCES courses(id),
    group_name varchar(30),
    UNIQUE (student_id, course_id)
);
CREATE INDEX enrollments_course_idx ON enrollments(course_id);
CREATE TABLE revoked_tokens (
    token_id varchar(32) PRIMARY KEY,
    expires_at timestamptz NOT NULL
);
CREATE TABLE domain_events (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz
);
CREATE TABLE notifications (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id),
    event_id integer NOT NULL REFERENCES domain_events(id),
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz,
    UNIQUE (user_id, event_id)
);
CREATE TABLE course_access (
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id integer NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    last_access_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_id)
);

-- Initial academic records.
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('ADONIS VLADIMIR ALEGRIA VALLE', 'ADONIS VLADIMIR', 'ALEGRIA VALLE', 6878, 'Group 3', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('CARLOS VICENTE CALAPUCHA ÑACATA', 'CARLOS VICENTE', 'CALAPUCHA ÑACATA', 2515, 'Group 2', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('ANDERSON ARQUIMIDES CAMPOS ALVARADO', 'ANDERSON ARQUIMIDES', 'CAMPOS ALVARADO', 9405, 'Group 4', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('EDITH LILIANA CHUICO NAVARRETE', 'EDITH LILIANA', 'CHUICO NAVARRETE', 6881, 'Group 1', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('JOSEPH ANDRES FRANCO VILLAGOMEZ', 'JOSEPH ANDRES', 'FRANCO VILLAGOMEZ', 6876, 'Group 6', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('FREDDY CRISTHIAN JIMENEZ DAVILA', 'FREDDY CRISTHIAN', 'JIMENEZ DAVILA', 6880, 'Group 1', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('JUAN DAVID JIMENEZ ROMERO', 'JUAN DAVID', 'JIMENEZ ROMERO', 6886, 'Group 5', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('ANDERSON LENIN LARA CHICAIZA', 'ANDERSON LENIN', 'LARA CHICAIZA', 6882, 'Group 2', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('MIGUEL ANGEL MOLINA LUNA', 'MIGUEL ANGEL', 'MOLINA LUNA', 11832, 'Group 5', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('HELEN MADAHI QUINTERO PINARGOTE', 'HELEN MADAHI', 'QUINTERO PINARGOTE', 6107, 'Group 4', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('ALDO DAMIAN SAULA ZAMBRANO', 'ALDO DAMIAN', 'SAULA ZAMBRANO', 6885, 'Group 6', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('PAMELA NICOLE TAPIA CARDENAS', 'PAMELA NICOLE', 'TAPIA CARDENAS', 6888, 'Group 3', 'Software Engineering', 8);
INSERT INTO students (name, first_name, last_name, campus_id, default_group, major, semester) VALUES ('DARWIN ANDRES TOAPANTA PAEZ', 'DARWIN ANDRES', 'TOAPANTA PAEZ', 6098, 'Group 7', 'Software Engineering', 8);

-- Demonstration accounts; addresses are local demo identifiers.
INSERT INTO users (name, first_name, last_name, email, password_hash, role) VALUES ('University Administrator', 'University', 'Administrator', 'admin@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'admin');
INSERT INTO users (name, first_name, last_name, email, password_hash, role) VALUES ('KEVIN JAIR CHUQUITARCO VELASCO', 'KEVIN JAIR', 'CHUQUITARCO VELASCO', 'kevin.chuquitarco@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'instructor');
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'adonis.alegria@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 6878;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'carlos.calapucha@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 2515;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'anderson.campos@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 9405;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'edith.chuico@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 6881;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'joseph.franco@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 6876;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'freddy.jimenez@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 6880;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'juan.jimenez@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 6886;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'anderson.lara@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 6882;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'miguel.molina@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 11832;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'helen.quintero@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 6107;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'aldo.saula@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 6885;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'pamela.tapia@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 6888;
INSERT INTO users (name, first_name, last_name, email, password_hash, role, student_id) SELECT name, first_name, last_name, 'darwin.toapanta@example.edu', '$2y$12$AIK2KQ1o3XaQ.rh1lLF3sucojHZLWil17YxaAXrqjpmQNOro2s7vG', 'student', id FROM students WHERE campus_id = 6098;

-- Courses and instructor assignments.
INSERT INTO courses (code, name, category, instructor, instructor_user_id, capacity) SELECT '32828', 'Software Architecture', 'Software Development', name, id, 30 FROM users WHERE email = 'kevin.chuquitarco@example.edu';
INSERT INTO courses (code, name, category, instructor, instructor_user_id, capacity) SELECT '32829', 'Information Security Management', 'IT Infrastructure and Security', name, id, 30 FROM users WHERE email = 'kevin.chuquitarco@example.edu';
INSERT INTO courses (code, name, category, instructor, instructor_user_id, capacity) SELECT '32830', 'Emerging Technologies', 'IT Infrastructure and Security', name, id, 30 FROM users WHERE email = 'kevin.chuquitarco@example.edu';
INSERT INTO courses (code, name, category, instructor, instructor_user_id, capacity) SELECT '33966', 'Management and Entrepreneurship', 'Leadership and Management', name, id, 30 FROM users WHERE email = 'kevin.chuquitarco@example.edu';

-- Enrollment counts: 13, 11, 10, 10. Initial records do not generate notifications.
INSERT INTO enrollments (student_id, course_id, group_name) SELECT s.id, c.id, s.default_group FROM students s CROSS JOIN courses c WHERE c.code = '32828' ORDER BY s.id;
INSERT INTO enrollments (student_id, course_id, group_name) SELECT s.id, c.id, s.default_group FROM students s CROSS JOIN courses c WHERE c.code = '32829' AND s.campus_id NOT IN (6878, 6888) ORDER BY s.id;
INSERT INTO enrollments (student_id, course_id, group_name) SELECT s.id, c.id, s.default_group FROM students s CROSS JOIN courses c WHERE c.code = '32830' AND s.campus_id NOT IN (2515, 9405, 6881) ORDER BY s.id;
INSERT INTO enrollments (student_id, course_id, group_name) SELECT s.id, c.id, s.default_group FROM students s CROSS JOIN courses c WHERE c.code = '33966' AND s.campus_id NOT IN (6880, 6886, 6882) ORDER BY s.id;

COMMIT;
