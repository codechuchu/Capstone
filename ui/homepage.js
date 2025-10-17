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



document.addEventListener('DOMContentLoaded', function() { // Wait for HTML to fully load
    const btn = document.querySelector(".search-btn");
    const input = document.getElementById("lrnInput");
    const popup = document.getElementById("popup");
  
    // Restrict input to digits only and max 12 characters
    if (input) {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 12);
        });
    }
  
    // Debug: Log if elements are found
    console.log("Button found:", btn); 
    console.log("Input found:", input);  
    console.log("Popup found:", popup); 
  
    function showPopup(message) {
        if (popup) {
            popup.textContent = message;
            popup.classList.remove("hidden");
            popup.style.display = 'block'; 
            popup.style.opacity = '1'; 
            console.log("Popup shown with message:", message); 
            setTimeout(() => {
                popup.classList.add("hidden");
                popup.style.opacity = '0'; 
                popup.style.display = 'none'; 
            }, 3000); 
        } else {
            console.error("Popup element not found!");
        }
    }
  
    function fetchStatus() {
        if (!input) return; 
  
        const lrn = input.value.trim();
        if (!lrn) {
            showPopup("Please enter LRN");
            input.focus(); 
            return;
        }
        showPopup("Searching...");
  
        fetch("../php/get_status.php", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lrn: lrn }) 
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Response data:", data); 
            if (data.success) {
                showPopup(`Status: ${data.status}`);
            } else {
                showPopup(data.error || "LRN not found");
            }
        })
        .catch(error => {
            console.error("Fetch error:", error); 
            showPopup("Server error. Please try again later.");
        });
    }
  
    // Event Listeners (only attach if elements exist)
    if (btn && input && popup) {
        btn.addEventListener("click", function(e) {
            e.preventDefault(); 
            fetchStatus();
        });
        input.addEventListener("keydown", function(e) { // changed from keypress to keydown
            if (e.key === "Enter") {
                e.preventDefault(); 
                fetchStatus();
            }
        });
        console.log("Event listeners attached successfully.");
    } else {
        console.error("Search elements not found. Check HTML IDs/classes.");
    }
});

  