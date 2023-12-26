package main

import (
	"database/sql"
	"log"
	"net/http"
)

func logRequest(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s %s\n", r.RemoteAddr, r.Method, r.URL)
		handler.ServeHTTP(w, r)
	})
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
