import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Pool, PoolConfig } from 'pg';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';

// Import Zod schemas
import {
  userSchema, createUserInputSchema, updateUserInputSchema, searchUserInputSchema,
  portfolioSchema, createPortfolioInputSchema, updatePortfolioInputSchema, searchPortfolioInputSchema,
  sectionSchema, createSectionInputSchema, updateSectionInputSchema,
  mediaFileSchema, createMediaFileInputSchema,
  blogPostSchema, createBlogPostInputSchema,
  subscriptionSchema, searchSubscriptionInputSchema,
  notificationSchema, createNotificationInputSchema,
  analyticsSchema,
  contactSchema, createContactInputSchema,
  testimonialSchema, createTestimonialInputSchema
} from './schema.js';

dotenv.config();

// Type definitions
interface UserPayload extends JwtPayload {
  user_id: string;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    name: string;
    created_at: string;
  };
}

interface AuthenticatedSocket extends Socket {
  user?: {
    user_id: string;
    email: string;
    name: string;
    created_at: string;
  };
}

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables
const { 
  DATABASE_URL, 
  PGHOST, 
  PGDATABASE, 
  PGUSER, 
  PGPASSWORD, 
  PGPORT = 5432, 
  JWT_SECRET = 'your-secret-key',
  PORT = 3000 
} = process.env;

// PostgreSQL connection
const poolConfig: PoolConfig = DATABASE_URL
  ? { 
      connectionString: DATABASE_URL, 
      ssl: { rejectUnauthorized: false } 
    }
  : {
      host: PGHOST,
      database: PGDATABASE,
      user: PGUSER,
      password: PGPASSWORD,
      port: Number(PGPORT),
      ssl: { rejectUnauthorized: false },
    };

const pool = new Pool(poolConfig);

// Express app setup
const app = express();
const server = createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create storage directory if it doesn't exist
const storageDir = path.join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Error response utility
interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
  timestamp: string;
}

