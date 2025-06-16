// List of predefined contact names for autocomplete
const contactSuggestions = [
    "Leandrei", "Joshua", "Christian", "Nicole", "JP", "Riel", "Franco",
    "Daren", "Cyrus", "Jayson", "Charles", "Mam Maricris", "Clodin",
    "Nicollet", "Jeanette", "Medwin", "Cath", "Ms. Hazel",
    "Ms. Lara", "Sir James", "Sir Jose"
];

// Grab the contact input field
const contactInput = document.getElementById("contactInput");

// Autocomplete suggestion handler
contactInput.addEventListener("input", function () {
    closeSuggestions();
    const val = this.value.toLowerCase();
    if (!val) return;

    const list = document.createElement("div");
    list.setAttribute("id", "autocomplete-list");
    list.setAttribute("class", "list-group position-absolute w-100");
    this.parentNode.appendChild(list);

    contactSuggestions.forEach(item => {
        if (item.toLowerCase().includes(val)) {
            const option = document.createElement("div");
            option.innerHTML = item;
            option.className = "list-group-item list-group-item-action";
            option.onclick = () => {
                contactInput.value = item;
                closeSuggestions();
            };
            list.appendChild(option);
        }
    });
});

// Close autocomplete on document click if clicking outside input
document.addEventListener("click", function (e) {
    if (e.target !== contactInput) closeSuggestions();
});

// Remove autocomplete suggestions list
function closeSuggestions() {
    const el = document.getElementById("autocomplete-list");
    if (el) el.remove();
}

// Adds a new task card to the list
function addTask() {
    const desc = document.getElementById("taskInput").value.trim();
    const contact = document.getElementById("contactInput").value.trim();
    const color = document.getElementById("colorInput").value.trim() || "#007bff";

    if (!desc) {
        return Swal.fire({
            icon: 'warning',
            title: 'Empty task',
            text: 'Please enter a task description.'
        });
    }

    const card = document.createElement("div");
    card.className = "card mb-3 task-card";
    card.style.borderLeftColor = color;
    card.dataset.desc = desc;
    card.dataset.status = "Not Started";
    card.dataset.contact = contact;
    card.style.backgroundColor = "#fff";

    const body = document.createElement("div");
    body.className = "card-body";

    const txt = document.createElement("p");
    txt.className = "card-text";
    txt.textContent = desc;

    const contactInfo = document.createElement("p");
    contactInfo.className = "card-subtitle mb-2 text-muted";
    contactInfo.textContent = `Contact: ${contact || "N/A"}`;

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = "0s";

    // Create timestamp placeholders
    const spans = [
        "Start Time: -",
        "Stop Time: -",
        "Total Duration: -",
        "Interruptions: None"
    ].map(t => {
        const d = document.createElement("div");
        d.className = "timestamps";
        d.textContent = t;
        return d;
    });

    // Action buttons
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

    const grp = document.createElement("div");
    grp.className = "mt-2";
    buttons.forEach(b => grp.appendChild(b));

    body.append(txt, contactInfo, grp, time, ...spans);
    card.appendChild(body);
    document.getElementById("taskList").appendChild(card);

    Swal.fire({
        icon: 'success',
        title: 'Task added!',
        timer: 1200,
        showConfirmButton: false
    });

    // Reset input fields
    document.getElementById("taskInput").value = "";
    document.getElementById("contactInput").value = "";
    document.getElementById("colorInput").value = "";

    saveAll();
}

// Finds the task card element for a given button
function findCard(btn) {
    let el = btn.parentElement;
    while (el && !el.classList.contains("task-card")) el = el.parentElement;
    return el;
}

// Starts the timer for a task
function startTimer(btn) {
    const card = findCard(btn);
    if (timers.has(card)) return;

    const time = card.querySelector(".time");
    const startTime = new Date();
    card.querySelectorAll(".timestamps")[0].textContent = `Start Time: ${formatTime(startTime)}`;
    let secs = parseInt(time.textContent) || 0;

    const iv = setInterval(() => {
        time.textContent = (++secs) + "s";
    }, 1000);

    timers.set(card, { iv, start: startTime });
    card.dataset.status = "Running";
    saveAll();
}

