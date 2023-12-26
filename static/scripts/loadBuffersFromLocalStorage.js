
async function loadBuffersFromLocalStorage() {
  const editorIds = JSON.parse(localStorage.getItem("editorIds")) || [];
  console.log(editorIds);
  if (editorIds.length === 0) {
    tutorialText = `# Buffercanvas Tutorial: 

### Keybinds 

| Keybind                   | Action                                  |
|---------------------------|-----------------------------------------|
| ctrl + s                  | share                                   |
| ctrl + l                  | pin language for buffer                 |
| ctrl + c                  | copy current buffer to system clipboard |
| ctrl + return             | new buffer                              |
| backspace in empty buffer | deletes buffer                          |`;

    addNewCodeBlock(null, tutorialText, "markdown");

    mathDemo = `## math demo 

$$
\\forall n \\in \\mathbb{N}
$$

## mermaid 

\`\`\`mermaid
flowchart TB
	A --> B
	A --> C
	D --> A
    B --> A
\`\`\` `;
    addNewCodeBlock(null, mathDemo, "markdown");
  } else {
    for (const id of editorIds) {
      try {
        const response = await fetch(`/api/load/${id}`);
        const code = await response.text();
        addNewCodeBlock(id, code);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  }
}
