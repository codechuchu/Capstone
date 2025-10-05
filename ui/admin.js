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

        fetch('/Capstone/php/save_teacher.php', {
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

    fetch('/Capstone/php/fetch_teachers.php')
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

    fetch('/Capstone/php/reset_password.php', {
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

    fetch('/Capstone/php/remove_teacher.php', {
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

//file maintenance
document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const panes = document.querySelectorAll(".content-pane");
    const paneTitle = document.getElementById("pane-title");
    const tableBody = document.getElementById("sections-table-body");

    const studentModal = document.getElementById("student-modal");
    const studentListContainer = document.getElementById("student-list");
    const studentClose = document.getElementById("student-close");

    let currentSectionId = null;

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetPaneId = item.getAttribute("data-pane");
            const targetPane = document.getElementById(targetPaneId);

            panes.forEach(pane => pane.classList.add("hidden"));
            if (targetPane) targetPane.classList.remove("hidden");

            if (paneTitle) paneTitle.textContent = item.getAttribute("data-title") || "";

            if (targetPaneId === "file-maintenance-pane") {
                loadSections();
            }
        });
    });

    async function loadSections() {
        if (!tableBody) return;

        try {
            const res = await fetch(`../php/fetch_sections.php?status=archived`);
            const data = await res.json();

            tableBody.innerHTML = "";

            if (!Array.isArray(data) || data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500 py-2 border">No sections found.</td></tr>`;
                return;
            }

            data.forEach(section => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="px-4 py-2 border">${section.section_name}</td>
                    <td class="px-4 py-2 border">${section.grade_level || "N/A"}</td>
                    <td class="px-4 py-2 border flex items-center justify-between">
                        <span>${section.total_students || "0"}</span>
                        <button 
                            class="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 view-btn"
                            data-id="${section.section_id}"
                            data-name="${section.section_name}"
                        >
                            View
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            document.querySelectorAll(".view-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    currentSectionId = btn.dataset.id; // store section ID
                    const sectionName = btn.dataset.name;
                    await loadStudents(currentSectionId, sectionName);
                });
            });

        } catch (err) {
            console.error("Error loading sections:", err);
            tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-red-500 py-2 border">Failed to load sections.</td></tr>`;
        }
    }

    async function loadStudents(sectionId, sectionName) {
        try {
            const res = await fetch(`../php/get_section_students.php?section_id=${encodeURIComponent(sectionId)}&section_name=${encodeURIComponent(sectionName)}`);
            const data = await res.json();

            studentListContainer.innerHTML = "";

            if (!Array.isArray(data) || data.length === 0) {
                studentListContainer.innerHTML = `<p class="text-gray-500">No students found.</p>`;
            } else {
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

                    // 🔴 highlight failing students
                    if (student.failed) {
                        row.classList.add("bg-red-200"); // light red background
                    }

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

                document.getElementById("select-all").addEventListener("change", e => {
                    document.querySelectorAll(".student-checkbox").forEach(cb => cb.checked = e.target.checked);
                });

                let oldBtn = document.getElementById("re-enroll-btn");
                if (oldBtn) oldBtn.remove();

                const reEnrollBtn = document.createElement("button");
                reEnrollBtn.id = "re-enroll-btn";
                reEnrollBtn.textContent = "Re-enroll";
                reEnrollBtn.className = "px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2";
                studentClose.insertAdjacentElement("afterend", reEnrollBtn);

                reEnrollBtn.onclick = async () => {
                    const selectedStudents = Array.from(document.querySelectorAll(".student-checkbox:checked"))
                        .map(cb => decodeURIComponent(cb.dataset.student));

                    if (selectedStudents.length === 0) {
                        alert("Please select at least one student to re-enroll.");
                        return;
                    }

                    // Fetch strands from backend
                    let strands = [];
                    try {
                        const res = await fetch("../php/get_strands.php");
                        const result = await res.json();
                        if (result.success && Array.isArray(result.data)) {
                            strands = result.data;
                        }
                    } catch (err) {
                        console.error("Error loading strands:", err);
                    }

                    // Build popup modal
                    const modal = document.createElement("div");
                    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50";

                    modal.innerHTML = `
                        <div class="bg-white p-6 rounded-lg shadow-lg w-96 relative z-50">
                            <h2 class="text-lg font-semibold mb-4">Re-enroll Students</h2>
                            
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
                                <button id="cancel-modal" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                                <button id="confirm-modal" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Confirm</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(modal);

                    // Cancel button
                    modal.querySelector("#cancel-modal").onclick = () => modal.remove();

                    // Confirm button
                    modal.querySelector("#confirm-modal").onclick = async () => {
                        const gradeLevel = modal.querySelector("#grade-level").value;
                        const semester = modal.querySelector("#semester").value;
                        const strand = modal.querySelector("#strand").value;

                        try {
                            const res = await fetch("../php/re_enroll_students.php", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    section_id: currentSectionId,
                                    students: selectedStudents,
                                    grade_level: gradeLevel,
                                    semester: semester,
                                    strand: strand
                                })
                            });

                            const text = await res.text();
                            console.log("Server response:", text);

                            let result;
                            try {
                                result = JSON.parse(text);
                            } catch {
                                alert("Server returned invalid JSON. Check console.");
                                return;
                            }

                            if (result.success) {
                                alert(result.message);
                                studentModal.classList.add("hidden");
                                modal.remove();
                            } else {
                                alert("❌ " + result.message);
                            }
                        } catch (err) {
                            console.error("Re-enroll error:", err);
                            alert("Something went wrong during re-enroll.");
                        }
                    };
                };
            }

            studentModal.classList.remove("hidden");
        } catch (err) {
            console.error("Error loading students:", err);
            studentListContainer.innerHTML = `<p class="text-red-500">Failed to load students.</p>`;
            studentModal.classList.remove("hidden");
        }
    }


    studentClose.addEventListener("click", () => {
        studentModal.classList.add("hidden");
        const reEnrollBtn = document.getElementById("re-enroll-btn");
        if (reEnrollBtn) reEnrollBtn.remove();
    });

    // Initial load
    loadSections();
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