function createErrorResponse(
  message: string,
  error?: any,
  errorCode?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error && process.env.NODE_ENV === 'development') {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

// Authentication middleware for protected routes
const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_REQUIRED'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    const result = await pool.query('SELECT user_id, email, name, created_at FROM users WHERE user_id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid token', null, 'AUTH_TOKEN_INVALID'));
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

// WebSocket authentication middleware
const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    const result = await pool.query('SELECT user_id, email, name, created_at FROM users WHERE user_id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return next(new Error('Invalid token'));
    }

    socket.user = result.rows[0];
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

// WebSocket connection handling
io.use(authenticateSocket);

io.on('connection', (socket: AuthenticatedSocket) => {
  console.log(`User ${socket.user!.email} connected via WebSocket`);

  // Join user-specific room for notifications
  socket.join(`user_${socket.user!.user_id}`);

  // Handle portfolio updates for live preview
  socket.on('portfolio_update', async (data) => {
    try {
      // Broadcast live preview updates to all clients viewing this portfolio
      socket.broadcast.to(`portfolio_${data.portfolio_id}`).emit('live_preview_update', {
        portfolio_id: data.portfolio_id,
        updates: data.updates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('error', createErrorResponse('Failed to broadcast portfolio update', error));
    }
  });

  // Join portfolio room for live preview
  socket.on('join_portfolio', (portfolio_id) => {
    socket.join(`portfolio_${portfolio_id}`);
  });

  // Leave portfolio room
  socket.on('leave_portfolio', (portfolio_id) => {
    socket.leave(`portfolio_${portfolio_id}`);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user!.email} disconnected`);
  });
});

/*
  Helper function to emit real-time notifications to specific users
*/
function emitNotificationToUser(user_id, notification) {
  io.to(`user_${user_id}`).emit('notification', notification);
}

/*
  Helper function to emit portfolio updates to all viewers
*/
function emitPortfolioUpdate(portfolio_id, portfolio_data) {
  io.to(`portfolio_${portfolio_id}`).emit('portfolio_updates', portfolio_data);
}

/*
  Helper function to emit analytics updates
*/
function emitAnalyticsUpdate(portfolio_id, analytics_data) {
  io.to(`portfolio_${portfolio_id}`).emit('analytics/updates', analytics_data);
}

// AUTH ENDPOINTS

/*
  Register endpoint - Creates a new user account with email, password, and name
  Validates input using Zod schema and stores password in plain text for development
*/
app.post('/api/auth/register', async (req, res) => {
  try {
    const validatedData = createUserInputSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', [validatedData.email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json(createErrorResponse('User with this email already exists', null, 'USER_ALREADY_EXISTS'));
    }

    // Create new user (store password directly for development)
    const user_id = uuidv4();
    const created_at = new Date().toISOString();
    
    const result = await pool.query(
      'INSERT INTO users (user_id, email, password_hash, name, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, name, created_at',
      [user_id, validatedData.email.toLowerCase().trim(), validatedData.password_hash, validatedData.name.trim(), created_at]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Emit authentication update via WebSocket
    emitNotificationToUser(user.user_id, {
      type: 'authentication',
      current_user: user,
      auth_token: token,
      authentication_status: {
        is_authenticated: true,
        is_loading: false
      },
      error_message: null
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: user,
      token: token
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Login endpoint - Authenticates user credentials and returns JWT token
  Uses direct password comparison for development purposes
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Find user and verify password (direct comparison for development)
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    const user = result.rows[0];

    // Direct password comparison for development
    if (password !== user.password_hash) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    const userResponse = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    };

    // Emit authentication update via WebSocket
    emitNotificationToUser(user.user_id, {
      type: 'authentication',
      current_user: userResponse,
      auth_token: token,
      authentication_status: {
        is_authenticated: true,
        is_loading: false
      },
      error_message: null
    });

    res.json({
      message: 'Login successful',
      user: userResponse,
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Password recovery endpoint - Mock implementation for development
  @@need:external-api : Email service for sending password reset emails
*/
app.post('/api/auth/password-recovery', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(createErrorResponse('Email is required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Mock password recovery response
    res.json({
      message: 'If an account with that email exists, a password recovery email has been sent',
      success: true
    });
  } catch (error) {
    console.error('Password recovery error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// PORTFOLIO ENDPOINTS

/*
  Get portfolios endpoint - Retrieves portfolios with search, pagination, and sorting
  Supports query parameters for filtering and ordering results
*/
app.get('/api/portfolios', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedQuery = searchPortfolioInputSchema.parse(req.query);
    
    let queryStr = 'SELECT * FROM portfolios WHERE user_id = $1';
    const queryParams: any[] = [req.user!.user_id];
    let paramIndex = 2;

    // Add search functionality
    if (validatedQuery.query) {
      queryStr += ` AND title ILIKE $${paramIndex}`;
      queryParams.push(`%${validatedQuery.query}%`);
      paramIndex++;
    }

    // Add sorting
    queryStr += ` ORDER BY ${validatedQuery.sort_by} ${validatedQuery.sort_order.toUpperCase()}`;

    // Add pagination
    queryStr += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(validatedQuery.limit, validatedQuery.offset);

    const result = await pool.query(queryStr, queryParams);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get portfolios error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid query parameters', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Create portfolio endpoint - Creates a new portfolio for the authenticated user
  Validates input data and generates unique portfolio ID
*/
app.post('/api/portfolios', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createPortfolioInputSchema.parse(req.body);
    
    // Ensure user_id matches authenticated user
    if (validatedData.user_id !== req.user!.user_id) {
      return res.status(403).json(createErrorResponse('Cannot create portfolio for another user', null, 'FORBIDDEN'));
    }

    const portfolio_id = uuidv4();
    const created_at = new Date().toISOString();
    const updated_at = created_at;

    const result = await pool.query(
      'INSERT INTO portfolios (portfolio_id, user_id, title, template_id, is_published, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [portfolio_id, validatedData.user_id, validatedData.title, validatedData.template_id, validatedData.is_published, created_at, updated_at]
    );

    const portfolio = result.rows[0];

    // Create initial analytics entry
    const analytics_id = uuidv4();
    await pool.query(
      'INSERT INTO analytics (analytics_id, portfolio_id, page_views, unique_visitors, average_time_spent) VALUES ($1, $2, $3, $4, $5)',
      [analytics_id, portfolio_id, 0, 0, 0]
    );

    // Emit portfolio update via WebSocket
    emitPortfolioUpdate(portfolio_id, portfolio);

    res.status(201).json(portfolio);
  } catch (error) {
    console.error('Create portfolio error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Get specific portfolio endpoint - Retrieves a single portfolio by ID
  Includes authorization check to ensure user owns the portfolio
*/
app.get('/api/portfolios/:portfolio_id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM portfolios WHERE portfolio_id = $1 AND user_id = $2',
      [portfolio_id, req.user!.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Portfolio not found', null, 'PORTFOLIO_NOT_FOUND'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update portfolio endpoint - Updates an existing portfolio
  Validates input and ensures user authorization
*/
app.put('/api/portfolios/:portfolio_id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id } = req.params;
    const updates = { ...req.body, portfolio_id };
    const validatedData = updatePortfolioInputSchema.parse(updates);

    // Check if portfolio exists and belongs to user
    const existingPortfolio = await pool.query(
      'SELECT * FROM portfolios WHERE portfolio_id = $1 AND user_id = $2',
      [portfolio_id, req.user!.user_id]
    );

    if (existingPortfolio.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Portfolio not found', null, 'PORTFOLIO_NOT_FOUND'));
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (validatedData.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      updateValues.push(validatedData.title);
      paramIndex++;
    }

    if (validatedData.template_id !== undefined) {
      updateFields.push(`template_id = $${paramIndex}`);
      updateValues.push(validatedData.template_id);
      paramIndex++;
    }

    if (validatedData.is_published !== undefined) {
      updateFields.push(`is_published = $${paramIndex}`);
      updateValues.push(validatedData.is_published);
      paramIndex++;
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    updateValues.push(new Date().toISOString());
    paramIndex++;

    updateValues.push(portfolio_id, req.user!.user_id);

    const result = await pool.query(
      `UPDATE portfolios SET ${updateFields.join(', ')} WHERE portfolio_id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      updateValues
    );

    const updatedPortfolio = result.rows[0];

    // Emit portfolio update via WebSocket
    emitPortfolioUpdate(portfolio_id, updatedPortfolio);

    res.json(updatedPortfolio);
  } catch (error) {
    console.error('Update portfolio error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete portfolio endpoint - Permanently removes a portfolio and all associated data
  Cascades deletion to sections, media files, and other related entities
*/
app.delete('/api/portfolios/:portfolio_id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id } = req.params;

    // Check if portfolio exists and belongs to user
    const existingPortfolio = await pool.query(
      'SELECT * FROM portfolios WHERE portfolio_id = $1 AND user_id = $2',
      [portfolio_id, req.user!.user_id]
    );

    if (existingPortfolio.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Portfolio not found', null, 'PORTFOLIO_NOT_FOUND'));
    }

    // Delete all related data (cascade delete)
    await pool.query('DELETE FROM media_files WHERE section_id IN (SELECT section_id FROM sections WHERE portfolio_id = $1)', [portfolio_id]);
    await pool.query('DELETE FROM sections WHERE portfolio_id = $1', [portfolio_id]);
    await pool.query('DELETE FROM blog_posts WHERE portfolio_id = $1', [portfolio_id]);
    await pool.query('DELETE FROM social_links WHERE portfolio_id = $1', [portfolio_id]);
    await pool.query('DELETE FROM analytics WHERE portfolio_id = $1', [portfolio_id]);
    await pool.query('DELETE FROM contacts WHERE portfolio_id = $1', [portfolio_id]);
    await pool.query('DELETE FROM testimonials WHERE portfolio_id = $1', [portfolio_id]);
    await pool.query('DELETE FROM faq WHERE portfolio_id = $1', [portfolio_id]);
    await pool.query('DELETE FROM portfolios WHERE portfolio_id = $1', [portfolio_id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// SECTION ENDPOINTS

/*
  Get portfolio sections endpoint - Retrieves all sections for a specific portfolio
  Orders sections by their specified order field
*/
app.get('/api/portfolios/:portfolio_id/sections', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id } = req.params;

    // Verify portfolio ownership
    const portfolioCheck = await pool.query(
      'SELECT portfolio_id FROM portfolios WHERE portfolio_id = $1 AND user_id = $2',
      [portfolio_id, req.user!.user_id]
    );

    if (portfolioCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Portfolio not found', null, 'PORTFOLIO_NOT_FOUND'));
    }

    const result = await pool.query(
      'SELECT * FROM sections WHERE portfolio_id = $1 ORDER BY "order" ASC',
      [portfolio_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get portfolio sections error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Add portfolio section endpoint - Creates a new section within a portfolio
  Validates section data and maintains proper ordering
*/
app.post('/api/portfolios/:portfolio_id/sections', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id } = req.params;
    const sectionData = { ...req.body, portfolio_id };
    const validatedData = createSectionInputSchema.parse(sectionData);

    // Verify portfolio ownership
    const portfolioCheck = await pool.query(
      'SELECT portfolio_id FROM portfolios WHERE portfolio_id = $1 AND user_id = $2',
      [portfolio_id, req.user!.user_id]
    );

    if (portfolioCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Portfolio not found', null, 'PORTFOLIO_NOT_FOUND'));
    }

    const section_id = uuidv4();
    const result = await pool.query(
      'INSERT INTO sections (section_id, portfolio_id, type, content, "order") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [section_id, validatedData.portfolio_id, validatedData.type, validatedData.content, validatedData.order]
    );

    const section = result.rows[0];

    // Emit portfolio update via WebSocket
    emitPortfolioUpdate(portfolio_id, { type: 'section_added', section });

    res.status(201).json(section);
  } catch (error) {
    console.error('Add portfolio section error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Update portfolio section endpoint - Modifies an existing section
  Validates input and maintains data integrity
*/
app.put('/api/portfolios/:portfolio_id/sections/:section_id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id, section_id } = req.params;
    const updates = { ...req.body, section_id };
    const validatedData = updateSectionInputSchema.parse(updates);

    // Verify portfolio and section ownership
    const sectionCheck = await pool.query(
      'SELECT s.* FROM sections s JOIN portfolios p ON s.portfolio_id = p.portfolio_id WHERE s.section_id = $1 AND s.portfolio_id = $2 AND p.user_id = $3',
      [section_id, portfolio_id, req.user!.user_id]
    );

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Section not found', null, 'SECTION_NOT_FOUND'));
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (validatedData.type !== undefined) {
      updateFields.push(`type = $${paramIndex}`);
      updateValues.push(validatedData.type);
      paramIndex++;
    }

    if (validatedData.content !== undefined) {
      updateFields.push(`content = $${paramIndex}`);
      updateValues.push(validatedData.content);
      paramIndex++;
    }

    if (validatedData.order !== undefined) {
      updateFields.push(`"order" = $${paramIndex}`);
      updateValues.push(validatedData.order);
      paramIndex++;
    }

    updateValues.push(section_id);

    const result = await pool.query(
      `UPDATE sections SET ${updateFields.join(', ')} WHERE section_id = $${paramIndex} RETURNING *`,
      updateValues
    );

    const updatedSection = result.rows[0];

    // Emit portfolio update via WebSocket
    emitPortfolioUpdate(portfolio_id, { type: 'section_updated', section: updatedSection });

    res.json(updatedSection);
  } catch (error) {
    console.error('Update portfolio section error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Delete portfolio section endpoint - Removes a section and its associated media
  Cascades deletion to related media files
*/
app.delete('/api/portfolios/:portfolio_id/sections/:section_id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id, section_id } = req.params;

    // Verify portfolio and section ownership
    const sectionCheck = await pool.query(
      'SELECT s.* FROM sections s JOIN portfolios p ON s.portfolio_id = p.portfolio_id WHERE s.section_id = $1 AND s.portfolio_id = $2 AND p.user_id = $3',
      [section_id, portfolio_id, req.user!.user_id]
    );

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Section not found', null, 'SECTION_NOT_FOUND'));
    }

    // Delete associated media files first
    await pool.query('DELETE FROM media_files WHERE section_id = $1', [section_id]);
    
    // Delete the section
    await pool.query('DELETE FROM sections WHERE section_id = $1', [section_id]);

    // Emit portfolio update via WebSocket
    emitPortfolioUpdate(portfolio_id, { type: 'section_deleted', section_id });

    res.status(204).send();
  } catch (error) {
    console.error('Delete portfolio section error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// MEDIA ENDPOINTS

/*
  Get portfolio media endpoint - Retrieves all media files associated with a portfolio
  Joins with sections table to ensure proper ownership validation
*/
app.get('/api/portfolios/:portfolio_id/media', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id } = req.params;

    // Verify portfolio ownership
    const portfolioCheck = await pool.query(
      'SELECT portfolio_id FROM portfolios WHERE portfolio_id = $1 AND user_id = $2',
      [portfolio_id, req.user!.user_id]
    );

    if (portfolioCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Portfolio not found', null, 'PORTFOLIO_NOT_FOUND'));
    }

    const result = await pool.query(
      'SELECT m.* FROM media_files m JOIN sections s ON m.section_id = s.section_id WHERE s.portfolio_id = $1',
      [portfolio_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get portfolio media error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// File upload endpoint for media
app.post('/api/upload', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json(createErrorResponse('No file uploaded', null, 'NO_FILE_UPLOADED'));
    }

    const file_url = `/storage/${req.file.filename}`;
    
    res.json({
      file_url,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json(createErrorResponse('File upload failed', error, 'UPLOAD_ERROR'));
  }
});

// Serve uploaded files
app.use('/storage', express.static(storageDir));

// BLOG POST ENDPOINTS

/*
  Get portfolio blog posts endpoint - Retrieves all blog posts for a portfolio
  Orders by creation date with most recent first
*/
app.get('/api/portfolios/:portfolio_id/blog-posts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id } = req.params;

    // Verify portfolio ownership
    const portfolioCheck = await pool.query(
      'SELECT portfolio_id FROM portfolios WHERE portfolio_id = $1 AND user_id = $2',
      [portfolio_id, req.user!.user_id]
    );

    if (portfolioCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Portfolio not found', null, 'PORTFOLIO_NOT_FOUND'));
    }

    const result = await pool.query(
      'SELECT * FROM blog_posts WHERE portfolio_id = $1 ORDER BY created_at DESC',
      [portfolio_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get portfolio blog posts error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
  Add portfolio blog post endpoint - Creates a new blog post within a portfolio
  Validates content and generates timestamps
*/
app.post('/api/portfolios/:portfolio_id/blog-posts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id } = req.params;
    const blogData = { ...req.body, portfolio_id };
    const validatedData = createBlogPostInputSchema.parse(blogData);

    // Verify portfolio ownership
    const portfolioCheck = await pool.query(
      'SELECT portfolio_id FROM portfolios WHERE portfolio_id = $1 AND user_id = $2',
      [portfolio_id, req.user!.user_id]
    );

    if (portfolioCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Portfolio not found', null, 'PORTFOLIO_NOT_FOUND'));
    }

    const post_id = uuidv4();
    const created_at = new Date().toISOString();
    const updated_at = created_at;

    const result = await pool.query(
      'INSERT INTO blog_posts (post_id, portfolio_id, title, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [post_id, validatedData.portfolio_id, validatedData.title, validatedData.content, created_at, updated_at]
    );

    const blogPost = result.rows[0];

    // Emit portfolio update via WebSocket
    emitPortfolioUpdate(portfolio_id, { type: 'blog_post_added', blog_post: blogPost });

    res.status(201).json(blogPost);
  } catch (error) {
    console.error('Add portfolio blog post error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// USER MANAGEMENT ENDPOINTS

/*
  Get users endpoint - Retrieves user list with search and pagination
  Admin functionality for user management
*/
app.get('/api/users', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedQuery = searchUserInputSchema.parse(req.query);
    
    let queryStr = 'SELECT user_id, email, name, created_at FROM users';
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add search functionality
    if (validatedQuery.query) {
      queryStr += ` WHERE (email ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`;
      queryParams.push(`%${validatedQuery.query}%`);
      paramIndex++;
    }

    // Add sorting
    queryStr += ` ORDER BY ${validatedQuery.sort_by} ${validatedQuery.sort_order.toUpperCase()}`;

    // Add pagination
    queryStr += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(validatedQuery.limit, validatedQuery.offset);

    const result = await pool.query(queryStr, queryParams);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid query parameters', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// SUBSCRIPTION ENDPOINTS

/*
  Get subscriptions endpoint - Retrieves subscription information
  Includes filtering and pagination capabilities
*/
app.get('/api/subscriptions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedQuery = searchSubscriptionInputSchema.parse(req.query);
    
    let queryStr = 'SELECT * FROM subscriptions WHERE user_id = $1';
    const queryParams: any[] = [req.user!.user_id];
    let paramIndex = 2;

    // Add search functionality
    if (validatedQuery.query) {
      queryStr += ` AND tier ILIKE $${paramIndex}`;
      queryParams.push(`%${validatedQuery.query}%`);
      paramIndex++;
    }

    // Add sorting
    queryStr += ` ORDER BY ${validatedQuery.sort_by} ${validatedQuery.sort_order.toUpperCase()}`;

    // Add pagination
    queryStr += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(validatedQuery.limit, validatedQuery.offset);

    const result = await pool.query(queryStr, queryParams);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid query parameters', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// ANALYTICS ENDPOINTS

/*
  Portfolio analytics tracking - Updates view count and visitor metrics
  Emits real-time analytics updates via WebSocket
*/
app.post('/api/portfolios/:portfolio_id/view', async (req, res) => {
  try {
    const { portfolio_id } = req.params;

    // Update analytics (increment page views and unique visitors)
    const result = await pool.query(
      'UPDATE analytics SET page_views = page_views + 1, unique_visitors = unique_visitors + 1 WHERE portfolio_id = $1 RETURNING *',
      [portfolio_id]
    );

    if (result.rows.length > 0) {
      const analytics = result.rows[0];
      
      // Emit analytics update via WebSocket
      emitAnalyticsUpdate(portfolio_id, {
        analytics_id: analytics.analytics_id,
        portfolio_id: analytics.portfolio_id,
        page_views: analytics.page_views,
        unique_visitors: analytics.unique_visitors,
        average_time_spent: analytics.average_time_spent
      });
    }

    res.json({ message: 'View recorded successfully' });
  } catch (error) {
    console.error('Portfolio view tracking error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// CONTACT FORM ENDPOINTS

/*
  Contact form submission endpoint - Handles visitor contact form submissions
  Creates notifications and emits real-time events
*/
app.post('/api/portfolios/:portfolio_id/contact', async (req, res) => {
  try {
    const { portfolio_id } = req.params;
    const contactData = { ...req.body, portfolio_id };
    const validatedData = createContactInputSchema.parse(contactData);

    const contact_id = uuidv4();
    const received_at = new Date().toISOString();

    const result = await pool.query(
      'INSERT INTO contacts (contact_id, portfolio_id, name, email, message, received_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [contact_id, validatedData.portfolio_id, validatedData.name, validatedData.email, validatedData.message, received_at]
    );

    const contact = result.rows[0];

    // Get portfolio owner for notification
    const portfolioOwner = await pool.query(
      'SELECT user_id FROM portfolios WHERE portfolio_id = $1',
      [portfolio_id]
    );

    if (portfolioOwner.rows.length > 0) {
      const owner_user_id = portfolioOwner.rows[0].user_id;

      // Create notification for portfolio owner
      const notification_id = uuidv4();
      await pool.query(
        'INSERT INTO notifications (notification_id, user_id, type, message, timestamp) VALUES ($1, $2, $3, $4, $5)',
        [notification_id, owner_user_id, 'contact_form', `New contact form submission from ${validatedData.name}`, received_at]
      );

      // Emit real-time notification
      emitNotificationToUser(owner_user_id, {
        type: 'contact_form',
        message: `New contact form submission from ${validatedData.name}`,
        timestamp: received_at
      });

      // Emit contact form submission event
      io.emit('contact/form/submit', {
        contact_id: contact.contact_id,
        portfolio_id: contact.portfolio_id,
        name: contact.name,
        email: contact.email,
        message: contact.message,
        received_at: contact.received_at
      });
    }

    res.status(201).json({
      message: 'Contact form submitted successfully',
      contact_id: contact.contact_id
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// TESTIMONIAL ENDPOINTS

/*
  Add testimonial endpoint - Creates a new testimonial for a portfolio
  Emits real-time events for testimonial additions
*/
app.post('/api/portfolios/:portfolio_id/testimonials', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portfolio_id } = req.params;
    const testimonialData = { ...req.body, portfolio_id };
    const validatedData = createTestimonialInputSchema.parse(testimonialData);

    // Verify portfolio ownership
    const portfolioCheck = await pool.query(
      'SELECT portfolio_id FROM portfolios WHERE portfolio_id = $1 AND user_id = $2',
      [portfolio_id, req.user!.user_id]
    );

    if (portfolioCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Portfolio not found', null, 'PORTFOLIO_NOT_FOUND'));
    }

    const testimonial_id = uuidv4();

    const result = await pool.query(
      'INSERT INTO testimonials (testimonial_id, portfolio_id, author_name, content, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [testimonial_id, validatedData.portfolio_id, validatedData.author_name, validatedData.content, validatedData.date.toISOString()]
    );

    const testimonial = result.rows[0];

    // Emit real-time testimonial event
    io.emit('testimonials/new', {
      testimonial_id: testimonial.testimonial_id,
      portfolio_id: testimonial.portfolio_id,
      author_name: testimonial.author_name,
      content: testimonial.content,
      date: testimonial.date
    });

    res.status(201).json(testimonial);
  } catch (error) {
    console.error('Add testimonial error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      websockets: 'active'
    }
  });
});

// SPA catch-all: serve index.html for non-API routes only
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export { app, pool };

// Start the server
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and listening on 0.0.0.0`);
  console.log(`WebSocket server is ready for connections`);
});