-- Create tables

CREATE TABLE users (
    user_id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL
);

CREATE TABLE portfolios (
    portfolio_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    template_id VARCHAR NOT NULL,
    is_published BOOLEAN NOT NULL,
    created_at VARCHAR NOT NULL,
    updated_at VARCHAR NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE templates (
    template_id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description VARCHAR
);

CREATE TABLE sections (
    section_id VARCHAR PRIMARY KEY,
    portfolio_id VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    content VARCHAR,
    order INT NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

CREATE TABLE media_files (
    media_id VARCHAR PRIMARY KEY,
    section_id VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    media_type VARCHAR NOT NULL,
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
);

CREATE TABLE blog_posts (
    post_id VARCHAR PRIMARY KEY,
    portfolio_id VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL,
    updated_at VARCHAR NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

CREATE TABLE social_links (
    link_id VARCHAR PRIMARY KEY,
    portfolio_id VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    url VARCHAR NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

CREATE TABLE analytics (
    analytics_id VARCHAR PRIMARY KEY,
    portfolio_id VARCHAR NOT NULL,
    page_views INT NOT NULL,
    unique_visitors INT NOT NULL,
    average_time_spent INT NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

CREATE TABLE notifications (
    notification_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    message VARCHAR NOT NULL,
    timestamp VARCHAR NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE subscriptions (
    subscription_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    tier VARCHAR NOT NULL,
    started_at VARCHAR NOT NULL,
    ends_at VARCHAR,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE contacts (
    contact_id VARCHAR PRIMARY KEY,
    portfolio_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    message VARCHAR NOT NULL,
    received_at VARCHAR NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

CREATE TABLE testimonials (
    testimonial_id VARCHAR PRIMARY KEY,
    portfolio_id VARCHAR NOT NULL,
    author_name VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    date VARCHAR NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

CREATE TABLE faq (
    faq_id VARCHAR PRIMARY KEY,
    portfolio_id VARCHAR NOT NULL,
    question VARCHAR NOT NULL,
    answer VARCHAR NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

-- Seed data for users
INSERT INTO users (user_id, email, password_hash, name, created_at) VALUES
('u1', 'user1@example.com', 'password123', 'John Doe', '2023-01-01T00:00:00'),
('u2', 'admin@example.com', 'admin123', 'Admin User', '2023-01-01T00:00:00');

-- Seed data for templates
INSERT INTO templates (template_id, name, description) VALUES
('t1', 'Template One', 'The first template'),
('t2', 'Template Two', 'The second template');

-- Seed data for portfolios
INSERT INTO portfolios (portfolio_id, user_id, title, template_id, is_published, created_at, updated_at) VALUES
('p1', 'u1', 'Portfolio One', 't1', TRUE, '2023-02-01T00:00:00', '2023-02-02T00:00:00'),
('p2', 'u2', 'Portfolio Two', 't2', FALSE, '2023-02-02T00:00:00', '2023-02-03T00:00:00');

-- Seed data for sections
INSERT INTO sections (section_id, portfolio_id, type, content, order) VALUES
('s1', 'p1', 'Text', 'Welcome to my portfolio', 1),
('s2', 'p1', 'Image', NULL, 2);

-- Seed data for media files
INSERT INTO media_files (media_id, section_id, file_url, media_type) VALUES
('m1', 's2', 'https://picsum.photos/seed/p1s2/200/300', 'image');

-- Seed data for blog posts
INSERT INTO blog_posts (post_id, portfolio_id, title, content, created_at, updated_at) VALUES
('b1', 'p1', 'Welcome Post', 'This is the introduction blog post.', '2023-02-01T00:00:00', '2023-02-02T00:00:00');

-- Seed data for social links
INSERT INTO social_links (link_id, portfolio_id, platform, url) VALUES
('l1', 'p1', 'Twitter', 'https://twitter.com/user');

-- Seed data for analytics
INSERT INTO analytics (analytics_id, portfolio_id, page_views, unique_visitors, average_time_spent) VALUES
('a1', 'p1', 150, 100, 5);

-- Seed data for notifications
INSERT INTO notifications (notification_id, user_id, type, message, timestamp) VALUES
('n1', 'u1', 'Alert', 'New visitor on your site', '2023-02-02T12:00:00');

-- Seed data for subscriptions
INSERT INTO subscriptions (subscription_id, user_id, tier, started_at, ends_at) VALUES
('su1', 'u1', 'Gold', '2023-01-01T00:00:00', '2024-01-01T00:00:00');

-- Seed data for contacts
INSERT INTO contacts (contact_id, portfolio_id, name, email, message, received_at) VALUES
('c1', 'p1', 'Visitor', 'visitor@example.com', 'Great portfolio!', '2023-02-02T12:00:00');

-- Seed data for testimonials
INSERT INTO testimonials (testimonial_id, portfolio_id, author_name, content, date) VALUES
('tst1', 'p1', 'Jane Smith', 'Amazing work!', '2023-02-01');

-- Seed data for faqs
INSERT INTO faq (faq_id, portfolio_id, question, answer) VALUES
('f1', 'p1', 'What is this portfolio about?', 'This is a showcase of my work.');