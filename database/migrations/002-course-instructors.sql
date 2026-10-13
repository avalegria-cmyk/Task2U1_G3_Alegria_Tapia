ALTER TABLE courses ADD COLUMN instructor_user_id integer REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX courses_instructor_user_idx ON courses(instructor_user_id);
-- Link only the known demonstration assignment; other legacy names remain unassigned.
UPDATE courses SET instructor_user_id = users.id
FROM users
WHERE users.email = 'instructor@example.edu' AND users.role = 'instructor'
  AND courses.name = 'Software Architecture' AND courses.instructor = 'Carlos Ruiz';
