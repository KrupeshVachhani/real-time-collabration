import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import TextEditor from './TextEditor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={`/document/${uuidv4()}`} />} />
        <Route path="/document/:id" element={<TextEditor />} />
      </Routes>
    </Router>
  );
}

export default App;