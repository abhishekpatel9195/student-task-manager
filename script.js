
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const subject = document.getElementById("subject");
const dueDate = document.getElementById("dueDate");

const taskList = document.getElementById("taskList");
const taskFilter = document.getElementById("taskFilter");
const emptyMessage = document.getElementById("emptyMessage");

const formHeading = document.getElementById("formHeading");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");

let tasks = [];
let editingTaskId = null;

// Get tasks from database
async function loadTasks() {
    try {
        const response = await fetch("/api/tasks");

        if (!response.ok) {
            throw new Error("Unable to load tasks.");
        }

        tasks = await response.json();
        displayTasks();

    } catch (error) {
        console.error("Error loading tasks:", error);
        alert("Could not load tasks from database.");
    }
}

// Display tasks on website
function displayTasks() {
    taskList.innerHTML = "";

    const selectedFilter = taskFilter.value;

    let filteredTasks = tasks;

    if (selectedFilter !== "All") {
        filteredTasks = tasks.filter(function(task) {
            return task.status === selectedFilter;
        });
    }

    emptyMessage.style.display =
        filteredTasks.length === 0 ? "block" : "none";

    if (tasks.length === 0) {
        emptyMessage.textContent = "No tasks added yet.";
    } else {
        emptyMessage.textContent = "No tasks found for this filter.";
    }

    filteredTasks.forEach(function(task) {
        const taskCard = document.createElement("div");
        taskCard.className = "task-card";

        const title = document.createElement("h3");
        title.textContent = task.title;

        const subjectText = document.createElement("p");
        subjectText.textContent = "Subject: " + task.subject;

        const dateText = document.createElement("p");
        dateText.textContent = "Due Date: " + task.dueDate;

        const statusText = document.createElement("p");
        statusText.textContent = "Status: " + task.status;

        const completeButton = document.createElement("button");
        completeButton.textContent =
            task.status === "Completed"
                ? "Mark as Pending"
                : "Mark as Completed";

        completeButton.addEventListener("click", function() {
            updateTaskStatus(task);
        });

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editTask(task);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            deleteTask(task.id);
        });

        taskCard.appendChild(title);
        taskCard.appendChild(subjectText);
        taskCard.appendChild(dateText);
        taskCard.appendChild(statusText);
        taskCard.appendChild(completeButton);
        taskCard.appendChild(editButton);
        taskCard.appendChild(deleteButton);

        taskList.appendChild(taskCard);
    });
}

// Add or update task
taskForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const taskData = {
        title: taskTitle.value.trim(),
        subject: subject.value.trim(),
        dueDate: dueDate.value
    };

    if (!taskData.title || !taskData.subject || !taskData.dueDate) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        let response;

        if (editingTaskId === null) {
            response = await fetch("/api/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(taskData)
            });
        } else {
            const existingTask = tasks.find(function(task) {
                return task.id === editingTaskId;
            });

            response = await fetch("/api/tasks/" + editingTaskId, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...taskData,
                    status: existingTask.status
                })
            });
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Something went wrong.");
        }

        alert(result.message || "Task saved successfully!");

        resetForm();
        await loadTasks();

    } catch (error) {
        console.error("Error saving task:", error);
        alert(error.message);
    }
});

// Edit task
function editTask(task) {
    editingTaskId = task.id;

    taskTitle.value = task.title;
    subject.value = task.subject;
    dueDate.value = task.dueDate;

    formHeading.textContent = "Edit Task";
    submitButton.textContent = "Update Task";
    cancelButton.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Cancel edit
cancelButton.addEventListener("click", function() {
    resetForm();
});

// Reset form
function resetForm() {
    taskForm.reset();
    editingTaskId = null;

    formHeading.textContent = "Add New Task";
    submitButton.textContent = "Add Task";
    cancelButton.hidden = true;
}

// Update task status
async function updateTaskStatus(task) {
    const updatedStatus =
        task.status === "Completed" ? "Pending" : "Completed";

    try {
        const response = await fetch("/api/tasks/" + task.id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: task.title,
                subject: task.subject,
                dueDate: task.dueDate,
                status: updatedStatus
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to update status.");
        }

        await loadTasks();

    } catch (error) {
        console.error("Error updating task:", error);
        alert(error.message);
    }
}

// Delete task
async function deleteTask(id) {
    const confirmDelete = confirm("Are you sure you want to delete this task?");

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch("/api/tasks/" + id, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to delete task.");
        }

        alert(result.message);
        await loadTasks();

    } catch (error) {
        console.error("Error deleting task:", error);
        alert(error.message);
    }
}

// Filter tasks
taskFilter.addEventListener("change", function() {
    displayTasks();
});

// Load saved tasks when website opens
loadTasks();
