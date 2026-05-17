import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import NoteForm from './components/NoteForm';
import SubjectForm from './components/SubjectForm';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  const API_URL = 'http://localhost:3000/api';

  const fetchData = async () => {
    try {
      const [subjectsRes, notesRes] = await Promise.all([
        fetch(`${API_URL}/subjects`),
        fetch(`${API_URL}/notes`)
      ]);
      const subjectsJson = await subjectsRes.json();
      const notesJson = await notesRes.json();
      
      // Extract the nested data array from the backend response structure
      setSubjects(subjectsJson.data || []);
      setNotes(notesJson.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveNote = async (noteData, id) => {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/notes/${id}` : `${API_URL}/notes`;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    });
    
    await fetchData();
    setCurrentView('dashboard');
  };

  const handleSaveSubject = async (subjectData) => {
    await fetch(`${API_URL}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subjectData)
    });
    
    await fetchData();
    setCurrentView('dashboard');
  };

  return (
    <div className="App">
      <header className="main-header">
        <h1>Studyum</h1>
      </header>
      
      <main className="container">
        {currentView === 'dashboard' && (
          <Dashboard 
            subjects={subjects} 
            notes={notes} 
            onNewSubject={() => setCurrentView('newSubject')}
            onNewNote={() => setCurrentView('newNote')}
            onEditNote={(note) => {
              setSelectedNote(note);
              setCurrentView('editNote');
            }}
          />
        )}

        {(currentView === 'newNote' || currentView === 'editNote') && (
          <NoteForm 
            note={currentView === 'editNote' ? selectedNote : null}
            subjects={subjects}
            existingNotes={notes}
            onSave={handleSaveNote}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'newSubject' && (
          <SubjectForm 
            onSave={handleSaveSubject}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

export default App;