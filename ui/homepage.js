// homepage.js

// ---------- Navigation links ----------
const homeLink = document.querySelector('nav .nav-links a[href="#"]:nth-of-type(1)');
const programsLink = document.querySelector('nav .nav-links a[href="#"]:nth-of-type(2)');
const aboutLink = document.querySelector('nav .nav-links a[href="#"]:nth-of-type(3)');

homeLink?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'homepage.html';
});

programsLink?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'programs.html';
});

aboutLink?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'about.html';
});


// activation period checker
document.addEventListener('DOMContentLoaded', () => {
  const enrollBtn = document.querySelector('.enroll-btn');

  let activationStart = null;
  let activationEnd = null;

  function parseDate(str) {
      const d = new Date(str + 'T00:00:00');
      return isNaN(d) ? null : d;
  }

  function isTodayInActivationPeriod() {
      if (!activationStart || !activationEnd) return false;
      const today = new Date();
      return today >= activationStart && today <= activationEnd;
  }

  // Fetch activation period
  fetch("../php/get_activation.php")
      .then(res => res.json())
      .then(data => {
          if (data.status === "success" && data.data) {
              activationStart = parseDate(data.data.start_date);
              activationEnd = parseDate(data.data.end_date);
          }
      })
      .catch(err => console.error("Activation fetch error:", err));

  enrollBtn.addEventListener('click', (e) => {
      if (!isTodayInActivationPeriod()) {
          e.preventDefault();

          // Use HTML5 form validation style
          enrollBtn.setCustomValidity("Enrollment Period has not yet started.");
          enrollBtn.reportValidity(); // Shows browser validation tooltip

          // Clear custom validity after a short delay so user can try again
          setTimeout(() => enrollBtn.setCustomValidity(""), 1000);

          return;
      }

      // Proceed normally
      window.location.href = 'enrollment.html';
  });
});



// Track Status Search Functionality
// Track Status Search Functionality - Complete and Updated
document.addEventListener('DOMContentLoaded', function() { // Wait for HTML to fully load
  const btn = document.querySelector(".search-btn");
  const input = document.getElementById("lrnInput");
  const popup = document.getElementById("popup");

  // Debug: Log if elements are found
  console.log("Button found:", btn); // Should log the <button> element
  console.log("Input found:", input); // Should log the <input> element
  console.log("Popup found:", popup); // Should log the <div> element

  function showPopup(message) {
      if (popup) {
          popup.textContent = message;
          popup.classList.remove("hidden");
          popup.style.display = 'block'; // Force display (overrides any CSS conflicts)
          popup.style.opacity = '1'; // Ensure fade-in visibility
          console.log("Popup shown with message:", message); // Debug: Confirm it's called and visible
          setTimeout(() => {
              popup.classList.add("hidden");
              popup.style.opacity = '0'; // Fade out for smooth hide
              popup.style.display = 'none'; // Fully hide after animation
          }, 3000); // Auto-hide after 3 seconds
      } else {
          console.error("Popup element not found!");
      }
  }

  function fetchStatus() {
      if (!input) return; // Safety check

      const lrn = input.value.trim();
      if (!lrn) {
          showPopup("Please enter LRN");
          input.focus(); // Refocus on input for better UX
          return;
      }

      // Optional: Clear input after search (uncomment if desired)
      // input.value = "";

      // Show loading message (optional, for better UX)
      showPopup("Searching...");

      fetch("../php/get_status.php", { // Adjust path if needed (e.g., "./php/get_status.php")
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lrn: lrn }) // Matches your PHP: $data['lrn']
      })
      .then(res => {
          if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
      })
      .then(data => {
          console.log("Response data:", data); // Debug: Check what PHP returns
          if (data.success) {
              showPopup(`Status: ${data.status}`);
          } else {
              showPopup(data.error || "LRN not found");
          }
      })
      .catch(error => {
          console.error("Fetch error:", error); // Debug: Will log network/DB issues
          showPopup("Server error. Please try again later.");
      });
  }

  // Event Listeners (only attach if elements exist)
  if (btn && input && popup) {
      btn.addEventListener("click", function(e) {
          e.preventDefault(); // Prevent any default button behavior
          fetchStatus();
      });
      input.addEventListener("keypress", function(e) {
          if (e.key === "Enter") {
              e.preventDefault(); // Prevent any default form behavior
              fetchStatus();
          }
      });
      console.log("Event listeners attached successfully.");
  } else {
      console.error("Search elements not found. Check HTML IDs/classes.");
  }
});
