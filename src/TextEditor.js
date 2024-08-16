import React, { useRef, useEffect } from 'react';
import 'quill/dist/quill.snow.css'; // Import Quill's CSS
import Quill from 'quill';
import './TextEditor.css'; // Import custom CSS for additional styling

const TextEditor = () => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: '#toolbar', // Link the toolbar to the editor
        },
        placeholder: 'Compose an epic...',
        readOnly: false,
        formats: [
          'header',
          'bold',
          'italic',
          'underline',
          'list',
          'bullet',
          'link',
          'align',
        ],
      });
    }

    // Check and ensure that there is a valid selection
    const handleSelectionChange = () => {
      if (quillRef.current) {
        const range = quillRef.current.getSelection();
        if (!range) {
          console.log('No selection');
          return;
        }
      }
    };

    if (quillRef.current) {
      quillRef.current.on('selection-change', handleSelectionChange);
    }

    return () => {
      // Clean up event listener when component unmounts
      if (quillRef.current) {
        quillRef.current.off('selection-change', handleSelectionChange);
      }
    };
  }, []);

  return (
    <div className="text-editor-container">
      <div id="toolbar">
        <select className="ql-header">
          <option value="1"></option>
          <option value="2"></option>
          <option selected></option>
        </select>
        <button className="ql-bold"></button>
        <button className="ql-italic"></button>
        <button className="ql-underline"></button>
        <button className="ql-list" value="ordered"></button>
        <button className="ql-list" value="bullet"></button>
        <button className="ql-link"></button>
        <select className="ql-align">
          <option selected></option>
          <option value="center"></option>
          <option value="right"></option>
          <option value="justify"></option>
        </select>
        <button className="ql-clean"></button>
      </div>
      <div ref={editorRef} className="text-editor"></div>
    </div>
  );
};

export default TextEditor;
