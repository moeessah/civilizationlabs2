(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const on = (target, event, handler, options) => {
    if (target) target.addEventListener(event, handler, options);
  };

  function initNav() {
    const nav = $('#mainNav');
    const menu = $('.nav-menu');
    const trigger = $('.nav-menu-trigger');
    const topLinks = $$('.nav-links a[href^="#"]');
    const menuLinks = $$('.nav-menu-panel a[href^="#"]');
    const sections = $$('section[data-nav-label]');
    const currentLabel = $('.nav-current strong');
    const currentWrap = $('.nav-current');
    let activeLabel = currentLabel?.textContent || '';

    const syncSolidNav = () => nav?.classList.toggle('solid', window.scrollY > 40);

    const closeMenu = () => {
      menu?.classList.remove('open');
      trigger?.setAttribute('aria-expanded', 'false');
    };

    const updateActiveLink = () => {
      if (!sections.length) return;

      const marker = window.innerHeight * 0.34;
      let bestSection = sections[0];
      let bestDistance = Infinity;

      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        const distance = Math.abs(rect.top - marker);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSection = section;
        }
      });

      const id = bestSection.id;
      const label = bestSection.dataset.navLabel || '';

      [...topLinks, ...menuLinks].forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });

      if (currentLabel && label && label !== activeLabel) {
        activeLabel = label;
        currentLabel.textContent = label;
        currentWrap?.classList.remove('pulse');
        void currentWrap?.offsetWidth;
        currentWrap?.classList.add('pulse');
      }
    };

    on(window, 'scroll', syncSolidNav, { passive: true });
    on(window, 'scroll', updateActiveLink, { passive: true });
    on(window, 'resize', updateActiveLink);

    on(trigger, 'click', () => {
      const isOpen = menu?.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });

    menuLinks.forEach(link => on(link, 'click', closeMenu));
    on(document, 'click', event => {
      if (menu && !menu.contains(event.target)) closeMenu();
    });
    on(document, 'keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });

    syncSolidNav();
    updateActiveLink();
  }

  function initTrustPlant() {
    const section = $('.trust');
    const plant = $('.trust-plant');
    const cells = $$('.trust-cell');

    if (!section || !plant) return;

    const containsPoint = (rect, x, y) => (
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    );

    on(window, 'mousemove', event => {
      const overPlant = containsPoint(plant.getBoundingClientRect(), event.clientX, event.clientY);
      const overCell = cells.some(cell => containsPoint(cell.getBoundingClientRect(), event.clientX, event.clientY));
      section.classList.toggle('plant-front', overPlant && !overCell);
    });

    on(window, 'scroll', () => section.classList.remove('plant-front'), { passive: true });
  }

  function initReveals() {
    const items = $$('.reveal,.reveal-l,.reveal-r');
    if (!items.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });

    items.forEach(item => observer.observe(item));
  }

  function initCarousel() {
    const track = $('#carouselTrack');
    const cards = track ? $$('.tcard', track) : [];
    if (!track || !cards.length) return;

    let current = Math.min(1, cards.length - 1);
    let autoTimer;

    const circularOffset = (index, active, total) => {
      let offset = index - active;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;
      return offset;
    };

    const apply = () => {
      const total = cards.length;

      cards.forEach((card, index) => {
        const offset = circularOffset(index, current, total);
        const distance = Math.abs(offset);
        const visible = distance <= 2;

        card.style.display = visible ? '' : 'none';
        if (!visible) return;

        const scale = distance === 0 ? 1 : distance === 1 ? 0.78 : 0.62;
        const translateX = offset * 360;
        const translateZ = distance === 0 ? 0 : distance === 1 ? -120 : -220;
        const rotateY = offset * -10;

        card.style.transform = `translate(-50%,-50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
        card.style.opacity = distance === 0 ? '1' : distance === 1 ? '.56' : '.24';
        card.style.zIndex = String(20 - distance);
        card.style.filter = distance > 1 ? 'blur(1px)' : '';
        card.style.pointerEvents = distance === 0 ? 'auto' : 'none';
        card.style.boxShadow = distance === 0
          ? '0 34px 90px rgba(14,14,12,.18)'
          : '0 10px 28px rgba(14,14,12,.07)';
      });
    };

    const advance = direction => {
      current = (current + direction + cards.length) % cards.length;
      apply();
    };

    const stopAuto = () => window.clearInterval(autoTimer);
    const startAuto = () => {
      stopAuto();
      autoTimer = window.setInterval(() => advance(1), 3600);
    };

    on($('#nextBtn'), 'click', () => advance(1));
    on($('#prevBtn'), 'click', () => advance(-1));
    on(track, 'mouseenter', stopAuto);
    on(track, 'mouseleave', startAuto);

    let touchStartX = 0;
    on(track, 'touchstart', event => {
      touchStartX = event.touches[0].clientX;
    }, { passive: true });

    on(track, 'touchend', event => {
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) > 40) advance(deltaX < 0 ? 1 : -1);
    }, { passive: true });

    apply();
    startAuto();
  }

  function initCaseSwitcher() {
    const data = {
      pricing: {
        type: 'Pricing change',
        title: 'Raise pricing by 18% next quarter.',
        copy: 'New customers may accept the higher price. Existing renewals need a completely separate cohort test before you roll this across the base.',
        weak: 'The plan treats new customers and existing renewals as a single pricing decision.',
        test: 'Run a renewal cohort before applying the change across the existing base.',
        evidence: 'Renewal objections, discount request patterns, and account-level value proof.'
      },
      launch: {
        type: 'Product launch',
        title: 'Ship the AI workflow feature in Q3.',
        copy: 'The launch memo says customers asked for automation. The evidence supports discovery interest, not a full launch commitment.',
        weak: 'Five sales calls and one enterprise prospect are carrying the entire launch case.',
        test: 'Run a beta cohort with 12 active users and measure repeat use after two weeks.',
        evidence: 'Repeat use rate, activation lift, support burden, and budget owner urgency.'
      },
      campaign: {
        type: 'Campaign spend',
        title: 'Spend $50K on a founder-led campaign.',
        copy: "The campaign depends on founder authority, but the plan hasn't tested whether the target buyer trusts the founder on this specific topic.",
        weak: 'Audience interest is being treated as buying intent.',
        test: 'Run a smaller content test across three audience segments before committing full budget.',
        evidence: 'Conversion by segment, sales follow-up quality, and reply intent.'
      },
      roadmap: {
        type: 'Roadmap bet',
        title: 'Move next quarter toward enterprise workflows.',
        copy: "Enterprise demand is inferred from sales conversations, but the plan doesn't show willingness to pay or implementation readiness.",
        weak: 'Sales requests are being treated as product strategy with budget behind it.',
        test: 'Build a proof table separating interest, budget signal, urgency, and implementation readiness.',
        evidence: 'Budget signal, implementation readiness, and estimated support cost.'
      }
    };

    const panel = $('.case-panel');
    const fields = {
      type: $('#caseType'),
      title: $('#caseTitle'),
      copy: $('#caseCopy'),
      weak: $('#caseWeak'),
      test: $('#caseTest'),
      evidence: $('#caseEvidence')
    };

    if (!panel) return;

    $$('.ctab').forEach(button => {
      on(button, 'click', () => {
        const nextCase = data[button.dataset.case];
        if (!nextCase) return;

        $$('.ctab').forEach(tab => {
          const isActive = tab === button;
          tab.classList.toggle('active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });

        panel.style.transition = 'opacity .25s,transform .25s';
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(10px)';

        window.setTimeout(() => {
          Object.entries(fields).forEach(([key, node]) => {
            if (node) node.textContent = nextCase[key];
          });
          panel.style.opacity = '1';
          panel.style.transform = '';
        }, 220);
      });
    });
  }

  function initIntakeForm() {
    const form = $('#intakeForm');
    const ndaSelect = $('#ndaSelect');
    const uploadHelp = $('#uploadHelp');
    const warning = $('#scopeWarning');
    const success = $('#successState');

    const restrictedTerms = [
      'hire', 'fire', 'employee', 'salary', 'compensation', 'lawsuit', 'legal',
      'attorney', 'tax', 'investment', 'securities', 'insurance', 'medical',
      'diagnosis', 'visa', 'immigration'
    ];

    const getScopeText = () => ['decisionType', 'decisionText', 'stakesText', 'summaryText']
      .map(id => $(`#${id}`)?.value || '')
      .join(' ')
      .toLowerCase();

    const checkScope = () => {
      const type = $('#decisionType')?.value;
      const text = getScopeText();
      const flagged = type === 'Other' || restrictedTerms.some(term => text.includes(term));
      warning?.classList.toggle('show', flagged);
    };

    ['decisionType', 'decisionText', 'stakesText', 'summaryText'].forEach(id => {
      const field = $(`#${id}`);
      on(field, 'input', checkScope);
      on(field, 'change', checkScope);
    });

    on(ndaSelect, 'change', event => {
      if (!uploadHelp) return;
      uploadHelp.textContent = event.target.value === 'Yes'
        ? 'Submit the summary now. We will send NDA details before asking for full materials.'
        : 'Decks, memos, spreadsheets, roadmap notes, customer research, campaign briefs.';
    });

    on(form, 'submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      form.style.display = 'none';
      success?.classList.add('show');
      success?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function initPatternHover() {
    const items = $$('.pattern-item');
    if (!items.length) return;

    items.forEach(activeItem => {
      on(activeItem, 'mouseenter', () => {
        items.forEach(item => {
          if (item !== activeItem) item.style.borderColor = 'transparent';
        });
      });

      on(activeItem, 'mouseleave', () => {
        items.forEach(item => {
          item.style.borderColor = '';
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initTrustPlant();
    initReveals();
    initCarousel();
    initCaseSwitcher();
    initIntakeForm();
    initPatternHover();
  });
})();
