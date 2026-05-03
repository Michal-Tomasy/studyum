const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../dataAccess');

// ------------------------------------------------------------
// Utility functions
// ------------------------------------------------------------

// Check if a string is a valid hex colour (#RRGGBB or #RRGGBBAA)
function isValidHexColor(color) {
  if (typeof color !== 'string') return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

// Check for unsupported keys in an object compared to allowed list
function getUnsupportedKeys(obj, allowedKeys) {
  const objKeys = Object.keys(obj);
  return objKeys.filter(key => !allowedKeys.includes(key));
}

// Format a single warning object
function formatWarning(code, message, params = {}) {
  return { code, message, params };
}

// Format a single error object
function formatError(code, message, params = {}) {
  return { code, message, params };
}

// ------------------------------------------------------------
// GET /api/subjects – list all subjects
// ------------------------------------------------------------
router.get('/', (req, res) => {
  const allowedQueryKeys = [];                        // no query params allowed
  const unsupported = getUnsupportedKeys(req.query, allowedQueryKeys);

  const warnings = [];
  if (unsupported.length > 0) {
    warnings.push(formatWarning(
      'unsupportedKeys',
      'DtoIn contains unsupported keys.',
      { unsupportedKeyList: unsupported }
    ));
  }

  const data = loadData();
  res.json({
    data: data.subjects,
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

// ------------------------------------------------------------
// GET /api/subjects/:id – get a single subject
// ------------------------------------------------------------
router.get('/:id', (req, res) => {
  const allowedQueryKeys = [];                        // only path parameter allowed
  const unsupported = getUnsupportedKeys(req.query, allowedQueryKeys);
  const warnings = [];
  if (unsupported.length > 0) {
    warnings.push(formatWarning(
      'unsupportedKeys',
      'contains unsupported keys.',
      { unsupportedKeyList: unsupported }
    ));
  }

  const id = req.params.id;
  // Validate ID – must be a positive integer 
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({
      errors: [formatError(
        'invalidDtoIn',
        'DtoIn is not valid.',
        {
          invalidTypeKeyMap: { id: 'Value is not a valid identifier' },
          invalidValueKeyMap: {},
          missingKeyMap: {}
        }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  const data = loadData();
  const subject = data.subjects.find(s => s.id === parseInt(id, 10));
  if (!subject) {
    return res.status(404).json({
      errors: [formatError(
        'subjectNotFound',
        'Subject not found.',
        { id: id }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  res.json({
    data: subject,
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

// ------------------------------------------------------------
// POST /api/subjects – create a new subject
// ------------------------------------------------------------
router.post('/', (req, res) => {
  const allowedBodyKeys = ['name', 'color'];
  const unsupported = getUnsupportedKeys(req.body, allowedBodyKeys);
  const warnings = [];
  if (unsupported.length > 0) {
    warnings.push(formatWarning(
      'unsupportedKeys',
      'DtoIn contains unsupported keys.',
      { unsupportedKeyList: unsupported }
    ));
  }

  // validation with error maps
  const { name, color } = req.body;
  const invalidTypeKeyMap = {};
  const invalidValueKeyMap = {};
  const missingKeyMap = {};

  // name
  if (name === undefined || name === null) {
    missingKeyMap.name = 'Field is missing';
  } else if (typeof name !== 'string' || name.trim().length === 0) {
    invalidTypeKeyMap.name = 'Field is required and must be a string of 1-100 characters';
  } else if (name.trim().length > 100) {
    invalidValueKeyMap.name = 'Must be 1-100 characters';
  }

  // color (optional, but if present must be valid hex)
  if (color !== undefined && color !== null) {
    if (typeof color !== 'string' || !isValidHexColor(color)) {
      invalidTypeKeyMap.color = 'Must match hex format #RRGGBB';
    }
  }

  // If any validation failure, return invalidDtoIn
  if (Object.keys(invalidTypeKeyMap).length > 0 ||
      Object.keys(invalidValueKeyMap).length > 0 ||
      Object.keys(missingKeyMap).length > 0) {
    return res.status(400).json({
      errors: [formatError(
        'invalidDtoIn',
        'DtoIn is not valid.',
        { invalidTypeKeyMap, invalidValueKeyMap, missingKeyMap }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  // Uniqueness check on name (case‑insensitive)
  const data = loadData();
  const trimmedName = name.trim();
  if (data.subjects.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
    return res.status(400).json({
      errors: [formatError(
        'subjectNameNotUnique',
        'Subject with this name already exists.',
        { name: trimmedName }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  const newSubject = {
    id: Date.now(),
    name: trimmedName,
    color: color || '#ffffff'
  };

  data.subjects.push(newSubject);
  saveData(data);

  res.status(201).json({
    data: newSubject,
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

// ------------------------------------------------------------
// PUT /api/subjects/:id – update a subject
// ------------------------------------------------------------
router.put('/:id', (req, res) => {
  const allowedBodyKeys = ['name', 'color'];
  const unsupported = getUnsupportedKeys(req.body, allowedBodyKeys);
  const warnings = [];
  if (unsupported.length > 0) {
    warnings.push(formatWarning(
      'unsupportedKeys',
      'DtoIn contains unsupported keys.',
      { unsupportedKeyList: unsupported }
    ));
  }

  const id = req.params.id;
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({
      errors: [formatError(
        'invalidDtoIn',
        'DtoIn is not valid.',
        {
          invalidTypeKeyMap: { id: 'Value is not a valid identifier' },
          invalidValueKeyMap: {},
          missingKeyMap: {}
        }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  const { name, color } = req.body;
  const invalidTypeKeyMap = {};
  const invalidValueKeyMap = {};
  // no missingKeyMap because fields are optional for update

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      invalidValueKeyMap.name = 'Value must not be empty';
    } else if (name.trim().length > 100) {
      invalidValueKeyMap.name = 'Must be 1-100 characters';
    }
  }

  if (color !== undefined) {
    if (typeof color !== 'string' || !isValidHexColor(color)) {
      invalidTypeKeyMap.color = 'Does not match hex format #RRGGBB';
    }
  }

  if (Object.keys(invalidTypeKeyMap).length > 0 || Object.keys(invalidValueKeyMap).length > 0) {
    return res.status(400).json({
      errors: [formatError(
        'invalidDtoIn',
        'DtoIn is not valid.',
        { invalidTypeKeyMap, invalidValueKeyMap, missingKeyMap: {} }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  const data = loadData();
  const subjectIndex = data.subjects.findIndex(s => s.id === parseInt(id, 10));
  if (subjectIndex === -1) {
    return res.status(404).json({
      errors: [formatError(
        'subjectNotFound',
        'Subject not found.',
        { id: id }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  if (name !== undefined) {
    const newName = name.trim();
    // Check uniqueness 
    if (data.subjects.some(s => s.id !== parseInt(id, 10) && s.name.toLowerCase() === newName.toLowerCase())) {
      return res.status(400).json({
        errors: [formatError(
          'subjectNameNotUnique',
          'Another subject with this name already exists.',
          { name: newName }
        )],
        warnings: warnings.length > 0 ? warnings : undefined
      });
    }
    data.subjects[subjectIndex].name = newName;
  }

  if (color !== undefined) {
    data.subjects[subjectIndex].color = color;
  }

  saveData(data);
  res.json({
    data: data.subjects[subjectIndex],
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

// ------------------------------------------------------------
// DELETE /api/subjects/:id – delete a subject (and its notes)
// ------------------------------------------------------------
router.delete('/:id', (req, res) => {
  const allowedQueryKeys = [];
  const unsupported = getUnsupportedKeys(req.query, allowedQueryKeys);
  const warnings = [];
  if (unsupported.length > 0) {
    warnings.push(formatWarning(
      'unsupportedKeys',
      'DtoIn contains unsupported keys.',
      { unsupportedKeyList: unsupported }
    ));
  }

  const id = req.params.id;
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({
      errors: [formatError(
        'invalidDtoIn',
        'DtoIn is not valid.',
        {
          invalidTypeKeyMap: { id: 'Value is not a valid identifier' },
          invalidValueKeyMap: {},
          missingKeyMap: {}
        }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  const data = loadData();
  const subjectId = parseInt(id, 10);
  const subjectIndex = data.subjects.findIndex(s => s.id === subjectId);
  if (subjectIndex === -1) {
    return res.status(404).json({
      errors: [formatError(
        'subjectNotFound',
        'Subject not found.',
        { id: id }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  // Cascade delete notes
  data.notes = data.notes.filter(n => n.subjectId !== subjectId);
  data.subjects.splice(subjectIndex, 1);
  saveData(data);

  res.json({
    data: { message: 'Subject and associated notes deleted' },
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

module.exports = router;