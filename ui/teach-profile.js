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

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
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
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${applicant.strand || ""}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${applicant.grade_level || ""}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${applicant.name || ""}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${applicant.cellphone || ""}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${applicant.emailaddress || ""}</td>
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
                        <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                            No pending applications found.
                        </td>
                    </tr>
                `;
            }
        })
        .catch(err => {
            console.error("Error:", err);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-sm text-red-500">
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



    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            console.log('Admin Logout button clicked. Redirecting to admin-login.html...');
            window.location.href = 'admin-login.html'; // Redirect to admin login page
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

    // Add spinner animation CSS if not already added
    if (!document.getElementById('spinnerStyle')) {
        const style = document.createElement('style');
        style.id = 'spinnerStyle';
        style.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .spinner {
                border: 6px solid #f3f3f3;
                border-top: 6px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
            }
        `;
        document.head.appendChild(style);
    }

    // Create loading overlay
    let loadingOverlay = document.createElement("div");
    loadingOverlay.id = "loadingOverlay";
    loadingOverlay.style.position = "fixed";
    loadingOverlay.style.top = 0;
    loadingOverlay.style.left = 0;
    loadingOverlay.style.width = "100%";
    loadingOverlay.style.height = "100%";
    loadingOverlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    loadingOverlay.style.display = "flex";
    loadingOverlay.style.flexDirection = "column";
    loadingOverlay.style.justifyContent = "center";
    loadingOverlay.style.alignItems = "center";
    loadingOverlay.style.zIndex = 10000;

    loadingOverlay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; background: #fff; padding: 20px 30px; border-radius: 8px;">
            <div class="spinner"></div>
            <p style="margin: 0; font-weight: bold;">Approving...</p>
        </div>
    `;

    document.body.appendChild(loadingOverlay);

    fetch(`../php/approve_application.php?id=${currentApplicantId}`, {
        method: "POST"
    })
    .then(response => response.json())
    .then(data => {
        document.body.removeChild(loadingOverlay);

        if (data.success) {
            alert("Applicant approved successfully!");
            closeApplicationModal();
            loadPendingApplications();
        } else {
            alert("Error: " + data.error);
        }
    })
    .catch(err => {
        document.body.removeChild(loadingOverlay);
        alert("Request failed: " + err.message);
    });
}

function denyApplication() {
    if (!currentApplicantId) {
        alert("No applicant selected.");
        return;
    }
    document.getElementById("declineModal").classList.remove("hidden");
}

function closeDeclineModal() {
    document.getElementById("declineModal").classList.add("hidden");
    document.getElementById("declineReason").value = "";
}

function submitDecline() {
    const reason = document.getElementById("declineReason").value.trim();

    if (!reason) {
        alert("Please enter a reason for declining this application.");
        return;
    }

    // Create loading overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = 9999;

    // Spinner
    const spinner = document.createElement("div");
    spinner.style.width = "50px";
    spinner.style.height = "50px";
    spinner.style.border = "6px solid #f3f3f3";
    spinner.style.borderTop = "6px solid #3498db";
    spinner.style.borderRadius = "50%";
    spinner.style.animation = "spin 1s linear infinite";
    overlay.appendChild(spinner);

    // Text
    const text = document.createElement("div");
    text.innerText = "Declining application...";
    text.style.color = "#fff";
    text.style.fontSize = "18px";
    text.style.marginTop = "10px";
    overlay.appendChild(text);

    // Keyframes for spinner
    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Add overlay to body
    document.body.appendChild(overlay);

    fetch("../php/decline_applicant.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            applicant_id: currentApplicantId,
            reason: reason
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Application has been declined successfully.");
            closeDeclineModal();
            closeApplicationModal();
            loadPendingApplications(); // refresh table
        } else {
            alert("Error: " + (data.error || "Unable to decline applicant."));
        }
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Something went wrong while declining the applicant.");
    })
    .finally(() => {
        document.body.removeChild(overlay); // Remove spinner overlay
    });
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
    const studentsTableHead = document.getElementById("students-table-head");
    const backBtn = document.getElementById("back-to-sections-btn");
    const viewGradesBtn = document.getElementById("view-grades-btn");

    let currentSectionId = null;
    let currentSubjectId = null;
    let assignedLevelGlobal = null;

    // ===== Load teacher sections =====
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
                btn.addEventListener("click", () =>
                    showSectionStudents(section.section_id, section.subject_name, section.subject_id)
                );
                sectionsContainer.appendChild(btn);
            });
        })
        .catch(err => console.error("Error fetching sections:", err));

    // ===== Show students for a section =====
    function showSectionStudents(sectionId, subjectName, subjectId) {
        currentSectionId = sectionId;
        currentSubjectId = subjectId;

        sectionsContainer.classList.add("hidden");
        backBtn.classList.remove("hidden");
        if (viewGradesBtn) viewGradesBtn.classList.remove("hidden");

        fetch("../php/get_assigned_level.php", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (!data.success) { alert("Failed to detect assigned level."); return; }
                assignedLevelGlobal = data.assigned_level;
                buildTableHeader();
                loadStudents();
            })
            .catch(err => console.error(err));
    }

    // ===== Build dynamic table header =====
    function buildTableHeader() {
        studentsTableHead.innerHTML = "";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Strand</th>
        `;
        if (assignedLevelGlobal.toLowerCase() === "junior high") {
            ["Q1","Q2","Q3","Q4","Average"].forEach(q => {
                tr.innerHTML += `<th class="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase">${q}</th>`;
            });
        } else {
            ["Q1","Q2","Final"].forEach(q => {
                tr.innerHTML += `<th class="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase">${q}</th>`;
            });
        }
        tr.innerHTML += `<th class="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase">Action</th>`;
        studentsTableHead.appendChild(tr);
    }

    // ===== Helper to check if input is editable by encoding date =====
    function isWithinDateRange(startStr, endStr) {
        if (!startStr || !endStr) return false; // disable if no date
        const today = new Date();
        const start = new Date(startStr.replace(" ", "T") + ""); // ensure proper parsing
        const end = new Date(endStr.replace(" ", "T") + "T23:59:59"); // include full end day
        return today >= start && today <= end;
    }

    function loadStudents() {
        // Map assigned level to PHP level
        const phpLevel = assignedLevelGlobal.toLowerCase().includes("junior") ? "jhs" : "shs";
    
        // Fetch encoding dates first
        fetch(`../php/get_encoding_dates.php?level=${phpLevel}`, { credentials: "include" })
            .then(res => res.json())
            .then(encodingData => {
                const dates = encodingData.success ? encodingData.dates : {};
    
                // Fetch students
                fetch(`../php/get_section_grades.php?section_id=${currentSectionId}&subject_id=${currentSubjectId}&level=${assignedLevelGlobal}`, { credentials: "include" })
                    .then(res => res.json())
                    .then(students => {
                        studentsTitle.textContent = `Students`;
                        studentsTableBody.innerHTML = "";
    
                        if (!Array.isArray(students) || students.length === 0) {
                            studentsTableBody.innerHTML = `<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">No students found</td></tr>`;
                            studentsList.classList.remove("hidden");
                            return;
                        }
    
                        const today = new Date();
    
                        function editableByDate(start, end) {
                            if (!start || !end) return true; // editable if no date defined
                            const startDate = new Date(start + "T00:00:00");
                            const endDate = new Date(end + "T23:59:59");
                            return today >= startDate && today <= endDate;
                        }
    
                        students.forEach(st => {
                            const tr = document.createElement("tr");
                            tr.dataset.studentId = st.student_id;
    
                            // Name
                            const tdName = document.createElement("td");
                            tdName.className = "px-3 py-2 text-sm text-gray-900 text-left";
                            const nameParts = st.student_name.trim().split(" ");
                            const lastName = nameParts.slice(-1)[0];
                            const firstNames = nameParts.slice(0, -1).join(" ");
                            tdName.textContent = `${lastName}, ${firstNames}`;
                            tr.appendChild(tdName);
    
                            // Strand (SHS only)
                            const tdStrand = document.createElement("td");
                            tdStrand.className = "px-3 py-2 text-sm text-gray-900";
                            tdStrand.textContent = assignedLevelGlobal.toLowerCase().includes("senior") ? (st.strand || '') : '';
                            tr.appendChild(tdStrand);
    
                            if (assignedLevelGlobal.toLowerCase().includes("junior")) {
                                ["Q1","Q2","Q3","Q4"].forEach(q => {
                                    const td = document.createElement("td");
                                    const input = document.createElement("input");
                                    input.type = "number";
                                    input.min = 0;
                                    input.max = 100;
                                    input.className = `w-16 ${q.toLowerCase()} border rounded px-1 py-0.5 text-center`;
                                    input.value = st[q.toLowerCase()] ?? '';
    
                                    input.disabled = !editableByDate(dates[q]?.start, dates[q]?.end);
                                    if (!input.disabled) input.addEventListener("input", ()=>updateJHAverage(tr));
    
                                    td.appendChild(input);
                                    tr.appendChild(td);
                                });
    
                                const tdAvg = document.createElement("td");
                                const avgInput = document.createElement("input");
                                avgInput.type = "text";
                                avgInput.readOnly = true;
                                avgInput.className = "w-16 average border rounded px-1 py-0.5 text-center";
                                avgInput.value = st.average ?? '';
                                tdAvg.appendChild(avgInput);
                                tr.appendChild(tdAvg);
    
                            } else { // SHS
                                ["Q1","Q2"].forEach(q => {
                                    const field = q.toLowerCase() + "_grade"; // q1_grade
                                    const td = document.createElement("td");
                                    const input = document.createElement("input");
                                    input.type = "number";
                                    input.min = 0;
                                    input.max = 100;
                                    input.className = `w-16 ${field.replace("_", "-")} border rounded px-1 py-0.5 text-center`; // q1-grade
                                    input.value = st[field] ?? '';
                                
                                    input.disabled = !editableByDate(dates[q]?.start, dates[q]?.end);
                                    if (!input.disabled) input.addEventListener("input", ()=>updateSHSFinal(tr));
                                
                                    td.appendChild(input);
                                    tr.appendChild(td);
                                });
                                
    
                                const tdFinal = document.createElement("td");
                                const finalInput = document.createElement("input");
                                finalInput.type = "text";
                                finalInput.readOnly = true;
                                finalInput.className = "w-16 final-grade border rounded px-1 py-0.5 text-center";
                                finalInput.value = st.final_grade ?? '';
                                tdFinal.appendChild(finalInput);
                                tr.appendChild(tdFinal);
                            }
    
                            // Action button
                            const tdAction = document.createElement("td");
                            tdAction.className = "text-center px-2";
                            const btn = document.createElement("button");
                            btn.className = "save-row-btn px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600";
                            btn.textContent = "Save";
                            btn.addEventListener("click", ()=>saveRow(tr));
                            tdAction.appendChild(btn);
                            tr.appendChild(tdAction);
    
                            studentsTableBody.appendChild(tr);
                        });
    
                        studentsList.classList.remove("hidden");
                    })
                    .catch(err => console.error(err));
            })
            .catch(err => console.error("Error fetching encoding dates:", err));
    }
    

    function updateJHAverage(row) {
        const vals = ["q1","q2","q3","q4"].map(cls => parseFloat(row.querySelector(`.${cls}`).value)).filter(v=>!isNaN(v));
        row.querySelector(".average").value = vals.length === 4 ? (vals.reduce((a,b)=>a+b,0)/4).toFixed(2) : "";
    }

    function updateSHSFinal(row) {
        const q1 = parseFloat(row.querySelector(".q1-grade").value);
        const q2 = parseFloat(row.querySelector(".q2-grade").value);
        const finalInput = row.querySelector(".final-grade");
        if (!isNaN(q1) && !isNaN(q2)) {
            finalInput.value = ((q1+q2)/2).toFixed(2);
        } else {
            finalInput.value = "";
        }
    }

    function saveRow(row) {
        const studentId = row.dataset.studentId;
        let payload = {};
        if (assignedLevelGlobal.toLowerCase() === "junior high") {
            payload = {
                student_id: studentId,
                section_id: currentSectionId,
                subject_id: currentSubjectId,
                q1: row.querySelector(".q1").value,
                q2: row.querySelector(".q2").value,
                q3: row.querySelector(".q3").value,
                q4: row.querySelector(".q4").value,
                average: row.querySelector(".average").value
            };
        } else {
            payload = {
                student_id: studentId,
                section_id: currentSectionId,
                subject_id: currentSubjectId,
                q1_grade: row.querySelector(".q1-grade").value,
                q2_grade: row.querySelector(".q2-grade").value,
                final_grade: row.querySelector(".final-grade").value
            };
        }

        fetch("../php/save_grades.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([payload]),
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => alert(data.message || "Grade saved successfully!"))
        .catch(err => { console.error(err); alert("Failed to save grade."); });
    }

    backBtn.addEventListener("click", ()=>{
        sectionsContainer.classList.remove("hidden");
        studentsList.classList.add("hidden");
        backBtn.classList.add("hidden");
        if (viewGradesBtn) viewGradesBtn.classList.add("hidden");
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

    async function loadSections() {
        sectionsContainer.innerHTML = '<p class="text-gray-500 col-span-full">Loading sections...</p>';

        try {
            const userRes = await fetch("../php/get_user_info.php", { credentials: "include" });
            const userData = await userRes.json();
            const teacherId = userData?.id || 0;

            const res = await fetch('../php/get-teacher-sections.php', { credentials: "include" });
            const data = await res.json();

            if (!data || data.status !== "success" || !Array.isArray(data.sections) || data.sections.length === 0) {
                sectionsContainer.innerHTML = '<p class="text-gray-500 col-span-full">No sections assigned.</p>';
                return;
            }

            sectionsContainer.innerHTML = '';

            const advisorySections = data.sections.filter(s => Number(s.adviser) === Number(teacherId));
            const otherSections = data.sections.filter(s => Number(s.adviser) !== Number(teacherId));
            const orderedSections = [...advisorySections, ...otherSections];

            orderedSections.forEach(section => {
                const isAdvisory = Number(section.adviser) === Number(teacherId);

                const btn = document.createElement("button");
                btn.className = isAdvisory
                    ? "class-section-btn bg-green-100 text-green-900 p-6 rounded-lg shadow-md hover:bg-green-200 transition text-lg font-semibold border border-green-400 w-full"
                    : "class-section-btn bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-lg font-semibold text-gray-800 border border-gray-200 w-full";

                btn.textContent = isAdvisory
                    ? `${section.section_name} (Advisory Class)`
                    : section.section_name;

                btn.dataset.sectionId = section.section_id;
                btn.dataset.sectionName = section.section_name;
                btn.dataset.isAdvisory = isAdvisory;

                btn.addEventListener("click", () => loadStudentsForSection(section, isAdvisory));
                sectionsContainer.appendChild(btn);
            });
        } catch (err) {
            console.error("Failed to load sections:", err);
            sectionsContainer.innerHTML = '<p class="text-red-500 col-span-full">Error loading sections.</p>';
        }
    }

    async function loadStudentsForSection(section, isAdvisory) {
        sectionsContainer.innerHTML = `<div class="col-span-full px-2"><p class="text-gray-500">Loading students for ${escapeHtml(section.section_name)}...</p></div>`;
    
        try {
            const resStudents = await fetch(`../php/get-section-students.php?section_id=${encodeURIComponent(section.section_id)}`, { credentials: "include" });
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
                        <button id="backToSections" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">← Back</button>
                        <h2 class="text-xl font-semibold">Students in ${escapeHtml(section.section_name)}</h2>
                    </div>
                    <div class="w-full overflow-x-auto">
                        <table class="min-w-[900px] w-full bg-white border border-gray-200 shadow-md rounded-lg mx-auto" id="studentsTable">
                            <thead class="bg-gray-100 cursor-pointer">
                                <tr>
                                    <th data-key="firstname" class="px-6 py-3 border text-left">Firstname</th>
                                    <th data-key="lastname" class="px-6 py-3 border text-left">Lastname</th>
                                    <th data-key="email" class="px-6 py-3 border text-left">Email</th>
                                    <th data-key="password" class="px-6 py-3 border text-left">Password</th>
                                    ${isAdvisory ? `<th class="px-4 py-3 border text-center w-[5%]">Action</th>` : ""}
                                </tr>
                            </thead>
                            <tbody id="section-students-body"></tbody>
                        </table>
                    </div>
                </div>
            `;
            sectionsContainer.innerHTML = wrapperHtml;
    
            const tbody = document.getElementById("section-students-body");
            const students = stuData.students;
    
            const renderTable = (list) => {
                tbody.innerHTML = "";
                list.forEach(stu => {
                    const firstname = stu.firstname ?? "";
                    const lastname = stu.lastname ?? "";
                    const email = stu.email ?? stu.emailaddress ?? "";
                    const password = stu.password ?? "";
                    const maskedPassword = "*".repeat(password.length || 6);
    
                    const tr = document.createElement("tr");
                    tr.className = "hover:bg-gray-50";
    
                    tr.innerHTML = `
                        <td class="px-6 py-4 border">${escapeHtml(firstname)}</td>
                        <td class="px-6 py-4 border">${escapeHtml(lastname)}</td>
                        <td class="px-6 py-4 border">${escapeHtml(email)}</td>
                        <td class="px-6 py-4 border">${maskedPassword}</td>
                        ${isAdvisory ? `
                        <td class="px-4 py-2 border text-center">
                            <button class="editBtn px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                                data-applicant="${stu.applicant_id}">
                                Edit
                            </button>
                        </td>` : ""}
                    `;
                    tbody.appendChild(tr);
                });
            };
    
            // Initial render
            renderTable(students);
    
            // Sorting functionality
            const headers = document.querySelectorAll("#studentsTable thead th[data-key]");
            let currentSort = { key: null, asc: true };
    
            headers.forEach(header => {
                header.addEventListener("click", () => {
                    const key = header.getAttribute("data-key");
    
                    // Toggle sort order
                    if (currentSort.key === key) {
                        currentSort.asc = !currentSort.asc;
                    } else {
                        currentSort.key = key;
                        currentSort.asc = true;
                    }
    
                    // Sort students
                    const sorted = [...students].sort((a, b) => {
                        const valA = (a[key] || "").toString().toLowerCase();
                        const valB = (b[key] || "").toString().toLowerCase();
    
                        if (valA < valB) return currentSort.asc ? -1 : 1;
                        if (valA > valB) return currentSort.asc ? 1 : -1;
                        return 0;
                    });
    
                    renderTable(sorted);
    
                    // Optional: add small visual cue (▲ or ▼)
                    headers.forEach(h => h.textContent = h.textContent.replace(/[▲▼]/g, ""));
                    header.textContent += currentSort.asc ? " ▲" : " ▼";
                });
            });
    
            document.getElementById("backToSections").addEventListener("click", loadSections);
    
            if (isAdvisory) {
                document.querySelectorAll(".editBtn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const applicantId = btn.dataset.applicant;
                        openEditModalFetch(applicantId, section.section_id);
                    });
                });
            }
    
        } catch (err) {
            console.error("Failed to load students:", err);
            sectionsContainer.innerHTML = '<div class="col-span-full"><p class="text-red-500">Error loading students.</p></div>';
        }
    }
    
    async function openEditModalFetch(applicantId, sectionId) {
        try {
            const res = await fetch("../php/fetch_student_full.php", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ applicant_id: applicantId })
            });
            const data = await res.json();
            if (!data || data.status !== "success") {
                return alert(data?.message || "Failed to fetch student data.");
            }
            openEditModal(data);
        } catch (err) {
            console.error(err);
            alert("Error fetching student data.");
        }
    }

    function openEditModal(data) {
        const applicant = data.applicant || {};
        const guardian = data.guardian || {};
        const documents = data.documents || {};
        const level = data.level || "shs";
        const applicantId = applicant.applicant_id || applicant.student_id || '';

        const modal = document.createElement("div");
        modal.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-12 z-50 overflow-auto";

        modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 w-[900px] max-w-[95%] shadow-lg">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-800">Edit Student (ID: ${escapeHtml(applicantId)})</h3>
            <button id="closeEditModal" class="text-gray-600 hover:text-gray-900 text-2xl leading-none">&times;</button>
        </div>

        <form id="editStudentForm" enctype="multipart/form-data" class="space-y-6">
            <input type="hidden" name="applicant_id" value="${escapeAttr(applicantId)}" />
            <input type="hidden" name="level" value="${escapeAttr(level)}" />

            <section class="border rounded-xl p-4 bg-gray-50">
                <h4 class="text-lg font-semibold mb-3 text-gray-700">Student Information</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium">Grade Level</label>
                        <input name="grade_level" value="${escapeAttr(applicant.grade_level ?? '')}" class="w-full p-2 border rounded mb-2" />

                        ${level === 'shs' ? `
                            <label class="block text-sm font-medium">Semester</label>
                            <select name="semester" class="w-full p-2 border rounded mb-2">
                                <option value="">Select</option>
                                <option value="1" ${applicant.semester == 1 ? 'selected' : ''}>1</option>
                                <option value="2" ${applicant.semester == 2 ? 'selected' : ''}>2</option>
                            </select>

                            <label class="block text-sm font-medium">Strand</label>
                            <input name="strand" value="${escapeAttr(applicant.strand ?? '')}" class="w-full p-2 border rounded mb-2" />
                        ` : `
                            <input type="hidden" name="semester" value="" />
                            <input type="hidden" name="strand" value="" />
                        `}

                        <label class="block text-sm font-medium">First Name</label>
                        <input name="firstname" value="${escapeAttr(applicant.firstname ?? '')}" class="w-full p-2 border rounded mb-2" />

                        <label class="block text-sm font-medium">Middle Name</label>
                        <input name="middlename" value="${escapeAttr(applicant.middlename ?? '')}" class="w-full p-2 border rounded mb-2" />

                        <label class="block text-sm font-medium">Last Name</label>
                        <input name="lastname" value="${escapeAttr(applicant.lastname ?? '')}" class="w-full p-2 border rounded mb-2" />

                        <label class="block text-sm font-medium">Suffix</label>
                        <input name="suffix" value="${escapeAttr(applicant.suffix ?? '')}" class="w-full p-2 border rounded mb-2" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium">Gender</label>
                        <select name="gender" class="w-full p-2 border rounded mb-2">
                            <option value="">Select</option>
                            <option value="Male" ${applicant.gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${applicant.gender === 'Female' ? 'selected' : ''}>Female</option>
                            <option value="Other" ${applicant.gender === 'Other' ? 'selected' : ''}>Other</option>
                        </select>

                        <label class="block text-sm font-medium">Birth Date</label>
                        <input name="birth_date" type="date" value="${escapeAttr(applicant.birth_date ?? '')}" class="w-full p-2 border rounded mb-2" />

                        <label class="block text-sm font-medium">LRN</label>
                        <input name="lrn" value="${escapeAttr(applicant.lrn ?? '')}" class="w-full p-2 border rounded mb-2" />

                        <label class="block text-sm font-medium">Street / House</label>
                        <input name="street_house" value="${escapeAttr(applicant.street_house ?? '')}" class="w-full p-2 border rounded mb-2" />

                        <label class="block text-sm font-medium">Barangay</label>
                        <input name="barangay" value="${escapeAttr(applicant.barangay ?? '')}" class="w-full p-2 border rounded mb-2" />

                        <label class="block text-sm font-medium">Municipal / City</label>
                        <input name="municipal_city" value="${escapeAttr(applicant.municipal_city ?? '')}" class="w-full p-2 border rounded mb-2" />

                        <label class="block text-sm font-medium">Province</label>
                        <input name="province" value="${escapeAttr(applicant.province ?? '')}" class="w-full p-2 border rounded mb-2" />

                        <label class="block text-sm font-medium">Cellphone</label>
                        <input name="cellphone" value="${escapeAttr(applicant.cellphone ?? '')}" class="w-full p-2 border rounded mb-2" />

                        <label class="block text-sm font-medium">Email Address</label>
                        <input name="emailaddress" value="${escapeAttr(applicant.emailaddress ?? '')}" class="w-full p-2 border rounded mb-2" />
                    </div>
                </div>
            </section>

            <section class="border rounded-xl p-4 bg-gray-50">
                <h4 class="text-lg font-semibold mb-3 text-gray-700">Guardian Information</h4>
                <div class="grid grid-cols-2 gap-4">
                    <input name="g_firstname" placeholder="First Name" value="${escapeAttr(guardian.firstname ?? '')}" class="w-full p-2 border rounded" />
                    <input name="g_middlename" placeholder="Middle Name" value="${escapeAttr(guardian.middlename ?? '')}" class="w-full p-2 border rounded" />
                    <input name="g_lastname" placeholder="Last Name" value="${escapeAttr(guardian.lastname ?? '')}" class="w-full p-2 border rounded" />
                    <input name="g_suffix" placeholder="Suffix" value="${escapeAttr(guardian.suffix ?? '')}" class="w-full p-2 border rounded" />
                    <input name="g_cellphone" placeholder="Cellphone" value="${escapeAttr(guardian.cellphone ?? guardian.contact ?? '')}" class="w-full p-2 border rounded" />
                    <input name="g_email" placeholder="Email" value="${escapeAttr(guardian.email ?? '')}" class="w-full p-2 border rounded" />
                    <input name="g_relationship" placeholder="Relationship" value="${escapeAttr(guardian.relationship ?? '')}" class="w-full p-2 border rounded" />
                </div>
            </section>

            <section class="border rounded-xl p-4 bg-gray-50">
                <h4 class="text-lg font-semibold mb-3 text-gray-700">Documents</h4>
                <div class="grid grid-cols-2 gap-4">
                    ${[
                        { key: 'birth_certificate', label: 'Birth Certificate' },
                        { key: 'original_form_138', label: 'Original Form 138' },
                        { key: 'good_moral', label: 'Good Moral' },
                        { key: 'original_form_137', label: 'Original Form 137' }
                    ].map(doc => {
                        const rawPath = documents[doc.key] || "";
                        const fixedPath = rawPath
                            ? rawPath.startsWith("uploads/") // match your actual folder
                                ? `${window.location.origin}/${rawPath}`
                                : rawPath
                            : "";
                        
                        return `
                            <div>
                                <label class="block text-sm">${doc.label}</label>
                                ${rawPath
                                    ? `<a href="${escapeAttr(fixedPath)}" target="_blank" class="text-blue-600 underline text-sm mb-1 inline-block">View current</a>`
                                    : `<span class="text-gray-500 text-sm block mb-1">No file</span>`}
                                <input type="file" name="${doc.key}" accept=".pdf,.jpg,.jpeg,.png" class="w-full border rounded p-1 bg-white">
                            </div>
                        `;

                    }).join('')}
                </div>
            </section>

            <div class="flex justify-end gap-3 pt-3 border-t">
                <button type="button" id="cancelEdit" class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
                <button type="submit" id="saveEdit" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save Changes</button>
            </div>
        </form>
    </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#closeEditModal").addEventListener("click", () => modal.remove());
        modal.querySelector("#cancelEdit").addEventListener("click", () => modal.remove());

        modal.querySelector("#editStudentForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);

            const applicantId = form.querySelector('input[name="applicant_id"]')?.value?.trim();
            const level = form.querySelector('input[name="level"]')?.value?.trim();
            if (!applicantId || !level) {
                alert("Error: Missing applicant ID or level.");
                return;
            }

            try {
                const res = await fetch("../php/update_applicant_full.php", {
                    method: "POST",
                    credentials: "include",
                    body: formData
                });

                const text = await res.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch {
                    console.error("Non-JSON response:", text);
                    alert("Server returned invalid response:\n" + text);
                    return;
                }

                if (result.status === "success") {
                    alert("Student updated successfully.");
                    modal.remove();
                    loadSections();
                } else {
                    alert("Update failed: " + (result.message || "Unknown error"));
                }
            } catch (err) {
                console.error("Update error:", err);
                alert("Error updating student.");
            }
        });
    }

    classSectionsBtn.addEventListener("click", () => {
        document.querySelectorAll(".content-pane").forEach(p => p.classList.add("hidden"));
        document.getElementById("class-sections-pane").classList.remove("hidden");
        loadSections();
    });

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
