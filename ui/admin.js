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

// Inject conflict-cell CSS if not already added
(function () {
    if (!document.getElementById("conflict-style")) {
        const style = document.createElement("style");
        style.id = "conflict-style";
        style.textContent = `
        .conflict-cell {
            position: relative;
            background-color: #ffe6e6;
        }
        
        .conflict-bubble {
            margin-top: 4px;
            background: #f44336;
            color: #fff;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
            white-space: nowrap;
        }     
    `;

        document.head.appendChild(style);
    }
})();

//profile
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch("../php/get_user_info.php");
        const data = await res.json();

        if (data.success) {
            const fullName = data.firstname + " " + data.lastname;

            // Update the top profile button
            const profileBtnSpan = document.querySelector("#adminProfileBtn span");
            if (profileBtnSpan) {
                profileBtnSpan.textContent = fullName;
            }

            // Update the sidebar profile info
            const sidebarName = document.querySelector(".flex.items-center p.font-semibold");
            const sidebarEmail = document.querySelector(".flex.items-center p.text-sm");
            if (sidebarName) sidebarName.textContent = fullName;
            if (sidebarEmail) sidebarEmail.textContent = data.email;
        } else {
            console.error("Failed to get user info:", data.message);
        }
    } catch (err) {
        console.error("Error fetching user info:", err);
    }
});






// Function to handle viewing enrolled student details
function viewEnrolledStudentDetails(buttonElement) {
    // Get the parent row of the clicked button
    const row = buttonElement.closest('tr');
    if (row) {
        // Extract data from the row cells using data attributes
        const strand = row.querySelector('[data-strand]').dataset.strand;
        const name = row.querySelector('[data-name]').dataset.name;
        const contact = row.querySelector('[data-contact]').dataset.contact;
        const email = row.querySelector('[data-email]').dataset.email;

        // Get references to the detail elements in the enrolled-student-details-pane
        const detailStrand = document.getElementById('enrolled-detail-strand');
        const detailName = document.getElementById('enrolled-detail-name');
        const detailContact = document.getElementById('enrolled-detail-contact');
        const detailEmail = document.getElementById('enrolled-detail-email');

        // Populate the detail elements with data
        detailStrand.textContent = strand;
        detailName.textContent = name;
        detailContact.textContent = contact;
        detailEmail.textContent = email;

        // Hide all content panes
        const panes = document.querySelectorAll(".content-pane");
        panes.forEach(pane => pane.classList.add('hidden'));

        // Show the enrolled student details pane
        const enrolledStudentDetailsPane = document.getElementById('enrolled-student-details-pane');
        enrolledStudentDetailsPane.classList.remove('hidden');

        // Update the page title
        document.getElementById('page-title').textContent = 'Enrolled Student Details';

        // Remove active class from all nav items in the sidebar
        const navItems = document.querySelectorAll(".nav-item");
        navItems.forEach(nav => nav.classList.remove("active"));
    }
}



