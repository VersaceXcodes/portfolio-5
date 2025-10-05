import { z } from 'zod';

// Users Schemas
export const userSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string(),
  created_at: z.coerce.date(),
});

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string().min(1),
});

export const updateUserInputSchema = z.object({
  user_id: z.string(),
  email: z.string().email().optional(),
  password_hash: z.string().optional(),
  name: z.string().min(1).optional(),
});

export const searchUserInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['email', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUserInput = z.infer<typeof searchUserInputSchema>;

// Portfolios Schemas
export const portfolioSchema = z.object({
  portfolio_id: z.string(),
  user_id: z.string(),
  title: z.string(),
  template_id: z.string(),
  is_published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const createPortfolioInputSchema = z.object({
  user_id: z.string(),
  title: z.string().min(1),
  template_id: z.string(),
  is_published: z.boolean(),
});

export const updatePortfolioInputSchema = z.object({
  portfolio_id: z.string(),
  title: z.string().min(1).optional(),
  template_id: z.string().optional(),
  is_published: z.boolean().optional(),
});

export const searchPortfolioInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['title', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Portfolio = z.infer<typeof portfolioSchema>;
export type CreatePortfolioInput = z.infer<typeof createPortfolioInputSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioInputSchema>;
export type SearchPortfolioInput = z.infer<typeof searchPortfolioInputSchema>;

// Templates Schemas
export const templateSchema = z.object({
  template_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
});

export const createTemplateInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
});

export const updateTemplateInputSchema = z.object({
  template_id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

export const searchTemplateInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['name']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

export type Template = z.infer<typeof templateSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>;
export type SearchTemplateInput = z.infer<typeof searchTemplateInputSchema>;

// Sections Schemas
export const sectionSchema = z.object({
  section_id: z.string(),
  portfolio_id: z.string(),
  type: z.string(),
  content: z.string().nullable(),
  order: z.number().int(),
});

export const createSectionInputSchema = z.object({
  portfolio_id: z.string(),
  type: z.string().min(1),
  content: z.string().nullable(),
  order: z.number().int(),
});

export const updateSectionInputSchema = z.object({
  section_id: z.string(),
  type: z.string().min(1).optional(),
  content: z.string().nullable().optional(),
  order: z.number().int().optional(),
});

export const searchSectionInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['order']).default('order'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

export type Section = z.infer<typeof sectionSchema>;
export type CreateSectionInput = z.infer<typeof createSectionInputSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionInputSchema>;
export type SearchSectionInput = z.infer<typeof searchSectionInputSchema>;

// Media Files Schemas
export const mediaFileSchema = z.object({
  media_id: z.string(),
  section_id: z.string(),
  file_url: z.string().url(),
  media_type: z.string(),
});

export const createMediaFileInputSchema = z.object({
  section_id: z.string(),
  file_url: z.string().url(),
  media_type: z.string().min(1),
});

export const updateMediaFileInputSchema = z.object({
  media_id: z.string(),
  file_url: z.string().url().optional(),
  media_type: z.string().min(1).optional(),
});

export const searchMediaFileInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['file_url']).default('file_url'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

export type MediaFile = z.infer<typeof mediaFileSchema>;
export type CreateMediaFileInput = z.infer<typeof createMediaFileInputSchema>;
export type UpdateMediaFileInput = z.infer<typeof updateMediaFileInputSchema>;
export type SearchMediaFileInput = z.infer<typeof searchMediaFileInputSchema>;

// Blog Posts Schemas
export const blogPostSchema = z.object({
  post_id: z.string(),
  portfolio_id: z.string(),
  title: z.string(),
  content: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const createBlogPostInputSchema = z.object({
  portfolio_id: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
});

export const updateBlogPostInputSchema = z.object({
  post_id: z.string(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

export const searchBlogPostInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at', 'title']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type BlogPost = z.infer<typeof blogPostSchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;
export type SearchBlogPostInput = z.infer<typeof searchBlogPostInputSchema>;

// Social Links Schemas
export const socialLinkSchema = z.object({
  link_id: z.string(),
  portfolio_id: z.string(),
  platform: z.string(),
  url: z.string().url(),
});

export const createSocialLinkInputSchema = z.object({
  portfolio_id: z.string(),
  platform: z.string().min(1),
  url: z.string().url(),
});

export const updateSocialLinkInputSchema = z.object({
  link_id: z.string(),
  platform: z.string().min(1).optional(),
  url: z.string().url().optional(),
});

export const searchSocialLinkInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['platform']).default('platform'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

export type SocialLink = z.infer<typeof socialLinkSchema>;
export type CreateSocialLinkInput = z.infer<typeof createSocialLinkInputSchema>;
export type UpdateSocialLinkInput = z.infer<typeof updateSocialLinkInputSchema>;
export type SearchSocialLinkInput = z.infer<typeof searchSocialLinkInputSchema>;

// Analytics Schemas
export const analyticsSchema = z.object({
  analytics_id: z.string(),
  portfolio_id: z.string(),
  page_views: z.number().int(),
  unique_visitors: z.number().int(),
  average_time_spent: z.number().int(),
});

export const createAnalyticsInputSchema = z.object({
  portfolio_id: z.string(),
  page_views: z.number().int().nonnegative(),
  unique_visitors: z.number().int().nonnegative(),
  average_time_spent: z.number().int().nonnegative(),
});

export const updateAnalyticsInputSchema = z.object({
  analytics_id: z.string(),
  page_views: z.number().int().nonnegative().optional(),
  unique_visitors: z.number().int().nonnegative().optional(),
  average_time_spent: z.number().int().nonnegative().optional(),
});

export const searchAnalyticsInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['page_views', 'unique_visitors']).default('page_views'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Analytics = z.infer<typeof analyticsSchema>;
export type CreateAnalyticsInput = z.infer<typeof createAnalyticsInputSchema>;
export type UpdateAnalyticsInput = z.infer<typeof updateAnalyticsInputSchema>;
export type SearchAnalyticsInput = z.infer<typeof searchAnalyticsInputSchema>;

// Notifications Schemas
export const notificationSchema = z.object({
  notification_id: z.string(),
  user_id: z.string(),
  type: z.string(),
  message: z.string(),
  timestamp: z.coerce.date(),
});

export const createNotificationInputSchema = z.object({
  user_id: z.string(),
  type: z.string().min(1),
  message: z.string().min(1),
});

export const updateNotificationInputSchema = z.object({
  notification_id: z.string(),
  type: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
});

export const searchNotificationInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['timestamp']).default('timestamp'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Notification = z.infer<typeof notificationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationInputSchema>;
export type SearchNotificationInput = z.infer<typeof searchNotificationInputSchema>;

// Subscriptions Schemas
export const subscriptionSchema = z.object({
  subscription_id: z.string(),
  user_id: z.string(),
  tier: z.string(),
  started_at: z.coerce.date(),
  ends_at: z.coerce.date().nullable(),
});

export const createSubscriptionInputSchema = z.object({
  user_id: z.string(),
  tier: z.string().min(1),
  started_at: z.coerce.date(),
  ends_at: z.coerce.date().nullable().optional(),
});

export const updateSubscriptionInputSchema = z.object({
  subscription_id: z.string(),
  tier: z.string().min(1).optional(),
  started_at: z.coerce.date().optional(),
  ends_at: z.coerce.date().nullable().optional(),
});

export const searchSubscriptionInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['started_at', 'tier']).default('started_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Subscription = z.infer<typeof subscriptionSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionInputSchema>;
export type SearchSubscriptionInput = z.infer<typeof searchSubscriptionInputSchema>;

// Contacts Schemas
export const contactSchema = z.object({
  contact_id: z.string(),
  portfolio_id: z.string(),
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
  received_at: z.coerce.date(),
});

export const createContactInputSchema = z.object({
  portfolio_id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

export const updateContactInputSchema = z.object({
  contact_id: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  message: z.string().min(1).optional(),
});

export const searchContactInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['received_at', 'name']).default('received_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Contact = z.infer<typeof contactSchema>;
export type CreateContactInput = z.infer<typeof createContactInputSchema>;
export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;
export type SearchContactInput = z.infer<typeof searchContactInputSchema>;

// Testimonials Schemas
export const testimonialSchema = z.object({
  testimonial_id: z.string(),
  portfolio_id: z.string(),
  author_name: z.string(),
  content: z.string(),
  date: z.coerce.date(),
});

export const createTestimonialInputSchema = z.object({
  portfolio_id: z.string(),
  author_name: z.string().min(1),
  content: z.string().min(1),
  date: z.coerce.date(),
});

export const updateTestimonialInputSchema = z.object({
  testimonial_id: z.string(),
  author_name: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
});

export const searchTestimonialInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['date', 'author_name']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Testimonial = z.infer<typeof testimonialSchema>;
export type CreateTestimonialInput = z.infer<typeof createTestimonialInputSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialInputSchema>;
export type SearchTestimonialInput = z.infer<typeof searchTestimonialInputSchema>;

// FAQ Schemas
export const faqSchema = z.object({
  faq_id: z.string(),
  portfolio_id: z.string(),
  question: z.string(),
  answer: z.string(),
});

export const createFaqInputSchema = z.object({
  portfolio_id: z.string(),
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const updateFaqInputSchema = z.object({
  faq_id: z.string(),
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
});

export const searchFaqInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['question']).default('question'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

export type FAQ = z.infer<typeof faqSchema>;
export type CreateFaqInput = z.infer<typeof createFaqInputSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqInputSchema>;
export type SearchFaqInput = z.infer<typeof searchFaqInputSchema>;