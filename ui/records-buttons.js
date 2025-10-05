document.addEventListener("DOMContentLoaded", () => {
    const recordsButtons = document.getElementById("records-buttons");
    const recordsBtn = document.querySelector('[data-pane="master-list"]');
    const allPaneButtons = document.querySelectorAll("[data-pane]");
    const mainContent = document.querySelector("main.flex-1"); // selects your existing main

    if (!recordsButtons || !recordsBtn || !mainContent) {
        console.warn("⚠️ Missing required DOM elements.");
        return;
    }

    // --- Show/hide Records button group ---
    allPaneButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn === recordsBtn) {
                recordsButtons.classList.remove("hidden");
            } else {
                recordsButtons.classList.add("hidden");
                clearDynamicContent();
                hideAllPanes();
            }
        });
    });

    function clearDynamicContent() {
        const oldContent = document.getElementById("records-dynamic");
        if (oldContent) oldContent.remove();
    }

    function hideAllPanes() {
        const panes = document.querySelectorAll(".extra-pane");
        panes.forEach(pane => pane.classList.add("hidden"));
    }

    // --- Toggle panes when clicking record buttons ---
    const buttons = recordsButtons.querySelectorAll("button");
    buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            hideAllPanes();
            const targetPane = document.getElementById(`pane-${index}`);
            if (targetPane) targetPane.classList.remove("hidden");
        });
    });

    // --- Enrollment by Grade (first button) ---
    const enrollGradeBtn = recordsButtons.querySelector("button:nth-child(1)");
    if (!enrollGradeBtn) return;

    enrollGradeBtn.addEventListener("click", async () => {
        const modal = document.getElementById("records-modal");
        const modalContent = document.getElementById("records-modal-content");

        // Clear previous content
        modalContent.innerHTML = "";

        // Make modal taller if needed
        const modalBox = modal.querySelector("div.bg-gray-800");
        if (modalBox) modalBox.classList.add("h-[700px]"); // Tailwind custom height

        modal.classList.remove("hidden"); // show modal

        try {
            // 1. Get assigned level from session
            const loginRes = await fetch("../php/get_assigned_level.php", {
                method: "GET",
                credentials: "include"
            });

            const loginData = await loginRes.json();

            if (!loginData.success || !loginData.assigned_level) {
                alert("Unable to determine assigned level.");
                return;
            }

            const assignedLevel = loginData.assigned_level;
            const gradeOptions = assignedLevel === "Senior High" ? [11, 12] : [7, 8, 9, 10];

            // 2. Dropdown + PDF button container
            const container = document.createElement("div");
            container.className = "mb-4 flex items-center gap-2"; // flex container

            // Dropdown
            const select = document.createElement("select");
            select.className = "px-3 py-2 rounded-md border border-gray-600 bg-gray-800 text-gray-200";
            select.innerHTML = `<option value="">Select Grade</option>`;
            gradeOptions.forEach(g => {
                const opt = document.createElement("option");
                opt.value = g;
                opt.textContent = "Grade " + g;
                select.appendChild(opt);
            });
            container.appendChild(select);

            // Export PDF button
            const pdfBtn = document.createElement("button");
            pdfBtn.textContent = "Export as PDF";
            pdfBtn.className = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700";
            container.appendChild(pdfBtn);

            modalContent.appendChild(container);

            // Total students text
            let totalText = document.createElement("p");
            totalText.id = "total-students";
            totalText.className = "mb-2 font-semibold text-gray-200";
            modalContent.appendChild(totalText);

            // PDF button click handler
            pdfBtn.addEventListener("click", () => {
                const table = document.getElementById("records-table");
                if (!table) {
                    alert("No table to export.");
                    return;
                }

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                doc.text("Student Records", 14, 16);
                doc.autoTable({ html: "#records-table", startY: 20 });

                // Open PDF in new tab
                const pdfUrl = doc.output("bloburl");
                window.open(pdfUrl, "_blank");
            });

            // 3. On change -> fetch students
            select.addEventListener("change", async () => {
                const grade = select.value;
                if (!grade) return;

                const oldTable = document.getElementById("records-table");
                if (oldTable) oldTable.remove();

                try {
                    const studentRes = await fetch("../php/get_students_by_grade.php?level=" + encodeURIComponent(assignedLevel) + "&grade=" + grade, {
                        credentials: "include"
                    });
                    const students = await studentRes.json();

                    // Update total students
                    totalText.textContent = `Total Students: ${students.length}`;

                    const table = document.createElement("table");
                    table.id = "records-table";
                    table.className = "mt-2 w-full border border-gray-600 text-sm text-gray-200";

                    table.innerHTML = `
                    <thead class="bg-gray-700 text-white">
                        <tr>
                            <th class="px-3 py-2 border border-gray-600">ID</th>
                            <th class="px-3 py-2 border border-gray-600">Name</th>
                            <th class="px-3 py-2 border border-gray-600">Grade Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => `
                            <tr>
                                <td class="px-3 py-2 border border-gray-600">${s.id}</td>
                                <td class="px-3 py-2 border border-gray-600">${s.name}</td>
                                <td class="px-3 py-2 border border-gray-600">${s.grade_level}</td>
                            </tr>`).join("")}
                    </tbody>
                `;

                    modalContent.appendChild(table);
                } catch (err) {
                    console.error(err);
                    alert("Failed to fetch students.");
                }
            });
        } catch (err) {
            console.error(err);
            alert("Error loading assigned level.");
        }
    });

    // --- Close modal ---
    document.getElementById("modal-close").addEventListener("click", () => {
        document.getElementById("records-modal").classList.add("hidden");
    });


    // Enrollment by Section button
    const enrollSectionBtn = recordsButtons.querySelector("button:nth-child(2)");
    if (enrollSectionBtn) {
        enrollSectionBtn.addEventListener("click", async () => {
            const modal = document.getElementById("records-modal");
            const modalContent = document.getElementById("records-modal-content");

            // Clear previous content
            modalContent.innerHTML = "";

            // Show modal
            modal.classList.remove("hidden");

            try {
                // Fetch sections from new PHP
                const sectionsRes = await fetch("../php/fetch_section.php", { credentials: "include" });
                const sections = await sectionsRes.json();

                if (!sections || sections.length === 0) {
                    modalContent.innerHTML = "<p>No sections available.</p>";
                    return;
                }

                // --- Dropdown + PDF button container ---
                const container = document.createElement("div");
                container.className = "mb-4 flex items-center gap-2"; // flex container

                // 1. Create dropdown
                const select = document.createElement("select");
                select.className = "px-3 py-2 rounded-md border border-gray-600 bg-gray-800 text-gray-200";
                select.innerHTML = `<option value="">Select Section</option>`;
                sections.forEach(sec => {
                    const opt = document.createElement("option");
                    opt.value = sec.section_name;
                    opt.textContent = sec.section_name;
                    select.appendChild(opt);
                });
                container.appendChild(select);

                // 2. Export PDF button
                const pdfBtn = document.createElement("button");
                pdfBtn.textContent = "Export as PDF";
                pdfBtn.className = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700";
                container.appendChild(pdfBtn);

                modalContent.appendChild(container);

                // PDF button click handler
                pdfBtn.addEventListener("click", () => {
                    const table = document.getElementById("records-table");
                    if (!table) {
                        alert("No table to export.");
                        return;
                    }

                    const sectionName = select.value; // get currently selected section
                    if (!sectionName) {
                        alert("Please select a section first.");
                        return;
                    }

                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();

                    doc.text(sectionName, 14, 16); // Use section name as title
                    doc.autoTable({ html: "#records-table", startY: 20 });

                    // Open PDF in new tab
                    const pdfUrl = doc.output("bloburl");
                    window.open(pdfUrl, "_blank");
                });


                // 3. On change -> fetch students in section
                select.addEventListener("change", async () => {
                    const sectionName = select.value;
                    if (!sectionName) return;

                    const oldTable = document.getElementById("records-table");
                    const oldTotal = document.getElementById("total-students-section");
                    if (oldTable) oldTable.remove();
                    if (oldTotal) oldTotal.remove();

                    try {
                        const studentsRes = await fetch(`../php/get_section_students.php?section_name=${encodeURIComponent(sectionName)}`, { credentials: "include" });
                        const students = await studentsRes.json();

                        if (students.error) {
                            modalContent.innerHTML += `<p>${students.error}</p>`;
                            return;
                        }

                        // Total students text (below dropdown, above table)
                        const totalText = document.createElement("p");
                        totalText.id = "total-students-section";
                        totalText.className = "mb-2 font-semibold text-gray-200";
                        totalText.textContent = `Total Students: ${students.length}`;
                        modalContent.appendChild(totalText);

                        // Build table
                        const table = document.createElement("table");
                        table.id = "records-table";
                        table.className = "mt-2 w-full border border-gray-600 text-sm text-gray-200";
                        table.innerHTML = `
                    <thead class="bg-gray-700 text-white">
                        <tr>
                            <th class="px-3 py-2 border border-gray-600">Name</th>
                            <th class="px-3 py-2 border border-gray-600">Strand</th>
                            <th class="px-3 py-2 border border-gray-600">Grade Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => `
                            <tr>
                                <td class="px-3 py-2 border border-gray-600">${s.student_name}</td>
                                <td class="px-3 py-2 border border-gray-600">${s.strand}</td>
                                <td class="px-3 py-2 border border-gray-600">${s.grade_level}</td>
                            </tr>`).join("")}
                    </tbody>
                `;
                        modalContent.appendChild(table);

                    } catch (err) {
                        console.error(err);
                        alert("Failed to fetch students in section.");
                    }
                });

            } catch (err) {
                console.error(err);
                alert("Error loading sections.");
            }
        });
    }

    // --- Close modal ---
    document.getElementById("modal-close").addEventListener("click", () => {
        document.getElementById("records-modal").classList.add("hidden");
    });


    //enrollment audit
    const auditBtn = recordsButtons.querySelector("button:nth-child(3)"); // Audit is 3rd button
    if (auditBtn) {
        auditBtn.addEventListener("click", async () => {
            const modal = document.getElementById("records-modal");
            const modalContent = document.getElementById("records-modal-content");
            modalContent.innerHTML = "";
            modal.classList.remove("hidden");

            try {
                // 1. Get assigned level
                const loginRes = await fetch("../php/get_assigned_level.php", { method: "GET", credentials: "include" });
                const loginData = await loginRes.json();
                if (!loginData.success || !loginData.assigned_level) {
                    return alert("Unable to determine assigned level.");
                }
                const assignedLevel = loginData.assigned_level.toLowerCase();

                // 2. Fetch all students
                const studentsRes = await fetch(`../php/get_all_students.php?level=${encodeURIComponent(assignedLevel)}`, { credentials: "include" });
                const studentsData = await studentsRes.json();

                if (!studentsData.success) {
                    modalContent.innerHTML = `<p>${studentsData.message}</p>`;
                    return;
                }

                const students = studentsData.students;

                // 3. Create table
                const table = document.createElement("table");
                table.className = "w-full border border-gray-600 text-sm text-gray-200";
                table.id = "records-table";

                // Table headers: firstname & lastname instead of concatenated name
                table.innerHTML = `
                    <thead class="bg-gray-700 text-white">
                        <tr>
                            <th class="px-3 py-2 border border-gray-600">First Name</th>
                            <th class="px-3 py-2 border border-gray-600">Last Name</th>
                            ${assignedLevel === 'senior high' ? '<th class="px-3 py-2 border border-gray-600">Strand</th>' : ''}
                            <th class="px-3 py-2 border border-gray-600">Grade Level</th>
                            ${assignedLevel === 'senior high' ? '<th class="px-3 py-2 border border-gray-600">Semester</th>' : ''}
                            <th class="px-3 py-2 border border-gray-600">Barangay</th>
                            <th class="px-3 py-2 border border-gray-600">Municipal/City</th>
                            <th class="px-3 py-2 border border-gray-600">Province</th>
                            <th class="px-3 py-2 border border-gray-600">Cellphone</th>
                            <th class="px-3 py-2 border border-gray-600">Email</th>
                            <th class="px-3 py-2 border border-gray-600">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => `
                            <tr data-id="${s.applicant_id}">
                                <td class="px-3 py-2 border border-gray-600">
                                    <input type="text" name="firstname" value="${s.firstname || ''}" class="w-full bg-gray-700 text-gray-200 px-2 py-1 rounded" readonly>
                                </td>
                                <td class="px-3 py-2 border border-gray-600">
                                    <input type="text" name="lastname" value="${s.lastname || ''}" class="w-full bg-gray-700 text-gray-200 px-2 py-1 rounded" readonly>
                                </td>
                                ${assignedLevel === 'senior high' ? `
                                <td class="px-3 py-2 border border-gray-600">
                                    <input type="text" name="strand" value="${s.strand || ''}" class="w-full bg-gray-700 text-gray-200 px-2 py-1 rounded" readonly>
                                </td>` : ''}
                                <td class="px-3 py-2 border border-gray-600">
                                    <input type="text" name="grade_level" value="${s.grade_level || ''}" class="w-full bg-gray-700 text-gray-200 px-2 py-1 rounded" readonly>
                                </td>
                                ${assignedLevel === 'senior high' ? `
                                <td class="px-3 py-2 border border-gray-600">
                                    <input type="text" name="semester" value="${s.semester || ''}" class="w-full bg-gray-700 text-gray-200 px-2 py-1 rounded" readonly>
                                </td>` : ''}
                                <td class="px-3 py-2 border border-gray-600">
                                    <input type="text" name="barangay" value="${s.barangay || ''}" class="w-full bg-gray-700 text-gray-200 px-2 py-1 rounded" readonly>
                                </td>
                                <td class="px-3 py-2 border border-gray-600">
                                    <input type="text" name="municipal_city" value="${s.municipal_city || ''}" class="w-full bg-gray-700 text-gray-200 px-2 py-1 rounded" readonly>
                                </td>
                                <td class="px-3 py-2 border border-gray-600">
                                    <input type="text" name="province" value="${s.province || ''}" class="w-full bg-gray-700 text-gray-200 px-2 py-1 rounded" readonly>
                                </td>
                                <td class="px-3 py-2 border border-gray-600">
                                    <input type="text" name="cellphone" value="${s.cellphone || ''}" class="w-full bg-gray-700 text-gray-200 px-2 py-1 rounded" readonly>
                                </td>
                                <td class="px-3 py-2 border border-gray-600">
                                    <input type="text" name="emailaddress" value="${s.emailaddress || ''}" class="w-full bg-gray-700 text-gray-200 px-2 py-1 rounded" readonly>
                                </td>
                                <td class="px-3 py-2 border border-gray-600 text-center">
                                    <button class="edit-btn bg-blue-600 px-2 py-1 rounded hover:bg-blue-500 text-white">Edit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                `;

                modalContent.appendChild(table);

                // 4. Handle Edit/Save buttons (same as before, just make sure payload uses firstname & lastname)
                table.querySelectorAll(".edit-btn").forEach(btn => {
                    btn.addEventListener("click", async (e) => {
                        const row = e.target.closest("tr");
                        const inputs = row.querySelectorAll("input");
                        const isEditing = e.target.textContent === "Save";

                        if (!isEditing) {
                            inputs.forEach(inp => {
                                inp.removeAttribute("readonly");
                                inp.classList.remove("bg-gray-700", "text-gray-200");
                                inp.classList.add("bg-white", "text-black");
                            });
                            e.target.textContent = "Save";
                            e.target.classList.remove("bg-blue-600");
                            e.target.classList.add("bg-green-600", "hover:bg-green-500");
                        } else {
                            const studentId = row.dataset.id;
                            const payload = {
                                applicant_id: studentId,
                                level: assignedLevel,
                                firstname: row.querySelector('input[name="firstname"]').value.trim(),
                                lastname: row.querySelector('input[name="lastname"]').value.trim(),
                                strand: assignedLevel === 'senior high' ? row.querySelector('input[name="strand"]').value.trim() : '',
                                grade_level: row.querySelector('input[name="grade_level"]').value.trim(),
                                semester: assignedLevel === 'senior high' ? row.querySelector('input[name="semester"]').value.trim() : '',
                                barangay: row.querySelector('input[name="barangay"]').value.trim(),
                                municipal_city: row.querySelector('input[name="municipal_city"]').value.trim(),
                                province: row.querySelector('input[name="province"]').value.trim(),
                                cellphone: row.querySelector('input[name="cellphone"]').value.trim(),
                                emailaddress: row.querySelector('input[name="emailaddress"]').value.trim()
                            };

                            // Basic validation
                            if (!/^\d{11}$/.test(payload.cellphone)) return alert("Cellphone must be exactly 11 digits");
                            if (!payload.emailaddress.includes("@") || !payload.emailaddress.includes(".com")) return alert("Email must contain '@' and end with '.com'");

                            try {
                                const res = await fetch("../php/update_student_info.php", {
                                    method: "POST",
                                    credentials: "include",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(payload)
                                });
                                const data = await res.json();
                                if (data.success) {
                                    alert("Updated successfully!");
                                    inputs.forEach(inp => {
                                        inp.setAttribute("readonly", true);
                                        inp.classList.remove("bg-white", "text-black");
                                        inp.classList.add("bg-gray-700", "text-gray-200");
                                    });
                                    e.target.textContent = "Edit";
                                    e.target.classList.remove("bg-green-600", "hover:bg-green-500");
                                    e.target.classList.add("bg-blue-600", "hover:bg-blue-500");
                                } else {
                                    alert("Update failed: " + data.message);
                                }
                            } catch (err) {
                                console.error(err);
                                alert("Failed to update student info");
                            }
                        }
                    });
                });

            } catch (err) {
                console.error(err);
                alert("Error loading students.");
            }
        });
    }

    // Example function to open edit modal
    function openEditStudentModal(studentId) {
        // You can fetch student details and populate a form in a modal
        console.log("Edit student ID:", studentId);
        // Show another modal with input fields for editing
    }

    // demographic reports
    const demographicsBtn = recordsButtons.querySelector("button:nth-child(4)"); // Adjust if needed
    if (demographicsBtn) {
        demographicsBtn.addEventListener("click", async () => {
            const modal = document.getElementById("records-modal");
            const modalContent = document.getElementById("records-modal-content");
            modalContent.innerHTML = "";
            modal.classList.remove("hidden");

            try {
                // 1. Get assigned level
                const loginRes = await fetch("../php/get_assigned_level.php", { method: "GET", credentials: "include" });
                const loginData = await loginRes.json();
                if (!loginData.success || !loginData.assigned_level) return alert("Unable to determine assigned level.");
                const assignedLevel = loginData.assigned_level;

                // 2. Fetch student demographics
                const demoRes = await fetch(`../php/get_student_demographics.php?level=${encodeURIComponent(assignedLevel)}`, { credentials: "include" });
                const demographics = await demoRes.json();
                if (demographics.error) {
                    modalContent.innerHTML = `<p class="text-red-500">${demographics.error}</p>`;
                    return;
                }

                // 3. Build modal depending on level
                if (assignedLevel.toLowerCase() === "senior high") {
                    // SHS → show strands
                    modalContent.innerHTML = `
                    <h2 class="text-lg font-semibold mb-4 text-white">Demographics Report (Senior High)</h2>
                    <div class="mb-3 text-white">
                        <p><strong>Total Students:</strong> ${demographics.total}</p>
                        <p><strong>Total Male:</strong> ${demographics.male}</p>
                        <p><strong>Total Female:</strong> ${demographics.female}</p>
                    </div>
                    <div class="text-white">
                        <h3 class="font-semibold mb-2">Students per Strand:</h3>
                        <ul>
                            ${Object.entries(demographics.strands || {}).map(([strand, count]) => `<li>${strand}: ${count}</li>`).join('')}
                        </ul>
                    </div>
                `;
                } else if (assignedLevel.toLowerCase() === "junior high") {
                    // JHS → show grade levels
                    modalContent.innerHTML = `
                    <h2 class="text-lg font-semibold mb-4 text-white">Demographics Report (Junior High)</h2>
                    <div class="mb-3 text-white">
                        <p><strong>Total Students:</strong> ${demographics.total}</p>
                        <p><strong>Total Male:</strong> ${demographics.male}</p>
                        <p><strong>Total Female:</strong> ${demographics.female}</p>
                    </div>
                    <div class="text-white">
                        <h3 class="font-semibold mb-2">Students per Grade Level:</h3>
                        <ul>
                            ${Object.entries(demographics.grade_levels || {}).map(([grade, count]) => `<li>Grade ${grade}: ${count}</li>`).join('')}
                        </ul>
                    </div>
                `;
                } else {
                    modalContent.innerHTML = `<p class="text-red-500">Unknown assigned level.</p>`;
                }
            } catch (err) {
                console.error(err);
                alert("Error loading demographics.");
            }
        });
    }

    // teachers list
    const teachersBtn = recordsButtons.querySelector("button:nth-child(5)");
    let editingRow = null;
    let originalData = null;

    function showPopup(message, onSave, onDiscard, onCancel) {
        const overlay = document.createElement("div");
        overlay.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

        const box = document.createElement("div");
        box.className = "bg-white text-black p-6 rounded shadow-lg w-[400px] text-center";

        const msg = document.createElement("p");
        msg.textContent = message;
        msg.className = "mb-4";
        box.appendChild(msg);

        const btnRow = document.createElement("div");
        btnRow.className = "flex justify-around";

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.className = "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500";
        saveBtn.onclick = () => { overlay.remove(); onSave(); };

        const discardBtn = document.createElement("button");
        discardBtn.textContent = "Discard";
        discardBtn.className = "bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500";
        discardBtn.onclick = () => { overlay.remove(); onDiscard(); };

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500";
        cancelBtn.onclick = () => { overlay.remove(); onCancel(); };

        btnRow.appendChild(saveBtn);
        btnRow.appendChild(discardBtn);
        btnRow.appendChild(cancelBtn);
        box.appendChild(btnRow);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    if (teachersBtn) {
        teachersBtn.addEventListener("click", async () => {
            const modal = document.getElementById("records-modal");
            const modalContent = document.getElementById("records-modal-content");
            modalContent.innerHTML = "";
            modal.classList.remove("hidden");

            try {
                const loginRes = await fetch("../php/get_assigned_level.php", { method: "GET", credentials: "include" });
                const loginData = await loginRes.json();
                if (!loginData.success || !loginData.assigned_level) return alert("Unable to determine assigned level.");
                const assignedLevel = loginData.assigned_level;

                const teachersRes = await fetch(`../php/fetch_teachers.php?level=${encodeURIComponent(assignedLevel)}`, { credentials: "include" });
                const resData = await teachersRes.json();
                if (!resData.success) { modalContent.innerHTML = `<p>Failed to fetch teachers.</p>`; return; }
                const teachers = resData.teachers;

                const subjectsRes = await fetch("../php/fetch_subjects.php", { credentials: "include" });
                const subjectsData = await subjectsRes.json();
                let validSubjects = [];
                if (Array.isArray(subjectsData)) validSubjects = subjectsData.map(s => s.name || s);
                else if (subjectsData.subjects && Array.isArray(subjectsData.subjects)) validSubjects = subjectsData.subjects.map(s => s.name || s);

                // --- PDF Export button ---
                const pdfContainer = document.createElement("div");
                pdfContainer.className = "mb-4 flex justify-end"; // align right
                const pdfBtn = document.createElement("button");
                pdfBtn.textContent = "Export as PDF";
                pdfBtn.className = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700";
                pdfContainer.appendChild(pdfBtn);
                modalContent.appendChild(pdfContainer);

                const table = document.createElement("table");
                table.className = "border border-gray-600 text-sm text-gray-200 text-left w-full";
                table.style.tableLayout = "auto";

                table.innerHTML = `
                <thead class="bg-gray-700 text-white">
                    <tr>
                        <th>First Name</th>
                        <th>Middle Name</th>
                        <th>Last Name</th>
                        <th>Assigned Level</th>
                        <th>Subjects</th>
                    </tr>
                </thead>
                <tbody>
                    ${teachers.map(t => `
                        <tr data-id="${t.teacher_id}">
                            <input type="hidden" name="teacher_id" value="${t.teacher_id}">
                            <td><input type="text" name="firstname" value="${t.firstname}" class="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded text-sm" readonly></td>
                            <td><input type="text" name="middlename" value="${t.middlename}" class="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded text-sm" readonly></td>
                            <td><input type="text" name="lastname" value="${t.lastname}" class="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded text-sm" readonly></td>
                            <td>
                                <select name="assigned_level" class="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded text-sm" disabled>
                                    <option value="Junior High" ${t.assigned_level === "Junior High" ? "selected" : ""}>Junior High</option>
                                    <option value="Senior High" ${t.assigned_level === "Senior High" ? "selected" : ""}>Senior High</option>
                                    <option value="Both" ${t.assigned_level === "Both" ? "selected" : ""}>Both</option>
                                </select>
                            </td>
                            <td class="subjects-cell"><input type="text" name="subjects" value="${t.subjects || ''}" class="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded text-sm" readonly></td>
                        </tr>
                    `).join('')}
                </tbody>
                `;

                modalContent.appendChild(table);

                // --- PDF button handler ---
                pdfBtn.addEventListener("click", () => {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    doc.text("Teachers List", 14, 16);

                    // Updated headers without "Action"
                    const headers = [["First Name", "Middle Name", "Last Name", "Assigned Level", "Subjects"]];

                    // Updated body without the edit button
                    const body = Array.from(table.querySelectorAll("tbody tr")).map(row => [
                        row.querySelector('input[name="firstname"]').value,
                        row.querySelector('input[name="middlename"]').value,
                        row.querySelector('input[name="lastname"]').value,
                        row.querySelector('select[name="assigned_level"]').value,
                        row.querySelector('input[name="subjects"]').value
                    ]);

                    doc.autoTable({ head: headers, body: body, startY: 20 });
                    const pdfUrl = doc.output("bloburl");
                    window.open(pdfUrl, "_blank");
                });


                // --- Existing edit logic remains unchanged ---
                table.querySelectorAll(".edit-btn").forEach(btn => {
                    btn.addEventListener("click", async (e) => {
                        const row = e.target.closest("tr");
                        const mainBtn = row.querySelector(".edit-btn");
                        const selectLevel = row.querySelector("select[name='assigned_level']");
                        const subjCell = row.querySelector(".subjects-cell");
                        const subjInput = subjCell.querySelector('input[name="subjects"]');
                        const isEditing = mainBtn.textContent === "Save";

                        if (!isEditing) {
                            if (editingRow && editingRow !== row) { alert("Finish editing the current row first."); return; }
                            originalData = {
                                firstname: row.querySelector('input[name="firstname"]').value,
                                middlename: row.querySelector('input[name="middlename"]').value,
                                lastname: row.querySelector('input[name="lastname"]').value,
                                assigned_level: selectLevel.value,
                                subjects: subjInput.value
                            };
                            row.querySelectorAll("input").forEach(inp => {
                                if (inp.name !== "teacher_id" && inp.name !== "subjects") {
                                    inp.removeAttribute("readonly");
                                    inp.classList.remove("bg-gray-700", "text-gray-200");
                                    inp.classList.add("bg-white", "text-black");
                                }
                            });
                            selectLevel.disabled = false;
                            selectLevel.classList.remove("bg-gray-700", "text-gray-200");
                            selectLevel.classList.add("bg-white", "text-black");

                            const subjectsArray = subjInput.value ? subjInput.value.split(',').map(s => s.trim()) : [];
                            const container = document.createElement("div");
                            container.className = "space-y-2";
                            const createSubjectRow = (selected = "") => {
                                const wrapper = document.createElement("div");
                                wrapper.className = "flex gap-2";
                                const select = document.createElement("select");
                                select.className = "subject-input w-full px-2 py-1 rounded bg-white text-black border border-gray-400";
                                validSubjects.forEach(subj => {
                                    const opt = document.createElement("option");
                                    opt.value = subj; opt.textContent = subj;
                                    if (subj === selected) opt.selected = true;
                                    select.appendChild(opt);
                                });
                                const removeBtn = document.createElement("button");
                                removeBtn.type = "button"; removeBtn.textContent = "❌";
                                removeBtn.className = "px-2 bg-red-600 text-white rounded hover:bg-red-500";
                                removeBtn.onclick = () => wrapper.remove();
                                wrapper.appendChild(select); wrapper.appendChild(removeBtn);
                                return wrapper;
                            };
                            subjectsArray.forEach(s => container.appendChild(createSubjectRow(s)));
                            subjCell.innerHTML = ""; subjCell.appendChild(container);

                            const addBtn = document.createElement("button");
                            addBtn.type = "button"; addBtn.textContent = "Add Subject";
                            addBtn.className = "mt-2 bg-green-600 text-white px-2 py-1 rounded hover:bg-green-500 text-sm";
                            addBtn.onclick = () => container.appendChild(createSubjectRow());
                            subjCell.appendChild(addBtn);

                            mainBtn.textContent = "Save";
                            mainBtn.classList.remove("bg-blue-600");
                            mainBtn.classList.add("bg-green-600", "hover:bg-green-500");
                            editingRow = row;
                        } else {
                            const teacherId = row.dataset.id || row.querySelector('input[name="teacher_id"]').value;
                            const firstname = row.querySelector('input[name="firstname"]').value.trim();
                            const middlename = row.querySelector('input[name="middlename"]').value.trim();
                            const lastname = row.querySelector('input[name="lastname"]').value.trim();
                            const assigned_level = selectLevel.value;
                            const subjectsArray = Array.from(row.querySelectorAll(".subject-input")).map(s => s.value.trim()).filter(s => s !== '');
                            if (!teacherId) return alert("Teacher ID required");

                            const payload = { teacher_id: teacherId, firstname, middlename, lastname, assigned_level, subjects: subjectsArray.join(', ') };

                            try {
                                const res = await fetch("../php/update_teacher_info.php", {
                                    method: "POST", credentials: "include",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(payload)
                                });
                                const data = await res.json();

                                if (data.success) {
                                    alert("Updated successfully!");
                                    row.querySelectorAll("input").forEach(inp => {
                                        if (inp.name !== "teacher_id") { inp.setAttribute("readonly", true); inp.classList.remove("bg-white", "text-black"); inp.classList.add("bg-gray-700", "text-gray-200"); }
                                    });
                                    selectLevel.disabled = true;
                                    selectLevel.classList.remove("bg-white", "text-black");
                                    selectLevel.classList.add("bg-gray-700", "text-gray-200");
                                    subjCell.innerHTML = `<input type="text" name="subjects" value="${subjectsArray.join(', ')}" class="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded text-sm" readonly>`;
                                    mainBtn.textContent = "Edit";
                                    mainBtn.classList.remove("bg-green-600", "hover:bg-green-500");
                                    mainBtn.classList.add("bg-blue-600", "hover:bg-blue-500");
                                    editingRow = null;
                                } else { alert("Update failed: " + (data.message || "Unknown error")); }
                            } catch (err) { console.error(err); alert("Failed to update teacher info: " + err.message); }
                        }
                    });
                });

            } catch (err) { console.error(err); alert("Error loading teachers."); }
        });
    }

    //subjects list
    const subjectsBtn = recordsButtons.querySelector("button:nth-child(6)"); // Subject List button
    if (subjectsBtn) {
        subjectsBtn.addEventListener("click", async () => {
            const modal = document.getElementById("records-modal");
            const modalContent = document.getElementById("records-modal-content");
            modalContent.innerHTML = "";
            modal.classList.remove("hidden");

            try {
                // ✅ Get assigned level
                const levelRes = await fetch("../php/get_assigned_level.php", { credentials: "include" });
                const levelData = await levelRes.json();
                if (!levelData.success || !levelData.assigned_level) {
                    modalContent.innerHTML = `<p>Unable to determine assigned level.</p>`;
                    return;
                }
                const assignedLevel = levelData.assigned_level.toLowerCase();

                // ✅ Fetch subjects
                const subjectsRes = await fetch("../php/fetch_subjects.php", { credentials: "include" });
                const subjectsData = await subjectsRes.json();
                if (!subjectsData.success) {
                    modalContent.innerHTML = `<p>Failed to fetch subjects.</p>`;
                    return;
                }
                let subjects = subjectsData.subjects;

                // --- Container for filters + add button ---
                const topControls = document.createElement("div");
                topControls.className = "flex justify-between items-center mb-4";

                // ➕ Add Subject button
                const addBtn = document.createElement("button");
                addBtn.className = "bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500";
                addBtn.textContent = "Add Subject";
                topControls.appendChild(addBtn);

                // ✅ Only show filters for SHS
                if (assignedLevel === "senior high") {
                    const strandsRes = await fetch("../php/get_strands.php", { credentials: "include" });
                    const strandsData = await strandsRes.json();
                    const strands = strandsData.success ? strandsData.data : [];

                    const filterDiv = document.createElement("div");
                    filterDiv.className = "flex gap-2";

                    const strandSelect = document.createElement("select");
                    strandSelect.className = "px-2 py-1 rounded bg-gray-700 text-white";
                    strandSelect.innerHTML = `<option value="">All Strands</option>` +
                        strands.map(s => `<option value="${s}">${s}</option>`).join("");
                    filterDiv.appendChild(strandSelect);

                    const yearSelect = document.createElement("select");
                    yearSelect.className = "px-2 py-1 rounded bg-gray-700 text-white";
                    yearSelect.innerHTML = `
                        <option value="">All Years</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                    `;
                    filterDiv.appendChild(yearSelect);

                    const semSelect = document.createElement("select");
                    semSelect.className = "px-2 py-1 rounded bg-gray-700 text-white";
                    semSelect.innerHTML = `
                        <option value="">All Semesters</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                    `;
                    filterDiv.appendChild(semSelect);

                    topControls.appendChild(filterDiv);

                    strandSelect.addEventListener("change", filterSubjects);
                    yearSelect.addEventListener("change", filterSubjects);
                    semSelect.addEventListener("change", filterSubjects);

                    function filterSubjects() {
                        const strand = strandSelect.value.trim().toUpperCase();
                        const year = yearSelect.value;
                        const sem = semSelect.value;

                        const filtered = subjects.filter(s => {
                            const code = s.subcode?.trim() || "";
                            const match = code.match(/^([A-Z ]+)(\d{3})$/i);
                            if (!match) return false;

                            const codeStrand = match[1].trim().toUpperCase();
                            const codeDigits = match[2];

                            const codeYearDigit = codeDigits[0];
                            const codeSem = codeDigits[1];
                            const codeYear = codeYearDigit === "1" ? "11" : "12";

                            return (!strand || codeStrand === strand) &&
                                (!year || codeYear === year) &&
                                (!sem || codeSem === sem);
                        });

                        renderTable(filtered);
                    }
                }

                modalContent.appendChild(topControls);

                // ✅ Table
                const table = document.createElement("table");
                table.className = "w-full border border-gray-600 text-sm text-gray-200";
                table.id = "subjects-table";
                modalContent.appendChild(table);

                function renderTable(list) {
                    if (assignedLevel === "junior high") {
                        table.innerHTML = `
                        <thead class="bg-gray-700 text-white">
                            <tr>
                                <th>Name</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.map(s => `
                                <tr data-id="${s.subject_id}"> <!-- ✅ use subject_id -->
                                    <td><input type="text" value="${s.name}" 
                                        class="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600" readonly></td>
                                    <td class="text-center">
                                        <button class="delete-btn bg-red-600 px-2 py-1 rounded hover:bg-red-500 text-white">Delete</button>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    `;
                    } else {
                        table.innerHTML = `
                        <thead class="bg-gray-700 text-white">
                            <tr>
                                <th>Subcode</th>
                                <th>Name</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.map(s => `
                                <tr data-id="${s.subject_id}"> <!-- ✅ SHS uses subject_id -->
                                    <td><input type="text" value="${s.subcode}" 
                                        class="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600" readonly></td>
                                    <td><input type="text" value="${s.name}" 
                                        class="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600" readonly></td>
                                    <td class="text-center">
                                        <button class="delete-btn bg-red-600 px-2 py-1 rounded hover:bg-red-500 text-white">Delete</button>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    `;
                    }

                    // Delete buttons
                    table.querySelectorAll(".delete-btn").forEach(btn => {
                        btn.addEventListener("click", async (e) => {
                            const row = e.target.closest("tr");
                            const subject_id = Number(row.dataset.id); // ✅ convert to number
                            const level = assignedLevel.toLowerCase(); // ✅ lowercase for PHP

                            if (!confirm("Are you sure you want to delete this subject?")) return;

                            const originalHTML = row.innerHTML;
                            row.innerHTML = `<td colspan="3" class="text-center text-yellow-400">Deleting...</td>`;

                            try {
                                const res = await fetch("../php/delete_subject.php", {
                                    method: "POST",
                                    credentials: "include",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: subject_id, level }) // ✅ send numeric id
                                });

                                if (!res.ok) throw new Error("Network error");

                                const text = await res.text();
                                console.log("Raw response from delete_subject.php:", text);

                                let data;
                                try {
                                    data = JSON.parse(text);
                                } catch (err) {
                                    alert("Server did not return valid JSON:\n" + text);
                                    row.innerHTML = originalHTML;
                                    return;
                                }

                                if (data.success) {
                                    row.remove();
                                } else {
                                    alert("Failed to delete: " + data.message);
                                    row.innerHTML = originalHTML;
                                }
                            } catch (err) {
                                console.error(err);
                                alert("Error deleting subject.");
                                row.innerHTML = originalHTML;
                            }
                        });
                    });
                }

                // Initial render
                renderTable(subjects);

                // --- Add subject ---
                addBtn.addEventListener("click", () => {
                    const newRow = document.createElement("tr");
                    if (assignedLevel === "junior high") {
                        newRow.innerHTML = `
                        <td><input type="text" name="name" 
                            class="w-full px-2 py-1 rounded border border-gray-600 bg-gray-800 text-white"></td>
                        <td class="text-center">
                            <button class="save-new-btn bg-blue-600 px-2 py-1 rounded hover:bg-blue-500 text-white">Save</button>
                        </td>
                    `;
                    } else {
                        newRow.innerHTML = `
                        <td><input type="text" name="subcode" 
                            class="w-full px-2 py-1 rounded border border-gray-600 bg-gray-800 text-white"></td>
                        <td><input type="text" name="name" 
                            class="w-full px-2 py-1 rounded border border-gray-600 bg-gray-800 text-white"></td>
                        <td class="text-center">
                            <button class="save-new-btn bg-blue-600 px-2 py-1 rounded hover:bg-blue-500 text-white">Save</button>
                        </td>
                    `;
                    }
                    table.querySelector("tbody").appendChild(newRow);

                    newRow.querySelector(".save-new-btn").addEventListener("click", async () => {
                        const subcode = newRow.querySelector('input[name="subcode"]')?.value.trim();
                        const name = newRow.querySelector('input[name="name"]').value.trim();

                        if (!name || (assignedLevel === "senior high" && !subcode)) {
                            return alert("All fields are required.");
                        }

                        try {
                            const res = await fetch("../php/add_subject.php", {
                                method: "POST",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ subcode, name, level: assignedLevel.toLowerCase() })
                            });

                            const text = await res.text();
                            console.log("Raw response from add_subject.php:", text);

                            let data;
                            try {
                                data = JSON.parse(text);
                            } catch (e) {
                                alert("Server did not return valid JSON:\n" + text);
                                return;
                            }

                            if (data.success) {
                                alert("Subject added!");
                                subjects.push({ subject_id: data.id, subcode, name });
                                renderTable(subjects);
                            } else {
                                alert("Failed to add subject: " + data.message);
                            }
                        } catch (err) {
                            console.error(err);
                            alert("Failed to add subject");
                        }
                    });
                });

            } catch (err) {
                console.error(err);
                alert("Error loading subjects.");
            }
        });
    }

    //classlist
    if (recordsButtons) {
        const classListBtn = recordsButtons.querySelector("button:last-child"); // Class List button
        if (classListBtn) {
            classListBtn.addEventListener("click", async () => {
                const modal = document.getElementById("records-modal");
                const modalContent = document.getElementById("records-modal-content");
                modalContent.innerHTML = "";
                modal.classList.remove("hidden");
    
                try {
                    // Fetch sections
                    const sectionsRes = await fetch("../php/fetch_section.php", { credentials: "include" });
                    const sectionsData = await sectionsRes.json();
    
                    if (!sectionsData || sectionsData.error) {
                        modalContent.innerHTML = `<p>Failed to load sections: ${sectionsData?.error || "Unknown error"}</p>`;
                        return;
                    }
    
                    // Dropdown container
                    const dropdownDiv = document.createElement("div");
                    dropdownDiv.className = "flex items-center gap-2 mb-4";
    
                    const sectionSelect = document.createElement("select");
                    sectionSelect.className = "px-2 py-1 rounded bg-gray-700 text-white";
                    sectionSelect.innerHTML = `<option value="">Select Section</option>` +
                        sectionsData.map(s => `<option value="${s.section_id}">${s.section_name} (Grade ${s.grade_level})</option>`).join("");
    
                    const exportBtn = document.createElement("button");
                    exportBtn.className = "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500";
                    exportBtn.textContent = "Export PDF";
    
                    dropdownDiv.appendChild(sectionSelect);
                    dropdownDiv.appendChild(exportBtn);
                    modalContent.appendChild(dropdownDiv);
    
                    // PDF export
                    exportBtn.addEventListener("click", async () => {
                        const sectionId = sectionSelect.value;
                        if (!sectionId) return alert("Please select a section.");
    
                        try {
                            const res = await fetch(`../php/fetch_classlist.php?section_id=${sectionId}`, { credentials: "include" });
                            const data = await res.json();
    
                            if (!data.success) return alert(data.message || "Failed to fetch class list.");
    
                            const { schoolYear, gradeLevel, section, adviser, strand, students, preparedBy, date } = data;
                            const { jsPDF } = window.jspdf;
                            const doc = new jsPDF();
    
                            // Header
                            doc.setFontSize(12);
                            doc.text(`School Year: ${schoolYear}`, 14, 16);
                            doc.text(`Grade Level / Year: ${gradeLevel}`, 14, 24);
                            doc.text(`Section: ${section}`, 14, 32);
                            doc.text(`Adviser / Teacher(s): ${adviser || "N/A"}`, 14, 40);
                            if (strand) doc.text(`Strand: ${strand}`, 14, 48);
    
                            // Table body
                            const tableBody = (students && students.length > 0)
                                ? students.map((s, index) => [
                                    index + 1,
                                    s.student_name || "",
                                    s.gender || "",
                                    s.birth_date || ""
                                ])
                                : [["No students found", "", "", ""]];
    
                            doc.autoTable({
                                head: [["No.", "Student Name", "Gender", "Birth Date"]],
                                body: tableBody,
                                startY: 56
                            });
    
                            // Footer
                            const finalY = doc.lastAutoTable.finalY || 56;
                            doc.text(`Total Students: ${students.length}`, 14, finalY + 10);
                            doc.text(`Prepared by: ${preparedBy}`, 14, finalY + 18);
                            doc.text(`Date: ${date}`, 14, finalY + 26);
    
                            window.open(doc.output("bloburl"), "_blank");
    
                        } catch (err) {
                            console.error(err);
                            alert("Error generating PDF.");
                        }
                    });
    
                } catch (err) {
                    console.error(err);
                    modalContent.innerHTML = `<p>Error loading class list.</p>`;
                }
            });
        }
    }
    
});



