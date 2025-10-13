document.addEventListener("DOMContentLoaded", () => {
    const teacherBtn = document.getElementById('teacherProfileBtn');
    const teacherPanel = document.getElementById('teacherPanel');
    const teacherBtnName = document.getElementById('teacherBtnName');

    // Fetch teacher info
    fetch('../php/get_user_info.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const fullname = `${data.firstname} ${data.lastname}`;
                teacherBtnName.textContent = fullname;
                document.getElementById('teacherName').textContent = fullname;
                document.getElementById('teacherEmail').textContent = data.email;
            }
        })
        .catch(err => console.error("Error fetching teacher info:", err));

    // Toggle teacher panel
    teacherBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        teacherPanel.classList.toggle('hidden');
    });

    // Close panel if clicked outside
    document.addEventListener('click', (e) => {
        if (!teacherPanel.contains(e.target) && !teacherBtn.contains(e.target)) {
            teacherPanel.classList.add('hidden');
        }
    });
});
//change password
//changepassword
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





function loadPendingApplications() {
    const tbody = document.getElementById('pending-applications-body');

    if (!tbody) return;

    // Always clear out any existing rows (including leftover <th> header rows)
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    // Show loading state
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                Loading pending applications...
            </td>
        </tr>
    `;

    fetch('../php/get_pending_applications.php')
        .then(response => response.json())
        .then(data => {
            tbody.innerHTML = '';

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(applicant => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-strand="${applicant.strand}">${applicant.strand}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-grade-level="${applicant.grade_level}">${applicant.grade_level}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-name="${applicant.name}">${applicant.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-contact="${applicant.cellphone}">${applicant.cellphone}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-email="${applicant.emailaddress}">${applicant.emailaddress}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button onclick="viewApplicationDetails(${applicant.applicant_id})" 
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    View
                </button>
                    </td>
                `;

                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                            No pending applications found.
                        </td>
                    </tr>
                `;
            }
        })
        .catch(() => {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-sm text-red-500">
                        Error loading pending applications.
                    </td>
                </tr>
            `;
        });
}


document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const panes = document.querySelectorAll(".content-pane");
    const title = document.getElementById("page-title");
    const backToPendingBtn = document.getElementById('back-to-pending-btn');

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(nav => nav.classList.remove("active"));
            panes.forEach(pane => pane.classList.add("hidden"));

            item.classList.add("active");
            const targetPane = document.getElementById(item.dataset.pane);
            if (targetPane) targetPane.classList.remove('hidden');
            title.textContent = item.dataset.title || "";


            if (item.dataset.pane === "pending-applications-pane") {
                loadPendingApplications();
            } else if (item.dataset.pane === "enrolled-students-pane") {
                loadEnrolledStudents();
            }
        });
    });

    if (backToPendingBtn) {
        backToPendingBtn.addEventListener('click', () => {
            panes.forEach(pane => pane.classList.add('hidden'));
            document.getElementById('pending-applications-pane').classList.remove('hidden');
            title.textContent = 'Pending Applications';
            navItems.forEach(nav => nav.classList.remove("active"));
            document.querySelector('[data-pane="pending-applications-pane"]').classList.add('active');
            loadPendingApplications();
        });
    }
    // Ensure Home shows no title on first load
    if (document.querySelector(".nav-item.active")?.dataset.pane === "home-pane") {
        title.textContent = "";
    }


    // ---- added logout handler (minimal, redirects to admin-login.html) ----
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            // optional: add a confirmation here if you want
            // if (confirm('Are you sure you want to log out?')) { ... }
            window.location.href = 'admin-login.html';
        });
    }
});

//calendar
document.addEventListener("DOMContentLoaded", () => {
    const calendarBtn = document.getElementById("teacherCalendarBtn");
    const miniCalendar = document.getElementById("miniCalendar");
    const monthYear = document.getElementById("monthYear");
    const calendarGrid = document.getElementById("calendarGrid");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let events = [];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    calendarBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        miniCalendar.classList.toggle("hidden");
        if (!miniCalendar.classList.contains("hidden")) {
            await renderCalendar(currentMonth, currentYear);
        }
    });

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
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

    // Optional: close calendar if clicked outside
    document.addEventListener("click", (e) => {
        if (!miniCalendar.contains(e.target) && e.target !== calendarBtn) {
            miniCalendar.classList.add("hidden");
        }
    });
});


let currentApplicantId = null; // store applicant_id when opening modal

