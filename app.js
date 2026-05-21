const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".primary-nav");

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const currentPath = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".primary-nav a").forEach((link) => {
  const href = link.getAttribute("href");
  if (href === currentPath) {
    link.classList.add("active");
  }
});

const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

document.querySelectorAll("img[data-fallback-src]").forEach((image) => {
  image.addEventListener(
    "error",
    () => {
      image.src = image.dataset.fallbackSrc;
    },
    { once: true }
  );
});

const getBackendUrl = (path) => {
  if (window.location.protocol === "file:" || !window.location.pathname.includes("/homedecor/")) {
    return `http://localhost/homedecor/${path}`;
  }

  return new URL(path, window.location.href).href;
};

const readJsonResponse = async (response) => {
  const text = await response.text();

  if (!text) {
    throw new Error("The backend returned an empty response. Open the site from http://localhost/homedecor/ and make sure Apache and MySQL are running.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The backend did not return JSON. Open the site from http://localhost/homedecor/ and make sure Apache and MySQL are running.");
  }
};

const cartKey = "homedecor_cart";
const getCartItems = () => JSON.parse(localStorage.getItem(cartKey) || "[]");
const saveCartItems = (items) => localStorage.setItem(cartKey, JSON.stringify(items));
const cartCountBadges = document.querySelectorAll(".cart-count");

const updateCartCount = () => {
  const total = getCartItems().reduce((sum, item) => sum + item.quantity, 0);
  cartCountBadges.forEach((badge) => {
    badge.textContent = total;
  });
};

const sitePopup = document.createElement("div");
sitePopup.className = "site-popup";
sitePopup.hidden = true;
sitePopup.innerHTML = `
  <div class="site-popup-panel" role="dialog" aria-modal="true">
    <button class="popup-close" type="button" aria-label="Close">&times;</button>
    <div class="popup-view popup-search" data-popup-view="search">
      <h2>Search Products</h2>
      <input class="search-input" type="search" placeholder="Search sofas, beds, lamps..." aria-label="Search products">
      <div class="search-results"></div>
    </div>
    <div class="popup-view popup-cart" data-popup-view="cart">
      <h2>Your Cart</h2>
      <div class="cart-items"></div>
      <button class="btn btn-primary clear-cart" type="button">Clear Cart</button>
    </div>
  </div>
`;
document.body.appendChild(sitePopup);

const popupViews = sitePopup.querySelectorAll(".popup-view");
const searchInput = sitePopup.querySelector(".search-input");
const searchResults = sitePopup.querySelector(".search-results");
const cartItemsRoot = sitePopup.querySelector(".cart-items");

const productsOnPage = () =>
  Array.from(document.querySelectorAll(".product-card")).map((card) => ({
    card,
    name: card.querySelector("h3")?.textContent.trim() || "Product",
    price: card.querySelector(".price")?.textContent.trim() || "",
  }));

const renderSearchResults = () => {
  const query = searchInput.value.trim().toLowerCase();
  const matches = productsOnPage().filter((product) => product.name.toLowerCase().includes(query));

  if (!matches.length) {
    searchResults.innerHTML = `<p class="empty-state">No products found on this page.</p>`;
    return;
  }

  searchResults.innerHTML = "";
  matches.forEach((product) => {
    const button = document.createElement("button");
    button.className = "search-result";
    button.type = "button";
    button.innerHTML = `<span>${product.name}</span><strong>${product.price}</strong>`;
    button.addEventListener("click", () => {
      sitePopup.hidden = true;
      document.body.classList.remove("modal-open");
      product.card.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    searchResults.appendChild(button);
  });
};

const renderCartItems = () => {
  const items = getCartItems();
  if (!items.length) {
    cartItemsRoot.innerHTML = `<p class="empty-state">Your cart is empty.</p>`;
    return;
  }

  cartItemsRoot.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `<span>${item.name}</span><strong>${item.price}</strong><small>Qty: ${item.quantity}</small>`;
    cartItemsRoot.appendChild(row);
  });
};

const openPopup = (view) => {
  popupViews.forEach((popupView) => {
    popupView.hidden = popupView.dataset.popupView !== view;
  });
  sitePopup.hidden = false;
  document.body.classList.add("modal-open");

  if (view === "search") {
    renderSearchResults();
    searchInput.focus();
  } else {
    renderCartItems();
  }
};

