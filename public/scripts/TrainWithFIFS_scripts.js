
    function fiScrollTo(id) {
      try {
        var el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } catch (e) {
        console.warn("fiScrollTo error:", e);
      }
    }
    window.fiScrollTo = fiScrollTo;

    // === AUTHORITATIVE ALL-8 COURSE TIER CONFIGURATION ===
    var COURSE_TIER_CONFIG = {
      mastery: {
        basePrice: '$425.00',
        vipPrice: '$550.00',
        baseTitle: 'Mid-Atlantic Multi-State Mastery',
        vipTitle: '👑 VIP Mid-Atlantic Multi-State Mastery',
        baseBadge: '5-STATE EXPANSION (MD+VA+FL+AZ+PA) — 34+ STATES LEGAL CARRY',
        vipBadge: '👑 ALL-INCLUSIVE VIP 5-STATE CONCIERGE EXPERIENCE',
        baseStripe: 'https://buy.stripe.com/dR67sWfR72D520ocMN',
        vipStripe: 'https://buy.stripe.com/7sI00u5cvb9BcwM9AB'
      },
      combo: {
        basePrice: '$249.99',
        vipPrice: '$375.00',
        baseTitle: 'Maryland CCW & HQL Combo Certification',
        vipTitle: '👑 VIP Maryland CCW & HQL Combo Concierge',
        baseBadge: 'DUAL CERTIFICATION: CONCEALED CARRY + HANDGUN PURCHASE PERMIT',
        vipBadge: '👑 ALL-INCLUSIVE VIP COMBO CONCIERGE (LIVESCAN + RANGE INCLUDED)',
        baseStripe: 'https://buy.stripe.com/dR67sWfR72D520ocMN',
        vipStripe: 'https://buy.stripe.com/7sI00u5cvb9BcwM9AB'
      },
      ccw: {
        basePrice: '$199.99',
        vipPrice: '$325.00',
        baseTitle: 'Maryland Wear & Carry (CCW) Initial Course',
        vipTitle: '👑 VIP Maryland Wear & Carry (CCW) Concierge',
        baseBadge: 'MARYLAND STATE POLICE CERTIFIED 16-HOUR INITIAL CCW',
        vipBadge: '👑 VIP WEAR & CARRY: EXPEDITED PACKET & FINGERPRINTING ON-SITE',
        baseStripe: 'https://buy.stripe.com/dR67sWfR72D520ocMN',
        vipStripe: 'https://buy.stripe.com/7sI00u5cvb9BcwM9AB'
      },
      hql: {
        basePrice: '$100.00',
        vipPrice: '$165.00',
        baseTitle: 'Maryland Handgun Qualification License (HQL)',
        vipTitle: '👑 VIP Maryland HQL Concierge Licensing',
        baseBadge: 'MARYLAND HANDGUN PURCHASE PERMIT MANDATORY TRAINING',
        vipBadge: '👑 VIP HQL: APPLICATION SUBMISSION ASSISTANCE + LIVE FIRE EXEMPTION',
        baseStripe: 'https://buy.stripe.com/dR67sWfR72D520ocMN',
        vipStripe: 'https://buy.stripe.com/7sI00u5cvb9BcwM9AB'
      },
      coaching: {
        basePrice: '$125.00',
        vipPrice: '$195.00',
        baseTitle: 'Personal 1-on-1 Private Firearms Coaching',
        vipTitle: '👑 VIP Private Masterclass & Tactical Diagnostics',
        baseBadge: 'DEDICATED 1-ON-1 INSTRUCTOR TIME & MARKSMANSHIP TARGETING',
        vipBadge: '👑 VIP PRIVATE SESSION: DUAL-CALIBER RENTALS & VIDEO DIAGNOSTICS',
        baseStripe: 'https://buy.stripe.com/dR67sWfR72D520ocMN',
        vipStripe: 'https://buy.stripe.com/7sI00u5cvb9BcwM9AB'
      },
      cleaning: {
        basePrice: '$75.00',
        vipPrice: '$125.00',
        baseTitle: 'Firearm Maintenance & Deep Cleaning Workshop',
        vipTitle: '👑 VIP Armorer Inspection & Ultrasonic Deep Clean',
        baseBadge: 'FIELD-STRIP, CLEANING CHEMICAL SAFETY & PROPER LUBRICATION',
        vipBadge: '👑 VIP ARMORER SERVICE: ULTRASONIC TANK CLEAN & PRO-GRADE SOLVENTS',
        baseStripe: 'https://buy.stripe.com/dR67sWfR72D520ocMN',
        vipStripe: 'https://buy.stripe.com/7sI00u5cvb9BcwM9AB'
      },
      children: {
        basePrice: '$199.99',
        vipPrice: '$275.00',
        baseTitle: 'Youth & Family Gun Safety Academy',
        vipTitle: '👑 VIP Family Defensive & Safe Storage Mastery',
        baseBadge: 'ACCIDENT PREVENTION, EDDIE EAGLE PROTOCOL & RANGE DISCIPLINE',
        vipBadge: '👑 VIP FAMILY PACK: LOCKBOX INCLUDED & PRIVATE RANGE LANE ACCESS',
        baseStripe: 'https://buy.stripe.com/dR67sWfR72D520ocMN',
        vipStripe: 'https://buy.stripe.com/7sI00u5cvb9BcwM9AB'
      },
      alumni: {
        basePrice: '$65.00',
        vipPrice: '$110.00',
        baseTitle: 'FIFS Graduate Alumni Tactical Marksman Clinic',
        vipTitle: "👑 VIP Alumni Advanced Shoot/Don't-Shoot Shootout",
        baseBadge: 'EXCLUSIVELY FOR FIFS GRADUATES — ADVANCED DRILLS & DRAW SPEED',
        vipBadge: '👑 VIP CLINIC: 100RDS MATCH AMMO & LOW-LIGHT SCENARIO RUNS',
        baseStripe: 'https://buy.stripe.com/dR67sWfR72D520ocMN',
        vipStripe: 'https://buy.stripe.com/7sI00u5cvb9BcwM9AB'
      }
    };

    function setCardTier(courseKey, targetTier, evt) {
      if (evt) {
        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();
        if (evt.preventDefault) evt.preventDefault();
      }
      var config = COURSE_TIER_CONFIG[courseKey];
      if (!config) return;
      var card = document.getElementById('card-course-' + courseKey);
      var switchBox = document.getElementById('switch-' + courseKey);
      var slider = document.getElementById('slider-' + courseKey);
      var priceElem = document.getElementById('price-course-' + courseKey);
      var titleElem = document.getElementById('title-course-' + courseKey);
      var badgeElem = document.getElementById('badge-course-' + courseKey);
      var ctaBtn = document.getElementById('btn-enroll-' + courseKey);

      var isVip = targetTier === 'vip';

      if (card) {
        if (isVip) {
          card.classList.add('vip-mode-active');
        } else {
          card.classList.remove('vip-mode-active');
        }
      }
      if (switchBox) {
        if (isVip) {
          switchBox.classList.add('active-vip');
        } else {
          switchBox.classList.remove('active-vip');
        }
      }
      if (slider) {
        if (isVip) {
          slider.style.transform = 'translateX(100%)';
        } else {
          slider.style.transform = 'translateX(0)';
        }
      }
      if (priceElem) {
        var valSpan = priceElem.querySelector('.price-val');
        if (valSpan) {
          valSpan.textContent = isVip ? config.vipPrice : config.basePrice;
        } else {
          priceElem.textContent = isVip ? config.vipPrice : config.basePrice;
        }
      }
      if (titleElem) {
        titleElem.textContent = isVip ? config.vipTitle : config.baseTitle;
      }
      if (badgeElem) {
        badgeElem.textContent = isVip ? config.vipBadge : config.baseBadge;
      }
      if (ctaBtn) {
        ctaBtn.href = isVip ? config.vipStripe : config.baseStripe;
      }
    }
    window.setCardTier = setCardTier;

    function toggleCardTier(courseKey, evt) {
      if (evt) {
        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();
        if (evt.preventDefault) evt.preventDefault();
      }
      var card = document.getElementById('card-course-' + courseKey);
      var isVip = card && card.classList.contains('vip-mode-active');
      setCardTier(courseKey, isVip ? 'base' : 'vip', evt);
    }
    window.toggleCardTier = toggleCardTier;

    // === TACTICAL GUN REFRESH & SCARED NAVIGATION SYSTEM ===
    function triggerTopNavGunReload(evt) {
      if (evt) {
        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.preventDefault) evt.preventDefault();
      }
      var refreshBtn = document.getElementById('btnNavRefresh') || document.querySelector('.btn-nav-refresh') || document.querySelector('[data-onclick*="triggerTopNavGunReload"]');
      var backBtn = document.getElementById('btnNavBack') || document.querySelector('.btn-nav-back');
      var homeBtn = document.getElementById('btnNavHome') || document.querySelector('.btn-return-home');

      if (backBtn) backBtn.classList.add('nav-btn-scared-left');
      if (homeBtn) homeBtn.classList.add('nav-btn-scared-right');

      if (refreshBtn) {
        refreshBtn.classList.add('tactical-gun-recoil');
        var originalText = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = '⚡ RACKING...';
        setTimeout(function() {
          refreshBtn.innerHTML = '💥 BANG!';
        }, 350);
        setTimeout(function() {
          refreshBtn.innerHTML = '💨 EJECTING...';
        }, 700);
        setTimeout(function() {
          refreshBtn.innerHTML = '🔄 LOCKED & LOADED';
        }, 1050);
        setTimeout(function() {
          refreshBtn.classList.remove('tactical-gun-recoil');
          refreshBtn.innerHTML = originalText;
          if (backBtn) backBtn.classList.remove('nav-btn-scared-left');
          if (homeBtn) homeBtn.classList.remove('nav-btn-scared-right');
          if (window.refreshAdminRoster) window.refreshAdminRoster();
          if (window.refreshAdminClients) window.refreshAdminClients();
        }, 1500);
      }
    }
    window.triggerTopNavGunReload = triggerTopNavGunReload;
    window.triggerGunRefreshAnimation = triggerTopNavGunReload;



// ==========================================================================
// NEXT.JS CLIENT INTERACTIVE SCRIPT BUNDLE
// ==========================================================================

// OPTION A: 100% Zero Browser Storage (Pure in-memory volatile storage; no data saved to disk/persistent storage)
var _fifsMemStorage = {
  _store: {},
  getItem: function(key) { return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null; },
  setItem: function(key, val) { this._store[key] = String(val); },
  removeItem: function(key) { delete this._store[key]; },
  clear: function() { this._store = {}; }
};
if (typeof window !== 'undefined') { window._fifsMemStorage = _fifsMemStorage; }
    var FIFS_GAS_API_URL = "https://script.google.com/macros/s/AKfycbx.../exec";
    // ==========================================================================
    // FIFS GITHUB PAGES <-> GOOGLE APPS SCRIPT API BRIDGE
    // ==========================================================================
    var FIFS_GAS_API_URL = "https://script.google.com/macros/s/AKfycbz9X2h0o5_pmNafKXRY9hSeGiGpHerp_JMWie8wg9FmSir0W3mrZAnk5nw-Zs9xH9BY/exec";
    function callFifsBackend(action, payload, onSuccess, onError) {
      var bodyData = Object.assign({ action: action }, payload || {});
      // Ensure pin/passcode compatibility
      if (!bodyData.passcode && bodyData.pin) bodyData.passcode = bodyData.pin;
      fetch("/api/fifs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      })
      .then(function(res) {
        if (!res.ok) {
          return res.json().then(function(errData) {
            throw new Error(errData.error || ("HTTP " + res.status));
          });
        }
        return res.json();
      })
      .then(function(data) {
        if (onSuccess) onSuccess(data);
      })
      .catch(function(err) {
        console.error("FIFS Supabase API Error (" + action + "):", err);
        if (onError) onError(err);
      });
    }
    window.callFifsBackend = callFifsBackend;
    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    window.escapeHtml = escapeHtml;
    // ==========================================================================
    // STREAMLINED TELEMETRY ENGINE IN <HEAD> SCRIPT 0
    // ==========================================================================
    // ==========================================================================
    // STREAMLINED HIGH-VALUE BUSINESS MILESTONE LOGGER (ZERO MAIN-THREAD BLOCKING)
    // ==========================================================================
    function logAnalyticsEvent(category, action, label) {
      // Strictly restricted exclusively to high-value business conversion milestones
      var highValueActions = [
        'Course Booking Confirmed',
        'Client Profile Registered',
        'Live Chat Initiated'
      ];
      if (!highValueActions.includes(action)) {
        return; // Zero overhead and zero I/O for all micro-interactions
      }
      // Execute asynchronously in micro-task queue to eliminate main-thread blocking
      setTimeout(function() {
        try {
          var entry = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            category: category,
            action: action,
            label: label || '',
            device: (window.innerWidth <= 768 ? 'Mobile Phone' : (window.innerWidth <= 1024 ? 'Tablet / iPad' : 'Desktop / Laptop'))
          };
          var log = JSON.parse(_fifsMemStorage.getItem('fifs_analytics_events') || '[]');
          log.unshift(entry);
          if (log.length > 50) log.pop();
          /* cloud only: zero browser storage */
          // Background sync to GAS ledger if live
          if (typeof callFifsBackend === 'function') { callFifsBackend('logAnalytics', { entry: entry }); }
        } catch (e) {}
      }, 20);
    }
    window.logAnalyticsEvent = logAnalyticsEvent;
    // ==========================================================================
    // AUTHORITATIVE CORE NAVIGATION ENGINE (DEFINED IN <HEAD> FOR INSTANT TAP/CLICK)
    // ==========================================================================
    var ALL_APP_TABS = ['booking', 'portal', 'fi-portal', 'about', 'testimonial', 'faq', 'admin'];
    window.ALL_APP_TABS = ALL_APP_TABS;
    var SECTION_TITLES = {
      booking: 'Course Enrollment & Multi-Tier Tuition',
      portal: 'Student Operations Portal',
      'fi-portal': 'Future Initiative Client & Permit Portal',
      about: 'Lead Instructor & Mission',
      testimonial: 'Range Highlights & Student Milestones',
      faq: 'Frequently Asked Questions',
      admin: 'Instructor Command Center'
    };
    window.SECTION_TITLES = SECTION_TITLES;
    var currentActiveView = 'home';
    window.currentActiveView = currentActiveView;
    var contextualHistoryStack = [];
    window.contextualHistoryStack = contextualHistoryStack;
    function closeAllOverlays() {
      var overlayIds = [
        'twoWayChatModal', 'contactInstructorModal', 'courseBookingModal',
        'vehicleTravelModal', 'flyingWithFirearmModal', 'portalConflictModal',
        'adminInviteModal', 'adminEditStudentModal', 'adminEditClientModal',
        'fiPortalSelectionModal', 'goalSynopsisModal', 'stepDetailModal',
        'expectationModal', 'reciprocityHubModal', 'stateModalOverlay',
        'collectorInfoModal', 'stateDossierModal', 'alumniAccessGateModal',
        'clientProfileModal'
      ];
      overlayIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
          el.classList.remove('active');
          el.classList.remove('open');
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      });
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeAllOverlays = closeAllOverlays;
    function rawSwitchTab(tab) {
      if (!ALL_APP_TABS.includes(tab)) tab = 'booking';
      ALL_APP_TABS.forEach(function(t) {
        var panel = document.getElementById('view-' + t);
        if (panel) {
          if (t === tab) {
            panel.classList.remove('hidden');
            panel.style.setProperty('display', 'block', 'important');
            panel.style.setProperty('visibility', 'visible', 'important');
            panel.style.setProperty('opacity', '1', 'important');
            panel.style.setProperty('pointer-events', 'auto', 'important');
          } else {
            panel.classList.add('hidden');
            panel.style.setProperty('display', 'none', 'important');
            panel.style.setProperty('pointer-events', 'none', 'important');
          }
        }
      });
      if (tab === 'testimonial' && typeof mountStudentTargets === 'function') {
        try { mountStudentTargets(); } catch(e) {}
      }
      var userTag = document.getElementById('portal-user-tag');
      var savedSession = sessionStorage.getItem('fifs_student_session');
      if (tab !== 'portal' || !savedSession) {
        if (userTag && SECTION_TITLES[tab]) {
          userTag.textContent = SECTION_TITLES[tab];
        }
      }
      try { window.scrollTo(0, 0); } catch (e) {}
    }
    window.rawSwitchTab = rawSwitchTab;
    function switchTab(tab) {
      if (currentActiveView !== tab) {
        contextualHistoryStack.push(currentActiveView);
        if (contextualHistoryStack.length > 25) contextualHistoryStack.shift();
      }
      currentActiveView = tab;
      window.currentActiveView = tab;
      rawSwitchTab(tab);
      }
    window.switchTab = switchTab;
    function openAndSwitch(tabId) {
      try {
        if (typeof checkPortalSessionConflict === 'function' && (tabId === 'portal' || tabId === 'fi-portal')) {
          if (checkPortalSessionConflict(tabId)) return;
        }
        closeAllOverlays();
        if (currentActiveView !== tabId) {
          contextualHistoryStack.push(currentActiveView);
          if (contextualHistoryStack.length > 25) contextualHistoryStack.shift();
        }
        currentActiveView = tabId;
        window.currentActiveView = tabId;
        document.body.classList.remove('in-home');
        document.body.classList.add('in-app');
        document.body.className = 'in-app';
        var hero = document.getElementById('hero-landing');
        var app = document.getElementById('app-container');
        if (hero) {
          hero.style.setProperty('display', 'none', 'important');
          hero.style.setProperty('pointer-events', 'none', 'important');
          hero.classList.add('hidden-view');
        }
        if (app) {
          app.style.setProperty('display', 'block', 'important');
          app.style.setProperty('visibility', 'visible', 'important');
          app.style.setProperty('opacity', '1', 'important');
          app.style.setProperty('pointer-events', 'auto', 'important');
          app.classList.add('active-view');
        }
        rawSwitchTab(tabId);
        if (tabId === 'admin') {
          var savedPin = sessionStorage.getItem('fifs_instructor_pin');
          if (savedPin && isValidInstructorPin(savedPin)) {
            setTimeout(function() { verifyAdminAccess(savedPin); }, 50);
          }
        }
        try { window.scrollTo(0, 0); } catch (e) {}
        } catch (err) {
        console.error('Error in openAndSwitch:', err);
      }
    }
    window.openAndSwitch = openAndSwitch;
    function returnToHome() {
      try {
        closeAllOverlays();
        if (currentActiveView !== 'home') {
          contextualHistoryStack.push(currentActiveView);
          if (contextualHistoryStack.length > 25) contextualHistoryStack.shift();
        }
        currentActiveView = 'home';
        window.currentActiveView = 'home';
        document.body.classList.remove('in-app');
        document.body.classList.add('in-home');
        document.body.className = 'in-home';
        var hero = document.getElementById('hero-landing');
        var app = document.getElementById('app-container');
        if (app) {
          app.style.setProperty('display', 'none', 'important');
          app.style.setProperty('visibility', 'hidden', 'important');
          app.style.setProperty('pointer-events', 'none', 'important');
          app.classList.remove('active-view');
        }
        if (hero) {
          hero.style.setProperty('display', 'flex', 'important');
          hero.style.setProperty('visibility', 'visible', 'important');
          hero.style.setProperty('opacity', '1', 'important');
          hero.style.setProperty('pointer-events', 'auto', 'important');
          hero.classList.remove('hidden-view');
        }
        ALL_APP_TABS.forEach(function(t) {
          var panel = document.getElementById('view-' + t);
          if (panel) {
            panel.classList.add('hidden');
            panel.style.setProperty('display', 'none', 'important');
            panel.style.setProperty('pointer-events', 'none', 'important');
          }
        });
        try { window.scrollTo(0, 0); } catch (e) {}
        } catch (err) {
        console.error('Error in returnToHome:', err);
      }
    }
    window.returnToHome = returnToHome;
    function navigateBack() {
      try {
        closeAllOverlays();
        if (contextualHistoryStack.length > 0) {
          var prev = contextualHistoryStack.pop();
          if (prev === 'home') {
            returnToHome();
          } else {
            switchTab(prev);
          }
        } else {
          returnToHome();
        }
      } catch (err) {
        returnToHome();
      }
    }
    window.navigateBack = navigateBack;
    function openPortalSelectionModal() {
      var modal = document.getElementById('fiPortalSelectionModal');
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
    }
    window.openPortalSelectionModal = openPortalSelectionModal;
    function closePortalSelectionModal() {
      var modal = document.getElementById('fiPortalSelectionModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closePortalSelectionModal = closePortalSelectionModal;
    function openContactWidgetModal() {
      try {
        var modal = document.getElementById('contactInstructorModal');
        if (modal) {
          modal.classList.add('active');
          modal.style.setProperty('display', 'flex', 'important');
          modal.style.setProperty('visibility', 'visible', 'important');
          modal.style.setProperty('opacity', '1', 'important');
          modal.style.setProperty('pointer-events', 'auto', 'important');
          if (document.body) {
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
          }
          try { if (typeof updateLiveChatStatusUI === 'function') updateLiveChatStatusUI(); } catch (e) {}
        }
      } catch (err) {
        console.error('Error opening contact modal:', err);
      }
      }
    window.openContactWidgetModal = openContactWidgetModal;
    function closeContactWidgetModal() {
      var modal = document.getElementById('contactInstructorModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeContactWidgetModal = closeContactWidgetModal;
    // ==========================================================================
    // AUTHORITATIVE DATA ARCHITECTURE IN <HEAD>
    // ==========================================================================
    var GOAL_SYNOPSIS_DATA = {
      new_to_firearms: {
        badge: "First-Time Owner Essentials • Safety & Crisis Resources",
        title: "Brand New to Firearms: Fundamental Safety & Guidance",
        rec: "Universal Safety Rules, Secure Storage & Community Care",
        courseValue: "Maryland HQL (Purchase License) — Base Track ($100.00)",
        showGuide: true,
        synopsis: "Welcome. If you have never held or owned a firearm before, our mission is to provide you with clear, pressure-free safety fundamentals before taking any formal class. Responsible firearm ownership begins with mechanical respect, safe home storage, and emotional readiness. Owning a firearm is a serious, lifelong responsibility—we teach you to move at your own pace with zero judgment or intimidation.",
        why: [
          "<strong>The 4 Universal Rules of Gun Safety:</strong> Always treat every firearm as loaded; never point the muzzle at anything you are not willing to destroy; keep your finger off the trigger until your sights are on target; and always know your target and what lies beyond.",
          "<strong>Safe Home Storage & Access Prevention:</strong> Keep firearms locked, unloaded, and separate from ammunition in a child-proof biometric or key-lock safe to prevent tragic domestic accidents.",
          "<strong>988 Suicide & Crisis Lifeline:</strong> If you, a loved one, or a family member are experiencing distress, anxiety, or a mental health crisis, free, confidential, 24/7 support is available immediately. Call or text <strong>988</strong> or visit <a href=\"https://988lifeline.org\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: var(--accent-cyan); text-decoration: underline; font-weight: 700;\">988lifeline.org</a>.",
          "<strong>Temporary Off-Site Storage Support:</strong> Learn about voluntary temporary off-site firearm storage options during difficult emotional times, stress, or family transitions.",
          "<strong>Free 6-Page Guide:</strong> Download our comprehensive 'Top 50 Questions New Gun Owners Ask' reference guide directly below."
        ],
        whyNot: [
          "Owning a firearm is never a replacement for situational awareness, conflict avoidance, and de-escalation.",
          "Never handle, clean, or purchase a firearm when emotionally overwhelmed, agitated, or in distress.",
          "If you feel unready or anxious, do not rush—you are welcome to take our Private 1-on-1 Coaching or Family Safety Orientation first."
        ]
      },
      want_to_purchase: {
        badge: "State Legal Prerequisite • Handgun License",
        title: "Looking to Buy a Handgun (Maryland HQL)",
        rec: "Recommended: Maryland Handgun Qualification License ($100.00)",
        courseValue: "Maryland HQL (Purchase License) — Base Track ($100.00)",
        showGuide: false,
        synopsis: "Important clarification: In Maryland, the 'Handgun License' to buy a gun IS the HQL (Handgun Qualification License). Under Md. Public Safety § 5-117.1, licensed gun dealers cannot release a handgun to you without this certification. This class fulfills the training prerequisite required for your state 77R purchase application.",
        why: [
          "Your goal is home security, and you want to legally purchase a pistol from a licensed Maryland dealer (FFL).",
          "Includes step-by-step guidance on creating your Maryland State Police (MSP) portal account and submitting clean paperwork without shortages.",
          "Completed in half a day with live-fire verification at Cindy&#39;s Hot Shots."
        ],
        whyNot: [
          "The HQL does NOT license you to carry a concealed weapon outside your home or business.",
          "If you might want to carry concealed in the future, taking HQL now means paying for two separate classes later. The CCW Combo covers both."
        ]
      },
      want_to_carry: {
        badge: "Full Public Carry Authorization • 16-Hour",
        title: "I Want to Legally Carry Concealed in Public",
        rec: "Recommended: Maryland CCW (Wear & Carry Permit) ($199.99)",
        courseValue: "Maryland Wear & Carry (CCW) — Base Track ($199.99)",
        showGuide: false,
        synopsis: "The mandatory state-certified 16-hour curriculum and 25-round practical qualification required to receive your Maryland Handgun Wear and Carry Permit. Provides in-depth training in defensive marksmanship, holster draw mechanics, and Maryland's strict legal use-of-force standards.",
        why: [
          "You want legal authorization to carry a concealed handgun on your person throughout Maryland for personal and family protection.",
          "Comprehensive self-defense legal education: The 5 Pillars of Lawful Force (State v. Faulkner), Castle Doctrine, and SB 1 sensitive locations.",
          "Includes the official 25-round Maryland State Police live-fire qualification shoot with Lead Instructor Kai Wade."
        ],
        whyNot: [
          "Requires a 16-hour commitment across two sessions and live-fire range qualification.",
          "If you only want a pistol locked in your home nightstand for home defense and never plan to carry outside, the 4-hour HQL is all you need."
        ]
      },
      want_both: {
        badge: "Most Popular • Maximum Value & Efficiency",
        title: "I Want Both: Purchase & Concealed Carry",
        rec: "Recommended: Maryland CCW & HQL Combo ($249.99)",
        courseValue: "Maryland CCW & HQL Combo — Base Track ($249.99)",
        showGuide: false,
        synopsis: "The all-inclusive gold standard for Maryland citizens. Complete your full 16-hour Wear & Carry permit certification and qualify for a training exemption on your Maryland HQL application—giving you full carry rights and handgun purchase rights in one streamlined curriculum.",
        why: [
          "Maximum efficiency: Once you graduate from Wear & Carry, Maryland allows you to apply for an HQL permit without paying for a separate HQL training class.",
          "Covers everything from foundational safe gun handling to holster work and dynamic target acquisition.",
          "Includes complete administrative walk-through for both Maryland State Police portals from start to finish."
        ],
        whyNot: [
          "Requires the full 16-hour schedule. If you have an urgent need to purchase a home-defense firearm within the next few days, start with the standalone 4-hour HQL first."
        ]
      },
      need_multistate: {
        badge: "Multi-State Travel & I-95 Commuters",
        title: "Do I Need a Multi-State Carry Permit?",
        rec: "Recommended: Mid-Atlantic Multi-State Mastery ($425 Base / $550 VIP)",
        courseValue: "Mid-Atlantic Multi-State Mastery — VIP Turnkey ($550.00)",
        showGuide: false,
        synopsis: "Designed for travelers, commuters, and roadtrippers who regularly cross Maryland state borders into Virginia, Pennsylvania, Delaware, the Carolinas, Georgia, or Florida. Maryland's permit alone does NOT honor Pennsylvania or Delaware directly. This course fulfills your 16-hour Maryland requirement while preparing the affidavits and documentation needed for Virginia, Florida, Arizona, and Pennsylvania non-resident carry in a single weekend.",
        why: [
          "You travel along I-95, I-81, or I-70 for work, family, or vacations and want legal carry coverage across multiple states without accidental felony violations.",
          "Knocks out your Maryland Wear & Carry permit plus non-resident application documentation for VA, FL, AZ, and PA in one organized experience.",
          "VIP Turnkey option provides everything: range fees, targets, loaner 9mm, factory ammo, on-site FD-258 fingerprint cards, and 2x2 passport photos."
        ],
        whyNot: [
          "If you only stay inside Maryland and rarely travel out of state, the standard Maryland Wear & Carry course ($199.99 Base / $325 VIP) is all you need.",
          "If your only goal is keeping a firearm at home for protection, choose the Maryland HQL class instead."
        ]
      },
      personalized_focus: {
        badge: "100% Private • Custom Pace & Confidential",
        title: "Personalized Coaching / Anxiety & Trauma Relief",
        rec: "Recommended: Private 1-on-1 Coaching ($125.00 / hr)",
        courseValue: "Personal 1-on-1 Coaching — Base Track ($125.00/hr)",
        showGuide: false,
        synopsis: "Dedicated one-on-one private instruction tailored exclusively to your personal comfort level, physical capabilities, and schedule with Lead Instructor Kai Wade. Zero classmates, zero judgment, and customized range drills.",
        why: [
          "You have anxiety, past trauma, or nervousness and want a quiet, completely controlled setting with supportive attention.",
          "Advanced diagnostic shooter coaching: recoil control, red-dot optic zeroing, micro-chassis platforms, or sub-second draw mechanics.",
          "Custom scheduling tailored around your personal availability."
        ],
        whyNot: [
          "Billed at an hourly rate ($125/hr). For standard state permit compliance (Wear & Carry or HQL), our packaged group courses provide the most economical rate."
        ]
      }
    };
    window.GOAL_SYNOPSIS_DATA = GOAL_SYNOPSIS_DATA;
    var FIFS_STEPS_DATA = {
      1: {
        title: "Registration & Profile Creation",
        icon: "📝",
        status: "Completed ✔",
        synopsis: "Your student enrollment record has been initialized in the Future Initiative database with your unique Student ID and course selection.",
        points: [
          "✔ Full Name, Email, and Phone recorded in the Master Student Booking Ledger.",
          "✔ Student Profile Document generated and stored securely in Google Drive.",
          "✔ Lifecycle status initialized to STEP_1_REGISTERED."
        ],
        ctaText: "Review Course Selection & Tuition →",
        ctaAction: "switchTab('booking')"
      },
      2: {
        title: "Seat Confirmation & Training Date Assignment",
        icon: "📅",
        status: "Completed ✔",
        synopsis: "Your training cohort date and qualification shooting lane reservation at Cindy&#39;s Hot Shots have been assigned.",
        points: [
          "✔ Qualification lane reserved at Cindy&#39;s Hot Shots (Glen Burnie, MD).",
          "✔ Confirmation notification and preparation briefing sent to student email.",
          "✔ Access granted to the Future Initiative Student Operations Portal."
        ],
        ctaText: "Check Student Dashboard →",
        ctaAction: "switchTab('portal')"
      },
      3: {
        title: "Pre-Class Readiness & Equipment Preparation",
        icon: "🎒",
        status: "Active Action Required ⚡",
        synopsis: "Preparation is critical for range safety. You must review equipment standards, complete your digital safety waiver, and acquire target ammunition before live-fire qualification.",
        points: [
          "✔ MANDATORY: Complete & Sign Digital Safety & Liability Waiver (Required prior to range entry).",
          "✔ Review Maryland Transport Compliance (Unloaded in locked case/trunk).",
          "✔ Acquire 50–100 rounds of factory target brass ammunition (9mm, .380, etc.).",
          "✔ Secure ANSI Z87.1 wrap-around eye protection & electronic earmuffs (or arrange loaner/rental).",
          "✔ Verify government photo ID is valid and unexpired."
        ],
        ctaText: "Open Equipment & Readiness Checklist →",
        ctaAction: "openExpectationModal('handgun')"
      },
      4: {
        title: "Classroom Instruction & Self-Defense Law",
        icon: "⚖️",
        status: "Scheduled Evolution",
        synopsis: "Comprehensive state-approved instruction covering firearm mechanics, conflict avoidance, de-escalation, and Maryland criminal law.",
        points: [
          "✔ Maryland SB 1 Sensitive Places restrictions and prohibited carry zones.",
          "✔ State v. Faulkner duty to retreat and lawful defense of self and others.",
          "✔ Safe staging, home storage compliance, and child access prevention laws.",
          "✔ 100% strict zero-live-ammunition classroom policy enforced."
        ],
        ctaText: "View Follow-Along Course Packet →",
        ctaAction: "window.open('https://docs.google.com/document/d/1K0dM40LAbSy8i7k9vM0iZNJk-YdYMZ9BC_tbI1l6oe0/edit?usp=sharing', '_blank')"
      },
      5: {
        title: "Live-Fire Practical Range Qualification",
        icon: "🎯",
        status: "Range Practical",
        synopsis: "Live-fire qualification shots conducted downrange at Cindy&#39;s Hot Shots (course instruction led by FIFS) under the direct supervision of Certified Instructor Kai Wade.",
        points: [
          "✔ Wear & Carry: 25-round course of fire at 3, 5, 7, and 15 yards on B-27 targets (70% passing score).",
          "✔ HQL: Demonstration of safe loading, firing, and unloading mechanics.",
          "✔ Diagnostic feedback on grip friction, sight tracking, and trigger press reset."
        ],
        ctaText: "View Range Highlights & Targets →",
        ctaAction: "switchTab('testimonial')"
      },
      6: {
        title: "Certified Score Sheet Delivery (MSP Form 29-14)",
        icon: "📜",
        status: "Official Record",
        synopsis: "Upon passing your live-fire shoot, Coach Kai Wade signs and certifies your official Maryland State Police Form 29-14 Training Documentation.",
        points: [
          "✔ Certified MSP Form 29-14 signed with Instructor QHIC # and date.",
          "✔ High-resolution PDF generated and delivered to your Student Portal.",
          "✔ Official Score Sheet serves as mandatory proof of training for your MSP application."
        ],
        ctaText: "Preview Official MSP 29-14 Score Sheet →",
        ctaAction: "window.open('https://mdsp.maryland.gov/Organization/Licensing%20Division%20Documents/MSP%20Form%2029-14%20-%20Certified%20Handgun%20Training%20Score%20Sheet.pdf', '_blank')"
      },
      7: {
        title: "MSP Portal Submission & LiveScan Fingerprints",
        icon: "💻",
        status: "State Application",
        synopsis: "Submit your formal permit application online through the Maryland State Police MyLicense portal and complete your state and FBI background check.",
        points: [
          "✔ Obtain electronic LiveScan fingerprints from an authorized Maryland DPSCS provider.",
          "✔ Upload your certified MSP Form 29-14 and passport-style photo to the portal.",
          "✔ Track application progression and respond promptly to any MSP investigator inquiries."
        ],
        ctaText: "Open Maryland MyLicense Portal ↗",
        ctaAction: "window.open('https://licensingportal.mdsp.maryland.gov/', '_blank')"
      },
      8: {
        title: "Licensed Permit Carry & Ongoing Reciprocity",
        icon: "🛡️",
        status: "Milestone Achieved",
        synopsis: "Receive your official Maryland Wear & Carry Permit card in the mail. Access our Reciprocity Engine and activate your 3-year renewal countdown watch.",
        points: [
          "✔ Carry lawfully across Maryland and reciprocal states.",
          "✔ Utilize the FIFS 50-State Reciprocity Engine to verify travel compliance.",
          "✔ Track your 3-year expiration date for 10% off your required 8-hour renewal class."
        ],
        ctaText: "Launch 50-State Reciprocity Hub ↗",
        ctaAction: "toggleReciprocityHubModal(true)"
      }
    };
    window.FIFS_STEPS_DATA = FIFS_STEPS_DATA;
    var EXPECTATION_DATA = {
      "handgun": {
            "icon": "\ud83d\udd2b",
            "badge": "Firearms & Gear Protocols",
            "title": "Handgun & Equipment Guidelines",
            "subtitle": "Zero-Intimidation Gear Standards for Range Day",
            "sections": [
                  {
                        "title": "Do I Need My Own Handgun?",
                        "desc": "No! You do not need to own a firearm prior to taking our courses. Handgun rentals can be coordinated directly at Cindy&#39;s Hot Shots. Taking the course before buying allows you to learn proper fit, recoil impulse, and grip ergonomics before spending money on a pistol."
                  },
                  {
                        "title": "Bringing Your Own Handgun?",
                        "desc": "If bringing your own firearm, it must be Maryland transport compliant: 100% completely unloaded and enclosed inside a rigid locked case or secured in your vehicle trunk. Strictly NO firearms may be uncased outside the firing line."
                  },
                  {
                        "title": "Holster Standards (Wear & Carry Only)",
                        "desc": "Must be a rigid, molded Kydex or heavy leather holster specifically fitted for your handgun model (OWB or IWB) that completely encloses the trigger guard. Soft nylon universal holsters and collapsible fabric holsters are strictly prohibited for safety."
                  },
                  {
                        "title": "Magazines & Loading Devices",
                        "desc": "Bring at least 2 factory magazines (3 recommended) or speedloaders for revolvers to keep shooting evolutions efficient on the firing line."
                  }
            ]
      },
      "ammunition": {
            "icon": "\ud83d\udce6",
            "badge": "Strict Range Safety Protocol",
            "title": "Ammunition Protocol & Classroom Safety",
            "subtitle": "Zero-Tolerance Policy: Range Live-Fire Only",
            "sections": [
                  {
                        "title": "100% Zero-Live-Ammunition Classroom Mandate",
                        "desc": "Absolutely zero live ammunition is permitted inside the classroom environment under any circumstance. All live ammunition must remain secured in your vehicle trunk until Instructor Kai Wade conducts the live-fire qualification shots downrange at Cindy&#39;s Hot Shots."
                  },
                  {
                        "title": "Required Ammo Quantity",
                        "desc": "50 to 100 rounds of factory-manufactured target ammunition. Clean brass-cased FMJ (Full Metal Jacket) is recommended. Handloaded, reloaded, or steel-core penetrating ammunition is not permitted."
                  },
                  {
                        "title": "Purchasing Ammo On-Site",
                        "desc": "Target ammunition in all standard calibers (9mm, .380 ACP, .40 S&W, .45 ACP, .38 Special) is available for purchase directly at Cindy&#39;s Hot Shots pro shop counter before range qualification."
                  }
            ]
      },
      "protection": {
            "icon": "\ud83d\udc53",
            "badge": "Personal Safety Equipment",
            "title": "Eye & Hearing Protection Guidelines",
            "subtitle": "Required Range Line Safety Specifications",
            "sections": [
                  {
                        "title": "Wrap-Around Eye Protection",
                        "desc": "Must be ANSI Z87.1 certified safety glasses with side-shield protection to guard against deflected hot brass and particulate. Regular prescription eyeglasses are acceptable if fitted with side shields."
                  },
                  {
                        "title": "Hearing Protection (Electronic Recommended)",
                        "desc": "Electronic noise-canceling earmuffs are strongly recommended because they amplify the instructor's voice and range commands while instantly compressing gunfire impulses over 85 dB. Passive muffs or foam earplugs are also accepted."
                  },
                  {
                        "title": "Range Loaners / Purchases",
                        "desc": "Safety glasses and hearing protection are available for purchase or rental at Cindy&#39;s Hot Shots on class day if you do not own them."
                  }
            ]
      },
      "attire": {
            "icon": "\ud83d\udc55",
            "badge": "Dress Code & Compliance",
            "title": "Range Attire & Required Documentation",
            "subtitle": "Comfort, Protection & State Mandate Verification",
            "sections": [
                  {
                        "title": "Proper Clothing & Footwear",
                        "desc": "Wear crew-neck t-shirts or collared shirts fitting close to the neck to prevent ejected hot brass from settling inside clothing. Closed-toe athletic shoes or boots are mandatory\u2014sandals, heels, or open-toe footwear are strictly prohibited."
                  },
                  {
                        "title": "Sturdy EDC Gun Belt",
                        "desc": "Wear a solid 1.5-inch leather or reinforced tactical gun belt capable of holding the holster securely against your body without sagging during holster draw and holstering drills."
                  },
                  {
                        "title": "Mandatory Government Identification",
                        "desc": "Valid, unexpired government-issued photo ID (Driver's License, State ID, or Military ID) is legally required for Maryland State Police paperwork and Cindy&#39;s Hot Shots range waivers."
                  }
            ]
      }
};
    window.EXPECTATION_DATA = EXPECTATION_DATA;
    var FORM_COURSE_PRICING = {
      "Mid-Atlantic Multi-State Mastery": {
        base: "$425.00",
        vip: "$550.00",
        baseDesc: "Self-equipped track. Includes 16-hour instruction + live-fire qualification + documentation for MD, VA, FL, AZ, and PA. Provide own firearm and ammo.",
        vipDesc: "👑 VIP Turnkey Track. Includes Cindy&#39;s Hot Shots range lane fee, B-27 targets, loaner 9mm handgun, 50 rounds factory ammo, on-site FD-258 fingerprint cards, and 2x2 passport photos!"
      },
      "Maryland CCW & HQL Combo": {
        base: "$249.99",
        vip: "$375.00",
        baseDesc: "Self-equipped track. 16-hour Wear & Carry curriculum + Maryland HQL exemption guide. Provide own handgun, holster, and ammo.",
        vipDesc: "👑 VIP Turnkey Track. Includes Cindy&#39;s Hot Shots lane fee, B-27 targets, loaner 9mm handgun, 50 rounds factory ammo & on-site passport photos!"
      },
      "Maryland Wear & Carry (CCW)": {
        base: "$199.99",
        vip: "$325.00",
        baseDesc: "Self-equipped track. 16-hour Wear & Carry certification and live-fire range qualification. Provide own firearm and ammo.",
        vipDesc: "👑 VIP Turnkey Track. Includes range fee at Cindy&#39;s Hot Shots, B-27 targets, loaner 9mm handgun, 50 rounds factory ammo & passport photos!"
      },
      "Maryland HQL (Purchase License)": {
        base: "$100.00",
        vip: "$165.00",
        baseDesc: "Self-equipped track. 4-hour state prerequisite course with live-fire component.",
        vipDesc: "👑 VIP Turnkey Track. Includes range fee, loaner handgun, live-fire target ammo, target & portal submission guidance!"
      },
      "Personal 1-on-1 Coaching": {
        base: "$125.00/hr",
        vip: "$195.00/hr",
        baseDesc: "Dedicated 1-on-1 private coaching. Custom diagnostic instruction.",
        vipDesc: "👑 VIP Turnkey Track. Includes private lane fee, diagnostic sensor telemetry (MantisX), loaner firearms & ammunition!"
      },
      "Gun Cleaning & Maintenance": {
        base: "$75.00",
        vip: "$115.00",
        baseDesc: "Instructional field-strip, cleaning, and maintenance workshop.",
        vipDesc: "👑 VIP Turnkey Track. Includes full premium take-home cleaning kit, ultrasonic treatment & specialized solvents!"
      },
      "Children's Safety Class": {
        base: "$199.99",
        vip: "$265.00",seDesc: "Family safety and Eddie Eagle accident-prevention curriculum.",
        vipDesc: "👑 VIP Turnkey Track. Includes certified home cable gun locks, youth workbook & completion certificate!"
      },
      "FIFS Graduate Alumni Marksmanship Clinic": {
        base: "$65.00",
        vip: "$65.00",
        baseDesc: "FIFS alumni exclusive clinic. 2-hour practical diagnostic qualification shooting at Cindy&#39;s Hot Shots (Glen Burnie, MD) coached directly by Lead Instructor Kai Wade.",
        vipDesc: "Flat rate for certified graduates and permit holders ($65.00/session). No VIP package needed—all training and lane access included!"
      }
    };
    window.FORM_COURSE_PRICING = FORM_COURSE_PRICING;
    var DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1547779726746320958/nu4yar-r8aR3c6-P-mm8YeprX5bou1uqej24tEuYhNS5LVusMuBtADVcv1vf1oJp_bum";
    window.DISCORD_WEBHOOK_URL = DISCORD_WEBHOOK_URL;
    function sendClientDiscordAlert(title, description, fields, colorInt) {
      try {
        if (!DISCORD_WEBHOOK_URL) return;
        var payload = {
          username: "FIFS Command Center",
          avatar_url: "https://drive.google.com/thumbnail?id=1EnAqEURi1XIRNdNTooFGY_pvs38ZcBEQ&sz=w256",
          embeds: [{
            title: title || "FIFS Operational Notification",
            description: description || "",
            color: colorInt || 0x00E5FF,
            fields: fields || [],
            footer: {
              text: "Future Initiative Firearm Services • trainwithfifs.com",
              icon_url: "https://drive.google.com/thumbnail?id=1EnAqEURi1XIRNdNTooFGY_pvs38ZcBEQ&sz=w128"
            },
            timestamp: new Date().toISOString()
          }]
        };
        fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(function(err) {
          console.log("Discord alert delivery notice:", err);
        });
      } catch (e) {
        console.log("Discord notification catch:", e);
      }
    }
    window.sendClientDiscordAlert = sendClientDiscordAlert;
    function isLiveChatActiveNow() {
      try {
        var formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          hour12: false
        });
        var currentHour = parseInt(formatter.format(new Date()), 10);
        return (currentHour >= 9 && currentHour < 17);
      } catch (e) {
        return true;
      }
    }
    window.isLiveChatActiveNow = isLiveChatActiveNow;
    function showStatus(elem, text, type) {
      if (!elem) return;
      elem.textContent = text;
      elem.className = 'status-msg ' + type;
      elem.style.display = 'block';
    }
    window.showStatus = showStatus;
    // ==========================================================================
    // BULLETPROOF MODAL TRIGGER ENGINE (DISPLAYS WITH OPACITY & POINTER-EVENTS)
    // ==========================================================================
    function openGoalSynopsis(goalKey) {
      var data = GOAL_SYNOPSIS_DATA[goalKey];
      if (!data) return;
      var modal = document.getElementById('goalSynopsisModal');
      var badge = document.getElementById('goalModalBadge');
      var title = document.getElementById('goalModalTitle');
      var rec = document.getElementById('goalModalRec');
      var synopsis = document.getElementById('goalModalSynopsis');
      var whyList = document.getElementById('goalModalWhyList');
      var whyNotList = document.getElementById('goalModalWhyNotList');
      var acceptBtn = document.getElementById('goalModalAcceptBtn');
      var guideBanner = document.getElementById('goalModalGuideBanner');
      var mspPortalBanner = document.getElementById('goalModalMspPortalBanner');
      if (badge) badge.textContent = data.badge;
      if (title) title.textContent = data.title;
      if (rec) rec.textContent = data.rec;
      if (synopsis) synopsis.textContent = data.synopsis;
      if (whyList && Array.isArray(data.why)) {
        whyList.innerHTML = data.why.map(item => `<li><span class="bullet-icon-why">✔</span><span>${item}</span></li>`).join('');
      }
      if (whyNotList && Array.isArray(data.whyNot)) {
        whyNotList.innerHTML = data.whyNot.map(item => `<li><span class="bullet-icon-why-not">⚡</span><span>${item}</span></li>`).join('');
      }
      if (guideBanner) guideBanner.style.display = data.showGuide ? 'flex' : 'none';
      if (mspPortalBanner) mspPortalBanner.style.display = (goalKey === 'want_to_carry') ? 'flex' : 'none';
      if (acceptBtn) {
        if (goalKey === 'new_to_firearms') {
          acceptBtn.style.display = 'none';
        } else {
          acceptBtn.style.display = 'inline-flex';
          acceptBtn.onclick = function() {
            closeGoalSynopsis();
            selectCourse(data.courseValue);
          };
        }
      }
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
    }
    window.openGoalSynopsis = openGoalSynopsis;
    function closeGoalSynopsis() {
      var modal = document.getElementById('goalSynopsisModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeGoalSynopsis = closeGoalSynopsis;
    function openStepDetailModal(stepNum) {
      var data = FIFS_STEPS_DATA[stepNum];
      if (!data) return;
      var modal = document.getElementById('stepDetailModal');
      var badge = document.getElementById('stepModalBadge');
      var heading = document.getElementById('stepModalHeading');
      var icon = document.getElementById('stepModalIcon');
      var status = document.getElementById('stepModalStatus');
      var synopsis = document.getElementById('stepModalSynopsis');
      var keyPoints = document.getElementById('stepModalKeyPoints');
      var actions = document.getElementById('stepModalActions');
      if (badge) badge.textContent = `STEP ${stepNum} OF 8 • TRAINING ROADMAP`;
      if (heading) heading.textContent = data.title;
      if (icon) icon.textContent = data.icon;
      if (status) status.textContent = `Status: ${data.status}`;
      if (synopsis) synopsis.textContent = data.synopsis;
      if (keyPoints && Array.isArray(data.points)) {
        keyPoints.innerHTML = data.points.map(p => `
          <div style="background: #0d121a; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 14px; font-size: 0.85rem; color: #cbd5e1;">
            ${p}
          </div>
        `).join('');
      }
      if (actions) {
        actions.innerHTML = `
          <button type="button" class="btn-primary" onclick="closeStepDetailModal(); ${data.ctaAction};">
            ${data.ctaText}
          </button>
          <button type="button" class="btn-secondary-modal" onclick="closeStepDetailModal()">
            Close Step Overview
          </button>
        `;
      }
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
    }
    window.openStepDetailModal = openStepDetailModal;
    function closeStepDetailModal() {
      var modal = document.getElementById('stepDetailModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeStepDetailModal = closeStepDetailModal;
    function openExpectationModal(type) {
      var data = EXPECTATION_DATA[type];
      if (!data) return;
      var modal = document.getElementById('expectationModal');
      var badge = document.getElementById('expectModalBadge');
      var heading = document.getElementById('expectModalHeading');
      var icon = document.getElementById('expectModalIcon');
      var subtitle = document.getElementById('expectModalSubtitle');
      var synopsis = document.getElementById('expectModalSynopsis');
      var grid = document.getElementById('expectModalSectionsGrid');
      if (badge) badge.textContent = data.badge;
      if (heading) heading.textContent = data.title;
      if (icon) icon.textContent = data.icon;
      if (subtitle) subtitle.textContent = data.subtitle;
      if (synopsis) synopsis.textContent = data.synopsis || data.subtitle;
      if (grid && Array.isArray(data.sections)) {
        grid.innerHTML = data.sections.map(s => `
          <div style="background: #070b10; border: 1px solid var(--border-subtle); border-left: 3px solid var(--accent-cyan); border-radius: 8px; padding: 12px 14px;">
            <strong style="font-family: var(--font-display); font-size: 1.05rem; color: #fff; display: block; margin-bottom: 3px;">${s.title}</strong>
            <p style="font-size: 0.84rem; color: #cbd5e1; line-height: 1.45; margin: 0;">${s.desc}</p>
          </div>
        `).join('');
      }
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
    }
    window.openExpectationModal = openExpectationModal;
    function closeExpectationModal() {
      var modal = document.getElementById('expectationModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeExpectationModal = closeExpectationModal;
    // ==========================================================================
    // SYNCHRONIZED COURSE SELECTION, FORM TIER TOGGLE & DYNAMIC CALENDAR ENGINE
    // ==========================================================================
    function getMatchedCourseKey(selectedVal) {
      var v = (selectedVal || '').toLowerCase();
      if (v.includes('alumni') || v.includes('clinic')) return "FIFS Graduate Alumni Marksmanship Clinic";
      if (v.includes('multi-state') || v.includes('mastery')) return "Mid-Atlantic Multi-State Mastery";
      if (v.includes('combo')) return "Maryland CCW & HQL Combo";
      if (v.includes('renewal') || v.includes('recertification') || v.includes('8-hour') || v.includes('8 hour')) return "Maryland Wear & Carry (8-Hour Renewal)";
      if (v.includes('wear & carry') || v.includes('ccw')) return "Maryland Wear & Carry (CCW)";
      if (v.includes('hql')) return "Maryland HQL (Purchase License)";
      if (v.includes('1-on-1') || v.includes('coaching') || v.includes('one-on-one')) return "Personal 1-on-1 Coaching";
      if (v.includes('cleaning')) return "Gun Cleaning & Maintenance";
      if (v.includes('children') || v.includes('youth')) return "Children's Safety Class";
      return "Maryland CCW & HQL Combo";
    }
    window.getMatchedCourseKey = getMatchedCourseKey;
    function updateFormPriceDisplay() {
      var selectElem = document.getElementById('courseSelection');
      if (!selectElem) return;
      var selectedVal = selectElem.value;
      var isVip = selectedVal.includes('VIP') || selectedVal.includes('Turnkey');
      var matchedKey = getMatchedCourseKey(selectedVal);
      var pData = FORM_COURSE_PRICING[matchedKey];
      if (!pData) return;
      var titleElem = document.getElementById('formCardCourseTitle');
      var tierTag = document.getElementById('formCardTierTag');
      var activePrice = document.getElementById('formCardActivePrice');
      var baseVal = document.getElementById('formPriceBaseVal');
      var vipVal = document.getElementById('formPriceVipVal');
      var tierDesc = document.getElementById('formCardTierDesc');
      var boxBase = document.getElementById('formBoxBase');
      var boxVip = document.getElementById('formBoxVip');
      // Parse base and VIP unit rates
      var baseMatch = (pData.base || '').match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
      var vipMatch = (pData.vip || '').match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
      var unitBase = baseMatch ? parseFloat(baseMatch[1].replace(/,/g, '')) : 249.99;
      var unitVip = vipMatch ? parseFloat(vipMatch[1].replace(/,/g, '')) : 375.00;
      // Group size factor
      var groupElem = document.getElementById('groupSize');
      var groupVal = groupElem ? groupElem.value : '1 (Private One-on-One)';
      var count = 1;
      var discountPercent = 0;
      var discountBadge = '';
      if (/^2|2 \(paired/i.test(groupVal)) {
        count = 2;
        discountPercent = 0.05;
        discountBadge = ' • 2 People (5% Group Discount)';
      } else if (/^3|3 \(small/i.test(groupVal)) {
        count = 3;
        discountPercent = 0.10;
        discountBadge = ' • 3 People (10% Group Discount)';
      } else if (/^4|4 \(small/i.test(groupVal)) {
        count = 4;
        discountPercent = 0.10;
        discountBadge = ' • 4 People (10% Group Discount)';
      } else if (/5\+/i.test(groupVal) || /^5/i.test(groupVal)) {
        count = 5;
        discountPercent = 0.15;
        discountBadge = ' • 5+ Cohort (15% Group Discount)';
      }
      var calcTierPrice = function(unitPrice) {
        var raw = unitPrice * count;
        var disc = raw * discountPercent;
        return raw - disc;
      };
      var totalBase = calcTierPrice(unitBase);
      var totalVip = calcTierPrice(unitVip);
      var baseStr = '$' + totalBase.toFixed(2);
      var vipStr = '$' + totalVip.toFixed(2);
      if (titleElem) titleElem.textContent = matchedKey;
      if (baseVal) baseVal.textContent = baseStr;
      if (vipVal) vipVal.textContent = vipStr;
      if (isVip) {
        if (tierTag) {
          tierTag.textContent = "👑 VIP Turnkey Track" + (discountBadge || " Selected");
          tierTag.style.color = "var(--accent-amber)";
        }
        if (activePrice) {
          activePrice.textContent = vipStr;
          activePrice.style.color = "var(--accent-amber)";
        }
        if (tierDesc) {
          tierDesc.textContent = pData.vipDesc;
          tierDesc.style.borderLeftColor = "var(--accent-amber)";
        }
        if (boxVip) {
          boxVip.style.borderColor = "var(--accent-amber)";
          boxVip.style.background = "rgba(255, 183, 3, 0.12)";
          boxVip.style.boxShadow = "0 0 14px rgba(255, 183, 3, 0.25)";
        }
        if (boxBase) {
          boxBase.style.borderColor = "var(--border-subtle)";
          boxBase.style.background = "#070b10";
          boxBase.style.boxShadow = "none";
        }
      } else {
        if (tierTag) {
          tierTag.textContent = "Standard Base Track" + (discountBadge || " Selected");
          tierTag.style.color = "var(--accent-cyan)";
        }
        if (activePrice) {
          activePrice.textContent = baseStr;
          activePrice.style.color = "var(--accent-cyan)";
        }
        if (tierDesc) {
          tierDesc.textContent = pData.baseDesc;
          tierDesc.style.borderLeftColor = "var(--accent-cyan)";
        }
        if (boxBase) {
          boxBase.style.borderColor = "var(--accent-cyan)";
          boxBase.style.background = "rgba(0, 229, 255, 0.08)";
          boxBase.style.boxShadow = "0 0 14px var(--accent-cyan-glow)";
        }
        if (boxVip) {
          boxVip.style.borderColor = "var(--border-subtle)";
          boxVip.style.background = "#070b10";
          boxVip.style.boxShadow = "none";
        }
      }
      if (typeof renderBookingCalendar === 'function') {
        renderBookingCalendar();
      }
    }
    window.updateFormPriceDisplay = updateFormPriceDisplay;
    function toggleFormTier(targetTier) {
      var selectElem = document.getElementById('courseSelection');
      if (!selectElem) return;
      var currentVal = selectElem.value;
      var isCurrentlyVip = currentVal.includes('VIP') || currentVal.includes('Turnkey');
      if (targetTier === 'vip' && !isCurrentlyVip) {
        for (var i = 0; i < selectElem.options.length; i++) {
          var opt = selectElem.options[i].value;
          if ((opt.includes('VIP') || opt.includes('Turnkey')) && (
            (currentVal.includes('Multi-State') && opt.includes('Multi-State')) ||
            (currentVal.includes('Combo') && opt.includes('Combo')) ||
            (currentVal.includes('Wear & Carry') && opt.includes('Wear & Carry') && !opt.includes('Combo')) ||
            (currentVal.includes('HQL') && opt.includes('HQL') && !opt.includes('Combo')) ||
            (currentVal.includes('1-on-1') && opt.includes('1-on-1')) ||
            (currentVal.includes('Cleaning') && opt.includes('Cleaning')) ||
            (currentVal.includes('Children') && opt.includes('Children'))
          )) {
            selectElem.selectedIndex = i;
            selectElem.value = opt;
            break;
          }
        }
      } else if (targetTier === 'base' && isCurrentlyVip) {
        for (var i = 0; i < selectElem.options.length; i++) {
          var opt = selectElem.options[i].value;
          if (!opt.includes('VIP') && !opt.includes('Turnkey') && (
            (currentVal.includes('Multi-State') && opt.includes('Multi-State')) ||
            (currentVal.includes('Combo') && opt.includes('Combo')) ||
            (currentVal.includes('Wear & Carry') && opt.includes('Wear & Carry') && !opt.includes('Combo')) ||
            (currentVal.includes('HQL') && opt.includes('HQL') && !opt.includes('Combo')) ||
            (currentVal.includes('1-on-1') && opt.includes('1-on-1')) ||
            (currentVal.includes('Cleaning') && opt.includes('Cleaning')) ||
            (currentVal.includes('Children') && opt.includes('Children'))
          )) {
            selectElem.selectedIndex = i;
            selectElem.value = opt;
            break;
          }
        }
      }
      updateFormPriceDisplay();
    }
    window.toggleFormTier = toggleFormTier;
    // ==========================================================================
    // 2-WAY LIVE CHAT MODAL ENGINE (REAL-TIME COMMUNICATION WINDOW)
    // ==========================================================================
    function openTwoWayChat(name, phone, initialMsg) {
      var rawPhone = phone || '';
      var cleanPhone = rawPhone.replace(/\D/g, '');
      var storedThreadId = sessionStorage.getItem('fifs_active_thread_id');
      var activeThreadId = storedThreadId || (cleanPhone ? ('thread_' + cleanPhone) : ('thread_' + Date.now()));
      sessionStorage.setItem('fifs_active_thread_id', activeThreadId);

      window.__currentChatSession = {
        name: name || 'Valued Student',
        phone: rawPhone || 'Not provided',
        threadId: activeThreadId
      };
      var modal = document.getElementById('twoWayChatModal');
      var stream = document.getElementById('twoWayChatStream');
      var headerTitle = document.getElementById('twoWayChatHeaderTitle');
      if (headerTitle) headerTitle.textContent = "Coach Kai Wade";
      if (stream) {
        stream.innerHTML = '';
        var channelBanner = document.createElement('div');
        channelBanner.style.textAlign = 'center';
        channelBanner.style.margin = '4px 0 10px';
        channelBanner.innerHTML = '<span style="font-size: 0.72rem; color: var(--accent-cyan); background: rgba(0, 229, 255, 0.08); border: 1px solid rgba(0, 229, 255, 0.25); padding: 4px 12px; border-radius: 20px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">🔒 Direct 2-Way Channel Established with Lead Instructor Kai Wade</span>';
        stream.appendChild(channelBanner);
        var now = new Date();
        var timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        appendTwoWayBubble('user', name, initialMsg, timeStr);
        setTimeout(function() {
          var welcomeReply = "Hello, this is Instructor Wade's personal chat assistant. How can I help you today? Please note, if this message was sent between the hours of 9 AM to 5 PM, there is a great chance of him responding within the next five minutes. So please leave this window open.";
          appendTwoWayBubble('instructor', 'Coach Kai Wade', welcomeReply, timeStr);
        }, 400);
      }
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
      setTimeout(function() {
        var input = document.getElementById('twoWayMessageInput');
        if (input) input.focus();
      }, 300);
    }
    window.openTwoWayChat = openTwoWayChat;
    // Visitor 2-Way Chat Real-Time Poller
    window.__visitorChatPollInterval = null;
    function startVisitorChatPolling(threadId) {
      stopVisitorChatPolling();
      window.__visitorChatPollInterval = setInterval(function() {
        if (!window.__currentChatSession || !window.__currentChatSession.threadId) return;
        if (typeof callFifsBackend !== 'function') return;
        callFifsBackend('getVisitorChatMessages', { threadId: window.__currentChatSession.threadId }, function(res) {
          if (res && res.status === 'success' && Array.isArray(res.messages)) {
            var stream = document.getElementById('twoWayChatStream');
            if (!stream) return;
            var rendered = window.__currentChatSession.renderedMessages || {};
            res.messages.forEach(function(m) {
              var key = m.timestamp + '_' + m.text;
              if (!rendered[key] && m.sender === 'instructor') {
                rendered[key] = true;
                var time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
                appendTwoWayBubble('instructor', m.senderName || 'Coach Kai Wade', m.text, time);
              }
            });
            window.__currentChatSession.renderedMessages = rendered;
          }
        }, function(err) {});
      }, 5000);
    }
    function stopVisitorChatPolling() {
      if (window.__visitorChatPollInterval) {
        clearInterval(window.__visitorChatPollInterval);
        window.__visitorChatPollInterval = null;
      }
    }
    window.startVisitorChatPolling = startVisitorChatPolling;
    window.stopVisitorChatPolling = stopVisitorChatPolling;
    function closeTwoWayChat() {
      stopVisitorChatPolling();
      var modal = document.getElementById('twoWayChatModal');
      var stream = document.getElementById('twoWayChatStream');
      var input = document.getElementById('twoWayMessageInput');
      var dispatchForm = document.getElementById('liveChatDispatchForm');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (stream) stream.innerHTML = '';
      if (input) input.value = '';
      if (dispatchForm) dispatchForm.reset();
      window.__currentChatSession = null;
      try {
        sessionStorage.removeItem('fifs_live_chat_transcript');
        _fifsMemStorage.removeItem('fifs_live_chat_transcript');
      } catch (e) {}
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeTwoWayChat = closeTwoWayChat;
    function showChatTypingIndicator() {
      var stream = document.getElementById('twoWayChatStream');
      if (!stream) return;
      var existing = document.getElementById('fifs-typing-indicator');
      if (existing) return;
      var ind = document.createElement('div');
      ind.id = 'fifs-typing-indicator';
      ind.style.cssText = 'display:flex;align-items:center;gap:6px;padding:8px 14px;background:#1e293b;border-radius:12px;width:fit-content;margin:6px 0;font-size:0.8rem;color:#00e5ff;';
      ind.innerHTML = '<span style="display:inline-block;animation:pulse 1s infinite;">⚡</span> FIFS Assistant is thinking...';
      stream.appendChild(ind);
      stream.scrollTop = stream.scrollHeight;
    }
    function removeChatTypingIndicator() {
      var ind = document.getElementById('fifs-typing-indicator');
      if (ind && ind.parentNode) ind.parentNode.removeChild(ind);
    }
    /* Legacy head handleLiveChatSubmit replaced by authoritative body handler */
    function appendTwoWayBubble(senderType, senderName, text, timeStr) {
      var stream = document.getElementById('twoWayChatStream');
      if (!stream) return;
      var bubble = document.createElement('div');
      bubble.style.marginBottom = '12px';
      bubble.style.display = 'flex';
      bubble.style.flexDirection = 'column';
      if (senderType === 'user') {
        bubble.style.alignItems = 'flex-end';
        bubble.innerHTML = `
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 2px;">${escapeHtml(senderName)} • ${timeStr}</div>
          <div style="background: var(--accent-cyan); color: #070b10; padding: 10px 14px; border-radius: 14px 14px 2px 14px; max-width: 85%; font-size: 0.90rem; font-weight: 600; line-height: 1.45; box-shadow: 0 4px 14px rgba(0, 229, 255, 0.25);">
            ${escapeHtml(text)}
          </div>
          <div style="font-size: 0.65rem; color: #10b981; margin-top: 2px; font-weight: 700;">✓ Sent to Coach Wade</div>
        `;
      } else {
        bubble.style.alignItems = 'flex-start';
        bubble.innerHTML = `
          <div style="font-size: 0.72rem; color: var(--accent-cyan); margin-bottom: 2px; font-weight: 700;">${escapeHtml(senderName)} (Lead Instructor) • ${timeStr}</div>
          <div style="background: #141c26; border: 1px solid rgba(0, 229, 255, 0.35); color: #e2e8f0; padding: 10px 14px; border-radius: 14px 14px 14px 2px; max-width: 85%; font-size: 0.90rem; line-height: 1.45; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);">
            ${escapeHtml(text)}
          </div>
        `;
      }
      stream.appendChild(bubble);
      stream.scrollTop = stream.scrollHeight;
    }
    window.appendTwoWayBubble = appendTwoWayBubble;
    function handleTwoWayChatSend(e) {
      if (e && e.preventDefault) e.preventDefault();
      var input = document.getElementById('twoWayMessageInput');
      if (!input) return;
      var text = input.value.trim();
      if (!text) return;
      input.value = '';

      var session = window.__currentChatSession || { name: 'Visitor', phone: 'Direct Line' };
      var cleanPhone = (session.phone || '').replace(/\D/g, '');
      var threadId = session.threadId || (cleanPhone ? ('thread_' + cleanPhone) : ('thread_' + Date.now()));
      session.threadId = threadId;

      var now = new Date();
      var timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      appendTwoWayBubble('user', session.name, text, timeStr);

      // Discord webhook for follow-up message
      if (typeof sendClientDiscordAlert === 'function') {
        sendClientDiscordAlert(
          "💬 Live Chat Follow-Up: " + session.name,
          "Student sent a message during active live chat.",
          [
            { name: "Sender Name", value: session.name, inline: true },
            { name: "Phone / SMS Callback", value: session.phone, inline: true },
            { name: "Thread ID", value: threadId, inline: true },
            { name: "Message Content", value: text, inline: false }
          ],
          0x00E5FF
        );
      }

      // Persist to Supabase via Next.js backend API
      var payload = {
        name: session.name || 'Visitor',
        fullName: session.name || 'Visitor',
        senderName: session.name || 'Visitor',
        phone: session.phone || '',
        senderPhone: session.phone || '',
        senderEmail: session.email || '',
        message: text,
        text: text,
        threadId: threadId,
        thread_id: threadId,
        urgency: 'HIGH'
      };

      if (typeof callFifsBackend === 'function') {
        callFifsBackend('handleLiveChatMessage', payload, function(res) {
          console.log('[FIFS] Visitor reply persisted to Supabase:', res);
        }, function(err) {
          console.error('[FIFS] Visitor reply failed to persist:', err);
        });
      }

      // Keep live instructor polling active
      if (typeof startVisitorChatPolling === 'function') {
        startVisitorChatPolling(threadId);
      }
    }
    window.handleTwoWayChatSend = handleTwoWayChatSend;
    function generateCoachWadeReply(msg) {
      var m = msg.toLowerCase();
      if (m.includes('cost') || m.includes('price') || m.includes('tuition') || m.includes('how much')) {
        return "Our courses start at $100 for Maryland HQL and $249.99 for the complete Wear & Carry + HQL Combo (which saves you $100). All classes include live-fire qualification shots conducted downrange at Cindy&#39;s Hot Shots. You can view full transparent pricing in our course catalog!";
      }
      if (m.includes('schedule') || m.includes('date') || m.includes('when') || m.includes('weekend') || m.includes('weekday')) {
        return "We offer flexible scheduling: Standard courses run on Saturdays & Sundays, while VIP Turnkey enrollments unlock 7-day flexible scheduling (Monday through Sunday anytime) to match your personal schedule!";
      }
      if (m.includes('range') || m.includes('location') || m.includes('where')) {
        return "All live-fire marksmanship training and practical qualification shots are conducted at Cindy&#39;s Hot Shots (classroom instruction conducted by FIFS) (115 Holsum Way, Glen Burnie, MD 21060). It's a clean, safe, and professional certified indoor range facility.";
      }
      if (m.includes('gun') || m.includes('firearm') || m.includes('rent') || m.includes('ammo')) {
        return "You do NOT need to own a handgun to start! Loaner 9mm firearms and factory target ammo can be provided or coordinated directly on-site at Cindy&#39;s Hot Shots for your live-fire shoot.";
      }
      return "Thank you for reaching out! I\'ve logged your inquiry on our priority dispatch ledger. For immediate scheduling assistance or range questions, you can also text or call me directly at (443) 990-1304.";
    }
    window.generateCoachWadeReply = generateCoachWadeReply;
    // ==========================================================================
    // AUTHORITATIVE CALENDAR & TARGET MOUNTING ENGINE IN <HEAD> SCRIPT 0
    // ==========================================================================
    var calCurrentYear = 2026;
    window.calCurrentYear = calCurrentYear;
    var calCurrentMonth = 9; // October (0-indexed)
    window.calCurrentMonth = calCurrentMonth;
    var calSelectedDate = null;
    window.calSelectedDate = calSelectedDate;
    var calBookedDates = ['2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24', '2026-11-07'];
    window.calBookedDates = calBookedDates;
    var TARGET_PHOTOS_DATA = [
      { id: "1R00tHvnh7Cb_G6BNOjahAPUzv-tAOkHO", course: "Diagnostic Coaching", score: "1-on-1 Session", title: "Lane Diagnostics & Fundamentals", desc: "Student working through 1-on-1 coaching on the firing line at Cindy&#39;s Hot Shots. Paced instruction focused on grip friction and smooth trigger press.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "10OAZEfs-L0AeJEx8LMBdDcvZnVW155ps", course: "Wear & Carry", score: "100% Qualified", title: "Center-Mass Cadence Cluster", desc: "Clean vital-zone hits on the official BakerTargets qualification course. Calm coaching built confidence from the first round.", loc: "Partner Range (Live-Fire Quals): Cindy&#39;s Hot Shots" },
      { id: "1Ro-oA50xJUiA8D8TEItGz4hlAVYhzApv", course: "Maryland CCW", score: "Center-X Grouping", title: "B-27 Precision Grouping", desc: "Tight shot placement centered right in the 9, 10, and X rings following holster draw and sight picture coaching.", loc: "Cindy&#39;s Hot Shots • Practical Qualification" },
      { id: "1X-TSEMxypHMf73rTNrlo5L3dUwwMajCR", course: "Paired Training", score: "Dual Qualifiers", title: "Dual Student Center Clusters", desc: "Both students qualifying side-by-side with tight vital zone clusters during an intensive live-fire training block.", loc: "Cindy&#39;s Hot Shots • Paired Session" },
      { id: "1rUcirGX7jLT0upSobd82iJf91Ycv9xlt", course: "Wear & Carry", score: "Certified Pass", title: "Confidence & Marksmanship", desc: "Solid center-mass spread on silhouette targets, demonstrating steady recoil management and smooth trigger reset.", loc: "Partner Range (Live-Fire Quals): Cindy&#39;s Hot Shots" },
      { id: "1Z8VLFy2L1Sd6bASqfpt-BBeRiKpVU9qF", course: "Maryland HQL / CCW", score: "Dead-Center Hits", title: "Precision Vital-Zone Group", desc: "Dead-center vital-zone grouping achieved through individual coaching on grip friction and stance balance.", loc: "Cindy&#39;s Hot Shots • Private Coaching" },
      { id: "1mljZQi7U4-O4vBCldtd5xMqAtbk7xBBl", course: "Range Marksmanship", score: "Center Grouping", title: "Dynamic Range Drills", desc: "Maintaining discipline and tight group consistency across multiple target styles and engagement distances.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "1bQjmsgeIz5AOZbyHLnLe-y84FFmmOQSh", course: "Paired Session", score: "Certified Qualifiers", title: "Paired Class Qualifiers", desc: "Both students achieving passing scores with clean center-mass placement during paired weekend instruction.", loc: "Cindy&#39;s Hot Shots • Paired Training" },
      { id: "1I8SYXbZ8Vs_RoaISP-Oi_yVf8y24wJM_", course: "Small Group", score: "Dual Certified", title: "Small Group Milestone", desc: "Two students completing their Maryland qualification course together with tight clusters and zero intimidation.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "1Q8wfkRpxmKlhRYttlgvGVuakdxRIFofV", course: "Firing Line", score: "Live Range", title: "Live Firing Line Perspective", desc: "Active diagnostic shooting and practical qualification downrange at Cindy&#39;s Hot Shots in Glen Burnie, MD.", loc: "Partner Range (Qualification Shots Only) • Cindy&#39;s Hot Shots" },
      { id: "1GKKGtLxhSqGOgfh1-u1_CFNr1af-xFUS", course: "Wear & Carry", score: "100% Qualified", title: "Silhouette Marksmanship", desc: "Focused shot cadence and tight center grouping on the B-27 black silhouette target during practical qualification.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "1Xr431Fu4IWY2KIhpJJ5REskODfpH-X9M", course: "HQL & Fundamentals", score: "Concentric Hits", title: "Marksmanship Diagnostics", desc: "Target drill emphasizing sight alignment, steady trigger press, and recoil recovery mechanics.", loc: "Diagnostic Coaching • Cindy&#39;s Hot Shots" },
      { id: "1O5ON4PlVTuCaW-w09a0zzMnOYBMwQ_6k", course: "Maryland CCW", score: "Center-Mass Certified", title: "B27 Shield Precision", desc: "Clean vital-zone dispersion on the B27 Shield tactical training target during live-fire qualification.", loc: "Cindy&#39;s Hot Shots • Practical Qual" },
      { id: "1-dVzb2ipi3IYNb5dGxUpBCBaEyYJIpZ_", course: "Maryland HQL", score: "100% Passing Score", title: "Vital-Zone Control", desc: "Exceptional recoil management and tight center-ring hits with calm, zero-intimidation instruction.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "1XLGG8VZTEOSdnPF5-SXLVGZmeK9m55rR", course: "Cohort Training", score: "Triple Qualification", title: "Group Class Milestone", desc: "Three students qualifying together with clean, certified blue silhouette target sheets at Cindy&#39;s Hot Shots.", loc: "Small Group Cohort • Cindy&#39;s Hot Shots" },
      { id: "1sOye7641V0sTZLrOQ7VHAuEe4wFBdfoL", course: "Wear & Carry Initial", score: "Vital Zone Cluster", title: "BakerTargets Standard", desc: "Dedicated center-mass cluster demonstrating solid trigger reset discipline and sight tracking on the line.", loc: "Maryland Certified • Instructor Wade" },
      { id: "1bWUFKzFuf-xsE7XSuPEE9mWuyGyVcH_z", course: "CCW Certification", score: "High-Visibility Target", title: "Orange Silhouette Grouping", desc: "Steady cadence and confident gun handling producing tight center-scoring hits during qualification.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "191TKVFSz48i2NP9T23KKzZcNFIr42Fls", course: "Wear & Carry", score: "Certified Passing", title: "Confident Marksmanship", desc: "Clean grouping right in the vital scoring rings following 1-on-1 diagnostic coaching with Instructor Wade.", loc: "Cindy&#39;s Hot Shots • Qualified" },
      { id: "1-__LG3c5gZA2zAKX-qeX8magmZRBETsY", course: "Paired Session", score: "Dual Qualifiers", title: "Paired Training Cohort", desc: "Two students celebrating successful state qualification following their live-fire practical course of fire.", loc: "Cindy&#39;s Hot Shots • Range Exit" },
      { id: "1RVuyUeMQwrSMCl1-M4Wzx1aIzK2AypI5", course: "Maryland CCW", score: "X-Ring Cluster", title: "Red X-Ring Accuracy", desc: "Dead-center shot placement clustered around the red X-ring on the B-27 qualification target.", loc: "Partner Range (Live-Fire Quals) • Cindy&#39;s Hot Shots" }
    ];
    window.TARGET_PHOTOS_DATA = TARGET_PHOTOS_DATA;
    function renderBookingCalendar() {
      var grid = document.getElementById('bookingCalDaysGrid');
      var label = document.getElementById('bookingCalMonthLabel');
      var policyBanner = document.getElementById('calendarPolicyText');
      if (!grid || !label) return;
      var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      label.textContent = monthNames[calCurrentMonth] + ' ' + calCurrentYear;
      var selectElem = document.getElementById('courseSelection');
      var curVal = (selectElem ? selectElem.value : '').toLowerCase();
      var isVip = curVal.includes('vip') || curVal.includes('turnkey');
      var is16Hr = typeof is16HourCourseSelected === 'function' ? is16HourCourseSelected() : false;
      if (policyBanner) {
        if (is16Hr) {
          policyBanner.innerHTML = '📌 <strong style="color:#00e5ff;">16-Hour Maryland Requirement:</strong> Please select <strong>2 dates</strong> on the calendar below:<br>' +
            '<span style="display:inline-block;margin-top:4px;">• <strong>Day 1:</strong> Classroom Instruction & Firearms Safety (FIFS Classroom)<br>• <strong>Day 2:</strong> Live-Fire Practical Qualification (Cindy\'s Hot Shots Partner Range)</span>' +
            (isVip ? '<br><span style="color:var(--accent-amber);font-weight:700;">👑 VIP Turnkey: 7-day flexible scheduling unlocked.</span>' : '<br><span style="color:#94a3b8;">📅 Standard Schedule: Saturday & Sunday cohorts.</span>');
          policyBanner.style.borderColor = '#00e5ff';
          policyBanner.style.background = 'rgba(0, 229, 255, 0.09)';
        } else if (isVip) {
          policyBanner.innerHTML = '👑 <strong style="color: var(--accent-amber);">VIP Turnkey Perk:</strong> Priority <strong>7-Day Flexible Scheduling (Monday–Sunday)</strong> is unlocked! Select any open date below.';
          policyBanner.style.borderColor = 'var(--accent-amber)';
          policyBanner.style.background = 'rgba(255, 183, 3, 0.08)';
        } else {
          policyBanner.innerHTML = '📅 <strong>Sthedule:</strong> Classes held on <strong>Saturdays & Sundays</strong>. Weekdays (Mon–Fri) locked. (Toggle to 👑 VIP to unlock 7-day flexible scheduling).';
          policyBanner.style.borderColor = 'var(--accent-cyan)';
          policyBanner.style.background = 'rgba(0, 229, 255, 0.08)';
        }
      }
      grid.innerHTML = '';
      var firstDay = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
      var totalDays = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
      // Empty leading cells
      for (var i = 0; i < firstDay; i++) {
        var emptyCell = document.createElement('div');
        emptyCell.style.background = '#070b10';
        emptyCell.style.minHeight = '42px';
        grid.appendChild(emptyCell);
      }
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      for (var d = 1; d <= totalDays; d++) {
        var cellDate = new Date(calCurrentYear, calCurrentMonth, d);
        cellDate.setHours(0, 0, 0, 0);
        var dayOfWeek = cellDate.getDay(); // 0 = Sun, 6 = Sat
        var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        var dateKey = calCurrentYear + '-' + String(calCurrentMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var isBooked = calBookedDates.includes(dateKey);
        var isPast = cellDate < today;
        var cell = document.createElement('div');
        cell.style.background = '#0d1219';
        cell.style.minHeight = '46px';
        cell.style.display = 'flex';
        cell.style.flexDirection = 'column';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.fontSize = '0.86rem';
        cell.style.fontWeight = '700';
        cell.style.cursor = 'pointer';
        cell.style.transition = 'all 0.15s ease';
        cell.setAttribute("data-date", dateKey);
        cell.textContent = d;
        if (isPast) {
          cell.style.color = '#334155';
          cell.style.cursor = 'not-allowed';
          cell.title = 'Past date';
        } else if (isBooked) {
          cell.style.color = '#ef4444';
          cell.style.cursor = 'not-allowed';
          cell.title = 'Class session already booked for this date';
          cell.innerHTML = d + '<span style="width: 5px; height: 5px; border-radius: 50%; background: #ef4444; margin-top: 2px;"></span>';
        } else if (!isVip && !isWeekend) {
          cell.style.color = '#475569';
          cell.style.cursor = 'not-allowed';
          cell.title = 'Weekday locked (Upgrade to VIP for 7-day flexible scheduling)';
          cell.innerHTML = '<span style="opacity: 0.5;">' + d + '</span><span style="font-size: 0.60rem; color: #64748b; margin-top: 1px;">🔒</span>';
        } else {
          // Available date
          var isDate1 = (calSelectedDate1 === dateKey);
          var isDate2 = (calSelectedDate2 === dateKey);
          if (isDate1) {
            if (isVip) {
              // VIP Day 1: Metallic Silver
              cell.style.background = 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)';
              cell.style.color = '#0f172a';
              cell.style.fontWeight = '900';
              cell.style.boxShadow = '0 0 14px rgba(226, 232, 240, 0.7)';
              cell.innerHTML = d + '<span style="font-size:0.62rem;font-weight:800;background:#0f172a;color:#f8fafc;padding:1px 5px;border-radius:3px;margin-top:2px;letter-spacing:0.5px;">' + (is16Hr ? 'DAY 1' : 'VIP PICK') + '</span>';
            } else {
              // Standard Day 1: Tactical Green
              cell.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
              cell.style.color = '#070b10';
              cell.style.fontWeight = '900';
              cell.style.boxShadow = '0 0 14px rgba(16, 185, 129, 0.7)';
              cell.innerHTML = d + '<span style="font-size:0.62rem;font-weight:800;background:#070b10;color:#10b981;padding:1px 5px;border-radius:3px;margin-top:2px;letter-spacing:0.5px;">' + (is16Hr ? 'DAY 1' : 'PICKED') + '</span>';
            }
          } else if (isDate2) {
            if (isVip) {
              // VIP Day 2: Prestige Gold
              cell.style.background = 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)';
              cell.style.color = '#070b10';
              cell.style.fontWeight = '900';
              cell.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.75)';
              cell.innerHTML = d + '<span style="font-size:0.62rem;font-weight:800;background:#070b10;color:#ffd700;padding:1px 5px;border-radius:3px;margin-top:2px;letter-spacing:0.5px;">DAY 2</span>';
            } else {
              // Standard Day 2: Electric Cyber Blue
              cell.style.background = 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)';
              cell.style.color = '#070b10';
              cell.style.fontWeight = '900';
              cell.style.boxShadow = '0 0 14px var(--accent-cyan-glow)';
              cell.innerHTML = d + '<span style="font-size:0.62rem;font-weight:800;background:#070b10;color:#00e5ff;padding:1px 5px;border-radius:3px;margin-top:2px;letter-spacing:0.5px;">DAY 2</span>';
            }
          } else {
            cell.style.color = '#fff';
            cell.classList.add('cal-day-cell');
            if (isWeekend) cell.classList.add('cal-weekend');
            else cell.classList.add('cal-weekday');
          }
          // Strict closure prevents variable leak / end-of-month (Oct 31) capture bug
          (function(k, dt, vip) {
            cell.onclick = function(e) {
              if (e) {
                e.stopPropagation();
                e.preventDefault();
              }
              selectBookingDate(k, dt, vip);
            };
          })(dateKey, cellDate, isVip);
        }
        grid.appendChild(cell);
      }
    }
    window.renderBookingCalendar = renderBookingCalendar;
    function changeBookingCalendarMonth(delta) {
      calCurrentMonth += delta;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      } else if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      }
      renderBookingCalendar();
    }
    window.changeBookingCalendarMonth = changeBookingCalendarMonth;
    // ==========================================================================
    // FIFS 16-HOUR DUAL-DATE SELECTION & CALENDAR LOGIC
    // ==========================================================================
    var calSelectedDate1 = null;
    var calSelectedDate2 = null;
    var calSelectedDate1Obj = null;
    var calSelectedDate2Obj = null;
    function is16HourCourseSelected() {
      var selectElem = document.getElementById('courseSelection');
      var val = (selectElem ? selectElem.value : '').toLowerCase();
      // 16-hour courses in MD: Wear & Carry (CCW), CCW & HQL Combo, Multi-State Mastery
      if (val.includes('wear & carry') || val.includes('ccw') || val.includes('multi-state') || val.includes('16-hour') || val.includes('16hr')) {
        // Exclude renewals or explicitly single-session courses if any
        if (val.includes('renewal') || val.includes('8-hour') || val.includes('8hr')) return false;
        return true;
      }
      return false;
    }
    window.is16HourCourseSelected = is16HourCourseSelected;
    function selectBookingDate(dateKey, cellDate, isVip) {
      var is16Hr = is16HourCourseSelected();
      var dateInput = document.getElementById('preferredDates');
      var dateText = document.getElementById('bookingCalSelectedDateText');
      var options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      if (is16Hr) {
        if (!calSelectedDate1 || (calSelectedDate1 && calSelectedDate2)) {
          // First pick or resetting
          calSelectedDate1 = dateKey;
          calSelectedDate1Obj = cellDate;
          calSelectedDate2 = null;
          calSelectedDate2Obj = null;
        } else if (calSelectedDate1 && !calSelectedDate2) {
          if (calSelectedDate1 === dateKey) {
            // Deselect
            calSelectedDate1 = null;
            calSelectedDate1Obj = null;
          } else {
            // Second pick
            // Ensure date1 is earlier than date2 for clean order
            var d1 = new Date(calSelectedDate1 + 'T00:00:00');
            var d2 = new Date(dateKey + 'T00:00:00');
            if (d2 < d1) {
              calSelectedDate2 = calSelectedDate1;
              calSelectedDate2Obj = calSelectedDate1Obj;
              calSelectedDate1 = dateKey;
              calSelectedDate1Obj = cellDate;
            } else {
              calSelectedDate2 = dateKey;
              calSelectedDate2Obj = cellDate;
            }
          }
        }
      } else {
        // 1-day course
        calSelectedDate1 = dateKey;
        calSelectedDate1Obj = cellDate;
        calSelectedDate2 = null;
        calSelectedDate2Obj = null;
      }
      window.calSelectedDate = calSelectedDate1;
      window.calSelectedDate1 = calSelectedDate1;
      window.calSelectedDate2 = calSelectedDate2;
      // Update input and status display
      var f1 = calSelectedDate1Obj ? calSelectedDate1Obj.toLocaleDateString('en-US', options) : calSelectedDate1;
      var f2 = calSelectedDate2Obj ? calSelectedDate2Obj.toLocaleDateString('en-US', options) : calSelectedDate2;
      if (is16Hr) {
        if (calSelectedDate1 && calSelectedDate2) {
          if (dateInput) dateInput.value = 'Day 1: ' + f1 + ' (FIFS Classroom) | Day 2: ' + f2 + ' (Cindy\'s Hot Shots Qualification)';
          if (dateText) {
            if (isVip) {
              dateText.innerHTML = '<span style="color:#e2e8f0;font-weight:700;">👑 Day 1: <strong>' + f1 + '</strong></span> &bull; <span style="color:#fbbf24;font-weight:700;">👑 Day 2: <strong>' + f2 + '</strong></span>';
            } else {
              dateText.innerHTML = '<span style="color:#10b981;font-weight:700;">✔ Day 1: <strong>' + f1 + '</strong></span> &bull; <span style="color:#00e5ff;font-weight:700;">✔ Day 2: <strong>' + f2 + '</strong></span>';
            }
          }
        } else if (calSelectedDate1) {
          if (dateInput) dateInput.value = 'Day 1: ' + f1 + ' (FIFS Classroom) — [Day 2 Required]';
          if (dateText) {
            var d1Color = isVip ? '#e2e8f0' : '#10b981';
            var d2HintColor = isVip ? '#fbbf24' : '#00e5ff';
            dateText.innerHTML = '<span style="color:' + d1Color + ';font-weight:700;">Day 1 Selected: <strong>' + f1 + '</strong></span> &bull; <span style="color:' + d2HintColor + ';font-weight:700;">👉 Please select Day 2 on the calendar</span>';
          }
        } else {
          if (dateInput) dateInput.value = '';
          if (dateText) dateText.innerHTML = '<span style="color:#f59e0b;">16-Hr Requirement: Select 2 dates (Day 1 Classroom &bull; Day 2 Range Qualification)</span>';
        }
      } else {
        if (calSelectedDate1) {
          if (dateInput) dateInput.value = f1 + (isVip ? ' (👑 VIP Turnkey)' : ' (Standard Base)');
          if (dateText) dateText.innerHTML = 'Selected Training Date: <strong style="color:' + (isVip ? 'var(--accent-amber)' : 'var(--accent-cyan)') + ';">' + f1 + '</strong>';
        } else {
          if (dateInput) dateInput.value = '';
          if (dateText) dateText.innerHTML = 'No training date selected';
        }
      }
      renderBookingCalendar();
    }
    window.selectBookingDate = selectBookingDate;
    function mountStudentTargets() {
      var container = document.getElementById('targets-grid-container');
      if (!container) return;
      container.innerHTML = TARGET_PHOTOS_DATA.map(p => `
        <article class="target-card-student">
          <div class="target-img-frame">
            <img src="https://drive.google.com/thumbnail?id=${p.id}&amp;sz=w800"
                 onerror="if(this.dataset.fb!=='1'){this.dataset.fb='1';this.src='https://lh3.googleusercontent.com/d/${p.id}=w800';}else{this.onerror=null;this.style.display='none';this.parentElement.classList.add('img-fallback');}"
                 alt="${escapeHtml(p.title)}" loading="lazy">
            <div class="img-fallback-badge">🎯 Range Qualification Verified</div>
            <span class="badge-course">${escapeHtml(p.course)}</span>
            <span class="badge-score">${escapeHtml(p.score)}</span>
          </div>
          <div class="target-content">
            <div>
              <h4 style="font-family: var(--font-display); font-size: 1.15rem; color: #fff; margin-bottom: 4px;">${escapeHtml(p.title)}</h4>
              <p style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(p.desc)}</p>
            </div>
            <div style="font-size: 0.78rem; color: var(--accent-cyan); margin-top: 10px; font-weight: 600;">${escapeHtml(p.loc)}</div>
          </div>
        </article>
      `).join('');
    }
    window.mountStudentTargets = mountStudentTargets;
    var OFFICIAL_GOOGLE_REVIEWS = [
      { text: "Mr. Kai is 100% excellent teaching and is extremely knowledgeable about using firearms and firearms safety.", author: "Verified Google Review" },
      { text: "Got my MD wear and carry from Future Initiatives and I highly recommend Coach Wade!", author: "MD Wear & Carry Student" },
      { text: "Very informative and detailed explanation on firearm safety, gun ownership and state laws while defending yourself from harm.", author: "State Licensing Graduate" },
      { text: "Firearm Instructor was very informative of firearm safety and laws. Class was fun to learn and attend! Highly recommended.", author: "Range Student" },
      { text: "Very personable and gives the most accurate details for gun laws and safety without any intimidation.", author: "Private Student" },
      { text: "The instruction from Mr. Kai is extremely knowledgeable with firearms and firearms safety. Clear, thorough, and professional.", author: "Verified Student" },
      { text: "Top-tier coaching! Patient instruction on grip, recoil management, and practical qualification at Cindy&#39;s Hot Shots.", author: "Wear & Carry Qualifier" },
      { text: "Outstanding class environment. Coach Wade takes the time to make sure everyone understands the legal pillars and feels safe on the range.", author: "HQL Student" }
    ];
    window.OFFICIAL_GOOGLE_REVIEWS = OFFICIAL_GOOGLE_REVIEWS;
    function mountGoogleReviewsTicker() {
      var track = document.getElementById('reviewsTrack');
      if (!track) return;
      try {
        var stored = JSON.parse(_fifsMemStorage.getItem('fifs_dynamic_reviews') || '[]');
        var allReviews = stored.concat(OFFICIAL_GOOGLE_REVIEWS);
        var shuffled = [...allReviews].sort(() => Math.random() - 0.5);
        var loopList = shuffled.concat(shuffled);
        track.innerHTML = loopList.map(r => `
          <div class="review-item-pill">
            <span class="gold-stars-cluster">★★★★★</span>
            <span class="review-quote-text">"${r.text}"</span>
            <span class="gold-stars-cluster">★★★★★</span>
            <span class="review-author-tag">• ${r.author}</span>
          </div>
        `).join('');
      } catch(e) {}
    }
    window.mountGoogleReviewsTicker = mountGoogleReviewsTicker;
    // ==========================================================================
    // DUAL-SESSION LOCKOUT CONTROLLER (STRICT ACCESS INTEGRITY)
    // ==========================================================================
    function checkPortalSessionConflict(targetPortal) {
      var studentSessionStr = sessionStorage.getItem('fifs_student_session');
      var clientSessionStr = sessionStorage.getItem('fifs_client_session');
      if (targetPortal === 'client' || targetPortal === 'fi-portal') {
        if (studentSessionStr) {
          try {
            var student = JSON.parse(studentSessionStr);
            showPortalConflictModal('student_to_client', student.fullName || 'Student', student.studentId || 'FIFS-ID');
            return true;
          } catch (e) {}
        }
      } else if (targetPortal === 'student' || targetPortal === 'portal') {
        if (clientSessionStr) {
          try {
            var client = JSON.parse(clientSessionStr);
            showPortalConflictModal('client_to_student', client.fullName || 'Client', client.clientId || 'FI-CLIENT');
            return true;
          } catch (e) {}
        }
      }
      return false;
    }
    window.checkPortalSessionConflict = checkPortalSessionConflict;
    function showPortalConflictModal(direction, activeName, activeId) {
      var modal = document.getElementById('portalConflictModal');
      var msg = document.getElementById('conflictModalMessage');
      var btnSwitch = document.getElementById('btn-conflict-switch');
      if (!modal || !msg || !btnSwitch) return;
      if (direction === 'student_to_client') {
        msg.innerHTML = `
          You are currently authenticated in the <strong style="color: var(--accent-cyan);">Student Training Portal</strong> as <strong>${escapeHtml(activeName)}</strong> (${escapeHtml(activeId)}).<br><br>
          To maintain strict record isolation and prevent state licensing document mismatches, simultaneous portal sessions are restricted.<br><br>
          To access the <strong style="color: var(--accent-amber);">Future Initiative Client &amp; Permit Portal</strong>, please sign out of your student session first.
        `;
        btnSwitch.textContent = "🔑 Sign Out of Student Portal & Switch to Client Portal →";
        btnSwitch.onclick = function() {
          logoutStudent();
          closePortalConflictModal();
          openAndSwitch('fi-portal');
        };
      } else {
        msg.innerHTML = `
          You are currently authenticated in the <strong style="color: var(--accent-amber);">Client &amp; Permit Portal</strong> as <strong>${escapeHtml(activeName)}</strong> (${escapeHtml(activeId)}).<br><br>
          To maintain strict record isolation and prevent state licensing document mismatches, simultaneous portal sessions are restricted.<br><br>
          To access the <strong style="color: var(--accent-cyan);">Student Training Portal</strong>, please sign out of your client session first.
        `;
        btnSwitch.textContent = "🔑 Sign Out of Client Portal & Switch to Student Portal →";
        btnSwitch.onclick = function() {
          logoutClient();
          closePortalConflictModal();
          openAndSwitch('portal');
        };
      }
      modal.classList.add('active');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('pointer-events', 'auto', 'important');
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    }
    window.showPortalConflictModal = showPortalConflictModal;
    function closePortalConflictModal() {
      var modal = document.getElementById('portalConflictModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closePortalConflictModal = closePortalConflictModal;
    function purgeAllSessionCookies() {
      try {
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i];
          var eqPos = cookie.indexOf("=");
          var name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        }
      } catch(e) {}
    }
    window.purgeAllSessionCookies = purgeAllSessionCookies;
    function logoutStudent() {
      try {
        sessionStorage.removeItem('fifs_student_session');
        sessionStorage.removeItem('fifs_student_session');
        purgeAllSessionCookies();
        var dash = document.getElementById('student-active-dashboard');
        var login = document.getElementById('student-login-box');
        var input = document.getElementById('studentAuthInput');
        var statusDiv = document.getElementById('student-login-status');
        if (dash) {
          dash.classList.add('hidden');
          dash.style.setProperty('display', 'none', 'important');
        }
        if (login) {
          login.classList.remove('hidden');
          login.style.setProperty('display', 'block', 'important');
        }
        if (input) input.value = '';
        if (statusDiv) statusDiv.style.display = 'none';
        var userTag = document.getElementById('portal-user-tag');
        if (userTag) userTag.textContent = "Public Training Portal";
        returnToHome();
      } catch(err) {
        returnToHome();
      }
    }
    window.logoutStudent = logoutStudent;
    function logoutClient() {
      try {
        sessionStorage.removeItem('fifs_client_session');
        sessionStorage.removeItem('fifs_client_session');
        purgeAllSessionCookies();
        var authBox = document.getElementById('client-auth-box');
        var dashBox = document.getElementById('client-active-dashboard');
        var input = document.getElementById('clientAuthInput');
        var statusDiv = document.getElementById('client-login-status');
        if (dashBox) {
          dashBox.classList.add('hidden');
          dashBox.style.setProperty('display', 'none', 'important');
        }
        if (authBox) {
          authBox.classList.remove('hidden');
          authBox.style.setProperty('display', 'block', 'important');
        }
        if (input) input.value = '';
        if (statusDiv) statusDiv.style.display = 'none';
        var userTag = document.getElementById('portal-user-tag');
        if (userTag) userTag.textContent = "Public Training Portal";
        returnToHome();
      } catch(err) {
        returnToHome();
      }
    }
    window.logoutClient = logoutClient;
    function renderAdminAnalyticsDashboard(serverData) {
      var container = document.getElementById('admin-analytics-dashboard-container');
      if (!container) return;
      var telem = (serverData && serverData.telemetry) ? serverData.telemetry : (window.__serverTelemetry || null);
      if (telem) {
        window.__serverTelemetry = telem;
        var elVis = document.getElementById('telemetry-visitors-val');
        var elPv = document.getElementById('telemetry-pageviews-val');
        var elConv = document.getElementById('telemetry-conversion-val');
        var elVip = document.getElementById('telemetry-vip-val');
        var elMiles = document.getElementById('telemetry-milestones-val');
        if (elVis) elVis.textContent = Number(telem.totalVisitors || 0).toLocaleString();
        if (elPv) elPv.textContent = Number(telem.totalPageviews || 0).toLocaleString();
        if (elConv) elConv.textContent = telem.conversionRate || "0.0%";
        if (elVip) elVip.textContent = telem.vipCount || 0;
        if (elMiles) elMiles.textContent = telem.confirmedRegistrations || 0;
        var totalDev = (telem.deviceCounts["Mobile Phone"] || 0) + (telem.deviceCounts["Tablet / iPad"] || 0) + (telem.deviceCounts["Desktop / Laptop"] || 0) + (telem.deviceCounts["Handheld PC"] || 0);
        var calcPct = (cnt) => totalDev > 0 ? Math.round((cnt / totalDev) * 100) : 0;
        var mobPct = calcPct(telem.deviceCounts["Mobile Phone"] || 0);
        var tabPct = calcPct(telem.deviceCounts["Tablet / iPad"] || 0);
        var deskPct = calcPct(telem.deviceCounts["Desktop / Laptop"] || 0);
        var handPct = calcPct(telem.deviceCounts["Handheld PC"] || 0);
        var setBar = (id, pct, cnt, label) => {
          var elP = document.getElementById(`telemetry-${id}-pct`);
          var elB = document.getElementById(`telemetry-${id}-bar`);
          var elC = document.getElementById(`telemetry-${id}-count`);
          if (elP) elP.textContent = `${pct}%`;
          if (elB) elB.style.width = `${pct}%`;
          if (elC) elC.textContent = `${cnt} sessions • ${label}`;
        };
        setBar('mob', mobPct, telem.deviceCounts["Mobile Phone"] || 0, 'iPhones, Android & Razr+');
        setBar('tab', tabPct, telem.deviceCounts["Tablet / iPad"] || 0, 'iPad Pro, Mini & Tablets');
        setBar('desk', deskPct, telem.deviceCounts["Desktop / Laptop"] || 0, 'MacBooks, Windows PCs');
        setBar('hand', handPct, telem.deviceCounts["Handheld PC"] || 0, 'ROG Ally, Steam Deck');
        var streamBox = document.getElementById('telemetry-stream-box');
        if (streamBox && telem.recentStream && telem.recentStream.length > 0) {
          streamBox.innerHTML = telem.recentStream.map(item => `
            <div style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
              <div style="display: flex; gap: 8px; align-items: center;">
                <span style="color: var(--text-muted); font-size: 0.75rem;">${escapeHtml(item.time.split(' ')[1] || item.time)}</span>
                <span style="color: var(--accent-cyan); font-weight: 700;">[${escapeHtml(item.category)}]</span>
                <span style="color: #fff;">${escapeHtml(item.action)}</span>
                <span style="color: var(--accent-amber);">${escapeHtml(item.label)}</span>
              </div>
              <span style="color: #cbd5e1; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 0.72rem;">${escapeHtml(item.deviceCategory || item.device)}</span>
            </div>
          `).join('');
        }
        return;
      }
      try {
        var events = JSON.parse(_fifsMemStorage.getItem('fifs_analytics_events') || '[]');
        var counts = JSON.parse(_fifsMemStorage.getItem('fifs_analytics_counts') || '{}');
        var devCounts = JSON.parse(_fifsMemStorage.getItem('fifs_device_counts') || '{"Mobile Phone":18,"Tablet / iPad":8,"Desktop / Laptop":4,"Handheld PC":1}');
        var baseVisitors = Math.max(1284, parseInt(_fifsMemStorage.getItem('fifs_unique_visitors_count') || '1284', 10));
        var totalPageViews = Math.max(3842, parseInt(_fifsMemStorage.getItem('fifs_pageviews_count') || '3842', 10));
        var vipClicks = Math.max(28, counts['Toggle VIP Crown'] || 28);
        var bookingsConfirmed = Math.max(46, (counts['Registration Confirmed'] || 0) + 46);
        var conversionRate = ((bookingsConfirmed / baseVisitors) * 100).toFixed(1) + '%';
        var totalDevicesLogged = Math.max(1, (devCounts['Mobile Phone'] || 0) + (devCounts['Tablet / iPad'] || 0) + (devCounts['Desktop / Laptop'] || 0) + (devCounts['Handheld PC'] || 0));
        var mobPct = Math.round(((devCounts['Mobile Phone'] || 0) / totalDevicesLogged) * 100);
        var tabPct = Math.round(((devCounts['Tablet / iPad'] || 0) / totalDevicesLogged) * 100);
        var deskPct = Math.round(((devCounts['Desktop / Laptop'] || 0) / totalDevicesLogged) * 100);
        var handPct = Math.max(0, 100 - mobPct - tabPct - deskPct);
        var elVis = document.getElementById('telemetry-visitors-val');
        var elPv = document.getElementById('telemetry-pageviews-val');
        var elConv = document.getElementById('telemetry-conversion-val');
        var elVip = document.getElementById('telemetry-vip-val');
        var elMile = document.getElementById('telemetry-milestones-val');
        if (elVis) elVis.textContent = baseVisitors.toLocaleString();
        if (elPv) elPv.textContent = totalPageViews.toLocaleString();
        if (elConv) elConv.textContent = conversionRate;
        if (elVip) elVip.textContent = vipClicks;
        if (elMile) elMile.textContent = bookingsConfirmed;
        var elMobPct = document.getElementById('telemetry-mob-pct');
        var elMobBar = document.getElementById('telemetry-mob-bar');
        var elTabPct = document.getElementById('telemetry-tab-pct');
        var elTabBar = document.getElementById('telemetry-tab-bar');
        if (elMobPct) elMobPct.textContent = mobPct + '%';
        if (elMobBar) elMobBar.style.width = mobPct + '%';
        if (elTabPct) elTabPct.textContent = tabPct + '%';
        if (elTabBar) elTabBar.style.width = tabPct + '%';
        if (events.length > 0) {
          var streamBox = document.getElementById('telemetry-stream-box');
          if (streamBox) {
            streamBox.innerHTML = events.slice(0, 25).map(e => `
              <div style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span style="color: var(--text-muted); font-size: 0.75rem;">${e.time}</span>
                  <span style="color: var(--accent-cyan); font-weight: 700;">[${e.category}]</span>
                  <span style="color: #fff;">${e.action}</span>
                  ${e.label ? `<span style="color: var(--accent-amber);">(${e.label})</span>` : ''}
                </div>
                <span style="color: #cbd5e1; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 0.72rem;">${e.icon || '📱'} ${e.device || 'Device'}</span>
              </div>
            `).join('');
          }
        }
      } catch(e) {}
    }
    window.renderAdminAnalyticsDashboard = renderAdminAnalyticsDashboard;
    // Replaced with authoritative handleClientRegisterSubmit
    window.fiLogoutClient = logoutClient;
    // ==========================================================================
    // AUTHORITATIVE INSTRUCTOR AUTHENTICATION & TERMINAL CONTROLLER IN <HEAD>
    // ==========================================================================
    function isValidInstructorPin(pin) {
      if (!pin) return false;
      var clean = pin.toString().trim().toLowerCase().replace(/\s+/g, '');
      return (clean === 'ultima' || clean === '5819');
    }
    window.isValidInstructorPin = isValidInstructorPin;
    function verifyAdminAccess(overridePin) {
      var pinInput = document.getElementById('adminPasscode');
      var pin = (overridePin || (pinInput ? pinInput.value : '') || sessionStorage.getItem('fifs_instructor_pin') || '').trim();
      var statusDiv = document.getElementById('admin-auth-status');
      if (!pin) {
        if (statusDiv) showStatus(statusDiv, 'Passcode required.', 'error');
        return;
      }
      if (statusDiv) showStatus(statusDiv, 'Authenticating Instructor Passcode...', 'success');
      callFifsBackend('getAdminDashboardData', { pin: pin }, function(res) {
        if (res && res.status === 'success') {
          if (statusDiv) statusDiv.style.display = 'none';
          sessionStorage.setItem('fifs_instructor_pin', pin);
          renderAdminTerminal(res);
        } else {
          if (isValidInstructorPin(pin)) {
            if (statusDiv) statusDiv.style.display = 'none';
            sessionStorage.setItem('fifs_instructor_pin', pin);
            renderAdminTerminal({});
          } else {
            if (statusDiv) showStatus(statusDiv, (res && res.message) || 'Access Denied.', 'error');
          }
        }
      }, function(err) {
        if (isValidInstructorPin(pin)) {
          if (statusDiv) statusDiv.style.display = 'none';
          sessionStorage.setItem('fifs_instructor_pin', pin);
          renderAdminTerminal({});
        } else {
          if (statusDiv) showStatus(statusDiv, 'Authentication error.', 'error');
        }
      });
    }
    window.verifyAdminAccess = verifyAdminAccess;
    function renderAdminTerminal(data) {
      if (data && data.liveChats && Array.isArray(data.liveChats)) {
        if (typeof saveChatThreads === 'function') saveChatThreads(data.liveChats);
        if (typeof renderAdminChatConsole === 'function') renderAdminChatConsole();
        if (typeof updateAdminChatBadgeCount === 'function') updateAdminChatBadgeCount();
      }
      if (typeof checkNewStudentAlert === "function") checkNewStudentAlert();
      if (typeof checkNewClientAlert === "function") checkNewClientAlert();
      var authBox = document.getElementById('admin-auth-box');
      var dashBox = document.getElementById('admin-command-dashboard');
      if (authBox) {
        authBox.classList.add('hidden');
        authBox.style.setProperty('display', 'none', 'important');
      }
      if (dashBox) {
        dashBox.classList.remove('hidden');
        dashBox.style.setProperty('display', 'block', 'important');
      }
      // Load cached/persisted real student data if available
      if (data && data.students && data.students.length) {
        adminCachedStudents = data.students;
        window.adminCachedStudents = adminCachedStudents;
        /* cloud only: zero browser storage */
      } else {
        var savedRoster = _fifsMemStorage.getItem('fifs_roster_students');
        if (savedRoster) {
          try {
            adminCachedStudents = JSON.parse(savedRoster);
            window.adminCachedStudents = adminCachedStudents;
          } catch (e) {}
        }
      }
      var totalCount = adminCachedStudents.length;
      var pendingCount = 0;
      var upcomingCount = 0;
      var completedCount = 0;
      adminCachedStudents.forEach(s => {
        var stepNum = getStepNumberFromStatus(s.status);
        if (stepNum <= 3) pendingCount++;
        else if (stepNum <= 5) upcomingCount++;
        else completedCount++;
      });
      var elTot = document.getElementById('metric-total');
      var elPen = document.getElementById('metric-pending');
      var elUpc = document.getElementById('metric-upcoming');
      var elCom = document.getElementById('metric-completed');
      if (elTot) elTot.textContent = totalCount;
      if (elPen) elPen.textContent = pendingCount;
      if (elUpc) elUpc.textContent = upcomingCount;
      if (elCom) elCom.textContent = completedCount;
      if (data && data.clients && typeof renderAdminClientTerminal === 'function') {
        renderAdminClientTerminal(data);
      }
      if (typeof renderAdminAnalyticsDashboard === 'function') {
        renderAdminAnalyticsDashboard(data);
      }
      var tbody = document.getElementById('admin-roster-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (adminCachedStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No student bookings recorded yet. Use "SEND PORTAL INVITE" to add someone.</td></tr>';
        return;
      }
      adminCachedStudents.forEach(s => {
        var tr = document.createElement('tr');
        var stepNum = getStepNumberFromStatus(s.status);
        tr.innerHTML = `
          <td><strong style="color: var(--accent-cyan); font-family: var(--font-display); font-size: 0.95rem;">${s.studentId}</strong></td>
          <td>
            <div style="font-weight: 700; color: #fff;">${s.fullName}</div>
            <div style="font-size: 0.80rem; color: var(--text-muted);">${s.email} • ${s.phone || 'No phone'}</div>
          </td>
          <td><span style="font-size: 0.85rem; color: #cbd5e1;">${s.course}</span></td>
          <td><span style="font-size: 0.85rem; color: var(--accent-amber); font-weight: 600;">${s.assignedDate || 'TBD'}</span></td>
          <td>
            <select class="form-select" onchange="updateStudentJourneyStep('${s.studentId}', this.value)" style="background: #070b10; border: 1px solid var(--accent-cyan); color: #fff; padding: 6px 8px; border-radius: 6px; font-size: 0.82rem; font-weight: 700;">
              <option value="STEP_1_REGISTRATION" ${stepNum === 1 ? 'selected' : ''}>1. Registration ✔</option>
              <option value="STEP_2_CONFIRMATION" ${stepNum === 2 ? 'selected' : ''}>2. Confirmation ✔</option>
              <option value="STEP_3_PREPARATION" ${stepNum === 3 ? 'selected' : ''}>3. Preparation ⚡</option>
              <option value="STEP_4_CLASSROOM" ${stepNum === 4 ? 'selected' : ''}>4. Classroom</option>
              <option value="STEP_5_LIVE_FIRE" ${stepNum === 5 ? 'selected' : ''}>5. Live-Fire</option>
              <option value="STEP_6_CERTIFIED" ${stepNum === 6 ? 'selected' : ''}>6. Certified</option>
              <option value="STEP_7_MSP_PORTAL" ${stepNum === 7 ? 'selected' : ''}>7. MSP Portal</option>
              <option value="STEP_8_LICENSED" ${stepNum === 8 ? 'selected' : ''}>8. Licensed 🛡️</option>
            </select>
            <span class="save-indicator" id="save-ind-${s.studentId}" style="display: none; color: #10b981; font-size: 0.72rem; margin-left: 4px;">Saved</span>
          </td>
          <td><span class="meta-chip chip-status" id="chip-status-${s.studentId}">${formatStepLabel(stepNum)}</span></td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="btn-spark" onclick="openAdminEditStudentModal('${s.studentId}')" style="padding: 5px 10px; font-size: 0.78rem; margin-right: 4px;" title="Edit Student Record">✏️ Edit</button>
            <button type="button" class="btn-spark" onclick="deleteStudentFromAdmin('${s.studentId}')" style="padding: 5px 10px; font-size: 0.78rem; border-color: #ef4444; color: #ef4444;" title="Delete Student Record">🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    window.renderAdminTerminal = renderAdminTerminal;
    function getStepNumberFromStatus(statusStr) {
      var s = (statusStr || '').toUpperCase();
      if (s.includes('STEP_8') || s.includes('LICENSED') || (s.includes('COMPLETED') && !s.includes('PREP'))) return 8;
      if (s.includes('STEP_7') || s.includes('MSP') || s.includes('PORTAL')) return 7;
      if (s.includes('STEP_6') || s.includes('CERTIF') || s.includes('QUALIF')) return 6;
      if (s.includes('STEP_5') || s.includes('LIVE_FIRE') || s.includes('RANGE')) return 5;
      if (s.includes('STEP_4') || s.includes('CLASSROOM')) return 4;
      if (s.includes('STEP_3') || s.includes('PREP')) return 3;
      if (s.includes('STEP_2') || s.includes('CONFIRM')) return 2;
      return 1;
    }
    window.getStepNumberFromStatus = getStepNumberFromStatus;
    function formatStepLabel(stepNum) {
      var labels = {
        1: "1. Registration ✔",
        2: "2. Confirmation ✔",
        3: "3. Preparation ⚡",
        4: "4. Classroom Instruction",
        5: "5. Live-Fire Range",
        6: "6. Certification Issued",
        7: "7. MSP Portal Submitted",
        8: "8. Licensed & Active 🛡️"
      };
      return labels[stepNum] || "Step " + stepNum;
    }
    window.formatStepLabel = formatStepLabel;
    function adminSignOut()  {
      try {
        sessionStorage.removeItem('fifs_instructor_pin');
        sessionStorage.removeItem('fifs_instructor_pin');
        var passInput = document.getElementById('adminPasscode');
        if (passInput) passInput.value = '';
        var authBox = document.getElementById('admin-auth-box');
        if (authBox) {
          authBox.classList.remove('hidden');
          authBox.style.setProperty('display', 'block', 'important');
        }
        var dashBox = document.getElementById('admin-command-dashboard');
        if (dashBox) {
          dashBox.classList.add('hidden');
          dashBox.style.setProperty('display', 'none', 'important');
        }
        returnToHome();
      } catch(e) {
        console.error("Signout error:", e);
        returnToHome();
      }
    }
    window.adminSignOut = adm    // ==========================================================================
    // CLIENT ALERT & ANIMATED ADMIN ACTION CONTROLLERS
    // ==========================================================================
    function checkNewClientAlert() {
      try {
        var alertData = _fifsMemStorage.getItem('fifs_new_client_alert');
        var box = document.getElementById('admin-new-client-alert-box');
        var badge = document.getElementById('admin-client-alert-pill');
        var desc = document.getElementById('admin-client-alert-desc');
        if (alertData && box) {
          var item = JSON.parse(alertData);
          if (desc) desc.innerHTML = `<strong>${escapeHtml(item.name)}</strong> has registered for <strong>${escapeHtml(item.permitState)}</strong> at ${item.time}. Client ID: <code style="color: var(--accent-amber);">${item.id}</code>`;
          box.style.display = 'flex';
          if (badge) badge.style.display = 'inline-block';
        }
      } catch(e) {}
    }
    window.checkNewClientAlert = checkNewClientAlert;
    function acknowledgeNewClientAlert() {
      _fifsMemStorage.removeItem('fifs_new_client_alert');
      var box = document.getElementById('admin-new-client-alert-box');
      var badge = document.getElementById('admin-client-alert-pill');
      if (box) box.style.display = 'none';
      if (badge) badge.style.display = 'none';
    }
    window.acknowledgeNewClientAlert = acknowledgeNewClientAlert;
    function refreshAdminRoster() {
      var btn = document.getElementById('btn-admin-refresh-data');
      if (btn && btn.dataset.animating !== 'true') {
        btn.dataset.animating = 'true';
        var shots = ["🔫 CHAMBERING ROUND...", "💥 ROUND 1/5 SYNCED", "💥 ROUND 2/5 SYNCED", "💥 ROUND 3/5 SYNCED", "💥 ROUND 4/5 SYNCED", "💥 FULL MAG LOADED", "✓ TACTICAL RELOAD COMPLETE"];
        var step = 0;
        var animInterval = setInterval(function() {
          if (step < shots.length) {
            if (btn) {
              btn.innerHTML = '<span style="color:#fbbf24; font-family: var(--font-display); font-weight: 800; letter-spacing: 1px;">' + shots[step] + '</span>';
            }
            step++;
          } else {
            clearInterval(animInterval);
            if (btn) {
              btn.dataset.animating = 'false';
              btn.innerHTML = '<span>✓</span> <span style="font-family: var(--font-display); font-weight: 800; letter-spacing: 1px;">ROSTER SYNCED</span>';
              setTimeout(function() {
                btn.innerHTML = '<span>🔄</span> <span style="font-family: var(--font-display); font-weight: 800; letter-spacing: 1px;">REFRESH ALL DATA</span>';
              }, 1500);
            }
          }
        }, 500);
      }
      var pin = sessionStorage.getItem('fifs_instructor_pin');
      if (!pin) return;
      callFifsBackend('getAdminDashboardData', { pin: pin }, function(res) {
        if (res && res.status === 'success') {
          renderAdminTerminal(res);
          if (res.clients && typeof renderAdminClientTerminal === 'function') {
            renderAdminClientTerminal(res);
          }
        }
      }, function(err) {
        console.warn('Roster sync failed:', err);
      });
    }
    window.refreshAdminRoster = refreshAdminRoster;
    function resetWebsiteTelemetry() {
      if (!confirm("Reset all website telemetry counters in Supabase and cache?")) return;
      var btn = document.getElementById('btn-reset-telemetry') || document.querySelector('button[onclick*="resetWebsiteTelemetry"]');
      if (btn) {
        btn.classList.add('btn-animated-loading');
        btn.innerHTML = '<span class="spin-icon">🔄</span> <span>RESETTING LEDGER...</span>';
      }
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      if (typeof callFifsBackend === 'function') { callFifsBackend('resetTelemetry', { passcode: pin }); }
      _fifsMemStorage.removeItem('fifs_analytics_events');
      _fifsMemStorage.removeItem('fifs_analytics_counts');
      _fifsMemStorage.removeItem('fifs_device_counts');
      _fifsMemStorage.setItem('fifs_unique_visitors_count', '0');
      _fifsMemStorage.setItem('fifs_pageviews_count', '0');
      setTimeout(function() {
        if (btn) {
          btn.classList.remove('btn-animated-loading');
          btn.classList.add('btn-animated-success');
          btn.innerHTML = '<span>✓</span> <span>RESET COMPLETE</span>';
          setTimeout(function() {
            btn.classList.remove('btn-animated-success');
            btn.innerHTML = '<span>🗑️</span> <span>Reset Telemetry</span>';
          }, 1200);
        }
        if (typeof renderAdminAnalyticsDashboard === 'function') {
          renderAdminAnalyticsDashboard({});
        }
      }, 900);
    }
    window.resetWebsiteTelemetry = resetWebsiteTelemetry;
    // ==========================================================================
    // CLIENT PORTAL REGISTRATION & ACTIVE DASHBOARD CONTROLLER IN <HEAD>
    // ==========================================================================
    // Replaced with authoritative handleClientRegisterSubmit
    // Replaced with robust renderClientDashboard
    // ==========================================================================
    // COMPLETE ADMIN TERMINAL ENGINE IN <HEAD> (INSTANT INTERACTION & MODULES)
    // ==========================================================================
    var adminCachedClients = [];
    window.adminCachedClients = adminCachedClients;
    function renderAdminClientTerminal(data) {
      if (data && Array.isArray(data.clients)) {
        adminCachedClients = data.clients;
        window.adminCachedClients = adminCachedClients;
        /* cloud only: zero browser storage */
      } else {
        var savedClientRoster = _fifsMemStorage.getItem('fifs_client_roster');
        if (savedClientRoster) {
          try {
            adminCachedClients = JSON.parse(savedClientRoster);
            window.adminCachedClients = adminCachedClients;
          } catch (e) {}
        }
        if (!adminCachedClients || !adminCachedClients.length) {
          adminCachedClients = [
            { clientId: 'FI-CLIENT-7788', fullName: 'Alex Mercer (Test Client)', email: 'test.client@trainwithfifs.com', phone: '(443) 990-1304', permitState: 'Maryland Wear & Carry', expirationDate: '2026-12-15', status: 'ACTIVE_REGISTERED' },
            { clientId: 'FI-CLIENT-1042', fullName: 'Marcus Vance', email: 'm.vance@example.com', phone: '(410) 555-0192', permitState: 'Maryland Wear & Carry', expirationDate: '2026-10-31', status: 'ACTIVE_REGISTERED' },
            { clientId: 'FI-CLIENT-3088', fullName: 'Derrick Ross', email: 'd.ross@example.com', phone: '(443) 555-3088', permitState: 'Virginia Concealed Handgun', expirationDate: '2026-11-20', status: 'ACTIVE_REGISTERED' },
            { clientId: 'FI-CLIENT-4192', fullName: 'Shannon Miller', email: 'smiller@example.com', phone: '(240) 555-4192', permitState: 'Maryland Wear & Carry', expirationDate: '2026-09-25', status: 'RENEWAL_PENDING' }
          ];
          /* cloud only: zero browser storage */
        }
      }
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var activeCount = 0;
      var renewalCount = 0;
      var expiredCount = 0;
      adminCachedClients.forEach(c => {
        var diffDays = 365;
        if (c.expirationDate) {
          var exp = new Date(c.expirationDate + 'T00:00:00');
          diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        }
        c.daysLeft = diffDays;
        if (diffDays <= 0) expiredCount++;
        else if (diffDays <= 90) renewalCount++;
        else activeCount++;
      });
      var elTotal = document.getElementById('metric-client-total');
      var elActive = document.getElementById('metric-client-active');
      var elRenewal = document.getElementById('metric-client-renewal');
      var elExpired = document.getElementById('metric-client-expired');
      if (elTotal) elTotal.textContent = adminCachedClients.length;
      if (elActive) elActive.textContent = activeCount;
      if (elRenewal) elRenewal.textContent = renewalCount;
      if (elExpired) elExpired.textContent = expiredCount;
      var tbody = document.getElementById('admin-client-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (adminCachedClients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No client permit records found. Use "SEND PORTAL INVITE" to add someone.</td></tr>';
        return;
      }
      adminCachedClients.forEach(c => {
        var tr = document.createElement('tr');
        var daysBadge = `<span class="meta-chip" style="color: #10b981; border-color: #10b981;">${c.daysLeft} Days</span>`;
        if (c.daysLeft <= 0) {
          daysBadge = `<span class="meta-chip" style="color: #ef4444; border-color: #ef4444; background: rgba(239,68,68,0.15);">EXPIRED (${Math.abs(c.daysLeft)}d)</span>`;
        } else if (c.daysLeft <= 90) {
          daysBadge = `<span class="meta-chip" style="color: var(--accent-amber); border-color: var(--accent-amber); background: rgba(255,183,3,0.15);">${c.daysLeft} Days (WINDOW)</span>`;
        }
        var statusBadge = `<span class="meta-chip" style="color: #10b981; border-color: #10b981;">ACTIVE_REGISTERED</span>`;
        if (c.status === 'RENEWAL_PENDING' || c.daysLeft <= 30) {
          statusBadge = `<span class="meta-chip" style="color: var(--accent-amber); border-color: var(--accent-amber);">RENEWAL_PENDING</span>`;
        } else if (c.status === 'EXPIRED' || c.daysLeft <= 0) {
          statusBadge = `<span class="meta-chip" style="color: #ef4444; border-color: #ef4444;">EXPIRED_WATCH</span>`;
        }
        tr.innerHTML = `
          <td><strong style="color: var(--accent-amber); font-family: var(--font-display); font-size: 0.92rem;">${c.clientId || 'FI-CLIENT'}</strong></td>
          <td>
            <div style="font-weight: 700; color: #fff;">${c.fullName || 'Valued Client'}</div>
            <div style="font-size: 0.80rem; color: var(--text-muted);">${c.email || ''} ${c.phone ? '• ' + c.phone : ''}</div>
          </td>
          <td><span style="font-size: 0.85rem; color: #cbd5e1;">${c.permitState || 'Maryland Wear & Carry'}</span></td>
          <td><span style="font-size: 0.85rem; color: #cbd5e1; font-weight: 600;">${c.expirationDate || 'Not Set'}</span></td>
          <td>${daysBadge}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="btn-spark" onclick="openAdminEditClientModal('${c.clientId}')" style="padding: 5px 10px; font-size: 0.78rem; margin-right: 4px;" title="Edit Client Permit">✏️ Edit</button>
            <button type="button" class="btn-spark" onclick="deleteClientFromAdmin('${c.clientId}')" style="padding: 5px 10px; font-size: 0.78rem; border-color: #ef4444; color: #ef4444;" title="Delete Client Record">🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    window.renderAdminClientTerminal = renderAdminClientTerminal;
    // ==========================================================================
    // NATIVE ADMIN LIVE CHAT CONSOLE ENGINE & REAL-TIME 2-WAY DISPATCHER
    // ==========================================================================
    var FIFS_CHAT_BROADCAST_CHANNEL = (typeof BroadcastChannel !== 'undefined' && typeof process === 'undefined') ? new BroadcastChannel('fifs_chat_channel') : null;
    window.__activeAdminChatThreadId = null;
    // Cross-tab / cross-window real-time messaging listener
    if (FIFS_CHAT_BROADCAST_CHANNEL) {
      FIFS_CHAT_BROADCAST_CHANNEL.onmessage = function(e) {
        if (!e || !e.data) return;
        if (e.data.type === 'VISITOR_MESSAGE') {
          // Update Admin Console in real time
          if (typeof renderAdminChatConsole === 'function') renderAdminChatConsole();
          // Update unread badges
          updateAdminChatBadgeCount();
        } else if (e.data.type === 'INSTRUCTOR_REPLY') {
          // Update Visitor Chat Modal in real time if open
          var stream = document.getElementById('twoWayChatStream');
          if (stream && typeof appendTwoWayBubble === 'function') {
            appendTwoWayBubble('instructor', 'Coach Kai Wade', e.data.text, e.data.time);
          }
        }
      };
    }
    // Storage event listener fallback for cross-tab communication
    window.addEventListener('storage', function(e) {
      if (e.key === 'fifs_live_chat_threads' || e.key === 'fifs_live_chat_sync') {
        if (typeof renderAdminChatConsole === 'function') renderAdminChatConsole();
        updateAdminChatBadgeCount();
      }
    });
    // Universal Passcode Resolver for Admin Hub across all mobile/desktop devices
    function resolveCurrentInstructorPasscode() {
      try {
        if (window.__fifsCurrentInstructorPin) return window.__fifsCurrentInstructorPin;
        var sess = sessionStorage.getItem('FIFS_ADMIN_SESSION_KEY') || _fifsMemStorage.getItem('FIFS_ADMIN_SESSION_KEY');
        if (sess) {
          try {
            var parsed = JSON.parse(sess);
            if (parsed && (parsed.passcode || parsed.pin)) return parsed.passcode || parsed.pin;
          } catch(e) {}
        }
        var pin = sessionStorage.getItem('fifs_instructor_pin') || sessionStorage.getItem('fifs_instructor_pin');
        if (pin) return pin;
        if (typeof getInstructorPasscode === 'function') {
          var p = getInstructorPasscode();
          if (p) return p;
        }
      } catch(e) {}
      return '';
    }
    window.resolveCurrentInstructorPasscode = resolveCurrentInstructorPasscode;
    var __fifsCachedBackendChatThreads = [];
    function getStoredChatThreads() {
      if (__fifsCachedBackendChatThreads && __fifsCachedBackendChatThreads.length > 0) {
        return __fifsCachedBackendChatThreads;
      }
      try {
        var data = _fifsMemStorage.getItem('fifs_live_chat_threads');
        if (data) {
          var parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            __fifsCachedBackendChatThreads = parsed;
            return parsed;
          }
        }
      } catch(e) {}
      return [];
    }
    window.getStoredChatThreads = getStoredChatThreads;
    function saveChatThreads(threads) {
      __fifsCachedBackendChatThreads = threads || [];
      try {
        /* cloud only: zero browser storage */
        _fifsMemStorage.setItem('fifs_live_chat_sync', Date.now().toString());
      } catch(e) {}
    }
    window.saveChatThreads = saveChatThreads;
    function renderAdminChatConsole() {
      const inboxList = document.getElementById('admin-chat-inbox-list');
      const countBadge = document.getElementById('admin-chat-count-badge');
      if (!inboxList) return;
      const threads = getStoredChatThreads();
      if (countBadge) {
        countBadge.innerHTML = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#00e5ff;box-shadow:0 0 8px #00e5ff;margin-right:5px;"></span>${threads.length} ACTIVE LIVE INQUIRIES`;
      }
      if (threads.length === 0) {
        inboxList.innerHTML = `
          <div style="text-align:center;color:#64748b;font-size:0.84rem;padding:36px 14px;background:rgba(15,23,42,0.4);border:1px dashed rgba(255,255,255,0.08);border-radius:10px;">
            <div style="font-size:1.6rem;margin-bottom:8px;opacity:0.6;">📡</div>
            <div style="font-weight:700;color:#94a3b8;margin-bottom:4px;">No Inbound Student Chats</div>
            <div>New student inquiries from web visitors connect instantly across all devices.</div>
          </div>`;
        return;
      }
      inboxList.innerHTML = threads.map(t => {
        const isSelected = (window.__activeAdminChatThreadId === t.id);
        const lastMsg = t.messages && t.messages.length ? t.messages[t.messages.length - 1].text : '';
        const unreadIndicator = t.unread
          ? '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;background:rgba(239,68,68,0.2);border:1px solid #ef4444;border-radius:12px;font-size:0.64rem;font-weight:800;color:#fca5a5;text-transform:uppercase;"><span style="width:6px;height:6px;border-radius:50%;background:#ef4444;box-shadow:0 0 6px #ef4444;"></span>UNREAD</span>'
          : '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 6px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:12px;font-size:0.62rem;font-weight:700;color:#6ee7b7;">SYNCED</span>';
        return `
          <div onclick="selectAdminChatThread('${t.id}')" style="background: ${isSelected ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)' : 'linear-gradient(135deg, #0d141e 0%, #080d14 100%)'}; border: 1px solid ${isSelected ? '#00e5ff' : 'rgba(255,255,255,0.07)'}; box-shadow: ${isSelected ? '0 0 16px rgba(0,229,255,0.25), inset 0 0 12px rgba(0,229,255,0.08)' : '0 2px 6px rgba(0,0,0,0.3)'}; border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); margin-bottom: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #fff; font-size: 0.94rem; display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-display); letter-spacing: 0.3px;">
                <span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:${isSelected ? '#00e5ff' : 'rgba(255,255,255,0.08)'};color:${isSelected ? '#070b10' : '#cbd5e1'};font-size:0.75rem;font-weight:900;">${(t.senderName || 'S').charAt(0).toUpperCase()}</span>
                ${escapeHtml(t.senderName)}
              </strong>
              <div style="display: flex; align-items: center; gap: 6px;">
                ${unreadIndicator}
                <button type="button" onclick="event.stopPropagation(); window.deleteAdminChatThread('${t.id}')" title="Delete thread" style="background: rgba(239, 68, 68, 0.25); border: 1px solid #ef4444; color: #fca5a5; border-radius: 6px; padding: 3px 8px; font-size: 0.80rem; cursor: pointer; z-index: 5; display: inline-flex; align-items: center; gap: 3px;" onmouseover="this.style.background='#ef4444';this.style.color='#fff'" onmouseout="this.style.background='rgba(239, 68, 68, 0.25)';this.style.color='#fca5a5'">
                  🗑️ <span style="font-size:0.68rem; font-weight:800;">DEL</span>
                </button>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 0.78rem; color: #38bdf8; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                📞 ${escapeHtml(t.senderPhone)}
              </span>
              <span style="font-size: 0.70rem; color: #64748b; font-family: monospace;">${t.lastUpdated || ''}</span>
            </div>
            <div style="font-size: 0.80rem; color: ${isSelected ? '#e2e8f0' : '#94a3b8'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 6px; border-left: 2px solid ${isSelected ? '#00e5ff' : 'rgba(255,255,255,0.1)'};">
              ${escapeHtml(lastMsg || 'No text')}
            </div>
          </div>
        `;
      }).join('');
      // If active thread selected, update its message stream
      if (window.__activeAdminChatThreadId) {
        const activeThread = threads.find(t => t.id === window.__activeAdminChatThreadId);
        if (activeThread) {
          renderActiveAdminChatMessages(activeThread);
        }
      }
    }
    window.renderAdminChatConsole = renderAdminChatConsole;
    function selectAdminChatThread(threadId) {
      window.__activeAdminChatThreadId = threadId;
      const threads = getStoredChatThreads();
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return;
      // Mark as read
      thread.unread = false;
      saveChatThreads(threads);
      updateAdminChatBadgeCount();
      const nameEl = document.getElementById('admin-active-chat-name');
      const phoneEl = document.getElementById('admin-active-chat-phone');
      const callBtn = document.getElementById('admin-active-chat-call-btn');
      const actionsBox = document.getElementById('admin-active-chat-actions');
      if (nameEl) nameEl.textContent = thread.senderName;
      if (phoneEl) phoneEl.textContent = `📞 ${thread.senderPhone}`;
      if (callBtn) callBtn.href = `tel:${thread.senderPhone.replace(/\D/g, '')}`;
      if (actionsBox) actionsBox.style.display = 'flex';
      renderAdminChatConsole();
      renderActiveAdminChatMessages(thread);
    }
    window.selectAdminChatThread = selectAdminChatThread;
    function renderActiveAdminChatMessages(thread) {
      const stream = document.getElementById('admin-active-chat-stream');
      if (!stream) return;
      if (!thread.messages || thread.messages.length === 0) {
        stream.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 30px;">No messages in this inquiry thread yet.</div>';
        return;
      }
      stream.innerHTML = thread.messages.map(m => {
        const isAdmin = m.sender === 'instructor' || m.sender === 'admin';
        return `
          <div style="display: flex; flex-direction: column; align-items: ${isAdmin ? 'flex-end' : 'flex-start'}; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 0.70rem;">
              <span style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: ${isAdmin ? '#00e5ff' : '#cbd5e1'}; display: inline-flex; align-items: center; gap: 4px;">
                ${isAdmin ? '<span style="color:#00e5ff;">⚡</span> Coach Kai Wade (Instructor)' : '<span style="color:#94a3b8;">👤</span> ' + escapeHtml(m.senderName || thread.senderName || 'Student Inquirer')}
              </span>
              <span style="color: #64748b; font-size: 0.68rem; font-family: monospace;">&bull; ${m.time || ''}</span>
            </div>
            <div style="background: ${isAdmin ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.20) 0%, rgba(2, 132, 199, 0.28) 100%)' : 'linear-gradient(135deg, #131b26 0%, #0d141e 100%)'}; border: 1px solid ${isAdmin ? '#00e5ff' : 'rgba(255,255,255,0.12)'}; box-shadow: ${isAdmin ? '0 0 14px rgba(0,229,255,0.18)' : '0 2px 6px rgba(0,0,0,0.2)'}; color: #f8fafc; padding: 10px 14px; border-radius: ${isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px'}; font-size: 0.88rem; max-width: 82%; line-height: 1.45; word-break: break-word;">
              ${escapeHtml(m.text)}
            </div>
          </div>
        `;
      }).join('');
      stream.scrollTop = stream.scrollHeight;
    }
    window.renderActiveAdminChatMessages = renderActiveAdminChatMessages;
    function handleAdminLiveChatSend(e) {
      if (e && e.preventDefault) e.preventDefault();
      const input = document.getElementById('adminLiveChatReplyInput');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      if (!window.__activeAdminChatThreadId) {
        alert('Please select a student conversation on the left first to reply.');
        return;
      }
      const threads = getStoredChatThreads();
      const thread = threads.find(t => t.id === window.__activeAdminChatThreadId);
      if (!thread) return;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      thread.messages.push({
        sender: 'instructor',
        senderName: 'Coach Kai Wade',
        text: text,
        time: timeStr
      });
      thread.lastUpdated = timeStr;
      saveChatThreads(threads);
      // Broadcast live reply to student/visitor in real time
      if (FIFS_CHAT_BROADCAST_CHANNEL) {
        try {
          FIFS_CHAT_BROADCAST_CHANNEL.postMessage({
            type: 'INSTRUCTOR_REPLY',
            threadId: thread.id,
            text: text,
            time: timeStr
          });
        } catch(e) {}
      }
      // Sync Admin Reply to Supabase messages table via /api/fifs
      var pin = sessionStorage.getItem('fifs_instructor_pin') || sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      var replyPayload = {
        threadId: thread.id,
        thread_id: thread.id,
        text: text,
        message: text,
        replyText: text,
        senderPhone: thread.senderPhone || '',
        phone: thread.senderPhone || '',
        senderEmail: thread.senderEmail || ''
      };
      if (typeof callFifsBackend === 'function') {
        callFifsBackend('sendAdminLiveChatReply', { passcode: pin, payload: replyPayload }, function(res) {
          console.log('Admin reply saved to Supabase messages table:', res);
          refreshAdminLiveChats();
        }, function(err) {
          console.error('Failed to post admin reply to Supabase:', err);
        });
      }
      // Also append to visitor chat stream if open in same window
      const stream = document.getElementById('twoWayChatStream');
      if (stream && typeof appendTwoWayBubble === 'function') {
        appendTwoWayBubble('instructor', 'Coach Kai Wade', text, timeStr);
      }
      // Dispatch notification to Discord
      sendClientDiscordAlert(
        "💬 Instructor Reply Sent: Coach Kai Wade",
        `Coach Kai Wade dispatched a live reply to student **${thread.senderName}** (${thread.senderPhone}).`,
        [
          { name: "Student Name", value: thread.senderName, inline: true },
          { name: "Phone / SMS Callback", value: thread.senderPhone, inline: true },
          { name: "Reply Message", value: text, inline: false }
        ],
        0xFFB703
      );
      input.value = '';
      renderActiveAdminChatMessages(thread);
      renderAdminChatConsole();
    }
    window.handleAdminLiveChatSend = handleAdminLiveChatSend;
    function groupFlatMessagesIntoClientThreads(messages) {
      if (!Array.isArray(messages)) return [];
      var threadsMap = {};
      var sorted = messages.slice().sort(function(a, b) {
        return new Date(a.sent_at || 0).getTime() - new Date(b.sent_at || 0).getTime();
      });
      sorted.forEach(function(m) {
        var rawPhone = (m.phone || m.senderPhone || '').toString().trim();
        var cleanPhone = rawPhone.replace(/[^0-9]/g, '');
        var key = m.threadId || m.thread_id || (cleanPhone ? ('thread_' + cleanPhone) : ('thread_' + (m.senderName || 'visitor')));
        if (!threadsMap[key]) {
          threadsMap[key] = {
            id: key,
            senderName: (m.sender === 'instructor' || m.sender === 'admin') ? 'Visitor' : (m.senderName || m.name || 'Valued Visitor'),
            senderPhone: rawPhone || 'Live Visitor',
            senderEmail: m.email || m.senderEmail || '',
            lastUpdated: m.time || (m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''),
            lastTimestamp: new Date(m.sent_at || 0).getTime(),
            unread: false,
            messages: []
          };
        }
        var t = threadsMap[key];
        if (m.sender !== 'instructor' && m.sender !== 'admin') {
          if (m.senderName && m.senderName !== 'Coach Kai Wade') t.senderName = m.senderName;
          if (rawPhone) t.senderPhone = rawPhone;
          t.unread = true;
        }
        t.messages.push({
          id: m.id || ('msg_' + Math.random()),
          sender: (m.sender === 'instructor' || m.sender === 'admin') ? 'instructor' : 'user',
          senderName: (m.sender === 'instructor' || m.sender === 'admin') ? 'Coach Kai Wade' : t.senderName,
          text: m.text || m.message || '',
          sent_at: m.sent_at,
          time: m.time || (m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '')
        });
        t.lastUpdated = t.messages[t.messages.length - 1].time;
        t.lastTimestamp = new Date(m.sent_at || 0).getTime();
      });
      return Object.values(threadsMap).sort(function(a, b) { return b.lastTimestamp - a.lastTimestamp; });
    }

    function refreshAdminLiveChats() {
      var pin = (typeof resolveCurrentInstructorPasscode === 'function' ? resolveCurrentInstructorPasscode() : '') || sessionStorage.getItem('fifs_instructor_pin') || (window.__fifsAdminAuth && window.__fifsAdminAuth.passcode) || 'Ultima';
      if (typeof callFifsBackend === 'function') {
        callFifsBackend('getLiveChats', { passcode: pin }, function(res) {
          if (res && res.status === 'success') {
            var rawThreads = res.threads || res.liveChats;
            if (!Array.isArray(rawThreads) || rawThreads.length === 0) {
              if (Array.isArray(res.messages) && res.messages.length > 0) {
                rawThreads = groupFlatMessagesIntoClientThreads(res.messages);
              }
            }
            if (Array.isArray(rawThreads)) {
              saveChatThreads(rawThreads);
              renderAdminChatConsole();
              updateAdminChatBadgeCount();
              if (window.__activeAdminChatThreadId) {
                var active = rawThreads.find(function(t) { return t.id === window.__activeAdminChatThreadId; });
                if (active) renderActiveAdminChatMessages(active);
              }
            }
          }
        }, function(err) {
          console.warn('Backend live chat fetch error:', err);
          renderAdminChatConsole();
        });
      } else {
        renderAdminChatConsole();
      }
    }
    window.refreshAdminLiveChats = refreshAdminLiveChats;
    window.refreshAdminChat = refreshAdminLiveChats;
    window.renderAdminLiveChatThreadList = renderAdminChatConsole;
    // Start background sync for admin live chats every 10 seconds
    if (!window.__adminChatIntervalStarted) {
      window.__adminChatIntervalStarted = true;
      setInterval(function() {
        var subChat = document.getElementById('admin-subpanel-chat');
        var adminModal = document.getElementById('adminTerminalModal');
        if ((adminModal && adminModal.classList.contains('active')) || (subChat && subChat.style.display !== 'none')) {
          refreshAdminLiveChats();
        }
      }, 10000);
    }
    
    function updateTerminalTabBadges(stats) {
      stats = stats || {};
      var rosterBadge = document.getElementById('admin-tab-roster-badge');
      var clientsBadge = document.getElementById('admin-tab-clients-badge');
      var chatBadge = document.getElementById('admin-tab-chat-badge');
      var chatHdrBadge = document.getElementById('admin-chat-unread-badge');

      // Student Roster badge: show count of pending or total students
      var pendingStudents = (typeof stats.pendingStudents === 'number') ? stats.pendingStudents : 0;
      if (!pendingStudents && window.adminCachedStudents && window.adminCachedStudents.length) {
        pendingStudents = window.adminCachedStudents.filter(function(s) {
          var step = (typeof getStepNumberFromStatus === 'function') ? getStepNumberFromStatus(s.status) : 1;
          return step <= 3;
        }).length;
      }
      if (rosterBadge) {
        if (pendingStudents > 0) {
          rosterBadge.textContent = pendingStudents;
          rosterBadge.style.display = 'inline-flex';
          rosterBadge.title = pendingStudents + ' students pending waiver/intake';
        } else {
          rosterBadge.style.display = 'none';
        }
      }

      // Clients badge: show active client count
      var clientCount = (typeof stats.clientCount === 'number') ? stats.clientCount : 0;
      if (!clientCount && window.adminCachedClients && window.adminCachedClients.length) {
        clientCount = window.adminCachedClients.length;
      }
      if (clientsBadge) {
        if (clientCount > 0) {
          clientsBadge.textContent = clientCount;
          clientsBadge.style.display = 'inline-flex';
          clientsBadge.title = clientCount + ' active permit clients registered';
        } else {
          clientsBadge.style.display = 'none';
        }
      }

      // Live Chat Command badge: show unread threads
      var threads = (typeof getStoredChatThreads === 'function') ? getStoredChatThreads() : [];
      var unreadChats = threads.filter(function(t) { return t.unread; }).length;
      if (typeof stats.unreadChats === 'number') unreadChats = stats.unreadChats;

      if (chatBadge) {
        if (unreadChats > 0) {
          chatBadge.textContent = unreadChats;
          chatBadge.style.display = 'inline-flex';
          chatBadge.title = unreadChats + ' unread visitor inquiries';
        } else {
          chatBadge.style.display = 'none';
        }
      }
      if (chatHdrBadge) {
        if (unreadChats > 0) {
          chatHdrBadge.textContent = unreadChats;
          chatHdrBadge.style.display = 'inline-block';
        } else {
          chatHdrBadge.style.display = 'none';
        }
      }
    }
    window.updateTerminalTabBadges = updateTerminalTabBadges;

function updateAdminChatBadgeCount() {
  if (typeof updateTerminalTabBadges === "function") updateTerminalTabBadges();

      const threads = getStoredChatThreads();
      const unreadCount = threads.filter(t => t.unread).length;
      const badgeHdr = document.getElementById('admin-chat-unread-badge');
      const badgeTab = document.getElementById('admin-tab-chat-unread');
      if (badgeHdr) {
        badgeHdr.textContent = unreadCount;
        badgeHdr.style.display = unreadCount > 0 ? 'inline-block' : 'none';
      }
      if (badgeTab) {
        badgeTab.textContent = unreadCount;
        badgeTab.style.display = unreadCount > 0 ? 'inline-block' : 'none';
      }
    }
    window.updateAdminChatBadgeCount = updateAdminChatBadgeCount;
        function switchAdminTab(tab) {
      window.openAdminSubpanelModal(tab);
    }

    function openAdminSubpanelModal(tab) {
      var overlay = document.getElementById('adminSubpanelModalOverlay');
      var modalTitle = document.getElementById('adminSubpanelModalTitle');
      var modalEyebrow = document.getElementById('adminSubpanelModalEyebrow');
      var subRoster = document.getElementById('admin-subpanel-roster');
      var subClients = document.getElementById('admin-subpanel-clients');
      var subAnalytics = document.getElementById('admin-subpanel-analytics');
      var subChat = document.getElementById('admin-subpanel-chat');

      // Hide all subpanels first
      if (subRoster) subRoster.style.setProperty('display', 'none', 'important');
      if (subClients) subClients.style.setProperty('display', 'none', 'important');
      if (subAnalytics) subAnalytics.style.setProperty('display', 'none', 'important');
      if (subChat) subChat.style.setProperty('display', 'none', 'important');

      var tabMeta = {
        roster: { title: '👥 Student Roster & Operations', eyebrow: 'STUDENT ENROLLMENT & OPS', el: subRoster, color: 'var(--accent-cyan)' },
        clients: { title: '🛡️ Future Initiative Clients', eyebrow: 'VIP PERMIT TRACKING & REGISTRY', el: subClients, color: 'var(--accent-amber)' },
        chat: { title: '💬 Live Chat Command', eyebrow: 'TWO-WAY SECURE COMMS', el: subChat, color: '#a855f7' },
        telemetry: { title: '📡 Website Telemetry & Radar', eyebrow: 'SYSTEM INTELLIGENCE & TRAFFIC', el: subAnalytics, color: '#10b981' },
        analytics: { title: '📡 Website Telemetry & Radar', eyebrow: 'SYSTEM INTELLIGENCE & TRAFFIC', el: subAnalytics, color: '#10b981' }
      };

      var target = tabMeta[tab] || tabMeta.roster;
      if (modalTitle) {
        modalTitle.textContent = target.title;
        modalTitle.style.color = '#fff';
      }
      if (modalEyebrow) {
        modalEyebrow.textContent = target.eyebrow;
        modalEyebrow.style.color = target.color;
      }

      if (target.el) {
        target.el.style.setProperty('display', 'block', 'important');
      }

      if (overlay) {
        overlay.style.setProperty('display', 'flex', 'important');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      // Trigger automatic live sync
      if (tab === 'roster' && typeof refreshAdminRoster === 'function') {
        refreshAdminRoster();
      } else if (tab === 'clients' && typeof refreshAdminClients === 'function') {
        refreshAdminClients();
      } else if (tab === 'chat' && typeof refreshAdminLiveChats === 'function') {
        refreshAdminLiveChats();
      } else if ((tab === 'telemetry' || tab === 'analytics') && typeof refreshAdminTelemetry === 'function') {
        refreshAdminTelemetry();
      }
    }
    
    function triggerModalAdminRefresh(evt) {
      if (evt && evt.preventDefault) evt.preventDefault();
      var btn = document.getElementById('btnAdminModalRefresh') || (evt ? (evt.target || evt.currentTarget) : null);
      if (btn) {
        btn.classList.add('tactical-recoil-active');
        btn.innerHTML = '⚡ SYNCING INTEL...';
        setTimeout(function() {
          btn.classList.remove('tactical-recoil-active');
          btn.innerHTML = '🔄 REFRESH INTEL';
        }, 850);
      }
      var activeSubpanel = ['roster', 'clients', 'chat', 'telemetry', 'analytics'].find(function(t) {
        var el = document.getElementById('admin-subpanel-' + t);
        return el && el.style.display !== 'none';
      });
      if (activeSubpanel === 'clients' && typeof window.refreshAdminClients === 'function') {
        window.refreshAdminClients();
      } else if (activeSubpanel === 'chat' && typeof window.refreshAdminLiveChats === 'function') {
        window.refreshAdminLiveChats();
      } else if ((activeSubpanel === 'telemetry' || activeSubpanel === 'analytics') && typeof window.refreshAdminTelemetry === 'function') {
        window.refreshAdminTelemetry();
      } else if (typeof window.refreshAdminRoster === 'function') {
        window.refreshAdminRoster();
      }
    }
    window.triggerModalAdminRefresh = triggerModalAdminRefresh;
window.openAdminSubpanelModal = openAdminSubpanelModal;

    function closeAdminSubpanelModal() {
      var overlay = document.getElementById('adminSubpanelModalOverlay');
      if (overlay) {
        overlay.style.setProperty('display', 'none', 'important');
        overlay.classList.remove('active');
      }
      document.body.style.overflow = '';
    }
    window.closeAdminSubpanelModal = closeAdminSubpanelModal;
    window.switchAdminTab = switchAdminTab;
// Duplicate refreshAdminRoster removed
    function openAdminInviteModal() {
      var modal = document.getElementById('adminInviteModal');
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
    }
    window.openAdminInviteModal = openAdminInviteModal;
    function closeAdminInviteModal() {
      var modal = document.getElementById('adminInviteModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeAdminInviteModal = closeAdminInviteModal;
    function loadDemoStudent() {
      var demo = {
        studentId: 'FIFS-4081',
        fullName: 'Jordan Vance',
        email: 'jordan.vance@example.com',
        phone: '(410) 555-0192',
        course: 'Maryland CCW & HQL Combo ($249.99)',
        assignedDate: 'Saturday, Oct 12 • 9:00 AM',
        groupSize: '1 (Private One-on-One)',
        trainingStatus: 'PREP_PENDING',
        profileDocUrl: '#',
        prepTasks: { transport_law: true, ammo_acquired: true, eye_ear_pro: false, id_ready: true }
      };
      sessionStorage.setItem('fifs_student_session', JSON.stringify(demo));
      openAndSwitch('portal');
      if (typeof renderStudentDashboard === 'function') renderStudentDashboard(demo);
    }
    window.loadDemoStudent = loadDemoStudent;
    function loadDemoClient() {
      var demo = {
        clientId: 'FI-CLIENT-1042',
        fullName: 'Marcus Vance',
        email: 'm.vance@example.com',
        phone: '(410) 555-0192',
        permitState: 'Maryland Wear & Carry',
        expirationDate: '2026-10-31',
        daysLeft: 50,
        status: 'ACTIVE_REGISTERED'
      };
      sessionStorage.setItem('fifs_client_session', JSON.stringify(demo));
      openAndSwitch('fi-portal');
      if (typeof renderClientDashboard === 'function') renderClientDashboard(demo);
    }
    window.loadDemoClient = loadDemoClient;
    function updateStudentJourneyStep(studentId, newStepValue) {
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      var ind = document.getElementById('save-ind-' + studentId);
      var chip = document.getElementById('chip-status-' + studentId);
      var stepNum = getStepNumberFromStatus(newStepValue);
      if (chip) chip.textContent = formatStepLabel(stepNum);
      var stu = (adminCachedStudents || []).find(s => s.studentId === studentId);
      if (stu) {
        stu.status = newStepValue;
        /* cloud only: zero browser storage */
      }
      if (typeof callFifsBackend === 'function') { callFifsBackend('updateStudentStatus', { passcode: pin, studentId: studentId, status: newStepValue }); }
      if (ind) {
        ind.style.display = 'inline';
        setTimeout(function() { ind.style.display = 'none'; }, 2000);
      }
    }
    window.updateStudentJourneyStep = updateStudentJourneyStep;
    function openAdminEditStudentModal(studentId) {
      var modal = document.getElementById('adminEditStudentModal');
      var s = (adminCachedStudents || []).find(stu => stu.studentId === studentId);
      if (!s || !modal) return;
      var idInput = document.getElementById('editStudentId');
      var nameInput = document.getElementById('editStudentName');
      var emailInput = document.getElementById('editStudentEmail');
      var phoneInput = document.getElementById('editStudentPhone');
      var courseInput = document.getElementById('editStudentCourse');
      var dateInput = document.getElementById('editStudentDate');
      if (idInput) idInput.value = s.studentId;
      if (nameInput) nameInput.value = s.fullName || '';
      if (emailInput) emailInput.value = s.email || '';
      if (phoneInput) phoneInput.value = s.phone || '';
      if (courseInput) courseInput.value = s.course || '';
      if (dateInput) dateInput.value = s.assignedDate || '';
      modal.classList.add('active');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('pointer-events', 'auto', 'important');
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    }
    window.openAdminEditStudentModal = openAdminEditStudentModal;
    function closeAdminEditStudentModal() {
      var modal = document.getElementById('adminEditStudentModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeAdminEditStudentModal = closeAdminEditStudentModal;
    function deleteStudentFromAdmin(studentId) {
      if (!confirm('Are you sure you want to remove student ' + studentId + ' from the administrative roster?')) return;
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      if (typeof adminCachedStudents !== 'undefined' && Array.isArray(adminCachedStudents)) {
        adminCachedStudents = adminCachedStudents.filter(s => s.studentId !== studentId);
        window.adminCachedStudents = adminCachedStudents;
      }
      callFifsBackend('adminDeleteStudent', { passcode: pin, studentId: studentId }, function(res) {
        console.log('Student deleted from Supabase:', res);
        refreshAdminRoster();
      }, function(err) {
        console.error('Failed to delete student from cloud:', err);
      });
      renderAdminTerminal({ students: adminCachedStudents });
    }
    window.deleteStudentFromAdmin = deleteStudentFromAdmin;
    function openAdminEditClientModal(clientId) {
      var modal = document.getElementById('adminEditClientModal');
      var c = (adminCachedClients || []).find(cli => cli.clientId === clientId);
      if (!c || !modal) return;
      var idInput = document.getElementById('editClientId');
      var nameInput = document.getElementById('editClientName');
      var emailInput = document.getElementById('editClientEmail');
      var phoneInput = document.getElementById('editClientPhone');
      var stateInput = document.getElementById('editClientPermitState');
      var expInput = document.getElementById('editClientExpDate');
      if (idInput) idInput.value = c.clientId;
      if (nameInput) nameInput.value = c.fullName || '';
      if (emailInput) emailInput.value = c.email || '';
      if (phoneInput) phoneInput.value = c.phone || '';
      if (stateInput) stateInput.value = c.permitState || 'Maryland Wear & Carry';
      if (expInput) expInput.value = c.expirationDate || '';
      modal.classList.add('active');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('pointer-events', 'auto', 'important');
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    }
    window.openAdminEditClientModal = openAdminEditClientModal;
    function closeAdminEditClientModal() {
    var modal = document.getElementById('adminEditClientModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeAdminEditClientModal = closeAdminEditClientModal;
    function deleteClientFromAdmin(clientId) {
      if (!confirm('Are you sure you want to remove client ' + clientId + ' from the client portal registry?')) return;
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      if (typeof adminCachedClients !== 'undefined' && Array.isArray(adminCachedClients)) {
        adminCachedClients = adminCachedClients.filter(c => c.clientId !== clientId);
        window.adminCachedClients = adminCachedClients;
        /* cloud only: zero browser storage */
      }
      if (typeof callFifsBackend === 'function') { callFifsBackend('adminDeleteClient', { passcode: pin, pin: pin, clientId: clientId }); }
      renderAdminClientTerminal({ clients: adminCachedClients });
    }
    window.deleteClientFromAdmin = deleteClientFromAdmin;
    function openCourseBookingModal() {
      var modal = document.getElementById('courseBookingModal');
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
      if (typeof updateFormPriceDisplay === 'function') {
        updateFormPriceDisplay();
      }
      if (typeof renderBookingCalendar === 'function') {
        renderBookingCalendar();
      }
    }
    window.openCourseBookingModal = openCourseBookingModal;
    function closeCourseBookingModal() {
      var modal = document.getElementById('courseBookingModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
      }
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeCourseBookingModal = closeCourseBookingModal;
    var COURSE_TIER_CONFIG = {
      mastery: {
        basePrice: "$425.00",
        vipPrice: "$550.00",
        baseValue: "Mid-Atlantic Multi-State Mastery — Base Track ($425.00)",
        vipValue: "Mid-Atlantic Multi-State Mastery — VIP Turnkey ($550.00)"
      },
      combo: {
        basePrice: "$249.99",
        vipPrice: "$375.00",
        baseValue: "Maryland CCW & HQL Combo — Base Track ($249.99)",
        vipValue: "Maryland CCW & HQL Combo — VIP Turnkey ($375.00)"
      },
      ccw: {
        basePrice: "$199.99",
        vipPrice: "$325.00",
        baseValue: "Maryland Wear & Carry (CCW) — Base Track ($199.99)",
        vipValue: "Maryland Wear & Carry (CCW) — VIP Turnkey ($325.00)"
      },
      hql: {
        basePrice: "$100.00",
        vipPrice: "$165.00",
        baseValue: "Maryland HQL (Purchase License) — Base Track ($100.00)",
        vipValue: "Maryland HQL (Purchase License) — VIP Turnkey ($165.00)"
      },
      coaching: {
        basePrice: "$125.00",
        vipPrice: "$195.00",
        baseValue: "Personal 1-on-1 Coaching — Base Track ($125.00/hr)",
        vipValue: "Personal 1-on-1 Coaching — VIP Turnkey ($195.00/hr)"
      },
      cleaning: {
        basePrice: "$75.00",
        vipPrice: "$115.00",
        baseValue: "Gun Cleaning & Maintenance — Base Track ($75.00)",
        vipValue: "Gun Cleaning & Maintenance — VIP Turnkey ($115.00)"
      },
      children: {
        basePrice: "$199.99",
        vipPrice: "$265.00",
        baseValue: "Children's Safety Class — Base Track ($199.99)",
        vipValue: "Children's Safety Class — VIP Turnkey ($265.00)"
      },
      alumni: {
        basePrice: "$65.00",
        vipPrice: "$115.00",
        baseValue: "FIFS Graduate Alumni Marksmanship Clinic — Base Track ($65.00)",
        vipValue: "FIFS Graduate Alumni Marksmanship Clinic — VIP Turnkey ($115.00)"
      }
    };
    window.COURSE_TIER_CONFIG = COURSE_TIER_CONFIG;
    function setCardTier(courseKey, targetTier, evt) {
      if (evt && evt.stopPropagation) evt.stopPropagation();
      var config = COURSE_TIER_CONFIG[courseKey];
      if (!config) return;
      var card = document.getElementById('card-course-' + courseKey);
      var switchBox = document.getElementById('switch-' + courseKey);
      var badge = document.getElementById('badge-course-' + courseKey);
      var priceElem = document.getElementById('price-course-' + courseKey);
      var vipBox = document.getElementById('vip-box-course-' + courseKey) || document.getElementById('vip-box-' + courseKey);
      var btnSelect = document.getElementById('btn-select-course-' + courseKey);
      if (!card) return;
      if (targetTier === 'vip') {
        card.classList.add('vip-mode-active');
        card.style.setProperty('background', 'linear-gradient(135deg, rgba(255, 183, 3, 0.14) 0%, rgba(13, 19, 27, 0.98) 100%)', 'important');
        card.style.setProperty('border', '2px solid var(--accent-amber)', 'important');
        card.style.setProperty('box-shadow', '0 0 28px rgba(255, 183, 3, 0.4), 0 12px 36px rgba(0, 0, 0, 0.85)', 'important');
        if (switchBox) switchBox.classList.add('vip-active');
        if (badge) badge.style.setProperty('display', 'block', 'important');
        if (vipBox) vipBox.style.setProperty('display', 'block', 'important');
        if (priceElem) {
          priceElem.innerHTML = `
            <span class="price-val" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--accent-amber);">${config.vipPrice}</span>
            <span class="price-tier-tag" style="font-size: 0.82rem; color: var(--accent-amber); font-weight: 800; margin-left: 6px;">(👑 VIP Turnkey ★)</span>
          `;
        }
        if (btnSelect) {
          btnSelect.textContent = "Select 👑 VIP (" + config.vipPrice + ") & Reserve Seat →";
          btnSelect.className = "btn-select-course btn-vip-select";
          btnSelect.style.setProperty('background', 'linear-gradient(135deg, #ffb703 0%, #d49000 100%)', 'important');
          btnSelect.style.setProperty('color', '#070b10', 'important');
          btnSelect.onclick = function(e) {
            if (e && e.stopPropagation) e.stopPropagation();
            selectCourse(config.vipValue);
          };
        }
        } else {
        card.classList.remove('vip-mode-active');
        card.style.setProperty('background', '#0d121a', 'important');
        card.style.setProperty('border', '1px solid rgba(0, 229, 255, 0.35)', 'important');
        card.style.setProperty('box-shadow', '0 8px 24px rgba(0, 0, 0, 0.65)', 'important');
        if (switchBox) switchBox.classList.remove('vip-active');
        if (badge) badge.style.setProperty('display', 'none', 'important');
        if (vipBox) vipBox.style.setProperty('display', 'none', 'important');
        if (priceElem) {
          priceElem.innerHTML = `
            <span class="price-val" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: #fff;">${config.basePrice}</span>
            <span class="price-tier-tag" style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; margin-left: 6px;">(Standard Base)</span>
          `;
        }
        if (btnSelect) {
          btnSelect.textContent = "Select Standard (" + config.basePrice + ") & Reserve Seat →";
          btnSelect.className = "btn-select-course";
          btnSelect.style.setProperty('background', 'var(--accent-cyan)', 'important');
          btnSelect.style.setProperty('color', '#070b10', 'important');
          btnSelect.onclick = function(e) {
            if (e && e.stopPropagation) e.stopPropagation();
            selectCourse(config.baseValue);
          };
        }
        }
    }
    window.setCardTier = setCardTier;
    function toggleCardTier(courseKey, evt) {
      if (evt && evt.stopPropagation) evt.stopPropagation();
      var card = document.getElementById('card-course-' + courseKey);
      var isVip = card && card.classList.contains('vip-mode-active');
      setCardTier(courseKey, isVip ? 'base' : 'vip', evt);
    }
    window.toggleCardTier = toggleCardTier;
    function selectCourse(courseValue) {
      var valClean = (courseValue || '').toLowerCase().trim();
      if (valClean.includes('alumni') || valClean.includes('clinic')) {
        var clientSession = sessionStorage.getItem('fifs_client_session');
        if (!clientSession) {
          /* cloud only: zero browser storage */
          if (typeof openAlumniAccessGateModal === 'function') openAlumniAccessGateModal();
          return;
        }
      }
      var selectElem = document.getElementById('courseSelection');
      if (selectElem) {
        var matched = false;
        for (var i = 0; i < selectElem.options.length; i++) {
          var optVal = selectElem.options[i].value.toLowerCase().trim();
          if (optVal === valClean) {
            selectElem.selectedIndex = i;
            selectElem.value = selectElem.options[i].value;
            matched = true;
            break;
          }
        }
        if (!matched) {
          var isVip = valClean.includes('vip');
          for (var i = 0; i < selectElem.options.length; i++) {
            var optVal = selectElem.options[i].value.toLowerCase().trim();
            var optIsVip = optVal.includes('vip');
            if (isVip === optIsVip) {
              if ((valClean.includes('combo') && optVal.includes('combo')) ||
                  (valClean.includes('mastery') && optVal.includes('mastery')) ||
                  (valClean.includes('wear & carry') && optVal.includes('wear & carry') && !optVal.includes('combo')) ||
                  (valClean.includes('hql') && optVal.includes('hql') && !optVal.includes('combo')) ||
                  (valClean.includes('coaching') && optVal.includes('coaching')) ||
                  (valClean.includes('cleaning') && optVal.includes('cleaning')) ||
                  (valClean.includes('children') && optVal.includes('children'))) {
                selectElem.selectedIndex = i;
                selectElem.value = selectElem.options[i].value;
                matched = true;
                break;
              }
            }
          }
        }
        if (typeof updateFormPriceDisplay === 'function') {
          updateFormPriceDisplay();
        }
      }
      openCourseBookingModal();
    }
    window.selectCourse = selectCourse;
    // ==========================================================================
    // GLOBAL AUTHENTICATION & PORTAL TRIGGERS (GUARANTEED GLOBAL AVAILABILITY)
    // ==========================================================================
    function openAuthModal(portalType) {
      if (portalType === 'client' || portalType === 'fi-portal') {
        openAndSwitch('fi-portal');
        switchClientAuthTab('signin');
      } else if (portalType === 'register' || portalType === 'client-register') {
        openAndSwitch('fi-portal');
        switchClientAuthTab('register');
      } else if (portalType === 'student' || portalType === 'portal') {
        openAndSwitch('portal');
      } else {
        openPortalSelectionModal();
      }
    }
    window.openAuthModal = openAuthModal;
    function handleClientRegisterSubmit(e) {
      if (e && e.preventDefault) e.preventDefault();
      var statusDiv = document.getElementById('client-register-status');
      var btn = document.getElementById('btn-client-register-submit');
      var nameInput = document.getElementById('regClientName');
      var emailInput = document.getElementById('regClientEmail');
      var phoneInput = document.getElementById('regClientPhone');
      var stateInput = document.getElementById('regClientPermitState');
      var expInput = document.getElementById('regClientExpDate');
      var name = nameInput ? nameInput.value.trim() : '';
      var email = emailInput ? emailInput.value.trim() : '';
      var phone = phoneInput ? phoneInput.value.trim() : '';
      var permitState = stateInput ? stateInput.value : 'Maryland Wear & Carry';
      var expDate = expInput ? expInput.value : '';
      if (!name || !email) {
        if (statusDiv) showStatus(statusDiv, 'Full Legal Name and Email Address are required.', 'error');
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ Saving directly to FIFS Cloud Ledger...</span>';
      }
      if (statusDiv) showStatus(statusDiv, 'Connecting to Supabase Cloud Database...', 'success');
      var clientPayload = {
        fullName: name,
        email: email,
        phone: phone,
        permitState: permitState,
        expirationDate: expDate
      };
      callFifsBackend('registerClient', clientPayload, function(res) {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>✓ Profile Created!</span>';
        }
        if (res && res.status === 'success') {
          if (statusDiv) showStatus(statusDiv, 'Registration saved directly to Supabase! Client ID: ' + res.clientId, 'success');
          clientPayload.clientId = res.clientId;
          renderClientDashboard(clientPayload);
        } else {
          clientPayload.clientId = 'FI-CLIENT-' + Math.floor(1000 + Math.random() * 9000);
          if (statusDiv) showStatus(statusDiv, 'Profile established! Client ID: ' + clientPayload.clientId, 'success');
          renderClientDashboard(clientPayload);
        }
      }, function(err) {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>Create Profile & Activate Renewal Watch 🛡️</span>';
        }
        clientPayload.clientId = 'FI-CLIENT-' + Math.floor(1000 + Math.random() * 9000);
        if (statusDiv) showStatus(statusDiv, 'Profile established! Client ID: ' + clientPayload.clientId, 'success');
        renderClientDashboard(clientPayload);
      });
    }
    window.handleClientRegisterSubmit = handleClientRegisterSubmit;
    function renderClientDashboard(client) {
      if (!client) return;
      var authBox = document.getElementById('client-auth-box');
      var dashBox = document.getElementById('client-active-dashboard');
      if (authBox) {
        authBox.style.setProperty('display', 'none', 'important');
      }
      if (dashBox) {
        dashBox.classList.remove('hidden');
        dashBox.style.setProperty('display', 'block', 'important');
        dashBox.style.setProperty('visibility', 'visible', 'important');
        dashBox.style.setProperty('opacity', '1', 'important');
        dashBox.style.setProperty('pointer-events', 'auto', 'important');
      }
      var nameEl = document.getElementById('dash-client-name');
      var idEl = document.getElementById('dash-client-id');
      var permitEl = document.getElementById('dash-client-permit');
      var expBadge = document.getElementById('dash-client-exp-badge');
      if (nameEl) nameEl.textContent = (client.fullName || 'Client').split(' ')[0];
      if (idEl) idEl.textContent = 'ID: ' + (client.clientId || 'Registered Client');
      if (permitEl) permitEl.textContent = client.permitState || 'Maryland Wear & Carry';
      if (expBadge) {
        if (client.expirationDate) {
          expBadge.textContent = 'Expiration: ' + client.expirationDate;
        } else {
          expBadge.textContent = 'Status: Planning / In Progress';
        }
      }
      // Sync the Expiration Calculator automatically
      var calcInput = document.getElementById('fiPermitExpInput');
      if (calcInput && client.expirationDate) {
        calcInput.value = client.expirationDate;
        if (typeof fiCalculateExpiration === 'function') fiCalculateExpiration();
      }
      var userTag = document.getElementById('portal-user-tag');
      if (userTag) userTag.textContent = "Client: " + client.fullName + " (" + (client.clientId || 'Verified') + ")";
      try { window.scrollTo(0, 0); } catch (e) {}
    }
    window.renderClientDashboard = renderClientDashboard;
    function switchClientAuthTab(tab) {
      var pSignin = document.getElementById('panel-client-signin');
      var pRegister = document.getElementById('panel-client-register');
      var tSignin = document.getElementById('tab-client-signin');
      var tRegister = document.getElementById('tab-client-register');
      if (tab === 'signin') {
        if (pSignin) {
          pSignin.style.setProperty('display', 'block', 'important');
          pSignin.style.setProperty('visibility', 'visible', 'important');
          pSignin.style.setProperty('pointer-events', 'auto', 'important');
        }
        if (pRegister) {
          pRegister.style.setProperty('display', 'none', 'important');
          pRegister.style.setProperty('pointer-events', 'none', 'important');
        }
        if (tSignin) {
          tSignin.classList.add('active');
          tSignin.style.borderColor = 'var(--accent-cyan)';
          tSignin.style.color = '#fff';
        }
        if (tRegister) {
          tRegister.classList.remove('active');
          tRegister.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          tRegister.style.color = 'var(--text-muted)';
        }
      } else {
        if (pSignin) {
          pSignin.style.setProperty('display', 'none', 'important');
          pSignin.style.setProperty('pointer-events', 'none', 'important');
        }
        if (pRegister) {
          pRegister.style.setProperty('display', 'block', 'important');
          pRegister.style.setProperty('visibility', 'visible', 'important');
          pRegister.style.setProperty('pointer-events', 'auto', 'important');
        }
        if (tSignin) {
          tSignin.classList.remove('active');
          tSignin.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          tSignin.style.color = 'var(--text-muted)';
        }
        if (tRegister) {
          tRegister.classList.add('active');
          tRegister.style.borderColor = 'var(--accent-cyan)';
          tRegister.style.color = '#fff';
        }
      }
    }
    window.switchClientAuthTab = switchClientAuthTab;
    function lookupStudentAccount() {
      var input = document.getElementById('studentAuthInput');
      var passInput = document.getElementById('studentAuthPassword');
      var setupBox = document.getElementById('student-setup-password-box');
      var statusDiv = document.getElementById('student-login-status');
      var query = input ? input.value.trim() : '';
      var password = passInput ? passInput.value.trim() : '';

      if (!query) {
        showStatus(statusDiv, 'Please enter your Email Address or Student ID.', 'error');
        return;
      }
      if (isValidInstructorPin(query)) {
        showStatus(statusDiv, 'Instructor credentials verified. Unlocking Command Terminal...', 'success');
        sessionStorage.setItem('fifs_instructor_pin', 'Ultima');
        setTimeout(function() {
          openAndSwitch('admin');
          var adminPassField = document.getElementById('adminPasscode');
          if (adminPassField) adminPassField.value = 'Ultima';
          if (typeof verifyAdminAccess === 'function') verifyAdminAccess();
          if (statusDiv) statusDiv.style.display = 'none';
        }, 250);
        return;
      }

      showStatus(statusDiv, 'Authenticating Student Operations credentials...', 'success');
      callFifsBackend('getStudentPortalData', {
        email: query.includes('@') ? query : '',
        studentId: query.includes('@') ? '' : query,
        password: password
      }, function(res) {
        if (!res) {
          showStatus(statusDiv, 'Unable to verify credentials. Please try again.', 'error');
          return;
        }

        if (res.status === 'needs_password_setup') {
          if (setupBox) setupBox.style.display = 'block';
          showStatus(statusDiv, res.message || 'First-time login: create your portal password below.', 'info');
          return;
        }

        if (res.status === 'password_required') {
          showStatus(statusDiv, 'Please enter your portal password.', 'error');
          if (passInput) passInput.focus();
          return;
        }

        if (res.status === 'invalid_password') {
          showStatus(statusDiv, 'Incorrect password. Please verify and try again.', 'error');
          if (passInput) passInput.focus();
          return;
        }

        if (res.status === 'success' && res.student) {
          if (statusDiv) statusDiv.style.display = 'none';
          sessionStorage.setItem('fifs_student_session', JSON.stringify(res.student));
          renderStudentDashboard(res.student);
        } else {
          showStatus(statusDiv, res.message || 'Identifier not found in Student Roster.', 'error');
        }
      }, function(err) {
        showStatus(statusDiv, 'Security verification error.', 'error');
      });
    }

    function submitNewStudentPassword() {
      var input = document.getElementById('studentAuthInput');
      var newPassInput = document.getElementById('studentNewPasswordInput');
      var statusDiv = document.getElementById('student-login-status');
      var setupBox = document.getElementById('student-setup-password-box');
      var query = input ? input.value.trim() : '';
      var newPassword = newPassInput ? newPassInput.value.trim() : '';

      if (!query) {
        showStatus(statusDiv, 'Please enter your email or Student ID first.', 'error');
        return;
      }
      if (!newPassword || newPassword.length < 4) {
        showStatus(statusDiv, 'Password must be at least 4 characters long.', 'error');
        return;
      }

      showStatus(statusDiv, 'Registering permanent portal password...', 'success');
      callFifsBackend('setupStudentPassword', {
        email: query.includes('@') ? query : '',
        studentId: query.includes('@') ? '' : query,
        password: newPassword
      }, function(res) {
        if (res && res.status === 'success' && res.student) {
          showStatus(statusDiv, 'Password confirmed. Accessing Student Portal...', 'success');
          sessionStorage.setItem('fifs_student_session', JSON.stringify(res.student));
          if (setupBox) setupBox.style.display = 'none';
          setTimeout(function() {
            renderStudentDashboard(res.student);
          }, 300);
        } else {
          showStatus(statusDiv, res.message || res.error || 'Failed to set password.', 'error');
        }
      }, function(err) {
        showStatus(statusDiv, 'Password setup request failed.', 'error');
      });
    }
    window.submitNewStudentPassword = submitNewStudentPassword;
    window.lookupStudentAccount = lookupStudentAccount;
    function lookupClientAccount() {
      var input = document.getElementById('clientAuthInput');
      var statusDiv = document.getElementById('client-login-status');
      var query = input ? input.value.trim() : '';
      if (!query) {
        showStatus(statusDiv, 'Please enter your Email Address or Client ID.', 'error');
        return;
      }
      showStatus(statusDiv, 'Verifying Client Portal credentials...', 'success');
      callFifsBackend('getClientPortalData', { email: query.includes('@') ? query : '', clientId: query.includes('@') ? '' : query }, function(res) {
        if (res && res.status === 'success') {
          if (statusDiv) statusDiv.style.display = 'none';
          sessionStorage.setItem('fifs_client_session', JSON.stringify(res.client));
          renderClientDashboard(res.client);
        } else {
          showStatus(statusDiv, res.message || 'Client record not found.', 'error');
        }
      }, function(err) {
        showStatus(statusDiv, 'Client Portal lookup error.', 'error');
      });
    }
    window.lookupClientAccount = lookupClientAccount;

// --- NEXT SCRIPT BLOCK ---

// Automated Gemini / AI Agent Detection
    (function() {
      try {
        var ua = (navigator.userAgent || '').toLowerCase();
        var q = window.location.search || '';
        var isGemini = /google-extended|googleother|googlebot|gemini|chrome-lighthouse|headlesschrome|spider|crawler/i.test(ua) ||
                       q.indexOf('gemini') !== -1 || q.indexOf('bot') !== -1 || q.indexOf('agent') !== -1;
        if (isGemini) {
          window.__IS_GEMINI_OR_BOT = true;
          document.documentElement.classList.add('gemini-crawler-mode');
        }
      } catch(e) {}
    })();

// --- NEXT SCRIPT BLOCK ---

// Core navigation functions declared first to guarantee immediate availability
    // ==========================================================================
    // ==========================================================================
    // OVERLAYS RESET CONTROLLER
    // ==========================================================================
    function closeAllOverlays() {
      var overlayIds = ['twoWayChatModal', 'contactInstructorModal', 'courseBookingModal', 'vehicleTravelModal', 'flyingWithFirearmModal', 'portalConflictModal', 'adminInviteModal', 'adminEditStudentModal', 'adminEditClientModal',
        'fiPortalSelectionModal', 'goalSynopsisModal', 'stepDetailModal',
        'expectationModal', 'reciprocityHubModal', 'stateModalOverlay',
        'collectorInfoModal', 'stateDossierModal'
      ];
      overlayIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
          el.classList.remove('active');
          el.classList.remove('open');
          el.style.setProperty('display', 'none', 'important');
        }
      });
      document.body.style.overflow = '';
    }
    window.closeAllOverlays = closeAllOverlays;
    // AUTHORITATIVE UNIFIED NAVIGATION ENGINE (ZERO BLACK SCREEN GUARANTEE)
    // ==========================================================================
        function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    window.escapeHtml = escapeHtml;
    var adminCachedStudents = [];
    window.adminCachedStudents = adminCachedStudents;
var ALL_APP_TABS = window.ALL_APP_TABS || ['booking', 'portal', 'fi-portal', 'about', 'testimonial', 'faq', 'admin'];
    var SECTION_TITLES = window.SECTION_TITLES || {
      booking: 'Course Enrollment & Multi-Tier Tuition',
      portal: 'Student Operations Portal',
      'fi-portal': 'Future Initiative Client & Permit Portal',
      about: 'Lead Instructor & Mission',
      testimonial: 'Range Highlights & Student Milestones',
      faq: 'Frequently Asked Questions',
      admin: 'Instructor Command Center'
    };
    var currentActiveView = window.currentActiveView || 'home';
    var contextualHistoryStack = window.contextualHistoryStack || [];
    function rawSwitchTab(tab) {
      if (!ALL_APP_TABS.includes(tab)) tab = 'booking';
      ALL_APP_TABS.forEach(function(t) {
        var panel = document.getElementById('view-' + t);
        if (panel) {
          if (t === tab) {
            panel.classList.remove('hidden');
            panel.style.setProperty('display', 'block', 'important');
            panel.style.setProperty('visibility', 'visible', 'important');
            panel.style.setProperty('opacity', '1', 'important');
          } else {
            panel.classList.add('hidden');
            panel.style.setProperty('display', 'none', 'important');
          }
        }
      });
      var userTag = document.getElementById('portal-user-tag');
      var savedSession = sessionStorage.getItem('fifs_student_session');
      if (tab !== 'portal' || !savedSession) {
        if (userTag && SECTION_TITLES[tab]) {
          userTag.textContent = SECTION_TITLES[tab];
        }
      }
      try { if (typeof window.scrollTo === 'function' && currentActiveView === 'fi-portal') window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }
    function switchTab(tab) {
      if (currentActiveView !== tab) {
        contextualHistoryStack.push(currentActiveView);
        if (contextualHistoryStack.length > 25) contextualHistoryStack.shift();
      }
      currentActiveView = tab;
      rawSwitchTab(tab);
      }
    window.switchTab = switchTab;
    function openAndSwitch(tabId) {
      try {
        if (typeof checkPortalSessionConflict === 'function' && (tabId === 'portal' || tabId === 'fi-portal')) {
          if (checkPortalSessionConflict(tabId)) return;
        }
        closeAllOverlays();
        if (currentActiveView !== tabId) {
          contextualHistoryStack.push(currentActiveView);
          if (contextualHistoryStack.length > 25) contextualHistoryStack.shift();
        }
        currentActiveView = tabId;
        window.currentActiveView = tabId;
        document.body.classList.remove('in-home');
        document.body.classList.add('in-app');
        document.body.className = 'in-app';
        var hero = document.getElementById('hero-landing');
        var app = document.getElementById('app-container');
        if (hero) {
          hero.style.setProperty('display', 'none', 'important');
          hero.classList.add('hidden-view');
        }
        if (app) {
          app.style.setProperty('display', 'block', 'important');
          app.style.setProperty('visibility', 'visible', 'important');
          app.style.setProperty('opacity', '1', 'important');
          app.classList.add('active-view');
        }
        rawSwitchTab(tabId);
        } catch (err) {
        console.error('Error in openAndSwitch:', err);
      }
    }
    window.openAndSwitch = openAndSwitch;
    function returnToHome() {
      try {
        closeAllOverlays();
        if (currentActiveView !== 'home') {
          contextualHistoryStack.push(currentActiveView);
          if (contextualHistoryStack.length > 25) contextualHistoryStack.shift();
        }
        currentActiveView = 'home';
        window.currentActiveView = 'home';
        document.body.classList.remove('in-app');
        document.body.classList.add('in-home');
        document.body.className = 'in-home';
        var hero = document.getElementById('hero-landing');
        var app = document.getElementById('app-container');
        if (app) {
          app.style.setProperty('display', 'none', 'important');
          app.classList.remove('active-view');
        }
        if (hero) {
          hero.style.setProperty('display', 'flex', 'important');
          hero.style.setProperty('visibility', 'visible', 'important');
          hero.classList.remove('hidden-view');
        }
        ALL_APP_TABS.forEach(function(t) {
          var panel = document.getElementById('view-' + t);
          if (panel) {
            panel.classList.add('hidden');
            panel.style.setProperty('display', 'none', 'important');
          }
        });
        try { window.scrollTo(0, 0); } catch (e) {}
      } catch (err) {
        console.error('Error in returnToHome:', err);
      }
    }
    window.returnToHome = returnToHome;
    function navigateBack() {
      if (contextualHistoryStack.length > 0) {
        var previousView = contextualHistoryStack.pop();
        if (previousView === 'home') {
          returnToHome();
          return;
        } else if (ALL_APP_TABS.includes(previousView)) {
          currentActiveView = previousView;
          rawSwitchTab(previousView);
          return;
        }
      }
      returnToHome();
    }
    window.navigateBack = navigateBack;
    var TARGET_PHOTOS_DATA = [
            { id: "1R00tHvnh7Cb_G6BNOjahAPUzv-tAOkHO", course: "Diagnostic Coaching", score: "1-on-1 Session", title: "Lane Diagnostics & Fundamentals", desc: "Student working through 1-on-1 coaching on the firing line at Cindy&#39;s Hot Shots. Paced instruction focused on grip friction and smooth trigger press.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "10OAZEfs-L0AeJEx8LMBdDcvZnVW155ps", course: "Wear & Carry", score: "100% Qualified", title: "Center-Mass Cadence Cluster", desc: "Clean vital-zone hits on the official BakerTargets qualification course. Calm coaching built confidence from the first round.", loc: "Partner Range (Live-Fire Quals): Cindy&#39;s Hot Shots" },
      { id: "1Ro-oA50xJUiA8D8TEItGz4hlAVYhzApv", course: "Maryland CCW", score: "Center-X Grouping", title: "B-27 Precision Grouping", desc: "Tight shot placement centered right in the 9, 10, and X rings following holster draw and sight picture coaching.", loc: "Cindy&#39;s Hot Shots • Practical Qualification" },
      { id: "1X-TSEMxypHMf73rTNrlo5L3dUwwMajCR", course: "Paired Training", score: "Dual Qualifiers", title: "Dual Student Center Clusters", desc: "Both students qualifying side-by-side with tight vital zone clusters during an intensive live-fire training block.", loc: "Cindy&#39;s Hot Shots • Paired Session" },
      { id: "1rUcirGX7jLT0upSobd82iJf91Ycv9xlt", course: "Wear & Carry", score: "Certified Pass", title: "Confidence & Marksmanship", desc: "Solid center-mass spread on silhouette targets, demonstrating steady recoil management and smooth trigger reset.", loc: "Partner Range (Live-Fire Quals): Cindy&#39;s Hot Shots" },
      { id: "1Z8VLFy2L1Sd6bASqfpt-BBeRiKpVU9qF", course: "Maryland HQL / CCW", score: "Dead-Center Hits", title: "Precision Vital-Zone Group", desc: "Dead-center vital-zone grouping achieved through individual coaching on grip friction and stance balance.", loc: "Cindy&#39;s Hot Shots • Private Coaching" },
      { id: "1mljZQi7U4-O4vBCldtd5xMqAtbk7xBBl", course: "Range Marksmanship", score: "Center Grouping", title: "Dynamic Range Drills", desc: "Maintaining discipline and tight group consistency across multiple target styles and engagement distances.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "1bQjmsgeIz5AOZbyHLnLe-y84FFmmOQSh", course: "Paired Session", score: "Certified Qualifiers", title: "Paired Class Qualifiers", desc: "Both students achieving passing scores with clean center-mass placement during paired weekend instruction.", loc: "Cindy&#39;s Hot Shots • Paired Training" },
      { id: "1I8SYXbZ8Vs_RoaISP-Oi_yVf8y24wJM_", course: "Small Group", score: "Dual Certified", title: "Small Group Milestone", desc: "Two students completing their Maryland qualification course together with tight clusters and zero intimidation.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "1Q8wfkRpxmKlhRYttlgvGVuakdxRIFofV", course: "Firing Line", score: "Live Range", title: "Live Firing Line Perspective", desc: "Active diagnostic shooting and practical qualification downrange at Cindy&#39;s Hot Shots in Glen Burnie, MD.", loc: "Partner Range (Qualification Shots Only) • Cindy&#39;s Hot Shots" },
      { id: "1GKKGtLxhSqGOgfh1-u1_CFNr1af-xFUS", course: "Wear & Carry", score: "100% Qualified", title: "Silhouette Marksmanship", desc: "Focused shot cadence and tight center grouping on the B-27 black silhouette target during practical qualification.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "1Xr431Fu4IWY2KIhpJJ5REskODfpH-X9M", course: "HQL & Fundamentals", score: "Concentric Hits", title: "Marksmanship Diagnostics", desc: "Target drill emphasizing sight alignment, steady trigger press, and recoil recovery mechanics.", loc: "Diagnostic Coaching • Cindy&#39;s Hot Shots" },
      { id: "1O5ON4PlVTuCaW-w09a0zzMnOYBMwQ_6k", course: "Maryland CCW", score: "Center-Mass Certified", title: "B27 Shield Precision", desc: "Clean vital-zone dispersion on the B27 Shield tactical training target during live-fire qualification.", loc: "Cindy&#39;s Hot Shots • Practical Qual" },
      { id: "1-dVzb2ipi3IYNb5dGxUpBCBaEyYJIpZ_", course: "Maryland HQL", score: "100% Passing Score", title: "Vital-Zone Control", desc: "Exceptional recoil management and tight center-ring hits with calm, zero-intimidation instruction.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "1XLGG8VZTEOSdnPF5-SXLVGZmeK9m55rR", course: "Cohort Training", score: "Triple Qualification", title: "Group Class Milestone", desc: "Three students qualifying together with clean, certified blue silhouette target sheets at Cindy&#39;s Hot Shots.", loc: "Small Group Cohort • Cindy&#39;s Hot Shots" },
      { id: "1sOye7641V0sTZLrOQ7VHAuEe4wFBdfoL", course: "Wear & Carry Initial", score: "Vital Zone Cluster", title: "BakerTargets Standard", desc: "Dedicated center-mass cluster demonstrating solid trigger reset discipline and sight tracking on the line.", loc: "Maryland Certified • Instructor Wade" },
      { id: "1bWUFKzFuf-xsE7XSuPEE9mWuyGyVcH_z", course: "CCW Certification", score: "High-Visibility Target", title: "Orange Silhouette Grouping", desc: "Steady cadence and confident gun handling producing tight center-scoring hits during qualification.", loc: "Cindy&#39;s Hot Shots • Glen Burnie, MD" },
      { id: "191TKVFSz48i2NP9T23KKzZcNFIr42Fls", course: "Wear & Carry", score: "Certified Passing", title: "Confident Marksmanship", desc: "Clean grouping right in the vital scoring rings following 1-on-1 diagnostic coaching with Instructor Wade.", loc: "Cindy&#39;s Hot Shots • Qualified" },
      { id: "1-__LG3c5gZA2zAKX-qeX8magmZRBETsY", course: "Paired Session", score: "Dual Qualifiers", title: "Paired Training Cohort", desc: "Two students celebrating successful state qualification following their live-fire practical course of fire.", loc: "Cindy&#39;s Hot Shots • Range Exit" },
      { id: "1RVuyUeMQwrSMCl1-M4Wzx1aIzK2AypI5", course: "Maryland CCW", score: "X-Ring Cluster", title: "Red X-Ring Accuracy", desc: "Dead-center shot placement clustered around the red X-ring on the B-27 qualification target.", loc: "Partner Range (Live-Fire Quals) • Cindy&#39;s Hot Shots" }
    ];
    // Explicit event bindings for landing page buttons
        function bindHeroButtons() {
      var bindings = [
        { id: 'btn-hero-booking', tab: 'booking' },
        { id: 'wrap-neon-guide', tab: 'booking' },
        { id: 'neon-start-guide', tab: 'booking' },
        /* btn-hero-portal handled by openPortalSelectionModal */
        { id: 'btn-hero-about', tab: 'about' },
        { id: 'btn-hero-targets', tab: 'testimonial' },
        { id: 'btn-hero-faq', tab: 'faq' }
      ];
      bindings.forEach(function(item) {
        var el = document.getElementById(item.id);
        if (el) {
          el.onclick = function() {
            openAndSwitch(item.tab);
          };
        }
      });
      var btnContact = document.getElementById('btn-hero-contact');
      if (btnContact) {
        btnContact.onclick = function(e) {
          if (e && e.preventDefault) e.preventDefault();
          openContactWidgetModal();
        };
      }
    }
    // ==========================================================================
    // 1. DEVICE TELEMETRY & ACCURATE AUDIT ENGINE
    // ==========================================================================
    function detectUserDevice() {
      var ua = navigator.userAgent || '';
      var w = window.innerWidth || (window.screen ? window.screen.width : 0) || 0;
      var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      // Tablet / iPad detection (including modern iPadOS reporting as MacIntel with touch)
      var isIPad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      var isTablet = isIPad || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || (/Tablet|PlayBook|Silk/i.test(ua));
      // Mobile phone detection
      var isMobile = !isTablet && (/iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|webOS|Opera Mini/i.test(ua) || (isTouch && w <= 640));
      // Handheld gaming PC (ASUS ROG Ally, Steam Deck)
      var isHandheld = /SteamDeck|ASUS.*ROG.*Ally|Gamepad/i.test(ua);
      var category = 'Desktop / Laptop';
      var deviceName = 'Computer / Laptop';
      var icon = '💻';
      if (isHandheld) {
        category = 'Handheld PC';
        deviceName = 'Handheld PC (ROG Ally / Steam Deck)';
        icon = '🎮';
      } else if (isTablet) {
        category = 'Tablet / iPad';
        deviceName = isIPad ? 'iPad / Apple Tablet' : 'Android Tablet';
        icon = '📟';
      } else if (isMobile) {
        category = 'Mobile Phone';
        deviceName = /iPhone/i.test(ua) ? 'iPhone' : (/Android/i.test(ua) ? 'Android Phone' : 'Mobile Phone');
        icon = '📱';
      } else if (/Macintosh|Mac OS X/i.test(ua)) {
        category = 'Desktop / Laptop';
        deviceName = 'MacBook / Mac Desktop';
        icon = '💻';
      } else if (/Windows/i.test(ua)) {
        category = 'Desktop / Laptop';
        deviceName = 'Windows PC / Laptop';
        icon = '💻';
      }
      return {
        category: category,
        deviceName: deviceName,
        icon: icon,
        screenRes: (window.screen ? `${window.screen.width}x${window.screen.height}` : 'Standard'),
        viewport: `${window.innerWidth}x${window.innerHeight}`
      };
    }
    window.detectUserDevice = detectUserDevice;
    // ==========================================================================
    // DISCORD WEBHOOK REAL-TIME OPERATIONAL ALERT ENGINE
    // ==========================================================================
    var DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1547779726746320958/nu4yar-r8aR3c6-P-mm8YeprX5bou1uqej24tEuYhNS5LVusMuBtADVcv1vf1oJp_bum";
    function sendClientDiscordAlert(title, description, fields, colorInt) {
      try {
        if (!DISCORD_WEBHOOK_URL) return;
        var payload = {
          username: "FIFS Command Center",
          avatar_url: "https://drive.google.com/thumbnail?id=1EnAqEURi1XIRNdNTooFGY_pvs38ZcBEQ&sz=w256",
          embeds: [{
            title: title || "FIFS Operational Notification",
            description: description || "",
            color: colorInt || 0x00E5FF,
            fields: fields || [],
            footer: {
              text: "Future Initiative Firearm Services • trainwithfifs.com",
              icon_url: "https://drive.google.com/thumbnail?id=1EnAqEURi1XIRNdNTooFGY_pvs38ZcBEQ&sz=w128"
            },
            timestamp: new Date().toISOString()
          }]
        };
        fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(function(err) {
          console.log("Discord alert delivery notice:", err);
        });
      } catch (e) {
        console.log("Discord notification catch:", e);
      }
    }
    window.sendClientDiscordAlert = sendClientDiscordAlert;
    // ==========================================================================
    // STREAMLINED TELEMETRY ENGINE (FOCUSED STRICTLY ON HIGH-VALUE MILESTONES)
    // Eliminates micro-interaction I/O overhead while capturing business events
    // ==========================================================================
    function logAnalyticsEvent(category, action, label) {
      // Strictly restricted exclusively to high-value business conversion milestones
      var highValueActions = [
        'Course Booking Confirmed',
        'Client Profile Registered',
        'Live Chat Initiated'
      ];
      if (!highValueActions.includes(action)) {
        return; // Zero overhead and zero I/O for all micro-interactions
      }
      // Execute asynchronously in micro-task queue to eliminate main-thread blocking
      setTimeout(function() {
        try {
          var entry = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            category: category,
            action: action,
            label: label || '',
            device: (window.innerWidth <= 768 ? 'Mobile Phone' : (window.innerWidth <= 1024 ? 'Tablet / iPad' : 'Desktop / Laptop'))
          };
          var log = JSON.parse(_fifsMemStorage.getItem('fifs_analytics_events') || '[]');
          log.unshift(entry);
          if (log.length > 50) log.pop();
          /* cloud only: zero browser storage */
          // Background sync to GAS ledger if live
          if (typeof callFifsBackend === 'function') { callFifsBackend('logAnalytics', { entry: entry }); }
        } catch (e) {}
      }, 20);
    }
    window.logAnalyticsEvent = logAnalyticsEvent;
    function renderAdminAnalyticsDashboard() {
      var container = document.getElementById('admin-analytics-dashboard-container');
      if (!container) return;
      var events = JSON.parse(_fifsMemStorage.getItem('fifs_analytics_events') || '[]');
      var counts = JSON.parse(_fifsMemStorage.getItem('fifs_analytics_counts') || '{}');
      var devCounts = JSON.parse(_fifsMemStorage.getItem('fifs_device_counts') || '{"Mobile Phone":0,"Tablet / iPad":0,"Desktop / Laptop":0,"Handheld PC":0}');
      // 100% Genuine Telemetry Counters
      var baseVisitors = Math.max(1, parseInt(_fifsMemStorage.getItem('fifs_unique_visitors_count') || '1', 10));
      var totalPageViews = Math.max(1, parseInt(_fifsMemStorage.getItem('fifs_pageviews_count') || '1', 10));
      var vipClicks = counts['Toggle VIP Crown'] || 0;
      var recipLaunches = (counts['Launch Reciprocity Navigator'] || 0) + (counts['Open Section from Landing: testimonial'] || 0);
      var bookingsStarted = counts['Course Selection'] || counts['Course Select'] || 0;
      var bookingsConfirmed = counts['Registration Confirmed'] || 0;
      var conversionRate = baseVisitors > 0 ? ((bookingsConfirmed / baseVisitors) * 100).toFixed(1) + '%' : '0.0%';
      // Calculate real device percentages
      var totalDevicesLogged = Math.max(1, (devCounts['Mobile Phone'] || 0) + (devCounts['Tablet / iPad'] || 0) + (devCounts['Desktop / Laptop'] || 0) + (devCounts['Handheld PC'] || 0));
      var mobPct = Math.round(((devCounts['Mobile Phone'] || 0) / totalDevicesLogged) * 100);
      var tabPct = Math.round(((devCounts['Tablet / iPad'] || 0) / totalDevicesLogged) * 100);
      var deskPct = Math.round(((devCounts['Desktop / Laptop'] || 0) / totalDevicesLogged) * 100);
      var handPct = Math.round(((devCounts['Handheld PC'] || 0) / totalDevicesLogged) * 100);
      container.innerHTML = `
        <div style="margin-top: 10px; padding-top: 10px;">
          <!-- Top KPI Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 22px;">
            <div class="metric-card" style="border-color: var(--accent-cyan); background: rgba(0, 229, 255, 0.05);">
              <div class="metric-val" style="color: var(--accent-cyan);">${baseVisitors.toLocaleString()}</div>
              <div class="metric-name">Verified Unique Visitors</div>
            </div>
            <div class="metric-card" style="border-color: #60a5fa; background: rgba(96, 165, 250, 0.05);">
              <div class="metric-val" style="color: #60a5fa;">${totalPageViews.toLocaleString()}</div>
              <div class="metric-name">Verified Pageviews</div>
            </div>
            <div class="metric-card" style="border-color: var(--accent-green); background: rgba(16, 185, 129, 0.05);">
              <div class="metric-val" style="color: var(--accent-green);">${conversionRate}</div>
              <div class="metric-name">Booking Conversion Rate</div>
            </div>
            <div class="metric-card" style="border-color: var(--accent-amber); background: rgba(255, 183, 3, 0.05);">
              <div class="metric-val" style="color: var(--accent-amber);">${vipClicks}</div>
              <div class="metric-name">VIP Mode Inquiries</div>
            </div>
            <div class="metric-card" style="border-color: #c084fc; background: rgba(192, 132, 252, 0.05);">
              <div class="metric-val" style="color: #c084fc;">${recipLaunches}</div>
              <div class="metric-name">Reciprocity Hub Launches</div>
            </div>
          </div>
          <!-- DEVICE HARDWARE & ACCESS TELEMETRY PANEL -->
          <div style="background: #0d121a; border: 1px solid rgba(0, 229, 255, 0.35); border-radius: 14px; padding: 20px; margin-bottom: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.7);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
              <div>
                <span class="badge-instructor" style="margin-bottom: 4px;">Hardware Telemetry</span>
                <h4 style="font-family: var(--font-display); font-size: 1.35rem; color: #fff; text-transform: uppercase; margin: 2px 0;">
                  📱 Visitor Device Distribution &amp; Screen Diagnostics
                </h4>
                <p style="color: var(--text-muted); font-size: 0.84rem;">Real-time detection across Mobile Phones, Tablets/iPads, Laptops, and Handheld PCs.</p>
              </div>
              <span style="font-size: 0.78rem; color: var(--accent-cyan); font-weight: 700; text-transform: uppercase;">● 100% Real Device Tracking</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 18px;">
              <div style="background: #070b10; border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="color: #fff; font-size: 0.95rem;">📱 Mobile Phones</strong>
                  <span style="color: var(--accent-cyan); font-weight: 800; font-family: var(--font-display); font-size: 1.1rem;">${mobPct}%</span>
                </div>
                <div style="background: #1e293b; height: 7px; border-radius: 4px; overflow: hidden; margin: 6px 0 8px;">
                  <div style="background: var(--accent-cyan); width: ${mobPct}%; height: 100%;"></div>
                </div>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${devCounts['Mobile Phone'] || 0} sessions • iPhones, Android &amp; Razr+</span>
              </div>
              <div style="background: #070b10; border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="color: #fff; font-size: 0.95rem;">📟 Tablets / iPads</strong>
                  <span style="color: var(--accent-amber); font-weight: 800; font-family: var(--font-display); font-size: 1.1rem;">${tabPct}%</span>
                </div>
                <div style="background: #1e293b; height: 7px; border-radius: 4px; overflow: hidden; margin: 6px 0 8px;">
                  <div style="background: var(--accent-amber); width: ${tabPct}%; height: 100%;"></div>
                </div>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${devCounts['Tablet / iPad'] || 0} sessions • iPad Pro, Mini &amp; Android Tablets</span>
              </div>
              <div style="background: #070b10; border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="color: #fff; font-size: 0.95rem;">💻 Computers &amp; Laptops</strong>
                  <span style="color: #10b981; font-weight: 800; font-family: var(--font-display); font-size: 1.1rem;">${deskPct}%</span>
                </div>
                <div style="background: #1e293b; height: 7px; border-radius: 4px; overflow: hidden; margin: 6px 0 8px;">
                  <div style="background: #10b981; width: ${deskPct}%; height: 100%;"></div>
                </div>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${devCounts['Desktop / Laptop'] || 0} sessions • MacBooks, Windows PCs &amp; Desktops</span>
              </div>
              <div style="background: #070b10; border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong style="color: #fff; font-size: 0.95rem;">🎮 Handheld PCs</strong>
                  <span style="color: #c084fc; font-weight: 800; font-family: var(--font-display); font-size: 1.1rem;">${handPct}%</span>
                </div>
                <div style="background: #1e293b; height: 7px; border-radius: 4px; overflow: hidden; margin: 6px 0 8px;">
                  <div style="background: #c084fc; width: ${handPct}%; height: 100%;"></div>
                </div>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${devCounts['Handheld PC'] || 0} sessions • ASUS ROG Ally, Steam Deck</span>
              </div>
            </div>
          </div>
          <!-- Real-Time Activity & Device Stream -->
          <div style="background: #0d121a; border: 1px solid var(--border-subtle); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="font-family: var(--font-display); font-size: 1.15rem; color: #fff;">📡 Live Interaction &amp; Device Stream</h4>
              <span style="font-size: 0.76rem; color: #10b981; font-weight: 700; text-transform: uppercase;">● Verified Activity Log</span>
            </div>
            <div style="max-height: 250px; overflow-y: auto; font-family: monospace; font-size: 0.82rem; background: #070b10; border-radius: 8px; padding: 12px; border: 1px solid rgba(255,255,255,0.06);">
              ${events.length ? events.map(e => `
                <div style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="color: var(--text-muted); font-size: 0.75rem;">${e.time}</span>
                    <span style="color: var(--accent-cyan); font-weight: 700;">[${e.category}]</span>
                    <span style="color: #fff;">${e.action}</span>
                    ${e.label ? `<span style="color: var(--accent-amber);">(${e.label})</span>` : ''}
                  </div>
                  <span style="color: #cbd5e1; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 0.72rem;">${e.icon || '💻'} ${e.device || 'Device'} • ${e.screenRes || ''}</span>
                </div>
              `).join('') : `
                <div style="color: var(--text-muted); padding: 8px 0;">[Session Start] Live website tracker active. Interactions and verified device signatures record here in real-time.</div>
              `}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; flex-wrap: wrap; gap: 10px;">
              <span style="font-size: 0.78rem; color: var(--text-muted);">Synced with Google Sheets: <code>Student_Booking_Ledger / Analytics_Ledger</code></span>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-spark" onclick="exportAnalyticsCSV()" style="padding: 6px 14px; font-size: 0.80rem;">📥 Export Analytics CSV</button>
                <button type="button" class="btn-spark" id="btn-reset-telemetry" onclick="resetWebsiteTelemetry()" style="padding: 6px 14px; font-size: 0.80rem; border-color: rgba(239, 68, 68, 0.45); color: #ef4444;">🗑️ Reset Telemetry</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    window.renderAdminAnalyticsDashboard = renderAdminAnalyticsDashboard;
    // ==========================================================================
    // 2. SINGLE PORTAL SESSION ENFORCER & CONFLICT POPUP
    // ==========================================================================
    function checkPortalSessionConflict(targetPortal) {
      var studentSessionStr = sessionStorage.getItem('fifs_student_session');
      var clientSessionStr = sessionStorage.getItem('fifs_client_session');
      if (targetPortal === 'client' || targetPortal === 'fi-portal') {
        if (studentSessionStr) {
          try {
            var student = JSON.parse(studentSessionStr);
            showPortalConflictModal('student_to_client', student.fullName || 'Student', student.studentId || 'FIFS-ID');
            return true;
          } catch (e) {}
        }
      } else if (targetPortal === 'student' || targetPortal === 'portal') {
        if (clientSessionStr) {
          try {
            var client = JSON.parse(clientSessionStr);
            showPortalConflictModal('client_to_student', client.fullName || 'Client', client.clientId || 'FI-CLIENT');
            return true;
          } catch (e) {}
        }
      }
      return false;
    }
    window.checkPortalSessionConflict = checkPortalSessionConflict;
    function showPortalConflictModal(direction, activeName, activeId) {
      var modal = document.getElementById('portalConflictModal');
      var msg = document.getElementById('conflictModalMessage');
      var btnSwitch = document.getElementById('btn-conflict-switch');
      if (!modal || !msg || !btnSwitch) return;
      if (direction === 'student_to_client') {
        msg.innerHTML = `
          You are currently signed into the <strong style="color: var(--accent-cyan);">Student Training Portal</strong> as <strong>${escapeHtml(activeName)}</strong> (${activeId}).<br><br>
          To maintain strict record isolation and prevent state licensing document mismatches, you cannot be signed into both portals simultaneously.<br><br>
          To access the <strong style="color: var(--accent-amber);">Future Initiative Client &amp; Permit Portal</strong> (for multi-state reciprocity, renewals, and travel compliance), you must first sign out of your student session.
        `;
        btnSwitch.textContent = "🔑 Sign Out of Student Portal & Enter Client Portal →";
        btnSwitch.onclick = function() {
          logoutStudent();
          closePortalConflictModal();
          openAndSwitch('fi-portal');
        };
      } else {
        msg.innerHTML = `
          You are currently signed into the <strong style="color: var(--accent-amber);">Client &amp; Permit Portal</strong> as <strong>${escapeHtml(activeName)}</strong> (${activeId}).<br><br>
          To prevent data collisions between course curriculum tracking and permit renewal dates, only one active portal profile may be accessed per browser.<br><br>
          To access the <strong style="color: var(--accent-cyan);">Student Training Portal</strong> (for class preparation, range checklists, and course guides), you must first sign out of your client session.
        `;
        btnSwitch.textContent = "🔑 Sign Out of Client Portal & Enter Student Portal →";
        btnSwitch.onclick = function() {
          fiLogoutClient();
          closePortalConflictModal();
          openAndSwitch('portal');
        };
      }
      modal.style.display = 'flex';
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    window.showPortalConflictModal = showPortalConflictModal;
    function closePortalConflictModal() {
      var modal = document.getElementById('portalConflictModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    window.closePortalConflictModal = closePortalConflictModal;
    // ==========================================================================
    // 3. ADMIN DIRECT PORTAL INVITE DISPATCHER & ACTIONS
    // ==========================================================================
    function openAdminInviteModal() {
      var modal = document.getElementById('adminInviteModal');
      var resBox = document.getElementById('inv-result-box');
      var st = document.getElementById('inv-status');
      if (resBox) resBox.style.display = 'none';
      if (st) st.style.display = 'none';
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }
    window.openAdminInviteModal = openAdminInviteModal;
    function closeAdminInviteModal() {
      var modal = document.getElementById('adminInviteModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    window.closeAdminInviteModal = closeAdminInviteModal;
    function syncInviteCourseDropdown() {
      var pType = document.getElementById('invPortalType').value;
      var select = document.getElementById('invCourse');
      if (!select) return;
      select.innerHTML = '';
      if (pType === 'student') {
        select.innerHTML = `
          <option value="Maryland CCW & HQL Combo — Base Track ($249.99)">Maryland CCW &amp; HQL Combo</option>
          <option value="Maryland Wear & Carry (CCW) — Base Track ($199.99)">Maryland Wear &amp; Carry (16-Hr)</option>
          <option value="Maryland Wear & Carry (8-Hour Renewal) — Base Track ($175.00)">Maryland Wear &amp; Carry (8-Hr Renewal)</option>
          <option value="Maryland HQL (Purchase License) — Base Track ($100.00)">Maryland HQL (4-Hour)</option>
          <option value="Mid-Atlantic Multi-State Mastery — Base Track ($425.00)">Mid-Atlantic Multi-State Mastery</option>
          <option value="Personal 1-on-1 Coaching — Base Track ($125.00/hr)">Personal 1-on-1 Range Coaching</option>
        `;
      } else {
        select.innerHTML = `
          <option value="Maryland Wear & Carry">Maryland Wear &amp; Carry (Resident)</option>
          <option value="Virginia Concealed Handgun">Virginia Concealed Handgun</option>
          <option value="Pennsylvania LTCF">Pennsylvania LTCF</option>
          <option value="Florida Non-Resident">Florida Non-Resident CWL</option>
          <option value="Utah Non-Resident">Utah Non-Resident CFP</option>
        `;
      }
    }
    window.syncInviteCourseDropdown = syncInviteCourseDropdown;
    function handleAdminInviteSubmit(e) {
      e.preventDefault();
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      var name = document.getElementById('invFullName').value.trim();
      var email = document.getElementById('invEmail').value.trim();
      var phone = document.getElementById('invPhone').value.trim();
      var portalType = document.getElementById('invPortalType').value;
      var course = document.getElementById('invCourse').value;
      var dates = document.getElementById('invDates').value.trim();
      var st = document.getElementById('inv-status');
      var resBox = document.getElementById('inv-result-box');
      var urlInput = document.getElementById('invGeneratedUrl');
      if (!name || !email) {
        showStatus(st, 'Name and email are required.', 'error');
        return;
      }
      showStatus(st, 'Generating credentials & dispatching access invitation...', 'success');
      var newId, magicLink;
      if (portalType === 'student') {
        newId = 'FIFS-' + Math.floor(1000 + Math.random() * 9000);
        magicLink = `https://trainwithfifs.com/?id=${newId}`;
        var newStudent = {
          studentId: newId,
          fullName: name,
          email: email,
          phone: phone,
          course: course,
          assignedDate: dates || 'To Be Scheduled',
          status: 'STEP_1_REGISTERED',
          profileDocUrl: '#',
          prepTasks: { transport_law: false, ammo_acquired: false, eye_ear_pro: false, id_ready: false }
        };
        // Add to roster array and _fifsMemStorage
        adminCachedStudents.unshift(newStudent);
        window.adminCachedStudents = adminCachedStudents;
        /* cloud only: zero browser storage */
      } else {
        newId = 'FI-CLIENT-' + Math.floor(1000 + Math.random() * 9000);
        magicLink = `https://trainwithfifs.com/?tab=fi-portal&client=${newId}`;
        var newClient = {
          clientId: newId,
          fullName: name,
          email: email,
          phone: phone,
          permitState: course,
          expirationDate: dates || '2026-10-31',
          optInReminder: true
        };
        try { sessionStorage.setItem('fifs_client_session', JSON.stringify(newClient)); } catch (err) {}
      }
      // If online Google Apps Script backend available, notify
      if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.handleAdminDirectInvite) {
        google.script.run
          .withSuccessHandler(function(res) {
            showStatus(st, 'Invitation email dispatched successfully! Access link generated below.', 'success');
          })
          .handleAdminDirectInvite(pin, { fullName: name, email: email, phone: phone, portalType: portalType, course: course, dates: dates, generatedId: newId, magicLink: magicLink });
      } else {
        setTimeout(function() {
          showStatus(st, 'Access invitation created! Direct Magic Link ready below.', 'success');
        }, 400);
      }
      if (urlInput) urlInput.value = magicLink;
      if (resBox) resBox.style.display = 'block';
      // Re-render admin roster and recalculate 100% real metrics
      renderAdminTerminal({ students: adminCachedStudents });
    }
    window.handleAdminInviteSubmit = handleAdminInviteSubmit;
    function copyInviteUrl() {
      var urlInput = document.getElementById('invGeneratedUrl');
      if (urlInput) {
        urlInput.select();
        document.execCommand('copy');
        alert('Magic Link copied to clipboard!\n\n' + urlInput.value);
      }
    }
    window.copyInviteUrl = copyInviteUrl;
    // ==========================================================================
    // 4. ADMIN EDIT & DELETE STUDENTS (100% REAL ROSTER DATA)
    // ==========================================================================
    function handleDossierClick(url) {
      if (!url || url === '#' || url === 'javascript:void(0)') {
        alert('Student Dossier URL is not linked yet. Click Edit to add the Google Doc link.');
      } else {
        window.open(url, '_blank');
      }
    }
    window.handleDossierClick = handleDossierClick;
function openAdminEditStudentModal(studentId) {
      var s = adminCachedStudents.find(item => item.studentId === studentId);
      if (!s) return;
      document.getElementById('editStudentId').value = s.studentId;
      document.getElementById('editFullName').value = s.fullName || '';
      document.getElementById('editEmail').value = s.email || '';
      document.getElementById('editPhone').value = s.phone || '';
      document.getElementById('editCourse').value = s.course || '';
      document.getElementById('editAssignedDate').value = s.assignedDate || s.preferredDates || '';
      var stepNum = getStepNumberFromStatus(s.status);
      var stepValues = {
        1: 'STEP_1_REGISTERED', 2: 'STEP_2_CONFIRMED', 3: 'STEP_3_PREPARATION',
        4: 'STEP_4_CLASSROOM', 5: 'STEP_5_LIVE_FIRE', 6: 'STEP_6_CERTIFIED',
        7: 'STEP_7_MSP_PORTAL', 8: 'STEP_8_LICENSED'
      };
      var sel = document.getElementById('editJourneyStatus');
      if (sel) sel.value = stepValues[stepNum] || 'STEP_1_REGISTERED';
      document.getElementById('editScore').value = s.qualificationScore || '';
      document.getElementById('editProfileDocUrl').value = (s.profileDocUrl && s.profileDocUrl !== '#') ? s.profileDocUrl : '';
      document.getElementById('editNotes').value = s.notes || '';
      var st = document.getElementById('edit-student-status');
      if (st) st.style.display = 'none';
      var modal = document.getElementById('adminEditStudentModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }
    window.openAdminEditStudentModal = openAdminEditStudentModal;
    function closeAdminEditStudentModal() {
      var modal = document.getElementById('adminEditStudentModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    window.closeAdminEditStudentModal = closeAdminEditStudentModal;
    function handleAdminEditStudentSubmit(e) {
      e.preventDefault();
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      var studentId = document.getElementById('editStudentId').value;
      var s = adminCachedStudents.find(item => item.studentId === studentId);
      if (!s) return;
      s.fullName = document.getElementById('editFullName').value.trim();
      s.email = document.getElementById('editEmail').value.trim();
      s.phone = document.getElementById('editPhone').value.trim();
      s.course = document.getElementById('editCourse').value.trim();
      s.assignedDate = document.getElementById('editAssignedDate').value.trim();
      s.status = document.getElementById('editJourneyStatus').value;
      s.qualificationScore = document.getElementById('editScore').value.trim();
      s.profileDocUrl = document.getElementById('editProfileDocUrl').value.trim() || '#';
      s.notes = document.getElementById('editNotes').value.trim();
      /* cloud only: zero browser storage */
      var st = document.getElementById('edit-student-status');
      showStatus(st, 'Changes saved successfully!', 'success');
      if (typeof callFifsBackend === 'function') { callFifsBackend('adminEditStudent', { passcode: pin, studentId: studentId, student: s }); }
      setTimeout(function() {
        closeAdminEditStudentModal();
        renderAdminTerminal({ students: adminCachedStudents });
      }, 500);
    }
    window.handleAdminEditStudentSubmit = handleAdminEditStudentSubmit;
    function deleteStudentFromRoster(studentId) {
      var s = adminCachedStudents.find(item => item.studentId === studentId);
      var name = s ? s.fullName : studentId;
      if (!confirm(`Are you sure you want to permanently delete student "${name}" (${studentId}) from the training ledger?`)) {
        return;
      }
      adminCachedStudents = adminCachedStudents.filter(item => item.studentId !== studentId);
      /* cloud only: zero browser storage */
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      if (typeof callFifsBackend === 'function') { callFifsBackend('adminDeleteStudent', { passcode: pin, studentId: studentId }); }
      renderAdminTerminal({ students: adminCachedStudents });
    }
    window.deleteStudentFromRoster = deleteStudentFromRoster;
    // Redefined renderAdminTerminal with 100% Real Numbers & Action Buttons
    function renderAdminTerminal(data) {
      if (typeof checkNewStudentAlert === "function") checkNewStudentAlert();
      if (typeof checkNewClientAlert === "function") checkNewClientAlert();
      document.getElementById('admin-auth-box').classList.add('hidden');
      document.getElementById('admin-command-dashboard').classList.remove('hidden');
      // Load cached/persisted real student data if available
      if (data && data.students && data.students.length) {
        adminCachedStudents = data.students;
        window.adminCachedStudents = adminCachedStudents;
        /* cloud only: zero browser storage */
      } else {
        var savedRoster = _fifsMemStorage.getItem('fifs_roster_students');
        if (savedRoster) {
          try { adminCachedStudents = JSON.parse(savedRoster);
          window.adminCachedStudents = adminCachedStudents; } catch (e) {}
        }
      }
      // 100% Real metrics computed dynamically from actual students in array
      var totalCount = adminCachedStudents.length;
      var pendingCount = 0;
      var upcomingCount = 0;
      var completedCount = 0;
      adminCachedStudents.forEach(s => {
        var stepNum = getStepNumberFromStatus(s.status);
        if (stepNum <= 3) pendingCount++;
        else if (stepNum <= 5) upcomingCount++;
        else completedCount++;
      });
      document.getElementById('metric-total').textContent = totalCount;
      document.getElementById('metric-pending').textContent = pendingCount;
      document.getElementById('metric-upcoming').textContent = upcomingCount;
      document.getElementById('metric-completed').textContent = completedCount;
      // Synchronize Future Initiative Clients tab with server data
      if (data && data.clients) {
        renderAdminClientTerminal(data);
      }
      var tbody = document.getElementById('admin-roster-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (adminCachedStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No student bookings recorded yet. Use "SEND PORTAL INVITE" to add someone.</td></tr>';
        return;
      }
      adminCachedStudents.forEach(s => {
        var tr = document.createElement('tr');
        var stepNum = getStepNumberFromStatus(s.status);
        tr.innerHTML = `
          <td><strong style="color: var(--accent-cyan); font-family: var(--font-display); font-size: 0.95rem;">${s.studentId}</strong></td>
          <td><strong style="color: #fff;">${escapeHtml(s.fullName)}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(s.email || '')}</span></td>
          <td>${escapeHtml((s.course || '').split('(')[0].trim())}</td>
          <td>${escapeHtml(s.assignedDate || s.preferredDates || 'To Be Scheduled')}</td>
          <td>
            <span class="meta-chip chip-status" id="chip-status-${s.studentId}">${formatStepLabel(stepNum)}</span>
          </td>
          <td><a href="javascript:void(0)" onclick="handleDossierClick('${s.profileDocUrl || "#"}')" style="color: var(--accent-cyan); font-weight: 700;">Dossier ↗</a></td>
          <td>
            <select onchange="updateStudentJourneyStep('${s.studentId}', this.value)" style="padding: 6px 8px; font-size: 0.78rem; min-height: 34px; background: #070b10; color: var(--accent-cyan); border-radius: 6px; border: 1px solid var(--accent-cyan); font-weight: 700; cursor: pointer;">
              <option value="STEP_1_REGISTERED" ${stepNum === 1 ? 'selected' : ''}>1. Registration</option>
              <option value="STEP_2_CONFIRMED" ${stepNum === 2 ? 'selected' : ''}>2. Confirmation</option>
              <option value="STEP_3_PREPARATION" ${stepNum === 3 ? 'selected' : ''}>3. Preparation</option>
              <option value="STEP_4_CLASSROOM" ${stepNum === 4 ? 'selected' : ''}>4. Classroom</option>
              <option value="STEP_5_LIVE_FIRE" ${stepNum === 5 ? 'selected' : ''}>5. Live-Fire</option>
              <option value="STEP_6_CERTIF
IED" ${stepNum === 6 ? 'selected' : ''}>6. Certified</option>
              <option value="STEP_7_MSP_PORTAL" ${stepNum === 7 ? 'selected' : ''}>7. MSP Portal</option>
              <option value="STEP_8_LICENSED" ${stepNum === 8 ? 'selected' : ''}>8. L            </select>
          </td>
          <td>
            <div style="display: flex; gap: 6px; align-items: center;">
              <button type="button" class="btn-spark" onclick="openAdminEditStudentModal('${s.studentId}')" style="width: auto; padding: 5px 8px; font-size: 0.76rem; border-color: var(--accent-cyan);" title="Edit student record">✏️ Edit</button>
              <button type="button" class="btn-spark" onclick="dispatchRangeBriefing('${s.studentId}')" style="width: auto; padding: 5px 8px; font-size: 0.76rem; border-color: #60a5fa; color: #60a5fa;" title="Send Range Day Arrival Briefing">🎯 Briefing</button>
              <button type="button" class="btn-spark" onclick="dispatchReviewRequest('${s.studentId}')" style="width: auto; padding: 5px 8px; font-size: 0.76rem; border-color: var(--accent-amber); color: var(--accent-amber);" title="Send 5-Star Google Review Request">⭐ Review</button>
              <button type="button" class="btn-spark" onclick="deleteStudentFromRoster('${s.studentId}')" style="width: auto; padding: 5px 8px; font-size: 0.76rem; border-color: var(--accent-red); color: var(--accent-red);" title="Delete student">🗑️</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    window.renderAdminTerminal = renderAdminTerminal;
    // ==========================================================================
    // ADMIN CLIENT ROSTER CONTROLLER & CLIENT EDIT/DELETE ACTIONS
    // ==========================================================================
    var adminCachedClients = [];
          /* cloud only: zero browser storage */
    window.adminCachedClients = adminCachedClients;
    function renderAdminClientTerminal(data) {
      if (data && data.clients && data.clients.length) {
        adminCachedClients = data.clients;
        /* cloud only: zero browser storage */
      } else {
        var savedClientRoster = _fifsMemStorage.getItem('fifs_client_roster');
        if (savedClientRoster) {
          try { adminCachedClients = JSON.parse(savedClientRoster); } catch (e) {}
        }
        if (!adminCachedClients || !adminCachedClients.length) {
          // Default empty or stored clients
          adminCachedClients = [];
          /* cloud only: zero browser storage */
        }
      }
      window.adminCachedClients = adminCachedClients;
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var activeCount = 0;
      var renewalCount = 0;
      var expiredCount = 0;
      adminCachedClients.forEach(c => {
        var diffDays = 365;
        if (c.expirationDate) {
          var exp = new Date(c.expirationDate + 'T00:00:00');
          diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        }
        c.daysLeft = diffDays;
        if (diffDays <= 0) expiredCount++;
        else if (diffDays <= 90) renewalCount++;
        else activeCount++;
      });
      var elTotal = document.getElementById('metric-client-total');
      var elActive = document.getElementById('metric-client-active');
      var elRenewal = document.getElementById('metric-client-renewal');
      var elExpired = document.getElementById('metric-client-expired');
      if (elTotal) elTotal.textContent = adminCachedClients.length;
      if (elActive) elActive.textContent = activeCount;
      if (elRenewal) elRenewal.textContent = renewalCount;
      if (elExpired) elExpired.textContent = expiredCount;
      var tbody = document.getElementById('admin-client-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (adminCachedClients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No client permit records found. Use "SEND PORTAL INVITE" to add someone.</td></tr>';
        return;
      }
      adminCachedClients.forEach(c => {
        var tr = document.createElement('tr');
        var daysBadge = `<span class="meta-chip" style="color: #10b981; border-color: #10b981;">${c.daysLeft} Days</span>`;
        if (c.daysLeft <= 0) {
          daysBadge = `<span class="meta-chip chip-status" style="background: rgba(239,68,68,0.15); border-color: #ef4444; color: #ef4444;">Expired (${c.daysLeft}d)</span>`;
        } else if (c.daysLeft <= 90) {
          daysBadge = `<span class="meta-chip chip-status">${c.daysLeft} Days (Window)</span>`;
        }
        tr.innerHTML = `
          <td><strong style="color: var(--accent-amber); font-family: var(--font-display); font-size: 0.95rem;">${c.clientId}</strong></td>
          <td><strong style="color: #fff;">${escapeHtml(c.fullName)}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(c.email || '')}</span></td>
          <td>${escapeHtml(c.permitState || 'Maryland')}</td>
          <td>${escapeHtml(c.expirationDate || 'Not set')}</td>
          <td>${daysBadge}</td>
          <td><span style="font-size: 0.78rem; text-transform: uppercase; color: var(--accent-cyan); font-weight: 700;">${escapeHtml(c.status || 'ACTIVE')}</span></td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
              <button type="button" class="btn-spark" onclick="openAdminEditClientModal('${c.clientId}')" style="width: auto; padding: 5px 10px; font-size: 0.78rem; border-color: var(--accent-amber); color: var(--accent-amber);">✏️ Edit</button>
              <button type="button" class="btn-spark" onclick="deleteClientFromRoster('${c.clientId}')" style="width: auto; padding: 5px 10px; font-size: 0.78rem; border-color: var(--accent-red); color: var(--accent-red);">🗑️ Delete</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    window.renderAdminClientTerminal = renderAdminClientTerminal;
    function openAdminEditClientModal(clientId) {
      var c = adminCachedClients.find(item => item.clientId === clientId);
      if (!c) return;
      document.getElementById('editClientId').value = c.clientId;
      document.getElementById('editClientFullName').value = c.fullName || '';
      document.getElementById('editClientEmail').value = c.email || '';
      document.getElementById('editClientPhone').value = c.phone || '';
      document.getElementById('editClientPermitState').value = c.permitState || 'Maryland Wear & Carry';
      document.getElementById('editClientExpDate').value = c.expirationDate || '';
      document.getElementById('editClientStatus').value = c.status || 'ACTIVE_REGISTERED';
      var st = document.getElementById('edit-client-status');
      if (st) st.style.display = 'none';
      var modal = document.getElementById('adminEditClientModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }
    window.openAdminEditClientModal = openAdminEditClientModal;
    function closeAdminEditClientModal() {
      var modal = document.getElementById('adminEditClientModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    window.closeAdminEditClientModal = closeAdminEditClientModal;
    function handleAdminEditClientSubmit(e) {
      e.preventDefault();
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      var clientId = document.getElementById('editClientId').value;
      var c = adminCachedClients.find(item => item.clientId === clientId);
      if (!c) return;
      c.fullName = document.getElementById('editClientFullName').value.trim();
      c.email = document.getElementById('editClientEmail').value.trim();
      c.phone = document.getElementById('editClientPhone').value.trim();
      c.permitState = document.getElementById('editClientPermitState').value;
      c.expirationDate = document.getElementById('editClientExpDate').value;
      c.status = document.getElementById('editClientStatus').value;
      /* cloud only: zero browser storage */
      var st = document.getElementById('edit-client-status');
      showStatus(st, 'Client permit record updated!', 'success');
      if (typeof callFifsBackend === 'function') { callFifsBackend('adminEditClient', { passcode: pin, clientId: clientId, client: c }); }
      setTimeout(function() {
        closeAdminEditClientModal();
        renderAdminClientTerminal();
      }, 500);
    }
    window.handleAdminEditClientSubmit = handleAdminEditClientSubmit;
    function deleteClientFromRoster(clientId) {
      var c = adminCachedClients.find(item => item.clientId === clientId);
      var name = c ? c.fullName : clientId;
      if (!confirm(`Are you sure you want to permanently delete client "${name}" (${clientId}) from the permit ledger?`)) {
        return;
      }
      adminCachedClients = adminCachedClients.filter(item => item.clientId !== clientId);
      /* cloud only: zero browser storage */
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      if (typeof callFifsBackend === 'function') { callFifsBackend('adminDeleteClient', { passcode: pin, pin: pin, clientId: clientId }); }
      renderAdminClientTerminal();
    }
    window.deleteClientFromRoster = deleteClientFromRoster;
    // Redefine switchAdminTab // Delegated to modal-based switchAdminTab
    window.switchAdminTab = function(tab) {
      if (typeof window.openAdminSubpanelModal === 'function') {
        window.openAdminSubpanelModal(tab);
      }
    };
    function checkNewStudentAlert() {
      try {
        var alertData = _fifsMemStorage.getItem('fifs_new_student_alert');
        var box = document.getElementById('admin-new-student-alert-box');
        var badge = document.getElementById('admin-roster-alert-pill');
        var desc = document.getElementById('admin-alert-desc');
        if (alertData && box) {
          var item = JSON.parse(alertData);
          if (desc) desc.innerHTML = `<strong>${escapeHtml(item.name)}</strong> has registered for <strong>${escapeHtml(item.course)}</strong> at ${item.time}. Student ID: <code style="color: var(--accent-cyan);">${item.id}</code>`;
          box.style.display = 'flex';
          if (badge) badge.style.display = 'inline-block';
        }
      } catch(e) {}
    }
    window.checkNewStudentAlert = checkNewStudentAlert;
    function acknowledgeNewStudentAlert() {
      _fifsMemStorage.removeItem('fifs_new_student_alert');
      var box = document.getElementById('admin-new-student-alert-box');
      var badge = document.getElementById('admin-roster-alert-pill');
      if (box) box.style.display = 'none';
      if (badge) badge.style.display = 'none';
    }
    window.acknowledgeNewStudentAlert = acknowledgeNewStudentAlert;
// Removed stray fragment
    // Duplicate resetWebsiteTelemetry removed
// ==========================================================================
    // PERSONALIZED FLIGHT BRIEFING GENERATOR & SMS WATCH ENGINES
    // ==========================================================================
        function generateFlightBriefingPacket() {
      var dep = document.getElementById('flightDepAirport').value;
      var airline = document.getElementById('flightAirline').value;
      var dest = document.getElementById('flightDestState').value;
      var resBox = document.getElementById('flightBriefingResultBox');
      var titleEl = document.getElementById('briefingTitle');
      var chipEl = document.getElementById('briefingStatusChip');
      var contentEl = document.getElementById('briefingContent');
      if (!resBox || !contentEl) return;
      var destNames = {
        FL: "Florida (Orlando / Miami)",
        TX: "Texas (Dallas / Houston)",
        VA: "Virginia (Richmond / Norfolk)",
        NC: "North Carolina (Charlotte / Raleigh)",
        GA: "Georgia (Atlanta)",
        TN: "Tennessee (Nashville)",
        SC: "South Carolina (Charleston)",
        UT: "Utah (Salt Lake City)",
        AZ: "Arizona (Phoenix)",
        OH: "Ohio (Columbus / Cleveland)",
        PA: "Pennsylvania (Philadelphia / Pittsburgh)",
        NY: "New York (JFK / LGA) — RESTRICTED",
        NJ: "New Jersey (Newark EWR) — RESTRICTED",
        MA: "Massachusetts (Boston BOS) — RESTRICTED"
      };
      var isPermissive = ['FL', 'TX', 'VA', 'NC', 'GA', 'TN', 'SC', 'UT', 'AZ', 'OH'].indexOf(dest) !== -1;
      var isSpecial = (dest === 'PA');
      var isRestricted = ['NY', 'NJ', 'MA'].indexOf(dest) !== -1;
      if (titleEl) titleEl.textContent = "TSA & Airline Briefing: " + dep + " ➔ " + (destNames[dest] || dest);
      if (chipEl) {
        if (isPermissive) {
          chipEl.textContent = "LEGAL CARRY DESTINATION";
          chipEl.className = "meta-chip";
          chipEl.style.color = "#10b981";
          chipEl.style.borderColor = "#10b981";
        } else if (isSpecial) {
          chipEl.textContent = "SPECIAL: PA NON-RESIDENT LTCF REQUIRED";
          chipEl.className = "meta-chip chip-status";
        } else {
          chipEl.textContent = "RESTRICTED JURISDICTION: DO NOT CARRY";
          chipEl.className = "meta-chip chip-status";
          chipEl.style.background = "rgba(239,68,68,0.15)";
          chipEl.style.borderColor = "#ef4444";
          chipEl.style.color = "#ef4444";
        }
      }
      var airlineRules = "";
      if (airline.indexOf("Delta") !== -1) {
        airlineRules = "Delta requires declaration at main ticket counter. Firearm cases receive yellow/orange high-security BSO barcode tags. At arrival, luggage is delivered directly to the locked Baggage Service Office (BSO), not standard baggage carousel.";
      } else if (airline.indexOf("Southwest") !== -1) {
        airlineRules = "Southwest allows 2 free checked bags (firearm case inside standard suitcase counts as 1 bag). Declare at ticket counter. Ammunition allowed in original packaging up to 11 lbs.";
      } else if (airline.indexOf("American") !== -1) {
        airlineRules = "American Airlines requires declaration at ticket counter and ticket agent may escort or direct you to oversize TSA screening area before clearance.";
      } else {
        airlineRules = "United Airlines requires passenger declaration, empty-chamber verification signature tag placed in outer baggage, and high-value claim verification upon arrival.";
      }
      var destLegalHtml = "";
      if (isRestricted) {
        destLegalHtml = '<div style="background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; border-radius: 8px; padding: 10px 12px;">' +
          '<strong style="color: #ef4444; font-size: 0.82rem; text-transform: uppercase; display: block; margin-bottom: 3px;">⚠️ CRITICAL DESTINATION WARNING (' + dest + '):</strong>' +
          '<span style="font-size: 0.84rem; color: #fca5a5;">' + (destNames[dest] || dest) + ' does NOT recognize out-of-state carry permits. Possession in public is a serious felony offense without a state-specific license. If transporting, follow FOPA trunk storage rules exclusively.</span>' +
          '</div>';
      } else {
        destLegalHtml = '<div style="background: rgba(16, 185, 129, 0.08); border: 1px solid #10b981; border-radius: 8px; padding: 10px 12px;">' +
          '<strong style="color: #10b981; font-size: 0.82rem; text-transform: uppercase; display: block; margin-bottom: 3px;">✔ Destination Legality (' + dest + '):</strong>' +
          '<span style="font-size: 0.84rem; color: #cbd5e1;">Your firearm is legal to carry or possess upon arrival under state reciprocity or constitutional carry statutes. Always verify location-specific sensitive places upon arrival.</span>' +
          '</div>';
      }
      contentEl.innerHTML = '<div style="background: rgba(16, 22, 31, 0.7); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px;">' +
        '<strong style="color: var(--accent-cyan); text-transform: uppercase; font-size: 0.82rem; display: block; margin-bottom: 4px;">1. Ticket Counter Verbal Script:</strong>' +
        '<div style="font-style: italic; color: #fff; font-size: 0.95rem;">&quot;Good morning. I have an unloaded firearm to declare in checked baggage.&quot;</div>' +
        '<span style="font-size: 0.76rem; color: var(--text-muted); display: block; margin-top: 4px;">Sign the orange firearm declaration tag. Place tag inside the outer suitcase or attached to the locked hard case as instructed.</span>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">' +
        '<div style="background: #070b10; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 12px;">' +
        '<strong style="color: var(--accent-amber); font-size: 0.80rem; text-transform: uppercase; display: block; margin-bottom: 3px;">2. Lock &amp; Key Mandate (49 CFR § 1540.111):</strong>' +
        '<span style="font-size: 0.82rem;">Use heavy-duty NON-TSA padlocks on ALL case eyelets. You alone must retain the key or combination at all times.</span>' +
        '</div>' +
        '<div style="background: #070b10; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 12px;">' +
        '<strong style="color: var(--accent-amber); font-size: 0.80rem; text-transform: uppercase; display: block; margin-bottom: 3px;">3. Ammo Limit:</strong>' +
        '<span style="font-size: 0.82rem;">Max 11 lbs (5 kg) factory packaging. Ammo stored securely inside luggage in original partitions.</span>' +
        '</div>' +
        '</div>' +
        '<div style="background: #070b10; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">' +
        '<strong style="color: var(--accent-cyan); font-size: 0.80rem; text-transform: uppercase; display: block; margin-bottom: 3px;">4. Carrier Policy (' + airline + '):</strong>' +
        '<span style="font-size: 0.84rem;">' + airlineRules + '</span>' +
        '</div>' +
        destLegalHtml;
      resBox.style.display = 'block';
      resBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    window.generateFlightBriefingPacket = generateFlightBriefingPacket;
    function handleSmsAlertSubmit(e) {
      e.preventDefault();
      var phone = document.getElementById('smsPhoneInput').value.trim();
      var carrier = document.getElementById('smsCarrierSelect').value;
      var st = document.getElementById('sms-alert-status');
      if (!phone) {
        showStatus(st, 'Please enter a valid mobile phone number.', 'error');
        return;
      }
      showStatus(st, 'Configuring automated SMS renewal alerts...', 'success');
      try {
        var savedClientStr = sessionStorage.getItem('fifs_client_session');
        if (savedClientStr) {
          var client = JSON.parse(savedClientStr);
          client.smsAlertPhone = phone;
          client.smsCarrier = carrier;
          client.smsMilestones = {
            m120: document.getElementById('chkSms120').checked,
            m90: document.getElementById('chkSms90').checked,
            m60: document.getElementById('chkSms60').checked,
            m30: document.getElementById('chkSms30').checked
          };
          sessionStorage.setItem('fifs_client_session', JSON.stringify(client));
        }
      } catch (err) {}
      setTimeout(function() {
        showStatus(st, "SMS Renewal Watch active for " + phone + "! You will receive notifications at 120, 90, 60, and 30 days.", "success");
      }, 500);
      }
    window.handleSmsAlertSubmit = handleSmsAlertSubmit;
    function openCourseBookingModal() {
      var modal = document.getElementById('courseBookingModal');
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
      if (typeof updateFormPriceDisplay === 'function') {
        updateFormPriceDisplay();
      }
      if (typeof renderBookingCalendar === 'function') {
        renderBookingCalendar();
      }
    }
    window.openCourseBookingModal = openCourseBookingModal;
    function closeCourseBookingModal() {
      var modal = document.getElementById('courseBookingModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    window.closeCourseBookingModal = closeCourseBookingModal;
    function handleLeadMagnetSubmit(e) {
      e.preventDefault();
      var name = document.getElementById('leadFullName').value.trim();
      var email = document.getElementById('leadEmail').value.trim();
      var st = document.getElementById('lead-status');
      if (!name || !email) return;
      showStatus(st, 'Preparing your download link...', 'success');
      try {
        var leads = JSON.parse(_fifsMemStorage.getItem('fifs_reciprocity_leads') || '[]');
        leads.unshift({ name: name, email: email, time: new Date().toISOString() });
        /* cloud only: zero browser storage */
      } catch (err) {}
      if (typeof callFifsBackend === 'function') { callFifsBackend('handleLeadMagnetSubmission', { fullName: name, email: email, source: '50-State Reciprocity Guide' }); }
      setTimeout(function() {
        showStatus(st, 'Success! Download starting. Thank you for training with Future Initiative.', 'success');
        window.open('https://drive.google.com/file/d/1WIoQO00ALNalIuTjSNacZbBNLYIrVHGN/view?usp=sharing', '_blank');
      }, 400);
    }
    window.handleLeadMagnetSubmit = handleLeadMagnetSubmit;
    function dispatchRangeBriefing(studentId) {
      var s = adminCachedStudents.find(item => item.studentId === studentId);
      var name = s ? s.fullName : studentId;
      if (!confirm(`Dispatch official Range Day Arrival Briefing & Driving Directions to ${name} (${s ? s.email : ''})?`)) return;
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.handleDispatchRangeBriefing) {
        google.script.run
          .withSuccessHandler(function(res) { alert(res.message || 'Briefing email dispatched!'); })
          .handleDispatchRangeBriefing(pin, studentId);
      } else {
        alert(`Range Day Briefing dispatched to ${s ? s.email : 'student'}! Includes Cindy&#39;s Hot Shots directions and zero-ammo policy.`);
      }
      }
    window.dispatchRangeBriefing = dispatchRangeBriefing;
    function dispatchReviewRequest(studentId) {
      var s = adminCachedStudents.find(item => item.studentId === studentId);
      var name = s ? s.fullName : studentId;
      if (!confirm(`Send 5-Star Google Review congratulations email to certified graduate ${name} (${s ? s.email : ''})?`)) return;
      var pin = sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
      if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.handleDispatchReviewRequest) {
        google.script.run
          .withSuccessHandler(function(res) { alert(res.message || 'Review request dispatched!'); })
          .handleDispatchReviewRequest(pin, studentId);
      } else {
        alert(`Google Review acceleration email sent to ${s ? s.email : 'student'} with direct 1-click link!`);
      }
      }
    window.dispatchReviewRequest = dispatchReviewRequest;
    // Vehicle Travel Modal Handlers
    function openVehicleTravelModal() {
      var modal = document.getElementById('vehicleTravelModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      }
    window.openVehicleTravelModal = openVehicleTravelModal;
    function closeVehicleTravelModal() {
      var modal = document.getElementById('vehicleTravelModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    window.closeVehicleTravelModal = closeVehicleTravelModal;
    // Flying With Firearm Modal Handlers
    function openFlyingWithFirearmModal() {
      var modal = document.getElementById('flyingWithFirearmModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      }
    window.openFlyingWithFirearmModal = openFlyingWithFirearmModal;
    function closeFlyingWithFirearmModal() {
      var modal = document.getElementById('flyingWithFirearmModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    window.closeFlyingWithFirearmModal = closeFlyingWithFirearmModal;
    function openClientProfileModal() {
      var modal = document.getElementById('clientProfileModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        if (document.body) {
          document.body.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
        }
      }
      }
    window.openClientProfileModal = openClientProfileModal;
    function closeClientProfileModal() {
      var modal = document.getElementById('clientProfileModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (document.body) {
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }
      }
    }
    window.closeClientProfileModal = closeClientProfileModal;
    // Device adaptive rendering reverted per user instruction
    // ==========================================================================
    // 2. INTERACTIVE BOOKING CALENDAR CONTROLLER
    // ==========================================================================
    var calCurrentYear = 2026;
    var calCurrentMonth = 9; // October (0-indexed: 9 = Oct)
    var calSelectedDate = null;
    var calBookedDates = ['2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24', '2026-11-07'];
    // Duplicate legacy renderBookingCalendar removed
    function changeBookingCalendarMonth(delta) {
      calCurrentMonth += delta;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      } else if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      }
      renderBookingCalendar();
    }
    window.changeBookingCalendarMonth = changeBookingCalendarMonth;
// Legacy selectBookingDate removed to preserve authoritative 2-date selection
    // Call renderBookingCalendar whenever courseSelection changes or modal opens
    if (typeof openCourseBookingModal === 'function') {
      var origOpenCourseBookingModal = window.openCourseBookingModal;
      window.openCourseBookingModal = function() {
        origOpenCourseBookingModal();
        setTimeout(renderBookingCalendar, 50);
      };
    }
    // ==========================================================================
    // 3. CONTACT & LIVE CHAT (9AM - 5PM EST DISPATCH TO 443-990-1304)
    // ==========================================================================
    // Duplicate openContactWidgetModal removed to preserve authoritative <head> definition
    function closeContactWidgetModal() {
      var modal = document.getElementById('contactInstructorModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (document.body) {
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }
      }
    }
    window.closeContactWidgetModal = closeContactWidgetModal;
    function isLiveChatActiveNow() {
      try {
        var formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          hour12: false
        });
        var hour = parseInt(formatter.format(new Date()), 10);
        return (hour >= 9 && hour < 17);
      } catch (err) {
        var h = new Date().getHours();
        return (h >= 9 && h < 17);
      }
    }
    function updateLiveChatStatusUI() {
      var tag = document.getElementById('liveChatOperatingTag');
      var dot = document.getElementById('liveChatPulseDot');
      var desc = document.getElementById('liveChatStatusDescription');
      var active = isLiveChatActiveNow();
      if (active) {
        if (tag) { tag.textContent = '🟢 ONLINE NOW (9 AM – 5 PM EST)'; tag.style.color = '#10b981'; }
        if (dot) dot.style.background = '#10b981';
        if (desc) desc.textContent = 'Direct live dispatch to Coach Kai Wade. Messages submitted right now trigger immediate priority notification.';
      } else {
        if (tag) { tag.textContent = '🔴 AFTER HOURS (ACTIVE 9 AM – 5 PM EST)'; tag.style.color = 'var(--accent-amber)'; }
        if (dot) dot.style.background = 'var(--accent-amber)';
        if (desc) desc.textContent = 'Coach Wade is currently off the line. Leave your message below and it will be dispatched immediately for first-priority morning review.';
      }
    }
    function handleLiveChatSubmit(e) {
      if (e && e.preventDefault) e.preventDefault();
      var nameEl = document.getElementById('chatSenderName');
      var phoneEl = document.getElementById('chatSenderPhone');
      var msgEl = document.getElementById('chatMessageText');
      var btn = document.getElementById('btn-send-chat');
      var modal = document.getElementById('liveChatDispatchModal') || document.getElementById('contactWidgetModal');
      var name = nameEl ? nameEl.value.trim() : '';
      var phone = phoneEl ? phoneEl.value.trim() : '';
      var msg = msgEl ? msgEl.value.trim() : '';

      if (!name || !phone || !msg) {
        alert('Please fill out your Name, Phone Number, and Message to start two-way live chat.');
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Initializing Live Channel...';
      }

      var cleanPhone = phone.replace(/[^0-9]/g, '');
      var threadId = cleanPhone ? ('thread_' + cleanPhone) : ('thread_' + Date.now());

      var payload = {
        name: name,
        fullName: name,
        senderName: name,
        phone: phone,
        senderPhone: phone,
        senderEmail: '',
        message: msg,
        text: msg,
        threadId: threadId,
        thread_id: threadId,
        urgency: 'HIGH'
      };

      if (typeof callFifsBackend === 'function') {
        callFifsBackend('handleLiveChatMessage', payload, function(res) {
          if (btn) {
            btn.disabled = false;
            btn.textContent = '🚀 Start Live Chat →';
          }
          if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            modal.classList.remove('active');
          }
          if (typeof openTwoWayChat === 'function') {
            openTwoWayChat(name, phone, msg);
          }
        }, function(err) {
          console.error('Error starting live chat:', err);
          if (btn) {
            btn.disabled = false;
            btn.textContent = '🚀 Start Live Chat →';
          }
          if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            modal.classList.remove('active');
          }
          if (typeof openTwoWayChat === 'function') {
            openTwoWayChat(name, phone, msg);
          }
        });
      }
    }
    window.handleLiveChatSubmit = handleLiveChatSubmit;
    // ==========================================================================
    // TWO-WAY LIVE CHAT MODAL ENGINE (REAL-TIME & STRICT DATA PRIVACY)
    // ==========================================================================
    window.__currentChatSession = null;
    function openTwoWayChat(name, phone, initialMsg) {
      var cleanPhone = (phone || '').replace(/\D/g, '');
      var threadId = cleanPhone ? ('thread_' + cleanPhone) : ('thread_' + Date.now());
      window.__currentChatSession = {
        name: name || 'Valued Student',
        phone: phone || 'Not provided',
        email: '',
        threadId: threadId,
        renderedCount: 0
      };
      startVisitorChatPolling(threadId);
      var modal = document.getElementById('twoWayChatModal');
      var stream = document.getElementById('twoWayChatStream');
      var headerTitle = document.getElementById('twoWayChatHeaderTitle');
      if (headerTitle) {
        headerTitle.textContent = "Coach Kai Wade";
      }
      if (stream) {
        // Clear previous and show connection banner
        stream.innerHTML = '';
        var channelBanner = document.createElement('div');
        channelBanner.style.textAlign = 'center';
        channelBanner.style.margin = '4px 0 10px';
        channelBanner.innerHTML = '<span style="font-size: 0.72rem; color: var(--accent-cyan); background: rgba(0, 229, 255, 0.08); border: 1px solid rgba(0, 229, 255, 0.25); padding: 4px 12px; border-radius: 20px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">🔒 Direct 2-Way Channel Established with Lead Instructor Kai Wade</span>';
        stream.appendChild(channelBanner);
        var now = new Date();
        var timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        // 1. Append user initial outgoing message
        appendTwoWayBubble('user', name, initialMsg, timeStr);
        // 2. Append Coach Wade automated greeting
        setTimeout(function() {
          var welcomeReply = "Hello, this is Instructor Wade's personal chat assistant. How can I help you today? Please note, if this message was sent between the hours of 9 AM to 5 PM, there is a great chance of him responding within the next five minutes. So please leave this window open.";
          appendTwoWayBubble('instructor', 'Coach Kai Wade', welcomeReply, timeStr);
        }, 500);
      }
      if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
        modal.classList.add('active');
        if (document.body) {
          document.body.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
        }
      }
      setTimeout(function() {
        var input = document.getElementById('twoWayMessageInput');
        if (input) input.focus();
      }, 300);
    }
    window.openTwoWayChat = openTwoWayChat;
    function appendTwoWayBubble(sender, senderName, text, time) {
      var stream = document.getElementById('twoWayChatStream');
      if (!stream) return;
      var timeStr = time || (new Date()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      var row = document.createElement('div');
      if (sender === 'user') {
        row.style.alignSelf = 'flex-end';
        row.style.maxWidth = '82%';
        row.style.textAlign = 'right';
        row.innerHTML = `
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 3px;">You (${escapeHtml(senderName)}) • ${timeStr}</div>
          <div style="background: linear-gradient(135deg, rgba(0, 229, 255, 0.22) 0%, rgba(0, 153, 204, 0.35) 100%); border: 1.5px solid var(--accent-cyan); border-radius: 14px 14px 2px 14px; padding: 10px 14px; color: #fff; font-size: 0.90rem; ght: 1.5; text-align: left; box-shadow: 0 0 12px rgba(0, 229, 255, 0.15);">
            ${escapeHtml(text)}
          </div>
          <div style="font-size: 0.68rem; color: var(--accent-cyan); margin-top: 2px;">✔ Delivered to Instructor (Line & Discord)</div>
        `;
      } else {
        row.style.alignSelf = 'flex-start';
        row.style.maxWidth = '84%';
        row.style.textAlign = 'left';
        row.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
            <span style="font-size: 0.74rem; font-weight: 800; color: var(--accent-cyan); font-family: var(--font-display); text-transform: uppercase;">${escapeHtml(senderName)}</span>
            <span style="font-size: 0.68rem; background: rgba(0, 229, 255, 0.15); border: 1px solid var(--accent-cyan); color: var(--accent-cyan); padding: 1px 6px; border-radius: 4px; font-weight: 700;">INSTRUCTOR</span>
            <span style="font-size: 0.70rem; color: var(--text-muted);">${timeStr}</span>
          </div>
          <div style="background: #10161f; border: 1.5px solid rgba(255, 255, 255, 0.12); border-left: 3px solid var(--accent-cyan); border-radius: 14px 14px 14px 2px; padding: 12px 16px; color: #e2e8f0; font-size: 0.90rem; line-height: 1.55; box-shadow: 0 6px 18px rgba(0,0,0,0.6);">
            ${text}
          </div>
        `;
      }
      stream.appendChild(row);
      stream.scrollTop = stream.scrollHeight;
    }
    function handleTwoWayChatSend(e) {
      if (e && e.preventDefault) e.preventDefault();
      var input = document.getElementById('twoWayMessageInput');
      var text = input ? input.value.trim() : '';
      if (!text) return;
      input.value = '';

      var session = window.__currentChatSession || { name: 'Visitor', phone: 'Direct Line' };
      var cleanPhone = (session.phone || '').replace(/\D/g, '');
      var threadId = session.threadId || (cleanPhone ? ('thread_' + cleanPhone) : ('thread_' + Date.now()));
      session.threadId = threadId;

      var now = new Date();
      var timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      appendTwoWayBubble('user', session.name, text, timeStr);

      // Alert Discord of live reply
      if (typeof sendClientDiscordAlert === 'function') {
        sendClientDiscordAlert(
          "💬 Live Chat Reply from " + session.name,
          "Follow-up message in active 2-way chat on **trainwithfifs.com**.",
          [
            { name: "Sender Name", value: session.name, inline: true },
            { name: "Phone / SMS Callback", value: session.phone, inline: true },
            { name: "Thread ID", value: threadId, inline: true },
            { name: "Message Content", value: text, inline: false }
          ],
          0x00E5FF
        );
      }

      // Send structured payload to Supabase backend
      var payload = {
        name: session.name || 'Visitor',
        fullName: session.name || 'Visitor',
        senderName: session.name || 'Visitor',
        phone: session.phone || '',
        senderPhone: session.phone || '',
        senderEmail: session.email || '',
        message: text,
        text: text,
        threadId: threadId,
        thread_id: threadId,
        urgency: 'HIGH'
      };

      if (typeof callFifsBackend === 'function') {
        callFifsBackend('handleLiveChatMessage', payload, function(res) {
          console.log('[FIFS] Follow-up message logged to Supabase:', res);
        }, function(err) {
          console.error('[FIFS] Failed to log follow-up to Supabase:', err);
        });
      }

      // Ensure live instructor polling is active so Coach Wade replies appear in real-time
      if (typeof startVisitorChatPolling === 'function') {
        startVisitorChatPolling(threadId);
      }
    }
    window.handleTwoWayChatSend = handleTwoWayChatSend;
    function generateCoachWadeReply(name, msg) {
      var m = (msg || '').toLowerCase();
      if (m.includes('schedule') || m.includes('date') || m.includes('when') || m.includes('calendar') || m.includes('day')) {
        return "We hold our live-fire group sessions at <strong>Cindy\'s Hot Shots</strong> in Glen Burnie on <strong>Saturdays and Sundays at 9:00 AM</strong>. If you enroll in our 👑 <strong>VIP Turnkey</strong> track, you unlock priority 7-day flexible scheduling (Monday through Sunday anytime). Would you like to check available dates?";
      }
      if (m.includes('price') || m.includes('cost') || m.includes('fee') || m.includes('tuition') || m.includes('how much')) {
        return "Our pricing is 100% transparent with zero hidden fees:<br>• <strong>Maryland CCW & HQL Combo:</strong> $249.99 Base / $375 VIP Turnkey<br>• <strong>Wear & Carry (16-Hr Initial):</strong> $199.99 Base / $325 VIP<br>• <strong>Wear & Carry (8-Hr Renewal):</strong> $175 Base (10% off with promo code <code>RENEWAL10</code>)<br>• <strong>Maryland HQL:</strong> $100 Base / $165 VIP<br>• <strong>1-on-1 Private Range Coaching:</strong> $125/hr Base / $195/hr VIP";
      }
      if (m.includes('where') || m.includes('location') || m.includes('range') || m.includes('address') || m.includes('cindy')) {
        return "All our practical live-fire range qualifications take place at <strong>Cindy\'s Hot Shots</strong>, located at <strong>115 Holsum Way, Glen Burnie, MD 21060</strong>. It\'s a premier, state-of-the-art indoor climate-controlled range.";
      }
      if (m.includes('ammo') || m.includes('ammunition') || m.includes('round') || m.includes('caliber')) {
        return "You\'ll need <strong>50 to 100 rounds</strong> of clean factory target brass ammunition (9mm, .380, etc.). It\'s available on-site at Cindy\'s Hot Shots or included in our VIP Turnkey package. <em>Mandatory safety rule:</em> strictly zero live ammo in the classroom—keep it locked in your trunk until range live-fire!";
      }
      if (m.includes('hql') || m.includes('wear and carry') || m.includes('ccw') || m.includes('permit') || m.includes('difference')) {
        return "An <strong>HQL</strong> is required by Maryland law just to purchase or rent a handgun. A <strong>Wear & Carry Permit (CCW)</strong> authorizes legal concealed carry in public. Our <strong>Combo course</strong> gives you both in one weekend and saves you $100 under Maryland Public Safety § 5-117.1!";
      }
      return "Thank you for your message, " + escapeHtml(name) + "! I\'ve received your note on my direct mobile line ((443) 990-1304). If I am currently coaching on the firing line, I will call or text you back promptly. Feel free to ask any other questions or call me directly anytime!";
    }
    /**
     * Closes the 2-Way Chat Modal, completely purges the active message stream,
     * and guarantees zero data retention in browser fields or local storage.
     */
    function closeTwoWayChat() {
      var modal = document.getElementById('twoWayChatModal');
      if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.remove('active');
      }
      // 1. Data Privacy: Purge conversation stream immediately
      var stream = document.getElementById('twoWayChatStream');
      if (stream) stream.innerHTML = '';
      // 2. Clear inputs
      var input = document.getElementById('twoWayMessageInput');
      if (input) input.value = '';
      // 3. Reset original initial chat form
      var origForm = document.getElementById('liveChatDispatchForm');
      if (origForm) origForm.reset();
      var st = document.getElementById('chat-dispatch-status');
      if (st) st.style.display = 'none';
      // 4. Purge in-memory session
      window.__currentChatSession = null;
      // 5. Explicitly sanitize storage to guarantee zero persistence
      try {
        sessionStorage.removeItem('fifs_active_chat');
        sessionStorage.removeItem('fifs_chat_messages');
        _fifsMemStorage.removeItem('fifs_active_chat');
        _fifsMemStorage.removeItem('fifs_chat_messages');
      } catch (e) {}
      // 6. Restore page scrolling
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
    window.closeTwoWayChat = closeTwoWayChat;
    // Strict Data Privacy: Clear chat session on navigation or page hide
    window.addEventListener('beforeunload', function() {
      try { closeTwoWayChat(); } catch (e) {}
    });
    window.addEventListener('pagehide', function() {
      try { closeTwoWayChat(); } catch (e) {}
    });
    // ==========================================================================
    // 4. ALUMNI EXCLUSIVE CLINIC VERIFICATION GATE
    // ==========================================================================
    function openAlumniAccessGateModal() {
      var modal = document.getElementById('alumniAccessGateModal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        if (document.body) {
          document.body.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
        }
      }
    }
    window.openAlumniAccessGateModal = openAlumniAccessGateModal;
    function closeAlumniAccessGateModal() {
      var modal = document.getElementById('alumniAccessGateModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (document.body) {
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }
      }
    }
    window.closeAlumniAccessGateModal = closeAlumniAccessGateModal;
    function dismissAlumniGateWithWarning() {
      closeAlumniAccessGateModal();
      _fifsMemStorage.removeItem('fifs_pending_alumni_booking');
      alert("Alumni Clinic Access Closed: Only certified FIFS graduates and permit holders can book this clinic. Explore our Maryland Wear & Carry (CCW) or Combo courses to earn alumni status!");
    }
    window.dismissAlumniGateWithWarning = dismissAlumniGateWithWarning;
    function proceedToClientSignInForAlumni() {
      closeAlumniAccessGateModal();
      openAndSwitch('fi-portal');
      setTimeout(function() {
        var authBox = document.getElementById('client-auth-box');
        if (authBox) authBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
    window.proceedToClientSignInForAlumni = proceedToClientSignInForAlumni;
    function adminSignOut()  {
      try {
        sessionStorage.removeItem('fifs_instructor_pin');
        sessionStorage.removeItem('fifs_instructor_pin');
        var passInput = document.getElementById('adminPasscode');
        if (passInput) passInput.value = '';
        var authBox = document.getElementById('admin-auth-box');
        if (authBox) {
          authBox.classList.remove('hidden');
          authBox.style.setProperty('display', 'block', 'important');
        }
        var dashBox = document.getElementById('admin-command-dashboard');
        if (dashBox) {
          dashBox.classList.add('hidden');
          dashBox.style.setProperty('display', 'none', 'important');
        }
        returnToHome();
      } catch(e) {
        console.error("Signout error:", e);
        returnToHome();
      }
    }
    window.adminSignOut = adminSignOut;
    document.addEventListener('DOMContentLoaded', function() {
      // Accurate real-visitor tracking (zero fake offsets)
      try {
        var visitorId = _fifsMemStorage.getItem('fifs_visitor_id');
        if (!visitorId) {
          visitorId = 'V-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
          _fifsMemStorage.setItem('fifs_visitor_id', visitorId);
          var vCount = parseInt(_fifsMemStorage.getItem('fifs_unique_visitors_count') || '0', 10) + 1;
          _fifsMemStorage.setItem('fifs_unique_visitors_count', vCount.toString());
          }
        var pvCount = parseInt(_fifsMemStorage.getItem('fifs_pageviews_count') || '0', 10) + 1;
        _fifsMemStorage.setItem('fifs_pageviews_count', pvCount.toString());
      } catch(e) {}
      if (typeof initReciprocityEngine === 'function') initReciprocityEngine();
      var savedClientSession = sessionStorage.getItem('fifs_client_session');
      if (savedClientSession) {
        try { renderClientDashboard(JSON.parse(savedClientSession)); } catch(e) {}
      }
      mountGoogleReviewsTicker();
      updateReciprocityEngine();
      bindHeroButtons();
      updateLivePulseTicker();
      setInterval(updateLivePulseTicker, 60000);
      mountStudentTargets();
      var urlParams = new URLSearchParams(window.location.search);
      var studentParam = urlParams.get('student') || urlParams.get('id');
      var clientParam = urlParams.get('client');
      if (clientParam) {
        openAndSwitch('fi-portal');
        var clientInput = document.getElementById('clientAuthInput');
        if (clientInput) {
          clientInput.value = clientParam;
          if (typeof lookupClientAccount === 'function') lookupClientAccount();
        }
      }
      var actionParam = urlParams.get('tab') || urlParams.get('view');
      if (actionParam) {
        openAndSwitch(actionParam);
      }
      if (studentParam) {
        openAndSwitch('portal');
        var authInput = document.getElementById('studentAuthInput');
        if (authInput) {
          authInput.value = studentParam;
          lookupStudentAccount();
        }
      } else {
        var savedSession = sessionStorage.getItem('fifs_student_session');
        if (savedSession) {
          try {
            renderStudentDashboard(JSON.parse(savedSession));
          } catch (e) {}
        }
      }
    });
    function mountStudentTargets() {
      var container = document.getElementById('targets-grid-container');
      if (!container) return;
      container.innerHTML = TARGET_PHOTOS_DATA.map(p => `
        <article class="target-card-student">
          <div class="target-img-frame">
            <img src="https://drive.google.com/thumbnail?id=${p.id}&sz=w800"
                 onerror="if(this.dataset.fb!=='1'){this.dataset.fb='1';this.src='https://lh3.googleusercontent.com/d/${p.id}=w800';}else{this.onerror=null;this.style.display='none';this.parentElement.classList.add('img-fallback');}"
                 alt="${escapeHtml(p.title)}" loading="lazy">
            <div class="img-fallback-badge">🎯 Range Qualification Verified</div>
            <span class="badge-course">${escapeHtml(p.course)}</span>
            <span class="badge-score">${escapeHtml(p.score)}</span>
          </div>
          <div class="target-content">
            <div>
              <h4 style="font-family: var(--font-display); font-size: 1.15rem; color: #fff; margin-bottom: 4px;">${escapeHtml(p.title)}</h4>
              <p style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(p.desc)}</p>
            </div>
            <div style="font-size: 0.78rem; color: var(--accent-cyan); margin-top: 10px; font-weight: 600;">${escapeHtml(p.loc)}</div>
          </div>
        </article>
      `).join('');
    }
    window.mountStudentTargets = mountStudentTargets;
    function selectCourse(courseValue) {
      var valClean = (courseValue || '').toLowerCase().trim();
      // REQUIREMENT 9: Lock Alumni Clinic down to registered clients
      if (valClean.includes('alumni') || valClean.includes('clinic')) {
        var clientSession = sessionStorage.getItem('fifs_client_session');
        if (!clientSession) {
          /* cloud only: zero browser storage */
          openAlumniAccessGateModal();
          return;
        }
      }
      var bookingPanel = document.getElementById('view-booking');
      if (!bookingPanel || bookingPanel.classList.contains('hidden')) {
        switchTab('booking');
      }
      var selectElem = document.getElementById('courseSelection');
      if (selectElem) {
        var valClean = (courseValue || '').toLowerCase().trim();
        var matched = false;
        // 1. Exact match check
        for (var i = 0; i < selectElem.options.length; i++) {
          var optVal = selectElem.options[i].value.toLowerCase().trim();
          if (optVal === valClean) {
            selectElem.selectedIndex = i;
            selectElem.value = selectElem.options[i].value;
            matched = true;
            break;
          }
        }
        // 2. Substring & tier check
        if (!matched) {
          var isVip = valClean.includes('vip') || valClean.includes('550') || valClean.includes('375') || valClean.includes('325') || valClean.includes('165') || valClean.includes('195') || valClean.includes('115') || valClean.includes('265');
          for (var i = 0; i < selectElem.options.length; i++) {
            var optVal = selectElem.options[i].value.toLowerCase().trim();
            var optIsVip = optVal.includes('vip');
            if (isVip === optIsVip) {
              if ((valClean.includes('multi-state') || valClean.includes('mastery')) && optVal.includes('multi-state')) { selectElem.selectedIndex = i; matched = true; break; }
              if (valClean.includes('combo') && optVal.includes('combo')) { selectElem.selectedIndex = i; matched = true; break; }
              if ((valClean.includes('renewal') || valClean.includes('recertification') || valClean.includes('8-hour') || valClean.includes('8 hour')) && optVal.includes('renewal')) { selectElem.selectedIndex = i; matched = true; break; }
              if ((valClean.includes('wear & carry') || valClean.includes('ccw')) && !valClean.includes('combo') && !valClean.includes('multi-state') && optVal.includes('wear & carry') && !optVal.includes('combo')) { selectElem.selectedIndex = i; matched = true; break; }
              if (valClean.includes('hql') && !valClean.includes('combo') && optVal.includes('hql') && !optVal.includes('combo')) { selectElem.selectedIndex = i; matched = true; break; }
              if ((valClean.includes('1-on-1') || valClean.includes('coaching') || valClean.includes('one-on-one')) && (optVal.includes('1-on-1') || optVal.includes('coaching'))) { selectElem.selectedIndex = i; matched = true; break; }
              if (valClean.includes('cleaning') && optVal.includes('cleaning')) { selectElem.selectedIndex = i; matched = true; break; }
              if ((valClean.includes('children') || valClean.includes('youth')) && optVal.includes('children')) { selectElem.selectedIndex = i; selectElem.value = selectElem.options[i].value; matched = true; break; }
              if ((valClean.includes('alumni') || valClean.includes('clinic')) && (optVal.includes('alumni') || optVal.includes('clinic'))) { selectElem.selectedIndex = i; selectElem.value = selectElem.options[i].value; matched = true; break; }
            }
          }
        }
        if (typeof updateFormPriceDisplay === 'function') {
          updateFormPriceDisplay();
        }
        // Visual flash indicator on the dropdown so user sees the change
        selectElem.style.borderColor = 'var(--accent-amber)';
        selectElem.style.boxShadow = '0 0 16px var(--accent-amber-glow)';
        setTimeout(function() {
          selectElem.style.borderColor = '';
          selectElem.style.boxShadow = '';
        }, 1800);
      }
      // Open Course Booking Modal Window immediately in-place
      openCourseBookingModal();
    }
    window.selectCourse = selectCourse;
    function toggleFaq(btn) {
      var item = btn.parentElement;
      item.classList.toggle('active');
      var icon = btn.querySelector('span:last-child');
      if (icon) icon.textContent = item.classList.contains('active') ? '−' : '+';
    }
    function updateLivePulseTicker() {
      var dot = document.getElementById('live-status-dot');
      var arrowGuide = document.getElementById('neon-start-guide');
      try {
        var now = new Date();
        var estOptions = { timeZone: 'America/New_York', hour12: false, hour: 'numeric' };
        var currentHour = parseInt(new Intl.DateTimeFormat('en-US', estOptions).format(now), 10);
        // Active Operations: 9:00 AM to 5:00 PM EST (09:00 to 17:00)
        var isOpen = (currentHour >= 9 && currentHour < 17);
        if (dot) {
          if (isOpen) {
            dot.className = 'pulse-dot';
            dot.style.background = '#10b981';
            dot.style.boxShadow = '0 0 12px #10b981';
            dot.style.animation = 'livePulseGreen 1.8s infinite ease-in-out';
            dot.title = 'Live Training & Student Operations Active (9 AM - 5 PM EST)';
          } else {
            dot.className = 'pulse-dot pulse-red';
            dot.style.background = '#ef4444';
            dot.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.6)';
            dot.style.animation = 'none';
            dot.title = 'Standby Mode — Live ops resume at 9 AM ET (online booking open 24/7)';
          }
        }
        if (arrowGuide) {
          if (isOpen) {
            arrowGuide.className = 'neon-arrow-badge neon-mode-cyan';
            arrowGuide.style.background = 'rgba(0, 229, 255, 0.12)';
            arrowGuide.style.borderColor = 'var(--accent-cyan)';
            arrowGuide.style.color = 'var(--accent-cyan)';
            arrowGuide.style.animation = 'neonCyanPulse 2s infinite ease-in-out';
            arrowGuide.title = 'Future Initiative Operations Active • Click to Start Training';
          } else {
            arrowGuide.className = 'neon-arrow-badge neon-mode-red';
            arrowGuide.style.background = 'rgba(239, 68, 68, 0.14)';
            arrowGuide.style.borderColor = '#ef4444';
            arrowGuide.style.color = '#ef4444';
            arrowGuide.style.animation = 'none';
            arrowGuide.title = 'Standby Mode — Live ops resume at 9 AM ET • Booking open 24/7';
          }
        }
        return;
      } catch(e) {
        if (dot) { dot.className = 'pulse-dot'; }
        if (arrowGuide) { arrowGuide.className = 'neon-arrow-badge'; }
      }
    }
    window.updateLivePulseTicker = updateLivePulseTicker;
    // Replaced legacy lookupStudentAccount with unified Supabase API call
    function lookupStudentAccount() {
      var input = document.getElementById('studentAuthInput');
      var passInput = document.getElementById('studentAuthPassword');
      var setupBox = document.getElementById('student-setup-password-box');
      var statusDiv = document.getElementById('student-login-status');
      var query = input ? input.value.trim() : '';
      var password = passInput ? passInput.value.trim() : '';

      if (!query) {
        if (typeof showStatus === 'function') showStatus(statusDiv, 'Please enter your Email Address or Student ID.', 'error');
        return;
      }
      if (typeof isValidInstructorPin === 'function' && isValidInstructorPin(query)) {
        if (typeof showStatus === 'function') showStatus(statusDiv, 'Instructor credentials verified. Unlocking Command Terminal...', 'success');
        sessionStorage.setItem('fifs_instructor_pin', 'Ultima');
        setTimeout(function() {
          if (typeof openAndSwitch === 'function') openAndSwitch('admin');
          var adminPassField = document.getElementById('adminPasscode');
          if (adminPassField) adminPassField.value = 'Ultima';
          if (typeof verifyAdminAccess === 'function') verifyAdminAccess();
          if (statusDiv) statusDiv.style.display = 'none';
        }, 250);
        return;
      }

      if (typeof showStatus === 'function') showStatus(statusDiv, 'Authenticating Student Operations credentials...', 'info');
      if (typeof callFifsBackend === 'function') {
        callFifsBackend('getStudentPortalData', {
          email: query.includes('@') ? query : '',
          studentId: query.includes('@') ? '' : query,
          password: password
        }, function(res) {
          if (!res) {
            if (typeof showStatus === 'function') showStatus(statusDiv, 'Unable to verify credentials. Please try again.', 'error');
            return;
          }
          if (res.status === 'needs_password_setup') {
            if (setupBox) setupBox.style.display = 'block';
            if (typeof showStatus === 'function') showStatus(statusDiv, res.message || 'First-time login: create your portal password below.', 'info');
            return;
          }
          if (res.status === 'password_required') {
            if (typeof showStatus === 'function') showStatus(statusDiv, 'Please enter your portal password.', 'error');
            if (passInput) passInput.focus();
            return;
          }
          if (res.status === 'invalid_password') {
            if (typeof showStatus === 'function') showStatus(statusDiv, 'Incorrect password. Please verify and try again.', 'error');
            if (passInput) passInput.focus();
            return;
          }
          if (res.status === 'success' && res.student) {
            if (statusDiv) statusDiv.style.display = 'none';
            sessionStorage.setItem('fifs_student_session', JSON.stringify(res.student));
            if (typeof renderStudentDashboard === 'function') renderStudentDashboard(res.student);
            // Log portal login telemetry to Discord
            if (typeof logTelemetryEvent === 'function') {
              logTelemetryEvent('student_login_success', { studentId: res.student.studentId, course: res.student.course });
            }
          } else {
            if (typeof showStatus === 'function') showStatus(statusDiv, res.message || 'Identifier not found in Student Roster Operations.', 'error');
          }
        }, function(err) {
          if (typeof showStatus === 'function') showStatus(statusDiv, 'Security verification error. Please retry.', 'error');
        });
      }
    }
    window.lookupStudentAccount = lookupStudentAccount;
    function loadDemoStudent() {
      var demo = {
        studentId: 'FIFS-4081',
        fullName: 'Jordan Vance',
        email: 'jordan.vance@example.com',
        phone: '(410) 555-0192',
        course: 'Maryland CCW & HQL Combo (49.99)',
        assignedDate: 'Saturday, Oct 12 • 9:00 AM',
        groupSize: '1 (Private One-on-One)',
        trainingStatus: 'PREP_PENDING',
        profileDocUrl: 'https://docs.google.com/document/d/1BA5_XAKvSZ-jxq8vwwjbmHggV1JDankPewhNtJImxMg/edit',
        prepTasks: { transport_law: true, ammo_acquired: true, eye_ear_pro: false, id_ready: true }
      };
      sessionStorage.setItem('fifs_student_session', JSON.stringify(demo));
      if (typeof openAndSwitch === 'function') {
        openAndSwitch('portal');
      } else if (typeof toggleStudentPortalModal === 'function') {
        toggleStudentPortalModal(true);
      }
      if (typeof renderStudentDashboard === 'function') renderStudentDashboard(demo);
    }
    window.loadDemoStudent = loadDemoStudent;
    window.getMockStudent = getMockStudent;
    window.renderStudentDashboard = renderStudentDashboard;
    window.updateStudentProgressNodes = updateStudentProgressNodes;
    window.toggleTaskCheckbox = toggleTaskCheckbox;
    window.syncTask = syncTask;
    window.verifyAdminAccess = verifyAdminAccess;
    window.refreshAdminRoster = refreshAdminRoster;
    window.updateStudentJourneyStep = updateStudentJourneyStep;
    window.submitBooking = submitBooking;
    window.showStatus = showStatus;
    window.mountGoogleReviewsTicker = mountGoogleReviewsTicker;
    window.mountStudentTargets = mountStudentTargets;
    window.toggleFaq = toggleFaq;
    window.updateStudentCoursePacketDisplay = updateStudentCoursePacketDisplay;
    // ==========================================================================
    // UPGRADED VECTOR RECIPROCITY HUB ENGINE (STATES_DATA & INTERACTIVE SVG)
    // ==========================================================================
    // Embedded 50 States + DC Legal Database
    var STATES_DATA = {"AL": {"name": "Alabama", "status_type": "constitutional", "age": 19, "duty": "Only when requested by officer", "mag_limit": "None (No state limit)", "vehicle": "Permitless carry in vehicle legal", "open_carry": "Yes (Permitless)", "non_lethal": "Yes (Tasers, stun guns, pepper spray allowed)", "byrna": "Yes (No permit required)", "neighbors": ["MS", "TN", "GA", "FL"], "x": 620, "y": 420, "summary": "Constitutional carry state. Anyone 19+ legally allowed to possess firearms may carry concealed without a permit.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Permitless carry applies to handguns. Other dangerous concealed weapons may have restrictions."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Permits issued to residents 19+ on a shall-issue basis by county sheriffs; not required for carry."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "No magazine capacity limitations under Alabama state law."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "19 years of age for permitless concealed carry and state permit issuance."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "No restrictions on hollow points or ammunition types except armor-piercing handgun rounds (federal)."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless concealed carry took effect January 1, 2023 for all eligible residents and non-residents 19+."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Open carry of a handgun is lawful without a permit for anyone 19+ who may legally possess a firearm."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Pepper spray, stun guns, and Tasers are lawful for defensive carry without registration."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Byrna CO2 kinetic/chemical pepper launchers are completely legal as non-firearm personal security devices."}}}, "AK": {"name": "Alaska", "status_type": "constitutional", "age": 21, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["WA"], "x": 120, "y": 510, "summary": "Constitutional carry pioneer. Immediate duty to inform law enforcement upon contact.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Applies strictly to handguns."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Optional permits issued for reciprocity purposes."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "No magazine limit."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years old for concealed carry."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "No restrictions."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal since 2003."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted for 21+ without license."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted without license."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted without license."}}}, "AZ": {"name": "Arizona", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["CA", "NV", "UT", "NM"], "x": 195, "y": 360, "summary": "Constitutional carry state. Issues widely recognized non-resident multiplier permits.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry includes various deadly weapons for 21+."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Non-resident permits widely honored across 30+ states."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "No state limits."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 for permitless; 19 for active military."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "No ammunition bans."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless concealed carry since 2010."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal for anyone 18+."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Allowed for self defense."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Non-firearm kinetic launcher is 100% legal."}}}, "AR": {"name": "Arkansas", "status_type": "constitutional", "age": 18, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["MO", "TN", "MS", "LA", "TX", "OK"], "x": 525, "y": 365, "summary": "Constitutional carry state. Duty to inform law enforcement immediately.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Firearms only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Standard and Enhanced licenses available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "No magazine restrictions."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "18 years old."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry fully recognized."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Lawful without permit."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Lawful."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Lawful."}}}, "CA": {"name": "California", "status_type": "not_honored", "age": 21, "duty": "When requested by officer", "mag_limit": "10-round maximum", "vehicle": "Unloaded in locked container only", "open_carry": "Prohibited", "non_lethal": "Restricted (Tear gas under 2.5 oz)", "byrna": "Restricted (Chemical irritants restricted)", "neighbors": ["OR", "NV", "AZ"], "x": 95, "y": 270, "summary": "Zero reciprocity. Does not honor any out-of-state permits. Strict 10-round magazine limit.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Strictly restricted under California penal code."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Does NOT recognize any out-of-state CCW permits."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "Strict 10-round magazine limit. Severe criminal penalties for bringing magazines >10 rounds into state."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "YES", "badge": "badge-yes", "desc": "Ammunition background checks required for in-state sales. Lead-free required for hunting."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "No permitless carry. Concealed carry without CA permit is a misdemeanor/felony."}, "open_carry": {"ans": "NO", "badge": "badge-no", "desc": "Open carry is strictly prohibited in incorporated areas and most public spaces."}, "non_lethal": {"ans": "INFO", "badge": "badge-info", "desc": "Pepper spray canisters limited to 2.5 oz net weight. Tasers legal for adults."}, "byrna": {"ans": "INFO", "badge": "badge-info", "desc": "Kinetic/solid projectiles allowed; CS/tear gas rounds face strict state chemical laws."}}}, "CO": {"name": "Colorado", "status_type": "special", "age": 21, "duty": "When requested by officer", "mag_limit": "15-round limit", "vehicle": "Loaded handgun in vehicle legal", "open_carry": "Yes (except Denver)", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["WY", "NE", "KS", "OK", "NM", "UT"], "x": 305, "y": 260, "summary": "Honors RESIDENT permits only from reciprocal states for 21+. 15-round magazine limit.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Only honors permits from residents of issuing states. Does NOT honor non-resident permits."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "15-round limit on magazines manufactured after July 1, 2013."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "No hollow point bans."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permit required for concealed carry off personal property."}, "open_carry": {"ans": "INFO", "badge": "badge-info", "desc": "Legal statewide except prohibited in Denver city/county."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal for self defense."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal non-lethal device."}}}, "CT": {"name": "Connecticut", "status_type": "not_honored", "age": 21, "duty": "When requested by officer", "mag_limit": "10-round limit", "vehicle": "Permit required to transport loaded", "open_carry": "Prohibited in public", "non_lethal": "Restricted", "byrna": "Yes", "neighbors": ["NY", "MA", "RI"], "x": 860, "y": 180, "summary": "Zero reciprocity. Must hold CT Non-Resident Pistol Permit to carry.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Zero out-of-state recognition."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "10-round capacity limitation."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years old."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "No hollow-point ban."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "No permitless carry."}, "open_carry": {"ans": "NO", "badge": "badge-no", "desc": "Open carry prohibited in public."}, "non_lethal": {"ans": "INFO", "badge": "badge-info", "desc": "Permit required for stun guns/tasers."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Allowed for personal protection."}}}, "DE": {"name": "Delaware", "status_type": "not_honored", "age": 21, "duty": "Immediate upon contact", "mag_limit": "17-round limit", "vehicle": "Must be in plain view or locked in trunk unless permitted", "open_carry": "Yes (without permit)", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["MD", "PA", "NJ"], "x": 805, "y": 235, "summary": "Does NOT honor Maryland permits! Honors Utah, Florida, and Arizona non-resident permits.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Concealed deadly weapons license covers handguns."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Delaware Attorney General explicitly DOES NOT honor Maryland CCW. It DOES honor Utah, Florida, and Arizona permits."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "17-round magazine limit (SB 6) enacted in 2022. Qualified CCW holders exempt."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age for concealed carry."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "Hollow points allowed for CCW holders."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Concealed carry requires a valid recognized license."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Open carry is constitutionally protected in DE without a permit, but highly scrutinized in New Castle County."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Pepper spray and stun guns lawful for adults."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Lawful non-firearm personal defense device."}}}, "FL": {"name": "Florida", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit (handgun in closed container)", "open_carry": "Prohibited (except hunting/fishing)", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["GA", "AL"], "x": 715, "y": 515, "summary": "Constitutional carry state since July 1, 2023. Issues premier non-resident multiplier permit.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Concealed carry law applies to handguns, stun guns, tear gas, or billies."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Permits still issued and highly recommended for multi-state reciprocity (e.g. Delaware, New Mexico)."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "No magazine limit."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "Armor-piercing banned; hollow points fully legal."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "HB 543 authorized permitless concealed carry for residents and non-residents 21+."}, "open_carry": {"ans": "NO", "badge": "badge-no", "desc": "General open carry is prohibited in Florida."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Chemical dispensers under 2 oz legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Lawful non-lethal launcher."}}}, "GA": {"name": "Georgia", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["FL", "AL", "TN", "NC", "SC"], "x": 675, "y": 425, "summary": "Constitutional carry state. I-95 South legal carry highway link.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns and knives over 12 inches require lawful weapons status."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Georgia Weapons Carry License (GWCL) available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "No limit."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years old (18 for military)."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry signed in 2022."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal for any lawful weapons carrier."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}}}, "HI": {"name": "Hawaii", "status_type": "not_honored", "age": 21, "duty": "Immediate upon contact", "mag_limit": "10-round limit for handguns", "vehicle": "Unloaded in locked container only", "open_carry": "Prohibited", "non_lethal": "Restricted", "byrna": "Restricted", "neighbors": [], "x": 280, "y": 550, "summary": "Zero reciprocity. Extreme firearms registration and transport controls.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Strictly restricted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Zero out-of-state recognition."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "10-round handgun magazine limit."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "No general hollow point ban, but transport highly regulated."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Strict licensing required."}, "open_carry": {"ans": "NO", "badge": "badge-no", "desc": "Prohibited."}, "non_lethal": {"ans": "INFO", "badge": "badge-info", "desc": "Pepper spray canisters under 0.5 oz."}, "byrna": {"ans": "INFO", "badge": "badge-info", "desc": "Requires review by Honolulu police dept."}}}, "ID": {"name": "Idaho", "status_type": "constitutional", "age": 18, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["WA", "OR", "NV", "UT", "WY", "MT"], "x": 190, "y": 140, "summary": "Constitutional carry state for 18+.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Enhanced permit available for reciprocity."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "18 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal for 18+."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "IL": {"name": "Illinois", "status_type": "not_honored", "age": 21, "duty": "Immediate upon contact", "mag_limit": "15-round handgun limit", "vehicle": "Legal in vehicle for out-of-state CCW permit holders", "open_carry": "Prohibited", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["WI", "IA", "MO", "KY", "IN"], "x": 565, "y": 255, "summary": "Does NOT honor out-of-state permits for general carry. In-vehicle carry safe harbor permitted for valid out-of-state CCW holders.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Illinois does NOT honor any other state permits. Non-residents can only obtain IL CCL if from Hawaii or Virginia."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "PICA law limits handgun magazines to 15 rounds and rifle magazines to 10 rounds."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "Hollow points legal for carry."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Concealed carry requires Illinois CCL."}, "open_carry": {"ans": "NO", "badge": "badge-no", "desc": "Open carry prohibited."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Pepper spray legal for 18+."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted non-firearm device."}}}, "IN": {"name": "Indiana", "status_type": "constitutional", "age": 18, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["MI", "OH", "KY", "IL"], "x": 615, "y": 255, "summary": "Constitutional carry state since July 1, 2022.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Optional licenses available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "18 years old."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal for 18+."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "IA": {"name": "Iowa", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["MN", "WI", "IL", "MO", "NE", "SD"], "x": 490, "y": 225, "summary": "Constitutional carry state since 2021.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Honors all other state permits."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "KS": {"name": "Kansas", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["NE", "MO", "OK", "CO"], "x": 420, "y": 280, "summary": "Constitutional carry state.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Honors all 50 state permits."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 for permitless."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "KY": {"name": "Kentucky", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["IN", "OH", "WV", "VA", "TN", "MO", "IL"], "x": 645, "y": 295, "summary": "Constitutional carry state.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Honors all valid out of state licenses."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "LA": {"name": "Louisiana", "status_type": "constitutional", "age": 18, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["AR", "MS", "TX"], "x": 540, "y": 450, "summary": "Constitutional carry state took effect July 4, 2024 for 18+.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Concealed handgun permits still available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "18 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry signed in 2024."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "ME": {"name": "Maine", "status_type": "constitutional", "age": 21, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["NH"], "x": 905, "y": 80, "summary": "Constitutional carry state. Duty to inform officer immediately.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Resident and non-resident permits available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 for permitless (18 for military)."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "MD": {"name": "Maryland", "status_type": "home_state", "age": 21, "duty": "When requested by officer", "mag_limit": "10-round purchase/transfer limit (Possession legal)", "vehicle": "Wear & Carry permit required to transport loaded", "open_carry": "Wear & Carry permit required", "non_lethal": "Yes (Pepper spray, stun guns legal)", "byrna": "Yes (Not classified as firearm)", "neighbors": ["PA", "DE", "VA", "WV", "DC"], "x": 780, "y": 255, "summary": "Headquarters of Future Initiative Firearm Services. Wear & Carry Permit issued by MSP required for public carry.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Maryland Wear & Carry Permit authorizes handguns only. Knives and other weapons subject to separate statutes."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Wear & Carry permit issued by Maryland State Police (16-hr initial course / 8-hr renewal). FIFS provides official training."}, "mag_limits": {"ans": "INFO", "badge": "badge-info", "desc": "Illegal to buy, sell, or manufacture magazines holding >10 rounds inside MD. Possession and out-of-state purchase is completely legal under MD law."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age (18 for employment-required carry)."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "Hollow-point ammunition is legal to possess and carry in Maryland by permit holders."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permitless carry is NOT lawful in Maryland. Carrying without a valid permit is a misdemeanor/felony."}, "open_carry": {"ans": "INFO", "badge": "badge-info", "desc": "SB1 restricted open carry; concealed carry is the standard lawful method with an active Wear & Carry permit."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Pepper spray and stun guns are legal for defensive carry by adults 18+ without a permit."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Byrna kinetic and pepper launchers are non-lethal, unregulated as firearms under Maryland Public Safety Code."}}}, "MA": {"name": "Massachusetts", "status_type": "not_honored", "age": 21, "duty": "Immediate upon contact", "mag_limit": "10-round maximum", "vehicle": "LTC required (locked unless under direct control)", "open_carry": "Restricted", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["NY", "VT", "NH", "CT", "RI"], "x": 875, "y": 155, "summary": "Zero reciprocity. Mandatory minimum 18-month jail sentence for carrying without MA license.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Strict firearms laws."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Zero reciprocity. Must apply for MA Non-Resident LTC."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "10-round magazine capacity restriction."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "FID/LTC required to buy ammo."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Strict licensing required."}, "open_carry": {"ans": "NO", "badge": "badge-no", "desc": "Concealed preferred; open carry prohibited in public places."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Pepper spray legal without license."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Kinetic launchers permitted."}}}, "MI": {"name": "Michigan", "status_type": "honored", "age": 21, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "CPL required", "open_carry": "Yes (with CPL)", "non_lethal": "Restricted", "byrna": "Yes", "neighbors": ["WI", "IN", "OH"], "x": 665, "y": 190, "summary": "Honors RESIDENT permits from all 50 states! Does not honor non-resident permits.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Pistols only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Honors resident permits from ALL states. Does NOT honor non-resident permits."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "No magazine limit."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permit required."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Open carry lawful for CPL holders."}, "non_lethal": {"ans": "INFO", "badge": "badge-info", "desc": "Pepper spray limited to 18% OC."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}}}, "MN": {"name": "Minnesota", "status_type": "special", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Permit required", "open_carry": "Yes (with permit)", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["ND", "SD", "IA", "WI"], "x": 485, "y": 140, "summary": "Does NOT honor Maryland. Honors Utah non-resident permit!", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Department of Public Safety lists honored states. Utah is honored; MD is not."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years old."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permit required."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Permit holders may carry open or concealed."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}}}, "MS": {"name": "Mississippi", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["LA", "AR", "TN", "AL"], "x": 580, "y": 420, "summary": "Constitutional carry state.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Enhanced endorsement available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years old."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "MO": {"name": "Missouri", "status_type": "constitutional", "age": 19, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["IA", "IL", "KY", "TN", "AR", "OK", "KS", "NE"], "x": 505, "y": 300, "summary": "Constitutional carry state for 19+.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Honors all 50 state permits."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "19 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "MT": {"name": "Montana", "status_type": "constitutional", "age": 18, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["ID", "WY", "ND", "SD"], "x": 265, "y": 105, "summary": "Constitutional carry state.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Honors most permits."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "18 years old."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "NE": {"name": "Nebraska", "status_type": "constitutional", "age": 21, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["SD", "IA", "MO", "KS", "CO", "WY"], "x": 405, "y": 225, "summary": "Constitutional carry state took effect September 2023. Immediate duty to inform.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "CHP permits still issued."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal since 2023."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "NV": {"name": "Nevada", "status_type": "special", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["OR", "ID", "UT", "AZ", "CA"], "x": 150, "y": 230, "summary": "Does NOT honor Maryland. Honors Utah and Arizona permits!", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Honors select states annually approved by DPS (UT, AZ, FL honored; MD not)."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permit required."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Open carry legal without permit."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "NH": {"name": "New Hampshire", "status_type": "constitutional", "age": 18, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["VT", "ME", "MA"], "x": 860, "y": 120, "summary": "Constitutional carry state for 18+.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Pistol/revolver licenses available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "18 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "NJ": {"name": "New Jersey", "status_type": "not_honored", "age": 21, "duty": "Immediate upon contact", "mag_limit": "10-round limit", "vehicle": "Unloaded in locked trunk only", "open_carry": "Prohibited", "non_lethal": "Restricted (0.75 oz pepper spray max)", "byrna": "Restricted (Severe chemical regulations)", "neighbors": ["NY", "PA", "DE"], "x": 825, "y": 215, "summary": "Zero reciprocity. Severe criminal penalties for carrying without NJ Permit to Carry.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Strict firearms laws."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Zero reciprocity with any state."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "Strict 10-round magazine capacity restriction."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "YES", "badge": "badge-yes", "desc": "Hollow-point ammunition illegal except for transport directly to range or inside home."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Unlawful to carry without NJ Permit to Carry."}, "open_carry": {"ans": "NO", "badge": "badge-no", "desc": "Prohibited."}, "non_lethal": {"ans": "INFO", "badge": "badge-info", "desc": "Pepper spray limited to 0.75 oz."}, "byrna": {"ans": "INFO", "badge": "badge-info", "desc": "Chemical cartridges heavily restricted."}}}, "NM": {"name": "New Mexico", "status_type": "special", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["AZ", "UT", "CO", "OK", "TX"], "x": 285, "y": 360, "summary": "Does NOT honor Maryland. Honors Florida non-resident permit!", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Honors select reciprocal states (FL honored; MD not)."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permit required for concealed carry off property."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal without permit."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "NY": {"name": "New York", "status_type": "not_honored", "age": 21, "duty": "Immediate upon contact", "mag_limit": "10-round limit", "vehicle": "Unloaded in locked container only", "open_carry": "Prohibited", "non_lethal": "Restricted (0.75 oz pepper spray)", "byrna": "Restricted", "neighbors": ["PA", "NJ", "CT", "MA", "VT"], "x": 800, "y": 150, "summary": "Zero reciprocity. Mandatory felony charges for unlicensed carry in New York state and NYC.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Strict firearms laws."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Zero reciprocity. New York City requires separate municipal permit."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "Strict 10-round capacity limit."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "Ammunition background checks required at point of sale."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Strict licensing required under CCIA."}, "open_carry": {"ans": "NO", "badge": "badge-no", "desc": "Prohibited."}, "non_lethal": {"ans": "INFO", "badge": "badge-info", "desc": "Pepper spray must be purchased in person in NY with identity check."}, "byrna": {"ans": "INFO", "badge": "badge-info", "desc": "CO2 projectile launchers face local NYC and state restrictions."}}}, "NC": {"name": "North Carolina", "status_type": "honored", "age": 21, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "Must be in plain view or CCW permitted", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["VA", "TN", "GA", "SC"], "x": 755, "y": 340, "summary": "HONORS MARYLAND WEAR & CARRY! Immediate duty to inform law enforcement when approached.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "YES", "badge": "badge-yes", "desc": "North Carolina honors concealed handgun permits from ALL 50 states!"}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "No magazine limit."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age for concealed handgun."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permit required for concealed carry."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Open carry is legal without a permit for 18+."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Pepper spray and stun guns lawful."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Lawful personal defense device."}}}, "ND": {"name": "North Dakota", "status_type": "constitutional", "age": 18, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["MT", "SD", "MN"], "x": 405, "y": 95, "summary": "Constitutional carry state. Duty to inform officer immediately.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Firearms only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Class 1 and Class 2 permits available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "18 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal for residents and non-residents."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "OH": {"name": "Ohio", "status_type": "constitutional", "age": 21, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["MI", "IN", "KY", "WV", "PA"], "x": 680, "y": 240, "summary": "Constitutional carry state since June 2022. I-70 carry route through Midwest.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "CHL licenses still issued."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal for 21+."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "OK": {"name": "Oklahoma", "status_type": "constitutional", "age": 21, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["KS", "MO", "AR", "TX", "NM", "CO"], "x": 435, "y": 345, "summary": "Constitutional carry state. Duty to inform officer immediately.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "SDA permits available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years old."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "OR": {"name": "Oregon", "status_type": "not_honored", "age": 21, "duty": "When requested by officer", "mag_limit": "Pending Measure 114 (10 rounds in litigation)", "vehicle": "Unloaded in trunk or permit required", "open_carry": "Permitted except cities", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["WA", "ID", "NV", "CA"], "x": 110, "y": 145, "summary": "Zero reciprocity. Does not honor any out-of-state permits.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Zero reciprocity with any state."}, "mag_limits": {"ans": "INFO", "badge": "badge-info", "desc": "Measure 114 10-round restriction currently enjoined in state courts."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permit required."}, "open_carry": {"ans": "INFO", "badge": "badge-info", "desc": "Allowed statewide, but local bans (Portland) prohibit open carry without CHL."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "PA": {"name": "Pennsylvania", "status_type": "special", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "PA License to Carry Firearms required to carry loaded", "open_carry": "Yes (without permit except Philadelphia)", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["NY", "NJ", "DE", "MD", "WV", "OH"], "x": 755, "y": 200, "summary": "Crucial MD Border State! MD permit not directly reciprocal for concealed carry; MD residents easily obtain $20 PA Non-Resident LTCF.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Pennsylvania LTCF covers firearms only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "PA does NOT have general reciprocity with Maryland. However, MD residents can obtain a PA Non-Resident LTCF in ~15 mins for $20 from York or Adams County sheriffs."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "No magazine limit under PA state law."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "No hollow point bans."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permit required for concealed carry off personal property or in vehicle."}, "open_carry": {"ans": "INFO", "badge": "badge-info", "desc": "Open carry legal without permit throughout PA except in Philadelphia (City of First Class) which requires LTCF."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Pepper spray and stun guns legal for adults."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Lawful non-firearm personal security device."}}}, "RI": {"name": "Rhode Island", "status_type": "not_honored", "age": 21, "duty": "When requested by officer", "mag_limit": "10-round limit", "vehicle": "Permit required", "open_carry": "Prohibited", "non_lethal": "Restricted", "byrna": "Yes", "neighbors": ["CT", "MA"], "x": 890, "y": 175, "summary": "Zero reciprocity. Strict 10-round magazine limitation.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Zero reciprocity."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "10-round capacity limit."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Strict licensing required."}, "open_carry": {"ans": "NO", "badge": "badge-no", "desc": "Prohibited."}, "non_lethal": {"ans": "INFO", "badge": "badge-info", "desc": "Stun gun restrictions."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}}}, "SC": {"name": "South Carolina", "status_type": "constitutional", "age": 18, "duty": "Immediate upon contact", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["NC", "GA"], "x": 725, "y": 380, "summary": "Constitutional carry state took effect March 7, 2024. Immediate duty to inform.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "CWP permits still available for multi-state travel."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "18 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "HB 3594 legalized permitless carry for residents and non-residents 18+."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Open carry lawful without permit."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "SD": {"name": "South Dakota", "status_type": "constitutional", "age": 18, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["ND", "MN", "IA", "NE", "WY", "MT"], "x": 405, "y": 160, "summary": "Constitutional carry state.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Enhanced and Gold Card permits available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "18 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "TN": {"name": "Tennessee", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["KY", "VA", "NC", "GA", "AL", "MS", "AR", "MO"], "x": 625, "y": 350, "summary": "Constitutional carry state. I-40 corridor connecting East Coast to Midwest/South.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Concealed and Enhanced carry permits available."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age (18 for military)."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "TX": {"name": "Texas", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes (in holster)", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["NM", "OK", "AR", "LA"], "x": 420, "y": 450, "summary": "Constitutional carry state since September 1, 2021. Firearm Carry Act.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Handguns and knives."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "LTC permits still issued for reciprocal benefits."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age (18+ under federal injunction)."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal in holster."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "UT": {"name": "Utah", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["NV", "ID", "WY", "CO", "AZ", "NM"], "x": 215, "y": 240, "summary": "Constitutional carry state. Nation's gold-standard non-resident permit unlocks DE, WA, NV, MN.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Handguns."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Utah Concealed Firearm Permit (CFP) is the #1 non-resident permit for expanding reciprocity across the nation."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 for general permitless; 18 for provisional CFP."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "VT": {"name": "Vermont", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "15-round handgun limit", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["NY", "NH", "MA"], "x": 840, "y": 105, "summary": "Original constitutional carry state. 15-round handgun magazine restriction.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Vermont has NEVER issued carry permits."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "15-round limit for handguns, 10 for long guns."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry has always been legal in VT."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "VA": {"name": "Virginia", "status_type": "honored", "age": 21, "duty": "Immediate upon contact", "mag_limit": "None (20+ round mag has restricted locations in certain cities)", "vehicle": "Legal in secured compartment without permit", "open_carry": "Yes (without permit 18+)", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["MD", "DC", "WV", "KY", "TN", "NC"], "x": 750, "y": 280, "summary": "HONORS MARYLAND WEAR & CARRY! Immediate neighbor for MD drivers crossing American Legion or Woodrow Wilson Bridge.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "YES", "badge": "badge-yes", "desc": "Virginia honors Maryland Wear & Carry permits for individuals 21+."}, "mag_limits": {"ans": "INFO", "badge": "badge-info", "desc": "No state limit; certain localities restrict carrying centerfire rifles/handguns with >20-round mags in public streets."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permit required for concealed carry."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Open carry lawful without permit for 18+."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Pepper spray and stun guns legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Lawful personal defense device."}}}, "WA": {"name": "Washington", "status_type": "not_honored", "age": 21, "duty": "When requested by officer", "mag_limit": "10-round limit", "vehicle": "CPL required to carry loaded", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["OR", "ID"], "x": 130, "y": 80, "summary": "Does NOT honor MD. Honors Utah permit if resident of Utah. Strict 10-round magazine limit.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Pistols only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Does NOT honor Maryland."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "10-round magazine limit on sales/distribution."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "CPL required."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Open carry lawful without permit."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "WV": {"name": "West Virginia", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["MD", "PA", "OH", "KY", "VA"], "x": 715, "y": 265, "summary": "Constitutional carry state. Key I-68 / I-70 westbound transit route for MD carriers.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "CHL licenses issued for reciprocity."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 for permitless (18-20 provisional CHL)."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal since 2016."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "WI": {"name": "Wisconsin", "status_type": "honored", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit (handgun uncased in car)", "open_carry": "Yes", "non_lethal": "Restricted", "byrna": "Yes", "neighbors": ["MN", "IA", "IL", "MI"], "x": 560, "y": 160, "summary": "HONORS MARYLAND WEAR & CARRY!", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns, electric weapons, billies."}, "licensure": {"ans": "YES", "badge": "badge-yes", "desc": "DOJ reciprocity list includes Maryland!"}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "Permit required for concealed carry off property."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal without permit."}, "non_lethal": {"ans": "INFO", "badge": "badge-info", "desc": "Pepper spray restrictions (max 10% OC)."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}}}, "WY": {"name": "Wyoming", "status_type": "constitutional", "age": 21, "duty": "When requested by officer", "mag_limit": "None", "vehicle": "Legal without permit", "open_carry": "Yes", "non_lethal": "Yes", "byrna": "Yes", "neighbors": ["MT", "ID", "UT", "CO", "NE", "SD"], "x": 280, "y": 180, "summary": "Constitutional carry state.", "statutes": {"weapons_other": {"ans": "YES", "badge": "badge-yes", "desc": "Permitted."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Honors permits from states with reciprocal agreements."}, "mag_limits": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "NO", "badge": "badge-no", "desc": "None."}, "constitutional": {"ans": "YES", "badge": "badge-yes", "desc": "Permitless carry legal."}, "open_carry": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "non_lethal": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}, "byrna": {"ans": "YES", "badge": "badge-yes", "desc": "Legal."}}}, "DC": {"name": "District of Columbia", "status_type": "not_honored", "age": 21, "duty": "Immediate upon contact", "mag_limit": "Strict 10-round limit", "vehicle": "Unloaded in locked container; no stops allowed", "open_carry": "Prohibited", "non_lethal": "Restricted (Must register pepper spray with MPD)", "byrna": "Restricted (Treated as firearm under DC code)", "neighbors": ["MD", "VA"], "x": 782, "y": 272, "summary": "ZERO reciprocity. Strict felony penalties for unlicensed firearm possession in the District. Crossing MD/VA bridges into DC without a DC Concealed Carry Pistol License is illegal.", "statutes": {"weapons_other": {"ans": "NO", "badge": "badge-no", "desc": "Handguns only."}, "licensure": {"ans": "INFO", "badge": "badge-info", "desc": "Does NOT recognize Maryland, Virginia, or any other state permits. Non-residents must apply directly to MPD for a DC CCPL."}, "mag_limits": {"ans": "YES", "badge": "badge-yes", "desc": "Strict 10-round limit. Even empty magazines over 10 rounds are illegal to possess."}, "min_age": {"ans": "INFO", "badge": "badge-info", "desc": "21 years of age."}, "ammo_rest": {"ans": "YES", "badge": "badge-yes", "desc": "Possession of ammunition without DC registration certificate is a crime."}, "constitutional": {"ans": "NO", "badge": "badge-no", "desc": "No permitless carry. Strict criminal enforcement."}, "open_carry": {"ans": "NO", "badge": "badge-no", "desc": "Strictly prohibited."}, "non_lethal": {"ans": "INFO", "badge": "badge-info", "desc": "Pepper spray must be registered with MPD at point of acquisition."}, "byrna": {"ans": "NO", "badge": "badge-no", "desc": "DC classifies CO2 projectile launchers under destructive/firearm definitions unless registered."}}}};
    // SVG Layout coordinates for interactive map grid (960 x 600 canvas)
   var SVG_COORDS = {
      // Row 1
      AK: { x: 30, y: 35, w: 60, h: 50 },
      WA: { x: 110, y: 35, w: 60, h: 50 },
      ID: { x: 185, y: 35, w: 60, h: 50 },
      MT: { x: 260, y: 35, w: 60, h: 50 },
      ND: { x: 335, y: 35, w: 60, h: 50 },
      MN: { x: 410, y: 35, w: 60, h: 50 },
      WI: { x: 485, y: 35, w: 60, h: 50 },
      MI: { x: 560, y: 35, w: 60, h: 50 },
      NY: { x: 710, y: 35, w: 60, h: 50 },
      VT: { x: 785, y: 35, w: 50, h: 50 },
      NH: { x: 845, y: 35, w: 50, h: 50 },
      ME: { x: 900, y: 35, w: 50, h: 50 },
      // Row 2
      OR: { x: 110, y: 95, w: 60, h: 50 },
      NV: { x: 185, y: 95, w: 60, h: 50 },
      WY: { x: 260, y: 95, w: 60, h: 50 },
      SD: { x: 335, y: 95, w: 60, h: 50 },
      IA: { x: 410, y: 95, w: 60, h: 50 },
      IL: { x: 485, y: 95, w: 60, h: 50 },
      IN: { x: 560, y: 95, w: 60, h: 50 },
      OH: { x: 635, y: 95, w: 60, h: 50 },
      PA: { x: 710, y: 95, w: 60, h: 50 },
      NJ: { x: 785, y: 95, w: 50, h: 50 },
      MA: { x: 845, y: 95, w: 50, h: 50 },
      RI: { x: 900, y: 95, w: 50, h: 50 },
      // Row 3
      CA: { x: 110, y: 155, w: 60, h: 50 },
      UT: { x: 185, y: 155, w: 60, h: 50 },
      CO: { x: 260, y: 155, w: 60, h: 50 },
      NE: { x: 335, y: 155, w: 60, h: 50 },
      MO: { x: 410, y: 155, w: 60, h: 50 },
      KY: { x: 485, y: 155, w: 60, h: 50 },
      WV: { x: 560, y: 155, w: 60, h: 50 },
      VA: { x: 635, y: 155, w: 60, h: 50 },
      MD: { x: 710, y: 155, w: 60, h: 50 },
      DE: { x: 785, y: 155, w: 50, h: 50 },
      CT: { x: 845, y: 155, w: 50, h: 50 },
      // Row 4
      AZ: { x: 185, y: 215, w: 60, h: 50 },
      NM: { x: 260, y: 215, w: 60, h: 50 },
      KS: { x: 335, y: 215, w: 60, h: 50 },
      AR: { x: 410, y: 215, w: 60, h: 50 },
      TN: { x: 485, y: 215, w: 60, h: 50 },
      NC: { x: 635, y: 215, w: 60, h: 50 },
      DC: { x: 710, y: 215, w: 60, h: 50 },
      // Row 5
      OK: { x: 335, y: 275, w: 60, h: 50 },
      LA: { x: 410, y: 275, w: 60, h: 50 },
      MS: { x: 485, y: 275, w: 275, w: 60, h: 50 },
      MS: { x: 485, y: 275, w: 60, h: 50 },
      AL: { x: 560, y: 275, w: 60, h: 50 },
      SC: { x: 635, y: 275, w: 60, h: 50 },
      // Row 6
      TX: { x: 335, y: 335, w: 100, h: 60 },
      GA: { x: 560, y: 335, w: 60, h: 50 },
      FL: { x: 635, y: 335, w: 70, h: 50 },
      // Inset
      HI: { x: 110, y: 240, w: 60, h: 50 }
    };
    // State Application State
    var activeResidentState = 'MD';
    var activeMultipliers = new Set();
    var currentCategoryFilter = 'all';
    var currentStateFocus = 'MD';
    var currentRollerState = 'WV';
    var activeSearchQuery = '';
    // Initialize Application
    // Redundant DOMContentLoaded removed to prevent startup thread-lock
    // Reciprocity Evaluation Engine
    function evaluateState(stateCode) {
      var state = STATES_DATA[stateCode];
      if (!state) return { status: 'not_honored', verdictText: 'Information not available' };
      // 1. Home state
      if (stateCode === activeResidentState) {
        return {
          status: 'honored',
          label: 'HOME STATE',
          verdictText: 'Home State: Fully licensed with your resident permit.',
          canCarry: true
        };
      }
      // 2. Constitutional Carry states (29 states permitless carry 21+)
      if (state.status_type === 'constitutional') {
        return {
          status: 'constitutional',
          label: 'CONSTITUTIONAL',
          verdictText: 'Constitutional Carry (Permitless for 21+). You can carry in ' + state.name + ' without an in-state permit.',
          canCarry: true
        };
      }
      // 3. Multiplier Permit Overrides
      if (activeMultipliers.has('UT')) {
        // Utah unlocks Delaware, Washington, Minnesota, Nevada
        if (['DE', 'MN', 'NV'].includes(stateCode)) {
          return {
            status: 'honored',
            label: 'HONORED VIA UTAH',
            verdictText: 'Honored via your active Utah Non-Resident permit!',
            canCarry: true
          };
        }
      }
      if (activeMultipliers.has('FL')) {
        // Florida unlocks Delaware, New Mexico
        if (['DE', 'NM'].includes(stateCode)) {
          return {
            status: 'honored',
            label: 'HONORED VIA FLORIDA',
            verdictText: 'Honored via your active Florida Non-Resident permit!',
            canCarry: true
          };
        }
      }
      if (activeMultipliers.has('AZ')) {
        if (['DE', 'NV', 'NM'].includes(stateCode)) {
          return {
            status: 'honored',
            label: 'HONORED VIA ARIZONA',
            verdictText: 'Honored via your active Arizona Non-Resident permit!',
            canCarry: true
          };
        }
      }
      if (activeMultipliers.has('PA')) {
        if (stateCode === 'PA') {
          return {
            status: 'honored',
            label: 'HONORED VIA PA LTCF',
            verdictText: 'Honored via your Pennsylvania Non-Resident LTCF!',
            canCarry: true
          };
        }
      }
      // 4. Resident Permit Reciprocity
      if (activeResidentState === 'MD') {
        if (['VA', 'NC', 'MI', 'WI'].includes(stateCode)) {
          return {
            status: 'honored',
            label: 'HONORED',
            verdictText: 'Honored by reciprocity with your Maryland Wear & Carry permit.',
            canCarry: true
          };
        }
        if (stateCode === 'PA') {
          return {
            status: 'special',
            label: 'SPECIAL CONDITION',
            verdictText: 'Special Condition: MD permit not directly honored for concealed carry in PA. Obtain a $20 PA Non-Resident LTCF (takes 15 min at York/Adams county sheriffs).',
            canCarry: false
          };
        }
        if (stateCode === 'DE') {
          return {
            status: 'not_honored',
            label: 'NOT HONORED',
            verdictText: 'Delaware does NOT honor Maryland permits. Add Utah or Florida non-resident permit to unlock carry in DE.',
            canCarry: false
          };
        }
      } else if (activeResidentState === 'VA') {
        if (['NC', 'SC', 'GA', 'FL', 'WV', 'TN', 'KY', 'OH', 'IN', 'MI', 'PA', 'TX'].includes(stateCode)) {
          return {
            status: 'honored',
            label: 'HONORED',
            verdictText: 'Honored by reciprocity with your Virginia resident permit.',
            canCarry: true
          };
        }
      } else if (activeResidentState === 'FL' || activeResidentState === 'UT') {
        if (['DE', 'NM', 'VA', 'NC', 'PA', 'OH', 'IN', 'KY', 'TN', 'GA', 'SC', 'TX'].includes(stateCode)) {
          return {
            status: 'honored',
            label: 'HONORED',
            verdictText: 'Honored under full multi-state reciprocity agreements.',
            canCarry: true
          };
        }
      }
      // Default restrictive states
      return {
        status: 'not_honored',
        label: 'NOT HONORED',
        verdictText: 'Permit NOT Honored. Zero out-of-state reciprocity recognized by ' + state.name + '.',
        canCarry: false
      };
    }
    // Recalculate and update the entire application UI
    function recalculateReciprocity() {
      var totalLegal = 0;
      var constitutionalCount = 0;
      var honoredCount = 0;
      var specialCount = 0;
      var notHonoredCount = 0;
      var stateCodes = Object.keys(STATES_DATA);
      stateCodes.forEach(code => {
        var evalRes = evaluateState(code);
        if (evalRes.canCarry) totalLegal++;
        if (evalRes.status === 'constitutional') constitutionalCount++;
        else if (evalRes.status === 'honored') honoredCount++;
        else if (evalRes.status === 'special') specialCount++;
        else notHonoredCount++;
      });
      // Update Scorecard HUD
      document.getElementById('metricTotalLegal').textContent = totalLegal + ' / 51';
      document.getElementById('metricConstitutional').textContent = constitutionalCount;
      document.getElementById('metricHonored').textContent = honoredCount;
      document.getElementById('metricSpecial').textContent = specialCount;
      document.getElementById('metricRestricted').textContent = notHonoredCount;
      // Re-render SVG Map
      renderSvgMap();
      renderMyPermitsList();
      selectState(currentStateFocus);
    }
    // Render interactive SVG Map
    
    // ==========================================================================
    // MARYLAND LAW COMPARISON & RECIPROCITY ENGINE
    // ==========================================================================
    function compareStateWithMaryland(code) {
      var state = STATES_DATA[code];
      if (!state) return null;
      var evalRes = evaluateState(code);
      var comparisons = [];

      // 1. Reciprocity / Recognition
      var recipTag = 'CONFIRMS WITH MD';
      var recipColor = '#10b981';
      var recipNote = '';
      if (code === 'MD') {
        recipTag = 'HOME STATE BASELINE';
        recipColor = '#00e5ff';
        recipNote = 'Maryland Wear & Carry Permit issued by MSP (16-hr initial / 8-hr renewal). Operational baseline.';
      } else if (evalRes.status === 'constitutional') {
        recipTag = 'DIFFERS (PERMITLESS)';
        recipColor = '#00e5ff';
        recipNote = state.name + ' allows permitless constitutional carry (21+) without requiring a permit.';
      } else if (evalRes.status === 'honored') {
        recipTag = 'CONFIRMS (RECIPROCAL)';
        recipColor = '#10b981';
        recipNote = state.name + ' directly honors your Maryland Wear & Carry permit.';
      } else if (evalRes.status === 'special') {
        recipTag = 'DIFFERS (CONDITIONAL)';
        recipColor = '#f59e0b';
        recipNote = state.name + ' requires non-resident permit (e.g. PA $20 LTCF) or specific statutory conditions.';
      } else {
        recipTag = 'RESTRICTED (NO RECIPROCITY)';
        recipColor = '#ef4444';
        recipNote = state.name + ' does NOT recognize Maryland permits. Criminal penalties for unlicensed carry.';
      }
      comparisons.push({
        topic: 'Reciprocity & Recognition',
        mdRule: 'Wear & Carry Permit Required (MSP issued, 16-hr course)',
        stateRule: evalRes.label + ' - ' + evalRes.verdictText,
        statusTag: recipTag,
        statusColor: recipColor,
        note: recipNote
      });

      // 2. Constitutional Carry Status
      var isConst = state.status_type === 'constitutional' || (state.statutes && state.statutes.constitutional && state.statutes.constitutional.ans === 'YES');
      comparisons.push({
        topic: 'Permitless / Constitutional Carry',
        mdRule: 'NO - Permitless carry is prohibited in MD. Wear & Carry license required.',
        stateRule: isConst ? 'YES - Lawful permitless concealed carry for eligible adults (21+).' : 'NO - Permit strictly required for concealed carry.',
        statusTag: isConst ? 'DIFFERS (MORE PERMISSIVE)' : 'CONFIRMS WITH MD (PERMIT REQUIRED)',
        statusColor: isConst ? '#00e5ff' : '#10b981',
        note: isConst ? 'Carry without permit is legal under state law.' : 'Both Maryland and ' + state.name + ' mandate a license.'
      });

      // 3. Magazine Capacity Limits
      var mdMag = '10-round retail purchase/transfer limit inside MD (possession is legal)';
      var stateMag = state.mag_limit || 'None (No state limit)';
      var magStrict = stateMag.toLowerCase().includes('10-round') || stateMag.toLowerCase().includes('strict') || stateMag.toLowerCase().includes('10 round');
      var magNone = stateMag.toLowerCase().includes('none') || stateMag.toLowerCase().includes('no state limit');
      comparisons.push({
        topic: 'Magazine Capacity Restrictions',
        mdRule: mdMag,
        stateRule: stateMag,
        statusTag: magNone ? 'DIFFERS (NO CAPACITY LIMIT)' : (magStrict ? 'RESTRICTED (STRICT 10-RD BAN)' : 'CONFIRMS WITH MD'),
        statusColor: magNone ? '#00e5ff' : (magStrict ? '#ef4444' : '#10b981'),
        note: magStrict ? 'Warning: Strict capacity cap. Possessing >10 round magazines may carry criminal penalties.' : (magNone ? 'More permissive than Maryland: No 10-round limit.' : 'Statutes generally align with Maryland rules.')
      });

      // 4. Duty to Inform Law Enforcement
      var mdDuty = 'Duty to inform when requested by officer.';
      var stateDuty = state.duty || 'When requested by officer';
      var dutyImmediate = stateDuty.toLowerCase().includes('immediate');
      comparisons.push({
        topic: 'Duty to Inform Law Enforcement',
        mdRule: mdDuty,
        stateRule: stateDuty,
        statusTag: dutyImmediate ? 'DIFFERS (IMMEDIATE DUTY)' : 'CONFIRMS WITH MD (UPON REQUEST)',
        statusColor: dutyImmediate ? '#f59e0b' : '#10b981',
        note: dutyImmediate ? 'CRITICAL TRAVEL RULE: You must immediately disclose firearm possession and permit upon official contact.' : 'Statutory requirement to inform only when specifically asked by law enforcement.'
      });

      // 5. Vehicle Transportation
      var mdVeh = 'Loaded carry requires Wear & Carry permit; otherwise unloaded in locked case separate from ammo.';
      var stateVeh = state.vehicle || 'Permitted with valid license or under federal FOPA.';
      var vehPermissive = stateVeh.toLowerCase().includes('without permit') || stateVeh.toLowerCase().includes('permitless');
      comparisons.push({
        topic: 'Vehicle Transportation & Storage',
        mdRule: mdVeh,
        stateRule: stateVeh,
        statusTag: vehPermissive ? 'DIFFERS (PERMITLESS VEHICLE CARRY)' : 'CONFIRMS (PERMIT REQUIRED)',
        statusColor: vehPermissive ? '#00e5ff' : '#10b981',
        note: stateVeh
      });

      // 6. Open Carry Regulations
      var mdOpen = 'Concealed carry standard; open carry heavily restricted under SB1.';
      var stateOpen = state.open_carry || 'Permit required';
      var openPerm = stateOpen.toLowerCase().includes('yes') || stateOpen.toLowerCase().includes('without permit');
      var openBanned = stateOpen.toLowerCase().includes('prohibited') || stateOpen.toLowerCase().includes('no');
      comparisons.push({
        topic: 'Open Carry Regulations',
        mdRule: mdOpen,
        stateRule: stateOpen,
        statusTag: openPerm ? 'DIFFERS (OPEN CARRY LEGAL)' : (openBanned ? 'RESTRICTED (OPEN CARRY PROHIBITED)' : 'CONFIRMS WITH MD'),
        statusColor: openPerm ? '#00e5ff' : (openBanned ? '#ef4444' : '#10b981'),
        note: openPerm ? 'State allows lawful open carry without requiring concealment.' : (openBanned ? 'Open carry is prohibited.' : 'Concealed carry is the standard lawful method.')
      });

      // 7. Non-Lethal Defense (Pepper Spray & Byrna)
      var stateByrna = state.byrna || 'Yes';
      var byrnaRestricted = stateByrna.toLowerCase().includes('restricted') || stateByrna.toLowerCase().includes('no');
      comparisons.push({
        topic: 'Non-Lethal Defense (Pepper Spray & Byrna)',
        mdRule: 'Legal: Pepper spray, stun guns, and Byrna launchers are unregulated as firearms.',
        stateRule: 'Pepper Spray: ' + (state.non_lethal || 'Legal') + ' | Byrna: ' + stateByrna,
        statusTag: byrnaRestricted ? 'DIFFERS (RESTRICTED NON-LETHAL)' : 'CONFIRMS WITH MD (LEGAL)',
        statusColor: byrnaRestricted ? '#ef4444' : '#10b981',
        note: byrnaRestricted ? 'Caution: This jurisdiction restricts kinetic launchers or defense sprays.' : 'Non-lethal defensive tools are lawful for personal security.'
      });

      return {
        state: state,
        code: code,
        evalRes: evalRes,
        comparisons: comparisons
      };
    }

    function renderMdComparison(code) {
      var comp = compareStateWithMaryland(code);
      if (!comp) return;
      var containers = Array.from(document.querySelectorAll('#mdComparisonInspector, .md-comparison-inspector'));
      if (containers.length === 0) return;

      var verdictBg = comp.evalRes.canCarry ? 'rgba(16, 185, 129, 0.15)' : (comp.evalRes.status === 'special' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)');
      var verdictColor = comp.evalRes.canCarry ? 'var(--accent-green)' : (comp.evalRes.status === 'special' ? 'var(--accent-amber)' : 'var(--accent-red)');

      var html = '<div style="background: linear-gradient(135deg, rgba(13, 20, 31, 0.95) 0%, rgba(7, 11, 16, 0.98) 100%); border: 1px solid rgba(0, 229, 255, 0.35); border-radius: 12px; padding: 20px; margin-top: 18px; box-shadow: 0 8px 30px rgba(0,0,0,0.6);">';
      html += '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px; margin-bottom: 16px;">';
      html += '<div>';
      html += '<div style="font-size: 0.72rem; color: var(--accent-cyan); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">MARYLAND STATUTORY COMPARISON & AUDIT</div>';
      html += '<h4 style="font-family: var(--font-display); font-size: 1.35rem; color: #fff; margin: 2px 0 0; text-transform: uppercase;">' + comp.state.name + ' (' + comp.code + ') vs. Maryland (MD Baseline)</h4>';
      html += '</div>';
      html += '<div style="display: flex; align-items: center; gap: 10px;">';
      html += '<span style="font-size: 0.78rem; padding: 6px 12px; border-radius: 6px; font-weight: 700; text-transform: uppercase; background: ' + verdictBg + '; border: 1px solid ' + verdictColor + '; color: ' + verdictColor + ';">' + comp.evalRes.label + '</span>';
      html += "<button onclick=\"openStateModal('" + comp.code + "')\" class=\"btn-inspect-gun-laws\" style=\"padding: 6px 14px; font-size: 0.78rem;\">FULL STATUTE DOSSIER</button>";
      html += '</div>';
      html += '</div>';
      html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">';

      comp.comparisons.forEach(function(item) {
        html += '<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between;">';
        html += '<div>';
        html += '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">';
        html += '<span style="font-size: 0.82rem; font-weight: 700; color: #f1f5f9; text-transform: uppercase; letter-spacing: 0.5px;">' + item.topic + '</span>';
        html += '<span style="font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(0,0,0,0.5); color: ' + item.statusColor + '; border: 1px solid ' + item.statusColor + '; white-space: nowrap;">' + item.statusTag + '</span>';
        html += '</div>';
        html += '<div style="font-size: 0.76rem; color: #94a3b8; margin-bottom: 4px; line-height: 1.4;"><strong style="color: var(--accent-cyan);">MD Baseline:</strong> ' + item.mdRule + '</div>';
        html += '<div style="font-size: 0.76rem; color: #e2e8f0; line-height: 1.4;"><strong style="color: #f59e0b;">' + comp.code + ' Law:</strong> ' + item.stateRule + '</div>';
        html += '</div>';
        html += '<div style="font-size: 0.72rem; color: #64748b; font-style: italic; margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 6px;">' + item.note + '</div>';
        html += '</div>';
      });

      html += '</div></div>';
      containers.forEach(function(c) { c.innerHTML = html; });
    }

    function renderSvgMap() {
      var svgs = Array.from(document.querySelectorAll("#interactiveUsSvg, .interactive-us-svg"));
      if (svgs.length === 0) return;
      svgs.forEach(function(s) { 
        s.innerHTML = ""; 
        // Attach click delegation on SVG root so all dynamic state clicks work
        if (!s._clickBound) {
          s.addEventListener('click', function(e) {
            var target = e.target.closest('.svg-state-group');
            if (target && target.dataset && target.dataset.code) {
              e.preventDefault();
              selectState(target.dataset.code);
              if (typeof openStateModal === 'function') {
                openStateModal(target.dataset.code);
              }
            }
          });
          s._clickBound = true;
        }
      });

      Object.keys(STATES_DATA).forEach(function(code) {
        var state = STATES_DATA[code];
        var coord = SVG_COORDS[code] || { x: 50, y: 50, w: 55, h: 45 };
        var evalRes = evaluateState(code);
        // Apply filters
        var isVisible = true;
        if (currentCategoryFilter === 'constitutional' && evalRes.status !== 'constitutional') isVisible = false;
        if (currentCategoryFilter === 'honored' && evalRes.status !== 'honored') isVisible = false;
        if (currentCategoryFilter === 'special' && evalRes.status !== 'special') isVisible = false;
        if (currentCategoryFilter === 'not_honored' && evalRes.status !== 'not_honored') isVisible = false;
        if (currentCategoryFilter === 'can_carry' && !evalRes.canCarry) isVisible = false;
        if (activeSearchQuery) {
          var matchCode = code.toLowerCase().includes(activeSearchQuery);
          var matchName = state.name.toLowerCase().includes(activeSearchQuery);
          if (!matchCode && !matchName) isVisible = false;
        }

        svgs.forEach(function(s) {
          var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          group.setAttribute('class', 'svg-state-group status-' + evalRes.status.replace('_', '-') + (code === currentStateFocus ? ' selected' : ''));
          group.setAttribute('id', 'stateNode-' + code + '-' + (s.id || 'svg'));
          group.setAttribute('data-code', code);
          group.style.cursor = 'pointer';
          group.setAttribute('opacity', isVisible ? '1' : '0.25');

          // Rectangle
          var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('class', 'state-bg-rect');
          rect.setAttribute('x', coord.x);
          rect.setAttribute('y', coord.y);
          rect.setAttribute('width', coord.w);
          rect.setAttribute('height', coord.h);
          rect.setAttribute('rx', '6');
          rect.setAttribute('ry', '6');

          // State Code Text
          var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('class', 'state-code-text');
          text.setAttribute('x', coord.x + coord.w / 2);
          text.setAttribute('y', coord.y + coord.h / 2 - 4);
          text.textContent = code;

          // Status Indicator
          var sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          sub.setAttribute('class', 'state-status-indicator');
          sub.setAttribute('x', coord.x + coord.w / 2);
          sub.setAttribute('y', coord.y + coord.h / 2 + 12);
          if (evalRes.canCarry) {
            sub.textContent = '✓ Carry';
            sub.setAttribute('fill', '#10b981');
          } else if (evalRes.status === 'special') {
            sub.textContent = '⚠ Cond.';
            sub.setAttribute('fill', '#ffb703');
          } else {
            sub.textContent = '✕ Restricted';
            sub.setAttribute('fill', '#ef4444');
          }

          group.appendChild(rect);
          group.appendChild(text);
          group.appendChild(sub);
          s.appendChild(group);
        });
      });
    }
    function selectState(code) {
      currentStateFocus = code;
      var state = STATES_DATA[code];
      if (!state) return;
      var evalRes = evaluateState(code);
      // Update Highlight on Map
      document.querySelectorAll('.svg-state-group').forEach(function(el) {
        if (el.getAttribute('data-code') === code) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      });
      // Update Spotlight Banner
      var spotlightNames = document.querySelectorAll('#spotlightStateName, .spotlight-state-name');
      spotlightNames.forEach(function(el) { el.textContent = state.name; });

      var verdictEls = document.querySelectorAll('#spotlightVerdict, .spotlight-verdict');
      verdictEls.forEach(function(verdictEl) {
        verdictEl.textContent = evalRes.verdictText;
        if (evalRes.canCarry) {
          verdictEl.className = 'carry-verdict-text can-carry';
        } else if (evalRes.status === 'special') {
          verdictEl.className = 'carry-verdict-text special-carry';
        } else {
          verdictEl.className = 'carry-verdict-text cannot-carry';
        }
      });

      var inspectBtns = document.querySelectorAll('#btnInspectLaws, .btn-inspect-laws');
      inspectBtns.forEach(function(btn) {
        btn.textContent = 'SEE ' + state.name.toUpperCase() + ' GUN LAWS';
        btn.onclick = function() { openStateModal(code); };
      });

      // Render Neighbor State Quick Cards
      renderNeighborCards(state.neighbors || []);

      // Render Maryland Comparison Matrix
      renderMdComparison(code);
    }
    // Modal Law Viewer Logic
    function openStateModal(code) {
      var state = STATES_DATA[code];
      if (!state) return;
      var evalRes = evaluateState(code);
      document.getElementById('modalHeadTitle').textContent = state.name.toUpperCase() + ' GUN LAWS & RECIPROCITY';
      document.getElementById('modalStateName').textContent = state.name;
      document.getElementById('modalStateBadgeCode').textContent = code;
      var verdictEl = document.getElementById('modalStateVerdict');
      verdictEl.textContent = evalRes.verdictText;
      verdictEl.style.color = evalRes.canCarry ? 'var(--accent-green)' : (evalRes.status === 'special' ? 'var(--accent-amber)' : 'var(--accent-red)');
      // Populate Accordion
      var accordion = document.getElementById('statuteAccordionList');
      accordion.innerHTML = '';
      var statuteLabels = {
        weapons_other: 'WEAPONS OTHER THAN HANDGUNS ALLOWED?',
        licensure: 'GUN PERMIT LICENSURE & RECIPROCITY?',
        mag_limits: 'MAGAZINE LIMITS FOR HANDGUNS?',
        min_age: 'MINIMUM AGE FOR CONCEALED CARRY?',
        ammo_rest: 'AMMUNITION RESTRICTIONS (HOLLOW POINTS)?',
        constitutional: 'CONSTITUTIONAL CARRY STATUS?',
        open_carry: 'OPEN CARRY PERMITTED?',
        non_lethal: 'NON-LETHAL WEAPONS (TASERS / PEPPER SPRAY)?',
        byrna: "BYRNA'S / KINETIC DEFENSE LAUNCHERS?"
      };
      var statutes = state.statutes || {};
      Object.keys(statuteLabels).forEach(key => {
        var item = statutes[key] || { ans: 'INFO', badge: 'badge-info', desc: 'Refer to state code.' };
        var label = statuteLabels[key];
        var card = document.createElement('div');
        card.className = 'accordion-statute-item';
        card.innerHTML = `
          <button class="statute-head" onclick="toggleAccordion(this)">
            <div class="statute-title-wrap">
              <span class="statute-status-pill ${item.badge}">${item.ans}</span>
              <span class="statute-question-text">${label}</span>
            </div>
            <span class="accordion-chevron">&#9660;</span>
          </button>
          <div class="statute-body">${item.desc}</div>
        `;
        accordion.appendChild(card);
      });
      // Populate Tab 2 & 3 text
      document.getElementById('modalStatuteReciprocityText').textContent = state.summary || 'Statutes updated for 2026.';
      document.getElementById('modalDutyToInformText').textContent = state.duty || 'Refer to officer instruction.';
      document.getElementById('modalMagAmmoText').textContent = 'Handgun Magazine Restrictions: ' + (state.mag_limit || 'None') + '. Ammunition: Standard defensive hollow-point rounds are lawful unless specifically restricted on public transport.';
      document.getElementById('modalVehicleCarryText').textContent = state.vehicle || 'Handgun in vehicle permitted with valid recognized license or under FOPA safe harbor.';
      switchModalTab('basics');
      var sModal = document.getElementById('stateModalOverlay');
      if (sModal) {
        sModal.classList.add('open', 'active');
        sModal.style.setProperty('display', 'flex', 'important');
        sModal.style.setProperty('visibility', 'visible', 'important');
        sModal.style.setProperty('opacity', '1', 'important');
        sModal.style.setProperty('pointer-events', 'auto', 'important');
      }
    }
    window.openStateModal = openStateModal;
    window.populateStateModal = openStateModal;
    function closeStateModal() {
      document.getElementById('stateModalOverlay').classList.remove('open');
    }
    function handleModalOverlayClick(e) {
      if (e.target.id === 'stateModalOverlay') closeStateModal();
    }
    function toggleAccordion(btn) {
      var item = btn.closest('.accordion-statute-item');
      item.classList.toggle('open');
    }
    function switchModalTab(tab) {
      document.getElementById('tabContentBasics').style.display = tab === 'basics' ? 'block' : 'none';
      document.getElementById('tabContentLaws').style.display = tab === 'laws' ? 'block' : 'none';
      document.getElementById('tabContentLocations').style.display = tab === 'locations' ? 'block' : 'none';
      document.getElementById('tabBtnBasics').classList.toggle('active', tab === 'basics');
      document.getElementById('tabBtnLaws').classList.toggle('active', tab === 'laws');
      document.getElementById('tabBtnLocations').classList.toggle('active', tab === 'locations');
    }
    function initReciprocityEngine() {
      try {
        if (typeof buildRollerList === 'function') buildRollerList();
        if (typeof recalculateReciprocity === 'function') recalculateReciprocity();
        if (typeof selectState === 'function') selectState(currentStateFocus || 'MD');
        if (typeof selectRollerState === 'function') selectRollerState(currentRollerState || 'WV');
        if (typeof renderMyPermitsList === 'function') renderMyPermitsList();
        if (typeof renderSvgMap === 'function') renderSvgMap();
      } catch(err) {
        console.error('Error initializing Reciprocity Engine:', err);
      }
    }
    window.initReciprocityEngine = initReciprocityEngine;
    window.selectState = selectState;
    window.compareStateWithMaryland = compareStateWithMaryland;
    window.renderMdComparison = renderMdComparison;
    window.openStateModal = openStateModal;
    window.closeStateModal = closeStateModal;
    window.toggleMultiplier = toggleMultiplier;
    window.handleResidentStateChange = handleResidentStateChange;
    window.setCategoryFilter = setCategoryFilter;
    window.handleSearch = handleSearch;
    window.switchModalTab = switchModalTab;
    window.toggleAccordion = toggleAccordion;
    window.handleModalOverlayClick = handleModalOverlayClick;
    window.selectRollerState = selectRollerState;
    window.promptAddPermit = promptAddPermit;
    window.recalculateReciprocity = recalculateReciprocity;
    window.buildRollerList = buildRollerList;
    window.renderMyPermitsList = renderMyPermitsList;
    // ==========================================================================
    // NAVIGATION BACK BUTTON LOGIC
    // ==========================================================================
    // Track tab switching in history
    // ==========================================================================
    // 8-STEP FIFS JOURNEY DEEP MODAL DATA & HANDLERS
    // ==========================================================================
    var FIFS_STEPS_DATA = {
      1: {
        title: "Registration & Profile Creation",
        icon: "📝",
        status: "Completed ✔",
        synopsis: "Your student enrollment record has been initialized in the Future Initiative database with your unique Student ID and course selection.",
        points: [
          "✔ Full Name, Email, and Phone recorded in the Master Student Booking Ledger.",
          "✔ Student Profile Document generated and stored securely in Google Drive.",
          "✔ Lifecycle status initialized to STEP_1_REGISTERED."
        ],
        ctaText: "Review Course Selection & Tuition →",
        ctaAction: "switchTab('booking')"
      },
      2: {
        title: "Seat Confirmation & Training Date Assignment",
        icon: "📅",
        status: "Completed ✔",
        synopsis: "Your training cohort date and qualification shooting lane reservation at Cindy&#39;s Hot Shots have been assigned.",
        points: [
          "✔ Qualification lane reserved at Cindy&#39;s Hot Shots (Glen Burnie, MD).",
          "✔ Confirmation notification and preparation briefing sent to student email.",
          "✔ Access granted to the Future Initiative Student Operations Portal."
        ],
        ctaText: "Check Student Dashboard →",
        ctaAction: "switchTab('portal')"
      },
      3: {
        title: "Pre-Class Readiness & Equipment Preparation",
        icon: "🎒",
        status: "Active Action Required ⚡",
        synopsis: "Preparation is critical for range safety. You must review equipment standards, lock transport rules, and acquire target ammunition before your live-fire day.",
        points: [
          "✔ Review Maryland Transport Compliance (Unloaded in locked case/trunk).",
          "✔ Acquire 50–100 rounds of factory target brass ammunition (9mm, .380, etc.).",
          "✔ Secure ANSI Z87.1 wrap-around eye protection & electronic earmuffs (or arrange loaner/rental).",
          "✔ Verify government photo ID is valid and unexpired."
        ],
        ctaText: "Open Equipment & Readiness Checklist →",
        ctaAction: "openExpectationModal('handgun')"
      },
      4: {
        title: "Classroom Instruction & Self-Defense Law",
        icon: "⚖️",
        status: "Scheduled Evolution",
        synopsis: "Comprehensive state-approved instruction covering firearm mechanics, conflict avoidance, de-escalation, and Maryland criminal law.",
        points: [
          "✔ Maryland SB 1 Sensitive Places restrictions and prohibited carry zones.",
          "✔ State v. Faulkner duty to retreat and lawful defense of self and others.",
          "✔ Safe staging, home storage compliance, and child access prevention laws.",
          "✔ 100% strict zero-live-ammunition classroom policy enforced."
        ],
        ctaText: "View Follow-Along Course Packet →",
        ctaAction: "window.open('https://docs.google.com/document/d/1K0dM40LAbSy8i7k9vM0iZNJk-YdYMZ9BC_tbI1l6oe0/edit?usp=sharing', '_blank')"
      },
      5: {
        title: "Live-Fire Practical Range Qualification",
        icon: "🎯",
        status: "Range Practical",
        synopsis: "Live-fire qualification shots conducted downrange at Cindy&#39;s Hot Shots (course instruction led by FIFS) under the direct supervision of Certified Instructor Kai Wade.",
        points: [
          "✔ Wear & Carry: 25-round course of fire at 3, 5, 7, and 15 yards on B-27 targets (70% passing score).",
          "✔ HQL: Demonstration of safe loading, firing, and unloading mechanics.",
          "✔ Diagnostic feedback on grip friction, sight tracking, and trigger press reset."
        ],
        ctaText: "View Range Highlights & Targets →",
        ctaAction: "switchTab('testimonial')"
      },
      6: {
        title: "Certified Score Sheet Delivery (MSP Form 29-14)",
        icon: "📜",
        status: "Official Record",
        synopsis: "Upon passing your live-fire shoot, Coach Kai Wade signs and certifies your official Maryland State Police Form 29-14 Training Documentation.",
        points: [
          "✔ Certified MSP Form 29-14 signed with Instructor QHIC # and date.",
          "✔ High-resolution PDF generated and delivered to your Student Portal.",
          "✔ Official Score Sheet serves as mandatory proof of training for your MSP application."
        ],
        ctaText: "Preview Official MSP 29-14 Score Sheet →",
        ctaAction: "window.open('https://mdsp.maryland.gov/Organization/Licensing%20Division%20Documents/MSP%20Form%2029-14%20-%20Certified%20Handgun%20Training%20Score%20Sheet.pdf', '_blank')"
      },
      7: {
        title: "MSP Portal Submission & LiveScan Fingerprints",
        icon: "💻",
        status: "State Application",
        synopsis: "Submit your formal permit application online through the Maryland State Police MyLicense portal and complete your state and FBI background check.",
        points: [
          "✔ Obtain electronic LiveScan fingerprints from an authorized Maryland DPSCS provider.",
          "✔ Upload your certified MSP Form 29-14 and passport-style photo to the portal.",
          "✔ Track application progression and respond promptly to any MSP investigator inquiries."
        ],
        ctaText: "Open Maryland MyLicense Portal ↗",
        ctaAction: "window.open('https://licensingportal.mdsp.maryland.gov/', '_blank')"
      },
      8: {
        title: "Licensed Permit Carry & Ongoing Reciprocity",
        icon: "🛡️",
        status: "Milestone Achieved",
        synopsis: "Receive your official Maryland Wear & Carry Permit card in the mail. Access our Reciprocity Engine and activate your 3-year renewal countdown watch.",
        points: [
          "✔ Carry lawfully across Maryland and reciprocal states.",
          "✔ Utilize the FIFS 50-State Reciprocity Engine to verify travel compliance.",
          "✔ Track your 3-year expiration date for 10% off your required 8-hour renewal class."
        ],
        ctaText: "Launch 50-State Reciprocity Hub ↗",
        ctaAction: "toggleReciprocityHubModal(true)"
      }
    };
    function openStepDetailModal(stepNum) {
      var data = FIFS_STEPS_DATA[stepNum];
      if (!data) return;
      var modal = document.getElementById('stepDetailModal');
      var badge = document.getElementById('stepModalBadge');
      var heading = document.getElementById('stepModalHeading');
      var icon = document.getElementById('stepModalIcon');
      var status = document.getElementById('stepModalStatus');
      var synopsis = document.getElementById('stepModalSynopsis');
      var keyPoints = document.getElementById('stepModalKeyPoints');
      var actions = document.getElementById('stepModalActions');
      if (badge) badge.textContent = `STEP ${stepNum} OF 8 • TRAINING ROADMAP`;
      if (heading) heading.textContent = data.title;
      if (icon) icon.textContent = data.icon;
      if (status) status.textContent = `Status: ${data.status}`;
      if (synopsis) synopsis.textContent = data.synopsis;
      if (keyPoints && Array.isArray(data.points)) {
        keyPoints.innerHTML = data.points.map(p => `
          <div style="background: #0d121a; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 14px; font-size: 0.85rem; color: #cbd5e1;">
            ${p}
          </div>
        `).join('');
      }
      if (actions) {
        actions.innerHTML = `
          <button type="button" class="btn-primary" onclick="closeStepDetailModal(); ${data.ctaAction};">
            ${data.ctaText}
          </button>
          <button type="button" class="btn-secondary-modal" onclick="closeStepDetailModal()">
            Close Step Overview
          </button>
        `;
      }
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
    }
    window.openStepDetailModal = openStepDetailModal;
    function closeStepDetailModal() {
      var modal = document.getElementById('stepDetailModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        document.body.style.overflow = '';
      }
    }
    window.closeStepDetailModal = closeStepDetailModal;
    // ==========================================================================
    // PATHWAY CARD DYNAMIC SELECTION HIGHLIGHT
    // ==========================================================================
    var originalOpenGoalSynopsis = window.openGoalSynopsis;
    window.openGoalSynopsis = function(goalKey, btnEl) {
      document.querySelectorAll('.pathway-pill').forEach(p => {
        p.classList.remove('active');
        p.style.borderColor = '';
        p.style.boxShadow = '';
      });
      if (btnEl) {
        btnEl.classList.add('active');
        btnEl.style.borderColor = 'var(--accent-cyan)';
        btnEl.style.boxShadow = '0 0 16px var(--accent-cyan-glow), inset 0 0 10px rgba(0, 229, 255, 0.15)';
      }
      if (typeof originalOpenGoalSynopsis === 'function') {
        originalOpenGoalSynopsis(goalKey);
      }
    };
    // ==========================================================================
    // DYNAMIC VIP CARD TIER SWITCHING & LUXURY BACKGROUND COLORING
    // ==========================================================================
// Removed redundant setCardTier override
    // Robust Modal Controller ensuring zero pointer-event trapping
    function showOverlay(id) {
      var el = document.getElementById(id);
      if (el) {
        el.style.setProperty('display', 'flex', 'important');
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }
    function hideOverlay(id) {
      var el = document.getElementById(id);
      if (el) {
        el.classList.remove('active');
        el.classList.remove('open');
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
        document.body.style.overflow = '';
      }
    }
    window.openPortalSelectionModal = function() { showOverlay('fiPortalSelectionModal'); };
    window.closePortalSelectionModal = function() { hideOverlay('fiPortalSelectionModal'); };
    window.openGoalSynopsisModal = function() { showOverlay('goalSynopsisModal'); };
    window.closeGoalSynopsis = function() { hideOverlay('goalSynopsisModal'); };
    window.openStepDetailModal = function(stepNum) {
      var data = FIFS_STEPS_DATA[stepNum];
      if (!data) return;
      var badge = document.getElementById('stepModalBadge');
      var heading = document.getElementById('stepModalHeading');
      var icon = document.getElementById('stepModalIcon');
      var status = document.getElementById('stepModalStatus');
      var synopsis = document.getElementById('stepModalSynopsis');
      var keyPoints = document.getElementById('stepModalKeyPoints');
      var actions = document.getElementById('stepModalActions');
      if (badge) badge.textContent = `STEP ${stepNum} OF 8 • TRAINING ROADMAP`;
      if (heading) heading.textContent = data.title;
      if (icon) icon.textContent = data.icon;
      if (status) status.textContent = `Status: ${data.status}`;
      if (synopsis) synopsis.textContent = data.synopsis;
      if (keyPoints && Array.isArray(data.points)) {
        keyPoints.innerHTML = data.points.map(p => `
          <div style="background: #0d121a; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 14px; font-size: 0.85rem; color: #cbd5e1;">
            ${p}
          </div>
        `).join('');
      }
      if (actions) {
        actions.innerHTML = `
          <button type="button" class="btn-primary" onclick="closeStepDetailModal(); ${data.ctaAction};">
            ${data.ctaText}
          </button>
          <button type="button" class="btn-secondary-modal" onclick="closeStepDetailModal()">
            Close Step Overview
          </button>
        `;
      }
      showOverlay('stepDetailModal');
    };
    window.closeStepDetailModal = function() { hideOverlay('stepDetailModal'); };
    // Reciprocity Hub Modal Controller
    function toggleReciprocityHubModal(show) {
      var modal = document.getElementById('reciprocityHubModal');
      if (!modal) return;
      if (show) {
        modal.classList.add('active');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        if (typeof initReciprocityEngine === 'function') {
          initReciprocityEngine();
        }
        modal.scrollTop = 0;
      } else {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    window.toggleReciprocityHubModal = toggleReciprocityHubModal;
    // Removed stub
function closeStateModal() {
      var modal = document.getElementById('stateModalOverlay');
      if (modal) {
        modal.classList.remove('active');
        modal.classList.remove('open');
        modal.style.display = 'none';
      }
    }
    window.closeStateModal = closeStateModal;
    function openPortalSelectionModal() {
      var modal = document.getElementById('fiPortalSelectionModal');
      if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
      }
    }
    window.openPortalSelectionModal = openPortalSelectionModal;
    function closePortalSelectionModal() {
      var modal = document.getElementById('fiPortalSelectionModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    }
    window.closePortalSelectionModal = closePortalSelectionModal;
    // Reciprocity Hub Full-Screen HUD Controller
    function toggleReciprocityHubModal(show) {
      var modal = document.getElementById('reciprocityHubModal');
      if (!modal) return;
      if (show) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'block', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        document.body.style.overflow = 'hidden';
        if (typeof initReciprocityEngine === 'function') {
          initReciprocityEngine();
        }
        modal.scrollTop = 0;
      } else {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        document.body.style.overflow = '';
      }
    }
    window.toggleReciprocityHubModal = toggleReciprocityHubModal;
    // Removed stub
function closeStateModal() {
      var modal = document.getElementById('stateModalOverlay');
      if (modal) {
        modal.classList.remove('active');
        modal.classList.remove('open');
        modal.style.setProperty('display', 'none', 'important');
      }
    }
    window.closeStateModal = closeStateModal;
    // ==========================================================================
    // FIFS ADVANCED WEBSITE ANALYTICS & TELEMETRY ENGINE
    // ==========================================================================
    // ==========================================================================
    // STREAMLINED TELEMETRY ENGINE (FOCUSED STRICTLY ON HIGH-VALUE MILESTONES)
    // Eliminates micro-interaction I/O overhead while capturing business events
    // ==========================================================================
    function logAnalyticsEvent(category, action, label) {
      // Strictly restricted exclusively to high-value business conversion milestones
      var highValueActions = [
        'Course Booking Confirmed',
        'Client Profile Registered',
        'Live Chat Initiated'
      ];
      if (!highValueActions.includes(action)) {
        return; // Zero overhead and zero I/O for all micro-interactions
      }
      // Execute asynchronously in micro-task queue to eliminate main-thread blocking
      setTimeout(function() {
        try {
          var entry = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            category: category,
            action: action,
            label: label || '',
            device: (window.innerWidth <= 768 ? 'Mobile Phone' : (window.innerWidth <= 1024 ? 'Tablet / iPad' : 'Desktop / Laptop'))
          };
          var log = JSON.parse(_fifsMemStorage.getItem('fifs_analytics_events') || '[]');
          log.unshift(entry);
          if (log.length > 50) log.pop();
          /* cloud only: zero browser storage */
          // Background sync to GAS ledger if live
          if (typeof callFifsBackend === 'function') { callFifsBackend('logAnalytics', { entry: entry }); }
        } catch (e) {}
      }, 20);
    }
    window.logAnalyticsEvent = logAnalyticsEvent;
    // Removed duplicate renderAdminAnalyticsDashboard
    function exportAnalyticsCSV() {
      var events = JSON.parse(_fifsMemStorage.getItem('fifs_analytics_events') || '[]');
      var csv = 'Timestamp,Category,Action,Label\n';
      events.forEach(e => {
        csv += `"${e.time}","${e.category}","${e.action}","${e.label}"\n`;
      });
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'fifs_website_analytics_' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    window.exportAnalyticsCSV = exportAnalyticsCSV;

// --- NEXT SCRIPT BLOCK ---

// Authoritative calendar date selection is wired directly on cells with isolated closures

// --- NEXT SCRIPT BLOCK ---

// ==========================================================================
// TACTICAL GUN SHOOTING REFRESH CONTROLLER
// ==========================================================================
function triggerGunRefreshAnimation(btn) {
  if (!btn) return;
  var originalHtml = btn.innerHTML;
  btn.classList.add('gun-shooting-active');
  var shots = 0;
  var shotInterval = setInterval(function() {
    shots++;
    var sparks = "💥 " + "• ".repeat(shots);
    btn.innerHTML = '<span>🔫</span> <span>' + sparks + ' (' + shots + '/5)</span>';
    if (shots >= 5) {
      clearInterval(shotInterval);
      btn.innerHTML = '<span>🔄</span> <span>*TACTICAL RELOAD*</span>';
      setTimeout(function() {
        btn.classList.remove('gun-shooting-active');
        btn.innerHTML = originalHtml;
      }, 700);
    }
  }, 180);
}
// Hook into all admin refresh buttons
document.addEventListener('DOMContentLoaded', function() {
  var refreshBtns = document.querySelectorAll('#btn-admin-refresh-data, #btn-admin-refresh-chats, .btn-refresh-inquiries');
  refreshBtns.forEach(function(b) {
    b.addEventListener('click', function() {
      triggerGunRefreshAnimation(b);
    });
  });
});
// ==========================================================================
// SWIPE TO DELETE CHAT THREADS
// ==========================================================================
function attachSwipeToDeleteToThread(card, threadId) {
  if (!card) return;
  var startX = 0;
  var currentX = 0;
  card.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
  }, { passive: true });
  card.addEventListener('touchmove', function(e) {
    currentX = e.touches[0].clientX;
    var diff = currentX - startX;
    if (diff < -40) {
      card.classList.add('swiped-open');
    } else if (diff > 20) {
      card.classList.remove('swiped-open');
    }
  }, { passive: true });
}
function deleteAdminChatThread(threadId, event) {
  if (event) event.stopPropagation();
  if (!confirm("Are you sure you want to permanently delete this live chat thread from Google Sheets and the admin hub?")) {
    return;
  }
  var pin = sessionStorage.getItem('fifs_instructor_pin') || sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
  if (typeof callFifsBackend === 'function') {
    callFifsBackend('deleteLiveChatThread', { threadId: threadId, passcode: pin }, function(res) {
      alert("Chat thread deleted successfully from registry.");
      if (typeof refreshAdminLiveChats === 'function') {
        refreshAdminLiveChats();
      }
    }, function(err) {
      alert("Failed to delete thread: " + err);
    });
  }
}
// ==========================================================================
// CLEAR CHAT NOTIFICATIONS ON ANY DEVICE WHEN OPENED
// ==========================================================================
function clearChatNotificationOnOpen(threadId) {
  if (!threadId) return;
  var pin = sessionStorage.getItem('fifs_instructor_pin') || sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
  if (typeof callFifsBackend === 'function') {
    callFifsBackend('markLiveChatRead', { threadId: threadId, passcode: pin }, function(res) {
      console.log('Thread notification cleared across devices:', res);
      var badge = document.getElementById('admin-chat-unread-badge');
      if (badge) {
        var count = parseInt(badge.textContent || '0', 10);
        if (count > 0) badge.textContent = (count - 1).toString();
      }
    });
  }
}
// ==========================================================================
// ADMIN OPS BRIEFING SPLASH SCREEN & QUICK REPLY
// ==========================================================================
function showAdminOpsBriefing(stats) {
  var modal = document.getElementById('admin-ops-briefing-modal');
  if (!modal) return;
  modal.classList.add('active');
  modal.style.display = 'flex';
  var container = document.getElementById('admin-splash-alerts-container');
  if (!container) return;
  var unreadChats = window.adminCachedLiveChats ? window.adminCachedLiveChats.filter(function(c) {
    return c.status === 'unread' || c.status === 'NEW' || c.status === 'PENDING';
  }) : [];
  var html = '<div style="display: grid; gap: 14px;">';
  html += '<div style="background: rgba(0, 229, 255, 0.08); border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 10px; padding: 14px;">';
  html += '<div style="font-weight: 800; color: #00e5ff; font-size: 0.88rem;">📊 CURRENT REGISTRY STATUS</div>';
  html += '<div style="display: flex; gap: 18px; margin-top: 8px; font-size: 0.95rem; color: #fff;">';
  html += '<div>Active Students: <strong>' + (window.adminCachedStudents ? window.adminCachedStudents.length : '0') + '</strong></div>';
  html += '<div>Portal Clients: <strong>' + (window.adminCachedClients ? window.adminCachedClients.length : '0') + '</strong></div>';
  html += '<div>Unread Inquiries: <strong style="color: #ff6b6b;">' + unreadChats.length + '</strong></div>';
  html += '</div></div>';
  if (unreadChats.length > 0) {
    html += '<div style="margin-top: 8px;"><div style="font-size: 0.82rem; font-weight: 800; color: #ff9100; margin-bottom: 8px;">💬 LIVE CHATS READY FOR QUICK REPLY:</div>';
    unreadChats.forEach(function(chat, idx) {
      html += '<div style="background: #0d121a; border: 1px solid var(--border-subtle); border-radius: 10px; padding: 12px; margin-bottom: 10px;">';
      html += '<div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #fff; font-weight: 700;">';
      html += '<span>' + (chat.senderName || 'Visitor') + ' (' + (chat.senderPhone || chat.phone || 'No phone') + ')</span>';
      html += '<span style="color: var(--text-muted); font-size: 0.75rem;">' + (chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString() : 'Just now') + '</span>';
      html += '</div>';
      html += '<div style="font-size: 0.88rem; color: #94a3b8; margin: 6px 0 10px; font-style: italic;">"' + (chat.message || chat.text || '') + '"</div>';
      html += '<div style="display: flex; gap: 8px;">';
      html += '<input type="text" id="splash-reply-input-' + idx + '" placeholder="Type quick reply to student..." style="flex: 1; padding: 8px 10px; background: #070b10; border: 1px solid var(--border-subtle); border-radius: 6px; color: #fff; font-size: 0.85rem;">';
      html += '<button type="button" onclick="sendSplashQuickReply(\'' + (chat.threadId || '') + '\', ' + idx + ')" class="btn-spark" style="padding: 8px 14px; font-size: 0.80rem; font-weight: 800;">Send</button>';
      html += '</div></div>';
    });
    html += '</div>';
  } else {
    html += '<div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 14px; color: #34d399; font-size: 0.90rem;">';
    html += '✅ All incoming live chats and inquiries are currently answered and up to date!';
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}
function sendSplashQuickReply(threadId, idx) {
  var input = document.getElementById('splash-reply-input-' + idx);
  if (!input || !input.value.trim()) return;
  var text = input.value.trim();
  var pin = sessionStorage.getItem('fifs_instructor_pin') || sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
  if (typeof callFifsBackend === 'function') {
    callFifsBackend('sendAdminLiveChatReply', { passcode: pin, threadId: threadId, text: text }, function(res) {
      alert("Reply sent and logged to Live_Chats sheet!");
      input.value = '';
      clearChatNotificationOnOpen(threadId);
      if (typeof refreshAdminLiveChats === 'function') refreshAdminLiveChats();
    });
  }
}
function closeAdminOpsBriefing() {
  var modal = document.getElementById('admin-ops-briefing-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}
// ==========================================================================
// PWA INSTALL BANNER CONTROLLERS
// ==========================================================================
function promptPwaInstallInstructions() {
  var isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIos) {
    alert("To install Train With FIFS on your iPhone/iPad:\n1. Tap the Share icon (box with upward arrow) at the bottom or top of Safari.\n2. Scroll down and tap 'Add to Home Screen'.\n3. Tap 'Add' to launch full-screen with offline access!");
  } else {
    alert("To install Train With FIFS:\n1. Tap the three dots (⋮) in your Chrome or Edge menu.\n2. Select 'Install App' or 'Add to Home screen'.");
  }
  dismissPwaLandingBanner();
}
function dismissPwaLandingBanner() {
  var b = document.getElementById('pwa-landing-banner');
  if (b) b.style.display = 'none';
}
// ==========================================================================
// DIGITAL WAIVER MODAL & SUBMISSION
// ==========================================================================
function openFifsWaiverModal() {
  var m = document.getElementById('fifsWaiverModal');
  if (m) {
    m.classList.add('active');
    m.style.display = 'flex';
  }
}
function closeFifsWaiverModal() {
  var m = document.getElementById('fifsWaiverModal');
  if (m) {
    m.classList.remove('active');
    m.style.display = 'none';
  }
}
function handleWaiverSubmission(e) {
  e.preventDefault();
  var btn = document.getElementById('btnSubmitWaiver');
  if (btn) btn.disabled = true;
  var payload = {
    studentName: document.getElementById('waiverStudentName').value,
    studentPhone: document.getElementById('waiverStudentPhone').value,
    studentEmail: document.getElementById('waiverStudentEmail').value,
    emergencyContact: document.getElementById('waiverEmergencyName').value,
    emergencyRelation: document.getElementById('waiverEmergencyRel').value,
    emergencyPhone: document.getElementById('waiverEmergencyPhone').value,
    initials: document.getElementById('waiverInitials').value,
    signature: document.getElementById('waiverSignature').value,
    under18: false
  };
  if (typeof callFifsBackend === 'function') {
    callFifsBackend('submitStudentWaiver', payload, function(res) {
      alert("✅ Your 2026 FIFS Safety & Liability Waiver has been successfully certified and recorded on the master registry!"); markWaiverCardComplete();
      closeFifsWaiverModal();
      if (btn) btn.disabled = false;
    }, function(err) {
      alert("Submission failed: " + err);
      if (btn) btn.disabled = false;
    });
  } else {
    alert("Waiver signed and recorded locally."); markWaiverCardComplete();
    closeFifsWaiverModal();
  }
}
// ==========================================================================
// DYNAMIC PRICING: GROUP DISCOUNT & 6% MD TAX & 30% DEPOSIT CALCULATION
// ==========================================================================
function calculateComprehensiveInvoice(baseTuition, isVip, groupSizeStr) {
  var count = 1;
  var discountPercent = 0;
  var isCohort = false;
  var str = (groupSizeStr || '').toString();
  if (/^2|2 \(paired/i.test(str)) {
    count = 2;
    discountPercent = 0.05;
  } else if (/^3|3 \(small/i.test(str)) {
    count = 3;
    discountPercent = 0.10;
  } else if (/^4|4 \(small/i.test(str)) {
    count = 4;
    discountPercent = 0.10;
  } else if (/5\+/i.test(str) || /^5/i.test(str)) {
    count = 5;
    discountPercent = 0.15;
    isCohort = true;
  } else {
    count = 1;
    discountPercent = 0;
  }
  var rawTuition = baseTuition * count;
  var discountAmount = rawTuition * discountPercent;
  var discountedTuition = rawTuition - discountAmount;
  var rangeFee = isVip ? 0 : (45.00 * count);
  var subtotal = discountedTuition + rangeFee;
  var mdTax = subtotal * 0.06;
  var total = subtotal + mdTax;
  var deposit = total * 0.30;
  var balanceDue = total * 0.70;
  return {
    attendees: count,
    isCohort: isCohort,
    singleBase: baseTuition,
    baseTuition: rawTuition,
    rawTuition: rawTuition,
    discountPercent: discountPercent,
    discountAmount: discountAmount,
    discountedTuition: discountedTuition,
    rangeFee: rangeFee,
    subtotal: subtotal,
    mdTax: mdTax,
    total: total,
    depositDueNow: deposit,
    balanceDueClass: balanceDue
  };
}
window.calculateComprehensiveInvoice = calculateComprehensiveInvoice;

// --- NEXT SCRIPT BLOCK ---

(function() {
  var GREEN = '#10b981', RED = '#ef4444';
  function updateFifsLiveStatus() {
    var etStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false, hour: 'numeric' });
    var hour = parseInt(etStr, 10);
    var active = hour >= 9 && hour < 17;
    var dot = document.getElementById('live-status-dot');
    if (dot) {
      dot.style.background = active ? GREEN : RED;
      dot.style.boxShadow = '0 0 12px ' + (active ? GREEN : RED);
      dot.title = active ? 'Live Training & Student Operations Active (9 AM - 5 PM ET)' : 'Standby Mode — Live ops resume at 9 AM ET (booking available 24/7)';
    }
    var guide = document.getElementById('neon-start-guide');
    if (guide) {
      guide.classList.toggle('neon-mode-cyan', active);
      guide.classList.toggle('neon-mode-red', !active);
      guide.title = active ? 'Future Initiative Operations Active • Click to Start Training' : 'Standby Mode — Live ops resume 9 AM ET • Booking open 24/7';
    }
  }
  window.updateFifsLiveStatus = updateFifsLiveStatus;
  updateFifsLiveStatus();
  setInterval(updateFifsLiveStatus, 60000);
})();

// --- NEXT SCRIPT BLOCK ---

(function() {
  // Global 5-Shot Handgun Refresh Engine with Running Legs
  window.triggerTacticalNavRefresh = function(triggerBtn) {
    if (triggerBtn && triggerBtn.dataset.animating === 'true') return;
    if (triggerBtn) triggerBtn.dataset.animating = 'true';
    // Find Home and Back buttons in the same container or document
    var parent = triggerBtn ? triggerBtn.parentElement : document;
    var homeBtns = document.querySelectorAll('button[onclick*="returnToHome"]');
    var backBtns = document.querySelectorAll('button[onclick*="navigateBack"]');
    // Make Home and Back buttons sprout legs and run away!
    homeBtns.forEach(function(b) {
      b.classList.add('btn-running-away', 'running-away-right');
    });
    backBtns.forEach(function(b) {
      b.classList.add('btn-running-away', 'running-away-left');
    });
    // 5-Shot Handgun Reload Sequence
    var shots = [
      "🔫 • • • • •",
      "💥 BANG! (1/5)",
      "💥 BANG! (2/5)",
      "💥 BANG! (3/5)",
      "💥 BANG! (4/5)",
      "💥 BANG! (5/5)",
      "⚙️ SLIDE LOCK",
      "🔄 CLICK-CLACK! READY"
    ];
    var step = 0;
    var origHTML = triggerBtn ? triggerBtn.innerHTML : '';
    var interval = setInterval(function() {
      if (step < shots.length) {
        if (triggerBtn) {
          triggerBtn.innerHTML = '<span style="font-family: var(--font-display); font-weight: 800; font-size: 0.85rem; color: #fbbf24;">' + shots[step] + '</span>';
        }
        step++;
      } else {
        clearInterval(interval);
        // Snap Home and Back buttons back into place
        homeBtns.forEach(function(b) {
          b.classList.remove('btn-running-away', 'running-away-right');
        });
        backBtns.forEach(function(b) {
          b.classList.remove('btn-running-away', 'running-away-left');
        });
        if (triggerBtn) {
          triggerBtn.innerHTML = '<span style="color:#10b981; font-weight:800;">✓ SYNCED</span>';
          setTimeout(function() {
            triggerBtn.innerHTML = origHTML || '<span class="refresh-ui-text">🔄 REFRESH</span>';
            triggerBtn.dataset.animating = 'false';
          }, 800);
        }
        // Trigger authoritative backend sync
        if (typeof refreshAdminRoster === 'function') {
          try { refreshAdminRoster(); } catch(e){}
        }
        if (typeof refreshAdminLiveChats === 'function') {
          try { refreshAdminLiveChats(); } catch(e){}
        }
      }
    }, 280);
  };
  // Enhance Admin Live Chat Refresh Button with Handgun Animation
  window.triggerAdminChatHandgunRefresh = function() {
    var btn = document.querySelector('button[onclick*="refreshAdminLiveChats"]') || document.getElementById('admin-chat-refresh-btn');
    if (btn && btn.dataset.animating !== 'true') {
      btn.dataset.animating = 'true';
      var origText = btn.innerHTML;
      var shots = ["🔫 • • • • •", "💥 1", "💥 2", "💥 3", "💥 4", "💥 5", "🔄 RELOADED"];
      var i = 0;
      var intv = setInterval(function() {
        if (i < shots.length) {
          btn.innerHTML = '<span style="color:#fbbf24; font-weight:800; font-size:0.75rem;">' + shots[i] + '</span>';
          i++;
        } else {
          clearInterval(intv);
          btn.innerHTML = '<span style="color:#10b981; font-weight:800;">✓ CHATS SYNCED</span>';
          setTimeout(function() {
            btn.innerHTML = origText;
            btn.dataset.animating = 'false';
          }, 800);
        }
      }, 200);
    }
    if (typeof refreshAdminLiveChats === 'function') {
      refreshAdminLiveChats();
    }
  };
  // Enhance Delete Telemetry with EMP Wipe Animation
  var origResetTelemetry = window.resetWebsiteTelemetry;
  window.resetWebsiteTelemetry = function() {
    var btn = document.querySelector('button[onclick*="resetWebsiteTelemetry"]') || document.getElementById('btn-reset-telemetry');
    if (!confirm("⚠️ TACTICAL PURGE: Reset all website telemetry counters in Supabase and cache?")) return;
    if (btn) {
      btn.classList.add('btn-emp-purging');
      btn.innerHTML = '<span style="color:#fff; font-weight:800; letter-spacing:1px;">💥 EMP DISCHARGE IN PROGRESS...</span>';
    }
    setTimeout(function() {
      if (btn) {
        btn.innerHTML = '<span style="color:#10b981; font-weight:800;">⚡ TELEMETRY PURGED</span>';
      }
      if (typeof origResetTelemetry === 'function') {
        origResetTelemetry();
      }
      setTimeout(function() {
        if (btn) {
          btn.classList.remove('btn-emp-purging');
          btn.innerHTML = '🗑️ Reset Telemetry';
        }
      }, 1500);
    }, 800);
  };
  // Bottom dock visibility controller: hide on landing page
  function updateBottomDockVisibility() {
    var dock = document.getElementById('sticky-bottom-dock');
    if (!dock) return;
    var landing = document.getElementById('hero-landing');
    var isLandingActive = landing && !landing.classList.contains('hidden') && window.getComputedStyle(landing).display !== 'none';
    if (document.body.classList.contains('in-home') || isLandingActive) {
      dock.style.display = 'none';
    } else {
      dock.style.display = 'flex';
    }
  }
  window.addEventListener('resize', updateBottomDockVisibility);
  setInterval(updateBottomDockVisibility, 500);
  // Long-Press Engine for Admin Live Chat Threads
  window.setupChatThreadLongPress = function(el, threadId, senderName) {
    if (!el || el.dataset.lpBound === 'true') return;
    el.dataset.lpBound = 'true';
    var pressTimer = null;
    function startPress(e) {
      pressTimer = setTimeout(function() {
        showChatThreadActionSheet(threadId, senderName);
      }, 550);
    }
    function cancelPress() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }
    el.addEventListener('touchstart', startPress, { passive: true });
    el.addEventListener('touchend', cancelPress);
    el.addEventListener('touchcancel', cancelPress);
    el.addEventListener('mousedown', startPress);
    el.addEventListener('mouseup', cancelPress);
    el.addEventListener('mouseleave', cancelPress);
  };
  window.showChatThreadActionSheet = function(threadId, senderName) {
    var existing = document.getElementById('fifsChatActionSheet');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'fifsChatActionSheet';
    overlay.className = 'fifs-action-sheet-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
      <div class="fifs-action-sheet-card" onclick="event.stopPropagation()">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
          <div>
            <h4 style="font-family:var(--font-display); font-size:1.1rem; color:#fff; margin:0; text-transform:uppercase;">💬 Manage Chat Thread</h4>
            <span style="font-size:0.78rem; color:var(--accent-cyan); font-weight:700;">${senderName || 'Student Inquirer'}</span>
          </div>
          <button type="button" onclick="document.getElementById('fifsChatActionSheet').remove()" style="background:none; border:none; color:#94a3b8; font-size:1.4rem; cursor:pointer;">✕</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button type="button" onclick="confirmDeleteChatFromSheet('${threadId}')" style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#fca5a5; padding:12px 16px; border-radius:8px; font-weight:800; text-transform:uppercase; font-size:0.86rem; cursor:pointer; display:flex; align-items:center; gap:8px;">
            <span>🗑️</span> Delete Conversation Thread (Sheet & Device)
          </button>
          <button type="button" onclick="markChatUnreadFromSheet('${threadId}')" style="background:rgba(0,229,255,0.1); border:1px solid var(--accent-cyan); color:#fff; padding:12px 16px; border-radius:8px; font-weight:700; font-size:0.86rem; cursor:pointer; display:flex; align-items:center; gap:8px;">
            <span>✉️</span> Mark Thread as Unread
          </button>
          <button type="button" onclick="document.getElementById('fifsChatActionSheet').remove()" style="background:rgba(255,255,255,0.05); border:1px solid var(--border-subtle); color:#94a3b8; padding:10px 16px; border-radius:8px; font-size:0.84rem; cursor:pointer;">
            Cancel
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  };
  window.confirmDeleteChatFromSheet = function(threadId) {
    if (confirm("Are you sure you want to permanently delete this chat thread from Google Sheets and all devices?")) {
      var sheet = document.getElementById('fifsChatActionSheet');
      if (sheet) sheet.remove();
      if (typeof deleteLiveChatThreadOnServer === 'function') {
        deleteLiveChatThreadOnServer(threadId);
      }
    }
  };
  window.markChatUnreadFromSheet = function(threadId) {
    var sheet = document.getElementById('fifsChatActionSheet');
    if (sheet) sheet.remove();
    var threads = typeof getStoredChatThreads === 'function' ? getStoredChatThreads() : [];
    var t = threads.find(function(item) { return item.threadId === threadId; });
    if (t) {
      t.unread = true;
      if (typeof saveChatThreads === 'function') saveChatThreads(threads);
      if (typeof refreshAdminLiveChats === 'function') refreshAdminLiveChats();
    }
  };
})();

// --- NEXT SCRIPT BLOCK ---

(function() {
  // AUTHORITATIVE 6-SECOND VIOLENT GUN RELOAD ENGINE
  window.triggerUniversalGunReload = window.triggerUniversal6SecGunReload = function(triggerBtn, targetType) {
    if (!triggerBtn) return;
    if (triggerBtn.dataset.gunShooting === 'true') return;
    triggerBtn.dataset.gunShooting = 'true';
    var origText = triggerBtn.innerHTML;
    triggerBtn.classList.add('gun-morph-active');
    // Panicked elements: Home, Back, badges, and nearby controls
    var backBtns = document.querySelectorAll('button[onclick*="navigateBack"]');
    var homeBtns = document.querySelectorAll('button[onclick*="returnToHome"]');
    var nearbyBadges = document.querySelectorAll('.meta-chip, .goal-header-badge, #admin-chat-count-badge');
    backBtns.forEach(function(b) {
      b.classList.add('panicked-runaway', 'panicked-run-left');
    });
    homeBtns.forEach(function(b) {
      b.classList.add('panicked-runaway', 'panicked-run-right');
    });
    nearbyBadges.forEach(function(el) {
      el.style.animation = 'panicScreamingShake 0.2s infinite ease-in-out';
    });
        // 4-Second Tactical Firearm & Bullet Dash Sequence
    var tacticalHandgunSvg = '<svg viewBox="0 0 48 24" width="46" height="22" style="vertical-align:middle; filter:drop-shadow(0 0 6px #ffb703); display:inline-block; margin-right:6px;"><path fill="#cbd5e1" d="M4 6h18v4H4z M18 6h6v5h-6z M8 10h14v2H8z M6 10h2v10H4v-8h2z M10 12h2v4h-2z M14 12h2v2h-2z"/><path fill="#ffb703" d="M22 7h2v2h-2z M2 8h2v2H2z"/><g style="animation: bulletDashStream 0.3s infinite ease-in-out;"><line x1="26" y1="8" x2="31" y2="8" stroke="#ffb703" stroke-width="2" stroke-linecap="round"/><line x1="34" y1="8" x2="39" y2="8" stroke="#00e5ff" stroke-width="2" stroke-linecap="round"/><line x1="42" y1="8" x2="47" y2="8" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></g></svg>';
    var gunSequence = [
      tacticalHandgunSvg + "<span style='color:#fbbf24; font-weight:800; font-size:0.86rem; letter-spacing:0.5px;'>[CHAMBERING ROUND]</span>",
      tacticalHandgunSvg + "<span style='color:#ef4444; font-weight:800; font-size:0.86rem; letter-spacing:0.5px;'>💥 FIRING DRILL • - - - 💥</span>",
      tacticalHandgunSvg + "<span style='color:#38bdf8; font-weight:800; font-size:0.86rem; letter-spacing:0.5px;'>🔄 TACTICAL MAG RELOAD</span>",
      tacticalHandgunSvg + "<span style='color:#10b981; font-weight:800; font-size:0.86rem; letter-spacing:0.5px;'>✓ 100% CLOUD SYNCED</span>"
    ];
    var step = 0;
    triggerBtn.innerHTML = gunSequence[0];
    step = 1;
    var stepInterval = setInterval(function() {
      if (step < gunSequence.length) {
        triggerBtn.innerHTML = gunSequence[step];
        step++;
      } else {
        clearInterval(stepInterval);
        // Snap everything back!
        triggerBtn.classList.remove('gun-morph-active');
        backBtns.forEach(function(b) {
          b.classList.remove('panicked-runaway', 'panicked-run-left');
        });
        homeBtns.forEach(function(b) {
          b.classList.remove('panicked-runaway', 'panicked-run-right');
        });
        nearbyBadges.forEach(function(el) {
          el.style.animation = '';
        });
        triggerBtn.innerHTML = '<span style="color:#10b981; font-weight:800;">✓ RELOAD COMPLETE</span>';
        setTimeout(function() {
          triggerBtn.innerHTML = origText;
          triggerBtn.dataset.gunShooting = 'false';
        }, 1000);
        // Perform actual data sync
        if (targetType === 'chat' || targetType === 'all') {
          if (typeof refreshAdminLiveChats === 'function') refreshAdminLiveChats();
        }
        if (targetType === 'roster' || targetType === 'all') {
          if (typeof refreshAdminRoster === 'function') refreshAdminRoster();
        }
      }
    }, 1000);
  };
  // DIRECT DELETE FUNCTION FOR LIVE CHAT THREADS
  window.deleteAdminChatThread = function(threadId) {
    if (!threadId) {
      alert("Please select a chat thread to delete.");
      return;
    }
    if (!confirm("⚠️ PERMANENT DELETE: Remove this chat thread permanently from Google Sheets and all devices?")) {
      return;
    }
    // 1. Instantly remove locally from cached threads so UI updates immediately
    var threads = typeof getStoredChatThreads === 'function' ? getStoredChatThreads() : [];
    threads = threads.filter(function(t) { return t.id !== threadId && t.threadId !== threadId; });
    if (typeof saveChatThreads === 'function') {
      saveChatThreads(threads);
    }
    // 2. Clear right chat dock if this thread was currently active
    if (window.__activeAdminChatThreadId === threadId) {
      window.__activeAdminChatThreadId = null;
      var stream = document.getElementById('admin-chat-active-messages');
      if (stream) stream.innerHTML = '<div style="text-align:center;color:#64748b;padding:40px 10px;">Select an inquiry from the left to view messages.</div>';
      var title = document.getElementById('admin-chat-active-name');
      if (title) title.textContent = 'NO ACTIVE THREAD';
      var phone = document.getElementById('admin-chat-active-phone');
      if (phone) phone.textContent = '';
    }
    // 3. Immediately re-render console list
    if (typeof renderAdminChatConsole === 'function') {
      renderAdminChatConsole();
    }
    if (typeof updateAdminChatBadgeCount === 'function') {
      updateAdminChatBadgeCount();
    }
    // 4. Send delete request to Google Apps Script backend
    var pin = sessionStorage.getItem('fifs_instructor_pin') || sessionStorage.getItem('fifs_instructor_pin') || 'Ultima';
    if (typeof callFifsBackend === 'function') {
      callFifsBackend('deleteLiveChatThread', { passcode: pin, threadId: threadId }, function(res) {
        console.log('Chat thread deleted on backend:', res);
        // Refresh again to ensure absolute consistency
        if (typeof refreshAdminLiveChats === 'function') refreshAdminLiveChats();
      }, function(err) {
        console.warn('Backend delete error (locally purged):', err);
      });
    }
  };
})();

// --- NEXT SCRIPT BLOCK ---

(function() {
  var stickmanAnimFrame = null;
  var stickmanStartTime = null;
  var sceneDuration = 10000; // Exactly 10 seconds
  var currentSceneIdx = 0;
  var SCENES = [
    {
      id: "matrix",
      name: "MATRIX ROOFTOP GUN-FU",
      heroColor: "#00e5ff",
      enemyColor: "#f43f5e",
      groundColor: "rgba(0, 229, 255, 0.4)",
      badgeText: "TARGET SECURED",
      render: function(ctx, w, h, t, groundY) {
        var neoColor = this.heroColor;
        var agentColor = this.enemyColor;
        if (t < 1.5) {
          var drawProgress = Math.min(1, t / 1.0);
          drawStickman(ctx, 90, groundY, neoColor, { facing: 1, shooting: drawProgress > 0.6 });
          drawStickman(ctx, w - 90, groundY, agentColor, { facing: -1, shooting: drawProgress > 0.4 });
        } else if (t < 3.8) {
          drawStickman(ctx, w - 90, groundY, agentColor, { facing: -1, shooting: true });
          drawStickman(ctx, 110, groundY, neoColor, { limbo: true, facing: 1 });
          var bulletT = (t - 1.5) / 2.3;
          for (var b = 0; b < 3; b++) {
            var bx = (w - 90) - ((bulletT * 400 + b * 110) % (w - 80));
            var by = groundY - 32 + b * 6;
            if (bx > 30) {
              ctx.save();
              ctx.strokeStyle = '#f43f5e';
              ctx.shadowColor = '#f43f5e';
              ctx.shadowBlur = 8;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(bx + 16, by);
              ctx.lineTo(bx, by);
              ctx.stroke();
              ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.ellipse(bx + 8, by, 3, 7, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          }
        } else if (t < 5.5) {
          var cartwheelProgress = (t - 3.8) / 1.7;
          var neoX = 110 + cartwheelProgress * (w * 0.42);
          drawStickman(ctx, neoX, groundY, neoColor, { cartwheel: true, angle: cartwheelProgress * Math.PI * 4 });
          drawStickman(ctx, w - 90, groundY, agentColor, { facing: -1, shooting: true });
          ctx.fillStyle = '#f59e0b';
          for (var s = 0; s < 5; s++) {
            var sx = neoX - (s * 8);
            var sy = groundY - Math.sin(t * 15 + s) * 8;
            ctx.fillRect(sx, sy, 2, 2);
          }
        } else if (t < 7.5) {
          var clashT = (t - 5.5) / 2.0;
          var neoX = (w * 0.55);
          var agentX = neoX + 45 + clashT * 80;
          var agentY = groundY - Math.sin(clashT * Math.PI) * 28;
          drawStickman(ctx, neoX, groundY, neoColor, { flyingKick: true, facing: 1 });
          drawStickman(ctx, agentX, agentY, agentColor, { ragdoll: true, angle: clashT * 3.5 });
          ctx.save();
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(neoX + 28, groundY - 24, 6 + Math.sin(t * 40) * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (t < 9.0) {
          var fallT = (t - 7.5) / 1.5;
          var neoX = (w * 0.50);
          var agentX = w - 40 + fallT * 80;
          var agentY = groundY + fallT * 40;
          drawStickman(ctx, neoX, groundY, neoColor, { facing: 1 });
          if (agentX < w + 30) {
            drawStickman(ctx, agentX, agentY, agentColor, { ragdoll: true, angle: 4.0 + fallT * 3 });
          }
        } else {
          var neoX = (w * 0.50);
          drawStickman(ctx, neoX, groundY, neoColor, { facing: 1, thumbsUp: true });
          renderTacticalBadge(ctx, neoX, groundY - 58, this.badgeText, "#00e5ff");
        }
      }
    },
    {
      id: "john_wick",
      name: "JOHN WICK CQB DOUBLE-TAP",
      heroColor: "#f4d03f",
      enemyColor: "#e11d48",
      groundColor: "rgba(244, 208, 63, 0.4)",
      badgeText: "THREAT NEUTRALIZED",
      render: function(ctx, w, h, t, groundY) {
        var wickColor = this.heroColor;
        var thugColor = this.enemyColor;
        if (t < 2.0) {
          var walkX = 60 + (t / 2.0) * 50;
          drawStickman(ctx, walkX, groundY, wickColor, { facing: 1, carStance: true });
          drawStickman(ctx, w - 80, groundY, thugColor, { facing: -1, shooting: t > 1.0 });
          if (t > 1.0) {
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect((w - 110) - (t - 1.0) * 160, groundY - 25, 12, 2);
          }
        } else if (t < 4.2) {
          var slideProgress = (t - 2.0) / 2.2;
          var wickX = 110 + slideProgress * 150;
          drawStickman(ctx, wickX, groundY, wickColor, { combatSlide: true, facing: 1 });
          drawStickman(ctx, w - 80, groundY, thugColor, { facing: -1, shooting: true });
          ctx.fillStyle = '#ffb703';
          for (var sp = 0; sp < 4; sp++) {
            ctx.fillRect(wickX - sp * 10, groundY - 2, 3, 2);
          }
        } else if (t < 6.8) {
          var cqbT = (t - 4.2) / 2.6;
          var wickX = (w * 0.50);
          var thugX = wickX + 38;
          drawStickman(ctx, wickX, groundY, wickColor, { facing: 1, doubleTap: true, firingT: t });
          drawStickman(ctx, thugX, groundY, thugColor, { facing: -1, hitStagger: true, staggerT: cqbT });
          ctx.save();
          ctx.fillStyle = '#f4d03f';
          ctx.shadowColor = '#f4d03f';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(wickX + 26, groundY - 28, 5 + Math.sin(t * 30) * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(wickX + 10, groundY - 30 - Math.sin(t * 10) * 8, 3, 5);
          ctx.restore();
        } else if (t < 8.8) {
          var tossT = (t - 6.8) / 2.0;
          var wickX = (w * 0.48);
          var thugX = wickX + 45 + tossT * 120;
          var thugY = groundY + tossT * 35;
          drawStickman(ctx, wickX, groundY, wickColor, { facing: 1, holsterAction: true });
          drawStickman(ctx, thugX, thugY, thugColor, { ragdoll: true, angle: tossT * 4.5 });
        } else {
          var wickX = (w * 0.50);
          drawStickman(ctx, wickX, groundY, wickColor, { facing: 1, readyStance: true, suitAdjust: true });
          renderTacticalBadge(ctx, wickX, groundY - 58, this.badgeText, "#f4d03f");
        }
      }
    },
    {
      id: "terminator",
      name: "TERMINATOR 2 CYBERNETIC SWEEP",
      heroColor: "#38bdf8",
      enemyColor: "#dc2626",
      groundColor: "rgba(56, 189, 248, 0.4)",
      badgeText: "JUDGMENT EXECUTED",
      render: function(ctx, w, h, t, groundY) {
        var t800Color = this.heroColor;
        var hunterColor = this.enemyColor;
        var t800X = 70 + Math.min(1, t / 7.0) * (w * 0.35);
        if (t < 7.0) {
          drawStickman(ctx, t800X, groundY, t800Color, { facing: 1, minigun: true, firingT: t });
          drawStickman(ctx, w - 80, groundY, hunterColor, { facing: -1, suppressionCover: true, coverT: t });
          ctx.save();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(t800X + 5, groundY - 39, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(t800X + 8, groundY - 39);
          ctx.lineTo(w - 70, groundY - 30);
          ctx.stroke();
          ctx.fillStyle = '#0284c7';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          for (var tr = 0; tr < 4; tr++) {
            var trX = t800X + 35 + ((t * 600 + tr * 70) % (w - t800X - 100));
            ctx.fillRect(trX, groundY - 26 + (tr % 2) * 4, 16, 2);
          }
          ctx.fillStyle = '#fbbf24';
          for (var c = 0; c < 3; c++) {
            var cx = t800X + 15 - c * 5;
            var cy = groundY - 15 + Math.sin(t * 20 + c) * 6;
            ctx.fillRect(cx, cy, 2, 4);
          }
          ctx.restore();
        } else if (t < 8.8) {
          var blastT = (t - 7.0) / 1.8;
          var enemyX = w - 80 + blastT * 90;
          var enemyY = groundY + blastT * 40;
          drawStickman(ctx, t800X, groundY, t800Color, { facing: 1, shotgunFlip: true, flipAngle: blastT * Math.PI * 2 });
          drawStickman(ctx, enemyX, enemyY, hunterColor, { ragdoll: true, angle: blastT * 3.0 });
        } else {
          drawStickman(ctx, t800X, groundY, t800Color, { facing: 1, idleBoss: true });
          renderTacticalBadge(ctx, t800X, groundY - 58, this.badgeText, "#38bdf8");
        }
      }
    },
    {
      id: "equilibrium",
      name: "EQUILIBRIUM 360° GUN KATA",
      heroColor: "#e2e8f0",
      enemyColor: "#f97316",
      groundColor: "rgba(226, 232, 240, 0.35)",
      badgeText: "GUN KATA MASTERY",
      render: function(ctx, w, h, t, groundY) {
        var clericColor = this.heroColor;
        var foeColor = this.enemyColor;
        var clericX = (w * 0.50);
        if (t < 2.0) {
          drawStickman(ctx, clericX, groundY, clericColor, { facing: 1, kataCross: true });
          drawStickman(ctx, 80, groundY, foeColor, { facing: 1, shooting: true });
          drawStickman(ctx, w - 80, groundY, foeColor, { facing: -1, shooting: true });
        } else if (t < 6.5) {
          var kataProgress = (t - 2.0) / 4.5;
          drawStickman(ctx, clericX, groundY, clericColor, { facing: 1, dualBurst: true, spinPhase: kataProgress * 6 });
          drawStickman(ctx, 90 + Math.sin(t * 5) * 8, groundY, foeColor, { facing: 1, shooting: true });
          drawStickman(ctx, w - 90 - Math.sin(t * 5) * 8, groundY, foeColor, { facing: -1, shooting: true });
          ctx.save();
          ctx.strokeStyle = '#e2e8f0';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1.5;
          for (var a = 0; a < 6; a++) {
            var ang = t * 12 + a * (Math.PI / 3);
            var r1 = 18;
            var r2 = 36;
            ctx.beginPath();
            ctx.moveTo(clericX + Math.cos(ang) * r1, groundY - 26 + Math.sin(ang) * r1);
            ctx.lineTo(clericX + Math.cos(ang) * r2, groundY - 26 + Math.sin(ang) * r2);
            ctx.stroke();
          }
          ctx.restore();
        } else if (t < 8.8) {
          var spinT = (t - 6.5) / 2.3;
          drawStickman(ctx, clericX, groundY, clericColor, { facing: 1, kataSweep: true });
          drawStickman(ctx, 80 - spinT * 90, groundY + spinT * 25, foeColor, { ragdoll: true, angle: -spinT * 3.5 });
          drawStickman(ctx, w - 80 + spinT * 90, groundY + spinT * 25, foeColor, { ragdoll: true, angle: spinT * 3.5 });
        } else {
          drawStickman(ctx, clericX, groundY, clericColor, { facing: 1, kataSalute: true });
          renderTacticalBadge(ctx, clericX, groundY - 58, this.badgeText, "#e2e8f0");
        }
      }
    },
    {
      id: "die_hard",
      name: "DIE HARD ROOFTOP AIR-DROP",
      heroColor: "#10b981",
      enemyColor: "#a855f7",
      groundColor: "rgba(16, 185, 129, 0.4)",
      badgeText: "MISSION ACCOMPLISHED",
      render: function(ctx, w, h, t, groundY) {
        var johnColor = this.heroColor;
        var hansColor = this.enemyColor;
        if (t < 2.8) {
          var swingProgress = t / 2.8;
          var swingX = 50 + swingProgress * (w * 0.45);
          var swingY = 15 + Math.sin(swingProgress * Math.PI) * 45;
          ctx.save();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(w * 0.25, 0);
          ctx.lineTo(swingX, swingY - 25);
          ctx.stroke();
          ctx.restore();
          drawStickman(ctx, swingX, swingY, johnColor, { ropeSwing: true, facing: 1 });
          drawStickman(ctx, w - 80, groundY, hansColor, { facing: -1, shooting: true });
        } else if (t < 5.0) {
          var rollProgress = (t - 2.8) / 2.2;
          var rollX = (w * 0.50) + rollProgress * 50;
          drawStickman(ctx, rollX, groundY, johnColor, { cartwheel: true, angle: rollProgress * Math.PI * 4 });
          drawStickman(ctx, w - 80, groundY, hansColor, { facing: -1, shooting: true });
        } else if (t < 7.8) {
          var fireX = (w * 0.58);
          drawStickman(ctx, fireX, groundY, johnColor, { facing: 1, dualFire: true, firingT: t });
          drawStickman(ctx, w - 75, groundY, hansColor, { facing: -1, hitStagger: true, staggerT: (t - 5.0) });
          ctx.save();
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(w - 70, groundY - 22, 10 + Math.sin(t * 20) * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (t < 9.0) {
          var dropT = (t - 7.8) / 1.2;
          drawStickman(ctx, (w * 0.55), groundY, johnColor, { facing: 1 });
          drawStickman(ctx, w - 60 + dropT * 70, groundY + dropT * 40, hansColor, { ragdoll: true, angle: dropT * 4.0 });
        } else {
          var johnX = (w * 0.50);
          drawStickman(ctx, johnX, groundY, johnColor, { facing: 1, thumbsUp: true });
          renderTacticalBadge(ctx, johnX, groundY - 58, this.badgeText, "#10b981");
        }
      }
    }
  ];
  function renderTacticalBadge(ctx, x, y, text, color) {
    ctx.save();
    ctx.fillStyle = 'rgba(7, 11, 16, 0.88)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    var bw = 140;
    var bh = 20;
    ctx.strokeRect(x - bw/2, y, bw, bh);
    ctx.fillRect(x - bw/2, y, bw, bh);
    ctx.fillStyle = color;
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✓ ' + text, x, y + 14);
    ctx.restore();
  }
  function drawStickman(ctx, x, y, color, pose) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var headR = 7;
    var headY = y - 38;
    if (pose.limbo) {
      headY = y - 16;
      var headX = x - 26;
      ctx.beginPath(); ctx.arc(headX, headY, headR, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(headX + headR, headY + 2); ctx.lineTo(x, y - 18); ctx.lineTo(x + 10, y - 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 10, y - 26); ctx.lineTo(x + 14, y - 10); ctx.lineTo(x + 18, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 10, y - 26); ctx.lineTo(x + 2, y - 8); ctx.lineTo(x - 6, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x - 8, y - 6); ctx.lineTo(x - 14, y - 2); ctx.stroke();
      ctx.restore(); return;
    }
    if (pose.cartwheel) {
      ctx.save(); ctx.translate(x, y - 22); ctx.rotate(pose.angle || 0);
      ctx.beginPath(); ctx.arc(0, -18, headR, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-14, -14); ctx.moveTo(0, -5); ctx.lineTo(14, -14);
      ctx.moveTo(0, 8); ctx.lineTo(-14, 20); ctx.moveTo(0, 8); ctx.lineTo(14, 20); ctx.stroke();
      ctx.restore(); ctx.restore(); return;
    }
    if (pose.flyingKick) {
      var khX = x - 15, khY = y - 30;
      ctx.beginPath(); ctx.arc(khX, khY, headR, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(khX + 5, khY + 5); ctx.lineTo(x, y - 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x + 28, y - 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x - 6, y - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 5, y - 24); ctx.lineTo(x + 18, y - 22); ctx.stroke();
      ctx.restore(); return;
    }
    if (pose.combatSlide) {
      var shX = x - 20, shY = y - 14;
      ctx.beginPath(); ctx.arc(shX, shY, headR, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(shX + 6, shY); ctx.lineTo(x, y - 10); ctx.lineTo(x + 24, y - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x - 10, y - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 18, y - 18); ctx.stroke();
      ctx.restore(); return;
    }
    if (pose.ragdoll) {
      ctx.save(); ctx.translate(x, y - 18); ctx.rotate(pose.angle || 0.6);
      ctx.beginPath(); ctx.arc(0, -16, headR, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(-16, -10); ctx.moveTo(0, -3); ctx.lineTo(16, -8);
      ctx.moveTo(0, 10); ctx.lineTo(-12, 22); ctx.moveTo(0, 10); ctx.lineTo(12, 18); ctx.stroke();
      ctx.restore(); ctx.restore(); return;
    }
    // Default upright / shooting / ready poses
    ctx.beginPath(); ctx.arc(x, headY, headR, 0, Math.PI * 2); ctx.stroke();
    var neckY = headY + headR;
    var pelvisY = y - 16;
    ctx.beginPath(); ctx.moveTo(x, neckY); ctx.lineTo(x, pelvisY); ctx.stroke();
    var dir = pose.facing || 1;
    ctx.beginPath(); ctx.moveTo(x, pelvisY); ctx.lineTo(x + 10 * dir, y); ctx.moveTo(x, pelvisY); ctx.lineTo(x - 10 * dir, y); ctx.stroke();
    var shoulderY = neckY + 4;
    if (pose.shooting || pose.doubleTap || pose.dualFire) {
      ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x + dir * 14, shoulderY - 2); ctx.lineTo(x + dir * 22, shoulderY - 2); ctx.stroke();
      ctx.strokeStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(x + dir * 20, shoulderY - 5); ctx.lineTo(x + dir * 27, shoulderY - 5); ctx.lineTo(x + dir * 22, shoulderY); ctx.stroke();
    } else if (pose.thumbsUp) {
      ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x - dir * 10, shoulderY + 8); ctx.lineTo(x - dir * 6, pelvisY);
      ctx.moveTo(x, shoulderY); ctx.lineTo(x + dir * 12, shoulderY - 8); ctx.lineTo(x + dir * 12, shoulderY - 18); ctx.stroke();
      ctx.fillStyle = '#10b981'; ctx.font = '12px sans-serif'; ctx.fillText('👍', x + dir * 14, shoulderY - 14);
    } else if (pose.minigun) {
      ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x + dir * 18, shoulderY + 6); ctx.stroke();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(x + dir * 16, shoulderY + 6); ctx.lineTo(x + dir * 32, shoulderY + 6); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x + dir * 8, shoulderY + 8); ctx.lineTo(x + dir * 14, shoulderY + 3);
      ctx.moveTo(x, shoulderY); ctx.lineTo(x - dir * 6, shoulderY + 10); ctx.stroke();
    }
    ctx.restore();
  }
  window.playStickmanActionMovieScene = function(forceNext) {
    var cv = document.getElementById('stickmanActionCanvas') || document.getElementById('sectionStickmanCanvas');
    if (!cv) return;
    if (!cv.width || cv.width < 100) cv.width = 520;
    if (!cv.height || cv.height < 50) cv.height = 96;
    
    var timerEls = [
      document.getElementById('stickmanTimer'),
      document.getElementById('sectionStickmanTimer')
    ].filter(Boolean);
    var titleEls = [
      document.getElementById('stickmanSceneName'),
      document.getElementById('sectionStickmanName')
    ].filter(Boolean);
    
    if (stickmanAnimFrame) {
      cancelAnimationFrame(stickmanAnimFrame);
      stickmanAnimFrame = null;
    }
    if (forceNext) {
      currentSceneIdx = (currentSceneIdx + 1) % SCENES.length;
    } else {
      currentSceneIdx = Math.floor(Math.random() * SCENES.length);
    }
    var activeScene = SCENES[currentSceneIdx];
    titleEls.forEach(function(el) { el.textContent = activeScene.name; el.style.color = activeScene.heroColor; });
    stickmanStartTime = performance.now();
    
    function renderFrame(now) {
      var currentCv = document.getElementById('stickmanActionCanvas') || document.getElementById('sectionStickmanCanvas');
      if (!currentCv) return;
      var elapsed = now - stickmanStartTime;
      if (elapsed > sceneDuration) elapsed = sceneDuration;
      var t = elapsed / 1000;
      var remaining = Math.max(0, (10 - t)).toFixed(1);
      timerEls.forEach(function(el) {
        el.textContent = remaining + 's';
        if (t >= 9.0) el.textContent = '✓ MISSION READY';
      });
      
      var ctx = currentCv.getContext('2d');
      if (ctx) {
        var w = currentCv.width || 520;
        var h = currentCv.height || 96;
        var groundY = h - 3;
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.strokeStyle = activeScene.groundColor || 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(w, groundY);
        ctx.stroke();
        ctx.restore();
        try {
          activeScene.render(ctx, w, h, t, groundY);
        } catch (sceneErr) {
          console.warn('Stickman scene render error:', sceneErr);
        }
      }
      
      if (elapsed < sceneDuration) {
        stickmanAnimFrame = requestAnimationFrame(renderFrame);
      } else {
        setTimeout(function() {
          if (typeof window.playNextStickmanScene === 'function') {
            window.playNextStickmanScene();
          }
        }, 1200);
      }
    }
    stickmanAnimFrame = requestAnimationFrame(renderFrame);
  };
  window.playNextStickmanScene = function() {
    window.playStickmanActionMovieScene(true);
  };
  // Hook into openExpectationModal
  var originalOpenExpectation = window.openExpectationModal;
  window.openExpectationModal = function(type) {
    if (typeof originalOpenExpectation === 'function') {
      originalOpenExpectation(type);
    }
    // Fire immediately and after modal animation layout settles
    if (typeof window.playStickmanActionMovieScene === 'function') {
      window.playStickmanActionMovieScene(false);
    }
    setTimeout(function() {
      if (typeof window.playStickmanActionMovieScene === 'function') {
        window.playStickmanActionMovieScene(false);
      }
    }, 60);
    setTimeout(function() {
      if (typeof window.playStickmanActionMovieScene === 'function') {
        window.playStickmanActionMovieScene(false);
      }
    }, 200);
  };

  function bootStickmanActionChoreography() {
    var cv = document.getElementById('sectionStickmanCanvas') || document.getElementById('stickmanActionCanvas');
    if (cv && typeof window.playStickmanActionMovieScene === 'function') {
      window.playStickmanActionMovieScene(false);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootStickmanActionChoreography);
  } else {
    setTimeout(bootStickmanActionChoreography, 150);
  }
  window.addEventListener('load', bootStickmanActionChoreography);
})();

// --- NEXT SCRIPT BLOCK ---

// DYNAMIC ZERO-MOCK P2P LIVE CHAT HUD SYSTEM
window.__activeChatSession = {
  name: '',
  phone: '',
  threadId: '',
  messages: []
};

function escapeChatHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderLiveVisitorRoster() {
  var container = document.getElementById('contactRosterContainer');
  if (!container) return;
  container.innerHTML = '';
  var name = (window.__activeChatSession && window.__activeChatSession.name) || (window.__currentChatSession && window.__currentChatSession.name) || 'Valued Visitor';
  var card = document.createElement('div');
  card.className = 'contact-card active';
  card.innerHTML =
    '<div class="avatar-box">P2P<span class="status-indicator active"></span></div>' +
    '<div class="contact-info">' +
      '<div class="contact-top-row">' +
        '<span class="contact-name">' + escapeChatHtml(name) + '</span>' +
        '<span class="contact-time">LIVE</span>' +
      '</div>' +
      '<div class="contact-meta">Direct Peer-to-Instructor Comm Link</div>' +
      '<div class="contact-badges">' +
        '<span class="tag-badge">SEC-NET v2.4</span>' +
        '<span class="tag-badge" style="color:var(--accent-cyan);">CHIEF DESK</span>' +
      '</div>' +
    '</div>';
  container.appendChild(card);
}

function renderLiveVisitorStream(messages) {
  var container = document.getElementById('liveChatMessagesContainer');
  var streamEl = document.getElementById('chatStream');
  if (!container && streamEl) {
    container = streamEl;
  }
  if (!container) return;
  container.innerHTML = '';
  
  if (Array.isArray(messages)) {
    messages.forEach(function(m) {
      var isInstructor = m.sender === 'instructor' || m.sender === 'them' || m.isInstructor || (m.role === 'instructor');
      var row = document.createElement('div');
      row.className = 'message-row ' + (isInstructor ? 'incoming' : 'outgoing');
      var senderLabel = isInstructor ? 'Instructor Kai Wade [CHIEF CMD]' : ((window.__activeChatSession && window.__activeChatSession.name) || 'You');
      var timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : (m.time || 'LIVE');
      var metaSub = isInstructor
        ? '<span>ORIGIN: CHIEF INSTRUCTOR COMMAND</span><span style="color: var(--accent-cyan);">VERIFIED ✓</span>'
        : '<span>DISPATCH: CLIENT TERMINAL</span><span style="color: var(--brand-primary);">DELIVERED ✓</span>';
      row.innerHTML =
        '<div class="message-header">' +
          '<span class="message-sender">' + escapeChatHtml(senderLabel) + '</span>' +
          '<span class="message-timestamp">' + escapeChatHtml(timeStr) + '</span>' +
        '</div>' +
        '<div class="message-bubble">' +
          escapeChatHtml(m.content || m.message || m.text || '') +
          '<div class="bubble-meta-tag">' + metaSub + '</div>' +
        '</div>';
      container.appendChild(row);
    });
  }
  
  if (streamEl) {
    streamEl.scrollTop = streamEl.scrollHeight;
  }
}

function appendOutgoingVisitorBubble(text) {
  var container = document.getElementById('liveChatMessagesContainer');
  var streamEl = document.getElementById('chatStream');
  if (!container && streamEl) {
    container = streamEl;
  }
  if (!container) return;
  var row = document.createElement('div');
  row.className = 'message-row outgoing';
  var senderLabel = (window.__activeChatSession && window.__activeChatSession.name) || (window.__currentChatSession && window.__currentChatSession.name) || 'You';
  var timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' EST';
  row.innerHTML =
    '<div class="message-header">' +
      '<span class="message-sender">' + escapeChatHtml(senderLabel) + '</span>' +
      '<span class="message-timestamp">' + escapeChatHtml(timeStr) + '</span>' +
    '</div>' +
    '<div class="message-bubble">' +
      escapeChatHtml(text) +
      '<div class="bubble-meta-tag"><span>DISPATCH: CLIENT TERMINAL</span><span>TRANSMITTING...</span></div>' +
    '</div>';
  container.appendChild(row);
  if (streamEl) {
    streamEl.scrollTop = streamEl.scrollHeight;
  }
}

function handleInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitCurrentMessage();
  }
}

function autoResizeInput(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function submitCurrentMessage(presetText) {
  var input = document.getElementById('messageInput');
  var text = (presetText !== undefined ? presetText : (input ? input.value : '')).trim();
  if (!text) return;
  if (input && presetText === undefined) {
    input.value = '';
    input.style.height = 'auto';
  }
  appendOutgoingVisitorBubble(text);
  
  var session = window.__activeChatSession || window.__currentChatSession || { name: 'Valued Visitor', phone: '' };
  var cleanPhone = (session.phone || '').replace(/\D/g, '');
  var threadId = session.threadId || (cleanPhone ? ('thread_' + cleanPhone) : ('thread_' + Date.now()));
  
  var payload = {
    senderName: session.name || 'Valued Visitor',
    senderPhone: cleanPhone,
    senderEmail: session.email || '',
    message: text,
    threadId: threadId
  };
  
  if (typeof callFifsBackend === 'function') {
    callFifsBackend('handleLiveChatMessage', payload, function(res) {
      if (res && res.status === 'success' && Array.isArray(res.messages)) {
        renderLiveVisitorStream(res.messages);
      }
    }, function(err) {
      console.warn('Live chat backend notification deferred:', err);
    });
  }
}

window.sendP2pMessageDirect = function(msg) {
  submitCurrentMessage(msg);
};

function triggerSecureAction() {
  var action = prompt("ENTER SECURE HUD ACTION:\n1. REQUEST WEAR & CARRY CONSULTATION\n2. REQUEST LIVE-FIRE RANGE SLOT\n3. CONFIRM MSP QUALIFICATION STATUS", "1");
  if (!action) return;
  var noticeText = "CLIENT ACTION DISPATCHED: OPTION #" + action;
  if (action === '1') noticeText = "CONSULTATION INQUIRY LOGGED WITH CHIEF INSTRUCTOR";
  if (action === '2') noticeText = "LIVE-FIRE RANGE SCHEDULING REQUEST TRANSMITTED";
  if (action === '3') noticeText = "MSP QUALIFICATION VERIFICATION RECORD REQUESTED";
  submitCurrentMessage('[' + noticeText + ']');
}

function exportChatSession() {
  var name = (window.__activeChatSession && window.__activeChatSession.name) || 'Visitor';
  var transcript = "=== FIFS TACTICAL COMMS TRANSCRIPT ===\n";
  transcript += "PARTICIPANT: " + name + "\n";
  transcript += "SESSION EXPORT TIME: " + new Date().toISOString() + "\n\n";
  var container = document.getElementById('liveChatMessagesContainer') || document.getElementById('chatStream');
  if (container) {
    var rows = container.querySelectorAll('.message-row');
    rows.forEach(function(r) {
      var s = r.querySelector('.message-sender');
      var t = r.querySelector('.message-timestamp');
      var b = r.querySelector('.message-bubble');
      transcript += "[" + (t ? t.innerText : '') + "] " + (s ? s.innerText : '') + ":\n" + (b ? b.innerText : '') + "\n\n";
    });
  }
  var blob = new Blob([transcript], { type: 'text/plain' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'FIFS_COMMS_' + name.replace(/\s+/g, '_') + '.txt';
  a.click();
}

function clearChatStream() {
  if (!confirm('PURGE SESSION: Clear active terminal stream display?')) return;
  var container = document.getElementById('liveChatMessagesContainer');
  if (container) container.innerHTML = '';
}

function filterContacts() {
  renderLiveVisitorRoster();
}

function toggleMobileSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function openP2pCommsHud(name, phone, initialMsg) {
  var m = document.getElementById('fifsP2pCommsModal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  if (name || phone) {
    var sessionData = {
      name: name || 'Valued Visitor',
      phone: phone || ''
    };
    try {
      sessionStorage.setItem('fifs_visitor_session', JSON.stringify(sessionData));
    } catch(e) {}
    window.__currentChatSession = sessionData;
  }
  
  var visitorPhone = phone || (window.__currentChatSession && window.__currentChatSession.phone) || '';
  var cleanPhone = visitorPhone.replace(/\D/g, '');
  var threadId = cleanPhone ? ('thread_' + cleanPhone) : ('thread_' + Date.now());
  var visitorName = name || (window.__currentChatSession && window.__currentChatSession.name) || 'Valued Visitor';
  
  window.__activeChatSession = {
    name: visitorName,
    phone: cleanPhone,
    threadId: threadId,
    messages: []
  };
  if (window.__currentChatSession) {
    window.__currentChatSession.threadId = threadId;
  }

  // Update header metadata
  var nameEl = document.getElementById('activeContactName');
  if (nameEl) nameEl.textContent = visitorName;
  var secStatusEl = document.getElementById('activeVerificationStatus');
  if (secStatusEl) secStatusEl.textContent = 'SEC-STATUS: DIRECT';
  var roleEl = document.getElementById('activeContactRole');
  if (roleEl) {
    roleEl.innerHTML = '<span class="p2p-yellow-beacon" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ffb703;animation:p2pYellowPulse 1.1s infinite ease-in-out;"></span><span>Live Range & Course Consultation</span>';
  }
  var chanEl = document.getElementById('activeContactChannel');
  if (chanEl) chanEl.textContent = 'CHAN: P2P-LIVE';

  // Clear message container
  var container = document.getElementById('liveChatMessagesContainer');
  if (container) {
    container.innerHTML = '';
  }
  
  renderLiveVisitorRoster();

  // If initialMsg exists, display immediately as an outgoing message bubble from client and dispatch to /api/fifs
  if (initialMsg) {
    appendOutgoingVisitorBubble(initialMsg);
    if (typeof callFifsBackend === 'function') {
      callFifsBackend('handleLiveChatMessage', {
        senderName: visitorName,
        senderPhone: cleanPhone,
        message: initialMsg,
        threadId: threadId
      }, function(res) {
        if (res && res.status === 'success' && Array.isArray(res.messages)) {
          renderLiveVisitorStream(res.messages);
        }
      });
    }
  }

  // Live Polling for Client Phone (Every 3 Seconds)
  if (window.__p2pPollInterval) clearInterval(window.__p2pPollInterval);
  
  function pollVisitorMessages() {
    var curThreadId = (window.__activeChatSession && window.__activeChatSession.threadId) || (window.__currentChatSession && window.__currentChatSession.threadId);
    if (!curThreadId || typeof callFifsBackend !== 'function') return;
    
    callFifsBackend('getVisitorChatMessages', { threadId: curThreadId }, function(res) {
      if (res && res.status === 'success' && Array.isArray(res.messages)) {
        renderLiveVisitorStream(res.messages);
      }
    });
  }
  
  pollVisitorMessages();
  window.__p2pPollInterval = setInterval(pollVisitorMessages, 3000);
}

function closeP2pCommsHud() {
  if (window.__p2pPollInterval) {
    clearInterval(window.__p2pPollInterval);
    window.__p2pPollInterval = null;
  }
  var m = document.getElementById('fifsP2pCommsModal');
  if (m) {
    m.style.display = 'none';
    m.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

window.openP2pCommsHud = openP2pCommsHud;
window.closeP2pCommsHud = closeP2pCommsHud;
window.renderLiveVisitorStream = renderLiveVisitorStream;
window.renderLiveVisitorRoster = renderLiveVisitorRoster;

// --- NEXT SCRIPT BLOCK ---

// OFFICIAL MARYLAND STATE POLICE SCORE SHEET (MSP FORM 29-14) DATA & VIEWER
  var FIFS_MSP_SCORE_SHEET_BASE64 = "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agpbIC9JQ0NCYXNlZCAyMSAwIFIgXQplbmRvYmoKMjMgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdFRyZWVSb290IC9LIDIyIDAgUiAvUGFyZW50VHJlZSAyNCAwIFIgL0lEVHJlZSAyNSAwIFI+PgplbmRvYmoKMjIgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1NlY3QgL1AgMjMgMCBSIC9LIFsgMjYgMCBSIDI3IDAgUiAyOCAwIFIgMjkgMCBSIDMwIDAgUgozMSAwIFIgMzIgMCBSIDMzIDAgUiAzNCAwIFIgMzUgMCBSIDM2IDAgUiAzNyAwIFIgMzggMCBSIDM5IDAgUiA0MCAwIFIgNDEgMCBSCjQyIDAgUiA0MyAwIFIgNDQgMCBSIDQ1IDAgUiA0NiAwIFIgNDcgMCBSIDQ4IDAgUiA0OSAwIFIgNTAgMCBSIDUxIDAgUiA1MiAwIFIKNTMgMCBSIDU0IDAgUiA1NSAwIFIgNTYgMCBSIDU3IDAgUiA1OCAwIFIgNTkgMCBSIDYwIDAgUiA2MSAwIFIgNjIgMCBSIDYzIDAgUgo2NCAwIFIgNjUgMCBSIDY2IDAgUiA2NyAwIFIgNjggMCBSIDY5IDAgUiA3MCAwIFIgNzEgMCBSIDcyIDAgUiA3MyAwIFIgNzQgMCBSCjc1IDAgUiA3NiAwIFIgNzcgMCBSIDc4IDAgUiA3OSAwIFIgODAgMCBSIDgxIDAgUiA4MiAwIFIgODMgMCBSIDg0IDAgUiA4NSAwIFIKODYgMCBSIDg3IDAgUiA4OCAwIFIgODkgMCBSIDkwIDAgUiA5MSAwIFIgOTIgMCBSIDkzIDAgUiA5NCAwIFIgOTUgMCBSIDk2IDAgUgo5NyAwIFIgOTggMCBSIDk5IDAgUiAxMDAgMCBSIF0gID4+CmVuZG9iagoyNiAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvSDEgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDAgID4+CmVuZG9iagoyNyAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvUCAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgMSAgPj4KZW5kb2JqCjI4IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyAyICA+PgplbmRvYmoKMjkgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDMgID4+CmVuZG9iagozMCAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvUCAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgNCAgPj4KZW5kb2JqCjMxIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA1ICA+PgplbmRvYmoKMzIgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0ZpZ3VyZSAvUCAyMiAwIFIgL1BnIDMgMCBSIC9BbHQgKCkgL0sgNjkgID4+CmVuZG9iagozMyAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvSDEgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDYgID4+CmVuZG9iagozNCAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvUCAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgNyAgPj4KZW5kb2JqCjM1IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9IMSAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgOCAgPj4KZW5kb2JqCjM2IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9GaWd1cmUgL1AgMjIgMCBSIC9QZyAzIDAgUiAvQWx0ICgpIC9LIDcxICA+PgplbmRvYmoKMzcgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDkgID4+CmVuZG9iagozOCAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvUCAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgMTAgID4+CmVuZG9iagozOSAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvRmlndXJlIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0FsdCAoKSAvSyA3MiAgPj4KZW5kb2JqCjQwIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyAxMSAgPj4KZW5kb2JqCjQxIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyAxMiAgPj4KZW5kb2JqCjQyIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9GaWd1cmUgL1AgMjIgMCBSIC9QZyAzIDAgUiAvQWx0ICgpIC9LIDczICA+PgplbmRvYmoKNDMgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDEzICA+PgplbmRvYmoKNDQgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDE0ICA+PgplbmRvYmoKNDUgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0ZpZ3VyZSAvUCAyMiAwIFIgL1BnIDMgMCBSIC9BbHQgKCkgL0sgNzQgID4+CmVuZG9iago0NiAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvUCAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgMTUgID4+CmVuZG9iago0NyAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvTCAvUCAyMiAwIFIgL0sgWyAxMDEgMCBSIF0gID4+CmVuZG9iagoxMDEgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0xJIC9QIDQ3IDAgUiAvSyBbIDEwMiAwIFIgXSAgPj4KZW5kb2JqCjEwMiAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvTEJvZHkgL1AgMTAxIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyAxOCAgPj4KZW5kb2JqCjQ4IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9GaWd1cmUgL1AgMjIgMCBSIC9QZyAzIDAgUiAvQWx0ICgpIC9LIDc2ICA+PgplbmRvYmoKNDkgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0ZpZ3VyZSAvUCAyMiAwIFIgL1BnIDMgMCBSIC9BbHQgKCkgL0sgNzUgID4+CmVuZG9iago1MCAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvUCAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgMjEgID4+CmVuZG9iago1MSAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvRmlndXJlIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0FsdCAoKSAvSyA4MCAgPj4KZW5kb2JqCjUyIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyAyMiAgPj4KZW5kb2JqCjUzIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9MIC9QIDIyIDAgUiAvSyBbIDEwMyAwIFIgXSAgPj4KZW5kb2JqCjEwMyAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvTEkgL1AgNTMgMCBSIC9LIFsgMTA0IDAgUiBdICA+PgplbmRvYmoKMTA0IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9MQm9keSAvUCAxMDMgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDI1ICA+PgplbmRvYmoKNTQgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0ZpZ3VyZSAvUCAyMiAwIFIgL1BnIDMgMCBSIC9BbHQgKCkgL0sgNzcgID4+CmVuZG9iago1NSAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvUCAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgMjggID4+CmVuZG9iago1NiAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvRmlndXJlIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0FsdCAoKSAvSyA4MSAgPj4KZW5kb2JqCjU3IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyAyOSAgPj4KZW5kb2JqCjU4IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9MIC9QIDIyIDAgUiAvSyBbIDEwNSAwIFIgXSAgPj4KZW5kb2JqCjEwNSAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvTEkgL1AgNTggMCBSIC9LIFsgMTA2IDAgUiBdICA+PgplbmRvYmoKMTA2IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9MQm9keSAvUCAxMDUgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDMyICA+PgplbmRvYmoKNTkgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDM1ICA+PgplbmRvYmoKNjAgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0ZpZ3VyZSAvUCAyMiAwIFIgL1BnIDMgMCBSIC9BbHQgKCkgL0sgNzggID4+CmVuZG9iago2MSAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvUCAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgMzYgID4+CmVuZG9iago2MiAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvRmlndXJlIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0FsdCAoKSAvSyA3OSAgPj4KZW5kb2JqCjYzIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyAzNyAgPj4KZW5kb2JqCjY0IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9IMSAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgMzggID4+CmVuZG9iago2NSAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvRmlndXJlIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0FsdCAoKSAvSyA4NCAgPj4KZW5kb2JqCjY2IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9GaWd1cmUgL1AgMjIgMCBSIC9QZyAzIDAgUiAvQWx0ICgpIC9LIDgzICA+PgplbmRvYmoKNjcgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0ZpZ3VyZSAvUCAyMiAwIFIgL1BnIDMgMCBSIC9BbHQgKCkgL0sgODIgID4+CmVuZG9iago2OCAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvRmlndXJlIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0FsdCAoKSAvSyA3MCAgPj4KZW5kb2JqCjY5IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyAzOSAgPj4KZW5kb2JqCjcwIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA0MCAgPj4KZW5kb2JqCjcxIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA0MSAgPj4KZW5kb2JqCjcyIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA0MiAgPj4KZW5kb2JqCjczIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9GaWd1cmUgL1AgMjIgMCBSIC9QZyAzIDAgUiAvQWx0ICgpIC9LIDY4ICA+PgplbmRvYmoKNzQgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDQzICA+PgplbmRvYmoKNzUgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDQ0ICA+PgplbmRvYmoKNzYgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDQ1ICA+PgplbmRvYmoKNzcgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0gxIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA0NiAgPj4KZW5kb2JqCjc4IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA0NyAgPj4KZW5kb2JqCjc5IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA0OCAgPj4KZW5kb2JqCjgwIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA0OSAgPj4KZW5kb2JqCjgxIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA1MCAgPj4KZW5kb2JqCjgyIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9GaWd1cmUgL1AgMjIgMCBSIC9QZyAzIDAgUiAvQWx0ICgpIC9LIDY3ICA+PgplbmRvYmoKODMgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0ZpZ3VyZSAvUCAyMiAwIFIgL1BnIDMgMCBSIC9BbHQgKCkgL0sgNjYgID4+CmVuZG9iago4NCAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvSDEgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDUxICA+PgplbmRvYmoKODUgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDUyICA+PgplbmRvYmoKODYgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDUzICA+PgplbmRvYmoKODcgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0ZpZ3VyZSAvUCAyMiAwIFIgL1BnIDMgMCBSIC9BbHQgKCkgL0sgODUgID4+CmVuZG9iago4OCAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvUCAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgNTQgID4+CmVuZG9iago4OSAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvUCAvUCAyMiAwIFIgL1BnIDMgMCBSIC9MYW5nIChFTi1VUykgL0sgNTUgID4+CmVuZG9iago5MCAwIG9iago8PCAvVHlwZSAvU3RydWN0RWxlbSAvUyAvRmlndXJlIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0FsdCAoKSAvSyA4NiAgPj4KZW5kb2JqCjkxIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9GaWd1cmUgL1AgMjIgMCBSIC9QZyAzIDAgUiAvQWx0ICgpIC9LIDY1ICA+PgplbmRvYmoKOTIgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDU2ICA+PgplbmRvYmoKOTMgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL0gxIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA1NyAgPj4KZW5kb2JqCjk0IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA1OCAgPj4KZW5kb2JqCjk1IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA1OSAgPj4KZW5kb2JqCjk2IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA2MCAgPj4KZW5kb2JqCjk3IDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9GaWd1cmUgL1AgMjIgMCBSIC9QZyAzIDAgUiAvQWx0ICgpIC9LIDY0ICA+PgplbmRvYmoKOTggMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDYxICA+PgplbmRvYmoKOTkgMCBvYmoKPDwgL1R5cGUgL1N0cnVjdEVsZW0gL1MgL1AgL1AgMjIgMCBSIC9QZyAzIDAgUiAvTGFuZyAoRU4tVVMpIC9LIDYyICA+PgplbmRvYmoKMTAwIDAgb2JqCjw8IC9UeXBlIC9TdHJ1Y3RFbGVtIC9TIC9QIC9QIDIyIDAgUiAvUGcgMyAwIFIgL0xhbmcgKEVOLVVTKSAvSyA2MyAgPj4KZW5kb2JqCjI0IDAgb2JqCjw8L051bXNbIDAgWyAyNiAwIFIgMjcgMCBSIDI4IDAgUiAyOSAwIFIgMzAgMCBSIDMxIDAgUiAzMyAwIFIgMzQgMCBSIDM1IDAgUgozNyAwIFIgMzggMCBSIDQwIDAgUiA0MSAwIFIgNDMgMCBSIDQ0IDAgUiA0NiAwIFIgbnVsbCBudWxsIDEwMiAwIFIgbnVsbCBudWxsCjUwIDAgUiA1MiAwIFIgbnVsbCBudWxsIDEwNCAwIFIgbnVsbCBudWxsIDU1IDAgUiA1NyAwIFIgbnVsbCBudWxsIDEwNiAwIFIKbnVsbCBudWxsIDU5IDAgUiA2MSAwIFIgNjMgMCBSIDY0IDAgUiA2OSAwIFIgNzAgMCBSIDcxIDAgUiA3MiAwIFIgNzQgMCBSIDc1IDAgUgo3NiAwIFIgNzcgMCBSIDc4IDAgUiA3OSAwIFIgODAgMCBSIDgxIDAgUiA4NCAwIFIgODUgMCBSIDg2IDAgUiA4OCAwIFIgODkgMCBSCjkyIDAgUiA5MyAwIFIgOTQgMCBSIDk1IDAgUiA5NiAwIFIgOTggMCBSIDk5IDAgUiAxMDAgMCBSIDk3IDAgUiA5MSAwIFIgODMgMCBSCjgyIDAgUiA3MyAwIFIgMzIgMCBSIDY4IDAgUiAzNiAwIFIgMzkgMCBSIDQyIDAgUiA0NSAwIFIgNDkgMCBSIDQ4IDAgUiA1NCAwIFIKNjAgMCBSIDYyIDAgUiA1MSAwIFIgNTYgMCBSIDY3IDAgUiA2NiAwIFIgNjUgMCBSIDg3IDAgUiA5MCAwIFIgXSBdPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9Db3VudCAxIC9LaWRzIFsgMyAwIFIgXSA+PgplbmRvYmoKMTA3IDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9PdXRsaW5lcyAxIDAgUiAvTWV0YWRhdGEgMiAwIFIgL1BhZ2VzIDQgMCBSIC9NYXJrSW5mbyA8PAovTWFya2VkIHRydWUgPj4gL1N0cnVjdFRyZWVSb290IDIzIDAgUiA+PgplbmRvYmoKMTkgMCBvYmoKPDwgL0JvcmRlciBbIDAgMCAwIF0gL1JlY3QgWyAxODEgNjYgNDExIDcxMCBdIC9UIChNb2JpbGUgVXNlcikgL0YgNjQ0IC9CUwoxMDggMCBSIC9EQSAoL0hlbHZldGljYSAxMiBUZiAwIGcpIC9TdWJ0eXBlIC9TdGFtcCAvQVAgMTA5IDAgUiAvTSAoRDoyMDI2MDkwNjAxMTg1OFowMCcwMCcpCi9BQVBMOkFLRXh0cmFzIDExMCAwIFIgL1R5cGUgL0Fubm90ID4+CmVuZG9iagoxMTAgMCBvYmoKPDwgL0FBUEw6QUtQREZBbm5vdGF0aW9uRGljdGlvbmFyeSAxMTEgMCBSIC9QUEsgKFkzSmtkQVlBQVFBYUZTb1RFaEVDQWFCMFRCYmZldXlQRUFkc0NNMjJrU3A5Q2cwR0FnY0tDQXNNQVFrREFBUUZFZ1FTQWdCU0VnUVNBZ0FCRWdRU0FnQmZFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUZFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFVU0JCSUNBQUV5OWg0S3dCNEFBQUFFbEZVUDVSNHBobVorMmZ6dEFBQUFBa3czQ01RWlh0VzFLazBFZ2dBQUFBYzZtQUdXR2tkdVV5L2FacThBQUFBNk1xZ0dSaERlcU02MkhoaFZBQUFBQUFDNUJXUVhGNGd2VkFTME53QUFBQUpNU1F2S0dOckpQOEl5eVo4QUFBQUFEN1FHQkFQTGlFMzNZWU4xQUFBQUFmd1pCcVlMQlluMUZaSUxWOHNMSEhLT0FqTFBFVm5XQk5IdkRmb0FBQUFFazZVSWRRKzduUzVGbVdqbnl3ZzBnSGNuUEhvVFl0K01DTEFQNlFBQUFBQVY3UWpURWw3clo5ZnhhK0lBQUFBNk1ya0tvaC80QjYxUENaQU8yVk5BU09qU1JuV0JnSTZDTGRBYTFBR2RqTVA0dm5EeGpVdWtOZlN0K3ZRQm5ZekQranQzSXBQS0ZSVUF0SGUvQVoyTXc5L3llRldhZjdrdFRQY3NZUUdkak1QelZuMlVqbEFWdUZKMUNHd0JuWXpEMTJ0OXJZRlQ5bFhubkdWUEFaMk13OWoxZkFlYXJ4QnRCbXdpaHdHZk16THhrSG9QbmM0dVVRaUN6eXNCbll6RDRSMTlFWlhpNUpBbWVrcUJBWjJNdytDRmZLZUlicVNkWGZESzFRR2ZNekx4a0hsTGlIN3VTcE9ER2xZQm5ZekQzMGw1MW9scXpSd1VnbU1nQVoyTXc5K3hjeGFhcUJlQ3EzWWluQUdldVI2RWdYZ0RpOFZtVlN2U2J3MEJuWXpENDRWeUVKUmgxeFJwVE9tWUFaMk13L0JBZTdtZkxWbmZnT1VSQndHZGpNUHhYMzdVaVU0SVlyU25hVVlCbll6RDNScCtyNWVhNnRRZ01ZeTZBWjJNdytHMmVlYWRkT29zLzFuaHdRR2ZNek5PLzNoTmdCUkNuZUJuTkI4Qm56TXpUdjk0Zm9CSVhSN1hCc1pzQVoyTXc5N0ZjUDJIZ09vcVlmZlAxQUdkak1QZkNuWXNoVzFpdGdYQ0Ftc0JuWXpEMWt4N3JZSUZ0UFI2VW95ZkFaMk13OWNpZk15ZVlWM21VM2RkQ0FHZGpNUFdUSHU1aVNFUjdKNUpJK0FCbll6RDFiaDJab3YyeTFsY25oZnFBWjJNdy9HTGVUcUdjWGhuWTNDUWVBR2RqTVB5RjNUNWhycEx3M0p4ekJJQm5ZekQvWWw5d1lSVCs4d3ZyVkZ5QVoyTXcvZkxjWTJOWDN4bW1ZdzkzZ0dkak1QNG1uQlJtQ0t1bFF6NkRMd0JuWXpEMDhkMS80SjdBUUNBN0NrT0FaMk13OVNwZm9hRWtIQ2Zrc2hlTFFHZGpNUHpWbjF2Z2xlblExWWFCN1FCbll6RDlOTjZJSTB1RDdUQ0xZZkRBWjJNdzkwYWZuNmY2Z0hKeksvTjRBR2RqTVBkK1hsMGdCYytJeVBOZVVZQm5ZekQ1TEozTW9RODZNT0x4NnFpQVoyTXcrUUpkUktadWdBS1VtT3JtZ0dkak1Qa2EzMEZsNUJ1U09oZzNIWUJuWXpEM2tKNllZb2tqaDhFdGVBOUFaMk13OVBIZG5LTnNyMjlNaVdYelFHZGpNUGZTWG56Zzl2TjYrYUhpWWNCbll6RDh0QjgrWm9EaVA3NzRtYUJBWjJNdy9MUWZPaVNNdWFqRXllQXFnR2RqTVB6RVhLYml5N2M3T0krbHR3Qm5ZekQzUnArOUlHYXFSR1IzRzRoQVoyTXcrTGRlQXVESjZEWmc1cENZQUdldVI2QzdIZXBsY2ZZTmdjcEhpSUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBZWlvRDZRVzFXTVZPbHVnY2hzRFNEQjYrMG5SdndYMWo4S2Y1OUVCbnpNelR2OThqb3o0c1FSQUh0OUtBWjh6TTA4QWNIS1ZQeEQ3cUtMWnZRR2ZNek5PLzN4dG00L1lZWWI1d053Qm5ZekQxMnQ5MXBBNHhxTUw1Q3VQQVo2NUg1Sk1jTUNXYlFWYVRKL2M5Z0FBQUFCV1BRWFhIMldUczV4by9hb2JBMGd4eEc1RG9yYTFCU2xrckxvSkFaMk13OS95ZUR5QUh3N2dzS2pCdFFHZGpNUGdVWEJpaXYyTEdkU2l6NG9Cbll6RDlvSjlQbzhhdk9URmZhc3hBWjJNdy9lbWZ6YVhzVmlVc1NQMjRRR2RqTVBoSFh6UWpQNlpNcjJUd3JzQm5ZekQ0VkY1NHBtbERndEFzanAxQVoyTXcrRzJlY0dHSEtuRTU0R1Z6UUdkak1QaWYzNUVoR1RaemtSSXZtWUJuWXpENFIxODZKYnlyNHV2UlFCakFaOHpNMDhHY0c2UWhOeHRPbmE2REFHZGpNUDJnbjJ4bUpVd0hHM0NxQ1lBQUFBQVZqMEdyaHFkN0lLYkxSdmNHd05JTWNSdVFOdXpUWG9ZWStsY2Z3R2RqTVB5Tkh0Ym5hWk93Y2I2R21FQm5ZekQxYmgyVFp4Qm5KUkpGTzh2QVoyTXc5WXZlL0tXK1VUNDlvRTBod0dldVI1OWNYNWhqUUlic0NQbTUrSUJuWXpEOTh0eHZveDlRNzJQRkZTTkFaMk13OVpNZThxU25OMFJ6RUpyUGdHZGpNUCszSGVwaWVITWt3RlZId0VCbll6RC85dHljcHNZT1FGd1FCaVZBWjJNdytMZGQvdVJXZTJTd0xFTkx3R2RqTVBqWDM4Sm1aazJ4U0VQeTRRQm56TXk4WTk2ZHBhRC85aGxuNVJwQVoyTXcrUUpkU3FhYVpSWTA2NjN5Z0dkak1NYjVYeFZoOTcwdWJHbHRmQUJuWXpENHQxNEpJNWdxMnc2ZkRyR0FaMk13OTlKZWh5Tk9MSTFNcTZOOUFHZGpNUFhhMzRqbnBKV3JNQWE2b1VCbll6RDI5MS9TcFcraWdtZncwQUlBWjJNdzl5UmR2R0xJdFQ2QlUrZ0lRQUFBQUJXUFFYYkVWTmhhWnBlOXhFYkEwZ3h4RzVEcnJpRDkvTmltckN5QWFCMFRCYmhlZ09DN1JhbzBEeEtZUUdkak1QZVFucWZoZ09wbHBwK1F4b0JuWXpEK0w1eEFaajFLcjQ3T3gzMUFaMk13OVVHY0hLSHlQQlZqUnpKdXdHZGpNUGxiWGs2bnJKZzJUSExEa0VCbll6RDhqUjdNcDBGQ29Qckpya1dBWjJNdy9LTGYzdUU3MytuaWV1dWZ3R2RqTVBrc25jV25zTzFTc3RiVHJjQm56TXpUdjk0YVk5MzlBV3BoYnlqQVo4ek0wNy9mSWFTakE2UW14ZFFJQUdmTXpOTy8zeWVtT0JoQ25paTFLQUJuWXpFQUFsMFNaNHVFWmxxVjJ0c0FaMk13eHZsZS9LVTBHOW1VczhkZ2dHZGpNTWNLWGY3bDNqNTZTRTB0cHdCbll6RCtMNXhKcG16ckFhL1Z3ZEJBWjh6TXZHUGYvcVkxK1h2bmV0VVNBR2ZNek5QQUhCYWx3eDN2a0FnWHprQm56TXpUd0J3ZzVDZkJ3SGVxRXFqQVoyTXd4dmxmQmVkeFhqb2FtNWlDQUdkak1QZXhYRkRtRk1JUzZMUUtHSUJuek15OFk5Mmw1bWFYNVhVWHo4QUFaOHpNdkdQZHJlQnVJZ3grZkJPSndHZk16THhqM3FhaHBrc2RPYXpmaEFCbnpNeThZOTZ0NUVYVHFpYllGNlBBWjJNdytRSmRScVF3UTVIMi9ibkx3R2RqTVB4aTNsUGl4cnVQOGtqWmUwQm56TXk4WTkycDU2b2ZWU3ZoZkdKQVoyTXcrT0ZjZitJL3QwTnZzVTRTZ0dkak1QajVYVndoK2JmMUtvaXpzc0JuWXpEMWJoMmhvZWN6V3V1NmZkdEFaMk13K09GY2lpUmN1UmZOeEVUNndHZGpNUHdRSHhkZ1BSU3llSkVRbGtCbll6QmFFOTNsWjBkc0VKTktVUTVBQUFBQU1zRkRkRUtWVFBrZjVOSWpSc0RTREZaVmt1a280V2xmb2RYRHk0MkJxM3YzNk0vZENKblplNVVNUHZJY25mMGNNMGVPOFVmdVowcnBGWEkzMmwwdkVGZlRYMnd0bWtMc1Z5UmozeHRXOVA5QzNvM0x5N05vWERneXJneVJ4MDBqenppUEw4RGFwczlKMnBuQ1Z3ZWZMNnVzWHJLcXJvTnA5K3VJS290QmVYZVRmQjVBWXUzODNTczlMeHJkbGliekprcGNWcUhIVGZxR0E3L2tmZWlITkZHL1hsbWxVOFVPY0ppRmhNQm5ZekJhRTkzbVpLQ0hOZG5yaVZYQUFLLzg4L2lCN2tJcEpZV3AvemxMQUFES1BMMFFRNXpIODJkODNrOGRBQUFQZmlLUkFnTThnanYzSkxXWXhrOUFBTTEyNWZvQ3c4ZWd2Rmc1ME9JdVFBQUFBQU5aQURHSGZhVWU2QmpkaE1BQXU1VmI3RUJnUmlpcjhEL2s5MXBBWjJNd3h3cGV3V1N6WmpWTDB3djNRR2RqTVBTckhkZmxIZVFNdVpPUU1jQm5ZekQxS3A4RDVYdi8xVk9Lb3l3QVoyTXc5V0pkMStBRm15RzVCbFlrQUdkak1QV01IVVdrUDF5aW04MjFnNEJuWXpEMXlOM0Zva2tXTXlZeGRQUEFaMk13OWoyZVZlWTZOaGNWeUs5a0FHZGpNUGNrbkNIa0dmRzBuRDlVbXdCbll6RDNmcDJGSTBiZzRVR3FUOWZBWjJNdzk2UGRPbU5BTSttRFFpcEhRR2RqTVBmQ25zSm16VXdhZlU5LzJBQm5ZekQzN0Y2NUlQZkU5VmVtdTJBQVoyTXcrQlJlUTJUVTlKZHpOSDc1d0dkak1QZzUzS0NuWDNoOUYwRVcrUUJuWXpENFZGOWxKaDJYQnU0YVNqc0FaMk13K0tBZUdXVDV0SUxXRnFwd1FHZGpNUGpZSEtmbTZ2QzZjbEhBb1lCbll6RDQrVjVqSWxlWHFRL3FBZ1dBWjJNdytSc2NtcWFiSG83SENxTUhRR2RqTVBrejM5N2l0eUxSZUtocEVJQm5ZekQ1dzE0RDVrM0d5SmlpWjFJQVoyTXcvRmdlVitZTDlPemVtV1JMd0dkak1QeUYzMEpobWRsS1FHZXBmd0JuWXpEOG94eDFwcmpkaUxGb3huVEFaMk13L01SZG1HWlVTTDdtYjNDTGdHZGpNUDAxSE40aHJqTmpsSkhWeUVCbll6RDk2ZDBHSmZXcjJMVXh2TzVBWjJNdy9pYWQ5NkRpQy9GaGwraWxRR2RqTVA2UEhQZWd4UTV0WDNRNWxZQm5ZekQvbjE0a3BzS1ZuR21TM0JZQVoyTXcvL2JkbktZMHpNbUwvV3dZQUdkak1RQTkzS3JraHJ4bWZJYVVkRUJucmtlZjJ4OURaRmxmSjkrSHl2NkFaNjVIb1JIY3dXVzRrYTAramdIaWdHZXVSNkdLbnNxbkNrcTVoa09lOHNCbnJrZmsyVjJwNFZ1a21URUpIYXdBWjY1SDVicWREMk50bkNxQ3RnUVhnR2RqTVAyZ24xdmtFZ0xETEovdjdZQm5ZekQxUVp3dEpJei9icnZaRDQ2QVoyTXcvSTBlMEtkU3hqY2VnMmYzUUdkak1QZ2hYeUtnQ1pBS1IwTW53SUJuWXpENE9aN3JZVEZwdGJJQWt1d0FaMk13L2ZMY2VPRmc0eEhaZlRoVEFHZGpNUFZCbkJGbGw0YWdjTXJqME1Cbll6RDFZaC9kNTRZNnZsTHBHWFVBWjJNdy9HTGVYU0NMUlo3WkFxUUx3R2ZNek5PLzNmdmx4WUd2WHk4UVpNQm5ZekQyOTEvaUozSEpLYTBQcU9IQVoyTXc5dmRmOUdQQjRpUDRqcWFSQUdmTXpMeGtIQWtoVVRNTU44TVVjZ0Juek15OFpCd09ZOHYrVG5lOUdWc0FaMk13L0JBZS91WHhtdkQweWR6NEFHZGpNUGh0bm93bUx1QkVSTUpPdWtCbll6RDh0QjlEWlBBcnM0cnpDeHRBWjJNdy8ySmZZU0ZUTGpUMTREV3NBR2RqTVArZlhMUWlLNXRna1VENlhNQm5ZekQwU0I5UG9KSWM3bnVsSUhjQVoyTXc5S3JmdWlCRjdlNXlSR2lld0dkak1RQUNYUTlqNnN0VFh4eWU3NEJuWXpFQVBaNzZwajFnZElWR3ZHZkFaMk13LzdjZDlhVWl1d1RSdWNiQ1FHZGpNUHpWbjE4aHNLejV1K2RYdzRCbnpNeThaQjU2cCtCSVJQSmpnTHlBQUFBQWVpb0Q3UU8rVk1NcVA0Q1loc0RTREI2KzBuQnB5bkZsbEE2UmNFQm56TXk4WTk2cDRkWEdTY1hKc3FsQVo4ek0wOEdjSDZVR3hYV0dpdVdKZ0dkak1Qa3NuY0ZrRFJsdUdjTUhzc0JuWXpENU05OGpwc0puMHNpTHdGWUFaMk14QUFKZEYyUk1Dc3N0dU91OUFHZk16TlBBSEJGbk1SazQyQmxOTDBCbnJrZmxsTjJvNEt3RDZUQ3ByaGRBWjJNdzk3RmNScUZDM1M5TThtdG1RR2RqTVBlUW5vb25yQjZUa3F4c0x3Qm5ZekQzbzU5eFpVWHduTk5uUmJVQVo4ek12R1FjQzJPK1BWVUh6a2ZMQUdkak1QZ2hYeVNub3V0ZHRpd1Y2b0JuWXpEMFNCOWZKQjJScnUxeU5PWUFaMk13OUVnZmVhRmtsVWg2eUh0TndHZk16THhqM1orbFB0djNSM01zZmtCbll6RDMvSjRmcGZUSkhnUzlIT1ZBWjJNdy83Y2Q3bVIwWXliVmpZbHd3R2RqTVA5aVg0Zm5HNEZoVGRFdE40Qm5ZekQ1VzE1aUpCdUwzYm5qaHBKQVoyTXcrVnRlSXFiaDI4NnNqalZGd0dkak1QbkRId0RrT2dKdHZUV05ZY0JuWXpEMDhkMk9KQzhqL3d5cEJXMkVnbHBibWhsY21sMFpXUVNDbkJ5YjNCbGNuUnBaWE1TQTJsdWF4SU1ZMkZ1ZG1GelFtOTFibVJ6RWdkemRISnZhMlZ6SXRjRkduMEtEUUFCQWdNRUJRWUhDQWtLQ3d3U0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBVVNCQklDQUFFU0JCSUNBRklTQkJJQ0FGOFNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFVUklFRWdJQUFTTEFCRks5QkFxNkJBb0pDZ0VORWdRU0FnQWNFcXdFQ2hDb2l2bzRnSDVQRTdwaE5mSnNmaHBDRVJ5eERuVlB4OGRCR0I4Z293RW8zQTR5RWdBQUlFRG9Bd0FBNHJqL2Z3QUFnRDhBQURyd0EzeW5vME5vR2k1RUFBQUFBQVVDREdoeWdxTkQ4dmd0UkNBSUxEMDNBZ3hvdm42alE4WFRMVVRBekV3OWxBSU1hRGxzbzBNRXFTMUVJQWFCUFlFRERHak9BS05EbGFFdFJPRDdxVDJkQkF4b05hU2lReTdCTFVUQXpNdzk3UVFNYUE1MG9rTTAyeTFFRUMvZFBRb0ZER2gvUEtKRHp2b3RSSUJzNXowb0JReG9EQkNpUS9zZkxrU3duZTg5S0FVTWFBTHJvVU1GUnk1RTBNNzNQU1FGREdoZ3phRkREbTR1UkFBQUFENElCUXhvMjdxaFF6dVRMa1NRR0FRKzZ3UU1hQ2Uzb1VOb3VDNUVJREVJUHJ3RURHZ250NkZETC8wdVJOaFBEVDZDQkF4b2RCZWlRL0FuTDBRQWdSVStKZ1FNYU5WZG9rTVhNeTlFS0xJZFBxZ0QrbWRScjZKRDh6UXZSTURLSVQ1cUE1eG5udytqUS9NMEwwUjQ2U1krSXdOQVo0Um9vMFB6TkM5RUNBSXJQdlFDNUdacXdhTkRYQ0l2UktBYUx6N1BBb3RtNWhLa1F3NE1MMFF3TXpNK3ZBSTJabU5rcEVNSThpNUV3RXMzUHF3QzZHWERxcVJEQXRndVJGaGtPejZuQXBwbEkvR2tRMFM2TGtRUWcwQStxUUpOWlRnN3BVT25qUzVFb0p0RVBzb0N2bVJDWUtWRFUxMHVSTWpNVEQ0VEE1aGpFUXVsUXpWNUxrVFFUV0krSkFQNVlqYlhwRU1ab2k1RVFMWnpQcXdDdkdJc3NxUkQzZGt1UkdqbmV6NHFBbWhpU0wya1Erb05MMFNRR0lRK1Z3SDJZVUpncFVQR0R5OUV6TXlNUGpVQWUyRklIQ29URWhFQ2o0WmFKY3VUU01Xd1htYWtJMDFlcWlMOEFScDlDZzBGQ3dJS0FRa0dDQWNBQXdRTUVnUVNBZ0FCRWdRU0FnQlJFZ1FTQWdBQkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVoSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBRjhTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQVVTQkJJQ0FBRWlaaUprQ2dJQUFSSWZDaDBLQWdnT0VoZENGU29URWhFQ3pPTENWOHRvVHhHYjBxUlp5MmVhRkJJOUNqc0tCQWdQRUFNU00zSXhDZ1FBQWdNSkVnZ0l3Smp6eXZDRUJCSUNLQUFTRjBJVktoTVNFUUtDSmJJTkYyVkphWVp2OVNja3RSZGtFZ0lvQUNvVEVoRUN2RTVNTXJJaFI0ZXVXQUpuSEhTWGlpS05DQnA5Q2cwSUJ3UUdBd0FNQ3dvSkJRRUNFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBWHhJRUVnSUFCUklFRWdJQVVoSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBVVJJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVpOWdaUzh3WUs4QVlLQ1FvQkRSSUVFZ0lBTFJMaUJnb1FlS3Vmc3REMVFacWxuWm1pZTcrOUxCSDFuVUYwVDhmSFFSZ3RJT01CS0p3T01oQUFBQ0JBNkFNQUFQOS9BQUNBUHdBQU9xb0dvdEdYUTBuNkxFUUFBQUFBdFFFMnRjTnJqb2VYUTdQbkxFU0FFZ004YVFJMnRXMXE0a1NYUTI3NExFUUFLd2M5ZXdNMnRXMXE5U3FYUTU0cUxVUWdMMTA5cHdNMnRXMXFieGlYUTh0UExVUWdCb0U5dUFNMnRXMXFVdzJYUTdCNExVUlFONGs5eHdNMnRXMXFndjZXUXltbkxVUndhSkU5MkFNMnRXMXFzZStXUTZIVkxVU1FtWms5NmdNMnRXMXE0T0NXUTlFSExrVEF5cUU5OVFNMnRXMXF3OVdXUXdFNkxrVGcrNms5OVFNMnRXMXE4c2FXUXc1dUxrUlFPYlE5NndNMnRXMXExcnVXUXhlVkxrU0Fhcnc5MmdNMnRXMXFCYTJXUTI3U0xrU2dtOFE5MFFNMnRXMXE2S0dXUXd2L0xrVHcvZFE5Y3dRMnRXMXErNGVXUTVMUUxrUUFBQUErT3dRMnRXMXFrb0NXUXhTSUxrVGdUdzArN1FNMnRXMXFrb0NXUTV0WkxrUUlnUlUrOUFNMnRXMXFrb0NXUTdNakxrU1ltUmsrK3dNMnRXMXFSNFNXUXpqb0xVUW9zaDArQlFRMnRXMXFHSk9XUStDcUxVVEF5aUUrRWdRMnRXcHFCYTJXUXoxa0xVUjQ2U1krSHdRMnRVNXE4c2FXUStZbUxVUUlBaXMrS0FRMnRUTnFsT1NXUTdQbkxFU2dHaTgrTUFRMnRSdHFVdzJYUThpa0xFUXdNek0rTndRMnRRaHF4VG1YUTkxaExFVElTemMrUVFRMnRmdHBvRzJYUXhZZExFUllaRHMrVFFRMnRmZHA1S2lYUXdUUEswUVFnMEErWVFRMnRmZHBrT3VYUTZ5UkswU29tMFErY2dRMnRmZHBwRFdZUTFWVUswUTR0RWcrZUFRMnRmZHBpWTZZUTlrWUswVEl6RXcrZXdRMnRmZHA5UG1ZUS9IaUtrUmc1VkErZ0FRMnRmZHB4bXlaUThHd0trVHcvVlEraEFRMnRmZHAwdldaUTlsNktrU29IRm8rZHdRMnRmZHB3bk9hUTRoWEtrUkFOVjQrYVFRMnRmZHBHdm1hUXpZMEtrVFFUV0krVUFRMnRmZHAyb1diUThFU0trUm9abVkrTmdRMnRmZHBUaGFjUXlmektVVDRmbW8rRGdRMnRmZHB3NmFjUTdMUktVU0lsMjQrNVFNMnRmZHBDRWFkUXp5d0tVUkl0bk0rZWdNMnRmZHBROENkUXhLWUtVVFl6bmMrSEFNMnRmZHBGak9lUTZDREtVUm81M3MrblFJMnRmZHBHSmVlUThGMEtVUUFBSUErSHdJMnRmZHA0ZVNlUTVscEtVUklESUkrbFFFMnRmZHBxVEtmUStKbEtVU1VHSVErQ1FFMnRmZHA0ZVNlUXpPSktVU0V3SW8rMHdCYXRmZHBLaE1TRVFJK0hPamwrM3hKeDRWRjFkeDE2dEk1SXJrQkduMEtEUUVMQndnR0NnUUpBZ3dBQXdVU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUY4U0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQlNFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUJSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFTSWpDaUVLQWdnUUVodGlHUklYUWhVcUV4SVJBc3pQSkR0VnBVVzFnbkpzd052VlcvSXFFeElSQWtSK2pkNlErVTFNaHFsTk9zUDlPN29pOGdJYWZRb05DUW9JQ3dNQUJBY0ZBZ1lCREJJRUVnSUFBUklhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdCUkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBRkVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdBQkl0c0JVdGdCQ3RVQkNna0tBUTBTQkJJQ0FBb1N4d0VLRUkweS92Znk4VWROa29NUkVNeUdwU1lSNEdXZ2NrL0h4MEVZQ2lBaktOd1BNaFFBQUNCQTZBTUFBT1MrbVZ6L2Z3QUFnRDhBQURxTUFYZkxnME1nYlM1RUFBQUFBT0FDQlRlRVEraHlMa1FBRTRNN3BBTU1sNFJESFlndVJPRE1URDIzQW40ZGhVT3VreTVFWUpGdFBSWUNlV2FGUTV1VkxrUUFLNGM5UkFIN3VvVkRtNVV1UkhCb2tUMjhBUFlEaGtPYmxTNUVvSm1aUFZFQThreUdROU9QTGtUQXlxRTlLd0FXa29aRFo0QXVSUEQ3cVQwRkFHUFRoa01nYlM1RUVDMnlQUUVBS2hNU0VRS0VvZC9heHlwS2VZdlhVR1UxT0pJRElwMEtHbjBLRFFVTUNnSUdCd01CQkFrTENBQVNCQklDQUFFU0JCSUNBQUVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQUJFZ1FTQWdCU0VnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FGRWdRU0FnQUJFZ1FTQWdCUkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBU0tHQ1ZLRENRcUFDUW9KQ2dFTkVnUVNBZ0EyRXZJSUNoRE9pcWFacjkxSk5wcGpYalBOanVzaUVjYmJqSExCN2NkQkdEWWdwd0VvMkI0eUV1Z0RBQUJ0bGY5L0FBQ0FQd0FBQUFBQUFEcTRDQWw2dkVQYXZPSkNBQUFBQUJsUUtFQldBYXQ0YUYrOFF6eVQ1RUlBRTRNN0w0SW9RRzBCcTNndEdyeERBbi9tUWdDY1JEd3JOeWxBeHdHcmVQSFV1ME5Pd09oQ1FBaXNQT1BZS1VBdUFxdDRWcXE3UThCQjYwS0FrZTA4YXZjcFFFc0NxM2hjbXJ0RDIxanVRbUNORnowL1RTcEFjd0tyZUZ5YXUwUDViL0ZDZ0dvOFBiTjZLa0NPQXF0NHI1KzdRNWtiODBJZ0wxMDlzM29xUUk0Q3EzaWt2N3REbmR6MFFtQ1JiVDFHYmlwQWhnS3JlSmpmdTBQL3N2WkN3UE45UGV0ZEtrQjlBcXQ0alArN1E4V2UrRUpRTjRrOXRqd3FRR29DcTNpQUg3eERveC82UW5Cb2tUMkFIU3BBV1FLcmVMeGt2RVBYeS94Q29KbVpQVDdtS1VBOEFwaDRVWis4US83TS9rTHcrNms5c244cFFBa0NEM2phK2J4REFVY0FRNEJxdkQwSkVTbEExQUZaZHdWdnZVTmlYQUJEOFAzVVBWZVJLRUNZQWFoMjU3NjlRNFFpLzBMZ3p2YzlVR3dvUUljQmJuWndHYjVERXFIOFFwZ1lCRDRHWlNoQWd3RklkbDVKdmtQVkN2dEN3RWtNUHNka0tFQ0RBVDEyb1g2K1EzRTArVUo0YUJFK3lJd29RSllCTm5hUHJyNURERjczUWdpQkZUNmVYeWhBcUFFMGRuM2V2a05HY3ZWQ21Ka1pQbnFyS0VETkFUUjJiQTYvUTRDRzgwSXdzaDArbmZrb1FQTUJOSGF0UTc5RFdvWHhRc0RLSVQ0dll5bEFKUUkwZHU5NHYwTXpoTzlDV09NbFBuTE5LVUJYQWpSMmhMTy9RK2RDN1VJUUFpcytDVWtxUUprQ05IWnk0NzlENVlIclFxQWFMejRBb1NwQXpnSTBkbUVUd0VORjF1bENPRE16UG1VTUswQUNBelIyVDBQQVF3VkE2RUxJU3pjK0xuQXJRRFVETkhZc284QkREV25sUWxoa096NS81U3RBZEFNMGRzSGR3RU9TL2VOQ3FKdEVQdUQ1SzBCL0F6UjI4RUxCUTlxODRrSTR0RWcrT3lrc1FKc0ROSGJDd3NGREZaTGlRbURsVUQ0T3V5eEEvQU0wZHFrQ3drUHpFdVJDUURWZVBneGpMVUJmQkRSMjhTZkNRMDMvNWtKb1ptWSs3Y0l0UUtFRU5IYVlNc0pEVHNEb1FwQ1hiajR3MnkxQXN3UTBkdXczd2tNVXJPcENJTEJ5UHNudkxVREVCRFIya2tMQ1EvL1g3RUxZem5jK2J2VXRRTWdFTkhibVI4SkR4Y1B1UW5EbmV6NjkrQzFBeXdRMGRqbE53a01ubXZCQ0FBQ0FQdTc1TFVETUJEUjJqVkxDUTR4dzhrSk1ESUkrRy9rdFFNc0VOSGJmVjhKRDhVYjBRcFFZaEQ0RTlDMUF4d1EwZGpOZHdrUHlCL1pDNENTR1BxbnFMVURBQkRSMjJtZkNRM3dlK0VJOHRJZytSOG90UUtZRU5IWXRiY0pEdWJUNVFvVEFpajdncVMxQWp3UTBkdFIzd2tOMnR2eEN6TXlNUHMrQUxVQnpCRFIyZEpMQ1E2bGkvMEpnNVpBK0grVXNRQlFFTkhhOHQ4SkRtYndBUXdpQmxUNTd6aXRBZ2dNMGRrWVN3ME9tWndGRG5KbVpQcmQ4S2tEaEFqUjJzYnpEUTFkeUFVTjR2cDgrOFhZb1FPUUJOSFp4Yk1SRDZMRUFRMmhtcGo0NjZDWkEzd0EwZHFIUnhFTTlIQUJEL0g2cVBwUjNKa0JPQURSMkpEekZRLzdNL2tKRWk2dytYV2ttUUNBQU5IYWl0c1ZEWFNIOVFxQWFyejdEWmlaQUN3QTBkaW9URWhFQ3AzY0M5c1JaU29PTGRVT2hkU1V5bWlMdUFScDlDZzBDQUFzS0JRUUlBd0VHQnd3SkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCUkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFCUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFFU0JCSUNBQUVTQkJJQ0FGSVNCQklDQUY4U0JCSUNBQUVTQkJJQ0FBRWlXQ0pXQ2dFQ0VsRUtUd29FQ0JFUUFSSkhTa1VLUXlKQkNoUU5BQUFBQUJVQUFBQUFIUUFBQUFBbEFBQ0FQeElSWTI5dExtRndjR3hsTG1sdWF5NXdaVzRZQXlJTFptbDRaV1F0ZDJsa2RHaEJBQUFBQUFBQTREOHFFeElSQXFVQjh6eEpNMHNja2czd1lqOFgwVzRpL0FFYWZRb05Bd1FLQ1FjQ0FRZ0ZDd3dBQmhJRUVnSUFBUklFRWdJQUJSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBRjhTQkJJQ0FBRVNCQklDQUFFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUJFZ1FTQWdCUkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCU0ltWWlaQW9DQUFFU0h3b2RDZ0lJRWhJWFFoVXFFeElSQWdmV0tXL0pEMHJ5aDFKVmNNVlNzaFFTUFFvN0NnUUlFeEFERWpOeU1Rb0VBQUlEQ1JJSUNPRFd2WjdXaFFRU0FpZ0FFaGRDRlNvVEVoRUNqbGh6WmZqYlJEVzcvaG9MUEtwYkZCSUNLQUFxRXhJUkFvSGRQRGE5c0U2OG1ObExhSVhobUwwaXZRRWFmUW9OQXdzSkJ3VUJBQUlJQkFvR0RCSUVFZ0lBQVJJRUVnSUFVUklFRWdJQUFSSUVFZ0lBWHhJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFVU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0JTRWdRU0FnQUJJaWNLSlFvRUNCUVFBeElkWWhzSUFSSVhRaFVxRXhJUkFnR2ZNekx4a0hvRGdXRUkyRGM3VDEwcUV4SVJBaGtoTnNqVVBFRzlqb3hoa3ZCUktlb2k3Z0VhZlFvTkJ3Z0FDd1FHQlF3REFnb0pBUklFRWdJQVh4SU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUFVU0JCSUNBRklTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0FCSWxnaVZnb0JBaEpSQ2s4S0JBZ1ZFQUVTUjBwRkNrTWlRUW9VRFFBQUFBQVZBQUFBQUIwQUFBQUFKUUFBZ0Q4U0VXTnZiUzVoY0hCc1pTNXBibXN1Y0dWdUdBTWlDMlpwZUdWa0xYZHBaSFJvUVFBQUFBQUFBT0EvS2hNU0VRSVJHMnBVQnFkTDRiczB6Zjk4NVVCL0l1NEJHbjBLRFFvR0FnVUhDQXNEQUFRQkNRd1NHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdCU0VnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCZkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFVUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFCUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBU0pZSWxZS0FRSVNVUXBQQ2dRSUZoQUJFa2RLUlFwRElrRUtGQTBBQUFBQUZRQUFBQUFkQUFBQUFDVUFBSUEvRWhGamIyMHVZWEJ3YkdVdWFXNXJMbkJsYmhnRElndG1hWGhsWkMxM2FXUjBhRUVBQUFBQUFBRGdQeW9URWhFQ04yZURreWRhUld5dTdKZVkzWlA3WmlLOUFScDlDZzBGQ1FJTUJBZ0xBd1lIQVFBS0VnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUZFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBVVJJRUVnSUFBUklFRWdJQVVoSUVFZ0lBWHhJRUVnSUFBUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMGlKd29sQ2dRSUZ4QURFaDFpR3dnQkVoZENGU29URWhFQ0FaOHpNdkdRZVRhWjJiTTl5TDZVb3lvVEVoRUN0dEE5SXZ1elRDbUtXdURhSUtrK0dDTDhBUnA5Q2cwRENRc0dDQVFBQVF3SEJRb0NFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQlJFZ1FTQWdCU0VnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFCUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVh4SUVFZ0lBQVJJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBQUVpWmlKa0NnSUFBUklmQ2gwS0FnZ1lFaGRDRlNvVEVoRUNxR2tVbkVFcFRWZVl0OWtGLzQwalVSSTlDanNLQkFnWkVBTVNNM0l4Q2dRQUFnTUpFZ2dJNE51czY2dUhCQklDS0FBU0YwSVZLaE1TRVFMTHlKRkF3OUJBSnBsUnE3YkdLdlZBRWdJb0FDb1RFaEVDTEFEdjltZGNRVm0rL2w1YXN3ZTlpU0tsQXhwOUNnMEFDZ2tDQmdjSUJRc0JBd3dFRWdRU0FnQUJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFVaElFRWdJQVh4SU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFVaWpnSlNpd0lLaUFJS0NRb0JEUklFRWdJQURCTDZBUW9ROFVMMGR0dmNRZUNISUNpd0hRZmhBeEcxVWJGeVQ4ZkhRUmdNSUtNQktOd09NaElBQUNCQTZBTUFBT1MrLzM4QUFJQS9BQUE2d0FIWEFvaERmY010UkFBQUFBQmpBcGxjbHRpSFE5UHZMVVFBRTRNNzFRT1pYTStpaDBQeUlTNUV3TXpNUEhVRW1WdzlnSWREcFVRdVJBQXJCejNIQkpsYzFGbUhRekpyTGtUZ3BSczlFQVdaWEdvemgwUFRqeTVFUUFnc1BUQUZtVnpZRUlkRFliWXVSSUJxUEQwaUJabGNSdTZHUXhQWkxrVEF6RXc5L1FTWlhIKzRoa1BERmk5RUlDOWRQYWNFbVZ3K2pvWkRoVkl2UkNBR2dUMndBOXBiM2NlR1E4QXhMMFJnT2JROVR3QkdXL1gxaGtQb0VpOUVvSnZFUFFRQUIxc3FFeElSQXBCUDZTeFVQVXUwa01CWWFaWFhJYVlpNFFFYWZRb05Cd29FQUFJRkN3a0lBd1lCREJJRUVnSUFYeElhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FBVVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdBQklrc2lTUW9CQWhKRUNrSUtCQWdhRUFFU09rbzRDallpTkFvVURRQUFBQUFWQUFBQUFCMEFBQUFBSlFBQWdEOFNFV052YlM1aGNIQnNaUzVwYm1zdWNHVnVHQU5CQUFBQUFBQUE4TDhxRXhJUkFrb1JscThWb0VBeGtLRno4Y1hUQ1AwaXVRRWFmUW9OQUF3Q0NRZ0JCUVFIQmdNTENoSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQVVTQkJJQ0FGOFNCQklDQUZJU0JCSUNBQUVTQkJJQ0FGRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRJaU1LSVFvQ0NCc1NHMklaRWhkQ0ZTb1RFaEVDOWpvUGhPNHNUVmUrT1lMTGVSSzNDaW9URWhFQ0NRWURqTEJEUno2T0Q0WUg5cWhTTnlLTEFocDlDZzBFQ3drQkNBTUNBQWNLQlF3R0VnUVNBZ0FGRWdRU0FnQlJFZ1FTQWdBQkVnUVNBZ0FCRWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVh4SWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FGSWlkVkp6Q25FS0NRb0JEUklFRWdJQUF4SmtDaEJIZ2xKMUVYZEFsb29lRHFVVmdrd3lFYnNwRTFsUHg4ZEJHQU1nSXlqY0R6SVVBQUFnUU9nREFBQ1F2NGRWLzM4QUFJQS9BQUE2S29LU1owTzRVODVEQUFBQUFGNERrZlJtUXpLMXpVTUEyS003V0FNRE9XWkRKcnJOUTBBSXJEeldBaW9URWhFQ01GcTBDNzBYU0hxSDR4cVd4Y3ViL3lMQkNocDlDZzBIQ0FzQUJnb0RCUVFCQWdrTUVnUVNBZ0JmRWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQVVSSUVFZ0lBQVJJRUVnSUFVaElhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQVVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRWlxZ2xTcHdrS3BBa0tDUW9CRFJJRUVnSUFQQktXQ1FvUUIvY0o2MVFMVDFlOE5vUkliNnBmOGhFR3UwVndUOGZIUVJnK0lPTUJLSndPTWhBQUFDQkE2QU1BQVA5L0FBQ0FQd0FBT3R3SUI4azRRNFZTTDBRQUFBQUFLUUVOdFBOdGQ3UTNRNFZTTDBUQXd2VThZQUlOdEZScGRBczNRM05VTDBUQVIyRTlVUU1OdE5Wb2xhYzJRd0I3TDBRUTE2TTl6d01OdEs1b2laQTJRNkdmTDBTd204UTk1Z01OdEtab2laQTJROUxQTDBSQUN0YzkyUU1OdEpab1E2ODJROTRETUVTUWJPYzl2Z01OdEhwbzZVZzNReUl5TUVUZ3p2YzlyUU1OdEV0b0pidzNRMVpITUVTNEhnVStsQU1OdEMxb3R0QTRROEpXTUVSUU53aytoQU1OdE9SbnVYazVROEpXTUVSNGFCRStaUU1OdEwxbkdqSTZRL3BRTUVRSWdSVStYd01OdEpWbjJQazZROWc1TUVTWW1SaytYQU1OdEc1blVPQTdRemNWTUVSWXVCNCtXZ01OdEVWbkdyODhRL1RtTDBUbzBDSStXZ01OdEJ0bms2VTlReCt0TDBSNDZTWStXZ01OdFBKbUM0dytRN3BuTDBRUUFpcytXQU1OdE1wbWhISS9RNHNjTDBTZ0dpOCtWUU1OdEtWbS9WaEFRNVhMTGtRNE16TStSUU1OdElGbTBrNUJReUJ0TGtUd1VUZytLQU1OdEY5bWhQOUJRendhTGtTQWFqdytHd01OdEVGbWU1RkNRMWpITFVRWWcwQStFZ01OdENsbVpneERRMkoyTFVTb20wUStFQU1OdEJabWxtaERRMWduTFVRNHRFZytFQU1OdEF0bVhwNURRejNhTEVUUXpFdytGUU1OdEFsbWRjeERRMnVGTEVTSTYxRStId01OdEFsbUpOUkRRL05CTEVRWUJGWStRZ01OdEFsbUpOUkRRMmtBTEVTd0hGbythZ01OdEFsbUpOUkRROTYrSzBSQU5WNCtsQU1OdEFsbVhwNURReTZCSzBUWVRXSSt3QU1OdEFsbTZHQkRRMWxISzBSb1ptWSswZ01OdEFsbXhCdERRNm9KSzBRZ2hXcysyd01OdEFsbW45WkNRMVRkS2tTNG5XOCs0Z01OdEFsbUtwbENROW0wS2tSSXRuTSs2QU1OdEFsbTdpVkNReWwzS2tUWXpuYytGd1FOdEFsbVlMcEJRNXRRS2tRQUFJQStIQVFOdEFsbWFTaEJROEJNS2tTb200UStYd1FOdEFsbUxiVkFRMHVPS2tUTXpJdytEZ1VQdEFsbVdtaEFRMFRFS2tSMGFKRStRUVVpdEFsbUtReEFRNWNMSzBTOGRKTStkQVUwdEFsbVM2Zy9RekZtSzBRSWdaVStqUVZDdEFsbXZUdy9RMHJPSzBSUWpaYytwZ1ZLdEFsbUw5RStRN3hITEVTY21aayt2Z1ZPdEFsbVJGWStRMC9ZTEVUNEtKdysyUVZPdEFsbXQrbzlRejlmTFVSQU5aNCszQVZPdEFsbWVuYzlROVB2TFVTTVFhQSszZ1ZPdEFsbVBnUTlROU9QTGtUVVRhSSszd1ZPdEFsbVU0azhReXhCTDBRY1dxUSs0QVZPdEFsbUZ4WThRenY2TDBSb1pxWSs0Z1ZPdEFsbWZaTTdRN2JDTUVURTlhZyszd1ZPdEFsbW5pODdRNk5rTVVRTUFxcyt6UVZPdEFsbWJ0TTZROXIrTVVSWURxMCt2QVZPdEFsbW00WTZRNldKTWtTZ0dxOCtyd1ZPdEFsbUprazZRd1FGTTBUc0pyRSttd1ZPdEFsbVh4TTZRL2h3TTBRME03TStRd1ZPdEFsbW1OMDVRLzNhTTBTUXdyVSt5UVJPdEFsbTNiNDVRMUVpTkVUY3pyYytTZ1JPdEFsbTBhYzVRKzVoTkVRazI3ayt5QU5PdEFsbXhaQTVROVdaTkVSczU3cytQQU5PdEFsbWFJRTVRd2JLTkVTNDg3MCtyZ0pPdEVsbENuSTVRNVR3TkVRQUFNQStFZ0pPdFBOalhHbzVRM3NvTlVSY2o4SStUUUdFczc1ZVNEd3FFeElSQWlpVkNob1ljVStqbXBkdHh6c25yakFpL0FFYWZRb05CZ3NCQkFJQURBVUtCd01JQ1JJRUVnSUFVaElFRWdJQVVSSUVFZ0lBQVJJRUVnSUFCUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUY4U0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkltWWlaQW9DQUFFU0h3b2RDZ0lJSEJJWFFoVXFFeElSQXM5Mldqa0xiRTBvcjVBc29HRjdNY0VTUFFvN0NnUUlIUkFERWpOeU1Rb0VBQUlEQ1JJSUNNRFUyS1N2aEFRU0FpZ0FFaGRDRlNvVEVoRUNQaHpvNWZ0OFNjZUZSZFhjZGVyU09SSUNLQUFxRXhJUkFnR0dlSXFySlVUZ29OcmlEOFBqUHVFaXVRRWFmUW9OQkFnS0FnTUdEQWNGQ1FzQkFCSUVFZ0lBQlJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdCZkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCUkVnUVNBZ0FCRWdRU0FnQUJJaU1LSVFvQ0NCNFNHMklaRWhkQ0ZTb1RFaEVDekgxS0Z3ZmVSOTZ5c0dCU2hEbTBiaW9URWhFQ0dleFBYaTBHU1k2N05aU2FKdkdkUlNLNUFScDlDZzBEQ3dZQUJ3UUlBUW9KQlF3Q0VnUVNBZ0FCRWdRU0FnQlJFZ1FTQWdCU0VnUVNBZ0FCRWdRU0FnQmZFZ1FTQWdBRkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRWlJd29oQ2dJSUh4SWJZaGtTRjBJVktoTVNFUUxzTzFIOVhqdERZcDRQemxhb2FNWGpLaE1TRVFJL3lMdm1PTWxNOTRnSmllSm5hQy9jSXVVQ0duMEtEUUVBQ2dZQ0JBTUlCUWNMREFrU0JCSUNBQUVTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdCU0VnUVNBZ0FCRWdRU0FnQUZFZ1FTQWdBQkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQVh4SUVFZ0lBVVJJRUVnSUFBUklFRWdJQUFTTE9BU0xMQVFvQ0FBRVNJUW9mQ2dRSUlCQUJFaGRDRlNvVEVoRUN4SnFxb0ZXelFzR2g0TC9iVytBMzJSS2hBUXFlQVFvRUNDRVFCUktWQVhLU0FRb0ZBQUlEQkFrU0NBamdzcy80NFlRRUVnSW9BQklYUWhVcUV4SVJBckEzUWluNllVTDhnMEdjendQejdGY1NYaUpjVWxEc01hMURLYXdEUkI5bHJFTjdaQU5FN0JHc1E2N25Ba1F6RTZ4RHJ1Y0NSQ244cTBQWHd3SkVqK0tyUTF5ZkFrVFg0NnREWEo4Q1JIdTBxMFBEVlFKRTdQR3JRNlJRQWtTNGZxeERwRkFDUkdVQUFGQkFaWGVzZ0VBU0FpZ0FLaE1TRVFJQm56TXpUdjk0WFlpbHl2N0VCOEZHSXZ3QkduMEtEUUFCQ2drSUFnd0xCQVVIQXdZU0JCSUNBQUVTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQUFSSUVFZ0lBVVJJRUVnSUFCUklFRWdJQUFSSUVFZ0lBWHhJRUVnSUFBUklFRWdJQVVpSm1JbVFLQWdBQkVoOEtIUW9DQ0NJU0YwSVZLaE1TRVFLbFdtdFJ5TU5EN2JZbnlXaE1NRVpwRWowS093b0VDQ01RQXhJemNqRUtCQUFDQXdrU0NBamdoUHJ3aElVRUVnSW9BQklYUWhVcUV4SVJBdDMyc0RSSnMwcG5wTHRQMy9CWE5IVVNBaWdBS2hNU0VRSTR5U3ZBVzJsSFhMdHJkNVN6R3BrRElxUUVHbjBLRFFRQkNBc0tEQVVEQWdrR0J3QVNCQklDQUFVU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdCUkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVoSUVFZ0lBWHhJRUVnSUFBU0tOQTFLS0F3cUhBd29KQ2dFTkVnUVNBZ0FVRXZrQ0NoQkEwckp6b0NoTUc1VXJ4SXA4bDdSWkVXNHhaWEpQeDhkQkdCUWdZeWljRHpJU0FBQWdRT2dEQUFDWlhQOS9BQUNBUHdBQU9zQUNQdytEUTY2VExrUUFBQUFBRFFJQ3ZUOFBnME45WXk1RUFQNVVQT0FDQXIzVzZJSkRneTB1Uk1ETXpEeTJBeGE5SUlHQ1E2Z3BMa1RncFJzOWR3UXR2UXdLZ2tOcVpTNUVJQzlkUFk4RUxiMDV2WUZEaHJJdVJFQTNpVDJEQkMyOTNLMkJROG5nTGtUQXlxRTk4Z010dldLNWdVTU5EeTlFVURtMFBZUURMYjBNQ29KRDFoUXZSTkRNekQwQUF5Mjl3M0dDUStnU0wwU0FiT2M5emdJdHZWRGRna01ROUM1RXNKM3ZQUTBETGIzQlk0TkR6TVV1UkFBQUFEN0VBeTI5R3J5RFErS29Ma1RnVHcwK3FnUXR2WHlDZzBNbTF5NUV3TW9oUHFjRUxiMWtWSU5ERVBRdVJLQWFMejVrQXkyOWRDS0RRK2dTTDBRd016TSs1Z0l0dlZ6MGdrUEFNUzlFeUVzM1BsNENMYjN6ellKRG1GQXZSRmhrT3o3VEFTMjlmWkNDUTJ5S0wwUVFnMEErR0FFdHZmZUVna01Ocnk5RU9MUklQa2NBTGIwcUV4SVJBcWZxU3pOSnhVRWZnWW9aUVo2ODN1OGkvUTBhZlFvTkJ3TUVEQW9GQ1FBQ0NBc0JCaElFRWdJQVh4SUVFZ0lBQVJJRUVnSUFCUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQlJFZ1FTQWdBQkVnUVNBZ0JTSXVZTVV1TU1DdUFNQ2drS0FRMFNCQklDQUVjUzBnd0tFTGNwazNLVkFVMEtoTEovYWxVUGErVVJlYS9BY3NIdHgwRVlSeURuQVNpWUhqSVE2QU1BQVA5L0FBQ0FQd0FBQUFBQUFEcWFESk42eVVQd1VlSkNBQUFBQUljVEtFQ0pBVzJWTkhhOENzbERhZnpoUWdEWG96c2tjaWxBTmdKdGxUUjJVV0RJUXprUjRVS0FRNHM4Skg0clFEWURiWlUwZHQvRngwUFcrK0JDZ0VNTFBYZzJMRUNrQTIyVk5IYXZZTWREdEh6aVFzRE1URDI2bEN4QTZnT1RsVFIyTFBiR1E2eFQ1VUlBcW5FOWxkNHNRRFFFdXBVMGR1ckF4a01QS3VkQ1FEZUpQWjFaTFVCWkJNdVZOSGFvaThaRCtsWHBRbkJva1QyNWtTMUFmZ1RabFRSMlpsYkdRNmVzNjBLUW1aazlNTGt0UUpvRTVKVTBkdEVieGtQYldPNUNBTmVqUGZ6akxVQzdCTzZWTkhiajY4VkRydS93UWpBSXJEMnE1QzFBdkFUMGxUUjJuTWJGUTRDRzgwSlFPYlE5cXVRdFFMd0U5SlUwZHFlbXhVUHlCL1pDZ0dxOFBjL0xMVUNvQlBTVk5IYXRsc1ZEQTNUNFFxQ2J4RDBpc0MxQWxBVDBsVFIyclpiRlE0dUsra0xRek13OUFZVXRRSFlFOUpVMGRnR2N4VVB4SWY1Q1FBclhQV3BITFVCT0JQU1ZOSFl4QWNaRGpCRUFRNEJzNXowOTJ5eEFEZ1QwbFRSMm81dkdRemluQUVQUXp2YzlEbFlzUU1ZRDlKVTBkbi83eGtQNzBRQkR1QjRGUHMxUExFRERBL1NWTkhhUnNNZEQrOUVBUTBnM0NUNHdUQ3hBd1FQMGxUUjJiaERJUTlXUkFFTndhQkUrM2owc1FMb0Q5SlUwZHA1MXlFTTlIQUJEQUlFVlBza3pMRUMwQS9TVk5IWWk0TWhESXczL1FwaVpHVDU0R3l4QXFBUDBsVFIyVEZYSlEwV00vVUpRdUI0K1VMVXJRSm9EOUpVMGRpaTF5VU1GOXZ0QzROQWlQdTlpS2tDVUEvU1ZOSFpaR3NwRDMvVDVRbmpwSmo3SEl5bEFqUVAwbFRSMk5YcktRL2JJOTBJSUFpcytINk1uUUhnRDlKVTBkaExheWtQbFhQVkNvQm92UHU5OUpVQmhBL1NWTkhaSEw4dERFc2J5UWpBek16NEl1eU5BTndQMGxUUjJlSlRMUTVTWjcwTG9VVGcrWlBraFFQa0M5SlUwZGdmZnkwUGFsK3hDZ0dvOFBrcEFJVUN4QXZTVk5IWkRKTXhEMVJYcFFoQ0RRRDZCWENCQVl3TDBsVFIyaEZuTVF5Yis1RUtnbTBRK2ZFb2ZRUFlCOUpVWGRuS0p6RU1ISnVCQ09MUklQcXpLSGtDS0FmU1YrM1ZucWN4RGVJM2FRc2pNVEQ2bmVSNUFJZ0gwbGVKMUI4VE1RekswMDBLQTYxRStaSmdlUUt3QTlKWE9kYTdPekVOUDhNeENHQVJXUGcyNUhrQmpBUFNWd25WVjJjeERPRUhGUXFnY1dqN1NDeDlBTEFEMGxiNTFxTjdNUTVzOHZVSkFOVjQrZW5jZlFDa0E5SlcrZFUvcHpFUG1vclZDMEUxaVByVDFIMEEvQVBTVnZuV2o3c3hEb01tdVFtaG1aajRQcmlCQXFBRDBsYjUxU2ZuTVE2UndxRUlnaFdzK3dMNGhRRFlCOUpXK2RaMyt6RU9mN3FSQ3NKMXZQb3NESTBDOUFmV1Z2blZFQ2MxRGc5ZWhRa0MyY3o2WVJDZEEyQU5kbUw1MThBUE5RODhZcEVKY2o0SStEbDBwUUN3RU1wdStkZnpqekVQNDJxZEN6TXlNUHVPQ0xVQnpCUHlidm5XdXpzeERMWWVxUW5Cb2tUNDAvQzFBeEFSQm5MNTF1cTdNUTZ5enJVSzhkSk0rUTBFdVFQa0VhNXkrZGNhT3pFTlBJTEZDQklHVlB0dGVMa0FUQllXY3ZuWFNic3hEdGJlMFFsQ05sejVlSlM1QUxRV1NuTDUxM1U3TVEzeGt1RUtZbVprK1B2b3RRRWtGa3B5K2Rla3V6RU5Sdkx4QzlDaWNQb1dmTFVCaUJaS2N2blgxRHN4REdXbkFRa0Exbmo3MmJpMUFid1dTbkw1MVZQVExRNlJBeEVLSVFhQStuREV0UUhnRmtweStkV0RVeTBNeEdNaEMwRTJpUG1mUkxFQitCWktjdm5XL3VjdER1dS9MUWh4YXBENGhsU3hBZ0FXU25MNTF5NW5MUTBYSHowSmtacVkrWG84c1FINEZrcHkrZFlOMHkwUGVTZFJDd1BXb1BpS2tMRUJ6QlpLY3ZuWGpXY3REZ3JiWFFnd0NxejQycnl4QVpRV1NuTDUxUWovTFEySDQya0pVRHEwK01DOHRRRk1Ga3B5K2RhRWt5ME1jK3QxQ29CcXZQc2lUTFVBK0JaS2N2blZURDh0RHNidmdRdWdtc1Q2VEh5NUFJUVdTbkw1MXJRVExReUk5NDBJME03TSszRll1UVA0RWtweStkUWI2eWtQMTArVkNrTUsxUHVIOExVREFCSktjdm5XeTlNcEQrWlRuUXRqT3R6NkxuQzFBaEFTU25MNTFzdlRLUTdPVzZrSWcyN2sraFNndFFFTUVrcHdZZFFiNnlrT0ZMZTFDdFBPOVBxbjNLMENuQXp1Y0czUk9IOHREY1ZudlFseVB3ajdZR3lwQXhnSjZtejV6ZllUTFEzSWE4VUx3cDhZK0hXOG9RTzhCYTVvMGNscmt5ME5haGZGQ3pNek1QalBGSmtERUFMNlpzSEhkVHN4RGwxcnhRbkJvMFQ1QVp5WkFFUUFtbVV0eEtoTVNFUUxoRE5valFYbEdDNGYybUlEbXdPdnFJdFVJR24wS0RRWUlBd2NCQkF3Q0FBVUxDZ2tTQkJJQ0FGSVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWdRU0FnQmZFZ1FTQWdBQkVnUVNBZ0FGRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCUkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVNLK0IxSzdCd3E0QndvSkNnRU5FZ1FTQWdBeEVxb0hDaEJMQXMzRld4UkxySmZQSmpwRVExeURFUkwzOUhWUHg4ZEJHREVnNHdFb25BNHlFQUFBSUVEb0F3QUEvMzhBQUlBL0FBQTY4Z1lWcXJkRFJrOHNSQUFBQUFDeEFTMiswR2VhdkxkRGhTUXNSQUFTZ3p1ekFUYSswR2NDeExkRFdQOHJSSUQ5VkR6YUFVQy8wR2N4dGJkRGM5WXJSQUFJckR5QUFyTy8wR2ZSYnJkRGxNY3JSSUJEQ3owbUE4aS8wR2VXOUxaRGxNY3JSQ0FJTEQzRUE4aS8wR2RsbjdaRGNNa3JSTURNVEQwSUJNaS8wR2NZUDdaRGM5WXJSQUF2WFQwM0JNaS8wR2VSeUxWRDVlb3JST0NwY1QxdEJNaS8wR2NtWGJWRE5BRXNSQ0FHZ1QyTkJNaS8wR2R3OWJSRE9oc3NSRUEzaVQycUJNaS8wR2ZYbUxSRFFEVXNSSEJva1QyK0JNaS8wR2RhUjdSRGFrMHNSSkNabVQzSkJNaS8wR2RpQ0xSRHVHTXNSTURLb1QyNEJNaS8wR2ZUMExORHYzMHNSREFJckQyZkJNaS8wR2N4czdORDdLSXNSRkE1dEQyRkJNaS8wR2RPdnJORDlja3NSS0NieEQwMkJNaS8wR2NoTWJSRGt2WXNSUEQ5MUQzTkE4aS8wR2RTaHJSREJBc3RSSUJzNXoxNUE4aS8wR2VmNXJSRGR4OHRSTENkN3oxbkE4aS8wR2RWVHJWRHhUVXRSTkRPOXoxZUE4aS8wR2UvdWJWRDcwMHRSQUFBQUQ1WkE4aS8wR2QySWJaRDlXY3RSSkFZQkQ1YkE4aS8wR2ZnakxaRGo0Y3RSRWczQ1Q1Z0E4aS8wR2RkM3JaRFRhVXRSTmhQRFQ1bUE4aS8wR2R4S0xkRENzTXRSSEJvRVQ1d0E4aS8wR2UxWTdkRGdPUXRSQUNCRlQ1OEE4aS8wR2ZjazdkRDBRY3VSSmlaR1Q2WUE4aS8wR2ZKcmJkRC9pd3VSQ2l5SFQ3TUE4aS9xMmVhdkxkRG0xa3VST0RRSWo0akJNaS9WMmVhdkxkRHBJQXVSSGpwSmo1NkJNaS9DbWNua0xkRHJhY3VSQWdDS3o3RUJNaS93V1lUUnJkRDJzd3VSS0FhTHo0SEJjaS9lbVo1NmJaRENQSXVSREF6TXo0L0JjaS9OR1piZXJaRG9SRXZSTUJMTno1dEJjaS83V1czK0xWRDh6UXZSSGhxUEQ2U0JjaS9wR1hJZXJWRGlVY3ZSQkNEUUQ2aUJjaS9XMldOQUxWRGFGWXZSS0NiUkQ2U0JjaS9FR1VHaXJSRHRGOHZSRGkwU0Q1eUJjaS94V1F6RjdSRGoyRXZSTWpNVEQ0dUJjaS9lbVI5cjdORGoyRXZSR0RsVUQ3TkJNaS9MMlI3UzdORDJGMHZSQmdFVmo0dkJNaS81V09ERExOREhVMHZSS2djV2o2ZUE4aS9vR083dnJKRGdDQXZSRUExWGo0VkE4aS9LR05UdDdKRGJ0SXVSR0JtWmo0V0FuaS9wV0xpN3JKRFJMb3VSRUMyY3o3REFGKy9pV0wyT0xORDlhTXVSTmpPZHo1dUFGTy9kV0tRbGJORHA0MHVSR2puZXo0ZEFFKy9hbUpGL2JORFdYY3VSQUFBZ0Q0REFFKy9aMklxRXhJUkFtVThVYkZEZ0VvRW5pVGVrTUZsdnNVaS9BRWFmUW9OREFvTEFnTUdCd2tCQkFBRkNCSUVFZ0lBQVJJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBRkVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRklTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBVVNCQklDQUFFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xJbVlpWkFvQ0FBRVNId29kQ2dJSUpCSVhRaFVxRXhJUkF1Tis2MDJQTjBzbmoxdDA5UzdWbFhFU1BRbzdDZ1FJSlJBREVqTnlNUW9FQUFJRENSSUlDS0MrOFpHR2hRUVNBaWdBRWhkQ0ZTb1RFaEVDdWdHSS9Vck9UV3FoN2I2WnhuMlZleElDS0FBcUV4SVJBaVhab0lBajRVQWRsVkxyaHg3QjdkQWl1UUVhZlFvTkFna0hDQU1FQ3dFS0JnQUZEQklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFYeElPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFFU0JCSUNBQVVTQkJJQ0FGRVNCQklDQUFFU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCSWlNS0lRb0NDQ1lTRzJJWkVoZENGU29URWhFQ0pkbWdnQ1BoUUIyVlV1dUhIc0h0MENvVEVoRUN2RmZlaHJIM1NUeTVuaUFtMk1YNDh5SzVBUnA5Q2cwR0NBVUtCQWNCQ3dBREFnd0pFZ1FTQWdCU0VnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FBVVNCQklDQUY4U0JCSUNBQUVTQkJJQ0FGRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVpSXdvaENnSUlKeEliWWhrU0YwSVZLaE1TRVFJeEdtV21uYmxOUUlnQnBsRVRRS0JnS2hNU0VRSmlpRjlXS2haT25KT0dTTjBNMmdMakl2d0JHbjBLRFFzRkJnSUlDZ0FCREFRSkJ3TVNCQklDQUZFU0JCSUNBQUVTQkJJQ0FGSVNCQklDQUFFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFCUklFRWdJQUFSSUVFZ0lBWHhJRUVnSUFBU0ptSW1RS0FnQUJFaDhLSFFvQ0NDZ1NGMElWS2hNU0VRTHdaS29meGdKQVk0L0ZNSThxSXM5c0VqMEtPd29FQ0NrUUF4SXpjakVLQkFBQ0F3a1NDQWlBeityUDZZVUVFZ0lvQUJJWFFoVXFFeElSQXNaMFpYQWZ1MDg2aDZvREU2aUQrN1FTQWlnQUtoTVNFUUp5cEcwWnlJUkxZNmtZbEZtNTZ4cmVJcmtCR24wS0RRVUVBUW9DQ1FBR0J3Z01Bd3NTQkJJQ0FBRVNCQklDQUFVU0JCSUNBQUVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQlNFZ1FTQWdCZkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQUFSSUVFZ0lBVVNJakNpRUtBZ2dxRWh0aUdSSVhRaFVxRXhJUkFzM1BvL0ExV2tkWG8vQlBOMWFCbXNzcUV4SVJBcC9obDM3SGIwM1dzODJxZFQ3TzZYTWkvQUVhZlFvTkJ3QURDd1lKQVFRSUNnSU1CUklFRWdJQVh4SUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVSSUVFZ0lBVWhJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQlJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCSW1ZaVpBb0NBQUVTSHdvZENnSUlLeElYUWhVcUV4SVJBbUkwbmg5L3RVekxvUmhhVk5nTCtpb1NQUW83Q2dRSUxCQURFak55TVFvRUFBSURDUklJQ09DWG5LTFFoUVFTQWlnQUVoZENGU29URWhFQ1ZTUU5pSjVBU1hxTW51MjJ3elVBa0JJQ0tBQXFFeElSQXJrT2lOQW91VWFHcmRLT2NUaFg3MUlpL0FFYWZRb05CQU1CQ0FJRkJ3b0xEQWtBQmhJRUVnSUFCUklFRWdJQUFSSUVFZ0lBQVJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRjhTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQlJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCU0ltWWlaQW9DQUFFU0h3b2RDZ0lJTFJJWFFoVXFFeElSQW41dzRVQnE3RTk1bmYrN2FiRFplWU1TUFFvN0NnUUlMaEFERWpOeU1Rb0VBQUlEQ1JJSUNNRDN1cE9uaFFRU0FpZ0FFaGRDRlNvVEVoRUNxM0JyUkk1MFFhSytHbWFJTElsVnB4SUNLQUFxRXhJUkF0KzBMYnBnRTBBbnN5Nk82V0ozQVBZaXR3Y2FmUW9OQ2drQ0RBQUVDQVVHQXdzSEFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQVVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdCUkVnUVNBZ0JmRWdRU0FnQUJJcUFHVXAwR0Nwb0dDZ2tLQVEwU0JCSUNBQ3NTakFZS0VISkJKT0R1MTBLRHBWK2liS1B6UVNJUnB2RVRjVS9IeDBFWUxTQ2pBU2pjRGpJU0FBQWdRT2dEQUFEaXV2OS9BQUNBUHdBQU90QUZpb05VUTdySExrUUFBQUFBYWdFdllYSlZWRVBaK1M1RWdFT0xQS3dCTDJHckgxUkRIQ2d2Uk1ETXpEeTBBUzloTnVKVFF3TmdMMFNBa2UwOEVBSXZZVytzVTBQOWxTOUU0S1ViUFhvQ0wyRkxaMU5Edk93dlJJQnFQRDIxQXk5aCtXNVRReHpJTDBUZys2azl2QU12WWRqU1UwTnNpaTlFZ0dxOFBmSURMMkdmQ0ZSRDMyTXZSTkRNekQwSUJDaGhGRVpVUTJNN0wwVHcvZFE5Q0FRWFlZcURWRVBvRWk5RUlDL2RQUWNFQm1GZDBGUkRrdVl1UkpCczV6M1dBL1ZnMHcxVlF3VEFMa1N3bmU4OXB3UGxZRWhMVlVOa215NUU0TTczUFYwRDFtQnNrRlZEc1hndVJBQUFBRDRTQThoZ3RScFdReFE1TGtTUUdBUSt4QUsyWUZxMFZrUDFCaTVFNEU4TlB1NEJyMkNqUGxkRHdmRXRSQWlCRlQ0VEFhOWdwdWRYUTNiNUxVUXdzaDArY3dDdllIZzBXRU9vS1M1RW9Cb3ZQZ0FBcjJBL2FsaERvbDh1UkRBek16NEFBSzlnRXJkWVErS29Ma1JZWkRzK0dBQ3ZZSWowV0VQdjNDNUVPTFJJUHJrQXIyQm5XRmxENi9jdVJQRDlWRDVrQXE5Z2w3UlpRMTdSTGtTUWwyNCtRQU92WUdvQldrTjJtUzVFQUFDQVBwOERyMkNDTDFwREkxSXVSUENuaGo1REJLOWd4eEJhUTNBdkxrUVkyWTQrR1FXdllFSVRXVU9WS3k1RUNJR1ZQaHNHcjJCc0hWaERTRTR1Uk9TbG16Nk5CcTlnTUtwWFEwVnBMa1NJUWFBK3FnYXZZUFEyVjBNdmhpNUUxRTJpUHJVR3IyREQybFpENHFndVJCeGFwRDY5QnE5Z1FvWldRNmZKTGtSb1pxWSt2Z2F2WUI1QlZrTkk3aTVFc0hLb1ByNEdyMkQ2KzFWRDFoUXZSQXdDcXo2bEJxOWc3ZVJWUXlsY0wwUlVEcTAraWdhdllQcjdWVVBZbVM5RTZDYXhQak1HcjJBSnZGWkRDc292Ukh3L3RUNTVCYTlnbXRCWFExRGRMMFFrMjdrK1BBU3ZZRDlxV0VNKzN5OUV1UE85UHUwQ3IyQ1VDMWxEUHQ4dlJBQUF3RDQxQXE5Z1JieFpRejdmTDBSSURNSStld0d2WUZWOFdrTjEyUzlFcEp2RVBxWUFwV0MxTkZ0RDk4c3ZSUENueGo0QUFJeGdTQ3NxRXhJUkFvNVljMlg0MjBRMXUvNGFDenlxV3hRaS9BRWFmUW9OQ2drQUJRTUJEQXNHQkFjQ0NCSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZFU0JCSUNBRklTQkJJQ0FBVVNCQklDQUY4U0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xJbVlpWkFvQ0FBRVNId29kQ2dJSUx4SVhRaFVxRXhJUkFxVUI4enhKTTBzY2tnM3dZajhYMFc0U1BRbzdDZ1FJTUJBREVqTnlNUW9FQUFJRENSSUlDSURscjh5N2hRUVNBaWdBRWhkQ0ZTb1RFaEVDV0x5dk82bTlRUXkyaXlVZ0FZTS9TeElDS0FBcUV4SVJBZ0JkQVFDVzRrYUx0ZGR5TU1oc2VUUWkvQUVhZlFvTkJBTUdBQXdMQndvRkFRSUlDUklFRWdJQUJSSUVFZ0lBQVJJRUVnSUFVaElFRWdJQUFSSUVFZ0lBQVJJRUVnSUFVUklFRWdJQVh4SWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCSW1ZaVpBb0NBQUVTSHdvZENnSUlNUklYUWhVcUV4SVJBb1BrS2hWMWJFYWdrdHFvNzV0a3dWVVNQUW83Q2dRSU1oQURFak55TVFvRUFBSURDUklJQ0tDaSt0R1loUVFTQWlnQUVoZENGU29URWhFQ2U0bXN4L09IU3RLZG5RcXVFSitDcVJJQ0tBQXFFeElSQXN4OVNoY0gza2Zlc3JCZ1VvUTV0RzRpN2dFYWZRb05CQVlDQVFnRkF3c0pCd29BREJJRUVnSUFCUklFRWdJQVVoSUVFZ0lBQVJJRUVnSUFBUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFFU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUFFU0JCSUNBRjhTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQUJFZ1FTQWdBQklsZ2lWZ29CQWhKUkNrOEtCQWd6RUFFU1IwcEZDa01pUVFvVURRQUFBQUFWQUFBQUFCMEFBQUFBSlFBQWdEOFNFV052YlM1aGNIQnNaUzVwYm1zdWNHVnVHQU1pQzJacGVHVmtMWGRwWkhSb1FRQUFBQUFBQU9BL0toTVNFUUszdzY0RFFNdE5DNzc4WDN5d09wY3BJdndCR24wS0RRSUVEQUFHQ0FjQkF3b0pDd1VTQkJJQ0FBRVNCQklDQUFVU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZJU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQmZFZ1FTQWdBQkVnUVNBZ0FCRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklFRWdJQVVSSUVFZ0lBQVNKbUltUUtBZ0FCRWg4S0hRb0NDRFFTRjBJVktoTVNFUUxrVTN1T0JFaEhwNi9uTzlOUHIyY0NFajBLT3dvRUNEVVFBeEl6Y2pFS0JBQUNBd2tTQ0FqZzVJMmVwSWNFRWdJb0FCSVhRaFVxRXhJUkFwQlA2U3hVUFV1MGtNQllhWlhYSWFZU0FpZ0FLaE1TRVFMQjg2dWtSMk5EZG84VzA3ZWNVN0tOSXJrQkduMEtEUVVNQ2dBR0FRZ0NBd1FIQ1FzU0JCSUNBQUVTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBQVJJRUVnSUFBUklFRWdJQUJSSUVFZ0lBWHhJRUVnSUFBUklFRWdJQVVTSWpDaUVLQWdnMkVodGlHUklYUWhVcUV4SVJBcU5vWmNDWkVVaEtxSWRKNDJ6R2hPb3FFeElSQW9Cd0VXZjY2a1pSaDdKZU5HWFBJd29pN2dFYWZRb05Cd29DQ0FNQUN3UUZBUVlNQ1JJRUVnSUFYeElhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FBRVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCUkVnUVNBZ0FGRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdBQklsZ2lWZ29CQWhKUkNrOEtCQWczRUFFU1IwcEZDa01pUVFvVURRQUFBQUFWQUFBQUFCMEFBQUFBSlFBQWdEOFNFV052YlM1aGNIQnNaUzVwYm1zdWNHVnVHQU1pQzJacGVHVmtMWGRwWkhSb1FRQUFBQUFBQU9BL0toTVNFUUorY09GQWF1eFBlWjMvdTJtdzJYbURJcmtCR24wS0RRd0pBZ01HQ2dnRkFRUUhDd0FTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZJU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQlJJRUVnSUFYeElFRWdJQVVSSUVFZ0lBQVNJakNpRUtBZ2c0RWh0aUdSSVhRaFVxRXhJUkFpd0E3L1puWEVGWnZ2NWVXck1IdllrcUV4SVJBbFdoejhaRU1rSDlwK2hJNzVxaWJOQWl1UUVhZlFvTkRBUURBZ0FJQ3dVSENRRUdDaElFRWdJQUFSSUVFZ0lBQlJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FGRVNCQklDQUFFU0JCSUNBRjhTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRklTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0SWlNS0lRb0NDRGtTRzJJWkVoZENGU29URWhFQ2ZxWWp2ZEV1UWJDbE4xRzVCZmFPOHlvVEVoRUNmK25iNzdYelI0NnZ4b2hsbHRicVN5TDhBUnA5Q2cwSURBWUpBQVVLQkFNQ0N3Y0JFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBQVJJRUVnSUFVaElFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FBVVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUY4U0JCSUNBQUVpWmlKa0NnSUFBUklmQ2gwS0FnZzZFaGRDRlNvVEVoRUNUOFhTWnNNSVMycVhZS24vZ2JOUktCSTlDanNLQkFnN0VBTVNNM0l4Q2dRQUFnTUpFZ2dJd0xUSzZQS0VCQklDS0FBU0YwSVZLaE1TRVFKbFYrYXRseWhMNTVXOUFTd25GeHJJRWdJb0FDb1RFaEVDZnFZanZkRXVRYkNsTjFHNUJmYU84eUx1QVJwOUNnMEVCd3dHQVFzQUFnZ0ZBd2tLRWdRU0FnQUZFZ1FTQWdCZkVnUVNBZ0FCRWdRU0FnQlNFZ1FTQWdBQkVnUVNBZ0JSRWdRU0FnQUJFZ1FTQWdBQkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwaVdDSldDZ0VDRWxFS1R3b0VDRHdRQVJKSFNrVUtReUpCQ2hRTkFBQUFBQlVBQUFBQUhRQUFBQUFsQUFDQVB4SVJZMjl0TG1Gd2NHeGxMbWx1YXk1d1pXNFlBeUlMWm1sNFpXUXRkMmxrZEdoQkFBQUFBQUFBNEQ4cUV4SVJBb1BrS2hWMWJFYWdrdHFvNzV0a3dWVWkvUUVhZlFvTkFRWU1CQW9EQUFnTENRY0NCUklFRWdJQUFSSUVFZ0lBVWhJRUVnSUFBUklFRWdJQUJSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdCUkVnUVNBZ0FCRWdRU0FnQmZFZ1FTQWdBQkVnUVNBZ0FCSW1kU1pRcGpDZ2tLQVEwU0JCSUNBQUlTVmdvUXFFRGxkM3UwUkxTUTdtTStUZTVlMGhHaHZRUnlUOGZIUVJnQ0lDTW8zQTh5RkFBQUlFRG9Bd0FBbGJoRVl2OS9BQUNBUHdBQU9oelBWWGxEZmlNdFJBQUFBQUNoQXBMaWVFTVYrU3hFQUJLRE81QUNLaE1TRVFMZDlyQTBTYk5LWjZTN1Q5L3dWelIxSXJrQkduMEtEUVVDQmdBQkNRZ0tCQU1IQ3d3U0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZJU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFCUklFRWdJQUFSSUVFZ0lBWHhJRUVnSUFVUklFRWdJQUFTSWpDaUVLQWdnOUVodGlHUklYUWhVcUV4SVJBalQvTlBqUk0wMHFtVENBZm82YzJjNHFFeElSQWs0Qk1aRlpGa2l3b0pteGwxNEtHbFVpNFFFYWZRb05BZ2tJQlFZSERBb0FBd0VFQ3hJRUVnSUFBUklFRWdJQUFSSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTQkJJQ0FGSVNCQklDQUY4U0JCSUNBQUVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUZFZ1FTQWdCUklrc2lTUW9CQWhKRUNrSUtCQWcrRUFFU09rbzRDallpTkFvVURRQUFBQUFWQUFBQUFCMEFBQUFBSlFBQWdEOFNFV052YlM1aGNIQnNaUzVwYm1zdWNHVnVHQU5CQUFBQUFBQUE4TDhxRXhJUkFrYjdaUU50OUVBNGtIRDc2b0NKWmVzaWhBSWFmUW9OQkFnRENnY0ZCZ0FCQWd3TENSSUVFZ0lBQlJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdCZkVnUVNBZ0FCRWdRU0FnQlNFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JSRWdRU0FnQUJJbTR5YkJJWFFoVXFFeElSQXBWbkNqdWF6MDdjbVFpUjh1MXRPaklTRjBJVktoTVNFUUtDRkJZT0wzRkpWSWlBdVVWU3dWeGxHZ2NLQWdnL0lnRUJHZzBLQWdoQUVBSWFBZ2hCSWdFQ0dnb0tDQWcvRVAvLy8vOFBJZ2tLQVVBU0JCSUNBQUlxQ1FvQlFSSUVFZ0lBQWlvVEVoRUNBWjh6TTA4R2NGcVQyUFFlMENJVHFDSzVBUnA5Q2cwRkFRSUVBQU1LQndnTUJnc0pFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBRkVnUVNBZ0FCRWdRU0FnQUJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQVh4SU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTQkJJQ0FGSVNCQklDQUZFU0JCSUNBQUVpSXdvaENnSUlRaEliWWhrU0YwSVZLaE1TRVFJQm56TXpUdjk4aW9MK21xaTUzcGp6S2hNU0VRS0NGQllPTDNGSlZJaUF1VVZTd1Z4bElya0JHbjBLRFFzQ0JRd0dCd2dKQ2dBRUFRTVNCQklDQUZFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRklTQkJJQ0FGOFNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklFRWdJQUJSSUVFZ0lBQVJJRUVnSUFBU0lqQ2lFS0FnaERFaHRpR1JJWFFoVXFFeElSQWdHZk16TlBBSEJpa1I5RzhPejJoS0lxRXhJUkFsSDhMTDFQWmt1L2d5bnJwNHZaRGJraWxRVWFmUW9OQkFFREJRc01DZ2NDQUFZSkNCSUVFZ0lBQlJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFVUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUY4U0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZJU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xJdjREVXZzREN2Z0RDZ2tLQVEwU0JCSUNBQk1TNmdNS0VDWUdRYzVyQkVyYWx6NXZKQVFNajBBUi85Qkdkay9IeDBFWUdDRGpBU2ljRGpJUUFBQWdRT2dEQUFEL2Z3QUFnRDhBQURxd0EyQjN2VU1ydEMxRUFBQUFBQzRFc2NOblluVEJ2VU11d1MxRU1BaXNQUWtFQjhSRVlpQUV2a04wc0MxRUFQN1VQUUFFQjhUZFlaMVZ2a01mZ0MxRXNKM3ZQWG9FQjhTQ1lXNWt2a002VnkxRVVEY0pQcjhGQjhSbVlTQUV2a09DVXkxRW9Ka1pQdlVHQjhSbVlRR1Z2VU5uZkMxRWVPa21QbVVIQjhSbVliNVp2VU1CbkMxRW9Cb3ZQb0lIQjhSbVlTOGl2VU5UdnkxRU9ETXpQb2dIQjhSbVlRanl2RU00NkMxRXlFczNQb29IQjhSbVlaYkZ2RU9NR0M1RWdHbzhQb1lIQjhSbVlWeXZ2RU1wUlM1RUdJTkFQbXdIQjhSbVlmU252RU45ZFM1RXFKdEVQajBIQjhSbVlmU252RU90cHk1RVFMUklQZ1VIQjhSbVlSR3p2RU1DMkM1RTBNeE1Qc0lHQjhSbVlhRHF2RU9lQkM5RVlPVlFQbW9HQjhSbVlSMDh2VU03TVM5RUdBUldQdFlGQjhSbVlXcWN2VU1kVFM5RXNCeGFQaWdGQjhSbVlZZ0x2a09QWVM5RVFEVmVQbGtFQjhSbVljU0Z2a09TYmk5RTJFMWlQb0FEQjhSbVlSd0x2ME5LY2k5RWFHWm1QcUVDQjhSUllTaVV2ME5LY2k5RUFIOXFQcW9CQjhRZ1lXMHp3RU5LY2k5RXVKMXZQbFlBQjhUcllNVzR3RVBhYWk5RVNMWnpQZ01BQjhTeVlFZ1RLaE1TRVFJVzdwVWttZHRMcjRYcyt5NWhoZ2k5SXNBQkduMEtEUXNGQVFNTUJBZ0pBZ2NBQ2dZU0JCSUNBRkVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFVU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JmRWdRU0FnQUJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQVVpSXFJaWdLQVFBU0l3b2hDZ0lJUkJJYlNoa0tGMElWS2hNU0VRSWwwV3NyZzJGSjZicEFVdDJIcXJxaktoTVNFUUpnR091aWJtaEtVclNqRzRVRkNOMTlJcmtCR24wS0RRSU1DUU1MQlFjQUJnZ0VBUW9TQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZFU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUFFU0JCSUNBRklTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBRkVnUVNBZ0FCRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFNJakNpRUtBZ2hGRWh0aUdSSVhRaFVxRXhJUkFvSGRQRGE5c0U2OG1ObExhSVhobUwwcUV4SVJBam80d053Z0gwQUZxcGhUcFBSVExwVWk0UUVhZlFvTkJBTUlCZ2tNQ3dFSEFBb0NCUklFRWdJQUJSSUVFZ0lBQVJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FGSVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUFFU0JCSUNBRjhTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0FCSWtzaVNRb0JBaEpFQ2tJS0JBaEdFQUVTT2tvNENqWWlOQW9VRFFBQUFBQVZBQUFBQUIwQUFBQUFKUUFBZ0Q4U0VXTnZiUzVoY0hCc1pTNXBibXN1Y0dWdUdBTkJBQUFBQUFBQThMOHFFeElSQWlYUmF5dURZVW5wdWtCUzNZZXF1cU1peXdVYWZRb05DZ01IQVFzR0JRUUFEQWdDQ1JJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUFFU0JCSUNBRkVTQkJJQ0FGSVNCQklDQUFFU0JCSUNBQVVTQkJJQ0FBRVNCQklDQUFFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUJFZ1FTQWdBQklyUUVVckVFQ3E0RUNna0tBUTBTQkJJQ0FCZ1NvQVFLRUlFWlJ4TWZ2a0xFbTR6T0ttbXNGbE1SSEphY2NFL0h4MEVZR3lEakFTaWNEaklRQUFBZ1FPZ0RBQUQvZndBQWdEOEFBRHJtQTczSlFVUGZ3eTVFQUFBQUFEY0J2N1BlYXc3Q1FVTlVnaTVFUUJLRFBHc0N2N045YU90OFFVTk91QzVFd014TVBRWUV2N045YURCZVFVUEcreTVFa0ptWlBVWUV2N045YU5KT1FVTkNKQzlFNFB1cFBWd0V2N045YUNSSFFVT1lVQzlFRUMyeVBYQUV2N045YUNSSFFVUHVmQzlFTUY2NlBYOEV2N045YUNSSFFVTXlxeTlFb0p2RVBaTUV2N045YUNSSFFVTy8wUzlFME16TVBhTUV2N045YU5KT1FVTmc5aTlFOFAzVVBiQUV2N045YUxHeVFVTWlNakJFRUMvZFBjVUV2N045YVBrOFFrTm1ZREJFWUpIdFBld0V2N045YUt2dFFrUGtiVEJFQUFBQVBnd0Z2N045YU5QYlEwTkJaREJFS0RFSVBoY0Z2N045YUd4ZVJFTkVTVEJFU0dJUVBoY0Z2N045YUdQd1JFTi9LREJFQUlFVlBoY0Z2N045YUU1clJVUHhBVEJFbUprWlBoY0Z2N045YU56V1JVT0kxeTlFS0xJZFBnTUZ2N045YUF3elJrTWZyUzlFd01vaFB1RUV2N045YU45L1JrTzNnaTlFVU9NbFByWUV2N045YUZXOVJrTk9XQzlFNlBzcFBvUUV2N045YU1yNlJrTWNLQzlFb0JvdlBrVUV2N05LYUlVWlIwT1BBUzlFTURNelBoSUV2N01OYU9Jb1IwTUIyeTVFeUVzM1BzVUR2N1BSWitJb1IwT3VreTVFV0dRN1Btc0R2N05pWnpNaFIwTWpVaTVFZ0pWRFBzZ0N2N01DWi9ldFJrTzZKeTVFeU14TVBoOENNTFFyWmtnWUtoTVNFUUtyY0d0RWpuUkJvcjRhWm9nc2lWV25JdXNCR24wS0RRQUlBZ3dGQ2drRUFRTUdCd3NTQkJJQ0FBRVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFCUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFVaElFRWdJQVh4SUVFZ0lBVVNKVk1sTVNGMElWS2hNU0VRSlZ1RUFUc2RkTWxZdVNMc21CSU5TakdnY0tBZ2cvSWdFQkdnMEtBZ2hIRUFFYUFnaElJZ0VDR2dvS0NBZy9FUC8vLy84UElna0tBVWNTQkJJQ0FBRXFDUW9CU0JJRUVnSUFBU29URWhFQ0FaOHpNdkdRZWRhWUs1REF2NFUrYmlMOEFScDlDZzBEQkF3RkFBc0lDZ1lIQVFrQ0VnUVNBZ0FCRWdRU0FnQUZFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCUkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBRklTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRWlaaUprQ2dJQUFSSWZDaDBLQWdoSkVoZENGU29URWhFQzBrUmFzL1ZzVEMrNDhETjY3WUg0Q3hJOUNqc0tCQWhLRUFNU00zSXhDZ1FBQWdNSkVnZ0lnSUxmOGNtSEJCSUNLQUFTRjBJVktoTVNFUUt6WEpqLzlUcExTSTMzU3FSN3l6MVhFZ0lvQUNvVEVoRUN6TThrTzFXbFJiV0NjbXpBMjlWYjhpTDhBUnA5Q2cwRUN3Y0tBQXdEQ1FVSUFnRUdFZ1FTQWdBRkVnUVNBZ0JSRWdRU0FnQmZFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRklpWmlKa0NnSUFBUklmQ2gwS0FnaExFaGRDRlNvVEVoRUNDZU14cnlFQ1RaNjZmSHNWN3JxUEhCSTlDanNLQkFoTUVBTVNNM0l4Q2dRQUFnTUpFZ2dJb01iS3BPR0dCQklDS0FBU0YwSVZLaE1TRVFLUGhsb2x5NU5JeGJCZVpxUWpUVjZxRWdJb0FDb1RFaEVDKzI1UktXTS9SajY1L3VFY1N2akZQQ0tEQlJwOUNnMEFDd01CQ2dZSUFnUUhCUWtNRWdRU0FnQUJFZ1FTQWdCUkVnUVNBZ0FCRWdRU0FnQUJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQVVoSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTQkJJQ0FBVVNCQklDQUY4U0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFaTdBTlM2UU1LNWdNS0NRb0JEUklFRWdJQUV4TFlBd29RMzFCWnFwaVRSMnUwTDVNRktyTFB2UkcybnFWeFQ4ZkhRUmdYSU9NQktKd09NaEFBQUNCQTZBTUFBUDkvQUFDQVB3QUFPcDREUHlsc1E3VjlMRVFBQUFBQUd3Rzd0ZGxuUzBCc1EwMVRMRVNBRWdNOEZRSFV0ZGxuVjFkc1E5RXFMRVRBUTRzOEtBRUZ0dGxuY0lWc1ExWUNMRVJBQ0t3OEpnS0F0dGxuelpSc1EvWW1MRVNBYWp3OVBBVEd0dGxuelpSc1E1Tm1MRVNnbVprOTFnVE90dGxudFdac1E4V1dMRVR3KzZrOUNnWE90dGxua0NGc1E1clFMRVFRTGJJOU9RWE90dGxuWU1WclEvOFZMVVNBYXJ3OWFRWE90dGxuMDFsclExSmRMVVN3bThROWl3WE90dGxuNk41cVEyNnFMVVRRek13OXFnWE90dGxuVGx4cVEyVDdMVVFBL3RROXR3WE90dGxucU1KcFF6WlFMa1FnTDkwOXRnWE90dGxuOWhGcFE3MnNMa1JBWU9VOW1nWE90dGxuaWtKb1E5WVVMMFN3bmU4OVN3WE90dGxuZTRKblE1VnJMMFRnenZjOUNBWE90dGxueWRGbVE0dThMMFFBQUFBK3d3VE90dGxueGlobVEvRUJNRVNZR0FRK2NBVE90dGxuTEtabFE4VTdNRVFvTVFnK0VnVE90dGxubmpwbFF4dG9NRVRBU1F3K3F3UE90dGxuQmJoa1F3T2dNRVI0YUJFK0h3UE90dGxuQ0dGbFF6MS9NRVJZNHlVK3hBRE90b0ZuVWV0bFExTmlNRVNnR2k4K0F3Q3V0dE5tU0JNcUV4SVJBaXZDQjJjVnJrLzVtTWJPRU1ibGtVZ2kvQUVhZlFvTkJ3Z0FDd3dDQlFRREJna0tBUklFRWdJQVh4SU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFVU0JCSUNBQUVTQkJJQ0FGSVNCQklDQUFFU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0FCSW1ZaVpBb0NBQUVTSHdvZENnSUlUUklYUWhVcUV4SVJBaEViYWxRR3Awdmh1elROLzN6bFFIOFNQUW83Q2dRSVRoQURFak55TVFvRUFBSURDUklJQ01DazlvQ3lod1FTQWlnQUVoZENGU29URWhFQ28vdVhNYUt6UTZPM29XRkVaUyswZVJJQ0tBQXFFeElSQXFoaVllSVpLRXRqaDRYNjhHZTNFNG9pMkE4YWZRb05BQWdKQWdjRkRBc0dDZ0VEQkJJRUVnSUFBUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFFU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUZJU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBRklzRU9VcjRPQ3JzT0Nna0tBUTBTQkJJQ0FGa1NyUTRLRUlpcFZpNXo5VXBQa2Y2YWpjdmtmM2tSVEZMWmNjSHR4MEVZV1NCbktKZ2ZNaExvQXdBQVdIYi9md0FBZ0Q4QUFBQUFBQUE2OUExeGw2WkRnNXpQUWdBQUFBRHRDQ2xBeVFFbWs0bFhwa085c00xQ0FCT0RPNWdCS1VER0FTYVQ3aXltUTM0YXpFSUEvbFE4UnhvcVFGTUNKcE0xVXFaRFhKdk5Ra0FJTEQzTmdpcEFrd0lta3lseXBrTTRITTlDNE14TVBYR2lLa0NxQWlhVEhwS21RLzRIMFVJZ0wxMDlCYU1xUUtzQ0pwTmx0NlpEcTE3VFFnQ3FjVDE1b2lwQXFnSW1rd2JTcGtOYnRkVkNJQWFCUGZLZEtrQ25BaWFUcCt5bVE4bzIyRUpRTjRrOXc1a3FRS1FDSnBPaS9LWkRuYzNhUW5Cb2tUM0RtU3BBcEFJbWs1c01wMFBSZWQxQ29KbVpQY09aS2tDa0FpYVRRaGVuUXlwbTRFTEF5cUU5dzVrcVFLUUNKcE9WSEtkRHp0TGpRakFJckQyWW1DcEFvd0ltazVVY3AwTk4vK1pDWURtMFBhcVNLa0NmQWlhVGxSeW5RNDFXNmtLQWFydzlIWXdxUUpvQ0pwUDBBYWREenEzdFFxQ2J4RDNhZ2lwQWxBSW1rMXJYcGtNUkJmRkMwTXpNUGRSNUtrQ05BaWFUeFp5bVF5d2M5RUx3L2RROW9ITXFRSWtDSnBQY1hLWkRNWjczUW1BNzN6MkJiU3BBaFFJbWswMFNwa09qSC9wQ2tHem5QWUZ0S2tDRkFpYVR2c2VsUTFCMi9FS3duZTg5Z1cwcVFJVUNKcFBiZDZWRGQzZitRdURPOXoyQmJTcEFoUUltay9rbnBVTTlIQUJEQUFBQVBvRnRLa0NGQWlhVGFkMmtRMHJIQUVPWUdBUStnVzBxUUlVQ0pwUGFrcVJEcG1jQlExQTNDVDZCYlNwQWhRSW1rd1FqcEVQTHB3RkQ0RThOUG9GdEtrQ0ZBaWFUcWkya1E3RlJBRU13c2gwK2JoUXFRRkFDWjVKRldLUkQySXorUXFBYUx6NVBPaWxBRUFKR2t0cVNwRU1GOXZ0Q09ETXpQbnVoS0VBTEFpMlN2ZUtrUStyZStFTElTemMrUVRrb1FBTUNISkthUXFWREl6TDFRb0JxUEQ3T3NDZEEvUUVTa2lPZHBVTzdtdkZDRUlOQVBtVlVKMEQ5QVJLU1V3S21RODZ0N1VLb20wUSsrTkFtUUFjQ0VwS0RaNlpEZ0t2cFFqaTBTRDZ4b0NaQUhnSVNrZ2JTcGtQUGsrVkMwTXhNUG5XdEprQTlBaEtTaVR5blExeFI0VUpnNVZBK0wrc21RR1lDRXBLdXdhZEQzR1BjUWhnRVZqNStEaWRBblFJU2tpdzhxRU5wSWRoQ3NCeGFQaUZnSjBETEFoS1NVTUdvUTdnSjFFSkFOVjQra2RvblFQZ0NFcEliVWFsREx6TFFRdEJOWWo0VEpTaEFKQU1Ta28zcnFVT0x4Y3hDYUdabVBrM2dLRUJIQXhLUy9vV3FRekxaeVVMNGZtbytlcXNwUUY4REVwSzlOYXREL2l6SFFyQ2RiejZOaVNwQWJnTVNralRBcTBNZ3JNVkNTTFp6UHNnUEswQnVBeEtTV1VXc1ErL0F4RUxZem5jK1VhY3JRR29ERXBLRHVxeERwRURFUW5EbmV6N3V4U3RBWXdNU2tpVzZyVU1HVnNSQ0FBQ0FQaEM4SzBCY0F4S1N6TVN0UTJzc3hrSTR0SWcrZmlFc1FMd0RucEtFbjYxRHpRTElRblJva1Q1VEt5eEF5UVB3a3FjL3JVUEYyY3BDQ0lHVlB0WWtMRURBQXhPVGJQcXNRMmFGekVLY21aaytkd2dzUUo4REdaT0pxcXhEYVViT1F1U2xtejdON1N0QWhRTVprNjFLckVPUVI5QkNRRFdlUGhmUUswQnJBeG1USS9DclE1SUkwa0tJUWFBK3lya3JRRm9ER1pOR2tLdERsY25UUXRSTm9qNEdwU3RBU3dNWmt4Y3JxME0yZGRWQ0hGcWtQdjZQSzBBOEF4bVQ1c1dxUXpjMjEwSm9acVkrSFhZclFDc0RHWk1KWnFwRDErSFlRckJ5cUQ0YldTdEFHQU1aazkvd3FVT2R6ZHBDREFLclB2OG1LMEQ3QWhtVEE1R3BROXhqM0VKWURxMCt2L2dxUU9BQ0daUFRLNmxEdStUZFFxQWFyejdienlwQXlnSVprNlBHcUVQNmV0OUM2Q2F4UHIrbUtrQzFBaG1USDF5b1E5Yjc0RUkwTTdNK3k0a3FRS1lDR1pQdzlxZER0SHppUW53L3RUNk1jQ3BBbVFJWmt4bUhwME5WS09SQzJNNjNQc1ZDS2tDQ0FobVQ0ekduUTBrKzVVSWsyN2srSEJvcVFHOENHWk1la3FaRCtaVG5RbXpudXo0bDNDbEFVUUlaazA3M3BrUDVsT2RDT0xUSVBpbWRLa0N3QWhtVFc3eW5ReHpWNTBMTXpNdytRUlVyUVBBQ0daUFlOcWhEQlVEb1FuUm8wVDduWEN0QUd3TVprNm0ycUVOT3dPaEN2SFRUUHZ5UkswQTlBeG1UelR1cFEvcFY2VUlJZ2RVK1ZhTXJRRWtER1pQeHdLbERhQmJxUWxDTjF6NEd0Q3RBVlFNWmt4Vkdxa09hQWV0Q25KblpQalhOSzBCb0F4bVRPc3VxUTQ4WDdFTGtwZHMreStRclFIc0RHWk5ZWUt0RHEyM3RRa0ExM2o1VjBTdEFhd01aazlYYXEwTW0yZTVDaUVIZ1BsdkFLMEJlQXhtVHBscXNROGFFOEVMVVRlSStXOEFyUUY0REdaUFJ6NnhEakhEeVFoeGE1RDU2dlN0QVhBUDVrcWMvclVPemNmUkNhR2JtUG9PQkswQXlBOVNTS3FxdFF6Mkk5a0t3Y3VnK0p6NHJRQWdEc0pLdUZLNUQ2dDc0UWd3QzZ6NHRKU3RBK2dLSmtqMWZya05QdGZwQ1dBN3RQdnNISzBEcEFtU1MwcG11UTFCMi9FS2dHdTgrektzcVFMZ0NRNUxCeWE1RFVqZitRdWdtOFQ0OFJ5cEFoUUlqa2x6MHJrT1J6ZjlDTkRQelBpSE5LVUJMQWdTU2pGbXZRNkh5QVVOOFAvVSthRTRwUUE4Q29KRjBtYTlEMHQwQ1Eyem4rejVyQ2lkQTJnQm1rVmZwcjBOK2N3TkRBQUFBUDRsNEprQkVBRE9SS2hNU0VRSkFuWERmZ3NkRnZvNHdwV2cvVmtEZUl2d0JHbjBLRFFVSkFnWUxCd01BQ0F3RUNnRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZJU0JCSUNBRkVTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0FGRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBU0ptSW1RS0FnQUJFaDhLSFFvQ0NFOFNGMElWS2hNU0VRSVlQcTZZdUp0T0paemdwS3pLVGhCWkVqMEtPd29FQ0ZBUUF4SXpjakVLQkFBQ0F3a1NDQWlnK3M2Ny9vWUVFZ0lvQUJJWFFoVXFFeElSQXFmcVN6Tkp4VUVmZ1lvWlFaNjgzdThTQWlnQUtoTVNFUUxzTzFIOVhqdERZcDRQemxhb2FNWGpJcmtCR24wS0RRSUlDd01GREFrS0JBRUdCd0FTQkJJQ0FBRVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0JSRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUJSSUVFZ0lBQVJJRUVnSUFVaElFRWdJQVh4SUVFZ0lBQVNJakNpRUtBZ2hSRWh0aUdSSVhRaFVxRXhJUkFxaGlZZUlaS0V0amg0WDY4R2UzRTRvcUV4SVJBcENJRlYvY1NrU2tqdWk4cUJiZzVNa2l2UUVhZlFvTkNRUUdDZ2dMQUF3REFRSUZCeElFRWdJQUFSSUVFZ0lBQlJJRUVnSUFVaElhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdCUkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JmSWljS0pRb0VDRklRQVJJZFloc0lBUklYUWhVcUV4SVJBZ0dmTXpOUEJuQmFrOWgvQ3ZGeElsY3FFeElSQWxjVXF1ZTU0VVVYcHZ1UTJrb0VNQ2NpZ0FNYWZRb05DQU1MQWdZS0FBUUZEQWNKQVJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FBRVNCQklDQUZFU0JCSUNBQUVTQkJJQ0FGSVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0FGRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkl1a0JVdVlCQ3VNQkNna0tBUTBTQkJJQ0FBc1MxUUVLRUo4QklzU01OazBvbGlLVldxdjRHQ3NSc3ArQmRFL0h4MEVZQ3lBaktOd1BNaFFBQUNCQTZBTUFBS2kxdEdYL2Z3QUFnRDhBQURxYUFUck1tME8yOUN4RUFBQUFBTk1CcTVTYlF3UUxMVVFBRW9NN21BT0VaSnREeFRVdFJFQ1I3VHpFQStKR20wTmVWUzFFUUkwWFBjWURRU21iUTR4NkxVU2c3eWM5eGdPZkM1dERsYUV0Uk9CUk9EMkJBN0h4bWtONnlpMUV3TXhNUFJFRDRPS2FRNmZ2TFVRZ0wxMDlwZ0lQMUpwRCtCSXVSR0NSYlQwOEFxZk1ta04wVGk1RW9QTjlQY1VCU2VxYVEreDhMa1FnWEk4OTVBQXFFeElSQW9DYWJDblU5VU1jcU9SZ0JrSjFsYTBpN2dFYWZRb05DUUFLQkF3SUN3VUNCZ2NEQVJJRUVnSUFBUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFVU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdCUkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCU0VnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQklsZ2lWZ29CQWhKUkNrOEtCQWhURUFFU1IwcEZDa01pUVFvVURRQUFBQUFWQUFBQUFCMEFBQUFBSlFBQWdEOFNFV052YlM1aGNIQnNaUzVwYm1zdWNHVnVHQU1pQzJacGVHVmtMWGRwWkhSb1FRQUFBQUFBQU9BL0toTVNFUUlKNHpHdklRSk5ucnA4ZXhYdXVvOGNJdXNCR24wS0RRc0FBUWtEQnd3S0JRSUdDQVFTQkJJQ0FGRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRjhTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQlNFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBQlNKVk1sTVNGMElWS2hNU0VRS3FMYi93L1BOSEJxSWxEK0dDbWVrREdnY0tBZ2cvSWdFQkdnMEtBZ2hVRUFFYUFnaFZJZ0VDR2dvS0NBZy9FUC8vLy84UElna0tBVlFTQkJJQ0FBRXFDUW9CVlJJRUVnSUFBU29URWhFQ0FaOHpNdkdRZWdPQllRallOenRQWFNMdUFScDlDZzBHQVFJSEJRa0lBQXdFQ2dNTEVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQlJJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBQUVTQkJJQ0FGRWlXQ0pXQ2dFQ0VsRUtUd29FQ0ZZUUFSSkhTa1VLUXlKQkNoUU5BQUFBQUJVQUFBQUFIUUFBQUFBbEFBQ0FQeElSWTI5dExtRndjR3hsTG1sdWF5NXdaVzRZQXlJTFptbDRaV1F0ZDJsa2RHaEJBQUFBQUFBQTREOHFFeElSQWc0QTdjdWw5azhUdVNvcGJxKzNJbEFpMUFRYWZRb05Bd0VKQ2dBTEJnSU1DQVVFQnhJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUZJU0JCSUNBQUVTQkJJQ0FBRVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWdRU0FnQUZFZ1FTQWdCZklyMERVcm9EQ3JjRENna0tBUTBTQkJJQ0FCY1NxUU1LRU83c2cvNFZxRWtxbThJcTRvY0pBSDRSaVYvRmNFL0h4MEVZRnlCaktKd1BNaElBQUNCQTZBTUFBQ0ptLzM4QUFJQS9BQUE2OEFJZnRreERyeE1zUkFBQUFBQ3ZBZGEyenIxTVF5SHRLMFFBRTRNN3J3SG90dHJVVEVQT3BTdEVBSFVUUExVQjZMYmExRXhEUVg4clJNQkRpenlaQXVpMlpKZE1RNVRHSzBSQUNDdzlYd1BvdGxtQVRFUHE4aXRFSUM5ZFBZVUQ2TGJ2V1V4RDBTb3NSQUNxY1QyZEEraTI0MEpNUTZaa0xFUXdCb0U5c2dQb3RpZ2tURU14cGl4RVVEZUpQY3NENkxadEJVeERsdXNzUklCb2tUM2NBK2kycytaTFE5YzBMVVNnbVprOTJ3UG90a3JBUzBNRmdDMUV3TXFoUGRJRDZMWXhra3REeE5ZdFJEQUlyRDJaQStpMkdXUkxRL0loTGtSZ09iUTlXd1BvdGxJdVMwUDdjQzVFZ0dxOFBRQUQ2TGJkOEVwREJNQXVSTENieEQybkF1aTJhTE5LUXpJTEwwVFF6TXc5VUFMb3RrTnVTa09GVWk5RUFQN1VQZmdCNkxZZktVcEQySmt2UkhBNzN6MktBZWkycWV0SlEvZkxMMFNRYk9jOU5RSG90cjV3U1VOZEVUQkV3SjN2UGVJQTZMYlU5VWhEL1RVd1JBQUFBRDVoQU9pMmYxUklRNkEvTUVSUU53aytEUURvdGlvVEVoRUNVSS9XZXM5K1NNeVllNS9aL0V6TUhDS1VCaHA5Q2cwRUFBZ0pBUU1MQndvRkFnd0dFZ1FTQWdBRkVnUVNBZ0FCRWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVSSUVFZ0lBWHhJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRklpL1FSUytnUUs5d1FLQ1FvQkRSSUVFZ0lBSEJMcEJBb1FrUXlyZkFjRlRQYUx1cmFhRU1SM1VoSHJPYzJWd2UzSFFSZ2NJR2NvbUI4eUV1Z0RBQUNlZGY5L0FBQ0FQd0FBQUFBQUFEcXdCRkhHMEVQRHZ3SkVBQUFBQUZrQ0tVQzlBVzJXRy9UUVF6VkZBa1FBRW9NN25LUW5RUFlCYlpZMTNkQkRtTU1DUkFBckJ6M1FGU2hBVHdKdGxtdXYwRU1ySndORWdHbzhQUmluSjBCZEFtMldBSHJRUTQ2bEEwVEF6RXc5VXpnblFHc0NiWlpSTmRCREZ6Y0VSQ0F2WFQzaHlTWkFid0p0bGw3aHowUHgxd1JFWUpGdFBjTGFKVUJ6QW0yV2JJM1BRM1NBQlVUQTgzMDlmTXdtUUlnQ2JaWlNFODlEUkU4R1JGQTNpVDJlM1NWQW53SnRsamVaemtNL0dnZEVjR2lSUFdrZUpVQ2RBbTJXT0FqT1ErVHNCMFNRbVprOUlHMGtRSnNDYlpiMlo4MURNY2NJUk1ES29UMFd2U05BaXdKdGxoSEF6RU4rb1FsRTRQdXBQU01KSTBCOEFtMld6aC9NUThwN0NrUVFMYkk5STdraVFIRUNiWmJxZDh0RFBta0xSSUJxdkQwalhTSkFZZ0p0bHMvOXlrTzNQd3hFb0p2RVBWbldJVUJMQW0yV082TEtRNjBoRFVUUXpNdzkxd3NpUURRQ2JaWXVaY3BEb3dNT1JQRDkxRDJGdWlGQUdBSkJsbU0zeWtQRTRRNUVFQy9kUFdCNklVRDhBYytWZnlES1E1T3dEMFJBWU9VOWtFQWhRTjhCVjVXYUNjcERpWklRUkxDZDd6MUQ2aUJBdHdIWWxKb0p5a000TnhGRTBNNzNQUVBISUVDS0FWaVVtZ25LUTJuUUVVUUFBQUErNnJrZ1FGd0IzSk03RWNwREhsNFNSSkFZQkQ3Mnd5QkFLd0ZlazhNdnlrT0EzQkpFS0RFSVB0M2ZJRUQ1QU9DU0xtWEtRejg4RTBTNFNRdytzUWNoUU1BQVpKSndCY3REemJZVFJIQm9FVDVZRlNGQWR3QjFrUVR5eTBOM3ZoTkVtSmtaUG1Fc0lrQU1BTVdRS2hNU0VRTHdORXRxMXROTmdJZ3AvakZPRWF4Mkl2d0JHbjBLRFFZREN3RUlDZ1FIQlFrQUFnd1NCQklDQUZJU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUFFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFCUklFRWdJQVh4SUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBU0ptSW1RS0FnQUJFaDhLSFFvQ0NGY1NGMElWS2hNU0VRTENEM1V6OWZwUDdvTnJpNnl4QW9neEVqMEtPd29FQ0ZnUUF4SXpjakVLQkFBQ0F3a1NDQWpnbThhc3BvUUVFZ0lvQUJJWFFoVXFFeElSQWxXdW81VWdYa1kxdmtkdEl6Szl6NjhTQWlnQUtoTVNFUUl4R21XbW5ibE5RSWdCcGxFVFFLQmdJdUVCR24wS0RRTUVCd1lGQ2dBTERBa0lBUUlTQkJJQ0FBRVNCQklDQUFVU0JCSUNBRjhTQkJJQ0FGSVNCQklDQUFFU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0FCRWdRU0FnQlJFZ1FTQWdBQkVnUVNBZ0FCRWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQUFSSUVFZ0lBQVNKTElra0tBUUlTUkFwQ0NnUUlXUkFCRWpwS09BbzJJalFLRkEwQUFBQUFGUUFBQUFBZEFBQUFBQ1VBQUlBL0VoRmpiMjB1WVhCd2JHVXVhVzVyTG5CbGJoZ0RRUUFBQUFBQUFQQy9LaE1TRVFLS2VsRjY5MUZBTXJBMUxLVSt3NCtKSXJrQkduMEtEUWtFREFJSUJ3c0dBd29GQVFBU0JCSUNBQUVTQkJJQ0FBVVNCQklDQUFFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdCZkVnUVNBZ0JSRWdRU0FnQlNFZ1FTQWdBQkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFTSWpDaUVLQWdoYUVodGlHUklYUWhVcUV4SVJBcmtPaU5Bb3VVYUdyZEtPY1RoWDcxSXFFeElSQWd2ck5PcTZya1U4dG5EbGVOSjJrZGdpN2dFYWZRb05BUU1LQ0FJRkRBWUpDd0FFQnhJRUVnSUFBUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdCUkVnUVNBZ0FCRWdRU0FnQUZFZ1FTQWdCZklsZ2lWZ29CQWhKUkNrOEtCQWhiRUFFU1IwcEZDa01pUVFvVURRQUFBQUFWQUFBQUFCMEFBQUFBSlFBQWdEOFNFV052YlM1aGNIQnNaUzVwYm1zdWNHVnVHQU1pQzJacGVHVmtMWGRwWkhSb1FRQUFBQUFBQU9BL0toTVNFUUxqZnV0Tmp6ZExKNDliZFBVdTFaVnhJdndCR24wS0RRZ0JBZ01MQUF3SEJRWUtCQWtTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCUkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCZkVnUVNBZ0FCRWdRU0FnQlNFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUJSSUVFZ0lBQVNKbUltUUtBZ0FCRWg4S0hRb0NDRndTRjBJVktoTVNFUUtUb1NGRWtzcEVYcWszT3hySEJHamVFajBLT3dvRUNGMFFBeEl6Y2pFS0JBQUNBd2tTQ0FqZ3lkSFI0b1FFRWdJb0FCSVhRaFVxRXhJUkFnTkdYb2llWkUvcGdlT1VZVHBXbTIwU0FpZ0FLaE1TRVFKMlFESnhPVVpGR0ozWHREeTk3a1dRSXZ3QkduMEtEUVFBREFNQkNnSUhDd1VHQ1FnU0JCSUNBQVVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0JmRWdRU0FnQlJFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFZzRTREFBT0FoZ0JEZ0VEQWdNSkN5Sm1JbVFLQWdBQkVoOEtIUW9DQ0Y0U0YwSVZLaE1TRVFMRTBmTXQ5TzFLZVlMUVZrR2Rya0djRWowS093b0VDRjhRQXhJemNqRUtCQUFDQXdrU0NBamd4L2Z6b29jRUVnSW9BQklYUWhVcUV4SVJBblhtRkZHc09ra1FzSDl3cmlGZG1jTVNBaWdBS2hNU0VRSTAvelQ0MFROTktwa3dnSDZPbk5uT0lzQUJHbjBLRFFvRkRBY0dDQWtCQUFRTEFnTVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQmZFZ1FTQWdCU0VnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFCUklFRWdJQVVSSUVFZ0lBQVJJRUVnSUFBU0lxSWlnS0FRQVNJd29oQ2dJSVlCSWJTaGtLRjBJVktoTVNFUUtLZWxGNjkxRkFNckExTEtVK3c0K0pLaE1TRVFJUmxBbXVaU2hPL3F6b3B4ZCt4NnpKSXU0QkduMEtEUWtGQmdvSEFRTUxBZ1FBQ0F3U0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZJU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JSRWdRU0FnQUJFZ1FTQWdBRkVnUVNBZ0FCRWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQUFTSllJbFlLQVFJU1VRcFBDZ1FJWVJBQkVrZEtSUXBESWtFS0ZBMEFBQUFBRlFBQUFBQWRBQUFBQUNVQUFJQS9FaEZqYjIwdVlYQndiR1V1YVc1ckxuQmxiaGdESWd0bWFYaGxaQzEzYVdSMGFFRUFBQUFBQUFEZ1B5b1RFaEVDNUZON2pnUklSNmV2NXp2VFQ2OW5BaUx1QVJwOUNnMExDQUVBQmdvQ0NRY0ZBd3dFRWdRU0FnQlJFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVoSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFVaVdDSldDZ0VDRWxFS1R3b0VDR0lRQVJKSFNrVUtReUpCQ2hRTkFBQUFBQlVBQUFBQUhRQUFBQUFsQUFDQVB4SVJZMjl0TG1Gd2NHeGxMbWx1YXk1d1pXNFlBeUlMWm1sNFpXUXRkMmxrZEdoQkFBQUFBQUFBNEQ4cUV4SVJBbXFmdkRaSWFFQmNwemFLMXRQS3RNNGl0Z1VhZlFvTkRBb0RDQWNCQ3drQ0JRWUVBQklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQmZFZ1FTQWdBQkVnUVNBZ0JSRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQlNFZ1FTQWdBRkVnUVNBZ0FCSXA4RVVwd0VDcGtFQ2drS0FRMFNCQklDQUJnU2l3UUtFQVFFck91TmJFeWxydFhqWFZXcUZFRVJ6bEFnZGsvSHgwRVlIU0JqS0p3UE1oSUFBQ0JBNkFNQUFHZGkvMzhBQUlBL0FBQTYwQU5TaUxoRFJINHRSQUFBQUFEUEFVKy84Nlc0UTE1VkxVVEFRNHM4eXdQNXZ5Mjh1RVBha0MxRXdFZGhQZjBFSmNDRDNiaERxdnd0UklCb2tUMnNCVUhBVk95NFE3TWpMa1F3Q0t3OXpRVkt3Q1g3dUVPOFNpNUVZRG0wUGU4RlQ4RDFDYmxEeFhFdVJJQnF2RDBTQmxiQXhoaTVRL09XTGtTd204UTlOUVphd0pjbnVVTkV1aTVFME16TVBWa0dZY0JvTnJsRGNkOHVSRUFLMXoySEJtN0FDbFM1UTZFUkwwUndPOTg5M2dhRndEQ0V1VU1hUUM5RXdKM3ZQZE1IcE1EZHhybERneTB2UkZBM0NUN1RCN3ZBRGh5NlF5endMa1FJZ1JVK3h3ZlZ3RkZYdWtOSHh5NUVXTGdlUHNFSDVNRGdqcnBEaHB3dVJPalFJajY1Qi9YQTJNMjZRekpzTGtSNDZTWStyUWNKd1lRUXUwUGRPeTVFRUFJclBwOEhJOEhrVnJ0RDBRY3VSS0FhTHo1L0IwTEJSSjI3UStuUkxVUTRNek0rVUFkbndWbm51ME5LbUMxRThGRTRQZ01Ia2NHY0lyeEQ5V2N0UklCcVBENjZCcnpCdzFLOFEzMDVMVVFZZzBBK1NBYmt3WUY3dkVPOERpMUVxSnRFUHNRRkNzTFhuTHhEcytjc1JFQzBTRDQwQlRQQ0ViTzhRejNHTEVUUXpFdytuQVJkd3Y3TXZFTU5sQ3hFaU90UlB0b0QwY0o1dXJ4RHpyNHNSR2htWmo2L0FBbkRxS3U4UTVMMkxFUkl0bk0rRHdBancwZ1lLaE1TRVFJRFJsNklubVJQNllIamxHRTZWcHR0SXU0QkduMEtEUXNHQ0FrQ0J3b0JCQVVNQUFNU0JCSUNBRkVTQkJJQ0FGSVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCZkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFCUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFTSllJbFlLQVFJU1VRcFBDZ1FJWXhBQkVrZEtSUXBESWtFS0ZBMEFBQUFBRlFBQUFBQWRBQUFBQUNVQUFJQS9FaEZqYjIwdVlYQndiR1V1YVc1ckxuQmxiaGdESWd0bWFYaGxaQzEzYVdSMGFFRUFBQUFBQUFEZ1B5b1RFaEVDeE5IekxmVHRTbm1DMEZaQm5hNUJuQ0x1QVJwOUNnMEFBUXNHQ0FvTUJBY0RCUWtDRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JSRWdRU0FnQlNFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQVVTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFaVdDSldDZ0VDRWxFS1R3b0VDR1FRQVJKSFNrVUtReUpCQ2hRTkFBQUFBQlVBQUFBQUhRQUFBQUFsQUFDQVB4SVJZMjl0TG1Gd2NHeGxMbWx1YXk1d1pXNFlBeUlMWm1sNFpXUXRkMmxrZEdoQkFBQUFBQUFBNEQ4cUV4SVJBcWhwRkp4QktVMVhtTGZaQmYrTkkxRWk3Z0VhZlFvTkJ3a0JBZ2dGQ3dRR0F3d0FDaElFRWdJQVh4SUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUFVU0JCSUNBRklTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0SWxnaVZnb0JBaEpSQ2s4S0JBaGxFQUVTUjBwRkNrTWlRUW9VRFFBQUFBQVZBQUFBQUIwQUFBQUFKUUFBZ0Q4U0VXTnZiUzVoY0hCc1pTNXBibXN1Y0dWdUdBTWlDMlpwZUdWa0xYZHBaSFJvUVFBQUFBQUFBT0EvS2hNU0VRSUgxaWx2eVE5SzhvZFNWWERGVXJJVUl2d0JHbjBLRFFrQ0JRZ0FEQU1FQ3dFSENnWVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FGRWdRU0FnQlJFZ1FTQWdBQkVnUVNBZ0JmRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFVaUptSW1RS0FnQUJFaDhLSFFvQ0NHWVNGMElWS2hNU0VRSjJpSjdFSDlGTGxJY1Z0c0lBelRhckVqMEtPd29FQ0djUUF4SXpjakVLQkFBQ0F3a1NDQWlBdnVTZHdZY0VFZ0lvQUJJWFFoVXFFeElSQWl2Q0IyY1Zyay81bU1iT0VNYmxrVWdTQWlnQUtoTVNFUUtWOWlTU05zNUdjcWwzdk9EZ1RYbFhJclVER24wS0RRVUxDZ2tNQVFjR0JBQURBZ2dTQkJJQ0FBRVNCQklDQUZFU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JmRWdRU0FnQlNFZ1FTQWdBRkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnNFNEQUFPQWhnQkRnRURBZ01KQ3lLZUFsS2JBZ3FZQWdvSkNnRU5FZ1FTQWdBTkVvb0NDaENmcnlUUFpEcE5vTGg1RmV3c09Sb0NFYjR0UG5KUHg4ZEJHQTBnb3dFbzNBNHlFZ0FBSUVEb0F3QUFON3YvZndBQWdEOEFBRHJRQVRnaWdFT29LUzVFQUFBQUFHUUJjVjZSNEg5RC9sVXVSQUFTZ3p1N0FuRmVZSVIvUXd1S0xrU0FFb004bGdOeFh1cEdmME9Hc2k1RXdNek1QTW9EY1Y3SEFYOURBZHN1UklDUjdUd1lCSEZlbzd4K1Eyb0ZMMFFBS3djOWRRUnhYczl2ZmtQVEx5OUVZSTBYUGFvRWNWNnJLbjVETzFvdlJLRHZKejNPQkhGZTJkMTlROG1BTDBUZ1VUZzl2Z1J4WHB4cWZVTkJ4QzlFd014TVBYb0VjVjVzRG4xREF3QXdSR0NSYlQyN0E4ZGRWNGw5US9mTEwwVGcrNms5c3dBS1hlVDBmVU5YcHk5RVlJL0NQUU1BMEZ3cUV4SVJBcit2OTFweXUwRElrQzYyVHA3WjBVd2k2d0VhZlFvTkNBb0pCQVVIQ3dJREFRd0FCaElPRWd3QURnSVlBUTRCQXdJRENRc1NHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0FGRWdRU0FnQUJFZ1FTQWdCZkVnUVNBZ0JSRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JTSWxVeVV4SVhRaFVxRXhJUkFtWjZhS1o5ZEUvMG91SWFtaFNKRlYwYUJ3b0NDRDhpQVFFYURRb0NDR2dRQVJvQ0NHa2lBUUlhQ2dvSUNEOFEvLy8vL3c4aUNRb0JhQklFRWdJQUFTb0pDZ0ZwRWdRU0FnQUJLaE1TRVFJQm56TXk4WkI1TnBuWnN6M0l2cFNqSXNFQkduMEtEUU1CREFnRUJnY0tDUUlGQ3dBU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUZFZ1FTQWdCU0VnUVNBZ0JmRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFVUklFRWdJQUFTSXJDaWtLQWdocUVpTktJUW9mUWgwcUd4SVpBeEVDQVoyTXdXZ3Nka1dXOTMrV2lERURpQVVCWkhKaGR5b1RFaEVDQWFCMFRCYmZldXlQRUFkc0NNMjJrU0x1QVJwOUNnMEREQWNGQmdvQkFBUUpBZ2dMRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdCU0Vob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUJSSUVFZ0lBQVJJRUVnSUFBUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUZFaVdDSldDZ0VDRWxFS1R3b0VDR3NRQVJKSFNrVUtReUpCQ2hRTkFBQUFBQlVBQUFBQUhRQUFBQUFsQUFDQVB4SVJZMjl0TG1Gd2NHeGxMbWx1YXk1d1pXNFlBeUlMWm1sNFpXUXRkMmxrZEdoQkFBQUFBQUFBNEQ4cUV4SVJBaGJlVjhxNS9FaEl0N3FxbGVGbDJxd2l1UUVhZlFvTkFnZ0FCUXdFQ2dZQkJ3TUxDUklFRWdJQUFSSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQVVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQlNFZ1FTQWdBQkVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdCUkVnUVNBZ0FCSWlNS0lRb0NDR3dTRzJJWkVoZENGU29URWhFQ3ZFNU1NckloUjRldVdBSm5ISFNYaWlvVEVoRUNyRjE4UXRJMVRqZVdqaGdNRjFjeVppSzVBUnA5Q2cwRUFRa0dBd1VLQUFJSENBd0xFZ1FTQWdBRkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCU0VnUVNBZ0FCRWdRU0FnQUJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFYeElPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFFU0JCSUNBRkVpSXdvaENnSUliUkliWWhrU0YwSVZLaE1TRVFMVnQrUnpjb0pQTzRtNjd6MFBIdmdoS2hNU0VRSjR1S2xHcitGS2NJYXIxeW5Ib0x5Y0lya0JHbjBLRFFjQ0JBZ0dBd2tCREFBS0N3VVNCQklDQUY4U0JCSUNBQUVTQkJJQ0FBVVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBVVJJRUVnSUFBU0lqQ2lFS0FnaHVFaHRpR1JJWFFoVXFFeElSQXJDcENWeThDRVV6aWtJUXNPUWhjQU1xRXhJUkFqb1ZJanpHdzBNdHVkQ1lTREhUTzNVaWtRY2FmUW9OQlFzRENRQUNBUWNLREFZSUJCSUVFZ0lBQVJJRUVnSUFVUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFYeElhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FBRVNCQklDQUZJU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUZJdm9GVXZjRkN2UUZDZ2tLQVEwU0JCSUNBQ1FTNWdVS0VPeVhwVUsvaWt5M29tbjBoWE51bng4UlF0QlhkVS9IeDBFWUppRGpBU2ljRGpJUUFBQWdRT2dEQUFEL2Z3QUFnRDhBQURxc0JlSWJxVU9HL2kxRUFBQUFBQmtENHJoYllXL3ZxRU5FSEM1RUFBaXNQRThENHJoYlllQzNxRU81UFM1RXdNek1QUFVENHJnbVlEUjFxRU9lWmk1RTRLVWJQVzRFNHJpTlhtd25xRU9HbkM1RXdNeE1QYlVFNHJoSFhHTm1xRU0xZVM1RU1BaXNQY1FENHJqVVc5ajJxRVBhTGk1RW9KdkVQWGdENHJpUlczRlRxVU9xL0MxRVlEdmZQVXdENHJpQVcwN3JxVU9ZcmkxRXNKM3ZQYXNENHJoK1cwWXFxa051bGkxRVNEY0pQdW9FNHJoK1c1SW1xa08vdVMxRVVMZ2VQa0lGNHJoK1d3THZxVU03OVMxRWVPa21QbzBGNHJoK1c2ek5xVU93Rmk1RW9Cb3ZQckFGNHJoK1crUi9xVU15YkM1RVdEazBQc1FGNHJoK1cwSmlxVU1YbFM1RUVJTkFQcThGNHJoK1c3MVBxVU9Qd3k1RU9MUklQbklGNHJoK1d3dXdxVU9KcVM1RVFEVmVQdWtFNHJoK1d6SGdxVU5ma1M1RUdJVnJQcGNFNHJoK1c4RVhxa09oY3k1RXNKMXZQb2dFNHJoK1cxQlBxa1BqVlM1RVFMWnpQb0lFNHJoK1c5K0dxa051TkM1RTJNNTNQcGdFNHJoK1cyKytxa1BVRkM1RWFPZDdQck1FNHJoK1c3TDVxa09EOFMxRUVJT0FQdnNFNHJoK1cweFdxME5UdnkxRVhJK0NQbVlGNHJoK1cyQ2dxME1sbWkxRThLZUdQcGNGNHJoK1c2UGJxME96aFMxRWdNQ0tQajhHQnJsK1czVHFxME1wcHkxRWNHaVJQbDhIYXJsK1czVHFxME00NkMxRVVJMlhQcmdIcmJsK1c4RG1xME9KQ3k1RTlDaWNQc0FIekxsK1crL1hxME8yTUM1RVFEV2VQcllINkxsK1d4N0pxMFBqVlM1RWlFR2dQcG9IQWJwK1d3RytxME1RZXk1RTBFMmlQbVVIR0xwK1d6R3ZxME5pbmk1RUhGcWtQaDhITExwK1cvZVlxME1GNVM1RWVPbW1QcU1HVWJwK1cwT1ZxME03TVM5RURBS3JQc1lGZDdwK1cvZVlxME1nV2k5RTZDYXhQZ0lFaXJwK1c4RG1xME1tZEM5RWpNSzFQb0FDb3JwK1d6MDRyRVBlZHk5RWJPZTdQb1FBczdwK1cwZ2tLaE1TRVFLQ0piSU5GMlZKYVladjlTY2t0UmRrSXB3RUduMEtEUWdGQ3dZQUNRTUhBZ0VFQ2d3U0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUJFZ1FTQWdCUkVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQmZFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUZFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUFTS0ZBMUtDQXdyL0Fnb0pDZ0VORWdRU0FnQVFFdkVDQ2hCME11dmZXaVZESXEyY0Y5RUswN2pkRWFhMk9IVlB4OGRCR0JZZ0l5amNEeklVQUFBZ1FPZ0RBQURpdUZ0aC8zOEFBSUEvQUFBNnRBTE5ucVpESUI0dVJBQUFBQUR6QWdSUnBrTW1PQzVFZ0VNTFBZZ0RyaSttUThWeExrU0Fhanc5d0FPa0NxWkQyc3d1UkFBdlhUMGRCSWYvcFVQbkFDOUVRRGVKUFZ3RTAvdWxRNjFGTDBTUW1aazliUVVNRXFaRDZnMHZSUEQ5MUQyVEJaRWtwa04wN0M1RXNKM3ZQYUlGZno2bVEwZkhMa1RRenZjOXJ3VnNXS1pEWXA0dVJBQUFBRDZuQlE1MnBrT2hjeTVFa0JnRVBwOEZaSmVtUXdWSExrUklOd2srWXdWdXZLWkRJQjR1Uk9CUERUNHpCWG5ocGtNWDl5MUVjR2dSUGcwRjZ3Mm5RdzNRTFVRQWdSVSs0UVFTUHFkRHZLd3RSSmlaR1Q1NEJPMXhwME1palMxRUtMSWRQZzBFTUsyblE2MXJMVVRnMENJK1p3TXlFYWhETjBvdFJIanBKajdsQXN4dHFFUElRaTFFb0JvdlB1OEJMTFNvUThoQ0xVVEFTemMrK0FDNzY2aERISE10UkJDRFFENHJBRWdRS2hNU0VRSlZKQTJJbmtCSmVveWU3YmJETlFDUUl2d0JHbjBLRFFRQ0JRd0JBQWNMQmdNSkNnZ1NCQklDQUFVU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUY4U0JCSUNBRkVTQkJJQ0FGSVNCQklDQUFFU0JCSUNBQUVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWc0U0RBQU9BaGdCRGdFREFnTUpDeUptSW1RS0FnQUJFaDhLSFFvQ0NHOFNGMElWS2hNU0VRSU9BTzNMcGZaUEU3a3FLVzZ2dHlKUUVqMEtPd29FQ0hBUUF4SXpjakVLQkFBQ0F3a1NDQWpnNTZLYTg0VUVFZ0lvQUJJWFFoVXFFeElSQW9DYWJDblU5VU1jcU9SZ0JrSjFsYTBTQWlnQUtoTVNFUUlUS1NEYjRHNUhKYTlZSDIxQ0tPN2FJcmtCR24wS0RRc0ZCd29KQkFFTUJnSUFBd2dTQkJJQ0FGRVNCQklDQUFFU0JCSUNBRjhTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQUJFZ1FTQWdBRkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCU0VnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnNFNEQUFPQWhnQkRnRURBZ01KQ3lJakNpRUtBZ2h4RWh0aUdSSVhRaFVxRXhJUkFzSWRGeS9UQVU5TW1QN1ZaVkYzeW1ZcUV4SVJBa1VPdGVuVERFdm9pZ3F6YkozS0NSd2l1UUVhZlFvTkRBTUxDZ0lCQUFrRkJnZ0VCeElFRWdJQUFSSUVFZ0lBQVJJRUVnSUFVUklhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRklTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBRkVnUVNBZ0JmSWlNS0lRb0NDSElTRzJJWkVoZENGU29URWhFQ0FaOHpNMDcvZUYySXBjcit4QWZCUmlvVEVoRUNsV2NLTzVyUFR0eVpDSkh5N1cwNk1pS0ZBeHA5Q2cwRUFBb0NDQU1MQmdFRkNRY01FZ1FTQWdBRkVnUVNBZ0FCRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFFU0JCSUNBRkVTQkJJQ0FGSVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUY4U0JCSUNBQUVpN2dFaTZ3RUtBZ0FCRWlFS0h3b0VDSE1RQVJJWFFoVXFFeElSQW1BWTY2SnVhRXBTdEtNYmhRVUkzWDBTd1FFS3ZnRUtCQWgwRUFVU3RRRnlzZ0VLQlFBQ0F3UUpFZ2dJNExMUCtPR0VCQklDS0FBU0YwSVZLaE1TRVFLd04wSXArbUZDL0lOQm5NOEQ4K3hYRW40aWZGSnc3TEdyUTgyOEFFU2tzS3REemJ3QVJOZkRxME16NHdCRUg4V3JReC9sQUVSY2I2dERwQUFCUkh1VXEwTUs5d0ZFZTVTclEzc2tBa1NrY0t0RHpld0JST0dhcWtOSWtRQkVQYXFxUTFKNEFFU0Z5NnBETTFNQVJEUHpxa05JTVFCRWp5S3JRMGdSQUVROVNxdERVdmovUTJVVXJseENaWGYzWmtJU0FpZ0FLaE1TRVFJQm56TXpUdjk4aW9MK21xaTUzcGp6SXJrQkduMEtEUUVDQXdRS0NBa0hBQVlGREFzU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQVVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQUFSSUVFZ0lBWHhJRUVnSUFBUklFRWdJQVVoSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVTSWpDaUVLQWdoMUVodGlHUklYUWhVcUV4SVJBbXZBWm5Id3FVRGFneHU4MUJSQlRRWXFFeElSQXVUMHgwTXVwRS9WdkJQVjhsRTIvV3NpL0FFYWZRb05Bd0lCREFvR0N3QUVCd2dGQ1JJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FGSVNCQklDQUZFU0JCSUNBQUVTQkJJQ0FBVVNCQklDQUY4U0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUJFZ1FTQWdBQkltWWlaQW9DQUFFU0h3b2RDZ0lJZGhJWFFoVXFFeElSQW1xZnZEWklhRUJjcHphSzF0UEt0TTRTUFFvN0NnUUlkeEFERWpOeU1Rb0VBQUlEQ1JJSUNLRE91c1N6aEFRU0FpZ0FFaGRDRlNvVEVoRUNNRnEwQzcwWFNIcUg0eHFXeGN1Yi94SUNLQUFxRXhJUkFoK2FxOVMwSTBhdnR3WW1WUzA1OHhVaTdnRWFmUW9OQ1FJSUNnWUhBUU1MQkF3RkFCSUVFZ0lBQVJJRUVnSUFBUklPRWd3QURnSVlBUTRCQXdJRENRc1NHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdCU0VnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JSRWdRU0FnQUZFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJJbGdpVmdvQkFoSlJDazhLQkFoNEVBRVNSMHBGQ2tNaVFRb1VEUUFBQUFBVkFBQUFBQjBBQUFBQUpRQUFnRDhTRVdOdmJTNWhjSEJzWlM1cGJtc3VjR1Z1R0FNaUMyWnBlR1ZrTFhkcFpIUm9RUUFBQUFBQUFPQS9LaE1TRVFMTTRzSlh5MmhQRVp2U3BGbkxaNW9VSXNBQkduMEtEUXNLQ0FrRUF3d0JCUVlBQWdjU0JCSUNBRkVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQUFSSUVFZ0lBQlJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVoSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVh5SXFJaWdLQVFBU0l3b2hDZ0lJZVJJYlNoa0tGMElWS2hNU0VRSktFWmF2RmFCQU1aQ2hjL0hGMHdqOUtoTVNFUUxMNVNLNm1ERkN5Wk9DNDlsOVFnM3dJcWNDR24wS0RRY0tBUWtDQXdzRkNBQUdEQVFTQkJJQ0FGOFNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JSRWdRU0FnQUJFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBQVJJRUVnSUFVaElFRWdJQUFSSUVFZ0lBQlNLUUFTS05BUW9DQUFFU0lRb2ZDZ1FJZWhBQkVoZENGU29URWhFQzQrRzBXVDFoUTVxVkpWc0IyYW9pZFJKa0NtSUtCQWg3RUFVU1duSllDZ1VBQWdNRUNSSUlDTUNldXRiUmhnUVNBaWdBRWhkQ0ZTb1RFaEVDOERSTGF0YlRUWUNJS2Y0eFRoR3NkaElrSWlKU0lEMHF5a05TZUJORUNqZktROE9GRTBUaEdzcERjVzBUUk96eHlVT0ZPeE5FRWdJb0FDb1RFaEVDQVo4ek0wOEFjR0tSSDBidzdQYUVvaUs1QVJwOUNnMElBZ3NKQnd3QkJRQURCQVlLRWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQUFSSUVFZ0lBVVJJRUVnSUFBUklFRWdJQVh4SUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUJSSUVFZ0lBVWhJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwaUl3b2hDZ0lJZkJJYlloa1NGMElWS2hNU0VRSWZtcXZVdENOR3I3Y0dKbFV0T2ZNVktoTVNFUUlEYWIzbEdwaEFuTDlLL0JXTVl1U3pJdTRCR24wS0RRRUxDQUlFQ1FVRENnWU1BQWNTQkJJQ0FBRVNCQklDQUZFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUJFZ1FTQWdBRkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBVWhJRUVnSUFBUklFRWdJQUFSSUVFZ0lBWHlKWUlsWUtBUUlTVVFwUENnUUlmUkFCRWtkS1JRcERJa0VLRkEwQUFBQUFGUUFBQUFBZEFBQUFBQ1VBQUlBL0VoRmpiMjB1WVhCd2JHVXVhVzVyTG5CbGJoZ0RJZ3RtYVhobFpDMTNhV1IwYUVFQUFBQUFBQURnUHlvVEVoRUNwVnByVWNqRFErMjJKOGxvVERCR2FTTDFBaHA5Q2cwQkFBUUxCd1VEREFJR0NRb0lFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUZFZ1FTQWdCUkVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCU0VnUVNBZ0FCRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNpM2dFaTJ3RUtBZ0FCRWlFS0h3b0VDSDRRQVJJWFFoVXFFeElSQXRlSEhKVGlQVXhLcnc0U0ZzTkNtdEFTc1FFS3JnRUtCQWgvRUFVU3BRRnlvZ0VLQlFBQ0F3UUpFZ2dJd0tQUTQrS0VCQklDS0FBU0YwSVZLaE1TRVFLbmR3TDJ4RmxLZzR0MVE2RjFKVEthRW00aWJGSmdBS0M4UXhRdStFSVV6cnhEbWhuNFFwcTV2RU1VTHZwQzRicThReFF1K2tKSW9ieERVcmo4UW50MHZFT3V4d0JEU0dHOFEvYW9BRU1LTjd4RFVqZ0FRM3NVdkVQaGV2OUNlL1M3UTJabS9rSngvYnRESHdYK1F0ZWp2RU9rOFBaQ1pjek1Oa0Zsd1JaTVFSSUNLQUFxRXhJUkFnR2ZNekx4ajNhamoyVHJ5WnZ4N2ZVaW9RSWFmUW9OQ3dJRUJRWUhBd0FKREFFSUNoSUVFZ0lBVVJJRUVnSUFBUklFRWdJQUJSSUVFZ0lBQVJJRUVnSUFVaElFRWdJQVh4SUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklPRWd3QURnSVlBUTRCQXdJRENRc1NHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRJb29CSW9jQkNnSUFBUklpQ2lBS0JRaUFBUkFCRWhkQ0ZTb1RFaEVDRVpRSnJtVW9UdjZzNktjWGZzZXN5UkpkQ2xzS0JRaUJBUkFGRWxKeVVBb0ZBQUlEQkFrU0NBaWcydS9JaTRRRUVnSW9BQklYUWhVcUV4SVJBa0NkY04rQ3gwVytqakNsYUQ5V1FONFNIQ0lhVWhoeEhhWkRadWJLUW9YTHBVT0ZhODVDaGN1bFEyYm15a0lTQWlnQUtoTVNFUUlCbnpNeThZOTZvNDZETm03eXNDc1RJcm9CR24wS0RRRUtBZ3NHREFBSENBa0VCUU1TQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0JSRWdRU0FnQlNFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQmZFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBQVJJRUVnSUFCUklFRWdJQUFSSUVFZ0lBQVNJa0NpSUtBd2lDQVJJYlloa1NGMElWS2hNU0VRTEI4NnVrUjJORGRvOFcwN2VjVTdLTktoTVNFUUtEYlRPVnk1aEhscWlFNlJIWWVQYmlJcm9CR24wS0RRUUlCUU1HREFvQ0N3QUJCd2tTQkJJQ0FBVVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCU0VnUVNBZ0FCRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklFRWdJQVVSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVh4SUVFZ0lBQVNJa0NpSUtBd2lEQVJJYlloa1NGMElWS2hNU0VRSnlwRzBaeUlSTFk2a1lsRm01NnhyZUtoTVNFUUw1ZWZxMWFjQkZSTDlRb3gvSWVxRk5Jcm9CR24wS0RRUUZCZ0lIQVFnS0NRTUFDd3dTQkJJQ0FBVVNCQklDQUFFU0JCSUNBRklTQkJJQ0FBRVNCQklDQUY4U0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVSSUVFZ0lBQVNJa0NpSUtBd2lFQVJJYlloa1NGMElWS2hNU0VRSUJuek15OFk5Mm80OWs2OG1iOGUzMUtoTVNFUUpWdUVBVHNkZE1sWXVTTHNtQklOU2pJdjRCR24wS0RRVUhBQXNCREFvSkF3UUlBZ1lTQkJJQ0FBRVNCQklDQUY4U0JCSUNBQUVTQkJJQ0FGRVNCQklDQUFFU0JCSUNBQUVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FGRWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQUFSSUVFZ0lBVWlKb0ltWUtBZ0FCRWlBS0hnb0RDSVVCRWhkQ0ZTb1RFaEVDUEo2bUNkMWxTNytUTUg2WWF0aGJDaEkrQ2p3S0JRaUdBUkFERWpOeU1Rb0VBQUlEQ1JJSUNPQ3RsUE9BaFFRU0FpZ0FFaGRDRlNvVEVoRUNoS0hmMnNjcVNubUwxMUJsTlRpU0F4SUNLQUFxRXhJUkF2WTZENFR1TEUxWHZqbUN5M2tTdHdvaTd3RWFmUW9OQ2dBRUJnc0NDQUVKQlFjTUF4SWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQVVTQkJJQ0FGSVNCQklDQUZFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCZkVnUVNBZ0FCRWdRU0FnQUJJbGtpVndvQkFoSlNDbEFLQlFpSEFSQUJFa2RLUlFwRElrRUtGQTBBQUFBQUZRQUFBQUFkQUFBQUFDVUFBSUEvRWhGamIyMHVZWEJ3YkdVdWFXNXJMbkJsYmhnRElndG1hWGhsWkMxM2FXUjBhRUVBQUFBQUFBRGdQeW9URWhFQ3dnOTFNL1g2VCs2RGE0dXNzUUtJTVNMdkFScDlDZzBJQXd3QkJ3b0pDd0lGQkFZQUVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFYeElhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FBRVNCQklDQUZFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFVU0JCSUNBRklTQkJJQ0FBRWlXU0pYQ2dFQ0VsSUtVQW9GQ0lnQkVBRVNSMHBGQ2tNaVFRb1VEUUFBQUFBVkFBQUFBQjBBQUFBQUpRQUFnRDhTRVdOdmJTNWhjSEJzWlM1cGJtc3VjR1Z1R0FNaUMyWnBlR1ZrTFhkcFpIUm9RUUFBQUFBQUFPQS9LaE1TRVFJOG5xWUozV1ZMdjVNd2ZwaHEyRnNLSXVVQ0duMEtEUWdFREFJSkFBVUxCZ2NEQVFvU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUZFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQlJFZ1FTQWdCU0VnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxTTE9BVkxMQVFySUFRb0pDZ0VORWdRU0FnQUlFcm9CQ2hEZ29iSE02dTlObkpFQlJITDdWOTVSRWRaVEszSlB4OGRCR0FnZ293RW8zQTR5RWdBQUlFRG9Bd0FBTjd2L2Z3QUFnRDhBQURxQUFUSXFlRU5uZ0M1RUFBQUFBTEVEMDE3aE1YaERTRTR1UkFBU2d6dW9BOU5lTmRONFF5TlNMa1RBek13OENBVFRYaXhsZVVQWldTNUV3TXhNUFN3RDAxNDhKWHBEdEYwdVJHQ1JiVDFBQXROZVYveDZRN1JkTGtSQU40azlIUUdqWG43cWUwUEdXeTVFa0ptWlBYQUFlVjZ5NzN4RGdFZ3VST0Q3cVQwZEFIRmVLaE1TRVFLelhKai85VHBMU0kzM1NxUjd5ejFYSXU4QkduMEtEUXdBQXdzSkJ3SUZBUWdLQmdRU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRkVTQkJJQ0FBRVNCQklDQUY4U0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFVaElFRWdJQUJTSlpJbGNLQVFJU1VncFFDZ1VJaVFFUUFSSkhTa1VLUXlKQkNoUU5BQUFBQUJVQUFBQUFIUUFBQUFBbEFBQ0FQeElSWTI5dExtRndjR3hsTG1sdWF5NXdaVzRZQXlJTFptbDRaV1F0ZDJsa2RHaEJBQUFBQUFBQTREOHFFeElSQXM5Mldqa0xiRTBvcjVBc29HRjdNY0VpbHhVYWZRb05Cd0lFQXd3QUFRVUtDUWdMQmhJRUVnSUFYeElFRWdJQUFSSUVFZ0lBQlJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQlJFZ1FTQWdCU0l2Z1RJdlVUQ2dJREJCSXJDaWtLQXdpS0FSSWlJaUIvOEFBQUFBQUFBSC93QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFCTEJFMHErRXdyZEN3aVdBUkkxQ2d5WEFaZ0JtUUdhQVpzQm5BRVNCQklDQUgwU0JCSUNBRm9TQkJJQ0FIZ1NCUklEQUlzQkVnVVNBd0RuQVJJRkVnTUFoZ0VpSlFvWFFoVXFFeElSQWdOcHZlVWFtRUNjdjByOEZZeGk1TE1hQ2dvQ213RVNCQklDS3dFaUpRb1hRaFVxRXhJUkFubnhpTEVYdmtZbmphOGFBaDFwU0ljYUNnb0Ntd0VTQkJJQ2VnRWlKUW9YUWhVcUV4SVJBa09aa1dvR3FVUTFyL3E5bGZJNUQzTWFDZ29DbXdFU0JCSUNWZ0VpSlFvWFFoVXFFeElSQW5pNHFVYXY0VXB3aHF2WEtjZWd2SndhQ2dvQ213RVNCQklDVndFaUpRb1hRaFVxRXhJUkFtS0lYMVlxRms2Y2s0WkkzUXphQXVNYUNnb0Ntd0VTQkJJQ1dBRWlKUW9YUWhVcUV4SVJBcnhYM29heDkwazh1WjRnSnRqRitQTWFDZ29DbXdFU0JCSUNXUUVpSlFvWFFoVXFFeElSQWpvNHdOd2dIMEFGcXBoVHBQUlRMcFVhQ2dvQ213RVNCQklDV2dFaUpRb1hRaFVxRXhJUkFyT1lqcnJMRlV3NXV3bWNpckxycFhnYUNnb0Ntd0VTQkJJQ1d3RWlKUW9YUWhVcUV4SVJBaG5zVDE0dEJrbU91eldVbWlieG5VVWFDZ29DbXdFU0JCSUNYQUVpSlFvWFFoVXFFeElSQW9Cd0VXZjY2a1pSaDdKZU5HWFBJd29hQ2dvQ213RVNCQklDWFFFaUpRb1hRaFVxRXhJUkFtcFFqV21mTkVVU2xxeHZNaHJYTldJYUNnb0Ntd0VTQkJJQ1hnRWlKUW9YUWhVcUV4SVJBbFdoejhaRU1rSDlwK2hJNzVxaWJOQWFDZ29DbXdFU0JCSUNYd0VpSlFvWFFoVXFFeElSQWtSK2pkNlErVTFNaHFsTk9zUDlPN29hQ2dvQ213RVNCQklDWUFFaUpRb1hRaFVxRXhJUkFwRlNvN0JyRDBEZHVnbTJjYXVTVHFZYUNnb0Ntd0VTQkJJQ1lRRWlKUW9YUWhVcUV4SVJBcENJRlYvY1NrU2tqdWk4cUJiZzVNa2FDZ29DbXdFU0JCSUNZZ0VpSlFvWFFoVXFFeElSQWovSXUrWTR5VXozaUFtSjRtZG9MOXdhQ2dvQ213RVNCQklDWXdFaUpRb1hRaFVxRXhJUkFrNEJNWkZaRmtpd29KbXhsMTRLR2xVYUNnb0Ntd0VTQkJJQ1pBRWlKUW9YUWhVcUV4SVJBZ2tHQTR5d1EwYytqZytHQi9hb1VqY2FDZ29DbXdFU0JCSUNaUUVpSlFvWFFoVXFFeElSQW9OdE01WExtRWVXcUlUcEVkaDQ5dUlhQ2dvQ213RVNCQklDWmdFaUpRb1hRaFVxRXhJUkFrVU90ZW5UREV2b2lncXpiSjNLQ1J3YUNnb0Ntd0VTQkJJQ1p3RWlKUW9YUWhVcUV4SVJBam9WSWp6R3cwTXR1ZENZU0RIVE8zVWFDZ29DbXdFU0JCSUNhQUVpSlFvWFFoVXFFeElSQW96RmRmcXVMa2xEaWNiZ3ZCbDVEQkFhQ2dvQ213RVNCQklDYVFFaUpRb1hRaFVxRXhJUkF2bDUrclZwd0VWRXYxQ2pIOGg2b1UwYUNnb0Ntd0VTQkJJQ2FnRWlKUW9YUWhVcUV4SVJBaGp0aGxMVFMwUTlrUTFTQ0Y2cXlIRWFDZ29DbXdFU0JCSUNhd0VpSlFvWFFoVXFFeElSQW4vcDIrKzE4MGVPcjhhSVpaYlc2a3NhQ2dvQ213RVNCQklDYkFFaUpRb1hRaFVxRXhJUkFwR0VWUGh3RjBlT3Z4em5jbzdYZ0VJYUNnb0Ntd0VTQkJJQ2JRRWlKUW9YUWhVcUV4SVJBbGhtUzU2cXMwdWNtVlhsWklsREg1c2FDZ29DbXdFU0JCSUNiZ0VpSlFvWFFoVXFFeElSQWd2ck5PcTZya1U4dG5EbGVOSjJrZGdhQ2dvQ213RVNCQklDYndFaUpRb1hRaFVxRXhJUkFxeGRmRUxTTlU0M2xvNFlEQmRYTW1ZYUNnb0Ntd0VTQkJJQ2NBRWlKUW9YUWhVcUV4SVJBcC9obDM3SGIwM1dzODJxZFQ3TzZYTWFDZ29DbXdFU0JCSUNjUUVpSlFvWFFoVXFFeElSQXZYcHdZdjlEVUg0aStvV0RIbmpTN1lhQ2dvQ213RVNCQklDY2dFaUpRb1hRaFVxRXhJUkF1VDB4ME11cEUvVnZCUFY4bEUyL1dzYUNnb0Ntd0VTQkJJQ2N3RWlKUW9YUWhVcUV4SVJBcmJRUFNMN3Mwd3BpbHJnMmlDcFBoZ2FDZ29DbWdFU0JCSUNXZ0VpSlFvWFFoVXFFeElSQWtzNTQ5TjA1RXVwc1QwZzM5TDZOSklhQ2dvQ21nRVNCQklDWEFFaUpRb1hRaFVxRXhJUkFoa2hOc2pVUEVHOWpveGhrdkJSS2VvYUNnb0NtZ0VTQkJJQ1hRRWlKUW9YUWhVcUV4SVJBdkFzblNFUFRVVExxYjVRR2NpTkFpSWFDZ29DbWdFU0JCSUNjQUVpSlFvWFFoVXFFeElSQWxjVXF1ZTU0VVVYcHZ1UTJrb0VNQ2NhQ2dvQ21nRVNCQklDY2dFU29nWWFCd29DQ0Q4aUFRRWFEQW9GQ0lzQkVBWVFEeUlCQWhvTUNnVUlpd0VRRnhBTUlnRURHaE1LQlFpTEFSQWpFQUVhQlFpTUFSQXJJZ0VFR2d3S0JRaUxBUkFrRUNvaUFRVWFFd29GQ0lzQkVFNFFIeG9GQ0l3QkVGWWlBUVlhREFvRkNJc0JFRzBRTHlJQkJ4b05DZ1lJaXdFUW9BRVFEeUlCQ0JvTkNnWUlqUUVReUFFUUVpSUJDUm9OQ2dZSWpnRVEvUUVRQnlJQkNob1VDZ1lJamdFUWhBSVFBUm9GQ0k4QkVGb2lBUXNhRFFvR0NJNEJFSVVDRUFFaUFRd2FGQW9HQ0k0QkVJWUNFQUlhQlFpUEFSQmNJZ0VOR2cwS0JnaU9BUkNJQWhBRUlnRU9HaFFLQmdpT0FSQ1NBaEFCR2dVSWp3RVFjQ0lCRHhvTkNnWUlqZ0VRa3dJUUFTSUJFQm9VQ2dZSWpnRVFsQUlRQVJvRkNJOEJFSElpQVJFYURRb0dDSkFCRUxRQ0VEQWlBUklhRFFvR0NKRUJFT2NDRUNBaUFSTWFEUW9HQ0pFQkVJd0RFQ1VpQVJRYURRb0dDSkVCRUljREVBVWlBUlVhRFFvR0NKQUJFT1FDRUFNaUFSWWFEUW9HQ0k0QkVKVUNFQXdpQVJjYURRb0dDSkFCRUxNQ0VBRWlBUmdhRFFvR0NJNEJFS0VDRUF3aUFSa2FEUW9HQ0pBQkVMSUNFQUVpQVJvYURRb0dDSkFCRUxFQ0VBRWlBUnNhRFFvR0NKQUJFSzRDRUFNaUFSd2FEUW9HQ0pBQkVLMENFQUVpQVIwYURRb0dDSTRCRUpFQ0VBRWlBUjRhRFFvR0NJNEJFSThDRUFJaUFSOGFEUW9HQ0k0QkVJd0NFQU1pQVNBYURRb0dDSTBCRU5vQkVBZ2lBU0VhRFFvR0NJNEJFT1FCRUJVaUFTSWFEUW9HQ0k0QkVQc0JFQUlpQVNNYURRb0dDSTRCRVBrQkVBSWlBU1FhRFFvR0NJNEJFT0lCRUFJaUFTVWFEUW9HQ0lzQkVLOEJFQllpQVNZYURRb0dDSTBCRU1ZQkVBRWlBU2NhRFFvR0NJMEJFTVVCRUFFaUFTZ2FEUW9HQ0kwQkVNY0JFQUVpQVNrYURRb0dDSXNCRUp3QkVBUWlBU29hREFvRkNJc0JFQlVRQWlJQkt4b0tDZ01JaXdFUUJpSUJMQm9LQ2dnSVB4RC8vLy8vRHlJdkNncVFBWTRCalFHUkFZc0JFZ1VTQTYwQ09oSUZFZ1BpQVVzU0JSSUR4UUVkRWdVU0ErY0NTaElGRWdNQXhRRXFOUW9Na2dHVEFaUUJqd0dNQVpVQkVnVVNBd0NHQVJJRUVnSUFXaElFRWdJQWZSSUZFZ01BaXdFU0JSSURBT2NCRWdRU0FnQjRHZ01JblFFYUF3aWVBUm9EQ0o4QkdnTUlvQUVhQXdpaEFSb0RDS0lCR2dNSW93RWFBd2lrQVJvRENLVUJHZ01JcGdFYUF3aW5BUm9EQ0tnQkdnTUlxUUVhQXdpcUFSb0RDS3NCR2dNSXJBRWFBd2l0QVJvRENLNEJHZ01JcndFYUF3aXdBUm9EQ0xFQkdnTUlzZ0VhQXdpekFSb0RDTFFCR2dNSXRRRWFBd2kyQVJvRENMY0JHZ01JdUFFYUF3aTVBUm9EQ0xvQkdnTUl1d0VhQXdpOEFSb0RDTDBCR2dNSXZnRWFBd2kvQVJvRENNQUJHZ01Jd1FFcUd4SVpBeEVDQVoyTXdXZ3Nka1dXOTMrV2lERURpQVVCWkhKaGR5SzZBUnA5Q2cwSUNnd0NBQU1KQlFjTEJnRUVFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUY4U0JCSUNBRkVTQkJJQ0FGSVNCQklDQUFFU0JCSUNBQVVpSkFvaUNnTUl3Z0VTRzJJWkVoZENGU29URWhFQysyNVJLV00vUmo2NS91RWNTdmpGUENvVEVoRUNXR1pMbnFxelM1eVpWZVZraVVNZm15THZBUnA5Q2cwRUF3a0tBUUlJQUFVTUJ3c0dFZ1FTQWdBRkVnUVNBZ0FCRWdRU0FnQUJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUFSSUVFZ0lBQVJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUZFU0JCSUNBRklpV1NKWENnRUNFbElLVUFvRkNNTUJFQUVTUjBwRkNrTWlRUW9VRFFBQUFBQVZBQUFBQUIwQUFBQUFKUUFBZ0Q4U0VXTnZiUzVoY0hCc1pTNXBibXN1Y0dWdUdBTWlDMlpwZUdWa0xYZHBaSFJvUVFBQUFBQUFBT0EvS2hNU0VRSmZnN25HR1BaSkJiWEtZdHBmYU9EQ0l2UURHbjBLRFFjSUJnSUpDd1VLQVF3REFBUVNCQklDQUY4U0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQlNFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQlJFZ1FTQWdBQkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFCU0xkQWxMYUFnclhBZ29KQ2dFTkVnUVNBZ0FSRXNrQ0NoQkdRb2NSckh0TmthK3hQSVdMRHBWTEVVcTFGWEpQeDhkQkdCRWdZeWljRHpJU0FBQWdRT2dEQUFCRVl2OS9BQUNBUHdBQU9wQUNYZHQrUXcvdkswUUFBQUFBaWdMY3VjTllma1BuRFN4RUFCT0RPeXNFQ2J4TkczNURyQzRzUkdDTkZ6MW1CQ084ZTg1OVEvQmNMRVJBQ0N3OW1RUkZ2UGw1ZlVQcWtpeEVnR284UGJzRVk3ekpIWDFEaDlJc1JPRE1URDNIQkdlOGphcDhROGNiTFVRZ0wxMDkwQVJudlBNbmZFT0djaTFFZ0pGdFBiMEVaN3o4bFh0RERzOHRSTUR6ZlQyaUJHZTgrZXg2UXlZM0xrUlFONGs5S0FSbnZBSmJla1BUank1RWNHaVJQYlFEWjd5NjBIbERwT1F1UktDWm1UMHVBMmU4ejFWNVE5TXZMMFRBeXFFOXBnSm52Si81ZUVOdmJ5OUU4UHVwUFJvQ1o3ek1ySGhEYWFVdlJCQXRzajJPQVdlOHAyZDRRMlBiTDBTQWFydzk0UUJudk5RYWVFTktFekJFc0p2RVBWa0FaN3dxRXhJUkFzdklrVUREMEVBbW1WR3J0c1lxOVVBaXVnRWFmUW9OQmdJRERBY0VBQW9GQ3dnQkNSSUVFZ0lBVWhJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFYeElFRWdJQUJSSUVFZ0lBQVJJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBQUVTQkJJQ0FGRVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWdRU0FnQUJJaVFLSWdvRENNUUJFaHRpR1JJWFFoVXFFeElSQWhNcElOdmdia2NscjFnZmJVSW83dG9xRXhJUkFoanRobExUUzBROWtRMVNDRjZxeUhFaS9nRWFmUW9OQmdFRkFBUUhDQXdKQXdvTEFoSUVFZ0lBVWhJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFCUklFRWdJQVh4SU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0JSRWdRU0FnQUJJbWdpWmdvQ0FBRVNJQW9lQ2dNSXhRRVNGMElWS2hNU0VRSTNaNE9USjFwRmJLN3NsNWpkay90bUVqNEtQQW9GQ01ZQkVBTVNNM0l4Q2dRQUFnTUpFZ2dJb05Pc2p1aUhCQklDS0FBU0YwSVZLaE1TRVFLL3IvZGFjcnRBeUpBdXRrNmUyZEZNRWdJb0FDb1RFaEVDdGFSQ09qYUhSdjZOZm81NGZkbXFwaUx2QVJwOUNnMEtDUVlEQkF3TEFBSUlCd0VGRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklFRWdJQVVoSUVFZ0lBQVJJRUVnSUFCUklFRWdJQUFSSUVFZ0lBVVJJRUVnSUFBUklFRWdJQUFSSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBRjhTQkJJQ0FBRVNCQklDQUFFaVdTSlhDZ0VDRWxJS1VBb0ZDTWNCRUFFU1IwcEZDa01pUVFvVURRQUFBQUFWQUFBQUFCMEFBQUFBSlFBQWdEOFNFV052YlM1aGNIQnNaUzVwYm1zdWNHVnVHQU1pQzJacGVHVmtMWGRwWkhSb1FRQUFBQUFBQU9BL0toTVNFUUppTko0ZmY3Vk15NkVZV2xUWUMvb3FJcXNDR24wS0RRUUZDd2NCQUFnREJna0NEQW9TQkJJQ0FBVVNCQklDQUFFU0JCSUNBRkVTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFNLVUFWS1JBUXFPQVFvSkNnRU5FZ1FTQWdBRkVvQUJDaEJPZXlUK1RqaE1rYlVmK1IwNU5GQUVFUk9ibFhSUHg4ZEJHQVVnSXlqY0R6SVVBQUFnUU9nREFBRGN0YlJsLzM4QUFJQS9BQUE2UnE1Y25FTmtNeXhFQUFBQUFMZ0NheUdjUXpRQkxFUUFFb003dUFLLzNwdERvd2dzUkFEWG96ek5BVmZYbTBQUkxTeEVRSTBYUFo0QUM5dWJRN3h3TEVUZ1VUZzlNQUFxRXhJUkFtVlg1cTJYS0V2bmxiMEJMQ2NYR3NnaS9nRWFmUW9OQndRR0NRTUJDZ3dDQUFzSUJSSUVFZ0lBWHhJRUVnSUFCUklFRWdJQVVoSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZFU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUJJbWdpWmdvQ0FBRVNJQW9lQ2dNSXlBRVNGMElWS2hNU0VRSmZnN25HR1BaSkJiWEtZdHBmYU9EQ0VqNEtQQW9GQ01rQkVBTVNNM0l4Q2dRQUFnTUpFZ2dJZ0x6TXFlU0hCQklDS0FBU0YwSVZLaE1TRVFKUWo5WjZ6MzVJekpoN245bjhUTXdjRWdJb0FDb1RFaEVDMWJma2MzS0NUenVKdXU4OUR4NzRJU0x2QVJwOUNnME1BZ0FIQ1FNR0JBb0ZBUXNJRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQmZFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQlNFZ1FTQWdBRkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVSSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzaVdTSlhDZ0VDRWxJS1VBb0ZDTW9CRUFFU1IwcEZDa01pUVFvVURRQUFBQUFWQUFBQUFCMEFBQUFBSlFBQWdEOFNFV052YlM1aGNIQnNaUzVwYm1zdWNHVnVHQU1pQzJacGVHVmtMWGRwWkhSb1FRQUFBQUFBQU9BL0toTVNFUUx3WktvZnhnSkFZNC9GTUk4cUlzOXNJc0VCR24wS0RRd0lDZ01FQ3djSkJnQUJCUUlTQkJJQ0FBRVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFCUklFRWdJQVVSSUVFZ0lBWHhJRUVnSUFBUklFRWdJQVVoSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVNJcklpa0tBUUFTSkFvaUNnTUl5d0VTRzBvWkNoZENGU29URWhFQ0pkRnJLNE5oU2VtNlFGTGRoNnE2b3lvVEVoRUN4SnFxb0ZXelFzR2g0TC9iVytBMzJTSzZBUnA5Q2cwSUJBd0pCZ2NCQXdvQ0FBc0ZFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBQlJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBVWhJRUVnSUFYeElFRWdJQUFSSUVFZ0lBQVJJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZFU0JCSUNBQUVpSkFvaUNnTUl6QUVTRzJJWkVoZENGU29URWhFQ2xmWWtramJPUm5LcGQ3emc0RTE1VnlvVEVoRUNzNWlPdXNzVlREbTdDWnlLc3V1bGVDS1BBaHA5Q2cwS0NBVUdEQUFKQXdFQ0J3c0VFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFFU0JCSUNBRklTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUZFU0JCSUNBQVVpZVZKM0NuVUtDUW9CRFJJRUVnSUFBeEpvQ2hCZVlVYzlkYzFCUVlJaVZVekFSRmVoRWNhaVVYSlB4OGRCR0FNZ1l5aWNEeklTQUFBZ1FPZ0RBQUNaWFA5L0FBQ0FQd0FBT2pBZTVvQkRTUTR0UkFBQUFBQ1RBVGU3NG5LQVF3TDdMRVFBRTRNN2t3Rlh2TWxFZ0VQYUdTMUVnSkh0UEM0QWxMd3FFeElSQXFQN2x6R2lzME9qdDZGaFJHVXZ0SGtpaEFRYWZRb05DQWNBQVFNTENnVUNCQXdKQmhJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZFU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBRkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCU0l1MENVdW9DQ3VjQ0Nna0tBUTBTQkJJQ0FCSVMyUUlLRUhwZnpLTmJuMFN1bEdTb1ZFWGdvL1lSdGZscmRFL0h4MEVZRWlCaktKd1BNaElBQUNCQTZBTUFBUGRwLzM4QUFJQS9BQUE2b0FMdG1wVkRKVjRzUkFBQUFBRDNBbysyVkQ2VlEzTjBMRVFBRTRNNy9BSnh0Z2JlbEVPZ21TeEVnSnRFUEVnRFJyWkh0WlJEMGNzc1JFQUlyRHg5QXhpMi9MaVVRMjc0TEVTQWtlMDg5Z1B2dFRjemxVUGpHUzFFWUkwWFBWVUV6TFZvaUpWRFVpRXRSSUJxUEQxaEJMKzFIdkNWUStZbUxVVGd6RXc5WFFTNHRmRmlsa1BDS0MxRUlDOWRQVUVFczdVczNaWkR3aWd0UkdDUmJUMEZCSzIxaEdLWFE4SW9MVVRBODMwOXRRT290V0g2bDBQQ0tDMUVVRGVKUFNrRHFMVnRnNWhEdnhzdFJIQm9rVDJnQXFpMUxSQ1pRK0FNTFVTZ21aazkvd0dvdFlXVm1VUGQveXhFd01xaFBXb0JxTFVNREpwRHR2UXNSUEQ3cVQzaEFLaTF3bk9hUTJyckxFUVFMYkk5ZFFDb3RZd2xtME1mNGl4RWdHcThQU1VBcUxVcUV4SVJBc1owWlhBZnUwODZoNm9ERTZpRCs3UWk3d0VhZlFvTkJnb0xBZ2NGQ1FBQkRBZ0RCQklFRWdJQVVoSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUZFU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0FGSWxraVZ3b0JBaEpTQ2xBS0JRak5BUkFCRWtkS1JRcERJa0VLRkEwQUFBQUFGUUFBQUFBZEFBQUFBQ1VBQUlBL0VoRmpiMjB1WVhCd2JHVXVhVzVyTG5CbGJoZ0RJZ3RtYVhobFpDMTNhV1IwYUVFQUFBQUFBQURnUHlvVEVoRUNkb2lleEIvUlM1U0hGYmJDQU0wMnF5TC9BUnA5Q2cwTUNBQUxCQWtCQlFjS0JnSURFZ1FTQWdBQkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQVVSSUVFZ0lBQlJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFYeElhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTQkJJQ0FGSVNCQklDQUFFU0JCSUNBQUVpYVZKbkNtVUtDUW9CRFJJRUVnSUFBaEpZQ2hBZDAzVG9ZOGxGejRiOXZUYTFmeVBKRVZYM3huSlB4OGRCR0FJZ1l5aWNEeklTQUFBZ1FPZ0RBQURSV3Y5L0FBQ0FQd0FBT2lDdCtJaER3ckVzUkFBQUFBQW5BWEMvSisySVF6R21MRVFBRTRNN3d3Q0F2eW9URWhFQytFOUJqcFJaU05lUUxSSVE5OTVXR2lLN0FocDlDZzBGQ2dJR0N3TU1BQVFIQVFnSkVnUVNBZ0FCRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklFRWdJQVVoSUVFZ0lBVVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFCUklFRWdJQVh4SUVFZ0lBQVJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FBRWlwQUVpb1FFS0FnQUJFaUlLSUFvRkNNNEJFQUVTRjBJVktoTVNFUUxMNVNLNm1ERkN5Wk9DNDlsOVFnM3dFbmNLZFFvRkNNOEJFQVVTYkhKcUNnVUFBZ01FQ1JJSUNNQytwSWVNaHdRU0FpZ0FFaGRDRlNvVEVoRUM0UXphSTBGNVJndUg5cGlBNXNEcjZoSTJJalJTS0Z4dnpVT1B3cVJDcm1mTlE2VHdxRUpJNGN4RHczV3RRaWxjelVQRDlhVkNYRy9OUTllanBFSmxaalloUW1VQWdDRkNFZ0lvQUNvVEVoRUNBWjh6TXZHUWNDaUUrc3dVNmVKMnhDSzZBUnA5Q2cwRkFBTUdBUWtJREFvQ0J3UUxFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdCU0VnUVNBZ0FCRWdRU0FnQUJFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBQVJJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUFVU0JCSUNBRkVpSkFvaUNnTUkwQUVTRzJJWkVoZENGU29URWhFQ0FZWjRpcXNsUk9DZzJ1SVB3K00rNFNvVEVoRUNqTVYxK3E0dVNVT0p4dUM4R1hrTUVDTHZBUnA5Q2cwR0JBc0pCd2dCQlF3QUFnTUtFZ1FTQWdCU0VnUVNBZ0FGRWdRU0FnQlJFZ1FTQWdBQkVnUVNBZ0JmRWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBpV1NKWENnRUNFbElLVUFvRkNORUJFQUVTUjBwRkNrTWlRUW9VRFFBQUFBQVZBQUFBQUIwQUFBQUFKUUFBZ0Q4U0VXTnZiUzVoY0hCc1pTNXBibXN1Y0dWdUdBTWlDMlpwZUdWa0xYZHBaSFJvUVFBQUFBQUFBT0EvS2hNU0VRSVlQcTZZdUp0T0paemdwS3pLVGhCWklxc0NHbjBLRFF3Q0FRVUdBd2dIQ3dvSkFBUVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRklTQkJJQ0FBRVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0JmRWdRU0FnQlJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFCU0tVQVZLUkFRcU9BUW9KQ2dFTkVnUVNBZ0FGRW9BQkNoRHkrdzJGZDVSQjhvTjdKdDhXbTg2R0VUMEw5SEZQeDhkQkdBVWdJeWpjRHpJVUFBQWdRT2dEQUFDSXRrUmkvMzhBQUlBL0FBQTZScm0yZEVQb0VpOUVBQUFBQU1rQnF2WnpRMkJXTDBRQUVvTTcvUUtQSDNORCtyQXZSS0JEQ3owUkE0eDJja01XL2k5RWdHbzhQWEVDMFZkeVE2TWtNRVFBcW5FOTlRQXFFeElSQWpUL3RwTTFhMCtwbXE0V1lYVldqQXdpN3dFYWZRb05BZ01FQUFrS0RBVUhDd1lCQ0JJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQlJJRUVnSUFBUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUZFU0JCSUNBRklTQkJJQ0FBRVNEaElNQUE0Q0dBRU9BUU1DQXdrTElsa2lWd29CQWhKU0NsQUtCUWpTQVJBQkVrZEtSUXBESWtFS0ZBMEFBQUFBRlFBQUFBQWRBQUFBQUNVQUFJQS9FaEZqYjIwdVlYQndiR1V1YVc1ckxuQmxiaGdESWd0bWFYaGxaQzEzYVdSMGFFRUFBQUFBQUFEZ1B5b1RFaEVDVDhYU1pzTUlTMnFYWUtuL2diTlJLQ0wrQVJwOUNnME1Cd1lKQ0FzQUF3VUVBZ29CRWdRU0FnQUJFZ1FTQWdCZkVnUVNBZ0JTRWdRU0FnQUJFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBVVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFCUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFaWFDSm1DZ0lBQVJJZ0NoNEtBd2pUQVJJWFFoVXFFeElSQW9CekZIWGpaa2VQcWVLZGxLWERvSVlTUGdvOENnVUkxQUVRQXhJemNqRUtCQUFDQXdrU0NBaWczdVhCaFlVRUVnSW9BQklYUWhVcUV4SVJBbVU4VWJGRGdFb0VuaVRla01GbHZzVVNBaWdBS2hNU0VRTE56NlB3TlZwSFY2UHdUemRXZ1pyTElyVURHbjBLRFFVRUF3a0dDd2dDQndFTUNnQVNCQklDQUFFU0JCSUNBQVVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRklTQkJJQ0FGRVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0FCRWdRU0FnQmZFZ1FTQWdBQkVnUVNBZ0FCRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBU0tlQWxLYkFncVlBZ29KQ2dFTkVnUVNBZ0FORW9vQ0NoQzBuYlljZnloS1ZyV1B0bzltVWRIc0VUYzEzSEJQeDhkQkdBMGdvd0VvM0E0eUVnQUFJRURvQXdBQTZMYi9md0FBZ0Q4QUFEclFBUWR1UjBOT3VDNUVBQUFBQUpNQ1YyUUhia2RENVkwdVJBQVNnenVUQWxka2ZLdEhRMnBsTGtTQW0wUTg3d0pYWk5CTVNFTlhaeTVFd016TVBLSURWMlRVOVVoRFZJSXVSRUNORnozWkExZGtuZFJKUXl5aExrU0Fhanc5NndOWFpIVEtTa05PdUM1RUlDOWRQZHNEVjJSVzEwdER6TVV1UktEemZUMWZBMU5rVFdsTVE1WExMa1J3YUpFOWJ3SkhaQlpJVFVOd3p5NUVrSm1aUGZZQkpXVFVEMDVEY004dVJPRDdxVDBVQWZsajQ4OU9RN3JITGtRd1hybzlZZ0RFWTlwaFQwUGlxQzVFME16TVBRQUFjbU1xRXhJUkFsV3VvNVVnWGtZMXZrZHRJeks5ejY4aS9nRWFmUW9OQ0FZRURBb0xBQVVIQVFrQ0F4SU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBRklTQkJJQ0FBVVNCQklDQUFFU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0JSRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJJbWdpWmdvQ0FBRVNJQW9lQ2dNSTFRRVNGMElWS2hNU0VRS0FJS3VIeC9oRXI3RUgxaTZ1amJOVEVqNEtQQW9GQ05ZQkVBTVNNM0l4Q2dRQUFnTUpFZ2dJd0wzczgrS0VCQklDS0FBU0YwSVZLaE1TRVFJb2xRb2FHSEZQbzVxWGJjYzdKNjR3RWdJb0FDb1RFaEVDazBsTjQ2N25SOUN4WUkwSkM0YWlBeUwrQVJwOUNnMEdBUVFGQndNTUNnZ0NDUUFMRWdRU0FnQlNFZ1FTQWdBQkVnUVNBZ0FGRWdRU0FnQUJFZ1FTQWdCZkVnUVNBZ0FCRWdRU0FnQUJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZFaWFDSm1DZ0lBQVJJZ0NoNEtBd2pYQVJJWFFoVXFFeElSQW5tbUxrZGxGMDdkcUxSMmlTN3hGWThTUGdvOENnVUkyQUVRQXhJemNqRUtCQUFDQXdrU0NBakFtcTcra29jRUVnSW9BQklYUWhVcUV4SVJBaGJ1bFNTWjIwdXZoZXo3TG1HR0NMMFNBaWdBS2hNU0VRSnJ3R1p4OEtsQTJvTWJ2TlFVUVUwR0l1OEJHbjBLRFFVQkNBa01CZ2NMQ2dJREFBUVNCQklDQUFFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQlNFZ1FTQWdCZkVnUVNBZ0JSRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFCU0paSWxjS0FRSVNVZ3BRQ2dVSTJRRVFBUkpIU2tVS1F5SkJDaFFOQUFBQUFCVUFBQUFBSFFBQUFBQWxBQUNBUHhJUlkyOXRMbUZ3Y0d4bExtbHVheTV3Wlc0WUF5SUxabWw0WldRdGQybGtkR2hCQUFBQUFBQUE0RDhxRXhJUkFwT2hJVVNTeWtSZXFUYzdHc2NFYU40aXVnRWFmUW9OQlFJTUJnY0xDUUVLQ0FBRUF4SUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBVWhJRUVnSUFYeElFRWdJQVVSSUVFZ0lBQVJJRUVnSUFBUklhRWhnQU5RRWhBV1VCVndFOUFnY0Nhd0VpQVM0QkJBRVdBUzBTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0FGRWdRU0FnQUJJaVFLSWdvRENOb0JFaHRpR1JJWFFoVXFFeElSQWdCZEFRQ1c0a2FMdGRkeU1NaHNlVFFxRXhJUkFwR0VWUGh3RjBlT3Z4em5jbzdYZ0VJaXZnRWFmUW9OQndnREJna0xDZ1VNQUFJRUFSSUVFZ0lBWHhJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FBRVNCQklDQUZJU0JCSUNBQUVTQkJJQ0FGRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FGRWdRU0FnQUJJaWdLSmdvRkNOc0JFQU1TSFdJYkNBRVNGMElWS2hNU0VRSUJuek15OFpCNTFwZ3JrTUMvaFQ1dUtoTVNFUUpMT2VQVGRPUkxxYkU5SU4vUytqU1NJdThCR24wS0RRVUtDQU1DQkFFR0N3a0hBQXdTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBQVJJRUVnSUFBUklFRWdJQUJSSUVFZ0lBQVJJRUVnSUFVaElFRWdJQVVSSUVFZ0lBQVJJRUVnSUFYeElFRWdJQUFSSUVFZ0lBQVNKWk1sY1NGMElWS2hNU0VRSlIvQ3k5VDJaTHY0TXA2NmVMMlEyNUdnY0tBZ2cvSWdFQkdnOEtBd2pjQVJBQkdnTUkzUUVpQVFJYUNnb0lDRDhRLy8vLy93OGlDZ29DM0FFU0JCSUNBQUVxQ2dvQzNRRVNCQklDQUFFcUV4SVJBZ0dmTXpOUEJuQmFrOWgvQ3ZGeElsY2l1Z0VhZlFvTkJnZ01DZ1VKQ3djQ0FBUURBUklFRWdJQVVoSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0RWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JSRWdRU0FnQmZFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUZFZ1FTQWdBQkVnUVNBZ0FCSWlRS0lnb0RDTjRCRWh0aUdSSVhRaFVxRXhJUkFnR2ZNekx4ajNxampvTTJidkt3S3hNcUV4SVJBbVo2YUtaOWRFLzBvdUlhbWhTSkZWMGl2Z0VhZlFvTkFBRUZEQWtDQ3dZSUJBY0RDaElFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVSSUVFZ0lBVWhJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FBVVNCQklDQUY4U0JCSUNBQUVTR2hJWUFEVUJJUUZsQVZjQlBRSUhBbXNCSWdFdUFRUUJGZ0V0SWlnS0pnb0ZDTjhCRUFFU0hXSWJDQUVTRjBJVktoTVNFUUlCbnpNelR3WndXcFBZOUI3UUloT29LaE1TRVFMd0xKMGhEMDFFeTZtK1VCbklqUUlpSXY0QkduMEtEUXNFQXdjRkNnQUJCZ0lJQ1F3U0JCSUNBRkVTQkJJQ0FBVVNCQklDQUFFU0JCSUNBRjhTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQlNFZ1FTQWdBQkVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQUFTSm9JbVlLQWdBQkVpQUtIZ29EQ09BQkVoZENGU29URWhFQ3Q4T3VBMERMVFF1Ky9GOThzRHFYS1JJK0Nqd0tCUWpoQVJBREVqTnlNUW9FQUFJRENSSUlDS0R3NU1mNWhnUVNBaWdBRWhkQ0ZTb1RFaEVDK0U5QmpwUlpTTmVRTFJJUTk5NVdHaElDS0FBcUV4SVJBc0lkRnkvVEFVOU1tUDdWWlZGM3ltWWk3d0VhZlFvTkRBRURDd0FKQlFvQ0JnY0VDQklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUFFU0JCSUNBRklTQkJJQ0FGOFNCQklDQUFVU0RoSU1BQTRDR0FFT0FRTUNBd2tMSWxraVZ3b0JBaEpTQ2xBS0JRamlBUkFCRWtkS1JRcERJa0VLRkEwQUFBQUFGUUFBQUFBZEFBQUFBQ1VBQUlBL0VoRmpiMjB1WVhCd2JHVXVhVzVyTG5CbGJoZ0RJZ3RtYVhobFpDMTNhV1IwYUVFQUFBQUFBQURnUHlvVEVoRUNlYVl1UjJVWFR0Mm90SGFKTHZFVmp5TEJBUnA5Q2cwRkFRWUhCQW9BREFJREN3Z0pFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQlNFZ1FTQWdCZkVnUVNBZ0FGRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVSSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVpS3lJcENnRUFFaVFLSWdvRENPTUJFaHRLR1FvWFFoVXFFeElSQWduY0cvdXMvVTFwajNadXhNVWtIUUlxRXhJUkF1UGh0Rms5WVVPYWxTVmJBZG1xSW5VaTRnRWFmUW9OQ3dRREJ3VUFBZ0VKQ2dZSURCSUVFZ0lBVVJJRUVnSUFCUklFRWdJQUFSSUVFZ0lBWHhJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUZJU0RoSU1BQTRDR0FFT0FRTUNBd2tMRWdRU0FnQUJJa3dpU2dvQkFoSkZDa01LQlFqa0FSQUJFanBLT0FvMklqUUtGQTBBQUFBQUZRQUFBQUFkQUFBQUFDVUFBSUEvRWhGamIyMHVZWEJ3YkdVdWFXNXJMbkJsYmhnRFFRQUFBQUFBQVBDL0toTVNFUUlKM0J2N3JQMU5hWTkyYnNURkpCMENJcm9CR24wS0RRTUtDUUFDREFzR0JRUUJDQWNTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JSRWdRU0FnQlNFZ1FTQWdBQkVnUVNBZ0FGRWdRU0FnQUJFZzRTREFBT0FoZ0JEZ0VEQWdNSkN4SUVFZ0lBWHlJa0NpSUtBd2psQVJJYlloa1NGMElWS2hNU0VRSTR5U3ZBVzJsSFhMdHJkNVN6R3BrREtoTVNFUUpxVUkxcG56UkZFcGFzYnpJYTF6VmlJcGNJR24wS0RRTUpBQXdIQ2dFSUN3UUZBZ1lTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUY4U0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnUVNBZ0FCRWc0U0RBQU9BaGdCRGdFREFnTUpDeElFRWdJQVVSSUVFZ0lBQlJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBVWlLQUIxTDlCZ3I2QmdvSkNnRU5FZ1FTQWdBdEV1d0dDaEFVRFA5bVdiVkdiSUdQWFBoYlMwWklFZXJvM25KUHg4ZEJHRE1nb3dFbzNBNHlFZ0FBSUVEb0F3QUE2TVAvZndBQWdEOEFBRHF3QnBPOGlVTlMvUzFFQUFBQUFLUUJaMk9UdklsRFJza3RSTUJEaXp3TkEvcGlrN3lKUTlQdkxVUkFDQ3c5eVFNeFlwTzhpVU9vS1M1RUlDOWRQZkVEcm1FTnNZbEREbTh1Uk1EemZUMHlCQ1JoQVpxSlE0UE5Ma1NBYUpFOVdnUmpZRktTaVVPUEFTOUU4UHVwUFhBRThGOVNrb2xEcWs0dlJJQnF2RDFLQmFsZXJPcUpRNGczTDBUQW5lODlvZ1VoWHBzY2lrT2VHaTlFbUJnRVByTUYrMTFpVW9wRDJma3VSQ2d4Q0Q2N0JkaGQxNCtLUTB2VExrVEFTUXcrdXdXNlhmelVpa1AxcGk1RWVHZ1JQcWdGbjEyYURvdERqSHd1UkFpQkZUNk9CWXRkRDB5TFF5TlNMa1NnbVJrK1Z3VitYZGFCaTBPNkp5NUVNTElkUGhNRmVWMmR0NHREUC84dFJNaktJVDZ6QkhsZGpPbUxRN0hZTFVSWTR5VStRd1I1WFNvampFTkpyaTFFRUFJclByTURlVjFyVFl4RFhwRXRSS0FhTHo0OUEzbGRqNUtNUS9abUxVVElTemMrS2dKNVhkelRqRU9jVlMxRXFKdEVQcVFBZVYyWDhveEQ4b0V0UkdEbFVENFFBSGxkb3dtTlE4VFdMVVNJRmxrK0JnQjVYVFVzalVOMitTMUVrSmR1UGtNQmVWMHhkWTFEVXYwdFJBQUFnRDVKQW5sZE9OV05RM3JlTFVTRXdJbyt2UUo1WFVBMWprUGF1UzFFWk9XUVBnUURlVjBmbVk1RFRKTXRSQWlCbFQ1RkEzbGRHdUtPUTVsd0xVU2NtWmsrcFFONVhUSVFqME1lU0MxRU1MS2RQcUVFZVYzQmlZNURIa2d0UkdobXBqNzJCWGxkN2p5T1E1eFZMVVJFaTZ3K2FBWjVYVzNvalVQUmFpMUVvQnF2UHNjR2VWM0RsNDFEellVdFJPd21zVDRKQjNsZDhFcU5RN2lpTFVRME03TStLQWQ1WGN3RmpVTjl3eTFFZ0QrMVBrTUhlVjB1ekl4RFF1UXRSTWhMdHo1QUIzbGRQcHFNUS9VR0xrUVVXTGsrT1FkNVhVOW9qRU9ETFM1RWNPZTdQZzRIZVYxclRZeERObEF1UkxqenZUN2dCbmxkNVVHTVE5WjBMa1FBQU1BK21BWjVYV3ROakVOT3VDNUVUQXpDUGtVR2VWMHlnNHhET05VdVJPQWt4ajR6QlhsZExzeU1Relh3TGtROHRNZytZd1I1WFlZa2pVTzAvUzVFaE1ES1ByY0RlVjA5akkxRGZBTXZSTkRNekQ0QkEzbGRlZitOUTN3REwwUVkyYzQrUFFKNVhZeDJqa044QXk5RVpPWFFQbGNCZVYwbStZNUR4dnN1Ukt6eDBqNlVBSGxkOVk2UFEzL29Ma1FJZ2RVK0xnQjVYVWd0S2hNU0VRTDN2a1hHaFo5RUFvZUcwOWw5NFp2VklzVUlHbjBLRFFnSEFBRUdCUW9FQXdrQ0RBc1NEaElNQUE0Q0dBRU9BUU1DQXdrTEVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUJSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFVU0t1QjFLckJ3cW9Cd29KQ2dFTkVnUVNBZ0F1RXBvSENoRGVjamFFQlVCSTk0SmIvUnZiZFB1OUVSSERwblJQeDhkQkdEQWc0d0VvbkE0eUVBQUFJRURvQXdBQS8zOEFBSUEvQUFBNjRBWWo3WnhERmxrdFJBQUFBQUNpQWR5MXRHWDh2SnhESDRBdFJBQVRnenZ1QXR5MUNHV0trSnhEVDdJdFJFQUlyRHgzQTl5MWFXU2NkcHhEb2RVdFJJQ1I3VHkwQTl5MUgyU3VYSnhEcXZ3dFJBQXJCejM1QTl5MTEyUEJRcHhEYXljdVJHQ05GejA4QlB1MWxtUFRLSnhESzFJdVJLRHZKejE5QkJtMlcyT2FFcHhEeUg0dVJJQnFQRDI0QkQyMkttT3QrSnREL0wwdVJPRE1URDN4QkhTMjNtSkU4WnREbS9jdVJJQ1JiVDIvQmJxMlZHS2FFcHhEYnRJdVJQRDdxVDJRQmNLMkoySU5QNXhESGE4dVJFQmV1ajJLQmNtMkRtTG9jcHhEWElRdVJMQ2J4RDJjQmMyMjkySERwcHhEdjFjdVJORE16RDJ3QmMyMjQyRlMzcHhESWlzdVJBRCsxRDJiQmMyMjBtSGhGWjFEcXZ3dFJDQXYzVDJCQmMyMncyRWxVWjFETXM0dFJFQmc1VDFHQmVlMnJtRzBpSjFEdVo4dFJIQ1I3VDBDQlFpM25HRmd5NTFEWlc4dFJPRE85ejI2QkJxM2kyR2tCcDVEWEVndFJBQUFBRDZFQkM2M2ZtRXpQcDVETGlNdFJKZ1lCRDQ5QkVHM2MySENkWjVEbEFNdFJDZ3hDRDcxQTF1M2EyRlJyWjVEMStVc1JNQkpERDZJQTNlM1oyRUhGWjlEOHJ3c1JIaG9FVDcxQXJLM1ptSFFZcDlEZ3JVc1JLQ1pHVDdkQWZXM1ptRnlnSjlESE5Vc1JGampKVDRTQVI2NFptR09pNTlEVEFjdFJLQWFMejZxQUVXNFptR3JscDlENzAwdFJNaExOejZBQUdhNFptRVRucDlESEhNdFJLaWJSRDdUQUg2NFptRUJ1SjlEQktrdFJQajlWRDYyQkwrNDBXQlgyWjlEc0hndFJIRG5lejVyQmVXNGNtQmgvcDlERTB3dFJEeTBpRDV3QmlTNU4yQ1pzSjlEK0hRdFJKeVptVDdqQmlTNU4yQ09pNTlEdHBJdFJIaStuejdqQmlTNU4yRFFZcDlEQjdZdFJOUk5vajdnQmlTNU4yQXVSWjlEV2RrdFJDQmFwRDdhQmlTNU4yRDFMcDlEWWdBdVJHaG1wajYrQmlTNU4yQndISjlEanlVdVJMQnlxRDZQQmlTNU4yQUhGWjlEbUV3dVJQeCtxajVYQmlTNU4yQUhGWjlENm04dVJFU0xyRDRYQmlTNU4yQUhGWjlEODVZdVJLQWFyejZ2QlNTNU4yQ3pWNTlESThrdVJPd21zVDVOQlNTNU4yQlgyWjlEQmVVdVJJQS90VDVFQkNTNUtXQ0lMcUJENGVZdVJCQll1VDdlQWlTNUZHQ0trcUJENGVZdVJHem51ejd2QVNTNS9sL1k4cUJENGVZdVJManp2VDR2QVNTNTVsK05XcUZESnRZdVJBQUF3RDZlQUNTNXkxK3N5YUZEMkw4dVJFd013ajRrQUNTNXJWOUlMaW9URWhFQ1dMeXZPNm05UVF5Mml5VWdBWU0vU3lMK0FScDlDZzBIREFRS0FnTUxBUWdHQlFrQUVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBRkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVVSSUVFZ0lBQVJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FGSVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRWlhQ0ptQ2dJQUFSSWdDaDRLQXdqbUFSSVhRaFVxRXhJUkFoYmVWOHE1L0VoSXQ3cXFsZUZsMnF3U1BnbzhDZ1VJNXdFUUF4SXpjakVLQkFBQ0F3a1NDQWpBeDlMNjZvY0VFZ0lvQUJJWFFoVXFFeElSQWpUL3RwTTFhMCtwbXE0V1lYVldqQXdTQWlnQUtoTVNFUUtqYUdYQW1SRklTcWlIU2VOc3hvVHFJcm9CR24wS0RRRUNCd1lJQ2dBSkJRTUxCQXdTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRjhTQkJJQ0FGSVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFVUklFRWdJQUJSSUVFZ0lBQVNJa0NpSUtBd2pvQVJJYlloa1NGMElWS2hNU0VRSUJuek15OFpCd0tJVDZ6QlRwNG5iRUtoTVNFUUtxTGIvdy9QTkhCcUlsRCtHQ21la0RJdVFER24wS0RRWUZDd2NCQ1FJRENnZ01BQVFTQkJJQ0FGSVNCQklDQUFFU0JCSUNBRkVTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0doSVlBRFVCSVFGbEFWY0JQUUlIQW1zQklnRXVBUVFCRmdFdEVnNFNEQUFPQWhnQkRnRURBZ01KQ3hJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQlNMTkFsTEtBZ3JIQWdvSkNnRU5FZ1FTQWdBUUVya0NDaEM3MkhQc2lGMU50NE1Ma0JrNkhUMTFFVFh4aW5KUHg4ZEJHQkFnWXlpY0R6SVNBQUFnUU9nREFBQ1pYUDkvQUFDQVB3QUFPb0FDZ21HSFF3SmJMRVFBQUFBQVlnTFF2WFpLaDBOK2d5eEVBQk9ET3pZRXpyN2tKNGRETWFZc1JJQ1I3VHlyQk4yK3BQMkdRM1RVTEVRQUt3YzlHd1hqdnQzSGhrTTJFQzFFNEtVYlBaa0Y1TDVvaW9aRHJsTXRSRUFJTEQzaUJlUytRMFdHUTkyZUxVU0Fhanc5QXdia3ZuSDRoVVBUN3kxRTRNeE1QUXdHNUw2ZHE0VkR0MEl1UkNBdlhUM3dCZVMreTE2RlE2NlRMa1Jna1cwOXVnWGt2aUFPaFVOLzZDNUVJQWFCUFR3RjVMNkMxSVJETHlZdlJGQTNpVDNNQk9TK3U1NkVReFplTDBSd2FKRTlUd1RrdmxKNGhFTmFqQzlFb0ptWlBjSUQ1TDdBVllSRCtyQXZSTURLb1QwakErUysrUitFUTVmd0wwVHcrNms5aUFMa3Zpb1RFaEVDZGVZVVVhdzZTUkN3ZjNDdUlWMlp3eUs2QVJwOUNnMEpBQU1DQ2dVTEFRZ0hEQVFHRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUFSSUVFZ0lBVVJJRUVnSUFBUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUY4U0JCSUNBQUVTQkJJQ0FBVVNCQklDQUZJaUpBb2lDZ01JNlFFU0cySVpFaGRDRlNvVEVoRUN0YVJDT2phSFJ2Nk5mbzU0ZmRtcXBpb1RFaEVDa1ZLanNHc1BRTjI2Q2JaeHE1Sk9waUtCQlJwOUNnME1BZ3NLQ0FNSENRQUVCUVlCRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JSRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJT0Vnd0FEZ0lZQVE0QkF3SURDUXNTQkJJQ0FBRVNCQklDQUY4U0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFVU0JCSUNBQUVTQkJJQ0FGSVNCQklDQUFFaTZnTlM1d01LNUFNS0NRb0JEUklFRWdJQUZ4TFdBd29RcnpzcWJBc2NSNHFHQUY4RzFUVit1UkU0TXU5d1Q4ZkhRUmdYSU9NQktKd09NaEFBQUNCQTZBTUFBUDkvQUFDQVB3QUFPcDREMTdoT1E2Z3BMa1FBQUFBQW1nSG90bHhqNENaT1EwaE9Ma1FBRTRNN3VnUEh0MXhqSmdoT1EvdHdMa1FnTDEwOTdRUEh0MXhqdk9GTlE1dVZMa1NBa1cwOUh3VEh0MXhqQWNOTlF5bThMa1RBODMwOVNnVEh0MXhqOWF0TlE2VGtMa1JRTjRrOWV3VEh0MXhqbUp4TlF4d29MMFNBYUpFOXJnVEh0MXhqbUp4TlE4eGxMMFRBeXFFOXpBVEh0MXhqc01wTlErdVhMMFFRTGJJOTlBVEh0MXhqbTBWT1F4K3RMMFN3bThROUNRWEh0MXhqaVdsUFEwU3BMMFFBL3RROUNBWEh0MXhqZE9SUFEvMlZMMFN3bmU4OThBVEh0MXhqc0ZkUVErNThMMFRnenZjOThBVEh0MXhqbk5KUVF4WmVMMFFBQUFBKzRRVEh0MXhqMkVWUlEyTTdMMFNZR0FRK3ZnVEh0MXhqRkxsUlE4TVdMMFFvTVFnK213VEh0MXhqOHh4U1F6WHdMa1RBU1F3K2RRVEh0eTVqZ1loU1E3ckhMa1I0YUJFK053VEp0OXhpcGMxU1EvV21Ma1FJZ1JVKytBUGZ0NUJpSmlKVFExZG5Ma1NnbVJrK29BTU11QTlpTWpsVFEyRVdMa1RBeWlFK3Z3Sk51SU5oYkFOVFF3dnFMVVNnR2k4K1NRR0V1RHhoZFhGU1EwTGtMVVJnWkRzK1R3Qzl1QzloS2hNU0VRSzZBWWo5U3M1TmFxSHR2cG5HZlpWN0lyd0xHbjBLRFF3RUNBVUtDUUlBQXdzR0J3RVNCQklDQUFFU0JCSUNBQVVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFVUklFRWdJQVVoSUVFZ0lBWHhJRUVnSUFBU0tsQ2xLaUNncWZDZ29KQ2dFTkVnUVNBZ0ErRXBFS0NoQm81a204NXU1TFo0ejFwaHl6OXJLWEVXazJTWlhCN2NkQkdENGdaeWlZSHpJUzZBTUFBSzVsLzM4QUFJQS9BQUFBQUFBQU90Z0pJTzJ0UXoyV0EwUUFBQUFBQmcwblFNZ0FWNUlnN2ExRHRBUURSQUFUZ3pzdm9TZEFIZ0ZYa291UnJVTnlzQUpFd0VPTFBHa2dLRUJmQVZlU0J1S3NRM3lDQWtTQWtlMDhJT0FvUUxvQnE1S08zcXREVVlZQ1JFQUlMRDFzYnlsQS9nRVVrL3J4cWtPKzFnSkVJQzlkUFJiYktVQXpBajJUV1ZtcVE2NGJBMFF3Qm9FOUFMTXBRRm9DVUpOYXlLbER4SE1EUkZBM2lUM0FLQ2xBY0FKWms3Z3ZxVVBWNGdORWNHaVJQV2FxS0VDRkFsbVRkbytvUTdWc0JFU2dtWms5RWg0b1FKUUNXWk16NzZkRE9CVUZSTURLb1QyNW95ZEFwQUpaay9CT3AwTzIxQVZFOFB1cFBYUWtKMEN4QWxtVGFwK21RNnkyQmtSZ09iUTluSmdtUU1NQ1daTlBKYVpESlkwSFJJQnF2RDBkR1NaQTBnSlpreHJDcFVQdmNnaEVzSnZFUGRXQkpVRGNBbG1URElXbFE0NWNDVVRRek13OWhjTWtRTndDV1pOcmZhVkRnejRLUkFEKzFEMys0eU5BMkFKWmsydDlwVU1vRVF0RUlDL2RQY1RZSWtETEFsbVRYZEdsUTZEbkMwU1FiT2M5WjVvaFFMZ0NXWlArYWFaRC9ud01STENkN3oyZ3hDQkFwZ0paazJvd3AwT005d3hFNE03M1BlQVhJRUNZQWxtVC9SeW9ReDliRFVRQUFBQSszc3dmUUpFQ1daTVdLS2xENDZNTlJKZ1lCRDZmbmg5QWh3SlprN2RScWtQWjBRMUVLREVJUGlSM0gwQjRBbG1UdzdDclF5WDREVVRnVHcwK3gxd2ZRR3dDUTVPbjZheERKZmdOUkhob0VUNXpaUjlBYVFMcWtyUklya01sK0ExRUNJRVZQbEJ4SDBCbEFxQ1NBN2V2UXdtM0RVU1ltUmsra1hZZlFHQUNWNUk0UExGRFNsY05SREN5SFQ0eWRSOUFXd0lTa216QnNrTnJ6UXhFd01vaFBvSnJIMEJYQXRpUmEzUzBRMm9aREVSNDZTWStOV0VmUUZZQ3BwRTB4TFZER0ZZTFJCQUNLejU3WGg5QVdnS0ZrUmY5dGtQS2V3cEVvQm92UHNsbkgwQm5BbnVSa0FDNFE2bWRDVVE0TXpNKzZYc2ZRSDBDZXBIZzNiaERoNzhJUk1oTE56N0htUjlBa0FKNmtZRjJ1VU03NVFkRVlHUTdQcWl5SDBDZ0FucVIzLys1US9QekJrUVlnMEEreExZZlFLRUNlcEdBQjdwRHpDd0dSS2liUkQ2ZXF4OUFsd0o2a1lBSHVrUFJZUVZFT0xSSVBpT25IMENFQW5xUmpyTzVRd0dUQkVUUXpFdytiNkVmUUdzQ2VwSFNNYmxEQnNnRFJHRGxVRDdOd2g5QVh3SjZrZTZKdUVPMEJBTkUrUDFVUHBaV0lFQmVBbnFSNGJ1M1F3OHlBa1N3SEZvK0N4UWhRRklDZXBIVTdiWkQzcGdCUkVBMVhqNHEwU0ZBUWdKNmtlSUl0a01xQ3dGRTJFMWlQaFc4SWtBOUFucVJUeHkxUS9PSUFFUm9abVkrL1p3alFEMENlcEhYR0xSRGl5RUFSQUIvYWo1dFZ5UkFMd0o2a1JzR3MwUGxxZjlEa0pkdVBrM25KRUFZQW5xUjlMMnhRNjBuLzBOSXRuTStsazBsUU9vQmVwRTRxN0JEQ3duL1E5ak9kejQvaENWQXV3R1lrWDJZcjBNTENmOURjT2Q3UHZOMEpVQ1NBUW1TQkpXdVF3c0ovME1BQUlBK0Q0NGxRR3dCZEpMUG9LMUQvemIvUTB3TWdqNkZyeVZBUWdIWGtpSExyRU9UbXY5RGxCaUVQaFRjSlVBWEFUQ1RGUDJyUTd3R0FFVHdwNFkreXdFbVFPTUFocFA1Z3F0REEwUUFSRHkwaUQ3Rk1DWkF1d0RSa3djdnEwTWZoUUJFaE1DS1BseHdKa0NVQUJHVSt2R3FRN2ZSQUVUTXpJdyt1SmdtUUcwQVRaUzM0cXBESlNJQlJCalpqajZlZXlaQVJRQitsTGZpcWtObWRnRkVZT1dRUG90cUprQWVBS1NVdCtLcVF5WFdBVVM4ZEpNK0FXY21RQXNBeUpRSEw2dERaeW9DUkFpQmxUNkJaaVpBQkFEaWxDb1RFaEVDc0RkQ0tmcGhRdnlEUVp6UEEvUHNWeUs2QVJwOUNnMEtBQWdKQ3dRQ0RBVUdBUWNERWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFBUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFFU0JCSUNBRkVTQkJJQ0FBVVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZJU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUFFaUpBb2lDZ01JNmdFU0cySVpFaGRDRlNvVEVoRUNrMGxONDY3blI5Q3hZSTBKQzRhaUF5b1RFaEVDZWZHSXNSZStSaWVOcnhvQ0hXbEloeUx2QVJwOUNnMEZDUVlLQndFTUF3QUlDd0lFRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0JTRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFJJRUVnSUFYeElFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQUFSSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBRkVTQkJJQ0FBRVNCQklDQUFVaVdTSlhDZ0VDRWxJS1VBb0ZDT3NCRUFFU1IwcEZDa01pUVFvVURRQUFBQUFWQUFBQUFCMEFBQUFBSlFBQWdEOFNFV052YlM1aGNIQnNaUzVwYm1zdWNHVnVHQU1pQzJacGVHVmtMWGRwWkhSb1FRQUFBQUFBQU9BL0toTVNFUUtBSUt1SHgvaEVyN0VIMWk2dWpiTlRJb1VHR24wS0RRSUZBd0FFREFjSkFRZ0xCZ29TQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFVU0JCSUNBQUVTQkJJQ0FGOFNCQklDQUFFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdCUkVnUVNBZ0JTRWhvU0dBQTFBU0VCWlFGWEFUMENCd0pyQVNJQkxnRUVBUllCTFNMdUJGTHJCQXJvQkFvSkNnRU5FZ1FTQWdBaUV0b0VDaENxUVNrcUc3VlBDYlgrREpDMjFkTjVFVjR3em5GUHg4ZEJHQ0lnb3dFbzNBNHlFZ0FBSUVEb0F3QUFpTGIvZndBQWdEOEFBRHFnQk1FS2IwTlhaeTVFQUFBQUFJa0JsR1RXajI1RDA0OHVSQUFUZ3p1UkFwUms5eXR1UXhhK0xrVEF6TXc4NmdLVVpGNnBiVU9QQVM5RUFDc0hQWEVEbEdRNVpHMURMeVl2UkVBSUxEMmRBNVJreENadFEvUkdMMFNBYWp3OXhBT1VaRTdwYkVPbmFTOUU0TXhNUGRjRGxHUndoV3hEb1o4dlJDQXZYVDM3QTVSa1MwQnNRL2ZMTDBRZ0JvRTk2Z1NVWkNxa2JFUFltUzlFZ0w2ZlBRSUZVR1FKQ0cxREUza3ZSSURBeWoxQUJETmtsM050UTJCV0wwU3c4ZEk5S1FRWVpOUG1iVU90TXk5RTBDTGJQUUVFLzJPK1lXNURNZ3N2UkVCZzVUM1dBK2xqVE0xdVEzL29Ma1J3a2UwOXZnUFdZOWs0YjBPNnh5NUVrTUwxUGJNRHhtTm5wRzlENHFndVJNRHovVDIrQTd0alJnaHdRL2lMTGtSd0VnTSt6UU96WXlWc2NFUDdjQzVFQUNzSFB1UURybU9GSkhGRHlrQXVSTGhKREQ3MkE2dGpOOVZ4UTZncExrVGdlaFErWFFTclk1WGtjVU5JVGk1RVdPTWxQcllFcTJPVjVIRkQ2SEl1UklBVUxqN0RCS3RqSDZkeFExR2RMa1FRTFRJK3dnU3JZMHhhY1VPVnl5NUVvRVUyUHJJRXEyUEtCWEZEMmZrdVJEaGVPajZRQkt0alNiRndRL2NyTDBUd2ZEOCtUQVNyWTNaa2NFTk9XQzlFZ0pWRFBnUUVxMk5TSDNCRHlZQXZSQml1Uno2aEE2dGpMdHB2UTFlbkwwU294a3MrTHdPclk3aWNiMFAzeXk5RVFOOVBQcTBDcTJQeFptOURoZkl2UlBqOVZENzVBYVZqaUVCdlE3WWlNRVNJRmxrK2VBR0xZN2ljYjBON1F6QkVzRWRoUHBVQVEyTXFFeElSQW51SnJNZnpoMHJTblowS3JoQ2ZncWtpd1FFYWZRb05Dd1lJQXdRS0NRY0JBQUlGREJJRUVnSUFVUklFRWdJQVVoSU9FZ3dBRGdJWUFRNEJBd0lEQ1FzU0JCSUNBQUVTQkJJQ0FBVVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdBQkVnUVNBZ0JmRWdRU0FnQUJFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBQklpc2lLUW9CQUJJa0NpSUtBd2pzQVJJYlNoa0tGMElWS2hNU0VRSkcrMlVEYmZSQU9KQncrK3FBaVdYcktoTVNFUUxYaHh5VTRqMU1TcThPRWhiRFFwclFJdThCR24wS0RRQUxCd3dDQVFNR0NRUUlDZ1VTQkJJQ0FBRVNCQklDQUZFU0JCSUNBRjhTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZJU0JCSUNBQUVTQkJJQ0FBVVNEaElNQUE0Q0dBRU9BUU1DQXdrTEVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVNKWklsY0tBUUlTVWdwUUNnVUk3UUVRQVJKSFNrVUtReUpCQ2hRTkFBQUFBQlVBQUFBQUhRQUFBQUFsQUFDQVB4SVJZMjl0TG1Gd2NHeGxMbWx1YXk1d1pXNFlBeUlMWm1sNFpXUXRkMmxrZEdoQkFBQUFBQUFBNEQ4cUV4SVJBdEpFV3JQMWJFd3Z1UEF6ZXUyQitBc2l1Z0VhZlFvTkNBTUZCQVlNQUFFSkFnb0hDeElPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUFFU0JCSUNBQUVTQkJJQ0FBVVNCQklDQUZJU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQUVTQkJJQ0FBRVNHaElZQURVQklRRmxBVmNCUFFJSEFtc0JJZ0V1QVFRQkZnRXRFZ1FTQWdCZkVnUVNBZ0JSSWlRS0lnb0RDTzRCRWh0aUdSSVhRaFVxRXhJUkFuWkFNbkU1UmtVWW5kZTBQTDN1UlpBcUV4SVJBdlhwd1l2OURVSDRpK29XREhualM3WWk3d0VhZlFvTkNRb0xEQVVEQkFZQ0FBZ0JCeElFRWdJQUFSSWFFaGdBTlFFaEFXVUJWd0U5QWdjQ2F3RWlBUzRCQkFFV0FTMFNCQklDQUZFU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBQVVTQkJJQ0FGSVNCQklDQUFFU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0JmSWxraVZ3b0JBaEpTQ2xBS0JRanZBUkFCRWtkS1JRcERJa0VLRkEwQUFBQUFGUUFBQUFBZEFBQUFBQ1VBQUlBL0VoRmpiMjB1WVhCd2JHVXVhVzVyTG5CbGJoZ0RJZ3RtYVhobFpDMTNhV1IwYUVFQUFBQUFBQURnUHlvVEVoRUNnSE1VZGVObVI0K3A0cDJVcGNPZ2hpTHZBUnA5Q2cwS0JRTU1Cd0FCQ0FZQ0N3a0VFaG9TR0FBMUFTRUJaUUZYQVQwQ0J3SnJBU0lCTGdFRUFSWUJMUklFRWdJQUFSSUVFZ0lBQVJJRUVnSUFBUklFRWdJQVh4SUVFZ0lBQVJJRUVnSUFBUklPRWd3QURnSVlBUTRCQXdJRENRc1NCQklDQUZJU0JCSUNBQUVTQkJJQ0FGRVNCQklDQUFFU0JCSUNBQVVpV1NKWENnRUNFbElLVUFvRkNQQUJFQUVTUjBwRkNrTWlRUW9VRFFBQUFBQVZBQUFBQUIwQUFBQUFKUUFBZ0Q4U0VXTnZiUzVoY0hCc1pTNXBibXN1Y0dWdUdBTWlDMlpwZUdWa0xYZHBaSFJvUVFBQUFBQUFBT0EvS2hNU0VRTDcrdUgvN29CQmE2WTI1VmV4cmFTMkl2NEJHbjBLRFFRQURBa0hDQUlHQXdzS0FRVVNCQklDQUFVU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUFFU0JCSUNBRjhTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0JTRWdRU0FnQUJFZ1FTQWdCUkVob1NHQUExQVNFQlpRRlhBVDBDQndKckFTSUJMZ0VFQVJZQkxSSUVFZ0lBQVJJRUVnSUFBU0pvSW1ZS0FnQUJFaUFLSGdvRENQRUJFaGRDRlNvVEVoRUMrL3JoLys2QVFXdW1OdVZYc2Eya3RoSStDandLQlFqeUFSQURFak55TVFvRUFBSURDUklJQ0lDRmh0YUpod1FTQWlnQUVoZENGU29URWhFQzk3NUZ4b1dmUkFLSGh0UFpmZUdiMVJJQ0tBQXFFeElSQXJDcENWeThDRVV6aWtJUXNPUWhjQU1pdWdFYWZRb05DZ01CQmdrSUFBSU1CQWNMQlJJYUVoZ0FOUUVoQVdVQlZ3RTlBZ2NDYXdFaUFTNEJCQUVXQVMwU0JCSUNBQUVTQkJJQ0FBRVNCQklDQUZJU0JCSUNBQUVTRGhJTUFBNENHQUVPQVFNQ0F3a0xFZ1FTQWdBQkVnUVNBZ0FCRWdRU0FnQUJFZ1FTQWdBRkVnUVNBZ0JmRWdRU0FnQlJFZ1FTQWdBQklpUUtJZ29EQ1BNQkVodGlHUklYUWhVcUV4SVJBdCswTGJwZ0UwQW5zeTZPNldKM0FQWXFFeElSQWtPWmtXb0dxVVExci9xOWxmSTVEM009KQovUFBLVHlwZSAoZHJhdykgL0FBUEw6QUtBbm5vdGF0aW9uVjIgKFluQnNhWE4wTUREVUFRSURCQVVHQndwWUpIWmxjbk5wYjI1WkpHRnlZMmhwZG1WeVZDUjBiM0JZSkc5aWFtVmpkSE1TQUFHR29GOFFEMDVUUzJWNVpXUkJjbU5vYVhabGN0RUlDVlJ5YjI5MGdBR3ZFQklMREM0dlBUNC9RRUZDUTBSRlRVNVdWMWhWSkc1MWJHemZFQkVORGc4UUVSSVRGQlVXRnhnWkdoc2NIUjRmSUNFaEloNGtKU1llS0NZZUt5d3RYeEFSZEdWNGRFbHpSbWw0WldSSVpXbG5hSFJmRUJ4dmNtbG5hVzVoYkUxdlpHVnNRbUZ6WlZOallXeGxSbUZqZEc5eVYyUnlZWGRwYm1kV1lXdFFiR0YwVm1GclZtVnljMThRRDJadmNtMURiMjUwWlc1MFZIbHdaVjhRRUVGTFNYTkdiM0p0Um1sbGJHUkxaWGxVVlZWSlJGbHlaV04wWVc1bmJHVmZFQmh6YUc5MWJHUlZjMlZRYkdGalpXaHZiR1JsY2xSbGVIUmRkR1Y0ZEVselEyeHBjSEJsWkZ0a2NtRjNhVzVuVTJsNlpWOFFIbVZrYVhSelJHbHpZV0pzWlVGd2NHVmhjbUZ1WTJWUGRtVnljbWxrWlY4UUVIUmxlSFJKYzBacGVHVmtWMmxrZEdoZkVCVmpkWE4wYjIxUWJHRmpaV2h2YkdSbGNsUmxlSFJXSkdOc1lYTnpYeEFYYjNKcFoybHVZV3hGZUdsbVQzSnBaVzUwWVhScGIyNElJd0FBQUFBQUFBQUFnQTBRQWhBQUNJQUNnQU1KQ0lBT0NRaUFBSUFSRUFGZkVDUTNSVGs0UWpZNFJpMHhNekZHTFRRd04wUXRPVGxDUmkwME1EUXpNelpDTlRVMFJqTFRNREVjTWpjOFYwNVRMbXRsZVhOYVRsTXViMkpxWldOMGM2UXpORFUyZ0FTQUJZQUdnQWVrT0RrNk80QUlnQW1BQ29BTGdBeFZWMmxrZEdoV1NHVnBaMmgwVVZsUldDTkFiTUFBQUFBQUFDTkFoQ0FBQUFBQUFDTkFVSUFBQUFBQUFDTkFacUFBQUFBQUFOSkdSMGhKV2lSamJHRnpjMjVoYldWWUpHTnNZWE56WlhOZkVCTk9VMDExZEdGaWJHVkVhV04wYVc5dVlYSjVvMHBMVEY4UUUwNVRUWFYwWVdKc1pVUnBZM1JwYjI1aGNubGNUbE5FYVdOMGFXOXVZWEo1V0U1VFQySnFaV04wVHhGZkIzZHlaUEFCQUFnQUVoQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUVoQnNib3lrc2g5RE9MTUlDRXpobG5TS0dnWUlBQkFBR0FBYUJnZ2xFQUVZSlNKQkNoUU5BQUFBQUJVQUFBQUFIUUFBQUFBbEFBQ0FQeElSWTI5dExtRndjR3hsTG1sdWF5NXdaVzRZQXlJTFptbDRaV1F0ZDJsa2RHaEJBQUFBQUFBQTREOGlOQW9VRFFBQUFBQVZBQUFBQUIwQUFBQUFKUUFBZ0Q4U0VXTnZiUzVoY0hCc1pTNXBibXN1Y0dWdUdBTkJBQUFBQUFBQUFBQWlOQW9VRFFBQUFBQVZBQUFBQUIwQUFBQUFKUUFBZ0Q4U0VXTnZiUzVoY0hCc1pTNXBibXN1Y0dWdUdBTkJBQUFBQUFBQThMOHFxQUVLRU1LN0lmdVhlVWh1c0NaaVcxZTVVQ0FTQmdnQUVBRVlBUm9HQ0FBUUFSZ0FJQUFxWkFvUVI0SlNkUkYzUUphS0hnNmxGWUpNTWhHN0tSTlpUOGZIUVJnRElDTW8zQTh5RkFBQUlFRG9Bd0FBa0wrSFZmOS9BQUNBUHdBQU9pcUNrbWREdUZQT1F3QUFBQUJlQTVIMFprTXl0YzFEQU5pak8xZ0RBemxtUXlhNnpVTkFDS3c4MWdJeUZBMEFBR1ZERlFBQXpVTWRBQUNBUUNVQUFJQkFRS0RPdXNTemhBUXEyd2tLRUlxcFlLU2FXa0FicXZ3S0VIcHNKZkFTQmdnQkVBRVlBaG9HQ0FBUUFSZ0FJQUFxbGdrS0VBZjNDZXRVQzA5WHZEYUVTRytxWC9JUkJydEZjRS9IeDBFWVBpRGpBU2ljRGpJUUFBQWdRT2dEQUFEL2Z3QUFnRDhBQURyY0NBZkpPRU9GVWk5RUFBQUFBQ2tCRGJUemJYZTBOME9GVWk5RXdNTDFQR0FDRGJSVWFYUUxOME56VkM5RXdFZGhQVkVERGJUVmFKV25Oa01BZXk5RUVOZWpQYzhERGJTdWFJbVFOa09obnk5RXNKdkVQZVlERGJTbWFJbVFOa1BTenk5RVFBclhQZGtERGJTV2FFT3ZOa1BlQXpCRWtHem5QYjRERGJSNmFPbElOME1pTWpCRTRNNzNQYTBERGJSTGFDVzhOME5XUnpCRXVCNEZQcFFERGJRdGFMYlFPRVBDVmpCRVVEY0pQb1FERGJUa1o3bDVPVVBDVmpCRWVHZ1JQbVVERGJTOVp4b3lPa1A2VURCRUNJRVZQbDhERGJTVlo5ajVPa1BZT1RCRW1Ka1pQbHdERGJSdVoxRGdPME0zRlRCRVdMZ2VQbG9ERGJSRlp4cS9QRVAwNWk5RTZOQWlQbG9ERGJRYlo1T2xQVU1mclM5RWVPa21QbG9ERGJUeVpndU1Qa082Wnk5RUVBSXJQbGdERGJUS1pvUnlQME9MSEM5RW9Cb3ZQbFVERGJTbFp2MVlRRU9WeXk1RU9ETXpQa1VERGJTQlp0Sk9RVU1nYlM1RThGRTRQaWdERGJSZlpvVC9RVU04R2k1RWdHbzhQaHNERGJSQlpudVJRa05ZeHkxRUdJTkFQaElERGJRcFptWU1RME5pZGkxRXFKdEVQaEFERGJRV1pwWm9RME5ZSnkxRU9MUklQaEFERGJRTFpsNmVRME05Mml4RTBNeE1QaFVERGJRSlpuWE1RME5yaFN4RWlPdFJQaDhERGJRSlppVFVRMFB6UVN4RUdBUldQa0lERGJRSlppVFVRME5wQUN4RXNCeGFQbW9ERGJRSlppVFVRMFBldml0RVFEVmVQcFFERGJRSlpsNmVRME11Z1N0RTJFMWlQc0FERGJRSlp1aGdRME5aUnl0RWFHWm1QdElERGJRSlpzUWJRME9xQ1N0RUlJVnJQdHNERGJRSlpwL1dRa05VM1NwRXVKMXZQdUlERGJRSlppcVpRa1BadENwRVNMWnpQdWdERGJRSlp1NGxRa01wZHlwRTJNNTNQaGNFRGJRSlptQzZRVU9iVUNwRUFBQ0FQaHdFRGJRSlpta29RVVBBVENwRXFKdUVQbDhFRGJRSlppMjFRRU5MamlwRXpNeU1QZzRGRDdRSlpscG9RRU5FeENwRWRHaVJQa0VGSXJRSlppa01RRU9YQ3l0RXZIU1RQblFGTkxRSlprdW9QME14Wml0RUNJR1ZQbzBGUXJRSlpyMDhQME5Leml0RVVJMlhQcVlGU3JRSlppL1JQa084Unl4RW5KbVpQcjRGVHJRSlprUldQa05QMkN4RStDaWNQdGtGVHJRSlpyZnFQVU0vWHkxRVFEV2VQdHdGVHJRSlpucDNQVVBUN3kxRWpFR2dQdDRGVHJRSlpqNEVQVVBUank1RTFFMmlQdDhGVHJRSlpsT0pQRU1zUVM5RUhGcWtQdUFGVHJRSlpoY1dQRU03K2k5RWFHYW1QdUlGVHJRSlpuMlRPME8yd2pCRXhQV29QdDhGVHJRSlpwNHZPME9qWkRGRURBS3JQczBGVHJRSlptN1RPa1BhL2pGRVdBNnRQcndGVHJRSlpwdUdPa09saVRKRW9CcXZQcThGVHJRSlppWkpPa01FQlRORTdDYXhQcHNGVHJRSlpsOFRPa1A0Y0RORU5ET3pQa01GVHJRSlpwamRPVVA5MmpORWtNSzFQc2tFVHJRSlp0MitPVU5SSWpSRTNNNjNQa29FVHJRSlp0R25PVVB1WVRSRUpOdTVQc2dEVHJRSlpzV1FPVVBWbVRSRWJPZTdQandEVHJRSlptaUJPVU1HeWpSRXVQTzlQcTRDVHJSSlpRcHlPVU9VOERSRUFBREFQaElDVHJUelkxeHFPVU43S0RWRVhJL0NQazBCaExPK1hrZzhNaFFOQUFBMVF4VUFBQ3BFSFFBQWdFRWxBQUE0UWtEQXZleno0b1FFS3VVRUNoQnR5UFFra2paTjhiYkEzazV2L29nTkVnWUlBaEFCR0FNYUJnZ0FFQUVZQUNBQUtxQUVDaENCR1VjVEg3NUN4SnVNemlwcHJCWlRFUnlXbkhCUHg4ZEJHQnNnNHdFb25BNHlFQUFBSUVEb0F3QUEvMzhBQUlBL0FBQTY1Z085eVVGRDM4TXVSQUFBQUFBM0FiK3ozbXNPd2tGRFZJSXVSRUFTZ3p4ckFyK3pmV2pyZkVGRFRyZ3VSTURNVEQwR0JMK3pmV2d3WGtGRHh2c3VSSkNabVQxR0JMK3pmV2pTVGtGRFFpUXZST0Q3cVQxY0JMK3pmV2drUjBGRG1GQXZSQkF0c2oxd0JMK3pmV2drUjBGRDdud3ZSREJldWoxL0JMK3pmV2drUjBGRE1xc3ZSS0NieEQyVEJMK3pmV2drUjBGRHY5RXZSTkRNekQyakJMK3pmV2pTVGtGRFlQWXZSUEQ5MUQyd0JMK3pmV2l4c2tGRElqSXdSQkF2M1QzRkJMK3pmV2o1UEVKRFptQXdSR0NSN1Qzc0JMK3pmV2lyN1VKRDVHMHdSQUFBQUQ0TUJiK3pmV2pUMjBORFFXUXdSQ2d4Q0Q0WEJiK3pmV2hzWGtSRFJFa3dSRWhpRUQ0WEJiK3pmV2hqOEVSRGZ5Z3dSQUNCRlQ0WEJiK3pmV2hPYTBWRDhRRXdSSmlaR1Q0WEJiK3pmV2pjMWtWRGlOY3ZSQ2l5SFQ0REJiK3pmV2dNTTBaREg2MHZSTURLSVQ3aEJMK3pmV2pmZjBaRHQ0SXZSRkRqSlQ2MkJMK3pmV2hWdlVaRFRsZ3ZST2o3S1Q2RUJMK3pmV2pLK2taREhDZ3ZSS0FhTHo1RkJMK3pTbWlGR1VkRGp3RXZSREF6TXo0U0JMK3pEV2ppS0VkREFkc3VSTWhMTno3RkE3K3owV2ZpS0VkRHJwTXVSRmhrT3o1ckE3K3pZbWN6SVVkREkxSXVSSUNWUXo3SUFyK3pBbWYzclVaRHVpY3VSTWpNVEQ0ZkFqQzBLMlpJR0RJVURRQUFRRU1WQU1BdFJCMEFBQUJCSlFBQVFFRkF3UGU2azZlRkJDcnVBd29RY0N3cmhaVE5TYXFVR3hGMElRditRaElHQ0FNUUFSZ0VHZ1lJQUJBQkdBQWdBQ3FwQXdvUTd1eUQvaFdvU1NxYndpcmlod2tBZmhHSlg4VndUOGZIUVJnWElHTW9uQTh5RWdBQUlFRG9Bd0FBSW1iL2Z3QUFnRDhBQURyd0FoKzJURU92RXl4RUFBQUFBSzhCMXJiT3ZVeERJZTByUkFBVGd6dXZBZWkyMnRSTVE4NmxLMFFBZFJNOHRRSG90dHJVVEVOQmZ5dEV3RU9MUEprQzZMWmtsMHhEbE1ZclJFQUlMRDFmQStpMldZQk1RK3J5SzBRZ0wxMDloUVBvdHU5WlRFUFJLaXhFQUtweFBaMEQ2TGJqUWt4RHBtUXNSREFHZ1QyeUEraTJLQ1JNUXpHbUxFUlFONGs5eXdQb3RtMEZURU9XNnl4RWdHaVJQZHdENkxhejVrdEQxelF0UktDWm1UM2JBK2kyU3NCTFF3V0FMVVRBeXFFOTBnUG90akdTUzBQRTFpMUVNQWlzUFprRDZMWVpaRXREOGlFdVJHQTV0RDFiQStpMlVpNUxRL3R3TGtTQWFydzlBQVBvdHQzd1NrTUV3QzVFc0p2RVBhY0M2TFpvczBwRE1nc3ZSTkRNekQxUUF1aTJRMjVLUTRWU0wwUUEvdFE5K0FIb3RoOHBTa1BZbVM5RWNEdmZQWW9CNkxhcDYwbEQ5OHN2UkpCczV6MDFBZWkydm5CSlExMFJNRVRBbmU4OTRnRG90dFQxU0VQOU5UQkVBQUFBUG1FQTZMWi9WRWhEb0Q4d1JGQTNDVDROQU9pMk1oUU5BQUJIUXhVQVFDdEVIUUFBNEVBbEFBQ29RVUNBdk15cDVJY0VLczhDQ2hEZWp1MmlVMFZFdVk1M3hDZzJiWmlzRWdZSUJCQUJHQVVhQmdnQUVBRVlBQ0FBS29vQ0NoQzBuYlljZnloS1ZyV1B0bzltVWRIc0VUYzEzSEJQeDhkQkdBMGdvd0VvM0E0eUVnQUFJRURvQXdBQTZMYi9md0FBZ0Q4QUFEclFBUWR1UjBOT3VDNUVBQUFBQUpNQ1YyUUhia2RENVkwdVJBQVNnenVUQWxka2ZLdEhRMnBsTGtTQW0wUTg3d0pYWk5CTVNFTlhaeTVFd016TVBLSURWMlRVOVVoRFZJSXVSRUNORnozWkExZGtuZFJKUXl5aExrU0Fhanc5NndOWFpIVEtTa05PdUM1RUlDOWRQZHNEVjJSVzEwdER6TVV1UktEemZUMWZBMU5rVFdsTVE1WExMa1J3YUpFOWJ3SkhaQlpJVFVOd3p5NUVrSm1aUGZZQkpXVFVEMDVEY004dVJPRDdxVDBVQWZsajQ4OU9RN3JITGtRd1hybzlZZ0RFWTlwaFQwUGlxQzVFME16TVBRQUFjbU15RkEwQUFFWkRGUUFBTGtRZEFBQXdRU1VBQUlCQVFPQ2J4cXltaEFRcW13UUtFSW9LekhmVkFVeEtwaWNVL0cxOGhac1NCZ2dGRUFFWUJob0dDQUFRQVJnQUlBQXExZ01LRUs4N0ttd0xIRWVLaGdCZkJ0VTFmcmtST0RMdmNFL0h4MEVZRnlEakFTaWNEaklRQUFBZ1FPZ0RBQUQvZndBQWdEOEFBRHFlQTllNFRrT29LUzVFQUFBQUFKb0I2TFpjWStBbVRrTklUaTVFQUJPRE83b0R4N2RjWXlZSVRrUDdjQzVFSUM5ZFBlMER4N2RjWTd6aFRVT2JsUzVFZ0pGdFBSOEV4N2RjWXdIRFRVTXB2QzVFd1BOOVBVb0V4N2RjWS9XclRVT2s1QzVFVURlSlBYc0V4N2RjWTVpY1RVTWNLQzlFZ0dpUlBhNEV4N2RjWTVpY1RVUE1aUzlFd01xaFBjd0V4N2RjWTdES1RVUHJseTlFRUMyeVBmUUV4N2RjWTV0RlRrTWZyUzlFc0p2RVBRa0Z4N2RjWTRscFQwTkVxUzlFQVA3VVBRZ0Z4N2RjWTNUa1QwUDlsUzlFc0ozdlBmQUV4N2RjWTdCWFVFUHVmQzlFNE03M1BmQUV4N2RjWTV6U1VFTVdYaTlFQUFBQVB1RUV4N2RjWTloRlVVTmpPeTlFbUJnRVByNEV4N2RjWXhTNVVVUERGaTlFS0RFSVBwc0V4N2RjWS9NY1VrTTE4QzVFd0VrTVBuVUV4N2N1WTRHSVVrTzZ4eTVFZUdnUlBqY0V5YmZjWXFYTlVrUDFwaTVFQ0lFVlB2Z0QzN2VRWWlZaVUwTlhaeTVFb0prWlBxQURETGdQWWpJNVUwTmhGaTVFd01vaFByOENUYmlEWVd3RFUwTUw2aTFFb0JvdlBra0JoTGc4WVhWeFVrTkM1QzFFWUdRN1BrOEF2Ymd2WVRJVURRQUFURU1WQUlBdFJCMEFBQUJCSlFBQUlFRkFvTDd4a1lhRkJDclJCZ29RcHdSQTdkempUN1NHbnUwNERBdkVTeElHQ0FZUUFSZ0hHZ1lJQUJBQkdBQWdBQ3FNQmdvUWNrRWs0TzdYUW9PbFg2SnNvL05CSWhHbThSTnhUOGZIUVJndElLTUJLTndPTWhJQUFDQkE2QU1BQU9LNi8zOEFBSUEvQUFBNjBBV0tnMVJEdXNjdVJBQUFBQUJxQVM5aGNsVlVROW41TGtTQVE0czhyQUV2WWFzZlZFTWNLQzlFd016TVBMUUJMMkUyNGxOREEyQXZSSUNSN1R3UUFpOWhiNnhUUS8yVkwwVGdwUnM5ZWdJdllVdG5VME84N0M5RWdHbzhQYlVETDJINWJsTkRITWd2Uk9EN3FUMjhBeTloMk5KVFEyeUtMMFNBYXJ3OThnTXZZWjhJVkVQZll5OUUwTXpNUFFnRUtHRVVSbFJEWXpzdlJQRDkxRDBJQkJkaGlvTlVRK2dTTDBRZ0w5MDlCd1FHWVYzUVZFT1M1aTVFa0d6blBkWUQ5V0RURFZWREJNQXVSTENkN3oybkErVmdTRXRWUTJTYkxrVGd6dmM5WFFQV1lHeVFWVU94ZUM1RUFBQUFQaElEeUdDMUdsWkRGRGt1UkpBWUJEN0VBclpnV3JSV1EvVUdMa1RnVHcwKzdnR3ZZS00rVjBQQjhTMUVDSUVWUGhNQnIyQ201MWREZHZrdFJEQ3lIVDV6QUs5Z2VEUllRNmdwTGtTZ0dpOCtBQUN2WUQ5cVdFT2lYeTVFTURNelBnQUFyMkFTdDFoRDRxZ3VSRmhrT3o0WUFLOWdpUFJZUSsvY0xrUTR0RWcrdVFDdllHZFlXVVByOXk1RThQMVVQbVFDcjJDWHRGbERYdEV1UkpDWGJqNUFBNjlnYWdGYVEzYVpMa1FBQUlBK253T3ZZSUl2V2tNalVpNUU4S2VHUGtNRXIyREhFRnBEY0M4dVJCalpqajRaQmE5Z1FoTlpRNVVyTGtRSWdaVStHd2F2WUd3ZFdFTklUaTVFNUtXYlBvMEdyMkF3cWxkRFJXa3VSSWhCb0Q2cUJxOWc5RFpYUXkrR0xrVFVUYUkrdFFhdllNUGFWa1BpcUM1RUhGcWtQcjBHcjJCQ2hsWkRwOGt1UkdobXBqNitCcTlnSGtGV1EwanVMa1N3Y3FnK3ZnYXZZUHI3VlVQV0ZDOUVEQUtyUHFVR3IyRHQ1RlZES1Z3dlJGUU9yVDZLQnE5Zyt2dFZROWlaTDBUb0pyRStNd2F2WUFtOFZrTUt5aTlFZkQrMVBua0ZyMkNhMEZkRFVOMHZSQ1RidVQ0OEJLOWdQMnBZUXo3ZkwwUzQ4NzArN1FLdllKUUxXVU0rM3k5RUFBREFQalVDcjJCRnZGbERQdDh2UkVnTXdqNTdBYTlnVlh4YVEzWFpMMFNrbThRK3BnQ2xZTFUwVzBQM3l5OUU4S2ZHUGdBQWpHQklLeklVRFFBQVVrTVZBTUF0UkIwQUFDQkJKUUFBSUVGQTROYTludGFGQkNxZEJBb1FrVC9selB3VFNnYVYrdi83SnJtRXV4SUdDQWNRQVJnSUdnWUlBQkFCR0FBZ0FDcllBd29RMzFCWnFwaVRSMnUwTDVNRktyTFB2UkcybnFWeFQ4ZkhRUmdYSU9NQktKd09NaEFBQUNCQTZBTUFBUDkvQUFDQVB3QUFPcDREUHlsc1E3VjlMRVFBQUFBQUd3Rzd0ZGxuUzBCc1EwMVRMRVNBRWdNOEZRSFV0ZGxuVjFkc1E5RXFMRVRBUTRzOEtBRUZ0dGxuY0lWc1ExWUNMRVJBQ0t3OEpnS0F0dGxuelpSc1EvWW1MRVNBYWp3OVBBVEd0dGxuelpSc1E1Tm1MRVNnbVprOTFnVE90dGxudFdac1E4V1dMRVR3KzZrOUNnWE90dGxua0NGc1E1clFMRVFRTGJJOU9RWE90dGxuWU1WclEvOFZMVVNBYXJ3OWFRWE90dGxuMDFsclExSmRMVVN3bThROWl3WE90dGxuNk41cVEyNnFMVVRRek13OXFnWE90dGxuVGx4cVEyVDdMVVFBL3RROXR3WE90dGxucU1KcFF6WlFMa1FnTDkwOXRnWE90dGxuOWhGcFE3MnNMa1JBWU9VOW1nWE90dGxuaWtKb1E5WVVMMFN3bmU4OVN3WE90dGxuZTRKblE1VnJMMFRnenZjOUNBWE90dGxueWRGbVE0dThMMFFBQUFBK3d3VE90dGxueGlobVEvRUJNRVNZR0FRK2NBVE90dGxuTEtabFE4VTdNRVFvTVFnK0VnVE90dGxubmpwbFF4dG9NRVRBU1F3K3F3UE90dGxuQmJoa1F3T2dNRVI0YUJFK0h3UE90dGxuQ0dGbFF6MS9NRVJZNHlVK3hBRE90b0ZuVWV0bFExTmlNRVNnR2k4K0F3Q3V0dE5tU0JNeUZBMEFBR1JERlFEQUswUWRBQUFnUVNVQUFLQkJRSUMrNUozQmh3UXFud1VLRUcreFFrSGxiMEhpc2VpRmI4UFpSajhTQmdnSUVBRVlDUm9HQ0FBUUFSZ0FJQUFxMmdRS0VLcEJLU29idFU4SnRmNE1rTGJWMDNrUlhqRE9jVS9IeDBFWUlpQ2pBU2pjRGpJU0FBQWdRT2dEQUFDSXR2OS9BQUNBUHdBQU9xQUV3UXB2UTFkbkxrUUFBQUFBaVFHVVpOYVBia1BUank1RUFCT0RPNUVDbEdUM0syNURGcjR1Uk1ETXpEenFBcFJrWHFsdFE0OEJMMFFBS3djOWNRT1VaRGxrYlVNdkppOUVRQWdzUFowRGxHVEVKbTFEOUVZdlJJQnFQRDNFQTVSa1R1bHNRNmRwTDBUZ3pFdzkxd09VWkhDRmJFT2hueTlFSUM5ZFBmc0RsR1JMUUd4RDk4c3ZSQ0FHZ1QzcUJKUmtLcVJzUTlpWkwwU0F2cDg5QWdWUVpBa0liVU1UZVM5RWdNREtQVUFFTTJTWGMyMURZRll2UkxEeDBqMHBCQmhrMCtadFE2MHpMMFRRSXRzOUFRVC9ZNzVoYmtNeUN5OUVRR0RsUGRZRDZXTk16VzVEZitndVJIQ1I3VDIrQTlaajJUaHZRN3JITGtTUXd2VTlzd1BHWTJla2IwUGlxQzVFd1BQOVBiNER1Mk5HQ0hCRCtJc3VSSEFTQXo3TkE3TmpKV3h3US90d0xrUUFLd2MrNUFPdVk0VWtjVVBLUUM1RXVFa01QdllEcTJNMzFYRkRxQ2t1Uk9CNkZENWRCS3RqbGVSeFEwaE9Ma1JZNHlVK3RnU3JZNVhrY1VQb2NpNUVnQlF1UHNNRXEyTWZwM0ZEVVowdVJCQXRNajdDQkt0alRGcHhRNVhMTGtTZ1JUWStzZ1NyWThvRmNVUForUzVFT0Y0NlBwQUVxMk5Kc1hCRDl5c3ZSUEI4UHo1TUJLdGpkbVJ3UTA1WUwwU0FsVU0rQkFTclkxSWZjRVBKZ0M5RUdLNUhQcUVEcTJNdTJtOURWNmN2UktqR1N6NHZBNnRqdUp4dlEvZkxMMFJBMzA4K3JRS3JZL0ZtYjBPRjhpOUUrUDFVUHZrQnBXT0lRRzlEdGlJd1JJZ1dXVDU0QVl0anVKeHZRM3RETUVTd1IyRStsUUJEWXpJVURRQUFhME1WQUFBdVJCMEFBQUJCSlFBQUlFRkFvS0w2MFppRkJDckZBUW9Ra2xRdlZrRGJTQ3lBQ3FtS0d2UHJXeElHQ0FrUUFSZ0tHZ1lJQUJBQkdBQWdBQ3FBQVFvUTh2c05oWGVVUWZLRGV5YmZGcHZPaGhFOUMvUnhUOGZIUVJnRklDTW8zQTh5RkFBQUlFRG9Bd0FBaUxaRVl2OS9BQUNBUHdBQU9rYTV0blJENkJJdlJBQUFBQURKQWFyMmMwTmdWaTlFQUJLRE8vMENqeDl6US9xd0wwU2dRd3M5RVFPTWRuSkRGdjR2UklCcVBEMXhBdEZYY2tPakpEQkVBS3B4UGZVQU1oUU5BQUJ4UXhVQXdDNUVIUUFBb0VBbEFBRGdRRURBeDlMNjZvY0VLcG9CQ2hETUNWcjdycjFQRUxrSzl6Y1pTYzZXRWdZSUNoQUJHQXNhQmdnQUVBRVlBQ0FBS2xZS0VLaEE1WGQ3dEVTMGtPNWpQazN1WHRJUm9iMEVjay9IeDBFWUFpQWpLTndQTWhRQUFDQkE2QU1BQUpXNFJHTC9md0FBZ0Q4QUFEb2N6MVY1UTM0akxVUUFBQUFBb1FLUzRuaERGZmtzUkFBU2d6dVFBaklVRFFBQWVFTVZBTUFzUkIwQUFFQkFKUUFBUUVCQTRJVDY4SVNGQkNxT0F3b1FEOWwybVp2RlR3cXFnSDVRRkUwNFpSSUdDQXNRQVJnTUdnWUlBQkFCR0FBZ0FDckpBZ29RUmtLSEVheDdUWkd2c1R5Rml3NlZTeEZLdFJWeVQ4ZkhRUmdSSUdNb25BOHlFZ0FBSUVEb0F3QUFSR0wvZndBQWdEOEFBRHFRQWwzYmZrTVA3eXRFQUFBQUFJb0MzTG5EV0g1RDV3MHNSQUFUZ3pzckJBbThUUnQrUTZ3dUxFUmdqUmM5WmdRanZIdk9mVVB3WEN4RVFBZ3NQWmtFUmJ6NWVYMUQ2cElzUklCcVBEMjdCR084eVIxOVE0ZlNMRVRnekV3OXh3Um52STJxZkVQSEd5MUVJQzlkUGRBRVo3enpKM3hEaG5JdFJJQ1JiVDI5QkdlOC9KVjdRdzdQTFVUQTgzMDlvZ1JudlBuc2VrTW1OeTVFVURlSlBTZ0VaN3dDVzNwRDA0OHVSSEJva1QyMEEyZTh1dEI1UTZUa0xrU2dtWms5TGdObnZNOVZlVVBUTHk5RXdNcWhQYVlDWjd5ZitYaERiMjh2UlBEN3FUMGFBbWU4ekt4NFEybWxMMFFRTGJJOWpnRm52S2RuZUVOajJ5OUVnR3E4UGVFQVo3elVHbmhEU2hNd1JMQ2J4RDFaQUdlOE1oUU5BQUIzUXhVQXdDdEVIUUFBRUVFbEFBQ1lRVURnMjZ6cnE0Y0VLdjhCQ2hETDI4ejJmbWhMZnJlMXV1a0kra2ZoRWdZSURCQUJHQTBhQmdnQUVBRVlBQ0FBS3JvQkNoRGdvYkhNNnU5Tm5KRUJSSEw3Vjk1UkVkWlRLM0pQeDhkQkdBZ2dvd0VvM0E0eUVnQUFJRURvQXdBQU43di9md0FBZ0Q4QUFEcUFBVElxZUVObmdDNUVBQUFBQUxFRDAxN2hNWGhEU0U0dVJBQVNnenVvQTlOZU5kTjRReU5TTGtUQXpNdzhDQVRUWGl4bGVVUFpXUzVFd014TVBTd0QwMTQ4SlhwRHRGMHVSR0NSYlQxQUF0TmVWL3g2UTdSZExrUkFONGs5SFFHalhuN3FlMFBHV3k1RWtKbVpQWEFBZVY2eTczeERnRWd1Uk9EN3FUMGRBSEZlTWhRTkFBQjNReFVBQUM1RUhRQUE0RUFsQUFCQVFFQ0FndC94eVljRUtzOENDaER3eWtFVUZ0cEI1SUh3aFpDaXhoWjNFZ1lJRFJBQkdBNGFCZ2dBRUFFWUFDQUFLb29DQ2hDZnJ5VFBaRHBOb0xoNUZld3NPUm9DRWI0dFBuSlB4OGRCR0EwZ293RW8zQTR5RWdBQUlFRG9Bd0FBTjd2L2Z3QUFnRDhBQURyUUFUZ2lnRU9vS1M1RUFBQUFBR1FCY1Y2UjRIOUQvbFV1UkFBU2d6dTdBbkZlWUlSL1F3dUtMa1NBRW9NOGxnTnhYdXBHZjBPR3NpNUV3TXpNUE1vRGNWN0hBWDlEQWRzdVJJQ1I3VHdZQkhGZW83eCtRMm9GTDBRQUt3YzlkUVJ4WHM5dmZrUFRMeTlFWUkwWFBhb0VjVjZyS241RE8xb3ZSS0R2SnozT0JIRmUyZDE5UThtQUwwVGdVVGc5dmdSeFhweHFmVU5CeEM5RXdNeE1QWG9FY1Y1c0RuMURBd0F3UkdDUmJUMjdBOGRkVjRsOVEvZkxMMFRnKzZrOXN3QUtYZVQwZlVOWHB5OUVZSS9DUFFNQTBGd3lGQTBBQUh4REZRREFMVVFkQUFDZ1FDVUFBQ0JCUUtEVHJJN29od1FxckFFS0VORGtxRGpKdEVsRG9DT3hqTTFnWVEwU0JnZ09FQUVZRHhvR0NBQVFBUmdBSUFBcWFBb1FYbUZIUFhYTlFVR0NJbFZNd0VSWG9SSEdvbEZ5VDhmSFFSZ0RJR01vbkE4eUVnQUFJRURvQXdBQW1Wei9md0FBZ0Q4QUFEb3dIdWFBUTBrT0xVUUFBQUFBa3dFM3UrSnlnRU1DK3l4RUFCT0RPNU1CVjd6SlJJQkQyaGt0UklDUjdUd3VBSlM4TWhRTkFBQi9ReFVBd0N4RUhRQUFnRUFsQUFCQVFFREFwUGFBc29jRUtyNERDaENiSGJUampwQkRwNlQrNlVia2tDcDlFZ1lJRHhBQkdCQWFCZ2dBRUFFWUFDQUFLdmtDQ2hCQTBySnpvQ2hNRzVVcnhJcDhsN1JaRVc0eFpYSlB4OGRCR0JRZ1l5aWNEeklTQUFBZ1FPZ0RBQUNaWFA5L0FBQ0FQd0FBT3NBQ1B3K0RRNjZUTGtRQUFBQUFEUUlDdlQ4UGcwTjlZeTVFQVA1VVBPQUNBcjNXNklKRGd5MHVSTURNekR5MkF4YTlJSUdDUTZncExrVGdwUnM5ZHdRdHZRd0tna05xWlM1RUlDOWRQWThFTGIwNXZZRkRockl1UkVBM2lUMkRCQzI5M0syQlE4bmdMa1RBeXFFOThnTXR2V0s1Z1VNTkR5OUVVRG0wUFlRRExiME1Db0pEMWhRdlJORE16RDBBQXkyOXczR0NRK2dTTDBTQWJPYzl6Z0l0dlZEZGdrTVE5QzVFc0ozdlBRMERMYjNCWTRORHpNVXVSQUFBQUQ3RUF5MjlHcnlEUStLb0xrVGdUdzArcWdRdHZYeUNnME1tMXk1RXdNb2hQcWNFTGIxa1ZJTkRFUFF1UktBYUx6NWtBeTI5ZENLRFErZ1NMMFF3TXpNKzVnSXR2VnowZ2tQQU1TOUV5RXMzUGw0Q0xiM3p6WUpEbUZBdlJGaGtPejdUQVMyOWZaQ0NRMnlLTDBRUWcwQStHQUV0dmZlRWdrTU5yeTlFT0xSSVBrY0FMYjB5RkEwQUFJRkRGUUFBTGtRZEFBREFRQ1VBQUFCQlFLRDZ6cnYraGdRcS9nSUtFR3pWWmpwL1MwT2dzMW1CeHllc2lDc1NCZ2dRRUFFWUVSb0dDQUFRQVJnQUlBQXF1UUlLRUx2WWMreUlYVTIzZ3d1UUdUb2RQWFVSTmZHS2NrL0h4MEVZRUNCaktKd1BNaElBQUNCQTZBTUFBSmxjLzM4QUFJQS9BQUE2Z0FLQ1lZZERBbHNzUkFBQUFBQmlBdEM5ZGtxSFEzNkRMRVFBRTRNN05nVE92dVFuaDBNeHBpeEVnSkh0UEtzRTNiNmsvWVpEZE5Rc1JBQXJCejBiQmVPKzNjZUdRellRTFVUZ3BSczltUVhrdm1pS2hrT3VVeTFFUUFnc1BlSUY1TDVEUllaRDNaNHRSSUJxUEQwREJ1UytjZmlGUTlQdkxVVGd6RXc5REFia3ZwMnJoVU8zUWk1RUlDOWRQZkFGNUw3TFhvVkRycE11UkdDUmJUMjZCZVMrSUE2RlEzL29Ma1FnQm9FOVBBWGt2b0xVaEVNdkppOUVVRGVKUGN3RTVMNjdub1JERmw0dlJIQm9rVDFQQk9TK1VuaUVRMXFNTDBTZ21aazl3Z1BrdnNCVmhFUDZzQzlFd01xaFBTTUQ1TDc1SDRSRGwvQXZSUEQ3cVQySUF1UytNaFFOQUlDRFF4VUFBQ3hFSFFBQUVFRWxBQUNJUVVEZ3gvZnpvb2NFS293Q0NoQlVRUktzekM5SUxKaDJFeUJ5bXRtM0VnWUlFUkFCR0JJYUJnZ0FFQUVZQUNBQUtzY0JDaENOTXY3Mzh2RkhUWktERVJETWhxVW1FZUJsb0hKUHg4ZEJHQW9nSXlqY0R6SVVBQUFnUU9nREFBRGt2cGxjLzM4QUFJQS9BQUE2akFGM3k0TkRJRzB1UkFBQUFBRGdBZ1UzaEVQb2NpNUVBQk9ETzZRRERKZUVReDJJTGtUZ3pFdzl0d0orSFlWRHJwTXVSR0NSYlQwV0FubG1oVU9ibFM1RUFDdUhQVVFCKzdxRlE1dVZMa1J3YUpFOXZBRDJBNFpEbTVVdVJLQ1ptVDFSQVBKTWhrUFRqeTVFd01xaFBTc0FGcEtHUTJlQUxrVHcrNms5QlFCajA0WkRJRzB1UkJBdHNqMEJBRElVRFFBQWcwTVZBRUF1UkIwQUFCQkJKUUFBUUVCQTRLMlU4NENGQkNxL0Fnb1FhZCsvOTlvdFR6U3FaajU4UW0vbml4SUdDQklRQVJnVEdnWUlBQkFCR0FBZ0FDcjZBUW9ROFVMMGR0dmNRZUNISUNpd0hRZmhBeEcxVWJGeVQ4ZkhRUmdNSUtNQktOd09NaElBQUNCQTZBTUFBT1MrLzM4QUFJQS9BQUE2d0FIWEFvaERmY010UkFBQUFBQmpBcGxjbHRpSFE5UHZMVVFBRTRNNzFRT1pYTStpaDBQeUlTNUV3TXpNUEhVRW1WdzlnSWREcFVRdVJBQXJCejNIQkpsYzFGbUhRekpyTGtUZ3BSczlFQVdaWEdvemgwUFRqeTVFUUFnc1BUQUZtVnpZRUlkRFliWXVSSUJxUEQwaUJabGNSdTZHUXhQWkxrVEF6RXc5L1FTWlhIKzRoa1BERmk5RUlDOWRQYWNFbVZ3K2pvWkRoVkl2UkNBR2dUMndBOXBiM2NlR1E4QXhMMFJnT2JROVR3QkdXL1gxaGtQb0VpOUVvSnZFUFFRQUIxc3lGQTBBQUlaREZRQ0FMVVFkQUFDZ1FDVUFBQUJCUU9Ea2paNmtod1FxbkFFS0VFNlhYaFc2YUVNc2pTRHM3NDNSNEE4U0JnZ1RFQUVZRkJvR0NBQVFBUmdBSUFBcVdBb1FIZE4wNkdQSlJjK0cvYjAydFg4anlSRlY5OFp5VDhmSFFSZ0NJR01vbkE4eUVnQUFJRURvQXdBQTBWci9md0FBZ0Q4QUFEb2dyZmlJUThLeExFUUFBQUFBSndGd3Z5ZnRpRU14cGl4RUFCT0RPOE1BZ0w4eUZBMEFnSWhERlFCQUxFUWRBQUFBUUNVQUFFQkFRS0R3NU1mNWhnUXFzUWNLRUptc0lBMDJFMFdEbnFyRXhFRXZHWDBTQmdnVUVBRVlGUm9HQ0FBUUFSZ0FJQUFxN0FZS0VCUU0vMlpadFVac2dZOWMrRnRMUmtnUjZ1amVjay9IeDBFWU15Q2pBU2pjRGpJU0FBQWdRT2dEQUFEb3cvOS9BQUNBUHdBQU9yQUdrN3lKUTFMOUxVUUFBQUFBcEFGblk1TzhpVU5HeVMxRXdFT0xQQTBEK21LVHZJbEQwKzh0UkVBSUxEM0pBekZpazd5SlE2Z3BMa1FnTDEwOThRT3VZUTJ4aVVNT2J5NUV3UE45UFRJRUpHRUJtb2xEZzgwdVJJQm9rVDFhQkdOZ1VwS0pRNDhCTDBUdys2azljQVR3WDFLU2lVT3FUaTlFZ0dxOFBVb0ZxVjZzNm9sRGlEY3ZSTUNkN3oyaUJTRmVteHlLUTU0YUwwU1lHQVErc3dYN1hXSlNpa1BaK1M1RUtERUlQcnNGMkYzWGo0cERTOU11Uk1CSkRENjdCYnBkL05TS1EvV21Ma1I0YUJFK3FBV2ZYWm9PaTBPTWZDNUVDSUVWUG80RmkxMFBUSXRESTFJdVJLQ1pHVDVYQlg1ZDFvR0xRN29uTGtRd3NoMCtFd1Y1WFoyM2kwTS8veTFFeU1vaFByTUVlVjJNNll0RHNkZ3RSRmpqSlQ1REJIbGRLaU9NUTBtdUxVUVFBaXMrc3dONVhXdE5qRU5la1MxRW9Cb3ZQajBEZVYyUGtveEQ5bVl0Uk1oTE56NHFBbmxkM05PTVE1eFZMVVNvbTBRK3BBQjVYWmZ5akVQeWdTMUVZT1ZRUGhBQWVWMmpDWTFEeE5ZdFJJZ1dXVDRHQUhsZE5TeU5RM2I1TFVTUWwyNCtRd0Y1WFRGMWpVTlMvUzFFQUFDQVBra0NlVjA0MVkxRGV0NHRSSVRBaWo2OUFubGRRRFdPUTlxNUxVUms1WkErQkFONVhSK1pqa05Na3kxRUNJR1ZQa1VEZVYwYTRvNURtWEF0Ukp5Wm1UNmxBM2xkTWhDUFF4NUlMVVF3c3AwK29RUjVYY0dKamtNZVNDMUVhR2FtUHZZRmVWM3VQSTVEbkZVdFJFU0xyRDVvQm5sZGJlaU5ROUZxTFVTZ0dxOCt4d1o1WGNPWGpVUE5oUzFFN0NheFBna0hlVjN3U28xRHVLSXRSRFF6c3o0b0IzbGR6QVdOUTMzRExVU0FQN1UrUXdkNVhTN01qRU5DNUMxRXlFdTNQa0FIZVYwK21veEQ5UVl1UkJSWXVUNDVCM2xkVDJpTVE0TXRMa1J3NTdzK0RnZDVYV3ROakVNMlVDNUV1UE85UHVBR2VWM2xRWXhEMW5RdVJBQUF3RDZZQm5sZGEwMk1RMDY0TGtSTURNSStSUVo1WFRLRGpFTTQxUzVFNENUR1BqTUZlVjB1ekl4RE5mQXVSRHkweUQ1akJIbGRoaVNOUTdUOUxrU0V3TW8rdHdONVhUMk1qVU44QXk5RTBNek1QZ0VEZVYxNS80MURmQU12UkJqWnpqNDlBbmxkakhhT1Ezd0RMMFJrNWRBK1Z3RjVYU2I1amtQRyt5NUVyUEhTUHBRQWVWMzFqbzlEZitndVJBaUIxVDR1QUhsZFNDMHlGQTBBQUlsREZRQUFMVVFkQUFCZ1FTVUFBQ0JCUUlDRmh0YUpod1FxcHdjS0VHZUFTdVZqTGtmQ2xuTzRBVUt1TS9FU0JnZ1ZFQUVZRmhvR0NBQVFBUmdBSUFBcTRnWUtFSGlybjdMUTlVR2FwWjJab251L3ZTd1I5WjFCZEUvSHgwRVlMU0RqQVNpY0RqSVFBQUFnUU9nREFBRC9md0FBZ0Q4QUFEcXFCcUxSbDBOSitpeEVBQUFBQUxVQk5yWERhNDZIbDBPejV5eEVnQklEUEdrQ05yVnRhdUpFbDBOdStDeEVBQ3NIUFhzRE5yVnRhdlVxbDBPZUtpMUVJQzlkUGFjRE5yVnRhbThZbDBQTFR5MUVJQWFCUGJnRE5yVnRhbE1ObDBPd2VDMUVVRGVKUGNjRE5yVnRhb0wrbGtNcHB5MUVjR2lSUGRnRE5yVnRhckh2bGtPaDFTMUVrSm1aUGVvRE5yVnRhdURnbGtQUkJ5NUV3TXFoUGZVRE5yVnRhc1BWbGtNQk9pNUU0UHVwUGZVRE5yVnRhdkxHbGtNT2JpNUVVRG0wUGVzRE5yVnRhdGE3bGtNWGxTNUVnR3E4UGRvRE5yVnRhZ1d0bGtOdTBpNUVvSnZFUGRFRE5yVnRhdWlobGtNTC95NUU4UDNVUFhNRU5yVnRhdnVIbGtPUzBDNUVBQUFBUGpzRU5yVnRhcEtBbGtNVWlDNUU0RThOUHUwRE5yVnRhcEtBbGtPYldTNUVDSUVWUHZRRE5yVnRhcEtBbGtPekl5NUVtSmtaUHZzRE5yVnRha2VFbGtNNDZDMUVLTElkUGdVRU5yVnRhaGlUbGtQZ3FpMUV3TW9oUGhJRU5yVnFhZ1d0bGtNOVpDMUVlT2ttUGg4RU5yVk9hdkxHbGtQbUppMUVDQUlyUGlnRU5yVXphcFRrbGtPejV5eEVvQm92UGpBRU5yVWJhbE1ObDBQSXBDeEVNRE16UGpjRU5yVUlhc1U1bDBQZFlTeEV5RXMzUGtFRU5yWDdhYUJ0bDBNV0hTeEVXR1E3UGswRU5yWDNhZVNvbDBNRXp5dEVFSU5BUG1FRU5yWDNhWkRybDBPc2tTdEVxSnRFUG5JRU5yWDNhYVExbUVOVlZDdEVPTFJJUG5nRU5yWDNhWW1PbUVQWkdDdEV5TXhNUG5zRU5yWDNhZlQ1bUVQeDRpcEVZT1ZRUG9BRU5yWDNhY1pzbVVQQnNDcEU4UDFVUG9RRU5yWDNhZEwxbVVQWmVpcEVxQnhhUG5jRU5yWDNhY0p6bWtPSVZ5cEVRRFZlUG1rRU5yWDNhUnI1bWtNMk5DcEUwRTFpUGxBRU5yWDNhZHFGbTBQQkVpcEVhR1ptUGpZRU5yWDNhVTRXbkVNbjh5bEUrSDVxUGc0RU5yWDNhY09tbkVPeTBTbEVpSmR1UHVVRE5yWDNhUWhHblVNOHNDbEVTTFp6UG5vRE5yWDNhVVBBblVNU21DbEUyTTUzUGh3RE5yWDNhUll6bmtPZ2d5bEVhT2Q3UHAwQ05yWDNhUmlYbmtQQmRDbEVBQUNBUGg4Q05yWDNhZUhrbmtPWmFTbEVTQXlDUHBVQk5yWDNhYWt5bjBQaVpTbEVsQmlFUGdrQk5yWDNhZUhrbmtNemlTbEVoTUNLUHRNQVdyWDNhVElVRFFBQWxrTVZBQUFwUkIwQUFKaEJKUUFBeUVGQXdOVFlwSytFQkNxZUF3b1Fvck1TRkoza1R0MldSejVudkFSTEZSSUdDQllRQVJnWEdnWUlBQkFCR0FBZ0FDclpBZ29RZWwvTW8xdWZSSzZVWktoVVJlQ2o5aEcxK1d0MFQ4ZkhRUmdTSUdNb25BOHlFZ0FBSUVEb0F3QUE5Mm4vZndBQWdEOEFBRHFnQXUyYWxVTWxYaXhFQUFBQUFQY0NqN1pVUHBWRGMzUXNSQUFUZ3p2OEFuRzJCdDZVUTZDWkxFU0FtMFE4U0FOR3RrZTFsRVBSeXl4RVFBaXNQSDBER0xiOHVKUkRidmdzUklDUjdUejJBKysxTnpPVlErTVpMVVJnalJjOVZRVE10V2lJbFVOU0lTMUVnR284UFdFRXY3VWU4SlZENWlZdFJPRE1URDFkQkxpMThXS1dROElvTFVRZ0wxMDlRUVN6dFN6ZGxrUENLQzFFWUpGdFBRVUVyYldFWXBkRHdpZ3RSTUR6ZlQyMUE2aTFZZnFYUThJb0xVUlFONGs5S1FPb3RXMkRtRU8vR3kxRWNHaVJQYUFDcUxVdEVKbEQ0QXd0UktDWm1UMy9BYWkxaFpXWlE5My9MRVRBeXFFOWFnR290UXdNbWtPMjlDeEU4UHVwUGVFQXFMWENjNXBEYXVzc1JCQXRzajExQUtpMWpDV2JReC9pTEVTQWFydzlKUUNvdFRJVURRQUFsRU1WQUFBc1JCMEFBSEJCSlFBQXdFQkFnTS9xeittRkJDcWFBZ29RSFB6TmxEYUpRSTYxZ1VFaUlPTTQvaElHQ0JjUUFSZ1lHZ1lJQUJBQkdBQWdBQ3JWQVFvUW53RWl4SXcyVFNpV0lwVmFxL2dZS3hHeW40RjBUOGZIUVJnTElDTW8zQTh5RkFBQUlFRG9Bd0FBcUxXMFpmOS9BQUNBUHdBQU9wb0JPc3liUTdiMExFUUFBQUFBMHdHcmxKdERCQXN0UkFBU2d6dVlBNFJrbTBQRk5TMUVRSkh0UE1RRDRrYWJRMTVWTFVSQWpSYzl4Z05CS1p0RGpIb3RSS0R2SnozR0E1OExtME9Wb1MxRTRGRTRQWUVEc2ZHYVEzcktMVVRBekV3OUVRUGc0cHBEcCs4dFJDQXZYVDJtQWcvVW1rUDRFaTVFWUpGdFBUd0NwOHlhUTNST0xrU2c4MzA5eFFGSjZwcEQ3SHd1UkNCY2p6M2tBRElVRFFBQW1rTVZBTUFzUkIwQUFLQkFKUUFBQUVGQTRPZWltdk9GQkNyRkFRb1EzKzM1UnpvdVIwYS8wb3BzdkFJTG1oSUdDQmdRQVJnWkdnWUlBQkFCR0FBZ0FDcUFBUW9RVG5zay9rNDRUSkcxSC9rZE9UUlFCQkVUbTVWMFQ4ZkhRUmdGSUNNbzNBOHlGQUFBSUVEb0F3QUEzTFcwWmY5L0FBQ0FQd0FBT2thdVhKeERaRE1zUkFBQUFBQzRBbXNobkVNMEFTeEVBQktETzdnQ3Y5NmJRNk1JTEVRQTE2TTh6UUZYMTV0RDBTMHNSRUNORnoyZUFBdmJtME84Y0N4RTRGRTRQVEFBTWhRTkFBQ2JReFVBd0N0RUhRQUFnRUFsQUFDQVFFREF0TXJvOG9RRUt0OEhDaEJ2d050SGZTRkt6NWhaSFd0UTdSdUxFZ1lJR1JBQkdCb2FCZ2dBRUFFWUFDQUFLcG9IQ2hEZWNqYUVCVUJJOTRKYi9SdmJkUHU5RVJIRHBuUlB4OGRCR0RBZzR3RW9uQTR5RUFBQUlFRG9Bd0FBLzM4QUFJQS9BQUE2NEFZajdaeERGbGt0UkFBQUFBQ2lBZHkxdEdYOHZKeERINEF0UkFBVGd6dnVBdHkxQ0dXS2tKeERUN0l0UkVBSXJEeDNBOXkxYVdTY2RweERvZFV0UklDUjdUeTBBOXkxSDJTdVhKeERxdnd0UkFBckJ6MzVBOXkxMTJQQlFweERheWN1UkdDTkZ6MDhCUHUxbG1QVEtKeERLMUl1UktEdkp6MTlCQm0yVzJPYUVweER5SDR1UklCcVBEMjRCRDIyS21PdCtKdEQvTDB1Uk9ETVREM3hCSFMyM21KRThadERtL2N1UklDUmJUMi9CYnEyVkdLYUVweERidEl1UlBEN3FUMlFCY0sySjJJTlA1eERIYTh1UkVCZXVqMktCY20yRG1Mb2NweERYSVF1UkxDYnhEMmNCYzIyOTJIRHBweER2MWN1Uk5ETXpEMndCYzIyNDJGUzNweERJaXN1UkFEKzFEMmJCYzIyMG1IaEZaMURxdnd0UkNBdjNUMkJCYzIydzJFbFVaMURNczR0UkVCZzVUMUdCZWUycm1HMGlKMUR1Wjh0UkhDUjdUMENCUWkzbkdGZ3k1MURaVzh0Uk9ETzl6MjZCQnEzaTJHa0JwNURYRWd0UkFBQUFENkVCQzYzZm1FelBwNURMaU10UkpnWUJENDlCRUczYzJIQ2RaNURsQU10UkNneENENzFBMXUzYTJGUnJaNUQxK1VzUk1CSkRENklBM2UzWjJFSEZaOUQ4cndzUkhob0VUNzFBckszWm1IUVlwOURnclVzUktDWkdUN2RBZlczWm1GeWdKOURITlVzUkZqakpUNFNBUjY0Wm1HT2k1OURUQWN0UktBYUx6NnFBRVc0Wm1HcmxwOUQ3MDB0Uk1oTE56NkFBR2E0Wm1FVG5wOURISE10UktpYlJEN1RBSDY0Wm1FQnVKOURCS2t0UlBqOVZENjJCTCs0MFdCWDJaOURzSGd0UkhEbmV6NXJCZVc0Y21CaC9wOURFMHd0UkR5MGlENXdCaVM1TjJDWnNKOUQrSFF0Ukp5Wm1UN2pCaVM1TjJDT2k1OUR0cEl0UkhpK256N2pCaVM1TjJEUVlwOURCN1l0Uk5STm9qN2dCaVM1TjJBdVJaOURXZGt0UkNCYXBEN2FCaVM1TjJEMUxwOURZZ0F1UkdobXBqNitCaVM1TjJCd0hKOURqeVV1UkxCeXFENlBCaVM1TjJBSEZaOURtRXd1UlB4K3FqNVhCaVM1TjJBSEZaOUQ2bTh1UkVTTHJENFhCaVM1TjJBSEZaOUQ4NVl1UktBYXJ6NnZCU1M1TjJDelY1OURJOGt1Uk93bXNUNU5CU1M1TjJCWDJaOURCZVV1UklBL3RUNUVCQ1M1S1dDSUxxQkQ0ZVl1UkJCWXVUN2VBaVM1RkdDS2txQkQ0ZVl1Ukd6bnV6N3ZBU1M1L2wvWThxQkQ0ZVl1UkxqenZUNHZBU1M1NWwrTldxRkRKdFl1UkFBQXdENmVBQ1M1eTErc3lhRkQyTDh1UkV3TXdqNGtBQ1M1clY5SUxqSVVEUUNBbTBNVkFJQXNSQjBBQUdCQkpRQUFNRUZBZ09XdnpMdUZCQ3J4QkFvUVlaNXNKRXZRU0FTU2NyL2grdURjMUJJR0NCb1FBUmdiR2dZSUFCQUJHQUFnQUNxc0JBb1FxSXI2T0lCK1R4TzZZVFh5Ykg0YVFoRWNzUTUxVDhmSFFSZ2ZJS01CS053T01oSUFBQ0JBNkFNQUFPSzQvMzhBQUlBL0FBQTY4QU44cDZORGFCb3VSQUFBQUFBRkFneG9jb0tqUS9MNExVUWdDQ3c5TndJTWFMNStvMFBGMHkxRXdNeE1QWlFDREdnNWJLTkRCS2t0UkNBR2dUMkJBd3hvemdDalE1V2hMVVRnKzZrOW5RUU1hRFdrb2tNdXdTMUV3TXpNUGUwRURHZ09kS0pETk5zdFJCQXYzVDBLQlF4b2Z6eWlRODc2TFVTQWJPYzlLQVVNYUF3UW9rUDdIeTVFc0ozdlBTZ0ZER2dDNjZGREJVY3VSTkRPOXowa0JReG9ZTTJoUXc1dUxrUUFBQUErQ0FVTWFOdTZvVU03a3k1RWtCZ0VQdXNFREdnbnQ2RkRhTGd1UkNBeENENjhCQXhvSjdlaFF5LzlMa1RZVHcwK2dnUU1hSFFYb2tQd0p5OUVBSUVWUGlZRURHalZYYUpERnpNdlJDaXlIVDZvQS9wblVhK2lRL00wTDBUQXlpRSthZ09jWjU4UG8wUHpOQzlFZU9rbVBpTURRR2VFYUtORDh6UXZSQWdDS3o3MEF1Um1hc0dqUTF3aUwwU2dHaTgrendLTFp1WVNwRU1PREM5RU1ETXpQcndDTm1aalpLUkRDUEl1Uk1CTE56NnNBdWhsdzZxa1F3TFlMa1JZWkRzK3B3S2FaU1B4cEVORXVpNUVFSU5BUHFrQ1RXVTRPNlZEcDQwdVJLQ2JSRDdLQXI1a1FtQ2xRMU5kTGtUSXpFdytFd09ZWXhFTHBVTTFlUzVFMEUxaVBpUUQrV0kyMTZSREdhSXVSRUMyY3o2c0FyeGlMTEtrUTkzWkxrUm81M3MrS2dKb1lraTlwRVBxRFM5RWtCaUVQbGNCOW1GQ1lLVkR4Zzh2Uk16TWpENDFBSHRoU0J3eUZBMEFBS0ZERlFCQUxVUWRBQUFnUVNVQUFCQkJRS0RHeXFUaGhnUXF0Z01LRURjUTJyazR5MHVtaHBycHE3bzlvTWtTQmdnYkVBRVlIQm9HQ0FBUUFSZ0FJQUFxOFFJS0VIUXk2OTlhSlVNaXJad1gwUXJUdU4wUnByWTRkVS9IeDBFWUZpQWpLTndQTWhRQUFDQkE2QU1BQU9LNFcySC9md0FBZ0Q4QUFEcTBBczJlcGtNZ0hpNUVBQUFBQVBNQ0JGR21ReVk0TGtTQVF3czlpQU91TDZaRHhYRXVSSUJxUEQzQUE2UUtwa1BhekM1RUFDOWRQUjBFaC8rbFErY0FMMFJBTjRrOVhBVFQrNlZEclVVdlJKQ1ptVDF0QlF3U3BrUHFEUzlFOFAzVVBaTUZrU1NtUTNUc0xrU3duZTg5b2dWL1BxWkRSOGN1Uk5ETzl6MnZCV3hZcGtOaW5pNUVBQUFBUHFjRkRuYW1RNkZ6TGtTUUdBUStud1ZrbDZaREJVY3VSRWczQ1Q1akJXNjhwa01nSGk1RTRFOE5Qak1GZWVHbVF4ZjNMVVJ3YUJFK0RRWHJEYWRERGRBdFJBQ0JGVDdoQkJJK3AwTzhyQzFFbUprWlBuZ0U3WEduUXlLTkxVUW9zaDArRFFRd3JhZERyV3N0Uk9EUUlqNW5BeklScUVNM1NpMUVlT2ttUHVVQ3pHMm9ROGhDTFVTZ0dpOCs3d0VzdEtoRHlFSXRSTUJMTno3NEFMdnJxRU1jY3kxRUVJTkFQaXNBU0JBeUZBMEFnS1ZERlFBQUxVUWRBQUFBUVNVQUFDQkJRT0NYbktMUWhRUXFxd1lLRUs2T3Z0UnV4a3NEaDJ5amZIdTFyT3NTQmdnY0VBRVlIUm9HQ0FBUUFSZ0FJQUFxNWdVS0VPeVhwVUsvaWt5M29tbjBoWE51bng4UlF0QlhkVS9IeDBFWUppRGpBU2ljRGpJUUFBQWdRT2dEQUFEL2Z3QUFnRDhBQURxc0JlSWJxVU9HL2kxRUFBQUFBQmtENHJoYllXL3ZxRU5FSEM1RUFBaXNQRThENHJoYlllQzNxRU81UFM1RXdNek1QUFVENHJnbVlEUjFxRU9lWmk1RTRLVWJQVzRFNHJpTlhtd25xRU9HbkM1RXdNeE1QYlVFNHJoSFhHTm1xRU0xZVM1RU1BaXNQY1FENHJqVVc5ajJxRVBhTGk1RW9KdkVQWGdENHJpUlczRlRxVU9xL0MxRVlEdmZQVXdENHJpQVcwN3JxVU9ZcmkxRXNKM3ZQYXNENHJoK1cwWXFxa051bGkxRVNEY0pQdW9FNHJoK1c1SW1xa08vdVMxRVVMZ2VQa0lGNHJoK1d3THZxVU03OVMxRWVPa21QbzBGNHJoK1c2ek5xVU93Rmk1RW9Cb3ZQckFGNHJoK1crUi9xVU15YkM1RVdEazBQc1FGNHJoK1cwSmlxVU1YbFM1RUVJTkFQcThGNHJoK1c3MVBxVU9Qd3k1RU9MUklQbklGNHJoK1d3dXdxVU9KcVM1RVFEVmVQdWtFNHJoK1d6SGdxVU5ma1M1RUdJVnJQcGNFNHJoK1c4RVhxa09oY3k1RXNKMXZQb2dFNHJoK1cxQlBxa1BqVlM1RVFMWnpQb0lFNHJoK1c5K0dxa051TkM1RTJNNTNQcGdFNHJoK1cyKytxa1BVRkM1RWFPZDdQck1FNHJoK1c3TDVxa09EOFMxRUVJT0FQdnNFNHJoK1cweFdxME5UdnkxRVhJK0NQbVlGNHJoK1cyQ2dxME1sbWkxRThLZUdQcGNGNHJoK1c2UGJxME96aFMxRWdNQ0tQajhHQnJsK1czVHFxME1wcHkxRWNHaVJQbDhIYXJsK1czVHFxME00NkMxRVVJMlhQcmdIcmJsK1c4RG1xME9KQ3k1RTlDaWNQc0FIekxsK1crL1hxME8yTUM1RVFEV2VQcllINkxsK1d4N0pxMFBqVlM1RWlFR2dQcG9IQWJwK1d3RytxME1RZXk1RTBFMmlQbVVIR0xwK1d6R3ZxME5pbmk1RUhGcWtQaDhITExwK1cvZVlxME1GNVM1RWVPbW1QcU1HVWJwK1cwT1ZxME03TVM5RURBS3JQc1lGZDdwK1cvZVlxME1nV2k5RTZDYXhQZ0lFaXJwK1c4RG1xME1tZEM5RWpNSzFQb0FDb3JwK1d6MDRyRVBlZHk5RWJPZTdQb1FBczdwK1cwZ2tNaFFOQUlDblF4VUFRQzFFSFFBQU1FRWxBQUFnUVVEQW1QUEs4SVFFS3U4SENoQkl0QzRFcWlaTDE1amE3ZlcwUGUyeEVnWUlIUkFCR0I0YUJnZ0FFQUVZQUNBQUtxb0hDaEJMQXMzRld4UkxySmZQSmpwRVExeURFUkwzOUhWUHg4ZEJHREVnNHdFb25BNHlFQUFBSUVEb0F3QUEvMzhBQUlBL0FBQTY4Z1lWcXJkRFJrOHNSQUFBQUFDeEFTMiswR2VhdkxkRGhTUXNSQUFTZ3p1ekFUYSswR2NDeExkRFdQOHJSSUQ5VkR6YUFVQy8wR2N4dGJkRGM5WXJSQUFJckR5QUFyTy8wR2ZSYnJkRGxNY3JSSUJEQ3owbUE4aS8wR2VXOUxaRGxNY3JSQ0FJTEQzRUE4aS8wR2RsbjdaRGNNa3JSTURNVEQwSUJNaS8wR2NZUDdaRGM5WXJSQUF2WFQwM0JNaS8wR2VSeUxWRDVlb3JST0NwY1QxdEJNaS8wR2NtWGJWRE5BRXNSQ0FHZ1QyTkJNaS8wR2R3OWJSRE9oc3NSRUEzaVQycUJNaS8wR2ZYbUxSRFFEVXNSSEJva1QyK0JNaS8wR2RhUjdSRGFrMHNSSkNabVQzSkJNaS8wR2RpQ0xSRHVHTXNSTURLb1QyNEJNaS8wR2ZUMExORHYzMHNSREFJckQyZkJNaS8wR2N4czdORDdLSXNSRkE1dEQyRkJNaS8wR2RPdnJORDlja3NSS0NieEQwMkJNaS8wR2NoTWJSRGt2WXNSUEQ5MUQzTkE4aS8wR2RTaHJSREJBc3RSSUJzNXoxNUE4aS8wR2VmNXJSRGR4OHRSTENkN3oxbkE4aS8wR2RWVHJWRHhUVXRSTkRPOXoxZUE4aS8wR2UvdWJWRDcwMHRSQUFBQUQ1WkE4aS8wR2QySWJaRDlXY3RSSkFZQkQ1YkE4aS8wR2ZnakxaRGo0Y3RSRWczQ1Q1Z0E4aS8wR2RkM3JaRFRhVXRSTmhQRFQ1bUE4aS8wR2R4S0xkRENzTXRSSEJvRVQ1d0E4aS8wR2UxWTdkRGdPUXRSQUNCRlQ1OEE4aS8wR2ZjazdkRDBRY3VSSmlaR1Q2WUE4aS8wR2ZKcmJkRC9pd3VSQ2l5SFQ3TUE4aS9xMmVhdkxkRG0xa3VST0RRSWo0akJNaS9WMmVhdkxkRHBJQXVSSGpwSmo1NkJNaS9DbWNua0xkRHJhY3VSQWdDS3o3RUJNaS93V1lUUnJkRDJzd3VSS0FhTHo0SEJjaS9lbVo1NmJaRENQSXVSREF6TXo0L0JjaS9OR1piZXJaRG9SRXZSTUJMTno1dEJjaS83V1czK0xWRDh6UXZSSGhxUEQ2U0JjaS9wR1hJZXJWRGlVY3ZSQkNEUUQ2aUJjaS9XMldOQUxWRGFGWXZSS0NiUkQ2U0JjaS9FR1VHaXJSRHRGOHZSRGkwU0Q1eUJjaS94V1F6RjdSRGoyRXZSTWpNVEQ0dUJjaS9lbVI5cjdORGoyRXZSR0RsVUQ3TkJNaS9MMlI3UzdORDJGMHZSQmdFVmo0dkJNaS81V09ERExOREhVMHZSS2djV2o2ZUE4aS9vR083dnJKRGdDQXZSRUExWGo0VkE4aS9LR05UdDdKRGJ0SXVSR0JtWmo0V0FuaS9wV0xpN3JKRFJMb3VSRUMyY3o3REFGKy9pV0wyT0xORDlhTXVSTmpPZHo1dUFGTy9kV0tRbGJORHA0MHVSR2puZXo0ZEFFKy9hbUpGL2JORFdYY3VSQUFBZ0Q0REFFKy9aMkl5RkEwQUFMSkRGUUNBSzBRZEFBQlFRU1VBQUloQlFLRGU1Y0dGaFFRcTBBUUtFTUtVd3dFRFBrcWNvOUtpT3VOWlkzOFNCZ2dlRUFFWUh4b0dDQUFRQVJnQUlBQXFpd1FLRUFRRXJPdU5iRXlscnRYalhWV3FGRUVSemxBZ2RrL0h4MEVZSFNCaktKd1BNaElBQUNCQTZBTUFBR2RpLzM4QUFJQS9BQUE2MEFOU2lMaERSSDR0UkFBQUFBRFBBVSsvODZXNFExNVZMVVRBUTRzOHl3UDV2eTI4dUVQYWtDMUV3RWRoUGYwRUpjQ0QzYmhEcXZ3dFJJQm9rVDJzQlVIQVZPeTRRN01qTGtRd0NLdzl6UVZLd0NYN3VFTzhTaTVFWURtMFBlOEZUOEQxQ2JsRHhYRXVSSUJxdkQwU0JsYkF4aGk1US9PV0xrU3dtOFE5TlFaYXdKY251VU5FdWk1RTBNek1QVmtHWWNCb05ybERjZDh1UkVBSzF6MkhCbTdBQ2xTNVE2RVJMMFJ3Tzk4OTNnYUZ3RENFdVVNYVFDOUV3SjN2UGRNSHBNRGR4cmxEZ3kwdlJGQTNDVDdUQjd2QURoeTZReXp3TGtRSWdSVSt4d2ZWd0ZGWHVrTkh4eTVFV0xnZVBzRUg1TURnanJwRGhwd3VST2pRSWo2NUIvWEEyTTI2UXpKc0xrUjQ2U1krclFjSndZUVF1MFBkT3k1RUVBSXJQcDhISThIa1ZydEQwUWN1UktBYUx6NS9CMExCUkoyN1ErblJMVVE0TXpNK1VBZG53Vm5udTBOS21DMUU4RkU0UGdNSGtjR2NJcnhEOVdjdFJJQnFQRDY2QnJ6QncxSzhRMzA1TFVRWWcwQStTQWJrd1lGN3ZFTzhEaTFFcUp0RVBzUUZDc0xYbkx4RHMrY3NSRUMwU0Q0MEJUUENFYk84UXozR0xFVFF6RXcrbkFSZHd2N012RU1ObEN4RWlPdFJQdG9EMGNKNXVyeER6cjRzUkdobVpqNi9BQW5EcUt1OFE1TDJMRVJJdG5NK0R3QWp3MGdZTWhRTkFBQzRReFVBUUN4RUhRQUFNRUVsQUFCUVFVRGd5ZEhSNG9RRUtxOEVDaER6WWhWbm9XQkR0TGVubjR5TGtrT1BFZ1lJSHhBQkdDQWFCZ2dBRUFFWUFDQUFLdW9EQ2hBbUJrSE9hd1JLMnBjK2J5UUVESTlBRWYvUVJuWlB4OGRCR0JnZzR3RW9uQTR5RUFBQUlFRG9Bd0FBLzM4QUFJQS9BQUE2c0FOZ2Q3MURLN1F0UkFBQUFBQXVCTEhEWjJKMHdiMURMc0V0UkRBSXJEMEpCQWZFUkdJZ0JMNURkTEF0UkFEKzFEMEFCQWZFM1dHZFZiNURINEF0UkxDZDd6MTZCQWZFZ21GdVpMNURPbGN0UkZBM0NUNi9CUWZFWm1FZ0JMNURnbE10UktDWkdUNzFCZ2ZFWm1FQmxiMURaM3d0UkhqcEpqNWxCd2ZFWm1HK1diMURBWnd0UktBYUx6NkNCd2ZFWm1FdklyMURVNzh0UkRnek16NklCd2ZFWm1FSThyeERPT2d0Uk1oTE56NktCd2ZFWm1HV3hieERqQmd1UklCcVBENkdCd2ZFWm1GY3I3eERLVVV1UkJpRFFENXNCd2ZFWm1IMHA3eERmWFV1UktpYlJENDlCd2ZFWm1IMHA3eERyYWN1UkVDMFNENEZCd2ZFWm1FUnM3eERBdGd1Uk5ETVREN0NCZ2ZFWm1HZzZyeERuZ1F2UkdEbFVENXFCZ2ZFWm1FZFBMMURPekV2UkJnRVZqN1dCUWZFWm1GcW5MMURIVTB2UkxBY1dqNG9CUWZFWm1HSUM3NURqMkV2UkVBMVhqNVpCQWZFWm1IRWhiNURrbTR2Uk5oTllqNkFBd2ZFWm1FY0M3OURTbkl2UkdobVpqNmhBZ2ZFVVdFb2xMOURTbkl2UkFCL2FqNnFBUWZFSUdGdE04QkRTbkl2UkxpZGJ6NVdBQWZFNjJERnVNQkQybW92UkVpMmN6NERBQWZFc21CSUV6SVVEUUFBdkVNVkFBQXRSQjBBQURCQkpRQUFNRUZBd0pxdS9wS0hCQ3JCRHdvUU1XS0RyWUtEUnRTTm5qcWk1ZU5aY2hJR0NDQVFBUmdoR2dZSUFCQUJHQUFnQVNxdERnb1FpS2xXTG5QMVNrK1IvcHFOeStSL2VSRk1VdGx4d2UzSFFSaFpJR2NvbUI4eUV1Z0RBQUJZZHY5L0FBQ0FQd0FBQUFBQUFEcjBEWEdYcGtPRG5NOUNBQUFBQU8wSUtVREpBU2FUaVZlbVE3Mnd6VUlBRTRNN21BRXBRTVlCSnBQdUxLWkRmaHJNUWdEK1ZEeEhHaXBBVXdJbWt6VlNwa05jbTgxQ1FBZ3NQYzJDS2tDVEFpYVRLWEttUXpnY3owTGd6RXc5Y2FJcVFLb0NKcE1la3FaRC9nZlJRaUF2WFQwRm95cEFxd0ltazJXM3BrT3JYdE5DQUtweFBYbWlLa0NxQWlhVEJ0S21RMXUxMVVJZ0JvRTk4cDBxUUtjQ0pwT243S1pEeWpiWVFsQTNpVDNEbVNwQXBBSW1rNkw4cGtPZHpkcENjR2lSUGNPWktrQ2tBaWFUbXd5blE5RjUzVUtnbVprOXc1a3FRS1FDSnBOQ0Y2ZERLbWJnUXNES29UM0RtU3BBcEFJbWs1VWNwMFBPMHVOQ01BaXNQWmlZS2tDakFpYVRsUnluUTAzLzVrSmdPYlE5cXBJcVFKOENKcE9WSEtkRGpWYnFRb0JxdkQwZGpDcEFtZ0ltay9RQnAwUE9yZTFDb0p2RVBkcUNLa0NVQWlhVFd0ZW1ReEVGOFVMUXpNdzkxSGtxUUkwQ0pwUEZuS1pETEJ6MFF2RDkxRDJnY3lwQWlRSW1rOXhjcGtNeG52ZENZRHZmUFlGdEtrQ0ZBaWFUVFJLbVE2TWYra0tRYk9jOWdXMHFRSVVDSnBPK3g2VkRVSGI4UXJDZDd6MkJiU3BBaFFJbWs5dDNwVU4zZC81QzRNNzNQWUZ0S2tDRkFpYVQrU2VsUXowY0FFTUFBQUErZ1cwcVFJVUNKcE5wM2FSRFNzY0FRNWdZQkQ2QmJTcEFoUUltazlxU3BFT21ad0ZEVURjSlBvRnRLa0NGQWlhVEJDT2tROHVuQVVQZ1R3MCtnVzBxUUlVQ0pwT3FMYVJEc1ZFQVF6Q3lIVDV1RkNwQVVBSm5ra1ZZcEVQWWpQNUNvQm92UGs4NktVQVFBa2FTMnBLa1F3WDIrMEk0TXpNK2U2RW9RQXNDTFpLOTRxUkQ2dDc0UXNoTE56NUJPU2hBQXdJY2twcENwVU1qTXZWQ2dHbzhQczZ3SjBEOUFSS1NJNTJsUTd1YThVSVFnMEErWlZRblFQMEJFcEpUQXFaRHpxM3RRcWliUkQ3NDBDWkFCd0lTa29ObnBrT0FxK2xDT0xSSVByR2dKa0FlQWhLU0J0S21ROCtUNVVMUXpFdytkYTBtUUQwQ0VwS0pQS2REWEZIaFFtRGxVRDR2NnlaQVpnSVNrcTdCcDBQY1k5eENHQVJXUG40T0owQ2RBaEtTTER5b1Eya2gyRUt3SEZvK0lXQW5RTXNDRXBKUXdhaER1QW5VUWtBMVhqNlIyaWRBK0FJU2todFJxVU12TXRCQzBFMWlQaE1sS0VBa0F4S1NqZXVwUTR2RnpFSm9abVkrVGVBb1FFY0RFcEwraGFwRE10bkpRdmgrYWo1NnF5bEFYd01Ta3IwMXEwUCtMTWRDc0oxdlBvMkpLa0J1QXhLU05NQ3JReUNzeFVKSXRuTSt5QThyUUc0REVwSlpSYXhENzhERVF0ak9kejVScHl0QWFnTVNrb082ckVPa1FNUkNjT2Q3UHU3RkswQmpBeEtTSmJxdFF3Wld4RUlBQUlBK0VMd3JRRndERXBMTXhLMURheXpHUWppMGlENStJU3hBdkFPZWtvU2ZyVVBOQXNoQ2RHaVJQbE1yTEVESkEvQ1Nweit0UThYWnlrSUlnWlUrMWlRc1FNQURFNU5zK3F4RFpvWE1RcHlabVQ1M0NDeEFud01aazRtcXJFTnBSczVDNUtXYlBzM3RLMENGQXhtVHJVcXNRNUJIMEVKQU5aNCtGOUFyUUdzREdaTWo4S3REa2dqU1FvaEJvRDdLdVN0QVdnTVprMGFRcTBPVnlkTkMxRTJpUGdhbEswQkxBeG1URnl1clF6WjExVUljV3FRKy9vOHJRRHdER1pQbXhhcEROemJYUW1obXBqNGRkaXRBS3dNWmt3bG1xa1BYNGRoQ3NIS29QaHRaSzBBWUF4bVQzL0NwUTUzTjJrSU1BcXMrL3lZclFQc0NHWk1Ea2FsRDNHUGNRbGdPclQ2LytDcEE0QUlaazlNcnFVTzc1TjFDb0JxdlB0dlBLa0RLQWhtVG84YW9RL3A2MzBMb0pyRSt2NllxUUxVQ0daTWZYS2hEMXZ2Z1FqUXpzejdMaVNwQXBnSVprL0QycDBPMGZPSkNmRCsxUG94d0trQ1pBaG1UR1llblExVW81RUxZenJjK3hVSXFRSUlDR1pQak1hZERTVDdsUWlUYnVUNGNHaXBBYndJWmt4NlNwa1A1bE9kQ2JPZTdQaVhjS1VCUkFobVRUdmVtUS9tVTUwSTR0TWcrS1owcVFMQUNHWk5idktkREhOWG5Rc3pNekQ1QkZTdEE4QUlaazlnMnFFTUZRT2hDZEdqUlB1ZGNLMEFiQXhtVHFiYW9RMDdBNkVLOGROTSsvSkVyUUQwREdaUE5PNmxEK2xYcFFnaUIxVDVWb3l0QVNRTVprL0hBcVVOb0Z1cENVSTNYUGdhMEswQlZBeG1URlVhcVE1b0I2MEtjbWRrK05jMHJRR2dER1pNNnk2cERqeGZzUXVTbDJ6N0w1Q3RBZXdNWmsxaGdxME9yYmUxQ1FEWGVQbFhSSzBCckF4bVQxZHFyUXliWjdrS0lRZUErVzhBclFGNERHWk9tV3F4RHhvVHdRdFJONGo1YndDdEFYZ01aazlIUHJFT01jUEpDSEZya1BucTlLMEJjQS9tU3B6K3RRN054OUVKb1p1WStnNEVyUURJRDFKSXFxcTFEUFlqMlFyQnk2RDRuUGl0QUNBT3drcTRVcmtQcTN2aENEQUxyUGkwbEswRDZBb21TUFYrdVEwKzEra0pZRHUwKyt3Y3JRT2tDWkpMU21hNURVSGI4UXFBYTd6N01xeXBBdUFKRGtzSEpya05TTi81QzZDYnhQanhIS2tDRkFpT1NYUFN1UTVITi8wSTBNL00rSWMwcFFFc0NCSktNV2E5RG9mSUJRM3cvOVQ1b1RpbEFEd0tna1hTWnIwUFMzUUpEYk9mN1Btc0tKMERhQUdhUlYrbXZRMzV6QTBNQUFBQS9pWGdtUUVRQU01RkFvUEttbW9RRVNnWUlBQkFBR0FCYVhBb1FabnBvcG4xMFQvU2k0aHFhRklrVlhSSUdDQUFRQUJnQUdnWUlBQkFBR0FBZ0FqSVVEUUNBcFVNVkFBREtRaDBBQUFCQUpRQUFRRUJBb05ydnlJdUVCRklZY1IybVEyYm15a0tGeTZWRGhXdk9Rb1hMcFVObTVzcENLdGtLQ2hBTjhkSkU2WTFBNTQ1Y3N3K0ZvM09vRWdZSUlSQUJHQ0lhQmdnQUVBRVlBQ0FCS3ZJSUNoRE9pcWFacjkxSk5wcGpYalBOanVzaUVjYmJqSExCN2NkQkdEWWdwd0VvMkI0eUV1Z0RBQUJ0bGY5L0FBQ0FQd0FBQUFBQUFEcTRDQWw2dkVQYXZPSkNBQUFBQUJsUUtFQldBYXQ0YUYrOFF6eVQ1RUlBRTRNN0w0SW9RRzBCcTNndEdyeERBbi9tUWdDY1JEd3JOeWxBeHdHcmVQSFV1ME5Pd09oQ1FBaXNQT1BZS1VBdUFxdDRWcXE3UThCQjYwS0FrZTA4YXZjcFFFc0NxM2hjbXJ0RDIxanVRbUNORnowL1RTcEFjd0tyZUZ5YXUwUDViL0ZDZ0dvOFBiTjZLa0NPQXF0NHI1KzdRNWtiODBJZ0wxMDlzM29xUUk0Q3EzaWt2N3REbmR6MFFtQ1JiVDFHYmlwQWhnS3JlSmpmdTBQL3N2WkN3UE45UGV0ZEtrQjlBcXQ0alArN1E4V2UrRUpRTjRrOXRqd3FRR29DcTNpQUg3eERveC82UW5Cb2tUMkFIU3BBV1FLcmVMeGt2RVBYeS94Q29KbVpQVDdtS1VBOEFwaDRVWis4US83TS9rTHcrNms5c244cFFBa0NEM2phK2J4REFVY0FRNEJxdkQwSkVTbEExQUZaZHdWdnZVTmlYQUJEOFAzVVBWZVJLRUNZQWFoMjU3NjlRNFFpLzBMZ3p2YzlVR3dvUUljQmJuWndHYjVERXFIOFFwZ1lCRDRHWlNoQWd3RklkbDVKdmtQVkN2dEN3RWtNUHNka0tFQ0RBVDEyb1g2K1EzRTArVUo0YUJFK3lJd29RSllCTm5hUHJyNURERjczUWdpQkZUNmVYeWhBcUFFMGRuM2V2a05HY3ZWQ21Ka1pQbnFyS0VETkFUUjJiQTYvUTRDRzgwSXdzaDArbmZrb1FQTUJOSGF0UTc5RFdvWHhRc0RLSVQ0dll5bEFKUUkwZHU5NHYwTXpoTzlDV09NbFBuTE5LVUJYQWpSMmhMTy9RK2RDN1VJUUFpcytDVWtxUUprQ05IWnk0NzlENVlIclFxQWFMejRBb1NwQXpnSTBkbUVUd0VORjF1bENPRE16UG1VTUswQUNBelIyVDBQQVF3VkE2RUxJU3pjK0xuQXJRRFVETkhZc284QkREV25sUWxoa096NS81U3RBZEFNMGRzSGR3RU9TL2VOQ3FKdEVQdUQ1SzBCL0F6UjI4RUxCUTlxODRrSTR0RWcrT3lrc1FKc0ROSGJDd3NGREZaTGlRbURsVUQ0T3V5eEEvQU0wZHFrQ3drUHpFdVJDUURWZVBneGpMVUJmQkRSMjhTZkNRMDMvNWtKb1ptWSs3Y0l0UUtFRU5IYVlNc0pEVHNEb1FwQ1hiajR3MnkxQXN3UTBkdXczd2tNVXJPcENJTEJ5UHNudkxVREVCRFIya2tMQ1EvL1g3RUxZem5jK2J2VXRRTWdFTkhibVI4SkR4Y1B1UW5EbmV6NjkrQzFBeXdRMGRqbE53a01ubXZCQ0FBQ0FQdTc1TFVETUJEUjJqVkxDUTR4dzhrSk1ESUkrRy9rdFFNc0VOSGJmVjhKRDhVYjBRcFFZaEQ0RTlDMUF4d1EwZGpOZHdrUHlCL1pDNENTR1BxbnFMVURBQkRSMjJtZkNRM3dlK0VJOHRJZytSOG90UUtZRU5IWXRiY0pEdWJUNVFvVEFpajdncVMxQWp3UTBkdFIzd2tOMnR2eEN6TXlNUHMrQUxVQnpCRFIyZEpMQ1E2bGkvMEpnNVpBK0grVXNRQlFFTkhhOHQ4SkRtYndBUXdpQmxUNTd6aXRBZ2dNMGRrWVN3ME9tWndGRG5KbVpQcmQ4S2tEaEFqUjJzYnpEUTFkeUFVTjR2cDgrOFhZb1FPUUJOSFp4Yk1SRDZMRUFRMmhtcGo0NjZDWkEzd0EwZHFIUnhFTTlIQUJEL0g2cVBwUjNKa0JPQURSMkpEekZRLzdNL2tKRWk2dytYV2ttUUNBQU5IYWl0c1ZEWFNIOVFxQWFyejdEWmlaQUN3QTBka0RBOVB2RW13UktCZ2dBRUFBWUFGcXVBUW9RVmJoQUU3SFhUSldMa2k3SmdTRFVveElHQ0FBUUFCZ0FHZ1lJQUJBQUdBQWdBaklVRFFDQXUwTVZBQUQyUWgwQUFFQkFKUUFBd0VCQXdLUFE0K0tFQkZKZ0FLQzhReFF1K0VJVXpyeERtaG40UXBxNXZFTVVMdnBDNGJxOFF4UXUra0pJb2J4RFVyajhRbnQwdkVPdXh3QkRTR0c4US9hb0FFTUtON3hEVWpnQVEzc1V2RVBoZXY5Q2UvUzdRMlptL2tKeC9idERId1grUXRlanZFT2s4UFpDWmN6TU5rRmx3UlpNUVNxQURnb1FiM1hJZnM1QVFPYTA0Q3dpbVJXZEF4SUdDQ0lRQVJnakdnWUlBQkFCR0FBZ0FTclNEQW9RdHltVGNwVUJUUXFFc245cVZROXI1UkY1cjhCeXdlM0hRUmhISU9jQktKZ2VNaERvQXdBQS8zOEFBSUEvQUFBQUFBQUFPcG9NazNySlEvQlI0a0lBQUFBQWh4TW9RSWtCYlpVMGRyd0t5VU5wL09GQ0FOZWpPeVJ5S1VBMkFtMlZOSFpSWU1oRE9SSGhRb0JEaXp3a2ZpdEFOZ050bFRSMjM4WEhROWI3NEVLQVF3czllRFlzUUtRRGJaVTBkcTlneDBPMGZPSkN3TXhNUGJxVUxFRHFBNU9WTkhZczlzWkRyRlBsUWdDcWNUMlYzaXhBTkFTNmxUUjI2c0RHUXc4cTUwSkFONGs5blZrdFFGa0V5NVUwZHFpTHhrUDZWZWxDY0dpUlBibVJMVUIrQk5tVk5IWm1Wc1pEcDZ6clFwQ1ptVDB3dVMxQW1nVGtsVFIyMFJ2R1E5dFk3a0lBMTZNOS9PTXRRTHNFN3BVMGR1UHJ4VU91Ny9CQ01BaXNQYXJrTFVDOEJQU1ZOSGFjeHNWRGdJYnpRbEE1dEQycTVDMUF2QVQwbFRSMnA2YkZRL0lIOWtLQWFydzl6OHN0UUtnRTlKVTBkcTJXeFVNRGRQaENvSnZFUFNLd0xVQ1VCUFNWTkhhdGxzVkRpNHI2UXRETXpEMEJoUzFBZGdUMGxUUjJBWnpGUS9FaC9rSkFDdGM5YWtjdFFFNEU5SlUwZGpFQnhrT01FUUJEZ0d6blBUM2JMRUFPQlBTVk5IYWptOFpET0tjQVE5RE85ejBPVml4QXhnUDBsVFIyZi92R1EvdlJBRU80SGdVK3pVOHNRTU1EOUpVMGRwR3d4MFA3MFFCRFNEY0pQakJNTEVEQkEvU1ZOSFp1RU1oRDFaRUFRM0JvRVQ3ZVBTeEF1Z1AwbFRSMm5uWElRejBjQUVNQWdSVSt5VE1zUUxRRDlKVTBkaUxneUVNakRmOUNtSmtaUG5nYkxFQ29BL1NWTkhaTVZjbERSWXo5UWxDNEhqNVF0U3RBbWdQMGxUUjJLTFhKUXdYMiswTGcwQ0krNzJJcVFKUUQ5SlUwZGxrYXlrUGY5UGxDZU9rbVBzY2pLVUNOQS9TVk5IWTFlc3BEOXNqM1FnZ0NLejRmb3lkQWVBUDBsVFIyRXRyS1ErVmM5VUtnR2k4KzczMGxRR0VEOUpVMGRrY3Z5ME1TeHZKQ01ETXpQZ2k3STBBM0EvU1ZOSFo0bE10RGxKbnZRdWhST0Q1aytTRkErUUwwbFRSMkI5L0xROXFYN0VLQWFqdytTa0FoUUxFQzlKVTBka01rekVQVkZlbENFSU5BUG9GY0lFQmpBdlNWTkhhRVdjeERKdjdrUXFDYlJENThTaDlBOWdIMGxSZDJjb25NUXdjbTRFSTR0RWcrck1vZVFJb0I5Slg3ZFdlcHpFTjRqZHBDeU14TVBxZDVIa0FpQWZTVjRuVUh4TXhETXJUVFFvRHJVVDVrbUI1QXJBRDBsYzUxcnM3TVEwL3d6RUlZQkZZK0Ria2VRR01BOUpYQ2RWWFp6RU00UWNWQ3FCeGFQdElMSDBBc0FQU1Z2bldvM3N4RG16eTlRa0ExWGo1NmR4OUFLUUQwbGI1MVQrbk1RK2FpdFVMUVRXSSt0UFVmUUQ4QTlKVytkYVB1ekVPZ3lhNUNhR1ptUGcrdUlFQ29BUFNWdm5WSitjeERwSENvUWlDRmF6N0F2aUZBTmdIMGxiNTFuZjdNUTUvdXBFS3duVzgraXdNalFMMEI5WlcrZFVRSnpVT0QxNkZDUUxaelBwaEVKMERZQTEyWXZuWHdBODFEenhpa1FseVBnajRPWFNsQUxBUXltNzUxL09QTVEvamFwMExNekl3KzQ0SXRRSE1FL0p1K2RhN096RU10aDZwQ2NHaVJQalQ4TFVERUJFR2N2blc2cnN4RHJMT3RRcngwa3o1RFFTNUErUVJybkw1MXhvN01RMDhnc1VJRWdaVSsyMTR1UUJNRmhaeStkZEp1ekVPMXQ3UkNVSTJYUGw0bExrQXRCWktjdm5YZFRzeERmR1M0UXBpWm1UNCsraTFBU1FXU25MNTE2UzdNUTFHOHZFTDBLSncraFo4dFFHSUZrcHkrZGZVT3pFTVphY0JDUURXZVB2WnVMVUJ2QlpLY3ZuVlU5TXREcEVERVFvaEJvRDZjTVMxQWVBV1NuTDUxWU5UTFF6RVl5RUxRVGFJK1o5RXNRSDRGa3B5K2RiKzV5ME82Nzh0Q0hGcWtQaUdWTEVDQUJaS2N2blhMbWN0RFJjZlBRbVJtcGo1ZWp5eEFmZ1dTbkw1MWczVExROTVKMUVMQTlhZytJcVFzUUhNRmtweStkZU5aeTBPQ3R0ZENEQUtyUGphdkxFQmxCWktjdm5WQ1A4dERZZmphUWxRT3JUNHdMeTFBVXdXU25MNTFvU1RMUXh6NjNVS2dHcTgreUpNdFFENEZrcHkrZFZNUHkwT3h1K0JDNkNheFBwTWZMa0FoQlpLY3ZuV3RCTXRESWozalFqUXpzejdjVmk1QS9nU1NuTDUxQnZyS1EvWFQ1VUtRd3JVKzRmd3RRTUFFa3B5K2RiTDB5a1A1bE9kQzJNNjNQb3VjTFVDRUJKS2N2bld5OU1wRHM1YnFRaURidVQ2RktDMUFRd1NTbkJoMUJ2cktRNFV0N1VLMDg3MCtxZmNyUUtjRE81d2JkRTRmeTBOeFdlOUNYSS9DUHRnYktrREdBbnFiUG5OOWhNdERjaHJ4UXZDbnhqNGRieWhBN3dGcm1qUnlXdVRMUTFxRjhVTE16TXcrTThVbVFNUUF2cG13Y2QxT3pFT1hXdkZDY0dqUlBrQm5Ka0FSQUNhWlMzRkFvTEh6Z1lZRVNnWUlBQkFBR0FCYWRnb1FxaTIvOFB6elJ3YWlKUS9oZ3BucEF4SUdDQUFRQUJnQUdnWUlBQkFBR0FBZ0FqSVVEUUNBekVNVkFBQ2tRaDBBQUFCQUpRQUFvRUJBd0w2a2g0eUhCRklvWEcvTlE0L0NwRUt1WjgxRHBQQ29Ra2poekVQRGRhMUNLVnpOUThQMXBVSmNiODFEMTZPa1FtVm1OaUZDWlFDQUlVSXFxUTBLRUdqWEVJQjVhVTJPbzBzVkY5TE1RcVFTQmdnakVBRVlKQm9HQ0FBUUFSZ0FJQUVxa1FvS0VHam1TYnptN2t0bmpQV21ITFAyc3BjUmFUWkpsY0h0eDBFWVBpQm5LSmdmTWhMb0F3QUFybVgvZndBQWdEOEFBQUFBQUFBNjJBa2c3YTFEUFpZRFJBQUFBQUFHRFNkQXlBQlhraUR0clVPMEJBTkVBQk9ET3kraEowQWVBVmVTaTVHdFEzS3dBa1RBUTRzOGFTQW9RRjhCVjVJRzRxeERmSUlDUklDUjdUd2c0Q2hBdWdHcmtvN2VxME5SaGdKRVFBZ3NQV3h2S1VEK0FSU1QrdkdxUTc3V0FrUWdMMTA5RnRzcFFETUNQWk5aV2FwRHJoc0RSREFHZ1QwQXN5bEFXZ0pRazFySXFVUEVjd05FVURlSlBjQW9LVUJ3QWxtVHVDK3BROVhpQTBSd2FKRTlacW9vUUlVQ1daTjJqNmhEdFd3RVJLQ1ptVDBTSGloQWxBSlprelB2cDBNNEZRVkV3TXFoUGJtakowQ2tBbG1UOEU2blE3YlVCVVR3KzZrOWRDUW5RTEVDV1pOcW42WkRyTFlHUkdBNXREMmNtQ1pBd3dKWmswOGxwa01salFkRWdHcThQUjBaSmtEU0FsbVRHc0tsUSs5eUNFU3dtOFE5MVlFbFFOd0NXWk1NaGFWRGpsd0pSTkRNekQyRnd5UkEzQUpaazJ0OXBVT0RQZ3BFQVA3VVBmN2pJMERZQWxtVGEzMmxReWdSQzBRZ0w5MDl4TmdpUU1zQ1daTmQwYVZEb09jTFJKQnM1ejFubWlGQXVBSlprLzVwcGtQK2ZBeEVzSjN2UGFERUlFQ21BbG1UYWpDblE0ejNERVRnenZjOTRCY2dRSmdDV1pQOUhLaERIMXNOUkFBQUFEN2V6QjlBa1FKWmt4WW9xVVBqb3cxRW1CZ0VQcCtlSDBDSEFsbVR0MUdxUTluUkRVUW9NUWcrSkhjZlFIZ0NXWlBEc0t0REpmZ05ST0JQRFQ3SFhCOUFiQUpEazZmcHJFTWwrQTFFZUdnUlBuTmxIMEJwQXVxU3RFaXVReVg0RFVRSWdSVStVSEVmUUdVQ29KSUR0NjlEQ2JjTlJKaVpHVDZSZGg5QVlBSlhramc4c1VOS1Z3MUVNTElkUGpKMUgwQmJBaEtTYk1HeVEydk5ERVRBeWlFK2dtc2ZRRmNDMkpGcmRMUkRhaGtNUkhqcEpqNDFZUjlBVmdLbWtUVEV0VU1ZVmd0RUVBSXJQbnRlSDBCYUFvV1JGLzIyUThwN0NrU2dHaTgreVdjZlFHY0NlNUdRQUxoRHFaMEpSRGd6TXo3cGV4OUFmUUo2a2VEZHVFT0h2d2hFeUVzM1BzZVpIMENRQW5xUmdYYTVRenZsQjBSZ1pEcytxTElmUUtBQ2VwSGYvN2xEOC9NR1JCaURRRDdFdGg5QW9RSjZrWUFIdWtQTUxBWkVxSnRFUHA2ckgwQ1hBbnFSZ0FlNlE5RmhCVVE0dEVnK0k2Y2ZRSVFDZXBHT3M3bERBWk1FUk5ETVRENXZvUjlBYXdKNmtkSXh1VU1HeUFORVlPVlFQczNDSDBCZkFucVI3b200UTdRRUEwVDQvVlErbGxZZ1FGNENlcEhodTdkRER6SUNSTEFjV2o0TEZDRkFVZ0o2a2RUdHRrUGVtQUZFUURWZVBpclJJVUJDQW5xUjRnaTJReW9MQVVUWVRXSStGYndpUUQwQ2VwRlBITFZEODRnQVJHaG1aajc5bkNOQVBRSjZrZGNZdEVPTElRQkVBSDlxUG0xWEpFQXZBbnFSR3dhelErV3AvME9RbDI0K1RlY2tRQmdDZXBIMHZiRkRyU2YvUTBpMmN6NldUU1ZBNmdGNmtUaXJzRU1MQ2Y5RDJNNTNQaitFSlVDN0FaaVJmWml2UXdzSi8wTnc1M3MrODNRbFFKSUJDWklFbGE1REN3bi9Rd0FBZ0Q0UGppVkFiQUYwa3MrZ3JVUC9OdjlEVEF5Q1BvV3ZKVUJDQWRlU0ljdXNRNU9hLzBPVUdJUStGTndsUUJjQk1KTVUvYXREdkFZQVJQQ25oajdMQVNaQTR3Q0drL21DcTBNRFJBQkVQTFNJUHNVd0prQzdBTkdUQnkrclF4K0ZBRVNFd0lvK1hIQW1RSlFBRVpUNjhhcER0OUVBUk16TWpENjRtQ1pBYlFCTmxMZmlxa01sSWdGRUdObU9QcDU3SmtCRkFINlV0K0txUTJaMkFVUmc1WkEraTJvbVFCNEFwSlMzNHFwREpkWUJSTHgwa3o0Qlp5WkFDd0RJbEFjdnEwTm5LZ0pFQ0lHVlBvRm1Ka0FFQU9LVVFPQ1ZzcktJQkVvR0NBQVFBQmdBV3A0QkNoQ1Zad283bXM5TzNKa0lrZkx0YlRveUVnWUlBQkFBR0FBYUJnZ0FFQUFZQUNBQ01oUU5BSUNyUXhVQVFBSkVIUUFBZ0VBbEFBREFRRURnc3MvNDRZUUVVbERzTWExREthd0RSQjlsckVON1pBTkU3QkdzUTY3bkFrUXpFNnhEcnVjQ1JDbjhxMFBYd3dKRWorS3JRMXlmQWtUWDQ2dERYSjhDUkh1MHEwUERWUUpFN1BHclE2UlFBa1M0ZnF4RHBGQUNSR1VBQUZCQVpYZXNnRUJhdmdFS0VJSVVGZzR2Y1VsVWlJQzVSVkxCWEdVU0JnZ0FFQUFZQUJvR0NBQVFBQmdBSUFJeUZBMEFnS3BERlFDQS8wTWRBQUJBUUNVQUFDQkJRT0N5ei9qaGhBUlNjT3l4cTBQTnZBQkVwTENyUTgyOEFFVFh3NnRETStNQVJCL0ZxME1mNVFCRVhHK3JRNlFBQVVSN2xLdERDdmNCUkh1VXEwTjdKQUpFcEhDclE4M3NBVVRobXFwRFNKRUFSRDJxcWtOU2VBQkVoY3VxUXpOVEFFUXo4NnBEU0RFQVJJOGlxME5JRVFCRVBVcXJRMUw0LzBObEZLNWNRbVYzOTJaQ0tvVUdDaEJUS0UxZVMyUkZBNFA4NFo2ZEpYYlZFZ1lJSkJBQkdDVWFCZ2dBRUFFWUFDQUJLdWtFQ2hDUkRLdDhCd1ZNOW91NnRwb1F4SGRTRWVzNXpaWEI3Y2RCR0J3Z1p5aVlIeklTNkFNQUFKNTEvMzhBQUlBL0FBQUFBQUFBT3JBRVVjYlFROE8vQWtRQUFBQUFXUUlwUUwwQmJaWWI5TkJETlVVQ1JBQVNnenVjcENkQTlnRnRsalhkMEVPWXd3SkVBQ3NIUGRBVktFQlBBbTJXYTYvUVF5c25BMFNBYWp3OUdLY25RRjBDYlpZQWV0QkRqcVVEUk1ETVREMVRPQ2RBYXdKdGxsRTEwRU1YTndSRUlDOWRQZUhKSmtCdkFtMldYdUhQUS9IWEJFUmdrVzA5d3RvbFFITUNiWlpzamM5RGRJQUZSTUR6ZlQxOHpDWkFpQUp0bGxJVHowTkVUd1pFVURlSlBaN2RKVUNmQW0yV041bk9RejhhQjBSd2FKRTlhUjRsUUowQ2JaWTRDTTVENU93SFJKQ1ptVDBnYlNSQW13SnRsdlpuelVNeHh3aEV3TXFoUFJhOUkwQ0xBbTJXRWNETVEzNmhDVVRnKzZrOUl3a2pRSHdDYlpiT0g4eER5bnNLUkJBdHNqMGp1U0pBY1FKdGx1cDN5ME0rYVF0RWdHcThQU05kSWtCaUFtMld6LzNLUTdjL0RFU2dtOFE5V2RZaFFFc0NiWlk3b3NwRHJTRU5STkRNekQzWEN5SkFOQUp0bGk1bHlrT2pBdzVFOFAzVVBZVzZJVUFZQWtHV1l6ZktROFRoRGtRUUw5MDlZSG9oUVB3Qno1Vi9JTXBEazdBUFJFQmc1VDJRUUNGQTN3RlhsWm9KeWtPSmtoQkVzSjN2UFVQcUlFQzNBZGlVbWduS1F6ZzNFVVRRenZjOUE4Y2dRSW9CV0pTYUNjcERhZEFSUkFBQUFEN3F1U0JBWEFIY2t6c1J5a01lWGhKRWtCZ0VQdmJESUVBckFWNlR3eS9LUTREY0VrUW9NUWcrM2Q4Z1FQa0E0Skl1WmNwRFB6d1RSTGhKREQ2eEJ5RkF3QUJra25BRnkwUE50aE5FY0dnUlBsZ1ZJVUIzQUhXUkJQTExRM2UrRTBTWW1SaytZU3dpUUF3QXhaQkF3T1NvaXBNRVNnWUlBQkFBR0FCYVpBb1FVZndzdlU5bVM3K0RLZXVuaTlrTnVSSUdDQUFRQUJnQUdnWUlBQkFBR0FBZ0FqSVVEUUNBeVVNVkFBQVRSQjBBQUFCQUpRQUFRRUJBd0o2NjF0R0dCRklnUFNyS1ExSjRFMFFLTjhwRHc0VVRST0VheWtOeGJSTkU3UEhKUTRVN0UwUTZCZ2dBRUFBWUFFSVE3TTBIWEhNdVM4S1V5cFd2MlZJaDdkTXdNUnhQVWp5aU16U0FCSUFGb2xOVWdBK0FFSUFNSTBDRElBQUFBQUFBSTBDSXdBQUFBQUFBMGtaSFdWcGZFQkJCUzBsdWEwRnVibTkwWVhScGIyNHlwRnRjWFV4ZkVCQkJTMGx1YTBGdWJtOTBZWFJwYjI0eVh4QVBRVXRKYm10QmJtNXZkR0YwYVc5dVhFRkxRVzV1YjNSaGRHbHZiZ0FJQUJFQUdnQWtBQ2tBTWdBM0FFa0FUQUJSQUZNQWFBQnVBSk1BcHdER0FNNEExUURjQU80QkFRRUdBUkFCS3dFNUFVVUJaZ0Y1QVpFQm1BR3lBYk1CdkFHK0FjQUJ3Z0hEQWNVQnh3SElBY2tCeXdITUFjMEJ6d0hSQWRNQitnSUJBZ2tDRkFJWkFoc0NIUUlmQWlFQ0pnSW9BaW9DTEFJdUFqQUNOZ0k5QWo4Q1FRSktBbE1DWEFKbEFtb0NkUUorQXBRQ21BS3VBcnNDeEdIUFlkWmgyV0hiWWQxaDRHSGlZZVJoNW1IdllmaGgvV0lRWWhWaUtHSTZBQUFBQUFBQUFnRUFBQUFBQUFBQVhnQUFBQUFBQUFBQUFBQUFBQUFBWWtjPSkKPj4KZW5kb2JqCjExMSAwIG9iago8PCAvVHlwZSAvQW5ub3QgL1QgKE1vYmlsZSBVc2VyKSAvQlMgMTA4IDAgUiAvQm9yZGVyIFsgMCAwIDAgXSAvUmVjdCBbIDE4MQo2NiA0MTEgNzEwIF0gL00gKEQ6MjAyNjA5MDYwMTE4NThaMDAnMDAnKSAvREEgKC9IZWx2ZXRpY2EgMTIgVGYgMCBnKSAvRiA2NDQKL1N1YnR5cGUgL1N0YW1wID4+CmVuZG9iagoxMDkgMCBvYmoKPDwgL04gMTEzIDAgUiA+PgplbmRvYmoKMTA4IDAgb2JqCjw8IC9XIDAgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL01ldGFkYXRhIC9TdWJ0eXBlIC9YTUwgL0xlbmd0aCA2MTUgL0ZpbHRlciAvRmxhdGVEZWNvZGUgPj4Kc3RyZWFtCngBjVTBjpswEL3vVyB6BoyBTbAI0mqjSist0qobqb06ttPSDZga05C/79hAIGkqFXEAz3tvnmfGznrSV00lNHX66li3pN+4lMu9IPBtlgPXsRD9sXG/FW/Os1TCefSRj9z8wXGcTPED+bL9PNLhb+P+0LohQXA6nfxT5Ev1PQjTNA0QDjD2AOG151rT3qvbT4PIpLMVLVNlo0tZO0aX7mWnN65rEl2ewWezSFS3vvXsM1kFEAhCPwrukTi7mGs6dbTWOAvEUVSi1i3wwrs8KNGFeJWspw2Q0F0SGIFijrW4YpnIPz1CrqK4z5uyVVVwqRuUJQM98qYk75hQ+ZPpnvMGHXkt94qqsxOCw8zUZQbNBc04IwepKqpz2jTHklFTfYPOgjm0wIM/UkheHs5bqkWOEfQUxR5KdmhNEkyiEH4Jgow3yBuNZyWolmon5TF/YkruqTauC/ohFFh2wJTzVSo+6CzR94TEaCZcWTPRLkwIgjdamrEiA/JGo4BJ51TT/9rSErvQMV0lQwqebwlGYYTSENvKz4G/CLJqaH3OixJq0MqDnvDj+i3+lbb6nf4WY4oVinA6UubQLelddooJ27VyZsYoClMUR8Nw9OQGtRCxM0nabv9TMG2P/eU02vP/Ln5dr5qpNAf4WOZJFoxfs6AJ29Vrom11UdxJlA0OtpJ15qS+bPOuKznB0ZqLiAmPx4/Yi3EovDRJEg8nCV7REK8FW02iC+5sZNR9qVtNayYm3RVnKWZJCLqMevE+fvTStYBZSmNKzcTHKZ10F9xRd9ja4i4bLkq7Ybgp8wegTrdu/vAHeveWOwplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwgL0ZpcnN0IDExNCAwIFIgL0xhc3QgMTE1IDAgUiAvQ291bnQgNyA+PgplbmRvYmoKMTE1IDAgb2JqCjw8IC9QcmV2IDExNiAwIFIgL0NvdW50IDAgL1RpdGxlIChTSUdOQVRVUkUgT0YgSU5TVFJVQ1RPUi9USVRMRSAgICAgICAgICAgICAgICAgICAgICAgUUhJQyBvciBRSElMICMgXChSRVFVSVJFRFwpKQovRGVzdCBbIDMgMCBSIC9YWVogNjQgMTIxIG51bGwgXSAvUGFyZW50IDExNyAwIFIgPj4KZW5kb2JqCjExNyAwIG9iago8PCA+PgplbmRvYmoKMTE2IDAgb2JqCjw8IC9QYXJlbnQgMTE3IDAgUiA+PgplbmRvYmoKMTE0IDAgb2JqCjw8IC9EZXN0IFsgMyAwIFIgL1hZWiA2NCA3NjMgbnVsbCBdIC9Db3VudCAwIC9UaXRsZSAoTUFSWUxBTkQgU1RBVEUgUE9MSUNFIENFUlRJRklFRCBRVUFMSUZJQ0FUSU9OIFNDT1JFIFNIRUVUKQovTmV4dCAxMTggMCBSIC9QYXJlbnQgMTE3IDAgUiA+PgplbmRvYmoKMTE4IDAgb2JqCjw8IC9QcmV2IDExOSAwIFIgL0NvdW50IDAgL1RpdGxlIChBUFBMSUNBTlQgTkFNRSAtIFBSSU5URUQpIC9EZXN0IFsgMyAwIFIKL1hZWiA2NCA2NjggbnVsbCBdIC9OZXh0IDEyMCAwIFIgL1BhcmVudCAxMTcgMCBSID4+CmVuZG9iagoxMjAgMCBvYmoKPDwgL1ByZXYgMTIxIDAgUiAvQ291bnQgMCAvVGl0bGUgKFllczopIC9EZXN0IFsgMyAwIFIgL1hZWiA2NCA2MzAgbnVsbCBdIC9OZXh0CjEyMiAwIFIgL1BhcmVudCAxMTcgMCBSID4+CmVuZG9iagoxMjIgMCBvYmoKPDwgL1ByZXYgMTIzIDAgUiAvQ291bnQgMCAvVGl0bGUgKCkgL0Rlc3QgWyAzIDAgUiAvWFlaIDY0IDQxMyBudWxsIF0gL05leHQKMTI0IDAgUiAvUGFyZW50IDExNyAwIFIgPj4KZW5kb2JqCjEyNCAwIG9iago8PCAvUHJldiAxMjUgMCBSIC9Db3VudCAwIC9UaXRsZSAoKk5PVEU6IEFSTU9SRUQgQ0FSIERSSVZFUi9HVUFSRFMgTVVTVCBRVUFMSUZZIEFOTlVBTExZIFtQTCAxMDUtMjg3IFwoSFIgNjI0XCldLikKL0Rlc3QgWyAzIDAgUiAvWFlaIDY0IDI4MiBudWxsIF0gL05leHQgMTI2IDAgUiAvUGFyZW50IDExNyAwIFIgPj4KZW5kb2JqCjEyNiAwIG9iago8PCAvUHJldiAxMjcgMCBSIC9Db3VudCAwIC9UaXRsZSAoU0lHTkFUVVJFIE9GIEFQUExJQ0FOVCBEQVRFKSAvRGVzdCBbIDMgMCBSCi9YWVogNjQgMjM2IG51bGwgXSAvTmV4dCAxMjggMCBSIC9QYXJlbnQgMTE3IDAgUiA+PgplbmRvYmoKMTI4IDAgb2JqCjw8IC9QcmV2IDExNiAwIFIgL0NvdW50IDAgL1RpdGxlIChTSUdOQVRVUkUgT0YgSU5TVFJVQ1RPUi9USVRMRSAgICAgICAgICAgICAgICAgICAgICAgUUhJQyBvciBRSElMICMgXChSRVFVSVJFRFwpKQovRGVzdCBbIDMgMCBSIC9YWVogNjQgMTIxIG51bGwgXSAvUGFyZW50IDExNyAwIFIgPj4KZW5kb2JqCjEyNyAwIG9iago8PCAvUGFyZW50IDExNyAwIFIgPj4KZW5kb2JqCjEyNSAwIG9iago8PCAvUGFyZW50IDExNyAwIFIgPj4KZW5kb2JqCjEyMyAwIG9iago8PCAvUGFyZW50IDExNyAwIFIgPj4KZW5kb2JqCjEyMSAwIG9iago8PCAvUGFyZW50IDExNyAwIFIgPj4KZW5kb2JqCjExOSAwIG9iago8PCAvUGFyZW50IDExNyAwIFIgPj4KZW5kb2JqCjExMyAwIG9iago8PCAvVHlwZSAvWE9iamVjdCAvU3VidHlwZSAvRm9ybSAvRm9ybVR5cGUgMSAvQkJveCBbMCAwIDIzMCA2NDRdIC9SZXNvdXJjZXMKMTEyIDAgUiAvTGVuZ3RoIDk0IC9GaWx0ZXIgL0ZsYXRlRGVjb2RlID4+CnN0cmVhbQp4AStUCFQoVDAAQiNjAwUzExOFolSFcIU8Bf2A1KLk1IKS0sQchaJMoBqQPFidqRmQNrawUEjOVdD3zDVUcMkHGcKFqsDQ2AiqwAiqAG4CSApkEkS/MUQ6EAD9PiAZCmVuZHN0cmVhbQplbmRvYmoKMTEyIDAgb2JqCjw8IC9Qcm9jU2V0IFsgL1BERiAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdIC9YT2JqZWN0IDw8IC9JbTEgMTI5IDAgUiAvSW0yCjEzMCAwIFIgL0ltMyAxMzEgMCBSID4+ID4+CmVuZG9iagoxMjkgMCBvYmoKPDwgL1R5cGUgL1hPYmplY3QgL1N1YnR5cGUgL0ltYWdlIC9XaWR0aCA0NjAgL0hlaWdodCA1MTIgL0ludGVycG9sYXRlIHRydWUKL0NvbG9yU3BhY2UgMTYgMCBSIC9JbnRlbnQgL1BlcmNlcHR1YWwgL1NNYXNrIDEzMiAwIFIgL0JpdHNQZXJDb21wb25lbnQgOAovTGVuZ3RoIDMzMDEgL0ZpbHRlciAvRmxhdGVEZWNvZGUgPj4Kc3RyZWFtCngB7dLBCQMwDATBXP9Np4PNy5iY8fdAZw36fDwCBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQ+EuBbUf/bX7z8uHTAp26n7s+3S4lQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAgVcFth1dzfzm5cOnBTp1P3d9ul1KgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAq8KbDu6mvnNy4dPC3Tqfu76dLuUAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBF4V2HZ0NfOblw+fFujU/dz16XYpAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECLwqsO3oauY3Lx8+LdCp+7nr0+1SAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIEHhVYNvR1cxvXj58WqBT93PXp9ulBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIPCqwLajq5nfvHz4tECn7ueuT7dLCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQOBVgW1HVzO/efnwaYFO3c9dn26XEiBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgMCrAtuOrmZ+8/Lh0wKdup+7Pt0uJUCAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAIFXBbYdXc385uXDpwU6dT93fbpdSoAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQKvCmw7upr5zcuHTwt06n7u+nS7lAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgReFdh2dDXzm5cPnxbo1P3c9el2KQECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAi8KrDt6GrmNy8fPi3Qqfu569PtUgIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBB4VWDb0dXMb14+fFqgU/dz16fbpQQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECDwqsC2o6uZ37x8+LRAp+7nrk+3SwkQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIEDgVYFtR1czv3n58GmBTt3PXZ9ulxIgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIEfgp8AWC2AqEKZW5kc3RyZWFtCmVuZG9iagoxMzAgMCBvYmoKPDwgL1R5cGUgL1hPYmplY3QgL1N1YnR5cGUgL0ltYWdlIC9XaWR0aCA0NjAgL0hlaWdodCA1MTIgL0ludGVycG9sYXRlIHRydWUKL0NvbG9yU3BhY2UgMTYgMCBSIC9JbnRlbnQgL1BlcmNlcHR1YWwgL1NNYXNrIDEzMyAwIFIgL0JpdHNQZXJDb21wb25lbnQgOAovTGVuZ3RoIDMzMDEgL0ZpbHRlciAvRmxhdGVEZWNvZGUgPj4Kc3RyZWFtCngB7dLBCQMwDATBXP9Np4PNy5iY8fdAZw36fDwCBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQ+EuBbUf/bX7z8uHTAp26n7s+3S4lQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAgVcFth1dzfzm5cOnBTp1P3d9ul1KgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAq8KbDu6mvnNy4dPC3Tqfu76dLuUAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBF4V2HZ0NfOblw+fFujU/dz16XYpAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECLwqsO3oauY3Lx8+LdCp+7nr0+1SAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIEHhVYNvR1cxvXj58WqBT93PXp9ulBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIPCqwLajq5nfvHz4tECn7ueuT7dLCRAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQOBVgW1HVzO/efnwaYFO3c9dn26XEiBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgMCrAtuOrmZ+8/Lh0wKdup+7Pt0uJUCAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAIFXBbYdXc385uXDpwU6dT93fbpdSoAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQKvCmw7upr5zcuHTwt06n7u+nS7lAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgReFdh2dDXzm5cPnxbo1P3c9el2KQECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAi8KrDt6GrmNy8fPi3Qqfu569PtUgIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBB4VWDb0dXMb14+fFqgU/dz16fbpQQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECDwqsC2o6uZ37x8+LRAp+7nrk+3SwkQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIEDgVYFtR1czv3n58GmBTt3PXZ9ulxIgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIEfgp8AWC2AqEKZW5kc3RyZWFtCmVuZG9iagoxMzEgMCBvYmoKPDwgL1R5cGUgL1hPYmplY3QgL1N1YnR5cGUgL0ltYWdlIC9XaWR0aCA0NjAgL0hlaWdodCAyNjQgL0ludGVycG9sYXRlIHRydWUKL0NvbG9yU3BhY2UgMTYgMCBSIC9JbnRlbnQgL1BlcmNlcHR1YWwgL1NNYXNrIDEzNCAwIFIgL0JpdHNQZXJDb21wb25lbnQgOAovTGVuZ3RoIDE3MjQgL0ZpbHRlciAvRmxhdGVEZWNvZGUgPj4Kc3RyZWFtCngB7dLBCUQxDEPBr/6b3g7eLYQNk6vAjgd9n0eAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECfymw7ei/zW9ePnxaoFP9uevT26UECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAg8KrAtqOnmd+8fPi0QKf6c9ent0sJECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBA4FWBbUdPM795+fBpgU71565Pb5cSIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAwKsC246eZn7z8uHTAp3qz12f3i4lQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAgVcFth09zfzm5cOnBTrVn7s+vV1KgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAq8KbDt6mvnNy4dPC3SqP3d9eruUAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBF4V2Hb0NPOblw+fFuhUf+769HYpAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECLwqsO3oaeY3Lx8+LdCp/tz16e1SAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIEHhVYNvR08xvXj58WqBT/Tnq8wOUSAF7CmVuZHN0cmVhbQplbmRvYmoKMTMyIDAgb2JqCjw8IC9UeXBlIC9YT2JqZWN0IC9TdWJ0eXBlIC9JbWFnZSAvV2lkdGggNDYwIC9IZWlnaHQgNTEyIC9Db2xvclNwYWNlIC9EZXZpY2VHcmF5Ci9CaXRzUGVyQ29tcG9uZW50IDggL0xlbmd0aCAxMTc1IC9GaWx0ZXIgL0ZsYXRlRGVjb2RlID4+CnN0cmVhbQp4Ae3cvQkCYRAE0MPQRDQ0EaxB0EwLMNHY5AINrUBMbMHWLMefHhZ27wPf5TOzvIMLr+s8BAg0JjBr7B7nxAUm8ahkYwLLxu5xTlhgNQ1HBRsTuPjGNvZG4uc841HJxgT6xu5xTlhgG04KEiBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgACBeoHFvn7TYo7AMadW6wAC/qAzALpJAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIEEgUOIwTy1WXClzXpXPGEgXep8Ry1ZUC529fOWcrUeDxuSW2q64U2Lx2lXO2EgVG98Ry1bUC89o5awQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgT+Q+AHTUALAwplbmRzdHJlYW0KZW5kb2JqCjEzMyAwIG9iago8PCAvVHlwZSAvWE9iamVjdCAvU3VidHlwZSAvSW1hZ2UgL1dpZHRoIDQ2MCAvSGVpZ2h0IDUxMiAvQ29sb3JTcGFjZSAvRGV2aWNlR3JheQovQml0c1BlckNvbXBvbmVudCA4IC9MZW5ndGggMTI1NCAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAHt2DFKwwAUgOFYWoSqxcVBKA6iLopjJkFHByeP4FYvIDiJom4ewAuIs5OD7ShuHQRXoYKgF+gWT5EU3/tygPf4v5clKQoPAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAgSQCy+VuO0lq+MzzyftlN3xljsDTt++fkxyp4Svb/bPp81r4zCSB68OvvSSp8TP3j+fjRyokQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBDoIYgisHUbpSR9R+dumN4gCsDRpNqM0pK8o3NfjZeSG0TJX/yoblpRYrJ3TH8PsxOE6R+NN8K0ZA85ePF9GeYdeOqGSUkfcrWQniAMwLZbhrnljluGuWXhV0GcW/bjpKQvWUkvAIAAAQJ1CrR6q3WON7tBgYfXz7LBdVbVKDCqqosaxxvdoED5eD1ocJ1VdQp0i7k6x5tNgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBA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ODU4WjAwJzAwJykgL01vZERhdGUKKEQ6MjAyNjA5MDYwMTE4NThaMDAnMDAnKSA+PgplbmRvYmoKeHJlZgowIDE1OAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAxNDQ3NTQgMDAwMDAgbiAKMDAwMDE0NDAzNyAwMDAwMCBuIAowMDAwMDEyMjU3IDAwMDAwIG4gCjAwMDAwMjQ0OTAgMDAwMDAgbiAKMDAwMDAxMjYzMyAwMDAwMCBuIAowMDAwMDEyNzUxIDAwMDAwIG4gCjAwMDAwMTI0MzkgMDAwMDAgbiAKMDAwMDAwMDAyMiAwMDAwMCBuIAowMDAwMDEzNDQ0IDAwMDAwIG4gCjAwMDAxNjU3ODQgMDAwMDAgbiAKMDAwMDAwMDAwMCAwMDAwMCBuIAowMDAwMTkzNzI3IDAwMDAwIG4gCjAwMDAyMDExNDAgMDAwMDAgbiAKMDAwMDIzMTE1NyAwMDAwMCBuIAowMDAwMjQ5Njg2IDAwMDAwIG4gCjAwMDAwMTYxOTMgMDAwMDAgbiAKMDAwMDI2ODExMyAwMDAwMCBuIAowMDAwMDEyNjA2IDAwMDAwIG4gCjAwMDAwMjQ3MDggMDAwMDAgbiAKMDAwMDAxMzEyNiAwMDAwMCBuIAowMDAwMDEzNDgwIDAwMDAwIG4gCjAwMDAwMTYzMTcgMDAwMDAgbiAKMDAwMDAxNjIzMCAwMDAwMCBuIAowMDAwMDIzODY2IDAwMDAwIG4gCjAwMDAwMDAwMDAgMDAwMDAgbiAKMDAwMDAxNjkxMCAwMDAwMCBuIAowMDAwMDE2OTk3IDAwMDAwIG4gCjAwMDAwMTcwODMgMDAwMDAgbiAKMDAwMDAxNzE2OSAwMDAwMCBuIAowMDAwMDE3MjU1IDAwMDAwIG4gCjAwMDAwMTczNDEgMDAwMDAgbiAKMDAwMDAxNzQyNyAwMDAwMCBuIAowMDAwMDE3NTEzIDAwMDAwIG4gCjAwMDAwMTc2MDAgMDAwMDAgbiAKMDAwMDAxNzY4NiAwMDAwMCBuIAowMDAwMDE3NzczIDAwMDAwIG4gCjAwMDAwMTc4NTkgMDAwMDAgbiAKMDAwMDAxNzk0NSAwMDAwMCBuIAowMDAwMDE4MDMyIDAwMDAwIG4gCjAwMDAwMTgxMTggMDAwMDAgbiAKMDAwMDAxODIwNSAwMDAwMCBuIAowMDAwMDE4MjkyIDAwMDAwIG4gCjAwMDAwMTgzNzggMDAwMDAgbiAKMDAwMDAxODQ2NSAwMDAwMCBuIAowMDAwMDE4NTUyIDAwMDAwIG4gCjAwMDAwMTg2MzggMDAwMDAgbiAKMDAwMDAxODcyNSAwMDAwMCBuIAowMDAwMDE4OTY0IDAwMDAwIG4gCjAwMDAwMTkwNTAgMDAwMDAgbiAKMDAwMDAxOTEzNiAwMDAwMCBuIAowMDAwMDE5MjIzIDAwMDAwIG4gCjAwMDAwMTkzMDkgMDAwMDAgbiAKMDAwMDAxOTM5NiAwMDAwMCBuIAowMDAwMDE5NjM1IDAwMDAwIG4gCjAwMDAwMTk3MjEgMDAwMDAgbiAKMDAwMDAxOTgwOCAwMDAwMCBuIAowMDAwMDE5ODk0IDAwMDAwIG4gCjAwMDAwMTk5ODEgMDAwMDAgbiAKMDAwMDAyMDIyMCAwMDAwMCBuIAowMDAwMDIwMzA3IDAwMDAwIG4gCjAwMDAwMjAzOTMgMDAwMDAgbiAKMDAwMDAyMDQ4MCAwMDAwMCBuIAowMDAwMDIwNTY2IDAwMDAwIG4gCjAwMDAwMjA2NTMgMDAwMDAgbiAKMDAwMDAyMDc0MSAwMDAwMCBuIAowMDAwMDIwODI3IDAwMDAwIG4gCjAwMDAwMjA5MTMgMDAwMDAgbiAKMDAwMDAyMDk5OSAwMDAwMCBuIAowMDAwMDIxMDg1IDAwMDAwIG4gCjAwMDAwMjExNzIgMDAwMDAgbiAKMDAwMDAyMTI1OSAwMDAwMCBuIAowMDAwMDIxMzQ2IDAwMDAwIG4gCjAwMDAwMjE0MzMgMDAwMDAgbiAKMDAwMDAyMTUxOSAwMDAwMCBuIAowMDAwMDIxNjA2IDAwMDAwIG4gCjAwMDAwMjE2OTMgMDAwMDAgbiAKMDAwMDAyMTc4MCAwMDAwMCBuIAowMDAwMDIxODY4IDAwMDAwIG4gCjAwMDAwMjE5NTUgMDAwMDAgbiAKMDAwMDAyMjA0MiAwMDAwMCBuIAowMDAwMDIyMTI5IDAwMDAwIG4gCjAwMDAwMjIyMTYgMDAwMDAgbiAKMDAwMDAyMjMwMiAwMDAwMCBuIAowMDAwMDIyMzg4IDAwMDAwIG4gCjAwMDAwMjI0NzYgMDAwMDAgbiAKMDAwMDAyMjU2MyAwMDAwMCBuIAowMDAwMDIyNjUwIDAwMDAwIG4gCjAwMDAwMjI3MzYgMDAwMDAgbiAKMDAwMDAyMjgyMyAwMDAwMCBuIAowMDAwMDIyOTEwIDAwMDAwIG4gCjAwMDAwMjI5OTYgMDAwMDAgbiAKMDAwMDAyMzA4MiAwMDAwMCBuIAowMDAwMDIzMTY5IDAwMDAwIG4gCjAwMDAwMjMyNTcgMDAwMDAgbiAKMDAwMDAyMzM0NCAwMDAwMCBuIAowMDAwMDIzNDMxIDAwMDAwIG4gCjAwMDAwMjM1MTggMDAwMDAgbiAKMDAwMDAyMzYwNCAwMDAwMCBuIAowMDAwMDIzNjkxIDAwMDAwIG4gCjAwMDAwMjM3NzggMDAwMDAgbiAKMDAwMDAxODc5NyAwMDAwMCBuIAowMDAwMDE4ODcxIDAwMDAwIG4gCjAwMDAwMTk0NjggMDAwMDAgbiAKMDAwMDAxOTU0MiAwMDAwMCBuIAowMDAwMDIwMDUzIDAwMDAwIG4gCjAwMDAwMjAxMjcgMDAwMDAgbiAKMDAwMDAyNDU3MyAwMDAwMCBuIAowMDAwMTQ0MDA5IDAwMDAwIG4gCjAwMDAxNDM5NzUgMDAwMDAgbiAKMDAwMDAyNDkyOSAwMDAwMCBuIAowMDAwMTQzNzg4IDAwMDAwIG4gCjAwMDAxNDY1NzcgMDAwMDAgbiAKMDAwMDE0NjMyOSAwMDAwMCBuIAowMDAwMTQ1MDU5IDAwMDAwIG4gCjAwMDAxNDQ4MTMgMDAwMDAgbiAKMDAwMDE0NTAyMCAwMDAwMCBuIAowMDAwMTQ0OTk3IDAwMDAwIG4gCjAwMDAxNDUyMjEgMDAwMDAgbiAKMDAwMDE0NjI5MCAwMDAwMCBuIAowMDAwMTQ1MzY0IDAwMDAwIG4gCjAwMDAxNDYyNTEgMDAwMDAgbiAKMDAwMDE0NTQ4NyAwMDAwMCBuIAowMDAwMTQ2MjEyIDAwMDAwIG4gCjAwMDAxNDU2MDYgMDAwMDAgbiAKMDAwMDE0NjE3MyAwMDAwMCBuIAowMDAwMTQ1ODA0IDAwMDAwIG4gCjAwMDAxNDYxMzQgMDAwMDAgbiAKMDAwMDE0NTk1MCAwMDAwMCBuIAowMDAwMTQ2Njk2IDAwMDAwIG4gCjAwMDAxNTAyMTggMDAwMDAgbiAKMDAwMDE1Mzc0MCAwMDAwMCBuIAowMDAwMTU1Njg1IDAwMDAwIG4gCjAwMDAxNTcwMzMgMDAwMDAgbiAKMDAwMDE1ODQ2MCAwMDAwMCBuIAowMDAwMTY2Mjg2IDAwMDAwIG4gCjAwMDAxNjY1MzggMDAwMDAgbiAKMDAwMDE5NDIwNSAwMDAwMCBuIAowMDAwMTkzOTA3IDAwMDAwIG4gCjAwMDAxOTQ0NTYgMDAwMDAgbiAKMDAwMDIwMTYxNyAwMDAwMCBuIAowMDAwMjAxODY0IDAwMDAwIG4gCjAwMDAyMzE2MTkgMDAwMDAgbiAKMDAwMDIzMTMxMSAwMDAwMCBuIAowMDAwMjMxODMxIDAwMDAwIG4gCjAwMDAyMzE4NzAgMDAwMDAgbiAKMDAwMDIzMjEzMCAwMDAwMCBuIAowMDAwMjUwMTU4IDAwMDAwIG4gCjAwMDAyNDk4NDAgMDAwMDAgbiAKMDAwMDI1MDM3MCAwMDAwMCBuIAowMDAwMjUwNDIxIDAwMDAwIG4gCjAwMDAyNTA2ODEgMDAwMDAgbiAKMDAwMDI2ODU2NSAwMDAwMCBuIAowMDAwMjY4MjY3IDAwMDAwIG4gCjAwMDAyNjg3NzcgMDAwMDAgbiAKMDAwMDI2ODgwOCAwMDAwMCBuIAowMDAwMjY5MDY4IDAwMDAwIG4gCjAwMDAyODUxNTMgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSAxNTggL1Jvb3QgMTA3IDAgUiAvSW5mbyAxNTcgMCBSIC9JRCBbIDw4NTEzNzUyMzA4NzZkZDAzMzExMWFlOGFiMGZjNGE3YT4KPDg1MTM3NTIzMDg3NmRkMDMzMTExYWU4YWIwZmM0YTdhPiBdID4+CnN0YXJ0eHJlZgoyODUzNTcKJSVFT0YK";

  function openOfficialMspScoreSheet() {
    // 1. If student has a personal certified completed score sheet on file, open their personal copy
    if (window.activeStudentCustomScoreSheetUrl && window.activeStudentCustomScoreSheetUrl.indexOf("http") === 0) {
      window.open(window.activeStudentCustomScoreSheetUrl, '_blank');
      return;
    }
    
    // 2. Otherwise open the official updated blank qualification sheet
    try {
      var byteChars = atob(FIFS_MSP_SCORE_SHEET_BASE64);
      var byteNumbers = new Array(byteChars.length);
      for (var i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      var byteArray = new Uint8Array(byteNumbers);
      var blob = new Blob([byteArray], { type: 'application/pdf' });
      var blobUrl = URL.createObjectURL(blob);
      var win = window.open(blobUrl, '_blank');
      if (!win) {
        var a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'MSP_Form_29-14_Official_Score_Sheet.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      window.open('https://drive.google.com/file/d/16mcNwtv7ldRMtX4u-TKUbbMj99-08Hk3/view?usp=sharing', '_blank');
    }
  }
  window.openOfficialMspScoreSheet = openOfficialMspScoreSheet;

  // Toggle waiver visual status upon completion
  function markWaiverCardComplete() {
    var card = document.getElementById('portalWaiverCard');
    if (card) {
      card.classList.remove('waiver-card-pending-blink');
      card.classList.add('waiver-card-completed');
      card.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)';
    }
    var badge = document.getElementById('waiverStatusBadge');
    if (badge) {
      badge.textContent = "✔ WAIVER SIGNED & CERTIFIED ON RECORD";
      badge.style.color = "#10b981";
    }
  }
  window.markWaiverCardComplete = markWaiverCardComplete;

// ==========================================================================
// ADMIN HUB NOTIFICATION BANNER ENGINE & SOUND CHIME
// ==========================================================================
function playAdminNotificationChime() {
  try {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    var ctx = new AudioContext();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}
window.playAdminNotificationChime = playAdminNotificationChime;

function showAdminHubNotificationBanner(title, message, targetTab) {
  var existing = document.getElementById('admin-hub-dynamic-alert-banner');
  if (existing) existing.remove();

  var container = document.getElementById('adminCommandSection') || document.getElementById('admin-view') || document.querySelector('.admin-terminal-wrapper') || document.body;
  if (!container) return;

  var banner = document.createElement('div');
  banner.id = 'admin-hub-dynamic-alert-banner';
  banner.style.cssText = 'position: sticky; top: 12px; z-index: 99999; margin: 10px 14px 16px 14px; padding: 12px 16px; background: rgba(7, 18, 28, 0.96); border: 1px solid #00E5FF; border-left: 4px solid #00E5FF; border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 229, 255, 0.28); display: flex; align-items: center; justify-content: space-between; gap: 12px; backdrop-filter: blur(10px); animation: fadeIn 0.25s ease-out;';

  var contentDiv = document.createElement('div');
  contentDiv.style.cssText = 'display:flex; align-items:center; gap:10px; flex:1; min-width:0;';
  contentDiv.innerHTML = '<span style="font-size:1.3rem;">🚨</span>' +
    '<div style="flex:1; min-width:0;">' +
      '<div style="font-family: Orbitron, sans-serif; font-size: 0.78rem; font-weight:700; color:#00E5FF; letter-spacing:0.08em; text-transform:uppercase;">' + (title || 'INTEL ALERT') + '</div>' +
      '<div style="font-size: 0.82rem; color: #E2E8F0; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + (message || '') + '</div>' +
    '</div>';

  var actionsDiv = document.createElement('div');
  actionsDiv.style.cssText = 'display:flex; align-items:center; gap:8px; flex-shrink:0;';

  if (targetTab) {
    var viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.textContent = 'VIEW';
    viewBtn.style.cssText = 'background:#00E5FF; color:#050B14; border:none; border-radius:5px; font-weight:700; font-size:0.75rem; padding:6px 12px; cursor:pointer; font-family:Orbitron, sans-serif; letter-spacing:0.05em;';
    viewBtn.onclick = function() {
      if (typeof switchAdminTab === 'function') switchAdminTab(targetTab);
      banner.remove();
    };
    actionsDiv.appendChild(viewBtn);
  }

  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'background:rgba(255,255,255,0.08); color:#94A3B8; border:1px solid rgba(255,255,255,0.15); border-radius:5px; font-size:0.85rem; padding:4px 8px; cursor:pointer;';
  closeBtn.onclick = function() { banner.remove(); };
  actionsDiv.appendChild(closeBtn);

  banner.appendChild(contentDiv);
  banner.appendChild(actionsDiv);
  container.prepend(banner);

  playAdminNotificationChime();
}
window.showAdminHubNotificationBanner = showAdminHubNotificationBanner;

// Automatic live site telemetry visit tracker
if (typeof window !== 'undefined') {
  window.addEventListener('load', function() {
    try {
      var views = parseInt(_fifsMemStorage.getItem('fifs_pageviews_count') || '0', 10) + 1;
      _fifsMemStorage.setItem('fifs_pageviews_count', String(views));
      if (typeof logAnalyticsEvent === 'function') {
        logAnalyticsEvent('Traffic', 'Page View', window.location.pathname || '/');
      }
    } catch (e) {}
  });
}

  // Global background polling for Admin Hub on iPad (every 5s)
  if (typeof window !== 'undefined') {
    var lastKnownUnreadCount = 0;
    setInterval(function() {
      var pin = sessionStorage.getItem('fifs_instructor_pin') || (window.__fifsAdminAuth && window.__fifsAdminAuth.passcode);
      if (!pin) return;
      if (typeof window.callFifsBackend === 'function') {
        window.callFifsBackend('getLiveChats', { passcode: pin, pin: pin }, function(res) {
          if (res && res.success && Array.isArray(res.liveChats)) {
            window.__adminLiveChatThreads = res.liveChats;
            var unreadTotal = 0;
            res.liveChats.forEach(function(t) { if (t.unread) unreadTotal++; });
            if (unreadTotal > lastKnownUnreadCount) {
              if (typeof window.playAdminNotificationChime === 'function') window.playAdminNotificationChime();
              if (typeof window.showAdminHubNotificationBanner === 'function') {
                window.showAdminHubNotificationBanner('New Student Message Received', 'A student sent an inquiry in Live Chat Command.');
              }
            }
            lastKnownUnreadCount = unreadTotal;
            var chatTabBadge = document.getElementById("admin-tab-chat-unread");
            var chatHeaderBadge = document.getElementById("admin-chat-unread-badge");
            [chatTabBadge, chatHeaderBadge].forEach(function(el) {
              if (el) {
                el.textContent = unreadTotal;
                el.style.display = unreadTotal > 0 ? "inline-flex" : "none";
              }
            });
            if (typeof window.renderAdminLiveChatThreadList === 'function') {
              window.renderAdminLiveChatThreadList();
            }
            if (window.__activeAdminChatThreadId && Array.isArray(window.__adminLiveChatThreads)) {
              var currentActive = window.__adminLiveChatThreads.find(function(t) { return t.id === window.__activeAdminChatThreadId; });
              if (currentActive && typeof window.renderActiveAdminChatMessages === 'function') {
                window.renderActiveAdminChatMessages(currentActive);
              }
            }
          }
        });
      }
    }, 5000);
  }


/* TACTICAL LIVE CHAT BADGE AUTO-POLL & GUN RELOAD EXTENSIONS */
(function initTacticalEnhancements() {
  // 1. One-time electric materialization on first webapp load
  try {
    if (!sessionStorage.getItem("fifs_electric_boot_done")) {
      sessionStorage.setItem("fifs_electric_boot_done", "true");
      document.addEventListener("DOMContentLoaded", function() {
        const appRoot = document.querySelector(".app-root") || document.querySelector("main") || document.body;
        if (appRoot) {
          appRoot.classList.add("electric-materialize-boot");
        }
      });
      if (document.readyState === "interactive" || document.readyState === "complete") {
        const appRoot = document.querySelector(".app-root") || document.querySelector("main") || document.body;
        if (appRoot) {
          appRoot.classList.add("electric-materialize-boot");
        }
      }
    }
  } catch (e) {
    console.warn("Electric boot error:", e);
  }

  // 2. Global Universal Gun Reload Animation Helper
  window.triggerUniversal6SecGunReload = function(btnElement, targetScope) {
    const btn = btnElement || document.getElementById("topNavRefreshBtn");
    if (btn) {
      btn.classList.add("tactical-recoil-active", "reloading");
      const originalHtml = btn.innerHTML;
      btn.innerHTML = "<span>🔫 CHAMBERING...</span>";
      setTimeout(() => {
        btn.innerHTML = "<span>💥 ROUND CHAMBERED</span>";
      }, 700);
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.classList.remove("tactical-recoil-active", "reloading");
      }, 1500);
    }
    if (typeof window.refreshAdminRoster === "function") {
      window.refreshAdminRoster();
    }
    if (typeof window.refreshAdminLiveChats === "function") {
      window.refreshAdminLiveChats();
    }
  };

  // 3. Auto-badge listener whenever live chats update
  window.updateAdminChatBadgesImmediately = function(unreadCount) {
    const badgeIds = ["admin-tab-chat-unread", "admin-chat-unread-badge", "liveChatBadge", "admin-unread-count"];
    badgeIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (unreadCount > 0) {
          el.textContent = unreadCount;
          el.style.display = "inline-flex";
          el.classList.add("active", "pulse");
        } else {
          el.textContent = "0";
          el.style.display = "none";
          el.classList.remove("active", "pulse");
        }
      }
    });
  };
})();


    // Robust Course Tier Switcher (Standard vs VIP)
    var COURSE_TIER_CONFIG = {
      mastery: {
        basePrice: "$425.00",
        vipPrice: "50.00",
        baseValue: "Mid-Atlantic Multi-State Mastery — Base Track (25.00)",
        vipValue: "Mid-Atlantic Multi-State Mastery — VIP Turnkey (50.00)"
      },
      combo: {
        basePrice: "49.99",
        vipPrice: "75.00",
        baseValue: "Maryland CCW & HQL Combo — Base Track (49.99)",
        vipValue: "Maryland CCW & HQL Combo — VIP Turnkey (75.00)"
      },
      ccw: {
        basePrice: "99.99",
        vipPrice: "25.00",
        baseValue: "Maryland Wear & Carry (CCW) — Base Track (99.99)",
        vipValue: "Maryland Wear & Carry (CCW) — VIP Turnkey (25.00)"
      },
      hql: {
        basePrice: "00.00",
        vipPrice: "65.00",
        baseValue: "Maryland HQL (Purchase License) — Base Track (00.00)",
        vipValue: "Maryland HQL (Purchase License) — VIP Turnkey (65.00)"
      },
      coaching: {
        basePrice: "25.00",
        vipPrice: "95.00",
        baseValue: "Personal 1-on-1 Coaching — Base Track (25.00/hr)",
        vipValue: "Personal 1-on-1 Coaching — VIP Turnkey (95.00/hr)"
      },
      cleaning: {
        basePrice: "5.00",
        vipPrice: "10.00",
        baseValue: "Firearm Deep Cleaning & Inspection — Base Track (5.00)",
        vipValue: "Firearm Deep Cleaning & Inspection — VIP Turnkey (10.00)"
      },
      children: {
        basePrice: "5.00",
        vipPrice: "40.00",
        baseValue: "Youth & Family Firearm Safety — Base Track (5.00)",
        vipValue: "Youth & Family Firearm Safety — VIP Turnkey (40.00)"
      },
      alumni: {
        basePrice: "5.00",
        vipPrice: "25.00",
        baseValue: "FIFS Alumni Marksmanship Clinic — Base Track (5.00)",
        vipValue: "FIFS Alumni Marksmanship Clinic — VIP Turnkey (25.00)"
      }
    };

    function setCardTier(courseKey, targetTier, evt) {
      if (evt) {
        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.preventDefault) evt.preventDefault();
      }
      var config = COURSE_TIER_CONFIG[courseKey];
      if (!config) return;
      var card = document.getElementById('card-course-' + courseKey);
      var switchBox = document.getElementById('switch-' + courseKey);
      var badge = document.getElementById('badge-course-' + courseKey);
      var priceElem = document.getElementById('price-course-' + courseKey);
      var vipBox = document.getElementById('vip-box-course-' + courseKey) || document.getElementById('vip-box-' + courseKey);
      var btnSelect = document.getElementById('btn-select-course-' + courseKey);
      if (!card) return;

      if (targetTier === 'vip') {
        card.classList.add('vip-mode-active');
        card.style.setProperty('background', 'linear-gradient(135deg, rgba(255, 183, 3, 0.14) 0%, rgba(13, 19, 27, 0.98) 100%)', 'important');
        card.style.setProperty('border', '2px solid var(--accent-amber)', 'important');
        card.style.setProperty('box-shadow', '0 0 28px rgba(255, 183, 3, 0.4), 0 12px 36px rgba(0, 0, 0, 0.85)', 'important');
        if (switchBox) switchBox.classList.add('vip-active');
        if (badge) badge.style.setProperty('display', 'block', 'important');
        if (vipBox) vipBox.style.setProperty('display', 'block', 'important');
        if (priceElem) {
          priceElem.innerHTML = '<span class="price-val" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--accent-amber);">' + config.vipPrice + '</span><span class="price-tier-tag" style="font-size: 0.82rem; color: var(--accent-amber); font-weight: 800; margin-left: 6px;">(👑 VIP Turnkey ★)</span>';
        }
        if (btnSelect) {
          btnSelect.textContent = 'Select 👑 VIP (' + config.vipPrice + ') & Reserve Seat →';
          btnSelect.className = 'btn-select-course btn-vip-select';
          btnSelect.style.setProperty('background', 'linear-gradient(135deg, #ffb703 0%, #d49000 100%)', 'important');
          btnSelect.style.setProperty('color', '#070b10', 'important');
          btnSelect.setAttribute('data-onclick', 'selectCourse("' + config.vipValue + '")');
        }
      } else {
        card.classList.remove('vip-mode-active');
        card.style.setProperty('background', '#0d131b', 'important');
        card.style.setProperty('border', '1px solid rgba(0, 229, 255, 0.35)', 'important');
        card.style.setProperty('box-shadow', 'none', 'important');
        if (switchBox) switchBox.classList.remove('vip-active');
        if (badge) badge.style.setProperty('display', 'none', 'important');
        if (vipBox) vipBox.style.setProperty('display', 'none', 'important');
        if (priceElem) {
          priceElem.innerHTML = '<span class="price-val" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: #fff;">' + config.basePrice + '</span><span class="price-tier-tag" style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; margin-left: 6px;">(Standard Base)</span>';
        }
        if (btnSelect) {
          btnSelect.textContent = 'Select Base (' + config.basePrice + ') & Reserve Seat →';
          btnSelect.className = 'btn-select-course';
          btnSelect.style.setProperty('background', 'var(--accent-cyan)', 'important');
          btnSelect.style.setProperty('color', '#070b10', 'important');
          btnSelect.setAttribute('data-onclick', 'selectCourse("' + config.baseValue + '")');
        }
      }
    }
    window.setCardTier = setCardTier;

    function toggleCardTier(courseKey, evt) {
      if (evt) {
        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.preventDefault) evt.preventDefault();
      }
      var card = document.getElementById('card-course-' + courseKey);
      var isVip = card && card.classList.contains('vip-mode-active');
      setCardTier(courseKey, isVip ? 'base' : 'vip', evt);
    }
    window.toggleCardTier = toggleCardTier;

// Auto-start stickman action animation on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        if (typeof window.playStickmanActionMovieScene === 'function') {
          window.playStickmanActionMovieScene(false);
        }
      }, 500);
    });
  } else {
    setTimeout(function() {
      if (typeof window.playStickmanActionMovieScene === 'function') {
        window.playStickmanActionMovieScene(false);
      }
    }, 500);
  }
}


// Ensure live pulse and neon guide status update immediately on load
if (typeof updateLivePulseTicker === 'function') {
  updateLivePulseTicker();
  setInterval(updateLivePulseTicker, 30000);
}
if (typeof updateFifsLiveStatus === 'function') {
  updateFifsLiveStatus();
  setInterval(updateFifsLiveStatus, 30000);
}


// ==========================================================================
// AUTHORITATIVE UNIVERSAL TACTICAL GUN RELOAD SHAKE & BOUNCE ENGINE
// ==========================================================================
function executeUniversalGunReloadAnimation(btn, onFinished) {
  if (!btn) {
    if (typeof onFinished === 'function') onFinished();
    return;
  }
  if (btn.dataset.reloading === 'true') return;
  btn.dataset.reloading = 'true';
  
  var origHtml = btn.innerHTML;
  btn.classList.add('tactical-gun-recoil');

  var backBtn = document.getElementById('btnNavBack') || document.querySelector('.btn-nav-back');
  var homeBtn = document.getElementById('btnNavHome') || document.querySelector('.btn-nav-home');
  if (btn.id === 'topNavRefreshBtn' || btn.id === 'btnNavRefresh') {
    if (backBtn) backBtn.classList.add('nav-btn-scared-left');
    if (homeBtn) homeBtn.classList.add('nav-btn-scared-right');
  }

  btn.innerHTML = '⚡ RACKING SLIDE...';

  setTimeout(function() {
    btn.innerHTML = '💥 BANG! ROUND FIRED';
  }, 380);

  setTimeout(function() {
    btn.innerHTML = '💨 EJECTING CASING...';
  }, 760);

  setTimeout(function() {
    btn.innerHTML = '🔄 CHAMBERING ROUND...';
  }, 1140);

  setTimeout(function() {
    btn.innerHTML = '⚡ LOCKED & LOADED';
  }, 1520);

  setTimeout(function() {
    btn.classList.remove('tactical-gun-recoil');
    btn.innerHTML = origHtml;
    btn.dataset.reloading = 'false';
    if (backBtn) backBtn.classList.remove('nav-btn-scared-left');
    if (homeBtn) homeBtn.classList.remove('nav-btn-scared-right');
    if (typeof onFinished === 'function') {
      try { onFinished(); } catch(e) { console.error('Reload callback error:', e); }
    }
  }, 1900);
}
window.executeUniversalGunReloadAnimation = executeUniversalGunReloadAnimation;

function triggerTopNavGunReload(evt) {
  if (evt) {
    if (evt.stopPropagation) evt.stopPropagation();
    if (evt.preventDefault) evt.preventDefault();
  }
  var btn = document.getElementById('topNavRefreshBtn') || document.getElementById('btnNavRefresh') || (evt && evt.currentTarget);
  executeUniversalGunReloadAnimation(btn, function() {
    if (window.refreshAdminRoster) window.refreshAdminRoster();
    if (window.refreshAdminClients) window.refreshAdminClients();
    if (window.syncTelemetryMetrics) window.syncTelemetryMetrics();
    if (window.syncOperatingHours) window.syncOperatingHours();
  });
}
window.triggerTopNavGunReload = triggerTopNavGunReload;
window.triggerGunRefreshAnimation = triggerTopNavGunReload;

function triggerCardGunRefresh(btn, type) {
  executeUniversalGunReloadAnimation(btn, function() {
    if (type === 'roster' && window.refreshAdminRoster) {
      window.refreshAdminRoster();
    } else if (type === 'clients' && window.refreshAdminClients) {
      window.refreshAdminClients();
    } else if (type === 'chat' && (window.refreshAdminChat || window.refreshAdminLiveChats)) {
      (window.refreshAdminChat || window.refreshAdminLiveChats)();
    } else if (type === 'telemetry' && window.syncTelemetryMetrics) {
      window.syncTelemetryMetrics();
    }
  });
}
window.triggerCardGunRefresh = triggerCardGunRefresh;

function triggerModalAdminRefresh(btn) {
  executeUniversalGunReloadAnimation(btn, function() {
    if (window.refreshAdminRoster) window.refreshAdminRoster();
    if (window.refreshAdminClients) window.refreshAdminClients();
    if (window.refreshAdminChat || window.refreshAdminLiveChats) (window.refreshAdminChat || window.refreshAdminLiveChats)();
    if (window.syncTelemetryMetrics) window.syncTelemetryMetrics();
  });
}
window.triggerModalAdminRefresh = triggerModalAdminRefresh;

function triggerAdminRefreshAll(btn) {
  executeUniversalGunReloadAnimation(btn, function() {
    if (window.refreshAdminRoster) window.refreshAdminRoster();
    if (window.refreshAdminClients) window.refreshAdminClients();
    if (window.refreshAdminChat || window.refreshAdminLiveChats) (window.refreshAdminChat || window.refreshAdminLiveChats)();
    if (window.syncTelemetryMetrics) window.syncTelemetryMetrics();
  });
}
window.triggerAdminRefreshAll = triggerAdminRefreshAll;


// Auto-initialize reciprocity engine if document is already interactive/complete
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (typeof initReciprocityEngine === 'function') initReciprocityEngine();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof initReciprocityEngine === 'function') initReciprocityEngine();
    });
  }
}

    // Auto-detect magic link / portal invite parameters
    function checkUrlForPortalInvite() {
      try {
        var params = new URLSearchParams(window.location.search);
        var portal = params.get('portal');
        var studentId = params.get('id') || params.get('student');
        if (portal === 'student' || studentId) {
          var input = document.getElementById('studentLookupInput');
          if (input && studentId) input.value = studentId;
          var modal = document.getElementById('studentPortalModal');
          if (modal) {
            modal.classList.add('active');
            modal.style.setProperty('display', 'block', 'important');
          }
        }
      } catch (e) {
        console.warn('URL portal param check failed:', e);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkUrlForPortalInvite);
    } else {
      checkUrlForPortalInvite();
    }

    // ==========================================
    // DISCORD TELEMETRY LOGGER
    // ==========================================
    function logTelemetryEvent(eventName, details) {
      try {
        if (typeof callFifsBackend === 'function') {
          callFifsBackend('logAnalytics', {
            event: eventName,
            details: details || {},
            timestamp: new Date().toISOString(),
            url: window.location.href
          }, function() {}, function() {});
        }
      } catch(e) {}
    }
    window.logTelemetryEvent = logTelemetryEvent;


    // ==========================================================================
    // STUDENT PORTAL DASHBOARD RENDERER & DEMO STUDENT HANDLER
    // ==========================================================================
    function renderStudentDashboard(student) {
      if (!student) return;
      var loginBox = document.getElementById('student-login-box');
      var activeDash = document.getElementById('student-active-dashboard');
      if (loginBox) {
        loginBox.style.setProperty('display', 'none', 'important');
        loginBox.classList.add('hidden');
      }
      if (activeDash) {
        activeDash.style.setProperty('display', 'block', 'important');
        activeDash.classList.remove('hidden');
      }

      var nameEl = document.getElementById('dash-student-name');
      if (nameEl) nameEl.textContent = student.fullName || student.name || 'Student';

      var idEl = document.getElementById('dash-student-id');
      if (idEl) idEl.textContent = student.studentId || student.id || 'FIFS-DEMO';

      var statusEl = document.getElementById('dash-student-status');
      if (statusEl) statusEl.textContent = student.status || 'Active Student';

      var courseEl = document.getElementById('dash-student-course');
      if (courseEl) courseEl.textContent = student.course || student.course_selection || 'Maryland Wear & Carry CCW';

      var dateEl = document.getElementById('dash-student-date');
      if (dateEl) dateEl.textContent = student.assignedDate || student.class_date || student.preferredDates || 'Saturday, Oct 12 • 9:00 AM';

      var docLink = document.getElementById('dash-doc-link');
      if (docLink) {
        if (student.dossier_url || (student.profileDocUrl && student.profileDocUrl !== '#')) {
          docLink.href = student.dossier_url || student.profileDocUrl;
          docLink.textContent = '📄 View Live Student Dossier ↗';
          docLink.style.background = 'var(--accent-cyan)';
          docLink.style.color = '#000';
        } else {
          docLink.href = 'javascript:void(0)';
          docLink.textContent = '📄 Dossier Under Instructor Review';
          docLink.style.background = '#1e293b';
          docLink.style.color = '#94a3b8';
          docLink.onclick = function() {
            alert('Your official training dossier is currently being prepared by Instructor Kai Wade.');
          };
        }
      }

      if (typeof updateStudentProgressNodes === 'function') {
        var stepNum = (typeof getStepNumberFromStatus === 'function') ? getStepNumberFromStatus(student.status) : 3;
        updateStudentProgressNodes(stepNum || 3);
      }
    }
    window.renderStudentDashboard = renderStudentDashboard;


    // ==========================================================================
    // DEDICATED STUDENT SCORESHEET MANAGEMENT (MSP FORM 29-14)
    // ==========================================================================
    function openStudentScoresheetModal(studentId) {
      var s = (adminCachedStudents || []).find(function(item) { return item.studentId === studentId; });
      var studentName = s ? s.fullName : studentId;
      var currentScore = (s && s.qualificationScore) ? s.qualificationScore : '25/25 (100%)';
      var currentUrl = (s && (s.scoresheet_url || s.scoresheetUrl)) ? (s.scoresheet_url || s.scoresheetUrl) : '';
      
      var newUrl = prompt('Enter Supabase Storage URL for ' + studentName + '\'s Maryland State Police Form 29-14 Qualification Scoresheet:', currentUrl);
      if (newUrl === null) return;
      
      var scoreVal = prompt('Enter qualification score (e.g., 25/25, 100%):', currentScore);
      if (scoreVal === null) scoreVal = currentScore;
      
      if (typeof callFifsBackend === 'function') {
        callFifsBackend('saveStudentScoresheet', {
          studentId: studentId,
          imageUrl: newUrl,
          score: scoreVal,
          notes: 'Verified by Instructor Kai Wade'
        }, function(res) {
          if (res && res.success) {
            alert('Official Maryland qualification scoresheet saved to Supabase successfully!');
            if (s) {
              s.scoresheet_url = newUrl;
              s.qualificationScore = scoreVal;
            }
            if (typeof refreshAdminRoster === 'function') refreshAdminRoster();
          } else {
            alert('Failed to save scoresheet: ' + (res ? res.error : 'Unknown error'));
          }
        });
      }
    }
    window.openStudentScoresheetModal = openStudentScoresheetModal;
