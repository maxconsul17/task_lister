function addTask() {
      const desc = document.getElementById("taskInput").value.trim();
      if (!desc) return Swal.fire({icon:'warning', title:'Empty task', text:'Please enter a task.'});
      const color = document.getElementById("colorInput").value.trim() || "#007bff";

      const card = document.createElement("div");
      card.className = "card mb-3 task-card";
      card.style.borderLeftColor = color;
      card.dataset.desc = desc;
      card.dataset.status = "Not Started";
      card.style.backgroundColor = "#fff";

      const body = document.createElement("div"); body.className = "card-body";
      const txt = document.createElement("p");
      txt.className = "card-text"; txt.textContent = desc;
      const time = document.createElement("span");
      time.className = "time"; time.textContent = "0s";
      const spans = ["Start Time: -","Stop Time: -","Total Duration: -","Interruptions: None"].map(t=>{
        const d=document.createElement("div");
        d.className="timestamps"; d.textContent=t; return d;
      });

      const buttons = [
        {txt:"Start",cls:"btn btn-success",fn:startTimer},
        {txt:"Stop",cls:"btn btn-secondary",fn:stopTimer},
        {txt:"Interrupt",cls:"btn btn-warning text-white",fn:interruptTask},
        {txt:"Remove",cls:"btn btn-danger",fn:removeTask}
      ].map(b=>{
        const btn=document.createElement("button");
        btn.textContent=b.txt; btn.className=b.cls+" btn-sm mr-1";
        btn.onclick = e=>b.fn(e.target); return btn;
      });

      const grp = document.createElement("div"); grp.className="mt-2";
      buttons.forEach(b=>grp.appendChild(b));

      body.append(txt, grp, time, ...spans);
      card.appendChild(body);
      document.getElementById("taskList").appendChild(card);

      Swal.fire({icon:'success', title:'Task added!', timer:1200, showConfirmButton:false});
      document.getElementById("taskInput").value = "";
      document.getElementById("colorInput").value = "";

      saveAll();
    }

    function findCard(btn) {
      let el = btn.parentElement;
      while(el && !el.classList.contains("task-card")) el=el.parentElement;
      return el;
    }

    function startTimer(btn) {
      const card = findCard(btn);
      if (timers.has(card)) return;
      const time = card.querySelector(".time");
      const startTime = new Date();
      card.querySelectorAll(".timestamps")[0].textContent = `Start Time: ${formatTime(startTime)}`;
      let secs = parseInt(time.textContent)||0;
      const iv = setInterval(() => {
        time.textContent = (++secs)+"s";
      }, 1000);
      timers.set(card,{iv,start:startTime});
      card.dataset.status = "Running";
      saveAll();
    }

    function stopTimer(btn) {
      const card = findCard(btn);
      const rec = timers.get(card);
      if (!rec) return;
      clearInterval(rec.iv);
      timers.delete(card);
      const stop = new Date();
      card.querySelectorAll(".timestamps")[1].textContent = `Stop Time: ${formatTime(stop)}`;
      const elapsed = Math.floor((stop - rec.start)/1000);
      card.querySelectorAll(".timestamps")[2].textContent = `Total Duration: ${elapsed}s`;
      card.querySelector(".time").textContent = `${elapsed}s`;
      card.dataset.status = "Completed";
      saveAll();
    }

    function interruptTask(btn) {
      const card = findCard(btn);
      const r = prompt("Reason:");
      if (!r) return;
      const now = new Date();
      const sp = card.querySelectorAll(".timestamps")[3];
      const existing = sp.textContent === "Interruptions: None" ? "" : sp.textContent.replace("Interruptions: ","");
      const updated = existing ? existing+"; "+r+" at "+formatTime(now) : r+" at "+formatTime(now);
      sp.textContent = "Interruptions: "+updated;
      saveAll();
    }

    function removeTask(btn) {
      const card = findCard(btn);
      if (timers.has(card)) clearInterval(timers.get(card).iv);
      card.remove();
      saveAll();
    }

    async function generatePDF() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const header = [["#", "Description", "Start", "Status", "Date"]];
      const body = [];

      document.querySelectorAll(".task-card").forEach((card,i) => {
        const cells = [];
        cells.push((i+1).toString());
        cells.push(card.dataset.desc);
        cells.push(card.querySelectorAll(".timestamps")[0].textContent.replace("Start Time: ",""));
        cells.push(card.dataset.status);
        cells.push(formatDate(new Date()));
        body.push(cells);
      });

      doc.setFontSize(16);
      doc.text("Task Report",14,20);
      doc.autoTable({ startY:30, head:header, body, theme:'striped' });
      doc.save("Task_Report.pdf");
    }