document.querySelectorAll("[data-search-toggle]").forEach((button) => {
  button.addEventListener("click", () => openPopup("search"));
});

document.querySelectorAll("[data-cart-toggle]").forEach((button) => {
  button.addEventListener("click", () => openPopup("cart"));
});

sitePopup.querySelector(".popup-close").addEventListener("click", () => {
  sitePopup.hidden = true;
  document.body.classList.remove("modal-open");
});

sitePopup.addEventListener("click", (event) => {
  if (event.target === sitePopup) {
    sitePopup.hidden = true;
    document.body.classList.remove("modal-open");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !sitePopup.hidden) {
    sitePopup.hidden = true;
    document.body.classList.remove("modal-open");
  }
});

searchInput.addEventListener("input", renderSearchResults);
sitePopup.querySelector(".clear-cart").addEventListener("click", () => {
  saveCartItems([]);
  updateCartCount();
  renderCartItems();
});
updateCartCount();

const sliderRoot = document.querySelector("[data-slider]");
if (sliderRoot) {
  const slides = Array.from(sliderRoot.querySelectorAll(".slide"));
  const dotsRoot = sliderRoot.querySelector("[data-slider-dots]");
  const prevButton = sliderRoot.querySelector("[data-slider-prev]");
  const nextButton = sliderRoot.querySelector("[data-slider-next]");
  let index = 0;
  let intervalId;

  const renderDots = () => {
    if (!dotsRoot) {
      return [];
    }
    dotsRoot.innerHTML = "";
    return slides.map((_, idx) => {
      const dot = document.createElement("button");
      dot.className = "slider-dot";
      dot.setAttribute("aria-label", `Go to slide ${idx + 1}`);
      if (idx === 0) {
        dot.classList.add("active");
      }
      dot.addEventListener("click", () => showSlide(idx));
      dotsRoot.appendChild(dot);
      return dot;
    });
  };

  const dots = renderDots();

  const showSlide = (newIndex) => {
    index = (newIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index);
    });
  };

  const startAutoPlay = () => {
    stopAutoPlay();
    intervalId = window.setInterval(() => {
      showSlide(index + 1);
    }, 2000);
  };

  const stopAutoPlay = () => {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      showSlide(index - 1);
      startAutoPlay();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      showSlide(index + 1);
      startAutoPlay();
    });
  }

  sliderRoot.addEventListener("mouseenter", stopAutoPlay);
  sliderRoot.addEventListener("mouseleave", startAutoPlay);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  });

  showSlide(0);
  startAutoPlay();
}

const revealItems = document.querySelectorAll("[data-reveal]");
if (revealItems.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  contactForm.action = getBackendUrl("backend/contact.php");

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector("button[type='submit']");
    const status = contactForm.querySelector(".form-status");

    if (submitButton) {
      submitButton.textContent = "Sending...";
      submitButton.disabled = true;
    }

    if (status) {
      status.textContent = "";
      status.className = "form-status";
    }

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: new FormData(contactForm),
      });
      const result = await readJsonResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to send your message.");
      }

      if (status) {
        status.textContent = result.message || "Message sent successfully.";
        status.classList.add("success");
      }
      contactForm.reset();
    } catch (error) {
      if (status) {
        status.textContent = error.message || "Something went wrong. Please try again.";
        status.classList.add("error");
      }
    } finally {
      if (submitButton) {
        submitButton.textContent = "Send Message";
        submitButton.disabled = false;
      }
    }
  });
}

