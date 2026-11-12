// ==STORAGE-MANAGER-START==

// I-save ang note sa localStorage ng browser
function saveNoteToLocalStorage(note) {
    try {
        const notes = getAllStoredNotes();
        const existingIndex = notes.findIndex(n => n.id === note.id);
        
        if (existingIndex >= 0) {
            notes[existingIndex] = note; // Update kung meron na
        } else {
            note.id = note.id || 'note_' + Date.now();
            notes.push(note); // Bagong entry kung wala pa
        }
        
        localStorage.setItem('gitvoice_clinical_notes', JSON.stringify(notes));
        return true;
    } catch (e) {
        console.error("Failed to save note to localStorage:", e);
        return false;
    }
}

// Kunin ang lahat ng naka-save na notes
function getAllStoredNotes() {
    try {
        const data = localStorage.getItem('gitvoice_clinical_notes');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to retrieve notes from localStorage:", e);
        return [];
    }
}

// Burahin ang isang note base sa ID nito
function deleteStoredNote(noteId) {
    try {
        let notes = getAllStoredNotes();
        notes = notes.filter(n => n.id !== noteId);
        localStorage.setItem('gitvoice_clinical_notes', JSON.stringify(notes));
        return true;
    } catch (e) {
        console.error("Failed to delete note:", e);
        return false;
    }
}

// ==STORAGE-MANAGER-END==
