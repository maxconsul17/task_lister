// Key used to store task session data in sessionStorage
const STORAGE_KEY = "taskListerSession";

// Map to hold active timers for tasks (not used in this snippet directly)
const timers = new Map();

// Restore session data when the window loads
window.onload = () => {
    const data = sessionStorage.getItem(STORAGE_KEY);
    const today = new Date().toDateString();

    if (data) {
        const arr = JSON.parse(data);

        // Only restore tasks if they were saved today
        if (arr[0]?.savedDate === today) {
            arr.forEach(task => restoreTask(task));
        } else {
            // Clear outdated data
            sessionStorage.removeItem(STORAGE_KEY);
        }
    }
};

// Format a Date object to "h:mm AM/PM" format
function formatTime(d) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Format a Date object to local date string
function formatDate(d) {
    return d.toLocaleDateString();
}

// Save all current tasks in the DOM to sessionStorage
function saveAll() {
    const arr = Array.from(document.querySelectorAll(".task-card")).map(card => ({
        desc: card.dataset.desc,
        color: card.style.borderLeftColor,
        time: card.querySelector(".time").textContent,
        ts: Array.from(card.querySelectorAll(".timestamps")).map(e => e.textContent),
        status: card.dataset.status,
        savedDate: new Date().toDateString()
    }));

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// Recreate a task in the DOM from saved session data
function restoreTask(t) {
    // Create the task card container
    const card = document.createElement("div");
    card.className = "card mb-3 task-card";
    card.style.borderLeftColor = t.color;
    card.style.backgroundColor = "#fff";
    card.dataset.desc = t.desc;
    card.dataset.status = t.status;

    // Create card body
    const body = document.createElement("div");
    body.className = "card-body";

    // Description text
    const txt = document.createElement("p");
    txt.className = "card-text";
    txt.textContent = t.desc;

    // Task start time
    const time = document.createElement("span");
    time.className = "time";
    time.textContent = t.time;

    // Timestamp entries (status changes, etc.)
    const spans = t.ts.map(text => {
        const d = document.createElement("div");
        d.className = "timestamps";
        d.textContent = text;
        return d;
    });

    // Action buttons: Start, Stop, Interrupt, Remove
    const buttons = [
        { txt: "Start", cls: "btn btn-success", fn: startTimer },
        { txt: "Stop", cls: "btn btn-secondary", fn: stopTimer },
        { txt: "Interrupt", cls: "btn btn-warning text-white", fn: interruptTask },
        { txt: "Remove", cls: "btn btn-danger", fn: removeTask }
    ].map(b => {
        const btn = document.createElement("button");
        btn.textContent = b.txt;
        btn.className = b.cls + " btn-sm mr-1";
        btn.onclick = e => b.fn(e.target);
        return btn;
    });

    // Add buttons to a button group container
    const grp = document.createElement("div");
    grp.className = "mt-2";
    buttons.forEach(b => grp.appendChild(b));

    // Assemble all elements and append to the card
    body.append(txt, grp, time, ...spans);
    card.appendChild(body);

    // Add the task card to the DOM
    document.getElementById("taskList").appendChild(card);
}
