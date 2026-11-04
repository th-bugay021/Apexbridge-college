import { randomBytes, randomUUID } from 'node:crypto';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';
import { createAccessToken } from '../src/utils/tokens.js';

const baseUrl = (process.env.PARENTS_BASE_URL || `http://localhost:${process.env.PORT || env.PORT}`).replace(/\/+$/, '');
const tag = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
const fixtures = { userIds: [], userEmails: [], parentIds: [], studentIds: [], classIds: [] };
let failures = 0;

function report(name, passed, result) {
  if (!passed) failures += 1;
  console.log(`${passed ? 'PASS' : 'FAIL'} - ${name}`);
  if (!passed) {
    console.error('Failure details:', JSON.stringify({
      httpStatus: result?.status ?? 'N/A',
      responseBody: result?.data ?? null,
      url: result?.url ?? 'N/A',
    }));
  }
}

async function request(path, { token, method = 'GET', body } = {}) {
  const url = `${baseUrl}${path}`;
  try {
    const response = await fetch(url, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    let data = null;
    try { if (response.status !== 204) data = await response.json(); } catch { /* Non-JSON responses are retained as null. */ }
    return { status: response.status, code: data?.error?.code, data, url };
  } catch (error) {
    return { status: null, code: null, data: { message: error.message }, url };
  }
}

function parentBody(key, studentIds = []) {
  return {
    fullName: `Verify Parent ${key} ${tag}`,
    email: `parent-${key.toLowerCase()}-${tag.toLowerCase()}@example.invalid`,
    password: 'Parent-password-12',
    phone: `+234800${tag.slice(0, 7)}`,
    occupation: `Occupation ${tag}`,
    address: `Address ${tag}`,
    relationship: `Guardian ${tag}`,
    studentIds,
  };
}

async function cleanup() {
  try {
    if (fixtures.parentIds.length) await prisma.parentStudent.deleteMany({ where: { parentId: { in: fixtures.parentIds } } });
    if (fixtures.userIds.length) await prisma.user.deleteMany({ where: { id: { in: fixtures.userIds } } });
    if (fixtures.userEmails.length) await prisma.user.deleteMany({ where: { email: { in: fixtures.userEmails } } });
    if (fixtures.parentIds.length) await prisma.parent.deleteMany({ where: { id: { in: fixtures.parentIds } } });
    if (fixtures.classIds.length) await prisma.class.deleteMany({ where: { id: { in: fixtures.classIds } } });
    const [users, parents, students, classes, links] = await Promise.all([
      fixtures.userIds.length || fixtures.userEmails.length
        ? prisma.user.count({ where: { OR: [
          ...(fixtures.userIds.length ? [{ id: { in: fixtures.userIds } }] : []),
          ...(fixtures.userEmails.length ? [{ email: { in: fixtures.userEmails } }] : []),
        ] } })
        : 0,
      fixtures.parentIds.length ? prisma.parent.count({ where: { id: { in: fixtures.parentIds } } }) : 0,
      fixtures.studentIds.length ? prisma.student.count({ where: { id: { in: fixtures.studentIds } } }) : 0,
      fixtures.classIds.length ? prisma.class.count({ where: { id: { in: fixtures.classIds } } }) : 0,
      fixtures.parentIds.length ? prisma.parentStudent.count({ where: { parentId: { in: fixtures.parentIds } } }) : 0,
    ]);
    report('Temporary fixtures cleaned up', !(users || parents || students || classes || links));
  } catch (error) {
    report('Temporary fixtures cleaned up', false, { status: 'N/A', data: { message: error.message }, url: 'N/A' });
  }
}

async function createStudent(suffix, classId) {
  const student = await prisma.student.create({
    data: {
      admissionNumber: `PVERIFY-${suffix}-${tag}`,
      firstName: `Student-${tag}`,
      lastName: suffix,
      class: { connect: { id: classId } },
      user: { create: {
        email: `student-${suffix.toLowerCase()}-${tag.toLowerCase()}@example.invalid`,
        passwordHash: randomBytes(32).toString('hex'),
        fullName: `Verify Student ${suffix} ${tag}`,
        role: 'STUDENT',
      } },
    },
    select: { id: true, userId: true },
  });
  fixtures.userIds.push(student.userId);
  fixtures.studentIds.push(student.id);
  return student.id;
}

async function main() {
  try {
    const admin = await prisma.user.create({
      data: {
        email: `parents-admin-${tag.toLowerCase()}@example.invalid`,
        passwordHash: randomBytes(32).toString('hex'),
        fullName: `Verify Admin ${tag}`,
        role: 'ADMIN',
      },
    });
    fixtures.userIds.push(admin.id);
    const token = createAccessToken(admin);
    const classItem = await prisma.class.create({ data: { name: `Verify Parents ${tag}`, level: `VP-${tag}` }, select: { id: true } });
    fixtures.classIds.push(classItem.id);
    const [studentOneId, studentTwoId] = await Promise.all([
      createStudent('ONE', classItem.id),
      createStudent('TWO', classItem.id),
    ]);

    const parentOneBody = parentBody('ONE', [studentOneId]);
    fixtures.userEmails.push(parentOneBody.email);
    const createOne = await request('/api/parents', { token, method: 'POST', body: parentOneBody });
    const parentOne = createOne.data?.parent;
    const parentOneId = parentOne?.id;
    const parentOneUserId = parentOne?.userId ?? parentOne?.user?.id;
    if (parentOneId) fixtures.parentIds.push(parentOneId);
    if (parentOneUserId) fixtures.userIds.push(parentOneUserId);
    report('Create parent with linked student', createOne.status === 201 && parentOne?.user?.fullName === `Verify Parent ONE ${tag}` && parentOne.students?.some(({ id }) => id === studentOneId), createOne);

    const list = await request('/api/parents?page=1&limit=100', { token });
    report('List parents', list.status === 200 && list.data?.parents?.some(({ id }) => id === parentOneId), list);
    const search = await request(`/api/parents?search=${encodeURIComponent(`Verify Parent ONE ${tag}`)}`, { token });
    report('Search parents by full name', search.status === 200 && search.data?.parents?.some(({ id }) => id === parentOneId), search);
    const studentFilter = await request(`/api/parents?studentId=${encodeURIComponent(studentOneId)}`, { token });
    report('Filter parents by linked student', studentFilter.status === 200 && studentFilter.data?.parents?.some(({ id }) => id === parentOneId), studentFilter);
    const detail = await request(`/api/parents/${parentOneId}`, { token });
    const linkedStudent = detail.data?.parent?.students?.find(({ id }) => id === studentOneId);
    report('Get parent with linked student and class', detail.status === 200 && linkedStudent?.class?.name === `Verify Parents ${tag}` && linkedStudent.class.level === `VP-${tag}`, detail);

    const updated = await request(`/api/parents/${parentOneId}`, {
      token,
      method: 'PATCH',
      body: { fullName: `Updated Parent ${tag}`, email: `parent-updated-${tag.toLowerCase()}@example.invalid`, phone: null, occupation: `Updated occupation ${tag}` },
    });
    report('Update parent and linked user profile', updated.status === 200 && updated.data?.parent?.user?.fullName === `Updated Parent ${tag}` && updated.data.parent.user.phone === null && updated.data.parent.occupation === `Updated occupation ${tag}`, updated);

    const linked = await request(`/api/parents/${parentOneId}/students`, { token, method: 'POST', body: { studentId: studentTwoId } });
    report('Link one student', linked.status === 201 && linked.data?.parent?.students?.some(({ id }) => id === studentTwoId), linked);
    const duplicate = await request(`/api/parents/${parentOneId}/students`, { token, method: 'POST', body: { studentId: studentTwoId } });
    report('Duplicate link returns clear conflict', duplicate.status === 409 && duplicate.code === 'PARENT_STUDENT_LINK_EXISTS', duplicate);
    const unlinked = await request(`/api/parents/${parentOneId}/students/${studentTwoId}`, { token, method: 'DELETE' });
    const afterUnlink = await request(`/api/parents/${parentOneId}`, { token });
    const studentRemainsLinked = afterUnlink.data?.parent?.students?.some(({ id }) => id === studentTwoId);
    const unlinkPassed = unlinked.status === 204 && afterUnlink.status === 200 && !studentRemainsLinked;
    report('Unlink student', unlinkPassed, unlinked.status !== 204 ? unlinked : afterUnlink);

    const parentTwoBody = parentBody('TWO', [studentTwoId]);
    fixtures.userEmails.push(parentTwoBody.email);
    const createTwo = await request('/api/parents', { token, method: 'POST', body: parentTwoBody });
    const parentTwo = createTwo.data?.parent;
    const parentTwoId = parentTwo?.id;
    const parentTwoUserId = parentTwo?.userId ?? parentTwo?.user?.id;
    if (parentTwoId) fixtures.parentIds.push(parentTwoId);
    if (parentTwoUserId) fixtures.userIds.push(parentTwoUserId);
    report('Create second parent for bulk deletion', createTwo.status === 201 && parentTwo?.students?.some(({ id }) => id === studentTwoId), createTwo);

    const parentThreeBody = parentBody('THREE', [studentOneId]);
    fixtures.userEmails.push(parentThreeBody.email);
    const createThree = await request('/api/parents', { token, method: 'POST', body: parentThreeBody });
    const parentThree = createThree.data?.parent;
    const parentThreeId = parentThree?.id;
    const parentThreeUserId = parentThree?.userId ?? parentThree?.user?.id;
    if (parentThreeId) fixtures.parentIds.push(parentThreeId);
    if (parentThreeUserId) fixtures.userIds.push(parentThreeUserId);
    report('Create third parent for bulk deletion', createThree.status === 201 && parentThree?.students?.some(({ id }) => id === studentOneId), createThree);

    const singleDelete = await request(`/api/parents/${parentOneId}`, { token, method: 'DELETE' });
    const [studentOneAfterSingle, studentTwoAfterSingle] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentOneId }, select: { id: true } }),
      prisma.student.findUnique({ where: { id: studentTwoId }, select: { id: true } }),
    ]);
    report('Single delete preserves linked students', singleDelete.status === 204 && Boolean(studentOneAfterSingle) && Boolean(studentTwoAfterSingle), singleDelete);

    const bulkDelete = await request('/api/parents/bulk-delete', { token, method: 'POST', body: { ids: [parentTwoId, parentThreeId] } });
    const [studentOneAfterBulk, studentTwoAfterBulk] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentOneId }, select: { id: true } }),
      prisma.student.findUnique({ where: { id: studentTwoId }, select: { id: true } }),
    ]);
    report('Bulk delete preserves linked students', bulkDelete.status === 200 && bulkDelete.data?.deleted === 2 && Boolean(studentOneAfterBulk) && Boolean(studentTwoAfterBulk), bulkDelete);
  } catch (error) {
    report('Setup and parent endpoint verification', false, { status: 'N/A', data: { message: error.message }, url: 'N/A' });
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
  if (failures) process.exitCode = 1;
}

await main();
