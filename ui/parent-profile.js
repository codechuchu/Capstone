document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const panes = document.querySelectorAll(".content-pane");
    const title = document.getElementById("page-title");

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
            const targetPane = document.getElementById(item.dataset.pane);
            if (targetPane) {
                targetPane.classList.remove("hidden");
            }

            // Update page title using the data-title attribute of the clicked nav item
            title.textContent = item.dataset.title || "";
        });
    });

    // --- Logout Button Logic ---
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Parent Logout button clicked. Redirecting to admin-login.html...');
            // Clear session logic would go here
            window.location.href = 'admin-login.html'; // Redirect to login
        });
    }

    // --- Initial State Setup on Page Load ---
    const initialActiveNavItem = document.querySelector('.nav-item.active');
    if (initialActiveNavItem) {
        const initialTargetPane = document.getElementById(initialActiveNavItem.dataset.pane);
        if (initialTargetPane) {
            initialTargetPane.classList.remove('hidden');
            title.textContent = initialActiveNavItem.dataset.title || "";
        }
    } else {
        // Default to the first nav item if none active
        if (navItems.length > 0) {
            navItems[0].click();
        }
    }
});



//change password
document.addEventListener("DOMContentLoaded", () => {
    const parentBtn = document.getElementById('parentProfileBtn');
    const parentPanel = document.getElementById('parentPanel');
    const parentBtnName = document.getElementById('parentBtnName');

    const changePasswordLink = document.getElementById('parentChangePasswordLink');
    const changePasswordModal = document.getElementById('parentChangePasswordModal');
    const closeChangePassword = document.getElementById('parentCloseChangePassword');
    const closeModalX = document.getElementById('parentCloseModalX');
    const changePasswordForm = document.getElementById('parentChangePasswordForm');

    fetch('../php/get_user_info.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const fullname = `${data.firstname} ${data.lastname}`;
                parentBtnName.textContent = fullname;
                document.getElementById('parentName').textContent = fullname;
                document.getElementById('parentEmail').textContent = data.email;
            }
        })
        .catch(err => console.error("Error fetching parent info:", err));

    // Toggle parent panel
    parentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        parentPanel.classList.toggle('hidden');
    });

    // Close panel if clicked outside
    document.addEventListener('click', (e) => {
        if (!parentPanel.contains(e.target) && !parentBtn.contains(e.target)) {
            parentPanel.classList.add('hidden');
        }
    });

    // --- Change Password Logic ---
    changePasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        changePasswordModal.classList.remove('hidden');
        changePasswordModal.classList.add('flex');
    });

    const closeModal = () => {
        changePasswordModal.classList.add('hidden');
        changePasswordModal.classList.remove('flex');
    };

    closeChangePassword.addEventListener('click', closeModal);
    closeModalX.addEventListener('click', closeModal);

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


//addlrn
document.addEventListener("DOMContentLoaded", () => {
    const addLrnLink = document.getElementById('addLrn');
    const lrnModal = document.getElementById('lrnModal');
    const closeLrnModal = document.getElementById('closeLrnModal');
    const cancelLrn = document.getElementById('cancelLrn');
    const lrnForm = document.getElementById('lrnForm');

    // Open modal
    addLrnLink.addEventListener('click', e => {
        e.preventDefault();
        lrnModal.classList.remove('hidden');
        lrnModal.classList.add('flex');
    });

    // Close modal
    const closeModal = () => {
        lrnModal.classList.add('hidden');
        lrnModal.classList.remove('flex');
        lrnForm.reset();
    };

    closeLrnModal.addEventListener('click', closeModal);
    cancelLrn.addEventListener('click', closeModal);

    // Submit LRN form
    lrnForm.addEventListener('submit', e => {
        e.preventDefault();

        fetch('../php/add-lrn.php', {
            method: 'POST',
            body: new FormData(lrnForm)
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            if (data.status === 'success') closeModal();
        })
        .catch(err => {
            console.error(err);
            alert("⚠️ Something went wrong. Please try again.");
        });
    });
});


