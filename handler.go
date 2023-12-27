package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"text/template"

	"github.com/google/uuid"
)

func deleteCodeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "DELETE" {
			http.Error(w, "Nur DELETE erlaubt", http.StatusMethodNotAllowed)
			return
		}

		editorId := strings.TrimPrefix(r.URL.Path, "/api/delete/")
		_, err := db.Exec("DELETE FROM code_blocks WHERE id = ?", editorId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		fmt.Fprintf(w, "Codeblock %s gelöscht", editorId)
	}
}

type EditorData struct {
	Code string
	Mode string
}

func editorHandler(db *sql.DB, tmpl *template.Template) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uuid := strings.TrimPrefix(r.URL.Path, "/editor/")
		var data EditorData
		err := db.QueryRow("SELECT code, mode FROM code_blocks WHERE id = ?", uuid).Scan(&data.Code, &data.Mode)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		err = tmpl.Execute(w, data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func loadCodeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uuid := strings.TrimPrefix(r.URL.Path, "/api/load/")
		var code string
		err := db.QueryRow("SELECT code FROM code_blocks WHERE id = ?", uuid).Scan(&code)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		fmt.Fprintf(w, "%s", code) // Senden des Codes als Antwort
	}
}

func newBufferHandler(db *sql.DB) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {
		var codeData []CodeData

		code := "# buffercanvas\n\n- [x] task 1\n\n## Keybinds \n\n| Keybind                   | Action                  |\n|---------------------------|-------------------------|\n| ctrl + s                  | share                   |\n| ctrl + l                  | pin language for buffer |\n| ctrl + return             | new buffer              |\n| backspace in empty buffer | deletes buffer          |\n\n### math \n\n$$\nx = \\frac{t}{3}\n$$\n\n### mermaid diagrams\n\n```mermaid\ngraph LR\nA --- B\nB-->C[fa:fa-ban forbidden]\nB-->D(fa:fa-spinner);\n```"

		var example = CodeData{
			UUID:     uuid.New(),
			Code:     code,
			Language: "markdown",
		}
		codeData = append(codeData, example)
		codeData = append(codeData, CodeData{
			UUID:     uuid.New(),
			Code:     "### Hallo was machen Sachen\n\nWas geht ab Berlin ",
			Language: "markdown",
		})
		codeData = append(codeData, CodeData{
			UUID: uuid.New(),
			Code: `func newBufferHandler(db *sql.DB) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {
		var codeData []CodeData

		var example = CodeData{
			UUID: uuid.New(),
			Code: "hello world",
			Language: "markdown",
		}
		codeData = append(codeData, example)`,
			Language: "golang",
		})

		// _, err := db.Exec("INSERT INTO code_blocks (id, code, mode) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET code = ?, mode = ?", codeData.ID, codeData.Code, codeData.Mode, codeData.Code, codeData.Mode)

		jsonData, err := json.Marshal(codeData)
		if err != nil {
			fmt.Println("error:", err)
		}

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write(jsonData)
	}
}

func saveCodeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var codeData CodeData
		err := json.NewDecoder(r.Body).Decode(&codeData)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		_, err = db.Exec("INSERT INTO code_blocks (id, code, mode) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET code = ?, mode = ?", codeData.UUID, codeData.Code, codeData.Language, codeData.Code, codeData.Language)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		fmt.Fprint(w, "Codeblock gespeichert")
	}
}
