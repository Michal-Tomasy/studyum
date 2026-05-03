const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const defaultData = {
  subjects: [],
  notes: []
};

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    return { ...defaultData };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { loadData, saveData };