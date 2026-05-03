const express = require('express');
const router = express.Router();
const { loadData, saveData } = require('../dataAccess');

// ------------------------------------------------------------
// Utility functions 
// ------------------------------------------------------------
function isValidHexColor(color) {
  if (typeof color !== 'string') return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

function getUnsupportedKeys(obj, allowedKeys) {
  const objKeys = Object.keys(obj);
  return objKeys.filter(key => !allowedKeys.includes(key));
}

function formatWarning(code, message, params = {}) {
  return { code, message, params };
}

function formatError(code, message, params = {}) {
  return { code, message, params };
}

function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime()); // valid date
}

function isFutureDate(dateStr) {
  const noteDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  noteDate.setHours(0, 0, 0, 0);
  return noteDate > today;
}

// ------------------------------------------------------------
// GET /api/notes – list notes (optional ?subjectId)
// ------------------------------------------------------------
router.get('/', (req, res) => {
  const allowedQueryKeys = ['subjectId'];
  const unsupported = getUnsupportedKeys(req.query, allowedQueryKeys);
  const warnings = [];
  if (unsupported.length > 0) {
    warnings.push(formatWarning(
      'unsupportedKeys',
      'DtoIn contains unsupported keys.',
      { unsupportedKeyList: unsupported }
    ));
  }

  // Validate subjectId if present
  if (req.query.subjectId !== undefined) {
    const sid = req.query.subjectId;
    // must be a valid numeric id
    if (!/^\d+$/.test(sid)) {
      return res.status(400).json({
        errors: [formatError(
          'invalidDtoIn',
          'DtoIn is not valid.',
          {
            invalidTypeKeyMap: { subjectId: 'Value is not a valid identifier' },
            invalidValueKeyMap: {},
            missingKeyMap: {}
          }
        )],
        warnings: warnings.length > 0 ? warnings : undefined
      });
    }
  }

  const data = loadData();
  let notes = data.notes;

  if (req.query.subjectId) {
    const subjectId = parseInt(req.query.subjectId, 10);
    notes = notes.filter(n => n.subjectId === subjectId);
  }

  res.json({
    data: notes,
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

// ------------------------------------------------------------
// GET /api/notes/:id – get a single note
// ------------------------------------------------------------
router.get('/:id', (req, res) => {
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
  const noteId = parseInt(id, 10);
  const note = data.notes.find(n => n.id === noteId);
  if (!note) {
    return res.status(404).json({
      errors: [formatError(
        'noteNotFound',
        'Note not found.',
        { id: id }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  res.json({
    data: note,
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

// ------------------------------------------------------------
// POST /api/notes – create a new note
// ------------------------------------------------------------
router.post('/', (req, res) => {
  const allowedBodyKeys = ['name', 'date', 'content', 'subjectId'];
  const unsupported = getUnsupportedKeys(req.body, allowedBodyKeys);
  const warnings = [];
  if (unsupported.length > 0) {
    warnings.push(formatWarning(
      'unsupportedKeys',
      'DtoIn contains unsupported keys.',
      { unsupportedKeyList: unsupported }
    ));
  }

  const { name, date, content, subjectId } = req.body;
  const invalidTypeKeyMap = {};
  const invalidValueKeyMap = {};
  const missingKeyMap = {};

  // name validation
  if (name === undefined || name === null) {
    missingKeyMap.name = 'Field is missing';
  } else if (typeof name !== 'string' || name.trim().length === 0) {
    invalidValueKeyMap.name = 'Must be 1-100 characters';
  } else if (name.trim().length > 100) {
    invalidValueKeyMap.name = 'Must be 1-100 characters';
  }

  // content validation
  if (content === undefined || content === null) {
    missingKeyMap.content = 'Field is missing';
  } else if (typeof content !== 'string' || content.trim().length === 0) {
    invalidValueKeyMap.content = 'Must not be empty';
  }

  // date validation
  if (date === undefined || date === null) {
    missingKeyMap.date = 'Field is missing';
  } else if (typeof date !== 'string' || !isValidDateString(date)) {
    invalidTypeKeyMap.date = 'Not a valid date';
  }

  // subjectId validation
  if (subjectId === undefined || subjectId === null) {
    missingKeyMap.subjectId = 'Field is missing';
  } else if (typeof subjectId !== 'number' && !/^\d+$/.test(String(subjectId))) {
    // allow number or numeric string
    invalidTypeKeyMap.subjectId = 'Must be a valid identifier';
  }

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

  // Load data
  const data = loadData();

  // Check if any subjects exist at all
  if (data.subjects.length === 0) {
    return res.status(400).json({
      errors: [formatError(
        'noSubjectExists',
        'Please create a subject first.',
        {}
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  // Normalise subjectId
  const normSubjectId = parseInt(subjectId, 10);

  // Check subject existence
  if (!data.subjects.some(s => s.id === normSubjectId)) {
    return res.status(400).json({
      errors: [formatError(
        'subjectNotFound',
        'Subject not found.',
        { subjectId: normSubjectId }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  // Date not in future
  if (isFutureDate(date)) {
    return res.status(400).json({
      errors: [formatError(
        'dateInFuture',
        'Date cannot be in the future.',
        { date: date }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  const trimmedName = name.trim();
  // Uniqueness
  if (data.notes.some(n => n.name.toLowerCase() === trimmedName.toLowerCase())) {
    return res.status(400).json({
      errors: [formatError(
        'noteNameNotUnique',
        'A note with this name already exists.',
        { name: trimmedName }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  const newNote = {
    id: Date.now(),
    name: trimmedName,
    date: date,                 // keep original string
    content: content.trim(),
    subjectId: normSubjectId
  };

  data.notes.push(newNote);
  saveData(data);

  res.status(201).json({
    data: newNote,
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

// ------------------------------------------------------------
// PUT /api/notes/:id – update a note
// ------------------------------------------------------------
router.put('/:id', (req, res) => {
  const allowedBodyKeys = ['name', 'date', 'content', 'subjectId'];
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

  const { name, date, content, subjectId } = req.body;
  const invalidTypeKeyMap = {};
  const invalidValueKeyMap = {};

  // Validate whichever fields are provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      invalidValueKeyMap.name = 'Must be 1-100 characters';
    } else if (name.trim().length > 100) {
      invalidValueKeyMap.name = 'Must be 1-100 characters';
    }
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length === 0) {
      invalidValueKeyMap.content = 'Must not be empty';
    }
  }

  if (date !== undefined) {
    if (typeof date !== 'string' || !isValidDateString(date)) {
      invalidTypeKeyMap.date = 'Not a valid date';
    } else if (isFutureDate(date)) {
      
      invalidTypeKeyMap.date = 'Date cannot be in the future'; 
    }
  }

  if (subjectId !== undefined) {
    if (typeof subjectId !== 'number' && !/^\d+$/.test(String(subjectId))) {
      invalidTypeKeyMap.subjectId = 'Must be a valid identifier';
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
  const noteIndex = data.notes.findIndex(n => n.id === parseInt(id, 10));
  if (noteIndex === -1) {
    return res.status(404).json({
      errors: [formatError(
        'noteNotFound',
        'Note not found.',
        { id: id }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  // Check future date if date is being changed
  if (date !== undefined) {
    if (isFutureDate(date)) {
      return res.status(400).json({
        errors: [formatError(
          'dateInFuture',
          'Date cannot be in the future.',
          { date: date }
        )],
        warnings: warnings.length > 0 ? warnings : undefined
      });
    }
  }

  // Uniqueness if name is changed
  if (name !== undefined) {
    const newName = name.trim();
    if (data.notes.some(n => n.id !== parseInt(id, 10) && n.name.toLowerCase() === newName.toLowerCase())) {
      return res.status(400).json({
        errors: [formatError(
          'noteNameNotUnique',
          'A note with this name already exists.',
          { name: newName }
        )],
        warnings: warnings.length > 0 ? warnings : undefined
      });
    }
    data.notes[noteIndex].name = newName;
  }

  // Subject existence if subjectId is changed
  if (subjectId !== undefined) {
    const newSubjectId = parseInt(subjectId, 10);
    if (!data.subjects.some(s => s.id === newSubjectId)) {
      return res.status(400).json({
        errors: [formatError(
          'subjectNotFound',
          'Subject not found.',
          { subjectId: newSubjectId }
        )],
        warnings: warnings.length > 0 ? warnings : undefined
      });
    }
    data.notes[noteIndex].subjectId = newSubjectId;
  }

  if (date !== undefined) data.notes[noteIndex].date = date;
  if (content !== undefined) data.notes[noteIndex].content = content.trim();

  saveData(data);

  res.json({
    data: data.notes[noteIndex],
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

// ------------------------------------------------------------
// DELETE /api/notes/:id – delete a note
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
  const noteIndex = data.notes.findIndex(n => n.id === parseInt(id, 10));
  if (noteIndex === -1) {
    return res.status(404).json({
      errors: [formatError(
        'noteNotFound',
        'Note not found.',
        { id: id }
      )],
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }

  data.notes.splice(noteIndex, 1);
  saveData(data);

  res.json({
    data: { message: 'Note deleted' },
    warnings: warnings.length > 0 ? warnings : undefined
  });
});

module.exports = router;