import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import TextEditor from "./TextEditor";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={`/document/${crypto.randomUUID()}`} />} />
        <Route path="/document/:id" element={<TextEditor />} />
      </Routes>
    </Router>
  );
}

export default App;