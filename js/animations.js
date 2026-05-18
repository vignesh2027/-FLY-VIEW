class AnimationEngine {
  // Animate a number counting up to target
  static countTo(el, target, duration = 1200, prefix = '', suffix = '') {
    if (!el) return;
    const start = parseInt(el.dataset.current || '0', 10);
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const val = Math.round(start + diff * ease(progress));
      el.textContent = prefix + val.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else {
        el.textContent = prefix + target.toLocaleString() + suffix;
        el.dataset.current = target;
      }
    };
    requestAnimationFrame(tick);
  }

  // Stagger-fade a list of elements in
  static staggerIn(els, delay = 60, duration = 300) {
    els.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * delay);
    });
  }

  // Flash element briefly (data update indicator)
  static flash(el, color = 'var(--orange)') {
    if (!el) return;
    el.style.transition = 'color 0.1s';
    el.style.color = color;
    setTimeout(() => {
      el.style.transition = 'color 0.6s';
      el.style.color = '';
    }, 120);
  }

  // Typewriter text effect
  static typewrite(el, text, speed = 28) {
    if (!el) return;
    el.textContent = '';
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(tick, speed);
      }
    };
    tick();
  }

  // Smooth scroll to element inside a container
  static scrollTo(container, el) {
    if (!container || !el) return;
    const top = el.offsetTop - container.offsetTop - 20;
    container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  // Pulse effect on element
  static pulse(el) {
    if (!el) return;
    el.classList.remove('anim-pulse');
    void el.offsetWidth; // reflow
    el.classList.add('anim-pulse');
    setTimeout(() => el.classList.remove('anim-pulse'), 600);
  }
}
