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
  return { status: response.status, data: await response.json() };
}
async function login(email) {
  const result = await api("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return result.data.token;
}
test("academic workflows, validation, authorization and transactional capacity", async () => {
  assert.ok(password, "DEMO_PASSWORD must be configured.");
  assert.equal((await api("/health")).status, 200);
  assert.equal((await api("/students")).status, 401);
  assert.equal((await api("/students", { token: "invalid" })).status, 401);
  assert.equal(
    (
      await api("/auth/login", {
        method: "POST",
        body: { email: "admin@example.edu", password: "wrong" },
      })
    ).status,
    401,
  );
  const admin = await login("admin@example.edu");
  const instructor = await login("instructor@example.edu");
  const student = await login("student@example.edu");
  const ownStudents = await api("/students", { token: student });
  assert.equal(ownStudents.data.length, 1);
  const ownId = ownStudents.data[0].id;
  assert.equal(
    (
      await api("/students", {
        token: instructor,
        method: "POST",
        body: { name: "Blocked", major: "Engineering", semester: 1 },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api("/courses", {
        token: student,
        method: "POST",
        body: { name: "Blocked", instructor: "Test", capacity: 1 },
      })
    ).status,
    403,
  );
  assert.equal(
    (await api("/students", { token: admin, method: "POST", body: [] })).status,
    400,
  );
  assert.equal(
    (
      await api("/students", {
        token: admin,
        method: "POST",
        body: { name: " ", major: "Engineering", semester: 1 },
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await api("/students", {
        token: admin,
        method: "POST",
        body: { name: "Test", major: "Engineering", semester: 13 },
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await api("/courses", {
        token: admin,
        method: "POST",
        body: { name: "Test", instructor: "Test", capacity: 1.5 },
      })
    ).status,
    422,
  );
  const stamp = Date.now();
  const first = await api("/students", {
    token: admin,
    method: "POST",
    body: {
      name: `Test Student ${stamp}`,
      major: "Computer Science",
      semester: 2,
    },
  });
  const second = await api("/students", {
    token: admin,
    method: "POST",
    body: {
      name: `Second Student ${stamp}`,
      major: "Computer Science",
      semester: 3,
    },
  });
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  const course = await api("/courses", {
    token: admin,
    method: "POST",
    body: {
      name: `Capacity Test ${stamp}`,
      instructor: "Test Instructor",
      capacity: 1,
    },
  });
  assert.equal(course.status, 201);
  const enroll = (id) =>
    api("/enrollments", {
      token: admin,
      method: "POST",
      body: { studentId: id, courseId: course.data.id },
    });
  const concurrent = await Promise.all([
    enroll(first.data.id),
    enroll(second.data.id),
  ]);
  assert.deepEqual(concurrent.map((row) => row.status).sort(), [201, 409]);
  const winner = concurrent.find((row) => row.status === 201).data;
  assert.equal((await enroll(winner.student_id)).status, 409);
  assert.equal(
    (
      await api("/enrollments", {
        token: admin,
        method: "POST",
        body: { studentId: first.data.id, courseId: 2147483647 },
      })
    ).status,
    404,
  );
  const selfCourse = await api("/courses", {
    token: admin,
    method: "POST",
    body: {
      name: `Self Enrollment ${stamp}`,
      instructor: "Test Instructor",
      capacity: 10,
    },
  });
  const ownEnrollment = await api("/enrollments", {
    token: student,
    method: "POST",
    body: { studentId: first.data.id, courseId: selfCourse.data.id },
  });
  assert.equal(ownEnrollment.status, 201);
  assert.equal(
    ownEnrollment.data.student_id,
    ownId,
    "Students cannot enroll another student.",
  );
  const visibleEnrollments = await api("/enrollments", { token: student });
  assert.ok(visibleEnrollments.data.every((row) => row.student_id === ownId));
  const reports = await api("/reports", { token: student });
  assert.equal(reports.data.length, 1);
  assert.ok(reports.data[0].courses.includes(selfCourse.data.name));
  const myCourses = await api("/my-courses", { token: student });
  assert.ok(myCourses.data.some((row) => row.id === selfCourse.data.id));
  assert.ok(!myCourses.data.some((row) => row.id === course.data.id));
  const ownRoster = await api(`/courses/${selfCourse.data.id}/students`, {
    token: student,
  });
  assert.equal(ownRoster.status, 200);
  assert.deepEqual(
    ownRoster.data.map((row) => row.id),
    [ownId],
  );
  assert.ok(
    ownRoster.data.every(
      (row) => !("email" in row) && !("password_hash" in row),
    ),
  );
  assert.equal(
    (await api(`/courses/${course.data.id}/students`, { token: student }))
      .status,
    403,
  );
  assert.equal(
    (
      await api(`/courses/${selfCourse.data.id}/students`, {
        token: instructor,
      })
    ).status,
    403,
  );
  const teachers = await api("/instructors", { token: admin });
  const teacherId = teachers.data.find((row) => row.name === "Carlos Ruiz").id;
  assert.equal((await api("/instructors", { token: student })).status, 403);
  assert.equal(
    (
      await api(`/courses/${selfCourse.data.id}/instructor`, {
        token: instructor,
        method: "POST",
        body: { instructorId: teacherId },
      })
    ).status,
    403,
  );
  const adminAccount = await api("/auth/me", { token: admin });
  assert.equal(
    (
      await api(`/courses/${selfCourse.data.id}/instructor`, {
        token: admin,
        method: "POST",
        body: { instructorId: adminAccount.data.id },
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await api(`/courses/${selfCourse.data.id}/instructor`, {
        token: admin,
        method: "POST",
        body: { instructorId: teacherId },
      })
    ).status,
    200,
  );
  const assigned = await api("/my-courses", { token: instructor });
  assert.ok(assigned.data.some((row) => row.id === selfCourse.data.id));
  assert.ok(!assigned.data.some((row) => row.id === course.data.id));
  assert.equal(
    (
      await api(`/courses/${selfCourse.data.id}/students`, {
        token: instructor,
      })
    ).status,
    200,
  );
  assert.equal(
    (await api(`/courses/${course.data.id}/students`, { token: instructor }))
      .status,
    403,
  );
  assert.equal(
    (await api(`/courses/${course.data.id}/students`, { token: admin })).status,
    200,
  );
  const teacherEnrollments = await api("/enrollments", { token: instructor });
  assert.ok(
    !teacherEnrollments.data.some((row) => row.course_id === course.data.id),
  );
  const teacherStudents = await api("/students", { token: instructor });
  assert.ok(
    !teacherStudents.data.some(
      (row) => row.id === first.data.id || row.id === second.data.id,
    ),
  );
  const teacherReports = await api("/reports", { token: instructor });
  assert.ok(
    teacherReports.data.every((row) => !row.courses.includes(course.data.name)),
  );
  const architecture = assigned.data.find(
    (row) => row.name === "Software Architecture",
  );
  assert.ok(
    architecture,
    "The demonstration instructor has an initial assignment.",
  );
  const classmates = await api(`/courses/${architecture.id}/students`, {
    token: student,
  });
  assert.equal(classmates.status, 200);
  assert.ok(classmates.data.some((row) => row.name === "Luis Perez"));
  let notifications = [];
  for (let attempt = 0; attempt < 10; attempt++) {
    notifications = (await api("/notifications", { token: student })).data;
    if (
      notifications.some((row) =>
        row.message.includes(`#${ownEnrollment.data.id} `),
      )
    )
      break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.ok(
    notifications.some((row) =>
      row.message.includes(`#${ownEnrollment.data.id} `),
    ),
    "Worker must deliver the enrollment event.",
  );
  assert.equal(
    (await api("/auth/logout", { token: student, method: "POST", body: {} }))
      .status,
    200,
  );
  assert.equal(
    (await api("/students", { token: student })).status,
    401,
    "Logout must revoke the JWT.",
  );
  const altered = admin.slice(0, -5) + "abcde";
  assert.equal((await api("/students", { token: altered })).status, 401);
  assert.equal((await api("/missing", { token: admin })).status, 404);
});