function viewApplicationDetails(applicantId) {
    currentApplicantId = applicantId; // keep track of which applicant is open

    // Reset modal fields to show loading
    document.getElementById("modal-strand").innerText = "Loading...";
    document.getElementById("modal-fullname").innerText = "";
    document.getElementById("modal-gender").innerText = "";
    document.getElementById("modal-birth").innerText = "";
    document.getElementById("modal-address").innerText = "";
    document.getElementById("modal-contact").innerText = "";
    document.getElementById("modal-email").innerText = "";
    document.getElementById("modal-guardian-name").innerText = "";
    document.getElementById("modal-guardian-contact").innerText = "";
    document.getElementById("modal-guardian-email").innerText = "";
    document.getElementById("modal-guardian-relationship").innerText = "";
    document.getElementById("doc-birth").innerHTML = "";
    document.getElementById("doc-138").innerHTML = "";
    document.getElementById("doc-goodmoral").innerHTML = "";
    document.getElementById("doc-137").innerHTML = "";

    // Fetch details from PHP
    fetch(`../php/get_applications_details.php?id=${applicantId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }

            // Applicant info
            document.getElementById("modal-strand").innerText = data.applicant.strand;
            document.getElementById("modal-fullname").innerText =
                `${data.applicant.firstname} ${data.applicant.middlename} ${data.applicant.lastname} ${data.applicant.suffix || ""}`;
            document.getElementById("modal-gender").innerText = data.applicant.gender;
            document.getElementById("modal-birth").innerText = data.applicant.birth_date;
            document.getElementById("modal-address").innerText =
                `${data.applicant.street_house}, ${data.applicant.barangay}, ${data.applicant.municipal_city}, ${data.applicant.province}`;
            document.getElementById("modal-contact").innerText = data.applicant.cellphone;
            document.getElementById("modal-email").innerText = data.applicant.emailaddress;

            // Guardian info
            if (data.guardians && data.guardians.length > 0) {
                const g = data.guardians[0];
                document.getElementById("modal-guardian-name").innerText =
                    `${g.firstname} ${g.middlename} ${g.lastname} ${g.suffix || ""}`;
                document.getElementById("modal-guardian-contact").innerText = g.cellphone;
                document.getElementById("modal-guardian-email").innerText = g.email;
                document.getElementById("modal-guardian-relationship").innerText = g.relationship;
            }

            // Document links
            if (data.documents) {
                document.getElementById("doc-birth").innerHTML =
                    data.documents.birth_certificate
                        ? `<a href="${data.documents.birth_certificate}" target="_blank" class="text-blue-600 underline">View File</a>`
                        : "Not Submitted";

                document.getElementById("doc-138").innerHTML =
                    data.documents.original_form_138
                        ? `<a href="${data.documents.original_form_138}" target="_blank" class="text-blue-600 underline">View File</a>`
                        : "Not Submitted";

                document.getElementById("doc-goodmoral").innerHTML =
                    data.documents.good_moral
                        ? `<a href="${data.documents.good_moral}" target="_blank" class="text-blue-600 underline">View File</a>`
                        : "Not Submitted";

                document.getElementById("doc-137").innerHTML =
                    data.documents.original_form_137
                        ? `<a href="${data.documents.original_form_137}" target="_blank" class="text-blue-600 underline">View File</a>`
                        : "Not Submitted";
            }
        })
        .catch(err => {
            alert("Error loading details: " + err.message);
        });

    // Show modal
    document.getElementById("applicationModal").classList.remove("hidden");
}

function approveApplication() {
    if (!currentApplicantId) {
        alert("No applicant selected.");
        return;
    }

    fetch(`../php/approve_application.php?id=${currentApplicantId}`, {
        method: "POST"
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Applicant approved successfully!");
                closeApplicationModal();
                loadPendingApplications(); // refresh table
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(err => alert("Request failed: " + err.message));
}

function closeApplicationModal() {
    document.getElementById("applicationModal").classList.add("hidden");
}

//grade encode
document.addEventListener("DOMContentLoaded", () => {
    const sectionsContainer = document.getElementById("sections-container");
    const studentsList = document.getElementById("students-list");
    const studentsTitle = document.getElementById("students-title");
    const studentsTableBody = document.getElementById("students-table-body");
    const backBtn = document.getElementById("back-to-sections-btn");
    const attendanceBtn = document.getElementById("attendance-btn");

    // ====== JHS Modal Elements ======
    const jhsModal = document.getElementById("encode-grade-modal");
    const modalStudentName = document.getElementById("modal-student-name");
    const studentIdInput = document.getElementById("student-id");
    const sectionIdInput = document.getElementById("section-id");
    const subjectIdInput = document.getElementById("subject-id");
    const closeJhsBtn = document.getElementById("close-modal");
    const jhsForm = document.getElementById("encode-grade-form");

    // ====== SHS Modal Elements ======
    const shsModal = document.getElementById("encode-shs-grade-modal");
    const shsStudentName = document.getElementById("shs-modal-student-name");
    const shsStudentIdInput = document.getElementById("shs-student-id");
    const shsSectionIdInput = document.getElementById("shs-section-id");
    const shsSubjectIdInput = document.getElementById("shs-subject-id");
    const shsSubjectNameInput = document.getElementById("subject-name");
    const closeShsBtn = document.getElementById("close-shs-modal");
    const shsForm = document.getElementById("encode-shs-grade-form");

    // Assume HTML has sections like <div id="jhs-fields" class="hidden"> for JHS inputs (q1-q4, average)
    // and <div id="shs-fields"> for SHS inputs (q1_grade, q2_grade, final_grade, remarks)
    // If not, add these divs around the respective inputs in your HTML and apply 'hidden' class to one by default.

    // Create attendance modal
    const attendanceModal = document.createElement("div");
    attendanceModal.id = "attendance-modal";
    attendanceModal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden";
    attendanceModal.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg w-11/12 max-w-4xl max-h-[90vh] overflow-hidden">
            <div class="p-4 border-b border-gray-200">
            <h3 id="attendance-modal-title" class="text-lg font-semibold">Attendance</h3>
            </div>
            <div class="p-4 overflow-auto max-h-[60vh]">
            <div id="attendance-table-container"></div>
            </div>
            <div class="p-4 border-t border-gray-200 flex justify-end space-x-2">
            <button id="attendance-submit-btn" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Submit</button>
            <button id="attendance-cancel-btn" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Cancel</button>
            </div>
        </div>
        `;
    document.body.appendChild(attendanceModal);

    let currentSectionId = null;
    let currentSubjectName = null;

    // Load teacher sections
    fetch("../php/teacher_get_sections.php", { credentials: "include" })
        .then(res => res.json())
        .then(sections => {
            sectionsContainer.innerHTML = "";
            if (!Array.isArray(sections) || sections.length === 0) {
                sectionsContainer.innerHTML = '<p class="text-sm text-gray-500">No sections assigned.</p>';
                return;
            }
            sections.forEach(section => {
                const btn = document.createElement("button");
                btn.className = "bg-pink-100 hover:bg-pink-200 text-left px-4 py-2 rounded font-medium transition";
                btn.textContent = `${section.section_name} (${section.subject_name})`;
                btn.addEventListener("click", () => showSectionStudents(section.section_id, section.subject_name, section.subject_id));
                sectionsContainer.appendChild(btn);
            });
        })
        .catch(err => console.error("Error fetching sections:", err));

    function showSectionStudents(sectionId, subjectName, subjectId) {
        currentSectionId = sectionId;
        currentSubjectName = subjectName;

        sectionsContainer.classList.add("hidden");
        backBtn.classList.remove("hidden");
        if (attendanceBtn) attendanceBtn.classList.remove("hidden");

        fetch(`../php/get_section_student.php?section_id=${encodeURIComponent(sectionId)}`, { credentials: "include" })
            .then(res => res.json())
            .then(students => {
                studentsTitle.textContent = `Students in ${subjectName}`;
                studentsTableBody.innerHTML = "";
                if (students.error || students.length === 0) {
                    studentsTableBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">${students.error || "No students found"}</td></tr>`;
                    studentsList.classList.remove("hidden");
                    return;
                }
                students.forEach(st => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                            <td class="px-6 py-4 text-sm text-gray-900">${st.student_name}</td>
                            <td class="px-6 py-4 text-sm text-gray-900">${st.strand}</td>
                            <td class="px-6 py-4 text-sm text-gray-900">
                                <button class="encode-btn px-3 py-1 bg-pink-500 text-white rounded">Encode Grade</button>
                            </td>
                        `;

                    // ✅ Updated line — now includes subjectName
                    tr.querySelector(".encode-btn").addEventListener("click", () =>
                        openModal(st.student_id, st.student_name, sectionId, subjectId, subjectName)
                    );

                    studentsTableBody.appendChild(tr);
                });

                studentsList.classList.remove("hidden");
            })
            .catch(err => console.error("Error fetching students:", err));
    }

    async function showAttendanceModal() {
        if (!currentSectionId) {
            alert("Please select a section first.");
            return;
        }

        document.getElementById("attendance-modal-title").textContent = `Attendance for ${currentSubjectName}`;

        try {
            const [studentsRes, attRes] = await Promise.all([
                fetch(`../php/get_section_student.php?section_id=${encodeURIComponent(currentSectionId)}`, { credentials: "include" }),
                fetch(`../php/get_attendance.php?section_id=${encodeURIComponent(currentSectionId)}`, { credentials: "include" })
            ]);

            const students = await studentsRes.json();
            const savedAttendance = await attRes.json();

            if (students.error || students.length === 0) {
                alert(students.error || "No students found for attendance.");
                return;
            }

            const attendanceMap = {};
            savedAttendance.forEach(a => {
                if (!attendanceMap[a.student_id]) attendanceMap[a.student_id] = {};
                if (a.status === 1) attendanceMap[a.student_id][a.attendance_date] = 1;
                if (a.status === 2) attendanceMap[a.student_id][a.attendance_date] = 2;
            });

            const dates = [];
            const today = new Date();
            for (let i = 0; i < 3; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() + i);
                dates.push(d);
            }

            function formatDate(date) { return date.toISOString().split("T")[0]; }

            let tableHTML = `<table class="min-w-full border-collapse border border-gray-300"><thead class="bg-gray-100"><tr><th class="border border-gray-300 px-4 py-2 text-left">Student</th>`;
            dates.forEach(date => tableHTML += `<th class="border border-gray-300 px-4 py-2">${formatDate(date)}</th>`);
            tableHTML += `</tr></thead><tbody>`;

            students.forEach(student => {
                tableHTML += `<tr data-student-id="${student.student_id}">`;
                tableHTML += `<td class="border border-gray-300 px-4 py-2">${student.student_name}</td>`;
                dates.forEach(date => {
                    let present = attendanceMap[student.student_id]?.[formatDate(date)] === 1;
                    let absent = attendanceMap[student.student_id]?.[formatDate(date)] === 2;
                    let cellContent = present ? "✓" : absent ? "X" : "";
                    let dataChecked = present ? "true" : absent ? "x" : "false";
                    tableHTML += `<td class="border border-gray-300 px-4 py-2 text-center cursor-pointer hover:bg-gray-50 ${cellContent ? (present ? 'bg-green-100' : 'bg-red-100') : ''}" 
                                    data-date="${formatDate(date)}" data-checked="${dataChecked}">
                                    ${cellContent}</td>`;
                });
                tableHTML += `</tr>`;
            });

            tableHTML += `</tbody></table>`;
            document.getElementById("attendance-table-container").innerHTML = tableHTML;
            attendanceModal.classList.remove("hidden");

            document.querySelectorAll("#attendance-table-container td[data-date]").forEach(cell => {
                cell.addEventListener("click", () => {
                    let state = cell.getAttribute("data-checked");
                    if (state === "false") {
                        cell.setAttribute("data-checked", "true");
                        cell.textContent = "✓";
                        cell.classList.remove("bg-red-100");
                        cell.classList.add("bg-green-100");
                    } else if (state === "true") {
                        cell.setAttribute("data-checked", "x");
                        cell.textContent = "X";
                        cell.classList.remove("bg-green-100");
                        cell.classList.add("bg-red-100");
                    } else {
                        cell.setAttribute("data-checked", "false");
                        cell.textContent = "";
                        cell.classList.remove("bg-green-100", "bg-red-100");
                    }
                });
            });

        } catch (err) {
            console.error("Error fetching students or attendance:", err);
            alert("Failed to load students for attendance.");
        }
    }

    document.getElementById("attendance-submit-btn").addEventListener("click", () => {
        const attendanceData = [];
        document.querySelectorAll("#attendance-table-container tbody tr").forEach(tr => {
            const studentId = tr.getAttribute("data-student-id");
            tr.querySelectorAll("td[data-date]").forEach(td => {
                const state = td.getAttribute("data-checked");
                if (state === "false") return;
                let present = state === "true" ? 1 : 2;
                attendanceData.push({
                    student_id: studentId,
                    date: td.getAttribute("data-date"),
                    present: present
                });
            });
        });

        fetch("../php/save_attendance.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ section_id: currentSectionId, attendance: attendanceData }),
            credentials: "include"
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message || "Attendance saved successfully!");
                attendanceModal.classList.add("hidden");
            })
            .catch(err => { console.error("Error saving attendance:", err); alert("Failed to save attendance."); });
    });

    document.getElementById("attendance-cancel-btn").addEventListener("click", () => attendanceModal.classList.add("hidden"));
    attendanceModal.addEventListener("click", e => { if (e.target === attendanceModal) attendanceModal.classList.add("hidden"); });
    if (attendanceBtn) attendanceBtn.addEventListener("click", showAttendanceModal);

    // Grade modal
    function openModal(studentId, studentName, sectionId, subjectId, subjectName) {
        fetch("../php/get_assigned_level.php", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    alert("No assigned level detected. Please log in again.");
                    return;
                }

                const assignedLevel = data.assigned_level;

                // --- Hide both modals ---
                const jhsModal = document.getElementById("encode-grade-modal");
                const shsModal = document.getElementById("encode-shs-grade-modal");
                if (jhsModal) jhsModal.classList.add("hidden");
                if (shsModal) shsModal.classList.add("hidden");

                if (assignedLevel === "Junior High") {
                    // ======== JHS MODAL ========
                    const modalStudentName = document.getElementById("modal-student-name");
                    const studentIdInput = document.getElementById("student-id");
                    const sectionIdInput = document.getElementById("section-id");
                    const subjectIdInput = document.getElementById("subject-id");

                    modalStudentName.textContent = `Encode JHS Grade for ${studentName}`;
                    studentIdInput.value = studentId;
                    sectionIdInput.value = sectionId;
                    subjectIdInput.value = subjectId;

                    const q1 = document.getElementById("q1");
                    const q2 = document.getElementById("q2");
                    const q3 = document.getElementById("q3");
                    const q4 = document.getElementById("q4");
                    const avg = document.getElementById("average");

                    [q1, q2, q3, q4].forEach(i => (i.value = ""));
                    avg.value = "";

                    function computeAverage() {
                        const vals = [q1, q2, q3, q4]
                            .map(i => parseFloat(i.value))
                            .filter(v => !isNaN(v));
                        avg.value = vals.length === 4 ? (vals.reduce((a, b) => a + b, 0) / 4).toFixed(2) : "";
                    }
                    [q1, q2, q3, q4].forEach(i => i.addEventListener("input", computeAverage));

                    fetch(`../php/get_student_grades.php?student_id=${studentId}&section_id=${sectionId}&subject_id=${subjectId}`)
                        .then(res => res.json())
                        .then(data => {
                            if (Array.isArray(data) && data.length > 0) {
                                q1.value = data[0].q1 || "";
                                q2.value = data[0].q2 || "";
                                q3.value = data[0].q3 || "";
                                q4.value = data[0].q4 || "";
                                computeAverage();
                            }
                        });

                    jhsModal.classList.remove("hidden");
                }

                else if (assignedLevel === "Senior High") {
                    // ======== SHS MODAL ========
                    const modalStudentName = document.getElementById("shs-modal-student-name");
                    const studentIdInput = document.getElementById("shs-student-id");
                    const sectionIdInput = document.getElementById("shs-section-id");
                    const subjectIdInput = document.getElementById("shs-subject-id");
                    const subjectNameInput = document.getElementById("subject-name");
                    const closeShsModal = document.getElementById("close-shs-modal");

                    modalStudentName.textContent = `Encode SHS Grade for ${studentName}`;
                    studentIdInput.value = studentId;
                    sectionIdInput.value = sectionId;
                    subjectIdInput.value = subjectId;

                    // ✅ Auto-populate subject name & make readonly
                    subjectNameInput.value = subjectName || "";
                    subjectNameInput.readOnly = true;

                    const q1 = document.getElementById("q1-grade");
                    const q2 = document.getElementById("q2-grade");
                    const finalGrade = document.getElementById("final-grade");
                    const remarks = document.getElementById("remarks");

                    [q1, q2, finalGrade, remarks].forEach(i => (i.value = ""));

                    function computeFinal() {
                        const a = parseFloat(q1.value);
                        const b = parseFloat(q2.value);
                    
                        // Only compute if BOTH grades are numbers
                        if (!isNaN(a) && !isNaN(b)) {
                            const avg = ((a + b) / 2).toFixed(2);
                            finalGrade.value = avg;
                            remarks.value = avg >= 75 ? "Passed" : "Failed";
                        } else {
                            finalGrade.value = ""; // Keep empty if incomplete
                            remarks.value = "";    // Keep empty if incomplete
                        }
                    }
                    
                    q1.addEventListener("input", computeFinal);
                    q2.addEventListener("input", computeFinal);

                    fetch(`../php/get_student_grades.php?student_id=${studentId}&section_id=${sectionId}&subject_id=${subjectId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data) && data.length > 0) {
                            q1.value = data[0].q1_grade || data[0].first_sem_q1 || "";
                            q2.value = data[0].q2_grade || data[0].first_sem_q2 || "";
                    
                            // Only set finalGrade if BOTH q1 and q2 exist
                            if (q1.value !== "" && q2.value !== "") {
                                const avg = ((parseFloat(q1.value) + parseFloat(q2.value)) / 2).toFixed(2);
                                finalGrade.value = avg;
                                remarks.value = avg >= 75 ? "Passed" : "Failed";
                            } else {
                                finalGrade.value = "";
                                remarks.value = "";
                            }
                        }
                    })
                    .catch(err => console.error("Error fetching SHS grades:", err));
                    

                    shsModal.classList.remove("hidden");

                    // ✅ Cancel button now closes modal
                    closeShsModal.addEventListener("click", () => {
                        shsModal.classList.add("hidden");
                    });
                }
            })
            .catch(err => {
                console.error("Error fetching assigned level:", err);
                alert("Failed to open grade modal.");
            });
    }

