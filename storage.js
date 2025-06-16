 const STORAGE_KEY = "taskListerSession";
    const timers = new Map();

    window.onload = () => {
      const data = sessionStorage.getItem(STORAGE_KEY);
      const today = new Date().toDateString();
      if (data) {
        const arr = JSON.parse(data);
        if (arr[0]?.savedDate === today) {
          arr.forEach(task => restoreTask(task));
        } else sessionStorage.removeItem(STORAGE_KEY);
      }
    };

    function formatTime(d){return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});}
    function formatDate(d){return d.toLocaleDateString();}

    function saveAll() {
      const arr = Array.from(document.querySelectorAll(".task-card")).map(card => ({
        desc: card.dataset.desc,
        color: card.style.borderLeftColor,
        time: card.querySelector(".time").textContent,
        ts: Array.from(card.querySelectorAll(".timestamps")).map(e=>e.textContent),
        status: card.dataset.status,
        savedDate: new Date().toDateString()
      }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }

    function restoreTask(t) {
      // replicate addTask logic without alerts
      const card = document.createElement("div");
      card.className = "card mb-3 task-card";
      card.style.borderLeftColor = t.color;
      card.style.backgroundColor = "#fff";
      card.dataset.desc = t.desc;
      card.dataset.status = t.status;

      const body = document.createElement("div"); body.className = "card-body";
      const txt = document.createElement("p");
      txt.className = "card-text"; txt.textContent = t.desc;
      const time = document.createElement("span");
      time.className = "time"; time.textContent = t.time;

      const spans = t.ts.map(text => {
        const d = document.createElement("div");
        d.className = "timestamps"; d.textContent = text;
        return d;
      });

      const buttons = [
        {txt:"Start",cls:"btn btn-success",fn:startTimer},
        {txt:"Stop",cls:"btn btn-secondary",fn:stopTimer},
        {txt:"Interrupt",cls:"btn btn-warning text-white",fn:interruptTask},
        {txt:"Remove",cls:"btn btn-danger",fn:removeTask}
      ].map(b=>{
        const btn = document.createElement("button");
        btn.textContent=b.txt; btn.className=b.cls+" btn-sm mr-1";
        btn.onclick = e=>b.fn(e.target); return btn;
      });

      const grp = document.createElement("div"); grp.className="mt-2";
      buttons.forEach(b=>grp.appendChild(b));

      body.append(txt, grp, time, ...spans);
      card.appendChild(body);
      document.getElementById("taskList").appendChild(card);
    }