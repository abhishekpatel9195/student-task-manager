
const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

app.use(express.json());

// Connect database
const db = new Database("tasks.db");

// Create table
db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending'
    )
`);

// Show website
app.use(express.static(__dirname));

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Test database
app.get("/api/test", function(req, res) {
    res.json({ message: "Database connected successfully!" });
});

// Get all tasks
app.get("/api/tasks", function(req, res) {
    const tasks = db.prepare("SELECT * FROM tasks").all();
    res.json(tasks);
});

// Add task
app.post("/api/tasks", function(req, res) {
    const { title, subject, dueDate } = req.body;

    if (!title || !subject || !dueDate) {
        return res.status(400).json({ message: "Please fill in all fields." });
    }

    const result = db.prepare(`
        INSERT INTO tasks (title, subject, dueDate)
        VALUES (?, ?, ?)
    `).run(title, subject, dueDate);

    const task = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(task);
});

// Update task
app.put("/api/tasks/:id", function(req, res) {
    const { title, subject, dueDate, status } = req.body;

    if (!title || !subject || !dueDate ||
        !["Pending", "Completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid task details." });
    }

    const result = db.prepare(`
        UPDATE tasks
        SET title = ?, subject = ?, dueDate = ?, status = ?
        WHERE id = ?
    `).run(title, subject, dueDate, status, req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task updated successfully!" });
});

// Delete task
app.delete("/api/tasks/:id", function(req, res) {
    const result = db.prepare(
        "DELETE FROM tasks WHERE id = ?"
    ).run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted successfully!" });
});

// Start server
app.listen(PORT, function() {
    console.log("Server is running at http://localhost:" + PORT);
});