const productCards = document.querySelectorAll(".product-card");
if (productCards.length) {
  const orderDialog = document.createElement("div");
  orderDialog.className = "order-dialog";
  orderDialog.hidden = true;
  orderDialog.innerHTML = `
    <div class="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
      <button class="order-close" type="button" aria-label="Close order form">&times;</button>
      <h2 id="order-title">Place Order</h2>
      <p class="order-product"></p>
      <form class="order-form" method="post">
        <input type="hidden" name="product_name">
        <input type="hidden" name="product_price">
        <input type="hidden" name="category">

        <label for="order-name">Full Name</label>
        <input id="order-name" name="customer_name" type="text" required>

        <label for="order-email">Email Address</label>
        <input id="order-email" name="email" type="email" required>

        <label for="order-phone">Phone Number</label>
        <input id="order-phone" name="phone" type="tel" required>

        <label for="order-address">Delivery Address</label>
        <textarea id="order-address" name="address" rows="3" required></textarea>

        <label for="order-quantity">Quantity</label>
        <input id="order-quantity" name="quantity" type="number" min="1" value="1" required>

        <label for="order-notes">Notes</label>
        <textarea id="order-notes" name="notes" rows="3" placeholder="Optional"></textarea>

        <button type="submit" class="btn btn-primary">Submit Order</button>
        <p class="form-status" aria-live="polite"></p>
      </form>
    </div>
  `;
  document.body.appendChild(orderDialog);

  const orderForm = orderDialog.querySelector(".order-form");
  orderForm.action = getBackendUrl("backend/order.php");
  const orderProduct = orderDialog.querySelector(".order-product");
  const closeOrderButton = orderDialog.querySelector(".order-close");

  const getCategoryName = () => {
    const heroEyebrow = document.querySelector(".page-hero .eyebrow");
    return heroEyebrow ? heroEyebrow.textContent.replace(" Collection", "") : "Featured";
  };

  const closeOrderDialog = () => {
    orderDialog.hidden = true;
    document.body.classList.remove("modal-open");
  };

  productCards.forEach((card) => {
    const orderButton = card.querySelector(".btn");
    if (!orderButton) {
      return;
    }

    orderButton.textContent = "Order Now";
    const cartButton = document.createElement("button");
    cartButton.className = "btn btn-ghost add-cart-btn";
    cartButton.type = "button";
    cartButton.textContent = "Add to Cart";
    orderButton.insertAdjacentElement("afterend", cartButton);

    cartButton.addEventListener("click", () => {
      const productName = card.querySelector("h3")?.textContent.trim() || "";
      const productPrice = card.querySelector(".price")?.textContent.trim() || "";
      const items = getCartItems();
      const existingItem = items.find((item) => item.name === productName);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        items.push({ name: productName, price: productPrice, quantity: 1 });
      }

      saveCartItems(items);
      updateCartCount();
      cartButton.textContent = "Added";
      window.setTimeout(() => {
        cartButton.textContent = "Add to Cart";
      }, 1200);
    });

    orderButton.addEventListener("click", (event) => {
      event.preventDefault();

      const productName = card.querySelector("h3")?.textContent.trim() || "";
      const productPrice = card.querySelector(".price")?.textContent.trim() || "";
      const category = getCategoryName();

      orderForm.reset();
      orderForm.querySelector("[name='product_name']").value = productName;
      orderForm.querySelector("[name='product_price']").value = productPrice;
      orderForm.querySelector("[name='category']").value = category;
      orderForm.querySelector(".form-status").textContent = "";
      orderForm.querySelector(".form-status").className = "form-status";
      orderProduct.textContent = `${productName} - ${productPrice}`;

      orderDialog.hidden = false;
      document.body.classList.add("modal-open");
      orderForm.querySelector("[name='customer_name']").focus();
    });
  });

  closeOrderButton.addEventListener("click", closeOrderDialog);
  orderDialog.addEventListener("click", (event) => {
    if (event.target === orderDialog) {
      closeOrderDialog();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !orderDialog.hidden) {
      closeOrderDialog();
    }
  });

  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = orderForm.querySelector("button[type='submit']");
    const status = orderForm.querySelector(".form-status");

    submitButton.textContent = "Submitting...";
    submitButton.disabled = true;
    status.textContent = "";
    status.className = "form-status";

    try {
      const response = await fetch(orderForm.action, {
        method: "POST",
        body: new FormData(orderForm),
      });
      const result = await readJsonResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit this order.");
      }

      status.textContent = result.message || "Order received successfully.";
      status.classList.add("success");
      orderForm.reset();
      if (result.payment_url) {
        window.location.href = getBackendUrl(result.payment_url);
      }
    } catch (error) {
      status.textContent = error.message || "Something went wrong. Please try again.";
      status.classList.add("error");
    } finally {
      submitButton.textContent = "Submit Order";
      submitButton.disabled = false;
    }
  });
}