document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const panes = document.querySelectorAll(".content-pane");
    const title = document.getElementById("page-title");
    const backToEnrolledBtn = document.getElementById('back-to-enrolled-btn');
    const addStudentToClassBtn = document.getElementById('add-student-to-class-btn');
    const classSectionStudentsTableBody = document.querySelector('#class-section-students-table tbody');
    const saveClassSectionBtn = document.getElementById('save-class-section-btn');
    const createNewScheduleBtn = document.getElementById('create-new-schedule-btn'); // New button reference
    const backToSchedulesBtn = document.getElementById('back-to-schedules-btn'); // New button reference
    const classScheduleTableBody = document.querySelector('#class-schedule-table tbody'); // New table body reference
    const createScheduleBtn = document.getElementById('create-schedule-btn'); // New button reference
    const deleteScheduleRowBtn = document.getElementById('delete-schedule-row-btn'); // New button reference


    // --- Sidebar Navigation Logic ---
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            // Remove active state from all nav items
            navItems.forEach(nav => nav.classList.remove("active"));
            // Hide all content panes
            panes.forEach(pane => pane.classList.add("hidden"));

            // Add active to clicked nav item
            item.classList.add("active");
            // Show the matching content pane
            const paneElement = document.getElementById(item.dataset.pane);
            if (paneElement) {
                paneElement.classList.remove("hidden");
            }


            // Update page title using the text content of the clicked nav item
            title.textContent = item.textContent;
        });
    });

    // --- Logout Button Logic ---
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            console.log('Admin Logout button clicked. Redirecting to admin-login.html...');
            window.location.href = 'admin-login.html'; // Redirect to admin login page
        });
    }

    // --- "Back to Enrolled Students" Button Logic ---
    if (backToEnrolledBtn) {
        backToEnrolledBtn.addEventListener('click', () => {
            // Hide all content panes
            panes.forEach(pane => pane.classList.add('hidden'));

            // Show the enrolled students pane
            document.getElementById('enrolled-students-pane').classList.remove('hidden');

            // Update the page title
            title.textContent = 'Enrolled Students';

            // Set "Enrolled Students" nav item as active
            navItems.forEach(nav => nav.classList.remove("active"));
            const enrolledStudentsNavItem = document.querySelector('[data-pane="enrolled-students-pane"]');
            if (enrolledStudentsNavItem) {
                enrolledStudentsNavItem.classList.add('active');
            }
        });
    }

    // --- "Add Student" Button (Create Class/Sections Pane) Logic ---
    if (addStudentToClassBtn && classSectionStudentsTableBody) {
        addStudentToClassBtn.addEventListener('click', () => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><input type="text" class="w-full p-1 border border-gray-300 rounded-md"></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><input type="text" class="w-full p-1 border border-gray-300 rounded-md"></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><input type="text" class="w-full p-1 border border-gray-300 rounded-md"></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><input type="email" class="w-full p-1 border border-gray-300 rounded-md"></td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-red-600 hover:text-red-900" onclick="this.closest('tr').remove()">Remove</button>
                </td>
            `;
            classSectionStudentsTableBody.appendChild(newRow);
        });
    }

    // --- "Save" Button (Create Class/Sections Pane) Logic ---
    if (saveClassSectionBtn) {
        saveClassSectionBtn.addEventListener('click', () => {
            const classSectionName = document.getElementById('class-section-name').value.trim();
            const studentRows = classSectionStudentsTableBody.querySelectorAll('tr');
            const studentsData = [];

            studentRows.forEach(row => {
                const inputs = row.querySelectorAll('input');
                studentsData.push({
                    strand: inputs[0].value.trim(),
                    name: inputs[1].value.trim(),
                    contact: inputs[2].value.trim(),
                    email: inputs[3].value.trim()
                });
            });

            console.log('Saving Class/Section:', classSectionName);
            console.log('Students:', studentsData);

            // In a real application, you would send this data to a backend API
            // For now, we'll just log it and clear the form (optional)
            alert('Class/Section saved successfully (check console for data)!');
            // Clear the form after saving (optional)
            document.getElementById('class-section-name').value = '';
            classSectionStudentsTableBody.innerHTML = ''; // Clear student rows
        });
    }


    // --- Initial State Setup on Page Load ---
    // This ensures the correct pane is displayed and active nav item is highlighted when the page loads
    // Always show Home pane on load
    const homeNavItem = document.querySelector('[data-pane="home-pane"]');
    if (homeNavItem) {
        homeNavItem.click(); // This will trigger the same behavior as a normal click
    }

});



const navItems = document.querySelectorAll(".nav-item");
const allPanes = document.querySelectorAll("#dashboard-content > div");

navItems.forEach(btn => {
    btn.addEventListener("click", () => {
        const targetPane = btn.getAttribute("data-pane");

        allPanes.forEach(pane => pane.classList.add("hidden"));
        const paneElement = document.getElementById(targetPane);
        if (paneElement) {
            paneElement.classList.remove("hidden");
        }


        navItems.forEach(b => b.classList.remove("bg-pink-500"));
        btn.classList.add("bg-pink-500");
    });
});


// Select all nav buttons
document.querySelectorAll("[data-pane]").forEach(button => {
    button.addEventListener("click", function () {
        // Hide ALL panes
        document.querySelectorAll(".pane").forEach(pane => pane.classList.add("hidden"));

        // Show the clicked pane
        let targetPane = document.getElementById(this.dataset.pane);
        if (targetPane) {
            targetPane.classList.remove("hidden");
        }
    });
});

//create
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('create-teacher-form');
    if (!form) {
        console.error('Form element #create-teacher-form not found.');
        return;
    }

    const emailField = document.getElementById('teacher-email');

    // Function to show a custom popup above the email field
    function showEmailPopup(message) {
        const oldPopup = emailField.parentElement.querySelector('.email-popup');
        if (oldPopup) oldPopup.remove();

        const popup = document.createElement('div');
        popup.className = 'email-popup absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow z-50';
        popup.textContent = message;

        popup.style.position = 'absolute';
        popup.style.top = '50%';
        popup.style.transform = 'translateY(-50%)';
        popup.style.right = '8px';

        emailField.parentElement.style.position = 'relative';
        emailField.parentElement.appendChild(popup);
    }

    function removeEmailPopup() {
        const oldPopup = emailField.parentElement.querySelector('.email-popup');
        if (oldPopup) oldPopup.remove();
    }

    async function validateEmail() {
        const email = emailField.value.trim();
        if (!email) return false;

        try {
            const res = await fetch('../php/validate-email.php?email=' + encodeURIComponent(email));
            const data = await res.json();

            if (data.status !== 'VALID' || !data.validations?.mailbox_exists) {
                emailField.classList.add('error');
                showEmailPopup('⚠️ Invalid email address');
                return false;
            } else {
                emailField.classList.remove('error');
                removeEmailPopup();
                return true;
            }
        } catch (err) {
            console.error('Email validation failed:', err);
            showEmailPopup('⚠️ Could not verify email right now');
            return false;
        }
    }

    // Subject container & add button
    const subjectContainer = document.getElementById('subject-container');
    const addSubjectBtn = document.getElementById('add-subject-btn');

    if (subjectContainer && addSubjectBtn) {
        addSubjectBtn.addEventListener('click', async () => {
            const subjectRow = document.createElement('div');
            subjectRow.className = "flex items-center gap-3 mb-3";

            const select = document.createElement('select');
            select.name = "subjects[]";
            select.className = "w-full border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400";

            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "-- Select Subject --";
            select.appendChild(defaultOption);

            try {
                // Step 1: Get assigned_level
                const levelRes = await fetch('../php/get_assigned_level.php', { credentials: 'include' });
                const levelData = await levelRes.json();

                if (!levelData.success) {
                    console.error("Assigned level not found in session.");
                    return;
                }

                const assignedLevel = levelData.assigned_level;

                // Step 2: Fetch subjects based on assigned_level
                const res = await fetch(`../php/fetch_teacher_sub.php?assigned_level=${encodeURIComponent(assignedLevel)}`, { credentials: 'include' });
                const data = await res.json();

                if (data.status === 'success' && Array.isArray(data.subjects)) {
                    data.subjects.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub.subject_id;

                        // For SHS: show subcode - name, For JHS: just name
                        option.textContent = sub.subcode
                            ? `${sub.subcode} - ${sub.name}`
                            : sub.name;

                        select.appendChild(option);
                    });
                }
            } catch (err) {
                console.error('Failed to load subjects:', err);
            }

            const removeBtn = document.createElement('button');
            removeBtn.type = "button";
            removeBtn.textContent = "Remove";
            removeBtn.className = "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm";
            removeBtn.addEventListener('click', () => subjectRow.remove());

            subjectRow.appendChild(select);
            subjectRow.appendChild(removeBtn);
            subjectContainer.appendChild(subjectRow);

            select.value = "";
        });
    }


    // Remove popup on input
    emailField.addEventListener('input', () => {
        emailField.classList.remove('error');
        removeEmailPopup();
    });

    // Form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const isValid = await validateEmail();
        if (!isValid) return;

        const formData = new FormData(this);

        // ✅ Remove assigned_level since PHP handles it from session
        if (formData.has('assigned_level')) {
            formData.delete('assigned_level');
        }

        fetch('../php/save_teacher.php', {
            method: 'POST',
            body: formData
        })
            .then(async response => {
                const text = await response.text();
                try {
                    return { ok: response.ok, json: JSON.parse(text) };
                } catch (err) {
                    throw new Error('Invalid JSON response: ' + text);
                }
            })
            .then(({ ok, json }) => {
                console.log('Server response:', json);
                if (json.status === 'success') {
                    alert(json.message + (json.password ? '\nPassword: ' + json.password : ''));
                    form.reset();
                    if (subjectContainer) subjectContainer.innerHTML = '';
                } else {
                    alert('Error: ' + (json.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                alert('Request failed: ' + error.message);
            });
    });
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


function loadEnrolledStudents() {
    const tbody = document.querySelector('#enrolled-students-body');
    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                Loading enrolled students...
            </td>
        </tr>
    `;

    fetch('../php/get_enrolled_students.php')
        .then(response => response.json())
        .then(data => {
            tbody.innerHTML = '';

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(student => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${student.strand}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${student.grade_level}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${student.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${student.cellphone}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${student.emailaddress}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button onclick="viewApplicationDetails(this)" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">View</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                            No enrolled students found.
                        </td>
                    </tr>
                `;
            }
        })
        .catch(() => {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-sm text-red-500">
                        Error loading enrolled students.
                    </td>
                </tr>
            `;
        });
}



document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const panes = document.querySelectorAll(".content-pane");
    const title = document.getElementById("page-title");
    const backToPendingBtn = document.getElementById("back-to-pending-btn");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(nav => nav.classList.remove("active"));
            panes.forEach(pane => pane.classList.add("hidden"));

            item.classList.add("active");
            const targetPane = document.getElementById(item.dataset.pane);
            if (targetPane) targetPane.classList.remove("hidden");
            title.textContent = item.dataset.title || "";

            if (item.dataset.pane === "pending-pane") {
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

    // ✅ Hide Home title right away when page first loads
    if (document.querySelector(".nav-item.active")?.dataset.pane === "home-pane") {
        title.textContent = "";
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const dropdownButton = document.getElementById("dropdownButton");
    const dropdownMenuSHS = document.getElementById("dropdownMenuSHS");
    const dropdownMenuJHS = document.getElementById("dropdownMenuJHS");

    const enrolledPane = document.getElementById("created-class-section-pane");
    const displaySectionsBtn = document.getElementById("displaySectionsBtn");
    const displaySectionsBody = document.getElementById("sections-table-body-new");
    const createSectionsBtn = document.getElementById("createSectionsBtn");

    let activeMenu = null;
    let assignedLevel = null;
    let selectedStrand = "";
    let selectedGrade = "";

    if (!enrolledPane) console.error("Error: #created-class-section-pane not found");
    if (!displaySectionsBody) console.error("Error: #sections-table-body-new not found");

    function setActiveMenu(menu) {
        activeMenu = menu;
        dropdownMenuSHS.classList.add("hidden");
        dropdownMenuJHS.classList.add("hidden");
    }

    // Get assigned level
    fetch("../php/create_section.php", { credentials: "include" })
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
            assignedLevel = data.assigned_level?.toLowerCase() || null;
            if (data.dropdown === "SHS") setActiveMenu(dropdownMenuSHS);
            else if (data.dropdown === "JHS") setActiveMenu(dropdownMenuJHS);
            else setActiveMenu(dropdownMenuSHS);
        })
        .catch(err => {
            console.error("create_section.php failed:", err);
            setActiveMenu(dropdownMenuSHS);
        });

    // Dropdown toggle
    dropdownButton.addEventListener("click", () => {
        if (!activeMenu) return;
        dropdownMenuSHS.classList.add("hidden");
        dropdownMenuJHS.classList.add("hidden");
        activeMenu.classList.toggle("hidden");
        displaySectionsBody.closest("div").classList.add("hidden");
    });

    document.addEventListener("click", (e) => {
        if (!dropdownButton.contains(e.target) && !activeMenu?.contains(e.target)) {
            activeMenu?.classList.add("hidden");
        }
    });

    // Handle dropdown selection
    document.querySelectorAll("#dropdownMenuSHS button, #dropdownMenuJHS button").forEach(button => {
        button.addEventListener("click", function () {
            selectedStrand = this.dataset.strand || "";
            selectedGrade = this.dataset.grade || "";

            if (!assignedLevel) {
                console.error("Assigned level not set yet.");
                return;
            }

            let url = "../php/create_class.php";
            if (assignedLevel === "senior high") {
                url += `?strand=${encodeURIComponent(selectedStrand)}&grade=${encodeURIComponent(selectedGrade)}`;
            } else if (assignedLevel === "junior high") {
                url += `?strand=&grade=${encodeURIComponent(selectedGrade)}`;
            }

            fetch(url, { credentials: "include" })
                .then(r => r.ok ? r.json() : Promise.reject(r.status))
                .then(students => {
                    enrolledPane.classList.remove("hidden");
                    displaySectionsBody.closest("div").classList.add("hidden");

                    const tbody = enrolledPane.querySelector("tbody");
                    if (!tbody) {
                        console.error("No tbody inside #created-class-section-pane");
                        return;
                    }

                    tbody.innerHTML = "";
                    if (Array.isArray(students) && students.length > 0) {
                        students.forEach(student => {
                            tbody.innerHTML += `
                                <tr>
                                    <td class="px-6 py-4 text-sm text-gray-700">${selectedStrand}</td>
                                    <td class="px-6 py-4 text-sm text-gray-700">${selectedGrade}</td>
                                    <td class="px-6 py-4 text-sm text-gray-700">${student.name}</td>
                                    <td class="px-6 py-4 text-sm text-gray-700">${student.contact_number}</td>
                                    <td class="px-6 py-4 text-sm text-gray-700">${student.email}</td>
                                </tr>
                            `;
                        });
                    } else {
                        tbody.innerHTML = `
                            <tr>
                                <td colspan="5" class="px-6 py-4 text-center text-gray-500">No unassigned students found</td>
                            </tr>
                        `;
                    }
                })
                .catch(err => console.error("Error loading students:", err));

            activeMenu?.classList.add("hidden");
        });
    });

    createSectionsBtn?.addEventListener("click", function () {
        if (!selectedGrade) {
            alert("Please select a grade first.");
            return;
        }

        // Create modal elements
        const modalOverlay = document.createElement("div");
        modalOverlay.style.position = "fixed";
        modalOverlay.style.top = 0;
        modalOverlay.style.left = 0;
        modalOverlay.style.width = "100%";
        modalOverlay.style.height = "100%";
        modalOverlay.style.backgroundColor = "rgba(0,0,0,0.5)";
        modalOverlay.style.display = "flex";
        modalOverlay.style.alignItems = "center";
        modalOverlay.style.justifyContent = "center";
        modalOverlay.style.zIndex = 9999;

        const modalBox = document.createElement("div");
        modalBox.style.backgroundColor = "white";
        modalBox.style.padding = "20px";
        modalBox.style.borderRadius = "10px";
        modalBox.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2)";
        modalBox.style.minWidth = "300px";
        modalBox.style.textAlign = "center";

        const message = document.createElement("p");
        message.textContent = "Enter Section Name:";
        message.style.marginBottom = "10px";

        const input = document.createElement("input");
        input.type = "text";
        input.style.width = "80%";
        input.style.padding = "8px";
        input.style.marginBottom = "15px";
        input.style.border = "1px solid #ccc";
        input.style.borderRadius = "5px";

        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "space-around";

        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Submit";
        submitBtn.style.padding = "8px 15px";
        submitBtn.style.backgroundColor = "#4CAF50";
        submitBtn.style.color = "white";
        submitBtn.style.border = "none";
        submitBtn.style.borderRadius = "5px";
        submitBtn.style.cursor = "pointer";

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.padding = "8px 15px";
        cancelBtn.style.backgroundColor = "#f44336";
        cancelBtn.style.color = "white";
        cancelBtn.style.border = "none";
        cancelBtn.style.borderRadius = "5px";
        cancelBtn.style.cursor = "pointer";

        btnContainer.appendChild(submitBtn);
        btnContainer.appendChild(cancelBtn);
        modalBox.appendChild(message);
        modalBox.appendChild(input);
        modalBox.appendChild(btnContainer);
        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        // Focus the input automatically
        input.focus();

        // ✅ Helper function to safely close modal
        function closeModal() {
            if (document.body.contains(modalOverlay)) {
                document.body.removeChild(modalOverlay);
            }
        }

        // Cancel button
        cancelBtn.addEventListener("click", () => {
            closeModal();
        });

        // Submit button
        submitBtn.addEventListener("click", () => {
            const sectionName = input.value.trim();
            if (!sectionName) {
                alert("Section name is required.");
                return;
            }

            // Send the POST request
            fetch('../php/assign_sections.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grade: selectedGrade,
                    strand: selectedStrand,
                    section_name: sectionName
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert("Section created successfully!");
                        document.body.removeChild(modalOverlay);
                    }
                    else if (data.error === "not_enough") {
                        // Show confirm dialog
                        if (confirm(`There are only ${data.available} students left (need ${data.required}). Do you still want to create the section?`)) {
                            // Retry request with force=true
                            return fetch('../php/assign_sections.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    grade: selectedGrade,
                                    strand: selectedStrand,
                                    section_name: sectionName,
                                    force: true
                                })
                            })
                                .then(res => res.json())
                                .then(forceData => {
                                    if (forceData.success) {
                                        alert("Section created successfully with fewer students.");
                                    } else {
                                        alert("Error: " + (forceData.error || 'Unknown'));
                                    }
                                });
                        } else {
                            alert("Section creation cancelled.");
                        }
                    }
                    else {
                        alert("Error: " + (data.error || 'Unknown'));
                        document.body.removeChild(modalOverlay);
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert("Request failed");
                    document.body.removeChild(modalOverlay);
                });

        });

    });


    // Display Sections button with modal view
    displaySectionsBtn?.addEventListener("click", () => {
        enrolledPane.classList.add("hidden");

        const sectionsTableContainer = displaySectionsBody.closest("div");
        sectionsTableContainer.classList.remove("hidden");

        fetch("../php/fetch_sections.php", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                displaySectionsBody.innerHTML = "";

                if (!Array.isArray(data) || data.length === 0) {
                    displaySectionsBody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500">No available sections</td></tr>`;
                    return;
                }

                data.forEach(section => {
                    displaySectionsBody.innerHTML += `
                        <tr 
                            data-section-id="${section.section_id}" 
                            data-section-name="${section.section_name}" 
                            data-adviser-id="${section.adviser_id || ''}">
                            <td class="px-6 py-4 text-sm text-gray-700">${section.section_name}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">${section.grade_level}</td>
                            <td class="px-6 py-4 text-sm text-gray-700 flex justify-between items-center gap-2">
                                <span>${section.total_students}</span>
                                <div class="flex gap-2">
                                    <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 adviser-btn">Add Adviser</button>
                                    <button class="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 add-student-btn">Add Student</button>
                                    <button class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 view-btn">View</button>
                                    <button class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 archive-btn" data-id="${section.section_id}">Archive</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });


                const modal = document.getElementById("students-modal");
                const studentsList = document.getElementById("students-list");
                const modalSectionName = document.getElementById("modal-section-name");
                const closeModalBtn = document.getElementById("close-modal");

                closeModalBtn.addEventListener("click", () => {
                    modal.classList.add("hidden");
                    studentsList.innerHTML = "";
                });

                // Archive button
                document.querySelectorAll(".archive-btn").forEach(btn => {
                    btn.addEventListener("click", async function () {
                        const sectionId = this.dataset.id;

                        try {
                            // Fetch the active school year period
                            const res = await fetch("../php/get_active_schoolyear.php");
                            const data = await res.json();

                            // If there is an active school year
                            if (data.status === "success" && data.data) {
                                alert("Cannot archive sections while the school year is active.");
                                return;
                            }

                            // If data.data is null, then today is outside the active school year → allow archiving
                            if (!confirm("Are you sure you want to archive this section?")) return;

                            // Archive section
                            const archiveRes = await fetch("../php/archive_section.php", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ section_id: sectionId })
                            });
                            const resp = await archiveRes.json();

                            if (resp.success) {
                                alert("Section archived successfully!");
                                btn.closest("tr").remove();
                            } else {
                                alert("Failed to archive section: " + (resp.error || ""));
                            }

                        } catch (err) {
                            console.error("Error archiving section:", err);
                            alert("An error occurred while checking the school year period.");
                        }
                    });
                });


                // Adviser modal elements
                const adviserModal = document.getElementById("adviser-modal");
                const teacherDropdown = document.getElementById("teacher-dropdown");
                const cancelAdviserBtn = document.getElementById("cancel-btn");
                const saveAdviserBtn = document.getElementById("save-btn");

                // Event delegation
                displaySectionsBody.addEventListener("click", async (e) => {
                    const tr = e.target.closest("tr");
                    if (!tr) return;

                    if (e.target.classList.contains("adviser-btn")) {
                        const sectionId = tr.dataset.sectionId;
                        const currentAdviserId = tr.dataset.adviserId || ''; // Ensure it's defined even if no adviser

                        // Show modal
                        adviserModal.classList.remove("hidden");

                        // Fetch teachers
                        try {
                            const res = await fetch("../php/fetch_teachers.php", { credentials: "include" });
                            const data = await res.json();

                            if (!data.success) {
                                teacherDropdown.innerHTML = `<option value="">Failed to load teachers</option>`;
                                return;
                            }

                            // Populate dropdown and pre-select current adviser
                            teacherDropdown.innerHTML = `<option value="">Select a teacher</option>` +
                                data.teachers.map(t =>
                                    `<option value="${t.teacher_id}" ${t.teacher_id == currentAdviserId ? 'selected' : ''}>
                        ${t.firstname} ${t.middlename} ${t.lastname} (${t.assigned_level})
                    </option>`).join("");

                        } catch (err) {
                            console.error(err);
                            teacherDropdown.innerHTML = `<option value="">Error loading teachers</option>`;
                        }

                        // Cancel button
                        cancelAdviserBtn.onclick = () => adviserModal.classList.add("hidden");

                        // Save button
                        saveAdviserBtn.onclick = async () => {
                            const selectedTeacherId = teacherDropdown.value;
                            if (!selectedTeacherId) return alert("Please select a teacher.");

                            try {
                                const formData = new FormData();
                                formData.append("teacher_id", selectedTeacherId);
                                formData.append("section_id", sectionId);

                                const res = await fetch("../php/save_adviser.php", {
                                    method: "POST",
                                    body: formData,
                                    credentials: "include"
                                });
                                const result = await res.json();

                                if (!result.success) return alert(result.message || "Failed to save adviser.");

                                alert("Adviser assigned successfully!");
                                adviserModal.classList.add("hidden");

                                // Update <tr> dataset for next modal opening
                                tr.dataset.adviserId = selectedTeacherId;

                            } catch (err) {
                                console.error(err);
                                alert("Error saving adviser.");
                            }
                        };
                    }
                });



                // View button opens modal table
                document.querySelectorAll(".view-btn").forEach(btn => {
                    btn.addEventListener("click", async function () {
                        const tr = this.closest("tr");
                        const sectionName = tr.dataset.sectionName;
                        modalSectionName.textContent = `Students in Section: ${sectionName}`;

                        try {
                            const res = await fetch(`../php/get_section_students.php?section_name=${encodeURIComponent(sectionName)}`);
                            const students = await res.json();

                            studentsList.innerHTML = "";

                            if (students.error) {
                                studentsList.innerHTML = `<tr><td colspan="3" class="text-center">${students.error}</td></tr>`;
                            } else if (students.length === 0) {
                                studentsList.innerHTML = `<tr><td colspan="3" class="text-center">No students found</td></tr>`;
                            } else {
                                students.forEach(s => {
                                    studentsList.innerHTML += `
                        <tr>
                            <td class="px-4 py-2 text-sm text-gray-700">${s.student_name}</td>
                            <td class="px-4 py-2 text-sm text-gray-700">${s.strand}</td>
                            <td class="px-4 py-2 text-sm text-gray-700 flex justify-between items-center">
                                <span>${s.grade_level}</span>
                                <div class="flex gap-2">
                                    <button class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 drop-btn" data-student-id="${s.student_id}">Drop</button>
                                    <button class="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 remove-btn" data-student-id="${s.student_id}">Remove</button>
                                </div>
                            </td>
                        </tr>
                    `;
                                });
                            }

                            modal.classList.remove("hidden");

                            // Drop button modal
                            document.querySelectorAll(".drop-btn").forEach(dropBtn => {
                                dropBtn.addEventListener("click", function () {
                                    const studentId = this.dataset.studentId;
                                    const studentRow = this.closest("tr");

                                    const modalOverlay = document.createElement("div");
                                    modalOverlay.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

                                    const modalBox = document.createElement("div");
                                    modalBox.className = "bg-white rounded-lg p-6 w-96";

                                    const title = document.createElement("h2");
                                    title.className = "text-lg font-bold mb-4";
                                    title.textContent = "Confirm Drop";

                                    const message = document.createElement("p");
                                    message.className = "mb-4";
                                    message.textContent = "Are you sure you want to drop this student?";

                                    const label = document.createElement("label");
                                    label.className = "block mb-2 text-sm font-medium";
                                    label.textContent = "Reason for dropping:";

                                    const reasonInput = document.createElement("input");
                                    reasonInput.type = "text";
                                    reasonInput.className = "w-full px-3 py-2 border border-gray-300 rounded mb-4";
                                    reasonInput.placeholder = "Enter reason...";

                                    const buttonsDiv = document.createElement("div");
                                    buttonsDiv.className = "flex justify-end gap-2";

                                    const cancelBtn = document.createElement("button");
                                    cancelBtn.className = "px-4 py-2 bg-gray-300 rounded hover:bg-gray-400";
                                    cancelBtn.textContent = "Cancel";

                                    const confirmBtn = document.createElement("button");
                                    confirmBtn.className = "px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600";
                                    confirmBtn.textContent = "Confirm";

                                    buttonsDiv.appendChild(cancelBtn);
                                    buttonsDiv.appendChild(confirmBtn);
                                    modalBox.appendChild(title);
                                    modalBox.appendChild(message);
                                    modalBox.appendChild(label);
                                    modalBox.appendChild(reasonInput);
                                    modalBox.appendChild(buttonsDiv);
                                    modalOverlay.appendChild(modalBox);
                                    document.body.appendChild(modalOverlay);

                                    cancelBtn.addEventListener("click", () => {
                                        document.body.removeChild(modalOverlay);
                                    });

                                    confirmBtn.addEventListener("click", async () => {
                                        const reason = reasonInput.value.trim();
                                        if (!reason) {
                                            alert("Please provide a reason for dropping the student.");
                                            return;
                                        }

                                        try {
                                            const res = await fetch("../php/drop_student.php", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ student_id: studentId, reason })
                                            });
                                            const resp = await res.json();

                                            if (resp.success) {
                                                alert("Student dropped successfully!");
                                                studentRow.remove();
                                            } else {
                                                alert("Failed to drop student: " + (resp.error || ""));
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            alert("Request failed. Please try again.");
                                        } finally {
                                            document.body.removeChild(modalOverlay);
                                        }
                                    });
                                });
                            });

                            // Remove button remains the same
                            document.querySelectorAll(".remove-btn").forEach(removeBtn => {
                                removeBtn.addEventListener("click", function () {
                                    const studentId = this.dataset.studentId;
                                    if (confirm("Are you sure you want to remove this student?")) {
                                        fetch("../php/remove_student.php", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ student_id: studentId })
                                        })
                                            .then(res => res.json())
                                            .then(resp => {
                                                if (resp.success) {
                                                    alert("Student removed successfully!");
                                                    this.closest("tr").remove();
                                                } else {
                                                    alert("Failed to remove student: " + (resp.error || ""));
                                                }
                                            })
                                            .catch(err => console.error("Error removing student:", err));
                                    }
                                });
                            });

                        } catch (err) {
                            console.error(err);
                            studentsList.innerHTML = `<tr><td colspan="3" class="text-center">Failed to load students</td></tr>`;
                            modal.classList.remove("hidden");
                        }
                    });
                });
                // Add Student button
                document.querySelectorAll(".add-student-btn").forEach(addBtn => {
                    addBtn.addEventListener("click", async function () {
                        const tr = this.closest("tr");
                        const sectionId = tr.dataset.sectionId;
                        const sectionName = tr.dataset.sectionName;
                        const sectionStrand = tr.dataset.strand;
                        const sectionGrade = tr.dataset.gradeLevel;
                        const totalCell = tr.querySelector("span"); // total_students cell

                        const modal = document.getElementById("add-student-modal");
                        const modalTitle = document.getElementById("add-student-modal-title");
                        const studentBody = document.getElementById("add-student-body");

                        modalTitle.textContent = `Add Students to Section: ${sectionName}`;
                        studentBody.innerHTML = "";

                        try {
                            const res = await fetch(`../php/get_unassigned_students.php?section_id=${encodeURIComponent(sectionId)}`, { cache: "no-store" });
                            const students = await res.json();

                            if (!Array.isArray(students) || students.length === 0) {
                                studentBody.innerHTML = `<tr><td colspan="4" class="text-center py-3">No available students</td></tr>`;
                            } else {
                                students.forEach(s => {
                                    studentBody.innerHTML += `
                        <tr>
                            <td class="px-4 py-2"><input type="checkbox" class="student-checkbox" value="${s.student_id}"></td>
                            <td class="px-4 py-2">${s.student_name}</td>
                            <td class="px-4 py-2">${s.strand}</td>
                            <td class="px-4 py-2">${s.grade_level}</td>
                        </tr>
                    `;
                                });
                            }

                            modal.classList.remove("hidden");

                            // Always reset "Select All"
                            const selectAll = document.getElementById("select-all");
                            selectAll.checked = false;
                            selectAll.onclick = function () {
                                document.querySelectorAll(".student-checkbox").forEach(cb => cb.checked = this.checked);
                            };

                            // Cancel button
                            document.getElementById("cancel-add-student").onclick = () => {
                                modal.classList.add("hidden");
                            };

                            // Submit button
                            document.getElementById("submit-add-student").onclick = async () => {
                                const selected = [...document.querySelectorAll(".student-checkbox:checked")].map(cb => cb.value);

                                if (selected.length === 0) {
                                    alert("Please select at least one student.");
                                    return;
                                }

                                try {
                                    const res = await fetch("../php/add_students_to_section.php", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ section_id: sectionId, student_ids: selected })
                                    });
                                    const resp = await res.json();

                                    if (resp.success) {
                                        alert("Students added successfully!");
                                        modal.classList.add("hidden");

                                        // update student count immediately
                                        totalCell.textContent = parseInt(totalCell.textContent || "0") + selected.length;
                                    } else {
                                        alert("Failed to add students: " + (resp.error || ""));
                                    }
                                } catch (err) {
                                    console.error("Error saving students:", err);
                                    alert("Error adding students.");
                                }
                            };

                        } catch (err) {
                            console.error("Error fetching students:", err);
                            studentBody.innerHTML = `<tr><td colspan="4" class="text-center py-3">Failed to load students</td></tr>`;
                            modal.classList.remove("hidden");
                        }
                    });
                });


            })
            .catch(err => {
                console.error("Error fetching sections:", err);
                displaySectionsBody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500">Failed to load sections</td></tr>`;
            });
    });



});


