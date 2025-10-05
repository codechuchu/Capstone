document.addEventListener("DOMContentLoaded", () => {
  const enrollPane = document.getElementById("enroll-pane");
  const form = document.getElementById("enrollmentForm");
  const strandField = document.getElementById("strandField");
  const strandSelect = document.getElementById("strandSelect");

  // ✅ Check session to know assigned_level
  fetch("/capstone/php/check_session.php") // <-- create this small PHP to return session info
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (data.assigned_level && data.assigned_level.toLowerCase() === "senior high") {
          strandField.style.display = "block";

          // Load strands
          if (strandSelect) {
            fetch("/capstone/php/get_strands.php")
              .then(response => response.json())
              .then(strandData => {
                if (strandData.success && Array.isArray(strandData.data)) {
                  strandData.data.forEach(strand => {
                    let option = document.createElement("option");
                    option.value = strand;
                    option.textContent = strand;
                    strandSelect.appendChild(option);
                  });
                }
              })
              .catch(err => console.error("Error loading strands:", err));
          }
        } else {
          strandField.style.display = "none";
        }

        enrollPane.classList.remove("hidden");
      } else {
        alert("Session expired. Please log in again.");
        window.location.href = "/capstone/ui/login.html";
      }
    })
    .catch(err => console.error("Session check failed:", err));

  // ✅ Handle form submission
  form.addEventListener("submit", e => {
    e.preventDefault();
    const formData = new FormData(form);

    fetch("/capstone/php/enrollment.php", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(result => {
        if (result.status === "success") {
          alert("Enrollment submitted successfully!");
          form.reset();
        } else {
          alert("Error: " + result.message);
        }
      })
      .catch(err => console.error("Enrollment error:", err));
  });
});
