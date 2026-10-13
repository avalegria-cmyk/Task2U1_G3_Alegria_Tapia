import test from "node:test";
import assert from "node:assert/strict";
const base = process.env.BASE_URL || "http://localhost:8080";
const password = process.env.DEMO_PASSWORD;
async function api(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `${method} ${path}: HTTP ${response.status}: ${text.slice(0, 200)}`,
    );
  }
  return { status: response.status, data };
}
async function login(email) {
  const result = await api("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return result.data.token;
}
test("university modules, participant data, bulk enrollment, notifications and role boundaries", async () => {
  assert.equal((await api("/health")).status, 200);
  assert.equal((await api("/students")).status, 401);
  const admin = await login("admin@example.edu");
  const teacher = await login("kevin.chuquitarco@example.edu");
  const student = await login("adonis.alegria@example.edu");
  const students = (await api("/students", { token: admin })).data;
  const courses = (await api("/courses", { token: admin })).data;
  assert.equal(students.length, 13);
  assert.equal(courses.length, 4);
  assert.deepEqual(
    courses.map((course) => course.enrolled),
    [13, 11, 10, 10],
  );
  const architecture = courses.find((course) => course.code === "32828");
  const security = courses.find((course) => course.code === "32829");
  const adonis = students.find((row) => row.campus_id === 6878);
  const pamela = students.find((row) => row.campus_id === 6888);
  const carlos = students.find((row) => row.campus_id === 2515);
  assert.equal((await api("/my-courses", { token: teacher })).data.length, 4);
  const mine = (await api("/my-courses", { token: student })).data;
  assert.equal(mine.length, 3);
  assert.ok(!mine.some((row) => row.code === "32829"));
  const roster = (
    await api(`/courses/${architecture.id}/students`, { token: student })
  ).data;
  assert.equal(roster.length, 14);
  assert.equal(roster.filter((row) => row.role === "instructor").length, 1);
  assert.ok(roster.some((row) => row.last_name === "CALAPUCHA ÑACATA"));
  assert.equal(
    roster.find((row) => row.student_id === adonis.id).group_name,
    "Group 3",
  );
  assert.ok(
    roster.every((row) => !("email" in row) && !("password_hash" in row)),
  );
  assert.equal(
    (await api(`/courses/${security.id}/students`, { token: student })).status,
    403,
  );
  assert.equal(
    (
      await api(`/courses/${security.id}/access`, {
        token: student,
        method: "POST",
        body: {},
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api(`/courses/${architecture.id}/access`, {
        token: student,
        method: "POST",
        body: {},
      })
    ).status,
    200,
  );
  assert.ok(
    (
      await api(`/courses/${architecture.id}/students`, { token: student })
    ).data.find((row) => row.student_id === adonis.id).last_access_at,
  );
  assert.equal(
    (
      await api("/enrollments", {
        token: student,
        method: "POST",
        body: { courseId: security.id, studentIds: [adonis.id] },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api("/enrollments", {
        token: teacher,
        method: "POST",
        body: { courseId: security.id, studentIds: [adonis.id] },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api("/enrollments", {
        token: admin,
        method: "POST",
        body: { courseId: security.id, studentIds: [] },
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await api("/enrollments", {
        token: admin,
        method: "POST",
        body: { courseId: security.id, studentIds: [adonis.id, carlos.id] },
      })
    ).status,
    409,
  );
  assert.equal(
    (await api("/enrollments", { token: admin })).data.length,
    44,
    "A failed batch must be fully rolled back.",
  );
  const enrolled = await api("/enrollments", {
    token: admin,
    method: "POST",
    body: { courseId: security.id, studentIds: [adonis.id, pamela.id] },
  });
  assert.equal(enrolled.status, 201);
  assert.equal(enrolled.data.enrollments.length, 2);
  assert.equal((await api("/enrollments", { token: admin })).data.length, 46);
  assert.equal((await api("/my-courses", { token: student })).data.length, 4);
  const studentNotifications = (await api("/notifications", { token: student }))
    .data;
  const teacherNotifications = (await api("/notifications", { token: teacher }))
    .data;
  const adminNotifications = (await api("/notifications", { token: admin }))
    .data;
  assert.equal(studentNotifications.length, 1);
  assert.equal(teacherNotifications.length, 2);
  assert.equal(adminNotifications.length, 2);
  assert.equal(
    (
      await api(`/notifications/${adminNotifications[0].id}/read`, {
        token: student,
        method: "POST",
        body: {},
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await api(`/notifications/${studentNotifications[0].id}/read`, {
        token: student,
        method: "POST",
        body: {},
      })
    ).status,
    200,
  );
  assert.ok((await api("/notifications", { token: student })).data[0].read_at);
  const capacityCourse = await api("/courses", {
    token: admin,
    method: "POST",
    body: {
      name: "Isolated capacity test",
      instructor: "Unassigned",
      capacity: 1,
    },
  });
  assert.equal(capacityCourse.status, 201);
  assert.equal(
    (
      await api(`/courses/${capacityCourse.data.id}/students`, {
        token: teacher,
      })
    ).status,
    403,
  );
  const attempts = await Promise.all(
    [adonis.id, pamela.id].map((id) =>
      api("/enrollments", {
        token: admin,
        method: "POST",
        body: { studentId: id, courseId: capacityCourse.data.id },
      }),
    ),
  );
  assert.deepEqual(attempts.map((row) => row.status).sort(), [201, 409]);
  const newStudent = await api("/students", {
    token: admin,
    method: "POST",
    body: {
      firstName: "Test",
      lastName: "Registrar",
      major: "Software Engineering",
      semester: 8,
      group: "Group 8",
    },
  });
  assert.equal(newStudent.status, 201);
  assert.equal(newStudent.data.first_name, "Test");
  assert.equal(newStudent.data.default_group, "Group 8");
  const teachers = (await api("/instructors", { token: admin })).data;
  const courseInput = {
    name: "Registration workflow test",
    code: "TEST-REG",
    category: "Software Development",
    capacity: 5,
    instructorId: teachers[0].id,
  };
  const newCourse = await api("/courses", {
    token: admin,
    method: "POST",
    body: courseInput,
  });
  assert.equal(newCourse.status, 201);
  assert.equal(newCourse.data.instructor_user_id, teachers[0].id);
  assert.equal(
    (await api("/courses", { token: admin, method: "POST", body: courseInput }))
      .status,
    409,
  );
  assert.equal(
    (
      await api("/courses", {
        token: admin,
        method: "POST",
        body: { ...courseInput, code: "INVALID", instructorId: 2147483647 },
      })
    ).status,
    422,
  );
  const registration = await api("/enrollments", {
    token: admin,
    method: "POST",
    body: { studentId: newStudent.data.id, courseId: newCourse.data.id },
  });
  assert.equal(registration.status, 201);
  assert.equal(registration.data.enrollments[0].group_name, "Group 8");
  assert.equal(
    (
      await api("/enrollments", {
        token: admin,
        method: "POST",
        body: { studentId: newStudent.data.id, courseId: newCourse.data.id },
      })
    ).status,
    409,
  );
  assert.ok(
    (await api("/reports", { token: admin })).data.some(
      (row) =>
        row.id === newStudent.data.id && row.courses.includes(courseInput.name),
    ),
  );
  assert.equal((await api("/instructors", { token: student })).status, 403);
  assert.equal(
    (await api("/auth/logout", { token: student, method: "POST", body: {} }))
      .status,
    200,
  );
  assert.equal((await api("/my-courses", { token: student })).status, 401);
});