// Stops the timer and updates timestamps
function stopTimer(btn) {
    const card = findCard(btn);
    const rec = timers.get(card);
    if (!rec) return;

    clearInterval(rec.iv);
    timers.delete(card);

    const stop = new Date();
    card.querySelectorAll(".timestamps")[1].textContent = `Stop Time: ${formatTime(stop)}`;
    const elapsed = Math.floor((stop - rec.start) / 1000);

    const formattedStart = formatTime(rec.start);
    const formattedStop = formatTime(stop);

    card.querySelectorAll(".timestamps")[2].textContent = `Total Duration: ${formattedStart} – ${formattedStop}`;
    card.querySelector(".time").textContent = `${formattedStart} – ${formattedStop}`;
    card.dataset.status = "Completed";
    saveAll();
}

// Logs an interruption entry with start/end time and reason
function interruptTask(btn) {
    const card = findCard(btn);

    Swal.fire({
        title: 'Enter interruption reason',
        input: 'text',
        inputLabel: 'Reason',
        inputPlaceholder: 'e.g. Break, Meeting',
        showCancelButton: true
    }).then(res1 => {
        if (!res1.isConfirmed || !res1.value.trim()) return;
        const reason = res1.value.trim();

        const now = new Date();
        const defaultStart = formatTime(now);

        Swal.fire({
            title: 'Interruption start time?',
            input: 'time',
            inputLabel: 'Start Time',
            inputValue: now.toTimeString().slice(0, 5),
            showCancelButton: true
        }).then(res2 => {
            if (!res2.isConfirmed || !res2.value) return;

            const startInput = res2.value;

            Swal.fire({
                title: 'Interruption end time?',
                input: 'time',
                inputLabel: 'End Time',
                showCancelButton: true
            }).then(res3 => {
                if (!res3.isConfirmed || !res3.value) return;

                const endInput = res3.value;
                const today = new Date().toDateString();
                const startTime = new Date(`${today} ${startInput}`);
                const endTime = new Date(`${today} ${endInput}`);

                const diffMs = endTime - startTime;
                if (diffMs <= 0) {
                    return Swal.fire({
                        icon: 'error',
                        title: 'Invalid time range',
                        text: 'End time must be after start time.'
                    });
                }

                const mins = Math.floor(diffMs / 60000);
                const rendered = mins === 0 ? "<1 min" : `${mins} min${mins > 1 ? 's' : ''}`;

                const startFmt = formatTime(startTime);
                const endFmt = formatTime(endTime);

                const sp = card.querySelectorAll(".timestamps")[3];
                if (sp.textContent === "Interruptions: None") {
                    sp.textContent = "Interruptions:\n";
                }

                const entry = `- ${startFmt} – ${endFmt} (${rendered}): ${reason}`;
                sp.textContent += entry + "\n";

                saveAll();
            });
        });
    });
}

// Removes a task from the DOM and clears its timer if running
function removeTask(btn) {
    const card = findCard(btn);
    if (timers.has(card)) clearInterval(timers.get(card).iv);
    card.remove();
    saveAll();
}

// Generates a PDF report of the current task list
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const header = [["#", "Description", "Start", "Status", "Date"]];
    const body = [];

    document.querySelectorAll(".task-card").forEach((card, i) => {
        const cells = [];
        cells.push((i + 1).toString());
        cells.push(card.dataset.desc);
        cells.push(card.querySelectorAll(".timestamps")[0].textContent.replace("Start Time: ", ""));
        cells.push(card.dataset.status);
        cells.push(formatDate(new Date()));
        body.push(cells);
    });

    doc.setFontSize(16);
    doc.text("Task Report", 14, 20);
    doc.autoTable({ startY: 30, head: header, body, theme: 'striped' });
    doc.save("Task_Report.pdf");
}
