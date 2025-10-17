document.addEventListener("DOMContentLoaded", () => {
    const studentBtn = document.getElementById('studentProfileBtn');
    const studentPanel = document.getElementById('studentPanel'); // wrap student info here
    const studentBtnName = document.getElementById('studentBtnName');

// Fetch student info
fetch('../php/get_student_info.php')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const fullname = `${data.firstname} ${data.lastname}`;
            const email = data.email;

            const studentNameEl = document.getElementById('studentName');
            const studentEmailEl = document.getElementById('studentEmail');

            if (studentNameEl) studentNameEl.textContent = fullname;
            if (studentEmailEl) studentEmailEl.textContent = email;
            if (studentBtnName) studentBtnName.textContent = fullname;
        }
    })
    .catch(err => console.error("Error fetching student info:", err));


  

    // Toggle student panel
    studentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        studentPanel.classList.toggle('hidden');
    });

    // Close panel if clicked outside
    document.addEventListener('click', (e) => {
        if (!studentPanel.contains(e.target) && !studentBtn.contains(e.target)) {
            studentPanel.classList.add('hidden');
        }
    });

    // --- Change Password Logic ---
    const changePasswordLink = document.getElementById('changePasswordLink');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closeChangePassword = document.getElementById('closeChangePassword');
    const closeModalX = document.getElementById('closeModalX');
    const changePasswordForm = document.getElementById('changePasswordForm');

    // Open modal
    changePasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        changePasswordModal.classList.remove('hidden');
        changePasswordModal.classList.add('flex');
    });

    // Close modal
    const closeModal = () => {
        changePasswordModal.classList.add('hidden');
        changePasswordModal.classList.remove('flex');
    };
    closeChangePassword.addEventListener('click', closeModal);
    closeModalX.addEventListener('click', closeModal);

    // Submit form
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(changePasswordForm);
        const currentPassword = formData.get('current_password');
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');

        if (newPassword !== confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        try {
            const res = await fetch('../php/change_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
            });

            const data = await res.json();

            if (data.success) {
                alert("Password changed successfully!");
                changePasswordForm.reset();
                closeModal();
            } else {
                alert("Error: " + (data.message || "Unknown error"));
            }

        } catch (err) {
            console.error(err);
            alert("Failed to change password.");
        }
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const panes = document.querySelectorAll(".content-pane");
    const title = document.getElementById("page-title");
    const studentId = localStorage.getItem("loggedStudentId");
    const logoutBtn = document.querySelector('.logout-btn');

    // --- Functions ---
    const showPane = (paneId) => {
        panes.forEach(pane => pane.classList.add("hidden"));
        const targetPane = document.getElementById(paneId);
        if (targetPane) targetPane.classList.remove("hidden");
    };

    const updateTitle = (paneId, navItem) => {
        title.textContent = paneId === "home-pane" ? "" : (navItem.dataset.title || navItem.textContent.trim());
    };

    const loadContentIfNeeded = (paneId) => {
        if (paneId === "my-schedule-pane" && studentId) loadMySchedule(studentId);
        if (paneId === "my-grades-pane" && studentId) loadGrades(studentId);
    };

    const activateNav = (navItem) => {
        navItems.forEach(nav => nav.classList.remove("active"));
        navItem.classList.add("active");
    };

    // --- Nav click handler ---
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const paneId = item.dataset.pane;
            activateNav(item);
            showPane(paneId);
            updateTitle(paneId, item);
            loadContentIfNeeded(paneId);
        });
    });

    // --- Logout handler ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.location.href = 'admin-login.html';
        });
    }

    // --- Initial page load ---
    const initialActiveNav = document.querySelector('.nav-item.active') || document.querySelector('[data-pane="my-grades-pane"]');
    if (initialActiveNav) {
        const paneId = initialActiveNav.dataset.pane;
        activateNav(initialActiveNav);
        showPane(paneId);
        updateTitle(paneId, initialActiveNav);
        loadContentIfNeeded(paneId);
    }
});

