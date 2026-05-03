const express = require('express');
const subjectsRouter = require('./routes/subjects');
const notesRouter = require('./routes/notes');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api/subjects', subjectsRouter);
app.use('/api/notes', notesRouter);

app.get('/', (req, res) => {
  res.send('Studyum backend běží!');
});

// Global error handler (catches unexpected errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    errors: [{
      code: 'internalError',
      message: 'Internal server error',
      params: {}
    }]
  });
});

app.listen(PORT, () => {
  console.log(`Server naslouchá na http://localhost:${PORT}`);
});