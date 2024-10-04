import React, { useState, useRef } from "react";
import "./Nav.css";

export default function Nav({ fileName, setFileName, documentId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);
  const fileNameInputRef = useRef(null);

  const handleFileNameClick = () => {
    setIsEditing(true);
    setTimeout(() => fileNameInputRef.current?.focus(), 0);
  };

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  };

  const handleFileNameBlur = () => {
    setIsEditing(false);
  };

  const handleFileNameKeyDown = (e) => {
    if (e.key === "Enter") {
      setIsEditing(false);
    }
  };

  const handleShareClick = () => {
    const shareUrl = `${window.location.origin}/document/${documentId}`;
    navigator.clipboard.writeText(shareUrl);
    setShowShareLink(true);
    setTimeout(() => setShowShareLink(false), 3000);
  };

  return (
    <nav className="word-navbar">
      <div className="navbar-left">
        <div className="file-menu">
          <span className="doc-name">{fileName}</span>
        </div>
      </div>
      <div className="navbar-center">
        {isEditing ? (
          <input
            ref={fileNameInputRef}
            type="text"
            value={fileName}
            onChange={handleFileNameChange}
            onBlur={handleFileNameBlur}
            onKeyDown={handleFileNameKeyDown}
            className="filename-input"
          />
        ) : (
          <span onClick={handleFileNameClick} className="filename-display">
            {fileName}
          </span>
        )}
      </div>
      <div className="navbar-right">
        <button onClick={handleShareClick} className="share-button">
          Share
        </button>
        {showShareLink && <span className="share-link-copied">Link copied!</span>}
        <div className="user-info">
          <span className="user-name">User Name</span>
          <div className="user-avatar"></div>
        </div>
      </div>
    </nav>
  );
}