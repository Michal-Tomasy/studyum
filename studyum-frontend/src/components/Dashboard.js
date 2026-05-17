import React from 'react';

function Dashboard({ subjects = [], notes = [], onNewSubject, onNewNote, onEditNote }) {
  
  if (subjects.length === 0) {
    return (
      <div className="dashboard-empty">
        <button className="btn primary" onClick={onNewSubject}>New Subject</button>
        <p>Click on the 'New Subject' button to create a new subject.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-actions">
        <button className="btn primary" onClick={onNewSubject}>New Subject</button>
        <button className="btn primary" onClick={onNewNote}>New Note</button>
      </div>

      <div className="subjects-list">
        {subjects.map(subject => {
          // Filter notes that belong to the current subject
          const subjectNotes = notes.filter(n => String(n.subjectId) === String(subject.id));
          
          return (
            <div 
              key={subject.id} 
              className="subject-card" 
              style={{ border: `5px solid ${subject.color || '#ffffff'}` }}
            >
              <h2>{subject.name}</h2>
              
              {/* Alternative flow A2: A subject without notes */}
              {subjectNotes.length === 0 ? (
                <p className="empty-message">Click on the 'New Note' button to create a new note.</p>
              ) : (
                <ul className="notes-list">
                  {subjectNotes.map(note => (
                    <li key={note.id} className="note-item">
                      <div className="note-info">
                        <div className="note-header-line">
                          <strong className="note-title">{note.name}</strong>
                          <span className="note-date">{note.date}</span>
                        </div>
                        {/* Data binding for the text contents of the note */}
                        <p className="note-content-text">{note.content}</p>
                      </div>
                      <button className="btn secondary" onClick={() => onEditNote(note)}>Edit</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;