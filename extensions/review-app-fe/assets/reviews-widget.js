(function() {
  // Clean up cache-bust query parameter from address bar if present
  try {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has("cache_bust")) {
      currentUrl.searchParams.delete("cache_bust");
      window.history.replaceState({}, document.title, currentUrl.toString());
    }
  } catch (e) {
    console.error("Cache bust cleanup error:", e);
  }

  const container = document.getElementById("reviews-widget");
  if (!container) return;

  // Format Review Dates to match Kolkata (IST) time used in the admin panel
  const formatReviewDates = () => {
    const dateElements = document.querySelectorAll(".review-date[data-created-at]");
    dateElements.forEach(el => {
      const createdAt = el.getAttribute("data-created-at");
      if (!createdAt) return;
      try {
        const dateObj = new Date(createdAt);
        const dateStr = dateObj.toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        });
        // Convert "Month Day, Year, Hour:Minute Period" to "Month Day, Year at Hour:Minute Period IST"
        const formattedDate = dateStr.replace(/,([^,]*)$/, " at$1") + " IST";
        el.textContent = formattedDate;
      } catch (err) {
        console.error("Error formatting date:", err);
      }
    });
  };

  formatReviewDates();

  const apiUrl = container.getAttribute("data-api-url");

  // UI Elements
  const formContainer = document.getElementById("review-form-container");
  const writeBtn = document.getElementById("write-review-trigger-btn");
  const cancelBtn = document.getElementById("cancel-review-btn");
  const reviewForm = document.getElementById("storefront-review-form");
  const starPicker = document.getElementById("star-picker");
  const ratingInput = document.getElementById("review-rating-value");
  const imageInput = document.getElementById("review-image-input");
  const imagePreview = document.getElementById("review-image-preview");
  const statusNotif = document.getElementById("reviews-status-notification");
  const submitBtn = document.getElementById("submit-review-btn");

  // Lightbox Elements
  const lightbox = document.getElementById("reviews-lightbox-overlay");
  const lightboxImg = document.getElementById("reviews-lightbox-img");

  // Toggle Form visibility
  if (writeBtn) {
    writeBtn.addEventListener("click", () => {
      formContainer.style.display = formContainer.style.display === "block" ? "none" : "block";
      formContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      formContainer.style.display = "none";
      statusNotif.innerHTML = "";
    });
  }

  // Interactive Star Picker logic
  if (starPicker) {
    const stars = Array.from(starPicker.querySelectorAll("span"));
    
    const updateStarPickerDisplay = (val) => {
      stars.forEach(s => {
        const starVal = parseInt(s.getAttribute("data-value"), 10);
        if (starVal <= val) {
          s.classList.add("selected");
        } else {
          s.classList.remove("selected");
        }
      });
    };

    // Set initial picker view (default 5 stars)
    updateStarPickerDisplay(5);

    stars.forEach(star => {
      star.addEventListener("click", () => {
        const val = star.getAttribute("data-value");
        ratingInput.value = val;
        updateStarPickerDisplay(parseInt(val, 10));
      });
    });
  }

  // Multiple Image Upload State & Handlers
  let selectedFiles = [];

  const renderPreviews = () => {
    imagePreview.innerHTML = "";
    selectedFiles.forEach((file, index) => {
      const container = document.createElement("div");
      container.className = "preview-thumbnail-container";

      const img = document.createElement("img");
      img.alt = "Review photo upload preview";

      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "preview-remove-btn";
      removeBtn.innerHTML = "&times;";
      removeBtn.addEventListener("click", () => {
        selectedFiles.splice(index, 1);
        renderPreviews();
      });

      container.appendChild(img);
      container.appendChild(removeBtn);
      imagePreview.appendChild(container);
    });
  };

  if (imageInput) {
    imageInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      
      // Limit to max 5 images total
      if (selectedFiles.length + files.length > 5) {
        alert("You can upload a maximum of 5 images total per review.");
        imageInput.value = "";
        return;
      }

      // Check size limit: 5MB per file
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum allowed size is 5MB.`);
          imageInput.value = "";
          return;
        }
      }

      selectedFiles = [...selectedFiles, ...files];
      imageInput.value = ""; // Clear file input so change event can re-fire for same files
      renderPreviews();
    });
  }

  // Submit Review Form via AJAX
  if (reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      statusNotif.innerHTML = "";
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<div class="reviews-spinner"></div> Submitting...`;

      const formData = new FormData(reviewForm);
      
      // Re-populate images from our in-memory selectedFiles array
      formData.delete("image");
      selectedFiles.forEach(file => {
        formData.append("image", file);
      });

      try {
        const response = await fetch(`${apiUrl}/api/reviews`, {
          method: "POST",
          body: formData,
          headers: {
            "Accept": "application/json"
          }
        });

        if (!response.ok) throw new Error("Submission failed");
        const result = await response.json();

        if (result.error) {
          statusNotif.innerHTML = `<div class="reviews-alert reviews-alert-warning">Failed to submit: ${result.error}</div>`;
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
          return;
        }

        // Submission success
        statusNotif.innerHTML = `<div class="reviews-alert reviews-alert-success">Thank you! Your review has been submitted successfully. Reloading page...</div>`;
        reviewForm.reset();
        selectedFiles = [];
        if (imagePreview) imagePreview.innerHTML = "";

        // Refresh page with a cache-busting timestamp so Shopify & browser bypass their cache and display the new review
        setTimeout(() => {
          try {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set("cache_bust", Date.now());
            window.location.href = newUrl.toString();
          } catch (urlErr) {
            window.location.reload();
          }
        }, 1500);

      } catch (err) {
        console.error("Submit review error:", err);
        statusNotif.innerHTML = `<div class="reviews-alert reviews-alert-warning">A connection error occurred. Please make sure your tunnel is active.</div>`;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    });
  }

  // Lightbox Global Helper
  window.openReviewLightbox = (src) => {
    lightboxImg.src = src;
    lightbox.style.display = "flex";
  };

  if (lightbox) {
    lightbox.addEventListener("click", () => {
      lightbox.style.display = "none";
      lightboxImg.src = "";
    });
  }

  // Helper function to set up infinite scroll carousel for reviews or images
  const setupInfiniteCarousel = (slider, prevBtn, nextBtn, autoSlideAttr, speedAttr, itemClass, gap) => {
    if (!slider) return;

    const originalChildren = Array.from(slider.children);
    if (originalChildren.length <= 1) return;

    // Get visible slides configurations from CSS properties
    const desktopSlides = parseInt(window.getComputedStyle(slider).getPropertyValue("--desktop-slides"), 10) || 1;
    const mobileSlides = parseInt(window.getComputedStyle(slider).getPropertyValue("--mobile-slides"), 10) || 1;
    const visibleLimit = window.innerWidth > 768 ? desktopSlides : mobileSlides;

    // If total items fit on screen, do basic scrolling without clones or infinite loop
    if (originalChildren.length <= visibleLimit) {
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          const item = slider.querySelector(`.${itemClass}`);
          const dist = item ? item.offsetWidth + gap : slider.offsetWidth;
          slider.scrollBy({ left: -dist, behavior: "smooth" });
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          const item = slider.querySelector(`.${itemClass}`);
          const dist = item ? item.offsetWidth + gap : slider.offsetWidth;
          slider.scrollBy({ left: dist, behavior: "smooth" });
        });
      }
      return;
    }

    // Loop/clone setup
    const cloneCount = Math.min(originalChildren.length, 3);
    const clonesToPrepend = [];
    const clonesToAppend = [];

    for (let i = 0; i < cloneCount; i++) {
      const clone = originalChildren[i % originalChildren.length].cloneNode(true);
      clone.classList.add("slider-clone");
      clonesToAppend.push(clone);
    }

    for (let i = 0; i < cloneCount; i++) {
      const idx = (originalChildren.length - 1 - i) % originalChildren.length;
      const clone = originalChildren[idx < 0 ? idx + originalChildren.length : idx].cloneNode(true);
      clone.classList.add("slider-clone");
      clonesToPrepend.unshift(clone);
    }

    clonesToAppend.forEach(c => slider.appendChild(c));
    clonesToPrepend.forEach(c => slider.insertBefore(c, slider.firstChild));

    const getScrollDistance = () => {
      const item = slider.querySelector(`.${itemClass}`);
      return item ? item.offsetWidth + gap : slider.offsetWidth;
    };

    const getClonesOffset = () => {
      let offset = 0;
      const items = slider.querySelectorAll(`.${itemClass}`);
      for (let i = 0; i < cloneCount; i++) {
        if (items[i]) offset += items[i].offsetWidth + gap;
      }
      return offset;
    };

    const initScroll = () => {
      slider.classList.add("reviews-no-snap");
      slider.scrollLeft = getClonesOffset();
      slider.offsetHeight; // Force reflow
      slider.classList.remove("reviews-no-snap");
    };

    // Initialize position
    setTimeout(initScroll, 50);

    window.addEventListener("resize", () => {
      setTimeout(initScroll, 50);
    });

    let isAdjusting = false;

    // Check boundary wrap-around
    const handleScrollBoundary = () => {
      if (isAdjusting) return;

      const scrollDistance = getScrollDistance();
      const originalWidth = originalChildren.length * scrollDistance;
      const clonesOffset = getClonesOffset();

      if (slider.scrollLeft >= clonesOffset + originalWidth - 10) {
        isAdjusting = true;
        slider.classList.add("reviews-no-snap");
        slider.scrollLeft -= originalWidth;
        slider.offsetHeight; // Force reflow
        slider.classList.remove("reviews-no-snap");
        setTimeout(() => { isAdjusting = false; }, 100);
      } else if (slider.scrollLeft <= clonesOffset - 10) {
        isAdjusting = true;
        slider.classList.add("reviews-no-snap");
        slider.scrollLeft += originalWidth;
        slider.offsetHeight; // Force reflow
        slider.classList.remove("reviews-no-snap");
        setTimeout(() => { isAdjusting = false; }, 100);
      }
    };

    let scrollTimeout;
    slider.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollBoundary, 100);
    }, { passive: true });

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        slider.scrollBy({ left: -getScrollDistance(), behavior: "smooth" });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        slider.scrollBy({ left: getScrollDistance(), behavior: "smooth" });
      });
    }

    const autoSlideEnabled = slider.getAttribute(autoSlideAttr) === "true";
    const autoSlideSpeed = parseInt(slider.getAttribute(speedAttr), 10) || 5;

    if (autoSlideEnabled) {
      const intervalTime = autoSlideSpeed * 1000;
      let timer;

      const start = () => {
        timer = setInterval(() => {
          slider.scrollBy({ left: getScrollDistance(), behavior: "smooth" });
        }, intervalTime);
      };

      const stop = () => {
        if (timer) clearInterval(timer);
      };

      start();

      slider.addEventListener("mouseenter", stop);
      slider.addEventListener("mouseleave", start);
      slider.addEventListener("touchstart", stop, { passive: true });
      slider.addEventListener("touchend", start, { passive: true });
    }
  };

  const cardsSlider = document.getElementById("reviews-cards-slider");
  const cardsPrev = document.querySelector(".cards-slider-prev-btn");
  const cardsNext = document.querySelector(".cards-slider-next-btn");

  if (cardsSlider) {
    setupInfiniteCarousel(
      cardsSlider,
      cardsPrev,
      cardsNext,
      "data-auto-slide",
      "data-auto-slide-speed",
      "review-carousel-card",
      15
    );
  }

  // Initialize all attached review image carousels
  const initImageCarousels = () => {
    const containers = document.querySelectorAll(".reviews-image-carousel-container");
    containers.forEach(container => {
      const slider = container.querySelector(".image-carousel-slider");
      const prevBtn = container.querySelector(".image-carousel-prev-btn");
      const nextBtn = container.querySelector(".image-carousel-next-btn");
      if (slider) {
        setupInfiniteCarousel(
          slider,
          prevBtn,
          nextBtn,
          "data-auto-slide",
          "data-auto-slide-speed",
          "image-carousel-slide",
          8
        );
      }
    });
  };

  initImageCarousels();
})();

