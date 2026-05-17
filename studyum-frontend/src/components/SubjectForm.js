import React, { useState } from 'react';

function SubjectForm({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage("Please fill in all the fields marked by *.");
      return;
    }

    const subjectData = {
      name: name,
      color: color
    };

    onSave(subjectData);
  };

  return (
    <div className="form-container">
      <h2>New Subject</h2>
      
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Subject Name *</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Color</label>
          {/* Flexbox container aligns the input, visual preview, and text side-by-side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)} 
              style={{ cursor: 'pointer' }}
            />
            {/* Visual indicator showing the actual selected color */}
            <div style={{ 
              width: '30px', 
              height: '30px', 
              backgroundColor: color, 
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}></div>
            <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>{color}</span>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn primary">Save</button>
          <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default SubjectForm;