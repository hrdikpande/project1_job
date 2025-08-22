const Joi = require('joi');

/**
 * Validation middleware using Joi schemas
 */

// Task validation schema
const taskSchema = Joi.object({
  name: Joi.string().min(3).max(255).trim().required(),
  creator: Joi.string().min(2).max(100).trim().required()
});

// Task update schema
const taskUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected'),
  approver: Joi.string().min(2).max(100),
  timer: Joi.string(),
  completed: Joi.boolean()
}).min(1);

// Article validation schema
const articleSchema = Joi.object({
  headline: Joi.string().min(5).max(500).trim().required(),
  link: Joi.string().uri().trim().required()
});

// Checklist validation schema
const checklistSchema = Joi.object({
  title: Joi.string().min(3).max(255).trim().required(),
  description: Joi.string().max(1000).trim().default(''),
  theme: Joi.string().valid('blue', 'green', 'purple', 'red', 'yellow', 'indigo').default('blue')
});

// Checklist task validation schema
const checklistTaskSchema = Joi.object({
  title: Joi.string().min(2).max(255).required(),
  priority: Joi.string().valid('High', 'Medium', 'Low').default('Medium')
});

// Subtask validation schema
const subtaskSchema = Joi.object({
  title: Joi.string().min(2).max(255).trim().required()
});

// Project validation schema
const projectSchema = Joi.object({
  name: Joi.string().min(3).max(255).trim().required(),
  description: Joi.string().max(1000).trim().default(''),
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null),
  status: Joi.string().valid('planning', 'active', 'on-hold', 'completed', 'cancelled').default('planning'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  manager: Joi.string().max(100).trim().allow(''),
  budget: Joi.number().positive().allow(null)
});

// Project update schema
const projectUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(255).trim(),
  description: Joi.string().max(1000).trim(),
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().allow(null),
  status: Joi.string().valid('planning', 'active', 'on-hold', 'completed', 'cancelled'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  manager: Joi.string().max(100).trim(),
  budget: Joi.number().positive().allow(null)
}).min(1);

// Daily task validation schema
const dailyTaskSchema = Joi.object({
  title: Joi.string().min(3).max(255).trim().required(),
  description: Joi.string().max(1000).trim().default(''),
  assigned_to: Joi.string().min(2).max(100).trim().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  status: Joi.string().valid('pending', 'in-progress', 'completed', 'blocked').default('pending'),
  due_date: Joi.date().iso().required(),
  estimated_hours: Joi.number().positive().allow(0).default(0)
});

// Daily task update schema
const dailyTaskUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(255).trim(),
  description: Joi.string().max(1000).trim(),
  assigned_to: Joi.string().min(2).max(100).trim(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  status: Joi.string().valid('pending', 'in-progress', 'completed', 'blocked'),
  due_date: Joi.date().iso(),
  estimated_hours: Joi.number().positive().allow(0),
  actual_hours: Joi.number().positive().allow(0)
}).min(1);

// Progress report validation schema
const progressReportSchema = Joi.object({
  reporter_name: Joi.string().min(2).max(100).trim().required(),
  report_date: Joi.date().iso().required(),
  tasks_completed: Joi.string().max(2000).trim().default(''),
  tasks_in_progress: Joi.string().max(2000).trim().default(''),
  tasks_blocked: Joi.string().max(2000).trim().default(''),
  hours_worked: Joi.number().positive().allow(0).default(0),
  challenges: Joi.string().max(2000).trim().default(''),
  next_day_plan: Joi.string().max(2000).trim().default(''),
  mood_rating: Joi.number().integer().min(1).max(5).default(3),
  productivity_score: Joi.number().integer().min(1).max(5).default(3)
});

// Progress report update schema
const progressReportUpdateSchema = Joi.object({
  reporter_name: Joi.string().min(2).max(100).trim(),
  report_date: Joi.date().iso(),
  tasks_completed: Joi.string().max(2000).trim(),
  tasks_in_progress: Joi.string().max(2000).trim(),
  tasks_blocked: Joi.string().max(2000).trim(),
  hours_worked: Joi.number().positive().allow(0),
  challenges: Joi.string().max(2000).trim(),
  next_day_plan: Joi.string().max(2000).trim(),
  mood_rating: Joi.number().integer().min(1).max(5),
  productivity_score: Joi.number().integer().min(1).max(5)
}).min(1);

/**
 * Generic validation middleware
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, params, query)
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: `Validation error: ${errors[0]?.message || 'Invalid data'}`,
        errors
      });
    }

    req[property] = value;
    next();
  };
}

// ID parameter validation
const idSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().min(1)
  ).required()
});

module.exports = {
  validateTask: validate(taskSchema),
  validateTaskUpdate: validate(taskUpdateSchema),
  validateArticle: validate(articleSchema),
  validateChecklist: validate(checklistSchema),
  validateChecklistTask: validate(checklistTaskSchema),
  validateSubtask: validate(subtaskSchema),
  validateProject: validate(projectSchema),
  validateProjectUpdate: validate(projectUpdateSchema),
  validateDailyTask: validate(dailyTaskSchema),
  validateDailyTaskUpdate: validate(dailyTaskUpdateSchema),
  validateProgressReport: validate(progressReportSchema),
  validateProgressReportUpdate: validate(progressReportUpdateSchema),
  validateId: validate(idSchema, 'params')
};