//fetch grade
document.addEventListener("DOMContentLoaded", () => {
    const childSelect = document.getElementById('childSelect');
    const jhsPane = document.getElementById('jhs-grades-pane');
    const shsPane = document.getElementById('shs-grades-pane');
    const jhsTableBody = document.getElementById('gradesTableBody');
    const shsTableBody = document.getElementById('shsGradesTableBody');

    if (!childSelect) {
        console.error("Dropdown not found. Make sure there is a select with id 'childSelect'.");
        return;
    }

    // Default option
    if (childSelect.options.length === 0) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a child';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        childSelect.appendChild(defaultOption);
    }

    // Fetch children
    fetch('../php/check-lrn.php')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success' && Array.isArray(data.children)) {
                data.children.forEach(child => {
                    if (![...childSelect.options].some(opt => opt.value === child.lrn)) {
                        const option = document.createElement('option');
                        option.value = child.lrn;
                        option.dataset.level = child.level; // "JHS" or "SHS"
                        option.textContent = child.name;
                        childSelect.appendChild(option);
                    }
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No children found';
                option.disabled = true;
                childSelect.appendChild(option);
            }
        })
        .catch(err => {
            console.error(err);
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Error loading children';
            option.disabled = true;
            childSelect.appendChild(option);
        });

    // On child selection
    childSelect.addEventListener('change', () => {
        const lrn = childSelect.value;
        const level = childSelect.selectedOptions[0].dataset.level;

        if (!lrn) return;

        fetch(`../php/get-grades.php?lrn=${encodeURIComponent(lrn)}&level=${encodeURIComponent(level)}`)
            .then(res => res.json())
            .then(data => {
                // Clear tables
                jhsPane.classList.add('hidden');
                shsPane.classList.add('hidden');
                jhsTableBody.innerHTML = "";
                shsTableBody.innerHTML = "";

                if (data.status !== 'success') {
                    alert(data.message || "Failed to load grades.");
                    return;
                }

                if (level === 'SHS') {
                    if (!data.grades || data.grades.length === 0) {
                        shsTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No grades found</td></tr>`;
                    } else {
                        data.grades.forEach(row => {
                            const q1 = row.q1_grade ?? "";
                            const q2 = row.q2_grade ?? "";
                            const avg = row.final_grade ?? "";
                            const teacher = row.encoded_by ?? "";

                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                            <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${row.subject_name || ''}</td>
                            <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${q1}</td>
                            <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${q2}</td>
                            <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${avg}</td>
                            <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-900">${teacher}</td>
                        `;
                        
                            shsTableBody.appendChild(tr);
                        });
                    }
                    shsPane.classList.remove('hidden');
                } else {
                    if (!data.grades || data.grades.length === 0) {
                        jhsTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No grades found</td></tr>`;
                    } else {
                        data.grades.forEach(row => {
                            const q1 = row.q1 ?? "";
                            const q2 = row.q2 ?? "";
                            const avg = row.average ?? "";
                            const teacher = row.teacher_name ?? "";

                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${row.subject_name || ''}</td>
                                <td>${q1}</td>
                                <td>${q2}</td>
                                <td>${avg}</td>
                                <td>${teacher}</td>
                            `;
                            jhsTableBody.appendChild(tr);
                        });
                    }
                    jhsPane.classList.remove('hidden');
                }
            })
            .catch(err => {
                console.error(err);
                alert("⚠️ Something went wrong while fetching grades.");
            });
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

