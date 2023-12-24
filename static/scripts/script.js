var editors = {};
mermaid.initialize({ startOnLoad: true });

function generateUUID() {
  let dt = new Date().getTime();
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function(c) {
      const r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    },
  );
  return uuid;
}

function debounce(func, delay) {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

// Erstellen einer debounceten Version der saveCodeBlock-Funktion
const debouncedSave = debounce(function(id, code) {
  saveCodeBlock(id, code);
}, 2000);

const debouncedUpdateEditorMode = debounce(function(cm) {
  updateEditorMode(cm);
}, 500);


function saveCodeBlock(editorId, code) {
  const mode = editors[editorId].getMode().name; // Erhalte den aktuellen Modus

  fetch('http://localhost:3000/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: editorId, code: code, mode: mode })
  }).then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.error('Error:', error));
}

function updateMarkdownPreview(editorId, code) {
  const container = document.getElementById(editorId).parentNode;
  let previewElement = container.querySelector('.markdown-preview');

  if (!previewElement) {
    previewElement = document.createElement('div');
    previewElement.className = 'markdown-preview';
    container.appendChild(previewElement);
  }

  previewElement.innerHTML = marked.marked(code);

  const mermaidDiagrams = previewElement.querySelectorAll('.language-mermaid');
  mermaidDiagrams.forEach(diagram => {
    mermaid.init(undefined, diagram);
  });
  MathJax.typesetPromise([previewElement]).catch(function(err) {
    console.error('MathJax rendering error:', err);
  });
}

function removeMarkdownPreview(editorId) {
  const container = document.getElementById(editorId).parentNode;
  let previewElement = container.querySelector('.markdown-preview');
  if (previewElement) {
    previewElement.remove();
  }
}

document.addEventListener("keydown", function(event) {
  if (event.ctrlKey && event.key === "Enter") {
    addNewCodeBlock();
  }
});

function updateEditorMode(editor) {
  const code = editor.getValue();
  const result = hljs.highlightAuto(code);
  var language = result.language;
  if (language == undefined) {
    language = "plaintext"
  }
  // Aktualisieren Sie den CodeMirror-Modus basierend auf der erkannten Sprache
  // editor.setOption('mode', language);
  changeLanguage(editor.id, language)
}

function addNewCodeBlock(uuid = null, content = '') {
  const editorId = uuid || generateUUID();
  const container = document.createElement('div');
  container.className = 'editor-container';
  document.getElementById('editors').appendChild(container);

  const editorElement = document.createElement('textarea');
  editorElement.id = editorId;
  container.appendChild(editorElement);

  const editor = CodeMirror.fromTextArea(editorElement, {
    lineNumbers: true,
    keyMap: 'vim',
    // height: 'auto',
    theme: 'material-ocean',
  });
  editor.id = editorId;
  editor.setValue(content)
  editor.autoLanguageDetection = true

  editor.on('change', function(cm) {
    const code = editor.getValue();

    // Aktualisiert die Markdown-Vorschau bei jeder Änderung
    if (editor.getMode().name === "markdown") {
      updateMarkdownPreview(editor.id, code);
    }

    debouncedSave(editorId, code);
    if (editor.autoLanguageDetection) {
      debouncedUpdateEditorMode(cm);
    }

  });
  editors[editorId] = editor;
  setupFocusListener(editorId);
  addDeleteListener(editorId, editor);
  addCursorMovementListener(editorId, editor); // Fügen Sie den Event-Listener hinzu
  addCursorCenteringListener(editor); // Fügen Sie den Event-Listener hinzu
  editor.focus();
  updateStatusBar(editor.getOption("mode")); // Aktualisiert die Statusleiste

  if (!uuid) {
    saveEditorIdsInLocalStorage(editorId); // Speichern der UUID im Local Storage
  }
  updateEditorMode(editor, editorId);
}

function saveEditorIdsInLocalStorage(newEditorId) {
  let editorIds = JSON.parse(localStorage.getItem('editorIds')) || [];
  editorIds.push(newEditorId);
  localStorage.setItem('editorIds', JSON.stringify(editorIds));
}

