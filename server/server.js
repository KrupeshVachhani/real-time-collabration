const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const documents = {};

io.on('connection', (socket) => {
  socket.on('createDocument', () => {
    const documentId = uuidv4();
    documents[documentId] = { content: '', cursors: {}, name: 'Untitled Document' };
    socket.emit('documentCreated', documentId);
  });

  socket.on('get-document', documentId => {
    socket.join(documentId);
    if (!documents[documentId]) {
      documents[documentId] = { content: '', cursors: {}, name: 'Untitled Document' };
    }
    socket.emit('load-document', {
      content: documents[documentId].content,
      name: documents[documentId].name
    });
  });

  socket.on('send-changes', ({ documentId, delta }) => {
    if (documents[documentId]) {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    }
  });

  socket.on('save-document', ({ documentId, content }) => {
    if (documents[documentId]) {
      documents[documentId].content = content;
    }
  });

  socket.on('update-document-name', ({ documentId, name }) => {
    if (documents[documentId]) {
      documents[documentId].name = name;
      io.to(documentId).emit('document-name-updated', name);
    }
  });

  socket.on('updateCursor', ({ documentId, cursorPosition }) => {
    if (documents[documentId]) {
      documents[documentId].cursors[socket.id] = cursorPosition;
      socket.broadcast.to(documentId).emit('cursorUpdated', {
        userId: socket.id,
        cursorPosition
      });
    }
  });

  socket.on('disconnect', () => {
    Object.keys(documents).forEach(documentId => {
      if (documents[documentId].cursors[socket.id]) {
        delete documents[documentId].cursors[socket.id];
        io.to(documentId).emit('cursorRemoved', socket.id);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));