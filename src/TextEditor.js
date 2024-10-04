import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import axios from "axios";
import io from "socket.io-client";
import "./TextEditor.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Offcanvas, Button } from "react-bootstrap";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

const SAVE_INTERVAL_MS = 2000;
const GEMINI_API_KEY = "AIzaSyAALEqckBvFA6x27SFKibRYvmzBPaKarxY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export default function TextEditor() {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [fileName, setFileName] = useState("Untitled Document");
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef();

  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);

    if (!documentId) {
      s.emit("createDocument");
      s.once("documentCreated", (newDocumentId) => {
        navigate(`/document/${newDocumentId}`);
      });
    }

    return () => {
      s.disconnect();
    };
  }, [documentId, navigate]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document.content);
      setFileName(document.name);
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", {
        documentId,
        content: quill.getContents(),
      });
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", { documentId, delta });
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill, documentId]);

  const initializeQuill = useCallback(() => {
    if (wrapperRef.current == null) return;

    wrapperRef.current.innerHTML = "";
    const editor = document.createElement("div");
    wrapperRef.current.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    q.setText("Loading...");
    setQuill(q);

    return () => {
      if (wrapperRef.current) {
        wrapperRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    initializeQuill();
  }, [initializeQuill]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (chatInput.trim() === "") return;

    const userMessage = { user: "You", content: chatInput };
    setChatMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const response = await axios.post(
        API_URL,
        {
          contents: [
            {
              parts: [
                {
                  text:
                    chatInput +
                    "\n\nPlease provide your response in a simple HTML format.",
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const geminiResponse = response.data.candidates[0].content.parts[0].text;
      const geminiMessage = { user: "Gemini", content: geminiResponse };
      setChatMessages((prevMessages) => [...prevMessages, geminiMessage]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      const errorMessage = {
        user: "System",
        content: "Error: Unable to get response from Gemini.",
      };
      setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
    }

    setChatInput("");
  };

  const handleUndo = () => {
    quill.history.undo();
  };

  const handleRedo = () => {
    quill.history.redo();
  };

  const handleFileNameChange = (e) => {
    const newName = e.target.value;
    setFileName(newName);
    if (socket) {
      socket.emit("update-document-name", { documentId, name: newName });
    }
  };

  // Update the handleDownload function to generate a .docx file
  const handleDownload = () => {
    const quillContent = quill.getContents();
    const plainText = quill.getText(); // Extract plain text from the Quill editor

    // Load a base .docx template (make sure you have a base .docx template to use)
    axios
      .get("/path/to/template.docx", { responseType: "arraybuffer" }) // You need to serve this file as a public asset
      .then((response) => {
        const zip = new PizZip(response.data);

        // Prepare the content for docxtemplater
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Use plain text from the editor for the document
        doc.setData({
          text: plainText,
        });

        try {
          // Render the document (replace all occurrences of {text} with the actual content)
          doc.render();
        } catch (error) {
          console.error("Error rendering the docx file:", error);
          return;
        }

        // Generate the document and convert it into a Blob
        const out = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Save the Blob as a .docx file
        saveAs(out, `${fileName}.docx`);
      })
      .catch((error) => {
        console.error("Error loading the template:", error);
      });
  };

  const toggleOffcanvas = () => setShowOffcanvas(!showOffcanvas);

  return (
    <div className="container-fluid p-0">
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <div className="navbar-nav me-auto">
            <button
              className="btn btn-outline-secondary me-2"
              onClick={handleUndo}
            >
              Undo
            </button>
            <button
              className="btn btn-outline-secondary me-2"
              onClick={handleRedo}
            >
              Redo
            </button>
          </div>
          <input
            type="text"
            value={fileName}
            onChange={handleFileNameChange}
            className="form-control me-2"
            style={{ width: "auto" }}
          />
          <div className="navbar-nav ms-auto">
            <button
              className="btn btn-outline-primary me-2"
              onClick={handleDownload}
            >
              Download
            </button>
            <Button variant="primary" onClick={toggleOffcanvas}>
              Chat with Gemini
            </Button>
          </div>
        </div>
      </nav>
      <div className="editor-container">
        <div className="editor" ref={wrapperRef} />
      </div>
      <Offcanvas show={showOffcanvas} onHide={toggleOffcanvas} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Chat with Gemini</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="chat-messages">
            {chatMessages.map((message, index) => (
              <div key={index} className="message">
                <span className="user">{message.user}: </span>
                {message.user === "Gemini" ? (
                  <div dangerouslySetInnerHTML={{ __html: message.content }} />
                ) : (
                  <span>{message.content}</span>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleChatSubmit} className="chat-input mt-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Gemini..."
              />
              <button className="btn btn-primary" type="submit">
                Send
              </button>
            </div>
          </form>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