//schedule
document.addEventListener("DOMContentLoaded", () => {
    const scheduleTableBody = document.querySelector("#scheduleTableBody");
    const scheduleTitle = document.querySelector("#scheduleTitle");
    const viewFullScheduleBtn = document.querySelector("#viewFullScheduleBtn");

    if (!scheduleTableBody || !scheduleTitle || !viewFullScheduleBtn) return;

    async function loadSchedules() {
        try {
            const res = await fetch("../php/get_my_schedule.php", { credentials: "include" });
            const data = await res.json();

            if (!data || data.status !== "success" || !Array.isArray(data.schedules)) {
                scheduleTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500 py-4">No schedule found.</td></tr>`;
                return;
            }

            // Get today's day name
            const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

            // Filter today's schedule
            const todaysSchedules = data.schedules.filter(s => s.day_of_week === today);

            // Populate today's schedule
            if (todaysSchedules.length === 0) {
                scheduleTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500 py-4">No schedule for today</td></tr>`;
            } else {
                scheduleTableBody.innerHTML = todaysSchedules.map(s => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${s.subject_name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${s.time_start} - ${s.time_end}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${s.teacher_name}</td>
                    </tr>
                `).join("");
            }

            // Full schedule modal
            viewFullScheduleBtn.addEventListener("click", () => {
                showFullScheduleModal(data.schedules);
            });

        } catch (err) {
            console.error("Failed to load schedule:", err);
            scheduleTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-red-500 py-4">Error loading schedule.</td></tr>`;
        }
    }

    function showFullScheduleModal(schedules) {
        // Create modal
        const modalOverlay = document.createElement("div");
        modalOverlay.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

        const modalBox = document.createElement("div");
        modalBox.className = "bg-white p-6 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto";

        modalBox.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-semibold text-gray-800">Full Schedule</h3>
                <button id="closeModal" class="text-red-600 font-bold text-xl">&times;</button>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-pink-100">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Time</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monday</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuesday</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wednesday</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thursday</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Friday</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-pink-200" id="fullScheduleBody">
                    </tbody>
                </table>
            </div>
        `;
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        // Close button
        modalBox.querySelector("#closeModal").addEventListener("click", () => {
            document.body.removeChild(modalOverlay);
        });

        // Prepare table data
        const fullBody = modalBox.querySelector("#fullScheduleBody");
        const daysOfWeek = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
        const timeSlots = {};

        schedules.forEach(s => {
            const key = `${s.time_start}-${s.time_end}`;
            if (!timeSlots[key]) timeSlots[key] = {};
            timeSlots[key][s.day_of_week] = `${s.subject_name}<br><span class="text-gray-500 text-xs">(${s.teacher_name})</span>`;
        });

        const sortedTimes = Object.keys(timeSlots).sort((a,b)=>{
            const [h1,m1] = a.split("-")[0].split(":").map(Number);
            const [h2,m2] = b.split("-")[0].split(":").map(Number);
            return h1*60+m1 - (h2*60+m2);
        });

        fullBody.innerHTML = sortedTimes.map(time => {
            const row = timeSlots[time];
            return `<tr>
                <td class="px-6 py-4 whitespace-normal text-sm text-gray-900">${time}</td>
                ${daysOfWeek.map(day => `<td class="px-6 py-4 whitespace-normal text-sm text-gray-900">${row[day] || ""}</td>`).join("")}
            </tr>`;
        }).join("");
    }

    loadSchedules();
});

//grades
function loadGrades(studentId) {
    const jhsPane = document.getElementById("jhs-grades-pane");
    const shsPane = document.getElementById("shs-grades-pane");
    const jhsTableBody = document.getElementById("jhs-grades-table-body");
    const shsTableBody = document.getElementById("shs-grades-table-body");

    // Hide both panes initially
    jhsPane.classList.add("hidden");
    shsPane.classList.add("hidden");
    jhsTableBody.innerHTML = "";
    shsTableBody.innerHTML = "";

    fetch(`../php/get_my_grades.php?student_id=${encodeURIComponent(studentId)}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            if (data.error || !Array.isArray(data.grades) || data.grades.length === 0) {
                // Show message in both panes
                jhsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-500 py-4">${data.error || "No grades found."}</td></tr>`;
                shsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 py-4">${data.error || "No grades found."}</td></tr>`;
                return;
            }

            const level = data.level || "JHS";

            if (level === "SHS") {
                // Populate SHS table
                data.grades.forEach(row => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.subject_name || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.q1_grade ?? '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.q2_grade ?? '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.final_grade ?? '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.encoded_by ?? '-'}</td>
                    `;
                    shsTableBody.appendChild(tr);
                });
                shsPane.classList.remove("hidden");
            } else {
                // Populate JHS table
                data.grades.forEach(row => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.subject_name || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.q1 ?? '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.q2 ?? '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.q3 ?? '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.q4 ?? '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.average ?? '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.teacher_name ?? '-'}</td>
                    `;
                    jhsTableBody.appendChild(tr);
                });
                jhsPane.classList.remove("hidden");
            }
        })
        .catch(err => {
            console.error("Error fetching grades:", err);
            jhsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-500 py-4">⚠️ Something went wrong while fetching grades.</td></tr>`;
            shsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 py-4">⚠️ Something went wrong while fetching grades.</td></tr>`;
        });
}



//banner
document.addEventListener("DOMContentLoaded", () => {
    const homePane = document.getElementById("home-pane");
    const slideshowImage = document.getElementById("slideshowImage");
    const prevBtn = document.getElementById("prevSlide");
    const nextBtn = document.getElementById("nextSlide");
    let currentIndex = 0;
    let images = [];

    async function loadBanners() {
        try {
            const res = await fetch("../php/get-banners.php");
            const data = await res.json();

            if (!data.success || data.data.length === 0) {
                slideshowImage.style.display = "none";
                homePane.innerHTML = `<p class="text-gray-500 text-center">No banners available.</p>`;
                return;
            }

            images = data.data.map(b => "../" + b.image_path.replace(/\\/g, "/"));
            slideshowImage.src = images[0];
            slideshowImage.style.display = "block";
        } catch (err) {
            console.error("Error loading banners:", err);
            homePane.innerHTML = `<p class="text-red-500 text-center">Failed to load banners.</p>`;
        }
    }

    function showImage(index) {
        slideshowImage.src = images[index];
    }

    prevBtn.addEventListener("click", () => {
        if (!images.length) return;
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
    });

    nextBtn.addEventListener("click", () => {
        if (!images.length) return;
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
    });

    setInterval(() => {
        if (images.length > 1) {
            currentIndex = (currentIndex + 1) % images.length;
            showImage(currentIndex);
        }
    }, 4000);

    loadBanners();
});

  // --- Calendar Logic ---
  document.addEventListener("DOMContentLoaded", () => {
    const studentCalendarBtn = document.getElementById("studentCalendarBtn");
    const miniCalendar = document.getElementById("studentMiniCalendar");
    const monthYear = document.getElementById("studentMonthYear");
    const calendarGrid = document.getElementById("studentCalendarGrid");
    const prevMonthBtn = document.getElementById("studentPrevMonth");
    const nextMonthBtn = document.getElementById("studentNextMonth");

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let events = [];
    const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    // Toggle calendar
    studentCalendarBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        miniCalendar.classList.toggle("hidden");
        if (!miniCalendar.classList.contains("hidden")) {
            await renderCalendar(currentMonth, currentYear);
        }
    });

    miniCalendar.addEventListener("click", e => e.stopPropagation());

    async function fetchEvents() {
        try {
            const res = await fetch("../php/get_events.php?t=" + new Date().getTime());
            events = await res.json();
        } catch (err) {
            console.error("Error fetching events:", err);
            events = [];
        }
    }

    async function renderCalendar(month, year) {
        await fetchEvents();
        calendarGrid.innerHTML = "";
        monthYear.textContent = new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });

        dayNames.forEach(day => {
            const header = document.createElement("div");
            header.textContent = day;
            header.className = "font-semibold text-gray-700";
            calendarGrid.appendChild(header);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) calendarGrid.appendChild(document.createElement("div"));

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement("div");
            const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            cell.textContent = day;
            cell.className = "p-2 border rounded cursor-default flex items-center justify-center";

            if (day === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
                cell.classList.add("bg-green-300");
            }

            events.forEach(ev => {
                if (dateStr >= ev.start_date && dateStr <= ev.end_date) {
                    if (!cell.classList.contains("bg-green-300")) cell.classList.add("bg-purple-300");
                    cell.title = cell.title ? cell.title + ", " + ev.title : ev.title;
                }
            });

            calendarGrid.appendChild(cell);
        }
    }

    prevMonthBtn.addEventListener("click", async () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        await renderCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener("click", async () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        await renderCalendar(currentMonth, currentYear);
    });

    // Close calendar if clicked outside
    document.addEventListener("click", (e) => {
        if (!miniCalendar.contains(e.target) && e.target !== studentCalendarBtn) {
            miniCalendar.classList.add("hidden");
        }
    });
});