//calendar
document.addEventListener("DOMContentLoaded", () => {
    const adminBtn = document.getElementById("adminProfileBtn");
    const adminPanel = document.getElementById("adminPanel");
    const openCalendar = document.getElementById("openCalendar");
    const miniCalendar = document.getElementById("miniCalendar");

    const monthYear = document.getElementById("monthYear");
    const calendarGrid = document.getElementById("calendarGrid");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");
    const eventModal = document.getElementById("eventModal");
    const eventForm = document.getElementById("eventForm");
    const cancelBtn = document.getElementById("cancelBtn");

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let events = [];

    // 1. Toggle profile panel
    adminBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        adminPanel.classList.toggle("hidden");
        miniCalendar.classList.add("hidden");
    });

    // 2. Toggle mini calendar when "📅 Calendar" is clicked
    openCalendar.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        miniCalendar.classList.toggle("hidden");
        adminPanel.classList.add("hidden");
    });

    // 3. Close if clicking outside
    document.addEventListener("click", (e) => {
        if (!adminPanel.contains(e.target) && !adminBtn.contains(e.target)) {
            adminPanel.classList.add("hidden");
        }
        if (!miniCalendar.contains(e.target) && !openCalendar.contains(e.target)) {
            miniCalendar.classList.add("hidden");
        }
    });

    // 4. Calendar + events (your existing logic)
    function fetchEvents() {
        fetch("../php/get_events.php")
            .then(res => res.json())
            .then(data => {
                events = data;
                generateCalendar(currentMonth, currentYear);
            });
    }

    function generateCalendar(month, year) {
        calendarGrid.innerHTML = "";
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        dayNames.forEach(day => {
            const header = document.createElement("div");
            header.textContent = day;
            header.className = "font-semibold text-gray-700";
            calendarGrid.appendChild(header);
        });

        monthYear.textContent = new Date(year, month).toLocaleString("default", {
            month: "long",
            year: "numeric"
        });

        let firstDay = new Date(year, month, 1).getDay();
        let daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            calendarGrid.innerHTML += `<div></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            let dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            let dayEvents = events.filter(
                ev => dateStr >= ev.start_date && dateStr <= ev.end_date
            );

            let td = document.createElement("div");
            td.className = "p-2 border rounded cursor-pointer flex items-center justify-center";

            if (
                day === currentDate.getDate() &&
                month === currentDate.getMonth() &&
                year === currentDate.getFullYear()
            ) {
                td.classList.add("bg-green-300");
            }

            if (dayEvents.length) {
                td.classList.add("bg-purple-300", "hover:bg-purple-400");
                td.title = dayEvents.map(ev => ev.title).join(", ");
            }

            td.textContent = day;

            td.onclick = () => {
                document.getElementById("eventStart").value = dateStr;
                document.getElementById("eventEnd").value = dateStr;
                eventModal.classList.remove("hidden");
            };

            calendarGrid.appendChild(td);
        }
    }

    eventForm.onsubmit = e => {
        e.preventDefault();
        let eventData = {
            title: document.getElementById("eventTitle").value,
            start_date: document.getElementById("eventStart").value,
            end_date: document.getElementById("eventEnd").value
        };

        fetch("../php/add_event.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    alert("Event added!");
                    eventModal.classList.add("hidden");
                    eventForm.reset();
                    fetchEvents();
                } else {
                    alert("Error: " + data.message);
                }
            });
    };

    cancelBtn.onclick = () => {
        eventModal.classList.add("hidden");
    };

    prevMonthBtn.onclick = () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    };

    nextMonthBtn.onclick = () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    };

    fetchEvents();
});



//

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

function loadTeachers() {
    const tbody = document.getElementById('teachers-list-body');
    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                Loading teachers...
            </td>
        </tr>
    `;

    fetch('../php/fetch_teachers.php')
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';

            if (data.success && Array.isArray(data.teachers) && data.teachers.length > 0) {
                data.teachers.forEach(t => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-6 py-4 text-sm text-gray-900">${t.firstname || ""}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">${t.middlename || ""}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">${t.lastname || ""}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">${t.email || ""}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">********</td>
                        <td class="px-6 py-4 text-sm text-gray-900 space-x-2">
                            <button onclick="resetTeacherPassword(${t.teacher_id}, '${t.lastname}')" 
                                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-gray-600">
                                Reset
                            </button>
                            <button onclick="removeTeacher(${t.teacher_id}, '${t.lastname}')" 
                                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-gray-600">
                                Remove
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                            No teachers found.
                        </td>
                    </tr>
                `;
            }
        })
        .catch(() => {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-sm text-red-500">
                        Error loading teachers.
                    </td>
                </tr>
            `;
        });
}


