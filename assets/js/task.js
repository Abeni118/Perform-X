document.addEventListener("DOMContentLoaded", () => {
  const S = window.PerformXShared;
  const M = window.PerformXModal;
  const apiUrl = window.apiUrl;
  if (!S || !M || !apiUrl) return;

  const tableBody = S.qs(".task-table tbody");
  const tableHead = S.qs(".task-table thead");
  const searchInput = S.qs(".topbar .search-bar input");
  const addBtn = S.qs("#btnAddTask");
  const filterBtn = S.qs("#btnTaskFilterCategory");
  const assignNowBtn = S.qs("#btnAssignNow");
  const breakdownLink = S.qs("#linkTaskBreakdown");

  const prevBtn = document.getElementById("prev-day-btn");
  const nextBtn = document.getElementById("next-day-btn");
  const currentDayEl = document.getElementById("current-day");

  let currentDate = new Date();
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  
  const getLocalDateStr = (d) => {
    const tzoffset = d.getTimezoneOffset() * 60000;
    return new Date(d - tzoffset).toISOString().split("T")[0];
  };

  if (!tableBody || !tableHead) return;

  let tasks = [];
  let query = "";

  const fetchTasks = async () => {
    try {
      const response = await fetch(apiUrl('tasks/get_tasks.php'), { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to load tasks");
      const result = await response.json();
      if (result.status === 'success') {
        tasks = result.data || [];
        updateUI();
      }
    } catch (error) {
      console.error(error);
      S.toast("Error loading tasks", "error");
    }
  };

  const updateUI = () => {
    if (currentDayEl) {
      currentDayEl.textContent = currentDate.toLocaleDateString(undefined, dateOptions);
    }
    if(tableBody) tableBody.style.opacity = '0.4';
    setTimeout(() => {
      render();
      if(tableBody) {
        tableBody.style.transition = 'opacity 0.2s';
        tableBody.style.opacity = '1';
      }
    }, 150);
  };

  prevBtn?.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateUI();
  });

  nextBtn?.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateUI();
  });

  const statusClass = (status) => {
    if (status === "Completed") return "status-completed";
    if (status === "In Progress") return "status-inprogress";
    if (status === "Delayed") return "status-delayed";
    return "status-pending";
  };

  const statusIcon = (status) => {
    if (status === "Completed") return "bx-check-circle";
    if (status === "In Progress") return "bx-play-circle";
    if (status === "Delayed") return "bx-error-circle";
    return "bx-time-five";
  };

  const priorityClass = (priority) => {
    if (/high/i.test(priority)) return "priority-high";
    if (/low/i.test(priority)) return "priority-low";
    return "priority-medium";
  };

  const filteredTasks = () => {
    const selectedDate = getLocalDateStr(currentDate);
    return tasks.filter((t) =>
      (t.dueDate === selectedDate || t.dueDate === currentDate.toISOString().split("T")[0]) &&
      `${t.title} ${t.category} ${t.id} ${t.status}`.toLowerCase().includes(query.toLowerCase())
    );
  };

  const updateSummary = (dayTasks) => {
    const done = dayTasks.filter((t) => t.status === "Completed").length;
    const rate = dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0;
    const value = S.qs(".progress-value");
    const fill = S.qs(".progress-fill");
    
    const cardDesc = S.qs(".summary-card.purple-deep .card-desc");
    const pageText = S.qs(".pagination-bar div:first-child");

    if (value) value.textContent = `${rate}%`;
    if (fill) fill.style.width = `${rate}%`;
    
    if (cardDesc) {
      cardDesc.textContent = dayTasks.length 
        ? `You have completed ${done} out of ${dayTasks.length} tasks for this day.` 
        : `No tasks scheduled for this day.`;
    }
    
    if (pageText) {
      pageText.textContent = `Showing ${dayTasks.length} task${dayTasks.length !== 1 ? 's' : ''}`;
    }
  };

  const to12Hour = (timeStr) => {
    if (!timeStr) return "09:00 AM";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
    let [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const to24Hour = (timeStr) => {
    if (!timeStr) return "09:00";
    if (!timeStr.includes("AM") && !timeStr.includes("PM")) return timeStr;
    let [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    if (hours === "12") hours = "00";
    if (modifier === "PM") hours = (parseInt(hours, 10) + 12).toString();
    return `${hours.padStart(2, "0")}:${minutes}`;
  };

  const render = () => {
    const fTasks = filteredTasks();
    const rows = fTasks
      .map(
        (t) => `
      <tr data-id="${t.id}">
        <td class="task-title-cell"><div class="t-name">${t.title}</div><div class="t-id">ID: ${t.id}</div></td>
        <td><span class="category-badge">${t.category}</span></td>
        <td><span class="priority-pill ${priorityClass(t.priority)}">${t.priority}</span></td>
        <td><span class="status-badge ${statusClass(t.status)}"><i class='bx ${statusIcon(t.status)}'></i> ${t.status}</span></td>
        <td><div class="time-window"><span>${to12Hour(t.start)}</span><span style="display:flex;align-items:center;"><span class="dot"></span> ${to12Hour(t.end)}</span></div></td>
        <td>
          <div class="action-btns">
            <button data-action="edit" aria-label="Edit task"><i class='bx bx-pencil'></i></button>
            <button data-action="complete" aria-label="Complete task"><i class='bx bx-check-circle'></i></button>
            <button data-action="delete" aria-label="Delete task"><i class='bx bx-trash'></i></button>
          </div>
        </td>
      </tr>`
      )
      .join("");
    tableBody.innerHTML = rows || `<tr><td colspan="6" style="padding:4rem 1rem; text-align:center; color:#64748B;">No tasks for this day</td></tr>`;
    updateSummary(fTasks);
  };

  const openTaskModal = (defaults = {}) => {
    return M.openForm({
      title: defaults.id ? "Edit Task" : "Add Task",
      submitText: defaults.id ? "Update Task" : "Add Task",
      fields: [
        { name: "title", label: "Task Name", type: "text", value: defaults.title || "" },
        { name: "description", label: "Description", type: "textarea", value: defaults.description || "" },
        { name: "dueDate", label: "Due Date", type: "date", value: defaults.dueDate || getLocalDateStr(new Date()) },
        { name: "start", label: "Start Time", type: "time", value: to24Hour(defaults.start) || "09:00" },
        { name: "end", label: "End Time", type: "time", value: to24Hour(defaults.end) || "10:00" },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          value: defaults.priority || "Medium",
          options: [
            { value: "Low", label: "Low" },
            { value: "Medium", label: "Medium" },
            { value: "High", label: "High" }
          ]
        },
        { name: "category", label: "Category", type: "text", value: defaults.category || "General" }
      ],
      validate: (data) => {
        if (!String(data.title || "").trim()) return "Task name is required.";
        if (!String(data.category || "").trim()) return "Category is required.";
        if (!String(data.dueDate || "").trim()) return "Due date is required.";
        return true;
      }
    });
  };

  const addTask = async () => {
    const values = await openTaskModal();
    if (!values) return;
    try {
      const response = await fetch(apiUrl('tasks/create_task.php'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title.trim(),
          description: values.description.trim(),
          dueDate: values.dueDate,
          category: values.category.trim(),
          priority: values.priority,
          status: "Pending",
          start: to24Hour(values.start),
          end: to24Hour(values.end)
        })
      });
      const result = await response.json();
      if (response.ok && result.data) {
        tasks.push(result.data);
        render();
        S.toast("Task added.", "success");
      } else {
        S.toast(result.message || "Failed to add task", "error");
      }
    } catch (err) {
      console.error(err);
      S.toast("Error adding task", "error");
    }
  };

  addBtn?.addEventListener("click", addTask);
  assignNowBtn?.addEventListener("click", addTask);
  filterBtn?.addEventListener("click", async () => {
    const data = await M.openForm({
      title: "Filter Tasks",
      submitText: "Apply",
      fields: [{ name: "keyword", label: "Keyword", type: "text", value: query }]
    });
    if (!data) return;
    query = data.keyword || "";
    render();
  });
  breakdownLink?.addEventListener("click", (e) => {
    e.preventDefault();
    S.toast("Showing focus-time breakdown.");
  });

  searchInput?.addEventListener("input", (e) => {
    query = e.target.value || "";
    render();
  });

  tableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = btn.closest("tr[data-id]");
    if (!row) return;
    const id = row.dataset.id;
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return;
    const task = tasks[taskIndex];
    const action = btn.dataset.action;
    
    if (action === "delete") {
      const ok = await M.confirm({ title: "Delete Task", message: `Delete task "${task.title}"?`, confirmText: "Delete" });
      if (!ok) return;
      try {
        const response = await fetch(apiUrl('tasks/delete_task.php'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: task.id })
        });
        if (response.ok) {
          tasks.splice(taskIndex, 1);
          render();
          S.toast("Task deleted.", "success");
        } else {
          S.toast("Failed to delete task.", "error");
        }
      } catch (err) {
        S.toast("Error deleting task.", "error");
      }
      return;
    }
    
    if (action === "complete") {
      try {
        const response = await fetch(apiUrl('tasks/update_task.php'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             ...task,
             status: "Completed"
          })
        });
        if (response.ok) {
           task.status = "Completed";
           render();
           S.toast("Task marked completed.", "success");
        }
      } catch (err) {
        S.toast("Error completing task.", "error");
      }
      return;
    }
    
    // Edit action
    const values = await openTaskModal(task);
    if (!values) return;
    try {
      const payload = {
          id: task.id,
          title: values.title.trim(),
          description: values.description.trim(),
          dueDate: values.dueDate,
          priority: values.priority,
          category: values.category.trim(),
          start: to24Hour(values.start),
          end: to24Hour(values.end),
          status: task.status
      };
      const response = await fetch(apiUrl('tasks/update_task.php'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
         tasks[taskIndex] = { ...task, ...payload };
         render();
         S.toast("Task updated.", "success");
      } else {
         S.toast("Update failed.", "error");
      }
    } catch(err) {
       S.toast("Error modifying task.", "error");
    }
  });

  fetchTasks();
});