// Close modal buttons

if (closeJhsBtn) {
    closeJhsBtn.addEventListener("click", () => jhsModal.classList.add("hidden"));
}

if (closeShsBtn) {
    closeShsBtn.addEventListener("click", () => shsModal.classList.add("hidden"));
}


    // === SAVE JHS GRADES ===
    if (jhsForm) {
        jhsForm.addEventListener("submit", e => {
            e.preventDefault();

            const formData = new FormData(jhsForm);
            fetch("../php/save_grades.php", {
                method: "POST",
                body: formData,
                credentials: "include"
            })
                .then(res => res.json())
                .then(data => {
                    alert(data.message || "JHS grade saved successfully!");
                    jhsModal.classList.add("hidden");
                })
                .catch(err => {
                    console.error("Error saving JHS grade:", err);
                    alert("Failed to save JHS grade.");
                });
        });
    }

    // === SAVE SHS GRADES ===
    if (shsForm) {
        shsForm.addEventListener("submit", e => {
            e.preventDefault();

            const formData = new FormData(shsForm);
            fetch("../php/save_grades.php", {
                method: "POST",
                body: formData,
                credentials: "include"
            })  
                .then(res => res.json())
                .then(data => {
                    alert(data.message || "SHS grade saved successfully!");
                    shsModal.classList.add("hidden");
                })
                .catch(err => {
                    console.error("Error saving SHS grade:", err);
                    alert("Failed to save SHS grade.");
                });
        });
    }


    // Go back to sections
    backBtn.addEventListener("click", () => {
        sectionsContainer.classList.remove("hidden");
        studentsList.classList.add("hidden");
        backBtn.classList.add("hidden");
        if (attendanceBtn) attendanceBtn.classList.add("hidden");
    });
});


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


