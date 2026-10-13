CREATE TABLE students (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name varchar(120) NOT NULL, major varchar(120) NOT NULL, semester integer NOT NULL CHECK (semester BETWEEN 1 AND 12));
CREATE TABLE courses (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name varchar(120) NOT NULL, instructor varchar(120) NOT NULL, capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 1000));
CREATE TABLE users (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name varchar(120) NOT NULL, email varchar(150) NOT NULL UNIQUE, password_hash text NOT NULL, role varchar(20) NOT NULL CHECK (role IN ('admin','instructor','student')), student_id integer REFERENCES students(id), CHECK (role <> 'student' OR student_id IS NOT NULL));
CREATE TABLE enrollments (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, student_id integer NOT NULL REFERENCES students(id), course_id integer NOT NULL REFERENCES courses(id), UNIQUE (student_id, course_id));
CREATE INDEX enrollments_course_idx ON enrollments(course_id);
CREATE TABLE revoked_tokens (token_id varchar(32) PRIMARY KEY, expires_at timestamptz NOT NULL);
CREATE TABLE domain_events (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, type text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz);
CREATE TABLE notifications (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id), event_id integer NOT NULL REFERENCES domain_events(id), message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,event_id));