//childsschedule
document.addEventListener("DOMContentLoaded", () => {
    const childSelect = document.getElementById('childSelectSchedule');
    const scheduleTableBody = document.getElementById('scheduleTableBody');
    const scheduleTitle = document.getElementById('scheduleTitle');
    const viewFullScheduleBtn = document.getElementById('viewFullScheduleBtn');

    if (!childSelect || !scheduleTableBody || !scheduleTitle) {
        console.error("Schedule dropdown or table not found.");
        return;
    }

    // Clear existing options
    childSelect.innerHTML = '';

    // Default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a child';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    childSelect.appendChild(defaultOption);

    // Fetch children for dropdown
    fetch('../php/check-lrn.php', { credentials: 'include' })
        .then(res => res.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                console.error("Invalid JSON from check-lrn.php:", text);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Error loading children';
                option.disabled = true;
                childSelect.appendChild(option);
                return;
            }

            if (data.status === 'success' && Array.isArray(data.children) && data.children.length > 0) {
                data.children.forEach(child => {
                    const option = document.createElement('option');
                    option.value = child.lrn;
                    option.textContent = child.name;
                    childSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No children found';
                option.disabled = true;
                childSelect.appendChild(option);
            }
        })
        .catch(err => {
            console.error(err);
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Error loading children';
            option.disabled = true;
            childSelect.appendChild(option);
        });

    // Function to fetch schedule
    const fetchSchedule = (lrn, full = false) => {
        const url = full 
            ? `../php/get-full-schedule.php?lrn=${encodeURIComponent(lrn)}`
            : `../php/get-todays-schedule.php?lrn=${encodeURIComponent(lrn)}`;

        return fetch(url, { credentials: 'include' })
            .then(res => res.text())
            .then(text => {
                let data;
                try {
                    data = JSON.parse(text);
                } catch (err) {
                    console.error("Invalid JSON from schedule PHP:", text);
                    return { status: 'error', message: 'Error loading schedule' };
                }
                return data;
            })
            .catch(err => {
                console.error(err);
                return { status: 'error', message: 'Error loading schedule' };
            });
    };

    // Handle child selection change (today's schedule)
    childSelect.addEventListener('change', async () => {
        const lrn = childSelect.value;
        if (!lrn) return;

        scheduleTableBody.innerHTML = '';
        scheduleTitle.textContent = "Today's Schedule";

        const data = await fetchSchedule(lrn, false);

        if (data.status !== 'success' || !Array.isArray(data.schedules) || data.schedules.length === 0) {
            scheduleTableBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-sm text-gray-900">${data.message || "No schedule for today"}</td></tr>`;
            return;
        }

        data.schedules.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.subject_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.time_start} - ${row.time_end}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.teacher_name}</td>
            `;
            scheduleTableBody.appendChild(tr);
        });
    });

    // "View Full Schedule" button (modal)
    if (viewFullScheduleBtn) {
        viewFullScheduleBtn.addEventListener('click', async () => {
            const lrn = childSelect.value;
            if (!lrn) {
                alert("Please select a child first");
                return;
            }

            const data = await fetchSchedule(lrn, true);
            if (data.status !== 'success' || !Array.isArray(data.schedules) || data.schedules.length === 0) {
                alert(data.message || "No full schedule available");
                return;
            }

            // Create modal
            const modalOverlay = document.createElement('div');
            modalOverlay.style.position = 'fixed';
            modalOverlay.style.top = 0;
            modalOverlay.style.left = 0;
            modalOverlay.style.width = '100%';
            modalOverlay.style.height = '100%';
            modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modalOverlay.style.display = 'flex';
            modalOverlay.style.justifyContent = 'center';
            modalOverlay.style.alignItems = 'center';
            modalOverlay.style.zIndex = 1000;

            const modalBox = document.createElement('div');
            modalBox.style.backgroundColor = '#fff';
            modalBox.style.padding = '20px';
            modalBox.style.borderRadius = '10px';
            modalBox.style.maxHeight = '80vh';
            modalBox.style.overflowY = 'auto';
            modalBox.style.width = '1600px';
            modalBox.style.maxWidth = '1600px';

            const title = document.createElement('h2');
            title.textContent = 'Full Schedule';
            title.className = 'text-xl font-semibold mb-4';

            const table = document.createElement('table');
            table.className = 'min-w-full divide-y divide-gray-200';
            table.innerHTML = `
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
                <tbody id="fullScheduleBody" class="bg-white divide-y divide-pink-200"></tbody>
            `;
            modalBox.appendChild(title);
            modalBox.appendChild(table);

            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Close';
            closeBtn.className = 'mt-4 px-4 py-2 bg-red-500 text-white rounded';
            closeBtn.addEventListener('click', () => document.body.removeChild(modalOverlay));
            modalBox.appendChild(closeBtn);

            modalOverlay.appendChild(modalBox);
            document.body.appendChild(modalOverlay);

            // Populate full schedule table
            const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
            const fullScheduleBody = document.getElementById('fullScheduleBody');

            // Unique time slots
            const timeSlots = [...new Set(data.schedules.map(s => s.time_start + " - " + s.time_end))];

            timeSlots.forEach(time => {
                const tr = document.createElement('tr');

                // Time column
                const timeTd = document.createElement('td');
                timeTd.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
                timeTd.textContent = time;
                tr.appendChild(timeTd);

                // Day columns
                weekdays.forEach(day => {
                    const td = document.createElement('td');
                    td.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
                    const entry = data.schedules.find(s => (s.time_start + " - " + s.time_end) === time && s.day_of_week === day);
                    if (entry) {
                        td.innerHTML = `<div>${entry.subject_name}<br><span class="text-xs text-gray-600">${entry.teacher_name}</span></div>`;
                    }
                    tr.appendChild(td);
                });

                fullScheduleBody.appendChild(tr);
            });
        });
    }
});
