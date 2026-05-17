import React, { useState } from 'react';

function NoteForm({ note, subjects, existingNotes, onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState(note ? note.name : '');
  const [date, setDate] = useState(note ? note.date : today);
  const [subjectId, setSubjectId] = useState(note ? note.subjectId : (subjects[0]?.id || ''));
  const [content, setContent] = useState(note ? note.content : '');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !date || !subjectId || !content.trim()) {
      setErrorMessage("Please fill in all the fields marked by *.");
      return;
    }

    const isNameTaken = existingNotes.some(
      n => n.name.toLowerCase() === name.toLowerCase() && (!note || n.id !== note.id)
    );

    if (isNameTaken) {
      setErrorMessage("Please enter a unique note name.");
      return;
    }

    const noteData = {
      name: name,
      date: date,
      subjectId: Number(subjectId),
      content: content
    };

    onSave(noteData, note ? note.id : null);
  };

  return (
    <div className="form-container">
      <h2>{note ? 'Edit Note' : 'New Note'}</h2>
      
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Note Name *</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Date *</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Subject *</label>
          <select 
            value={subjectId} 
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="" disabled>Select a subject</option>
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Content *</label>
          <textarea 
            rows="6"
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn primary">Save</button>
          <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default NoteForm;