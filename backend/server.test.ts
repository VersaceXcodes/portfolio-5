import request from 'supertest';
import { app, pool } from './server.ts'; // import your Express app instance and database pool

// Test helper function to clear database tables after each test
async function clearDatabase() {
  const tables = [
    'sections',
    'portfolios',
    'users',
    'templates',
    'media_files',
    'blog_posts',
    'social_links',
    'notifications',
    'analytics',
    'subscriptions',
    'contacts',
    'testimonials',
    'faq'
  ];
  for (const table of tables) {
    await pool.query(`DELETE FROM ${table};`);
  }
}

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('Authentication Endpoints', () => {
  test('POST /auth/register should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password_hash: 'password123', // directly stored password
        name: 'Test User'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user_id');
    expect(response.body.email).toBe('test@example.com');
  });

  test('POST /auth/login should authenticate a user with valid credentials', async () => {
    // First, register a user to log in
    await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password_hash: 'password123',
      name: 'Test User'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});

describe('Portfolio Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Register and login a test user to get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tester@example.com',
        password_hash: 'password123',
        name: 'Tester'
      });

    userId = registerResponse.body.user_id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'tester@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  test('POST /portfolios should create a new portfolio', async () => {
    const response = await request(app)
      .post('/api/portfolios')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        user_id: userId,
        title: 'My Portfolio',
        template_id: 't1',
        is_published: false
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('portfolio_id');
    expect(response.body.title).toBe('My Portfolio');
  });

  test('GET /portfolios/:portfolio_id should retrieve a specific portfolio', async () => {
    // First, create a portfolio
    const createResponse = await request(app)
      .post('/api/portfolios')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        user_id: userId,
        title: 'My Portfolio',
        template_id: 't1',
        is_published: true
      });

    const portfolioId = createResponse.body.portfolio_id;

    const response = await request(app)
      .get(`/api/portfolios/${portfolioId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('portfolio_id', portfolioId);
  });
});

describe('WebSocket Events', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Register and login a test user to get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'ws-tester@example.com',
        password_hash: 'password123',
        name: 'WS Tester'
      });

    userId = registerResponse.body.user_id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ws-tester@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  // Use a mock WebSocket server library to test the WebSocket functionality
  // This could be done using libraries such as Socket.IO-client for client-side simulation
  test('Should receive an event on portfolio updates', (done) => {
    const client = require('socket.io-client')('http://localhost:3000');

    client.on('connect', () => {
      client.emit('subscribe', { channel: 'portfolio/updates' });
    });

    client.on('portfolio/updates', (payload: any) => {
      expect(payload).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        template_id: expect.any(String),
        is_published: expect.any(Boolean),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
      client.disconnect();
      done();
    });

    // Simulate a portfolio update
    setTimeout(async () => {
      await request(app)
        .post('/api/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          user_id: userId,
          title: 'Updated Portfolio',
          template_id: 't1',
          is_published: false,
        });
    }, 100);
  });
});