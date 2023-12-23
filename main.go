package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"text/template"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type CodeData struct {
	ID   string `json:"id"`
	Code string `json:"code"`
	Mode string `json:"mode"`
}

func initDB() *sql.DB {
	db, err := sql.Open("sqlite3", "code_data.db")
	if err != nil {
		log.Fatal(err)
	}

	createTableSQL := `CREATE TABLE IF NOT EXISTS code_blocks (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT,
		"mode" TEXT
    );`
	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}

	return db
}

func saveCodeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var codeData CodeData
		err := json.NewDecoder(r.Body).Decode(&codeData)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		_, err = db.Exec("INSERT INTO code_blocks (id, code, mode) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET code = ?, mode = ?", codeData.ID, codeData.Code, codeData.Mode, codeData.Code, codeData.Mode)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		fmt.Fprint(w, "Codeblock gespeichert")
	}
}

func main() {
	log.Println("starting...")
	db := initDB()
	defer db.Close()

	// serve static files (js and css)
	fs := http.FileServer(http.Dir("./static/"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// serve index.html
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./index.html")
	})

	go func() {
		ticker := time.NewTicker(30 * time.Second) // Passt das Intervall nach Bedarf an
		for {
			select {
			case <-ticker.C:
				countCodeBlocks(db)
			}
		}
	}()

	http.HandleFunc("/api/save", saveCodeHandler(db))
	http.HandleFunc("/api/delete/", deleteCodeHandler(db))

	tmpl, err := template.ParseFiles(filepath.Join("./templates", "sharedBuffer.html"))
	if err != nil {
		log.Fatal(err)
	}
	http.HandleFunc("/editor/", editorHandler(db, tmpl))
	http.HandleFunc("/api/load/", loadCodeHandler(db))

	fmt.Println("Server startet auf http://localhost:3000")
	http.ListenAndServe(":3000", nil)
}

func countCodeBlocks(db *sql.DB) {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM code_blocks").Scan(&count)
	if err != nil {
		log.Printf("Fehler beim Zählen der Codeblöcke: %v", err)
		return
	}
	log.Printf("Anzahl der gespeicherten Codeblöcke: %d", count)
}

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
