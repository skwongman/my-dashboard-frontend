/**
 * A Vue 3 custom directive for the Intersection Observer API.
 */
export const intersect = {
  mounted: (el, binding) => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // Call the provided callback function
          binding.value();
          // We only need to trigger this once, so unobserve
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );
    observer.observe(el);
  },
};