//add student
document.addEventListener("DOMContentLoaded", function () {
    const gradeSelect = document.getElementById("grade");
    const strandSelect = document.getElementById("strand");

    fetch("../php/fetch-grade-strand.php")
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;

            // Populate grades
            gradeSelect.innerHTML = "";
            data.grades.forEach(grade => {
                let opt = document.createElement("option");
                opt.value = grade;
                opt.textContent = "Grade " + grade;
                gradeSelect.appendChild(opt);
            });

            // Populate strands (if available)
            if (data.strands.length > 0) {
                strandSelect.innerHTML = "";
                data.strands.forEach(strand => {
                    let opt = document.createElement("option");
                    opt.value = strand;
                    opt.textContent = strand;
                    strandSelect.appendChild(opt);
                });
                strandSelect.parentElement.style.display = "block";
            } else {
                strandSelect.parentElement.style.display = "none";
            }
        })
        .catch(err => console.error(err));
});

//add student
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("#add-student");
    const submitBtn = form.querySelector("button[type='submit']");

    // ====== FIELD RESTRICTIONS ======
    function allowOnlyDigits(el, maxLength) {
        el.addEventListener("input", function () {
            this.value = this.value.replace(/\D/g, "");
            if (maxLength) this.value = this.value.slice(0, maxLength);
        });
    }

    function allowOnlyLetters(el) {
        el.addEventListener("input", function () {
            this.value = this.value.replace(/[^a-zA-Z\s]/g, "");
        });
    }

    // Apply restrictions
    const digitFields = [
        { id: "lrn", max: 12 },
        { id: "cellphone", max: 11 },
        { id: "gCellphone", max: 11 }
    ];
    digitFields.forEach(f => {
        let el = document.getElementById(f.id);
        if (el) allowOnlyDigits(el, f.max);
    });

    ["firstName", "middleName", "lastName", "suffix", "gFirstName", "gMiddleName", "gLastName", "gSuffix"].forEach(id => {
        let el = document.getElementById(id);
        if (el) allowOnlyLetters(el);
    });

    // ====== SEMESTER TOGGLE FOR SHS ======
    const gradeEl = document.getElementById("grade");
    const semesterContainer = document.getElementById("semester-container");
    const semesterSelect = document.getElementById("semester");

    function toggleSemester() {
        if (!semesterContainer || !semesterSelect || !gradeEl) return;
        const isSHS = gradeEl.value === "11" || gradeEl.value === "12";
        semesterContainer.style.display = isSHS ? "block" : "none";
        // Only clear value if hidden
        if (!isSHS) semesterSelect.value = "";
    }

    // Run on page load
    toggleSemester();

    // Update if grade changes dynamically
    if (gradeEl) {
        gradeEl.addEventListener("change", toggleSemester);
    }

    // ====== SUBMIT HANDLER ======
    submitBtn.addEventListener("click", async function (e) {
        e.preventDefault();

        const formData = new FormData();

        // Clear previous errors
        form.querySelectorAll(".error-message").forEach(el => el.remove());
        form.querySelectorAll(".error").forEach(el => el.classList.remove("error"));

        // Detect if SHS (grade 11 or 12)
        const isSHS = gradeEl && (gradeEl.value === "11" || gradeEl.value === "12");

        // REQUIRED FIELDS
        const requiredFields = [
            "lrn",
            "grade",
            "firstName", "lastName",
            "gender", "birthdate",
            "street", "barangay", "municipality", "province",
            "cellphone", "email",
            "gFirstName", "gLastName",
            "gCellphone", "gRelationship"
        ];

        if (isSHS) {
            requiredFields.push("strand", "semester");
        }

        // Validate only fields that exist
        for (let field of requiredFields) {
            let el = document.getElementById(field);
            if (!el) continue;

            if (el.value.trim() === "") {
                el.classList.add("error");
                let msg = document.createElement("span");
                msg.className = "error-message absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md -top-6 left-0";
                msg.textContent = "⚠️ Required";
                el.parentElement.style.position = "relative";
                el.parentElement.appendChild(msg);
                el.focus();
                return;
            }
        }

        // Extra validations
        const lrnEl = document.getElementById("lrn");
        if (lrnEl && lrnEl.value.length !== 12) {
            alert("⚠️ LRN must be exactly 12 digits");
            return;
        }

        const cellphoneEl = document.getElementById("cellphone");
        if (cellphoneEl && cellphoneEl.value.length !== 11) {
            alert("⚠️ Student cellphone number must be exactly 11 digits");
            return;
        }

        const gCellEl = document.getElementById("gCellphone");
        if (gCellEl && gCellEl.value.length !== 11) {
            alert("⚠️ Guardian cellphone number must be exactly 11 digits");
            return;
        }

        // Email validation
        async function validateEmail(fieldId) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) return true;
            try {
                const res = await fetch(`../php/validate-email.php?email=${encodeURIComponent(field.value.trim())}`);
                const check = await res.json();
                if (check.status !== "VALID" || !check.validations.mailbox_exists) {
                    field.classList.add("error");
                    let msg = document.createElement("span");
                    msg.className = "error-message absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md -top-6 left-0";
                    msg.textContent = "⚠️ Invalid email address";
                    field.parentElement.style.position = "relative";
                    field.parentElement.appendChild(msg);
                    field.focus();
                    return false;
                }
                return true;
            } catch (err) {
                console.error("Email check failed:", err);
                alert("⚠️ Could not verify email right now. Try again later.");
                return false;
            }
        }

        if (!(await validateEmail("email"))) return;
        if (!(await validateEmail("gEmail"))) return;

        // Append all fields dynamically if they exist
        const fieldsMap = {
            lrn: "lrn",
            grade: "grade_level",
            firstName: "first_name",
            middleName: "middle_name",
            lastName: "last_name",
            suffix: "suffix",
            gender: "gender",
            birthdate: "birth_date",
            street: "street_house",
            barangay: "barangay",
            municipality: "municipal_city",
            province: "province",
            cellphone: "cellphone",
            email: "emailaddress",
            gFirstName: "guardian_first_name",
            gMiddleName: "guardian_middle_name",
            gLastName: "guardian_last_name",
            gSuffix: "guardian_suffix",
            gCellphone: "guardian_contact",
            gEmail: "guardian_email",
            gRelationship: "guardian_relation"
        };

        if (isSHS) {
            fieldsMap.strand = "strand";
            fieldsMap.semester = "semester";
        }

        for (let id in fieldsMap) {
            const el = document.getElementById(id);
            if (el) formData.append(fieldsMap[id], el.value);
        }

        // Documents
        const docs = [
            { file: "birthCert", key: "birth_certificate", check: "birthCertSubmitted" },
            { file: "form138", key: "original_form_138", check: "form138Submitted" },
            { file: "goodMoral", key: "good_moral", check: "goodMoralSubmitted" },
            { file: "form137", key: "original_form_137", check: "form137Submitted" }
        ];

        for (let doc of docs) {
            const fileInput = document.getElementById(doc.file);
            const checkInput = document.getElementById(doc.check);
            if (fileInput && fileInput.files.length > 0) {
                formData.append(doc.key, fileInput.files[0]);
            } else if (checkInput && checkInput.checked) {
                formData.append(doc.check, "submitted");
            } else if (fileInput) {
                fileInput.classList.add("error");
                let msg = document.createElement("span");
                msg.className = "error-message absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md -top-6 left-0";
                msg.textContent = "⚠️ Upload or mark as submitted";
                fileInput.parentElement.style.position = "relative";
                fileInput.parentElement.appendChild(msg);
                fileInput.focus();
                return;
            }
        }

        // Terms
        const termsBox = document.getElementById("terms");
        if (termsBox && !termsBox.checked) {
            let msg = document.createElement("span");
            msg.className = "error-message absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md -top-6 left-0";
            msg.textContent = "⚠️ Please agree to the terms";
            termsBox.parentElement.style.position = "relative";
            termsBox.parentElement.appendChild(msg);
            termsBox.focus();
            return;
        }

        // Submit form
        fetch("../php/submit-application.php", {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    alert("✅ " + data.message);
                    form.querySelectorAll("input, select").forEach(el => el.value = "");
                } else {
                    alert("❌ " + data.message);
                }
            })
            .catch(err => {
                console.error("Error:", err);
                alert("⚠️ Something went wrong. Please try again.");
            });
    });
});