function resetTeacherPassword(id, lastname) {
    if (!confirm(`Reset password for ${lastname}?`)) return;

    fetch('../php/reset_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `teacher_id=${encodeURIComponent(id)}`
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(`✅ Password reset for ${lastname}`);
            } else {
                alert(`❌ Failed to reset: ${data.message}`);
            }
        })
        .catch(err => console.error("❌ Reset fetch error:", err));
}


function removeTeacher(id, lastname) {
    if (!confirm(`Remove teacher ${lastname}?`)) return;

    fetch('../php/remove_teacher.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `teacher_id=${encodeURIComponent(id)}`
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(`🗑️ Teacher ${lastname} removed successfully`);
                loadTeachers(); // refresh table
            } else {
                alert(`❌ Failed to remove: ${data.message}`);
            }
        })
        .catch(err => console.error("❌ Remove fetch error:", err));
}

document.addEventListener("DOMContentLoaded", () => {
    const teachersBtn = document.querySelector('[data-pane="teachers-list-pane"]');
    if (teachersBtn) {
        teachersBtn.addEventListener("click", () => {
            loadTeachers();
        });
    } else {
        console.error("❌ Teachers List button not found in DOM");
    }
});

//SCHEDULES
document.addEventListener("DOMContentLoaded", () => {
    const sectionsContainer = document.getElementById("sections-container");
    const backBtn = document.getElementById("back-to-sections-btn");
    const pane = document.getElementById("create-class-schedules-pane");
    const paneTitle = pane.querySelector("p");

    let currentTable = null;
    let currentHeader = null;

    // Subject cache for dropdowns!
    let subjectOptionsHTML = "";
    let subjectList = [];

    // Modal setup
    const modal = document.createElement("div");
    modal.id = "scheduleModal";
    modal.className = "fixed inset-0 bg-gray-900 bg-opacity-50 hidden items-center justify-center z-50";
    modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg w-full max-w-7xl max-h-[90vh] p-6 relative overflow-x-auto overflow-y-auto">
      <h2 class="text-2xl font-semibold mb-4">Create Schedule</h2>
      <form id="scheduleForm" class="space-y-4">
        <input type="hidden" id="section_id" name="section_id">
        <input type="hidden" id="section_name" name="section_name">
        <input type="hidden" id="strand_id" name="strand_id">

        <table class="min-w-full border border-gray-300 text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="border px-2 py-2">Time</th>
              <th class="border px-2 py-2">Monday</th>
              <th class="border px-2 py-2">Tuesday</th>
              <th class="border px-2 py-2">Wednesday</th>
              <th class="border px-2 py-2">Thursday</th>
              <th class="border px-2 py-2">Friday</th>
              <th class="border px-2 py-2"></th>
            </tr>
          </thead>
          <tbody id="schedule-rows">
            ${[...Array(5)].map((_, i) => `
              <tr>
                <td class="border px-2 py-2">
                  <div class="flex items-center gap-1">
                    <input type="time" name="time_start[${i}]" class="w-full border rounded px-2 py-1">
                    <span>-</span>
                    <input type="time" name="time_end[${i}]" class="w-full border rounded px-2 py-1">
                  </div>
                </td>
                ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => `
                <td class="border px-2 py-2">
                  <div class="space-y-1">
                    <select name="${day}[${i}]" class="subject-dropdown w-full border rounded px-2 py-1"></select>
                    <select name="${day}_teacher[${i}]" class="teacher-dropdown w-full border rounded px-2 py-1">
                      <option value="">-- Select Teacher --</option>
                    </select>
                  </div>
                </td>
                `).join('')}
                <td class="border px-2 py-2 text-center">
                  <button type="button" class="removeRow px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Remove</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
  
        <div class="mt-3">
          <button type="button" id="addRow" class="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">+ Add Row</button>
        </div>
  
        <div class="flex justify-end gap-2 mt-4">
          <button type="button" id="closeModal" class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Cancel</button>
          <button type="submit" class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
        </div>
      </form>
    </div>
  `;
    document.body.appendChild(modal);

    const modalElement = document.getElementById("scheduleModal");
    const closeModal = modalElement.querySelector("#closeModal");
    closeModal.addEventListener("click", () => {
        modalElement.classList.add("hidden");
        modalElement.classList.remove("flex");
    });

    // Attach teacher listeners to all subject dropdowns
    function attachTeacherListeners() {
        document.querySelectorAll(".subject-dropdown").forEach(subjectSelect => {
            subjectSelect.addEventListener("change", async function () {
                const teacherSelect = this.closest("td").querySelector(".teacher-dropdown");

                if (!this.value) {
                    teacherSelect.innerHTML = `<option value="">-- Select Teacher --</option>`;
                    return;
                }

                try {
                    const subjectId = this.value;
                    const res = await fetch(`../php/get_teachers.php?subject_id=${subjectId}`, { credentials: "include" });
                    const data = await res.json();

                    if (data.status === "success" && Array.isArray(data.teachers) && data.teachers.length > 0) {
                        teacherSelect.innerHTML = `<option value="">-- Select Teacher --</option>` +
                            data.teachers.map(t => `<option value="${t.teacher_id}">${t.firstname} ${t.lastname}</option>`).join('');
                    } else {
                        teacherSelect.innerHTML = `<option value="">No teachers available</option>`;
                    }
                } catch (err) {
                    console.error("Fetch failed:", err);
                    teacherSelect.innerHTML = `<option value="">Error loading teachers</option>`;
                }
            });
        });
    }

    // Helper: always fill subject dropdowns using cached subjectOptionsHTML
    function fillAllSubjectDropdowns() {
        document.querySelectorAll(".subject-dropdown").forEach(dropdown => {
            dropdown.innerHTML = subjectOptionsHTML;
        });
    }

    // Add/Remove row logic
    document.addEventListener("click", (e) => {
        if (e.target.id === "addRow") {
            const tbody = document.getElementById("schedule-rows");
            const rowCount = tbody.querySelectorAll("tr").length;
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
                <td class="border px-2 py-2">
                  <div class="flex items-center gap-1">
                    <input type="time" name="time_start[${rowCount}]" class="w-full border rounded px-2 py-1">
                    <span>-</span>
                    <input type="time" name="time_end[${rowCount}]" class="w-full border rounded px-2 py-1">
                  </div>
                </td>
                ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => `
                <td class="border px-2 py-2">
                  <div class="space-y-1">
                    <select name="${day}[${rowCount}]" class="subject-dropdown w-full border rounded px-2 py-1"></select>
                    <select name="${day}_teacher[${rowCount}]" class="teacher-dropdown w-full border rounded px-2 py-1">
                        <option value="">-- Select Teacher --</option>
                    </select>
                  </div>
                </td>
                `).join('')}
                <td class="border px-2 py-2 text-center">
                    <button type="button" class="removeRow px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Remove</button>
                </td>
            `;
            tbody.appendChild(newRow);

            // Fill subject dropdowns
            newRow.querySelectorAll(".subject-dropdown").forEach(dropdown => dropdown.innerHTML = subjectOptionsHTML);
            attachTeacherListeners();
        }

        if (e.target.classList.contains("removeRow")) {
            e.target.closest("tr").remove();
        }
    });

    // Load subjects and saved schedule rows
    async function loadSubjectsAndSchedules(section_id) {
        // 1. Fetch subjects
        const res = await fetch(`../php/get_subjects.php?section_id=${encodeURIComponent(section_id)}`, { credentials: "include" });
        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.subjects)) {
            subjectList = data.subjects;
            subjectOptionsHTML =
                `<option value="">-- Select Subject --</option>` +
                subjectList.map(s => `<option value="${s.subject_id}">${s.name}</option>`).join('');
            fillAllSubjectDropdowns();
            attachTeacherListeners();

            // 2. Fetch saved schedules
            const res2 = await fetch(`../php/get_saved_schedule.php?section_id=${encodeURIComponent(section_id)}`, { credentials: "include" });
            const saved = await res2.json();
            if (saved.status === "success" && Array.isArray(saved.schedules)) {
                const tbody = document.getElementById("schedule-rows");
                tbody.innerHTML = "";
                // Group by row index (if your backend returns by row, otherwise by time slot)
                const grouped = {};
                saved.schedules.forEach(s => {
                    const key = `${s.time_start}-${s.time_end}`;
                    if (!grouped[key]) grouped[key] = {};
                    grouped[key][s.day_of_week.toLowerCase()] = s;
                });
                let i = 0;
                for (const timeKey in grouped) {
                    const slot = grouped[timeKey];
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td class="border px-2 py-2">
                          <div class="flex items-center gap-1">
                            <input type="time" name="time_start[${i}]" class="w-full border rounded px-2 py-1" value="${slot['monday']?.time_start || slot['tuesday']?.time_start || slot['wednesday']?.time_start || slot['thursday']?.time_start || slot['friday']?.time_start || ''}">
                            <span>-</span>
                            <input type="time" name="time_end[${i}]" class="w-full border rounded px-2 py-1" value="${slot['monday']?.time_end || slot['tuesday']?.time_end || slot['wednesday']?.time_end || slot['thursday']?.time_end || slot['friday']?.time_end || ''}">
                          </div>
                        </td>
                        ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => `
                        <td class="border px-2 py-2">
                          <div class="space-y-1">
                            <select name="${day}[${i}]" class="subject-dropdown w-full border rounded px-2 py-1"></select>
                            <select name="${day}_teacher[${i}]" class="teacher-dropdown w-full border rounded px-2 py-1">
                              <option value="">-- Select Teacher --</option>
                            </select>
                          </div>
                        </td>
                        `).join('')}
                        <td class="border px-2 py-2 text-center">
                            <button type="button" class="removeRow px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Remove</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                    // Fill subject dropdowns
                    row.querySelectorAll(".subject-dropdown").forEach(dropdown => dropdown.innerHTML = subjectOptionsHTML);
                    // Fill teacher dropdowns after subject is set
                    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
                        const s = slot[day];
                        const subjectSelect = row.querySelector(`select[name='${day}[${i}]']`);
                        const teacherSelect = row.querySelector(`select[name='${day}_teacher[${i}]']`);
                        if (s) {
                            subjectSelect.value = s.subject_id;
                            // Fetch teachers for subject + set teacher value
                            fetch(`../php/get_teachers.php?subject_id=${s.subject_id}`, { credentials: "include" })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.status === "success" && Array.isArray(data.teachers)) {
                                        teacherSelect.innerHTML =
                                            `<option value="">-- Select Teacher --</option>` +
                                            data.teachers.map(t => `<option value="${t.teacher_id}">${t.firstname} ${t.lastname}</option>`).join('');
                                        teacherSelect.value = s.teacher_id;
                                    }
                                });
                        }
                    });
                    attachTeacherListeners();
                    i++;
                }
            }
        } else {
            alert(data.message || "No subjects found for this section.");
        }
    }

    // Open modal with subjects and saved schedules
    window.openModal = async function (sectionName, strand_id, section_id) {
        document.getElementById("section_id").value = section_id;
        document.getElementById("section_name").value = sectionName;
        document.getElementById("strand_id").value = strand_id;

        modalElement.classList.remove("hidden");
        modalElement.classList.add("flex");

        await loadSubjectsAndSchedules(section_id);
    };
    // ---- THIS FUNCTION MUST EXIST BEFORE THE EVENT LISTENER ----
    function handleScheduleFormSubmit(scheduleForm) {
        // Track mapping for row/column so we can show conflicts visually
        const rowColMap = {}; // {rowIndex: {day: {subjectSelect, teacherSelect, cell}}}

        const rows = Array.from(document.querySelectorAll("#schedule-rows tr"));
        const schedules = [];

        rows.forEach((row, rowIndex) => {
            rowColMap[rowIndex] = {};
            const timeStart = row.querySelector(`input[name="time_start[${rowIndex}]"]`)?.value;
            const timeEnd = row.querySelector(`input[name="time_end[${rowIndex}]"]`)?.value;

            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
                const subjectSelect = row.querySelector(`select[name="${day}[${rowIndex}]"]`);
                const teacherSelect = row.querySelector(`select[name="${day}_teacher[${rowIndex}]"]`);
                const cell = subjectSelect?.closest("td");
                if (cell) {
                    if (!rowColMap[rowIndex][day]) rowColMap[rowIndex][day] = {};
                    rowColMap[rowIndex][day] = { subjectSelect, teacherSelect, cell };
                }
                if (subjectSelect?.value && teacherSelect?.value && timeStart && timeEnd) {
                    schedules.push({
                        subject_id: parseInt(subjectSelect.value, 10),
                        teacher_id: parseInt(teacherSelect.value, 10),
                        day_of_week: day.charAt(0).toUpperCase() + day.slice(1),
                        time_start: timeStart,
                        time_end: timeEnd,
                        row_index: rowIndex,
                        day: day
                    });
                }
            });
        });

        const section_id = parseInt(document.getElementById("section_id").value, 10);

        // Validate before sending
        if (!section_id || schedules.length === 0) {
            alert("Section ID and schedule data are required.");
            return;
        }

        // Remove previous conflict highlights/bubbles AND previous warning
        Object.values(rowColMap).forEach(dayMap => {
            Object.values(dayMap).forEach(({ cell }) => {
                cell.classList.remove("conflict-cell");
                const bubble = cell.querySelector(".conflict-bubble");
                if (bubble) bubble.remove();
            });
        });
        // Remove previous warning message
        const prevWarning = modalElement.querySelector(".save-warning");
        if (prevWarning) prevWarning.remove();

        fetch("../php/save_schedule.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                section_id: section_id,
                schedules: schedules
            }),
            credentials: "include"
        })
            .then(async res => {
                const data = await res.json();

                // Remove any old warning at the start
                const form = modalElement.querySelector("form");
                const oldWarning = form.querySelector(".save-warning");
                if (oldWarning) oldWarning.remove();

                if (data.status === "success") {
                    alert("✅ Schedule saved successfully!");
                    scheduleForm.reset();
                    modalElement.classList.add("hidden");
                    modalElement.classList.remove("flex");
                } else if (data.status === "error" && data.conflicts) {
                    // Remove previous highlights and bubbles before setting new ones
                    rows.forEach((row, rIdx) => {
                        row.querySelectorAll("td").forEach(cell => {
                            cell.classList.remove("conflict-cell");
                            const bubble = cell.querySelector(".conflict-bubble");
                            if (bubble) bubble.remove();
                        });
                    });

                    // Visual warning in the exact cell(s)!
                    data.conflicts.forEach(conflict => {
                        const { day_of_week, subject_id, teacher_id, time_start, time_end, subject_name, teacher_name } = conflict;
                        const day = day_of_week.toLowerCase();

                        rows.forEach((row, rIdx) => {
                            const tStart = row.querySelector(`input[name="time_start[${rIdx}]"]`)?.value;
                            const tEnd = row.querySelector(`input[name="time_end[${rIdx}]"]`)?.value;
                            const subj = row.querySelector(`select[name="${day}[${rIdx}]"]`);
                            const teach = row.querySelector(`select[name="${day}_teacher[${rIdx}]"]`);
                            if (
                                subj && teach &&
                                parseInt(subj.value, 10) === subject_id &&
                                parseInt(teach.value, 10) === teacher_id &&
                                tStart && time_start &&
                                tStart.substring(0, 5) === time_start.substring(0, 5) &&
                                tEnd && time_end &&
                                tEnd.substring(0, 5) === time_end.substring(0, 5)
                            ) {
                                const cell = subj.closest("td");
                                if (cell) {
                                    cell.classList.add("conflict-cell");
                                    const oldBubble = cell.querySelector(".conflict-bubble");
                                    if (oldBubble) oldBubble.remove();
                                    const bubble = document.createElement("div");
                                    bubble.className = "conflict-bubble";
                                    bubble.style.cssText = `
                                    background: #fbb;
                                    color: #900;
                                    border-radius: 5px;
                                    padding: 4px 8px;
                                    margin-top: 2px;
                                    font-size: 0.9em;
                                    position: relative;
                                    z-index: 10;
                                `;
                                    bubble.textContent =
                                        `⚠ Conflict: ${subject_name} (${teacher_name})\n${day_of_week} ${time_start}-${time_end}`;
                                    cell.appendChild(bubble);
                                    cell.querySelectorAll("select, input").forEach(input => {
                                        input.addEventListener("change", () => {
                                            cell.classList.remove("conflict-cell");
                                            const bubble = cell.querySelector(".conflict-bubble");
                                            if (bubble) bubble.remove();
                                        }, { once: true });
                                    });
                                }
                            }
                        });
                    });

                    // Prevent submission
                    return;
                } else {
                    //alert("Error: " + (data.message || "Unknown error"));
                }
            })

            .catch(err => {
                alert("Failed to save schedule. See console for details.");
                console.error(err);
            });
    }

    // Submit schedule form logic
    scheduleForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleScheduleFormSubmit(scheduleForm);
    });

    // ... rest of your unchanged code, including fetch sections and backBtn ...

    fetch("../php/get_sections.php", { credentials: "include" })
        .then(res => res.json())
        .then(sections => {
            if (!Array.isArray(sections)) return;

            sections.forEach(section => {
                const { section_name, strand_id, section_id } = section;

                const btn = document.createElement("button");
                btn.className =
                    "class-schedule-btn bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-200 ease-in-out flex items-center justify-center text-lg font-semibold text-gray-800 border border-gray-200";
                btn.textContent = section_name;

                btn.addEventListener("click", () => {
                    sectionsContainer.classList.add("hidden");
                    backBtn.classList.remove("hidden");

                    fetch(`../php/get_section_students.php?section_name=${encodeURIComponent(section_name)}`, { credentials: "include" })
                        .then(res => res.json())
                        .then(students => {
                            if (!Array.isArray(students) || students.length === 0) {
                                alert("No students found in this section.");
                                return;
                            }

                            if (currentHeader) currentHeader.remove();
                            if (currentTable) currentTable.remove();

                            const headerDiv = document.createElement("div");
                            headerDiv.className = "flex items-center justify-between mt-4 mb-2";

                            const title = document.createElement("p");
                            title.className = "text-lg font-semibold";
                            title.textContent = `Students in section ${section_name}:`;

                            const createBtn = document.createElement("button");
                            createBtn.textContent = "Create Schedule";
                            createBtn.className =
                                "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition";
                            createBtn.addEventListener("click", () => openModal(section_name, strand_id, section_id));

                            headerDiv.appendChild(title);
                            headerDiv.appendChild(createBtn);

                            pane.appendChild(headerDiv);
                            currentHeader = headerDiv;

                            let table = document.createElement("table");
                            table.className = "min-w-full divide-y divide-gray-200 mt-2";
                            table.innerHTML = `
                            <thead>
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strand</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${students.map(s => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${s.strand || ""}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${s.grade_level}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${s.student_name}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        `;

                            // create scroll wrapper
                            let wrapper = document.createElement("div");
                            wrapper.className = "max-h-[70vh] overflow-y-auto"; // adjust max-h-* as needed
                            wrapper.appendChild(table);

                            // append wrapper instead of table
                            pane.appendChild(wrapper);

                            currentTable = table;
                        })
                        .catch(err => console.error(err));
                });

                sectionsContainer.appendChild(btn);
            });
        })
        .catch(err => console.error("Failed to load sections:", err));

    backBtn.addEventListener("click", () => {
        sectionsContainer.classList.remove("hidden");
        backBtn.classList.add("hidden");
        if (currentHeader) { currentHeader.remove(); currentHeader = null; }
        if (currentTable) { currentTable.remove(); currentTable = null; }
        paneTitle.textContent = "";
    });
});


//activation period
document.addEventListener("DOMContentLoaded", () => {
    const activePeriodBtn = document.getElementById("activePeriod");
    const activationModal = document.getElementById("activationModal");
    const cancelPeriod = document.getElementById("cancelPeriod");
    const savePeriod = document.getElementById("savePeriod");

    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const enrollBtn = document.querySelector(".enroll-btn");

    let activationStart = null;
    let activationEnd = null;

    // Open modal
    activePeriodBtn.addEventListener("click", (e) => {
        e.preventDefault();
        loadActivationPeriod();
        activationModal.classList.remove("hidden");
    });

    // Close modal
    cancelPeriod.addEventListener("click", () => {
        activationModal.classList.add("hidden");
    });

    // Save activation period (to DB)
    savePeriod.addEventListener("click", () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
            alert("Please select a valid date range.");
            return;
        }

        fetch("../php/save_activation.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start_date: startDate, end_date: endDate })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    alert("Activation period saved!");
                    activationModal.classList.add("hidden");
                    fetchActivationPeriod();
                } else {
                    alert("Error: " + data.message);
                }
            })
            .catch(() => {
                alert("Something went wrong while saving the activation period.");
            });
    });

    // Fetch and apply activation period on page load
    function fetchActivationPeriod() {
        fetch("../php/get_activation.php")
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    activationStart = new Date(data.data.start_date);
                    activationEnd = new Date(data.data.end_date);
                    checkActivationPeriod();
                } else {
                    if (enrollBtn) {
                        enrollBtn.disabled = true;
                        enrollBtn.classList.add("opacity-50", "cursor-not-allowed");
                    }
                }
            })
            .catch(() => {
                if (enrollBtn) {
                    enrollBtn.disabled = true;
                    enrollBtn.classList.add("opacity-50", "cursor-not-allowed");
                }
            });
    }

    function checkActivationPeriod() {
        const today = new Date();
        if (activationStart && activationEnd) {
            if (today >= activationStart && today <= activationEnd) {
                if (enrollBtn) {
                    enrollBtn.disabled = false;
                    enrollBtn.classList.remove("opacity-50", "cursor-not-allowed");
                }
            } else {
                if (enrollBtn) {
                    enrollBtn.disabled = true;
                    enrollBtn.classList.add("opacity-50", "cursor-not-allowed");
                }
            }
        }
    }

    function loadActivationPeriod() {
        fetch("../php/get_activation.php")
            .then(res => res.json())
            .then(data => {
                if (data.status === "success" && data.data) {
                    document.getElementById("startDate").value = data.data.start_date;
                    document.getElementById("endDate").value = data.data.end_date;
                }
            })
            .catch(() => { });
    }

    fetchActivationPeriod();
});


//school year period 
document.addEventListener('DOMContentLoaded', () => {
    const schoolYearLink = document.getElementById('schoolyearPeriod');
    const modal = document.getElementById('schoolyearModal');
    const cancelBtn = document.getElementById('cancelSchoolyear');
    const saveBtn = document.getElementById('saveSchoolyear');

    const schoolyearStart = document.getElementById('schoolyearStart');
    const schoolyearEnd = document.getElementById('schoolyearEnd');

    if (!schoolYearLink || !modal) {
        console.error("School year link or modal not found");
        return;
    }

    // Open modal and load saved values
    schoolYearLink.addEventListener('click', async (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');

        try {
            const res = await fetch('../php/get_active_schoolyear.php');
            const data = await res.json();
            if (data.status === 'success' && data.data) {
                if (schoolyearStart) schoolyearStart.value = data.data.start_date || '';
                if (schoolyearEnd) schoolyearEnd.value = data.data.end_date || '';
            }
        } catch (err) {
            console.error("Failed to load school year period:", err);
        }
    });

    // Close modal
    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Save button
    saveBtn.addEventListener('click', async () => {
        if (!schoolyearStart || !schoolyearEnd) return;

        const start = schoolyearStart.value;
        const end = schoolyearEnd.value;

        if (!start || !end) {
            alert('Please fill in both start and end dates.');
            return;
        }

        try {
            const res = await fetch('../php/save_schoolyear.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start_date: start, end_date: end })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('School Year Period saved!');
                modal.classList.add('hidden');
            } else {
                alert('Failed to save period: ' + (data.message || 'Unknown error'));
            }

        } catch (err) {
            console.error(err);
            alert('Error saving period.');
        }
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const bannerBtn = document.getElementById("frontpage-banner");
    const bannerModal = document.getElementById("bannerModal");
    const closeModal = document.getElementById("closeModal");
    const bannerForm = document.getElementById("bannerForm");
    const photoInputs = document.getElementById("photoInputs");
    const addPhotoBtn = document.getElementById("addPhoto");
    const homePane = document.getElementById("home-pane");

    // Container for current banners (below addPhotoBtn)
    let currentBanners = document.createElement("div");
    currentBanners.id = "currentBanners";
    currentBanners.className = "space-y-3 mt-4";
    addPhotoBtn.insertAdjacentElement("afterend", currentBanners);

    // === Modal Open / Close ===
    bannerBtn.addEventListener("click", e => {
        e.preventDefault();
        loadBanners();
        bannerModal.classList.remove("hidden");
    });

    closeModal.addEventListener("click", () => {
        bannerModal.classList.add("hidden");
    });

    // === Drag & Drop for photo inputs ===
    let dragSrcEl = null;

    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", this.outerHTML);
        this.classList.add("opacity-50");
    }

    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        return false;
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        if (dragSrcEl !== this) {
            dragSrcEl.outerHTML = this.outerHTML;
            this.outerHTML = e.dataTransfer.getData("text/html");
            attachDnDHandlers();
            updatePhotoLabels();
        }
        return false;
    }

    function handleDragEnd() {
        this.classList.remove("opacity-50");
    }

    function attachDnDHandlers() {
        let items = photoInputs.querySelectorAll(".photo-item");
        items.forEach((item) => {
            item.addEventListener("dragstart", handleDragStart, false);
            item.addEventListener("dragover", handleDragOver, false);
            item.addEventListener("drop", handleDrop, false);
            item.addEventListener("dragend", handleDragEnd, false);
        });
    }

    function updatePhotoLabels() {
        const items = photoInputs.querySelectorAll(".photo-item .photo-label");
        items.forEach((label, idx) => {
            label.textContent = `PHOTO ${idx + 1}`;
        });
    }

    // === Add Photo Input ===
    addPhotoBtn.addEventListener("click", () => {
        const wrapper = document.createElement("div");
        wrapper.className = "photo-item flex gap-3 items-center bg-gray-50 p-2 rounded-lg shadow-sm cursor-move";
        wrapper.setAttribute("draggable", "true");
        wrapper.innerHTML = `
            <span class="photo-label font-semibold">PHOTO</span>
            <input type="file" name="bannerPhotos[]" class="flex-1 border rounded-lg p-2 bg-white shadow-sm">
            <button type="button" class="removePhoto px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow">
                ✕
            </button>
        `;
        photoInputs.appendChild(wrapper);
        attachDnDHandlers();
        updatePhotoLabels();

        wrapper.querySelector(".removePhoto").addEventListener("click", () => {
            wrapper.remove();
            updatePhotoLabels();
        });
    });

    // === Load Banners (modal + homepage slideshow) ===
    async function loadBanners() {
        try {
            const res = await fetch("../php/get-banners.php");
            const data = await res.json();

            if (!data.success) return;

            currentBanners.innerHTML = "";
            homePane.innerHTML = "";

            if (data.data.length === 0) {
                homePane.innerHTML = `<p class="text-gray-500 text-center">No banners set.</p>`;
                return;
            }

            // ---- Modal thumbnails ----
            data.data.forEach(banner => {
                const item = document.createElement("div");
                item.className = "flex items-center justify-between bg-gray-100 p-2 rounded-lg shadow-sm";
                item.innerHTML = `
                    <div class="flex items-center gap-3">
                        <img src="../${banner.image_path}" class="h-16 w-28 object-cover rounded-lg border shadow">
                        <span class="text-sm text-gray-600">ID: ${banner.id}</span>
                    </div>
                    <button data-id="${banner.id}" 
                            class="deleteBanner px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow">
                        Delete
                    </button>
                `;
                currentBanners.appendChild(item);
            });
            // ---- Homepage Slideshow ----
            if (data.data.length === 1) {
                const img = document.createElement("img");
                img.src = "../" + data.data[0].image_path;
                img.className = "w-full h-full object-cover rounded-xl shadow-lg";
                homePane.appendChild(img);
            } else if (data.data.length > 1) {
                let idx = 0;
                const slideshow = document.createElement("div");
                slideshow.className = "relative w-full h-full overflow-hidden rounded-xl shadow-lg";

                const images = data.data.map((b, i) => {
                    const img = document.createElement("img");
                    img.src = "../" + b.image_path;
                    img.className =
                        "absolute inset-0 w-full h-full object-cover transition-opacity duration-700 " +
                        (i === 0 ? "opacity-100" : "opacity-0");
                    slideshow.appendChild(img);
                    return img;
                });

                // Button container (top-right)
                const btnContainer = document.createElement("div");
                btnContainer.className =
                    "absolute top-3 right-3 flex space-x-2 z-10";

                const baseBtnClass =
                    "bg-black bg-opacity-50 hover:bg-opacity-70 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md transition";

                const prevBtn = document.createElement("button");
                prevBtn.textContent = "Prev";
                prevBtn.className = baseBtnClass;

                const nextBtn = document.createElement("button");
                nextBtn.textContent = "Next";
                nextBtn.className = baseBtnClass;

                btnContainer.appendChild(prevBtn);
                btnContainer.appendChild(nextBtn);
                slideshow.appendChild(btnContainer);

                function showSlide(newIdx) {
                    images[idx].classList.replace("opacity-100", "opacity-0");
                    idx = (newIdx + images.length) % images.length;
                    images[idx].classList.replace("opacity-0", "opacity-100");
                }

                prevBtn.addEventListener("click", () => showSlide(idx - 1));
                nextBtn.addEventListener("click", () => showSlide(idx + 1));

                setInterval(() => showSlide(idx + 1), 4000);

                homePane.appendChild(slideshow);
            }

            // ---- Delete buttons ----
            currentBanners.querySelectorAll(".deleteBanner").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.dataset.id;
                    if (!confirm("Delete this banner?")) return;

                    const fd = new FormData();
                    fd.append("id", id);

                    const res = await fetch("../php/delete-banner.php", {
                        method: "POST",
                        body: fd
                    });

                    const result = await res.json();
                    if (result.success) {
                        loadBanners();
                    }
                });
            });
        } catch (err) {
            console.error("Error loading banners:", err);
        }
    }

    // === Handle Uploads ===
    bannerForm.addEventListener("submit", async e => {
        e.preventDefault();

        const fileInputs = bannerForm.querySelectorAll("input[type='file']");
        let hasFile = false;
        const fd = new FormData();

        fileInputs.forEach(input => {
            if (input.files.length > 0) {
                hasFile = true;
                for (let f of input.files) {
                    fd.append("bannerPhotos[]", f);
                }
            }
        });

        if (!hasFile) {
            alert("Please choose at least one photo.");
            return;
        }

        try {
            const res = await fetch("../php/upload-banner.php", {
                method: "POST",
                body: fd
            });
            const result = await res.json();

            if (result.some(r => r.success)) {
                photoInputs.innerHTML = "";
                loadBanners();
            } else {
                alert("Upload failed.");
            }
        } catch (err) {
            console.error("Upload error:", err);
        }
    });

    // Load slideshow immediately when page loads
    loadBanners();
});
//testing changes

//file maintenance(section)
document.addEventListener("DOMContentLoaded", () => {
    const fileModal = document.getElementById("file-modal");
    const fileModalClose = document.getElementById("file-modal-close");
    const fileModalContent = document.getElementById("file-modal-content");

    const sectionBtn = document.querySelector('#file-maintenance-pane button:nth-child(1)');

    if (sectionBtn) {
        sectionBtn.addEventListener("click", async () => {
            fileModalContent.innerHTML = "";
            fileModal.classList.remove("hidden");

            try {
                const sectionsRes = await fetch("../php/fetch_section.php", { credentials: "include" });
                const sections = await sectionsRes.json();

                if (!sections || sections.length === 0) {
                    fileModalContent.innerHTML = "<p>No sections available.</p>";
                    return;
                }

                const container = document.createElement("div");
                container.className = "mb-4 flex items-center gap-2";

                // Dropdown
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

                // Delete Button
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete Section";
                deleteBtn.className = "px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700";
                container.appendChild(deleteBtn);

                fileModalContent.appendChild(container);

                select.addEventListener("change", async () => {
                    const sectionName = select.value;
                    if (!sectionName) return;

                    const oldTable = document.getElementById("file-table");
                    const oldTotal = document.getElementById("file-total");
                    if (oldTable) oldTable.remove();
                    if (oldTotal) oldTotal.remove();

                    try {
                        const studentsRes = await fetch(`../php/get_section_students.php?section_name=${encodeURIComponent(sectionName)}`, { credentials: "include" });
                        const students = await studentsRes.json();

                        if (students.error) {
                            fileModalContent.innerHTML += `<p>${students.error}</p>`;
                            return;
                        }

                        const totalText = document.createElement("p");
                        totalText.id = "file-total";
                        totalText.className = "mb-2 font-semibold text-gray-200";
                        totalText.textContent = `Total Students: ${students.length}`;
                        fileModalContent.appendChild(totalText);

                        const table = document.createElement("table");
                        table.id = "file-table";
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
                        fileModalContent.appendChild(table);

                    } catch (err) {
                        console.error(err);
                        alert("Failed to fetch students in section.");
                    }
                });

                // Delete Section
                deleteBtn.addEventListener("click", async () => {
                    const sectionName = select.value;
                    if (!sectionName) {
                        alert("Please select a section to delete.");
                        return;
                    }

                    if (!confirm(`Are you sure you want to delete the section "${sectionName}"? This action cannot be undone.`)) return;

                    try {
                        const res = await fetch("../php/delete_section.php", {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ section_name: sectionName })
                        });

                        const result = await res.json();

                        if (result.success) {
                            alert("Section deleted successfully.");
                            select.querySelector(`option[value="${sectionName}"]`).remove();
                            const oldTable = document.getElementById("file-table");
                            const oldTotal = document.getElementById("file-total");
                            if (oldTable) oldTable.remove();
                            if (oldTotal) oldTotal.remove();
                        } else {
                            alert("Failed to delete section: " + result.error);
                        }
                    } catch (err) {
                        console.error(err);
                        alert("Error deleting section.");
                    }
                });

            } catch (err) {
                console.error(err);
                fileModalContent.innerHTML = "<p class='text-red-400'>Error loading sections.</p>";
            }
        });
    }

    fileModalClose.addEventListener("click", () => {
        fileModal.classList.add("hidden");
    });

    window.addEventListener("click", (e) => {
        if (e.target === fileModal) {
            fileModal.classList.add("hidden");
        }
    });
});



//file maintenance(student)
document.addEventListener("DOMContentLoaded", () => {
    const studentBtn = document.getElementById("studentBtn");
    const fileModal = document.getElementById("file-modal");
    const fileModalContent = document.getElementById("file-modal-content");
    const fileModalClose = document.getElementById("file-modal-close");

    if (studentBtn) {
        studentBtn.addEventListener("click", async () => {
            fileModalContent.innerHTML = "";
            fileModal.classList.remove("hidden");

            try {
                const loginRes = await fetch("../php/get_assigned_level.php", { method: "GET", credentials: "include" });
                const loginData = await loginRes.json();

                if (!loginData.success || !loginData.assigned_level) {
                    return alert("Unable to determine assigned level.");
                }

                const assignedLevel = loginData.assigned_level.toLowerCase();

                const studentsRes = await fetch(`../php/get_all_students.php?level=${encodeURIComponent(assignedLevel)}`, { credentials: "include" });
                const studentsData = await studentsRes.json();

                if (!studentsData.success) {
                    fileModalContent.innerHTML = `<p>${studentsData.message}</p>`;
                    return;
                }

                const students = studentsData.students;

                const table = document.createElement("table");
                table.className = "w-full border border-gray-600 text-sm text-gray-200";
                table.id = "student-table";

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
                        `).join("")}
                    </tbody>
                `;

                fileModalContent.appendChild(table);

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
                alert("Error loading student data.");
            }
        });
    }

    fileModalClose.addEventListener("click", () => fileModal.classList.add("hidden"));
    window.addEventListener("click", e => { if (e.target === fileModal) fileModal.classList.add("hidden"); });
});

//file maintenance(subjects)
document.addEventListener("DOMContentLoaded", () => {
    const subjectBtn = document.getElementById("subjectBtn");
    const fileModal = document.getElementById("file-modal");
    const fileModalContent = document.getElementById("file-modal-content");
    const fileModalClose = document.getElementById("file-modal-close");

    if (subjectBtn) {
        subjectBtn.addEventListener("click", async () => {
            fileModalContent.innerHTML = "";
            fileModal.classList.remove("hidden");

            try {
                const levelRes = await fetch("../php/get_assigned_level.php", { credentials: "include" });
                const levelData = await levelRes.json();

                if (!levelData.success || !levelData.assigned_level) {
                    fileModalContent.innerHTML = `<p>Unable to determine assigned level.</p>`;
                    return;
                }

                const assignedLevel = levelData.assigned_level.toLowerCase();

                const subjectsRes = await fetch("../php/fetch_subjects.php", { credentials: "include" });
                const subjectsData = await subjectsRes.json();

                if (!subjectsData.success) {
                    fileModalContent.innerHTML = `<p>Failed to fetch subjects.</p>`;
                    return;
                }

                let subjects = subjectsData.subjects;

                const topControls = document.createElement("div");
                topControls.className = "flex justify-between items-center mb-4";

                const addBtn = document.createElement("button");
                addBtn.className = "bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500";
                addBtn.textContent = "Add Subject";
                topControls.appendChild(addBtn);

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

                fileModalContent.appendChild(topControls);

                const table = document.createElement("table");
                table.className = "w-full border border-gray-600 text-sm text-gray-200";
                table.id = "subjects-table";
                fileModalContent.appendChild(table);

                function renderTable(list) {
                    if (assignedLevel === "junior high") {
                        table.innerHTML = `
                        <thead class="bg-gray-700 text-white">
                            <tr><th>Name</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            ${list.map(s => `
                                <tr data-id="${s.subject_id}">
                                    <td><input type="text" value="${s.name}" class="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600" readonly></td>
                                    <td class="text-center">
                                        <button class="delete-btn bg-red-600 px-2 py-1 rounded hover:bg-red-500 text-white">Delete</button>
                                    </td>
                                </tr>`).join("")}
                        </tbody>`;
                    } else {
                        table.innerHTML = `
                        <thead class="bg-gray-700 text-white">
                            <tr><th>Subcode</th><th>Name</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            ${list.map(s => `
                                <tr data-id="${s.subject_id}">
                                    <td><input type="text" value="${s.subcode}" class="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600" readonly></td>
                                    <td><input type="text" value="${s.name}" class="w-full bg-gray-800 text-white px-2 py-1 rounded border border-gray-600" readonly></td>
                                    <td class="text-center">
                                        <button class="delete-btn bg-red-600 px-2 py-1 rounded hover:bg-red-500 text-white">Delete</button>
                                    </td>
                                </tr>`).join("")}
                        </tbody>`;
                    }

                    table.querySelectorAll(".delete-btn").forEach(btn => {
                        btn.addEventListener("click", async (e) => {
                            const row = e.target.closest("tr");
                            const subject_id = Number(row.dataset.id);
                            const level = assignedLevel.toLowerCase();

                            if (!confirm("Are you sure you want to delete this subject?")) return;

                            row.innerHTML = `<td colspan="3" class="text-center text-yellow-400">Deleting...</td>`;

                            try {
                                const res = await fetch("../php/delete_subject.php", {
                                    method: "POST",
                                    credentials: "include",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: subject_id, level })
                                });

                                const text = await res.text();
                                console.log("Raw response:", text);
                                const data = JSON.parse(text);

                                if (data.success) {
                                    row.remove();
                                } else {
                                    alert("Failed to delete: " + data.message);
                                }
                            } catch (err) {
                                console.error(err);
                                alert("Error deleting subject.");
                            }
                        });
                    });
                }

                renderTable(subjects);

                addBtn.addEventListener("click", () => {
                    const newRow = document.createElement("tr");
                    if (assignedLevel === "junior high") {
                        newRow.innerHTML = `
                            <td><input type="text" name="name" class="w-full px-2 py-1 rounded border border-gray-600 bg-gray-800 text-white"></td>
                            <td class="text-center">
                                <button class="save-new-btn bg-blue-600 px-2 py-1 rounded hover:bg-blue-500 text-white">Save</button>
                            </td>`;
                    } else {
                        newRow.innerHTML = `
                            <td><input type="text" name="subcode" class="w-full px-2 py-1 rounded border border-gray-600 bg-gray-800 text-white"></td>
                            <td><input type="text" name="name" class="w-full px-2 py-1 rounded border border-gray-600 bg-gray-800 text-white"></td>
                            <td class="text-center">
                                <button class="save-new-btn bg-blue-600 px-2 py-1 rounded hover:bg-blue-500 text-white">Save</button>
                            </td>`;
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
                                body: JSON.stringify({ subcode, name, level: assignedLevel })
                            });

                            const text = await res.text();
                            console.log("Raw add response:", text);
                            const data = JSON.parse(text);

                            if (data.success) {
                                alert("Subject added!");
                                subjects.push({ subject_id: data.id, subcode, name });
                                renderTable(subjects);
                            } else {
                                alert("Failed to add: " + data.message);
                            }
                        } catch (err) {
                            console.error(err);
                            alert("Failed to add subject.");
                        }
                    });
                });

            } catch (err) {
                console.error(err);
                alert("Error loading subjects.");
            }
        });
    }

    fileModalClose.addEventListener("click", () => fileModal.classList.add("hidden"));
    window.addEventListener("click", e => { if (e.target === fileModal) fileModal.classList.add("hidden"); });
});


//file maintenance(teacher)
const teacherBtn = document.getElementById("teacherBtn");

teacherBtn.addEventListener("click", async () => {
    const modal = document.getElementById("file-modal");
    const modalContent = document.getElementById("file-modal-content");
    modal.classList.remove("hidden");
    modalContent.innerHTML = "<p class='text-gray-300'>Loading teachers...</p>";

    try {
        const res = await fetch("../php/fetch_teachers.php");
        const data = await res.json();

        if (!data.success) {
            modalContent.innerHTML = "<p>Failed to load teachers.</p>";
            return;
        }

        const teachers = data.teachers;

        // Fetch subjects for dropdown
        const subjRes = await fetch("../php/fetch_subjects.php");
        const subjData = await subjRes.json();
        const subjects = subjData.success ? subjData.subjects.map(s => s.name) : [];

        modalContent.innerHTML = `
            <table class="w-full border border-gray-600 text-sm text-gray-200">
                <thead class="bg-gray-700 text-white">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Assigned Level</th>
                        <th>Subjects</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${teachers.map(t => `
                        <tr class="border-b border-gray-700">
                            <td class="px-2 py-1">${t.teacher_id}</td>
                            <td class="px-2 py-1">${t.firstname} ${t.middlename || ""} ${t.lastname}</td>
                            <td class="px-2 py-1">${t.email}</td>
                            <td class="px-2 py-1">${t.assigned_level}</td>
                            <td class="px-2 py-1 subjects-cell">${t.subjects || ""}</td>
                            <td class="px-2 py-1 text-center">
                                <button class="edit-btn bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 transition duration-200">
                                    Edit
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

        // --- Edit / Save button logic ---
        modalContent.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const row = btn.closest("tr");
                const teacherId = row.children[0].textContent.trim();
                const subjectCell = row.querySelector(".subjects-cell");

                // --- Edit Mode ---
                if (btn.textContent.trim() === "Edit") {
                    btn.textContent = "Save";
                    btn.classList.remove("bg-blue-600", "hover:bg-blue-500");
                    btn.classList.add("bg-green-600", "hover:bg-green-500");

                    // Create dropdown for selecting new subject
                    const dropdown = document.createElement("select");
                    dropdown.className = "mt-1 px-2 py-1 bg-gray-700 text-white rounded w-full";
                    dropdown.innerHTML = `<option value="">-- Select Subject to Add --</option>` +
                        subjects.map(s => `<option value="${s}">${s}</option>`).join("");

                    // Remove any existing dropdown before adding new
                    const existingDropdown = subjectCell.querySelector("select");
                    if (existingDropdown) existingDropdown.remove();

                    subjectCell.appendChild(dropdown);
                    return; // stop here until Save is clicked
                }

                // --- Save Mode ---
                if (btn.textContent.trim() === "Save") {
                    const dropdown = subjectCell.querySelector("select");
                    const selectedSubject = dropdown?.value?.trim();

                    if (!selectedSubject) {
                        alert("Please select a subject to add.");
                        return;
                    }

                    // Get current subjects (ignore dropdown)
                    const textOnly = Array.from(subjectCell.childNodes)
                        .filter(n => n.nodeType === Node.TEXT_NODE)
                        .map(n => n.textContent)
                        .join("")
                        .trim();

                    const existingSubjects = textOnly
                        .split(",")
                        .map(s => s.trim())
                        .filter(Boolean);

                    if (existingSubjects.includes(selectedSubject)) {
                        alert("This subject is already assigned to the teacher.");
                        return;
                    }

                    const finalSubjects = [...existingSubjects, selectedSubject];

                    const updateRes = await fetch("../php/update_teacher_info.php", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            teacher_id: teacherId,
                            subjects: finalSubjects.join(", "),
                        }),
                    });

                    const updateData = await updateRes.json();

                    if (updateData.success) {
                        alert("✅ Teacher updated successfully!");
                        subjectCell.textContent = finalSubjects.join(", ");
                    } else {
                        alert("❌ Update failed: " + updateData.message);
                    }

                    // Reset button to Edit
                    btn.textContent = "Edit";
                    btn.classList.remove("bg-green-600", "hover:bg-green-500");
                    btn.classList.add("bg-blue-600", "hover:bg-blue-500");
                }
            });
        });

    } catch (err) {
        console.error(err);
        modalContent.innerHTML = "<p>Error loading teachers.</p>";
    }
});
// file maintenance(parent)
const parentBtn = document.getElementById("parentBtn");

parentBtn.addEventListener("click", async () => {
    const modal = document.getElementById("file-modal");
    const modalContent = document.getElementById("file-modal-content");

    modal.classList.remove("hidden");
    modalContent.innerHTML = "<p class='text-gray-300'>Loading parents...</p>";

    try {
        const res = await fetch("../php/fetch_parents.php");
        const data = await res.json();

        if (!data.success) {
            modalContent.innerHTML = "<p>Failed to load parents.</p>";
            return;
        }

        const parents = data.parents;

        modalContent.innerHTML = `
            <div class="overflow-auto h-[600px]">
                <table class="w-full border border-gray-600 text-sm text-gray-200">
                    <thead class="bg-gray-700 text-white sticky top-0">
                        <tr>
                            <th class="px-2 py-2">First Name</th>
                            <th class="px-2 py-2">Last Name</th>
                            <th class="px-2 py-2">IRN</th>
                            <th class="px-2 py-2">Email</th>
                            <th class="px-2 py-2">Password</th>
                            <th class="px-2 py-2">Student</th>
                            <th class="px-2 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parents.map((p, index) => `
                            <tr class="border-b border-gray-700 hover:bg-gray-700 transition">
                                <td class="px-2 py-1 text-center firstname-cell">${p.firstname || ""}</td>
                                <td class="px-2 py-1 text-center lastname-cell">${p.lastname || ""}</td>
                                <td class="px-2 py-1 text-center irn-cell">${p.lrn || ""}</td>
                                <td class="px-2 py-1 text-center email-cell">${p.email || ""}</td>
                                <td class="px-2 py-1 text-center password-cell">${p.password || ""}</td>
                                <td class="px-2 py-1 text-center student-cell">${p.student || ""}</td>
                                <td class="px-2 py-1 text-center">
                                    <button class="edit-btn bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 transition duration-200">
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;

        // Add Edit → Save functionality for all columns
        modalContent.querySelectorAll(".edit-btn").forEach((btn, index) => {
            btn.addEventListener("click", async () => {
                const row = btn.closest("tr");

                const cells = {
                    firstname: row.querySelector(".firstname-cell"),
                    lastname: row.querySelector(".lastname-cell"),
                    irn: row.querySelector(".irn-cell"),
                    email: row.querySelector(".email-cell"),
                    password: row.querySelector(".password-cell"),
                    student: row.querySelector(".student-cell")
                };

                // --- Edit mode ---
                if (btn.textContent.trim() === "Edit") {
                    btn.textContent = "Save";
                    btn.classList.remove("bg-blue-600", "hover:bg-blue-500");
                    btn.classList.add("bg-green-600", "hover:bg-green-500");

                    // Turn all cells into input fields
                    for (const key in cells) {
                        const value = cells[key].textContent.trim();
                        cells[key].innerHTML = `<input type="text" class="w-full bg-gray-700 text-white px-1 py-0.5 rounded" value="${value}">`;
                    }
                    return;
                }

                // --- Save mode ---
                const updatedData = {};
                for (const key in cells) {
                    updatedData[key] = cells[key].querySelector("input")?.value.trim() || "";
                }

                // Send updated data to PHP
                const updateRes = await fetch("../php/update_parent_info.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include", // ✅ ensures session cookies are sent
                    body: JSON.stringify({
                        parent_email: parents[index].email, // identify parent by email or use parent_id
                        ...updatedData
                    }),
                });
                

                const updateData = await updateRes.json();

                if (updateData.success) {
                    alert("✅ Parent updated successfully!");
                    for (const key in cells) {
                        cells[key].textContent = updatedData[key] || updatedData[key] === "" ? updatedData[key] : updatedData[key];
                    }
                } else {
                    alert("❌ Update failed: " + updateData.message);
                }

                // Switch button back to Edit
                btn.textContent = "Edit";
                btn.classList.remove("bg-green-600", "hover:bg-green-500");
                btn.classList.add("bg-blue-600", "hover:bg-blue-500");
            });
        });

    } catch (err) {
        console.error(err);
        modalContent.innerHTML = "<p>Error loading parents.</p>";
    }
});
//file maintenance(schedule per section)
const scheduleBtn = document.getElementById("scheduleBtn");

scheduleBtn.addEventListener("click", async () => {
    const modal = document.getElementById("file-modal");
    const modalContent = document.getElementById("file-modal-content");

    modal.classList.remove("hidden");
    modalContent.innerHTML = "<p class='text-gray-300'>Loading sections...</p>";

    try {
        // Fetch sections for dropdown
        const sectionRes = await fetch("../php/fetch_section.php");
        const sections = await sectionRes.json(); // this is already an array

        if (!sections || !Array.isArray(sections) || sections.length === 0) {
            modalContent.innerHTML = "<p>No sections found.</p>";
            return;
        }

        // Create section dropdown
        const dropdown = document.createElement("select");
        dropdown.className = "px-2 py-1 rounded bg-gray-700 text-white mb-4";
        dropdown.innerHTML = `<option value="">-- Select Section --</option>` +
            sections.map(s => `<option value="${s.section_id}">${s.section_name}</option>`).join("");

        modalContent.innerHTML = "";
        modalContent.appendChild(dropdown);


        const scheduleDiv = document.createElement("div");
        scheduleDiv.className = "overflow-auto h-[400px]";
        modalContent.appendChild(scheduleDiv);

        dropdown.addEventListener("change", async () => {
            const sectionId = dropdown.value;
            if (!sectionId) {
                scheduleDiv.innerHTML = "<p class='text-gray-300'>Select a section to see the schedule.</p>";
                return;
            }

            // Fetch schedule for selected section
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

            const schedules = data.schedules;
            if (schedules.length === 0) {
                scheduleDiv.innerHTML = "<p>No schedules found for this section.</p>";
                return;
            }

            // Build table: time as rows, days as columns
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
        });

    } catch (err) {
        console.error(err);
        modalContent.innerHTML = "<p>Error loading schedule.</p>";
    }
});

//file maintenanve(archive)
document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const panes = document.querySelectorAll(".content-pane");
    const paneTitle = document.getElementById("pane-title");
    const archivedBtn = document.getElementById("archivedBtn");
    let currentSectionId = null;

    // --- Navigation ---
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetPaneId = item.getAttribute("data-pane");
            const targetPane = document.getElementById(targetPaneId);
            panes.forEach(pane => pane.classList.add("hidden"));
            if (targetPane) targetPane.classList.remove("hidden");
            if (paneTitle) paneTitle.textContent = item.getAttribute("data-title") || "";
        });
    });

    // --- Archived Button Click ---
    if (archivedBtn) {
        archivedBtn.addEventListener("click", async () => {
            if (paneTitle) paneTitle.textContent = "Archived Sections";

            const archivedModal = document.createElement("div");
            archivedModal.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 z-40 overflow-auto";

            archivedModal.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-5xl relative flex flex-col">
                    <h2 class="text-lg font-semibold mb-4">Archived Sections</h2>
                    <div class="overflow-x-auto max-h-[60vh]">
                        <table class="min-w-full border border-gray-300 text-sm rounded-lg">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="border px-4 py-2 text-left">Section</th>
                                    <th class="border px-4 py-2 text-left">Year Level</th>
                                    <th class="border px-4 py-2 text-left">Total Students</th>
                                    <th class="border px-4 py-2 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody id="archived-sections-table-body">
                                <tr><td colspan="4" class="text-center text-gray-500 py-2 border">Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="flex justify-end mt-4 gap-2">
                        <button id="archived-close" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Close</button>
                    </div>
                </div>
            `;

            document.body.appendChild(archivedModal);

            const tableBody = document.getElementById("archived-sections-table-body");
            const closeBtn = document.getElementById("archived-close");

            closeBtn.addEventListener("click", () => archivedModal.remove());

            try {
                const res = await fetch(`../php/fetch_sections.php?status=archived`);
                const data = await res.json();

                tableBody.innerHTML = "";

                if (!Array.isArray(data) || data.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 py-2 border">No sections found.</td></tr>`;
                    return;
                }

                data.forEach(section => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td class="px-4 py-2 border">${section.section_name}</td>
                        <td class="px-4 py-2 border">${section.grade_level || "N/A"}</td>
                        <td class="px-4 py-2 border">${section.total_students || "0"}</td>
                        <td class="px-4 py-2 border">
                            <button 
                                class="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 view-btn"
                                data-id="${section.section_id}"
                                data-name="${section.section_name}"
                            >
                                View Students
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                document.querySelectorAll(".view-btn").forEach(btn => {
                    btn.addEventListener("click", async () => {
                        currentSectionId = btn.dataset.id;
                        const sectionName = btn.dataset.name;
                        archivedModal.remove();
                        await openStudentsModal(currentSectionId, sectionName);
                    });
                });

            } catch (err) {
                console.error("Error loading sections:", err);
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 py-2 border">Failed to load sections.</td></tr>`;
            }
        });
    }

    // --- Students Modal ---
    async function openStudentsModal(sectionId, sectionName) {
        const studentModal = document.createElement("div");
        studentModal.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 z-50 overflow-auto";

        studentModal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-4xl relative flex flex-col">
                <h2 class="text-lg font-semibold mb-4">Students in ${sectionName}</h2>
                <div id="student-list-container" class="overflow-y-auto max-h-[60vh] border rounded"></div>
                <div class="flex justify-end mt-4 gap-2">
                    <button id="student-re-enroll-btn" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Re-enroll</button>
                    <button id="student-close-btn" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(studentModal);

        const studentListContainer = document.getElementById("student-list-container");
        const closeBtn = document.getElementById("student-close-btn");
        const reEnrollBtn = document.getElementById("student-re-enroll-btn");

        closeBtn.addEventListener("click", () => studentModal.remove());
        reEnrollBtn.style.display = "none";

        try {
            const res = await fetch(`../php/get_section_students.php?section_id=${encodeURIComponent(sectionId)}&section_name=${encodeURIComponent(sectionName)}`);
            const data = await res.json();

            studentListContainer.innerHTML = "";
            if (!Array.isArray(data) || data.length === 0) {
                studentListContainer.innerHTML = `<p class="text-gray-500">No students found.</p>`;
                return;
            }

            const table = document.createElement("table");
            table.className = "min-w-full divide-y divide-gray-200 border";
            table.innerHTML = `
                <thead class="bg-gray-100">
                    <tr>
                        <th class="px-4 py-2 text-center"><input type="checkbox" id="select-all" /></th>
                        <th class="px-4 py-2 text-left">Student</th>
                    </tr>
                </thead>
            `;
            const tbody = document.createElement("tbody");

            data.forEach(student => {
                const row = document.createElement("tr");
                if (student.failed) row.classList.add("bg-red-200");
                row.innerHTML = `
                    <td class="px-4 py-2 border text-center">
                        <input type="checkbox" class="student-checkbox" data-student="${encodeURIComponent(student.student_name)}">
                    </td>
                    <td class="px-4 py-2 border">
                        ${student.student_name} (${student.strand || "N/A"} - Grade ${student.grade_level || "N/A"})
                    </td>
                `;
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            studentListContainer.appendChild(table);

            reEnrollBtn.style.display = "inline-block";

            // --- Select All Checkbox ---
            const selectAll = studentModal.querySelector("#select-all");
            selectAll.addEventListener("change", e => {
                const checked = e.target.checked;
                studentModal.querySelectorAll(".student-checkbox").forEach(cb => cb.checked = checked);
            });

            // --- Re-enroll Click ---
            reEnrollBtn.onclick = async () => {
                const selectedStudents = Array.from(studentListContainer.querySelectorAll(".student-checkbox:checked"))
                    .map(cb => decodeURIComponent(cb.dataset.student));

                if (selectedStudents.length === 0) {
                    alert("Please select at least one student to re-enroll.");
                    return;
                }

                let strands = [];
                try {
                    const res = await fetch("../php/get_strands.php");
                    const result = await res.json();
                    if (result.success && Array.isArray(result.data)) strands = result.data;
                } catch (err) {
                    console.error("Error loading strands:", err);
                }

                // --- Re-enroll Modal ---
                const enrollModal = document.createElement("div");
                enrollModal.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50";

                enrollModal.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg w-96 relative z-50">
            <h2 class="text-lg font-semibold mb-4">Re-enroll Students</h2>
            
            <label class="block mb-2">Section Name</label>
            <input type="text" id="new-section-name" class="w-full border p-2 rounded mb-4" placeholder="Enter new section name">

            <label class="block mb-2">Grade Level</label>
            <select id="grade-level" class="w-full border p-2 rounded mb-4">
                <option value="11">11</option>
                <option value="12">12</option>
            </select>

            <label class="block mb-2">Semester</label>
            <select id="semester" class="w-full border p-2 rounded mb-4">
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
            </select>

            <label class="block mb-2">Strand</label>
            <select id="strand" class="w-full border p-2 rounded mb-4">
                ${strands.map(s => `<option value="${s}">${s}</option>`).join("")}
            </select>

            <div class="flex justify-end gap-2">
                <button id="cancel-enroll-modal" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                <button id="confirm-enroll-modal" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Confirm</button>
            </div>
        </div>
    `;
                document.body.appendChild(enrollModal);

                enrollModal.querySelector("#cancel-enroll-modal").onclick = () => enrollModal.remove();

                enrollModal.querySelector("#confirm-enroll-modal").onclick = async () => {
                    const gradeLevel = Number(enrollModal.querySelector("#grade-level").value);
                    const semester = Number(enrollModal.querySelector("#semester").value);
                    const strand = enrollModal.querySelector("#strand").value;
                    const newSectionName = enrollModal.querySelector("#new-section-name").value.trim();

                    if (!newSectionName) {
                        alert("Please enter a section name.");
                        return;
                    }

                    const payload = {
                        section_id: Number(sectionId),
                        students: selectedStudents,
                        grade_level: gradeLevel,
                        semester: semester,
                        strand: strand,
                        new_section_name: newSectionName
                    };

                    console.log("Sending payload:", payload);

                    try {
                        const res = await fetch("../php/re_enroll_students.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });

                        const text = await res.text();
                        let result;
                        try { result = JSON.parse(text); } catch (err) {
                            console.error("Invalid JSON from server:", text);
                            alert("Server returned invalid JSON. Check console.");
                            return;
                        }

                        if (result.success) {
                            alert(result.message);
                            enrollModal.remove();
                            studentModal.remove();
                        } else alert("❌ " + result.message);

                    } catch (err) {
                        console.error("Re-enroll error:", err);
                        alert("Something went wrong during re-enroll.");
                    }
                };
            };
        } catch (err) {
            console.error("Error loading students:", err);
            studentListContainer.innerHTML = `<p class="text-red-500">Failed to load students.</p>`;
        }
    }
});

//audit trail
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("audit-table-body");
    const refreshBtn = document.getElementById("refresh-audit");
    const searchInput = document.getElementById("search-audit");
    const roleFilter = document.getElementById("role-filter");
    const fromDate = document.getElementById("from-date");
    const toDate = document.getElementById("to-date");

    const exportBtn = document.getElementById("export-audit");
    const exportDropdown = document.getElementById("export-dropdown");
    const pdfBtn = document.getElementById("export-pdf");
    const excelBtn = document.getElementById("export-excel");

    const modal = document.getElementById("audit-modal");
    const closeModal = document.getElementById("close-audit-modal");
    const modalUser = document.getElementById("modal-user");
    const modalRole = document.getElementById("modal-role");
    const modalAction = document.getElementById("modal-action");
    const modalDateTime = document.getElementById("modal-datetime");
    const modalIP = document.getElementById("modal-ip");
    const modalDetails = document.getElementById("modal-details");

    let allData = [];
    let currentData = [];

    async function fetchAudits() {
        try {
            const response = await fetch(`../php/fetch_audit.php`);
            const res = await response.json();
            allData = Array.isArray(res.data) ? res.data : [];
            applyFilters();
        } catch (err) {
            console.error("Error fetching audits:", err);
        }
    }

    function applyFilters() {
        const searchVal = searchInput.value.toLowerCase().trim();
        const selectedRole = roleFilter.value.toLowerCase().trim();
        const fromVal = fromDate.value ? new Date(fromDate.value) : null;
        const toVal = toDate.value ? new Date(toDate.value) : null;
    
        currentData = allData.filter(audit => {
            const auditDate = new Date(audit.timestamp);
            const auditRole = audit.role.toLowerCase().trim();
    
            const matchSearch =
                audit.username.toLowerCase().includes(searchVal) ||
                audit.action.toLowerCase().includes(searchVal);
    
            // Allow flexible role matching
            const matchRole =
                selectedRole === "" ||
                auditRole.includes(selectedRole) ||
                (selectedRole.endsWith("s") && auditRole.includes(selectedRole.slice(0, -1))) ||
                (auditRole.endsWith("s") && auditRole.includes(selectedRole));
    
            const matchFrom = !fromVal || auditDate >= fromVal;
            const matchTo = !toVal || auditDate <= toVal;
    
            return matchSearch && matchRole && matchFrom && matchTo;
        });
    
        renderTable();
    }
    

    function renderTable() {
        tableBody.innerHTML = "";
        if (currentData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No audit records found.</td></tr>`;
            return;
        }

        currentData.forEach((audit, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="px-4 py-3">${audit.username}</td>
                <td class="px-4 py-3">${audit.role}</td>
                <td class="px-4 py-3">${audit.action}</td>
                <td class="px-4 py-3">${audit.timestamp}</td>
                <td class="px-4 py-3">${audit.ip_address}</td>
                <td class="px-4 py-3 text-center">
                    <button class="view-btn text-blue-600 hover:underline text-sm" data-index="${index}">
                        View
                    </button>
                </td>`;
            tableBody.appendChild(row);
        });

        document.querySelectorAll(".view-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const audit = currentData[btn.dataset.index];
                modalUser.textContent = audit.username;
                modalRole.textContent = audit.role;
                modalAction.textContent = audit.action;
                modalDateTime.textContent = audit.timestamp;
                modalIP.textContent = audit.ip_address;
                modalDetails.textContent = audit.details;
                modal.classList.remove("hidden");
                modal.classList.add("flex");
            });
        });
    }

    function downloadExcel() {
        let csv = "User,Role,Action,Date & Time,IP Address,Details\n";
        currentData.forEach(audit => {
            const dateObj = new Date(audit.timestamp);
            const formatted = dateObj.toLocaleString('en-US', { hour12: false });
            csv += `"${audit.username}","${audit.role}","${audit.action}","${formatted}","${audit.ip_address}","${audit.details}"\n`;
        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "audit_log.csv";
        link.click();
    }

    function openPDF() {
        if (!currentData.length) return;
    
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
    
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Sulivan National High School", 105, 10, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Sulivan, Baliwag, Baliuag, Philippines, 3006", 105, 16, { align: "center" });
    
        const preparedBy = window.currentAdminName || "Admin";
        const exportDate = new Date().toLocaleString('en-US', { hour12: false });
        doc.setFontSize(10);
        doc.text(`Prepared By: ${preparedBy}`, 14, 24);
        doc.text(`Date: ${exportDate}`, 150, 24, { align: "right" });
    
        const bodyData = currentData.map(audit => {
            const dateObj = new Date(audit.timestamp);
            const formattedDate = dateObj.toLocaleString('en-US', { hour12: false });
            return [
                audit.username,
                audit.role,
                audit.action,
                audit.details,
                formattedDate
            ];
        });
    
        doc.autoTable({
            startY: 30,
            head: [['User', 'Role', 'Action', 'Details', 'Date & Time']],
            body: bodyData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [52, 58, 64], textColor: 255 },
        });
    
        const pdfBlob = doc.output('bloburl');
        window.open(pdfBlob, '_blank');
    }

    exportBtn.addEventListener("click", () => exportDropdown.classList.toggle("hidden"));
    excelBtn.addEventListener("click", downloadExcel);
    pdfBtn.addEventListener("click", openPDF);

    refreshBtn.addEventListener("click", fetchAudits);
    searchInput.addEventListener("input", applyFilters);
    roleFilter.addEventListener("change", applyFilters);
    fromDate.addEventListener("change", applyFilters);
    toDate.addEventListener("change", applyFilters);
    closeModal.addEventListener("click", () => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    });

    fetchAudits();
});
