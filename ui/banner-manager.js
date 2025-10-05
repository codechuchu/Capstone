// banner-manager.js
document.addEventListener("DOMContentLoaded", function () {
    const bannerBtn = document.getElementById("frontpage-banner");
    const modal = document.getElementById("bannerModal");
    const closeBtn = document.getElementById("closeModal");
  
    // Open modal
    if (bannerBtn) {
      bannerBtn.addEventListener("click", function (e) {
        e.preventDefault();
        modal.classList.remove("hidden");
      });
    }
  
    // Close modal
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        modal.classList.add("hidden");
      });
    }
  
    // Close modal on outside click
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  
    // Handle form submission
    const form = document.getElementById("bannerForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
  
        const formData = new FormData(form);
  
        // Example: send to PHP backend
        fetch("upload-banner.php", {
          method: "POST",
          body: formData
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              alert("Photo uploaded successfully!");
              modal.classList.add("hidden");
              form.reset();
            } else {
              alert("Upload failed: " + data.message);
            }
          })
          .catch(error => {
            console.error("Error:", error);
            alert("Something went wrong.");
          });
      });
    }
  });
  

  // banner-manager.js

document.addEventListener("DOMContentLoaded", function () {
    const bannerBtn = document.getElementById("frontpage-banner");
    const modal = document.getElementById("bannerModal");
    const closeBtn = document.getElementById("closeModal");
    const form = document.getElementById("bannerForm");
    const homePane = document.getElementById("home-pane");
  
    // Open modal
    if (bannerBtn) {
      bannerBtn.addEventListener("click", function (e) {
        e.preventDefault();
        modal.classList.remove("hidden");
      });
    }
  
    // Close modal
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        modal.classList.add("hidden");
      });
    }
  
    // Close modal on outside click
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  
    // Handle form submission
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
  
        const formData = new FormData(form);
  
        fetch("upload-banner.php", {
          method: "POST",
          body: formData
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              alert("Photo uploaded successfully!");
              modal.classList.add("hidden");
              form.reset();
              loadSlideshow(); // refresh slideshow
            } else {
              alert("Upload failed: " + data.message);
            }
          })
          .catch(error => {
            console.error("Error:", error);
            alert("Something went wrong.");
          });
      });
    }
  
    // Load slideshow into #home-pane
    function loadSlideshow() {
      fetch("get-banners.php")
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            if (data.banners.length === 0) {
              homePane.innerHTML = "<p class='text-center text-gray-500'>No banners available</p>";
              return;
            }
  
            let slides = data.banners.map(
              (b, i) =>
                `<div class="slide ${i === 0 ? "block" : "hidden"}">
                    <img src="${b.image_path}" class="w-full h-64 object-cover rounded-lg shadow-md">
                 </div>`
            ).join("");
  
            homePane.innerHTML = `
              <div id="slideshow" class="relative overflow-hidden">
                ${slides}
              </div>
            `;
  
            startSlideshow();
          }
        });
    }
  
    // Start automatic slideshow
    function startSlideshow() {
      const slides = homePane.querySelectorAll(".slide");
      let index = 0;
  
      setInterval(() => {
        slides[index].classList.add("hidden");
        index = (index + 1) % slides.length;
        slides[index].classList.remove("hidden");
      }, 4000); // 4 seconds per slide
    }
  
    // Initial load
    loadSlideshow();
  });
  