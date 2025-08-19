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
  validateId: validate(idSchema, 'params')
};