var focusedEditorId = null; // ID des aktuell fokussierten Editors

// Funktion zum Ändern der Sprache des Editors und Anpassung der Breite
function changeLanguage(editorId, newMode) {
  console.log("chaning editor", editorId, "mode to", newMode)
  var editor = editors[editorId];
  if (editor) {
    editor.setOption("mode", newMode);
    updateStatusBar(newMode);

    if (newMode === "markdown") {
      // Markdown: Anpassen der Breite und Anzeigen der Vorschau
      updateMarkdownPreview(editorId, editor.getValue());
    } else {
      // Andere Sprachen: Volle Breite und Entfernen der Vorschau
      removeMarkdownPreview(editorId);
    }
  }
}
// Event-Listener für jeden Editor, um den fokussierten Editor zu identifizieren
function setupFocusListener(editorId) {
  var editor = editors[editorId];
  if (editor) {
    editor.on("focus", function() {
      // const wrapperElement = editor.getWrapperElement();
      // wrapperElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      focusedEditorId = editorId;
      updateStatusBar(editor.getOption("mode")); // Aktualisiert die Statusleiste
    });
  }
}

function updateStatusBar(language) {
  document.getElementById('currentLanguage').textContent = language;
}

async function loadBuffersFromLocalStorage() {
  const editorIds = JSON.parse(localStorage.getItem('editorIds')) || [];
  console.log(editorIds);
  if (editorIds.length === 0) {
    addNewCodeBlock(); // Fügt einen neuen Editor hinzu, falls keine gespeichert sind
  } else {
    for (const id of editorIds) {
      try {
        const response = await fetch(`http://localhost:3000/api/load/${id}`);
        const code = await response.text();
        addNewCodeBlock(id, code);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
}


document.addEventListener('DOMContentLoaded', function() {
  loadBuffersFromLocalStorage();
  updateStatusBar('None'); // Initialisiert die Statusleiste
  // console.log(Object.values(editors)[0]);
  // Object.values(editors)[0].focus(); 
});

function loadAndCreateEditor(uuid) {
  fetch(`http://localhost:3000/api/load/${uuid}`)
    .then(response => response.text())
    .then(code => {
      console.log(code)
      const editorElement = document.createElement('textarea');
      editorElement.id = uuid;
      document.getElementById('editors').appendChild(editorElement);

      const editor = CodeMirror.fromTextArea(editorElement, {
        value: code // Setzen des geladenen Codes
      });

      editors[uuid] = editor;
    })
    .catch(error => console.error('Error:', error));
}


function addDeleteListener(editorId, editor) {
  editor.on('keydown', function(cm, event) {
    if (event.keyCode === 8 && cm.getValue() === '') { // KeyCode 46 ist die Löschtaste

      cm.getWrapperElement().parentNode.remove(); // Entfernt den Editor vom DOM
      delete editors[editorId]; // Entfernt den Editor aus dem Speicher
      deleteCodeBlock(editorId); // Backend-Anfrage zum Löschen
      focusPreviousEditor(editorId);
      removeFromLocalStorage(editorId); // Entfernt die ID aus dem Local Storage
    }
  });
}

function deleteCodeBlock(editorId) {
  fetch(`http://localhost:3000/api/delete/${editorId}`, { method: 'DELETE' })
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.error('Error:', error));
}


// function shareCodeBlock() {
//     const shareUrl = window.location.origin + '/editor/' + focusedEditorId;
//     console.log("Teile diesen Link: " + shareUrl);
//     // Sie können auch den Link in die Zwischenablage kopieren oder direkt anzeigen
// }


document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault(); // Verhindern des Standardverhaltens von Ctrl+S
    saveAndShareCurrentEditor();
  }
});

