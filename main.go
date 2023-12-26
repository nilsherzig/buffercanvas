package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

type CodeData struct {
	UUID     uuid.UUID `json:"uuid"`
	Code     string    `json:"code"`
	Language string    `json:"language"`
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

func main() {
	log.Println("starting...")
	db := initDB()
	defer db.Close()

	go func() {
		countCodeBlocks(db)
		ticker := time.NewTicker(10 * time.Minute)
		for {
			select {
			case <-ticker.C:
				countCodeBlocks(db)
			}
		}
	}()

	// http.HandleFunc("/api/create", newBufferHandler(db))
	http.HandleFunc("/api/save", saveCodeHandler(db))
	http.HandleFunc("/api/delete/", deleteCodeHandler(db))
	http.HandleFunc("/api/load/", newBufferHandler(db))

	fmt.Println("Server startet auf http://localhost:3000")
	http.ListenAndServe(":3000", logRequest(http.DefaultServeMux))
}
