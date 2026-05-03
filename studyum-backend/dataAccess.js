// dataAccess.js
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// Výchozí struktura dat
const defaultData = {
  subjects: [],
  notes: []
};

// Pomocná funkce: načte data ze souboru a vrátí jako objekt
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    // Pokud soubor neexistuje nebo je poškozený, použijeme výchozí data
    return { ...defaultData };
  }
}

// Pomocná funkce: uloží objekt do souboru
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { loadData, saveData };