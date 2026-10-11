import { z } from 'zod';

export const experienceItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(100),
  company: z.string().min(1, 'Company is required').max(100),
  location: z.string().max(100).optional().default(''),
  start_date: z.string().max(20).optional().default(''),
  end_date: z.string().max(20).optional().default(''),
  is_current: z.boolean().optional().default(false),
  responsibilities: z.array(z.string()).optional().default([]),
  tech_stack: z.array(z.string()).optional().default([]),
  achievements_metrics: z.array(z.string()).optional().default([])
});

export const educationItemSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, 'Institution is required').max(120),
  degree: z.string().max(100).optional().default(''),
  field_of_study: z.string().max(100).optional().default(''),
  start_year: z.string().max(10).optional().default(''),
  end_year: z.string().max(10).optional().default('')
});

export const certificationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Certification name is required').max(150),
  issuing_organization: z.string().min(1, 'Issuing organization is required').max(150),
  issue_date: z.string().max(20).optional().default(''),
  credential_id: z.string().max(100).optional().default(''),
  credential_url: z.string().max(300).optional().default('')
});

export const projectItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Project title is required').max(120),
  description: z.string().max(1000).optional().default(''),
  url: z.string().max(300).optional().default(''),
  tech_stack: z.array(z.string()).optional().default([])
});

export const featuredItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(120),
  link_url: z.string().max(300).optional().default(''),
  description: z.string().max(500).optional().default('')
});

export const contactInfoSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional().default(''),
  location: z.string().max(100).optional().default(''),
  portfolio_url: z.string().max(300).optional().default('')
});

export const profileUpdateSchema = z.object({
  headline: z.string().max(220).optional(),
  about: z.string().max(2600).optional(),
  target_role: z.string().max(100).optional(),
  target_industry: z.string().max(100).optional(),
  target_keywords: z.array(z.string()).optional(),
  language: z.enum(['id', 'en']).optional(),
  experience: z.array(experienceItemSchema).optional(),
  skills: z.array(z.string()).optional(),
  education: z.array(educationItemSchema).optional(),
  certifications: z.array(certificationItemSchema).optional(),
  projects: z.array(projectItemSchema).optional(),
  featured: z.array(featuredItemSchema).optional(),
  contact_info: contactInfoSchema.optional()
});

export const draftCreateSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(150),
  content: z.string().min(1, 'Content is required').max(3000),
  scheduled_for: z.string().datetime().optional().nullable()
});

export const draftApproveSchema = z.object({
  approve: z.boolean(),
  publish_to_linkedin: z.boolean().optional().default(false)
});
