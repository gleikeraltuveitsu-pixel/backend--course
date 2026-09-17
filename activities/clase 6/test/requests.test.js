// Requests suite: ownership, authorization and the collection contract.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { createUser, createRequestAs } from './helpers/test-data.js';
import { loginAs } from './helpers/test-auth.js';
import { cleanupCreatedData, closePool } from './helpers/cleanup.js';

after(async () => {
  await cleanupCreatedData();
  await closePool();
});

test('a requester can create a request and becomes its owner', async () => {
  const owner = await createUser({ name: 'owner' });
  const token = await loginAs(owner);

  const created = await createRequestAs(token, { priority: 'high' });

  assert.equal(created.createdBy, owner.id);
  assert.equal(created.status, 'open');
  assert.equal(created.priority, 'high');
});

test('the owner can read their own request', async () => {
  const owner = await createUser({ name: 'reader' });
  const token = await loginAs(owner);
  const created = await createRequestAs(token);

  const response = await request(app)
    .get(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.id, created.id);
});

test('a requester cannot access another user request', async () => {
  // Prepare
  const owner = await createUser({ name: 'victim' });
  const stranger = await createUser({ name: 'stranger' });
  const ownerToken = await loginAs(owner);
  const strangerToken = await loginAs(stranger);
  const savedRequest = await createRequestAs(ownerToken);

  // Act
  const response = await request(app)
    .get(`/requests/${savedRequest.id}`)
    .set('Authorization', `Bearer ${strangerToken}`);

  // Check
  assert.equal(response.status, 404);
});

test('the collection requires a Bearer token', async () => {
  const response = await request(app).get('/requests');
  assert.equal(response.status, 401);
});

test('a requester cannot change the priority, even of their own request', async () => {
  const owner = await createUser({ name: 'nopriority' });
  const token = await loginAs(owner);
  const created = await createRequestAs(token);

  const response = await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ priority: 'low' });

  assert.equal(response.status, 403);
});

test('an agent can move a request through a valid transition', async () => {
  const owner = await createUser({ name: 'transowner' });
  const agent = await createUser({ name: 'agent', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken);

  const response = await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ status: 'in_progress' });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'in_progress');
});

test('BUG-106 regression: a valid filter with no matches returns 200 and []', async () => {
  // A freshly registered requester owns zero requests, so status=closed is
  // a valid filter that matches nothing. The collection must answer an
  // empty array, not 404: an empty collection is NOT a missing resource.
  const loner = await createUser({ name: 'loner' });
  const token = await loginAs(loner);

  const response = await request(app)
    .get('/requests?status=closed')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, []);
});

test('the request history requires a Bearer token', async () => {
  const response = await request(app).get('/requests/1/history');
  assert.equal(response.status, 401);
});

test('the owner reads the full history of their own request', async () => {
  const owner = await createUser({ name: 'histowner' });
  const agent = await createUser({ name: 'histagent', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken);

  await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ status: 'in_progress' });
  await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ priority: 'high' });

  const response = await request(app)
    .get(`/requests/${created.id}/history`)
    .set('Authorization', `Bearer ${ownerToken}`);

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.equal(response.body.length, 3); // birth + status + priority
  // Events are ordered oldest first: the birth event comes first.
  assert.equal(response.body[0].type, 'status_changed');
  assert.equal(response.body[0].fromStatus, null);
});

test('a requester cannot read another user history: same 404 as a missing request', async () => {
  const owner = await createUser({ name: 'victimh' });
  const stranger = await createUser({ name: 'strangerh' });
  const ownerToken = await loginAs(owner);
  const strangerToken = await loginAs(stranger);
  const created = await createRequestAs(ownerToken);

  const foreign = await request(app)
    .get(`/requests/${created.id}/history`)
    .set('Authorization', `Bearer ${strangerToken}`);
  const missing = await request(app)
    .get('/requests/999999999/history')
    .set('Authorization', `Bearer ${strangerToken}`);

  // Existence must not be revealed: both answer the exact same 404.
  assert.equal(foreign.status, 404);
  assert.equal(missing.status, 404);
  assert.equal(foreign.body.error.code, 'REQUEST_NOT_FOUND');
  assert.equal(missing.body.error.code, foreign.body.error.code);
});

test('an agent can read any request history', async () => {
  const owner = await createUser({ name: 'anyowner' });
  const agent = await createUser({ name: 'anyagent', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken);

  const response = await request(app)
    .get(`/requests/${created.id}/history`)
    .set('Authorization', `Bearer ${agentToken}`);

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length >= 1);
});

test('a missing request history returns 404', async () => {
  const owner = await createUser({ name: 'nohistory' });
  const token = await loginAs(owner);

  const response = await request(app)
    .get('/requests/999999999/history')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 404);
});

test('history events are ordered oldest first', async () => {
  const owner = await createUser({ name: 'orderedo' });
  const agent = await createUser({ name: 'ordereda', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken);

  await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ status: 'in_progress' });
  await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ priority: 'high' });

  const response = await request(app)
    .get(`/requests/${created.id}/history`)
    .set('Authorization', `Bearer ${ownerToken}`);

  const times = response.body.map((event) => new Date(event.createdAt).getTime());
  const sorted = [...times].sort((a, b) => a - b);
  assert.deepEqual(times, sorted);
  assert.equal(response.body[0].fromStatus, null);
});

test('history events expose only their own fields, never secrets', async () => {
  const owner = await createUser({ name: 'cleanowner' });
  const agent = await createUser({ name: 'cleanagent', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken);

  await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ priority: 'high' });

  const response = await request(app)
    .get(`/requests/${created.id}/history`)
    .set('Authorization', `Bearer ${ownerToken}`);

  const event = response.body.find((item) => item.type === 'priority_changed');
  // Each event type exposes ONLY its own fields.
  assert.deepEqual(Object.keys(event).sort(),
    ['createdAt', 'fromPriority', 'id', 'toPriority', 'type']);
  // Internal and sensitive data never reach the client.
  const text = response.text.toLowerCase();
  for (const forbidden of ['password', 'hash', 'secret', 'jwt', 'changedby']) {
    assert.ok(!text.includes(forbidden), `response must not contain "${forbidden}"`);
  }
});