//sections display
document.addEventListener("DOMContentLoaded", () => {
    const classSectionsBtn = document.querySelector('[data-pane="class-sections-pane"]');
    const sectionsContainer = document.getElementById("sectionsContainer");

    if (!classSectionsBtn || !sectionsContainer) return;

    // Load sections and render buttons (can be reused by "Back" button)
    async function loadSections() {
        sectionsContainer.innerHTML = '<p class="text-gray-500 col-span-full">Loading sections...</p>';

        try {
            const res = await fetch('../php/get-teacher-sections.php', { credentials: "include" });
            const data = await res.json();

            if (!data || data.status !== "success" || !Array.isArray(data.sections) || data.sections.length === 0) {
                sectionsContainer.innerHTML = '<p class="text-gray-500 col-span-full">No sections assigned.</p>';
                return;
            }

            // Clear and render section buttons
            sectionsContainer.innerHTML = '';
            data.sections.forEach(section => {
                const btn = document.createElement("button");
                btn.className =
                    "class-section-btn bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out flex items-center justify-center text-lg font-semibold text-gray-800 border border-gray-200 w-full";
                btn.textContent = section.section_name;
                btn.dataset.sectionId = section.section_id;
                btn.dataset.sectionName = section.section_name;

                btn.addEventListener("click", () => loadStudentsForSection(section));

                sectionsContainer.appendChild(btn);
            });
        } catch (err) {
            console.error("Failed to load sections:", err);
            sectionsContainer.innerHTML = '<p class="text-red-500 col-span-full">Error loading sections.</p>';
        }
    }

    // Load students for a specific section and render table
    async function loadStudentsForSection(section) {
        sectionsContainer.innerHTML = `<div class="col-span-full px-2"><p class="text-gray-500">Loading students for ${section.section_name}...</p></div>`;

        try {
            const resStudents = await fetch(
                `../php/get-section-students.php?section_id=${encodeURIComponent(section.section_id)}`,
                { credentials: "include" }
            );
            const stuData = await resStudents.json();

            if (!stuData || stuData.status !== "success" || !Array.isArray(stuData.students) || stuData.students.length === 0) {
                sectionsContainer.innerHTML = `
                    <div class="col-span-full mb-4">
                        <button id="backToSections" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                            ← Back to Sections
                        </button>
                        <p class="mt-3 text-gray-500">No students found for this section.</p>
                    </div>
                `;
                document.getElementById("backToSections").addEventListener("click", loadSections);
                return;
            }

            const wrapperHtml = `
            <div class="col-span-full max-h-[700px] overflow-y-auto">
                    <div class="mb-4 flex items-center space-x-4">
                        <button id="backToSections" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                            ← Back to Sections
                        </button>
                        <h2 class="text-xl font-semibold">Students in ${escapeHtml(section.section_name)}</h2>
                    </div>

                    <div class="w-full overflow-x-auto">
                        <table class="min-w-[1000px] w-full bg-white border border-gray-200 shadow-md rounded-lg mx-auto">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-6 py-3 border text-left">Firstname</th>
                                    <th class="px-6 py-3 border text-left">Lastname</th>
                                    <th class="px-6 py-3 border text-left">Email</th>
                                    <th class="px-6 py-3 border text-left">Password</th>
                                </tr>
                            </thead>
                            <tbody id="section-students-body">
                                <tr>
                                    <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">Loading students...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            sectionsContainer.innerHTML = wrapperHtml;

            const tbody = document.getElementById("section-students-body");
            tbody.innerHTML = "";

            stuData.students.forEach(stu => {
                const studentId = stu.student_id ?? stu.applicant_id ?? "";
                const firstname = stu.firstname ?? "";
                const lastname = stu.lastname ?? "";
                const email = stu.email ?? "";
                const password = stu.password ?? "";
                const maskedPassword = "*".repeat(password.length || 6);

                const tr = document.createElement("tr");
                tr.className = "hover:bg-gray-50";
                tr.innerHTML = `
                    <td class="px-6 py-4 border break-words">${escapeHtml(firstname)}</td>
                    <td class="px-6 py-4 border break-words">${escapeHtml(lastname)}</td>
                    <td class="px-6 py-4 border break-words">${escapeHtml(email)}</td>
                    <td class="px-6 py-4 border">
                        <div class="flex items-center justify-between">
                            <span class="password-text">${maskedPassword}</span>
                            <button class="resetPasswordBtn px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition ml-4"
                                data-student-id="${escapeAttr(studentId)}" data-lastname="${escapeAttr(lastname)}">
                                Reset
                            </button>
                        </div>
                    </td>
                `;

                tbody.appendChild(tr);
            });

            // Back button
            document.getElementById("backToSections").addEventListener("click", loadSections);

            // Reset password handlers
            document.querySelectorAll(".resetPasswordBtn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const studentId = btn.dataset.studentId;
                    const lastname = btn.dataset.lastname;
                    if (!studentId) {
                        alert("Missing student id.");
                        return;
                    }
                    const confirmReset = confirm(`Reset password for ${lastname || "this student"} to ${lastname}123?`);
                    if (!confirmReset) return;

                    try {
                        const resReset = await fetch("../php/reset-student-password.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ student_id: studentId, lastname: lastname })
                        });
                        const resetData = await resReset.json();
                        if (resetData.status === "success") {
                            alert("Password reset successfully!");
                            const newPass = (lastname ?? "") + "123";
                            btn.closest("td").querySelector(".password-text").textContent = "*".repeat(newPass.length);
                        } else {
                            alert("Failed to reset password: " + (resetData.message || "Unknown"));
                        }
                    } catch (err) {
                        console.error("Error resetting password:", err);
                        alert("An error occurred while resetting password.");
                    }
                });
            });

        } catch (err) {
            console.error("Failed to load students:", err);
            sectionsContainer.innerHTML = '<div class="col-span-full"><p class="text-red-500">Error loading students.</p></div>';
        }
    }

    classSectionsBtn.addEventListener("click", () => {
        document.querySelectorAll(".content-pane").forEach(p => p.classList.add("hidden"));
        document.getElementById("class-sections-pane").classList.remove("hidden");
        loadSections();
    });

    // Helpers
    function escapeHtml(str) {
        if (str == null) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    function escapeAttr(str) {
        if (str == null) return "";
        return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
});


// Function to fetch and display teacher's schedule (updated for subject_name from subjects table)
// Function to format time (e.g., "08:00:00" → "8:00 AM")
function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').slice(0, 2);
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Function to fetch and display teacher's schedule as weekly table
async function loadTeacherSchedule() {
    const pane = document.getElementById('class-schedules-pane');
    const tableContainer = pane.querySelector('.mt-6'); // Target the placeholder div

    // Show loading state
    tableContainer.innerHTML = '<p class="text-gray-600">Loading schedule...</p>';

    try {
        const response = await fetch('../php/get_teacher_schedule.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            tableContainer.innerHTML = `<p class="text-red-600">Error: ${data.message}</p>`;
            return;
        }

        if (data.schedules.length === 0) {
            tableContainer.innerHTML = '<p class="text-gray-600">No schedules found.</p>';
            return;
        }

        // Group schedules by day and time_start for easy lookup
        const scheduleMap = {};
        const uniqueTimeSlots = new Set();

        data.schedules.forEach(schedule => {
            const day = schedule.day_of_week;
            const timeStart = schedule.time_start;
            const timeSlotKey = timeStart;  // Use time_start as key for slots
            uniqueTimeSlots.add(timeSlotKey);

            if (!scheduleMap[day]) {
                scheduleMap[day] = {};
            }
            if (!scheduleMap[day][timeSlotKey]) {
                scheduleMap[day][timeSlotKey] = [];
            }
            scheduleMap[day][timeSlotKey].push({
                subject: schedule.subject_name || 'N/A',
                section: schedule.section_name || 'N/A',
                timeEnd: schedule.time_end  // For full slot display
            });
        });

        // Define weekday order (ignore weekends)
        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const sortedTimeSlots = Array.from(uniqueTimeSlots).sort();  // Sort by time_start

        // Build HTML table
        let tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b bg-gray-100">Time Slot</th>
        `;

        // Add day headers
        weekdays.forEach(day => {
            tableHTML += `
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">${day}</th>
            `;
        });

        tableHTML += `
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;

        // Add rows for each time slot
        sortedTimeSlots.forEach(timeStart => {
            const formattedTimeSlot = `${formatTime(timeStart)} - ${formatTime(scheduleMap['Monday']?.[timeStart]?.[0]?.timeEnd || '')}`;  // Use first match for end time

            tableHTML += `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">${formattedTimeSlot}</td>
            `;

            // Add cells for each day
            weekdays.forEach(day => {
                const daySchedules = scheduleMap[day]?.[timeStart] || [];
                let cellContent = '-';  // Default empty

                if (daySchedules.length > 0) {
                    const entries = daySchedules.map(s => `${s.subject} (${s.section})`).join(', ');  // "Subject (Section)"
                    cellContent = entries;
                }

                tableHTML += `
                    <td class="px-4 py-4 text-sm text-gray-900 text-center align-top">${cellContent}</td>
                `;
            });

            tableHTML += `</tr>`;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
            <p class="text-xs text-gray-500 mt-2 text-center">Schedule for the week. Empty cells indicate no class.</p>
        `;

        tableContainer.innerHTML = tableHTML;

    } catch (error) {
        console.error('Error fetching schedule:', error);
        tableContainer.innerHTML = '<p class="text-red-600">Failed to load schedule. Please try again.</p>';
    }
}

// Navigation handler for pane buttons (unchanged)
document.addEventListener('DOMContentLoaded', function () {
    // Find all navigation buttons with data-pane attribute
    const navButtons = document.querySelectorAll('button[data-pane]');

    navButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetPaneId = this.getAttribute('data-pane');
            const paneTitle = this.getAttribute('data-title') || 'Untitled';

            // Hide all content panes
            const allPanes = document.querySelectorAll('.content-pane');
            allPanes.forEach(pane => {
                pane.classList.add('hidden');
            });

            // Show the target pane
            const targetPane = document.getElementById(targetPaneId);
            if (targetPane) {
                targetPane.classList.remove('hidden');

                // Update page title (optional: assuming you have a <h2 id="pane-title"> or similar)
                const titleElement = document.getElementById('pane-title');  // Adjust ID if needed
                if (titleElement) {
                    titleElement.textContent = paneTitle;
                }

                // If it's the class schedules pane, load the schedule data
                if (targetPaneId === 'class-schedules-pane') {
                    loadTeacherSchedule();
                }

                // Optional: Add active class to button for visual feedback
                navButtons.forEach(btn => btn.classList.remove('bg-gray-700', 'text-white'));
                this.classList.add('bg-gray-700', 'text-white');
            } else {
                console.warn(`Pane with ID "${targetPaneId}" not found.`);
            }
        });
    });
});
