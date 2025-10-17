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
            // Export PDF button click handler
            pdfBtn.addEventListener("click", async () => {
                const table = document.getElementById("records-table");
                if (!table) {
                    alert("No table to export.");
                    return;
                }

                try {
                    // Fetch logged-in user info
                    const userRes = await fetch("../php/get_user_info.php", { credentials: "include" });
                    const userData = await userRes.json();

                    const preparedBy = (userData.success) ? `${userData.firstname} ${userData.lastname}` : "N/A";
                    const gradeLevel = select.value ? `Grade ${select.value}` : "N/A";
                    const date = new Date().toLocaleDateString();

                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({ orientation: "landscape" });

                    // Header
                    doc.setFontSize(12);
                    doc.text(`Grade Level: ${gradeLevel}`, 14, 16);
                    doc.text(`Prepared By: ${preparedBy}`, 14, 24);
                    doc.text(`Date: ${date}`, 14, 32);

                    // Table
                    doc.autoTable({ html: "#records-table", startY: 40 });

                    // Open PDF in new tab
                    window.open(doc.output("bloburl"), "_blank");

                } catch (err) {
                    console.error(err);
                    alert("Failed to generate PDF.");
                }
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
    const auditBtn = recordsButtons.querySelector("button:nth-child(3)"); // Audit button

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

                // 3. Dropdown for export
                const exportDiv = document.createElement("div");
                exportDiv.className = "flex items-center gap-2 mb-4";

                const exportBtn = document.createElement("button");
                exportBtn.className = "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500";
                exportBtn.textContent = "Export PDF";

                exportDiv.appendChild(exportBtn);
                modalContent.appendChild(exportDiv);

                // 4. Create table
                const table = document.createElement("table");
                table.className = "w-full border border-gray-600 text-sm text-gray-200";
                table.id = "records-table";

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
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => `
                        <tr>
                            <td class="px-3 py-2 border border-gray-600">${s.firstname || ''}</td>
                            <td class="px-3 py-2 border border-gray-600">${s.lastname || ''}</td>
                            ${assignedLevel === 'senior high' ? `<td class="px-3 py-2 border border-gray-600">${s.strand || ''}</td>` : ''}
                            <td class="px-3 py-2 border border-gray-600">${s.grade_level || ''}</td>
                            ${assignedLevel === 'senior high' ? `<td class="px-3 py-2 border border-gray-600">${s.semester || ''}</td>` : ''}
                            <td class="px-3 py-2 border border-gray-600">${s.barangay || ''}</td>
                            <td class="px-3 py-2 border border-gray-600">${s.municipal_city || ''}</td>
                            <td class="px-3 py-2 border border-gray-600">${s.province || ''}</td>
                            <td class="px-3 py-2 border border-gray-600">${s.cellphone || ''}</td>
                            <td class="px-3 py-2 border border-gray-600">${s.emailaddress || ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;

                modalContent.appendChild(table);

                // 5. Export PDF
                exportBtn.addEventListener("click", async () => {
                    try {
                        // Get logged-in user info
                        const userRes = await fetch("../php/get_user_info.php", { credentials: "include" });
                        const userData = await userRes.json();
                        const preparedBy = userData.success ? `${userData.firstname} ${userData.lastname}` : "Admin";

                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF({ orientation: "landscape" });

                        doc.setFontSize(12);
                        doc.text(`Prepared by: ${preparedBy}`, 14, 16);
                        doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 24);

                        // Build table for PDF
                        const headers = ["First Name", "Last Name"];
                        if (assignedLevel === 'senior high') headers.push("Strand");
                        headers.push("Grade Level");
                        if (assignedLevel === 'senior high') headers.push("Semester");
                        headers.push("Barangay", "Municipal/City", "Province", "Cellphone", "Email");

                        const bodyData = students.map(s => {
                            const row = [s.firstname || '', s.lastname || ''];
                            if (assignedLevel === 'senior high') row.push(s.strand || '');
                            row.push(s.grade_level || '');
                            if (assignedLevel === 'senior high') row.push(s.semester || '');
                            row.push(s.barangay || '', s.municipal_city || '', s.province || '', s.cellphone || '', s.emailaddress || '');
                            return row;
                        });

                        doc.autoTable({
                            head: [headers],
                            body: bodyData,
                            startY: 32
                        });

                        window.open(doc.output("bloburl"), "_blank");

                    } catch (err) {
                        console.error(err);
                        alert("Error generating PDF.");
                    }
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
    const demographicsBtn = recordsButtons.querySelector("button:nth-child(4)");
    if (demographicsBtn) {
        demographicsBtn.addEventListener("click", async () => {
            const modal = document.getElementById("records-modal");
            const modalContent = document.getElementById("records-modal-content");
            modalContent.innerHTML = "";
            modal.classList.remove("hidden");

            try {
                const loginRes = await fetch("../php/get_assigned_level.php", { method: "GET", credentials: "include" });
                const loginData = await loginRes.json();
                if (!loginData.success || !loginData.assigned_level) return alert("Unable to determine assigned level.");
                const assignedLevel = loginData.assigned_level;

                const demoRes = await fetch(`../php/get_student_demographics.php?level=${encodeURIComponent(assignedLevel)}`, { credentials: "include" });
                const demographics = await demoRes.json();
                if (demographics.error) {
                    modalContent.innerHTML = `<p class="text-red-500">${demographics.error}</p>`;
                    return;
                }

                // --- Single dropdown creator ---
                const createDropdown = (label, listOrObject) => {
                    if (!Array.isArray(listOrObject)) return "";
                    const listHTML = listOrObject.length
                        ? listOrObject.map(st => `<tr>
                            <td>${st.firstname}</td>
                            <td>${st.lastname}</td>
                            <td>${st.lrn || st.Irn || ''}</td>
                            <td>${st.cellphone || ''}</td>
                            <td>${st.street_house || st['street house'] || ''}, ${st.barangay || ''}, ${st.municipal_city || ''}, ${st.province || ''}</td>
                        </tr>`).join('')
                        : "<tr><td colspan='5' style='text-align:center;'>No students</td></tr>";

                    return `
                        <div class="mb-3 border border-gray-700 rounded-lg overflow-hidden dropdown-wrapper">
                            <div class="flex items-center justify-between bg-gray-800 px-4 py-2">
                                <button class="text-left text-white font-semibold hover:bg-gray-700 toggle-dropdown flex-1">
                                    ${label} (${listOrObject.length})
                                </button>
                                <button class="open-pdf-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded ml-2"
                                    data-title="${label}" data-list='${JSON.stringify(listOrObject)}'>
                                    Open PDF
                                </button>
                            </div>
                            <div class="dropdown-content hidden bg-gray-900 text-white px-4 py-2">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th class="border-b border-gray-700 px-2 py-1">First Name</th>
                                            <th class="border-b border-gray-700 px-2 py-1">Last Name</th>
                                            <th class="border-b border-gray-700 px-2 py-1">LRN</th>
                                            <th class="border-b border-gray-700 px-2 py-1">Phone</th>
                                            <th class="border-b border-gray-700 px-2 py-1">Address</th>
                                        </tr>
                                    </thead>
                                    <tbody>${listHTML}</tbody>
                                </table>
                            </div>
                        </div>
                    `;
                };

                // --- Nested dropdown ---
                const createNestedDropdown = (label, groupedData) => {
                    if (!groupedData || Object.keys(groupedData).length === 0) return "";

                    const inner = Object.entries(groupedData).map(([key, students]) => `
                        <div class="ml-4 mb-2 border border-gray-700 rounded-lg overflow-hidden dropdown-wrapper">
                            <div class="flex items-center justify-between bg-gray-700 px-3 py-2">
                                <button class="text-left text-white font-medium hover:bg-gray-600 toggle-dropdown flex-1">
                                    ${key} (${students.length})
                                </button>
                                <button class="open-pdf-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded ml-2"
                                    data-title="${key}" data-list='${JSON.stringify(students)}'>
                                    Open PDF
                                </button>
                            </div>
                            <div class="dropdown-content hidden bg-gray-900 text-white px-4 py-2">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th class="border-b border-gray-700 px-2 py-1">First Name</th>
                                            <th class="border-b border-gray-700 px-2 py-1">Last Name</th>
                                            <th class="border-b border-gray-700 px-2 py-1">LRN</th>
                                            <th class="border-b border-gray-700 px-2 py-1">Phone</th>
                                            <th class="border-b border-gray-700 px-2 py-1">Address</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${students.length > 0
                            ? students.map(st => `<tr>
                                                <td>${st.firstname}</td>
                                                <td>${st.lastname}</td>
                                                <td>${st.lrn || st.Irn || ''}</td>
                                                <td>${st.cellphone || ''}</td>
                                                <td>${st.street_house || st['street house'] || ''}, ${st.barangay || ''}, ${st.municipal_city || ''}, ${st.province || ''}</td>
                                            </tr>`).join('')
                            : "<tr><td colspan='5' style='text-align:center;'>No students</td></tr>"
                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `).join('');

                    return `
                        <div class="mb-3 border border-gray-700 rounded-lg overflow-hidden dropdown-wrapper">
                            <div class="flex items-center justify-between bg-gray-800 px-4 py-2">
                                <button class="text-left text-white font-semibold hover:bg-gray-700 toggle-dropdown flex-1">
                                    ${label}
                                </button>
                            </div>
                            <div class="dropdown-content hidden bg-gray-900 px-2 py-2">${inner}</div>
                        </div>
                    `;
                };

                // --- Main content ---
                let dropdowns = `
                    ${createDropdown("All Students", demographics.students || [])}
                    ${createDropdown("Male Students", demographics.male_students || [])}
                    ${createDropdown("Female Students", demographics.female_students || [])}
                    ${createDropdown("Declined Students", demographics.declined_students || [])}
                    ${createDropdown("Dropped Students", demographics.dropped_students || [])}
                `;

                if (assignedLevel.toLowerCase() === "senior high") {
                    dropdowns += createNestedDropdown("Students per Strand", demographics.students_per_strand || {});
                    dropdowns += createNestedDropdown("Students per Year Level", demographics.students_per_year_level || {});
                } else if (assignedLevel.toLowerCase() === "junior high") {
                    dropdowns += createNestedDropdown("Students per Grade Level", demographics.students_per_grade || {});
                }

                modalContent.innerHTML = `
                    <div class="max-h-[70vh] overflow-y-auto space-y-4 p-2">
                        <h2 class="text-lg font-semibold mb-4 text-white text-center">Student Demographics (${assignedLevel})</h2>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-white text-center">
                            <div class="bg-gray-800 p-3 rounded-lg"><p class="text-sm">Total Students</p><p class="text-xl font-bold">${demographics.total_students || 0}</p></div>
                            <div class="bg-gray-800 p-3 rounded-lg"><p class="text-sm">Male</p><p class="text-xl font-bold">${demographics.total_male || 0}</p></div>
                            <div class="bg-gray-800 p-3 rounded-lg"><p class="text-sm">Female</p><p class="text-xl font-bold">${demographics.total_female || 0}</p></div>
                        </div>
                        ${dropdowns}
                    </div>
                `;

                // --- Toggle dropdowns: only one open at a time ---
                modalContent.querySelectorAll(".toggle-dropdown").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const wrapper = btn.closest(".dropdown-wrapper");
                        if (!wrapper) return;

                        // Close all other dropdowns
                        modalContent.querySelectorAll(".dropdown-wrapper .dropdown-content").forEach(c => {
                            if (!wrapper.contains(c)) c.classList.add("hidden");
                        });

                        // Toggle this one
                        const content = wrapper.querySelector(".dropdown-content");
                        if (content) content.classList.toggle("hidden");
                    });
                });

                // --- Open PDF using jsPDF ---
                // --- Open PDF in new tab ---
                modalContent.querySelectorAll(".open-pdf-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const { jsPDF } = window.jspdf;
                        const title = btn.dataset.title;
                        const list = JSON.parse(btn.dataset.list || "[]");

                        const doc = new jsPDF();
                        doc.setFontSize(16);
                        doc.text("Sulivan National High School", 105, 15, { align: "center" });
                        doc.setFontSize(14);
                        doc.text(`${title} (${list.length})`, 105, 25, { align: "center" });

                        // Table headers and data
                        const headers = [["#", "First Name", "Last Name", "LRN", "Phone", "Address"]];
                        const data = list.map((st, i) => [
                            i + 1,
                            st.firstname,
                            st.lastname,
                            st.lrn || st.Irn || "",
                            st.cellphone || "",
                            `${st.street_house || st['street house'] || ''}, ${st.barangay || ''}, ${st.municipal_city || ''}, ${st.province || ''}`
                        ]);

                        doc.autoTable({
                            startY: 35,
                            head: headers,
                            body: data,
                            styles: { fontSize: 10 },
                            headStyles: { fillColor: [200, 200, 200] }
                        });

                        // Open PDF in new tab
                        doc.output('dataurlnewwindow', { filename: `${title}.pdf` });
                    });
                });


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
                const levelRes = await fetch("../php/get_assigned_level.php", { credentials: "include" });
                const levelData = await levelRes.json();
                if (!levelData.success || !levelData.assigned_level) {
                    modalContent.innerHTML = `<p>Unable to determine assigned level.</p>`;
                    return;
                }
                const assignedLevel = levelData.assigned_level.toLowerCase();

                const subjectsRes = await fetch("../php/fetch_subjects.php", { credentials: "include" });
                const subjectsData = await subjectsRes.json();
                if (!subjectsData.success) {
                    modalContent.innerHTML = `<p>Failed to fetch subjects.</p>`;
                    return;
                }
                let subjects = subjectsData.subjects;

                const topControls = document.createElement("div");
                topControls.className = "flex justify-between items-center mb-4";

                // 📄 Export PDF button
                const exportBtn = document.createElement("button");
                exportBtn.className = "bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500";
                exportBtn.textContent = "Export as PDF";
                topControls.appendChild(exportBtn);

                let strandSelect, yearSelect, semSelect;

                if (assignedLevel === "senior high") {
                    const strandsRes = await fetch("../php/get_strands.php", { credentials: "include" });
                    const strandsData = await strandsRes.json();
                    const strands = strandsData.success ? strandsData.data : [];

                    const filterDiv = document.createElement("div");
                    filterDiv.className = "flex gap-2";

                    strandSelect = document.createElement("select");
                    strandSelect.className = "px-2 py-1 rounded bg-gray-700 text-white";
                    strandSelect.innerHTML = `<option value="">All Strands</option>` +
                        strands.map(s => `<option value="${s}">${s}</option>`).join("");
                    filterDiv.appendChild(strandSelect);

                    yearSelect = document.createElement("select");
                    yearSelect.className = "px-2 py-1 rounded bg-gray-700 text-white";
                    yearSelect.innerHTML = `
                        <option value="">All Years</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                    `;
                    filterDiv.appendChild(yearSelect);

                    semSelect = document.createElement("select");
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
                                </tr>
                            </thead>
                            <tbody>
                                ${list.map(s => `
                                    <tr>
                                        <td class="px-2 py-1 border border-gray-600">${s.name}</td>
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
                                </tr>
                            </thead>
                            <tbody>
                                ${list.map(s => `
                                    <tr>
                                        <td class="px-2 py-1 border border-gray-600">${s.subcode}</td>
                                        <td class="px-2 py-1 border border-gray-600">${s.name}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        `;
                    }
                }

                renderTable(subjects);

                // 📄 Export PDF in a NEW TAB
                exportBtn.addEventListener("click", () => {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();

                    let title = "Subject List";

                    if (assignedLevel === "senior high") {
                        const strand = strandSelect?.value || "All Strands";
                        const year = yearSelect?.value ? `Grade ${yearSelect.value}` : "All Years";
                        const sem = semSelect?.value ? `Semester ${semSelect.value}` : "All Semesters";
                        title = `Subjects - ${strand} | ${year} | ${sem}`;
                    }

                    doc.text(title, 14, 16);
                    doc.autoTable({
                        html: "#subjects-table",
                        startY: 22,
                        styles: { fontSize: 10 }
                    });

                    // ✅ Open in new tab instead of auto-download
                    const pdfBlob = doc.output("blob");
                    const pdfURL = URL.createObjectURL(pdfBlob);
                    window.open(pdfURL, "_blank");
                });

            } catch (err) {
                console.error(err);
                alert("Error loading subjects.");
            }
        });
    }


    //classlist
    if (recordsButtons) {
        const classListBtn = recordsButtons.querySelector("button:nth-child(7)");
        if (classListBtn) {
            classListBtn.addEventListener("click", async () => {
                const modal = document.getElementById("records-modal");
                const modalContent = document.getElementById("records-modal-content");
                modalContent.innerHTML = "";
                modal.classList.remove("hidden");

                try {
                    const sectionsRes = await fetch("../php/fetch_section.php", { credentials: "include" });
                    const sectionsData = await sectionsRes.json();

                    if (!sectionsData || sectionsData.error) {
                        modalContent.innerHTML = `<p>Failed to load sections: ${sectionsData?.error || "Unknown error"}</p>`;
                        return;
                    }

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

                    exportBtn.addEventListener("click", async () => {
                        const sectionId = sectionSelect.value;
                        if (!sectionId) return alert("Please select a section.");

                        try {
                            const res = await fetch(`../php/fetch_classlist.php?section_id=${sectionId}`, { credentials: "include" });
                            const data = await res.json();

                            if (!data.success) return alert(data.message || "Failed to fetch class list.");

                            const { schoolYear, gradeLevel, section, adviser, students, preparedBy, date } = data;
                            const { jsPDF } = window.jspdf;
                            const doc = new jsPDF('landscape');

                            // Header - side by side
                            doc.setFontSize(12);
                            doc.text(`School Year: ${schoolYear}`, 14, 16);
                            doc.text(`Grade Level: ${gradeLevel}`, 80, 16);
                            doc.text(`Section: ${section}`, 140, 16);
                            doc.text(`Adviser: ${adviser || "N/A"}`, 200, 16);

                            // Separate students by gender
                            const maleStudents = students.filter(s => s.gender?.toLowerCase() === 'male');
                            const femaleStudents = students.filter(s => s.gender?.toLowerCase() === 'female');
                            const maxRows = Math.max(maleStudents.length, femaleStudents.length);

                            // Combine male and female into one row
                            const tableBody = [];
                            for (let i = 0; i < maxRows; i++) {
                                const male = maleStudents[i]?.student_name || "";
                                const female = femaleStudents[i]?.student_name || "";
                                tableBody.push([i + 1, male, i + 1, female]);
                            }

                            doc.autoTable({
                                head: [["No.", "Male Student", "No.", "Female Student"]],
                                body: tableBody,
                                startY: 24,
                                styles: { fontSize: 10 },
                                headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
                                columnStyles: {
                                    0: { halign: 'center', cellWidth: 10 },
                                    1: { halign: 'left', cellWidth: 80 },
                                    2: { halign: 'center', cellWidth: 10 },
                                    3: { halign: 'left', cellWidth: 80 }
                                }
                            });

                            const finalY = doc.lastAutoTable.finalY || 24;
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


// schedule per section
const recordsButtons = document.getElementById("records-buttons");

if (recordsButtons) {
    const scheduleBtn = recordsButtons.querySelector("button:last-child"); // Schedule Per Section button

    if (scheduleBtn) {
        scheduleBtn.addEventListener("click", async () => {
            const modal = document.getElementById("records-modal");
            const modalContent = document.getElementById("records-modal-content");
            modalContent.innerHTML = "";
            modal.classList.remove("hidden");

            modalContent.innerHTML = "<p class='text-gray-300'>Loading sections...</p>";

            try {
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
                modalContent.innerHTML = "";
                modalContent.appendChild(dropdownDiv);

                const scheduleDiv = document.createElement("div");
                scheduleDiv.className = "overflow-auto h-[400px]";
                modalContent.appendChild(scheduleDiv);

                let currentSchedules = []; // store schedules for PDF

                sectionSelect.addEventListener("change", async () => {
                    const sectionId = sectionSelect.value;
                    if (!sectionId) {
                        scheduleDiv.innerHTML = "<p class='text-gray-300'>Select a section to see the schedule.</p>";
                        return;
                    }

                    try {
                        const res = await fetch("../php/get_schedule_by_section.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ section_id: sectionId })
                        });
                        const data = await res.json();

                        if (data.status !== "success") {
                            scheduleDiv.innerHTML = `<p>${data.message}</p>`;
                            return;
                        }

                        currentSchedules = data.schedules; // store for PDF
                        const schedules = currentSchedules;

                        if (schedules.length === 0) {
                            scheduleDiv.innerHTML = "<p>No schedules found for this section.</p>";
                            return;
                        }

                        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                        const times = [...new Set(schedules.map(s => s.time_start + " - " + s.time_end))].sort();

                        let tableHTML = `
                            <table class="w-full border border-gray-600 text-sm text-gray-200">
                                <thead class="bg-gray-700 text-white sticky top-0">
                                    <tr>
                                        <th class="px-2 py-2">Time</th>
                                        ${days.map(d => `<th class="px-2 py-2">${d}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                        `;

                        times.forEach(time => {
                            tableHTML += `<tr class="border-b border-gray-700 hover:bg-gray-700 transition">
                                <td class="px-2 py-1 text-center font-semibold">${time}</td>`;
                            days.forEach(day => {
                                const cell = schedules.find(s => (s.time_start + " - " + s.time_end) === time && s.day_of_week === day);
                                if (cell) {
                                    tableHTML += `<td class="px-2 py-1 text-center">
                                        <div>${cell.subject_name}</div>
                                        <div class="text-gray-400 text-xs">${cell.teacher_name}</div>
                                    </td>`;
                                } else {
                                    tableHTML += `<td class="px-2 py-1 text-center">-</td>`;
                                }
                            });
                            tableHTML += `</tr>`;
                        });

                        tableHTML += `</tbody></table>`;
                        scheduleDiv.innerHTML = tableHTML;

                    } catch (err) {
                        console.error(err);
                        scheduleDiv.innerHTML = "<p>Error loading schedule.</p>";
                    }
                });

                // Export PDF button
                exportBtn.addEventListener("click", async () => {
                    const sectionId = sectionSelect.value;
                    if (!sectionId || currentSchedules.length === 0) return alert("Please select a section first.");

                    try {
                        // Fetch logged-in user info
                        const userRes = await fetch("../php/get_user_info.php", { credentials: "include" });
                        const userData = await userRes.json();
                        const preparedBy = userData.success ? `${userData.firstname} ${userData.lastname}` : "Admin";

                        const sectionName = sectionSelect.options[sectionSelect.selectedIndex]?.text || "";
                        const currentDate = new Date().toLocaleDateString(); // Date Generated

                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF({ orientation: "landscape" });

                        doc.setFontSize(12);
                        doc.text(`Section: ${sectionName}`, 14, 16);
                        doc.text(`Prepared by: ${preparedBy}`, 14, 24);
                        doc.text(`Date Generated: ${currentDate}`, 14, 32);

                        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                        const times = [...new Set(currentSchedules.map(s => s.time_start + " - " + s.time_end))].sort();

                        const bodyData = times.map(time => {
                            return [
                                time,
                                ...days.map(day => {
                                    const cell = currentSchedules.find(s => (s.time_start + " - " + s.time_end) === time && s.day_of_week === day);
                                    return cell ? `${cell.subject_name}\n(${cell.teacher_name})` : "-";
                                })
                            ];
                        });

                        doc.autoTable({
                            head: [["Time", ...days]],
                            body: bodyData,
                            startY: 40
                        });

                        window.open(doc.output("bloburl"), "_blank");

                    } catch (err) {
                        console.error(err);
                        alert("Error generating PDF.");
                    }
                });

            } catch (err) {
                console.error(err);
                modalContent.innerHTML = `<p>Error loading sections.</p>`;
            }
        });
    }
}