function saveAndShareCurrentEditor() {
  const editorId = focusedEditorId;
  const code = editors[editorId].getValue();
  const mode = editors[editorId].getMode().name;

  // Speichern des aktuellen Codeblocks
  fetch('http://localhost:3000/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: editorId, code: code, mode: mode })
  })
    .then(response => response.text())
    .then(() => {
      const shareUrl = window.location.origin + '/editor/' + editorId;
      window.open(shareUrl, '_blank');
    })
    .catch(error => console.error('Error:', error));
}

function removeFromLocalStorage(editorId) {
  let editorIds = JSON.parse(localStorage.getItem('editorIds')) || [];
  editorIds = editorIds.filter(id => id !== editorId);
  localStorage.setItem('editorIds', JSON.stringify(editorIds));
}

function addCursorMovementListener(editorId, editor) {
  editor.on('keydown', function(cm, event) {
    if (cm.getOption('keyMap').startsWith('vim') && cm.state.vim?.insertMode) {
      return;
    }

    const keyCode = event.keyCode;
    const cursor = cm.getCursor();
    const lineCount = cm.lineCount();

    if ((keyCode === 74 || keyCode === 40) && cursor.line === lineCount - 1) { // J oder Pfeil nach unten
      event.preventDefault();
      focusNextEditor(editorId);
    } else if ((keyCode === 75 || keyCode === 38) && cursor.line === 0) { // K oder Pfeil nach oben
      event.preventDefault();
      focusPreviousEditor(editorId);
    }
  });
}


function focusNextEditor(currentEditorId) {
  const editorIds = JSON.parse(localStorage.getItem('editorIds')) || [];
  const currentIndex = editorIds.indexOf(currentEditorId);
  if (currentIndex >= 0 && currentIndex < editorIds.length - 1) {
    editors[editorIds[currentIndex + 1]].focus();
    centerCursor(editors[editorIds[currentIndex + 1]]);
  }
}

function focusPreviousEditor(currentEditorId) {
  const editorIds = JSON.parse(localStorage.getItem('editorIds')) || [];
  const currentIndex = editorIds.indexOf(currentEditorId);
  if (currentIndex > 0) {
    const prevEditorId = editorIds[currentIndex - 1];
    const prevEditor = editors[prevEditorId];

    const lastLine = prevEditor.lineCount() - 1;
    prevEditor.setCursor({ line: lastLine, ch: 0 }); // Setzt den Cursor an den Anfang der letzten Zeile
    prevEditor.focus();
    // centerCursor(prevEditor);
  }
}

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'c') {
    event.preventDefault(); // Verhindert das Standard-Copy-Event

    // Angenommen, Sie haben eine Funktion, um den aktuell fokussierten Editor zu finden
    const currentEditor = getCurrentFocusedEditor();
    if (currentEditor) {
      copyToClipboard(currentEditor.getValue());
    }
  }
});

function getCurrentFocusedEditor() {
  return editors[focusedEditorId];
}

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'l') {
    event.preventDefault(); // Verhindern des Standardverhaltens von Ctrl+L
    const currentEditor = getCurrentFocusedEditor();
    if (currentEditor) {
      selectLanguage(currentEditor);
    }
  }
});

function selectLanguage(editor) {
  const language = prompt("Bitte Sprache eingeben (z.B. 'javascript', 'python'):");
  if (language) {
    editor.autoLanguageDetection = false
    changeLanguage(focusedEditorId, language);
  }
}

function centerCursor(cm) {
  const cursorPos = cm.cursorCoords(true, 'window');
  const cursorVerticalPosition = cursorPos.top;

  const windowHeight = window.innerHeight;

  if (cursorVerticalPosition + 100 < windowHeight / 2) {
    window.scrollTo({ left: 0, top: window.scrollY + cursorVerticalPosition + 100 - windowHeight / 2, behavior: "smooth" });
  }
  if (cursorVerticalPosition - 100 > windowHeight / 2) {
    window.scrollTo({ left: 0, top: window.scrollY + cursorVerticalPosition - 100 - windowHeight / 2, behavior: "smooth" });
  }

}

function addCursorCenteringListener(editor) {
  editor.on('cursorActivity', function(cm) {
    setTimeout(() => {
      centerCursor(cm);
    }, 0);
  });
}
