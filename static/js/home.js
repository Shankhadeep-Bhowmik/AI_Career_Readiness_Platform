/**
 * AI Career Readiness Platform - Landing Page JavaScript
 * Handles scroll animations and smooth navigation
 */

document.addEventListener("DOMContentLoaded", function () {
  // Fade-in animation when sections enter the viewport
  const fadeElements = document.querySelectorAll(".fade-in");

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.15,
  };

  const fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach(function (element) {
    fadeObserver.observe(element);
  });

  // Smooth scroll for "Learn More" and anchor links
  const scrollLinks = document.querySelectorAll('a[href^="#"]');

  scrollLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      const targetId = link.getAttribute("href");

      if (targetId === "#" || targetId.length <= 1) {
        return;
      }

      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        event.preventDefault();
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Add shadow to navbar when user scrolls down
  const navbar = document.querySelector(".navbar-custom");

  if (navbar) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 50) {
        navbar.style.boxShadow = "0 4px 20px rgba(64, 91, 148, 0.41)";
      } else {
        navbar.style.boxShadow = "0 4px 6px rgba(57, 74, 128, 0.56)";
      }
    });
  }
});
