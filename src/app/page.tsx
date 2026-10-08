"use client";








import React, { useEffect } from "react";
import Script from "next/script";
import Head from "next/head";
import { createClient as createSupabaseClient } from "@/Lib/supabase/client";
import { createRecoveryClient } from "@/Lib/supabase/recovery-client";
import {
  PORTAL_RESET_FIELDS,
  RESET_COOLDOWN_MS,
  RESET_PORTAL_HINT_KEY,
  isPortalKey,
  portalTab,
  requestPortalPasswordReset,
} from "@/Lib/auth/password-reset";








/**
 * TrainWithFIFS - Maryland Firearms Training Platform Next.js Component
 * Configured as a Client Component with "use client" as line 1 above all imports.
 * Clean JSX structure: all SVGs, light circle elements, self-closing tags, and comments properly parsed.
 */
declare global {
  interface Window {
    setCardTier?: (courseKey: string, targetTier: string, evt?: any) => void;
  }
}

export default function TrainWithFIFS(props: any) {
  const getSessionBearerToken = async (): Promise<string | null> => {
    try {
      if (typeof window === "undefined") return null;
      const client = (window as any).supabaseClient || (typeof createSupabaseClient === "function" ? createSupabaseClient() : null);
      if (!client || !client.auth) return null;
      const { data } = await client.auth.getSession();
      return data?.session?.access_token || null;
    } catch {
      return null;
    }
  };
  useEffect(() => {












    // =========================================================================
    // AUTHORITATIVE FIFS INTERACTIVE SUITE (CORE CONTROLLERS & DATA DICTIONARIES)
    // =========================================================================




    const ALL_MODAL_IDS = [
      'twoWayChatModal', 'contactInstructorModal', 'courseBookingModal',
      'vehicleTravelModal', 'flyingWithFirearmModal', 'portalConflictModal',
      'adminInviteModal', 'adminEditStudentModal', 'adminEditClientModal',
      'fiPortalSelectionModal', 'goalSynopsisModal', 'stepDetailModal',
      'expectationModal', 'reciprocityHubModal', 'stateModalOverlay',
      'collectorInfoModal', 'stateDossierModal', 'alumniAccessGateModal',
      'clientProfileModal', 'promiseDetailModal', 'changePasswordModal',
      'multistateMasteryModal', 'permitRenewalModal', 'futureServicesModal',
      'multiPermitModal', 'clientFaqModal',
      'adminSubpanelModalOverlay'
    ];




    const closeAllOverlays = () => {
      ALL_MODAL_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('active');
          el.classList.remove('open');
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      });
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    };
    (window as any).closeAllOverlays = closeAllOverlays;




    const openModal = (modalId: string) => {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      modal.classList.add('active');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('pointer-events', 'auto', 'important');
      modal.style.setProperty('z-index', '999999', 'important');
      modal.scrollTop = 0;
      if (document.body) {
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
    };




    const closeModal = (modalId: string) => {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.setProperty('opacity', '0', 'important');
      modal.style.setProperty('visibility', 'hidden', 'important');
      modal.style.setProperty('pointer-events', 'none', 'important');
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    };




    // 1. DATA: Goals
    const GOAL_SYNOPSIS_DATA: Record<string, any> = {
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
          "<strong>988 Suicide & Crisis Lifeline:</strong> If you, a loved one, or a family member are experiencing distress, anxiety, or a mental health crisis, free, confidential, 24/7 support is available immediately. Call or text 988 or visit 988lifeline.org.",
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
        synopsis: "In Maryland, the 'Handgun License' to buy a gun IS the HQL (Handgun Qualification License). Under Md. Public Safety § 5-117.1, licensed gun dealers cannot release a handgun to you without this certification. This class fulfills the training prerequisite required for your state 77R purchase application.",
        why: [
          "Your goal is home security, and you want to legally purchase a pistol from a licensed Maryland dealer (FFL).",
          "Includes step-by-step guidance on creating your Maryland State Police (MSP) portal account and submitting clean paperwork without shortages.",
          "Completed in half a day with live-fire verification at Cindy's Hot Shots."
        ],
        whyNot: [
          "The HQL does NOT license you to carry a concealed weapon outside your home or business.",
          "If you might want to carry concealed in the future, taking HQL now means paying for two separate classes later. The CCW Combo covers both."
        ]
      },
      want_to_carry: {
        badge: "Full Public Carry Authorization • 16-Hour",
        title: "I Want to Legally Carry Concealed in Public",
        rec: "Recommended: Maryland CCW (Wear & Carry Permit) ($249.99)",
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
        rec: "Recommended: Mid-Atlantic Multi-State Mastery ($424.99 Base / $549.99 VIP)",
        courseValue: "Mid-Atlantic Multi-State Mastery — VIP Turnkey ($549.99)",
        showGuide: false,
        synopsis: "Designed for travelers, commuters, and roadtrippers who regularly cross Maryland state borders into Virginia, Pennsylvania, Delaware, the Carolinas, Georgia, or Florida. Fulfills your 16-hour Maryland requirement while preparing documentation for Virginia, Florida, Arizona, and Pennsylvania non-resident carry in a single weekend.",
        why: [
          "You travel along I-95, I-81, or I-70 for work, family, or vacations and want legal carry coverage across multiple states without accidental felony violations.",
          "Knocks out your Maryland Wear & Carry permit plus non-resident application documentation for VA, FL, AZ, and PA in one organized experience.",
          "VIP Turnkey option provides everything: range fees, targets, loaner 9mm, factory ammo, on-site FD-258 fingerprint cards, and 2x2 passport photos."
        ],
        whyNot: [
          "If you only stay inside Maryland and rarely travel out of state, the standard Maryland Wear & Carry course ($249.99 Base / $375 VIP) is all you need.",
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
    (window as any).GOAL_SYNOPSIS_DATA = GOAL_SYNOPSIS_DATA;




    (window as any).openGoalSynopsis = (goalKey: string, btnEl?: HTMLElement) => {
      const data = GOAL_SYNOPSIS_DATA[goalKey];
      if (!data) return;
      document.querySelectorAll('.pathway-pill').forEach((p: any) => {
        p.classList.remove('active');
        p.style.borderColor = '';
        p.style.boxShadow = '';
      });
      if (btnEl) {
        btnEl.classList.add('active');
        btnEl.style.borderColor = 'var(--accent-cyan)';
        btnEl.style.boxShadow = '0 0 16px var(--accent-cyan-glow), inset 0 0 10px rgba(0, 229, 255, 0.15)';
      }




      const badge = document.getElementById('goalModalBadge');
      const title = document.getElementById('goalModalTitle');
      const rec = document.getElementById('goalModalRec');
      const synopsis = document.getElementById('goalModalSynopsis');
      const whyList = document.getElementById('goalModalWhyList');
      const whyNotList = document.getElementById('goalModalWhyNotList');
      const acceptBtn = document.getElementById('goalModalAcceptBtn');
      const guideBanner = document.getElementById('goalModalGuideBanner');
      const mspPortalBanner = document.getElementById('goalModalMspPortalBanner');




      if (badge) badge.textContent = data.badge;
      if (title) title.textContent = data.title;
      if (rec) rec.textContent = data.rec;
      if (synopsis) synopsis.textContent = data.synopsis;




      if (whyList && Array.isArray(data.why)) {
        whyList.innerHTML = data.why.map((item: string) => `<li style="margin-bottom:8px; display:flex; gap:8px;"><span style="color:var(--accent-cyan); font-weight:bold;">✔</span><span>${item}</span></li>`).join('');
      }
      if (whyNotList && Array.isArray(data.whyNot)) {
        whyNotList.innerHTML = data.whyNot.map((item: string) => `<li style="margin-bottom:8px; display:flex; gap:8px;"><span style="color:var(--accent-amber); font-weight:bold;">⚡</span><span>${item}</span></li>`).join('');
      }




      if (guideBanner) guideBanner.style.display = data.showGuide ? 'flex' : 'none';
      if (mspPortalBanner) mspPortalBanner.style.display = (goalKey === 'want_to_carry') ? 'flex' : 'none';




      if (acceptBtn) {
        if (goalKey === 'new_to_firearms') {
          acceptBtn.style.display = 'none';
        } else {
          acceptBtn.style.display = 'inline-flex';
          acceptBtn.onclick = () => {
            (window as any).closeGoalSynopsis();
            (window as any).selectCourse(data.courseValue);
          };
        }
      }




      openModal('goalSynopsisModal');
    };
    (window as any).closeGoalSynopsis = () => { closeModal('goalSynopsisModal'); };




    // 2. DATA: 8-Step Journey
    const FIFS_STEPS_DATA: Record<number, any> = {
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
        synopsis: "Your training cohort date and qualification shooting lane reservation at Cindy's Hot Shots have been assigned.",
        points: [
          "✔ Qualification lane reserved at Cindy's Hot Shots (Glen Burnie, MD).",
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
          "✔ Secure ANSI Z87.1 wrap-around eye protection & electronic earmuffs.",
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
        ctaAction: "window.open('https://ufqnmcincwnlyiwsmzcq.supabase.co/storage/v1/object/public/documents/fifs-classroom-course-packet.pdf', '_blank')"
      },
      5: {
        title: "Live-Fire Practical Range Qualification",
        icon: "🎯",
        status: "Range Practical",
        synopsis: "Live-fire qualification shots conducted downrange at Cindy's Hot Shots (course instruction led by FIFS) under the direct supervision of Certified Instructor Kai Wade.",
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
    (window as any).FIFS_STEPS_DATA = FIFS_STEPS_DATA;




    (window as any).openStepDetailModal = (stepNum: number) => {
      const data = FIFS_STEPS_DATA[stepNum];
      if (!data) return;
      const badge = document.getElementById('stepModalBadge');
      const heading = document.getElementById('stepModalHeading');
      const icon = document.getElementById('stepModalIcon');
      const status = document.getElementById('stepModalStatus');
      const synopsis = document.getElementById('stepModalSynopsis');
      const keyPoints = document.getElementById('stepModalKeyPoints');
      const actions = document.getElementById('stepModalActions');




      if (badge) badge.textContent = `STEP ${stepNum} OF 8 • TRAINING ROADMAP`;
      if (heading) heading.textContent = data.title;
      if (icon) icon.textContent = data.icon;
      if (status) status.textContent = `Status: ${data.status}`;
      if (synopsis) synopsis.textContent = data.synopsis;




      if (keyPoints && Array.isArray(data.points)) {
        keyPoints.innerHTML = data.points.map((p: string) => `
          <div style="background: #0d121a; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 14px; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px;">
            ${p}
          </div>
        `).join('');
      }




      if (actions) {
        actions.innerHTML = `
          <button type="button" class="btn-primary" id="stepModalCtaBtn" style="padding:10px 18px; margin-right:8px;">
            ${data.ctaText}
          </button>
          <button type="button" class="btn-secondary-modal" id="stepModalCloseBtn" style="padding:10px 18px;">
            Close Step Overview
          </button>
        `;
        const ctaEl = document.getElementById('stepModalCtaBtn');
        if (ctaEl) {
          ctaEl.onclick = () => {
            (window as any).closeStepDetailModal();
            try { new Function(data.ctaAction)(); } catch(e) {}
          };
        }
        const closeEl = document.getElementById('stepModalCloseBtn');
        if (closeEl) closeEl.onclick = () => (window as any).closeStepDetailModal();
      }




      openModal('stepDetailModal');
    };
    (window as any).closeStepDetailModal = () => { closeModal('stepDetailModal'); };




    // 3. DATA: What to Expect
    const EXPECTATION_DATA: Record<string, any> = {
      handgun: {
        icon: "🔫",
        badge: "Firearms & Gear Protocols",
        title: "Handgun & Equipment Guidelines",
        subtitle: "Zero-Intimidation Gear Standards for Range Day",
        sections: [
          {
            title: "Do I Need My Own Handgun?",
            desc: "No! You do not need to own a firearm prior to taking our courses. Handgun rentals can be coordinated directly at Cindy's Hot Shots."
          },
          {
            title: "Bringing Your Own Handgun?",
            desc: "Must be Maryland transport compliant: 100% completely unloaded and enclosed inside a rigid locked case or secured in your vehicle trunk."
          },
          {
            title: "Holster Standards (Wear & Carry Only)",
            desc: "Must be a rigid, molded Kydex or heavy leather holster specifically fitted for your handgun model that completely encloses the trigger guard."
          },
          {
            title: "Magazines & Loading Devices",
            desc: "Bring at least 2 factory magazines (3 recommended) or speedloaders for revolvers."
          }
        ]
      },
      ammunition: {
        icon: "📦",
        badge: "Strict Range Safety Protocol",
        title: "Ammunition Protocol & Classroom Safety",
        subtitle: "Zero-Tolerance Policy: Range Live-Fire Only",
        sections: [
          {
            title: "100% Zero-Live-Ammunition Classroom Mandate",
            desc: "Absolutely zero live ammunition is permitted inside the classroom environment under any circumstance. All live ammunition must remain secured in your vehicle trunk until live-fire qualification."
          },
          {
            title: "Required Ammo Quantity",
            desc: "50 to 100 rounds of factory-manufactured target ammunition. Clean brass-cased FMJ recommended."
          },
          {
            title: "Purchasing Ammo On-Site",
            desc: "Target ammunition in all standard calibers is available for purchase directly at Cindy's Hot Shots pro shop counter before range qualification."
          }
        ]
      },
      protection: {
        icon: "👓",
        badge: "Personal Safety Equipment",
        title: "Eye & Hearing Protection Guidelines",
        subtitle: "Required Range Line Safety Specifications",
        sections: [
          {
            title: "Wrap-Around Eye Protection",
            desc: "Must be ANSI Z87.1 certified safety glasses with side-shield protection."
          },
          {
            title: "Hearing Protection (Electronic Recommended)",
            desc: "Electronic noise-canceling earmuffs are strongly recommended. Passive muffs or foam plugs are also accepted."
          },
          {
            title: "Range Loaners / Purchases",
            desc: "Safety glasses and hearing protection are available for purchase or rental at Cindy's Hot Shots on class day."
          }
        ]
      },
      attire: {
        icon: "👕",
        badge: "Dress Code & Compliance",
        title: "Range Attire & Required Documentation",
        subtitle: "Comfort, Protection & State Mandate Verification",
        sections: [
          {
            title: "Proper Clothing & Footwear",
            desc: "Crew-neck t-shirts or collared shirts fitting close to the neck. Closed-toe athletic shoes or boots are mandatory."
          },
          {
            title: "Sturdy EDC Gun Belt",
            desc: "Solid 1.5-inch leather or reinforced tactical gun belt capable of holding holster securely."
          },
          {
            title: "Mandatory Government Identification",
            desc: "Valid, unexpired government-issued photo ID is legally required for MSP paperwork and Cindy's Hot Shots range waivers."
          }
        ]
      }
    };
    (window as any).EXPECTATION_DATA = EXPECTATION_DATA;




    (window as any).openExpectationModal = (type: string) => {
      const data = EXPECTATION_DATA[type] || EXPECTATION_DATA['handgun'];
      if (!data) return;
      const badge = document.getElementById('expectModalBadge');
      const heading = document.getElementById('expectModalHeading') || document.getElementById('expectModalTitle');
      const icon = document.getElementById('expectModalIcon');
      const subtitle = document.getElementById('expectModalSubtitle');
      const grid = document.getElementById('expectModalSectionsGrid');




      if (badge) badge.textContent = data.badge;
      if (heading) heading.textContent = data.title;
      if (icon) icon.textContent = data.icon;
      if (subtitle) subtitle.textContent = data.subtitle;




      if (grid && Array.isArray(data.sections)) {
        grid.innerHTML = data.sections.map((s: any) => `
          <div style="background: rgba(7, 11, 16, 0.9); border: 1px solid var(--border-subtle); border-left: 3px solid var(--accent-cyan); border-radius: 8px; padding: 14px 16px; margin-bottom: 10px;">
            <strong style="font-family: var(--font-display); font-size: 1.05rem; color: #fff; display: block; margin-bottom: 4px;">${s.title}</strong>
            <p style="font-size: 0.84rem; color: #cbd5e1; line-height: 1.5; margin: 0;">${s.desc}</p>
          </div>
        `).join('');
      }




      openModal('expectationModal');
    };
    (window as any).closeExpectationModal = () => { closeModal('expectationModal'); };




    // 4. DATA: Course Tier Switching (Standard vs VIP)
        const COURSE_TIER_CONFIG: Record<string, any> = {
      mastery: {
        basePrice: "$424.99",
        vipPrice: "$549.99",
        baseTitle: "Mid-Atlantic Multi-State Mastery",
        vipTitle: "👑 VIP Mid-Atlantic Multi-State Mastery Concierge",
        baseBadge: "5-STATE EXPANSION (MD+VA+FL+AZ+PA) — 34+ STATES LEGAL CARRY",
        vipBadge: "👑 ALL-INCLUSIVE VIP 5-STATE CONCIERGE EXPERIENCE",
        baseDesc: "Full 16-hour Maryland Wear & Carry qualification + application dossiers for Virginia, Florida, Arizona, and Pennsylvania (34+ state legal carry reciprocity). Self-equipped track: bring own firearm and ammo.",
        vipDesc: "👑 All-Inclusive VIP Turnkey Concierge. 5-state application packets, Livescan fingerprint guidance, priority range lane, loaner firearm, ammunition, photo compliance passport prints, and full notary certification included.",
        baseValue: "Mid-Atlantic Multi-State Mastery — Base Track ($424.99)",
        vipValue: "Mid-Atlantic Multi-State Mastery — VIP Turnkey ($549.99)"
      },
      combo: {
        basePrice: "$249.99",
        vipPrice: "$375.00",
        baseTitle: "Maryland CCW & HQL Combo Certification",
        vipTitle: "👑 VIP Maryland CCW & HQL Combo Concierge",
        baseBadge: "DUAL CERTIFICATION: CONCEALED CARRY + HANDGUN PURCHASE PERMIT",
        vipBadge: "👑 ALL-INCLUSIVE VIP COMBO CONCIERGE (LIVESCAN + RANGE INCLUDED)",
        baseDesc: "Comprehensive dual-licensing package meeting both purchase and carry requirements under Maryland law (MSP PS § 5-306 & § 5-117.1). Self-equipped track: provide own handgun, holster, and 50 rounds ammo. Range fee ($45.00) & 6% tax calculated at checkout.",
        vipDesc: "👑 Turnkey VIP Concierge. Cindy's Hot Shots range fee ($45 value) is 100% INCLUDED! Includes B-27 qualification targets, loaner 9mm handgun, 50 rounds factory ammunition, holster, eye/ear pro, and on-site passport compliance photos.",
        baseValue: "Maryland CCW & HQL Combo — Base Track ($249.99)",
        vipValue: "Maryland CCW & HQL Combo — VIP Turnkey ($375.00)"
      },
      ccw: {
        basePrice: "$199.99",
        vipPrice: "$349.99",
        baseTitle: "Maryland Wear & Carry (CCW) Initial Course",
        vipTitle: "👑 VIP Maryland Wear & Carry (CCW) Concierge",
        baseBadge: "MARYLAND STATE POLICE CERTIFIED 16-HOUR INITIAL CCW",
        vipBadge: "👑 VIP WEAR & CARRY: EXPEDITED PACKET & TURNKEY RANGE EXPERIENCE",
        baseDesc: "Full 16-Hour Maryland Wear & Carry certification. In-depth legal curriculum (State v. Faulkner, SB 1), weapon mechanics, and 25-round MSP qualification course. Self-equipped track: bring own handgun, holster, and 50 rounds.",
        vipDesc: "👑 Turnkey VIP Concierge. Cindy's Hot Shots range fee ($45 value) is 100% INCLUDED! Everything provided: loaner 9mm firearm, holster, eye/ear protection, 50 rounds factory ammunition, targets, and passport compliance photos.",
        baseValue: "Maryland Wear & Carry (CCW) — Base Track ($199.99)",
        vipValue: "Maryland Wear & Carry (CCW) — VIP Turnkey ($349.99)"
      },
      renewal: {
        basePrice: "$149.99",
        vipPrice: "$249.99",
        baseTitle: "Maryland Wear & Carry (8-Hour Renewal)",
        vipTitle: "👑 VIP Maryland Wear & Carry (8-Hour Renewal) Concierge",
        baseBadge: "8-HOUR MARYLAND STATE POLICE RECERTIFICATION",
        vipBadge: "👑 ALL-INCLUSIVE VIP 8-HOUR RECERTIFICATION CONCIERGE",
        baseDesc: "State-mandated 8-hour classroom recertification + 25-round MSP live-fire qualification at Cindy's Hot Shots. Self-equipped track: bring your own handgun, holster, and 50 rounds factory ammo.",
        vipDesc: "👑 VIP Turnkey Recertification. Cindy's Hot Shots range fee ($45 value) is 100% INCLUDED! Includes B-27 qualification targets, loaner 9mm handgun, 50 rounds factory ammunition & MSP portal submission assistance!",
        baseValue: "Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)",
        vipValue: "Maryland Wear & Carry (8-Hour Renewal) — VIP Turnkey ($249.99)"
      },
      hql: {
        basePrice: "$100.00",
        vipPrice: "$165.00",
        baseTitle: "Maryland Handgun Qualification License (HQL)",
        vipTitle: "👑 VIP Maryland HQL Concierge Licensing",
        baseBadge: "MARYLAND HANDGUN PURCHASE PERMIT MANDATORY TRAINING",
        vipBadge: "👑 VIP HQL: APPLICATION ASSISTANCE + LIVE FIRE EXEMPTION",
        baseDesc: "State prerequisite for handgun purchase under MD Public Safety § 5-117.1. Covers firearm safety, mechanics, safe storage, and live-fire component. Self-equipped base track.",
        vipDesc: "👑 VIP HQL Experience. Range fee, loaner handgun, 50 rounds ammunition, eye/ear protection, and hands-on application submission assistance through the Maryland State Police licensing portal.",
        baseValue: "Maryland HQL (Purchase License) — Base Track ($100.00)",
        vipValue: "Maryland HQL (Purchase License) — VIP Turnkey ($165.00)"
      },
      coaching: {
        basePrice: "$125.00/hr",
        vipPrice: "$195.00/hr",
        baseTitle: "Personal 1-on-1 Private Firearms Coaching",
        vipTitle: "👑 VIP Private Masterclass & Tactical Diagnostics",
        baseBadge: "DEDICATED 1-ON-1 INSTRUCTOR TIME & MARKSMANSHIP TARGETING",
        vipBadge: "👑 VIP PRIVATE SESSION: DUAL-CALIBER RENTALS & VIDEO DIAGNOSTICS",
        baseDesc: "Dedicated private coaching. Diagnostic marksmanship, trigger press refinement, draw-stroke economy, malfunction drills, and stress inoculation drills with Lead Instructor Kai Wade.",
        vipDesc: "👑 VIP Private Masterclass. Multi-caliber handgun rentals (9mm & .45 ACP), 100 rounds match ammunition, high-speed video diagnostics, and customized tactical home defense action plan.",
        baseValue: "Personal 1-on-1 Coaching — Base Track ($125.00/hr)",
        vipValue: "Personal 1-on-1 Coaching — VIP Turnkey ($195.00/hr)"
      },
      cleaning: {
        basePrice: "$75.00",
        vipPrice: "$115.00",
        baseTitle: "Firearm Maintenance & Deep Cleaning Workshop",
        vipTitle: "👑 VIP Armorer Inspection & Ultrasonic Deep Clean",
        baseBadge: "FIELD-STRIP, CLEANING CHEMICAL SAFETY & PROPER LUBRICATION",
        vipBadge: "👑 VIP ARMORER SERVICE: ULTRASONIC TANK CLEAN & SOLVENTS",
        baseDesc: "Field-stripping, ultrasonic inspection methods, lubrication points, carbon fouling removal, and proper long-term storage preservation techniques for modern semi-automatic handguns.",
        vipDesc: "👑 VIP Armorer Service. Professional ultrasonic deep-clean tank soak, bore scoping, sear engagement safety inspection, spring tension testing, and premium Lucas Oil extreme-duty lubricant treatment.",
        baseValue: "Gun Cleaning & Maintenance — Base Track ($75.00)",
        vipValue: "Gun Cleaning & Maintenance — VIP Turnkey ($115.00)"
      },
      children: {
        basePrice: "$199.99",
        vipPrice: "$265.00",
        baseTitle: "Youth & Family Gun Safety Academy",
        vipTitle: "👑 VIP Family Defensive & Safe Storage Mastery",
        baseBadge: "ACCIDENT PREVENTION, EDDIE EAGLE PROTOCOL & RANGE DISCIPLINE",
        vipBadge: "👑 VIP FAMILY PACK: LOCKBOX INCLUDED & PRIVATE LANE ACCESS",
        baseDesc: "Comprehensive youth accident prevention and family home defense. Eddie Eagle 4-step emergency protocol: Stop, Don't Touch, Run Away, Tell an Adult. Safe storage principles and stress-free range introduction.",
        vipDesc: "👑 VIP Family Safety Bundle. Includes certified biometric rapid-access steel lockbox, youth ear/eye protection kit, private instructor range lane, and hands-on home safety emergency plan.",
        baseValue: "Children's Safety Class — Base Track ($199.99)",
        vipValue: "Children's Safety Class — VIP Turnkey ($265.00)"
      },
      alumni: {
        basePrice: "$65.00",
        vipPrice: "$115.00",
        baseTitle: "FIFS Graduate Alumni Tactical Marksman Clinic",
        vipTitle: "👑 VIP Alumni Advanced Shoot/Don't-Shoot Shootout",
        baseBadge: "EXCLUSIVELY FOR FIFS GRADUATES — ADVANCED DRILLS & SPEED",
        vipBadge: "👑 VIP CLINIC: 100RDS MATCH AMMO & LOW-LIGHT SCENARIO RUNS",
        baseDesc: "Designed exclusively for Wear & Carry graduates and permit holders. Rapid holster presentation, multiple threat transitions, reload speed drills, and cover/concealment movement.",
        vipDesc: "👑 VIP Alumni Shootout. Includes 100 rounds match ammunition, low-light weapon mounted light (WML) scenario drills, steel target plate challenge, and computerized split-time scoring.",
        baseValue: "FIFS Graduate Alumni Marksmanship Clinic — Base Track ($65.00)",
        vipValue: "FIFS Graduate Alumni Marksmanship Clinic — VIP Turnkey ($115.00)"
      }
    };
    (window as any).COURSE_TIER_CONFIG = COURSE_TIER_CONFIG;




        (window as any).setCardTier = (courseKey: string, targetTier: string, evt?: Event) => {
      if (evt) {
        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.preventDefault) evt.preventDefault();
      }
      const config = COURSE_TIER_CONFIG[courseKey];
      if (!config) return;
      const card = document.getElementById('card-course-' + courseKey);
      const switchBox = document.getElementById('switch-' + courseKey);
      const slider = document.getElementById('slider-' + courseKey);
      const badge = document.getElementById('badge-course-' + courseKey);
      const priceElem = document.getElementById('price-course-' + courseKey);
      const titleElem = (document.getElementById('title-course-' + courseKey) || (card ? card.querySelector('.tuition-title, h3') : null)) as HTMLElement | null;
      const descElem = (document.getElementById('desc-course-' + courseKey) || (card ? card.querySelector('.tuition-desc') : null)) as HTMLElement | null;
      const vipBox = document.getElementById('vip-box-course-' + courseKey) || document.getElementById('vip-box-' + courseKey);
      const btnSelect = document.getElementById('btn-select-course-' + courseKey) as HTMLButtonElement | null;

      const isVip = targetTier === 'vip';

      if (card) {
        if (isVip) {
          card.classList.add('vip-mode-active');
          card.style.setProperty('background', 'linear-gradient(135deg, rgba(255, 183, 3, 0.14) 0%, rgba(13, 19, 27, 0.98) 100%)', 'important');
          card.style.setProperty('border', '2px solid var(--accent-amber)', 'important');
          card.style.setProperty('box-shadow', '0 0 28px rgba(255, 183, 3, 0.4), 0 12px 36px rgba(0, 0, 0, 0.85)', 'important');
        } else {
          card.classList.remove('vip-mode-active');
          card.style.removeProperty('background');
          card.style.setProperty('border', '1px solid var(--border-subtle)');
          card.style.removeProperty('box-shadow');
        }
      }

      if (switchBox) {
        if (isVip) {
          switchBox.classList.add('active-vip');
          switchBox.classList.add('vip-active');
        } else {
          switchBox.classList.remove('active-vip');
          switchBox.classList.remove('vip-active');
        }
      }

      if (slider) {
        slider.style.transform = isVip ? 'translateX(100%)' : 'translateX(0)';
      }

      if (badge) {
        badge.style.setProperty('display', isVip ? 'block' : 'none', 'important');
        badge.textContent = isVip ? (config.vipBadge || '👑 VIP MODE') : (config.baseBadge || '');
      }

      // 1. Dynamic Card Title
      if (titleElem) {
        titleElem.textContent = isVip ? config.vipTitle : config.baseTitle;
      }

      // 2. Dynamic Active Price
      if (priceElem) {
        if (isVip) {
          priceElem.innerHTML = `<span class="price-val" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--accent-amber);">${config.vipPrice}</span><span class="price-tier-tag" style="font-size: 0.82rem; color: var(--accent-amber); font-weight: 800; margin-left: 6px;">(👑 VIP Turnkey ★)</span>`;
        } else {
          priceElem.innerHTML = `<span class="price-val" style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: #fff;">${config.basePrice}</span><span class="price-tier-tag" style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; margin-left: 6px;">(Standard Base)</span>`;
        }
      }

      // 3. Dynamic Tier Description
      if (descElem) {
        descElem.textContent = isVip ? config.vipDesc : config.baseDesc;
      }

      if (vipBox) {
        vipBox.style.setProperty('display', isVip ? 'block' : 'none', 'important');
      }

      if (btnSelect) {
        if (isVip) {
          btnSelect.textContent = `Select 👑 VIP (${config.vipPrice}) & Reserve Seat →`;
          btnSelect.className = 'btn-select-course btn-vip-select';
          btnSelect.style.setProperty('background', 'linear-gradient(135deg, #ffb703 0%, #d49000 100%)', 'important');
          btnSelect.style.setProperty('color', '#070b10', 'important');
          btnSelect.setAttribute('data-onclick', `selectCourse("${config.vipValue}")`);
          btnSelect.onclick = () => (window as any).selectCourse(config.vipValue);
        } else {
          btnSelect.textContent = `Select Base (${config.basePrice}) & Reserve Seat →`;
          btnSelect.className = 'btn-select-course';
          btnSelect.style.setProperty('background', 'var(--accent-cyan)', 'important');
          btnSelect.style.setProperty('color', '#070b10', 'important');
          btnSelect.setAttribute('data-onclick', `selectCourse("${config.baseValue}")`);
          btnSelect.onclick = () => (window as any).selectCourse(config.baseValue);
        }
      }

      // 4. Dynamic Checkout Totals & Booking Modal Synchronization (Zero Page Reload)
      const selectElem = document.getElementById('courseSelection') as HTMLSelectElement | null;
      if (selectElem) {
        const currentVal = (selectElem.value || '').toLowerCase();
        const isMatch = (courseKey === 'ccw' && currentVal.includes('wear & carry') && !currentVal.includes('renewal') && !currentVal.includes('combo')) ||
                        (courseKey === 'renewal' && (currentVal.includes('renewal') || currentVal.includes('8-hour'))) ||
                        (courseKey === 'combo' && currentVal.includes('combo')) ||
                        (courseKey === 'mastery' && (currentVal.includes('mastery') || currentVal.includes('multi-state'))) ||
                        (courseKey === 'hql' && currentVal.includes('hql') && !currentVal.includes('combo')) ||
                        (courseKey === 'coaching' && currentVal.includes('coaching')) ||
                        (courseKey === 'cleaning' && currentVal.includes('cleaning')) ||
                        (courseKey === 'children' && (currentVal.includes('children') || currentVal.includes('youth'))) ||
                        (courseKey === 'alumni' && currentVal.includes('alumni'));

        if (isMatch) {
          const targetVal = isVip ? config.vipValue : config.baseValue;
          for (let i = 0; i < selectElem.options.length; i++) {
            const optVal = selectElem.options[i].value;
            if (optVal === targetVal || (isVip && (optVal.includes('VIP') || optVal.includes('Turnkey')) && optVal.toLowerCase().includes(courseKey)) ||
                (!isVip && !optVal.includes('VIP') && !optVal.includes('Turnkey') && optVal.toLowerCase().includes(courseKey))) {
              selectElem.selectedIndex = i;
              selectElem.value = optVal;
              break;
            }
          }
          if (typeof (window as any).updateFormPriceDisplay === 'function') {
            (window as any).updateFormPriceDisplay();
          }
        }
      }
    };

    (window as any).toggleCardTier = (courseKey: string, evt?: Event) => {
      const card = document.getElementById('card-course-' + courseKey);
      const isVip = card && card.classList.contains('vip-mode-active');
      (window as any).setCardTier(courseKey, isVip ? 'base' : 'vip', evt);
    };




    // 5. Course Selection with Smooth Scroll to Form
        // 5. Authoritative Course Selection Controller (Unifies Modal Launch, Tier Sync & Price Calculation)
    (window as any).selectCourse = (courseValue: string) => {
      if (!courseValue) return;

      if (courseValue.toLowerCase().includes('alumni')) {
        const cSession = typeof sessionStorage !== 'undefined' ? ((window as any).__fifsClientPortalRecord ? JSON.stringify((window as any).__fifsClientPortalRecord) : null) : null;
        if (!cSession) {
          if (typeof (window as any).openModal === 'function') {
            (window as any).openModal('alumniAccessGateModal');
          }
          return;
        }
      }

      const valClean = courseValue.toLowerCase().replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim();
      const isVip = valClean.includes('vip') || valClean.includes('turnkey');

      let matchedKey = 'ccw';
      if (valClean.includes('renewal') || valClean.includes('8-hour') || valClean.includes('8 hour') || valClean.includes('recertification')) matchedKey = 'renewal';
      else if (valClean.includes('mastery') || valClean.includes('multi-state') || valClean.includes('multistate')) matchedKey = 'mastery';
      else if (valClean.includes('combo')) matchedKey = 'combo';
      else if (valClean.includes('hql') && !valClean.includes('combo')) matchedKey = 'hql';
      else if (valClean.includes('ccw') || valClean.includes('wear & carry')) matchedKey = 'ccw';
      else if (valClean.includes('coaching') || valClean.includes('1-on-1')) matchedKey = 'coaching';
      else if (valClean.includes('cleaning')) matchedKey = 'cleaning';
      else if (valClean.includes('children') || valClean.includes('youth') || valClean.includes('family')) matchedKey = 'children';
      else if (valClean.includes('alumni') || valClean.includes('clinic')) matchedKey = 'alumni';

      const selectElem = document.getElementById('courseSelection') as HTMLSelectElement | null;
      if (selectElem) {
        for (let i = 0; i < selectElem.options.length; i++) {
          const optVal = selectElem.options[i].value.toLowerCase().replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
          const optIsVip = optVal.includes('vip') || optVal.includes('turnkey');
          if (isVip === optIsVip) {
            let isOptMatch = false;
            if (matchedKey === 'renewal' && (optVal.includes('renewal') || optVal.includes('8-hour'))) isOptMatch = true;
            else if (matchedKey === 'mastery' && (optVal.includes('mastery') || optVal.includes('multi-state'))) isOptMatch = true;
            else if (matchedKey === 'combo' && optVal.includes('combo')) isOptMatch = true;
            else if (matchedKey === 'hql' && optVal.includes('hql') && !optVal.includes('combo')) isOptMatch = true;
            else if (matchedKey === 'ccw' && optVal.includes('wear & carry') && !optVal.includes('combo') && !optVal.includes('renewal')) isOptMatch = true;
            else if (matchedKey === 'coaching' && (optVal.includes('coaching') || optVal.includes('1-on-1'))) isOptMatch = true;
            else if (matchedKey === 'cleaning' && optVal.includes('cleaning')) isOptMatch = true;
            else if (matchedKey === 'children' && (optVal.includes('children') || optVal.includes('youth'))) isOptMatch = true;
            else if (matchedKey === 'alumni' && optVal.includes('alumni')) isOptMatch = true;

            if (isOptMatch) {
              selectElem.selectedIndex = i;
              selectElem.value = selectElem.options[i].value;
              break;
            }
          }
        }
      }

      // Synchronize landing page card state
      if (typeof (window as any).setCardTier === 'function') {
        (window as any).setCardTier(matchedKey, isVip ? 'vip' : 'base');
      }

      // Open booking modal
      if (typeof (window as any).openCourseBookingModal === 'function') {
        (window as any).openCourseBookingModal();
      } else {
        const modal = document.getElementById('courseBookingModal');
        if (modal) {
          modal.classList.add('active');
          modal.style.setProperty('display', 'flex', 'important');
          modal.style.setProperty('opacity', '1', 'important');
          modal.style.setProperty('visibility', 'visible', 'important');
          modal.style.setProperty('pointer-events', 'auto', 'important');
          modal.style.setProperty('z-index', '999999', 'important');
          modal.scrollTop = 0;
          document.body.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
        }
      }

      if (typeof (window as any).updateFormPriceDisplay === 'function') {
        (window as any).updateFormPriceDisplay();
      }
      if (typeof (window as any).renderBookingCalendar === 'function') {
        (window as any).renderBookingCalendar();
      }
    };




    // 6. Navigation Controllers
    (window as any).returnToHome = () => {
      closeAllOverlays();
      const hero = document.getElementById('hero-landing');
      const app = document.getElementById('app-container');
      if (app) {
        app.style.setProperty('display', 'none', 'important');
        app.style.setProperty('pointer-events', 'none', 'important');
      }
      if (hero) {
        hero.style.setProperty('display', 'flex', 'important');
        hero.style.setProperty('visibility', 'visible', 'important');
        hero.style.setProperty('opacity', '1', 'important');
        hero.style.setProperty('pointer-events', 'auto', 'important');
      }
      document.body.classList.remove('in-app');
      document.body.classList.add('in-home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };




    (window as any).navigateBack = () => {
      closeAllOverlays();
      (window as any).returnToHome();
    };




    (window as any).triggerTopNavGunReload = (e?: Event) => {
      if (e && e.preventDefault) e.preventDefault();
      const btn = document.getElementById('topNavRefreshBtn');
      if (btn) {
        btn.style.transform = 'rotate(360deg)';
        setTimeout(() => { btn.style.transform = ''; }, 400);
      }
    };




    // 7. 4-Tap Logo Gesture
    let tapTimestamps: number[] = [];
    let homeDebounceTimer: any = null;
    (window as any).handleLogoTap = (e: Event) => {
      if (e && e.cancelable) e.preventDefault();
      if (e && e.stopPropagation) e.stopPropagation();
      const now = Date.now();
      tapTimestamps = tapTimestamps.filter((t) => now - t < 1500);
      tapTimestamps.push(now);
      clearTimeout(homeDebounceTimer);
      if (tapTimestamps.length >= 4) {
        tapTimestamps = [];
        (window as any).openTerminalGateway();
      } else {
        homeDebounceTimer = setTimeout(() => {
          tapTimestamps = [];
          (window as any).returnToHome();
        }, 380);
      }
    };




    (window as any).openTerminalGateway = () => {
      (window as any).switchTab('admin');
      const passField = document.getElementById('adminPasscode');
      if (passField) passField.focus();
    };




    // Attach logo tap listeners
        // Initialize browser Supabase client
    let supabase: ReturnType<typeof createSupabaseClient> | null = null;
    try {
      supabase = typeof window !== 'undefined' && typeof createSupabaseClient === 'function' ? createSupabaseClient() : null;
    } catch (configErr: any) {
      console.error('[FIFS] Supabase is not configured for this environment:', configErr?.message);
    }
    if (typeof window !== 'undefined' && supabase) {
      (window as any).supabaseClient = supabase;
    }

    const getSessionBearerToken = async (): Promise<string | null> => {
      try {
        const client = (window as any).supabaseClient || (typeof createSupabaseClient === 'function' ? createSupabaseClient() : null);
        if (!client || !client.auth) return null;
        const { data: { session } } = await client.auth.getSession();
        return session?.access_token || null;
      } catch {
        return null;
      }
    };

    const attachLogoListeners = () => {
      const targets = document.querySelectorAll('#brand-logo, .brand-identity-group, .app-nav-logo');
      targets.forEach((el) => {
        el.removeEventListener('click', (window as any).handleLogoTap, true);
        el.addEventListener('click', (window as any).handleLogoTap, true);
      });
    };
    attachLogoListeners();




    // 8. Calendar Engine
    let calCurrentYear = 2026;
    let calCurrentMonth = 9; // October (0-indexed)
    let calSelectedDate1: string | null = null;
    let calSelectedDate2: string | null = null;
    let calSelectedDate1Obj: Date | null = null;
    let calSelectedDate2Obj: Date | null = null;
    const calBookedDates: string[] = [];




    const is16HourCourseSelected = () => {
      const selectElem = document.getElementById('courseSelection') as HTMLSelectElement | null;
      const curVal = (selectElem ? selectElem.value : '').toLowerCase();
      return (curVal.includes('combo') || curVal.includes('mastery') || (curVal.includes('wear & carry') && !curVal.includes('renewal')));
    };
    (window as any).is16HourCourseSelected = is16HourCourseSelected;




    const selectBookingDate = (dateKey: string, cellDate: Date, isVip?: boolean) => {
      const is16Hr = is16HourCourseSelected();
      const dateInput = document.getElementById('preferredDates') as HTMLInputElement | null;
      const dateText = document.getElementById('bookingCalSelectedDateText');
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };




      if (is16Hr) {
        if (!calSelectedDate1 || (calSelectedDate1 && calSelectedDate2)) {
          calSelectedDate1 = dateKey;
          calSelectedDate1Obj = cellDate;
          calSelectedDate2 = null;
          calSelectedDate2Obj = null;
        } else if (calSelectedDate1 && !calSelectedDate2) {
          if (calSelectedDate1 === dateKey) {
            calSelectedDate1 = null;
            calSelectedDate1Obj = null;
          } else {
            const d1 = new Date(calSelectedDate1 + 'T00:00:00');
            const d2 = new Date(dateKey + 'T00:00:00');
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
        calSelectedDate1 = dateKey;
        calSelectedDate1Obj = cellDate;
        calSelectedDate2 = null;
        calSelectedDate2Obj = null;
      }




      (window as any).calSelectedDate = calSelectedDate1;
      (window as any).calSelectedDate1 = calSelectedDate1;
      (window as any).calSelectedDate2 = calSelectedDate2;




      const f1 = calSelectedDate1Obj ? calSelectedDate1Obj.toLocaleDateString('en-US', options) : calSelectedDate1;
      const f2 = calSelectedDate2Obj ? calSelectedDate2Obj.toLocaleDateString('en-US', options) : calSelectedDate2;




      if (is16Hr) {
        if (calSelectedDate1 && calSelectedDate2) {
          if (dateInput) dateInput.value = `Day 1: ${f1} (FIFS Classroom) | Day 2: ${f2} (Cindy's Hot Shots Qualification)`;
          if (dateText) {
            dateText.innerHTML = isVip
              ? `<span style="color:#e2e8f0;font-weight:700;">👑 Day 1: <strong>${f1}</strong></span> &bull; <span style="color:#fbbf24;font-weight:700;">👑 Day 2: <strong>${f2}</strong></span>`
              : `<span style="color:#10b981;font-weight:700;">✔ Day 1: <strong>${f1}</strong></span> &bull; <span style="color:#00e5ff;font-weight:700;">✔ Day 2: <strong>${f2}</strong></span>`;
          }
        } else if (calSelectedDate1) {
          if (dateInput) dateInput.value = `Day 1: ${f1} (FIFS Classroom) — [Day 2 Required]`;
          if (dateText) {
            const d1Color = isVip ? '#e2e8f0' : '#10b981';
            const d2HintColor = isVip ? '#fbbf24' : '#00e5ff';
            dateText.innerHTML = `<span style="color:${d1Color};font-weight:700;">Day 1 Selected: <strong>${f1}</strong></span> &bull; <span style="color:${d2HintColor};font-weight:700;">👉 Please select Day 2 on the calendar</span>`;
          }
        } else {
          if (dateInput) dateInput.value = '';
          if (dateText) dateText.innerHTML = '<span style="color:#f59e0b;">16-Hr Requirement: Select 2 dates (Day 1 Classroom &bull; Day 2 Range Qualification)</span>';
        }
      } else {
        if (calSelectedDate1) {
          if (dateInput) dateInput.value = f1 + (isVip ? ' (👑 VIP Turnkey)' : ' (Standard Base)');
          if (dateText) dateText.innerHTML = `Selected Training Date: <strong style="color:${isVip ? 'var(--accent-amber)' : 'var(--accent-cyan)'};">${f1}</strong>`;
        } else {
          if (dateInput) dateInput.value = '';
          if (dateText) dateText.innerHTML = 'No training date selected';
        }
      }




      renderBookingCalendar();
    };
    (window as any).selectBookingDate = selectBookingDate;




        const renderBookingCalendar = () => {
      const grid = document.getElementById('bookingCalDaysGrid');
      const label = document.getElementById('bookingCalMonthLabel');
      const policyBanner = document.getElementById('calendarPolicyText');
      if (!grid || !label) return;


      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      label.textContent = monthNames[calCurrentMonth] + ' ' + calCurrentYear;


      const selectElem = document.getElementById('courseSelection') as HTMLSelectElement | null;
      const curVal = (selectElem ? selectElem.value : '').toLowerCase().replace(/&amp;/g, '&');
      const isVip = curVal.includes('vip') || curVal.includes('turnkey');
      const is16Hr = (window as any).is16HourCourseSelected();


      if (policyBanner) {
        if (is16Hr) {
          policyBanner.innerHTML = `📌 <strong style="color:#00e5ff;">16-Hour Maryland Requirement:</strong> Please select <strong>2 dates</strong> on the calendar below:<br><span style="display:inline-block;margin-top:4px;">• <strong>Day 1:</strong> Classroom Instruction & Firearms Safety (FIFS Classroom)<br>• <strong>Day 2:</strong> Live-Fire Practical Qualification (Cindy's Hot Shots Partner Range)</span>` +
            (isVip ? `<br><span style="color:var(--accent-amber);font-weight:700;">👑 VIP Turnkey: 7-day flexible scheduling unlocked.</span>` : `<br><span style="color:#94a3b8;">📅 Standard Schedule: Saturday & Sunday cohorts.</span>`);
          policyBanner.style.borderColor = '#00e5ff';
          policyBanner.style.background = 'rgba(0, 229, 255, 0.09)';
        } else if (isVip) {
          policyBanner.innerHTML = '👑 <strong style="color: var(--accent-amber);">VIP Turnkey Perk:</strong> Priority <strong>7-Day Flexible Scheduling (Monday–Sunday)</strong> is unlocked! Select your date below.';
          policyBanner.style.borderColor = 'var(--accent-amber)';
          policyBanner.style.background = 'rgba(255, 183, 3, 0.08)';
        } else {
          policyBanner.innerHTML = '📅 <strong>Schedule:</strong> Classes held on <strong>Saturdays & Sundays</strong>. Weekdays locked. (Toggle to 👑 VIP to unlock 7-day flexible scheduling).';
          policyBanner.style.borderColor = 'var(--accent-cyan)';
          policyBanner.style.background = 'rgba(0, 229, 255, 0.08)';
        }
      }


      grid.innerHTML = '';
      const firstDay = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
      const totalDays = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();


      // Empty leading cells
      for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.style.background = '#070b10';
        emptyCell.style.minHeight = '42px';
        emptyCell.style.height = '42px';
        grid.appendChild(emptyCell);
      }


      const today = new Date();
      today.setHours(0, 0, 0, 0);


      for (let d = 1; d <= totalDays; d++) {
        const cellDate = new Date(calCurrentYear, calCurrentMonth, d);
        cellDate.setHours(0, 0, 0, 0);
        const dayOfWeek = cellDate.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const dateKey = `${calCurrentYear}-${String(calCurrentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isBooked = calBookedDates.includes(dateKey);
        const isPast = cellDate < today;


        const cell = document.createElement('div');
        cell.className = 'cal-day-cell' + (isWeekend ? ' cal-weekend' : ' cal-weekday');
        cell.style.background = '#0d1219';
        cell.style.minHeight = '42px';
        cell.style.height = '42px';
        cell.style.display = 'flex';
        cell.style.flexDirection = 'column';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.fontSize = '0.84rem';
        cell.style.fontWeight = '700';
        cell.style.cursor = 'pointer';
        cell.style.transition = 'all 0.15s ease';
        cell.style.position = 'relative';
        cell.style.padding = '2px';
        cell.style.boxSizing = 'border-box';
        cell.style.userSelect = 'none';
        cell.setAttribute('data-date', dateKey);


        if (isPast) {
          cell.style.color = '#334155';
          cell.style.cursor = 'not-allowed';
          cell.innerHTML = `<span style="opacity:0.35;">${d}</span>`;
          cell.title = 'Past date';
        } else if (isBooked) {
          cell.style.color = '#ef4444';
          cell.style.cursor = 'not-allowed';
          cell.title = 'Class session already booked for this date';
          cell.innerHTML = `<span style="color:#ef4444;opacity:0.8;">${d}</span><span style="width: 4px; height: 4px; border-radius: 50%; background: #ef4444; margin-top: 2px;"></span>`;
        } else if (!isVip && !isWeekend) {
          cell.style.color = '#475569';
          cell.style.cursor = 'not-allowed';
          cell.title = 'Weekday locked (Upgrade to VIP for 7-day flexible scheduling)';
          cell.innerHTML = `<span style="opacity: 0.45; font-size:0.82rem;">${d}</span><span style="font-size: 0.50rem; opacity:0.6; line-height:1; margin-top: 1px;">🔒</span>`;
        } else {
          const isDate1 = (calSelectedDate1 === dateKey);
          const isDate2 = (calSelectedDate2 === dateKey);


          if (isDate1) {
            if (isVip) {
              cell.style.background = 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)';
              cell.style.color = '#0f172a';
              cell.style.fontWeight = '900';
              cell.style.boxShadow = '0 0 12px rgba(226, 232, 240, 0.7)';
              cell.innerHTML = `<span style="line-height:1;">${d}</span><span style="font-size:0.52rem;font-weight:900;background:#0f172a;color:#f8fafc;padding:1px 3px;border-radius:2px;margin-top:2px;line-height:1;">${is16Hr ? 'DAY 1' : 'PICK'}</span>`;
            } else {
              cell.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
              cell.style.color = '#070b10';
              cell.style.fontWeight = '900';
              cell.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.7)';
              cell.innerHTML = `<span style="line-height:1;">${d}</span><span style="font-size:0.52rem;font-weight:900;background:#070b10;color:#10b981;padding:1px 3px;border-radius:2px;margin-top:2px;line-height:1;">${is16Hr ? 'DAY 1' : 'PICK'}</span>`;
            }
          } else if (isDate2) {
            if (isVip) {
              cell.style.background = 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)';
              cell.style.color = '#070b10';
              cell.style.fontWeight = '900';
              cell.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.75)';
              cell.innerHTML = `<span style="line-height:1;">${d}</span><span style="font-size:0.52rem;font-weight:900;background:#070b10;color:#ffd700;padding:1px 3px;border-radius:2px;margin-top:2px;line-height:1;">DAY 2</span>`;
            } else {
              cell.style.background = 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)';
              cell.style.color = '#070b10';
              cell.style.fontWeight = '900';
              cell.style.boxShadow = '0 0 12px rgba(0, 229, 255, 0.75)';
              cell.innerHTML = `<span style="line-height:1;">${d}</span><span style="font-size:0.52rem;font-weight:900;background:#070b10;color:#00e5ff;padding:1px 3px;border-radius:2px;margin-top:2px;line-height:1;">DAY 2</span>`;
            }
          } else {
            cell.style.color = '#fff';
            cell.innerHTML = `<span style="line-height:1;">${d}</span>`;
            if (isWeekend) {
              cell.style.background = '#10161f';
              cell.style.border = '1px solid rgba(0, 229, 255, 0.2)';
            }
          }


          cell.onclick = () => selectBookingDate(dateKey, cellDate);
        }


        grid.appendChild(cell);
      }
    };
    (window as any).renderBookingCalendar = renderBookingCalendar;




    (window as any).changeBookingCalendarMonth = (delta: number) => {
      calCurrentMonth += delta;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      } else if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      }
      renderBookingCalendar();
    };




    // Auto-render calendar on load
    setTimeout(renderBookingCalendar, 100);




    // 9. Student Portal Operations
    (window as any).renderStudentDashboard = (student: any) => {
      const loginBox = document.getElementById('student-login-box');
      const activeDash = document.getElementById('student-active-dashboard');
      if (loginBox) loginBox.classList.add('hidden');
      if (activeDash) activeDash.classList.remove('hidden');




      const nameElem = document.getElementById('dash-student-name');
      if (nameElem) nameElem.textContent = (student.fullName || student.full_name || 'Student').split(' ')[0];
      const idElem = document.getElementById('dash-student-id');
      if (idElem) idElem.textContent = 'ID: ' + (student.studentId || student.student_id);
      const statusElem = document.getElementById('dash-student-status');
      if (statusElem) statusElem.textContent = student.trainingStatus || student.status || 'PREP_PENDING';
      const courseElem = document.getElementById('dash-student-course');
      if (courseElem) courseElem.textContent = (student.course || student.course_name || '').split('(')[0].trim();
      const dateElem = document.getElementById('dash-student-date');
      if (dateElem) dateElem.textContent = 'Date: ' + (student.assignedDate || student.assigned_date || 'To Be Scheduled');
      const userTag = document.getElementById('portal-user-tag');
      if (userTag) userTag.textContent = "Student: " + (student.fullName || student.full_name) + " (" + (student.studentId || student.student_id) + ")";
    };




    (window as any).loadDemoStudent = () => {
      console.warn('Demo student access is disabled.');
      const statusDiv = document.getElementById('student-login-status');
      if (statusDiv) {
        statusDiv.textContent = 'Demo student access is disabled. Please authenticate with your registered student credentials.';
        statusDiv.style.display = 'block';
      }
    };




    // "Forgot password?" for the student, client and staff logins. Always shows the same message
    // whether or not the address has an account, and pauses the link briefly after each use.
    (window as any).fifsRequestPasswordReset = async (portal: string, trigger?: HTMLElement | null) => {
      if (!isPortalKey(portal)) return;
      const statusDiv = document.getElementById(PORTAL_RESET_FIELDS[portal].status);
      const show = (message: string) => {
        if (statusDiv) {
          statusDiv.textContent = message;
          statusDiv.style.display = 'block';
        }
      };
      const button = trigger as HTMLButtonElement | null | undefined;
      if (button && button.disabled) return;
      if (button) button.disabled = true;
      // A missing or malformed email is reported without contacting Supabase, so the link is not paused.
      let pauseMs = 0;
      try {
        const result = await requestPortalPasswordReset({
          portal,
          doc: document,
          createClient: createRecoveryClient,
          origin: window.location.origin,
        });
        show(result.message);
        if (result.requested) pauseMs = result.cooldown ? RESET_COOLDOWN_MS : 5000;
        if (result.ok) {
          try { window.localStorage.setItem(RESET_PORTAL_HINT_KEY, portal); } catch { /* storage unavailable */ }
        }
      } catch {
        show('Password reset is not available right now. Please contact FIFS directly.');
        pauseMs = 5000;
      }
      window.setTimeout(() => { if (button) button.disabled = false; }, pauseMs);
    };

    // After /reset-password succeeds it sends people back here; open the matching login with a notice.
    try {
      const landing = new URLSearchParams(window.location.search);
      if (landing.get('password_reset') === 'success') {
        const requested = landing.get('portal');
        const portal = isPortalKey(requested) ? requested : 'student';
        window.history.replaceState(null, '', window.location.pathname);
        const statusId = { student: 'student-login-status', client: 'client-login-status', staff: 'admin-auth-status' }[portal];
        let attempts = 0;
        const timer = window.setInterval(() => {
          attempts += 1;
          const open = (window as any).openAndSwitch || (window as any).switchTab;
          const statusDiv = document.getElementById(statusId);
          if (typeof open === 'function' && statusDiv) {
            window.clearInterval(timer);
            open(portalTab(portal));
            statusDiv.textContent = 'Your password was updated. Sign in with your new password.';
            statusDiv.style.display = 'block';
          } else if (attempts > 50) {
            window.clearInterval(timer);
          }
        }, 200);
      }
    } catch { /* the notice is a convenience only */ }

    (window as any).lookupStudentAccount = async () => {
      const input = document.getElementById('studentAuthInput') as HTMLInputElement | null;
      const passInput = document.getElementById('studentAuthPassword') as HTMLInputElement | null;
      const statusDiv = document.getElementById('student-login-status');
      const query = input ? input.value.trim() : '';
      const password = passInput ? passInput.value : ''; // passwords are used exactly as typed

      if (!query || !query.includes('@')) {
        if (statusDiv) {
          statusDiv.textContent = 'Please enter the email address linked to your student account.';
          statusDiv.style.display = 'block';
        }
        return;
      }

      if (statusDiv) {
        statusDiv.textContent = 'Authenticating Student Operations credentials...';
        statusDiv.style.display = 'block';
      }

      let token = '';
      try {
        const client = (window as any).supabaseClient || (typeof createSupabaseClient === 'function' ? createSupabaseClient() : null);
        if (client && client.auth) {
          if (password) {
            const { data: authData } = await client.auth.signInWithPassword({
              email: query,
              password: password
            });
            if (authData?.session?.access_token) {
              token = authData.session.access_token;
              (window as any).__fifsStudentSession = authData.session;
            }
          }
          if (!token) {
            const { data } = await client.auth.getSession();
            if (data?.session?.access_token) {
              token = data.session.access_token;
            }
          }
        }
      } catch (_e) {}

      if (!token && typeof getSessionBearerToken === 'function') {
        token = (await getSessionBearerToken()) || "";
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      fetch('/api/fifs', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          action: 'getStudentPortalData',
          identifier: query,
          password: password
        })
      })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.student) {
          if (statusDiv) statusDiv.style.display = 'none';
          (window as any).__fifsStudentPortalRecord = data.student;
          (window as any).renderStudentDashboard(data.student);
        } else if (data && data.status === 'needs_password_setup') {
          if (statusDiv) {
            statusDiv.textContent = 'This account does not have a password yet. Use "Forgot password?" below to set one, or ask FIFS to send you a setup link.';
            statusDiv.style.display = 'block';
          }
        } else {
          if (statusDiv) {
            statusDiv.textContent = (data && data.error) || (data && data.message) || 'Unauthorized: Student record not found.';
            statusDiv.style.display = 'block';
          }
        }
      })
      .catch(() => {
        if (statusDiv) {
          statusDiv.textContent = 'Security verification error. Please check your credentials and try again.';
          statusDiv.style.display = 'block';
        }
      });
    };




    // 10. Chat & Contact Modals
    (window as any).openContactWidgetModal = () => { openModal('contactInstructorModal'); };
    (window as any).closeContactWidgetModal = () => { closeModal('contactInstructorModal'); };
    (window as any).closeTwoWayChat = () => { closeModal('twoWayChatModal'); };
    (window as any).dismissFloatingChat = (e?: Event) => {
      if (e && e.stopPropagation) e.stopPropagation();
      try { localStorage.setItem('fifs_chat_bubble_dismissed', '1'); } catch(err) {}
      const w = document.getElementById('floatingCommWrapper');
      if (w) w.style.setProperty('display', 'none', 'important');
    };




    (window as any).handleLiveChatSubmit = (e: Event) => {
      if (e && e.preventDefault) e.preventDefault();
      const nameEl = document.getElementById('chatSenderName') as HTMLInputElement | null;
      const phoneEl = document.getElementById('chatSenderPhone') as HTMLInputElement | null;
      const msgEl = document.getElementById('chatMessageText') as HTMLTextAreaElement | null;
      const statusDiv = document.getElementById('chat-widget-status');
      const name = nameEl ? nameEl.value.trim() : '';
      const phone = phoneEl ? phoneEl.value.trim() : '';
      const message = msgEl ? msgEl.value.trim() : '';




      if (!name || !message) {
        if (statusDiv) {
          statusDiv.textContent = 'Please enter your Name and Message to connect with Instructor Kai Wade.';
          statusDiv.style.display = 'block';
        }
        return;
      }




      if (statusDiv) {
        statusDiv.textContent = 'Connecting to Lead Instructor Kai Wade...';
        statusDiv.style.display = 'block';
      }




      fetch('/api/fifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitContactInquiry',
          fullName: name,
          phone: phone,
          message: message
        })
      })
      .then((res) => res.json())
      .then((data) => {
        if (statusDiv) {
          statusDiv.textContent = '✔ Inquiry received! Lead Instructor Kai Wade will contact you directly.';
          statusDiv.style.display = 'block';
        }
        setTimeout(() => { (window as any).closeContactWidgetModal(); }, 2000);
      })
      .catch(() => {
        if (statusDiv) {
          statusDiv.textContent = '✔ Message queued! Instructor Kai Wade has been alerted.';
          statusDiv.style.display = 'block';
        }
        setTimeout(() => { (window as any).closeContactWidgetModal(); }, 2000);
      });
    };




    // Persistent chat bubble check
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('fifs_chat_bubble_dismissed') === '1') {
        const w = document.getElementById('floatingCommWrapper');
        if (w) w.style.setProperty('display', 'none', 'important');
      }
    } catch(e) {}












    // Initialize interactive reciprocity map once script engine is ready
    let mapRetryCount = 0;
    const mapInitTimer = setInterval(() => {
      mapRetryCount++;
      if (typeof window !== 'undefined' && typeof (window as any).initReciprocityEngine === 'function') {
        const svg = document.getElementById('interactiveUsSvg');
        if (svg) {
          (window as any).initReciprocityEngine();
          clearInterval(mapInitTimer);
        }
      }
      if (mapRetryCount > 25) clearInterval(mapInitTimer);
    }, 200);








    // 1. Intercept student magic link or portal invite from URL
    try {
      const params = new URLSearchParams(window.location.search);
      const portal = params.get('portal');
      const studentId = params.get('id') || params.get('student');
      if (portal === 'student' || studentId) {
        const input = document.getElementById('studentLookupInput') as HTMLInputElement | null;
        if (input && studentId) input.value = studentId;
        const modal = document.getElementById('studentPortalModal');
        if (modal) {
          modal.classList.add('active');
          modal.style.setProperty('display', 'block', 'important');
        }
      }
    } catch (e) {
      console.warn('Portal invite error:', e);
    }








    // 2. Track site visit to Discord once per browser session
    try {
      if (!sessionStorage.getItem('fifs_visit_tracked')) {
        sessionStorage.setItem('fifs_visit_tracked', '1');
        fetch('/api/fifs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'trackSiteVisit', path: window.location.pathname }),
        }).catch(() => {});
      }
    } catch (e) {}

    // Initial pricing sync on mount
    try {
      if (typeof (window as any).updateFormPriceDisplay === 'function') {
        (window as any).updateFormPriceDisplay();
      }
    } catch (e) {}
  }, []);








  if (typeof window !== "undefined") {
    (window as any).dismissPwaLandingBanner = (window as any).dismissPwaLandingBanner || function() {
      var b = document.getElementById("pwa-landing-banner");
      if (b) b.style.display = "none";
    };
  }
  useEffect(() => {








    // Direct Next.js /api/checkout bridge for Stripe Checkout
    (window as any).callFifsBackend = async (action: string, payload: any, onComplete: Function, onError: Function) => {
      if (action === 'submitBooking') {
        try {
          // A signed-in student's verified session links the booking to their record server-side.
          const checkoutHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
          try {
            const sessionToken = typeof getSessionBearerToken === 'function' ? await getSessionBearerToken() : null;
            if (sessionToken) checkoutHeaders['Authorization'] = 'Bearer ' + sessionToken;
          } catch (_tokenErr) {}
          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: checkoutHeaders,
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || 'Failed to create Stripe checkout session');
          }
          if (data.url) {
            window.location.href = data.url;
            return;
          }
          if (onComplete) onComplete(data);
        } catch (err: any) {
          console.error('Checkout error:', err);
          if (onError) onError(err);
          else alert('Payment Error: ' + (err.message || 'Unable to connect to Stripe checkout.'));
        }
      } else {
        try {
          const bodyData = Object.assign({ action: action }, payload || {});
          let token = '';
          try {
            if (typeof getSessionBearerToken === 'function') {
              token = (await getSessionBearerToken()) || "";
            }
            if (!token && (window as any).__fifsStaffSession?.access_token) {
              token = (window as any).__fifsStaffSession.access_token;
            }
            if (!token && (window as any).__fifsStudentSession?.access_token) {
              token = (window as any).__fifsStudentSession.access_token;
            }
            if (!token && (window as any).__fifsClientSession?.access_token) {
              token = (window as any).__fifsClientSession.access_token;
            }
            if (!token && (window as any).supabaseClient?.auth?.getSession) {
              const { data } = await (window as any).supabaseClient.auth.getSession();
              if (data?.session?.access_token) token = data.session.access_token;
            }
          } catch (_e) {}

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) {
            headers['Authorization'] = 'Bearer ' + token;
          }

          const res = await fetch('/api/fifs', {
            method: 'POST',
            headers,
            body: JSON.stringify(bodyData)
          });
          const data = await res.json();
          // Promise-style callers (no callbacks) must see any server-reported failure.
          if (!onComplete && !onError && (!res.ok || data?.success === false || data?.status === 'error')) {
            throw new Error(data?.error || ('HTTP ' + res.status));
          }
          if (!res.ok && !data.status && !data.success) {
            throw new Error(data.error || ('HTTP ' + res.status));
          }
          if (onComplete) onComplete(data);
          return data;
        } catch (err: any) {
          console.error('FIFS Backend call error:', err);
          if (onError) onError(err);
          else if (!onComplete) throw err;
        }
      }
    };
















    // No Stripe publishable key is hardcoded: checkout uses server-created Stripe Checkout
    // sessions, and a Production key must never be baked into non-production builds.








    // Helper to decode HTML entities in data attributes
    const decodeEntities = (str: string) => {
      return str
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    };








    // Global event delegator for data-onclick, data-onchange, and data-onsubmit
    const handleDelegatedClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-onclick]') as HTMLElement | null;
      if (!target) return;
      let handlerStr = target.getAttribute('data-onclick');
      if (!handlerStr) return;
      handlerStr = decodeEntities(handlerStr).replace(/\\(['"])/g, "$1");
      try {
        const fn = new Function('event', handlerStr);
        fn.call(target, e);
      } catch (err) {
        console.error('Error executing data-onclick handler: "' + handlerStr + '"', err);
      }
    };








    const handleDelegatedChange = (e: Event) => {
      const target = (e.target as HTMLElement).closest('[data-onchange]') as HTMLElement | null;
      if (!target) return;
      let handlerStr = target.getAttribute('data-onchange');
      if (!handlerStr) return;
      handlerStr = decodeEntities(handlerStr).replace(/\\(['"])/g, "$1");
      try {
        const fn = new Function('event', handlerStr);
        fn.call(target, e);
      } catch (err) {
        console.error('Error executing data-onchange handler: "' + handlerStr + '"', err);
      }
    };








    const handleDelegatedKeyDown = (e: KeyboardEvent) => {
      const target = (e.target as HTMLElement).closest('[data-onkeydown]') as HTMLElement | null;
      if (!target) return;
      let handlerStr = target.getAttribute('data-onkeydown');
      if (!handlerStr) return;
      handlerStr = decodeEntities(handlerStr).replace(/\\(['"])/g, "$1");
      try {
        const fn = new Function('event', handlerStr);
        fn.call(target, e);
      } catch (err) {
        console.error('Error executing data-onkeydown handler: "' + handlerStr + '"', err);
      }
    };




    const handleDelegatedSubmit = (e: Event) => {
      const target = (e.target as HTMLElement).closest('[data-onsubmit]') as HTMLElement | null;
      if (!target) return;
      e.preventDefault();
      let handlerStr = target.getAttribute('data-onsubmit');
      if (!handlerStr) return;
      handlerStr = decodeEntities(handlerStr).replace(/\\(['"])/g, "$1");
      try {
        const fn = new Function('event', handlerStr);
        fn.call(target, e);
      } catch (err) {
        console.error('Error executing data-onsubmit handler: "' + handlerStr + '"', err);
      }
    };








    
    const syncOperatingHours = () => {
      try {
        const etStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', hour: 'numeric' }).format(new Date());
        const hour = parseInt(etStr, 10);
        const isOpen = hour >= 9 && hour < 17;
        const dot = document.getElementById('live-status-dot');
        const guide = document.getElementById('neon-start-guide');
        if (dot) {
          if (isOpen) {
            dot.className = 'pulse-dot';
            dot.style.background = '#10b981';
            dot.style.boxShadow = '0 0 12px #10b981';
            dot.title = 'Live Training & Student Operations Active (9 AM - 5 PM ET)';
          } else {
            dot.className = 'pulse-dot pulse-red';
            dot.style.background = '#ef4444';
            dot.style.boxShadow = '0 0 12px #ef4444';
            dot.title = 'Standby Mode — Live ops resume at 9 AM ET (online booking open 24/7)';
          }
        }
        if (guide) {
          if (isOpen) {
            guide.classList.remove('neon-mode-red');
            guide.classList.add('neon-mode-cyan');
            guide.style.borderColor = 'var(--accent-cyan)';
            guide.style.color = '#00e5ff';
            guide.title = 'Future Initiative Operations Active • Click to Start Training';
          } else {
            guide.classList.remove('neon-mode-cyan');
            guide.classList.add('neon-mode-red');
            guide.style.borderColor = '#ef4444';
            guide.style.color = '#ef4444';
            guide.title = 'Standby Mode — Live ops resume at 9 AM ET • Online booking open 24/7';
          }
        }
      } catch (err) {
        console.error('Error syncing operating hours:', err);
      }
    };
    syncOperatingHours();
    const hoursInterval = setInterval(syncOperatingHours, 30000);








    
    // Modal Controller Functions for Standardized Pop-ups
    (window as any).openMultistateMasteryModal = function() {
      const modal = document.getElementById('multistateMasteryModal');
      if (modal) {
        modal.style.display = 'block';
        modal.classList.add('active');
        document.body.classList.add('modal-open');
      }
    };
    (window as any).closeMultistateMasteryModal = function() {
      const modal = document.getElementById('multistateMasteryModal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    };




    (window as any).openPermitRenewalModal = function() {
      const modal = document.getElementById('permitRenewalModal');
      if (modal) {
        modal.style.display = 'block';
        modal.classList.add('active');
        document.body.classList.add('modal-open');
      }
    };
    (window as any).closePermitRenewalModal = function() {
      const modal = document.getElementById('permitRenewalModal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    };




    (window as any).openFutureServicesModal = function() {
      const modal = document.getElementById('futureServicesModal');
      if (modal) {
        modal.style.display = 'block';
        modal.classList.add('active');
        document.body.classList.add('modal-open');
      }
    };
    (window as any).closeFutureServicesModal = function() {
      const modal = document.getElementById('futureServicesModal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    };




        // Vehicle Travel Modal Controller
    (window as any).openVehicleTravelModal = function() {
      const modal = document.getElementById('vehicleTravelModal');
      if (modal) {
        modal.style.setProperty('display', 'block', 'important');
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        modal.scrollTop = 0;
      }
    };
    (window as any).closeVehicleTravelModal = function() {
      const modal = document.getElementById('vehicleTravelModal');
      if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    };




    // Flying With Firearms Modal Controller
    (window as any).openFlyingWithFirearmModal = function() {
      const modal = document.getElementById('flyingWithFirearmModal');
      if (modal) {
        modal.style.setProperty('display', 'block', 'important');
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        modal.scrollTop = 0;
      }
    };
    (window as any).closeFlyingWithFirearmModal = function() {
      const modal = document.getElementById('flyingWithFirearmModal');
      if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    };




    // Client Profile Modal Controller
    (window as any).openClientProfileModal = function() {
      const modal = document.getElementById('clientProfileModal');
      if (modal) {
        modal.style.setProperty('display', 'block', 'important');
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        modal.scrollTop = 0;
      }
    };
    (window as any).closeClientProfileModal = function() {
      const modal = document.getElementById('clientProfileModal');
      if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    };




    // Client FAQ Modal Controller
    (window as any).openClientFaqModal = function() {
      const modal = document.getElementById('clientFaqModal');
      if (modal) {
        modal.style.setProperty('display', 'block', 'important');
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        modal.scrollTop = 0;
      }
    };
    (window as any).closeClientFaqModal = function() {
      const modal = document.getElementById('clientFaqModal');
      if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    };




    // Helper to sync CCW permit card values whenever client data is loaded/updated
    (window as any).syncClientPermitCard = function(clientData?: any) {
      const nameEl = document.getElementById('dash-client-name');
      const cardholderEl = document.getElementById('wallet-cardholder-name');
      if (nameEl && cardholderEl && nameEl.textContent) {
        cardholderEl.textContent = nameEl.textContent.trim();
      }
      const idEl = document.getElementById('dash-client-id');
      const permitNumEl = document.getElementById('wallet-permit-number');
      if (idEl && permitNumEl && idEl.textContent) {
        const cleanId = idEl.textContent.replace(/^ID:\s*/i, '').trim();
        permitNumEl.textContent = cleanId ? ('MD-WCP-' + cleanId.replace(/[^a-zA-Z0-9]/g, '')) : 'MD-WCP-1042-88';
      }
      const createdDate = clientData?.created_at || (window as any).__currentClientAccount?.created_at;
      if (createdDate) {
        const d = new Date(createdDate);
        const formatted = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const sinceEl = document.getElementById('wallet-member-since-val');
        if (sinceEl) sinceEl.textContent = formatted.toUpperCase();
      }
    };




    // 34+ State Multi-Permit Expansion System Modal Controller
    (window as any).toggleMultiPermitModal = function(show: boolean) {
      const modal = document.getElementById('multiPermitModal');
      if (modal) {
        if (show) {
          modal.classList.add('active');
          modal.style.setProperty('display', 'block', 'important');
          modal.style.setProperty('opacity', '1', 'important');
          modal.style.setProperty('visibility', 'visible', 'important');
          modal.style.setProperty('pointer-events', 'auto', 'important');
          modal.style.setProperty('z-index', '999999', 'important');
          document.body.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
          modal.scrollTop = 0;
        } else {
          modal.classList.remove('active');
          modal.style.setProperty('display', 'none', 'important');
          modal.style.setProperty('opacity', '0', 'important');
          modal.style.setProperty('visibility', 'hidden', 'important');
          modal.style.setProperty('pointer-events', 'none', 'important');
          modal.style.setProperty('z-index', '-10', 'important');
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }
      }
    };
    (window as any).openMultiPermitModal = function() {
      (window as any).toggleMultiPermitModal(true);
    };
    (window as any).closeMultiPermitModal = function() {
      (window as any).toggleMultiPermitModal(false);
    };




    // Reciprocity Hub Modal Controller
    (window as any).toggleReciprocityHubModal = function(show: boolean) {
      const modal = document.getElementById('reciprocityHubModal');
      if (modal) {
        if (show) {
          modal.classList.add('active');
          modal.style.setProperty('display', 'block', 'important');
          modal.style.setProperty('opacity', '1', 'important');
          modal.style.setProperty('visibility', 'visible', 'important');
          modal.style.setProperty('pointer-events', 'auto', 'important');
          modal.style.setProperty('z-index', '999999', 'important');
          document.body.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
          modal.scrollTop = 0;
        } else {
          modal.classList.remove('active');
          modal.style.setProperty('display', 'none', 'important');
          modal.style.setProperty('opacity', '0', 'important');
          modal.style.setProperty('visibility', 'hidden', 'important');
          modal.style.setProperty('pointer-events', 'none', 'important');
          modal.style.setProperty('z-index', '-10', 'important');
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }
      }
    };




    // Reservia Training Card Mapping & Enhanced Course Selector
    // Duplicate selectCourse removed — unified controller active above




    // Client Portal Permit CRUD (Delete Permit respecting RLS auth.uid() = user_id)
    
    // =========================================================================
    // 50-STATE RECIPROCITY HUB WALLET CONTROLLER (ADD & DELETE PERMITS)
    // =========================================================================
    (window as any).removePermitFromWallet = function(code: string) {
      if (!code) return;
      code = code.trim().toUpperCase();
      if ((window as any).activeMultipliers && (window as any).activeMultipliers.has(code)) {
        (window as any).activeMultipliers.delete(code);
      }
      const chip = document.getElementById('chip-' + code);
      if (chip) chip.classList.remove('active');
      if (typeof (window as any).recalculateReciprocity === 'function') {
        (window as any).recalculateReciprocity();
      }
      if (typeof (window as any).renderMyPermitsList === 'function') {
        (window as any).renderMyPermitsList();
      }
      if (typeof (window as any).deleteClientPermit === 'function') {
        (window as any).deleteClientPermit(code.toLowerCase());
      }
    };




    (window as any).promptRemovePermit = function() {
      const activeMults: string[] = [];
      if ((window as any).activeMultipliers && (window as any).activeMultipliers.forEach) {
        (window as any).activeMultipliers.forEach((c: string) => activeMults.push(c));
      }
      if (!activeMults.length) {
        alert('Your reciprocity wallet currently contains only your Resident Primary permit. To delete non-resident multiplier permits, add one first (e.g., UT, FL, AZ, PA, VA).');
        return;
      }
      const permitListStr = activeMults.join(', ');
      const choice = prompt('Select Non-Resident Permit to REMOVE from Wallet:\nActive permits in wallet: ' + permitListStr + '\n\nEnter 2-letter state abbreviation to delete:');
      if (choice) {
        const clean = choice.trim().toUpperCase();
        if (activeMults.includes(clean)) {
          (window as any).removePermitFromWallet(clean);
          alert('✓ Non-resident permit multiplier for ' + clean + ' was removed from your wallet.');
        } else {
          alert('Permit ' + clean + ' is not currently active in your wallet. Active permits: ' + permitListStr);
        }
      }
    };




    (window as any).promptAddPermit = function() {
      const choice = prompt('Select Non-Resident Permit Multiplier to Add:\n1. UT (Utah)\n2. FL (Florida)\n3. AZ (Arizona)\n4. PA (Pennsylvania)\n5. VA (Virginia)\n\nEnter 2-letter state abbreviation:');
      if (choice) {
        const clean = choice.trim().toUpperCase();
        if (['UT', 'FL', 'AZ', 'PA', 'VA'].includes(clean)) {
          if (typeof (window as any).toggleMultiplier === 'function') {
            (window as any).toggleMultiplier(clean);
          } else {
            if (!(window as any).activeMultipliers) (window as any).activeMultipliers = new Set();
            (window as any).activeMultipliers.add(clean);
            if (typeof (window as any).renderMyPermitsList === 'function') (window as any).renderMyPermitsList();
            if (typeof (window as any).recalculateReciprocity === 'function') (window as any).recalculateReciprocity();
          }
        } else {
          alert('State multiplier ' + clean + ' not recognized. Available multipliers: UT, FL, AZ, PA, VA.');
        }
      }
    };




    (window as any).renderMyPermitsList = function() {
      const list = document.getElementById('myPermitsList');
      if (!list) return;
      list.innerHTML = '';
      const statesData = (window as any).STATES_DATA || {};
      const resCode = (window as any).activeResidentState || 'MD';
      const resState = statesData[resCode];
      
      const resRow = document.createElement('div');
      resRow.className = 'permit-row-item';
      resRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(0,229,255,0.06); border:1px solid rgba(0,229,255,0.25); border-radius:8px; margin-bottom:8px;';
      resRow.innerHTML = `
        <div class="permit-name-tag" style="color:#fff; font-weight:700; font-size:0.86rem;">${resState ? resState.name : resCode} (RESIDENT PRIMARY)</div>
        <div class="permit-status-badge-circle badge-primary-resident" style="background:#10b981; color:#000; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.75rem;">&#10003;</div>
      `;
      list.appendChild(resRow);




      const multipliers = (window as any).activeMultipliers;
      if (multipliers && multipliers.forEach) {
        multipliers.forEach((mCode: string) => {
          const mState = statesData[mCode];
          const mRow = document.createElement('div');
          mRow.className = 'permit-row-item';
          mRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.25); border-radius:8px; margin-bottom:8px;';
          mRow.innerHTML = `
            <div class="permit-name-tag" style="color:#f8fafc; font-weight:700; font-size:0.86rem;">${mState ? mState.name : mCode} (NON-RESIDENT MULTIPLIER)</div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="permit-status-badge-circle badge-multiplier" style="background:#f59e0b; color:#000; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.75rem;">&#10003;</div>
              <button type="button" class="btn-delete-permit-inline" onclick="(window).removePermitFromWallet('${mCode}')" title="Delete ${mCode} from wallet" style="background:rgba(239,68,68,0.18); border:1px solid #ef4444; color:#ef4444; border-radius:6px; padding:3px 10px; font-size:0.75rem; font-weight:700; cursor:pointer;">✕ Delete</button>
            </div>
          `;
          list.appendChild(mRow);
        });
      }
    };




    // =========================================================================
    // CHANGE PASSWORD MODAL CONTROLLER (STUDENT & CLIENT)
    // =========================================================================
    (window as any).openChangePasswordModal = function(role?: string) {
      const modal = document.getElementById('changePasswordModal');
      if (!modal) return;
      const emailInput = document.getElementById('cpUserEmail') as HTMLInputElement | null;
      let userIdent = '';




      if (role === 'student' || !role) {
        try {
          const s = ((window as any).__fifsStudentPortalRecord ? JSON.stringify((window as any).__fifsStudentPortalRecord) : null);
          if (s) {
            const parsed = JSON.parse(s);
            userIdent = parsed.email || parsed.studentId || '';
          }
        } catch(e) {}
        if (!userIdent) {
          const idChip = document.getElementById('dash-student-id');
          if (idChip && idChip.textContent) {
            userIdent = idChip.textContent.replace('ID:', '').trim();
          }
        }
        if (!userIdent) {
          const loginInp = document.getElementById('studentAuthInput') as HTMLInputElement | null;
          if (loginInp && loginInp.value) userIdent = loginInp.value.trim();
        }
      } else if (role === 'client') {
        try {
          const c = ((window as any).__fifsClientPortalRecord ? JSON.stringify((window as any).__fifsClientPortalRecord) : null);
          if (c) {
            const parsed = JSON.parse(c);
            userIdent = parsed.email || parsed.clientId || '';
          }
        } catch(e) {}
        if (!userIdent) {
          const idChip = document.getElementById('dash-client-id');
          if (idChip && idChip.textContent) {
            userIdent = idChip.textContent.replace('ID:', '').trim();
          }
        }
      }




      if (!userIdent) {
        userIdent = (window as any).__currentUserEmail || (window as any).__currentStudentSession?.email || '';
      }




      if (emailInput && userIdent) emailInput.value = userIdent;
      const statusDiv = document.getElementById('changePasswordStatus');
      if (statusDiv) {
        statusDiv.style.display = 'none';
        statusDiv.innerHTML = '';
      }




      modal.classList.add('active');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('opacity', '1', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('pointer-events', 'auto', 'important');
      modal.style.setProperty('z-index', '9999999', 'important');
      document.body.classList.add('modal-open');
    };




    (window as any).closeChangePasswordModal = function() {
      const modal = document.getElementById('changePasswordModal');
      if (!modal) return;
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
      document.body.classList.remove('modal-open');
    };




    (window as any).submitChangePassword = async function(e: any) {
      if (e && e.preventDefault) e.preventDefault();
      const emailInput = document.getElementById('cpUserEmail') as HTMLInputElement | null;
      const currInput = document.getElementById('cpCurrentPassword') as HTMLInputElement | null;
      const newInput = document.getElementById('cpNewPassword') as HTMLInputElement | null;
      const confirmInput = document.getElementById('cpConfirmPassword') as HTMLInputElement | null;
      const statusDiv = document.getElementById('changePasswordStatus');
      const submitBtn = document.getElementById('btnSubmitChangePassword') as HTMLButtonElement | null;




      const userIdentifier = emailInput ? emailInput.value.trim() : '';
      const currentPassword = currInput ? currInput.value : '';
      const newPassword = newInput ? newInput.value : '';
      const confirmPassword = confirmInput ? confirmInput.value : '';




      if (!userIdentifier) {
        if (statusDiv) {
          statusDiv.style.display = 'block';
          statusDiv.style.background = 'rgba(239, 68, 68, 0.15)';
          statusDiv.style.border = '1px solid #ef4444';
          statusDiv.style.color = '#ef4444';
          statusDiv.innerHTML = '⚠️ Please enter the email address for your account.';
        }
        return;
      }

      if (!newPassword || newPassword.length < 12) {
        if (statusDiv) {
          statusDiv.style.display = 'block';
          statusDiv.style.background = 'rgba(239, 68, 68, 0.15)';
          statusDiv.style.border = '1px solid #ef4444';
          statusDiv.style.color = '#ef4444';
          statusDiv.innerHTML = '⚠️ New password must be at least 12 characters long with uppercase, lowercase, number & symbol.';
        }
        return;
      }
      if (newPassword !== confirmPassword) {
        if (statusDiv) {
          statusDiv.style.display = 'block';
          statusDiv.style.background = 'rgba(239, 68, 68, 0.15)';
          statusDiv.style.border = '1px solid #ef4444';
          statusDiv.style.color = '#ef4444';
          statusDiv.innerHTML = '⚠️ Passwords do not match. Please verify and re-type.';
        }
        return;
      }




      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating Password...';
      }




      try {
        const token = (await getSessionBearerToken()) || "";
        const res = await fetch('/api/fifs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
          },
          body: JSON.stringify({
            action: 'selfServicePasswordUpdate',
            identifier: userIdentifier,
            email: userIdentifier,
            studentId: userIdentifier,
            currentPassword,
            newPassword
          })
        });
        const data = await res.json();
        if (res.ok && (data.success || data.status === 'success')) {
          if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.style.background = 'rgba(16, 185, 129, 0.15)';
            statusDiv.style.border = '1px solid #10b981';
            statusDiv.style.color = '#10b981';
            statusDiv.innerHTML = '✓ Password updated successfully and linked to your student profile!';
          }
          // Update session in storage
          try {
            const s = ((window as any).__fifsStudentPortalRecord ? JSON.stringify((window as any).__fifsStudentPortalRecord) : null);
            if (s) {
              const parsed = JSON.parse(s);
              parsed.mustChangePassword = false;
              (window as any).__fifsStudentPortalRecord = parsed;
            }
          } catch(e) {}
          if (currInput) currInput.value = '';
          if (newInput) newInput.value = '';
          if (confirmInput) confirmInput.value = '';
          setTimeout(() => {
            (window as any).closeChangePasswordModal();
          }, 1800);
        } else {
          throw new Error(data.error || data.message || 'Failed to update password.');
        }
      } catch (err: any) {
        if (statusDiv) {
          statusDiv.style.display = 'block';
          statusDiv.style.background = 'rgba(239, 68, 68, 0.15)';
          statusDiv.style.border = '1px solid #ef4444';
          statusDiv.style.color = '#ef4444';
          statusDiv.innerHTML = '⚠️ ' + (err.message || 'Error updating password.');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update Password 🔒';
        }
      }
    };




    // =========================================================================
    // FIFS PROMISE INTERACTIVE CARDS & DETAIL MODAL CONTROLLER
    // =========================================================================
    const PROMISE_DATA: Record<string, any> = {
      zero_intimidation: {
        badge: "Uncompromising Excellence • Zero Intimidation",
        icon: "🎯",
        title: "Zero-Intimidation Mentorship",
        subtitle: "Dignified, Patient, High-Standard Instruction for Every Background",
        synopsis: "At Future Initiative Firearm Services, you never need prior shooting experience to step through our doors, you will never experience intimidation or ego on our firing line, and you do not need to have everything figured out before you arrive. Lead Instructor Kai Wade meets every student exactly where they are with calm, individualized coaching.",
        sections: [
          {
            title: "Beginner-Safe Classroom & Firing Line",
            desc: "Whether you have never touched a firearm or are handling one for the first time in your life, you are welcomed with dignity. Every question is answered patiently, mechanical safety is broken down methodically, and zero intimidation is tolerated."
          },
          {
            title: "Ego-Free Diagnostic Coaching",
            desc: "Instructor Kai Wade coaches with calm, clear verbal feedback and targeted micro-drills that break down grip mechanics, stance, sight alignment, and trigger press without shouting or artificial stress."
          },
          {
            title: "Confidence Through Verified Competence",
            desc: "We don't believe in fear-based training. We systematically replace anxiety with verified physical competency, instilling lifelong gun-handling muscle memory and muzzle discipline that you can rely on under real stress."
          },
          {
            title: "Private & Small Group Formats",
            desc: "Choose between private one-on-one sessions or paired training with a spouse, friend, or family member so you can learn at your own pace in an empowering, supportive environment."
          }
        ]
      },
      maryland_law: {
        badge: "Legal Accountability • Maryland Statutes",
        icon: "⚖️",
        title: "Maryland Law & Reality Mastery",
        subtitle: "Street-Level Statutes, Castle Doctrine Boundaries & Lethal Force Realities",
        synopsis: "Carrying a concealed firearm in Maryland carries profound legal responsibilities. Our legal curriculum cuts through internet rumors and provides authoritative, street-level mastery of Maryland Criminal Law, recent statutory changes under SB 1, permissible transport regulations, and real-world lethal self-defense boundaries.",
        sections: [
          {
            title: "Maryland Wear & Carry Statutory Scope",
            desc: "Authoritative breakdown of MD Criminal Law § 4-203, sensitive location prohibitions under SB 1 (Gun Safety Act of 2023), private property consent requirements, and where you can lawfully carry daily."
          },
          {
            title: "Castle Doctrine vs. Public Duty to Retreat",
            desc: "Detailed legal analysis of Maryland’s strict duty to retreat in public, the legal boundaries of Castle Doctrine inside your home, proportional force standards, and defense of third parties."
          },
          {
            title: "FOPA 18 U.S.C. § 926A Interstate Transport",
            desc: "Master safe vehicular transit through non-reciprocal jurisdictions like DC, New Jersey, and New York. Learn how to lawfully case, separate, and store firearms and ammunition to avoid severe felony pitfalls during interstate travel."
          },
          {
            title: "Post-Incident Legal & 911 Protocols",
            desc: "Exactly what to say to 911 dispatchers, how to interact with arriving law enforcement after a defensive encounter, establishing self-defense evidence, and exercising your Constitutional rights safely."
          }
        ]
      },
      cindys_live_fire: {
        badge: "Range Qualification • Premier Facility",
        icon: "💥",
        title: "Live-Fire Qualification at Cindy's Hot Shots",
        subtitle: "Dedicated Downrange Firing Line & Official Maryland State Police Course-of-Fire",
        synopsis: "Live-fire practical instruction and live qualification are conducted downrange at Cindy's Hot Shots (115 Holsum Way, Glen Burnie, MD) — Anne Arundel County’s premier indoor shooting facility. Every student experiences real trigger time, practical recoil control, and verified passing score achievement.",
        sections: [
          {
            title: "Premier Facility Partnership",
            desc: "Cindy's Hot Shots features state-of-the-art climate-controlled lanes, advanced target retrieval systems, and dedicated safety personnel, ensuring an immaculate and secure firing line for all FIFS students."
          },
          {
            title: "Official MSP 25-Round Course of Fire",
            desc: "Structured qualification covering the official Maryland State Police course-of-fire on B-27 silhouette targets at 3, 5, 7, and 15 yards. Students consistently achieve 90%+ accuracy under Kai Wade’s diagnostic coaching."
          },
          {
            title: "Recoil Control & Malfunction Diagnostics",
            desc: "Hands-on diagnostic drills covering dominant-eye targeting, recoil mitigation, smooth trigger reset, emergency reloads, and instantaneous tap-rack-bang malfunction clearing."
          },
          {
            title: "VIP Turnkey All-Inclusive Range Access",
            desc: "VIP students receive all range lane fees fully covered, clean loaner 9mm handguns, rigid holsters, 50-100 rounds of factory target ammunition, and professional eye and ear protection."
          }
        ]
      },
      lifelong_access: {
        badge: "Ongoing Mentorship • LIFELONG ADVISORY",
        icon: "🤝",
        title: "Lifelong Instructor Access & Advisory",
        subtitle: "Continuous Mentorship, Firearm Selection & 3-Year Permit Protection",
        synopsis: "At Future Initiative Firearm Services, graduation is only the beginning of your journey. As an alumnus, you gain an enduring relationship with Lead Instructor Kai Wade for hardware purchasing, holster selection, permit renewal reminders, and advanced defensive mastery.",
        sections: [
          {
            title: "Direct Instructor Communication",
            desc: "You retain direct access to Instructor Kai Wade for tactical questions, range advice, or carry gear evaluation whenever you need honest, professional guidance."
          },
          {
            title: "Hardware & Holster Purchasing Guidance",
            desc: "Never waste money on ill-fitting handguns or dangerous holsters. Get personalized equipment recommendations tailored specifically to your grip size, hand strength, attire, and daily carry routine."
          },
          {
            title: "3-Year Maryland Permit Renewal Protection",
            desc: "We log your permit issuance date into our renewal telemetry system and proactively notify you 120, 90, 60, and 30 days before expiration to seamlessly complete your required 8-hour renewal."
          },
          {
            title: "Alumni Marksmanship & Multi-State Expansion",
            desc: "Exclusive access to FIFS Graduate marksmanship tune-ups, advanced low-light defensive clinics, and multi-state permit expansion cohorts (UT, FL, AZ, VA, PA) granting carry freedom across 34+ states."
          }
        ]
      }
    };




    (window as any).openPromiseDetailModal = function(type: string) {
      const data = PROMISE_DATA[type];
      if (!data) return;
      const modal = document.getElementById('promiseDetailModal');
      const badge = document.getElementById('promiseModalBadge');
      const heading = document.getElementById('promiseModalHeading');
      const icon = document.getElementById('promiseModalIcon');
      const subtitle = document.getElementById('promiseModalSubtitle');
      const synopsis = document.getElementById('promiseModalSynopsis');
      const grid = document.getElementById('promiseModalSectionsGrid');




      if (badge) badge.textContent = data.badge;
      if (heading) heading.textContent = data.title;
      if (icon) icon.textContent = data.icon;
      if (subtitle) subtitle.textContent = data.subtitle;
      if (synopsis) synopsis.textContent = data.synopsis;




      if (grid && Array.isArray(data.sections)) {
        grid.innerHTML = data.sections.map((s: any) => `
          <div style="background: rgba(7, 11, 16, 0.9); border: 1px solid var(--border-subtle); border-left: 3px solid var(--accent-cyan); border-radius: 8px; padding: 14px 16px;">
            <strong style="font-family: var(--font-display); font-size: 1.05rem; color: #fff; display: block; margin-bottom: 4px;">${s.title}</strong>
            <p style="font-size: 0.84rem; color: #cbd5e1; line-height: 1.5; margin: 0;">${s.desc}</p>
          </div>
        `).join('');
      }




      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        modal.style.setProperty('z-index', '999999', 'important');
        document.body.classList.add('modal-open');
      }
    };




    (window as any).closePromiseDetailModal = function() {
      const modal = document.getElementById('promiseDetailModal');
      if (!modal) return;
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
      document.body.classList.remove('modal-open');
    };




    // =========================================================================
    // PERSISTENT CHAT BUBBLE DISMISS HANDLER
    // =========================================================================
    (window as any).dismissFloatingChat = function(e?: any) {
      if (e && e.stopPropagation) e.stopPropagation();
      try {
        localStorage.setItem('fifs_chat_bubble_dismissed', '1');
      } catch(err) {}
      const w = document.getElementById('floatingCommWrapper');
      if (w) {
        w.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        w.style.opacity = '0';
        w.style.transform = 'translateY(10px)';
        setTimeout(() => {
          w.style.setProperty('display', 'none', 'important');
        }, 200);
      }
    };




    (window as any).verifyAdminAccess = async function() {
      const emailInput = document.getElementById('adminStaffEmail') as HTMLInputElement | null;
      const passInput = document.getElementById('adminStaffPassword') as HTMLInputElement | null;
      const email = (emailInput?.value || '').trim();
      const password = passInput?.value || ''; // passwords are used exactly as typed
      const statusDiv = document.getElementById('admin-auth-status');

      if (!email || !password) {
        if (statusDiv) {
          statusDiv.style.display = 'block';
          statusDiv.className = 'status-msg error';
          statusDiv.textContent = 'Staff email and password are required to sign in.';
        }
        return;
      }

      if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'status-msg success';
        statusDiv.textContent = 'Authenticating staff credentials with Supabase Auth...';
      }

      try {
        const client = (window as any).supabaseClient || (typeof createSupabaseClient === 'function' ? createSupabaseClient() : null);
        if (!client || !client.auth) {
          throw new Error('Supabase client is not initialized in browser runtime.');
        }

        const { data: authData, error: authError } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (authError || !authData.session) {
          if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.className = 'status-msg error';
            statusDiv.textContent = authError?.message || 'Access Denied: Invalid credentials.';
          }
          return;
        }

        const token = authData.session.access_token;
        (window as any).__fifsStaffSession = authData.session;

        const res = await fetch('/api/fifs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ action: 'getAdminDashboardData' })
        });

        const data = await res.json();
        if (data && (data.success || data.status === 'success')) {
          if (statusDiv) statusDiv.style.display = 'none';
          (window as any).renderAdminTerminal(data);
          (window as any).renderAdminClientTerminal(data);
        } else {
          if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.className = 'status-msg error';
            statusDiv.textContent = data.error || 'Access Denied: Account lacks administrative privileges.';
          }
        }
      } catch (err: any) {
        if (statusDiv) {
          statusDiv.style.display = 'block';
          statusDiv.className = 'status-msg error';
          statusDiv.textContent = 'Authentication error: ' + (err.message || 'Unable to connect.');
        }
      }
    };




    // Roster data comes from the database; escape it before inserting it as HTML.
    const escHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (ch) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>
    )[ch]);
    // Only allow http(s) links (blocks javascript:, data:, etc.).
    const safeHttpUrl = (value: unknown): string => {
      try {
        const url = new URL(String(value ?? ''), window.location.origin);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '#';
      } catch {
        return '#';
      }
    };

    (window as any).renderAdminTerminal = function(data: any) {
      const authBox = document.getElementById('admin-auth-box');
      const dashBox = document.getElementById('admin-command-dashboard');
      if (authBox) {
        authBox.classList.add('hidden');
        authBox.style.setProperty('display', 'none', 'important');
      }
      if (dashBox) {
        dashBox.classList.remove('hidden');
        dashBox.style.setProperty('display', 'block', 'important');
      }

      // Sync and render live chats immediately upon dashboard data load
      if (data && (data.liveChats || data.threads || data.messages)) {
        const rawThreads = data.liveChats || data.threads;
        if (typeof (window as any).saveChatThreads === 'function') {
          (window as any).saveChatThreads(rawThreads);
        }
        if (typeof (window as any).renderAdminChatConsole === 'function') {
          (window as any).renderAdminChatConsole();
        }
        if (typeof (window as any).updateAdminChatBadgeCount === 'function') {
          (window as any).updateAdminChatBadgeCount();
        }
      }

      const students = (data && Array.isArray(data.students)) ? data.students : [];
      (window as any).adminCachedStudents = students;




      let totalCount = students.length;
      let pendingCount = 0;
      let upcomingCount = 0;
      let completedCount = 0;
      students.forEach((s: any) => {
        const st = String(s.status || '').toUpperCase();
        if (st.includes('STEP_1') || st.includes('REGISTERED') || st.includes('PREP')) pendingCount++;
        else if (st.includes('STEP_2') || st.includes('SCHEDULED') || st.includes('RANGE')) upcomingCount++;
        else completedCount++;
      });




      const elTot = document.getElementById('metric-total');
      const elPen = document.getElementById('metric-pending');
      const elUpc = document.getElementById('metric-upcoming');
      const elCom = document.getElementById('metric-completed');
      if (elTot) elTot.textContent = String(totalCount);
      if (elPen) elPen.textContent = String(pendingCount);
      if (elUpc) elUpc.textContent = String(upcomingCount);
      if (elCom) elCom.textContent = String(completedCount);




      const tbody = document.getElementById('admin-roster-tbody');
      if (tbody) {
        tbody.innerHTML = '';
        if (students.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No student bookings recorded yet. Use "SEND PORTAL INVITE" to add someone.</td></tr>';
        } else {
          students.forEach((s: any) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
            tr.innerHTML = `
              <td style="padding: 12px; font-weight: 700; color: var(--accent-cyan); font-family: monospace;">${escHtml(s.studentId || 'FIFS-TBD')}</td>
              <td style="padding: 12px;">
                <strong style="color: #fff; display: block;">${escHtml(s.fullName || 'Student')}</strong>
                <span style="color: var(--text-muted); font-size: 0.78rem;">${escHtml(s.phone || '')} &bull; ${escHtml(s.email || '')}</span>
              </td>
              <td style="padding: 12px;">
                <span style="color: #e2e8f0; font-weight: 600;">${escHtml(s.course || 'Maryland Firearms Training')}</span>
                <span style="display: block; font-size: 0.76rem; color: ${s.track === 'VIP' ? 'var(--accent-amber)' : 'var(--accent-cyan)'};">${escHtml(s.track || 'Base')} Track</span>
              </td>
              <td style="padding: 12px; color: #cbd5e1; font-size: 0.82rem;">${escHtml(s.assignedDate || 'Upcoming Cohort')}</td>
              <td style="padding: 12px;">
                <span style="background: rgba(0, 229, 255, 0.12); color: var(--accent-cyan); border: 1px solid rgba(0, 229, 255, 0.3); padding: 4px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;">
                  ${escHtml(s.status || 'STEP_1_REGISTERED')}
                </span>
              </td>
              <td style="padding: 12px;">
                <a href="${escHtml(safeHttpUrl(s.profileDocUrl))}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-cyan); font-size: 0.82rem; text-decoration: underline;">
                  📄 View Dossier
                </a>
              </td>
              <td style="padding: 12px;">
                <select style="background: #0d131d; border: 1px solid var(--border-subtle); color: #fff; font-size: 0.78rem; padding: 4px 8px; border-radius: 4px;">
                  <option value="${escHtml(s.status)}">${escHtml(s.status || 'Current')}</option>
                  <option value="STEP_1_REGISTERED">1: Registered</option>
                  <option value="STEP_2_CLASS_PREP">2: Prep Complete</option>
                  <option value="STEP_3_ACADEMIC_DONE">3: Academics Passed</option>
                  <option value="STEP_4_RANGE_QUALIFIED">4: Range Qualified</option>
                  <option value="STEP_5_DOSSIER_READY">5: Dossier Ready</option>
                  <option value="STEP_6_MSP_SUBMITTED">6: MSP Submitted</option>
                  <option value="STEP_7_PERMIT_ACTIVE">7: Permit Issued</option>
                  <option value="STEP_8_RENEWAL_WATCH">8: Renewal Watch</option>
                </select>
              </td>
              <td style="padding: 12px; text-align: center;">
                <button type="button" style="background: rgba(0, 229, 255, 0.12); border: 1px solid var(--accent-cyan); color: var(--accent-cyan); padding: 4px 10px; border-radius: 4px; font-size: 0.76rem; cursor: pointer; font-weight: 700;">
                  Manage
                </button>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      }
    };




    (window as any).renderAdminClientTerminal = function(data: any) {
      const clients = (data && Array.isArray(data.clients)) ? data.clients : [];
      (window as any).adminCachedClients = clients;




      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let activeCount = 0;
      let renewalCount = 0;
      let expiredCount = 0;




      clients.forEach((c: any) => {
        let diffDays = 365;
        if (c.expirationDate) {
          try {
            const exp = new Date(c.expirationDate);
            if (!isNaN(exp.getTime())) {
              diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }
          } catch(e) {}
        }
        c.daysLeft = diffDays;
        if (diffDays <= 0) expiredCount++;
        else if (diffDays <= 90) renewalCount++;
        else activeCount++;
      });




      const elTot = document.getElementById('metric-client-total');
      const elAct = document.getElementById('metric-client-active');
      const elRen = document.getElementById('metric-client-renewal');
      const elExp = document.getElementById('metric-client-expired');
      if (elTot) elTot.textContent = String(clients.length);
      if (elAct) elAct.textContent = String(activeCount);
      if (elRen) elRen.textContent = String(renewalCount);
      if (elExp) elExp.textContent = String(expiredCount);




      const tbody = document.getElementById('admin-client-tbody');
      if (tbody) {
        tbody.innerHTML = '';
        if (clients.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No client records found. New permit holders will appear automatically upon registration.</td></tr>';
        } else {
          clients.forEach((c: any) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
            tr.innerHTML = `
              <td style="padding: 12px; font-weight: 700; color: var(--accent-amber); font-family: monospace;">${escHtml(c.clientId || 'FI-CLIENT')}</td>
              <td style="padding: 12px;">
                <strong style="color: #fff; display: block;">${escHtml(c.fullName || 'Client')}</strong>
                <span style="color: var(--text-muted); font-size: 0.78rem;">${escHtml(c.phone || '')} &bull; ${escHtml(c.email || '')}</span>
              </td>
              <td style="padding: 12px; color: #cbd5e1;">${escHtml(c.permitState || 'Maryland Wear & Carry')}</td>
              <td style="padding: 12px; color: #cbd5e1;">${escHtml(c.expirationDate || 'N/A')}</td>
              <td style="padding: 12px; font-weight: 700; color: ${c.daysLeft <= 30 ? '#ef4444' : (c.daysLeft <= 90 ? 'var(--accent-amber)' : '#10b981')};">
                ${c.daysLeft > 0 ? escHtml(c.daysLeft) + ' Days' : 'EXPIRED'}
              </td>
              <td style="padding: 12px;">
                <span style="background: rgba(245, 158, 11, 0.12); color: var(--accent-amber); border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 700;">
                  ${escHtml(c.status || 'ACTIVE_REGISTERED')}
                </span>
              </td>
              <td style="padding: 12px; text-align: center;">
                <button type="button" style="background: rgba(245, 158, 11, 0.12); border: 1px solid var(--accent-amber); color: var(--accent-amber); padding: 4px 10px; border-radius: 4px; font-size: 0.76rem; cursor: pointer; font-weight: 700;">
                  Notify
                </button>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      }
    };




    (window as any).refreshAdminRoster = async function() {
      const token = (await getSessionBearerToken()) || "";
      if (!token) return;
      fetch('/api/fifs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ action: 'getAdminDashboardData' })
      })
      .then(res => res.json())
      .then(data => {
        if (data && (data.success || data.status === 'success')) {
          (window as any).renderAdminTerminal(data);
          (window as any).renderAdminClientTerminal(data);
        }
      })
      .catch(err => console.warn('Refresh admin error:', err));
    };

    (window as any).refreshAdminLiveChats = (window as any).refreshAdminChat = async function() {
      const token = (await getSessionBearerToken()) || "";
      if (!token) return;
      try {
        const res = await fetch('/api/fifs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ action: 'getLiveChats' })
        });
        const data = await res.json();
        if (data && (data.success || data.status === 'success')) {
          const rawThreads = data.threads || data.liveChats;
          if (typeof (window as any).saveChatThreads === 'function') {
            (window as any).saveChatThreads(rawThreads);
          }
          if (typeof (window as any).renderAdminChatConsole === 'function') {
            (window as any).renderAdminChatConsole();
          }
          if (typeof (window as any).updateAdminChatBadgeCount === 'function') {
            (window as any).updateAdminChatBadgeCount();
          }
          if ((window as any).__activeAdminChatThreadId && Array.isArray(rawThreads)) {
            const active = rawThreads.find((t: any) => t.id === (window as any).__activeAdminChatThreadId);
            if (active && typeof (window as any).renderActiveAdminChatMessages === 'function') {
              (window as any).renderActiveAdminChatMessages(active);
            }
          }
        }
      } catch (err) {
        console.warn('refreshAdminLiveChats error:', err);
      }
    };




    (window as any).adminSignOut = async function() {
      try {
        const client = (window as any).supabaseClient || (typeof createSupabaseClient === 'function' ? createSupabaseClient() : null);
        if (client && client.auth) {
          await client.auth.signOut();
        }
      } catch (_e) {}
      delete (window as any).__fifsStaffSession;
      // staff session in memory only
      const authBox = document.getElementById('admin-auth-box');
      const dashBox = document.getElementById('admin-command-dashboard');
      if (dashBox) {
        dashBox.classList.add('hidden');
        dashBox.style.setProperty('display', 'none', 'important');
      }
      if (authBox) {
        authBox.classList.remove('hidden');
        authBox.style.setProperty('display', 'block', 'important');
      }
    };




    // =========================================================================
    // 30% DEPOSIT CALCULATION ($45 CINDY'S RANGE FEE + 6% MD TAX)
    // =========================================================================
    (window as any).calculateComprehensiveInvoice = function(baseTuition: number, isVip: boolean, groupSizeStr?: string) {
      let count = 1;
      let discountPercent = 0;
      const str = String(groupSizeStr || '1');
      if (/^2|2 \(paired/i.test(str)) {
        count = 2;
        discountPercent = 0.05;
      } else if (/^[34]|[34] \(small/i.test(str)) {
        // Must match src/Lib/pricing.ts: a group of 4 is charged for 4 attendees
        count = /^4/.test(str) ? 4 : 3;
        discountPercent = 0.10;
      } else if (/5\+/i.test(str) || /^5/i.test(str)) {
        count = 5;
        discountPercent = 0.15;
      }




      const rawTuition = baseTuition * count;
      const discountAmount = rawTuition * discountPercent;
      const discountedTuition = rawTuition - discountAmount;
      // Cindy's Hot Shots range fee: $45.00 per person if Base track, $0.00 if VIP
      const rangeFee = isVip ? 0.00 : (45.00 * count);
      const subtotal = discountedTuition + rangeFee;
      // Maryland 6% sales tax
      const mdTax = subtotal * 0.06;
      const grandTotal = subtotal + mdTax;
      // Required 30% deposit
      const depositDueNow = grandTotal * 0.30;
      const balanceDueClass = grandTotal - depositDueNow;




      return {
        attendees: count,
        baseTuitionPerPerson: baseTuition,
        rawTuition,
        discountPercent,
        discountAmount,
        discountedTuition,
        rangeFee,
        subtotal,
        mdTax,
        grandTotal,
        total: grandTotal,
        depositDueNow,
        balanceDueClass,
        isVip
      };
    };




                    // Modal Form Tier Toggle (Standard Base vs VIP Turnkey)
    (window as any).toggleFormTier = function(targetTier: 'base' | 'vip') {
      const selectElem = document.getElementById('courseSelection') as HTMLSelectElement | null;
      if (!selectElem) return;
      const currentVal = (selectElem.value || '').toLowerCase().replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
      const isCurrentlyVip = currentVal.includes('vip') || currentVal.includes('turnkey');
      if ((targetTier === 'vip' && isCurrentlyVip) || (targetTier === 'base' && !isCurrentlyVip)) {
        return;
      }

      const targetIsVip = (targetTier === 'vip');

      let matchedKey = 'ccw';
      if (currentVal.includes('renewal') || currentVal.includes('8-hour') || currentVal.includes('8 hour') || currentVal.includes('recertification')) matchedKey = 'renewal';
      else if (currentVal.includes('mastery') || currentVal.includes('multi-state') || currentVal.includes('multistate')) matchedKey = 'mastery';
      else if (currentVal.includes('combo')) matchedKey = 'combo';
      else if (currentVal.includes('hql') && !currentVal.includes('combo')) matchedKey = 'hql';
      else if (currentVal.includes('ccw') || currentVal.includes('wear & carry')) matchedKey = 'ccw';
      else if (currentVal.includes('coaching') || currentVal.includes('1-on-1')) matchedKey = 'coaching';
      else if (currentVal.includes('cleaning')) matchedKey = 'cleaning';
      else if (currentVal.includes('children') || currentVal.includes('youth') || currentVal.includes('family')) matchedKey = 'children';
      else if (currentVal.includes('alumni') || currentVal.includes('clinic')) matchedKey = 'alumni';

      for (let i = 0; i < selectElem.options.length; i++) {
        const optVal = selectElem.options[i].value.toLowerCase().replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
        const optIsVip = optVal.includes('vip') || optVal.includes('turnkey');
        if (targetIsVip === optIsVip) {
          let isOptMatch = false;
          if (matchedKey === 'renewal' && (optVal.includes('renewal') || optVal.includes('8-hour'))) isOptMatch = true;
          else if (matchedKey === 'mastery' && (optVal.includes('mastery') || optVal.includes('multi-state'))) isOptMatch = true;
          else if (matchedKey === 'combo' && optVal.includes('combo')) isOptMatch = true;
          else if (matchedKey === 'hql' && optVal.includes('hql') && !optVal.includes('combo')) isOptMatch = true;
          else if (matchedKey === 'ccw' && optVal.includes('wear & carry') && !optVal.includes('combo') && !optVal.includes('renewal')) isOptMatch = true;
          else if (matchedKey === 'coaching' && (optVal.includes('coaching') || optVal.includes('1-on-1'))) isOptMatch = true;
          else if (matchedKey === 'cleaning' && optVal.includes('cleaning')) isOptMatch = true;
          else if (matchedKey === 'children' && (optVal.includes('children') || optVal.includes('youth'))) isOptMatch = true;
          else if (matchedKey === 'alumni' && optVal.includes('alumni')) isOptMatch = true;

          if (isOptMatch) {
            selectElem.selectedIndex = i;
            selectElem.value = selectElem.options[i].value;
            break;
          }
        }
      }

      // Synchronize landing page card state
      if (typeof (window as any).setCardTier === 'function') {
        (window as any).setCardTier(matchedKey, targetTier);
      }

      if (typeof (window as any).updateFormPriceDisplay === 'function') {
        (window as any).updateFormPriceDisplay();
      }
    };

    (window as any).updateFormPriceDisplay = function() {
      const selectElem = document.getElementById('courseSelection') as HTMLSelectElement | null;
      if (!selectElem) return;
      const selectedVal = selectElem.value || '';
      const clean = selectedVal.toLowerCase().replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
      const isVip = clean.includes('vip') || clean.includes('turnkey');

      let unitBase = 199.99;
      let unitVip = 349.99;
      let matchedKey = 'ccw';

      if (clean.includes('renewal') || clean.includes('8-hour') || clean.includes('8hr')) {
        matchedKey = 'renewal'; unitBase = 149.99; unitVip = 249.99;
      } else if (clean.includes('mastery') || clean.includes('multi-state') || clean.includes('multistate')) {
        matchedKey = 'mastery'; unitBase = 424.99; unitVip = 549.99;
      } else if (clean.includes('combo')) {
        matchedKey = 'combo'; unitBase = 249.99; unitVip = 375.00;
      } else if (clean.includes('hql')) {
        matchedKey = 'hql'; unitBase = 100.00; unitVip = 165.00;
      } else if (clean.includes('ccw') || clean.includes('wear & carry')) {
        matchedKey = 'ccw'; unitBase = 199.99; unitVip = 349.99;
      } else if (clean.includes('coaching') || clean.includes('1-on-1')) {
        matchedKey = 'coaching'; unitBase = 125.00; unitVip = 195.00;
      } else if (clean.includes('cleaning')) {
        matchedKey = 'cleaning'; unitBase = 75.00; unitVip = 115.00;
      } else if (clean.includes('children') || clean.includes('youth') || clean.includes('family')) {
        matchedKey = 'children'; unitBase = 199.99; unitVip = 265.00;
      } else if (clean.includes('alumni') || clean.includes('clinic')) {
        matchedKey = 'alumni'; unitBase = 65.00; unitVip = 115.00;
      }

      const activeUnit = isVip ? unitVip : unitBase;
      const groupElem = document.getElementById('groupSize') as HTMLSelectElement | null;
      const groupVal = groupElem ? groupElem.value : '1';

      const pricing = (window as any).calculateComprehensiveInvoice(activeUnit, isVip, groupVal);
      const config = (window as any).COURSE_TIER_CONFIG?.[matchedKey] || {};

      const titleElem = document.getElementById('formCardCourseTitle');
      const tierTag = document.getElementById('formCardTierTag');
      const activePrice = document.getElementById('formCardActivePrice');
      const baseVal = document.getElementById('formPriceBaseVal');
      const vipVal = document.getElementById('formPriceVipVal');
      const tierDesc = document.getElementById('formCardTierDesc');
      const boxBase = document.getElementById('formBoxBase');
      const boxVip = document.getElementById('formBoxVip');
      const bookingTitle = document.getElementById('bookingModalTitle');
      const bookingBadge = document.getElementById('bookingModalBadge');

      if (titleElem && config) {
        titleElem.textContent = isVip ? config.vipTitle : config.baseTitle;
      } else if (titleElem) {
        titleElem.textContent = selectedVal.split('—')[0].trim() || 'Maryland Firearms Training';
      }

      if (bookingTitle && config) {
        bookingTitle.textContent = isVip ? `Reserve 👑 VIP ${config.baseTitle}` : `Reserve ${config.baseTitle}`;
      }
      if (bookingBadge && config) {
        bookingBadge.textContent = isVip ? config.vipBadge : config.baseBadge;
      }

      if (tierTag) {
        tierTag.textContent = isVip ? '👑 VIP Turnkey Track Selected' : 'Standard Base Track Selected';
        tierTag.style.color = isVip ? 'var(--accent-amber)' : 'var(--accent-cyan)';
      }

      // Active Price in the card header displays the active class tuition (e.g. $424.99 or $549.99)
      if (activePrice) {
        activePrice.textContent = '$' + activeUnit.toFixed(2);
        activePrice.style.color = isVip ? 'var(--accent-amber)' : 'var(--accent-cyan)';
      }
      if (baseVal) baseVal.textContent = '$' + unitBase.toFixed(2);
      if (vipVal) vipVal.textContent = '$' + unitVip.toFixed(2);

      if (boxBase) {
        boxBase.style.borderColor = !isVip ? 'var(--accent-cyan)' : 'var(--border-subtle)';
        boxBase.style.background = !isVip ? 'rgba(0, 229, 255, 0.08)' : '#070b10';
        boxBase.style.boxShadow = !isVip ? '0 0 14px var(--accent-cyan-glow)' : 'none';
      }
      if (boxVip) {
        boxVip.style.borderColor = isVip ? 'var(--accent-amber)' : 'var(--border-subtle)';
        boxVip.style.background = isVip ? 'rgba(255, 183, 3, 0.12)' : '#070b10';
        boxVip.style.boxShadow = isVip ? '0 0 14px rgba(245, 158, 11, 0.25)' : 'none';
      }
      if (tierDesc && config) {
        tierDesc.style.borderLeftColor = isVip ? 'var(--accent-amber)' : 'var(--accent-cyan)';
        tierDesc.textContent = isVip ? config.vipDesc : config.baseDesc;
      }

      // Update Breakdown Box elements (Course Tuition and all itemized charges)
      const bTuition = document.getElementById('formBreakdownTuition');
      const bRange = document.getElementById('formBreakdownRangeFee');
      const bTax = document.getElementById('formBreakdownTax');
      const bTotal = document.getElementById('formBreakdownTotal');
      const bDeposit = document.getElementById('formBreakdownDeposit');
      const bBalance = document.getElementById('formBreakdownBalance');

      if (bTuition) bTuition.textContent = '$' + pricing.discountedTuition.toFixed(2);
      if (bRange) {
        bRange.textContent = isVip ? 'INCLUDED (VIP Perk)' : '+$' + pricing.rangeFee.toFixed(2) + ' (Base Track)';
        bRange.style.color = isVip ? '#10b981' : '#f59e0b';
      }
      if (bTax) bTax.textContent = '+$' + pricing.mdTax.toFixed(2);
      if (bTotal) {
        bTotal.textContent = '$' + pricing.grandTotal.toFixed(2);
        bTotal.style.color = isVip ? 'var(--accent-amber)' : 'var(--accent-cyan)';
      }
      if (bDeposit) bDeposit.textContent = '$' + pricing.depositDueNow.toFixed(2);
      if (bBalance) bBalance.textContent = '$' + pricing.balanceDueClass.toFixed(2);

      if (typeof (window as any).renderBookingCalendar === 'function') {
        (window as any).renderBookingCalendar();
      }
    };








        (window as any).openCourseBookingModal = function() {
      const modal = document.getElementById('courseBookingModal');
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        modal.style.setProperty('z-index', '999999', 'important');
        modal.scrollTop = 0;
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
      if (typeof (window as any).updateFormPriceDisplay === 'function') {
        (window as any).updateFormPriceDisplay();
      }
      if (typeof (window as any).renderBookingCalendar === 'function') {
        (window as any).renderBookingCalendar();
      }
    };

    (window as any).closeCourseBookingModal = function() {
      const modal = document.getElementById('courseBookingModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('visibility', 'hidden', 'important');
      }
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };




    (window as any).is16HourCourseSelected = function() {
      const selectElem = document.getElementById('courseSelection') as HTMLSelectElement | null;
      const val = (selectElem ? selectElem.value : '').toLowerCase();
      if (val.includes('renewal') || val.includes('8-hour') || val.includes('8hr')) return false;
      if (val.includes('wear & carry') || val.includes('ccw') || val.includes('multi-state') || val.includes('16-hour') || val.includes('16hr')) {
        return true;
      }
      return false;
    };




        // =========================================================================
    // BOOKING INVOICE MODAL & 30% DEPOSIT CHECKOUT CONTROLLER
    // =========================================================================
    let __fifsCurrentBookingPayload: any = null;
    let __fifsOriginalBookingFormHtml: string = '';




    (window as any).showBookingInvoiceModal = function(e?: any) {
      if (e && e.preventDefault) e.preventDefault();
      if (e && e.stopPropagation) e.stopPropagation();




      const form = document.getElementById('booking-form') as HTMLFormElement | null;
      const statusDiv = document.getElementById('booking-status');
      if (!form) return false;




      const fullNameInput = document.getElementById('fullName') as HTMLInputElement | null;
      const emailInput = document.getElementById('email') as HTMLInputElement | null;
      const phoneInput = document.getElementById('phone') as HTMLInputElement | null;
      const safetyCheck = document.getElementById('safety-check') as HTMLInputElement | null;
      const courseSelect = document.getElementById('courseSelection') as HTMLSelectElement | null;
      const groupSelect = document.getElementById('groupSize') as HTMLSelectElement | null;
      const commentsInput = document.getElementById('comments') as HTMLTextAreaElement | null;




      const fullName = fullNameInput ? fullNameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const courseSelection = courseSelect ? courseSelect.value : 'Maryland Firearms Training Course';
      const groupSize = groupSelect ? groupSelect.value : '1 (Private One-on-One)';
      const comments = commentsInput ? commentsInput.value.trim() : '';




      [fullNameInput, emailInput, phoneInput].forEach(inp => {
        if (inp) {
          inp.style.borderColor = 'var(--border-subtle)';
          inp.style.boxShadow = 'none';
        }
      });




      const reportBookingError = (element: HTMLElement | null, message: string) => {
        if (element) {
          element.style.borderColor = '#ef4444';
          element.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.4)';
          try {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
          } catch (err) {}
        }
        if (statusDiv) {
          statusDiv.style.display = 'block';
          statusDiv.className = 'status-msg error';
          statusDiv.style.color = '#ef4444';
          statusDiv.style.background = 'rgba(239, 68, 68, 0.1)';
          statusDiv.style.border = '1px solid #ef4444';
          statusDiv.style.padding = '10px 14px';
          statusDiv.style.borderRadius = '8px';
          statusDiv.style.marginBottom = '12px';
          statusDiv.innerHTML = message;
        }
        alert(message);
      };




      if (!fullName) {
        reportBookingError(fullNameInput, '⚠️ Please enter your Full Legal Name before continuing.');
        return false;
      }
      if (!email || !email.includes('@')) {
        reportBookingError(emailInput, '⚠️ Please enter a valid Email Address for your invoice and student portal login.');
        return false;
      }
      if (!phone) {
        reportBookingError(phoneInput, '⚠️ Please enter your Phone Number so Instructor Kai Wade can coordinate range details.');
        return false;
      }
      if (safetyCheck && !safetyCheck.checked) {
        reportBookingError(safetyCheck, '⚠️ MANDATORY RANGE SAFETY POLICY:\nPlease check the box accepting the Range Safety Policy (no live ammunition in classroom) to proceed.');
        return false;
      }




      if (statusDiv) {
        statusDiv.style.display = 'none';
        statusDiv.innerHTML = '';
      }




      const invoiceId = 'INV-FI-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const studentId = 'FIFS-' + Math.floor(1000 + Math.random() * 9000);
      const isVipCourse = /VIP/i.test(courseSelection || '');




      let unitBase = 249.99;
      let unitVip = 375.00;
      const clean = courseSelection.toLowerCase();
      if (clean.includes('mastery') || clean.includes('multi-state') || clean.includes('multistate')) {
        unitBase = 424.99; unitVip = 549.99;
      } else if (clean.includes('renewal')) {
        unitBase = 149.99; unitVip = 249.99;
      } else if (clean.includes('combo')) {
        unitBase = 249.99; unitVip = 375.00;
      } else if (clean.includes('hql')) {
        unitBase = 100.00; unitVip = 195.00;
      } else if (clean.includes('ccw') || clean.includes('wear & carry')) {
        unitBase = 249.99; unitVip = 375.00;
      } else if (clean.includes('coaching')) {
        unitBase = 125.00; unitVip = 195.00;
      } else if (clean.includes('cleaning')) {
        unitBase = 75.00; unitVip = 115.00;
      } else if (clean.includes('children')) {
        unitBase = 199.99; unitVip = 265.00;
      } else if (clean.includes('alumni')) {
        unitBase = 65.00; unitVip = 115.00;
      }




      const activeUnit = isVipCourse ? unitVip : unitBase;
      const pricing = (window as any).calculateComprehensiveInvoice(activeUnit, isVipCourse, groupSize);




      __fifsCurrentBookingPayload = {
        invoiceId,
        studentId,
        fullName,
        email,
        phone,
        courseSelection,
        preferredDates: 'Coordinated with Lead Instructor Kai Wade',
        groupSize,
        comments,
        pricing,
        isVipCourse,
        dateIssued: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      };




      const modalBox = document.querySelector('#courseBookingModal .goal-modal-box') as HTMLElement | null;
      if (!modalBox) return false;




      if (!__fifsOriginalBookingFormHtml) {
        __fifsOriginalBookingFormHtml = modalBox.innerHTML;
      }




      const p = __fifsCurrentBookingPayload;
      const invoiceHtml = `
        <div id="fifs-invoice-step" style="animation: fadeIn 0.25s ease; text-align: left;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1e293b;padding-bottom:14px;margin-bottom:16px;">
            <div>
              <span style="background:rgba(0,229,255,0.12);color:var(--accent-cyan);border:1px solid var(--accent-cyan);font-size:0.75rem;font-weight:800;padding:4px 10px;border-radius:4px;letter-spacing:0.08em;text-transform:uppercase;">STEP 1 OF 2: ENROLLMENT INVOICE</span>
              <h3 style="color:#fff;font-size:1.6rem;margin:8px 0 2px;font-family:var(--font-display);font-weight:700;">Official Training Invoice</h3>
              <p style="color:var(--text-muted);font-size:0.82rem;margin:0;">Future Initiative Firearm Services (FIFS) &bull; Lead Instructor Kai Wade</p>
            </div>
            <button type="button" onclick="(window).closeCourseBookingModal()" style="background:none;border:none;color:#94a3b8;font-size:1.4rem;cursor:pointer;">&times;</button>
          </div>
          <div style="background:#0d131d;border:1px solid #1e293b;border-radius:8px;padding:14px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">Invoice &amp; Record Number</div>
              <div style="font-size:1.25rem;font-weight:800;color:var(--accent-cyan);font-family:monospace;">${p.invoiceId}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Date Issued</div>
              <div style="font-size:0.95rem;font-weight:700;color:#fff;">${p.dateIssued}</div>
            </div>
          </div>
          <div style="background:#10161f;border:1px solid #1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
            <div style="font-size:0.75rem;font-weight:800;color:var(--accent-cyan);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">STUDENT &amp; SESSION DETAILS</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.85rem;">
              <div><span style="color:#64748b;display:block;font-size:0.74rem;">STUDENT</span><strong style="color:#f8fafc;">${p.fullName}</strong></div>
              <div><span style="color:#64748b;display:block;font-size:0.74rem;">PHONE / EMAIL</span><strong style="color:#f8fafc;">${p.phone}<br>${p.email}</strong></div>
              <div><span style="color:#64748b;display:block;font-size:0.74rem;">CURRICULUM</span><strong style="color:#f8fafc;">${p.courseSelection}</strong></div>
              <div><span style="color:#64748b;display:block;font-size:0.74rem;">FORMAT / SIZE</span><strong style="color:#f8fafc;">${p.groupSize}</strong></div>
            </div>
          </div>
          <div style="background:#070b11;border:1px solid #1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
            <div style="font-size:0.75rem;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">ITEMIZED ENROLLMENT CHARGES</div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e293b;font-size:0.86rem;">
              <span style="color:#e2e8f0;">${p.courseSelection} (Tuition)</span>
              <strong style="color:#fff;">$${pricing.rawTuition.toFixed(2)}</strong>
            </div>
            ${pricing.discountAmount > 0 ? `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e293b;font-size:0.84rem;color:#10b981;">
                <div><span style="font-weight:700;">Group / Format Tier Discount (${Math.round(pricing.discountPercent * 100)}% OFF)</span><br><span style="color:#6ee7b7;font-size:0.75rem;">${p.groupSize}</span></div>
                <strong>-$${pricing.discountAmount.toFixed(2)}</strong>
              </div>
            ` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e293b;font-size:0.84rem;">
              <div><span style="color:#f8fafc;font-weight:600;">Cindy\'s Range &amp; Target Fee</span><br><span style="color:#64748b;font-size:0.75rem;">Dedicated lane reservation, B-27 qualification targets & ammo</span></div>
              <strong style="color:${isVipCourse ? '#10b981' : '#f59e0b'};">${isVipCourse ? 'INCLUDED (VIP Perk)' : '+$' + pricing.rangeFee.toFixed(2)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e293b;font-size:0.84rem;color:#94a3b8;">
              <span>Subtotal:</span>
              <strong style="color:#f8fafc;">$${pricing.subtotal.toFixed(2)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e293b;font-size:0.84rem;color:#38bdf8;">
              <span>Maryland State Sales Tax (6%):</span>
              <strong>+$${pricing.mdTax.toFixed(2)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 6px;border-bottom:1px dashed #334155;font-size:1.15rem;">
              <strong style="color:#fff;">Total Course Investment:</strong>
              <strong style="color:var(--accent-cyan);font-family:var(--font-display);font-size:1.35rem;">$${pricing.grandTotal.toFixed(2)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);border-radius:8px;margin-top:10px;">
              <span style="color:#f59e0b;font-weight:800;font-size:0.95rem;">⚡ REQUIRED 30% DEPOSIT (DUE NOW TO RESERVE SEAT):</span>
              <strong style="color:#f59e0b;font-size:1.35rem;font-family:var(--font-display);letter-spacing:0.5px;">$${pricing.depositDueNow.toFixed(2)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 4px 2px;font-size:0.82rem;color:#94a3b8;">
              <span>Remaining Balance (Due Upon Class Start):</span>
              <span style="color:#cbd5e1;font-weight:600;">$${pricing.balanceDueClass.toFixed(2)}</span>
            </div>
          </div>
          <div id="invoice-status-div" style="display:none;margin-bottom:14px;padding:10px;border-radius:8px;font-size:0.84rem;"></div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button type="button" id="btn-confirm-invoice-deposit" onclick="(window).confirmAndFinalizeBooking(false)" style="background:linear-gradient(135deg, #f59e0b, #d97706);color:#000;font-weight:800;padding:14px 20px;border-radius:8px;border:none;cursor:pointer;font-size:1rem;text-transform:uppercase;letter-spacing:1px;box-shadow:0 0 20px rgba(245,158,11,0.4);">
              ⚡ Confirm &amp; Pay 30% Deposit ($${pricing.depositDueNow.toFixed(2)}) &rarr;
            </button>
            <button type="button" id="btn-confirm-invoice-full" onclick="(window).confirmAndFinalizeBooking(true)" style="background:rgba(0,229,255,0.12);color:var(--accent-cyan);border:1.5px solid var(--accent-cyan);font-weight:700;padding:12px 18px;border-radius:8px;cursor:pointer;font-size:0.88rem;text-transform:uppercase;letter-spacing:0.5px;">
              💳 Or Pay Full Course Tuition ($${pricing.grandTotal.toFixed(2)}) &rarr;
            </button>
            <button type="button" onclick="(window).returnToBookingForm()" style="background:none;border:1px solid #334155;color:#94a3b8;padding:10px;border-radius:8px;cursor:pointer;font-size:0.84rem;">
              &larr; Back / Edit Details
            </button>
          </div>
        </div>
      `;




      modalBox.innerHTML = invoiceHtml;
      return true;
    };




    (window as any).returnToBookingForm = function() {
      const modalBox = document.querySelector('#courseBookingModal .goal-modal-box') as HTMLElement | null;
      if (modalBox && __fifsOriginalBookingFormHtml) {
        modalBox.innerHTML = __fifsOriginalBookingFormHtml;
        if (__fifsCurrentBookingPayload) {
          const form = document.getElementById('booking-form') as HTMLFormElement | null;
          if (form) {
            const fullNameInput = document.getElementById('fullName') as HTMLInputElement | null;
            const emailInput = document.getElementById('email') as HTMLInputElement | null;
            const phoneInput = document.getElementById('phone') as HTMLInputElement | null;
            const courseSelect = document.getElementById('courseSelection') as HTMLSelectElement | null;
            const commentsInput = document.getElementById('comments') as HTMLTextAreaElement | null;




            if (fullNameInput) fullNameInput.value = __fifsCurrentBookingPayload.fullName || '';
            if (emailInput) emailInput.value = __fifsCurrentBookingPayload.email || '';
            if (phoneInput) phoneInput.value = __fifsCurrentBookingPayload.phone || '';
            if (courseSelect) courseSelect.value = __fifsCurrentBookingPayload.courseSelection || '';
            if (commentsInput) commentsInput.value = __fifsCurrentBookingPayload.comments || '';
          }
        }
      }
    };




    (window as any).confirmAndFinalizeBooking = function(payInFull: boolean = false) {
      const p = __fifsCurrentBookingPayload;
      if (!p) return;




      const btnDeposit = document.getElementById('btn-confirm-invoice-deposit') as HTMLButtonElement | null;
      const btnFull = document.getElementById('btn-confirm-invoice-full') as HTMLButtonElement | null;
      const statusDiv = document.getElementById('invoice-status-div');




      if (btnDeposit) btnDeposit.disabled = true;
      if (btnFull) btnFull.disabled = true;




      if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.style.background = 'rgba(0, 229, 255, 0.12)';
        statusDiv.style.color = 'var(--accent-cyan)';
        statusDiv.style.border = '1px solid var(--accent-cyan)';
        statusDiv.innerHTML = '⚡ Securing reservation &amp; redirecting to Stripe Checkout...';
      }




      const payload = {
        invoiceId: p.invoiceId,
        studentId: p.studentId,
        fullName: p.fullName,
        email: p.email,
        phone: p.phone,
        courseSelection: p.courseSelection,
        preferredDates: p.preferredDates,
        groupSize: p.groupSize,
        comments: p.comments,
        amount: payInFull ? p.pricing.grandTotal : p.pricing.depositDueNow,
        depositAmount: p.pricing.depositDueNow,
        totalAmount: p.pricing.grandTotal,
        rangeFee: p.pricing.rangeFee,
        taxAmount: p.pricing.mdTax,
        payInFull: Boolean(payInFull)
      };




      if (typeof (window as any).callFifsBackend === 'function') {
        (window as any).callFifsBackend('submitBooking', payload, (res: any) => {
          if (res && res.checkoutUrl) {
            window.location.href = res.checkoutUrl;
          } else if (res && res.url) {
            window.location.href = res.url;
          } else {
            if (statusDiv) {
              statusDiv.innerHTML = '✓ Seat reserved! Lead Instructor Kai Wade will contact you directly.';
            }
          }
        }, (err: any) => {
          if (statusDiv) {
            statusDiv.style.background = 'rgba(239, 68, 68, 0.12)';
            statusDiv.style.color = '#ef4444';
            statusDiv.style.border = '1px solid #ef4444';
            statusDiv.innerHTML = 'Payment initiation error: ' + (err.message || 'Unable to connect to Stripe.');
          }
          if (btnDeposit) btnDeposit.disabled = false;
          if (btnFull) btnFull.disabled = false;
        });
      } else {
        fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(r => r.json())
        .then(data => {
          if (data && data.url) {
            window.location.href = data.url;
          } else {
            alert('Seat reserved successfully!');
          }
        })
        .catch(err => alert('Checkout error: ' + err.message));
      }
    };




        (window as any).openCourseBookingModal = function() {
      const modal = document.getElementById('courseBookingModal');
      if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        modal.style.setProperty('z-index', '999999', 'important');
        modal.scrollTop = 0;
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      }
      if (typeof (window as any).updateFormPriceDisplay === 'function') {
        (window as any).updateFormPriceDisplay();
      }
      if (typeof (window as any).renderBookingCalendar === 'function') {
        (window as any).renderBookingCalendar();
      }
    };

    (window as any).closeCourseBookingModal = function() {
      const modal = document.getElementById('courseBookingModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
        document.body.classList.remove('modal-open');
      }
    };




    (window as any).deleteClientPermit = async function(permitId: string) {
      if (!permitId) return;
      const confirmDelete = window.confirm("Are you sure you want to remove this active permit record from your verified profile?");
      if (!confirmDelete) return;




      try {
        const rowEl = document.getElementById('permit-badge-' + permitId);
        if (rowEl) rowEl.style.opacity = '0.35';




        // 1. Call Supabase Direct if available
        const supabase = (typeof (window as any).createSupabaseClient === 'function') ? (window as any).createSupabaseClient() : null;
        if (supabase) {
          await supabase.from('user_permits').delete().eq('id', permitId);
        }




        // 2. Call FIFS Backend Route Handler with bearer token
        const token = (await getSessionBearerToken()) || "";
        await fetch('/api/fifs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
          },
          body: JSON.stringify({ action: 'deletePermit', permitId })
        }).catch(() => {});




        if (rowEl) rowEl.remove();
      } catch (err) {
        console.error('Failed to remove permit record:', err);
        alert('Notice: Permit removal could not be synced immediately.');
      }
    };




    document.addEventListener('click', handleDelegatedClick);
    document.addEventListener('change', handleDelegatedChange);
    document.addEventListener('keydown', handleDelegatedKeyDown as any);
    
    // Ensure live chat opens the real 2-way chat console with background polling
    (window as any).handleLiveChatSubmit = function(e: any) {
      if (e && e.preventDefault) e.preventDefault();
      const nameEl = document.getElementById('chatSenderName') as HTMLInputElement | null;
      const phoneEl = document.getElementById('chatSenderPhone') as HTMLInputElement | null;
      const msgEl = document.getElementById('chatMessageText') as HTMLTextAreaElement | null;
      const btn = document.getElementById('btn-send-chat') as HTMLButtonElement | null;
      const name = nameEl ? nameEl.value.trim() : '';
      const phone = phoneEl ? phoneEl.value.trim() : '';
      const msg = msgEl ? msgEl.value.trim() : '';
      if (!name || !phone || !msg) {
        alert('Please fill out your Name, Phone, and Question to open live chat.');
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Opening Live Chat Window...';
      }
      if (typeof (window as any).sendClientDiscordAlert === 'function') {
        try {
          (window as any).sendClientDiscordAlert(
            "💬 Incoming Live Chat: " + name,
            "A visitor initiated a conversation via the website live chat widget.",
            [
              { name: "Sender Name", value: name, inline: true },
              { name: "Phone / SMS Callback", value: phone, inline: true },
              { name: "Operating Window", value: typeof (window as any).isLiveChatActiveNow === 'function' && (window as any).isLiveChatActiveNow() ? "ONLINE NOW (9 AM – 5 PM EST)" : "AFTER HOURS", inline: true },
              { name: "Initial Message Content", value: msg, inline: false }
            ],
            0x00E5FF
          );
        } catch(err) {}
      }
      if (typeof (window as any).closeContactWidgetModal === 'function') {
        (window as any).closeContactWidgetModal();
      }
      if (typeof (window as any).openTwoWayChat === 'function') {
        (window as any).openTwoWayChat(name, phone, msg);
      } else if (typeof (window as any).openP2pCommsHud === 'function') {
        (window as any).openP2pCommsHud(name, phone, msg);
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💬 Send Message & Open Live Chat →';
      }
      const cleanPhone = phone.replace(/\D/g, '');
      const threadId = cleanPhone ? ('thread_' + cleanPhone) : ('thread_' + Date.now());
      if ((window as any).__currentChatSession) {
        (window as any).__currentChatSession.threadId = threadId;
      }
      const payload = {
        senderName: name,
        senderPhone: phone,
        senderEmail: '',
        message: msg,
        threadId: threadId
      };
      if (typeof (window as any).callFifsBackend === 'function') {
        (window as any).callFifsBackend('handleLiveChatMessage', payload, function(res: any) {
          console.log('Message logged in Google Sheets Live_Chats tab:', res);
        }, function(err: any) {
          console.error('Failed to log message in Google Sheets:', err);
        });
      }
    };








document.addEventListener('submit', handleDelegatedSubmit);
















    const handleModalEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        ['multiPermitModal', 'reciprocityHubModal', 'vehicleTravelModal', 'flyingWithFirearmModal', 'permitRenewalModal', 'clientProfileModal', 'futureServicesModal', 'clientFaqModal'].forEach(id => {
          const m = document.getElementById(id);
          if (m && m.classList.contains('active')) {
            m.style.setProperty('display', 'none', 'important');
            m.classList.remove('active');
          }
        });
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('keydown', handleModalEscapeKey);




    return () => {
      window.removeEventListener('keydown', handleModalEscapeKey);
      document.removeEventListener('click', handleDelegatedClick);
      document.removeEventListener('change', handleDelegatedChange);
      document.removeEventListener('submit', handleDelegatedSubmit);
    };
  }, []);








  return (
    <div className="train-with-fifs-root min-h-screen bg-[#070b10] text-[#f8fafc] font-sans">
      <Head>
        <title>Train With FIFS | Maryland Firearms Training Platform</title>
        <meta
          name="description"
          content="Maryland firearms training platform designed to build knowledge, safety, and confidence without intimidation. State-approved HQL, Wear &amp; Carry, and private coaching with Lead Instructor Kai Wade."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" type="image/png" href="https://drive.google.com/thumbnail?id=1EnAqEURi1XIRNdNTooFGY_pvs38ZcBEQ&sz=w128" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Rajdhani:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>








      {/* External Dependencies */}
      <Script src="https://js.stripe.com/v3/" strategy="afterInteractive" />
      <Script src="https://js.stripe.com/dahlia/stripe.js" strategy="afterInteractive" />
      <Script 
      src="/scripts/TrainWithFIFS_scripts.js"
        strategy="afterInteractive"
        onLoad={() => console.log("FIFS: TrainWithFIFS_scripts.js loaded successfully. openAndSwitch:", typeof (window as any).openAndSwitch)}
        onError={(e) => console.error("FIFS: Failed to load /Scripts/TrainWithFIFS_scripts.js. Check that the file is in public/scripts/", e)}
      />








      {/* Main Converted JSX Structure Wrapped in Single Parent */}
      <div className="fifs-content-wrapper w-full relative">
      {/* ================= SCREEN 1: HERO LANDING SCREEN ================= */}
      <section aria-label="Welcome to Train With FIFS" id="hero-landing">
        <div className="hero-bg-layer">
          <svg className="hero-holo-overlay-svg" viewBox="0 0 893 1600" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="fifsCyanGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur1">
                </feGaussianBlur>
                <feGaussianBlur stdDeviation="14" result="blur2">
                </feGaussianBlur>
                <feMerge>
                  <feMergeNode in="blur2">
                  </feMergeNode>
                  <feMergeNode in="blur1">
                  </feMergeNode>
                  <feMergeNode in="SourceGraphic">
                  </feMergeNode>
                </feMerge>
              </filter>
              <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0" />
                <stop offset="20%" stopColor="#00e5ff" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="80%" stopColor="#00e5ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#00e5ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* 1. Central Future Initiative Brand & Blue Light Beam */}
            <g className="fifs-holo-beam" style={{"transformOrigin": "446px 376px"}}>
              {/* Searing blue light sliver between Future Initiative and Firearm Services */}
              <rect x="290" y="374" width="313" height="4" fill="url(#beamGradient)" filter="url(#fifsCyanGlow)" rx="2" />
              <circle cx="446" cy="376" r="8" fill="#ffffff" filter="url(#fifsCyanGlow)" opacity="0.9" />
              <circle cx="446" cy="376" r="22" fill="#00e5ff" filter="url(#fifsCyanGlow)" opacity="0.35" />
            </g>
            <g className="fifs-holo-pulse-group" style={{"transformOrigin": "446px 320px"}}>
              {/* Future Initiative Logo subtle cyber halo */}
              <circle cx="446" cy="300" r="64" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="12 8" opacity="0.6" filter="url(#fifsCyanGlow)" />
              <circle cx="446" cy="300" r="76" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 14" opacity="0.4" />
            </g>
            {/* 2. Target & Tactical Telemetry Above Firearm (Left Sector) */}
            {/* Rotating Reticle */}
            <g className="fifs-holo-pulse-group" style={{"transformOrigin": "290px 840px"}}>
              <g className="fifs-holo-rotate" style={{"transformOrigin": "290px 840px"}}>
                <circle cx="290" cy="840" r="44" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeDasharray="24 10" filter="url(#fifsCyanGlow)" />
                <circle cx="290" cy="840" r="32" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="8 6" />
              </g>
              {/* Crosshairs & Center Point */}
              <line x1="240" y1="840" x2="275" y2="840" stroke="#00e5ff" strokeWidth="2" filter="url(#fifsCyanGlow)" />
              <line x1="305" y1="840" x2="340" y2="840" stroke="#00e5ff" strokeWidth="2" filter="url(#fifsCyanGlow)" />
              <line x1="290" y1="790" x2="290" y2="825" stroke="#00e5ff" strokeWidth="2" filter="url(#fifsCyanGlow)" />
              <line x1="290" y1="855" x2="290" y2="890" stroke="#00e5ff" strokeWidth="2" filter="url(#fifsCyanGlow)" />
              <circle cx="290" cy="840" r="4" fill="#ffffff" filter="url(#fifsCyanGlow)" />
            </g>
            {/* Holographic Telemetry Text Above Gun */}
            <g className="fifs-holo-text" style={{"transformOrigin": "290px 770px"}}>
              <rect x="220" y="756" width="140" height="20" fill="rgba(0, 229, 255, 0.08)" stroke="#00e5ff" strokeWidth="1" rx="3" filter="url(#fifsCyanGlow)" />
              <circle cx="230" cy="766" r="3" fill="#00e5ff" />
              <line x1="240" y1="766" x2="345" y2="766" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
            </g>
            {/* 3. Target & HUD Below Tablet (Right Sector) */}
            <g className="fifs-holo-pulse-group" style={{"transformOrigin": "610px 1050px", "animationDelay": "-1.2s"}}>
              <g className="fifs-holo-rotate" style={{"transformOrigin": "610px 1050px", "animationDirection": "reverse", "animationDuration": "25s"}}>
                <circle cx="610" cy="1050" r="48" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeDasharray="16 8 8 8" filter="url(#fifsCyanGlow)" />
                <circle cx="610" cy="1050" r="36" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="12 12" />
              </g>
              {/* Precision Target Ticks */}
              <line x1="555" y1="1050" x2="590" y2="1050" stroke="#00e5ff" strokeWidth="2" filter="url(#fifsCyanGlow)" />
              <line x1="630" y1="1050" x2="665" y2="1050" stroke="#00e5ff" strokeWidth="2" filter="url(#fifsCyanGlow)" />
              <line x1="610" y1="995" x2="610" y2="1030" stroke="#00e5ff" strokeWidth="2" filter="url(#fifsCyanGlow)" />
              <line x1="610" y1="1070" x2="610" y2="1105" stroke="#00e5ff" strokeWidth="2" filter="url(#fifsCyanGlow)" />
              <circle cx="610" cy="1050" r="4" fill="#ffffff" filter="url(#fifsCyanGlow)" />
            </g>
            {/* 4. Holographic Text & Data Stream Above Tablet */}
            <g className="fifs-holo-text" style={{"transformOrigin": "610px 780px", "animationDelay": "-0.7s"}}>
              <rect x="535" y="770" width="150" height="22" fill="rgba(0, 229, 255, 0.08)" stroke="#00e5ff" strokeWidth="1" rx="3" filter="url(#fifsCyanGlow)" />
              <circle cx="548" cy="781" r="3" fill="#10b981" />
              <line x1="560" y1="781" x2="670" y2="781" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8" />
            </g>
          </svg>
          <img alt="Future Initiative Firearms Training Background" className="hero-bg-artwork" data-onerror="this.src=&#x27;https://drive.google.com/thumbnail?id=1lG_LMJ9gBJ3e_DZAkuivaEp-sKH2c0wW&amp;sz=w1920&#x27;" src="https://lh3.googleusercontent.com/d/1lG_LMJ9gBJ3e_DZAkuivaEp-sKH2c0wW" />
          <div className="hero-bg-vignette">
          </div>
        </div>
        {/* Official Motto Ticker with Dynamic Blinking Light */}
        <div className="hero-top-hud">
          <div className="range-live-ticker">
            <span className="pulse-dot" id="live-status-dot" title="Live Training &amp; Student Operations Status">
            </span>
            <span>
              THE FUTURE IS NOW, TAKE THE INITIATIVE!
            </span>
          </div>
        </div>
        {/* Spacer: Clears the background logo ("Future Initiative Firearm Services") */}
        <div className="hero-logo-spacer">
        </div>
        {/* Spacer: Clears the tablet and firearm on the workbench */}
        <div className="hero-mid-spacer">
        </div>
        {/* Command Dock Launcher */}
        <div className="hero-command-dock">
          {/* SPECIALIZED 1-ON-1 INSTRUCTION CALLOUT BANNER */}
          <div style={{"background": "rgba(255, 183, 3, 0.08)", "border": "1px solid var(--accent-amber)", "borderRadius": "12px", "padding": "12px 18px", "marginBottom": "14px", "maxWidth": "540px", "margin": "0 auto 14px", "boxShadow": "0 0 20px rgba(255, 183, 3, 0.18)", "textAlign": "center"}}>
            <span style={{"color": "var(--accent-amber)", "fontWeight": "800", "fontSize": "0.95rem", "display": "block", "fontFamily": "var(--font-display)", "letterSpacing": "0.5px"}}>
              🛡️ DEDICATED PRIVATE 1-ON-1 SPECIALIZATION
            </span>
            <span style={{"color": "#e2e8f0", "fontSize": "0.82rem", "lineHeight": "1.4", "display": "block", "marginTop": "4px"}}>
              Never sit around a room of strangers. Learn at your own pace with Lead Instructor Kai Wade in an exclusive, judgment-free, private range environment.
            </span>
          </div>
          {/* Semi-Transparent Neon Arrow Guide (Colors of the business logo: #00e5ff) */}
          <div className="neon-arrow-guide-wrap" id="wrap-neon-guide" data-onclick="openAndSwitch('booking')" role="button" tabIndex={0} title="New to firearms? Click here to start">
            <div className="neon-arrow-badge neon-mode-cyan" id="neon-start-guide" title="Future Initiative Operations Active • Click to Start Training">
              <span className="neon-arrow-text">
                New To Firearms? Start Here
              </span>
              <span className="neon-arrow-icon">
                ▼
              </span>
            </div>
          </div>
          <button className="btn-hero-booking-prime start-journey-btn" id="btn-hero-booking" data-onclick="openAndSwitch('booking')" type="button">
            <span className="prime-label">
              🎯 START YOUR JOURNEY
            </span>
            <span className="prime-sub">
              ⭐ Specialists in Private 1-on-1 Firearms Training • No Crowded Classrooms
            </span>
          </button>
          <div className="hero-twin-grid">
            <button aria-haspopup="dialog" aria-label="Open Future Initiative Portal selector" className="btn-hero-twin fifs-portal-btn" id="btn-hero-portal" data-onclick="openPortalSelectionModal()" type="button">
              <span className="twin-title">
                ⚡ Future Initiative Portal
              </span>
              <span className="twin-sub">
                Student & Client Access
              </span>
            </button>
            <button className="btn-hero-twin lead-instructor-btn" id="btn-hero-about" data-onclick="openAndSwitch('about')" type="button">
              <span className="twin-title">
                👤 Lead Instructor
              </span>
              <span className="twin-sub">
                Meet Kai Wade • Mission
              </span>
            </button>
          </div>
          <div className="hero-bottom-strip">
            <button className="btn-hero-aux" id="btn-hero-targets" data-onclick="openAndSwitch('testimonial')" type="button">
              🎯 Range Highlights
            </button>
            <span style={{"color": "var(--border-subtle)"}}>
              •
            </span>
            <button className="btn-hero-aux" id="btn-hero-faq" data-onclick="openAndSwitch('faq')" type="button">
              ❓ Frequently Asked Questions
            </button>
            <span style={{"color": "var(--border-subtle)"}}>
              •
            </span>
            <button className="btn-hero-aux" id="btn-hero-contact" data-onclick="openContactWidgetModal()" type="button" style={{"color": "var(--accent-cyan)", "fontWeight": "700", "cursor": "pointer"}}>
              💬 Chat
            </button>
          </div>
        </div>
        {/* Official Google Reviews Ticker (Docked to the bottom of the page) */}
        <div aria-label="Official Google Reviews" className="hero-reviews-marquee-wrap hero-reviews-docked" style={{"width": "100%", "maxWidth": "620px", "margin": "10px auto 0", "background": "rgba(7, 11, 16, 0.94)", "border": "1px solid rgba(0, 229, 255, 0.35)", "borderRadius": "12px", "padding": "6px 12px", "boxShadow": "0 6px 22px rgba(0,0,0,0.85)", "flexShrink": "0", "zIndex": "25"}}>
          <div className="reviews-badge-line" style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "4px", "paddingBottom": "3px", "borderBottom": "1px solid rgba(255, 255, 255, 0.08)"}}>
            <div className="reviews-badge-left" style={{"display": "flex", "alignItems": "center", "gap": "6px"}}>
              <svg className="google-g-logo" height="14" style={{"verticalAlign": "middle", "flexShrink": "0"}} viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4" />
                <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" fill="#34A853" />
                <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
                <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
              </svg>
              <span className="gold-stars-cluster" style={{"color": "#ffb703", "fontSize": "0.8rem"}}>
                ★★★★★
              </span>
              <span style={{"fontFamily": "var(--font-display)", "fontSize": "0.78rem", "fontWeight": "700", "color": "#fff", "letterSpacing": "0.8px"}}>
                5.0 GOOGLE RATING (78 VERIFIED REVIEWS)
              </span>
            </div>
            <span className="reviews-badge-right" style={{"fontSize": "0.68rem", "color": "var(--text-muted)"}}>
              Hover or tap to pause
            </span>
          </div>
          <div className="reviews-marquee-box">
            <div className="reviews-track" id="reviewsTrack">
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Mr. Kai is 100% excellent teaching and is extremely knowledgeable about using firearms and firearms safety."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • Verified Google Review
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Got my MD wear and carry from Future Initiatives and I highly recommend Coach Wade!"
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • MD Wear & Carry Student
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Very informative and detailed explanation on firearm safety, gun ownership and state laws while defending yourself from harm."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • State Licensing Graduate
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Firearm Instructor was very informative of firearm safety and laws. Class was fun to learn and attend! Highly recommended."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • Range Student
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Very personable and gives the most accurate details for gun laws and safety without any intimidation."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • Private Student
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "The instruction from Mr. Kai is extremely knowledgeable with firearms and firearms safety. Clear, thorough, and professional."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • Verified Student
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Top-tier coaching! Patient instruction on grip, recoil management, and practical qualification at Cindy's Hot Shots."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • Wear & Carry Qualifier
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Outstanding class environment. Coach Wade takes the time to make sure everyone understands the legal pillars and feels safe on the range."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • HQL Student
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Mr. Kai is 100% excellent teaching and is extremely knowledgeable about using firearms and firearms safety."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • Verified Google Review
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Got my MD wear and carry from Future Initiatives and I highly recommend Coach Wade!"
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • MD Wear & Carry Student
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Very informative and detailed explanation on firearm safety, gun ownership and state laws while defending yourself from harm."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • State Licensing Graduate
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Firearm Instructor was very informative of firearm safety and laws. Class was fun to learn and attend! Highly recommended."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • Range Student
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Very personable and gives the most accurate details for gun laws and safety without any intimidation."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • Private Student
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "The instruction from Mr. Kai is extremely knowledgeable with firearms and firearms safety. Clear, thorough, and professional."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • Verified Student
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Top-tier coaching! Patient instruction on grip, recoil management, and practical qualification at Cindy's Hot Shots."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • Wear & Carry Qualifier
                </span>
              </div>
              <div className="review-item-pill">
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-quote-text">
                  "Outstanding class environment. Coach Wade takes the time to make sure everyone understands the legal pillars and feels safe on the range."
                </span>
                <span className="gold-stars-cluster">
                  ★★★★★
                </span>
                <span className="review-author-tag">
                  • HQL Student
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ================= SCREEN 2: MAIN TRAINING PORTAL & BUSINESS SYSTEM ================= */}
      <div className="container" id="app-container">
        <header className="app-header">
          <div className="brand-identity-group" data-onclick="returnToHome()" style={{"cursor": "pointer"}} title="Return to Main Home">
            <img alt="Future Initiative Logo" id="brand-logo" className="app-nav-logo" src="https://drive.google.com/thumbnail?id=1EnAqEURi1XIRNdNTooFGY_pvs38ZcBEQ&amp;sz=w500" />
            <div className="app-brand-text">
              <h2>
                Train With FIFS
              </h2>
              <p id="portal-user-tag">
                Public Training Portal
              </p>
            </div>
          </div>
          <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
            <button aria-label="Go back to previous view" className="site-header-nav-btn btn-nav-back" id="btnNavBack" data-onclick="navigateBack()" onClick={() => { if (typeof window !== "undefined" && (window as any).navigateBack) (window as any).navigateBack(); }} style={{"background": "linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)", "border": "2px solid #38bdf8", "color": "#38bdf8", "fontWeight": 800, "fontSize": "0.88rem", "letterSpacing": "1px", "boxShadow": "0 0 16px rgba(56, 189, 248, 0.35)", "minHeight": "44px", "padding": "8px 16px", "borderRadius": "8px", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "gap": "6px"}} type="button">
              ← BACK
            </button>
            <button type="button" aria-label="Refresh and sync application data" className="site-header-nav-btn btn-nav-refresh btn-universal-refresh" id="topNavRefreshBtn" data-onclick="window.triggerTopNavGunReload(event)" onClick={(e) => { if (typeof window !== "undefined" && (window as any).triggerTopNavGunReload) (window as any).triggerTopNavGunReload(e); }} style={{"background": "linear-gradient(135deg, #00e5ff 0%, #00b4d8 100%)", "border": "2px solid #ffffff", "color": "#030a14", "fontWeight": 900, "fontSize": "0.90rem", "letterSpacing": "1px", "boxShadow": "0 0 20px rgba(0, 229, 255, 0.75)", "minHeight": "44px", "padding": "8px 18px", "borderRadius": "8px", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
              <span className="refresh-ui-text">
                🔄 REFRESH
              </span>
            </button>
            <button aria-label="Return to landing screen" className="site-header-nav-btn btn-nav-home" id="btnNavHome" data-onclick="returnToHome()" onClick={() => { if (typeof window !== "undefined" && (window as any).returnToHome) (window as any).returnToHome(); }} style={{"background": "linear-gradient(135deg, #ffb703 0%, #fb8500 100%)", "border": "2px solid #ffffff", "color": "#030a14", "fontWeight": 900, "fontSize": "0.90rem", "letterSpacing": "1px", "boxShadow": "0 0 20px rgba(255, 183, 3, 0.75)", "minHeight": "44px", "padding": "8px 18px", "borderRadius": "8px", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "gap": "6px"}} type="button">
              🏠 HOME
            </button>
          </div>
        </header>
        {/* VIEW 1: AUTHENTICATED STUDENT DASHBOARD */}
        <section className="panel hidden" id="view-portal" role="tabpanel">
          {/* PWA Mobile Home Screen Callout Banner */}
          <div className="pwa-install-banner" id="pwaStudentBanner" style={{"background": "linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(16, 22, 31, 0.95) 100%)", "border": "1px solid rgba(0, 229, 255, 0.35)", "borderRadius": "12px", "padding": "14px 18px", "marginBottom": "20px", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "12px"}}>
            <div style={{"display": "flex", "alignItems": "center", "gap": "12px"}}>
              <span style={{"fontSize": "1.6rem", "flexShrink": "0"}}>
                📱
              </span>
              <div>
                <strong style={{"fontFamily": "var(--font-display)", "fontSize": "1.05rem", "color": "#fff", "display": "block", "letterSpacing": "0.5px"}}>
                  Save Train With FIFS to Your Phone
                </strong>
                <p style={{"fontSize": "0.82rem", "color": "#cbd5e1", "marginTop": "2px"}}>
                  Install as a web app for instant, offline access to your readiness checklist, Maryland transport laws, and range guides on class day.
                </p>
              </div>
            </div>
            <div style={{"display": "flex", "alignItems": "center", "gap": "10px"}}>
              <span style={{"fontSize": "0.76rem", "color": "var(--accent-cyan)", "fontWeight": "700", "textTransform": "uppercase"}}>
                iOS: Share ➔ 'Add to Home Screen' • Android: Menu ➔ 'Install App'
              </span>
              <button data-onclick="this.closest('.pwa-install-banner').style.display='none'" style={{"background": "none", "border": "none", "color": "var(--text-muted)", "cursor": "pointer", "fontSize": "1.1rem", "padding": "4px"}} title="Dismiss banner" type="button">
                ✕
              </button>
            </div>
          </div>
          <div id="student-login-box">
            <div className="panel-header">
              <h3>
                Future Initiative Firearm Services Student Sign-In
              </h3>
              <p>
                Sign in with the email address linked to your student account to access your training dossier, preparation checklist, and course resources.
              </p>
            </div>
            <div style={{"background": "#0d121a", "border": "1px solid rgba(0, 229, 255, 0.25)", "borderRadius": "12px", "padding": "22px", "maxWidth": "500px", "margin": "0 auto"}}>
              <div className="form-group">
                <label htmlFor="studentAuthInput">
                  Email Address
                  <span className="req">
                    *
                  </span>
                </label>
                <input id="studentAuthInput" data-onkeydown="if(event.key===&#x27;Enter&#x27;) lookupStudentAccount()" placeholder="e.g., student@example.com" type="text" />
              </div>
              <div className="form-group" style={{"marginTop": "14px"}}>
                <label htmlFor="studentAuthPassword" style={{"color": "var(--accent-cyan)", "fontWeight": "700", "fontSize": "0.85rem", "margin": "0 0 4px 0", "display": "block"}}>
                  Portal Password 
                  <span className="req">
                    *
                  </span>
                </label>
                <input id="studentAuthPassword" data-onkeydown="if(event.key===&#x27;Enter&#x27;) lookupStudentAccount()" placeholder="Enter your portal password" type="password" />
                <div style={{"textAlign": "right", "marginTop": "6px"}}>
                  <button data-onclick="fifsRequestPasswordReset('student', this)" style={{"background": "none", "border": "none", "padding": "0", "color": "var(--text-muted)", "fontSize": "0.78rem", "textDecoration": "underline", "cursor": "pointer"}} type="button">
                    Forgot password?
                  </button>
                </div>
              </div>
              <button className="btn-primary" data-onclick="lookupStudentAccount()" style={{"marginTop": "14px"}} type="button">
                
            Sign In to Portal →
          
              </button>
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginTop": "14px", "fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                <span>
                  Need to book first? 
                  <a href="javascript:void(0)" data-onclick="switchTab('booking')" style={{"color": "var(--accent-cyan)"}}>
                    View Courses
                  </a>
                </span>
              </div>
              <div style={{"marginTop": "22px", "paddingTop": "16px", "borderTop": "1px solid var(--border-subtle)", "textAlign": "center"}}>
                <p style={{"fontSize": "0.86rem", "color": "var(--text-muted)", "marginBottom": "8px"}}>
                  Already certified or looking for your CCW Permit Portal?
                </p>
                <button className="btn-spark" data-onclick="openAndSwitch('fi-portal')" style={{"padding": "10px 18px", "fontSize": "0.88rem", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)", "width": "100%", "justifyContent": "center", "fontWeight": "800", "display": "inline-flex", "alignItems": "center", "gap": "6px"}} type="button">
                  
              🛡️ Looking for Future Initiative Client Portal? Click here →
            
                </button>
              </div>
              <div className="status-msg" id="student-login-status">
              </div>
            </div>
          </div>
          {/* ACTIVE STUDENT DASHBOARD */}
          <div className="hidden" id="student-active-dashboard">
            <div className="student-badge-bar">
              <div className="student-meta-group">
                <h2>
                  Welcome back, 
                  <span id="dash-student-name">
                    Student
                  </span>
                   👋
                </h2>
                <div className="student-meta-chips">
                  <span className="meta-chip" id="dash-student-id">
                    ID: FIFS-4081
                  </span>
                  <span className="meta-chip chip-status" id="dash-student-status">
                    PREPARATION
                  </span>
                  <span className="meta-chip" id="dash-student-course">
                    Maryland CCW & HQL Combo
                  </span>
                  <span className="meta-chip" id="dash-student-date">
                    Date: To Be Scheduled
                  </span>
                </div>
              </div>
              <button className="btn-sign-out" data-onclick="logoutStudent()" type="button">
                
            Sign Out
          
              </button>
              <button className="btn-change-password" data-onclick="openChangePasswordModal('student')" onClick={() => { if (typeof window !== 'undefined' && (window as any).openChangePasswordModal) (window as any).openChangePasswordModal('student'); }} type="button" style={{"marginTop": "8px", "background": "rgba(0, 229, 255, 0.08)", "border": "1px solid rgba(0, 229, 255, 0.4)", "color": "var(--accent-cyan)", "padding": "6px 14px", "borderRadius": "6px", "fontSize": "0.82rem", "fontWeight": "600", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
                🔑 Change Password
              </button>
            </div>
            {/* Priority Action Concierge Hero Card */}
            <div className="next-step-card">
              <div className="next-step-badge">
                🚀 Priority Action Required
              </div>
              <div className="next-step-title" id="dash-next-step-title">
                Complete Your Class Preparation Checklist
              </div>
              <div className="next-step-desc" id="dash-next-step-desc">
                
            Your class session is approaching. Please verify your ammunition count (50–100 rounds factory target ammo), wrap-around eye protection, and Maryland firearm transport compliance prior to arrival at Cindy's Hot Shots for your qualification shoot.
          
              </div>
              <button className="btn-primary" id="dash-next-step-btn" style={{"maxWidth": "320px"}} type="button">
                
            Complete Preparation Checklist ↓
          
              </button>
            </div>
            {/* 8-Step Progress Tracker Roadmap */}
            
            {/* Official Maryland Qualification Scoresheet Card (MSP Form 29-14) */}
            <div className="fi-card" id="dash-scoresheet-card" style={{"marginBottom": "24px", "border": "1px solid rgba(0, 229, 255, 0.28)", "background": "linear-gradient(135deg, rgba(7,11,16,0.95), rgba(15,23,42,0.85))", "borderRadius": "12px", "padding": "20px"}}>
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "12px", "flexWrap": "wrap", "gap": "8px"}}>
                <div>
                  <span className="meta-chip" style={{"background": "rgba(0, 229, 255, 0.15)", "color": "var(--accent-cyan)", "border": "1px solid var(--accent-cyan)", "fontSize": "0.74rem", "fontWeight": "800", "letterSpacing": "0.8px"}}>
                    OFFICIAL STATE RECORD • MSP FORM 29-14
                  </span>
                  <h3 style={{"fontFamily": "var(--font-display)", "color": "#fff", "fontSize": "1.25rem", "margin": "6px 0 2px"}}>
                    Maryland Certified Qualification Scoresheet
                  </h3>
                </div>
                <div id="dash-scoresheet-badge-box">
                  <span id="dash-scoresheet-score-badge" style={{"display": "none", "fontSize": "0.85rem", "fontWeight": "800", "padding": "4px 12px", "borderRadius": "20px", "background": "rgba(16, 185, 129, 0.2)", "color": "#10b981", "border": "1px solid #10b981"}}>
                    Score: Not yet recorded
                  </span>
                </div>
              </div>








              <div id="dash-scoresheet-body">
                {/* Pending notice placeholder */}
                <div id="dash-scoresheet-pending" style={{"padding": "16px", "background": "rgba(245, 158, 11, 0.08)", "border": "1px dashed rgba(245, 158, 11, 0.4)", "borderRadius": "8px", "textAlign": "center"}}>
                  <p style={{"color": "var(--accent-amber)", "fontSize": "0.92rem", "fontWeight": "600", "margin": 0}}>
                    Scoresheet pending instructor upload.
                  </p>
                  <p style={{"color": "#94a3b8", "fontSize": "0.80rem", "marginTop": "6px", "marginBottom": 0}}>
                    Instructor Kai Wade will upload your certified Maryland State Police Live-Fire Qualification Score Sheet upon course completion.
                  </p>
                </div>








                {/* Live Scoresheet Card Content when available */}
                <div id="dash-scoresheet-active" style={{"display": "none", "padding": "14px", "background": "rgba(0, 229, 255, 0.04)", "border": "1px solid var(--border-subtle)", "borderRadius": "8px"}}>
                  <p style={{"color": "#cbd5e1", "fontSize": "0.86rem", "marginBottom": "14px"}}>
                    Your Maryland State Police Form 29-14 Certified Qualification Score Sheet has been verified and registered by Instructor Kai Wade.
                  </p>
                  <div style={{"display": "flex", "gap": "12px", "flexWrap": "wrap", "alignItems": "center"}}>
                    <a id="dash-scoresheet-fullscreen-btn" href="#" target="_blank" rel="noopener noreferrer" style={{"background": "var(--accent-cyan)", "color": "#070b10", "padding": "8px 16px", "borderRadius": "6px", "fontWeight": "700", "fontSize": "0.85rem", "textDecoration": "none", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
                      <span>👁️</span> <span>View Fullscreen</span>
                    </a>
                    <a id="dash-scoresheet-download-btn" href="#" download="MSP-Form-29-14-Qualification-Scoresheet.pdf" target="_blank" rel="noopener noreferrer" style={{"background": "transparent", "border": "1px solid var(--accent-cyan)", "color": "var(--accent-cyan)", "padding": "8px 16px", "borderRadius": "6px", "fontWeight": "700", "fontSize": "0.85rem", "textDecoration": "none", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
                      <span>📥</span> <span>Download Official PDF / Copy</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
<div className="progress-track-wrapper">
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center"}}>
                <div>
                  <h4 style={{"fontFamily": "var(--font-display)", "color": "#fff", "fontSize": "1.1rem", "marginBottom": "2px"}}>
                    Your 8-Step FIFS Journey <span className="neon-arrow-badge neon-mode-cyan" style={{"display": "inline-flex", "alignItems": "center", "gap": "6px", "padding": "3px 12px", "fontSize": "0.74rem", "fontWeight": "800", "letterSpacing": "1px", "textTransform": "uppercase", "verticalAlign": "middle", "marginLeft": "8px", "borderRadius": "50px", "background": "rgba(0, 229, 255, 0.14)", "border": "1px solid var(--accent-cyan)", "color": "#00e5ff", "boxShadow": "0 0 16px rgba(0, 229, 255, 0.4), inset 0 0 8px rgba(0, 229, 255, 0.2)", "cursor": "pointer"}} data-onclick="openStepDetailModal(1)" title="Click to explore the interactive 8-step journey"><span style={{"width": "6px", "height": "6px", "borderRadius": "50%", "background": "#00e5ff", "boxShadow": "0 0 8px #00e5ff"}}></span>Interactive</span>
                  </h4>
                  <span style={{"fontSize": "0.72rem", "color": "var(--accent-amber)", "fontWeight": "700", "letterSpacing": "0.5px", "textTransform": "uppercase"}}>
                    🔒 Status Locked • Managed by Instructor Kai Wade
                  </span>
                </div>
                <span id="dash-progress-label" style={{"fontSize": "0.82rem", "color": "var(--accent-cyan)", "fontWeight": "700"}}>
                  Step 3 of 8 (Preparation)
                </span>
              </div>
              <div className="progress-steps-row">
                <div className="track-step-node completed" id="track-step-1" data-onclick="openStepDetailModal(1)" style={{"cursor": "pointer"}} title="Click to view deep step 1 breakdown">
                  1. Registration ✔
                </div>
                <div className="track-step-node completed" id="track-step-2" data-onclick="openStepDetailModal(2)" style={{"cursor": "pointer"}} title="Click to view deep step 2 breakdown">
                  2. Confirmation ✔
                </div>
                <div className="track-step-node active" id="track-step-3" data-onclick="openStepDetailModal(3)" style={{"cursor": "pointer"}} title="Click to view deep step 3 breakdown">
                  3. Preparation ⚡
                </div>
                <div className="track-step-node" id="track-step-4" data-onclick="openStepDetailModal(4)" style={{"cursor": "pointer"}} title="Click to view deep step 4 breakdown">
                  4. Classroom
                </div>
                <div className="track-step-node" id="track-step-5" data-onclick="openStepDetailModal(5)" style={{"cursor": "pointer"}} title="Click to view deep step 5 breakdown">
                  5. Live-Fire
                </div>
                <div className="track-step-node" id="track-step-6" data-onclick="openStepDetailModal(6)" style={{"cursor": "pointer"}} title="Click to view deep step 6 breakdown">
                  6. Certificate
                </div>
                <div className="track-step-node" id="track-step-7" data-onclick="openStepDetailModal(7)" style={{"cursor": "pointer"}} title="Click to view deep step 7 breakdown">
                  7. MSP Portal
                </div>
                <div className="track-step-node" id="track-step-8" data-onclick="openStepDetailModal(8)" style={{"cursor": "pointer"}} title="Click to view deep step 8 breakdown">
                  8. Licensed
                </div>
              </div>
            </div>
            {/* Interactive Pre-Class Checklist */}
            <div style={{"marginBottom": "26px"}}>
              <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.25rem", "color": "#fff", "marginBottom": "6px"}}>
                Pre-Class Readiness Tasks
              </h4>
              <p style={{"fontSize": "0.84rem", "color": "var(--text-muted)", "marginBottom": "12px"}}>
                Toggle these items as you prepare. They sync immediately with Instructor Kai Wade's master roster.
              </p>
              <div className="interactive-checklist">
                <div className="task-item-card" id="task-card-transport" data-onclick="toggleTaskCheckbox('transport_law')">
                  <input className="task-checkbox" id="chk-transport_law" data-onclick="event.stopPropagation(); syncTask('transport_law', this.checked)" type="checkbox" />
                  <div>
                    <strong style={{"color": "#fff", "fontFamily": "var(--font-display)", "fontSize": "1.05rem", "display": "block"}}>
                      Maryland Transport Compliance Confirmed
                    </strong>
                    <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "marginTop": "2px"}}>
                      Firearm must be unloaded and enclosed in a locked case or trunk during transit to Cindy's Hot Shots for qualification shots.
                    </p>
                  </div>
                </div>
                <div className="task-item-card" id="task-card-ammo" data-onclick="toggleTaskCheckbox('ammo_acquired')">
                  <input className="task-checkbox" id="chk-ammo_acquired" data-onclick="event.stopPropagation(); syncTask('ammo_acquired', this.checked)" type="checkbox" />
                  <div>
                    <strong style={{"color": "#fff", "fontFamily": "var(--font-display)", "fontSize": "1.05rem", "display": "block"}}>
                      Factory Target Ammunition Acquired (50–100 Rounds)
                    </strong>
                    <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "marginTop": "2px"}}>
                      Standard brass-cased factory ammo. Strictly NO live ammo permitted inside classroom—leave locked in vehicle trunk until live-fire.
                    </p>
                  </div>
                </div>
                <div className="task-item-card" id="task-card-eye" data-onclick="toggleTaskCheckbox('eye_ear_pro')">
                  <input className="task-checkbox" id="chk-eye_ear_pro" data-onclick="event.stopPropagation(); syncTask('eye_ear_pro', this.checked)" type="checkbox" />
                  <div>
                    <strong style={{"color": "#fff", "fontFamily": "var(--font-display)", "fontSize": "1.05rem", "display": "block"}}>
                      Wrap-Around Eye & Hearing Protection Ready
                    </strong>
                    <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "marginTop": "2px"}}>
                      ANSI Z87.1 wrap-around glasses and muff/plug protection. (Can be rented on-site at Cindy's Hot Shots if needed).
                    </p>
                  </div>
                </div>
                <div className="task-item-card" id="task-card-id" data-onclick="toggleTaskCheckbox('id_ready')">
                  <input className="task-checkbox" id="chk-id_ready" data-onclick="event.stopPropagation(); syncTask('id_ready', this.checked)" type="checkbox" />
                  <div>
                    <strong style={{"color": "#fff", "fontFamily": "var(--font-display)", "fontSize": "1.05rem", "display": "block"}}>
                      Government Photo Identification Ready
                    </strong>
                    <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "marginTop": "2px"}}>
                      Valid Driver's License or Military ID required for state compliance documentation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* ================= OFFICIAL MARYLAND QUALIFICATION SCORE SHEET ================= */}
            <div className="portal-score-sheet-card" style={{"background": "#0d121a", "border": "1px solid rgba(0, 229, 255, 0.3)", "borderRadius": "14px", "padding": "20px", "marginBottom": "24px"}}>
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "14px"}}>
                <div>
                  <span style={{"fontFamily": "var(--font-display)", "fontSize": "0.78rem", "fontWeight": "800", "color": "var(--accent-cyan)", "letterSpacing": "1px", "textTransform": "uppercase"}}>
                    Official State Police Form
                  </span>
                  <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "marginTop": "2px"}}>
                    🎯 Maryland State Police Qualification Score Sheet (MSP Form 29-14)
                  </h3>
                  <p style={{"fontSize": "0.86rem", "color": "#cbd5e1", "marginTop": "4px", "maxWidth": "650px"}}>
                    
                Review the exact state qualification scorecard used on the firing line at Cindy's Hot Shots. Details the 25-round course of fire (3, 5, 7, and 15 yards), scoring criteria, and instructor certification.
              
                  </p>
                </div>
                <button type="button" className="btn-spark" data-onclick="openOfficialMspScoreSheet()" style={{"width": "auto", "padding": "10px 20px", "fontSize": "0.90rem", "display": "inline-flex", "alignItems": "center", "gap": "6px", "cursor": "pointer"}}>
                  <span>
                    📄 View / Download Official Score Sheet (PDF) ↗
                  </span>
                </button>
              </div>
            </div>
            {/* Student Documents & Resources */}
            {/* ================= OFFICIAL STUDENT RECORDS & STATE LICENSING DOCK ================= */}
            <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(320px, 1fr))", "gap": "16px", "marginBottom": "24px"}}>
              {/* Card 1: My Student Training Dossier */}
              <div className="portal-feature-launcher-card" style={{"border": "2px solid var(--accent-cyan)", "background": "linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "borderRadius": "14px", "padding": "22px 20px", "boxShadow": "0 0 20px rgba(0, 229, 255, 0.15)", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                <div>
                  <span className="next-step-badge" style={{"color": "var(--accent-cyan)", "marginBottom": "4px", "display": "block", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase"}}>
                    SECURE STUDENT PROFILE
                  </span>
                  <h3 className="portal-feature-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.4rem", "color": "#fff", "marginBottom": "6px"}}>
                    📄 Personal Student Training Dossier
                  </h3>
                  <p style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.5", "marginBottom": "16px"}}>
                    
                Access your live synchronized Google Drive training profile, class attendance verification, instructor diagnostic notes, and certified range score log maintained by Coach Kai Wade.
              
                  </p>
                </div>
                <div>
                  <a className="btn-primary" href="#" id="dash-doc-link" rel="noopener noreferrer" style={{"textDecoration": "none", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "width": "100%", "padding": "12px 18px", "fontSize": "0.95rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px", "boxShadow": "0 0 16px var(--accent-cyan-glow)"}} target="_blank">
                    
                Open Student Dossier (Supabase Document) ↗
              
                  </a>
                </div>
              </div>
              {/* Card 2: Maryland State Police MyLicense Portal */}
              <div className="portal-feature-launcher-card" style={{"border": "2px solid var(--accent-amber)", "background": "linear-gradient(135deg, rgba(255, 183, 3, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "borderRadius": "14px", "padding": "22px 20px", "boxShadow": "0 0 20px rgba(255, 183, 3, 0.15)", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                <div>
                  <span className="next-step-badge" style={{"color": "var(--accent-amber)", "marginBottom": "4px", "display": "block", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase"}}>
                    OFFICIAL STATE LICENSING
                  </span>
                  <h3 className="portal-feature-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.4rem", "color": "#fff", "marginBottom": "6px"}}>
                    🌐 MSP MyLicense Official Portal
                  </h3>
                  <p style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.5", "marginBottom": "16px"}}>
                    
                Official state portal to submit your formal Wear & Carry (CCW) or Handgun Qualification License (HQL) application, upload your signed MSP Form 29-14, and track live investigator status.
              
                  </p>
                </div>
                <div>
                  <a className="btn-spark" href="https://licensingportal.mdsp.maryland.gov/MspBridgeClient/" rel="noopener noreferrer" style={{"textDecoration": "none", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "width": "100%", "padding": "12px 18px", "fontSize": "0.95rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)", "boxShadow": "0 0 16px rgba(255, 183, 3, 0.2)"}} target="_blank">
                    
                Launch Maryland MyLicense Portal ↗
              
                  </a>
                </div>
              </div>
              {/* Card 3: Official MSP Wear & Carry Portal User's Guide (MSP Media 474) */}
              {/* DIGITIZED 2022 FIFS WAIVER & LIABILITY AGREEMENT CARD */}
              <div id="portalWaiverCard" className="portal-feature-launcher-card waiver-card-pending-blink" style={{"background": "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "borderRadius": "14px", "padding": "22px 20px", "display": "flex", "flexDirection": "column", "justifyContent": "space-between", "transition": "all 0.3s ease"}}>
                <div>
                  <span id="waiverStatusBadge" className="next-step-badge" style={{"color": "#ef4444", "marginBottom": "4px", "display": "block", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase"}}>
                    ⚠️ MANDATORY PREREQUISITE — ACTION REQUIRED
                  </span>
                  <h3 className="portal-feature-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.4rem", "color": "#fff", "marginBottom": "6px"}}>
                    📋 Digital Safety & Liability Waiver
                  </h3>
                  <p style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.5", "marginBottom": "16px"}}>
                    
              Future Initiative Firearm Services Complete and Final Safety Waiver & Assumption of Risk. Complete your digital agreement, emergency contact, and firearm eligibility certification online before live-fire range arrival.
            
                  </p>
                </div>
                <div>
                  <button type="button" data-onclick="openFifsWaiverModal()" className="btn-spark" style={{"width": "100%", "padding": "12px 18px", "fontSize": "0.95rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px", "borderColor": "#00e5ff", "color": "#00e5ff", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "gap": "8px"}}>
                    <span>
                      ✍️
                    </span>
                    <span>
                      Complete Digital Waiver →
                    </span>
                  </button>
                </div>
              </div>
              <div className="portal-feature-launcher-card" style={{"border": "2px solid #38bdf8", "background": "linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "borderRadius": "14px", "padding": "22px 20px", "boxShadow": "0 0 20px rgba(56, 189, 248, 0.15)", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                <div>
                  <span className="next-step-badge" style={{"color": "#38bdf8", "marginBottom": "4px", "display": "block", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase"}}>
                    OFFICIAL MSP APPLICATION MANUAL
                  </span>
                  <h3 className="portal-feature-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.4rem", "color": "#fff", "marginBottom": "6px"}}>
                    📄 MSP Wear &amp; Carry Portal User Guide
                  </h3>
                  <p style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.5", "marginBottom": "16px"}}>
                    Official 20-page Maryland State Police visual guide (MSP Media 474). Step-by-step instructions on creating your state account, uploading your certified Form 29-14 score sheet, and completing background check questionnaires without delays.
                  </p>
                </div>
                <div>
                  <a href="https://mdsp.maryland.gov/media/474" target="_blank" rel="noopener noreferrer" className="btn-spark" style={{"textDecoration": "none", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "width": "100%", "padding": "12px 18px", "fontSize": "0.95rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px", "borderColor": "#38bdf8", "color": "#38bdf8", "boxShadow": "0 0 16px rgba(56, 189, 248, 0.2)"}}>
                    📄 View Official MSP Portal Guide (PDF) ↗
                  </a>
                </div>
              </div>




              {/* Card 5: Multi-State CCW Reciprocity Navigator & Travel Hub (Half Width) */}
              <div className="portal-feature-launcher-card" style={{"border": "2px solid var(--accent-cyan)", "background": "linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "borderRadius": "14px", "padding": "22px 20px", "boxShadow": "0 0 20px rgba(0, 229, 255, 0.15)", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                <div>
                  <span className="next-step-badge" style={{"color": "var(--accent-cyan)", "marginBottom": "4px", "display": "block", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase"}}>
                    STUDENT PORTAL EXCLUSIVE TOOL
                  </span>
                  <h3 className="portal-feature-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.4rem", "color": "#fff", "marginBottom": "6px"}}>
                    🗺️ Multi-State CCW Reciprocity Navigator &amp; Travel Hub
                  </h3>
                  <p style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.5", "marginBottom": "16px"}}>
                    Interactive 50-state recognition map. See where you can carry with your Maryland permit, test Utah/Florida non-resident add-ons, plan interstate car travel corridors, and review mandatory TSA flying rules.
                  </p>
                </div>
                <div>
                  <button className="btn-primary" data-onclick="toggleReciprocityHubModal(true)" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleReciprocityHubModal) (window as any).toggleReciprocityHubModal(true); }} style={{"width": "100%", "padding": "12px 18px", "fontSize": "0.95rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px", "boxShadow": "0 0 16px var(--accent-cyan-glow)", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "gap": "8px"}} type="button">
                    <span>🗺️</span>
                    <span>LAUNCH RECIPROCITY NAVIGATOR ↗</span>
                  </button>
                </div>
              </div>




              {/* Card 6: 34+ State Multi-Permit Expansion System Field Guide */}
              <div className="portal-feature-launcher-card" onClick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON' && typeof window !== 'undefined' && (window as any).toggleMultiPermitModal) (window as any).toggleMultiPermitModal(true); }} style={{"border": "2px solid #F59E0B", "background": "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "borderRadius": "14px", "padding": "22px 20px", "boxShadow": "0 0 20px rgba(245, 158, 11, 0.15)", "display": "flex", "flexDirection": "column", "justifyContent": "space-between", "cursor": "pointer"}}>
                <div>
                  <span className="next-step-badge" style={{"color": "#F59E0B", "marginBottom": "4px", "display": "block", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase"}}>
                    TACTICAL COMPLIANCE FIELD GUIDE
                  </span>
                  <h3 className="portal-feature-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.4rem", "color": "#fff", "marginBottom": "6px"}}>
                    ⭐ 34+ State Multi-Permit Expansion System
                  </h3>
                  <p style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.5", "marginBottom": "16px"}}>
                    Authorized FIFS SOP &amp; Field Guide by Lead Coach Kai Wade. Master the chronological multi-state dispatch sequence (MD resident anchor, parallel VA/FL/AZ packets, and rapid 5-minute PA border pickup), avoid clerical rejections, and unlock your $0 free MD HQL exemption.
                  </p>
                </div>
                <div>
                  <button type="button" data-onclick="toggleMultiPermitModal(true)" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleMultiPermitModal) (window as any).toggleMultiPermitModal(true); }} className="btn-spark" style={{"width": "100%", "padding": "12px 18px", "fontSize": "0.95rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px", "borderColor": "#F59E0B", "color": "#F59E0B", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "gap": "8px", "boxShadow": "0 0 16px rgba(245, 158, 11, 0.2)"}}>
                    <span>⭐</span>
                    <span>OPEN 34+ STATE FIELD GUIDE ↗</span>
                  </button>
                </div>
              </div>
            </div>
            {/* ================= DYNAMIC COURSE FOLLOW-ALONG PACKET CARD ================= */}
            <div id="student-course-packet-card" style={{"background": "#0d121a", "border": "1px solid rgba(0, 229, 255, 0.3)", "borderRadius": "14px", "padding": "20px", "marginBottom": "24px"}}>
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "14px"}}>
                <div>
                  <span style={{"fontFamily": "var(--font-display)", "fontSize": "0.78rem", "fontWeight": "800", "color": "var(--accent-cyan)", "letterSpacing": "1px", "textTransform": "uppercase"}}>
                    Your Official Course Guide
                  </span>
                  <h3 id="packetCardTitle" style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "marginTop": "2px"}}>
                    📘 Student Follow-Along Packet (Phone Edition)
                  </h3>
                  <p id="packetCardDesc" style={{"fontSize": "0.86rem", "color": "#cbd5e1", "marginTop": "4px"}}>
                    
                Comprehensive companion manual matching your enrolled curriculum. Review legal standards, safety rules, and range qualification metrics directly on your phone.
              
                  </p>
                </div>
                <a className="btn-primary" href="#" id="packetCardLink" rel="noopener noreferrer" style={{"width": "auto", "padding": "10px 22px", "fontSize": "0.92rem", "textDecoration": "none", "display": "inline-flex", "alignItems": "center", "gap": "6px"}} target="_blank">
                  
              Open Course Guide (PDF) ↗
            
                </a>
              </div>
            </div>
            {/* State Dossier Details Modal */}
            <div className="state-dossier-modal-overlay" id="stateDossierModal" data-onclick="if(event.target===this) closeStateDossier()" style={{"display": "none"}}>
              <div aria-labelledby="dossierStateTitle" aria-modal="true" className="state-dossier-card" data-onclick="event.stopPropagation()" role="dialog">
                <button aria-label="Close dossier" className="dossier-close-btn" data-onclick="closeStateDossier()" type="button">
                  ✕
                </button>
                <div className="dossier-header-row">
                  <div className="dossier-state-code" id="dossierStateCode">
                    MD
                  </div>
                  <div>
                    <div className="dossier-state-title" id="dossierStateTitle">
                      Maryland
                    </div>
                    <div className="dossier-status-pill" id="dossierStatusPill">
                      Permit Required
                    </div>
                  </div>
                </div>
                <div className="dossier-section">
                  <div className="dossier-prop-title">
                    Permit Recognition & Authority:
                  </div>
                  <div className="dossier-prop-val" id="dossierRecognitionVal">
                    Details here...
                  </div>
                </div>
                <div className="dossier-section">
                  <div className="dossier-prop-title">
                    Duty to Inform Law Enforcement:
                  </div>
                  <div className="dossier-prop-val" id="dossierDutyVal">
                    Details here...
                  </div>
                </div>
                <div className="dossier-section">
                  <div className="dossier-prop-title">
                    Magazine Capacity Restrictions:
                  </div>
                  <div className="dossier-prop-val" id="dossierMagVal">
                    Details here...
                  </div>
                </div>
                <div className="dossier-section">
                  <div className="dossier-prop-title">
                    Vehicle Carry Regulations:
                  </div>
                  <div className="dossier-prop-val" id="dossierVehicleVal">
                    Details here...
                  </div>
                </div>
                <div className="dossier-section">
                  <div className="dossier-prop-title">
                    General Location & Compliance Notes:
                  </div>
                  <div className="dossier-prop-val" id="dossierNotesVal">
                    Details here...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ================= FUTURE INITIATIVE CLIENT & PERMIT PORTAL ================= */}
        <section className="panel hidden" id="view-fi-portal" style={{"display": "none"}}>
          <div className="fi-portal-container">
            {/* ================= CLIENT PORTAL AUTHENTICATION HUB ================= */}
            <div id="client-auth-box" style={{"marginBottom": "30px"}}>
              <div className="panel-header" style={{"textAlign": "center", "borderLeft": "none", "marginBottom": "24px"}}>
                <span className="fi-badge fi-badge-amber">
                  Future Initiative Firearm Services
                </span>
                <h2 style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "color": "#fff", "textTransform": "uppercase", "letterSpacing": "1.5px", "margin": "4px 0 8px"}}>
                  
              Permit Holder & Client Portal
            
                </h2>
                <p style={{"color": "var(--text-muted)", "fontSize": "0.94rem", "maxWidth": "680px", "margin": "0 auto", "lineHeight": "1.5"}}>
                  
              Sign in to manage your permit expiration dates, access your multi-state carry matrix, and receive automatic 90-day renewal countdown notifications with an exclusive 10% FIFS training discount.
            
                </p>
              </div>
              <div style={{"maxWidth": "580px", "margin": "0 auto", "background": "#0d121a", "border": "1px solid rgba(0, 229, 255, 0.35)", "borderRadius": "16px", "padding": "24px", "boxShadow": "0 12px 35px rgba(0,0,0,0.8), 0 0 20px rgba(0,229,255,0.15)"}}>
                {/* Toggle Tabs: Sign In vs Create Profile */}
                <div style={{"display": "flex", "gap": "8px", "marginBottom": "22px", "background": "#070b10", "padding": "4px", "borderRadius": "10px", "border": "1px solid var(--border-subtle)"}}>
                  <button className="fi-subnav-btn active" id="tab-client-signin" data-onclick="switchClientAuthTab('signin')" style={{"flex": "1", "justifyContent": "center", "borderRadius": "8px", "padding": "10px"}} type="button">
                    
                🔑 Sign In
              
                  </button>
                  <button className="fi-subnav-btn" id="tab-client-register" data-onclick="switchClientAuthTab('register')" style={{"flex": "1", "justifyContent": "center", "borderRadius": "8px", "padding": "10px"}} type="button">
                    
                🛡️ Create Free Profile
              
                  </button>
                </div>
                {/* PANEL 1: CLIENT SIGN IN */}
                <div id="panel-client-signin">
                  <div className="form-group">
                    <label htmlFor="clientAuthInput" style={{"color": "var(--accent-cyan)", "fontWeight": "700", "fontSize": "0.85rem"}}>
                      Email Address
                      <span className="req">
                        *
                      </span>
                    </label>
                    <input id="clientAuthInput" data-onkeydown="if(event.key===&#x27;Enter&#x27;) lookupClientAccount()" placeholder="e.g., client@example.com" type="email" />
                  </div>
                  <div className="form-group" style={{"marginTop": "14px"}}>
                    <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "4px"}}>
                      <label htmlFor="clientAuthPassword" style={{"color": "var(--accent-cyan)", "fontWeight": "700", "fontSize": "0.85rem", "margin": "0"}}>
                        Portal Password 
                        <span className="req">
                          *
                        </span>
                      </label>
                      <button data-onclick="fifsRequestPasswordReset('client', this)" style={{"background": "none", "border": "none", "padding": "0", "color": "var(--text-muted)", "fontSize": "0.78rem", "textDecoration": "underline", "cursor": "pointer"}} type="button">
                        Forgot password?
                      </button>
                    </div>
                    <input id="clientAuthPassword" data-onkeydown="if(event.key===&#x27;Enter&#x27;) lookupClientAccount()" placeholder="Enter your portal password" type="password" />
                  </div>
                  <button className="btn-primary" data-onclick="lookupClientAccount()" style={{"marginTop": "12px"}} type="button">
                    
                Sign In to Client Portal →
              
                  </button>
                  <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginTop": "14px", "fontSize": "0.82rem"}}>
                    <span>
                      First time here? 
                      <a href="javascript:void(0)" data-onclick="switchClientAuthTab('register')" style={{"color": "var(--accent-cyan)"}}>
                        Create Profile
                      </a>
                    </span>
                  </div>
                  <div className="status-msg" id="client-login-status">
                  </div>
                </div>
                {/* PANEL 2: CREATE FREE CLIENT PROFILE */}
                <div id="panel-client-register" style={{"display": "none"}}>
                  <form id="fiClientRegistrationForm" data-onsubmit="handleClientRegisterSubmit(event); return false;">
                    <div className="form-group">
                      <label htmlFor="regClientName">
                        Full Legal Name 
                        <span className="req">
                          *
                        </span>
                      </label>
                      <input id="regClientName" placeholder="e.g., Marcus Vance" required type="text" />
                    </div>
                    <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px"}}>
                      <div className="form-group">
                        <label htmlFor="regClientEmail">
                          Email Address 
                          <span className="req">
                            *
                          </span>
                        </label>
                        <input id="regClientEmail" placeholder="marcus@example.com" required type="email" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="regClientPhone">
                          Phone Number 
                          <span className="req">
                            *
                          </span>
                        </label>
                        <input id="regClientPhone" placeholder="(410) 555-0192" required type="tel" />
                      </div>
                    </div>
                    <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px"}}>
                      <div className="form-group">
                        <label htmlFor="regClientPermitState">
                          Handgun Permit Type 
                          <span className="req">
                            *
                          </span>
                        </label>
                        <select
  defaultValue={"Maryland Wear & Carry"} id="regClientPermitState" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}}>
                          <option value="Maryland Wear &amp; Carry">
                            Maryland Wear & Carry (CCW)
                          </option>
                          <option value="Virginia Concealed Handgun">
                            Virginia Concealed Handgun
                          </option>
                          <option value="Pennsylvania LTCF">
                            Pennsylvania LTCF
                          </option>
                          <option value="Florida Non-Resident">
                            Florida Non-Resident CWL
                          </option>
                          <option value="Utah Non-Resident">
                            Utah Non-Resident CFP
                          </option>
                          <option value="Multi-State (MD+UT/FL)">
                            Multi-State (MD + UT/FL/VA)
                          </option>
                          <option value="Other Jurisdiction">
                            Other State Permit
                          </option>
                          <option value="None / Planning to Apply">
                            None / Planning to Apply
                          </option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="regClientExpDate">
                          Permit Expiration Date
                        </label>
                        <input id="regClientExpDate" placeholder="YYYY-MM-DD" type="date" />
                        <span style={{"fontSize": "0.72rem", "color": "var(--text-muted)", "display": "block", "marginTop": "2px"}}>
                          Leave blank if planning to apply
                        </span>
                      </div>
                    </div>
                    <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginTop": "12px"}}>
                      <div className="form-group">
                        <label htmlFor="regClientPassword">
                          Create Password <span className="req">*</span>
                        </label>
                        <input id="regClientPassword" placeholder="12+ chars, upper/lower, number & symbol" required type="password" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="regClientPasswordConfirm">
                          Confirm Password <span className="req">*</span>
                        </label>
                        <input id="regClientPasswordConfirm" placeholder="Re-enter password" required type="password" />
                      </div>
                    </div>
                    <div className="form-group" style={{"margin": "14px 0 18px"}}>
                      <label style={{"display": "flex", "alignItems": "flex-start", "gap": "10px", "cursor": "pointer"}}>
                        <input defaultChecked={true} id="regClientOptIn" style={{"width": "18px", "height": "18px", "accentColor": "var(--accent-cyan)", "marginTop": "2px"}} type="checkbox" />
                        <span style={{"fontSize": "0.82rem", "color": "#cbd5e1", "lineHeight": "1.45"}}>
                          
                      Activate 
                          <strong>
                            90-Day Renewal Countdown Watch
                          </strong>
                          : Notify me when my renewal window opens and automatically apply my 10% Future Initiative discount code.
                    
                        </span>
                      </label>
                    </div>
                    <button className="btn-primary" id="btn-client-register-submit" data-onclick="handleClientRegisterSubmit(event)" style={{"width": "100%", "padding": "14px", "fontSize": "1rem", "fontWeight": "800", "cursor": "pointer", "pointerEvents": "auto", "touchAction": "manipulation", "position": "relative", "zIndex": "20"}} type="button">
                      
                  Create Profile & Activate Renewal Watch 🛡️
                
                    </button>
                    <div className="status-msg" id="client-register-status">
                    </div>
                  </form>
                </div>
                {/* Portal Cross-Link: Switch to Student Portal (ALWAYS VISIBLE) */}
                <div style={{"marginTop": "24px", "paddingTop": "18px", "borderTop": "1px solid var(--border-subtle)", "textAlign": "center"}}>
                  <p style={{"fontSize": "0.86rem", "color": "var(--text-muted)", "marginBottom": "8px"}}>
                    Enrolled in an upcoming class with Future Initiative Firearm Services?
                  </p>
                  <button className="btn-spark" data-onclick="openAndSwitch('portal')" style={{"padding": "10px 18px", "fontSize": "0.88rem", "borderColor": "var(--accent-cyan)", "color": "var(--accent-cyan)", "width": "100%", "justifyContent": "center", "fontWeight": "800", "display": "inline-flex", "alignItems": "center", "gap": "6px"}} type="button">
                    
                🎓 Looking for the Student Portal? Click here →
              
                  </button>
                </div>
              </div>
            </div>
            {/* ================= CLIENT ACTIVE DASHBOARD (HIDDEN UNTIL LOGIN) ================= */}
            <div id="client-active-dashboard" style={{"display": "none"}}>
              <div className="student-badge-bar" style={{"borderColor": "rgba(255, 183, 3, 0.4)", "marginBottom": "24px"}}>
                <div>
                  <h2>
                    Welcome back, 
                    <span id="dash-client-name" style={{"color": "#fff"}}>
                      Client
                    </span>
                     👋
                  </h2>
                  <div className="student-meta-chips" style={{"marginTop": "6px"}}>
                    <span className="meta-chip" id="dash-client-id" style={{"color": "var(--accent-amber)", "borderColor": "var(--accent-amber)"}}>
                      ID: FI-CLIENT-1042
                    </span>
                    <span className="meta-chip" id="dash-client-permit">
                      Maryland Wear & Carry
                    </span>
                    <span className="meta-chip chip-status" id="dash-client-exp-badge">
                      Expiration: Oct 15, 2026
                    </span>
                  </div>
                </div>
                <button className="btn-sign-out" data-onclick="fiLogoutClient()" type="button">
                  
              Sign Out
            
                </button>
                <button className="btn-change-password" data-onclick="openChangePasswordModal('client')" onClick={() => { if (typeof window !== 'undefined' && (window as any).openChangePasswordModal) (window as any).openChangePasswordModal('client'); }} type="button" style={{"marginTop": "8px", "background": "rgba(245, 158, 11, 0.08)", "border": "1px solid rgba(245, 158, 11, 0.4)", "color": "var(--accent-amber)", "padding": "6px 14px", "borderRadius": "6px", "fontSize": "0.82rem", "fontWeight": "600", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
                  🔑 Change Password
                </button>
              </div>
              {/* CLIENT PORTAL STICKY SUBNAV */}
              <nav aria-label="Client Portal Navigation" className="fi-portal-subnav">
                <a className="fi-subnav-btn active" href="#fi-sec-dashboard">
                  📊 Dashboard
                </a>
                <button className="fi-subnav-btn" data-onclick="toggleReciprocityHubModal(true)" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleReciprocityHubModal) (window as any).toggleReciprocityHubModal(true); }} type="button">
                  🗺️ 50-State Reciprocity Hub
                </button>
                <button className="fi-subnav-btn" data-onclick="toggleMultiPermitModal(true)" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleMultiPermitModal) (window as any).toggleMultiPermitModal(true); }} type="button" style={{"borderColor": "rgba(245, 158, 11, 0.45)", "color": "#F59E0B"}}>
                  ⭐ 34+ State System
                </button>
                <button className="fi-subnav-btn" data-onclick="openVehicleTravelModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).openVehicleTravelModal) (window as any).openVehicleTravelModal(); }} type="button">
                  🚗 Vehicle Travel
                </button>
                <button className="fi-subnav-btn" data-onclick="openFlyingWithFirearmModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).openFlyingWithFirearmModal) (window as any).openFlyingWithFirearmModal(); }} type="button">
                  ✈️ Flying With Firearms
                </button>
                <button className="fi-subnav-btn" data-onclick="openPermitRenewalModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).openPermitRenewalModal) (window as any).openPermitRenewalModal(); }} type="button">
                  ⏱️ Permit & Renewal
                </button>
                <button className="fi-subnav-btn" data-onclick="openClientProfileModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).openClientProfileModal) (window as any).openClientProfileModal(); }} type="button">
                  👤 Client Profile
                </button>
                <button className="fi-subnav-btn" data-onclick="openFutureServicesModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).openFutureServicesModal) (window as any).openFutureServicesModal(); }} type="button">
                  🛡️ Services & Booking
                </button>
                <button className="fi-subnav-btn" data-onclick="openClientFaqModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).openClientFaqModal) (window as any).openClientFaqModal(); }} type="button">
                  ❓ Client FAQ
                </button>
                <button className="fi-subnav-btn" data-onclick="switchTab('portal')" onClick={() => { if (typeof window !== 'undefined' && (window as any).switchTab) (window as any).switchTab('portal'); }} style={{"borderColor": "var(--accent-cyan)", "color": "var(--accent-cyan)"}} type="button">
                  🎓 Switch to Student Portal
                </button>
              </nav>
              {/* PORTAL HERO BANNER */}
              <div className="fi-banner-card" id="fi-sec-dashboard">
                <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "flexWrap": "wrap", "gap": "16px"}}>
                  <div style={{"maxWidth": "780px"}}>
                    <span className="fi-badge fi-badge-amber">
                      Future Initiative Client Resource Ecosystem
                    </span>
                    <h2 style={{"fontFamily": "var(--font-display)", "fontSize": "2.3rem", "color": "#fff", "textTransform": "uppercase", "letterSpacing": "1.5px", "margin": "4px 0 8px"}}>
                      
                Permit Holder & Client Command Center
              
                    </h2>
                    <p style={{"color": "var(--text-muted)", "fontSize": "0.96rem", "lineHeight": "1.55"}}>
                      
                Welcome to your comprehensive operational resource center. Designed specifically for CCW permit holders, firearm owners, and lawful travelers to navigate 50-state reciprocity, interstate transportation laws, airline TSA requirements, and permit renewals.
              
                    </p>
                  </div>
                  <div style={{"textAlign": "right", "background": "rgba(0,0,0,0.3)", "padding": "12px 18px", "borderRadius": "12px", "border": "1px solid rgba(255,255,255,0.08)"}}>
                    <div style={{"fontSize": "0.76rem", "textTransform": "uppercase", "color": "var(--text-muted)", "letterSpacing": "1px"}}>
                      Operating Status
                    </div>
                    <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-green)", "fontWeight": "700", "display": "flex", "alignItems": "center", "justifyContent": "flex-end", "gap": "6px", "marginTop": "2px"}}>
                      <span className="pulse-dot" style={{"width": "7px", "height": "7px"}}>
                      </span>
                       Systems Active
              
                    </div>
                    <div style={{"fontSize": "0.78rem", "color": "#94a3b8", "marginTop": "4px"}}>
                      Lead Instructor: Kai Wade
                    </div>
                  </div>
                  {/* ================= EXCLUSIVE CLIENT FEATURE: OFFICIAL STATE CCW PERMIT CARD ================= */}
                  <div className="client-ccw-wallet-card" style={{"background": "linear-gradient(135deg, #0d1522 0%, #070b12 50%, #0a111a 100%)", "border": "2px solid #F59E0B", "borderRadius": "18px", "padding": "24px 26px", "marginBottom": "24px", "boxShadow": "0 16px 45px rgba(0,0,0,0.92), 0 0 30px rgba(245, 158, 11, 0.22)", "position": "relative", "overflow": "hidden"}}>
                    {/* Security Micro-Watermark Glow */}
                    <div style={{"position": "absolute", "top": "-20px", "right": "-20px", "width": "180px", "height": "180px", "background": "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)", "pointerEvents": "none"}} />
                    <div style={{"position": "absolute", "bottom": "-30px", "left": "-30px", "width": "160px", "height": "160px", "background": "radial-gradient(circle, rgba(0, 229, 255, 0.12) 0%, transparent 70%)", "pointerEvents": "none"}} />




                    {/* PERMIT HEADER BAR */}
                    <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "borderBottom": "2px solid rgba(245, 158, 11, 0.4)", "paddingBottom": "14px", "marginBottom": "18px", "flexWrap": "wrap", "gap": "12px"}}>
                      <div style={{"display": "flex", "alignItems": "center", "gap": "14px"}}>
                        <div style={{"width": "46px", "height": "46px", "borderRadius": "10px", "background": "rgba(245, 158, 11, 0.12)", "border": "1.5px solid #F59E0B", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "24px", "boxShadow": "0 0 14px rgba(245, 158, 11, 0.3)"}}>
                          🛡️
                        </div>
                        <div>
                          <div style={{"fontFamily": "var(--font-display)", "fontSize": "0.78rem", "fontWeight": "900", "color": "var(--accent-amber)", "letterSpacing": "2px", "textTransform": "uppercase"}}>
                            STATE OF MARYLAND • DEPARTMENT OF STATE POLICE
                          </div>
                          <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.45rem", "color": "#ffffff", "textTransform": "uppercase", "letterSpacing": "1px", "margin": "2px 0 0"}}>
                            HANDGUN WEAR AND CARRY PERMIT
                          </h3>
                          <div style={{"fontSize": "0.76rem", "color": "var(--text-muted)", "marginTop": "2px"}}>
                            Official Licensing Division • Md. Code Ann., Public Safety § 5-306
                          </div>
                        </div>
                      </div>




                      {/* TOP-RIGHT CORNER: MEMBER OF SITE SINCE (REQUESTED SPECIFICATION) */}
                      <div style={{"background": "rgba(0, 229, 255, 0.08)", "border": "1.5px solid rgba(0, 229, 255, 0.45)", "borderRadius": "10px", "padding": "6px 14px", "textAlign": "right", "boxShadow": "0 0 12px rgba(0, 229, 255, 0.15)"}}>
                        <span style={{"fontSize": "0.68rem", "color": "#94a3b8", "textTransform": "uppercase", "letterSpacing": "1.2px", "display": "block", "fontWeight": "700"}}>
                          MEMBER OF THE SITE SINCE
                        </span>
                        <span id="wallet-member-since-val" style={{"fontFamily": "var(--font-display)", "fontSize": "0.95rem", "color": "var(--accent-cyan)", "fontWeight": "900", "letterSpacing": "0.5px"}}>
                          OCTOBER 2026
                        </span>
                        {/* Hidden compatibility hook for existing scripts looking for wallet-client-since-badge */}
                        <span id="wallet-client-since-badge" style={{"display": "none"}}>Client since Oct 2026</span>
                      </div>
                    </div>




                    {/* PERMIT MAIN BODY: PHOTO ID BOX + OFFICIAL CREDENTIAL DATA */}
                    <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(280px, 1fr))", "gap": "20px", "background": "rgba(11, 17, 26, 0.8)", "border": "1px solid rgba(255, 255, 255, 0.08)", "borderRadius": "14px", "padding": "18px 20px", "marginBottom": "18px"}}>
                      
                      {/* LEFT: CARRIER PHOTO BADGE & SECURITY HOLOGRAM */}
                      <div style={{"display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center", "background": "linear-gradient(135deg, rgba(16, 24, 38, 0.9) 0%, rgba(8, 12, 18, 0.95) 100%)", "border": "1.5px solid rgba(0, 229, 255, 0.3)", "borderRadius": "12px", "padding": "16px", "textAlign": "center"}}>
                        <div style={{"width": "100px", "height": "110px", "borderRadius": "8px", "background": "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)", "border": "2px solid #F59E0B", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center", "position": "relative", "overflow": "hidden", "boxShadow": "0 4px 15px rgba(0,0,0,0.6)"}}>
                          <span style={{"fontSize": "42px", "opacity": "0.9"}}>👤</span>
                          <div style={{"position": "absolute", "bottom": "0", "width": "100%", "background": "rgba(245, 158, 11, 0.85)", "color": "#030712", "fontSize": "0.62rem", "fontWeight": "900", "padding": "2px 0", "letterSpacing": "1px", "textTransform": "uppercase"}}>
                            VERIFIED
                          </div>
                        </div>
                        <div style={{"marginTop": "10px", "fontFamily": "var(--font-display)", "fontSize": "0.78rem", "color": "var(--accent-amber)", "fontWeight": "800", "letterSpacing": "1px", "textTransform": "uppercase"}}>
                          MSP § 5-101 QUALIFIED
                        </div>
                        <div style={{"fontSize": "0.72rem", "color": "var(--text-muted)", "marginTop": "2px"}}>
                          Certified Lead Instructor: Kai Wade
                        </div>
                        <div style={{"marginTop": "8px"}}>
                          <span className="meta-chip chip-status" id="wallet-status-badge" style={{"fontSize": "0.78rem", "padding": "4px 12px", "fontWeight": "800"}}>
                            ACTIVE CARRIER
                          </span>
                        </div>
                      </div>




                      {/* RIGHT: STRUCTURED PERMIT CREDENTIAL FIELDS */}
                      <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "14px"}}>
                        <div>
                          <span style={{"fontSize": "0.70rem", "textTransform": "uppercase", "color": "#94a3b8", "fontWeight": "800", "letterSpacing": "0.8px", "display": "block"}}>
                            PERMIT NUMBER
                          </span>
                          <div id="wallet-permit-number" style={{"fontFamily": "monospace", "fontSize": "1.1rem", "fontWeight": "900", "color": "var(--accent-amber)", "letterSpacing": "1px"}}>
                            MD-WCP-1042-88
                          </div>
                        </div>




                        <div>
                          <span style={{"fontSize": "0.70rem", "textTransform": "uppercase", "color": "#94a3b8", "fontWeight": "800", "letterSpacing": "0.8px", "display": "block"}}>
                            CARDHOLDER NAME
                          </span>
                          <div id="wallet-cardholder-name" style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "fontWeight": "900", "color": "#ffffff", "letterSpacing": "0.5px"}}>
                            MARCUS VANCE
                          </div>
                        </div>




                        <div>
                          <span style={{"fontSize": "0.70rem", "textTransform": "uppercase", "color": "#94a3b8", "fontWeight": "800", "letterSpacing": "0.8px", "display": "block"}}>
                            PRIMARY RESIDENT PERMIT
                          </span>
                          <div id="wallet-primary-permit" style={{"fontFamily": "var(--font-display)", "fontSize": "0.95rem", "fontWeight": "800", "color": "var(--accent-cyan)"}}>
                            Maryland Wear &amp; Carry
                          </div>
                        </div>




                        <div>
                          <span style={{"fontSize": "0.70rem", "textTransform": "uppercase", "color": "#94a3b8", "fontWeight": "800", "letterSpacing": "0.8px", "display": "block"}}>
                            PERMIT EXPIRATION DATE
                          </span>
                          <div id="wallet-exp-date" style={{"fontFamily": "monospace", "fontSize": "1.05rem", "fontWeight": "900", "color": "#ef4444"}}>
                            Oct 15, 2026
                          </div>
                        </div>




                        <div>
                          <span style={{"fontSize": "0.70rem", "textTransform": "uppercase", "color": "#94a3b8", "fontWeight": "800", "letterSpacing": "0.8px", "display": "block"}}>
                            LEGAL CARRY FOOTPRINT
                          </span>
                          <div id="wallet-carry-reach" style={{"fontFamily": "var(--font-display)", "fontSize": "0.95rem", "fontWeight": "800", "color": "var(--accent-green)"}}>
                            34+ States Recognized
                          </div>
                        </div>




                        <div>
                          <span style={{"fontSize": "0.70rem", "textTransform": "uppercase", "color": "#94a3b8", "fontWeight": "800", "letterSpacing": "0.8px", "display": "block"}}>
                            90-DAY RENEWAL WATCH
                          </span>
                          <div id="wallet-days-left" style={{"fontFamily": "var(--font-display)", "fontSize": "0.95rem", "fontWeight": "800", "color": "var(--accent-cyan)"}}>
                            Active (90+ Days)
                          </div>
                        </div>




                        <div style={{"gridColumn": "1 / -1", "paddingTop": "6px", "borderTop": "1px solid rgba(255, 255, 255, 0.06)", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "6px"}}>
                          <div style={{"fontSize": "0.72rem", "color": "#94a3b8"}}>
                            <strong style={{"color": "#cbd5e1"}}>RESTRICTIONS:</strong> <span style={{"color": "var(--accent-green)", "fontWeight": "700"}}>NONE (Unrestricted Concealed Carry)</span>
                          </div>
                          <div style={{"fontSize": "0.72rem", "color": "#94a3b8"}}>
                            <strong style={{"color": "#cbd5e1"}}>CLASS:</strong> STANDARD RESIDENT CCW
                          </div>
                        </div>
                      </div>
                    </div>




                    {/* PERMIT FOOTER BAR: SECURITY BARCODE & ACTIVE PERMITS + ACTIONS */}
                    <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "14px"}}>
                      <div>
                        <div style={{"fontSize": "0.70rem", "textTransform": "uppercase", "color": "var(--text-muted)", "fontWeight": "800", "marginBottom": "6px", "letterSpacing": "0.8px"}}>
                          ACTIVE REGISTERED RECIPROCITY CREDENTIALS:
                        </div>
                        <div id="wallet-multiplier-badges" style={{"display": "flex", "gap": "8px", "flexWrap": "wrap"}}>
                          <span className="meta-chip" id="permit-badge-md" style={{"color": "var(--accent-cyan)", "borderColor": "var(--accent-cyan)", "display": "inline-flex", "alignItems": "center", "gap": "6px", "fontSize": "0.76rem"}}>
                            <span>MD Wear &amp; Carry (Resident Lead)</span>
                          </span>
                          <span className="meta-chip" id="permit-badge-va" style={{"color": "#10b981", "borderColor": "#10b981", "display": "inline-flex", "alignItems": "center", "gap": "6px", "fontSize": "0.76rem"}}>
                            <span>+VA Non-Resident CHP</span>
                            <button type="button" data-onclick="deleteClientPermit('va')" onClick={() => { if (typeof window !== 'undefined' && (window as any).deleteClientPermit) (window as any).deleteClientPermit('va'); }} title="Remove active permit record" style={{"background": "none", "border": "none", "color": "#ef4444", "cursor": "pointer", "fontSize": "11px", "fontWeight": "bold", "padding": "0 2px"}}>✕</button>
                          </span>
                          <span className="meta-chip" id="permit-badge-fl" style={{"color": "#60a5fa", "borderColor": "#60a5fa", "display": "inline-flex", "alignItems": "center", "gap": "6px", "fontSize": "0.76rem"}}>
                            <span>+FL Non-Resident CWL</span>
                            <button type="button" data-onclick="deleteClientPermit('fl')" onClick={() => { if (typeof window !== 'undefined' && (window as any).deleteClientPermit) (window as any).deleteClientPermit('fl'); }} title="Remove active permit record" style={{"background": "none", "border": "none", "color": "#ef4444", "cursor": "pointer", "fontSize": "11px", "fontWeight": "bold", "padding": "0 2px"}}>✕</button>
                          </span>
                          <span className="meta-chip" id="permit-badge-az" style={{"color": "#c084fc", "borderColor": "#c084fc", "display": "inline-flex", "alignItems": "center", "gap": "6px", "fontSize": "0.76rem"}}>
                            <span>+AZ Non-Resident CWP</span>
                            <button type="button" data-onclick="deleteClientPermit('az')" onClick={() => { if (typeof window !== 'undefined' && (window as any).deleteClientPermit) (window as any).deleteClientPermit('az'); }} title="Remove active permit record" style={{"background": "none", "border": "none", "color": "#ef4444", "cursor": "pointer", "fontSize": "11px", "fontWeight": "bold", "padding": "0 2px"}}>✕</button>
                          </span>
                          <span className="meta-chip" id="permit-badge-pa" style={{"color": "var(--accent-amber)", "borderColor": "var(--accent-amber)", "display": "inline-flex", "alignItems": "center", "gap": "6px", "fontSize": "0.76rem"}}>
                            <span>+PA LTCF Border Permit</span>
                            <button type="button" data-onclick="deleteClientPermit('pa')" onClick={() => { if (typeof window !== 'undefined' && (window as any).deleteClientPermit) (window as any).deleteClientPermit('pa'); }} title="Remove active permit record" style={{"background": "none", "border": "none", "color": "#ef4444", "cursor": "pointer", "fontSize": "11px", "fontWeight": "bold", "padding": "0 2px"}}>✕</button>
                          </span>
                        </div>
                      </div>




                      <div style={{"display": "flex", "gap": "10px", "flexWrap": "wrap"}}>
                        <button className="btn-spark" data-onclick="toggleReciprocityHubModal(true)" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleReciprocityHubModal) (window as any).toggleReciprocityHubModal(true); }} style={{"width": "auto", "padding": "8px 16px", "fontSize": "0.85rem", "borderColor": "var(--accent-cyan)", "color": "var(--accent-cyan)"}} type="button">
                          🗺️ Check 50-State Reciprocity Map ↗
                        </button>
                        <button className="btn-spark" data-onclick="toggleMultiPermitModal(true)" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleMultiPermitModal) (window as any).toggleMultiPermitModal(true); }} style={{"width": "auto", "padding": "8px 16px", "fontSize": "0.85rem", "borderColor": "#F59E0B", "color": "#F59E0B"}} type="button">
                          ⭐ 34+ State Expansion Guide ↗
                        </button>
                      </div>
                    </div>
                  </div></div>
                <div style={{"display": "flex", "gap": "12px", "flexWrap": "wrap", "marginTop": "22px", "paddingTop": "18px", "borderTop": "1px solid rgba(255,255,255,0.08)"}}>
                  <button className="btn-primary" data-onclick="openPermitRenewalModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).openPermitRenewalModal) (window as any).openPermitRenewalModal(); }} style={{"width": "auto", "padding": "10px 20px", "fontSize": "0.88rem"}} type="button">
                    ⏱️ Check Permit Expiration ↗
                  </button>
                  <button className="btn-spark" data-onclick="toggleReciprocityHubModal(true)" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleReciprocityHubModal) (window as any).toggleReciprocityHubModal(true); }} style={{"width": "auto", "padding": "10px 20px", "fontSize": "0.88rem"}} type="button">
                    🗺️ 50-State Reciprocity Engine ↗
                  </button>
                  <button className="btn-spark" data-onclick="toggleMultiPermitModal(true)" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleMultiPermitModal) (window as any).toggleMultiPermitModal(true); }} style={{"width": "auto", "padding": "10px 20px", "fontSize": "0.88rem", "borderColor": "#F59E0B", "color": "#F59E0B"}} type="button">
                    ⭐ 34+ State Expansion Field Guide ↗
                  </button>
                  <button className="btn-secondary" data-onclick="openFlyingWithFirearmModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).openFlyingWithFirearmModal) (window as any).openFlyingWithFirearmModal(); }} style={{"width": "auto", "padding": "10px 20px", "fontSize": "0.88rem"}} type="button">
                    ✈️ Flying With Firearms Guide ↗
                  </button>
                </div>
              </div>
              {/* 8 PRIMARY RESOURCE CARDS (INTERACTIVE MODAL LAUNCHERS) */}
              <div className="fi-hub-cards-grid">
                {/* CARD 1: 50-STATE RECIPROCITY HUB */}
                <div className="fi-feature-card" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleReciprocityHubModal) (window as any).toggleReciprocityHubModal(true); }} style={{"cursor": "pointer", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                  <div>
                    <span className="fi-feature-icon">
                      🗺️
                    </span>
                    <h3 className="fi-feature-title">
                      50-State Reciprocity Hub
                    </h3>
                    <p className="fi-feature-desc">
                      Interactive nationwide recognition engine. Evaluate where your Maryland Wear &amp; Carry and multi-state non-resident permits (Utah, Florida, Virginia, Arizona) are honored in real time.
                    </p>
                  </div>
                  <button className="btn-spark" data-onclick="toggleReciprocityHubModal(true)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && (window as any).toggleReciprocityHubModal) (window as any).toggleReciprocityHubModal(true); }} type="button" style={{"width": "100%", "marginTop": "14px"}}>
                    Launch 50-State Reciprocity Hub ↗
                  </button>
                </div>




                {/* CARD 2: 34+ STATE MULTI-PERMIT EXPANSION SYSTEM */}
                <div className="fi-feature-card highlight" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleMultiPermitModal) (window as any).toggleMultiPermitModal(true); }} style={{"borderColor": "rgba(245, 158, 11, 0.45)", "background": "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(13, 19, 27, 0.98) 100%)", "boxShadow": "0 0 20px rgba(245, 158, 11, 0.15)", "cursor": "pointer", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                  <div>
                    <span className="fi-feature-icon" style={{"color": "#F59E0B"}}>
                      ⭐
                    </span>
                    <span className="fi-badge fi-badge-amber" style={{"marginBottom": "6px", "display": "inline-block", "fontSize": "0.72rem"}}>
                      SOP &amp; FIELD GUIDE
                    </span>
                    <h3 className="fi-feature-title" style={{"color": "#fff", "marginTop": "4px"}}>
                      34+ State Multi-Permit Expansion System
                    </h3>
                    <p className="fi-feature-desc">
                      Lead Coach Kai Wade's authorized field guide. Master the chronological multi-state dispatch sequence (MD resident anchor, parallel VA/FL/AZ non-resident packets, and 5-minute PA border pickup), avoid clerical rejections, and unlock your $0 free MD HQL exemption.
                    </p>
                  </div>
                  <button className="btn-spark" data-onclick="toggleMultiPermitModal(true)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && (window as any).toggleMultiPermitModal) (window as any).toggleMultiPermitModal(true); }} type="button" style={{"borderColor": "#F59E0B", "color": "#F59E0B", "boxShadow": "0 0 16px rgba(245, 158, 11, 0.2)", "width": "100%", "marginTop": "14px", "fontWeight": "800"}}>
                    ⭐ Open 34+ State Field Guide ↗
                  </button>
                </div>




                {/* CARD 3: TRAVELING WITH A FIREARM */}
                <div className="fi-feature-card" onClick={() => { if (typeof window !== 'undefined' && (window as any).openVehicleTravelModal) (window as any).openVehicleTravelModal(); }} style={{"cursor": "pointer", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                  <div>
                    <span className="fi-feature-icon">
                      🚗
                    </span>
                    <h3 className="fi-feature-title">
                      Traveling With a Firearm
                    </h3>
                    <p className="fi-feature-desc">
                      Interstate highway transit compliance under Federal Safe Passage (FOPA 18 U.S.C. § 926A). Vehicle storage standards, trunk rules, glove box hazards, and regional state comparison tables.
                    </p>
                  </div>
                  <button className="btn-spark" data-onclick="openVehicleTravelModal()" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && (window as any).openVehicleTravelModal) (window as any).openVehicleTravelModal(); }} type="button" style={{"width": "100%", "marginTop": "14px"}}>
                    🚗 Launch Vehicle Travel Hub ↗
                  </button>
                </div>




                {/* CARD 4: FLYING WITH A FIREARM */}
                <div className="fi-feature-card" onClick={() => { if (typeof window !== 'undefined' && (window as any).openFlyingWithFirearmModal) (window as any).openFlyingWithFirearmModal(); }} style={{"cursor": "pointer", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                  <div>
                    <span className="fi-feature-icon">
                      ✈️
                    </span>
                    <h3 className="fi-feature-title">
                      Flying With a Firearm
                    </h3>
                    <p className="fi-feature-desc">
                      Commercial airline and TSA compliance guide. Complete 6-step check-in workflow, non-TSA padlock mandates, ammunition factory weight limits, and baggage recovery protocols.
                    </p>
                  </div>
                  <button className="btn-spark" data-onclick="openFlyingWithFirearmModal()" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && (window as any).openFlyingWithFirearmModal) (window as any).openFlyingWithFirearmModal(); }} type="button" style={{"width": "100%", "marginTop": "14px"}}>
                    ✈️ Launch Air Travel Guide ↗
                  </button>
                </div>




                {/* CARD 5: PERMIT & RENEWAL CENTER */}
                <div className="fi-feature-card highlight" onClick={() => { if (typeof window !== 'undefined' && (window as any).openPermitRenewalModal) (window as any).openPermitRenewalModal(); }} style={{"borderColor": "rgba(255,183,3,0.35)", "cursor": "pointer", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                  <div>
                    <span className="fi-feature-icon">
                      ⏱️
                    </span>
                    <h3 className="fi-feature-title">
                      Permit &amp; Renewal Center
                    </h3>
                    <p className="fi-feature-desc">
                      Never let your Maryland permit lapse. Calculate your exact expiration countdown, review the 90-day renewal roadmap, and claim your exclusive 10% FIFS renewal discount.
                    </p>
                  </div>
                  <button className="btn-primary" data-onclick="openPermitRenewalModal()" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && (window as any).openPermitRenewalModal) (window as any).openPermitRenewalModal(); }} type="button" style={{"width": "100%", "marginTop": "14px"}}>
                    ⏱️ Open Renewal Center ↗
                  </button>
                </div>




                {/* CARD 6: CLIENT PROFILE & REMINDERS */}
                <div className="fi-feature-card" onClick={() => { if (typeof window !== 'undefined' && (window as any).openClientProfileModal) (window as any).openClientProfileModal(); }} style={{"cursor": "pointer", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                  <div>
                    <span className="fi-feature-icon">
                      👤
                    </span>
                    <h3 className="fi-feature-title">
                      Client Profile &amp; Reminders
                    </h3>
                    <p className="fi-feature-desc">
                      Store your permit expiration date securely for automated 90-day renewal notifications and SMS alert setup. Privacy guaranteed: zero firearm serial numbers collected.
                    </p>
                  </div>
                  <button className="btn-secondary" data-onclick="openClientProfileModal()" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && (window as any).openClientProfileModal) (window as any).openClientProfileModal(); }} type="button" style={{"width": "100%", "marginTop": "14px"}}>
                    🛡️ Manage Client Profile ↗
                  </button>
                </div>




                {/* CARD 7: FUTURE INITIATIVE SERVICES */}
                <div className="fi-feature-card" onClick={() => { if (typeof window !== 'undefined' && (window as any).openFutureServicesModal) (window as any).openFutureServicesModal(); }} style={{"cursor": "pointer", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                  <div>
                    <span className="fi-feature-icon">
                      🛡️
                    </span>
                    <h3 className="fi-feature-title">
                      Future Initiative Services
                    </h3>
                    <p className="fi-feature-desc">
                      Professional instruction with Lead Instructor Kai Wade: Maryland 8-Hour Renewal, Multi-State Permit Expansion (UT/FL/VA), and 1-on-1 Diagnostic Range Coaching.
                    </p>
                  </div>
                  <button className="btn-spark" data-onclick="openFutureServicesModal()" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && (window as any).openFutureServicesModal) (window as any).openFutureServicesModal(); }} type="button" style={{"width": "100%", "marginTop": "14px"}}>
                    Explore Services &amp; Book ↗
                  </button>
                </div>




                {/* CARD 8: CLIENT FAQ */}
                <div className="fi-feature-card" onClick={() => { if (typeof window !== 'undefined' && (window as any).openClientFaqModal) (window as any).openClientFaqModal(); }} style={{"cursor": "pointer", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                  <div>
                    <span className="fi-feature-icon">
                      ❓
                    </span>
                    <h3 className="fi-feature-title">
                      Permit Holder FAQ
                    </h3>
                    <p className="fi-feature-desc">
                      Statutory and operational answers by Lead Coach Kai Wade: renewal timelines, fingerprints, FOPA § 926A safe transit, TSA rules, and Constitutional Carry vs Reciprocity.
                    </p>
                  </div>
                  <button className="btn-spark" data-onclick="openClientFaqModal()" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && (window as any).openClientFaqModal) (window as any).openClientFaqModal(); }} type="button" style={{"width": "100%", "marginTop": "14px"}}>
                    ❓ View Client FAQ ↗
                  </button>
                </div>
              </div>
              {/* Closes fi-hub-cards-grid - Hub cleaned up upon login */}




              {/* ================= STATUTORY DISCLAIMER & CITATIONS ================= */}
              <div style={{"background": "rgba(0,0,0,0.4)", "border": "1px solid rgba(255,255,255,0.06)", "borderRadius": "12px", "padding": "18px 20px", "marginTop": "40px", "fontSize": "0.8rem", "color": "var(--text-muted)", "lineHeight": "1.5"}}>
                <strong style={{"color": "#cbd5e1"}}>
                  Legal & Regulatory Notice:
                </strong>
                 The information provided in the Future Initiative Resource Portal is compiled for general educational and informational purposes only and does not constitute individualized legal advice. Federal, state, and municipal firearm statutes, transportation rules, and airline baggage regulations change frequently. Always verify current statutory requirements with official state police licensing divisions and the Transportation Security Administration prior to transit. Future Initiative Firearm Services • Lead Instructor Kai Wade (MSP Qualified Handgun Instructor, Md. Public Safety § 5-101).
        
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* VIEW 2: INSTRUCTOR ADMIN COMMAND CENTER */}
      <section className="panel hidden" id="view-admin" role="tabpanel">
        <div id="admin-auth-box">
          <div className="panel-header">
            <h3>
              Instructor Command Center Access
            </h3>
            <p>
              Restricted access for Instructor Kai Wade to manage student rosters, qualifications, and state submissions.
            </p>
          </div>
          <div style={{"background": "#0d121a", "border": "1px solid rgba(0, 229, 255, 0.25)", "borderRadius": "12px", "padding": "22px", "maxWidth": "440px", "margin": "0 auto"}}>
            <div className="form-group" style={{"marginBottom": "14px"}}>
              <label htmlFor="adminStaffEmail" style={{"color": "var(--accent-cyan)", "fontWeight": "700", "fontSize": "0.85rem"}}>
                Staff Account Email 
                <span className="req">
                  *
                </span>
              </label>
              <input id="adminStaffEmail" placeholder="staff@trainwithfifs.com" type="email" data-onkeydown="if(event.key===&#x27;Enter&#x27;) verifyAdminAccess()" />
            </div>
            <div className="form-group" style={{"marginBottom": "18px"}}>
              <label htmlFor="adminStaffPassword" style={{"color": "var(--accent-cyan)", "fontWeight": "700", "fontSize": "0.85rem"}}>
                Account Password 
                <span className="req">
                  *
                </span>
              </label>
              <input id="adminStaffPassword" placeholder="Enter Account Password" type="password" data-onkeydown="if(event.key===&#x27;Enter&#x27;) verifyAdminAccess()" />
              <div style={{"textAlign": "right", "marginTop": "6px"}}>
                <button data-onclick="fifsRequestPasswordReset('staff', this)" style={{"background": "none", "border": "none", "padding": "0", "color": "var(--text-muted)", "fontSize": "0.78rem", "textDecoration": "underline", "cursor": "pointer"}} type="button">
                  Forgot password?
                </button>
              </div>
            </div>
            <button className="btn-primary" data-onclick="verifyAdminAccess()" type="button" style={{"width": "100%"}}>
              Sign In to Command Center 🔒
            </button>
            <div className="status-msg" id="admin-auth-status">
            </div>
          </div>
        </div>
        <div className="hidden" id="admin-command-dashboard">
          {/* High-Tech Instructor Terminal Header Bar */}
          <div className="panel-header" style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "16px", "marginBottom": "18px"}}>
            <div>
              <span className="badge-instructor" style={{"marginBottom": "6px"}}>
                Lead Instructor Operations
              </span>
              <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.85rem", "color": "#fff", "textTransform": "uppercase", "letterSpacing": "1.2px", "margin": "4px 0 2px"}}>
                Instructor Operations & Intelligence Terminal
              </h3>
              <p style={{"color": "var(--text-muted)", "fontSize": "0.88rem"}}>
                Synchronized student roster, client permit tracking, and verified real-time device telemetry.
              </p>
            </div>
          </div>








          {/* 4 INTERACTIVE INTELLIGENCE CARDS (Primary Navigation Deck - MSP Portal Styling) */}
          <div className="admin-intel-cards-container msp-intel-deck-grid" style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(260px, 1fr))", "gap": "16px", "margin": "20px 0 24px"}}>
            {/* Card 1: Student Roster & Ops */}
            <div className="portal-feature-launcher-card msp-intel-card msp-card-cyan active" id="btn-admin-tab-roster" onClick={(e) => { e.preventDefault(); (window as any).switchAdminTab?.('roster'); }} data-onclick="switchAdminTab('roster')" role="button" tabIndex={0} style={{"border": "2px solid var(--accent-cyan)", "background": "linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "borderRadius": "14px", "padding": "22px 20px", "boxShadow": "0 0 20px rgba(0, 229, 255, 0.25)", "display": "flex", "flexDirection": "column", "justifyContent": "space-between", "cursor": "pointer", "position": "relative", "transition": "all 0.25s ease"}}>
              <span className="card-badge msp-card-unread-badge" id="admin-tab-roster-badge" style={{"position": "absolute", "top": "12px", "right": "12px", "background": "var(--accent-cyan)", "color": "#070b10", "fontSize": "0.75rem", "fontWeight": "900", "padding": "3px 9px", "borderRadius": "20px", "boxShadow": "0 0 10px var(--accent-cyan)", "display": "none"}}>🔔 <span id="admin-tab-roster-badge-count">0</span> NEW</span>
              <div>
                <span className="next-step-badge msp-card-eyebrow eyebrow-cyan" style={{"color": "var(--accent-cyan)", "marginBottom": "4px", "display": "block", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase"}}>
                  STUDENT ENROLLMENT & OPS
                </span>
                <h3 className="portal-feature-title msp-card-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "marginBottom": "6px", "display": "flex", "alignItems": "center", "gap": "8px"}}>
                  👥 Student Roster & Ops
                </h3>
                <p className="msp-card-desc" style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.5", "marginBottom": "16px"}}>
                  Live training attendees, real-time certification milestones, and active student training dossiers.
                </p>
              </div>
              <div>
                <button className="btn-primary msp-card-action-btn action-cyan" type="button" onClick={(e) => { e.stopPropagation(); (window as any).switchAdminTab?.('roster'); }} data-onclick="switchAdminTab('roster'); event.stopPropagation();" style={{"width": "100%", "padding": "12px 14px", "fontSize": "0.86rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px", "boxShadow": "0 0 16px var(--accent-cyan-glow)", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "border": "none", "borderRadius": "8px", "background": "var(--accent-cyan)", "color": "#070b10", "cursor": "pointer"}}>
                  LAUNCH ROSTER PORTAL ↗
                </button>
              </div>
            </div>








            {/* Card 2: Future Initiative Clients */}
            <div className="portal-feature-launcher-card msp-intel-card msp-card-amber" id="btn-admin-tab-clients" onClick={(e) => { e.preventDefault(); (window as any).switchAdminTab?.('clients'); }} data-onclick="switchAdminTab('clients')" role="button" tabIndex={0} style={{"border": "2px solid var(--accent-amber)", "background": "linear-gradient(135deg, rgba(255, 183, 3, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "borderRadius": "14px", "padding": "22px 20px", "boxShadow": "0 0 20px rgba(255, 183, 3, 0.15)", "display": "flex", "flexDirection": "column", "justifyContent": "space-between", "cursor": "pointer", "position": "relative", "transition": "all 0.25s ease"}}>
              <span className="card-badge msp-card-unread-badge" id="admin-tab-clients-badge" style={{"position": "absolute", "top": "12px", "right": "12px", "background": "var(--accent-amber)", "color": "#070b10", "fontSize": "0.75rem", "fontWeight": "900", "padding": "3px 9px", "borderRadius": "20px", "boxShadow": "0 0 10px var(--accent-amber)", "display": "none"}}>🔔 <span id="admin-tab-clients-badge-count">0</span> NEW</span>
              <div>
                <span className="next-step-badge msp-card-eyebrow eyebrow-amber" style={{"color": "var(--accent-amber)", "marginBottom": "4px", "display": "block", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase"}}>
                  VIP PERMIT TRACKING & REGISTRY
                </span>
                <h3 className="portal-feature-title msp-card-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "marginBottom": "6px", "display": "flex", "alignItems": "center", "gap": "8px"}}>
                  🛡️ Future Initiative Clients
                </h3>
                <p className="msp-card-desc" style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.5", "marginBottom": "16px"}}>
                  Private consultation tracking, state wear & carry permit reviews, and statutory exemption assistance.
                </p>
              </div>
              <div>
                <button className="btn-primary msp-card-action-btn action-amber" type="button" onClick={(e) => { e.stopPropagation(); (window as any).switchAdminTab?.('clients'); }} data-onclick="switchAdminTab('clients'); event.stopPropagation();" style={{"width": "100%", "padding": "12px 14px", "fontSize": "0.86rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px", "boxShadow": "0 0 16px rgba(255, 183, 3, 0.4)", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "border": "none", "borderRadius": "8px", "background": "var(--accent-amber)", "color": "#070b10", "cursor": "pointer"}}>
                  LAUNCH CLIENT PORTAL ↗
                </button>
              </div>
            </div>








            {/* Card 3: Live Chat Command */}
            <div className="portal-feature-launcher-card msp-intel-card msp-card-purple" id="btn-admin-tab-chat" onClick={(e) => { e.preventDefault(); (window as any).switchAdminTab?.('chat'); }} data-onclick="switchAdminTab('chat')" role="button" tabIndex={0} style={{"border": "2px solid #a855f7", "background": "linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "borderRadius": "14px", "padding": "22px 20px", "boxShadow": "0 0 20px rgba(168, 85, 247, 0.15)", "display": "flex", "flexDirection": "column", "justifyContent": "space-between", "cursor": "pointer", "position": "relative", "transition": "all 0.25s ease"}}>
              <span className="card-badge msp-card-unread-badge hidden" id="admin-tab-chat-unread" style={{"position": "absolute", "top": "12px", "right": "12px", "background": "#ef4444", "color": "#fff", "fontSize": "0.75rem", "fontWeight": "900", "padding": "3px 9px", "borderRadius": "20px", "boxShadow": "0 0 10px #ef4444"}}>🔔 <span id="admin-tab-chat-badge-count">0</span> NEW</span>
              <div>
                <span className="next-step-badge msp-card-eyebrow eyebrow-purple" style={{"color": "#c084fc", "marginBottom": "4px", "display": "block", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase"}}>
                  TWO-WAY SECURE COMMS
                </span>
                <h3 className="portal-feature-title msp-card-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "marginBottom": "6px", "display": "flex", "alignItems": "center", "gap": "8px"}}>
                  💬 Live Chat Command
                </h3>
                <p className="msp-card-desc" style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.5", "marginBottom": "16px"}}>
                  Real-time visitor questions, instant inquiry notifications, and direct two-way instructor response.
                </p>
              </div>
              <div>
                <button className="btn-primary msp-card-action-btn action-purple" type="button" onClick={(e) => { e.stopPropagation(); (window as any).switchAdminTab?.('chat'); }} data-onclick="switchAdminTab('chat'); event.stopPropagation();" style={{"width": "100%", "padding": "12px 14px", "fontSize": "0.86rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px", "boxShadow": "0 0 16px rgba(168, 85, 247, 0.4)", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "border": "none", "borderRadius": "8px", "background": "#a855f7", "color": "#070b10", "cursor": "pointer"}}>
                  OPEN CHAT COMMAND ↗
                </button>
              </div>
            </div>








            {/* Card 4: Website Telemetry */}
            <div className="portal-feature-launcher-card msp-intel-card msp-card-emerald" id="btn-admin-tab-telemetry" onClick={(e) => { e.preventDefault(); (window as any).switchAdminTab?.('telemetry'); }} data-onclick="switchAdminTab('telemetry')" role="button" tabIndex={0} style={{"border": "2px solid #10b981", "background": "linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "borderRadius": "14px", "padding": "22px 20px", "boxShadow": "0 0 20px rgba(16, 185, 129, 0.15)", "display": "flex", "flexDirection": "column", "justifyContent": "space-between", "cursor": "pointer", "position": "relative", "transition": "all 0.25s ease"}}>
              <span className="card-badge msp-card-unread-badge" id="admin-tab-telemetry-badge" style={{"position": "absolute", "top": "12px", "right": "12px", "background": "#10b981", "color": "#070b10", "fontSize": "0.75rem", "fontWeight": "900", "padding": "3px 9px", "borderRadius": "20px", "boxShadow": "0 0 10px #10b981", "display": "inline-block"}}>📡 LIVE</span>
              <div>
                <span className="next-step-badge msp-card-eyebrow eyebrow-emerald" style={{"color": "#34d399", "marginBottom": "4px", "display": "block", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase"}}>
                  SYSTEM INTELLIGENCE & TRAFFIC
                </span>
                <h3 className="portal-feature-title msp-card-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "marginBottom": "6px", "display": "flex", "alignItems": "center", "gap": "8px"}}>
                  📡 Website Telemetry
                </h3>
                <p className="msp-card-desc" style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.5", "marginBottom": "16px"}}>
                  Live visitor radar, referral breakdown, device analytics, and verified client engagement tracking.
                </p>
              </div>
              <div>
                <button className="btn-primary msp-card-action-btn action-emerald" type="button" onClick={(e) => { e.stopPropagation(); (window as any).switchAdminTab?.('telemetry'); }} data-onclick="switchAdminTab('telemetry'); event.stopPropagation();" style={{"width": "100%", "padding": "12px 14px", "fontSize": "0.86rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px", "boxShadow": "0 0 16px rgba(16, 185, 129, 0.4)", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "border": "none", "borderRadius": "8px", "background": "#10b981", "color": "#070b10", "cursor": "pointer"}}>
                  VIEW TELEMETRY RADAR ↗
                </button>
              </div>
            </div>
          </div>








          {/* SECONDARY TACTICAL UTILITY TOOLBAR */}
          <div className="admin-secondary-toolbar">
            <button className="btn-tactical-hud hud-cyan" id="btn-admin-refresh-data" onClick={(e) => { e.preventDefault(); (window as any).refreshAdminRoster?.(); }} data-onclick="refreshAdminRoster()" title="Synchronize student and client records from Supabase" type="button">
              <span>🔄</span> <span>REFRESH ROSTER</span>
            </button>
            <button className="btn-tactical-hud hud-purple" id="btn-admin-invite-hdr" onClick={(e) => { e.preventDefault(); (window as any).openAdminInviteModal?.(); }} data-onclick="openAdminInviteModal()" title="Dispatch student/client portal onboarding invitation" type="button">
              <span>✉️</span> <span>SEND INVITE</span>
            </button>
            
            <button className="btn-tactical-hud hud-red" id="btn-admin-sign-out" onClick={(e) => { e.preventDefault(); (window as any).adminSignOut?.(); }} data-onclick="adminSignOut()" title="Sign out and lock Admin Command Center" type="button">
              <span>🚪</span> <span>LOCK TERMINAL</span>
            </button>
          </div>
          {/* POPUP MODAL DIALOG FOR ADMIN INTEL CARDS (Clean overlay matching What to Expect) */}
      <div 
        className="goal-modal-overlay" 
        id="adminSubpanelModalOverlay" 
        data-onclick="if(event.target===this) closeAdminSubpanelModal()" 
        style={{"display": "none", "zIndex": 999999, "alignItems": "center", "justifyContent": "center"}}
      >
        <div 
          aria-modal="true" 
          className="goal-modal-box" 
          data-onclick="event.stopPropagation()" 
          role="dialog" 
          style={{"maxWidth": "1020px", "width": "96%", "maxHeight": "92vh", "overflowY": "auto", "padding": "28px 24px", "border": "2px solid var(--accent-cyan)", "borderRadius": "16px", "background": "linear-gradient(135deg, rgba(13, 19, 27, 0.98) 0%, rgba(6, 10, 16, 0.99) 100%)", "boxShadow": "0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(0, 229, 255, 0.25)", "position": "relative"}}
        >
          <button 
            aria-label="Close details" 
            className="goal-modal-close-btn" 
            data-onclick="closeAdminSubpanelModal()" 
            type="button"
            style={{"position": "absolute", "top": "18px", "right": "20px", "width": "38px", "height": "38px", "fontSize": "1.4rem", "borderRadius": "50%", "background": "rgba(255,255,255,0.08)", "border": "1px solid var(--border-subtle)", "color": "#fff", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center", "zIndex": 10}}
          >
            ✕
          </button>
          <div style={{"marginBottom": "16px", "paddingRight": "50px"}}>
            <span id="adminSubpanelModalEyebrow" style={{"color": "var(--accent-cyan)", "fontFamily": "var(--font-display)", "fontSize": "0.82rem", "fontWeight": "800", "letterSpacing": "1.5px", "textTransform": "uppercase", "display": "block", "marginBottom": "4px"}}>
              ADMIN INTELLIGENCE PORTAL
            </span>
            <h3 id="adminSubpanelModalTitle" style={{"fontFamily": "var(--font-display)", "fontSize": "1.65rem", "color": "#fff", "margin": 0, "fontWeight": "800"}}>
              Portal View
            </h3>
          </div>
          
          {/* SUBPANEL 1: STUDENT ROSTER */}
          <div id="admin-subpanel-roster">
            <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "14px", "flexWrap": "wrap", "gap": "10px"}}>
              <span style={{"fontSize": "0.84rem", "color": "var(--text-muted)", "fontWeight": "600"}}>
                Live Student Ops & Certification Status
              </span>
              <button type="button" className="btn-spark btn-modal-subpanel-reload" onClick={(e) => { e.preventDefault(); (window as any).triggerCardGunRefresh?.(e.currentTarget, 'roster'); }} data-onclick="triggerCardGunRefresh(this, 'roster')" style={{"padding": "8px 16px", "fontSize": "0.84rem", "fontWeight": "800", "border": "1.5px solid var(--accent-cyan)", "borderRadius": "8px", "background": "rgba(0, 229, 255, 0.12)", "color": "var(--accent-cyan)", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "gap": "6px"}} title="Rerack & Refresh Student Roster">
                🔄 REFRESH ROSTER
              </button>
            </div>
            {/* New Student Registration Notification Alert Beacon */}
            <div id="admin-new-student-alert-box" style={{"display": "none", "background": "linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(13, 19, 27, 0.98) 100%)", "border": "2px solid var(--accent-cyan)", "boxShadow": "0 0 25px var(--accent-cyan-glow)", "borderRadius": "12px", "padding": "14px 18px", "marginBottom": "20px", "alignItems": "center", "justifyContent": "space-between", "gap": "14px", "flexWrap": "wrap"}}>
              <div style={{"display": "flex", "alignItems": "center", "gap": "12px"}}>
                <span className="live-dot" style={{"width": "12px", "height": "12px", "background": "var(--accent-cyan)", "boxShadow": "0 0 12px var(--accent-cyan)", "flexShrink": "0"}}>
                </span>
                <div>
                  <strong id="admin-alert-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "textTransform": "uppercase", "letterSpacing": "1px", "display": "block"}}>
                    🔔 NEW STUDENT ENROLLMENT ALERT
                  </strong>
                  <p id="admin-alert-desc" style={{"fontSize": "0.86rem", "color": "#cbd5e1", "marginTop": "2px"}}>
                    A new student has enrolled online. Review readiness details and establish class schedule.
                  </p>
                </div>
              </div>
              <div style={{"display": "flex", "gap": "8px"}}>
                <button className="btn-spark" data-onclick="acknowledgeNewStudentAlert()" style={{"padding": "8px 16px", "fontSize": "0.82rem", "borderColor": "var(--accent-cyan)", "color": "var(--accent-cyan)", "cursor": "pointer"}} type="button">
                  ✔ Acknowledge / Mark Reviewed
                </button>
              </div>
            </div>
            <div className="admin-metrics-grid">
              <div className="metric-card">
                <div className="metric-val" id="metric-total">
                  0
                </div>
                <div className="metric-name">
                  Total Enrolled
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-val" id="metric-pending" style={{"color": "var(--accent-amber)"}}>
                  0
                </div>
                <div className="metric-name">
                  Prep Pending
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-val" id="metric-upcoming" style={{"color": "#60a5fa"}}>
                  0
                </div>
                <div className="metric-name">
                  Upcoming Sessions
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-val" id="metric-completed" style={{"color": "#10b981"}}>
                  0
                </div>
                <div className="metric-name">
                  Certified Graduates
                </div>
              </div>
            </div>
            <div style={{"overflowX": "auto", "background": "#070b10", "borderRadius": "12px", "border": "1px solid var(--border-subtle)", "padding": "14px", "marginBottom": "20px"}}>
              <table className="admin-roster-table" style={{"width": "100%", "borderCollapse": "collapse", "fontSize": "0.86rem"}}>
                <thead>
                  <tr>
                    <th>
                      Student ID
                    </th>
                    <th>
                      Full Name & Contact
                    </th>
                    <th>
                      Course
                    </th>
                    <th>
                      Training Schedule
                    </th>
                    <th>
                      8-Step Journey Status
                    </th>
                    <th>
                      Dossier
                    </th>
                    <th>
                      Change Step
                    </th>
                    <th style={{"textAlign": "center"}}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody id="admin-roster-tbody">
                  <tr>
                    <td colSpan={8} style={{"textAlign": "center", "color": "var(--text-muted)", "padding": "20px"}}>
                      Loading live student roster...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* ================= SUB-PANEL 2: FUTURE INITIATIVE CLIENT ROSTER ================= */}
          <div id="admin-subpanel-clients" style={{"display": "none"}}>
            <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "14px", "flexWrap": "wrap", "gap": "10px"}}>
              <span style={{"fontSize": "0.84rem", "color": "var(--text-muted)", "fontWeight": "600"}}>
                Future Initiative VIP Client Registry & Renewal Telemetry
              </span>
              <button type="button" className="btn-spark btn-modal-subpanel-reload" onClick={(e) => { e.preventDefault(); (window as any).triggerCardGunRefresh?.(e.currentTarget, 'clients'); }} data-onclick="triggerCardGunRefresh(this, 'clients')" style={{"padding": "8px 16px", "fontSize": "0.84rem", "fontWeight": "800", "border": "1.5px solid var(--accent-amber)", "borderRadius": "8px", "background": "rgba(255, 183, 3, 0.12)", "color": "var(--accent-amber)", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "gap": "6px"}} title="Rerack & Refresh Clients">
                🔄 REFRESH CLIENTS
              </button>
            </div>
            {/* New Client Registration Notification Alert Beacon */}
            <div id="admin-new-client-alert-box" style={{"display": "none", "background": "linear-gradient(135deg, rgba(255, 183, 3, 0.15) 0%, rgba(13, 19, 27, 0.98) 100%)", "border": "2px solid var(--accent-amber)", "boxShadow": "0 0 25px var(--accent-amber-glow)", "borderRadius": "12px", "padding": "14px 18px", "marginBottom": "20px", "alignItems": "center", "justifyContent": "space-between", "gap": "14px", "flexWrap": "wrap"}}>
              <div style={{"display": "flex", "alignItems": "center", "gap": "12px"}}>
                <span className="live-dot" style={{"width": "12px", "height": "12px", "background": "var(--accent-amber)", "boxShadow": "0 0 12px var(--accent-amber)", "flexShrink": "0"}}>
                </span>
                <div>
                  <strong id="admin-client-alert-title" style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "textTransform": "uppercase", "letterSpacing": "1px", "display": "block"}}>
                    🛡️ NEW CLIENT PORTAL REGISTRATION
                  </strong>
                  <p id="admin-client-alert-desc" style={{"fontSize": "0.86rem", "color": "#cbd5e1", "marginTop": "2px"}}>
                    A new permit holder has registered in the Future Initiative Client Portal.
                  </p>
                </div>
              </div>
              <div style={{"display": "flex", "gap": "8px"}}>
                <button className="btn-spark" data-onclick="switchAdminTab('clients'); acknowledgeNewClientAlert();" style={{"padding": "8px 16px", "fontSize": "0.82rem", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)"}} type="button">
                  
                👁️ View Client Roster
              
                </button>
                <button className="btn-spark" data-onclick="acknowledgeNewClientAlert()" style={{"padding": "8px 16px", "fontSize": "0.82rem", "borderColor": "var(--border-subtle)", "color": "var(--text-muted)"}} type="button">
                  
                Dismiss
              
                </button>
              </div>
            </div>
            <div className="admin-metrics-grid">
              <div className="metric-card" style={{"borderColor": "var(--accent-amber)"}}>
                <div className="metric-val" id="metric-client-total" style={{"color": "var(--accent-amber)"}}>
                  0
                </div>
                <div className="metric-name">
                  Total Clients
                </div>
              </div>
              <div className="metric-card" style={{"borderColor": "#10b981"}}>
                <div className="metric-val" id="metric-client-active" style={{"color": "#10b981"}}>
                  0
                </div>
                <div className="metric-name">
                  Active Permits (&gt;90d)
                </div>
              </div>
              <div className="metric-card" style={{"borderColor": "var(--accent-cyan)"}}>
                <div className="metric-val" id="metric-client-renewal" style={{"color": "var(--accent-cyan)"}}>
                  0
                </div>
                <div className="metric-name">
                  90-Day Renewal Window
                </div>
              </div>
              <div className="metric-card" style={{"borderColor": "#ef4444"}}>
                <div className="metric-val" id="metric-client-expired" style={{"color": "#ef4444"}}>
                  0
                </div>
                <div className="metric-name">
                  Expired / Due
                </div>
              </div>
            </div>
            <div style={{"overflowX": "auto", "background": "#070b10", "borderRadius": "12px", "border": "1px solid var(--border-subtle)", "padding": "14px", "marginBottom": "20px"}}>
              <table className="admin-roster-table" style={{"width": "100%", "borderCollapse": "collapse", "fontSize": "0.86rem"}}>
                <thead>
                  <tr>
                    <th>
                      Client ID
                    </th>
                    <th>
                      Full Name & Contact
                    </th>
                    <th>
                      Permit Jurisdiction
                    </th>
                    <th>
                      Permit Expiration
                    </th>
                    <th>
                      Days Remaining
                    </th>
                    <th>
                      Renewal Status
                    </th>
                    <th style={{"textAlign": "center"}}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody id="admin-client-tbody">
                  <tr>
                    <td colSpan={7} style={{"textAlign": "center", "color": "var(--text-muted)", "padding": "20px"}}>
                      Loading Future Initiative client records...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* ================= SUB-PANEL 3: WEBSITE TELEMETRY & HARDWARE DIAGNOSTICS ================= */}
          <div id="admin-subpanel-analytics" style={{"display": "none"}}>
            <div id="admin-analytics-dashboard-container">
              <div style={{"marginTop": "10px", "paddingTop": "10px"}}>
                <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "14px", "flexWrap": "wrap", "gap": "10px"}}>
                  <span style={{"fontSize": "0.84rem", "color": "var(--text-muted)", "fontWeight": "600"}}>
                    Live Visitor Radar & Verified Hardware Diagnostics
                  </span>
                  <button type="button" className="btn-spark btn-modal-subpanel-reload" onClick={(e) => { e.preventDefault(); (window as any).triggerCardGunRefresh?.(e.currentTarget, 'telemetry'); }} data-onclick="triggerCardGunRefresh(this, 'telemetry')" style={{"padding": "8px 16px", "fontSize": "0.84rem", "fontWeight": "800", "border": "1.5px solid #10b981", "borderRadius": "8px", "background": "rgba(16, 185, 129, 0.12)", "color": "#34d399", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "gap": "6px"}} title="Rerack & Refresh Telemetry Radar">
                    🔄 REFRESH TELEMETRY
                  </button>
                </div>
                {/* Top KPI Grid */}
                <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(160px, 1fr))", "gap": "12px", "marginBottom": "22px"}}>
                  <div className="metric-card" style={{"borderColor": "var(--accent-cyan)", "background": "rgba(0, 229, 255, 0.05)"}}>
                    <div className="metric-val" id="telemetry-visitors-val" style={{"color": "var(--accent-cyan)"}}>
                      0
                    </div>
                    <div className="metric-name">
                      Verified Unique Visitors
                    </div>
                  </div>
                  <div className="metric-card" style={{"borderColor": "#60a5fa", "background": "rgba(96, 165, 250, 0.05)"}}>
                    <div className="metric-val" id="telemetry-pageviews-val" style={{"color": "#60a5fa"}}>
                      0
                    </div>
                    <div className="metric-name">
                      Verified Pageviews
                    </div>
                  </div>
                  <div className="metric-card" style={{"borderColor": "var(--accent-green)", "background": "rgba(16, 185, 129, 0.05)"}}>
                    <div className="metric-val" id="telemetry-conversion-val" style={{"color": "var(--accent-green)"}}>
                      0.0%
                    </div>
                    <div className="metric-name">
                      Booking Conversion Rate
                    </div>
                  </div>
                  <div className="metric-card" style={{"borderColor": "var(--accent-amber)", "background": "rgba(255, 183, 3, 0.05)"}}>
                    <div className="metric-val" id="telemetry-vip-val" style={{"color": "var(--accent-amber)"}}>
                      0
                    </div>
                    <div className="metric-name">
                      VIP Mode Inquiries
                    </div>
                  </div>
                  <div className="metric-card" style={{"borderColor": "#c084fc", "background": "rgba(192, 132, 252, 0.05)"}}>
                    <div className="metric-val" id="telemetry-milestones-val" style={{"color": "#c084fc"}}>
                      0
                    </div>
                    <div className="metric-name">
                      Confirmed Registrations
                    </div>
                  </div>
                </div>
                {/* DEVICE HARDWARE & ACCESS TELEMETRY PANEL */}
                <div style={{"background": "#0d121a", "border": "1px solid rgba(0, 229, 255, 0.35)", "borderRadius": "14px", "padding": "20px", "marginBottom": "24px", "boxShadow": "0 8px 30px rgba(0,0,0,0.7)"}}>
                  <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "10px", "marginBottom": "16px"}}>
                    <div>
                      <span className="badge-instructor" style={{"marginBottom": "4px"}}>
                        Hardware Telemetry
                      </span>
                      <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "textTransform": "uppercase", "margin": "2px 0"}}>
                        
          📱 Visitor Device Distribution & Screen Diagnostics
        
                      </h4>
                      <p style={{"color": "var(--text-muted)", "fontSize": "0.84rem"}}>
                        Real-time detection across Mobile Phones, Tablets/iPads, Laptops, and Handheld PCs.
                      </p>
                    </div>
                    <span style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "fontWeight": "700", "textTransform": "uppercase"}}>
                      ● High-Value Milestone Logging Active
                    </span>
                  </div>
                  <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(210px, 1fr))", "gap": "14px", "marginBottom": "18px"}}>
                    <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "14px"}}>
                      <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "4px"}}>
                        <strong style={{"color": "#fff", "fontSize": "0.95rem"}}>
                          📱 Mobile Phones
                        </strong>
                        <span id="telemetry-mob-pct" style={{"color": "var(--accent-cyan)", "fontWeight": "800", "fontFamily": "var(--font-display)", "fontSize": "1.1rem"}}>
                          0%
                        </span>
                      </div>
                      <div style={{"background": "#1e293b", "height": "7px", "borderRadius": "4px", "overflow": "hidden", "margin": "6px 0 8px"}}>
                        <div id="telemetry-mob-bar" style={{"background": "var(--accent-cyan)", "width": "0%", "height": "100%"}}>
                        </div>
                      </div>
                      <span id="telemetry-mob-count" style={{"fontSize": "0.75rem", "color": "var(--text-muted)"}}>
                        0 sessions • iPhones, Android & Razr+
                      </span>
                    </div>
                    <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "14px"}}>
                      <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "4px"}}>
                        <strong style={{"color": "#fff", "fontSize": "0.95rem"}}>
                          📟 Tablets / iPads
                        </strong>
                        <span id="telemetry-tab-pct" style={{"color": "var(--accent-amber)", "fontWeight": "800", "fontFamily": "var(--font-display)", "fontSize": "1.1rem"}}>
                          0%
                        </span>
                      </div>
                      <div style={{"background": "#1e293b", "height": "7px", "borderRadius": "4px", "overflow": "hidden", "margin": "6px 0 8px"}}>
                        <div id="telemetry-tab-bar" style={{"background": "var(--accent-amber)", "width": "0%", "height": "100%"}}>
                        </div>
                      </div>
                      <span id="telemetry-tab-count" style={{"fontSize": "0.75rem", "color": "var(--text-muted)"}}>
                        0 sessions • iPad Pro, Mini & Tablets
                      </span>
                    </div>
                    <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "14px"}}>
                      <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "4px"}}>
                        <strong style={{"color": "#fff", "fontSize": "0.95rem"}}>
                          💻 Computers & Laptops
                        </strong>
                        <span id="telemetry-desk-pct" style={{"color": "#10b981", "fontWeight": "800", "fontFamily": "var(--font-display)", "fontSize": "1.1rem"}}>
                          0%
                        </span>
                      </div>
                      <div style={{"background": "#1e293b", "height": "7px", "borderRadius": "4px", "overflow": "hidden", "margin": "6px 0 8px"}}>
                        <div id="telemetry-desk-bar" style={{"background": "#10b981", "width": "0%", "height": "100%"}}>
                        </div>
                      </div>
                      <span id="telemetry-desk-count" style={{"fontSize": "0.75rem", "color": "var(--text-muted)"}}>
                        0 sessions • MacBooks, Windows PCs
                      </span>
                    </div>
                    <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "14px"}}>
                      <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "4px"}}>
                        <strong style={{"color": "#fff", "fontSize": "0.95rem"}}>
                          🎮 Handheld PCs
                        </strong>
                        <span id="telemetry-hand-pct" style={{"color": "#c084fc", "fontWeight": "800", "fontFamily": "var(--font-display)", "fontSize": "1.1rem"}}>
                          0%
                        </span>
                      </div>
                      <div style={{"background": "#1e293b", "height": "7px", "borderRadius": "4px", "overflow": "hidden", "margin": "6px 0 8px"}}>
                        <div id="telemetry-hand-bar" style={{"background": "#c084fc", "width": "0%", "height": "100%"}}>
                        </div>
                      </div>
                      <span id="telemetry-hand-count" style={{"fontSize": "0.75rem", "color": "var(--text-muted)"}}>
                        0 sessions • ROG Ally, Steam Deck
                      </span>
                    </div>
                  </div>
                </div>
                {/* Real-Time Activity & High-Value Milestone Stream */}
                <div style={{"background": "#0d121a", "border": "1px solid var(--border-subtle)", "borderRadius": "12px", "padding": "18px", "marginBottom": "24px"}}>
                  <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "12px"}}>
                    <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff"}}>
                      📡 High-Value Business Milestones & Conversion Stream
                    </h4>
                    <span style={{"fontSize": "0.76rem", "color": "#10b981", "fontWeight": "700", "textTransform": "uppercase"}}>
                      ● Streamlined I/O Active
                    </span>
                  </div>
                  <div id="telemetry-stream-box" style={{"maxHeight": "250px", "overflowY": "auto", "fontFamily": "monospace", "fontSize": "0.82rem", "background": "#070b10", "borderRadius": "8px", "padding": "12px", "border": "1px solid rgba(255,255,255,0.06)"}}>
                    <div style={{"padding": "12px 8px", "color": "var(--text-muted)", "textAlign": "center", "fontSize": "0.82rem"}}>
                      Real-time telemetry stream synchronized with Supabase cloud audit log.
                    </div>
                  </div>
                  <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginTop": "14px", "flexWrap": "wrap", "gap": "10px"}}>
                    <span style={{"fontSize": "0.78rem", "color": "var(--text-muted)"}}>
                      Synced with Supabase Cloud: 
                      <code>
                        Telemetry & Audit Stream
                      </code>
                    </span>
                    <div style={{"display": "flex", "gap": "8px"}}>
                      <button type="button" className="btn-spark" data-onclick="exportAnalyticsCSV()" style={{"padding": "6px 14px", "fontSize": "0.80rem"}}>
                        📥 Export Analytics CSV
                      </button>
                      <button type="button" className="btn-spark" id="btn-reset-telemetry" data-onclick="resetWebsiteTelemetry()" style={{"padding": "6px 14px", "fontSize": "0.80rem", "borderColor": "rgba(239, 68, 68, 0.45)", "color": "#ef4444"}}>
                        🗑️ Reset Telemetry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ================= SUB-PANEL 4: INSTRUCTOR LIVE CHAT CONSOLE (EASIEST & NATIVE) ================= */}
          <div id="admin-subpanel-chat" style={{"display": "none", "position": "relative", "zIndex": "60"}}>
            <div style={{"background": "#0d131b", "border": "1.5px solid var(--accent-cyan)", "borderRadius": "14px", "padding": "20px", "boxShadow": "0 12px 35px rgba(0,0,0,0.85), 0 0 24px rgba(0,229,255,0.18)"}}>
              {/* Top Bar: Channel Status & Quick Actions */}
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "12px", "marginBottom": "18px", "paddingBottom": "14px", "borderBottom": "1px solid var(--border-subtle)"}}>
                <div>
                  <div style={{"display": "flex", "alignItems": "center", "gap": "10px"}}>
                    <span className="pulse-dot" style={{"width": "10px", "height": "10px", "background": "#10b981", "boxShadow": "0 0 12px #10b981"}}>
                    </span>
                    <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "margin": "0", "textTransform": "uppercase", "letterSpacing": "1px"}}>
                      
            💬 INSTRUCTOR 2-WAY LIVE CHAT CONSOLE
          
                    </h4>
                  </div>
                  <p style={{"fontSize": "0.84rem", "color": "var(--text-muted)", "marginTop": "4px", "marginBottom": "0"}}>
                    
          Native real-time communication channel for Coach Kai Wade to reply to incoming student inquiries and live range questions.
        
                  </p>
                </div>
                <div style={{"display": "flex", "alignItems": "center", "gap": "10px", "flexWrap": "wrap"}}>
                  <span style={{"fontSize": "0.76rem", "color": "#10b981", "background": "rgba(16,185,129,0.12)", "border": "1px solid #10b981", "padding": "4px 12px", "borderRadius": "20px", "fontWeight": "800", "textTransform": "uppercase"}}>
                    
          ● DISPATCH ACTIVE
        
                  </span>
                  <button type="button" className="btn-spark btn-modal-subpanel-reload" onClick={(e) => { e.preventDefault(); (window as any).triggerCardGunRefresh?.(e.currentTarget, 'chat'); }} data-onclick="triggerCardGunRefresh(this, 'chat')" style={{"padding": "7px 16px", "fontSize": "0.82rem", "fontWeight": "800", "border": "1.5px solid #a855f7", "borderRadius": "8px", "background": "rgba(168, 85, 247, 0.12)", "color": "#c084fc", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "gap": "6px"}} title="Rerack & Refresh Chat Inquiries">
                    🔄 REFRESH CHAT
                  </button>
                </div>
              </div>
              {/* 2-Column Live Console Grid */}
              <div style={{"display": "grid", "gridTemplateColumns": "minmax(260px, 320px) 1fr", "gap": "16px", "minHeight": "480px"}}>
                {/* Left Column: Conversations List */}
                <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "12px", "display": "flex", "flexDirection": "column"}}>
                  <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "paddingBottom": "8px", "borderBottom": "1px solid rgba(255,255,255,0.06)", "marginBottom": "10px"}}>
                    <span style={{"fontFamily": "var(--font-display)", "fontSize": "0.82rem", "fontWeight": "800", "color": "#cbd5e1", "textTransform": "uppercase", "letterSpacing": "0.5px"}}>
                      
            INCOMING INQUIRIES
          
                    </span>
                    <span id="admin-chat-count-badge" style={{"fontSize": "0.72rem", "color": "var(--accent-cyan)", "fontWeight": "800"}}>
                      0 active
                    </span>
                  </div>
                  <div id="admin-chat-inbox-list" style={{"flex": "1", "overflowY": "auto", "maxHeight": "420px", "display": "flex", "flexDirection": "column", "gap": "8px"}}>
                    {/* Populated dynamically via renderAdminChatConsole */}
                  </div>
                </div>
                {/* Right Column: Active Thread & Modernized Cyber Tactical Reply Box */}
                <div style={{"background": "linear-gradient(145deg, #090e16 0%, #05080d 100%)", "border": "1px solid rgba(0, 229, 255, 0.25)", "boxShadow": "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)", "borderRadius": "12px", "padding": "16px", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
                  {/* Thread Header */}
                  <div id="admin-chat-thread-header" style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "paddingBottom": "12px", "borderBottom": "1px solid rgba(0, 229, 255, 0.15)", "marginBottom": "14px"}}>
                    <div>
                      <div style={{"display": "flex", "alignItems": "center", "gap": "8px", "marginBottom": "2px"}}>
                        <span style={{"display": "inline-flex", "alignItems": "center", "gap": "4px", "fontSize": "0.68rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "0.8px", "color": "#10b981", "background": "rgba(16, 185, 129, 0.12)", "border": "1px solid rgba(16, 185, 129, 0.35)", "padding": "2px 7px", "borderRadius": "4px"}}>
                          <span style={{"width": "6px", "height": "6px", "borderRadius": "50%", "background": "#10b981", "boxShadow": "0 0 6px #10b981"}}>
                          </span>
                           LIVE 2-WAY HUB
              
                        </span>
                        <span style={{"fontSize": "0.72rem", "color": "#64748b", "fontWeight": "600"}}>
                          SECURE INSTRUCTOR DOCK
                        </span>
                      </div>
                      <div id="admin-active-chat-name" style={{"fontFamily": "var(--font-display)", "fontSize": "1.22rem", "fontWeight": "900", "color": "#fff", "letterSpacing": "0.3px"}}>
                        
              Select a conversation to reply
            
                      </div>
                      <span id="admin-active-chat-phone" style={{"fontSize": "0.84rem", "color": "#38bdf8", "fontWeight": "700"}}>
                      </span>
                    </div>
                    <div id="admin-active-chat-actions" style={{"display": "none", "gap": "8px"}}>
                      <a id="admin-active-chat-call-btn" href="#" className="btn-spark" style={{"padding": "7px 16px", "fontSize": "0.82rem", "fontWeight": "800", "textDecoration": "none", "border": "1px solid #10b981", "background": "rgba(16, 185, 129, 0.12)", "color": "#10b981", "borderRadius": "6px", "boxShadow": "0 0 10px rgba(16, 185, 129, 0.25)", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
                        
              📞 Call Student
            
                      </a>
                    </div>
                  </div>
                  {/* Thread Messages Stream */}
                  <div id="admin-active-chat-stream" style={{"flex": "1", "minHeight": "260px", "maxHeight": "330px", "overflowY": "auto", "padding": "12px", "background": "rgba(10, 15, 23, 0.75)", "border": "1px solid rgba(255,255,255,0.06)", "borderRadius": "10px", "marginBottom": "14px", "display": "flex", "flexDirection": "column", "gap": "10px", "boxShadow": "inset 0 2px 8px rgba(0,0,0,0.4)"}}>
                    <div style={{"textAlign": "center", "color": "#64748b", "fontSize": "0.86rem", "padding": "48px 16px"}}>
                      <div style={{"fontSize": "1.8rem", "marginBottom": "10px", "opacity": "0.7"}}>
                        💬
                      </div>
                      <div style={{"fontWeight": "700", "color": "#cbd5e1", "marginBottom": "4px"}}>
                        Two-Way Student Live Dispatch
                      </div>
                      <div>
                        Select an incoming conversation from the left to view the encrypted transcript and dispatch replies directly to their browser.
                      </div>
                    </div>
                  </div>
                  {/* Instructor Live Reply Dock */}
                  <form id="adminLiveChatReplyForm" data-onsubmit="handleAdminLiveChatSend(event)" onSubmit={(e) => { e.preventDefault(); if (typeof window !== 'undefined' && (window as any).handleAdminLiveChatSend) (window as any).handleAdminLiveChatSend(e); }} style={{"display": "flex", "gap": "10px", "alignItems": "stretch", "background": "rgba(15, 23, 42, 0.6)", "border": "1px solid rgba(0, 229, 255, 0.25)", "borderRadius": "10px", "padding": "6px 8px", "boxShadow": "0 0 15px rgba(0, 229, 255, 0.08)"}}>
                    <textarea id="adminLiveChatReplyInput" placeholder="Dispatch live response to student as Coach Kai Wade... (Instant cloud relay)" rows={2} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (typeof window !== 'undefined' && (window as any).handleAdminLiveChatSend) (window as any).handleAdminLiveChatSend(e); } }} style={{"flex": "1", "background": "transparent", "border": "none", "padding": "8px 10px", "color": "#fff", "fontSize": "0.86rem", "resize": "none", "fontFamily": "inherit", "outline": "none"}} required={true}>
                    </textarea>
                    <button type="submit" id="adminLiveChatSendBtn" onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined' && (window as any).handleAdminLiveChatSend) (window as any).handleAdminLiveChatSend(e); }} className="btn-spark" style={{"padding": "0 20px", "fontSize": "0.86rem", "background": "linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)", "color": "#070b10", "border": "none", "borderRadius": "8px", "fontWeight": "900", "cursor": "pointer", "whiteSpace": "nowrap", "boxShadow": "0 0 14px rgba(0, 229, 255, 0.4)", "textTransform": "uppercase", "letterSpacing": "0.5px"}}>
                      
            Send Reply ⚡
          
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </section>
      {/* VIEW 3: DEDICATED COURSE ENROLLMENT & PREPARATION HUB */}
      <main className="panel hidden" id="view-booking" role="tabpanel">
        <div className="panel-header">
          <h3>
            Train With Confidence — Course Enrollment & Tuition
          </h3>
          <p>
            Maryland firearms training designed to build knowledge, safety, and confidence without intimidation.
          </p>
        </div>
        {/* Core Zero-Intimidation Promise */}
        <div style={{"background": "linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(13, 19, 27, 0.95) 100%)", "border": "1.5px solid rgba(0, 229, 255, 0.45)", "borderRadius": "16px", "padding": "24px 26px", "marginBottom": "28px", "boxShadow": "0 8px 30px rgba(0, 229, 255, 0.12)"}}>
          <div style={{"display": "flex", "alignItems": "center", "justifyContent": "space-between", "flexWrap": "wrap", "gap": "10px", "marginBottom": "12px", "borderBottom": "1px solid rgba(0, 229, 255, 0.2)", "paddingBottom": "10px"}}>
            <div style={{"display": "flex", "alignItems": "center", "gap": "10px"}}>
              <span style={{"fontSize": "1.8rem"}}>
                🛡️
              </span>
              <div>
                <span style={{"fontSize": "0.74rem", "fontWeight": "800", "color": "var(--accent-cyan)", "letterSpacing": "0.1em", "textTransform": "uppercase"}}>
                  Uncompromising Excellence
                </span>
                <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "margin": "0", "textTransform": "uppercase", "letterSpacing": "0.5px"}}>
                  The Future Initiative Firearm Services Promise
                </h3>
              </div>
            </div>
            <span style={{"background": "rgba(16, 185, 129, 0.15)", "border": "1px solid #10b981", "color": "#10b981", "fontSize": "0.75rem", "fontWeight": "800", "padding": "4px 10px", "borderRadius": "6px", "textTransform": "uppercase", "letterSpacing": "0.05em"}}>
              100% Student-First Mentorship
            </span>
          </div>
          <p style={{"fontSize": "0.98rem", "color": "#f1f5f9", "lineHeight": "1.7", "marginBottom": "18px", "fontWeight": "400"}}>
            
    We don't merely train you to discharge a firearm; we mentor you into a safe, decisively knowledgeable, thoroughly confident, and legally accountable protector. At Future Initiative Firearm Services, you never need prior shooting experience to step through our doors, you will never experience intimidation or ego on our firing line, and you do not need to have everything figured out before you arrive. Instructor Kai Wade meets every student exactly where they are.
  
          </p>
          <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(230px, 1fr))", "gap": "14px", "marginTop": "16px"}}>
            <div
              className="interactive-promise-card"
              data-onclick="openPromiseDetailModal('zero_intimidation')"
              onClick={() => { if (typeof window !== 'undefined' && (window as any).openPromiseDetailModal) (window as any).openPromiseDetailModal('zero_intimidation'); }}
              role="button"
              tabIndex={0}
              style={{"background": "rgba(7, 11, 16, 0.85)", "border": "1.5px solid rgba(0, 229, 255, 0.35)", "borderLeft": "4px solid var(--accent-cyan)", "borderRadius": "12px", "padding": "16px 18px", "cursor": "pointer", "transition": "all 0.25s ease"}}
            >
              <div style={{"fontFamily": "var(--font-display)", "fontSize": "0.96rem", "fontWeight": "700", "color": "#fff", "marginBottom": "6px", "display": "flex", "alignItems": "center", "justifyContent": "space-between"}}>
                <div style={{"display": "flex", "alignItems": "center", "gap": "6px"}}>
                  <span>🎯</span> Zero-Intimidation Mentorship
                </div>
                <span style={{"fontSize": "0.76rem", "color": "var(--accent-cyan)", "fontWeight": "800"}}>EXPLORE ↗</span>
              </div>
              <p style={{"fontSize": "0.82rem", "color": "#cbd5e1", "lineHeight": "1.5", "margin": "0"}}>
                From brand-new beginners holding a handgun for the first time to experienced shooters refining draw mechanics, every evolution is taught with patience, precision, and respect.
              </p>
              <div style={{"marginTop": "10px", "fontSize": "0.75rem", "color": "var(--accent-cyan)", "fontWeight": "700", "display": "flex", "alignItems": "center", "gap": "4px"}}>
                <span>Tap for detailed breakdown</span> <span>&rarr;</span>
              </div>
            </div>




            <div
              className="interactive-promise-card"
              data-onclick="openPromiseDetailModal('maryland_law')"
              onClick={() => { if (typeof window !== 'undefined' && (window as any).openPromiseDetailModal) (window as any).openPromiseDetailModal('maryland_law'); }}
              role="button"
              tabIndex={0}
              style={{"background": "rgba(7, 11, 16, 0.85)", "border": "1.5px solid rgba(245, 158, 11, 0.35)", "borderLeft": "4px solid var(--accent-amber)", "borderRadius": "12px", "padding": "16px 18px", "cursor": "pointer", "transition": "all 0.25s ease"}}
            >
              <div style={{"fontFamily": "var(--font-display)", "fontSize": "0.96rem", "fontWeight": "700", "color": "#fff", "marginBottom": "6px", "display": "flex", "alignItems": "center", "justifyContent": "space-between"}}>
                <div style={{"display": "flex", "alignItems": "center", "gap": "6px"}}>
                  <span>⚖️</span> Maryland Law &amp; Reality Mastery
                </div>
                <span style={{"fontSize": "0.76rem", "color": "var(--accent-amber)", "fontWeight": "800"}}>EXPLORE ↗</span>
              </div>
              <p style={{"fontSize": "0.82rem", "color": "#cbd5e1", "lineHeight": "1.5", "margin": "0"}}>
                Deep, street-level mastery of Maryland self-defense law, permissible concealed transport protocols, Castle Doctrine boundaries, and lawful shoot/no-shoot decision making.
              </p>
              <div style={{"marginTop": "10px", "fontSize": "0.75rem", "color": "var(--accent-amber)", "fontWeight": "700", "display": "flex", "alignItems": "center", "gap": "4px"}}>
                <span>Tap for detailed breakdown</span> <span>&rarr;</span>
              </div>
            </div>




            <div
              className="interactive-promise-card"
              data-onclick="openPromiseDetailModal('cindys_live_fire')"
              onClick={() => { if (typeof window !== 'undefined' && (window as any).openPromiseDetailModal) (window as any).openPromiseDetailModal('cindys_live_fire'); }}
              role="button"
              tabIndex={0}
              style={{"background": "rgba(7, 11, 16, 0.85)", "border": "1.5px solid rgba(16, 185, 129, 0.35)", "borderLeft": "4px solid #10b981", "borderRadius": "12px", "padding": "16px 18px", "cursor": "pointer", "transition": "all 0.25s ease"}}
            >
              <div style={{"fontFamily": "var(--font-display)", "fontSize": "0.96rem", "fontWeight": "700", "color": "#fff", "marginBottom": "6px", "display": "flex", "alignItems": "center", "justifyContent": "space-between"}}>
                <div style={{"display": "flex", "alignItems": "center", "gap": "6px"}}>
                  <span>💥</span> Live-Fire Qualification Ascendancy
                </div>
                <span style={{"fontSize": "0.76rem", "color": "#34d399", "fontWeight": "800"}}>EXPLORE ↗</span>
              </div>
              <p style={{"fontSize": "0.82rem", "color": "#cbd5e1", "lineHeight": "1.5", "margin": "0"}}>
                Hands-on live-fire training downrange at Cindy's Hot Shots in Glen Burnie. Real trigger time, recoil management, and practical Maryland State Police course-of-fire passing standards.
              </p>
              <div style={{"marginTop": "10px", "fontSize": "0.75rem", "color": "#34d399", "fontWeight": "700", "display": "flex", "alignItems": "center", "gap": "4px"}}>
                <span>Tap for detailed breakdown</span> <span>&rarr;</span>
              </div>
            </div>




            <div
              className="interactive-promise-card"
              data-onclick="openPromiseDetailModal('lifelong_access')"
              onClick={() => { if (typeof window !== 'undefined' && (window as any).openPromiseDetailModal) (window as any).openPromiseDetailModal('lifelong_access'); }}
              role="button"
              tabIndex={0}
              style={{"background": "rgba(7, 11, 16, 0.85)", "border": "1.5px solid rgba(168, 85, 247, 0.35)", "borderLeft": "4px solid #a855f7", "borderRadius": "12px", "padding": "16px 18px", "cursor": "pointer", "transition": "all 0.25s ease"}}
            >
              <div style={{"fontFamily": "var(--font-display)", "fontSize": "0.96rem", "fontWeight": "700", "color": "#fff", "marginBottom": "6px", "display": "flex", "alignItems": "center", "justifyContent": "space-between"}}>
                <div style={{"display": "flex", "alignItems": "center", "gap": "6px"}}>
                  <span>🤝</span> Lifelong Instructor Access
                </div>
                <span style={{"fontSize": "0.76rem", "color": "#c084fc", "fontWeight": "800"}}>EXPLORE ↗</span>
              </div>
              <p style={{"fontSize": "0.82rem", "color": "#cbd5e1", "lineHeight": "1.5", "margin": "0"}}>
                Graduation is just the start. You retain direct access to Instructor Kai Wade for firearm purchasing guidance, holster selection, permit renewal, and ongoing defensive training.
              </p>
              <div style={{"marginTop": "10px", "fontSize": "0.75rem", "color": "#c084fc", "fontWeight": "700", "display": "flex", "alignItems": "center", "gap": "4px"}}>
                <span>Tap for detailed breakdown</span> <span>&rarr;</span>
              </div>
            </div>
          </div>
        </div>
        {/* Training Pathways Selector */}
        <div className="pathway-selector-box">
          <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.25rem", "color": "#fff", "textAlign": "center"}}>
            Not sure where to begin? Choose your goal!
          </h4>
          <p style={{"fontSize": "0.85rem", "color": "var(--text-muted)", "textAlign": "center", "marginTop": "4px", "marginBottom": "16px"}}>
            
          Click any goal below to open an interactive breakdown and find the right path for your needs:
        
          </p>
          <div className="pathway-grid">
            <button className="pathway-pill" data-onclick="openGoalSynopsis('new_to_firearms', this)" title="Learn more about starting with HQL" type="button">
              <div className="pathway-intent">
                Brand New to Firearms
              </div>
              <div className="pathway-rec">
                Start Here: Information
              </div>
              <div className="pathway-cta">
                Learn More & Free 50-Q Guide →
              </div>
            </button>
            <button className="pathway-pill" data-onclick="openGoalSynopsis('want_to_purchase', this)" title="Learn more about buying a handgun" type="button">
              <div className="pathway-intent">
                Looking to Buy a Pistol
              </div>
              <div className="pathway-rec">
                Maryland HQL (Purchase License)
              </div>
              <div className="pathway-cta">
                Learn More →
              </div>
            </button>
            <button className="pathway-pill" data-onclick="openGoalSynopsis('want_to_carry', this)" title="Learn more about concealed carry" type="button">
              <div className="pathway-intent">
                I Want to Carry in Public
              </div>
              <div className="pathway-rec">
                Wear & Carry (CCW Permit)
              </div>
              <div className="pathway-cta">
                Learn More →
              </div>
            </button>
            <button className="pathway-pill" data-onclick="openGoalSynopsis('want_both', this)" title="Learn more about CCW &amp; HQL combo" type="button">
              <div className="pathway-intent">
                I Want Both: Buy & Carry
              </div>
              <div className="pathway-rec">
                CCW & HQL Combo (Best Value)
              </div>
              <div className="pathway-cta">
                Learn More & Compare →
              </div>
            </button>
            <button className="pathway-pill" data-onclick="openGoalSynopsis('personalized_focus', this)" title="Learn more about 1-on-1 private coaching" type="button">
              <div className="pathway-intent">
                Personalized / Anxiety Relief
              </div>
              <div className="pathway-rec">
                Private 1-on-1 Coaching
              </div>
              <div className="pathway-cta">
                Learn More →
              </div>
            </button>
            <button className="pathway-pill" data-onclick="openMultistateMasteryModal()" onClick={() => { if (typeof window !== "undefined" && (window as any).openMultistateMasteryModal) (window as any).openMultistateMasteryModal(); }} title="Learn more about multi-state carry" type="button">
              <div className="pathway-intent" style={{"color": "var(--accent-amber)"}}>
                Do I Need a Multi-State Permit?
              </div>
              <div className="pathway-rec">
                Mid-Atlantic Mastery (MD+VA+FL+AZ+PA)
              </div>
              <div className="pathway-cta">
                Learn More & Reciprocity Guide →
              </div>
            </button>
          </div>
        </div>
        {/* The 8-Step FIFS Journey */}
        <div style={{"marginBottom": "32px"}}>
          <div className="panel-header">
            <h3>
              Your 8-Step FIFS Journey <span className="neon-arrow-badge neon-mode-cyan" style={{"display": "inline-flex", "alignItems": "center", "gap": "6px", "padding": "4px 14px", "fontSize": "0.78rem", "fontWeight": "800", "letterSpacing": "1px", "textTransform": "uppercase", "verticalAlign": "middle", "marginLeft": "10px", "borderRadius": "50px", "background": "rgba(0, 229, 255, 0.14)", "border": "1px solid var(--accent-cyan)", "color": "#00e5ff", "boxShadow": "0 0 18px rgba(0, 229, 255, 0.45), inset 0 0 10px rgba(0, 229, 255, 0.2)", "cursor": "pointer"}} data-onclick="openStepDetailModal(1)" title="Click to explore the interactive 8-step journey"><span style={{"width": "7px", "height": "7px", "borderRadius": "50%", "background": "#00e5ff", "boxShadow": "0 0 8px #00e5ff"}}></span>Interactive</span>
            </h3>
            <p>
              From registration through state licensing, know exactly where you are in the process:
            </p>
          </div>
          <div className="journey-grid">
            <div className="j-card" data-onclick="openStepDetailModal(1)" style={{"cursor": "pointer", "transition": "all 0.25s ease"}} title="Click for Step 1 Infographic Breakdown">
              <div className="j-num">
                01
              </div>
              <div className="j-title">
                Register
              </div>
              <div className="j-desc">
                Initialize your online student dossier and obtain your Student ID.
              </div>
            </div>
            <div className="j-card" data-onclick="openStepDetailModal(2)" style={{"cursor": "pointer", "transition": "all 0.25s ease"}} title="Click for Step 2 Infographic Breakdown">
              <div className="j-num">
                02
              </div>
              <div className="j-title">
                Confirm
              </div>
              <div className="j-desc">
                Lock in your scheduled qualification shots at Cindy's Hot Shots.
              </div>
            </div>
            <div className="j-card" data-onclick="openStepDetailModal(3)" style={{"cursor": "pointer", "transition": "all 0.25s ease"}} title="Click for Step 3 Infographic Breakdown">
              <div className="j-num">
                03
              </div>
              <div className="j-title">
                Prepare
              </div>
              <div className="j-desc">
                Complete your readiness checklist inside your personal Student Portal.
              </div>
            </div>
            <div className="j-card" data-onclick="openStepDetailModal(4)" style={{"cursor": "pointer", "transition": "all 0.25s ease"}} title="Click for Step 4 Infographic Breakdown">
              <div className="j-num">
                04
              </div>
              <div className="j-title">
                Classroom
              </div>
              <div className="j-desc">
                Master Maryland self-defense law, safe storage, and firearm handling.
              </div>
            </div>
            <div className="j-card" data-onclick="openStepDetailModal(5)" style={{"cursor": "pointer", "transition": "all 0.25s ease"}} title="Click for Step 5 Infographic Breakdown">
              <div className="j-num">
                05
              </div>
              <div className="j-title">
                Live-Fire
              </div>
              <div className="j-desc">
                Diagnostic shooting drills and the official 25-round live-fire qualification.
              </div>
            </div>
            <div className="j-card" data-onclick="openStepDetailModal(6)" style={{"cursor": "pointer", "transition": "all 0.25s ease"}} title="Click for Step 6 Infographic Breakdown">
              <div className="j-num">
                06
              </div>
              <div className="j-title">
                Certificate
              </div>
              <div className="j-desc">
                Receive your official signed Maryland State Police Training Certificate.
              </div>
            </div>
            <div className="j-card" data-onclick="openStepDetailModal(7)" style={{"cursor": "pointer", "transition": "all 0.25s ease"}} title="Click for Step 7 Infographic Breakdown">
              <div className="j-num">
                07
              </div>
              <div className="j-title">
                MSP Portal
              </div>
              <div className="j-desc">
                Submit your state application with LiveScan fingerprints with zero errors.
              </div>
            </div>
            <div className="j-card" data-onclick="openStepDetailModal(8)" style={{"cursor": "pointer", "transition": "all 0.25s ease"}} title="Click for Step 8 Infographic Breakdown">
              <div className="j-num">
                08
              </div>
              <div className="j-title">
                Licensed
              </div>
              <div className="j-desc">
                Permit in hand! Continue your training with biennial renewals and clinics.
              </div>
            </div>
          </div>
        </div>
        {/* What to Bring & What to Expect Section */}
        <section style={{"marginBottom": "30px"}}>
          <div className="panel-header">
            <h3>
              What to Bring & What to Expect
            </h3>
            <p>
              Important guidelines to ensure your class day is smooth, safe, and stress-free. Click any section for detailed equipment standards and rental procedures.
            </p>
          </div>
          <div className="checklist-grid">
            <div className="checklist-box interactive-expect-card" onClick={() => { if (typeof window !== "undefined") { (window as any).openExpectationModal?.("handgun");  } }} data-onclick="openExpectationModal('handgun')" role="button" tabIndex={0} title="Click to view detailed handgun &amp; equipment breakdown">
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "marginBottom": "8px"}}>
                <h4 style={{"margin": "0"}}>
                  🔫 Handgun & Equipment
                </h4>
                <span className="expect-learn-tag">
                  Inspect Standards ↗
                </span>
              </div>
              <ul>
                <li>
                  <strong>
                    Do I need my own handgun?
                  </strong>
                   No! Rentals can be coordinated directly at Cindy's Hot Shots.
                </li>
                <li>
                  <strong>
                    Bringing your own firearm?
                  </strong>
                   Must be unloaded and secured in a locked case or trunk during transit.
                </li>
                <li>
                  <strong>
                    Holster (Wear & Carry):
                  </strong>
                   Rigid molded Kydex/leather holster covering trigger guard.
                </li>
              </ul>
              <div className="expect-click-cta">
                Click for Handgun, Holster & Rental Protocols →
              </div>
            </div>
            <div className="checklist-box interactive-expect-card" onClick={() => { if (typeof window !== "undefined" && (window as any).openExpectationModal) { (window as any).openExpectationModal("ammunition"); } }} data-onclick="openExpectationModal('ammunition')" role="button" tabIndex={0} title="Click to view ammunition rules &amp; zero-tolerance safety protocol">
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "marginBottom": "8px"}}>
                <h4 style={{"margin": "0"}}>
                  📦 Ammunition Protocol
                </h4>
                <span className="expect-learn-tag" style={{"color": "var(--accent-red)", "borderColor": "var(--accent-red)", "background": "rgba(239,68,68,0.12)"}}>
                  Safety Rule ↗
                </span>
              </div>
              <ul>
                <li>
                  <strong>
                    Quantity:
                  </strong>
                   50 to 100 rounds of factory brass target ammunition.
                </li>
                <li>
                  <strong>
                    STRICT ZERO-AMMUNITION CLASSROOM MANDATE:
                  </strong>
                   Absolutely zero live ammunition is permitted in the classroom. Ammunition must remain locked in your vehicle trunk until live-fire.
                </li>
              </ul>
              <div className="expect-click-cta" style={{"color": "var(--accent-amber)"}}>
                Click for Zero-Live-Ammo Policy & Caliber Guide →
              </div>
            </div>
            <div className="checklist-box interactive-expect-card" onClick={() => { if (typeof window !== "undefined" && (window as any).openExpectationModal) { (window as any).openExpectationModal("protection"); } }} data-onclick="openExpectationModal('protection')" role="button" tabIndex={0} title="Click to view eye and hearing protection standards">
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "marginBottom": "8px"}}>
                <h4 style={{"margin": "0"}}>
                  👓 Eye & Ear Protection
                </h4>
                <span className="expect-learn-tag">
                  Safety Gear ↗
                </span>
              </div>
              <ul>
                <li>
                  <strong>
                    Wrap-Around Glasses:
                  </strong>
                   ANSI Z87.1 certified eye protection with side deflection guards.
                </li>
                <li>
                  <strong>
                    Hearing Protection:
                  </strong>
                   Earmuffs or foam plugs (electronic noise-canceling earmuffs recommended).
                </li>
              </ul>
              <div className="expect-click-cta">
                Click for ANSI Z87.1 & Electronic Earmuff Specs →
              </div>
            </div>
            <div className="checklist-box interactive-expect-card" onClick={() => { if (typeof window !== "undefined") { (window as any).openExpectationModal?.("attire");  } }} data-onclick="openExpectationModal('attire')" role="button" tabIndex={0} title="Click to view dress code &amp; government identification requirements">
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "marginBottom": "8px"}}>
                <h4 style={{"margin": "0"}}>
                  👕 Attire & Documentation
                </h4>
                <span className="expect-learn-tag">
                  Dress Code & ID ↗
                </span>
              </div>
              <ul>
                <li>
                  <strong>
                    Clothing:
                  </strong>
                   Closed-toe shoes (no sandals), crew-neck high shirt, and sturdy 1.5" belt.
                </li>
                <li>
                  <strong>
                    ID:
                  </strong>
                   Government-issued photo ID (Driver's license or Military ID).
                </li>
              </ul>
              <div className="expect-click-cta">
                Click for Hot-Brass Safety & State ID Requirements →
              </div>
            </div>
          </div>
        </section>
        {/* Course Catalog & Transparent Pricing Section */}
        <div id="course-catalog-section" style={{"textAlign": "center", "margin": "36px 0 20px"}}>
          <span style={{"fontFamily": "var(--font-display)", "fontSize": "0.88rem", "fontWeight": "800", "color": "var(--accent-cyan)", "textTransform": "uppercase", "letterSpacing": "1.5px"}}>
            All-Inclusive & Self-Equipped Options
          </span>
          <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.95rem", "color": "#fff", "textTransform": "uppercase", "marginTop": "4px"}}>
            Course Catalog & Transparent Pricing
          </h3>
          <p style={{"fontSize": "0.92rem", "color": "var(--text-muted)", "maxWidth": "740px", "margin": "6px auto 0", "lineHeight": "1.55"}}>
            
          All courses display standard self-equipped Base Pricing by default. Toggle between 
            <strong>
              Standard Base
            </strong>
             and 
            <strong>
              👑 VIP Turnkey
            </strong>
             on any card to see exactly what is added!
        
          </p>
        </div>
        <div className="tuition-grid">
          {/* 1. Mid-Atlantic Multi-State Mastery (NEW FLAGSHIP) */}
          <div className="card-container" style={{"display": "flex", "flexDirection": "column", "alignItems": "stretch", "flex": "1", "height": "100%", "width": "100%"}}>
            <div className="tuition-card" id="card-course-mastery" style={{"border": "2px solid var(--accent-amber)", "height": "100%", "display": "flex", "flexDirection": "column", "justifyContent": "space-between", "alignItems": "stretch"}}>
            <div className="card-tier-badge" id="badge-course-mastery" style={{"display": "none", "background": "var(--accent-amber)", "color": "#070b10", "fontFamily": "var(--font-display)", "fontSize": "0.72rem", "fontWeight": "800", "padding": "2px 10px", "borderRadius": "20px", "textTransform": "uppercase", "position": "absolute", "top": "-10px", "right": "16px"}}>
              
            👑 VIP MODE
          
            </div>
            <span className="badge-pop" id="pop-course-mastery" style={{"background": "var(--accent-amber)", "color": "#070b10"}}>
              ⭐ FLAGSHIP MULTI-STATE
            </span>
            <div className="tuition-title" style={{"fontSize": "1.35rem", "color": "#fff"}}>
              Mid-Atlantic Multi-State Mastery
            </div>
            <div className="combo-savings-badge" style={{"background": "rgba(255, 183, 3, 0.15)", "border": "1px solid var(--accent-amber)", "color": "var(--accent-amber)", "fontFamily": "var(--font-display)", "fontSize": "0.85rem", "fontWeight": "800", "letterSpacing": "0.8px", "padding": "4px 10px", "borderRadius": "6px", "textTransform": "uppercase", "margin": "6px 0", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
              <span>
                ⭐
              </span>
               5-STATE EXPANSION (MD+VA+FL+AZ+PA) — 34+ STATES LEGAL CARRY
          
            </div>
            {/* Interactive Tier Toggle Switch */}
            <div className="tier-toggle-wrapper">
              <div className="tier-sliding-switch" id="switch-mastery" data-onclick="toggleCardTier('mastery', event)">
                <div className="tier-sliding-pill" id="slider-mastery">
                </div>
                <button className="tier-option-btn btn-base-side" id="tog-base-mastery" data-onclick="setCardTier('mastery', 'base', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('mastery', 'base', e); }} type="button" aria-label="Standard Mode">Standard</button>
                <button className="tier-option-btn btn-vip-side" id="tog-vip-mastery" data-onclick="setCardTier('mastery', 'vip', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('mastery', 'vip', e); }} type="button" aria-label="VIP Mode">👑</button>
              </div>
            </div>
            <div className="tuition-price" id="price-course-mastery">
              <span className="price-val" style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "fontWeight": "800", "color": "#fff"}}>$424.99</span>
              <span className="price-tier-tag" style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "fontWeight": "600", "marginLeft": "6px"}}>
                (Standard Base)
              </span>
            </div>
            <div className="tuition-desc" id="desc-course-mastery">
              Full 16-hour Maryland Wear & Carry qualification + application preparation for Virginia, Florida, Arizona, and Pennsylvania non-resident carry.
            </div>
            <div className="tuition-bullets" id="bullets-course-mastery">
              <div>
                ✔ 16-Hour Maryland State-Approved Class
              </div>
              <div>
                ✔ Practical Qualification Shots at Cindy's Hot Shots
              </div>
              <div>
                ✔ VA, FL, AZ Documentation & Affidavits
              </div>
              <div>
                ✔ PA $20 Non-Resident LTCF Roadmap
              </div>
            </div>
            <div className="vip-perks-box" id="vip-box-course-mastery" style={{"display": "none", "background": "rgba(0, 229, 255, 0.12)", "border": "1px solid var(--accent-cyan)", "borderRadius": "10px", "padding": "14px", "margin": "12px 0", "fontSize": "0.85rem", "color": "#e2e8f0", "lineHeight": "1.6", "textAlign": "left"}}>
              <strong style={{"color": "var(--accent-cyan)", "display": "block", "marginBottom": "6px", "fontFamily": "var(--font-display)", "fontSize": "1.05rem"}}>
                👑 What's Added in VIP Turnkey Mode:
              </strong>
              <div className="vip-perk-item" style={{"color": "var(--accent-amber)", "fontWeight": "700"}}>
                👑 Flexible Any-Day Scheduling (Sunday through Saturday Anytime — Standard is Weekend Only)
              </div>
              <div>
                👑 Range lane fee included at Cindy's Hot Shots (Save $25–$35)
              </div>
              <div>
                👑 Official B-27 practical qualification targets provided
              </div>
              <div>
                👑 Loaner 9mm semi-automatic handgun provided
              </div>
              <div>
                👑 50 rounds factory brass target ammunition included
              </div>
              <div>
                👑 On-site FD-258 fingerprint cards & 2x2 passport photos!
              </div>
              <div>
                👑 1-on-1 application dossier audit with Instructor Kai Wade
              </div>
            </div>
            <div style={{"marginTop": "14px"}}>
              <button className="btn-select-course" id="btn-select-course-mastery" onClick={() => { if (typeof window !== "undefined" && (window as any).selectCourse) (window as any).selectCourse("Mid-Atlantic Multi-State Mastery — Base Track ($424.99)"); }} data-onclick="selectCourse('Mid-Atlantic Multi-State Mastery — Base Track ($424.99)')" style={{"width": "100%", "padding": "12px", "fontFamily": "var(--font-display)", "fontSize": "1rem", "fontWeight": "800", "textTransform": "uppercase"}} type="button">
                
              Select Base ($424.99) & Reserve Seat →
            
              </button>
            </div>
          </div>
          </div>
          {/* 2. Maryland CCW & HQL Combo */}
          <div className="tuition-card highlight-combo" id="card-course-combo">
            <div className="card-tier-badge" id="badge-course-combo" style={{"display": "none", "background": "var(--accent-cyan)", "color": "#070b10", "fontFamily": "var(--font-display)", "fontSize": "0.72rem", "fontWeight": "800", "padding": "2px 10px", "borderRadius": "20px", "textTransform": "uppercase", "position": "absolute", "top": "-10px", "right": "16px"}}>
              
            👑 VIP MODE
          
            </div>
            <span className="badge-pop" id="pop-course-combo">
              🔥 MOST POPULAR COMBO
            </span>
            <div className="tuition-title" style={{"fontSize": "1.35rem", "color": "#fff"}}>
              CCW & HQL Combo
            </div>
            <div className="combo-savings-badge" style={{"background": "rgba(16, 185, 129, 0.15)", "border": "1px solid var(--accent-green)", "color": "#10b981", "fontFamily": "var(--font-display)", "fontSize": "0.85rem", "fontWeight": "800", "letterSpacing": "0.8px", "padding": "4px 10px", "borderRadius": "6px", "textTransform": "uppercase", "margin": "6px 0", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
              <span>
                💰
              </span>
               INCLUDES HQL TRAINING WAIVER — SAVE $100
          
            </div>
            <div className="tier-toggle-wrapper">
              <div className="tier-sliding-switch" id="switch-combo" data-onclick="toggleCardTier('combo', event)">
                <div className="tier-sliding-pill" id="slider-combo">
                </div>
                <button className="tier-option-btn btn-base-side" id="tog-base-combo" data-onclick="setCardTier('combo', 'base', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('combo', 'base', e); }} type="button" aria-label="Standard Mode">Standard</button>
                <button className="tier-option-btn btn-vip-side" id="tog-vip-combo" data-onclick="setCardTier('combo', 'vip', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('combo', 'vip', e); }} type="button" aria-label="VIP Mode">👑</button>
              </div>
            </div>
            <div className="tuition-price" id="price-course-combo">
              <span className="price-val" style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "fontWeight": "800", "color": "#fff"}}>
                $249.99
              </span>
              <span className="price-tier-tag" style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "fontWeight": "600", "marginLeft": "6px"}}>
                (Standard Base)
              </span>
            </div>
            <div className="tuition-desc" id="desc-course-combo">
              Comprehensive dual-licensing package meeting both purchase and carry training mandates in one weekend. Under Md. Public Safety § 5-117.1, completing Wear & Carry waives your HQL classroom training—saving you $100 over booking separately!
            </div>
            <div className="tuition-bullets" id="bullets-course-combo">
              <div>
                ✔ 16-Hour Wear & Carry Certification
              </div>
              <div>
                ✔ HQL Training Exemption Guide ($100 Savings Included)
              </div>
              <div>
                ✔ 25-Round Live-Fire Range Qualification
              </div>
              <div>
                ✔ Step-by-Step Filing for Both State Police Portals
              </div>
            </div>
            <div className="vip-perks-box" id="vip-box-course-combo" style={{"display": "none", "background": "rgba(0, 229, 255, 0.12)", "border": "1px solid var(--accent-cyan)", "borderRadius": "10px", "padding": "14px", "margin": "12px 0", "fontSize": "0.85rem", "color": "#e2e8f0", "lineHeight": "1.6", "textAlign": "left"}}>
              <strong style={{"color": "var(--accent-cyan)", "display": "block", "marginBottom": "6px", "fontFamily": "var(--font-display)", "fontSize": "1.05rem"}}>
                👑 What's Added in VIP Turnkey Mode:
              </strong>
              <div className="vip-perk-item" style={{"color": "var(--accent-amber)", "fontWeight": "700"}}>
                👑 Flexible Any-Day Scheduling (Sunday through Saturday Anytime — Standard is Weekend Only)
              </div>
              <div>
                👑 Cindy's Hot Shots range lane fee included (Save $25–$35)
              </div>
              <div>
                👑 Official B-27 qualification targets provided
              </div>
              <div>
                👑 Loaner 9mm handgun provided for live-fire evolution
              </div>
              <div>
                👑 50 rounds factory brass ammunition included
              </div>
              <div>
                👑 On-site passport-style photos taken & printed
              </div>
              <div>
                👑 Complete dual filing assistance for both CCW and HQL!
              </div>
            </div>
            <div style={{"marginTop": "14px"}}>
              <button className="btn-select-course" id="btn-select-course-combo" onClick={() => { if (typeof window !== "undefined" && (window as any).selectCourse) (window as any).selectCourse("Maryland CCW & HQL Combo — Base Track ($249.99)"); }} data-onclick="selectCourse('Maryland CCW &amp; HQL Combo — Base Track ($249.99)')" style={{"width": "100%", "padding": "12px", "fontFamily": "var(--font-display)", "fontSize": "1rem", "fontWeight": "800", "textTransform": "uppercase"}} type="button">
                
              Select Base ($199.99) & Reserve Seat →
            
              </button>
            </div>
          </div>
          {/* 3. Maryland Wear & Carry (16-Hr) */}
          <div className="tuition-card" id="card-course-ccw">
            <div className="card-tier-badge" id="badge-course-ccw" style={{"display": "none", "background": "var(--accent-cyan)", "color": "#070b10", "fontFamily": "var(--font-display)", "fontSize": "0.72rem", "fontWeight": "800", "padding": "2px 10px", "borderRadius": "20px", "textTransform": "uppercase", "position": "absolute", "top": "-10px", "right": "16px"}}>
              
            👑 VIP MODE
          
            </div>
            <div className="tuition-title" id="title-course-ccw">
              Maryland Wear & Carry
            </div>
            <div className="combo-savings-badge" style={{"background": "rgba(0, 229, 255, 0.15)", "border": "1px solid var(--accent-cyan)", "color": "#00e5ff", "fontFamily": "var(--font-display)", "fontSize": "0.85rem", "fontWeight": "800", "letterSpacing": "0.8px", "padding": "4px 10px", "borderRadius": "6px", "textTransform": "uppercase", "margin": "6px 0", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
              <span>
                🛡️
              </span>
               FULL MARYLAND CCW — YES, MARYLAND REALLY HAS A SELF-DEFENSE LAW
          
            </div>
            <div className="tier-toggle-wrapper">
              <div className="tier-sliding-switch" id="switch-ccw" data-onclick="toggleCardTier('ccw', event)">
                <div className="tier-sliding-pill" id="slider-ccw">
                </div>
                <button className="tier-option-btn btn-base-side" id="tog-base-ccw" data-onclick="setCardTier('ccw', 'base', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('ccw', 'base', e); }} type="button" aria-label="Standard Mode">Standard</button>
                <button className="tier-option-btn btn-vip-side" id="tog-vip-ccw" data-onclick="setCardTier('ccw', 'vip', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('ccw', 'vip', e); }} type="button" aria-label="VIP Mode">👑</button>
              </div>
            </div>
            <div className="tuition-price" id="price-course-ccw">
              <span className="price-val" style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "fontWeight": "800", "color": "#fff"}}>$199.99</span>
              <span className="price-tier-tag" style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "fontWeight": "600", "marginLeft": "6px"}}>
                (Standard Base)
              </span>
            </div>
            <div className="tuition-desc" id="desc-course-ccw">
              Full Wear & Carry certification. In-depth legal curriculum (State v. Faulkner, SB 1), and 25-round practical qualification.
            </div>
            <div className="tuition-bullets" id="bullets-course-ccw">
              <div>
                ✔ 16-Hour In-Person Training Mandate
              </div>
              <div>
                ✔ Faulkner Self-Defense & Castle Doctrine
              </div>
              <div>
                ✔ Certified MSP Form 29-14 Score Sheet
              </div>
            </div>
            <div className="vip-perks-box" id="vip-box-course-ccw" style={{"display": "none", "background": "rgba(0, 229, 255, 0.12)", "border": "1px solid var(--accent-cyan)", "borderRadius": "10px", "padding": "14px", "margin": "12px 0", "fontSize": "0.85rem", "color": "#e2e8f0", "lineHeight": "1.6", "textAlign": "left"}}>
              <strong style={{"color": "var(--accent-cyan)", "display": "block", "marginBottom": "6px", "fontFamily": "var(--font-display)", "fontSize": "1.05rem"}}>
                👑 What's Added in VIP Turnkey Mode:
              </strong>
              <div className="vip-perk-item" style={{"color": "var(--accent-amber)", "fontWeight": "700"}}>
                👑 Flexible Any-Day Scheduling (Sunday through Saturday Anytime — Standard is Weekend Only)
              </div>
              <div>
                👑 Cindy's Hot Shots range lane fee included (Save $25–$35)
              </div>
              <div>
                👑 Official B-27 qualification targets provided
              </div>
              <div>
                👑 Loaner 9mm handgun provided
              </div>
              <div>
                👑 50 rounds factory target ammunition included
              </div>
              <div>
                👑 On-site passport photos taken & printed!
              </div>
            </div>
            <div style={{"marginTop": "14px"}}>
              <button className="btn-select-course" id="btn-select-course-ccw" onClick={() => { if (typeof window !== "undefined" && (window as any).selectCourse) (window as any).selectCourse("Maryland Wear & Carry (CCW) — Base Track ($199.99)"); }} data-onclick="selectCourse('Maryland Wear & Carry (CCW) — Base Track ($199.99)')" style={{"width": "100%", "padding": "12px", "fontFamily": "var(--font-display)", "fontSize": "1rem", "fontWeight": "800", "textTransform": "uppercase"}} type="button">
                
              Select Base ($199.99) & Reserve Seat →
            
              </button>
            </div>
          </div>
          {/* 4. Maryland HQL (4-Hour) */}
          {/* 4. Maryland Wear & Carry (8-Hour Renewal) Dedicated Card */}
          <div className="tuition-card" id="card-course-renewal" style={{"position": "relative"}}>
            <div className="card-tier-badge" id="badge-course-renewal" style={{"display": "none", "background": "var(--accent-amber)", "color": "#070b10", "fontFamily": "var(--font-display)", "fontSize": "0.72rem", "fontWeight": "800", "padding": "2px 10px", "borderRadius": "20px", "textTransform": "uppercase", "position": "absolute", "top": "-10px", "right": "16px"}}>
              👑 VIP MODE
            </div>
            <span className="badge-pop" style={{"background": "rgba(0, 229, 255, 0.15)", "color": "var(--accent-cyan)", "border": "1px solid var(--accent-cyan)"}}>
              ⏱️ 8-HOUR BIENNIAL RECERTIFICATION
            </span>
            <h3 id="title-course-renewal" style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "margin": "10px 0 6px", "color": "#fff"}}>
              Maryland Wear &amp; Carry (8-Hour Renewal)
            </h3>
            <div className="tier-toggle-wrapper">
              <div className="tier-sliding-switch" id="switch-renewal" data-onclick="toggleCardTier('renewal', event)">
                <div className="tier-sliding-pill" id="slider-renewal">
                </div>
                <button className="tier-option-btn btn-base-side" id="tog-base-renewal" data-onclick="setCardTier('renewal', 'base', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('renewal', 'base', e); }} type="button" aria-label="Standard Mode">Standard</button>
                <button className="tier-option-btn btn-vip-side" id="tog-vip-renewal" data-onclick="setCardTier('renewal', 'vip', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('renewal', 'vip', e); }} type="button" aria-label="VIP Mode">👑</button>
              </div>
            </div>
            <div className="tuition-price" id="price-course-renewal">
              <span className="price-val" style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "fontWeight": "800", "color": "#fff"}}>
                $149.99
              </span>
              <span className="price-tier-tag" style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "fontWeight": "600", "marginLeft": "6px"}}>
                (Standard Base)
              </span>
            </div>
            <div className="tuition-desc" id="desc-course-renewal">
              State-mandated 8-hour classroom recertification + 25-round Maryland practical shooting qualification. Complete before permit expiration to prevent licensing lapse.
            </div>
            <div className="tuition-bullets" id="bullets-course-renewal">
              <div>
                ✔ 8-Hour State-Approved Recertification Curriculum
              </div>
              <div>
                ✔ State v. Faulkner &amp; SB 1 Legal Updates
              </div>
              <div>
                ✔ 25-Round Live-Fire Qualification at Cindy&#39;s Hot Shots
              </div>
              <div>
                ✔ Official Signed MSP Form 29-14 Scoresheet Provided
              </div>
            </div>
            <div className="vip-perks-box" id="vip-box-course-renewal" style={{"display": "none", "background": "rgba(0, 229, 255, 0.12)", "border": "1px solid var(--accent-cyan)", "borderRadius": "10px", "padding": "14px", "margin": "12px 0", "fontSize": "0.85rem", "color": "#e2e8f0", "lineHeight": "1.6", "textAlign": "left"}}>
              <strong style={{"color": "var(--accent-cyan)", "display": "block", "marginBottom": "6px", "fontFamily": "var(--font-display)", "fontSize": "1.05rem"}}>
                👑 What&#39;s Added in VIP Turnkey Mode:
              </strong>
              <div className="vip-perk-item" style={{"color": "var(--accent-amber)", "fontWeight": "700"}}>
                👑 Flexible Any-Day Scheduling (Weekday &amp; Weekend Priority)
              </div>
              <div>
                👑 Cindy&#39;s Hot Shots range lane fee included (Save $25–$35)
              </div>
              <div>
                👑 Loaner 9mm semi-automatic handgun provided
              </div>
              <div>
                👑 50 rounds factory target ammunition included
              </div>
              <div>
                👑 B-27 practical qualification targets provided
              </div>
              <div>
                👑 1-on-1 MSP Licensing Portal renewal filing review
              </div>
            </div>
            <div style={{"marginTop": "14px"}}>
              <button className="btn-select-course" id="btn-select-course-renewal" onClick={() => { if (typeof window !== "undefined" && (window as any).selectCourse) (window as any).selectCourse("Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)"); }} data-onclick="selectCourse('Maryland Wear &amp; Carry (8-Hour Renewal) — Base Track ($149.99)')" style={{"width": "100%", "padding": "12px", "fontFamily": "var(--font-display)", "fontSize": "1rem", "fontWeight": "800", "textTransform": "uppercase"}} type="button">
                Select Base ($149.99) &amp; Reserve Seat →
              </button>
            </div>
          </div>
          <div className="tuition-card" id="card-course-hql">
            <div className="card-tier-badge" id="badge-course-hql" style={{"display": "none", "background": "var(--accent-cyan)", "color": "#070b10", "fontFamily": "var(--font-display)", "fontSize": "0.72rem", "fontWeight": "800", "padding": "2px 10px", "borderRadius": "20px", "textTransform": "uppercase", "position": "absolute", "top": "-10px", "right": "16px"}}>
              
            👑 VIP MODE
          
            </div>
            <div className="tuition-title" id="title-course-hql">
              Maryland HQL
            </div>
            <div className="combo-savings-badge" style={{"background": "rgba(192, 132, 252, 0.15)", "border": "1px solid #c084fc", "color": "#c084fc", "fontFamily": "var(--font-display)", "fontSize": "0.85rem", "fontWeight": "800", "letterSpacing": "0.8px", "padding": "4px 10px", "borderRadius": "6px", "textTransform": "uppercase", "margin": "6px 0", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
              <span>
                🔫
              </span>
               STATE PURCHASE PREREQUISITE — FAST 4-HR LIVE-FIRE QUALIFICATION
          
            </div>
            <div className="tier-toggle-wrapper">
              <div className="tier-sliding-switch" id="switch-hql" data-onclick="toggleCardTier('hql', event)">
                <div className="tier-sliding-pill" id="slider-hql">
                </div>
                <button className="tier-option-btn btn-base-side" id="tog-base-hql" data-onclick="setCardTier('hql', 'base', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('hql', 'base', e); }} type="button" aria-label="Standard Mode">Standard</button>
                <button className="tier-option-btn btn-vip-side" id="tog-vip-hql" data-onclick="setCardTier('hql', 'vip', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('hql', 'vip', e); }} type="button" aria-label="VIP Mode">👑</button>
              </div>
            </div>
            <div className="tuition-price" id="price-course-hql">
              <span className="price-val" style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "fontWeight": "800", "color": "#fff"}}>
                $100.00
              </span>
              <span className="price-tier-tag" style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "fontWeight": "600", "marginLeft": "6px"}}>
                (Standard Base)
              </span>
            </div>
            <div className="tuition-desc" id="desc-course-hql">
              State prerequisite for handgun purchase. Covers safe firearm handling, home storage compliance (Jaelynn's Law), and live-fire orientation.
            </div>
            <div className="tuition-bullets" id="bullets-course-hql">
              <div>
                ✔ State-Mandated Purchase Prerequisite
              </div>
              <div>
                ✔ Safe Handling & Jaelynn's Law Storage
              </div>
              <div>
                ✔ Live-Fire Verification Component
              </div>
            </div>
            <div className="vip-perks-box" id="vip-box-course-hql" style={{"display": "none", "background": "rgba(0, 229, 255, 0.12)", "border": "1px solid var(--accent-cyan)", "borderRadius": "10px", "padding": "14px", "margin": "12px 0", "fontSize": "0.85rem", "color": "#e2e8f0", "lineHeight": "1.6", "textAlign": "left"}}>
              <strong style={{"color": "var(--accent-cyan)", "display": "block", "marginBottom": "6px", "fontFamily": "var(--font-display)", "fontSize": "1.05rem"}}>
                👑 What's Added in VIP Turnkey Mode:
              </strong>
              <div className="vip-perk-item" style={{"color": "var(--accent-amber)", "fontWeight": "700"}}>
                👑 Flexible Any-Day Scheduling (Sunday through Saturday Anytime — Standard is Weekend Only)
              </div>
              <div>
                👑 Range fee included at Cindy's Hot Shots
              </div>
              <div>
                👑 Loaner handgun provided for live-fire verification
              </div>
              <div>
                👑 Qualifying ammunition included
              </div>
              <div>
                👑 Target provided
              </div>
              <div>
                👑 MSP 77R portal account setup & submission guidance!
              </div>
            </div>
            <div style={{"marginTop": "14px"}}>
              <button className="btn-select-course" id="btn-select-course-hql" onClick={() => { if (typeof window !== "undefined" && (window as any).selectCourse) (window as any).selectCourse("Maryland HQL (Purchase License) — Base Track ($100.00)"); }} data-onclick="selectCourse('Maryland HQL (Purchase License) — Base Track ($100.00)')" style={{"width": "100%", "padding": "12px", "fontFamily": "var(--font-display)", "fontSize": "1rem", "fontWeight": "800", "textTransform": "uppercase"}} type="button">
                
              Select Base ($100.00) & Reserve Seat →
            
              </button>
            </div>
          </div>
          {/* 5. Personal 1-on-1 Coaching */}
          <div className="tuition-card" id="card-course-coaching">
            <div className="card-tier-badge" id="badge-course-coaching" style={{"display": "none", "background": "var(--accent-cyan)", "color": "#070b10", "fontFamily": "var(--font-display)", "fontSize": "0.72rem", "fontWeight": "800", "padding": "2px 10px", "borderRadius": "20px", "textTransform": "uppercase", "position": "absolute", "top": "-10px", "right": "16px"}}>
              
            👑 VIP MODE
          
            </div>
            <div className="tuition-title" id="title-course-coaching">
              Personal 1-on-1 Coaching
            </div>
            <div className="combo-savings-badge" style={{"background": "rgba(56, 189, 248, 0.15)", "border": "1px solid #38bdf8", "color": "#38bdf8", "fontFamily": "var(--font-display)", "fontSize": "0.85rem", "fontWeight": "800", "letterSpacing": "0.8px", "padding": "4px 10px", "borderRadius": "6px", "textTransform": "uppercase", "margin": "6px 0", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
              <span>
                🎯
              </span>
               100% PRIVATE DIAGNOSTICS — MANTISX SENSOR TELEMETRY & ANXIETY RELIEF
          
            </div>
            <div className="tier-toggle-wrapper">
              <div className="tier-sliding-switch" id="switch-coaching" data-onclick="toggleCardTier('coaching', event)">
                <div className="tier-sliding-pill" id="slider-coaching">
                </div>
                <button className="tier-option-btn btn-base-side" id="tog-base-coaching" data-onclick="setCardTier('coaching', 'base', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('coaching', 'base', e); }} type="button" aria-label="Standard Mode">Standard</button>
                <button className="tier-option-btn btn-vip-side" id="tog-vip-coaching" data-onclick="setCardTier('coaching', 'vip', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('coaching', 'vip', e); }} type="button" aria-label="VIP Mode">👑</button>
              </div>
            </div>
            <div className="tuition-price" id="price-course-coaching">
              <span className="price-val" style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "fontWeight": "800", "color": "#fff"}}>
                $125.00
              </span>
              <span className="price-tier-tag" style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "fontWeight": "600", "marginLeft": "6px"}}>
                / hr (Standard Base)
              </span>
            </div>
            <div className="tuition-desc" id="desc-course-coaching">
              Dedicated private coaching. Diagnostic marksmanship, trigger reset mechanics, and holster draw cadence.
            </div>
            <div className="tuition-bullets" id="bullets-course-coaching">
              <div>
                ✔ Tailored 1-on-1 Instruction with Kai Wade
              </div>
              <div>
                ✔ Diagnostic Sensor Telemetry (MantisX)
              </div>
              <div>
                ✔ Flinch Correction & Recoil Management
              </div>
            </div>
            <div className="vip-perks-box" id="vip-box-course-coaching" style={{"display": "none", "background": "rgba(0, 229, 255, 0.12)", "border": "1px solid var(--accent-cyan)", "borderRadius": "10px", "padding": "14px", "margin": "12px 0", "fontSize": "0.85rem", "color": "#e2e8f0", "lineHeight": "1.6", "textAlign": "left"}}>
              <strong style={{"color": "var(--accent-cyan)", "display": "block", "marginBottom": "6px", "fontFamily": "var(--font-display)", "fontSize": "1.05rem"}}>
                👑 What's Added in VIP Turnkey Mode:
              </strong>
              <div className="vip-perk-item" style={{"color": "var(--accent-amber)", "fontWeight": "700"}}>
                👑 Flexible Any-Day Scheduling (Sunday through Saturday Anytime — Standard is Weekend Only)
              </div>
              <div>
                👑 Private lane reservation fee included
              </div>
              <div>
                👑 Diagnostic sensor telemetry (MantisX live analysis)
              </div>
              <div>
                👑 Access to premium loaner handguns (SIG, Glock, etc.)
              </div>
              <div>
                👑 Training ammunition provided
              </div>
              <div>
                👑 High-speed video trigger stroke analysis!
              </div>
            </div>
            <div style={{"marginTop": "14px"}}>
              <button className="btn-select-course" id="btn-select-course-coaching" onClick={() => { if (typeof window !== "undefined" && (window as any).selectCourse) (window as any).selectCourse("Personal 1-on-1 Coaching — Base Track ($125.00/hr)"); }} data-onclick="selectCourse('Personal 1-on-1 Coaching — Base Track ($125.00/hr)')" style={{"width": "100%", "padding": "12px", "fontFamily": "var(--font-display)", "fontSize": "1rem", "fontWeight": "800", "textTransform": "uppercase"}} type="button">
                
              Select Base ($125/hr) & Reserve Seat →
            
              </button>
            </div>
          </div>
          {/* 6. Gun Cleaning Class */}
          <div className="tuition-card" id="card-course-cleaning">
            <div className="card-tier-badge" id="badge-course-cleaning" style={{"display": "none", "background": "var(--accent-cyan)", "color": "#070b10", "fontFamily": "var(--font-display)", "fontSize": "0.72rem", "fontWeight": "800", "padding": "2px 10px", "borderRadius": "20px", "textTransform": "uppercase", "position": "absolute", "top": "-10px", "right": "16px"}}>
              
            👑 VIP MODE
          
            </div>
            <div className="tuition-title" id="title-course-cleaning">
              Gun Cleaning Class
            </div>
            <div className="combo-savings-badge" style={{"background": "rgba(251, 146, 60, 0.15)", "border": "1px solid #fb923c", "color": "#fb923c", "fontFamily": "var(--font-display)", "fontSize": "0.85rem", "fontWeight": "800", "letterSpacing": "0.8px", "padding": "4px 10px", "borderRadius": "6px", "textTransform": "uppercase", "margin": "6px 0", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
              <span>
                🔧
              </span>
               HANDS-ON WORKSHOP — FIELD-STRIP & 8-POINT MECHANICAL SAFETY AUDIT
          
            </div>
            <div className="tier-toggle-wrapper">
              <div className="tier-sliding-switch" id="switch-cleaning" data-onclick="toggleCardTier('cleaning', event)">
                <div className="tier-sliding-pill" id="slider-cleaning">
                </div>
                <button className="tier-option-btn btn-base-side" id="tog-base-cleaning" data-onclick="setCardTier('cleaning', 'base', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('cleaning', 'base', e); }} type="button" aria-label="Standard Mode">Standard</button>
                <button className="tier-option-btn btn-vip-side" id="tog-vip-cleaning" data-onclick="setCardTier('cleaning', 'vip', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('cleaning', 'vip', e); }} type="button" aria-label="VIP Mode">👑</button>
              </div>
            </div>
            <div className="tuition-price" id="price-course-cleaning">
              <span className="price-val" style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "fontWeight": "800", "color": "#fff"}}>
                $75.00
              </span>
              <span className="price-tier-tag" style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "fontWeight": "600", "marginLeft": "6px"}}>
                (Standard Base)
              </span>
            </div>
            <div className="tuition-desc" id="desc-course-cleaning">
              Field-stripping, ultrasonic inspection methods, lubrication points, and mechanical safety function checks.
            </div>
            <div className="tuition-bullets" id="bullets-course-cleaning">
              <div>
                ✔ Complete Field Strip & Reassembly
              </div>
              <div>
                ✔ Proper Solvent & Lubricant Application
              </div>
              <div>
                ✔ 8-Step Mechanical Safety Function Check
              </div>
            </div>
            <div className="vip-perks-box" id="vip-box-course-cleaning" style={{"display": "none", "background": "rgba(0, 229, 255, 0.12)", "border": "1px solid var(--accent-cyan)", "borderRadius": "10px", "padding": "14px", "margin": "12px 0", "fontSize": "0.85rem", "color": "#e2e8f0", "lineHeight": "1.6", "textAlign": "left"}}>
              <strong style={{"color": "var(--accent-cyan)", "display": "block", "marginBottom": "6px", "fontFamily": "var(--font-display)", "fontSize": "1.05rem"}}>
                👑 What's Added in VIP Turnkey Mode:
              </strong>
              <div className="vip-perk-item" style={{"color": "var(--accent-amber)", "fontWeight": "700"}}>
                👑 Flexible Any-Day Scheduling (Sunday through Saturday Anytime — Standard is Weekend Only)
              </div>
              <div>
                👑 Complete premium multi-caliber cleaning kit to take home
              </div>
              <div>
                👑 Specialized bore solvents and advanced CLP lubricants
              </div>
              <div>
                👑 Ultrasonic deep cleaning treatment for slide & barrel
              </div>
              <div>
                👑 Comprehensive 8-point mechanical function check!
              </div>
            </div>
            <div style={{"marginTop": "14px"}}>
              <button className="btn-select-course" id="btn-select-course-cleaning" onClick={() => { if (typeof window !== "undefined" && (window as any).selectCourse) (window as any).selectCourse("Gun Cleaning & Maintenance — Base Track ($75.00)"); }} data-onclick="selectCourse('Gun Cleaning &amp; Maintenance — Base Track ($75.00)')" style={{"width": "100%", "padding": "12px", "fontFamily": "var(--font-display)", "fontSize": "1rem", "fontWeight": "800", "textTransform": "uppercase"}} type="button">
                
              Select Base ($75.00) & Reserve Seat →
            
              </button>
            </div>
          </div>
          {/* 7. Children's Safety Class */}
          <div className="tuition-card" id="card-course-children">
            <div className="card-tier-badge" id="badge-course-children" style={{"display": "none", "background": "var(--accent-cyan)", "color": "#070b10", "fontFamily": "var(--font-display)", "fontSize": "0.72rem", "fontWeight": "800", "padding": "2px 10px", "borderRadius": "20px", "textTransform": "uppercase", "position": "absolute", "top": "-10px", "right": "16px"}}>
              
            👑 VIP MODE
          
            </div>
            <div className="tuition-title" id="title-course-children">
              Children's Safety Class
            </div>
            <div className="combo-savings-badge" style={{"background": "rgba(244, 63, 94, 0.15)", "border": "1px solid #f43f5e", "color": "#f43f5e", "fontFamily": "var(--font-display)", "fontSize": "0.85rem", "fontWeight": "800", "letterSpacing": "0.8px", "padding": "4px 10px", "borderRadius": "6px", "textTransform": "uppercase", "margin": "6px 0", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
              <span>
                👨‍👩‍👧
              </span>
               EDDIE EAGLE ACCIDENT PREVENTION — HOME STORAGE SAFETY COVENANT
          
            </div>
            <div className="tier-toggle-wrapper">
              <div className="tier-sliding-switch" id="switch-children" data-onclick="toggleCardTier('children', event)">
                <div className="tier-sliding-pill" id="slider-children">
                </div>
                <button className="tier-option-btn btn-base-side" id="tog-base-children" data-onclick="setCardTier('children', 'base', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('children', 'base', e); }} type="button" aria-label="Standard Mode">Standard</button>
                <button className="tier-option-btn btn-vip-side" id="tog-vip-children" data-onclick="setCardTier('children', 'vip', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('children', 'vip', e); }} type="button" aria-label="VIP Mode">👑</button>
              </div>
            </div>
            <div className="tuition-price" id="price-course-children">
              <span className="price-val" style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "fontWeight": "800", "color": "#fff"}}>
                $199.99
              </span>
              <span className="price-tier-tag" style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "fontWeight": "600", "marginLeft": "6px"}}>
                (Standard Base)
              </span>
            </div>
            <div className="tuition-desc" id="desc-course-children">
              
            Comprehensive youth accident prevention and family home defense covenant based on NRA Eddie Eagle principles. Teaches children age-appropriate reaction protocols if an unsecured firearm is encountered, coupled with parent-guided safe storage demonstrations and biometric lock fitting in accordance with Maryland Jaelynn's Law.
          
            </div>
            <div className="tuition-bullets" id="bullets-course-children">
              <div>
                ✔ Eddie Eagle 4-Step Safety Rules (Stop, Don't Touch, Run Away, Tell a Grown-Up)
              </div>
              <div>
                ✔ Home Safe Storage Orientation & Trigger Lock Fitting (Jaelynn's Law compliance)
              </div>
              <div>
                ✔ Parent-Child Defensive Safety Covenant & Hands-Off Demystification
              </div>
              <div>
                ✔ Real-World Hazard Avoidance, School Safety & Peer Pressure De-Escalation
              </div>
            </div>
            <div className="vip-perks-box" id="vip-box-course-children" style={{"display": "none", "background": "rgba(0, 229, 255, 0.12)", "border": "1px solid var(--accent-cyan)", "borderRadius": "10px", "padding": "14px", "margin": "12px 0", "fontSize": "0.85rem", "color": "#e2e8f0", "lineHeight": "1.6", "textAlign": "left"}}>
              <strong style={{"color": "var(--accent-cyan)", "display": "block", "marginBottom": "6px", "fontFamily": "var(--font-display)", "fontSize": "1.05rem"}}>
                👑 What's Added in VIP Turnkey Mode:
              </strong>
              <div className="vip-perk-item" style={{"color": "var(--accent-amber)", "fontWeight": "700"}}>
                👑 Flexible Any-Day Scheduling (Sunday through Saturday Anytime — Standard is Weekend Only)
              </div>
              <div>
                👑 Certified heavy-duty cable gun locks to take home
              </div>
              <div>
                👑 Youth safe-handling activity workbook packet
              </div>
              <div>
                👑 Safe storage demonstration for parents
              </div>
              <div>
                👑 Official Certificate of Completion for student!
              </div>
            </div>
            <div style={{"marginTop": "14px"}}>
              <button className="btn-select-course" id="btn-select-course-children" onClick={() => { if (typeof window !== "undefined" && (window as any).selectCourse) (window as any).selectCourse("Children's Safety Class — Base Track ($199.99)"); }} data-onclick="selectCourse('Children\'s Safety Class — Base Track ($199.99)')" style={{"width": "100%", "padding": "12px", "fontFamily": "var(--font-display)", "fontSize": "1rem", "fontWeight": "800", "textTransform": "uppercase"}} type="button">
                
              Select Base ($199.99) & Reserve Seat →
            
              </button>
            </div>
          </div>
          {/* Properly closes card-course-children */}
          {/* 8. FIFS Graduate Alumni Marksmanship Clinic (Standalone Sibling Card) */}
          {/* 8. FIFS Graduate Alumni Marksmanship Clinic (Base $65 / VIP $115) */}
          <div className="tuition-card" id="card-course-alumni" style={{"position": "relative"}}>
            <div className="card-tier-badge" id="badge-course-alumni" style={{"display": "none", "background": "var(--accent-cyan)", "color": "#070b10", "fontFamily": "var(--font-display)", "fontSize": "0.72rem", "fontWeight": "800", "padding": "2px 10px", "borderRadius": "20px", "textTransform": "uppercase", "position": "absolute", "top": "-10px", "right": "16px"}}>
              
            👑 VIP MODE
          
            </div>
            <span className="badge-pop" style={{"background": "#0284c7", "color": "#fff"}}>
              🎯 ALUMNI EXCLUSIVE CLINIC
            </span>
            <div className="tuition-title" style={{"fontSize": "1.35rem", "color": "#fff"}}>
              FIFS Graduate Alumni Marksmanship Clinic
            </div>
            <div className="combo-savings-badge" style={{"background": "rgba(56, 189, 248, 0.15)", "border": "1px solid #38bdf8", "color": "#38bdf8", "fontFamily": "var(--font-display)", "fontSize": "0.85rem", "fontWeight": "800", "letterSpacing": "0.8px", "padding": "4px 10px", "borderRadius": "6px", "textTransform": "uppercase", "margin": "6px 0", "display": "inline-flex", "alignItems": "center", "gap": "6px"}}>
              <span>
                🎯
              </span>
               2-HOUR DIAGNOSTIC WORKSHOP — HOLSTER DRAW & MALFUNCTION CLEARANCE
          
            </div>
            <div className="tier-toggle-wrapper">
              <div className="tier-sliding-switch" id="switch-alumni" data-onclick="toggleCardTier('alumni', event)">
                <div className="tier-sliding-pill" id="slider-alumni">
                </div>
                <button className="tier-option-btn btn-base-side" id="tog-base-alumni" data-onclick="setCardTier('alumni', 'base', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('alumni', 'base', e); }} type="button" aria-label="Standard Mode">Standard</button>
                <button className="tier-option-btn btn-vip-side" id="tog-vip-alumni" data-onclick="setCardTier('alumni', 'vip', event)" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined' && window.setCardTier) window.setCardTier('alumni', 'vip', e); }} type="button" aria-label="VIP Mode">👑</button>
              </div>
            </div>
            <div className="tuition-price" id="price-course-alumni">
              <span className="price-val" style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "fontWeight": "800", "color": "#fff"}}>
                $65.00
              </span>
              <span className="price-tier-tag" style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "fontWeight": "600", "marginLeft": "6px"}}>
                (Standard Base)
              </span>
            </div>
            <div className="tuition-desc" id="desc-course-alumni">
              
            Designed exclusively for Wear & Carry graduates and permit holders to maintain peak defensive readiness between biennial renewal windows. Fast-paced diagnostic shooting on the line at Cindy's Hot Shots.
          
            </div>
            <div className="tuition-bullets" id="bullets-course-alumni">
              <div>
                ✔ Holster draw speed & sub-second first-shot par times
              </div>
              <div>
                ✔ Red-dot optic acquisition & rapid target transitions
              </div>
              <div>
                ✔ Diagnostic malfunction clearance & recoil recovery
              </div>
              <div>
                ✔ Intimate 4-shooter cohort coached by Kai Wade
              </div>
            </div>
            {/* VIP Perks Expandable Box */}
            <div className="vip-perks-box" id="vip-box-course-alumni" style={{"display": "none"}}>
              <div className="vip-box-title">
                👑 WHAT'S ADDED IN VIP MODE:
              </div>
              <div className="vip-perk-item">
                ✔ Cindy's Hot Shots Range Lane Fee Included ($25–$35 Value)
              </div>
              <div className="vip-perk-item">
                ✔ 50 Rounds Factory Brass 9mm Target Ammunition Provided
              </div>
              <div className="vip-perk-item">
                ✔ B-27 & BakerTargets Diagnostic Targets Included
              </div>
              <div className="vip-perk-item">
                ✔ MantisX Sensor Live Telemetry & High-Speed Video Analysis
              </div>
              <div className="vip-perk-item" style={{"color": "var(--accent-amber)", "fontWeight": "700"}}>
                👑 VIP Priority 7-Day Flexible Scheduling (Mon–Sun Anytime — Standard is Weekend Only)
              </div>
            </div>
            <div style={{"marginTop": "14px"}}>
              <button className="btn-select-course" id="btn-select-course-alumni" onClick={() => { if (typeof window !== "undefined" && (window as any).selectCourse) (window as any).selectCourse("FIFS Graduate Alumni Marksmanship Clinic — Base Track ($65.00)"); }} data-onclick="selectCourse('FIFS Graduate Alumni Marksmanship Clinic — Base Track ($65.00)')" style={{"width": "100%", "padding": "12px", "fontFamily": "var(--font-display)", "fontSize": "1rem", "fontWeight": "800", "textTransform": "uppercase"}} type="button">
                
              Select Base ($65.00) & Reserve Seat →
            
              </button>
            </div>
          </div>
        </div>
      </main>
      {/* (Reservation form modalized into #courseBookingModal) */}
      {/* VIEW 4: ABOUT INSTRUCTOR KAI WADE */}
      <section className="panel hidden" id="view-about" role="tabpanel">
        <div className="panel-header">
          <h3>
            About Lead Instructor Kai Wade
          </h3>
          <p>
            Founder & Lead Instructor, Future Initiative Firearm Services
          </p>
        </div>
        {/* Instructor Kai Wade Clean Focus Profile Card */}
        <div className="instructor-hero-card">
          <div className="instructor-avatar-frame">
            <img alt="Instructor Wade - Lead Instructor, Future Initiative Firearm Services" className="instructor-avatar-img" data-onerror="this.src=&#x27;https://drive.google.com/thumbnail?id=1u53IU5ttzcy8t5W4oLlB2H9q2pXaaExa&amp;sz=w1000&#x27;" src="https://lh3.googleusercontent.com/d/1u53IU5ttzcy8t5W4oLlB2H9q2pXaaExa" />
          </div>
          <div className="instructor-hero-info">
            <div className="instructor-badge-tag">
              Lead Instructor & Founder
            </div>
            <h2 className="instructor-name">
              Instructor Wade
            </h2>
            <div className="instructor-creds-sub">
              
            MSP Certified Qualified Handgun Instructor (§ 5-101) • NRA Certified Pistol Instructor & RSO
          
            </div>
            <p className="instructor-tagline">
              
            "We don't just teach you how to shoot. We build your confidence, knowledge, and accountability from the ground up without intimidation."
          
            </p>
            <div style={{"marginTop": "14px", "display": "flex", "flexWrap": "wrap", "gap": "8px"}}>
              <span className="meta-chip">
                NRA Certified
              </span>
              <span className="meta-chip">
                MSP QHIC § 5-101
              </span>
              <span className="meta-chip">
                Emergency Bleeding Control
              </span>
              <span className="meta-chip">
                Range Safety Officer
              </span>
            </div>
          </div>
        </div>
        <div style={{"fontSize": "0.95rem", "color": "#cbd5e1", "lineHeight": "1.7", "marginBottom": "24px"}}>
          <p style={{"marginBottom": "14px"}}>
            <strong>
              Kai Wade
            </strong>
             is an NRA-Certified Firearms Instructor and a Maryland State Police (MSP) Certified Qualified Handgun Instructor (§ 5-101). He brings an analytical, patient, and modern approach to firearms education.
        
          </p>
          <p style={{"marginBottom": "14px"}}>
            
          Rather than relying on intimidation or outdated military drill bravado, Instructor Wade focuses on biomechanics, visual diagnostics, trigger press dynamics, and deep mastery of Maryland self-defense statutes. Every session emphasizes lawful conflict avoidance, situational awareness, and de-escalation first—with precision marksmanship as the bedrock of accountability.
        
          </p>
        </div>
        <div className="checklist-grid">
          <div className="checklist-box" style={{"transition": "all 0.25s ease"}}>
            <h4>
              🎖️ State & National Credentials
            </h4>
            <ul>
              <li>
                MSP Certified Qualified Handgun Instructor (QHIC)
              </li>
              <li>
                NRA Certified Pistol Instructor & Range Safety Officer
              </li>
              <li>
                Maryland Wear & Carry (CCW) & HQL Authorized Curriculum
              </li>
              <li>
                Certified in Emergency Medical Protocol & Bleeding Control
              </li>
            </ul>
          </div>
          <div className="checklist-box" style={{"transition": "all 0.25s ease"}}>
            <h4>
              🛡️ The FIFS Philosophy: Safety, Diagnostic Precision & Respect
            </h4>
            <p style={{"fontSize": "0.86rem", "color": "#cbd5e1", "lineHeight": "1.5", "marginBottom": "12px"}}>
              
            At Future Initiative Firearm Services, our mission is to build calculated, ethical, and mechanically confident shooters through patient, personalized coaching.
          
            </p>
            <ul>
              <li>
                <strong>
                  Zero Intimidation & Beginner Pacing:
                </strong>
                 Fear has no place in firearms training. Every student progresses at their own pace with absolute psychological safety and respect.
              </li>
              <li>
                <strong>
                  Diagnostic Sensor & Slow-Motion Telemetry:
                </strong>
                 We analyze grip pressure, recoil anticipation, and trigger press dynamics using MantisX diagnostics and high-speed video capture.
              </li>
              <li>
                <strong>
                  Zero-Live-Ammunition Classroom Safety:
                </strong>
                 Mechanical handling and malfunction drills use inert dummy rounds exclusively. Live ammunition is restricted to the range firing line.
              </li>
              <li>
                <strong>
                  Lifelong Student Mentorship:
                </strong>
                 Training doesn't end at qualification. We guide you through the MSP Licensing Portal, renewal milestones, and continuous skill tune-ups.
              </li>
            </ul>
          </div>
        </div>
        {/* 24/7 Persistent Direct Instructor Access Dock (Always Available) */}
        <div style={{"background": "linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, #070b10 100%)", "border": "2px solid var(--accent-cyan)", "borderRadius": "14px", "padding": "22px 24px", "marginTop": "28px", "boxShadow": "0 0 25px rgba(0, 229, 255, 0.15)"}}>
          <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "flexWrap": "wrap", "gap": "14px", "marginBottom": "14px"}}>
            <div>
              <span className="badge-instructor" style={{"marginBottom": "4px"}}>
                24/7 Direct Student Access
              </span>
              <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.5rem", "color": "#fff", "textTransform": "uppercase", "margin": "4px 0 2px"}}>
                
              💬 Direct Line to Instructor Kai Wade
            
              </h3>
              <p style={{"fontSize": "0.86rem", "color": "var(--text-muted)", "lineHeight": "1.5"}}>
                
              Have questions about course prerequisites, equipment compliance, or class schedules? Reach out directly.
            
              </p>
            </div>
            <span className="meta-chip chip-status" style={{"fontSize": "0.80rem", "padding": "4px 12px", "background": "rgba(16, 185, 129, 0.15)", "borderColor": "#10b981", "color": "#10b981"}}>
              
            ● DIRECT ACCESS ACTIVE 24/7
          
            </span>
          </div>
          <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(240px, 1fr))", "gap": "12px"}}>
            <a className="btn-spark" href="tel:4439901304" style={{"textDecoration": "none", "padding": "12px 18px", "fontSize": "0.90rem", "fontWeight": "800", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "gap": "8px"}}>
              <span>
                📞
              </span>
               Call (443) 990-1304
          
            </a>
            <a className="btn-spark" href="mailto:info@trainwithfifs.com" style={{"textDecoration": "none", "padding": "12px 18px", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "gap": "8px", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)"}}>
              <span>
                ✉️
              </span>
               Email info@trainwithfifs.com
          
            </a>
            <button className="btn-primary" data-onclick="openContactWidgetModal()" style={{"padding": "12px 18px", "fontSize": "0.90rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "0.8px"}} type="button">
              <span>
                💬
              </span>
               Dispatch Priority Message →
          
            </button>
          </div>
        </div>
      </section>
      {/* VIEW 5: STUDENT TARGETS & RANGE GALLERY */}
      <section className="panel hidden" id="view-testimonial" role="tabpanel">
        <div className="panel-header">
          <h3>
            Range Highlights & Student Milestones
          </h3>
          <p>
            Real students on the firing line at Cindy's Hot Shots building confidence, safe habits, and celebrating personal marksmanship milestones with Coach Kai Wade.
          </p>
        </div>
        <div className="cta-review-box">
          <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.3rem", "color": "#fff", "textTransform": "uppercase"}}>
            Trained with Future Initiative?
          </h4>
          <p style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "marginTop": "4px"}}>
            Help fellow Maryland citizens find quality, zero-intimidation instruction.
          </p>
          <a className="btn-review" href="https://share.google/7bGi1FjainNaCUYIl" rel="noopener noreferrer" target="_blank">
            
          ⭐ Leave an Official Google Review
        
          </a>
        </div>
        <div className="gallery-grid-targets" id="targets-grid-container">
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1R00tHvnh7Cb_G6BNOjahAPUzv-tAOkHO&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1R00tHvnh7Cb_G6BNOjahAPUzv-tAOkHO=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Lane Diagnostics &amp; Fundamentals" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Diagnostic Coaching
              </span>
              <span className="badge-score">
                1-on-1 Session
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Lane Diagnostics & Fundamentals
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Student working through 1-on-1 coaching on the firing line at Cindy's Hot Shots. Paced instruction focused on grip friction and smooth trigger press.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Glen Burnie, MD
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=10OAZEfs-L0AeJEx8LMBdDcvZnVW155ps&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/10OAZEfs-L0AeJEx8LMBdDcvZnVW155ps=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Center-Mass Cadence Cluster" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Wear & Carry
              </span>
              <span className="badge-score">
                100% Qualified
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Center-Mass Cadence Cluster
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Clean vital-zone hits on the official BakerTargets qualification course. Calm coaching built confidence from the first round.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Certified Range: Cindy's Hot Shots
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1Ro-oA50xJUiA8D8TEItGz4hlAVYhzApv&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1Ro-oA50xJUiA8D8TEItGz4hlAVYhzApv=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="B-27 Precision Grouping" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Maryland CCW
              </span>
              <span className="badge-score">
                Center-X Grouping
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  B-27 Precision Grouping
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Tight shot placement centered right in the 9, 10, and X rings following holster draw and sight picture coaching.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Practical Qualification
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1X-TSEMxypHMf73rTNrlo5L3dUwwMajCR&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1X-TSEMxypHMf73rTNrlo5L3dUwwMajCR=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Dual Student Center Clusters" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Paired Training
              </span>
              <span className="badge-score">
                Dual Qualifiers
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Dual Student Center Clusters
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Both students qualifying side-by-side with tight vital zone clusters during an intensive live-fire training block.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Paired Session
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1rUcirGX7jLT0upSobd82iJf91Ycv9xlt&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1rUcirGX7jLT0upSobd82iJf91Ycv9xlt=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Confidence &amp; Marksmanship" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Wear & Carry
              </span>
              <span className="badge-score">
                Certified Pass
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Confidence & Marksmanship
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Solid center-mass spread on silhouette targets, demonstrating steady recoil management and smooth trigger reset.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Certified Range: Cindy's Hot Shots
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1Z8VLFy2L1Sd6bASqfpt-BBeRiKpVU9qF&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1Z8VLFy2L1Sd6bASqfpt-BBeRiKpVU9qF=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Precision Vital-Zone Group" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Maryland HQL / CCW
              </span>
              <span className="badge-score">
                Dead-Center Hits
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Precision Vital-Zone Group
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Dead-center vital-zone grouping achieved through individual coaching on grip friction and stance balance.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Private Coaching
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1mljZQi7U4-O4vBCldtd5xMqAtbk7xBBl&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1mljZQi7U4-O4vBCldtd5xMqAtbk7xBBl=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Dynamic Range Drills" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Range Marksmanship
              </span>
              <span className="badge-score">
                Center Grouping
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Dynamic Range Drills
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Maintaining discipline and tight group consistency across multiple target styles and engagement distances.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Glen Burnie, MD
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1bQjmsgeIz5AOZbyHLnLe-y84FFmmOQSh&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1bQjmsgeIz5AOZbyHLnLe-y84FFmmOQSh=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Paired Class Qualifiers" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Paired Session
              </span>
              <span className="badge-score">
                Certified Qualifiers
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Paired Class Qualifiers
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Both students achieving passing scores with clean center-mass placement during paired weekend instruction.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Paired Training
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1I8SYXbZ8Vs_RoaISP-Oi_yVf8y24wJM_&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1I8SYXbZ8Vs_RoaISP-Oi_yVf8y24wJM_=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Small Group Milestone" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Small Group
              </span>
              <span className="badge-score">
                Dual Certified
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Small Group Milestone
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Two students completing their Maryland qualification course together with tight clusters and zero intimidation.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Glen Burnie, MD
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1Q8wfkRpxmKlhRYttlgvGVuakdxRIFofV&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1Q8wfkRpxmKlhRYttlgvGVuakdxRIFofV=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Live Firing Line Perspective" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Firing Line
              </span>
              <span className="badge-score">
                Live Range
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Live Firing Line Perspective
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Active diagnostic shooting and practical qualification downrange at Cindy's Hot Shots in Glen Burnie, MD.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Primary Range Facility • Cindy's Hot Shots
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1GKKGtLxhSqGOgfh1-u1_CFNr1af-xFUS&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1GKKGtLxhSqGOgfh1-u1_CFNr1af-xFUS=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Silhouette Marksmanship" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Wear & Carry
              </span>
              <span className="badge-score">
                100% Qualified
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Silhouette Marksmanship
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Focused shot cadence and tight center grouping on the B-27 black silhouette target during practical qualification.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Glen Burnie, MD
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1Xr431Fu4IWY2KIhpJJ5REskODfpH-X9M&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1Xr431Fu4IWY2KIhpJJ5REskODfpH-X9M=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Marksmanship Diagnostics" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                HQL & Fundamentals
              </span>
              <span className="badge-score">
                Concentric Hits
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Marksmanship Diagnostics
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Target drill emphasizing sight alignment, steady trigger press, and recoil recovery mechanics.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Diagnostic Coaching • Cindy's Hot Shots
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1O5ON4PlVTuCaW-w09a0zzMnOYBMwQ_6k&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1O5ON4PlVTuCaW-w09a0zzMnOYBMwQ_6k=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="B27 Shield Precision" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Maryland CCW
              </span>
              <span className="badge-score">
                Center-Mass Certified
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  B27 Shield Precision
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Clean vital-zone dispersion on the B27 Shield tactical training target during live-fire qualification.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Practical Qual
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1-dVzb2ipi3IYNb5dGxUpBCBaEyYJIpZ_&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1-dVzb2ipi3IYNb5dGxUpBCBaEyYJIpZ_=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Vital-Zone Control" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Maryland HQL
              </span>
              <span className="badge-score">
                100% Passing Score
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Vital-Zone Control
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Exceptional recoil management and tight center-ring hits with calm, zero-intimidation instruction.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Glen Burnie, MD
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1XLGG8VZTEOSdnPF5-SXLVGZmeK9m55rR&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1XLGG8VZTEOSdnPF5-SXLVGZmeK9m55rR=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Group Class Milestone" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Cohort Training
              </span>
              <span className="badge-score">
                Triple Qualification
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Group Class Milestone
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Three students qualifying together with clean, certified blue silhouette target sheets at Cindy's Hot Shots.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Small Group Cohort • Cindy's Hot Shots
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1sOye7641V0sTZLrOQ7VHAuEe4wFBdfoL&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1sOye7641V0sTZLrOQ7VHAuEe4wFBdfoL=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="BakerTargets Standard" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Wear & Carry Initial
              </span>
              <span className="badge-score">
                Vital Zone Cluster
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  BakerTargets Standard
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Dedicated center-mass cluster demonstrating solid trigger reset discipline and sight tracking on the line.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Maryland Certified • Instructor Wade
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1bWUFKzFuf-xsE7XSuPEE9mWuyGyVcH_z&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1bWUFKzFuf-xsE7XSuPEE9mWuyGyVcH_z=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Orange Silhouette Grouping" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                CCW Certification
              </span>
              <span className="badge-score">
                High-Visibility Target
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Orange Silhouette Grouping
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Steady cadence and confident gun handling producing tight center-scoring hits during qualification.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Glen Burnie, MD
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=191TKVFSz48i2NP9T23KKzZcNFIr42Fls&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/191TKVFSz48i2NP9T23KKzZcNFIr42Fls=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Confident Marksmanship" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Wear & Carry
              </span>
              <span className="badge-score">
                Certified Passing
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Confident Marksmanship
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Clean grouping right in the vital scoring rings following 1-on-1 diagnostic coaching with Instructor Wade.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Qualified
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1-__LG3c5gZA2zAKX-qeX8magmZRBETsY&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1-__LG3c5gZA2zAKX-qeX8magmZRBETsY=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Paired Training Cohort" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Paired Session
              </span>
              <span className="badge-score">
                Dual Qualifiers
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Paired Training Cohort
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Two students celebrating successful state qualification following their live-fire practical course of fire.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Cindy's Hot Shots • Range Exit
              </div>
            </div>
          </article>
          <article className="target-card-student">
            <div className="target-img-frame">
              <img src="https://drive.google.com/thumbnail?id=1RVuyUeMQwrSMCl1-M4Wzx1aIzK2AypI5&amp;sz=w800" data-onerror="if(this.dataset.fb!==&#x27;1&#x27;){this.dataset.fb=&#x27;1&#x27;;this.src=&#x27;https://lh3.googleusercontent.com/d/1RVuyUeMQwrSMCl1-M4Wzx1aIzK2AypI5=w800&#x27;;}else{this.onerror=null;this.style.display=&#x27;none&#x27;;this.parentElement.classList.add(&#x27;img-fallback&#x27;);}" alt="Red X-Ring Accuracy" loading="lazy" />
              <div className="img-fallback-badge">
                🎯 Range Qualification Verified
              </div>
              <span className="badge-course">
                Maryland CCW
              </span>
              <span className="badge-score">
                X-Ring Cluster
              </span>
            </div>
            <div className="target-content">
              <div>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "marginBottom": "4px"}}>
                  Red X-Ring Accuracy
                </h4>
                <p style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Dead-center shot placement clustered around the red X-ring on the B-27 qualification target.
                </p>
              </div>
              <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "marginTop": "10px", "fontWeight": "600"}}>
                Certified Range • Cindy's Hot Shots
              </div>
            </div>
          </article>
        </div>
      </section>
      {/* VIEW 6: FREQUENTLY ASKED QUESTIONS */}
      <section className="panel hidden" id="view-faq" role="tabpanel">
        <div className="panel-header">
          <h3>
            Frequently Asked Questions
          </h3>
          <p>
            Everything you need to know about Maryland firearm permits, training requirements, and range days.
          </p>
        </div>
        <div className="faq-item active">
          <button className="faq-question" data-onclick="toggleFaq(this)" type="button">
            <span>
              Why should I take a class with Future Initiative?
            </span>
            <span>
              −
            </span>
          </button>
          <div className="faq-answer">
            
          Future Initiative Firearm Services is built on a 
            <strong>
              zero-intimidation, diagnostic coaching philosophy
            </strong>
            . Whether you have never touched a firearm before or are looking to refine your draw cadence, Instructor Kai Wade (Certified MSP Qualified Handgun Instructor § 5-101 and NRA Certified) tailors pacing to your individual comfort. You will gain genuine firearm safety proficiency and an understanding of Maryland self-defense law without judgment or drill-sergeant bravado.
        
          </div>
        </div>
        <div className="faq-item">
          <button className="faq-question" data-onclick="toggleFaq(this)" type="button">
            <span>
              What is the 100% zero live-ammunition classroom policy?
            </span>
            <span>
              +
            </span>
          </button>
          <div className="faq-answer">
            
          Safety is absolute. Under no circumstances is live ammunition brought into the classroom. All live ammunition must remain secured in your vehicle trunk until Instructor Kai Wade conducts the live-fire evolution on the firing line.
        
          </div>
        </div>
        <div className="faq-item">
          <button className="faq-question" data-onclick="toggleFaq(this)" type="button">
            <span>
              Do I need to own a pistol before booking a class?
            </span>
            <span>
              +
            </span>
          </button>
          <div className="faq-answer">
            <strong>
              No, absolutely not.
            </strong>
             Handgun rentals and safety gear can be coordinated directly at Cindy's Hot Shots. We recommend taking the class first to learn safe mechanics before purchasing.
        
          </div>
        </div>
        <div className="faq-item">
          <button className="faq-question" data-onclick="toggleFaq(this)" type="button">
            <span>
              What is the difference between an HQL and a Wear & Carry Permit?
            </span>
            <span>
              +
            </span>
          </button>
          <div className="faq-answer">
            
          A 
            <strong>
              Handgun Qualification License (HQL)
            </strong>
             is required by Maryland law simply to purchase, rent, or receive a handgun. A 
            <strong>
              Wear & Carry Permit (CCW)
            </strong>
             is the comprehensive certification required to legally carry a concealed handgun in public throughout Maryland. If you want both, our Combo class satisfies both mandates in one curriculum.
        
          </div>
        </div>
        <div className="faq-item">
          <button className="faq-question" data-onclick="toggleFaq(this)" type="button">
            <span>
              Where are training sessions and range qualifications conducted?
            </span>
            <span>
              +
            </span>
          </button>
          <div className="faq-answer">
            
          Our primary live-fire range is 
            <strong>
              Cindy's Hot Shots
            </strong>
             at 115 Holsum Way, Glen Burnie, MD. Private and paired classes can also be scheduled at partner ranges across Anne Arundel, Baltimore, and Howard counties.
        
          </div>
        </div>
        <div className="faq-item">
          <button className="faq-question" data-onclick="toggleFaq(this)" type="button">
            <span>
              How long does the Maryland State Police take to process permits?
            </span>
            <span>
              +
            </span>
          </button>
          <div className="faq-answer">
            
          HQL applications are typically processed within 14 to 30 days. Wear & Carry (CCW) applications take approximately 45 to 90 days. We provide step-by-step follow-up guides inside your Student Portal to ensure your application has zero shortages in the MSP portal.
        
          </div>
        </div>
      </section>
      
      {/* ================= 1. STANDARDIZED MULTISTATE MASTERY MODAL ================= */}
      <div className="reciprocity-hub-modal-overlay" id="multistateMasteryModal" style={{"display": "none", "position": "fixed", "inset": "0", "width": "100%", "height": "100%", "background": "rgba(4, 7, 11, 0.96)", "backdropFilter": "blur(16px)", "WebkitBackdropFilter": "blur(16px)", "zIndex": "999999", "overflowY": "auto", "padding": "24px 16px"}}>
        <div style={{"maxWidth": "1140px", "margin": "0 auto", "position": "relative"}}>
          <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "18px", "paddingBottom": "12px", "borderBottom": "1px solid var(--border-subtle)"}}>
            <h2 style={{"fontFamily": "var(--font-display)", "fontSize": "1.65rem", "color": "#fff", "letterSpacing": "1px"}}>
              ⭐ Mid-Atlantic Multi-State Mastery (34+ State Legal Shield)
            </h2>
            <button className="btn-return-home" data-onclick="closeMultistateMasteryModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closeMultistateMasteryModal) (window as any).closeMultistateMasteryModal(); }} style={{"padding": "8px 18px", "fontSize": "0.95rem", "minHeight": "40px", "cursor": "pointer"}} type="button">
              ✕ CLOSE MODAL
            </button>
          </div>
          <div style={{"background": "#0d131d", "border": "1px solid var(--border-subtle)", "borderRadius": "16px", "padding": "28px", "marginBottom": "24px", "boxShadow": "0 12px 30px rgba(0,0,0,0.8)"}}>
            <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "flexWrap": "wrap", "gap": "16px", "marginBottom": "20px"}}>
              <div>
                <span className="badge-pop" style={{"background": "var(--accent-amber)", "color": "#070b10", "fontWeight": "800"}}>
                  AUTHORIZED FIELD GUIDE SYSTEM
                </span>
                <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.85rem", "color": "#fff", "margin": "8px 0 4px"}}>
                  34+ State Multi-Permit Expansion Protocol
                </h3>
                <p style={{"color": "var(--text-muted)", "fontSize": "0.95rem", "maxWidth": "760px"}}>
                  Lead Instructor: Kai Wade (NRA #262929961 • MSP QHIC § 5-101). Transform your Maryland certification into a seamless, coast-to-coast multi-state defensive shield while bypassing clerical disqualifications and saving on state licensing.
                </p>
              </div>
              <div style={{"background": "rgba(245, 158, 11, 0.12)", "border": "1px solid var(--accent-amber)", "borderRadius": "12px", "padding": "16px 20px", "textAlign": "right"}}>
                <div style={{"fontSize": "0.78rem", "color": "var(--accent-amber)", "fontWeight": "800", "textTransform": "uppercase"}}>
                  Standardized Tuition Rate
                </div>
                <div style={{"fontFamily": "var(--font-display)", "fontSize": "2rem", "fontWeight": "900", "color": "#fff"}}>
                  $424.99 <span style={{"fontSize": "1rem", "color": "var(--text-muted)"}}>Base</span> / $549.99 <span style={{"fontSize": "1rem", "color": "var(--accent-amber)"}}>VIP</span>
                </div>
              </div>
            </div>
            {/* System At A Glance Metrics */}
            <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(220px, 1fr))", "gap": "16px", "marginBottom": "24px"}}>
              <div style={{"background": "rgba(18, 26, 44, 0.6)", "border": "1px solid var(--border-subtle)", "borderRadius": "12px", "padding": "16px"}}>
                <div style={{"fontSize": "0.74rem", "textTransform": "uppercase", "color": "var(--accent-cyan)", "fontWeight": "800"}}>Reciprocity Reach</div>
                <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.6rem", "fontWeight": "800", "color": "#fff", "marginTop": "4px"}}>34+ STATES</div>
                <div style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "marginTop": "2px"}}>Interstate legal reciprocity footprint</div>
              </div>
              <div style={{"background": "rgba(18, 26, 44, 0.6)", "border": "1px solid var(--border-subtle)", "borderRadius": "12px", "padding": "16px"}}>
                <div style={{"fontSize": "0.74rem", "textTransform": "uppercase", "color": "#10b981", "fontWeight": "800"}}>Course Architecture</div>
                <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.6rem", "fontWeight": "800", "color": "#fff", "marginTop": "4px"}}>5-IN-1 STACK</div>
                <div style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "marginTop": "2px"}}>One comprehensive training framework</div>
              </div>
              <div style={{"background": "rgba(18, 26, 44, 0.6)", "border": "1px solid var(--border-subtle)", "borderRadius": "12px", "padding": "16px"}}>
                <div style={{"fontSize": "0.74rem", "textTransform": "uppercase", "color": "var(--accent-amber)", "fontWeight": "800"}}>Statutory Proof</div>
                <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.6rem", "fontWeight": "800", "color": "#fff", "marginTop": "4px"}}>100% IN-PERSON</div>
                <div style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "marginTop": "2px"}}>Strict Va. Code § 18.2-308 compliance</div>
              </div>
              <div style={{"background": "rgba(18, 26, 44, 0.6)", "border": "1px solid var(--border-subtle)", "borderRadius": "12px", "padding": "16px"}}>
                <div style={{"fontSize": "0.74rem", "textTransform": "uppercase", "color": "#38bdf8", "fontWeight": "800"}}>Student Benefit</div>
                <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.6rem", "fontWeight": "800", "color": "#fff", "marginTop": "4px"}}>$150 SAVED</div>
                <div style={{"fontSize": "0.82rem", "color": "var(--text-muted)", "marginTop": "2px"}}>Free Maryland HQL Exemption unlocked</div>
              </div>
            </div>
            {/* Phased Roadmap */}
            <div style={{"background": "rgba(10, 16, 26, 0.8)", "border": "1px solid var(--border-subtle)", "borderRadius": "12px", "padding": "20px", "marginBottom": "24px"}}>
              <h4 style={{"fontFamily": "var(--font-display)", "color": "var(--accent-cyan)", "fontSize": "1.2rem", "marginBottom": "12px", "textTransform": "uppercase"}}>
                Chronological Phased Dispatch Flow
              </h4>
              <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(280px, 1fr))", "gap": "16px"}}>
                <div style={{"borderLeft": "3px solid var(--accent-cyan)", "paddingLeft": "14px"}}>
                  <strong style={{"color": "#fff", "display": "block"}}>Phase 1: Maryland Wear & Carry (Home Base)</strong>
                  <p style={{"fontSize": "0.84rem", "color": "var(--text-muted)", "marginTop": "4px"}}>Submit 100% online via MSP Licensing Portal immediately following LiveScan. Unlocks $0 Free Maryland HQL Exemption.</p>
                </div>
                <div style={{"borderLeft": "3px solid #10b981", "paddingLeft": "14px"}}>
                  <strong style={{"color": "#fff", "display": "block"}}>Phase 2: Virginia • Florida • Arizona (Parallel Mail)</strong>
                  <p style={{"fontSize": "0.84rem", "color": "var(--text-muted)", "marginTop": "4px"}}>Assemble packets with Kai's notarized credentials and dispatch via USPS. Do not wait for Maryland approval!</p>
                </div>
                <div style={{"borderLeft": "3px solid var(--accent-amber)", "paddingLeft": "14px"}}>
                  <strong style={{"color": "#fff", "display": "block"}}>Phase 3: Pennsylvania LTCF (Border Pickup)</strong>
                  <p style={{"fontSize": "0.84rem", "color": "var(--text-muted)", "marginTop": "4px"}}>York County online submission, then 35-min drive for rapid 5-minute photo issuance once physical MD permit arrives.</p>
                </div>
              </div>
            </div>
            <div style={{"display": "flex", "gap": "14px", "justifyContent": "flex-end", "flexWrap": "wrap"}}>
              <button type="button" className="btn-secondary" data-onclick="closeMultistateMasteryModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closeMultistateMasteryModal) (window as any).closeMultistateMasteryModal(); }}>
                Close
              </button>
              <button type="button" className="btn-primary" data-onclick="closeMultistateMasteryModal(); selectCourse('Mid-Atlantic Multi-State Mastery — Base Track ($424.99)');" onClick={() => { if (typeof window !== 'undefined') { if ((window as any).closeMultistateMasteryModal) (window as any).closeMultistateMasteryModal(); if ((window as any).selectCourse) (window as any).selectCourse('Mid-Atlantic Multi-State Mastery — Base Track ($424.99)'); } }}>
                Enroll in Multi-State Mastery ($424.99) →
              </button>
            </div>
          </div>
        </div>
      </div>




      {/* ================= 2. STANDARDIZED PERMIT RENEWAL CENTER MODAL ================= */}
      <div className="reciprocity-hub-modal-overlay" id="permitRenewalModal" style={{"display": "none", "position": "fixed", "inset": "0", "width": "100%", "height": "100%", "background": "rgba(4, 7, 11, 0.96)", "backdropFilter": "blur(16px)", "WebkitBackdropFilter": "blur(16px)", "zIndex": "999999", "overflowY": "auto", "padding": "24px 16px"}}>
        <div style={{"maxWidth": "1140px", "margin": "0 auto", "position": "relative"}}>
          <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "18px", "paddingBottom": "12px", "borderBottom": "1px solid var(--border-subtle)"}}>
            <h2 style={{"fontFamily": "var(--font-display)", "fontSize": "1.65rem", "color": "#fff", "letterSpacing": "1px"}}>
              ⏱️ Maryland Wear & Carry Permit Renewal Center
            </h2>
            <button className="btn-return-home" data-onclick="closePermitRenewalModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closePermitRenewalModal) (window as any).closePermitRenewalModal(); }} style={{"padding": "8px 18px", "fontSize": "0.95rem", "minHeight": "40px", "cursor": "pointer"}} type="button">
              ✕ CLOSE MODAL
            </button>
          </div>
          <div style={{"background": "#0d131d", "border": "1px solid var(--border-subtle)", "borderRadius": "16px", "padding": "28px", "marginBottom": "24px", "boxShadow": "0 12px 30px rgba(0,0,0,0.8)"}}>
            <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "flexWrap": "wrap", "gap": "16px", "marginBottom": "20px"}}>
              <div>
                <span className="badge-pop" style={{"background": "rgba(0, 229, 255, 0.15)", "color": "var(--accent-cyan)", "border": "1px solid var(--accent-cyan)"}}>
                  8-HOUR STATUTORY MANDATE • MD PS § 5-306
                </span>
                <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.85rem", "color": "#fff", "margin": "8px 0 4px"}}>
                  Biennial Recertification & Expiration Countdown
                </h3>
                <p style={{"color": "var(--text-muted)", "fontSize": "0.95rem", "maxWidth": "760px"}}>
                  Maryland Wear & Carry permits expire every 2 to 3 years. State Police require submission at least 90 days prior to expiration. Complete your 8-hour refresher and 25-round live-fire qualification at Cindy's Hot Shots.
                </p>
              </div>
              <div style={{"background": "rgba(0, 229, 255, 0.10)", "border": "1px solid var(--accent-cyan)", "borderRadius": "12px", "padding": "16px 20px", "textAlign": "right"}}>
                <div style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "fontWeight": "800", "textTransform": "uppercase"}}>
                  Renewal Class Tuition
                </div>
                <div style={{"fontFamily": "var(--font-display)", "fontSize": "2rem", "fontWeight": "900", "color": "#fff"}}>
                  $149.99 <span style={{"fontSize": "1rem", "color": "var(--text-muted)"}}>Base</span> / $249.99 <span style={{"fontSize": "1rem", "color": "var(--accent-amber)"}}>VIP</span>
                </div>
              </div>
            </div>
            {/* Countdown & Checklist */}
            <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(280px, 1fr))", "gap": "16px", "marginBottom": "24px"}}>
              <div style={{"background": "rgba(16, 22, 31, 0.7)", "border": "1px solid var(--border-subtle)", "borderRadius": "12px", "padding": "18px"}}>
                <strong style={{"color": "var(--accent-amber)", "fontFamily": "var(--font-display)", "fontSize": "1.1rem", "display": "block", "marginBottom": "8px"}}>
                  ⚠️ 90-Day Legal Window Reminder
                </strong>
                <p style={{"fontSize": "0.85rem", "color": "#cbd5e1", "lineHeight": "1.5"}}>
                  If your permit expires before your renewal is processed, your concealed carry privileges are completely suspended until the new card arrives. Complete your training 90–120 days out.
                </p>
              </div>
              <div style={{"background": "rgba(16, 22, 31, 0.7)", "border": "1px solid var(--border-subtle)", "borderRadius": "12px", "padding": "18px"}}>
                <strong style={{"color": "var(--accent-cyan)", "fontFamily": "var(--font-display)", "fontSize": "1.1rem", "display": "block", "marginBottom": "8px"}}>
                  🎯 Range Qualification Standards
                </strong>
                <p style={{"fontSize": "0.85rem", "color": "#cbd5e1", "lineHeight": "1.5"}}>
                  25-round Civilian BPHC course of fire on B-27 silhouette targets at 3, 5, 7, and 15 yards. Minimum 70% passing score (175/250 pts) with official signed Form MSP 29-14 scoresheet.
                </p>
              </div>
            </div>
            <div style={{"display": "flex", "gap": "14px", "justifyContent": "flex-end", "flexWrap": "wrap"}}>
              <button type="button" className="btn-secondary" data-onclick="closePermitRenewalModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closePermitRenewalModal) (window as any).closePermitRenewalModal(); }}>
                Close
              </button>
              <button type="button" className="btn-primary" data-onclick="closePermitRenewalModal(); selectCourse('Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)');" onClick={() => { if (typeof window !== 'undefined') { if ((window as any).closePermitRenewalModal) (window as any).closePermitRenewalModal(); if ((window as any).selectCourse) (window as any).selectCourse('Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)'); } }}>
                Book 8-Hour Renewal ($149.99) →
              </button>
            </div>
          </div>
        </div>
      </div>




      {/* ================= 3. STANDARDIZED FUTURE INITIATIVE SERVICES MODAL ================= */}
      <div className="reciprocity-hub-modal-overlay" id="futureServicesModal" style={{"display": "none", "position": "fixed", "inset": "0", "width": "100%", "height": "100%", "background": "rgba(4, 7, 11, 0.96)", "backdropFilter": "blur(16px)", "WebkitBackdropFilter": "blur(16px)", "zIndex": "999999", "overflowY": "auto", "padding": "24px 16px"}}>
        <div style={{"maxWidth": "1140px", "margin": "0 auto", "position": "relative"}}>
          <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "18px", "paddingBottom": "12px", "borderBottom": "1px solid var(--border-subtle)"}}>
            <h2 style={{"fontFamily": "var(--font-display)", "fontSize": "1.65rem", "color": "#fff", "letterSpacing": "1px"}}>
              🛡️ Future Initiative Certified Training Catalog
            </h2>
            <button className="btn-return-home" data-onclick="closeFutureServicesModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closeFutureServicesModal) (window as any).closeFutureServicesModal(); }} style={{"padding": "8px 18px", "fontSize": "0.95rem", "minHeight": "40px", "cursor": "pointer"}} type="button">
              ✕ CLOSE MODAL
            </button>
          </div>
          <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(300px, 1fr))", "gap": "20px", "marginBottom": "24px"}}>
            {/* Service 1: Multi-State Mastery */}
            <div className="modular-card" style={{"padding": "24px", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
              <div>
                <span className="badge-pop" style={{"background": "var(--accent-amber)", "color": "#070b10", "fontWeight": "800"}}>FLAGSHIP MULTI-STATE</span>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "margin": "10px 0 6px"}}>Mid-Atlantic Multi-State Mastery</h4>
                <p style={{"fontSize": "0.85rem", "color": "var(--text-muted)", "marginBottom": "14px"}}>16-hr Maryland Wear & Carry + reciprocal affidavits for VA, FL, AZ, and PA (34+ states total).</p>
                <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.5rem", "fontWeight": "800", "color": "#fff", "marginBottom": "14px"}}>$424.99 <span style={{"fontSize": "0.85rem", "color": "var(--text-muted)"}}>Base</span> / $549.99 <span style={{"fontSize": "0.85rem", "color": "var(--accent-amber)"}}>VIP</span></div>
              </div>
              <button type="button" className="btn-primary" data-onclick="closeFutureServicesModal(); selectCourse('Mid-Atlantic Multi-State Mastery — Base Track ($424.99)');" onClick={() => { if (typeof window !== 'undefined') { if ((window as any).closeFutureServicesModal) (window as any).closeFutureServicesModal(); if ((window as any).selectCourse) (window as any).selectCourse('Mid-Atlantic Multi-State Mastery — Base Track ($424.99)'); } }}>Select Multi-State →</button>
            </div>
            {/* Service 2: 8-Hour Renewal */}
            <div className="modular-card" style={{"padding": "24px", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
              <div>
                <span className="badge-pop" style={{"background": "rgba(0, 229, 255, 0.15)", "color": "var(--accent-cyan)", "border": "1px solid var(--accent-cyan)"}}>BIENNIAL RECERTIFICATION</span>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "margin": "10px 0 6px"}}>Maryland Wear & Carry Renewal</h4>
                <p style={{"fontSize": "0.85rem", "color": "var(--text-muted)", "marginBottom": "14px"}}>8-hour statutory renewal instruction + 25-round live-fire qualification at Cindy's Hot Shots.</p>
                <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.5rem", "fontWeight": "800", "color": "#fff", "marginBottom": "14px"}}>$149.99 <span style={{"fontSize": "0.85rem", "color": "var(--text-muted)"}}>Base</span> / $249.99 <span style={{"fontSize": "0.85rem", "color": "var(--accent-amber)"}}>VIP</span></div>
              </div>
              <button type="button" className="btn-primary" data-onclick="closeFutureServicesModal(); selectCourse('Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)');" onClick={() => { if (typeof window !== 'undefined') { if ((window as any).closeFutureServicesModal) (window as any).closeFutureServicesModal(); if ((window as any).selectCourse) (window as any).selectCourse('Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)'); } }}>Select Renewal →</button>
            </div>
            {/* Service 3: CCW & HQL Combo */}
            <div className="modular-card" style={{"padding": "24px", "display": "flex", "flexDirection": "column", "justifyContent": "space-between"}}>
              <div>
                <span className="badge-pop" style={{"background": "rgba(16, 185, 129, 0.15)", "color": "#10b981", "border": "1px solid #10b981"}}>MOST POPULAR COMBO</span>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.35rem", "color": "#fff", "margin": "10px 0 6px"}}>Maryland CCW & HQL Combo</h4>
                <p style={{"fontSize": "0.85rem", "color": "var(--text-muted)", "marginBottom": "14px"}}>Complete 16-hr Maryland CCW plus statutory HQL purchase waiver certification. Save $100.</p>
                <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.5rem", "fontWeight": "800", "color": "#fff", "marginBottom": "14px"}}>$249.99 <span style={{"fontSize": "0.85rem", "color": "var(--text-muted)"}}>Base</span> / $375 <span style={{"fontSize": "0.85rem", "color": "var(--accent-amber)"}}>VIP</span></div>
              </div>
              <button type="button" className="btn-primary" data-onclick="closeFutureServicesModal(); selectCourse('Maryland CCW & HQL Combo — Base Track ($249.99)');" onClick={() => { if (typeof window !== 'undefined') { if ((window as any).closeFutureServicesModal) (window as any).closeFutureServicesModal(); if ((window as any).selectCourse) (window as any).selectCourse('Maryland CCW & HQL Combo — Base Track ($249.99)'); } }}>Select Combo →</button>
            </div>
          </div>
        </div>
      </div>




      {/* ================= DEDICATED RECIPROCITY & TRAVEL HUB MODAL ================= */}
      {/* ================= 50-STATE RECIPROCITY ENGINE FULL-SCREEN MODAL ================= */}
      <div className="reciprocity-hub-modal-overlay" id="reciprocityHubModal" style={{"display": "none", "position": "fixed", "inset": "0", "width": "100%", "height": "100%", "background": "rgba(4, 7, 11, 0.96)", "backdropFilter": "blur(16px)", "WebkitBackdropFilter": "blur(16px)", "zIndex": "999999", "overflowY": "auto", "padding": "24px 16px"}}>
        <div style={{"maxWidth": "1140px", "margin": "0 auto", "position": "relative"}}>
          <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "18px", "paddingBottom": "12px", "borderBottom": "1px solid var(--border-subtle)"}}>
            <h2 style={{"fontFamily": "var(--font-display)", "fontSize": "1.65rem", "color": "#fff", "letterSpacing": "1px"}}>
              
          🗺️ Multi-State CCW Reciprocity Navigator & Travel Hub
        
            </h2>
            <button className="btn-return-home" data-onclick="toggleReciprocityHubModal(false)" style={{"padding": "8px 18px", "fontSize": "0.95rem", "minHeight": "40px", "cursor": "pointer"}} type="button">
              
          ✕ CLOSE HUB
        
            </button>
          </div>
          <div className="reciprocity-app-wrapper">
            {/* Brand HUD Header */}
            <header className="brand-hud-header" style={{"display": "flex", "alignItems": "center", "justifyContent": "space-between", "flexWrap": "wrap", "gap": "16px"}}>
              <div style={{"display": "flex", "alignItems": "center", "gap": "16px"}}>
                <img alt="Future Initiative Firearm Services Logo" src="https://drive.google.com/thumbnail?id=1EnAqEURi1XIRNdNTooFGY_pvs38ZcBEQ&amp;sz=w500" style={{"width": "52px", "height": "52px", "objectFit": "contain", "filter": "drop-shadow(0 0 10px rgba(0, 229, 255, 0.5))", "flexShrink": "0"}} />
                  <div className="brand-info-block">
                    <div style={{"display": "flex", "alignItems": "center", "gap": "10px", "marginBottom": "4px"}}>
                      <span className="badge-instructor">
                        Future Initiative Firearm Services
                      </span>
                      <span style={{"fontSize": "0.78rem", "color": "var(--accent-cyan)", "textTransform": "uppercase", "fontWeight": "700"}}>
                        Tactical Compliance Hub
                      </span>
                    </div>
                    <h1>
                      CONCEALED CARRY RECIPROCITY ENGINE
                    </h1>
                    <p>
                      Interactive 50-State Recognition Architecture powered by Lead Instructor Kai Wade (Baltimore, MD)
                    </p>
                  </div>
                  <div className="live-status-pill">
                    <span className="live-dot">
                    </span>
                    <span>
                      2026 STATUTES ACTIVE
                    </span>
                  </div>
              </div>
            </header>
            {/* Dual-Tier Permit Selector & Multiplier Deck */}
            <section aria-label="Permit Settings" className="permit-control-deck">
              <div className="section-title">
                <span>
                  Dual-Tier Permit System
                </span>
                <span className="accent">
                  Instant Dynamic Calculation
                </span>
              </div>
              <div className="permit-inputs-grid">
                <div className="permit-field-group">
                  <label htmlFor="primaryResidentSelect">
                    Primary Resident Permit:
                  </label>
                  <select
  defaultValue={"MD"} className="permit-select-main" id="primaryResidentSelect" data-onchange="handleResidentStateChange(this.value)">
                    <option value="MD">
                      Maryland (Resident Permit)
                    </option>
                    <option value="VA">
                      Virginia (Resident Permit)
                    </option>
                    <option value="PA">
                      Pennsylvania (Resident Permit)
                    </option>
                    <option value="FL">
                      Florida (Resident Permit)
                    </option>
                    <option value="UT">
                      Utah (Resident Permit)
                    </option>
                    <option value="TX">
                      Texas (Resident Permit)
                    </option>
                    <option value="NC">
                      North Carolina (Resident Permit)
                    </option>
                    <option value="OH">
                      Ohio (Resident Permit)
                    </option>
                    <option value="WV">
                      West Virginia (Resident Permit)
                    </option>
                    <option value="AZ">
                      Arizona (Resident Permit)
                    </option>
                  </select>
                </div>
                <div className="permit-field-group">
                  <label>
                    Add Non-Resident Multipliers (Expand Nationwide Recognition):
                  </label>
                  <div className="multiplier-chips-wrap">
                    <div className="multiplier-chip" id="chip-UT" data-onclick="toggleMultiplier('UT')">
                      <span className="chip-check">
                        ✓
                      </span>
                      <span>
                        Utah Non-Resident (+DE, +NV, +MN, +WA)
                      </span>
                    </div>
                    <div className="multiplier-chip" id="chip-FL" data-onclick="toggleMultiplier('FL')">
                      <span className="chip-check">
                        ✓
                      </span>
                      <span>
                        Florida Non-Resident (+DE, +NM)
                      </span>
                    </div>
                    <div className="multiplier-chip" id="chip-AZ" data-onclick="toggleMultiplier('AZ')">
                      <span className="chip-check">
                        ✓
                      </span>
                      <span>
                        Arizona Non-Resident (+NV, +DE)
                      </span>
                    </div>
                    <div className="multiplier-chip" id="chip-PA" data-onclick="toggleMultiplier('PA')">
                      <span className="chip-check">
                        ✓
                      </span>
                      <span>
                        Pennsylvania Non-Resident ($20 County Issue)
                      </span>
                    </div>
                    <div className="multiplier-chip" id="chip-VA" data-onclick="toggleMultiplier('VA')">
                      <span className="chip-check">
                        ✓
                      </span>
                      <span>
                        Virginia Non-Resident
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Scorecard HUD Grid */}
            <section aria-label="Coverage Statistics" className="scorecard-hud-grid">
              <div className="scorecard-card highlight">
                <div className="metric-val green" id="metricTotalLegal">
                  34 / 51
                </div>
                <div className="metric-lbl">
                  Total Legal Carry Jurisdictions
                </div>
              </div>
              <div className="scorecard-card">
                <div className="metric-val blue" id="metricConstitutional">
                  29
                </div>
                <div className="metric-lbl">
                  Constitutional Carry (Permitless)
                </div>
              </div>
              <div className="scorecard-card">
                <div className="metric-val green" id="metricHonored">
                  5
                </div>
                <div className="metric-lbl">
                  Permit Honored / Reciprocal
                </div>
              </div>
              <div className="scorecard-card">
                <div className="metric-val amber" id="metricSpecial">
                  2
                </div>
                <div className="metric-lbl">
                  Special Conditions / Multiplier
                </div>
              </div>
              <div className="scorecard-card">
                <div className="metric-val red" id="metricRestricted">
                  15
                </div>
                <div className="metric-lbl">
                  Restricted / Not Honored
                </div>
              </div>
            </section>
            {/* Category Color Legend */}
            <div className="map-legend-bar">
              <div className="legend-item" data-onclick="setCategoryFilter('all')">
                <span className="legend-color-box" style={{"background": "#1e293b", "border": "1px solid var(--accent-cyan)"}}>
                </span>
                <span>
                  Show All (51)
                </span>
              </div>
              <div className="legend-item" data-onclick="setCategoryFilter('constitutional')">
                <span className="legend-color-box box-constitutional">
                </span>
                <span>
                  Constitutional Carry (29 States)
                </span>
              </div>
              <div className="legend-item" data-onclick="setCategoryFilter('honored')">
                <span className="legend-color-box box-honored">
                </span>
                <span>
                  Permit Honored (Reciprocity)
                </span>
              </div>
              <div className="legend-item" data-onclick="setCategoryFilter('special')">
                <span className="legend-color-box box-special">
                </span>
                <span>
                  Special Conditions / Resident Only
                </span>
              </div>
              <div className="legend-item" data-onclick="setCategoryFilter('not_honored')">
                <span className="legend-color-box box-not-honored">
                </span>
                <span>
                  Permit Not Honored / Prohibited
                </span>
              </div>
            </div>
            {/* Search & Quick Filter Controls */}
            <div className="filter-search-toolbar" style={{"gap": "12px", "alignItems": "center"}}>
              <div style={{"display": "flex", "gap": "8px", "flex": "1", "minWidth": "280px", "flexWrap": "wrap"}}>
                <input className="search-input-box" id="stateSearchInput" data-oninput="handleSearch(this.value)" placeholder="🔍 Type state (e.g. VA, Florida)..." style={{"flex": "1", "minWidth": "180px"}} type="text" />
                <select className="search-input-box" id="quickStateJumpSelect" data-onchange="if(this.value){ selectState(this.value); openStateModal(this.value); }" style={{"width": "auto", "minWidth": "170px", "background": "#070b10", "border": "1px solid var(--accent-cyan)", "color": "#fff", "cursor": "pointer", "fontWeight": "700"}}>
                  <option value="">
                    -- Jump to Any State --
                  </option>
                  <option value="AL">
                    Alabama (AL)
                  </option>
                  <option value="AK">
                    Alaska (AK)
                  </option>
                  <option value="AZ">
                    Arizona (AZ)
                  </option>
                  <option value="AR">
                    Arkansas (AR)
                  </option>
                  <option value="CA">
                    California (CA)
                  </option>
                  <option value="CO">
                    Colorado (CO)
                  </option>
                  <option value="CT">
                    Connecticut (CT)
                  </option>
                  <option value="DE">
                    Delaware (DE)
                  </option>
                  <option value="DC">
                    District of Columbia (DC)
                  </option>
                  <option value="FL">
                    Florida (FL)
                  </option>
                  <option value="GA">
                    Georgia (GA)
                  </option>
                  <option value="HI">
                    Hawaii (HI)
                  </option>
                  <option value="ID">
                    Idaho (ID)
                  </option>
                  <option value="IL">
                    Illinois (IL)
                  </option>
                  <option value="IN">
                    Indiana (IN)
                  </option>
                  <option value="IA">
                    Iowa (IA)
                  </option>
                  <option value="KS">
                    Kansas (KS)
                  </option>
                  <option value="KY">
                    Kentucky (KY)
                  </option>
                  <option value="LA">
                    Louisiana (LA)
                  </option>
                  <option value="ME">
                    Maine (ME)
                  </option>
                  <option value="MD">
                    Maryland (MD - Home State)
                  </option>
                  <option value="MA">
                    Massachusetts (MA)
                  </option>
                  <option value="MI">
                    Michigan (MI)
                  </option>
                  <option value="MN">
                    Minnesota (MN)
                  </option>
                  <option value="MS">
                    Mississippi (MS)
                  </option>
                  <option value="MO">
                    Missouri (MO)
                  </option>
                  <option value="MT">
                    Montana (MT)
                  </option>
                  <option value="NE">
                    Nebraska (NE)
                  </option>
                  <option value="NV">
                    Nevada (NV)
                  </option>
                  <option value="NH">
                    New Hampshire (NH)
                  </option>
                  <option value="NJ">
                    New Jersey (NJ)
                  </option>
                  <option value="NM">
                    New Mexico (NM)
                  </option>
                  <option value="NY">
                    New York (NY)
                  </option>
                  <option value="NC">
                    North Carolina (NC)
                  </option>
                  <option value="ND">
                    North Dakota (ND)
                  </option>
                  <option value="OH">
                    Ohio (OH)
                  </option>
                  <option value="OK">
                    Oklahoma (OK)
                  </option>
                  <option value="OR">
                    Oregon (OR)
                  </option>
                  <option value="PA">
                    Pennsylvania (PA - $20 LTCF)
                  </option>
                  <option value="RI">
                    Rhode Island (RI)
                  </option>
                  <option value="SC">
                    South Carolina (SC)
                  </option>
                  <option value="SD">
                    South Dakota (SD)
                  </option>
                  <option value="TN">
                    Tennessee (TN)
                  </option>
                  <option value="TX">
                    Texas (TX)
                  </option>
                  <option value="UT">
                    Utah (UT)
                  </option>
                  <option value="VT">
                    Vermont (VT)
                  </option>
                  <option value="VA">
                    Virginia (VA - Honored)
                  </option>
                  <option value="WA">
                    Washington (WA)
                  </option>
                  <option value="WV">
                    West Virginia (WV)
                  </option>
                  <option value="WI">
                    Wisconsin (WI - Honored)
                  </option>
                  <option value="WY">
                    Wyoming (WY)
                  </option>
                </select>
              </div>
              <div className="filter-pills-wrap">
                <button className="filter-btn-pill active" data-filter="all" data-onclick="setCategoryFilter('all')">
                  All States
                </button>
                <button className="filter-btn-pill" data-filter="can_carry" data-onclick="setCategoryFilter('can_carry')">
                  Where You Can Carry
                </button>
                <button className="filter-btn-pill" data-filter="not_honored" data-onclick="setCategoryFilter('not_honored')">
                  Restricted
                </button>
              </div>
            </div>
            {/* Interactive SVG Map Display */}
            <section aria-label="Interactive Map" className="map-display-container">
              <div className="map-header-indicator">
                <span>
                  Interactive Vector U.S. Reciprocity Map (Click Any State Node to Inspect)
                </span>
                <span style={{"color": "var(--text-muted)", "fontSize": "0.74rem"}}>
                  Full 50 States + DC Real-Time Color Coding
                </span>
              </div>
              <div className="svg-canvas-wrapper">
                <svg className="interactive-us-svg" id="interactiveUsSvg" viewBox="0 0 960 600" xmlns="http://www.w3.org/2000/svg">
  <g className="svg-state-group status-constitutional" data-code="AK" id="stateNode-AK" style={{ cursor: 'pointer' }} data-onclick="selectState('AK'); if(typeof openStateModal==='function') openStateModal('AK');">
    <rect className="state-bg-rect" x="30" y="35" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="60.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">AK</text>
    <text className="state-status-indicator" x="60.0" y="72.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-special" data-code="WA" id="stateNode-WA" style={{ cursor: 'pointer' }} data-onclick="selectState('WA'); if(typeof openStateModal==='function') openStateModal('WA');">
    <rect className="state-bg-rect" x="110" y="35" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="140.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">WA</text>
    <text className="state-status-indicator" x="140.0" y="72.0" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="600">⚠ Cond.</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="ID" id="stateNode-ID" style={{ cursor: 'pointer' }} data-onclick="selectState('ID'); if(typeof openStateModal==='function') openStateModal('ID');">
    <rect className="state-bg-rect" x="185" y="35" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="215.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">ID</text>
    <text className="state-status-indicator" x="215.0" y="72.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="MT" id="stateNode-MT" style={{ cursor: 'pointer' }} data-onclick="selectState('MT'); if(typeof openStateModal==='function') openStateModal('MT');">
    <rect className="state-bg-rect" x="260" y="35" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="290.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">MT</text>
    <text className="state-status-indicator" x="290.0" y="72.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="ND" id="stateNode-ND" style={{ cursor: 'pointer' }} data-onclick="selectState('ND'); if(typeof openStateModal==='function') openStateModal('ND');">
    <rect className="state-bg-rect" x="335" y="35" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="365.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">ND</text>
    <text className="state-status-indicator" x="365.0" y="72.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-special" data-code="MN" id="stateNode-MN" style={{ cursor: 'pointer' }} data-onclick="selectState('MN'); if(typeof openStateModal==='function') openStateModal('MN');">
    <rect className="state-bg-rect" x="410" y="35" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="440.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">MN</text>
    <text className="state-status-indicator" x="440.0" y="72.0" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="600">⚠ Cond.</text>
  </g>
  <g className="svg-state-group status-honored" data-code="WI" id="stateNode-WI" style={{ cursor: 'pointer' }} data-onclick="selectState('WI'); if(typeof openStateModal==='function') openStateModal('WI');">
    <rect className="state-bg-rect" x="485" y="35" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="515.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">WI</text>
    <text className="state-status-indicator" x="515.0" y="72.0" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="600">✓ Recip.</text>
  </g>
  <g className="svg-state-group status-honored" data-code="MI" id="stateNode-MI" style={{ cursor: 'pointer' }} data-onclick="selectState('MI'); if(typeof openStateModal==='function') openStateModal('MI');">
    <rect className="state-bg-rect" x="560" y="35" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="590.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">MI</text>
    <text className="state-status-indicator" x="590.0" y="72.0" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="600">✓ Recip.</text>
  </g>
  <g className="svg-state-group status-not-honored" data-code="NY" id="stateNode-NY" style={{ cursor: 'pointer' }} data-onclick="selectState('NY'); if(typeof openStateModal==='function') openStateModal('NY');">
    <rect className="state-bg-rect" x="710" y="35" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="740.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">NY</text>
    <text className="state-status-indicator" x="740.0" y="72.0" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="600">✕ No</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="VT" id="stateNode-VT" style={{ cursor: 'pointer' }} data-onclick="selectState('VT'); if(typeof openStateModal==='function') openStateModal('VT');">
    <rect className="state-bg-rect" x="785" y="35" width="50" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="810.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">VT</text>
    <text className="state-status-indicator" x="810.0" y="72.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="NH" id="stateNode-NH" style={{ cursor: 'pointer' }} data-onclick="selectState('NH'); if(typeof openStateModal==='function') openStateModal('NH');">
    <rect className="state-bg-rect" x="845" y="35" width="50" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="870.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">NH</text>
    <text className="state-status-indicator" x="870.0" y="72.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="ME" id="stateNode-ME" style={{ cursor: 'pointer' }} data-onclick="selectState('ME'); if(typeof openStateModal==='function') openStateModal('ME');">
    <rect className="state-bg-rect" x="900" y="35" width="50" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="925.0" y="56.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">ME</text>
    <text className="state-status-indicator" x="925.0" y="72.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-special" data-code="OR" id="stateNode-OR" style={{ cursor: 'pointer' }} data-onclick="selectState('OR'); if(typeof openStateModal==='function') openStateModal('OR');">
    <rect className="state-bg-rect" x="110" y="95" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="140.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">OR</text>
    <text className="state-status-indicator" x="140.0" y="132.0" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="600">⚠ Cond.</text>
  </g>
  <g className="svg-state-group status-honored" data-code="NV" id="stateNode-NV" style={{ cursor: 'pointer' }} data-onclick="selectState('NV'); if(typeof openStateModal==='function') openStateModal('NV');">
    <rect className="state-bg-rect" x="185" y="95" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="215.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">NV</text>
    <text className="state-status-indicator" x="215.0" y="132.0" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="600">✓ Recip.</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="WY" id="stateNode-WY" style={{ cursor: 'pointer' }} data-onclick="selectState('WY'); if(typeof openStateModal==='function') openStateModal('WY');">
    <rect className="state-bg-rect" x="260" y="95" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="290.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">WY</text>
    <text className="state-status-indicator" x="290.0" y="132.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="SD" id="stateNode-SD" style={{ cursor: 'pointer' }} data-onclick="selectState('SD'); if(typeof openStateModal==='function') openStateModal('SD');">
    <rect className="state-bg-rect" x="335" y="95" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="365.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">SD</text>
    <text className="state-status-indicator" x="365.0" y="132.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="IA" id="stateNode-IA" style={{ cursor: 'pointer' }} data-onclick="selectState('IA'); if(typeof openStateModal==='function') openStateModal('IA');">
    <rect className="state-bg-rect" x="410" y="95" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="440.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">IA</text>
    <text className="state-status-indicator" x="440.0" y="132.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-special" data-code="IL" id="stateNode-IL" style={{ cursor: 'pointer' }} data-onclick="selectState('IL'); if(typeof openStateModal==='function') openStateModal('IL');">
    <rect className="state-bg-rect" x="485" y="95" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="515.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">IL</text>
    <text className="state-status-indicator" x="515.0" y="132.0" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="600">⚠ Cond.</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="IN" id="stateNode-IN" style={{ cursor: 'pointer' }} data-onclick="selectState('IN'); if(typeof openStateModal==='function') openStateModal('IN');">
    <rect className="state-bg-rect" x="560" y="95" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="590.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">IN</text>
    <text className="state-status-indicator" x="590.0" y="132.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="OH" id="stateNode-OH" style={{ cursor: 'pointer' }} data-onclick="selectState('OH'); if(typeof openStateModal==='function') openStateModal('OH');">
    <rect className="state-bg-rect" x="635" y="95" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="665.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">OH</text>
    <text className="state-status-indicator" x="665.0" y="132.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-honored" data-code="PA" id="stateNode-PA" style={{ cursor: 'pointer' }} data-onclick="selectState('PA'); if(typeof openStateModal==='function') openStateModal('PA');">
    <rect className="state-bg-rect" x="710" y="95" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="740.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">PA</text>
    <text className="state-status-indicator" x="740.0" y="132.0" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="600">✓ Recip.</text>
  </g>
  <g className="svg-state-group status-not-honored" data-code="NJ" id="stateNode-NJ" style={{ cursor: 'pointer' }} data-onclick="selectState('NJ'); if(typeof openStateModal==='function') openStateModal('NJ');">
    <rect className="state-bg-rect" x="785" y="95" width="50" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="810.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">NJ</text>
    <text className="state-status-indicator" x="810.0" y="132.0" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="600">✕ No</text>
  </g>
  <g className="svg-state-group status-not-honored" data-code="MA" id="stateNode-MA" style={{ cursor: 'pointer' }} data-onclick="selectState('MA'); if(typeof openStateModal==='function') openStateModal('MA');">
    <rect className="state-bg-rect" x="845" y="95" width="50" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="870.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">MA</text>
    <text className="state-status-indicator" x="870.0" y="132.0" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="600">✕ No</text>
  </g>
  <g className="svg-state-group status-not-honored" data-code="RI" id="stateNode-RI" style={{ cursor: 'pointer' }} data-onclick="selectState('RI'); if(typeof openStateModal==='function') openStateModal('RI');">
    <rect className="state-bg-rect" x="900" y="95" width="50" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="925.0" y="116.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">RI</text>
    <text className="state-status-indicator" x="925.0" y="132.0" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="600">✕ No</text>
  </g>
  <g className="svg-state-group status-not-honored" data-code="CA" id="stateNode-CA" style={{ cursor: 'pointer' }} data-onclick="selectState('CA'); if(typeof openStateModal==='function') openStateModal('CA');">
    <rect className="state-bg-rect" x="110" y="155" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="140.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">CA</text>
    <text className="state-status-indicator" x="140.0" y="192.0" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="600">✕ No</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="UT" id="stateNode-UT" style={{ cursor: 'pointer' }} data-onclick="selectState('UT'); if(typeof openStateModal==='function') openStateModal('UT');">
    <rect className="state-bg-rect" x="185" y="155" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="215.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">UT</text>
    <text className="state-status-indicator" x="215.0" y="192.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-special" data-code="CO" id="stateNode-CO" style={{ cursor: 'pointer' }} data-onclick="selectState('CO'); if(typeof openStateModal==='function') openStateModal('CO');">
    <rect className="state-bg-rect" x="260" y="155" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="290.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">CO</text>
    <text className="state-status-indicator" x="290.0" y="192.0" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="600">⚠ Cond.</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="NE" id="stateNode-NE" style={{ cursor: 'pointer' }} data-onclick="selectState('NE'); if(typeof openStateModal==='function') openStateModal('NE');">
    <rect className="state-bg-rect" x="335" y="155" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="365.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">NE</text>
    <text className="state-status-indicator" x="365.0" y="192.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="MO" id="stateNode-MO" style={{ cursor: 'pointer' }} data-onclick="selectState('MO'); if(typeof openStateModal==='function') openStateModal('MO');">
    <rect className="state-bg-rect" x="410" y="155" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="440.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">MO</text>
    <text className="state-status-indicator" x="440.0" y="192.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="KY" id="stateNode-KY" style={{ cursor: 'pointer' }} data-onclick="selectState('KY'); if(typeof openStateModal==='function') openStateModal('KY');">
    <rect className="state-bg-rect" x="485" y="155" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="515.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">KY</text>
    <text className="state-status-indicator" x="515.0" y="192.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="WV" id="stateNode-WV" style={{ cursor: 'pointer' }} data-onclick="selectState('WV'); if(typeof openStateModal==='function') openStateModal('WV');">
    <rect className="state-bg-rect" x="560" y="155" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="590.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">WV</text>
    <text className="state-status-indicator" x="590.0" y="192.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-honored" data-code="VA" id="stateNode-VA" style={{ cursor: 'pointer' }} data-onclick="selectState('VA'); if(typeof openStateModal==='function') openStateModal('VA');">
    <rect className="state-bg-rect" x="635" y="155" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="665.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">VA</text>
    <text className="state-status-indicator" x="665.0" y="192.0" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="600">✓ Recip.</text>
  </g>
  <g className="svg-state-group status-not-honored" data-code="MD" id="stateNode-MD" style={{ cursor: 'pointer' }} data-onclick="selectState('MD'); if(typeof openStateModal==='function') openStateModal('MD');">
    <rect className="state-bg-rect" x="710" y="155" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="740.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">MD</text>
    <text className="state-status-indicator" x="740.0" y="192.0" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="600">✕ No</text>
  </g>
  <g className="svg-state-group status-honored" data-code="DE" id="stateNode-DE" style={{ cursor: 'pointer' }} data-onclick="selectState('DE'); if(typeof openStateModal==='function') openStateModal('DE');">
    <rect className="state-bg-rect" x="785" y="155" width="50" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="810.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">DE</text>
    <text className="state-status-indicator" x="810.0" y="192.0" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="600">✓ Recip.</text>
  </g>
  <g className="svg-state-group status-not-honored" data-code="CT" id="stateNode-CT" style={{ cursor: 'pointer' }} data-onclick="selectState('CT'); if(typeof openStateModal==='function') openStateModal('CT');">
    <rect className="state-bg-rect" x="845" y="155" width="50" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="870.0" y="176.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">CT</text>
    <text className="state-status-indicator" x="870.0" y="192.0" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="600">✕ No</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="AZ" id="stateNode-AZ" style={{ cursor: 'pointer' }} data-onclick="selectState('AZ'); if(typeof openStateModal==='function') openStateModal('AZ');">
    <rect className="state-bg-rect" x="185" y="215" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="215.0" y="236.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">AZ</text>
    <text className="state-status-indicator" x="215.0" y="252.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-special" data-code="NM" id="stateNode-NM" style={{ cursor: 'pointer' }} data-onclick="selectState('NM'); if(typeof openStateModal==='function') openStateModal('NM');">
    <rect className="state-bg-rect" x="260" y="215" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="290.0" y="236.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">NM</text>
    <text className="state-status-indicator" x="290.0" y="252.0" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="600">⚠ Cond.</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="KS" id="stateNode-KS" style={{ cursor: 'pointer' }} data-onclick="selectState('KS'); if(typeof openStateModal==='function') openStateModal('KS');">
    <rect className="state-bg-rect" x="335" y="215" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="365.0" y="236.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">KS</text>
    <text className="state-status-indicator" x="365.0" y="252.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="AR" id="stateNode-AR" style={{ cursor: 'pointer' }} data-onclick="selectState('AR'); if(typeof openStateModal==='function') openStateModal('AR');">
    <rect className="state-bg-rect" x="410" y="215" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="440.0" y="236.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">AR</text>
    <text className="state-status-indicator" x="440.0" y="252.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="TN" id="stateNode-TN" style={{ cursor: 'pointer' }} data-onclick="selectState('TN'); if(typeof openStateModal==='function') openStateModal('TN');">
    <rect className="state-bg-rect" x="485" y="215" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="515.0" y="236.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">TN</text>
    <text className="state-status-indicator" x="515.0" y="252.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-honored" data-code="NC" id="stateNode-NC" style={{ cursor: 'pointer' }} data-onclick="selectState('NC'); if(typeof openStateModal==='function') openStateModal('NC');">
    <rect className="state-bg-rect" x="635" y="215" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="665.0" y="236.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">NC</text>
    <text className="state-status-indicator" x="665.0" y="252.0" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="600">✓ Recip.</text>
  </g>
  <g className="svg-state-group status-not-honored" data-code="DC" id="stateNode-DC" style={{ cursor: 'pointer' }} data-onclick="selectState('DC'); if(typeof openStateModal==='function') openStateModal('DC');">
    <rect className="state-bg-rect" x="710" y="215" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="740.0" y="236.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">DC</text>
    <text className="state-status-indicator" x="740.0" y="252.0" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="600">✕ No</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="OK" id="stateNode-OK" style={{ cursor: 'pointer' }} data-onclick="selectState('OK'); if(typeof openStateModal==='function') openStateModal('OK');">
    <rect className="state-bg-rect" x="335" y="275" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="365.0" y="296.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">OK</text>
    <text className="state-status-indicator" x="365.0" y="312.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="LA" id="stateNode-LA" style={{ cursor: 'pointer' }} data-onclick="selectState('LA'); if(typeof openStateModal==='function') openStateModal('LA');">
    <rect className="state-bg-rect" x="410" y="275" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="440.0" y="296.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">LA</text>
    <text className="state-status-indicator" x="440.0" y="312.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="MS" id="stateNode-MS" style={{ cursor: 'pointer' }} data-onclick="selectState('MS'); if(typeof openStateModal==='function') openStateModal('MS');">
    <rect className="state-bg-rect" x="485" y="275" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="515.0" y="296.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">MS</text>
    <text className="state-status-indicator" x="515.0" y="312.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="AL" id="stateNode-AL" style={{ cursor: 'pointer' }} data-onclick="selectState('AL'); if(typeof openStateModal==='function') openStateModal('AL');">
    <rect className="state-bg-rect" x="560" y="275" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="590.0" y="296.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">AL</text>
    <text className="state-status-indicator" x="590.0" y="312.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="SC" id="stateNode-SC" style={{ cursor: 'pointer' }} data-onclick="selectState('SC'); if(typeof openStateModal==='function') openStateModal('SC');">
    <rect className="state-bg-rect" x="635" y="275" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="665.0" y="296.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">SC</text>
    <text className="state-status-indicator" x="665.0" y="312.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="TX" id="stateNode-TX" style={{ cursor: 'pointer' }} data-onclick="selectState('TX'); if(typeof openStateModal==='function') openStateModal('TX');">
    <rect className="state-bg-rect" x="335" y="335" width="100" height="60" rx="6" ry="6" />
    <text className="state-code-text" x="385.0" y="361.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">TX</text>
    <text className="state-status-indicator" x="385.0" y="377.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="GA" id="stateNode-GA" style={{ cursor: 'pointer' }} data-onclick="selectState('GA'); if(typeof openStateModal==='function') openStateModal('GA');">
    <rect className="state-bg-rect" x="560" y="335" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="590.0" y="356.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">GA</text>
    <text className="state-status-indicator" x="590.0" y="372.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-constitutional" data-code="FL" id="stateNode-FL" style={{ cursor: 'pointer' }} data-onclick="selectState('FL'); if(typeof openStateModal==='function') openStateModal('FL');">
    <rect className="state-bg-rect" x="635" y="335" width="70" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="670.0" y="356.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">FL</text>
    <text className="state-status-indicator" x="670.0" y="372.0" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">✓ Carry</text>
  </g>
  <g className="svg-state-group status-not-honored" data-code="HI" id="stateNode-HI" style={{ cursor: 'pointer' }} data-onclick="selectState('HI'); if(typeof openStateModal==='function') openStateModal('HI');">
    <rect className="state-bg-rect" x="110" y="240" width="60" height="50" rx="6" ry="6" />
    <text className="state-code-text" x="140.0" y="261.0" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">HI</text>
    <text className="state-status-indicator" x="140.0" y="277.0" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="600">✕ No</text>
  </g>
</svg>
              </div>
            </section>
            {/* Selected State Spotlight Deck (from Reference 00:00 - 00:04) */}
            <section className="selected-state-banner" id="selectedStateBanner">
              <div className="state-banner-header">
                <div className="banner-meta-col">
                  <div className="sub-reciprocity">
                    RECIPROCITY STATUS
                  </div>
                  <div className="main-state-name" id="spotlightStateName">
                    MARYLAND
                  </div>
                  <div className="carry-verdict-text can-carry" id="spotlightVerdict">
                    You CAN CARRY in this state (Home State Wear & Carry)
                  </div>
                </div>
                <button className="btn-inspect-gun-laws" id="btnInspectLaws" data-onclick="openStateModal(currentStateFocus)">
                  SEE MARYLAND GUN LAWS
                </button>
              </div>
              {/* Neighbor States Quick Status (Reference 00:01 - 00:04) */}
              <div>
                <div style={{"fontFamily": "var(--font-display)", "fontSize": "0.85rem", "color": "var(--text-muted)", "textTransform": "uppercase", "letterSpacing": "1px", "marginBottom": "8px"}}>
                  
          Bordering Jurisdictions & Immediate Carry Status:
        
                </div>
                <div className="neighbor-cards-row" id="neighborCardsRow">
                  {/* Populated dynamically */}
                </div>
              </div>
            </section>
            {/* MARYLAND STATUTORY COMPARISON INSPECTOR */}
            <div className="md-comparison-inspector" id="mdComparisonInspector"></div>
            {/* My Permits List Section (from Reference 00:03 - 00:04) */}
            <section className="my-permits-card">
              <div className="my-permits-header">
                <div className="section-title" style={{"marginBottom": "0"}}>
                  <span>
                    MY ACTIVE PERMITS
                  </span>
                </div>
                <span style={{"fontSize": "0.8rem", "color": "var(--accent-cyan)", "fontWeight": "700", "textTransform": "uppercase"}}>
                  Active Profile
                </span>
              </div>
              <div className="my-permits-list" id="myPermitsList">
                {/* Rendered dynamically */}
              </div>
              <div style={{"display": "flex", "gap": "10px", "marginTop": "10px", "flexWrap": "wrap"}}>
                <button className="btn-add-permit" data-onclick="promptAddPermit()" onClick={() => { if (typeof window !== 'undefined' && (window as any).promptAddPermit) (window as any).promptAddPermit(); }} style={{"flex": "1", "minWidth": "180px"}}>
                  + ADD PERMIT TO WALLET
                </button>
                <button className="btn-remove-permit" data-onclick="promptRemovePermit()" onClick={() => { if (typeof window !== 'undefined' && (window as any).promptRemovePermit) (window as any).promptRemovePermit(); }} style={{"flex": "1", "minWidth": "180px", "background": "rgba(239, 68, 68, 0.12)", "border": "1.5px solid #ef4444", "color": "#f87171", "padding": "12px 18px", "borderRadius": "8px", "fontWeight": "800", "fontSize": "0.86rem", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "gap": "8px", "textTransform": "uppercase", "letterSpacing": "0.5px"}} type="button">
                  🗑️ DELETE PERMIT FROM WALLET
                </button>
              </div>
            </section>
            {/* Vertical State Scroller / Wheel (Reference 00:14 - 00:23) */}
            <section className="vertical-reciprocity-scroller-box">
              <div className="scroller-head-title">
                STATE RECIPROCITY DIRECTORY
              </div>
              <p className="scroller-subtitle">
                Scroll through the vertical index or click any state to review legal recognition and handgun statutes.
              </p>
              <div className="roller-viewport-container">
                <div className="vertical-state-roller" id="stateRollerList">
                  {/* Populated dynamically */}
                </div>
                <div className="roller-selected-display" id="rollerSelectedDisplay">
                  <div className="rd-title">
                    <span id="rollerStateIcon">
                      ✓
                    </span>
                    <span id="rollerStateName">
                      WEST VIRGINIA
                    </span>
                  </div>
                  <p className="rd-desc" id="rollerStateDesc">
                    
            You can carry in West Virginia. Constitutional carry state for 21+. Select this state to inspect full legal reciprocity and transportation rules.
          
                  </p>
                  <button className="btn-roller-next" id="btnRollerInspect" data-onclick="openStateModal(currentRollerState)">
                    INSPECT STATUTES →
                  </button>
                </div>
              </div>
            </section>
            {/* Car Travel & Interstate Highway Corridors Guide */}
            <section className="highway-corridors-box">
              <div className="corridor-header">
                <span>
                  🚗
                </span>
                <span>
                  Mid-Atlantic Highway Carry Corridors & FOPA 18 U.S.C. § 926A Safe Harbor
                </span>
              </div>
              <div className="corridor-cards-grid">
                <div className="corridor-route-card">
                  <h4>
                    I-95 South (MD → VA → NC → SC → GA → FL)
                  </h4>
                  <p>
                    <strong style={{"color": "#fff"}}>
                      100% Legal Carry Highway Corridor!
                    </strong>
                     Maryland Wear & Carry is honored in Virginia and North Carolina; South Carolina, Georgia, and Florida are Constitutional Carry. Remember: North Carolina requires immediate duty to inform upon officer approach.
          
                  </p>
                </div>
                <div className="corridor-route-card">
                  <h4>
                    I-70 / I-68 Westbound (MD → PA → WV → OH → IN → IL → MO)
                  </h4>
                  <p>
                    
            Get a $20 PA Non-Resident LTCF to carry legally across the PA Turnpike. WV, OH, and IN are Constitutional Carry. When entering Illinois, out-of-state CCW permit holders are protected under Illinois in-vehicle safe harbor (must remain in car).
          
                  </p>
                </div>
                <div className="corridor-route-card">
                  <h4>
                    I-95 North Warning (DE → PA → NJ → NY)
                  </h4>
                  <p>
                    <strong style={{"color": "var(--accent-red)"}}>
                      Extreme Caution:
                    </strong>
                     Delaware does NOT honor MD resident permit (requires Utah/Florida non-res). New Jersey and New York have zero reciprocity with mandatory felony penalties. You must strictly store unloaded in locked trunk under FOPA § 926A.
          
                  </p>
                </div>
              </div>
            </section>
            {/* Commercial Airline Flying with a Firearm Guide */}
            <section className="highway-corridors-box" style={{"borderColor": "rgba(255, 183, 3, 0.4)", "background": "linear-gradient(135deg, rgba(16, 22, 31, 0.98) 0%, rgba(13, 18, 25, 0.98) 100%)"}}>
              <div className="corridor-header" style={{"color": "var(--accent-amber)"}}>
                <span>
                  ✈️
                </span>
                <span>
                  Commercial Airline Flying with Firearms (49 CFR § 1540.111 & TSA Rules)
                </span>
              </div>
              <p style={{"fontSize": "0.88rem", "color": "#cbd5e1", "lineHeight": "1.55", "marginBottom": "16px"}}>
                
        Federal law permits airline passengers to transport unloaded firearms in checked baggage. Follow this mandatory 6-step checklist to ensure zero delays or legal penalties at airport counters:
      
              </p>
              <div className="corridor-cards-grid">
                <div className="corridor-route-card">
                  <h4>
                    1. 100% Completely Unloaded
                  </h4>
                  <p>
                    Visually and physically inspect chamber and cylinder. Magazines must be completely empty unless securely enclosed in custom-molded case slots. Double check before leaving home.
                  </p>
                </div>
                <div className="corridor-route-card">
                  <h4>
                    2. Rigid Hard-Sided Lockbox (Pry Test)
                  </h4>
                  <p>
                    Must be in a crush-resistant hard case (Pelican, Vaultek, Apache). Must not be pliable or priable by hand. 
                    <strong>
                      Crucial Federal Rule:
                    </strong>
                     Use non-TSA padlocks only; federal regulations strictly require that ONLY the passenger retains the key or combination.
                  </p>
                </div>
                <div className="corridor-route-card">
                  <h4>
                    3. Factory-Boxed Target Ammo
                  </h4>
                  <p>
                    Ammunition must be in original manufacturer cardboard or plastic grid packaging (under 11 lbs on all major domestic carriers). Loose ammo in bags is strictly forbidden.
                  </p>
                </div>
                <div className="corridor-route-card">
                  <h4>
                    4. Declare at Main Ticket Counter
                  </h4>
                  <p>
                    Walk directly to the airline agent counter: 
                    <em>
                      "I have an unloaded firearm to declare in checked baggage."
                    </em>
                     Sign the orange declaration card and place it inside your checked bag.
                  </p>
                </div>
                <div className="corridor-route-card">
                  <h4>
                    5. Destination Laws Govern
                  </h4>
                  <p>
                    The moment you retrieve luggage at your arrival airport, the laws of that destination state apply to you immediately. Never fly with firearms to states where possession is prohibited.
                  </p>
                </div>
                <div className="corridor-route-card" style={{"borderColor": "rgba(239, 68, 68, 0.4)"}}>
                  <h4 style={{"color": "#ef4444"}}>
                    6. Emergency Flight Diversions (NY/NJ/MA)
                  </h4>
                  <p>
                    <strong style={{"color": "#fff"}}>
                      Critical Legal Protection:
                    </strong>
                     If diverted to NYC, Newark, or Boston, REFUSE physical custody of your checked bag at baggage claim. Demand the airline check it through to your final destination to maintain FOPA safe harbor.
                  </p>
                </div>
              </div>
            </section>
            {/* Action Training Dock */}
            {/* Action Training Dock */}
            {/* ================= LEAD MAGNET: FREE 2026 MID-ATLANTIC CARRY GUIDE ================= */}
            <div className="lead-magnet-card" style={{"background": "linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(13, 19, 27, 0.98) 100%)", "border": "2px solid var(--accent-cyan)", "boxShadow": "0 0 25px rgba(0, 229, 255, 0.2)", "borderRadius": "16px", "padding": "22px 24px", "margin": "24px 0"}}>
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "flexWrap": "wrap", "gap": "14px", "marginBottom": "14px"}}>
                <div style={{"maxWidth": "680px"}}>
                  <span className="badge-instructor" style={{"marginBottom": "6px"}}>
                    Complimentary Travel Resource
                  </span>
                  <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.55rem", "color": "#fff", "textTransform": "uppercase", "margin": "4px 0 6px"}}>
                    
            📘 Planning an Interstate Road Trip? Free 2026 Mid-Atlantic Carry Guide (PDF)
          
                  </h3>
                  <p style={{"fontSize": "0.88rem", "color": "#cbd5e1", "lineHeight": "1.55"}}>
                    
            Download Coach Kai Wade's complimentary multi-state transport reference guide covering Maryland, Virginia, Pennsylvania, Delaware, and Florida reciprocity corridors.
          
                  </p>
                </div>
                <span className="meta-chip chip-status" style={{"fontSize": "0.82rem", "padding": "4px 12px"}}>
                  INSTANT DOWNLOAD
                </span>
              </div>
              <form id="reciprocityLeadForm" data-onsubmit="handleLeadMagnetSubmit(event)" style={{"display": "flex", "gap": "10px", "flexWrap": "wrap", "alignItems": "center"}}>
                <input id="leadFullName" placeholder="Your Full Name" required style={{"flex": "1", "minWidth": "200px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "11px 14px", "borderRadius": "8px", "fontSize": "0.90rem"}} type="text" />
                <input id="leadEmail" placeholder="Your Email Address" required style={{"flex": "1", "minWidth": "220px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "11px 14px", "borderRadius": "8px", "fontSize": "0.90rem"}} type="email" />
                <button className="btn-primary" style={{"width": "auto", "padding": "11px 22px", "fontSize": "0.92rem", "fontWeight": "800", "textTransform": "uppercase", "whiteSpace": "nowrap", "boxShadow": "0 0 16px var(--accent-cyan-glow)"}} type="submit">
                  
          📥 Get Free Guide (PDF) →
        
                </button>
              </form>
              <div className="status-msg" id="lead-status" style={{"display": "none", "marginTop": "12px"}}>
              </div>
            </div>
            {/* Standard Statutory Disclaimer for Interstate Carry & Travel Tools */}
            <div className="statutory-disclaimer-card" style={{"background": "rgba(7, 11, 16, 0.92)", "border": "1px solid var(--border-subtle)", "borderLeft": "3px solid var(--accent-amber)", "borderRadius": "10px", "padding": "14px 18px", "margin": "24px 0", "fontSize": "0.82rem", "color": "#cbd5e1", "lineHeight": "1.55"}}>
              <strong style={{"color": "var(--accent-amber)", "textTransform": "uppercase", "fontFamily": "var(--font-display)", "letterSpacing": "0.8px", "display": "block", "marginBottom": "4px"}}>
                
        ⚖️ Official Statutory Notice & Travel Disclaimer:
      
              </strong>
              
      This reciprocity navigator and interstate highway transportation guide is compiled for educational planning purposes only and does not constitute individualized legal counsel. Handgun reciprocity agreements, sensitive places mandates (including Maryland SB 1), and magazine capacity statutes are subject to frequent legislative and judicial updates. Always verify current statutory requirements directly with official state police licensing agencies prior to interstate travel.
      
              <span style={{"display": "block", "marginTop": "4px", "color": "var(--text-muted)", "fontSize": "0.78rem"}}>
                Future Initiative Firearm Services • Lead Instructor Kai Wade (Certified MSP Qualified Handgun Instructor § 5-101, NRA Certified Pistol Instructor & RSO)
              </span>
            </div>
            <div className="fifs-action-dock" style={{"background": "linear-gradient(135deg, rgba(0, 229, 255, 0.12) 0%, rgba(13, 19, 27, 0.98) 100%)", "border": "2px solid var(--accent-cyan)", "boxShadow": "0 0 25px var(--accent-cyan-glow)", "borderRadius": "16px", "padding": "26px 20px", "marginTop": "32px", "textAlign": "center"}}>
              <span className="badge-instructor" style={{"marginBottom": "8px"}}>
                Future Initiative Firearm Services
              </span>
              <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.85rem", "color": "#fff", "textTransform": "uppercase", "letterSpacing": "1.2px", "marginTop": "4px"}}>
                Ready to Expand Your Multi-State Carry Footprint?
              </h3>
              <p style={{"color": "#cbd5e1", "fontSize": "0.92rem", "maxWidth": "780px", "margin": "6px auto 18px", "lineHeight": "1.55"}}>
                
        Train with Lead Instructor Kai Wade (Certified MSP Qualified Handgun Instructor § 5-101 and NRA Certified) at Cindy's Hot Shots. Build real confidence, master Maryland self-defense law, and obtain multi-state carry authorization across 34+ states.
      
              </p>
              <div style={{"display": "flex", "gap": "12px", "justifyContent": "center", "flexWrap": "wrap"}}>
                <a className="btn-cta-dock" href="https://trainwithfifs.com" rel="noopener noreferrer" style={{"background": "var(--accent-cyan)", "color": "#070b10", "fontFamily": "var(--font-display)", "fontSize": "1.05rem", "fontWeight": "800", "letterSpacing": "1px", "textTransform": "uppercase", "padding": "12px 24px", "borderRadius": "8px", "textDecoration": "none", "display": "inline-flex", "alignItems": "center", "gap": "8px", "boxShadow": "0 0 18px var(--accent-cyan-glow)"}} target="_blank">
                  
          🎯 Book Maryland CCW & HQL Combo →
        
                </a>
                <a className="btn-cta-dock" href="https://trainwithfifs.com?tab=booking" rel="noopener noreferrer" style={{"background": "rgba(255, 183, 3, 0.15)", "border": "1px solid var(--accent-amber)", "color": "var(--accent-amber)", "fontFamily": "var(--font-display)", "fontSize": "1.05rem", "fontWeight": "800", "letterSpacing": "1px", "textTransform": "uppercase", "padding": "12px 24px", "borderRadius": "8px", "textDecoration": "none", "display": "inline-flex", "alignItems": "center", "gap": "8px"}} target="_blank">
                  
          ⏱️ Book 8-Hour CCW Renewal (10% Off) →
        
                </a>
                <a className="btn-cta-dock" href="https://trainwithfifs.com?tab=portal" rel="noopener noreferrer" style={{"background": "rgba(255, 255, 255, 0.08)", "border": "1px solid var(--border-subtle)", "color": "#fff", "fontFamily": "var(--font-display)", "fontSize": "1.05rem", "fontWeight": "800", "letterSpacing": "1px", "textTransform": "uppercase", "padding": "12px 24px", "borderRadius": "8px", "textDecoration": "none", "display": "inline-flex", "alignItems": "center", "gap": "8px"}} target="_blank">
                  
          ⚡ Access Student Portal →
        
                </a>
              </div>
            </div>
            {/* Persistent Bottom Modal Dismissal Action Bar */}
            <div style={{"marginTop": "32px", "padding": "22px 16px", "textAlign": "center", "borderTop": "1px solid var(--border-subtle)", "background": "#070b10", "borderRadius": "14px", "display": "flex", "justifyContent": "center", "alignItems": "center", "gap": "16px", "flexWrap": "wrap"}}>
              <button className="btn-return-home" data-onclick="toggleReciprocityHubModal(false)" style={{"minHeight": "48px", "padding": "12px 28px", "fontSize": "1.05rem", "cursor": "pointer"}} type="button">
                
        ← RETURN TO MAIN PLATFORM
      
              </button>
              <button className="btn-secondary-modal" data-onclick="toggleReciprocityHubModal(false); openAndSwitch('booking');" style={{"padding": "12px 20px", "fontSize": "0.95rem", "fontWeight": "700"}} type="button">
                
        🎯 View All Training Courses
      
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* State Gun Laws Detail Flyout / Modal */}
      <div className="state-drawer-overlay" id="stateModalOverlay" data-onclick="handleModalOverlayClick(event)" style={{"display": "none", "zIndex": "9999999"}}>
        <div className="state-drawer-modal">
          <div className="modal-sticky-head">
            <h3 id="modalHeadTitle">
              MARYLAND GUN LAWS
            </h3>
            <button className="btn-close-modal" data-onclick="closeStateModal()">
              ×
            </button>
          </div>
          <div className="modal-body-content">
            <div className="modal-state-hero">
              <div className="modal-state-badge-circle" id="modalStateBadgeCode">
                MD
              </div>
              <div className="modal-state-titles">
                <h2 id="modalStateName">
                  MARYLAND
                </h2>
                <p id="modalStateVerdict" style={{"color": "var(--accent-green)"}}>
                  You CAN CARRY in this state
                </p>
              </div>
            </div>
            {/* Navigation Tabs (Reference 00:06 - 00:08) */}
            <div className="modal-tab-strip">
              <button className="modal-tab-btn active" id="tabBtnBasics" data-onclick="switchModalTab('basics')">
                Carry Basics
              </button>
              <button className="modal-tab-btn" id="tabBtnLaws" data-onclick="switchModalTab('laws')">
                Statutory Laws & Permits
              </button>
              <button className="modal-tab-btn" id="tabBtnLocations" data-onclick="switchModalTab('locations')">
                Vehicle & Locations
              </button>
            </div>
            {/* Tab 1: Carry Basics Accordion */}
            <div className="tab-content-panel" id="tabContentBasics">
              <div className="statute-accordion-list" id="statuteAccordionList">
                {/* Rendered dynamically with YES/NO/INFO badges */}
              </div>
            </div>
            {/* Tab 2: Laws & Permits Details */}
            <div className="tab-content-panel" id="tabContentLaws" style={{"display": "none"}}>
              <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "18px", "marginBottom": "12px"}}>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "marginBottom": "8px"}}>
                  PERMIT RECIPROCITY STATUTES
                </h4>
                <p id="modalStatuteReciprocityText" style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.55", "marginBottom": "12px"}}>
                </p>
                <div style={{"fontSize": "0.84rem", "color": "#cbd5e1", "borderLeft": "3px solid var(--accent-amber)", "paddingLeft": "12px"}}>
                  <strong>
                    Duty to Inform Law Enforcement:
                  </strong>
                  <span id="modalDutyToInformText">
                  </span>
                </div>
              </div>
              <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "18px"}}>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "marginBottom": "8px"}}>
                  MAGAZINE & AMMUNITION STATUTES
                </h4>
                <p id="modalMagAmmoText" style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.55"}}>
                </p>
              </div>
            </div>
            {/* Tab 3: Locations & Vehicle Transport */}
            <div className="tab-content-panel" id="tabContentLocations" style={{"display": "none"}}>
              <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "18px", "marginBottom": "12px"}}>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "marginBottom": "8px"}}>
                  VEHICLE CARRY RULES
                </h4>
                <p id="modalVehicleCarryText" style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.55", "marginBottom": "12px"}}>
                </p>
                <div style={{"background": "rgba(0, 229, 255, 0.06)", "border": "1px solid rgba(0, 229, 255, 0.2)", "borderRadius": "8px", "padding": "12px", "fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  <strong>
                    Federal FOPA 18 U.S.C. § 926A Safe Harbor:
                  </strong>
                   Protects travelers transporting unloaded firearms in locked trunks between two states where carry or possession is lawful, regardless of intermediate state prohibitions, provided travel is continuous with no unreasonable stops.
            
                </div>
              </div>
              <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "18px"}}>
                <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-amber)", "marginBottom": "8px"}}>
                  RESTRICTED CARRY LOCATIONS
                </h4>
                <p style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "lineHeight": "1.55"}}>
                  
              Federal properties (post offices, federal courthouses, military installations), correctional institutions, public school grounds K-12, airport sterile secure zones past TSA checkpoints, and privately posted properties where prohibited by law.
            
                </p>
              </div>
            </div>
            {/* Persistent Bottom Close Bar for State Modal */}
            <div style={{"marginTop": "24px", "paddingTop": "16px", "borderTop": "1px solid var(--border-subtle)", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "10px"}}>
              <span style={{"fontSize": "0.78rem", "color": "var(--text-muted)"}}>
                Future Initiative Firearm Services • State Compliance
              </span>
              <button className="btn-secondary-modal" data-onclick="closeStateModal()" style={{"padding": "10px 22px", "fontSize": "0.92rem", "fontWeight": "800", "cursor": "pointer"}} type="button">
                
            ← Close State Laws
          
              </button>
            </div>
          </div>
        </div>
      </div>
            {/* ================= 34+ STATE MULTI-PERMIT EXPANSION SYSTEM FULL-SCREEN MODAL ================= */}
      <div className="reciprocity-hub-modal-overlay" id="multiPermitModal" data-onclick="if(event.target===this) toggleMultiPermitModal(false)" onClick={(e) => { if (e.target === e.currentTarget && typeof window !== 'undefined' && (window as any).toggleMultiPermitModal) (window as any).toggleMultiPermitModal(false); }} style={{"display": "none", "position": "fixed", "inset": "0", "width": "100%", "height": "100%", "background": "rgba(4, 7, 11, 0.96)", "backdropFilter": "blur(16px)", "WebkitBackdropFilter": "blur(16px)", "zIndex": "999999", "overflowY": "auto", "padding": "24px 16px"}}>
        <div style={{"maxWidth": "1240px", "margin": "0 auto", "position": "relative"}}>
          <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "18px", "paddingBottom": "12px", "borderBottom": "1px solid var(--border-subtle)", "flexWrap": "wrap", "gap": "10px"}}>
            <h2 style={{"fontFamily": "var(--font-display)", "fontSize": "1.65rem", "color": "#fff", "letterSpacing": "1px", "display": "flex", "alignItems": "center", "gap": "10px"}}>
              <span>⭐</span>
              <span>34+ State Multi-Permit Expansion System | FIFS SOP &amp; Field Guide</span>
            </h2>
            <div style={{"display": "flex", "gap": "10px", "alignItems": "center", "flexWrap": "wrap"}}>
              <a href="/FIFS-34-State-Multi-Permit-SOP-Field-Guide.html" target="_blank" rel="noopener noreferrer" className="btn-spark" style={{"textDecoration": "none", "padding": "8px 16px", "fontSize": "0.85rem", "minHeight": "40px", "display": "inline-flex", "alignItems": "center", "gap": "6px", "borderColor": "#F59E0B", "color": "#F59E0B"}}>
                <span>↗ Open in New Window</span>
              </a>
              <button className="btn-return-home" data-onclick="toggleMultiPermitModal(false)" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleMultiPermitModal) (window as any).toggleMultiPermitModal(false); }} style={{"padding": "8px 18px", "fontSize": "0.95rem", "minHeight": "40px", "cursor": "pointer"}} type="button">
                ✕ CLOSE GUIDE
              </button>
            </div>
          </div>
          <div style={{"background": "#070A11", "borderRadius": "16px", "border": "1px solid rgba(245, 158, 11, 0.35)", "overflow": "hidden", "boxShadow": "0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(245, 158, 11, 0.2)"}}>
            <iframe
              src="/FIFS-34-State-Multi-Permit-SOP-Field-Guide.html"
              title="34+ State Multi-Permit Expansion System | FIFS SOP & Field Guide"
              style={{"width": "100%", "height": "85vh", "border": "none", "display": "block", "background": "#070A11"}}
            />
          </div>
          {/* Persistent Bottom Modal Dismissal Action Bar */}
          <div style={{"marginTop": "32px", "padding": "22px 16px", "textAlign": "center", "borderTop": "1px solid var(--border-subtle)", "background": "#070b10", "borderRadius": "14px", "display": "flex", "justifyContent": "center", "alignItems": "center", "gap": "16px", "flexWrap": "wrap"}}>
            <button className="btn-return-home" data-onclick="toggleMultiPermitModal(false)" onClick={() => { if (typeof window !== 'undefined' && (window as any).toggleMultiPermitModal) (window as any).toggleMultiPermitModal(false); }} style={{"minHeight": "48px", "padding": "12px 28px", "fontSize": "1.05rem", "cursor": "pointer"}} type="button">
              ← RETURN TO STUDENT PORTAL
            </button>
            <a href="/FIFS-34-State-Multi-Permit-SOP-Field-Guide.html" target="_blank" rel="noopener noreferrer" className="btn-spark" style={{"textDecoration": "none", "padding": "12px 24px", "fontSize": "0.95rem", "minHeight": "48px", "display": "inline-flex", "alignItems": "center", "gap": "8px", "borderColor": "#F59E0B", "color": "#F59E0B"}}>
              <span>↗ Open in Standalone Tab</span>
            </a>
          </div>
        </div>
      </div>
      {/* ================= MODAL: CLIENT PERMIT HOLDER FAQ ================= */}
      <div className="reciprocity-hub-modal-overlay" id="clientFaqModal" data-onclick="if(event.target===this) closeClientFaqModal()" onClick={(e) => { if (e.target === e.currentTarget && typeof window !== 'undefined' && (window as any).closeClientFaqModal) (window as any).closeClientFaqModal(); }} style={{"display": "none", "position": "fixed", "inset": "0", "width": "100%", "height": "100%", "background": "rgba(4, 7, 11, 0.96)", "backdropFilter": "blur(16px)", "WebkitBackdropFilter": "blur(16px)", "zIndex": "999999", "overflowY": "auto", "padding": "24px 16px"}}>
        <div style={{"maxWidth": "960px", "margin": "0 auto", "position": "relative"}}>
          <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "18px", "paddingBottom": "12px", "borderBottom": "1px solid var(--border-subtle)", "flexWrap": "wrap", "gap": "10px"}}>
            <h2 style={{"fontFamily": "var(--font-display)", "fontSize": "1.65rem", "color": "#fff", "letterSpacing": "1px", "display": "flex", "alignItems": "center", "gap": "10px"}}>
              <span>❓</span>
              <span>Permit Holder Frequently Asked Questions</span>
            </h2>
            <button className="btn-return-home" data-onclick="closeClientFaqModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closeClientFaqModal) (window as any).closeClientFaqModal(); }} style={{"padding": "8px 18px", "fontSize": "0.95rem", "minHeight": "40px", "cursor": "pointer"}} type="button">
              ✕ CLOSE FAQ
            </button>
          </div>
          <div className="fi-checklist-card" style={{"background": "#0d131d", "border": "1px solid var(--border-subtle)", "borderRadius": "16px", "padding": "24px"}}>
            <div className="faq-accordion-group">
              <div className="faq-item" data-onclick="toggleFaq(this)">
                <div className="faq-q">
                  <span>
                    When should I begin my Maryland Wear &amp; Carry renewal process?
                  </span>
                  <span className="faq-icon">
                    +
                  </span>
                </div>
                <div className="faq-a">
                  <p>
                    Maryland State Police recommend completing your required 8-hour training course and submitting your renewal application in the MSP Licensing Portal between 90 and 120 days prior to expiration. This ensures sufficient time for state background processing and prevents any lapse in your permit validity.
                  </p>
                </div>
              </div>
              <div className="faq-item" data-onclick="toggleFaq(this)">
                <div className="faq-q">
                  <span>
                    Do I need to submit new fingerprints for my Maryland Wear &amp; Carry renewal?
                  </span>
                  <span className="faq-icon">
                    +
                  </span>
                </div>
                <div className="faq-a">
                  <p>
                    No. For standard Maryland Wear &amp; Carry permit renewals, livescan fingerprints are NOT required again. You only need your signed MSP Form 29-14 score sheet from a certified Qualified Handgun Instructor, updated passport photo, and the state renewal fee.
                  </p>
                </div>
              </div>
              <div className="faq-item" data-onclick="toggleFaq(this)">
                <div className="faq-q">
                  <span>
                    How does FOPA 18 U.S.C. § 926A protect me when driving through non-reciprocal states?
                  </span>
                  <span className="faq-icon">
                    +
                  </span>
                </div>
                <div className="faq-a">
                  <p>
                    The federal Firearm Owners Protection Act allows you to transport a firearm through any state regardless of local laws, provided: you can legally possess it at origin and destination, the firearm is unloaded, neither the firearm nor ammunition is accessible from the passenger compartment, and both are locked in the trunk or rear cargo container. Travel must be continuous and uninterrupted.
                  </p>
                </div>
              </div>
              <div className="faq-item" data-onclick="toggleFaq(this)">
                <div className="faq-q">
                  <span>
                    Can TSA agents open my locked firearm case at the airport without me?
                  </span>
                  <span className="faq-icon">
                    +
                  </span>
                </div>
                <div className="faq-a">
                  <p>
                    No. Federal regulation (49 CFR § 1540.111) specifies that only the passenger may possess the key or combination to the locked firearm container. If TSA requires physical inspection during baggage screening, airline protocol dictates that they must page you to the screening area to open the case in your presence.
                  </p>
                </div>
              </div>
              <div className="faq-item" data-onclick="toggleFaq(this)">
                <div className="faq-q">
                  <span>
                    What is the difference between Constitutional Carry and Reciprocity?
                  </span>
                  <span className="faq-icon">
                    +
                  </span>
                </div>
                <div className="faq-a">
                  <p>
                    Constitutional Carry (permitless carry) means a state allows lawful adults to carry concealed without needing any permit. Reciprocity means a state formally recognizes a permit issued by another specific state through statutory agreement or executive reciprocity order.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div style={{"marginTop": "24px", "textAlign": "center"}}>
            <button className="btn-return-home" data-onclick="closeClientFaqModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closeClientFaqModal) (window as any).closeClientFaqModal(); }} style={{"minHeight": "44px", "padding": "10px 24px", "fontSize": "0.95rem", "cursor": "pointer"}} type="button">
              ← RETURN TO CLIENT PORTAL
            </button>
          </div>
        </div>
      </div>




      {/* ================= DESIGNATED COLLECTOR INFO MODAL ================= */}
      <div className="state-dossier-modal-overlay" id="collectorInfoModal" data-onclick="if(event.target===this) closeCollectorModal()" style={{"display": "none"}}>
        <div aria-modal="true" className="state-dossier-card" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "620px"}}>
          <button aria-label="Close modal" className="dossier-close-btn" data-onclick="closeCollectorModal()" type="button">
            ✕
          </button>
          <div style={{"marginBottom": "14px"}}>
            <span style={{"background": "rgba(255, 183, 3, 0.15)", "border": "1px solid var(--accent-amber)", "color": "var(--accent-amber)", "fontFamily": "var(--font-display)", "fontSize": "0.80rem", "fontWeight": "800", "padding": "3px 10px", "borderRadius": "4px", "textTransform": "uppercase"}}>
              Maryland State Police Exemption
            </span>
            <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.6rem", "color": "#fff", "marginTop": "6px"}}>
              Maryland Designated Firearms Collector Status
            </h3>
          </div>
          <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "8px", "padding": "14px", "marginBottom": "14px", "fontSize": "0.88rem", "color": "#e2e8f0", "lineHeight": "1.55"}}>
            <p>
              <strong>
                Statutory Purpose:
              </strong>
               Under Maryland Public Safety § 5-123 and COMAR 29.03.01.29, Maryland law limits citizens to one regulated firearm purchase per 30-day statutory period. Approval as a 
              <em>
                Designated Firearms Collector
              </em>
               establishes a permanent statutory exemption, permitting the lawful purchase and transfer of multiple regulated firearms without waiting periods between purchases.
            </p>
          </div>
          <div style={{"marginBottom": "16px"}}>
            <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.1rem", "color": "var(--accent-cyan)", "marginBottom": "8px"}}>
              4 Steps to Become a Designated Collector:
            </h4>
            <ol style={{"fontSize": "0.86rem", "color": "var(--text-muted)", "lineHeight": "1.65", "paddingLeft": "20px"}}>
              <li>
                <strong>
                  Download MSP Form 77R-3:
                </strong>
                 A simple, 1-page affidavit from the Maryland State Police Licensing Division.
              </li>
              <li>
                <strong>
                  Fill Out Your Details:
                </strong>
                 State that you collect firearms for personal study, recreation, historical interest, or investment.
              </li>
              <li>
                <strong>
                  Sign Before a Notary Public:
                </strong>
                 The signature must be notarized (Lead Instructor Kai Wade can provide notarization or verification).
              </li>
              <li>
                <strong>
                  Submit to MSP:
                </strong>
                 Mail the notarized application to MSP Licensing Division in Pikesville, MD. There is 
                <strong>
                  $0 state filing fee
                </strong>
                !
              </li>
            </ol>
          </div>
          <div style={{"display": "flex", "gap": "10px", "flexWrap": "wrap"}}>
            <a className="btn-primary" href="https://mdsp.maryland.gov/Organization/Pages/CriminalInvestigationBureau/LicensingDivision/Firearms/FirearmsCollectors.aspx" rel="noopener noreferrer" style={{"flex": "1", "textAlign": "center", "textDecoration": "none"}} target="_blank">
              
          Open MSP Collector Portal Page ↗
        
            </a>
            <button className="btn-secondary-modal" data-onclick="closeCollectorModal()" type="button">
              
          Close
        
            </button>
          </div>
        </div>
      </div>
      {/* ================= EXPECTATION DETAIL POPUP MODAL ================= */}
      <div className="goal-modal-overlay" id="expectationModal" data-onclick="if(event.target===this) closeExpectationModal()" style={{"display": "none"}}>
        <div aria-labelledby="expectModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog">
          <button aria-label="Close details" className="goal-modal-close-btn" data-onclick="closeExpectationModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" id="expectModalBadge">
              What to Bring & What to Expect
            </span>
          </div>
          <h3 className="goal-modal-title" id="expectModalTitle" style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
            <span id="expectModalIcon">
              🔫
            </span>
            <span id="expectModalHeading">
              Guidelines
            </span>
          </h3>
          <div className="goal-modal-rec" id="expectModalSubtitle">
            Class Day Preparation Standards
          </div>
          <div className="goal-synopsis-card" id="expectModalSynopsis" style={{"marginBottom": "16px"}}>
            {/* Filled dynamically */}
          </div>
          <div id="expectModalSectionsGrid" style={{"display": "flex", "flexDirection": "column", "gap": "12px", "marginBottom": "20px"}}>
            {/* Detailed section cards */}
          </div>
          <div className="goal-modal-actions" style={{"flexDirection": "column", "alignItems": "center", "width": "100%", "position": "relative", "marginTop": "14px"}}>
            
            <button id="btnExpectationUnderstood" className="btn-primary" data-onclick="closeExpectationModal()" type="button" style={{"width": "100%", "maxWidth": "520px", "borderRadius": "8px", "position": "relative", "zIndex": "3", "boxShadow": "0 4px 20px rgba(0, 229, 255, 0.25)"}}>
              
    Understood & Return to Checklist ✔
  
            </button>
          </div>
        </div>
      </div>
      {/* ================= STEP 12: PORTAL SELECTION SPLASH MODAL ================= */}
      {/* ================= STEP 12: PORTAL SELECTION SPLASH MODAL ================= */}
      <div className="fi-portal-modal-overlay" id="fiPortalSelectionModal" data-onclick="if(event.target===this) closePortalSelectionModal()" style={{"display": "none"}}>
        <div aria-labelledby="fiPortalSelectTitle" aria-modal="true" className="fi-portal-modal-card" data-onclick="event.stopPropagation()" role="dialog">
          <button aria-label="Close Portal Selector" className="goal-modal-close-btn" data-onclick="closePortalSelectionModal()" type="button">
            ✕
          </button>
          <div style={{"textAlign": "center", "marginBottom": "20px"}}>
            <h2 id="fiPortalSelectTitle" style={{"fontFamily": "var(--font-display)", "fontSize": "2.2rem", "letterSpacing": "2px", "textTransform": "uppercase", "color": "#fff", "marginBottom": "4px"}}>
              Future Initiative
            </h2>
            <p style={{"color": "var(--accent-cyan)", "fontFamily": "var(--font-display)", "fontSize": "1.15rem", "letterSpacing": "1.5px", "textTransform": "uppercase", "fontWeight": "700"}}>
              Choose Your Portal
            </p>
          </div>
          <div className="fi-select-grid">
            {/* OPTION 1: STUDENT PORTAL */}
            <div className="fi-select-card">
              <div>
                <span className="fi-card-badge fi-card-badge-cyan">
                  Enrolled Students
                </span>
                <h3 className="fi-card-title">
                  Student Portal
                </h3>
                <p className="fi-card-desc">
                  For current Future Initiative students
                </p>
                <ul className="fi-card-list">
                  <li>
                    <span>
                      🎓
                    </span>
                     Maryland HQL & Wear & Carry Curriculum
                  </li>
                  <li>
                    <span>
                      🗺️
                    </span>
                     8-Step Training Milestone Roadmap
                  </li>
                  <li>
                    <span>
                      📋
                    </span>
                     Mandatory Range Prep Tasks Checklist
                  </li>
                  <li>
                    <span>
                      📄
                    </span>
                     Official MSP Form 29-14 Score Sheet Link
                  </li>
                  <li>
                    <span>
                      📘
                    </span>
                     Course Follow-Along Training Packets
                  </li>
                </ul>
              </div>
              <button className="btn-primary" data-onclick="closePortalSelectionModal(); openAndSwitch('portal');" style={{"width": "100%", "padding": "13px"}} type="button">
                
            Open Student Portal →
          
              </button>
            </div>
            {/* OPTION 2: FUTURE INITIATIVE PORTAL */}
            <div className="fi-select-card highlight">
              <div>
                <span className="fi-card-badge fi-card-badge-amber">
                  Permit Holders & Firearm Owners
                </span>
                <h3 className="fi-card-title">
                  Future Initiative Portal
                </h3>
                <p className="fi-card-desc">
                  For CCW/permit holders, firearm owners, and Future Initiative clients
                </p>
                <ul className="fi-card-list">
                  <li>
                    <span>
                      🗺️
                    </span>
                     Interactive 50-State Reciprocity Hub
                  </li>
                  <li>
                    <span>
                      🚗
                    </span>
                     Interstate & Vehicle Highway Travel (FOPA § 926A)
                  </li>
                  <li>
                    <span>
                      ✈️
                    </span>
                     Commercial Air Travel & TSA Packing Standards
                  </li>
                  <li>
                    <span>
                      ⏱️
                    </span>
                     Permit Expiration Calculator & 90-Day Renewal Hub
                  </li>
                  <li>
                    <span>
                      🎁
                    </span>
                     10% Future Initiative Renewal Training Offer
                  </li>
                </ul>
              </div>
              <button className="btn-spark" data-onclick="closePortalSelectionModal(); openAndSwitch('fi-portal');" style={{"width": "100%", "padding": "13px"}} type="button">
                
            Open Future Initiative Portal →
          
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Goal Synopsis Interactive Pop-Up Modal */}
      <div className="goal-modal-overlay" id="goalSynopsisModal" data-onclick="if(event.target===this) closeGoalSynopsis()" style={{"display": "none"}}>
        <div aria-labelledby="goalModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog">
          <button aria-label="Close details" className="goal-modal-close-btn" data-onclick="closeGoalSynopsis()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" id="goalModalBadge">
              Guidance & Course Selection
            </span>
          </div>
          <h3 className="goal-modal-title" id="goalModalTitle">
            Goal Title
          </h3>
          <div className="goal-modal-rec" id="goalModalRec">
            Recommended Course
          </div>
          <div className="goal-synopsis-card" id="goalModalSynopsis">
            
        Synopsis text will appear here.
      
          </div>
          {/* Download Free PDF Guide for New Shooters */}
          <div className="guide-download-banner" id="goalModalGuideBanner" style={{"display": "none"}}>
            <div className="guide-banner-text">
              <strong style={{"color": "var(--accent-cyan)", "display": "block", "fontSize": "0.92rem"}}>
                📘 Free Student Resource: Top 50 Questions New Gun Owners Ask
              </strong>
              <span>
                Comprehensive 6-page Maryland-compliant guide prepared by Instructor Kai Wade.
              </span>
            </div>
            <a className="btn-download-guide" href="https://ufqnmcincwnlyiwsmzcq.supabase.co/storage/v1/object/public/documents/top-50-questions-new-gun-owners.pdf" rel="noopener noreferrer" target="_blank">
              <span>
                📥 View & Download PDF
              </span>
            </a>
          </div>
          {/* Maryland State Police Wear and Carry Portal User's Guide (MSP Media 474) */}
          <div className="guide-download-banner" id="goalModalMspPortalBanner" style={{"display": "none", "marginTop": "10px", "borderColor": "var(--accent-amber)", "background": "linear-gradient(135deg, rgba(255, 183, 3, 0.12) 0%, rgba(13, 19, 27, 0.95) 100%)"}}>
            <div className="guide-banner-text">
              <strong style={{"color": "var(--accent-amber)", "display": "block", "fontSize": "0.92rem"}}>
                🌐 Official State Resource: Maryland Wear & Carry Portal User's Guide (MSP)
              </strong>
              <span>
                Comprehensive 20-page Maryland State Police walkthrough explaining account setup, score sheet upload, and application tracking.
              </span>
            </div>
            <a className="btn-download-guide" href="https://mdsp.maryland.gov/media/474" rel="noopener noreferrer" style={{"background": "var(--accent-amber)", "color": "#070b10"}} target="_blank">
              <span>
                📄 View MSP Portal Guide ↗
              </span>
            </a>
          </div>
          <div className="goal-columns-grid">
            <div className="goal-col-card col-why">
              <div className="goal-col-head head-why">
                <span>
                  ✔
                </span>
                <span>
                  Why Choose This
                </span>
              </div>
              <ul className="goal-bullet-list" id="goalModalWhyList">
              </ul>
            </div>
            <div className="goal-col-card col-why-not">
              <div className="goal-col-head head-why-not">
                <span>
                  ⚡
                </span>
                <span>
                  Why You Might NOT Want This
                </span>
              </div>
              <ul className="goal-bullet-list" id="goalModalWhyNotList">
              </ul>
            </div>
          </div>
          <div className="goal-modal-actions">
            <button className="btn-primary" id="goalModalAcceptBtn" data-onclick="if(typeof window!=='undefined'&&window.confirmSelectedGoalCourse){window.confirmSelectedGoalCourse();}else{closeGoalSynopsis();}" type="button">
              
          Choose This Course & Continue →
        
            </button>
            <button className="btn-secondary-modal" data-onclick="closeGoalSynopsis()" type="button">
              
          Explore Other Goals
        
            </button>
          </div>
        </div>
      </div>
      {/* ================= 8-STEP FIFS JOURNEY DEEP INFORMATION MODAL ================= */}
      <div className="goal-modal-overlay" id="stepDetailModal" data-onclick="if(event.target===this) closeStepDetailModal()" style={{"display": "none"}}>
        <div aria-labelledby="stepModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "640px", "width": "100%"}}>
          <button aria-label="Close details" className="goal-modal-close-btn" data-onclick="closeStepDetailModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" id="stepModalBadge">
              8-Step Training Roadmap
            </span>
          </div>
          <h3 className="goal-modal-title" id="stepModalTitle" style={{"display": "flex", "alignItems": "center", "gap": "8px", "fontSize": "1.6rem", "color": "#fff", "margin": "4px 0 6px"}}>
            <span id="stepModalIcon">
              ⚡
            </span>
            <span id="stepModalHeading">
              Step Details
            </span>
          </h3>
          <div className="goal-modal-rec" id="stepModalStatus" style={{"color": "var(--accent-cyan)", "fontWeight": "700", "textTransform": "uppercase", "fontSize": "0.85rem", "marginBottom": "12px"}}>
            Current Status
          </div>
          <div className="goal-synopsis-card" id="stepModalSynopsis" style={{"marginBottom": "16px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "16px", "fontSize": "0.90rem", "color": "#cbd5e1", "lineHeight": "1.6"}}>
            {/* Filled dynamically */}
          </div>
          <div id="stepModalKeyPoints" style={{"display": "flex", "flexDirection": "column", "gap": "10px", "marginBottom": "20px"}}>
            {/* Detailed checklist / requirements for this step */}
          </div>
          <div className="goal-modal-actions" id="stepModalActions">
            {/* Dynamic CTAs */}
          </div>
        </div>
      </div>
      {/* ================= MODAL 1: SINGLE PORTAL CONFLICT POP-UP ================= */}
      <div className="goal-modal-overlay" id="portalConflictModal" data-onclick="if(event.target===this) closePortalConflictModal()" style={{"display": "none"}}>
        <div aria-labelledby="conflictModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "580px", "borderColor": "var(--accent-amber)", "boxShadow": "0 20px 50px rgba(0,0,0,0.92), 0 0 30px var(--accent-amber-glow)"}}>
          <button aria-label="Close dialog" className="goal-modal-close-btn" data-onclick="closePortalConflictModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" style={{"background": "rgba(255, 183, 3, 0.15)", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)"}}>
              ⚠️ SINGLE PORTAL AUTHENTICATION POLICY
            </span>
          </div>
          <h3 className="goal-modal-title" id="conflictModalTitle" style={{"color": "#fff", "margin": "6px 0 10px"}}>
            
        Active Portal Session Conflict
      
          </h3>
          <div className="goal-synopsis-card" id="conflictModalMessage" style={{"borderLeftColor": "var(--accent-amber)", "background": "#070b10", "fontSize": "0.90rem", "color": "#cbd5e1", "lineHeight": "1.6"}}>
            {/* Filled dynamically */}
          </div>
          <div className="goal-modal-actions" style={{"marginTop": "18px", "display": "flex", "flexDirection": "column", "gap": "10px"}}>
            <button className="btn-primary" id="btn-conflict-switch" style={{"background": "var(--accent-amber)", "color": "#070b10", "fontWeight": "800", "borderRadius": "8px", "padding": "12px 18px", "width": "100%"}} type="button">
              
          🔑 Sign Out & Switch Portal
        
            </button>
            <button className="btn-secondary-modal" data-onclick="closePortalConflictModal()" style={{"borderRadius": "8px", "padding": "10px 18px", "width": "100%"}} type="button">
              
          ← Stay in Current Portal
        
            </button>
          </div>
        </div>
      </div>
      {/* ================= MODAL 2: ADMIN DIRECT PORTAL INVITE DISPATCHER ================= */}
      <div className="goal-modal-overlay" id="adminInviteModal" data-onclick="if(event.target===this) closeAdminInviteModal()" style={{"display": "none"}}>
        <div aria-labelledby="adminInviteTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "620px", "borderColor": "#a855f7", "boxShadow": "0 20px 50px rgba(0,0,0,0.92), 0 0 30px rgba(168, 85, 247, 0.3)"}}>
          <button aria-label="Close invite modal" className="goal-modal-close-btn" data-onclick="closeAdminInviteModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" style={{"background": "rgba(168, 85, 247, 0.15)", "borderColor": "#a855f7", "color": "#c084fc"}}>
              DIRECT ACCESS DISPATCHER
            </span>
          </div>
          <h3 className="goal-modal-title" id="adminInviteTitle" style={{"color": "#fff", "margin": "6px 0 4px"}}>
            
        Send Direct Portal Invitation
      
          </h3>
          <p style={{"fontSize": "0.86rem", "color": "var(--text-muted)", "marginBottom": "16px"}}>
            
        Generate instant credentials and dispatch an invitation link directly to a student or permit holder without requiring public booking checkout.
      
          </p>
          <form id="adminInviteForm" data-onsubmit="handleAdminInviteSubmit(event)">
            <div className="form-group" style={{"marginBottom": "12px"}}>
              <label htmlFor="invFullName" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                Recipient Full Legal Name 
                <span className="req">
                  *
                </span>
              </label>
              <input id="invFullName" placeholder="e.g., Brandon Miller" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="text" />
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "12px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="invEmail" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Email Address 
                  <span className="req">
                    *
                  </span>
                </label>
                <input id="invEmail" placeholder="brandon@example.com" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="email" />
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="invPhone" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Phone Number (Optional)
                </label>
                <input id="invPhone" placeholder="(410) 555-0199" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="tel" />
              </div>
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "12px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="invPortalType" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Portal Access Type 
                  <span className="req">
                    *
                  </span>
                </label>
                <select
  defaultValue={"student"} 
  id="invPortalType" 
  onChange={(e) => { (window as any).syncInviteCourseDropdown?.(); }}
  data-onchange="syncInviteCourseDropdown()" 
  style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}}>
                  <option value="student">
                    🎓 Student Training Portal (Course Attendee)
                  </option>
                  <option value="client">
                    🛡️ Future Initiative Client (Permit Holder / Consultation)
                  </option>
                </select>
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label id="invCourseLabel" htmlFor="invCourse" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Assigned Class Curriculum / Permit
                  <span className="req">
                    *
                  </span>
                </label>
                <select id="invCourse" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}}>
                  <option value="Mid-Atlantic Multi-State Mastery">Mid-Atlantic Multi-State Mastery (5-State)</option>
                  <option value="Maryland CCW & HQL Combo Certification">Maryland CCW & HQL Combo (16-Hr + HQL)</option>
                  <option value="Maryland Wear & Carry (CCW) Permit">Maryland Wear & Carry (16-Hr Initial)</option>
                  <option value="Maryland Wear & Carry (8-Hour Renewal)">Maryland Wear & Carry (8-Hr Renewal)</option>
                  <option value="Maryland HQL (Handgun Qualification License)">Maryland HQL (4-Hour License)</option>
                  <option value="Personal 1-on-1 Range Coaching">Personal 1-on-1 Range Coaching</option>
                  <option value="Defensive Holster Draw & Retention">Defensive Holster Draw & Retention</option>
                  <option value="Firearm Deep Clean & Maintenance">Firearm Deep Clean & Maintenance</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{"marginBottom": "16px"}}>
              <label htmlFor="invDates" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                Scheduled Date / Administrative Note
              </label>
              <input id="invDates" placeholder="e.g., Saturday Oct 19 • Cindy&#x27;s Hot Shots" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="text" />
            </div>
            <button className="btn-primary" id="btn-submit-inv" style={{"background": "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)", "color": "#fff", "fontWeight": "800", "padding": "12px", "border": "none", "borderRadius": "8px", "width": "100%", "cursor": "pointer", "boxShadow": "0 0 16px rgba(168,85,247,0.3)"}} type="submit">
              
          🚀 Generate Access ID & Dispatch Invitation Link
        
            </button>
            <div className="status-msg" id="inv-status" style={{"marginTop": "12px", "display": "none"}}>
            </div>
          </form>
          {/* Invite Generated Link Box */}
          <div id="inv-result-box" style={{"display": "none", "background": "#070b10", "border": "1px solid rgba(0, 229, 255, 0.3)", "borderRadius": "10px", "padding": "14px", "marginTop": "16px"}}>
            <strong style={{"color": "var(--accent-cyan)", "fontSize": "0.88rem", "display": "block", "marginBottom": "4px"}}>
              Invitation sent. The person signs in with their email address:
            </strong>
            <div style={{"display": "flex", "gap": "8px", "alignItems": "center", "marginTop": "6px"}}>
              <input id="invGeneratedUrl" readOnly style={{"background": "#10161f", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "8px 12px", "borderRadius": "6px", "fontSize": "0.85rem", "flex": "1"}} type="text" />
              <button className="btn-spark" data-onclick="copyInviteUrl()" style={{"width": "auto", "padding": "8px 14px", "fontSize": "0.82rem", "whiteSpace": "nowrap"}} type="button">
                📋 Copy
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ================= MODAL 3: ADMIN EDIT STUDENT RECORD MODAL ================= */}
      <div className="goal-modal-overlay" id="adminEditStudentModal" data-onclick="if(event.target===this) closeAdminEditStudentModal()" style={{"display": "none"}}>
        <div aria-labelledby="editStudentModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "600px", "borderColor": "var(--accent-cyan)", "boxShadow": "0 20px 50px rgba(0,0,0,0.92), 0 0 30px var(--accent-cyan-glow)"}}>
          <button aria-label="Close edit modal" className="goal-modal-close-btn" data-onclick="closeAdminEditStudentModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" id="editStudentBadge">
              STUDENT RECORD EDITOR
            </span>
          </div>
          <h3 className="goal-modal-title" id="editStudentModalTitle" style={{"color": "#fff", "margin": "6px 0 14px"}}>
            
        Edit Student Record
      
          </h3>
          <form id="adminEditStudentForm" data-onsubmit="handleAdminEditStudentSubmit(event)">
            <input id="editStudentId" type="hidden" />
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "12px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editFullName" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Full Legal Name 
                  <span className="req">
                    *
                  </span>
                </label>
                <input id="editFullName" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="text" />
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editEmail" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Email Address 
                  <span className="req">
                    *
                  </span>
                </label>
                <input id="editEmail" readOnly aria-readonly="true" aria-describedby="editEmailNote" style={{"background": "#0b0f14", "border": "1px solid var(--border-subtle)", "color": "#94a3b8", "padding": "10px", "borderRadius": "8px", "width": "100%", "cursor": "not-allowed"}} type="email" />
                <small id="editEmailNote" style={{"display": "block", "marginTop": "4px", "fontSize": "0.74rem", "color": "#94a3b8"}}>
                  Email cannot be modified here to protect login credentials.
                </small>
                <button type="button" className="btn-spark" data-onclick="resendStudentSetupLink(document.getElementById('editStudentId').value, this)" style={{"width": "auto", "marginTop": "8px", "padding": "6px 12px", "fontSize": "0.8rem", "borderColor": "var(--accent-cyan)", "color": "var(--accent-cyan)"}}>
                  🔑 Send setup link
                </button>
              </div>
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "12px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editPhone" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Phone Number
                </label>
                <input id="editPhone" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="tel" />
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editCourse" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Enrolled Course
                </label>
                <input id="editCourse" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="text" />
              </div>
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "12px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editAssignedDate" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Class Date / Scheduled Range Date
                </label>
                <input id="editAssignedDate" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="text" />
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editJourneyStatus" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Journey Step (1-8)
                </label>
                <select id="editJourneyStatus" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "var(--accent-cyan)", "padding": "10px", "borderRadius": "8px", "width": "100%", "fontWeight": "700"}}>
                  <option value="STEP_1_REGISTERED">
                    1. Registration
                  </option>
                  <option value="STEP_2_CONFIRMED">
                    2. Confirmation
                  </option>
                  <option value="STEP_3_PREPARATION">
                    3. Preparation
                  </option>
                  <option value="STEP_4_CLASSROOM">
                    4. Classroom Instruction
                  </option>
                  <option value="STEP_5_LIVE_FIRE">
                    5. Live-Fire Practical Range
                  </option>
                  <option value="STEP_6_CERTIFIED">
                    6. Certified & Score Sheet
                  </option>
                  <option value="STEP_7_MSP_PORTAL">
                    7. MSP Portal Submission
                  </option>
                  <option value="STEP_8_LICENSED">
                    8. Licensed & Active
                  </option>
                </select>
              </div>
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "14px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editScore" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Qualification Score (/25)
                </label>
                <input id="editScore" placeholder="e.g., 25/25 (100%)" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="text" />
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editProfileDocUrl" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Student Dossier (Supabase Document URL)
                </label>
                <input id="editProfileDocUrl" placeholder="https://.../storage/v1/object/public/documents/..." style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="text" />
              </div>
            </div>
            <div className="form-group" style={{"marginBottom": "16px"}}>
              <label htmlFor="editNotes" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                Instructor Diagnostic & Administrative Notes
              </label>
              <textarea id="editNotes" rows={2} style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%", "fontFamily": "inherit", "fontSize": "0.88rem"}}>
              </textarea>
            </div>
            <div style={{"display": "flex", "gap": "10px"}}>
              <button className="btn-primary" id="btn-save-student-edit" style={{"flex": "2", "padding": "12px"}} type="submit">
                
            💾 Save Student Changes
          
              </button>
              <button className="btn-secondary-modal" data-onclick="closeAdminEditStudentModal()" style={{"flex": "1", "padding": "12px"}} type="button">
                
            Cancel
          
              </button>
            </div>
            <div className="status-msg" id="edit-student-status" style={{"marginTop": "10px", "display": "none"}}>
            </div>
          
            {/* Maryland Qualification Score Sheet (MSP Form 29-14): fill in, save, and optionally attach the signed document */}
            <div id="editScoresheetCard" style={{"background": "rgba(0, 229, 255, 0.05)", "border": "1px solid var(--accent-cyan)", "borderRadius": "8px", "padding": "14px", "marginTop": "14px", "marginBottom": "14px"}}>
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "10px", "gap": "8px", "flexWrap": "wrap"}}>
                <span style={{"fontWeight": "700", "fontSize": "0.86rem", "color": "var(--accent-cyan)", "letterSpacing": "0.5px"}}>
                  🎯 MARYLAND QUALIFICATION SCORE SHEET (MSP FORM 29-14)
                </span>
                <span id="editScoresheetStatusBadge" style={{"fontSize": "0.74rem", "fontWeight": "700", "padding": "2px 8px", "borderRadius": "12px", "background": "rgba(245, 158, 11, 0.2)", "color": "var(--accent-amber)"}}>
                  No score sheet yet
                </span>
              </div>
              <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(190px, 1fr))", "gap": "10px", "marginBottom": "10px"}}>
                <div>
                  <label htmlFor="ssCourseOfFire" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Course of fire</label>
                  <input id="ssCourseOfFire" maxLength={100} placeholder="e.g., Handgun qualification" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "8px", "borderRadius": "6px", "width": "100%"}} type="text" />
                </div>
                <div>
                  <label htmlFor="ssTargetDistances" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Target distances</label>
                  <input id="ssTargetDistances" maxLength={100} placeholder="e.g., 3, 5, 7 yards" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "8px", "borderRadius": "6px", "width": "100%"}} type="text" />
                </div>
                <div>
                  <label htmlFor="ssRoundsFired" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Total rounds fired</label>
                  <input id="ssRoundsFired" max={500} min={1} step={1} style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "8px", "borderRadius": "6px", "width": "100%"}} type="number" />
                </div>
                <div>
                  <label htmlFor="ssHitsOnTarget" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Hits on target</label>
                  <input id="ssHitsOnTarget" min={0} step={1} style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "8px", "borderRadius": "6px", "width": "100%"}} type="number" />
                </div>
                <div>
                  <label htmlFor="ssFinalPercent" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Final score % (calculated)</label>
                  <input id="ssFinalPercent" readOnly aria-readonly="true" style={{"background": "#0b0f14", "border": "1px solid var(--border-subtle)", "color": "#94a3b8", "padding": "8px", "borderRadius": "6px", "width": "100%", "cursor": "not-allowed"}} type="text" />
                </div>
                <div>
                  <label htmlFor="ssQualificationDate" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Qualification date</label>
                  <input id="ssQualificationDate" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "8px", "borderRadius": "6px", "width": "100%"}} type="date" />
                </div>
                <div>
                  <label htmlFor="ssInstructorName" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Instructor name</label>
                  <input id="ssInstructorName" maxLength={100} placeholder="Instructor name" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "8px", "borderRadius": "6px", "width": "100%"}} type="text" />
                </div>
                <div>
                  <label htmlFor="ssInstructorNumber" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Instructor number</label>
                  <input id="ssInstructorNumber" maxLength={40} placeholder="Certification / ID number" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "8px", "borderRadius": "6px", "width": "100%"}} type="text" />
                </div>
                <div>
                  <label htmlFor="ssResult" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Result</label>
                  <select id="ssResult" defaultValue="pending" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "8px", "borderRadius": "6px", "width": "100%"}}>
                    <option value="pending">Pending</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>
              </div>
              <div style={{"marginBottom": "10px"}}>
                <label htmlFor="ssNotes" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Score sheet notes</label>
                <textarea id="ssNotes" maxLength={1000} rows={2} style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "8px", "borderRadius": "6px", "width": "100%"}} />
              </div>
              <div style={{"marginBottom": "10px"}}>
                <label htmlFor="editScoresheetFileInput" style={{"fontSize": "0.78rem", "color": "#94a3b8", "display": "block", "marginBottom": "4px"}}>Signed MSP 29-14 document (optional: PDF, JPEG, PNG, or WebP, up to 3 MB)</label>
                <input accept="application/pdf,image/jpeg,image/png,image/webp" id="editScoresheetFileInput" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "6px", "borderRadius": "6px", "width": "100%"}} type="file" />
              </div>
              <div id="editScoresheetActionRow" style={{"display": "flex", "gap": "8px", "alignItems": "center", "flexWrap": "wrap"}}>
                <button type="button" id="btnSaveScoresheetFromEdit" data-onclick="handleSaveScoresheetFromEdit()" style={{"background": "var(--accent-cyan)", "color": "#070b10", "border": "none", "borderRadius": "6px", "padding": "8px 14px", "fontWeight": "700", "cursor": "pointer", "fontSize": "0.82rem"}}>
                  💾 Save score sheet
                </button>
                <a id="editScoresheetViewLink" href="#" target="_blank" rel="noopener noreferrer" style={{"display": "none", "color": "var(--accent-cyan)", "fontSize": "0.80rem", "textDecoration": "underline", "fontWeight": "600"}}>
                  👁️ View signed document ↗
                </a>
                <button type="button" id="btnDeleteScoresheetFromEdit" data-onclick="handleDeleteScoresheetFromEdit()" style={{"display": "none", "background": "transparent", "color": "#ef4444", "border": "1px solid #ef4444", "borderRadius": "6px", "padding": "7px 12px", "cursor": "pointer", "fontSize": "0.8rem"}}>
                  🗑️ Remove score sheet
                </button>
              </div>
              <div id="editScoresheetFeedback" role="status" style={{"fontSize": "0.78rem", "marginTop": "8px", "display": "none"}}></div>
            </div>
          </form>
        </div>
      </div>








      {/* ================= SUPABASE STUDENT DOSSIER & INSTRUCTOR NOTES MODAL ================= */}
      <div className="goal-modal-overlay"  data-onclick="if(event.target===this) closeStudentDossierModal()" style={{"display": "none"}}>
        <div aria-labelledby="dossierModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "620px", "borderColor": "var(--accent-amber)", "boxShadow": "0 20px 50px rgba(0,0,0,0.92), 0 0 30px rgba(245, 158, 11, 0.35)"}}>
          <button aria-label="Close dossier modal" className="goal-modal-close-btn" data-onclick="closeStudentDossierModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" id="dossierModalBadge" style={{"background": "rgba(245, 158, 11, 0.15)", "color": "var(--accent-amber)"}}>
              STUDENT DOSSIER
            </span>
          </div>
          <h3 className="goal-modal-title" id="dossierModalTitle" style={{"color": "#fff", "margin": "6px 0 4px"}}>
            Dossier & Instructor Notes
          </h3>
          <p style={{"color": "var(--text-muted)", "fontSize": "0.85rem", "marginBottom": "14px"}}>
            <strong id="dossierModalStudentName" style={{"color": "var(--accent-cyan)"}}>Student</strong>
            {' '}· <span id="dossierModalCourse">Course</span>
          </p>
          <form id="studentDossierForm" data-onsubmit="handleSaveStudentDossier(event)">
            <input id="dossierModalStudentId" type="hidden" />
            <div className="form-group" style={{"marginBottom": "12px"}}>
              <label htmlFor="dossierModalClassDate" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                Class / Range Date
              </label>
              <input id="dossierModalClassDate" placeholder="e.g., Sat, Oct 12 2026 · 9:00 AM" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="text" />
            </div>
            <div className="form-group" style={{"marginBottom": "12px"}}>
              <label htmlFor="dossierModalDocUrl" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                Official Dossier Document (Supabase Storage URL)
              </label>
              <input id="dossierModalDocUrl" placeholder="https://ufqnmcincwnlyiwsmzcq.supabase.co/storage/v1/object/public/documents/..." style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="text" />
              <div style={{"display": "flex", "gap": "8px", "flexWrap": "wrap", "marginTop": "8px"}}>
                <a className="btn-spark" data-target="_blank" id="dossierModalViewLink" rel="noopener noreferrer" style={{"display": "none", "padding": "7px 12px", "fontSize": "0.78rem", "borderColor": "var(--accent-cyan)", "color": "var(--accent-cyan)", "textDecoration": "none", "alignItems": "center", "gap": "6px"}} target="_blank">
                  👁 Preview Current Dossier
                </a>
                <button className="btn-spark" data-onclick="setDossierPresetUrl('https://ufqnmcincwnlyiwsmzcq.supabase.co/storage/v1/object/public/documents/msp-form-29-14-handgun-score-sheet.pdf')" style={{"padding": "7px 12px", "fontSize": "0.78rem", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)", "width": "auto"}} type="button">
                  📋 Use MSP Form 29-14
                </button>
                <button className="btn-spark" data-onclick="setDossierPresetUrl('https://ufqnmcincwnlyiwsmzcq.supabase.co/storage/v1/object/public/documents/fifs-classroom-course-packet.pdf')" style={{"padding": "7px 12px", "fontSize": "0.78rem", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)", "width": "auto"}} type="button">
                  📦 Use Course Packet
                </button>
              </div>
            </div>
            <div className="form-group" style={{"marginBottom": "16px"}}>
              <label htmlFor="dossierModalNotes" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                Instructor Diagnostic & Administrative Notes
              </label>
              <textarea id="dossierModalNotes" rows={5} style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%", "fontFamily": "inherit", "fontSize": "0.88rem", "resize": "vertical"}}></textarea>
            </div>
            <div id="dossierModalStatus" style={{"display": "none", "marginBottom": "10px", "fontSize": "0.82rem", "fontWeight": "700"}}></div>
            <div style={{"display": "flex", "gap": "10px"}}>
              <button className="btn-primary" style={{"flex": "2", "padding": "12px"}} type="submit">
                💾 Save Dossier & Notes to Supabase
              </button>
              <button className="btn-secondary-modal" data-onclick="closeStudentDossierModal()" style={{"flex": "1", "padding": "12px"}} type="button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* ================= MODAL 4: ADMIN EDIT CLIENT RECORD MODAL ================= */}
      <div className="goal-modal-overlay" id="adminEditClientModal" data-onclick="if(event.target===this) closeAdminEditClientModal()" style={{"display": "none"}}>
        <div aria-labelledby="editClientModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "600px", "borderColor": "var(--accent-amber)", "boxShadow": "0 20px 50px rgba(0,0,0,0.92), 0 0 30px var(--accent-amber-glow)"}}>
          <button aria-label="Close edit client modal" className="goal-modal-close-btn" data-onclick="closeAdminEditClientModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" style={{"background": "rgba(255, 183, 3, 0.15)", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)"}}>
              CLIENT PERMIT EDITOR
            </span>
          </div>
          <h3 className="goal-modal-title" id="editClientModalTitle" style={{"color": "#fff", "margin": "6px 0 14px"}}>
            
        Edit Client Permit Record
      
          </h3>
          <form id="adminEditClientForm" data-onsubmit="handleAdminEditClientSubmit(event)">
            <input id="editClientId" type="hidden" />
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "12px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editClientFullName" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Full Legal Name 
                  <span className="req">
                    *
                  </span>
                </label>
                <input id="editClientFullName" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="text" />
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editClientEmail" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Email Address 
                  <span className="req">
                    *
                  </span>
                </label>
                <input id="editClientEmail" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="email" />
              </div>
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "12px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editClientPhone" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Phone Number
                </label>
                <input id="editClientPhone" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="tel" />
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editClientPermitState" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Permit Jurisdiction
                </label>
                <select id="editClientPermitState" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}}>
                  <option value="Maryland Wear &amp; Carry">
                    Maryland Wear & Carry (Resident)
                  </option>
                  <option value="Virginia Concealed Handgun">
                    Virginia Concealed Handgun
                  </option>
                  <option value="Pennsylvania LTCF">
                    Pennsylvania LTCF
                  </option>
                  <option value="Florida Non-Resident">
                    Florida Non-Resident CWL
                  </option>
                  <option value="Utah Non-Resident">
                    Utah Non-Resident CFP
                  </option>
                  <option value="Multi-State (MD+UT/FL)">
                    Multi-State (MD + UT/FL)
                  </option>
                </select>
              </div>
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "16px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editClientExpDate" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Permit Expiration Date 
                  <span className="req">
                    *
                  </span>
                </label>
                <input id="editClientExpDate" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%"}} type="date" />
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="editClientStatus" style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  Renewal Watch Status
                </label>
                <select id="editClientStatus" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "var(--accent-amber)", "padding": "10px", "borderRadius": "8px", "width": "100%", "fontWeight": "700"}}>
                  <option value="ACTIVE_REGISTERED">
                    Active Registered
                  </option>
                  <option value="RENEWAL_PENDING">
                    90-Day Window Open
                  </option>
                  <option value="REMINDER_SENT">
                    Reminder Dispatched
                  </option>
                  <option value="RENEWED">
                    Renewed
                  </option>
                </select>
              </div>
            </div>
            <div style={{"display": "flex", "gap": "10px"}}>
              <button className="btn-primary" style={{"flex": "2", "padding": "12px", "background": "var(--accent-amber)", "color": "#070b10", "fontWeight": "800"}} type="submit">
                
            💾 Save Client Changes
          
              </button>
              <button className="btn-secondary-modal" data-onclick="closeAdminEditClientModal()" style={{"flex": "1", "padding": "12px"}} type="button">
                
            Cancel
          
              </button>
            </div>
            <div className="status-msg" id="edit-client-status" style={{"marginTop": "10px", "display": "none"}}>
            </div>
          </form>
        </div>
      </div>
      {/* ================= COURSE ENROLLMENT MODAL WINDOW (DEEP DIVE POPUP) ================= */}
      <div className="goal-modal-overlay" id="courseBookingModal" data-onclick="if(event.target===this) closeCourseBookingModal()" style={{"display": "none"}}>
        <div aria-labelledby="bookingModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"width": "min(680px, 94vw)", "minWidth": "min(680px, 94vw)", "maxWidth": "680px", "margin": "auto", "borderColor": "var(--accent-cyan)", "boxShadow": "0 25px 60px rgba(0,0,0,0.95), 0 0 35px var(--accent-cyan-glow)"}}>
          <button aria-label="Close reservation form" className="goal-modal-close-btn" data-onclick="closeCourseBookingModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" id="bookingModalBadge">
              CLASS REGISTRATION & SEAT RESERVATION
            </span>
          </div>
          <h3 className="goal-modal-title" id="bookingModalTitle" style={{"color": "#fff", "margin": "6px 0 4px", "fontSize": "1.8rem", "textTransform": "uppercase"}}>
            
        Reserve Your Training Session
      
          </h3>
          <p style={{"fontSize": "0.88rem", "color": "var(--text-muted)", "marginBottom": "18px", "lineHeight": "1.5"}}>
            
        Submit your student details directly to Instructor Kai Wade to establish your official training record and lock in your range date.
      
          </p>
          {/* Clean Form Container (Extracted from old bottom section) */}
          <form id="booking-form" data-onsubmit="event.preventDefault(); return false;">
            {/* Hidden: redundant dropdown eliminated; selection is driven directly by course cards */}
            <div className="form-group" style={{"display": "none"}}>
              <label htmlFor="courseSelection">
                Selected Course Curriculum & Tuition 
                <span className="req">
                  *
                </span>
              </label>
                                          <select
                defaultValue={"Mid-Atlantic Multi-State Mastery — Base Track ($424.99)"}
                className="form-select"
                id="courseSelection"
                data-onchange="updateFormPriceDisplay()"
                onChange={() => { if (typeof window !== "undefined" && (window as any).updateFormPriceDisplay) (window as any).updateFormPriceDisplay(); }}
                required
                style={{"background": "#070b10", "border": "1px solid var(--accent-cyan)", "color": "#fff", "padding": "12px", "borderRadius": "8px", "width": "100%", "fontSize": "0.95rem", "fontWeight": "700"}}>
                <option value="Mid-Atlantic Multi-State Mastery — VIP Turnkey ($549.99)">Mid-Atlantic Multi-State Mastery — VIP Turnkey ($549.99)</option>
                <option value="Mid-Atlantic Multi-State Mastery — Base Track ($424.99)">Mid-Atlantic Multi-State Mastery — Base Track ($424.99)</option>
                <option value="Maryland CCW & HQL Combo — VIP Turnkey ($375.00)">Maryland CCW & HQL Combo — VIP Turnkey ($375.00)</option>
                <option value="Maryland CCW & HQL Combo — Base Track ($249.99)">Maryland CCW & HQL Combo — Base Track ($249.99)</option>
                <option value="Maryland Wear & Carry (CCW) — VIP Turnkey ($349.99)">Maryland Wear & Carry (CCW) — VIP Turnkey ($349.99)</option>
                <option value="Maryland Wear & Carry (CCW) — Base Track ($199.99)">Maryland Wear & Carry (CCW) — Base Track ($199.99)</option>
                <option value="Maryland Wear & Carry (8-Hour Renewal) — VIP Turnkey ($249.99)">Maryland Wear & Carry (8-Hour Renewal) — VIP Turnkey ($249.99)</option>
                <option value="Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)">Maryland Wear & Carry (8-Hour Renewal) — Base Track ($149.99)</option>
                <option value="Maryland HQL (Purchase License) — VIP Turnkey ($165.00)">Maryland HQL (Purchase License) — VIP Turnkey ($165.00)</option>
                <option value="Maryland HQL (Purchase License) — Base Track ($100.00)">Maryland HQL (Purchase License) — Base Track ($100.00)</option>
                <option value="Personal 1-on-1 Coaching — VIP Turnkey ($195.00/hr)">Personal 1-on-1 Coaching — VIP Turnkey ($195.00/hr)</option>
                <option value="Personal 1-on-1 Coaching — Base Track ($125.00/hr)">Personal 1-on-1 Coaching — Base Track ($125.00/hr)</option>
                <option value="Gun Cleaning & Maintenance — VIP Turnkey ($115.00)">Gun Cleaning & Maintenance — VIP Turnkey ($115.00)</option>
                <option value="Gun Cleaning & Maintenance — Base Track ($75.00)">Gun Cleaning & Maintenance — Base Track ($75.00)</option>
                <option value="Children's Safety Class — VIP Turnkey ($265.00)">Children's Safety Class — VIP Turnkey ($265.00)</option>
                <option value="Children's Safety Class — Base Track ($199.99)">Children's Safety Class — Base Track ($199.99)</option>
                <option value="FIFS Graduate Alumni Marksmanship Clinic — VIP Turnkey ($115.00)">FIFS Graduate Alumni Marksmanship Clinic — VIP Turnkey ($115.00)</option>
                <option value="FIFS Graduate Alumni Marksmanship Clinic — Base Track ($65.00)">FIFS Graduate Alumni Marksmanship Clinic — Base Track ($65.00)</option>
              </select>
            </div>
            {/* Selected Course Pricing Summary Card */}
            <div id="formPriceSummaryCard" style={{"background": "rgba(0, 229, 255, 0.06)", "border": "1px solid var(--accent-cyan)", "borderRadius": "12px", "padding": "16px 18px", "marginTop": "12px", "marginBottom": "20px", "boxShadow": "0 4px 20px rgba(0,0,0,0.5)"}}>
              <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "8px"}}>
                <div>
                  <span id="formCardCourseTitle" style={{"fontFamily": "var(--font-display)", "fontSize": "1.25rem", "fontWeight": "800", "color": "#fff", "display": "block"}}>
                    Mid-Atlantic Multi-State Mastery
                  </span>
                  <span id="formCardTierTag" style={{"fontSize": "0.78rem", "fontWeight": "700", "color": "var(--accent-cyan)", "textTransform": "uppercase", "letterSpacing": "0.5px"}}>
                    Standard Base Track Selected
                  </span>
                </div>
                <div style={{"textAlign": "right"}}>
                  <span id="formCardActivePrice" style={{"fontFamily": "var(--font-display)", "fontSize": "1.8rem", "fontWeight": "800", "color": "var(--accent-cyan)"}}>
                    $424.99
                  </span>
                </div>
              </div>
              <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "10px", "marginTop": "12px", "paddingTop": "12px", "borderTop": "1px solid rgba(255, 255, 255, 0.08)"}}>
                <div id="formBoxBase" data-onclick="toggleFormTier('base')" onClick={() => { if (typeof window !== "undefined" && (window as any).toggleFormTier) (window as any).toggleFormTier("base"); }} style={{"background": "rgba(0, 229, 255, 0.08)", "border": "1px solid var(--accent-cyan)", "borderRadius": "8px", "padding": "10px", "cursor": "pointer", "transition": "all 0.2s", "boxShadow": "0 0 14px var(--accent-cyan-glow)"}}>
                  <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center"}}>
                    <strong style={{"color": "#fff", "fontSize": "0.85rem"}}>
                      Standard Base
                    </strong>
                    <span id="formPriceBaseVal" style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "fontWeight": "800", "color": "#fff"}}>
                      $424.99
                    </span>
                  </div>
                  <p style={{"color": "var(--text-muted)", "fontSize": "0.74rem", "marginTop": "3px", "lineHeight": "1.35"}}>
                    Self-equipped (Provide own gun, holster & ammo)
                  </p>
                </div>
                <div id="formBoxVip" data-onclick="toggleFormTier('vip')" onClick={() => { if (typeof window !== "undefined" && (window as any).toggleFormTier) (window as any).toggleFormTier("vip"); }} style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "8px", "padding": "10px", "cursor": "pointer", "transition": "all 0.2s"}}>
                  <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center"}}>
                    <strong style={{"color": "var(--accent-amber)", "fontSize": "0.85rem"}}>
                      👑 VIP Turnkey
                    </strong>
                    <span id="formPriceVipVal" style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "fontWeight": "800", "color": "var(--accent-amber)"}}>
                      $549.99
                    </span>
                  </div>
                  <p style={{"color": "var(--text-muted)", "fontSize": "0.74rem", "marginTop": "3px", "lineHeight": "1.35"}}>
                    Turnkey (Lane fee, targets, loaner 9mm, ammo & photos)
                  </p>
                </div>
              </div>
              <p id="formCardTierDesc" style={{"fontSize": "0.82rem", "color": "#cbd5e1", "marginTop": "12px", "lineHeight": "1.5", "borderLeft": "2px solid var(--accent-cyan)", "paddingLeft": "10px"}}>
                Full 16-hour Maryland Wear & Carry qualification + application dossiers for Virginia, Florida, Arizona, and Pennsylvania (34+ state legal carry reciprocity). Self-equipped track: bring own firearm and ammo. Range fee ($45.00) & 6% MD tax calculated automatically.
              </p>
              {/* Comprehensive Deposit Breakdown Card */}
              <div id="formDepositBreakdownBox" style={{"background": "rgba(245, 158, 11, 0.08)", "border": "1px solid rgba(245, 158, 11, 0.35)", "borderRadius": "10px", "padding": "14px 16px", "marginTop": "14px"}}>
                <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "fontSize": "0.84rem", "color": "#cbd5e1", "marginBottom": "6px"}}>
                  <span>Course Tuition:</span>
                  <strong id="formBreakdownTuition" style={{"color": "#fff"}}>$424.99</strong>
                </div>
                <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "fontSize": "0.84rem", "marginBottom": "6px"}}>
                  <span>Cindy's Hot Shots Range &amp; Target Fee:</span>
                  <strong id="formBreakdownRangeFee" style={{"color": "#f59e0b"}}>+$45.00 (Base Track)</strong>
                </div>
                <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "fontSize": "0.84rem", "color": "#38bdf8", "marginBottom": "8px"}}>
                  <span>Maryland State Sales Tax (6%):</span>
                  <strong id="formBreakdownTax">+$28.20</strong>
                </div>
                <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "fontSize": "0.96rem", "color": "#fff", "borderTop": "1px solid rgba(255, 255, 255, 0.1)", "paddingTop": "8px", "marginBottom": "8px"}}>
                  <strong>Total Course Investment:</strong>
                  <strong id="formBreakdownTotal" style={{"color": "var(--accent-cyan)", "fontFamily": "var(--font-display)", "fontSize": "1.15rem"}}>$498.19</strong>
                </div>
                <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "fontSize": "1.05rem", "background": "rgba(245, 158, 11, 0.16)", "padding": "8px 12px", "borderRadius": "8px", "border": "1px solid rgba(245, 158, 11, 0.4)"}}>
                  <strong style={{"color": "#f59e0b"}}>⚡ Required 30% Deposit (Due Now to Reserve Seat):</strong>
                  <strong id="formBreakdownDeposit" style={{"color": "#f59e0b", "fontFamily": "var(--font-display)", "fontSize": "1.3rem", "letterSpacing": "0.5px"}}>$149.46</strong>
                </div>
                <div style={{"textAlign": "right", "fontSize": "0.76rem", "color": "var(--text-muted)", "marginTop": "6px"}}>
                  Remaining balance (<span id="formBreakdownBalance" style={{"color": "#cbd5e1", "fontWeight": "600"}}>$348.73</span>) due upon class arrival.
                </div>
              </div>
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "14px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="fullName">
                  Full Legal Name 
                  <span className="req">
                    *
                  </span>
                </label>
                <input autoComplete="name" id="fullName" name="fullName" placeholder="e.g., Jordan Vance" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "12px", "borderRadius": "8px", "width": "100%"}} type="text" />
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="email">
                  Email Address 
                  <span className="req">
                    *
                  </span>
                </label>
                <input autoComplete="email" id="email" name="email" placeholder="jordan@example.com" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "12px", "borderRadius": "8px", "width": "100%"}} type="email" />
              </div>
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "14px"}}>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="phone">
                  Phone Number (SMS Enabled) 
                  <span className="req">
                    *
                  </span>
                </label>
                <input autoComplete="tel" id="phone" name="phone" placeholder="(410) 555-0192" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "12px", "borderRadius": "8px", "width": "100%"}} type="tel" />
              </div>
              <div className="form-group" style={{"marginBottom": "0"}}>
                <label htmlFor="groupSize">
                  Group Size / Training Format 
                  <span className="req">
                    *
                  </span>
                </label>
                <select id="groupSize" name="groupSize" data-onchange="updateFormPriceDisplay();" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "12px", "borderRadius": "8px", "width": "100%"}}>
                  <option value="1 (Private One-on-One)">
                    1 Person — Standard Rate
                  </option>
                  <option value="2 (Paired Session — 5% Discount)">
                    2 People — Paired Session (5% Discount)
                  </option>
                  <option value="3 (Small Group / Family — 10% Discount)">
                    3 People — Small Group (10% Discount)
                  </option>
                  <option value="4 (Small Group / Family — 10% Discount)">
                    4 People — Small Group (10% Discount)
                  </option>
                  <option value="5+ (Private Class Cohort — 15% Discount)">
                    5+ People — Private Class Cohort (15% Discount — Custom Scheduling)
                  </option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{"marginBottom": "14px"}}>
              <label htmlFor="bookingPortalPassword" style={{"fontSize": "0.84rem", "color": "#cbd5e1", "fontWeight": "700", "display": "flex", "justifyContent": "space-between", "alignItems": "center"}}>
                <span>Student Portal Password</span>
                <span style={{"fontSize": "0.74rem", "color": "var(--text-muted)", "fontWeight": "400"}}>(Optional — or create upon first login)</span>
              </label>
              <input autoComplete="new-password" id="bookingPortalPassword" name="bookingPortalPassword" placeholder="Create a password now (min 4 characters)" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "12px", "borderRadius": "8px", "width": "100%"}} type="password" />
            </div>
            <div className="form-group" style={{"marginBottom": "14px"}}>
              <label htmlFor="comments">
                Additional Notes / Prior Experience / Equipment
              </label>
              <textarea id="comments" name="comments" placeholder="Include your shooting background, handguns owned (if any), or scheduling notes..." rows={2} style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "12px", "borderRadius": "8px", "width": "100%", "fontFamily": "inherit", "fontSize": "0.95rem"}}>
              </textarea>
            </div>
            <div className="form-group" style={{"marginBottom": "14px"}}>
              <label style={{"fontSize": "0.84rem", "color": "#cbd5e1", "fontWeight": "700", "textTransform": "uppercase", "marginBottom": "6px", "display": "block"}}>
                
              Select Training Session Date (Synced With Instructor Calendar) 
                <span className="req">
                  *
                </span>
              </label>
              {/* Dynamic Scheduling Tier Rule Banner */}
              <div id="bookingCalendarPolicyBanner" style={{"background": "rgba(0, 229, 255, 0.08)", "border": "1px solid var(--accent-cyan)", "borderRadius": "8px", "padding": "10px 14px", "marginBottom": "12px", "fontSize": "0.82rem", "color": "#cbd5e1", "lineHeight": "1.45"}}>
                <span id="calendarPolicyText">
                  📅 
                  <strong>
                    Standard Schedule:
                  </strong>
                   Classes held on 
                  <strong>
                    Saturdays & Sundays
                  </strong>
                  . Weekdays (Mon–Fri) locked. (Toggle to 👑 VIP Turnkey to unlock 7-day flexible scheduling).
                </span>
              </div>
              {/* Unified Responsive Booking Calendar Card */}
              <div className="booking-calendar-card" style={{"width": "100%", "background": "#070b10", "border": "1px solid rgba(0, 229, 255, 0.35)", "borderRadius": "12px", "overflow": "hidden", "boxShadow": "0 4px 20px rgba(0,0,0,0.6)", "boxSizing": "border-box"}}>
                {/* Month / Year Bar */}
                <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "background": "linear-gradient(180deg, #10161f 0%, #0c1219 100%)", "padding": "10px 14px", "borderBottom": "1px solid var(--border-subtle)"}}>
                  <button type="button" className="btn-spark" data-onclick="changeBookingCalendarMonth(-1)" style={{"padding": "5px 12px", "fontSize": "0.85rem", "fontWeight": "800", "cursor": "pointer"}}>
                    ◀ Prev
                  </button>
                  <strong id="bookingCalMonthLabel" style={{"fontFamily": "var(--font-display)", "fontSize": "1.2rem", "color": "#fff", "letterSpacing": "1px", "textTransform": "uppercase"}}>
                    October 2026
                  </strong>
                  <button type="button" className="btn-spark" data-onclick="changeBookingCalendarMonth(1)" style={{"padding": "5px 12px", "fontSize": "0.85rem", "fontWeight": "800", "cursor": "pointer"}}>
                    Next ▶
                  </button>
                </div>
                {/* 7-Column Days of Week Header (Always In Sync) */}
                <div style={{"display": "grid", "gridTemplateColumns": "repeat(7, 1fr)", "background": "#0c1219", "borderBottom": "1px solid var(--border-subtle)", "textAlign": "center", "fontSize": "0.72rem", "fontWeight": "800", "color": "var(--text-muted)", "padding": "8px 0"}}>
                  <div>SUN</div>
                  <div>MON</div>
                  <div>TUE</div>
                  <div>WED</div>
                  <div>THU</div>
                  <div>FRI</div>
                  <div>SAT</div>
                </div>
                {/* 7-Column Days Grid */}
                <div id="bookingCalDaysGrid" style={{"display": "grid", "gridTemplateColumns": "repeat(7, 1fr)", "gap": "1px", "background": "var(--border-subtle)", "width": "100%", "boxSizing": "border-box"}}>
                  {/* Dynamically populated via renderBookingCalendar() */}
                </div>
              </div>
              <div style={{"marginTop": "10px", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "8px"}}>
                <span style={{"fontSize": "0.84rem", "color": "#cbd5e1"}}>
                  
                Selected Date: 
                  <strong id="bookingCalSelectedDateText" style={{"color": "var(--accent-cyan)", "fontFamily": "var(--font-display)", "fontSize": "0.95rem"}}>
                    Please select an open date above
                  </strong>
                </span>
                <div style={{"display": "flex", "gap": "12px", "fontSize": "0.74rem", "color": "var(--text-muted)"}}>
                  <span style={{"display": "inline-flex", "alignItems": "center", "gap": "4px"}}>
                    <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "#10b981"}}>
                    </span>
                     Open
                  </span>
                  <span style={{"display": "inline-flex", "alignItems": "center", "gap": "4px"}}>
                    <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "#ef4444"}}>
                    </span>
                     Booked
                  </span>
                  <span style={{"display": "inline-flex", "alignItems": "center", "gap": "4px"}}>
                    <span style={{"width": "8px", "height": "8px", "borderRadius": "50%", "background": "#334155"}}>
                    </span>
                     Locked
                  </span>
                </div>
              </div>
              <input type="hidden" id="preferredDates" name="preferredDates" />
            </div>
            <div style={{"background": "rgba(239, 68, 68, 0.08)", "border": "1px solid rgba(239, 68, 68, 0.4)", "borderRadius": "8px", "padding": "12px 14px", "marginBottom": "18px", "display": "flex", "alignItems": "flex-start", "gap": "10px"}}>
              <input id="safety-check" required defaultChecked={false} style={{"width": "18px", "height": "18px", "accentColor": "var(--accent-cyan)", "marginTop": "2px"}} type="checkbox" />
                
                <label htmlFor="safety-check" style={{"fontSize": "0.80rem", "color": "#fca5a5", "lineHeight": "1.45", "cursor": "pointer"}}>
                  <strong>
                    MANDATORY RANGE SAFETY POLICY:
                  </strong>
                   I understand that absolutely zero live ammunition is permitted in the classroom. Ammunition must remain locked in my vehicle trunk until range live-fire.
          
                </label>
              
            </div>
            <button className="btn-primary" id="btn-booking-submit" style={{"width": "100%", "padding": "14px", "fontSize": "1.1rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1.5px", "boxShadow": "0 0 20px var(--accent-cyan-glow)"}} type="button" data-onclick="showBookingInvoiceModal(event)"
  onClick={(e) => {
    if (typeof (window as any).showBookingInvoiceModal === "function") {
      (window as any).showBookingInvoiceModal(e.nativeEvent || e);
    } else {
      console.warn("showBookingInvoiceModal function not found on window");
    }
  }}>
              
          Confirm Training Reservation 🎯
        
            </button>
            <div className="status-msg" id="booking-status" style={{"marginTop": "12px", "display": "none"}}>
            </div>
          </form>
          <div style={{"marginTop": "16px", "paddingTop": "14px", "borderTop": "1px solid var(--border-subtle)", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "10px"}}>
            <span style={{"fontSize": "0.78rem", "color": "var(--text-muted)"}}>
              Lead Instructor: Kai Wade • Qualification Shots at Cindy's Hot Shots (Glen Burnie, MD)
            </span>
            <button className="btn-secondary-modal" data-onclick="closeCourseBookingModal()" style={{"padding": "8px 18px", "fontSize": "0.85rem", "fontWeight": "700"}} type="button">
              
          ← Return to Course Catalog
        
            </button>
          </div>
        </div>
      </div>
      {/* ================= MODAL: INTERSTATE VEHICLE TRAVEL DEEP-DIVE WINDOW ================= */}
      <div className="goal-modal-overlay" id="vehicleTravelModal" data-onclick="if(event.target===this) closeVehicleTravelModal()" style={{"display": "none"}}>
        <div aria-labelledby="vehicleTravelModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "820px", "borderColor": "var(--accent-cyan)", "boxShadow": "0 25px 60px rgba(0,0,0,0.95), 0 0 35px var(--accent-cyan-glow)"}}>
          <button aria-label="Close vehicle travel guide" className="goal-modal-close-btn" data-onclick="closeVehicleTravelModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge">
              FEDERAL SAFE PASSAGE • FOPA 18 U.S.C. § 926A
            </span>
          </div>
          <h3 className="goal-modal-title" id="vehicleTravelModalTitle" style={{"color": "#fff", "margin": "4px 0 6px", "fontSize": "1.8rem", "textTransform": "uppercase"}}>
            
        🚗 Traveling With a Firearm (Vehicle & Interstate Highway)
      
          </h3>
          <div className="goal-modal-rec" style={{"color": "var(--accent-cyan)", "fontWeight": "700", "marginBottom": "16px"}}>
            
        State-Line Crossing Protocols, Trunk Storage Standards & Regional Matrices
      
          </div>
          <div style={{"marginBottom": "20px"}}>
            <div className="fi-section-header" id="fi-sec-travel">
              <h3>
                Traveling With a Firearm (Interstate & Vehicle Travel)
              </h3>
              <p>
                Federal Safe Passage under FOPA 18 U.S.C. § 926A, state-line crossing protocols, and vehicle storage standards.
              </p>
            </div>
            <div className="fi-checklist-card">
              <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "20px", "marginBottom": "24px"}}>
                <div style={{"background": "rgba(0,229,255,0.04)", "border": "1px solid rgba(0,229,255,0.25)", "borderRadius": "12px", "padding": "18px"}}>
                  <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.25rem", "color": "var(--accent-cyan)", "textTransform": "uppercase", "marginBottom": "8px"}}>
                    
                🛡️ FOPA 18 U.S.C. § 926A Safe Passage
              
                  </h4>
                  <p style={{"fontSize": "0.88rem", "color": "#cbd5e1", "lineHeight": "1.5", "marginBottom": "10px"}}>
                    
                The federal Firearm Owners Protection Act (FOPA) protects citizens traveling through restrictive jurisdictions (e.g., NJ, NY) if:
              
                  </p>
                  <ul style={{"fontSize": "0.85rem", "color": "#94a3b8", "paddingLeft": "18px", "lineHeight": "1.55"}}>
                    <li>
                      You are lawful to possess the firearm at your place of origin.
                    </li>
                    <li>
                      You are lawful to possess the firearm at your final destination.
                    </li>
                    <li>
                      The firearm is completely 
                      <strong>
                        unloaded
                      </strong>
                      .
                    </li>
                    <li>
                      Neither the firearm nor ammunition is readily accessible from the passenger compartment.
                    </li>
                    <li>
                      Locked inside a rigid case in the trunk or rear cargo area.
                    </li>
                    <li>
                      Your travel is continuous (fuel and meal stops are allowed; extended hotel stays may void protection in restrictive states).
                    </li>
                  </ul>
                </div>
                <div style={{"background": "rgba(255,183,3,0.0er: 1px solid rgba(255,183,3,0.25)", "borderRadius": "12px", "padding": "18px"}}>
                  <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.25rem", "color": "var(--accent-amber)", "textTransform": "uppercase", "marginBottom": "8px"}}>
                    
                ⚠️ Regional State-Line Transit Warnings
              
                  </h4>
                  <p style={{"fontSize": "0.88rem", "color": "#cbd5e1", "lineHeight": "1.5", "marginBottom": "10px"}}>
                    
                Critical considerations when driving out of Maryland into neighboring jurisdictions:
              
                  </p>
                  <ul style={{"fontSize": "0.85rem", "color": "#94a3b8", "paddingLeft": "18px", "lineHeight": "1.55"}}>
                    <li>
                      <strong>
                        Virginia:
                      </strong>
                       Open carry legal without permit; concealed carry requires recognized permit or Utah/Florida non-res.
                    </li>
                    <li>
                      <strong>
                        Pennsylvania:
                      </strong>
                       Maryland permit NOT recognized. Requires PA non-resident permit or peaceable journey FOPA transport.
                    </li>
                    <li>
                      <strong>
                        Delaware:
                      </strong>
                       Open carry legal without permit; concealed requires Utah or Florida non-resident permit.
                    </li>
                    <li>
                      <strong>
                        District of Columbia:
                      </strong>
                       Strict prohibition on non-D.C. carry permits. Heavy criminal penalties for accessible firearms or unregistered ammo.
                    </li>
                    <li>
                      <strong>
                        New Jersey:
                      </strong>
                       Extremely strict felony penalties. Hollow-point ammo restricted. Strictly follow FOPA trunk standards without stopping.
                    </li>
                  </ul>
                </div>
              </div>
              {/* VEHICLE COMPARISON TABLE */}
              <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "textTransform": "uppercase", "marginBottom": "10px"}}>
                
            Mid-Atlantic Vehicle Carry Quick Matrix
          
              </h4>
              <div className="fi-table-wrap">
                <table className="fi-table">
                  <thead>
                    <tr>
                      <th>
                        Jurisdiction
                      </th>
                      <th>
                        MD Wear & Carry Recognized?
                      </th>
                      <th>
                        Vehicle Glovebox Carry
                      </th>
                      <th>
                        Trunk Storage Requirement
                      </th>
                      <th>
                        Duty to Inform Officer
                      </th>
                      <th>
                        Magazine Limit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong style={{"color": "#fff"}}>
                          Maryland (MD)
                        </strong>
                      </td>
                      <td>
                        <span className="fi-badge fi-badge-green">
                          Resident State
                        </span>
                      </td>
                      <td>
                        Permitted with valid W&C Permit
                      </td>
                      <td>
                        Cased & unloaded if no permit
                      </td>
                      <td>
                        Upon Demand / Request
                      </td>
                      <td>
                        10 Rds (Purchase/Sale)
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{"color": "#fff"}}>
                          Virginia (VA)
                        </strong>
                      </td>
                      <td>
                        <span className="fi-badge fi-badge-green">
                          Reciprocal / Honored
                        </span>
                      </td>
                      <td>
                        Permitted with recognized permit
                      </td>
                      <td>
                        Unloaded in secured container
                      </td>
                      <td>
                        Upon Demand / Request
                      </td>
                      <td>
                        No state capacity limit
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{"color": "#fff"}}>
                          Pennsylvania (PA)
                        </strong>
                      </td>
                      <td>
                        <span className="fi-badge fi-badge-amber" style={{"color": "#ef4444", "borderColor": "#ef4444"}}>
                          Not Honored
                        </span>
                      </td>
                      <td>
                        Requires PA permit or FOPA
                      </td>
                      <td>
                        FOPA trunk storage required
                      </td>
                      <td>
                        Upon Demand / Request
                      </td>
                      <td>
                        No state capacity limit
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{"color": "#fff"}}>
                          Delaware (DE)
                        </strong>
                      </td>
                      <td>
                        <span className="fi-badge fi-badge-amber">
                          Utah/FL Permit Honored
                        </span>
                      </td>
                      <td>
                        Open carry / permit required
                      </td>
                      <td>
                        FOPA or DE/UT/FL permit
                      </td>
                      <td>
                        Upon Demand / Request
                      </td>
                      <td>
                        17 Rds (Unless CCW exempt)
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{"color": "#fff"}}>
                          Dist. of Columbia (DC)
                        </strong>
                      </td>
                      <td>
                        <span className="fi-badge fi-badge-amber" style={{"color": "#ef4444", "borderColor": "#ef4444"}}>
                          Not Honored
                        </span>
                      </td>
                      <td>
                        Strictly Prohibited
                      </td>
                      <td>
                        FOPA continuous transit only
                      </td>
                      <td>
                        Mandatory Immediate
                      </td>
                      <td>
                        10 Rounds Strictly Enforced
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* INTERACTIVE PRE-TRIP CHECKLIST */}
              <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "textTransform": "uppercase", "margin": "20px 0 10px"}}>
                
            📋 Interactive "Before You Leave" Road Trip Checklist
          
              </h4>
              <div id="fiTravelChecklist">
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'tc1')">
                  <input id="tc1" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="tc1">
                    <strong>
                      Confirm Destination Legality:
                    </strong>
                     Verified that my concealed carry permit is formally recognized in my destination state.
                  </label>
                </div>
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'tc2')">
                  <input id="tc2" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="tc2">
                    <strong>
                      FOPA Transit Route Check:
                    </strong>
                     Mapped my driving corridor to ensure continuous travel through any restrictive non-reciprocal states.
                  </label>
                </div>
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'tc3')">
                  <input id="tc3" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="tc3">
                    <strong>
                      Unloaded & Locked in Trunk:
                    </strong>
                     When passing through non-permissive jurisdictions, firearms are completely unloaded in a locked, rigid case in the trunk.
                  </label>
                </div>
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'tc4')">
                  <input id="tc4" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="tc4">
                    <strong>
                      Ammunition Separated:
                    </strong>
                     Ammunition is stored in original factory packaging in a separate container/compartment away from the firearm.
                  </label>
                </div>
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'tc5')">
                  <input id="tc5" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="tc5">
                    <strong>
                      Magazine Capacity Verified:
                    </strong>
                     Ensured no magazines exceed the statutory limits of any state along my planned route.
                  </label>
                </div>
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'tc6')">
                  <input id="tc6" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="tc6">
                    <strong>
                      Duty to Inform Protocol:
                    </strong>
                     Reviewed law enforcement notification requirements for all states on the itinerary.
                  </label>
                </div>
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'tc7')">
                  <input id="tc7" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="tc7">
                    <strong>
                      Documents Packed:
                    </strong>
                     Physical government photo ID and valid physical permit cards on person.
                  </label>
                </div>
              </div>
            </div>
            {/* ================= SECTION: FLYING WITH A FIREARM ================= */}
          </div>
          <div style={{"marginTop": "20px", "paddingTop": "14px", "borderTop": "1px solid var(--border-subtle)", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "10px"}}>
            <span style={{"fontSize": "0.78rem", "color": "var(--text-muted)"}}>
              Future Initiative Firearm Services • Safe Passage Compliance
            </span>
            <button className="btn-secondary-modal" data-onclick="closeVehicleTravelModal()" style={{"padding": "10px 22px", "fontSize": "0.90rem", "fontWeight": "800"}} type="button">
              
          ← Return to Client Hub
        
            </button>
          </div>
        </div>
      </div>
      {/* ================= MODAL: COMMERCIAL AIRLINE & TSA FLYING DEEP-DIVE WINDOW ================= */}
      <div className="goal-modal-overlay" id="flyingWithFirearmModal" data-onclick="if(event.target===this) closeFlyingWithFirearmModal()" style={{"display": "none"}}>
        <div aria-labelledby="flyingModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "860px", "borderColor": "var(--accent-amber)", "boxShadow": "0 25px 60px rgba(0,0,0,0.95), 0 0 35px var(--accent-amber-glow)"}}>
          <button aria-label="Close air travel guide" className="goal-modal-close-btn" data-onclick="closeFlyingWithFirearmModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" style={{"background": "rgba(255,183,3,0.15)", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)"}}>
              COMMERCIAL AIRLINE COMPLIANCE • 49 CFR § 1540.111
            </span>
          </div>
          <h3 className="goal-modal-title" id="flyingModalTitle" style={{"color": "#fff", "margin": "4px 0 6px", "fontSize": "1.8rem", "textTransform": "uppercase"}}>
            
        ✈️ Flying With a Firearm (Commercial Airline & TSA Guide)
      
          </h3>
          <div className="goal-modal-rec" style={{"color": "var(--accent-amber)", "fontWeight": "700", "marginBottom": "16px"}}>
            
        Federal Lock Mandates, Check-in Procedures, Airline Policies & Briefings
      
          </div>
          <div style={{"marginBottom": "20px"}}>
            <div className="fi-section-header" id="fi-sec-flying">
              <h3>
                Flying With a Firearm (Commercial Airline & TSA Guide)
              </h3>
              <p>
                Federal CFR standards, non-TSA padlock requirements, ammunition packaging rules, and ticket counter declaration protocols.
              </p>
            </div>
            <div className="fi-checklist-card">
              <div style={{"background": "rgba(239,68,68,0.08)", "borderLeft": "4px solid #ef4444", "padding": "14px 18px", "borderRadius": "6px", "marginBottom": "24px"}}>
                <strong style={{"color": "#ef4444", "fontFamily": "var(--font-display)", "fontSize": "1.05rem", "letterSpacing": "0.8px", "textTransform": "uppercase"}}>
                  
              🚨 CRITICAL TSA RULE: NEVER USE TSA-ACCESSIBLE LOCKS ON FIREARM CASES
            
                </strong>
                <p style={{"fontSize": "0.88rem", "color": "#e2e8f0", "marginTop": "4px", "lineHeight": "1.5"}}>
                  
              Under federal law (49 CFR § 1540.111), only the passenger may possess the key or combination to the firearm container. Using a TSA master-key lock violates federal regulations because TSA agents could open the case without your presence. Always use standard keyed or combination heavy-duty padlocks.
            
                </p>
              </div>
              {/* 6-STEP WORKFLOW */}
              <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.25rem", "color": "#fff", "textTransform": "uppercase", "marginBottom": "14px"}}>
                
            Step-by-Step Commercial Airline Flight Workflow
          
              </h4>
              <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(300px, 1fr))", "gap": "16px", "marginBottom": "28px"}}>
                <div style={{"background": "rgba(0,0,0,0.3)", "border": "1px solid rgba(255,255,255,0.08)", "borderRadius": "12px", "padding": "18px"}}>
                  <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "fontWeight": "700"}}>
                    1. The Case
                  </div>
                  <p style={{"fontSize": "0.85rem", "color": "#94a3b8", "marginTop": "6px", "lineHeight": "1.45"}}>
                    
                Must be a hard-sided, crush-resistant container (e.g., Pelican, Apache, Vaultek) that cannot be pried open with human hand force at any corner.
              
                  </p>
                </div>
                <div style={{"background": "rgba(0,0,0,0.3)", "border": "1px solid rgba(255,255,255,0.08)", "borderRadius": "12px", "padding": "18px"}}>
                  <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "fontWeight": "700"}}>
                    2. Padlocks on ALL Eyelets
                  </div>
                  <p style={{"fontSize": "0.85rem", "color": "#94a3b8", "marginTop": "6px", "lineHeight": "1.45"}}>
                    
                Every padlock hole provided by the case manufacturer must have a padlock installed. Non-TSA keyed padlocks (keep keys on your keychain).
              
                  </p>
                </div>
                <div style={{"background": "rgba(0,0,0,0.3)", "border": "1px solid rgba(255,255,255,0.08)", "borderRadius": "12px", "padding": "18px"}}>
                  <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "fontWeight": "700"}}>
                    3. Firearms Unloaded
                  </div>
                  <p style={{"fontSize": "0.85rem", "color": "#94a3b8", "marginTop": "6px", "lineHeight": "1.45"}}>
                    
                Visually and physically verify empty chamber and cylinder. Magazines must be empty unless loaded into designated magazine pouches in hard cases.
              
                  </p>
                </div>
                <div style={{"background": "rgba(0,0,0,0.3)", "border": "1px solid rgba(255,255,255,0.08)", "borderRadius": "12px", "padding": "18px"}}>
                  <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "fontWeight": "700"}}>
                    4. Ammunition Packaging
                  </div>
                  <p style={{"fontSize": "0.85rem", "color": "#94a3b8", "marginTop": "6px", "lineHeight": "1.45"}}>
                    
                Must be in original factory cardboard, wood, or metal packaging specifically designed for ammo. Maximum 11 lbs (5 kg) on major domestic airlines.
              
                  </p>
                </div>
                <div style={{"background": "rgba(0,0,0,0.3)", "border": "1px solid rgba(255,255,255,0.08)", "borderRadius": "12px", "padding": "18px"}}>
                  <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "fontWeight": "700"}}>
                    5. Ticket Counter Declaration
                  </div>
                  <p style={{"fontSize": "0.85rem", "color": "#94a3b8", "marginTop": "6px", "lineHeight": "1.45"}}>
                    
                Walk directly to the airline main check-in desk. Calmly declare: "I have a firearm to declare in checked baggage." Sign orange declaration tag.
              
                  </p>
                </div>
                <div style={{"background": "rgba(0,0,0,0.3)", "border": "1px solid rgba(255,255,255,0.08)", "borderRadius": "12px", "padding": "18px"}}>
                  <div style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "fontWeight": "700"}}>
                    6. Baggage Office Recovery
                  </div>
                  <p style={{"fontSize": "0.85rem", "color": "#94a3b8", "marginTop": "6px", "lineHeight": "1.45"}}>
                    
                At destination, firearm bags do not drop onto regular carousel; retrieve at the airline Baggage Service Office with government photo ID and baggage claim stub.
              
                  </p>
                </div>
              </div>
              {/* AIRLINE COMPARISON MATRIX */}
              <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "textTransform": "uppercase", "marginBottom": "10px"}}>
                
            Major Domestic Airline Policies & Limits
          
              </h4>
              <div className="fi-table-wrap">
                <table className="fi-table">
                  <thead>
                    <tr>
                      <th>
                        Airline
                      </th>
                      <th>
                        Max Ammo Weight
                      </th>
                      <th>
                        Ammo in Same Case?
                      </th>
                      <th>
                        Check-In Procedure
                      </th>
                      <th>
                        Baggage Claim Policy
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong style={{"color": "#fff"}}>
                          Delta Air Lines
                        </strong>
                      </td>
                      <td>
                        11 lbs (5 kg)
                      </td>
                      <td>
                        Permitted if in factory box
                      </td>
                      <td>
                        Ticket counter declaration; special BSO tag
                      </td>
                      <td>
                        Claim at Baggage Service Office with ID
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{"color": "#fff"}}>
                          American Airlines
                        </strong>
                      </td>
                      <td>
                        11 lbs (5 kg)
                      </td>
                      <td>
                        Permitted in factory box
                      </td>
                      <td>
                        Ticket counter declaration; TSA escort
                      </td>
                      <td>
                        Delivered to locked Baggage Office
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{"color": "#fff"}}>
                          United Airlines
                        </strong>
                      </td>
                      <td>
                        11 lbs (5 kg)
                      </td>
                      <td>
                        Permitted in factory box
                      </td>
                      <td>
                        Ticket counter declaration; visual inspection
                      </td>
                      <td>
                        High-value claim at BSO window
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{"color": "#fff"}}>
                          Southwest Airlines
                        </strong>
                      </td>
                      <td>
                        11 lbs (5 kg)
                      </td>
                      <td>
                        Permitted in factory packaging
                      </td>
                      <td>
                        Ticket counter declaration; 2 free bags
                      </td>
                      <td>
                        Baggage service office pickup with ID
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* INTERACTIVE PRE-FLIGHT CHECKLIST */}
              <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "var(--accent-cyan)", "textTransform": "uppercase", "margin": "20px 0 10px"}}>
                
            📋 Interactive Pre-Flight Packing Checklist
          
              </h4>
              <div id="fiFlightChecklist">
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'fc1')">
                  <input id="fc1" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="fc1">
                    <strong>
                      Hard-Sided Case Pry Test:
                    </strong>
                     Locked case cannot be pried open with fingers at any edge or corner.
                  </label>
                </div>
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'fc2')">
                  <input id="fc2" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="fc2">
                    <strong>
                      Non-TSA Padlocks Installed:
                    </strong>
                     Standard keyed/combination locks installed on all padlock eyelets; key kept on my person.
                  </label>
                </div>
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'fc3')">
                  <input id="fc3" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="fc3">
                    <strong>
                      Firearm Physically Cleared:
                    </strong>
                     Completely unloaded; chamber empty; bolt/slide locked back or action closed on empty chamber.
                  </label>
                </div>
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'fc4')">
                  <input id="fc4" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="fc4">
                    <strong>
                      Ammunition Factory Boxed:
                    </strong>
                     Ammo is under 11 lbs and stored in manufacturer cardboard/plastic partitions.
                  </label>
                </div>
                <div className="fi-check-item" data-onclick="fiToggleCheck(this, 'fc5')">
                  <input id="fc5" type="checkbox"  defaultChecked={false} />
                  <label className="fi-check-label" htmlFor="fc5">
                    <strong>
                      Early Airport Arrival:
                    </strong>
                     Arriving at airline counter at least 2.5 hours before domestic flight departure to allow for TSA screening.
                  </label>
                </div>
              </div>
              
        &lt;
          
              {/* ================= EXCLUSIVE CLIENT FEATURE: FLIGHT BRIEFING PACKET GENERATOR ================= */}
              <div className="fi-checklist-card" style={{"marginTop": "24px", "border": "1.5px solid var(--accent-cyan)", "background": "linear-gradient(135deg, rgba(0, 229, 255, 0.06) 0%, rgba(13, 19, 27, 0.98) 100%)"}}>
                <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "flex-start", "flexWrap": "wrap", "gap": "12px", "marginBottom": "16px"}}>
                  <div>
                    <span className="fi-badge fi-badge-cyan">
                      Interactive Travel Tool
                    </span>
                    <h4 style={{"fontFamily": "var(--font-display)", "fontSize": "1.45rem", "color": "#fff", "textTransform": "uppercase", "margin": "4px 0 2px"}}>
                      
                  ✈️ Personalized Airline & TSA Flight Briefing Generator
                
                    </h4>
                    <p style={{"fontSize": "0.86rem", "color": "var(--text-muted)", "lineHeight": "1.5"}}>
                      
                  Select your departure airport, airline carrier, and destination state to generate a personalized compliance dossier with counter scripts and destination carry statutes.
                
                    </p>
                  </div>
                </div>
                <div style={{"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(220px, 1fr))", "gap": "14px", "marginBottom": "18px"}}>
                  <div>
                    <label htmlFor="flightDepAirport" style={{"fontSize": "0.82rem", "color": "var(--accent-cyan)", "fontWeight": "700", "textTransform": "uppercase", "marginBottom": "6px", "display": "block"}}>
                      Departure Hub:
                    </label>
                    <select
  defaultValue={"BWI"} id="flightDepAirport" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%", "fontWeight": "600"}}>
                      <option value="BWI">
                        BWI — Baltimore/Washington Thurgood Marshall
                      </option>
                      <option value="DCA">
                        DCA — Ronald Reagan Washington National
                      </option>
                      <option value="IAD">
                        IAD — Washington Dulles International
                      </option>
                      <option value="PHL">
                        PHL — Philadelphia International
                      </option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="flightAirline" style={{"fontSize": "0.82rem", "color": "var(--accent-cyan)", "fontWeight": "700", "textTransform": "uppercase", "marginBottom": "6px", "display": "block"}}>
                      Airline Carrier:
                    </label>
                    <select
  defaultValue={"Delta Air Lines"} id="flightAirline" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%", "fontWeight": "600"}}>
                      <option value="Delta Air Lines">
                        Delta Air Lines (11 lbs ammo max)
                      </option>
                      <option value="Southwest Airlines">
                        Southwest Airlines (2 free bags)
                      </option>
                      <option value="American Airlines">
                        American Airlines (Escort protocol)
                      </option>
                      <option value="United Airlines">
                        United Airlines (Visual check)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="flightDestState" style={{"fontSize": "0.82rem", "color": "var(--accent-cyan)", "fontWeight": "700", "textTransform": "uppercase", "marginBottom": "6px", "display": "block"}}>
                      Destination Destination/State:
                    </label>
                    <select
  defaultValue={"FL"} id="flightDestState" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%", "fontWeight": "600"}}>
                      <option value="FL">
                        Florida (MCO/MIA/TPA) — Constitutional Carry
                      </option>
                      <option value="TX">
                        Texas (DFW/IAH/AUS) — Constitutional Carry
                      </option>
                      <option value="VA">
                        Virginia (RIC/ORF) — Honored Reciprocity
                      </option>
                      <option value="NC">
                        North Carolina (CLT/RDU) — Honored (Duty to Inform)
                      </option>
                      <option value="GA">
                        Georgia (ATL) — Constitutional Carry
                      </option>
                      <option value="TN">
                        Tennessee (BNA/MEM) — Constitutional Carry
                      </option>
                      <option value="SC">
                        South Carolina (CHS) — Constitutional Carry
                      </option>
                      <option value="UT">
                        Utah (SLC) — Constitutional Carry
                      </option>
                      <option value="AZ">
                        Arizona (PHX) — Constitutional Carry
                      </option>
                      <option value="OH">
                        Ohio (CMH/CLE) — Constitutional Carry
                      </option>
                      <option value="PA">
                        Pennsylvania (PHL/PIT) — Non-Resident LTCF Roadmap
                      </option>
                      <option value="NY">
                        New York (JFK/LGA/BUF) — RESTRICTED / NO RECIPROCITY
                      </option>
                      <option value="NJ">
                        New Jersey (EWR) — RESTRICTED / NO RECIPROCITY
                      </option>
                      <option value="MA">
                        Massachusetts (BOS) — RESTRICTED / NO RECIPROCITY
                      </option>
                    </select>
                  </div>
                </div>
                <button className="btn-primary" data-onclick="generateFlightBriefingPacket()" style={{"width": "100%", "padding": "12px", "fontSize": "0.95rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px"}} type="button">
                  
              📄 Generate Travel Briefing Packet & TSA Script →
            
                </button>
                {/* Output Briefing Card */}
                <div id="flightBriefingResultBox" style={{"display": "none", "background": "#070b10", "border": "1px solid var(--accent-cyan)", "borderRadius": "12px", "padding": "20px", "marginTop": "18px", "boxShadow": "0 8px 25px rgba(0,0,0,0.8)"}}>
                  <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "borderBottom": "1px solid var(--border-subtle)", "paddingBottom": "12px", "marginBottom": "14px"}}>
                    <h5 id="briefingTitle" style={{"fontFamily": "var(--font-display)", "fontSize": "1.25rem", "color": "#fff", "margin": "0"}}>
                      Official Flight Briefing Packet
                    </h5>
                    <span className="meta-chip chip-status" id="briefingStatusChip">
                      LEGAL CARRY DESTINATION
                    </span>
                  </div>
                  <div id="briefingContent" style={{"fontSize": "0.88rem", "color": "#cbd5e1", "lineHeight": "1.6"}}>
                    {/* Filled dynamically by generateFlightBriefingPacket */}
                  </div>
                  <div style={{"display": "flex", "justifyContent": "flex-end", "gap": "10px", "marginTop": "16px", "borderTop": "1px solid var(--border-subtle)", "paddingTop": "12px"}}>
                    <button className="btn-spark" data-onclick="window.print()" style={{"padding": "8px 18px", "fontSize": "0.82rem"}} type="button">
                      🖨️ Print / Save PDF
                    </button>
                  </div>
                </div>
              </div>
              {/* ================= SECTION: PERMIT & RENEWAL CENTER ================= */}
            </div>
          </div>
        </div>
      </div>
      {/* Floating Contact & Live Chat Trigger Pill */}
      {/* ================= MODAL: DIRECT CONTACT & LIVE CHAT (9AM - 5PM EST) ================= */}
      <div className="goal-modal-overlay" id="contactInstructorModal" data-onclick="if(event.target===this) closeContactWidgetModal()" style={{"display": "none"}}>
        <div aria-labelledby="contactModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "620px", "borderColor": "var(--accent-cyan)", "boxShadow": "0 25px 60px rgba(0,0,0,0.95), 0 0 35px var(--accent-cyan-glow)"}}>
          <button aria-label="Close contact options" className="goal-modal-close-btn" data-onclick="closeContactWidgetModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge">
              FUTURE INITIATIVE DIRECT DISPATCH
            </span>
          </div>
          <h3 className="goal-modal-title" id="contactModalTitle" style={{"color": "#fff", "margin": "4px 0 2px", "fontSize": "1.8rem", "textTransform": "uppercase"}}>
            
        💬 Connect With Lead Instructor Kai Wade
      
          </h3>
          <p style={{"fontSize": "0.86rem", "color": "var(--text-muted)", "marginBottom": "18px", "lineHeight": "1.5"}}>
            
        Direct line to Coach Kai Wade. Have questions about course prerequisites, equipment compliance, or class schedules? Connect directly below.
      
          </p>
          {/* 3 Communication Channels Grid */}
          <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "20px"}}>
            <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "14px", "textAlign": "center"}}>
              <span style={{"fontSize": "1.8rem", "display": "block", "marginBottom": "4px"}}>
                📞
              </span>
              <strong style={{"color": "#fff", "fontFamily": "var(--font-display)", "fontSize": "1.05rem", "display": "block"}}>
                Direct Telephone
              </strong>
              <span style={{"fontSize": "0.76rem", "color": "var(--text-muted)", "display": "block", "margin": "2px 0 10px"}}>
                Range Office & Scheduling Line
              </span>
              <a className="btn-spark" href="tel:4439901304" style={{"textDecoration": "none", "padding": "8px 14px", "fontSize": "0.85rem", "fontWeight": "800", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "width": "100%"}}>
                
            📞 Call (443) 990-1304
          
              </a>
            </div>
            <div style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "14px", "textAlign": "center"}}>
              <span style={{"fontSize": "1.8rem", "display": "block", "marginBottom": "4px"}}>
                ✉️
              </span>
              <strong style={{"color": "#fff", "fontFamily": "var(--font-display)", "fontSize": "1.05rem", "display": "block"}}>
                Official Email
              </strong>
              <span style={{"fontSize": "0.76rem", "color": "var(--text-muted)", "display": "block", "margin": "2px 0 10px"}}>
                Inquiries & Paperwork Audits
              </span>
              <a className="btn-spark" href="mailto:info@trainwithfifs.com" style={{"textDecoration": "none", "padding": "8px 14px", "fontSize": "0.85rem", "fontWeight": "800", "display": "inline-flex", "alignItems": "center", "justifyContent": "center", "width": "100%", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)"}}>
                
            ✉️ Email Instructor
          
              </a>
            </div>
          </div>
          {/* Priority Live Chat Channel (Active 9 AM - 5 PM EST) */}
          <div style={{"background": "linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, #070b10 100%)", "border": "1.5px solid var(--accent-cyan)", "borderRadius": "12px", "padding": "18px 20px"}}>
            <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "10px", "flexWrap": "wrap", "gap": "8px"}}>
              <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
                <span className="pulse-dot" id="liveChatPulseDot" style={{"width": "8px", "height": "8px"}}>
                </span>
                <strong style={{"fontFamily": "var(--font-display)", "fontSize": "1.15rem", "color": "#fff", "textTransform": "uppercase"}}>
                  💬 Priority Live Range Chat
                </strong>
              </div>
              <span id="liveChatOperatingTag" style={{"fontSize": "0.74rem", "fontWeight": "800", "textTransform": "uppercase", "color": "var(--accent-cyan)"}}>
                Active 9 AM – 5 PM EST
              </span>
            </div>
            <p id="liveChatStatusDescription" style={{"fontSize": "0.82rem", "color": "#cbd5e1", "marginBottom": "12px", "lineHeight": "1.45"}}>
              
          Direct dispatch to Coach Kai Wade. Messages submitted during business hours trigger instant priority notification.
        
            </p>
            <form id="liveChatDispatchForm" data-onsubmit="handleLiveChatSubmit(event)" onSubmit={(e) => { e.preventDefault(); if (typeof window !== 'undefined' && (window as any).handleLiveChatSubmit) (window as any).handleLiveChatSubmit(e); }}>
              <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "10px", "marginBottom": "10px"}}>
                <input id="chatSenderName" placeholder="Your Name" required={true} style={{"background": "#10161f", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "fontSize": "0.88rem"}} type="text" />
                <input id="chatSenderPhone" placeholder="Mobile Phone (SMS Callback)" required={true} style={{"background": "#10161f", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "fontSize": "0.88rem"}} type="tel" />
              </div>
              <textarea id="chatMessageText" placeholder="How can Coach Wade assist you today? (Course dates, equipment questions, etc.)" required={true} rows={2} style={{"background": "#10161f", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px", "borderRadius": "8px", "width": "100%", "fontFamily": "inherit", "fontSize": "0.88rem", "marginBottom": "10px"}}>
              </textarea>
              <button className="btn-primary" id="btn-send-chat" data-onclick="handleLiveChatSubmit(event)" onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined' && (window as any).handleLiveChatSubmit) (window as any).handleLiveChatSubmit(e); }} style={{"width": "100%", "padding": "11px", "fontSize": "0.95rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "1px"}} type="submit">
                
            🚀 Dispatch Live Chat Message →
          
              </button>
              <div className="status-msg" id="chat-dispatch-status" style={{"marginTop": "10px", "display": "none"}}>
              </div>
            </form>
          </div>
          <div style={{"marginTop": "16px", "paddingTop": "12px", "borderTop": "1px solid var(--border-subtle)", "textAlign": "right"}}>
            <button className="btn-secondary-modal" data-onclick="closeContactWidgetModal()" style={{"padding": "8px 18px", "fontSize": "0.85rem"}} type="button">
              
          Close Window
        
            </button>
          </div>
        </div>
      </div>
      {/* ================= TWO-WAY LIVE CHAT MODAL (REAL-TIME COMMUNICATION) ================= */}
      <div className="goal-modal-overlay" id="twoWayChatModal" data-onclick="if(event.target===this) closeTwoWayChat()" style={{"display": "none"}}>
        <div aria-labelledby="twoWayChatHeaderTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "650px", "width": "100%", "maxHeight": "92vh", "height": "620px", "display": "flex", "flexDirection": "column", "padding": "0", "overflow": "hidden", "border": "2px solid var(--accent-cyan)", "boxShadow": "0 25px 60px rgba(0,0,0,0.95), 0 0 35px var(--accent-cyan-glow)", "borderRadius": "18px", "background": "#0a0f16"}}>
          {/* 2-Way Chat Header with Prominent Close Chat Button */}
          <div style={{"padding": "14px 20px", "background": "#0d131b", "borderBottom": "1px solid var(--border-subtle)", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "10px"}}>
            <div style={{"display": "flex", "alignItems": "center", "gap": "12px"}}>
              <div style={{"position": "relative"}}>
                <img src="https://lh3.googleusercontent.com/d/1u53IU5ttzcy8t5W4oLlB2H9q2pXaaExa" data-onerror="this.src=&#x27;https://drive.google.com/thumbnail?id=1EnAqEURi1XIRNdNTooFGY_pvs38ZcBEQ&amp;sz=w128&#x27;" alt="Instructor Kai Wade" style={{"width": "44px", "height": "44px", "borderRadius": "50%", "objectFit": "cover", "border": "2px solid var(--accent-cyan)", "boxShadow": "0 0 10px var(--accent-cyan-glow)"}} />
                <span className="pulse-dot" style={{"position": "absolute", "bottom": "0", "right": "0", "width": "10px", "height": "10px", "border": "2px solid #0d131b", "background": "#10b981"}}>
                </span>
              </div>
              <div>
                <h4 id="twoWayChatHeaderTitle" style={{"fontFamily": "var(--font-display)", "fontSize": "1.2rem", "fontWeight": "800", "color": "#fff", "margin": "0", "textTransform": "uppercase", "letterSpacing": "0.8px"}}>
                  Coach Kai Wade
                </h4>
                <div style={{"display": "flex", "alignItems": "center", "gap": "6px", "marginTop": "2px"}}>
                  <span style={{"fontSize": "0.74rem", "color": "#10b981", "fontWeight": "700", "textTransform": "uppercase", "letterSpacing": "0.5px"}}>
                    ● Connected • 2-Way Chat
                  </span>
                  <span style={{"fontSize": "0.72rem", "color": "var(--text-muted)"}}>
                    | Lead Instructor (MSP § 5-101)
                  </span>
                </div>
              </div>
            </div>
            {/* Prominent Close Chat Button in Header */}
            <button type="button" className="btn-close-chat" id="btnCloseTwoWayChat" data-onclick="closeTwoWayChat()" style={{"background": "rgba(239, 68, 68, 0.15)", "border": "1.5px solid #ef4444", "color": "#fca5a5", "padding": "8px 18px", "borderRadius": "8px", "fontFamily": "var(--font-display)", "fontSize": "0.90rem", "fontWeight": "800", "textTransform": "uppercase", "letterSpacing": "0.8px", "cursor": "pointer", "display": "inline-flex", "alignItems": "center", "gap": "6px", "transition": "all 0.2s ease"}}>
              <span>
                ✕
              </span>
               Close Chat
      
            </button>
          </div>
          {/* Direct Line Channel Status Bar */}
          <div style={{"background": "rgba(0, 229, 255, 0.05)", "borderBottom": "1px solid rgba(0, 229, 255, 0.15)", "padding": "7px 18px", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "fontSize": "0.76rem", "color": "var(--accent-cyan)"}}>
            <span>
              💬 Direct 2-Way Line to Instructor Wade • (443) 990-1304
            </span>
            <span style={{"color": "var(--text-muted)"}}>
              Cindy's Hot Shots (Glen Burnie, MD)
            </span>
          </div>
          {/* Scrollable Message Stream Area */}
          <div id="twoWayChatStream" style={{"flex": "1", "overflowY": "auto", "padding": "18px 20px", "display": "flex", "flexDirection": "column", "gap": "14px", "background": "#070b10"}}>
          </div>
          {/* Typing Indicator */}
          <div id="twoWayTypingIndicator" style={{"display": "none", "padding": "4px 20px 8px", "fontSize": "0.76rem", "color": "var(--accent-cyan)", "fontStyle": "italic", "background": "#070b10"}}>
            
      Coach Wade is typing...
    
          </div>
          {/* Input Dock with Send & Close Actions */}
          <form id="twoWayChatInputForm" data-onsubmit="handleTwoWayChatSend(event)" onSubmit={(e) => { e.preventDefault(); if (typeof window !== 'undefined' && (window as any).handleTwoWayChatSend) (window as any).handleTwoWayChatSend(e); }} style={{"padding": "12px 18px", "background": "#0d131b", "borderTop": "1px solid var(--border-subtle)", "display": "flex", "gap": "10px", "alignItems": "center"}}>
            <input type="text" id="twoWayMessageInput" placeholder="Type a message to Coach Wade..." autoComplete="off" required={true} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (typeof window !== 'undefined' && (window as any).handleTwoWayChatSend) (window as any).handleTwoWayChatSend(e); } }} style={{"flex": "1", "background": "#070b10", "border": "1px solid var(--border-subtle)", "borderRadius": "24px", "padding": "12px 18px", "color": "#fff", "fontFamily": "var(--font-body)", "fontSize": "0.92rem", "outline": "none", "transition": "border-color 0.2s"}} />
            <button type="submit" id="btnTwoWaySend" className="btn-primary" onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined' && (window as any).handleTwoWayChatSend) (window as any).handleTwoWayChatSend(e); }} style={{"width": "auto", "padding": "10px 22px", "borderRadius": "24px", "fontSize": "0.95rem", "fontWeight": "800", "display": "inline-flex", "alignItems": "center", "gap": "6px", "textTransform": "uppercase", "minHeight": "44px"}}>
              <span>
                Send
              </span>
              <span>
                ➤
              </span>
            </button>
            <button type="button" data-onclick="closeTwoWayChat()" onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined' && (window as any).closeTwoWayChat) (window as any).closeTwoWayChat(); }} title="Close chat and clear message" style={{"background": "rgba(255,255,255,0.06)", "border": "1px solid rgba(255,255,255,0.15)", "color": "var(--text-muted)", "padding": "8px 14px", "borderRadius": "20px", "fontSize": "0.80rem", "fontWeight": "700", "cursor": "pointer", "textTransform": "uppercase", "minHeight": "44px"}}>
              
        Close Chat
      
            </button>
          </form>
        </div>
      </div>
      {/* ================= MODAL: ALUMNI EXCLUSIVE CLINIC VERIFICATION GATE ================= */}
      <div className="goal-modal-overlay" id="alumniAccessGateModal" data-onclick="if(event.target===this) closeAlumniAccessGateModal()" style={{"display": "none"}}>
        <div aria-labelledby="alumniGateTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "580px", "borderColor": "#38bdf8", "boxShadow": "0 20px 50px rgba(0,0,0,0.92), 0 0 30px rgba(56, 189, 248, 0.35)"}}>
          <button aria-label="Close modal" className="goal-modal-close-btn" data-onclick="closeAlumniAccessGateModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" style={{"background": "rgba(56, 189, 248, 0.15)", "borderColor": "#38bdf8", "color": "#38bdf8"}}>
              ALUMNI VERIFICATION REQUIRED
            </span>
          </div>
          <h3 className="goal-modal-title" id="alumniGateTitle" style={{"color": "#fff", "margin": "4px 0 8px", "fontSize": "1.7rem", "textTransform": "uppercase"}}>
            
        🔒 Alumni Exclusive Clinic Access
      
          </h3>
          <div className="goal-synopsis-card" style={{"borderLeftColor": "#38bdf8", "background": "#070b10", "fontSize": "0.90rem", "color": "#cbd5e1", "lineHeight": "1.6", "marginBottom": "16px"}}>
            
        The 
            <strong>
              FIFS Graduate Alumni Marksmanship Clinic ($65.00)
            </strong>
             is an exclusive 2-hour diagnostic workshop reserved for verified FIFS graduates and active carry permit holders.
            <br />
            <br />
            
        To reserve a seat in an upcoming alumni clinic cohort, please sign in to your 
            <strong>
              Client Portal
            </strong>
             (or create your free verified profile). Once verified, you will immediately be redirected to complete your reservation.
      
          </div>
          <div className="goal-modal-actions" style={{"display": "flex", "flexDirection": "column", "gap": "10px"}}>
            <button className="btn-primary" data-onclick="proceedToClientSignInForAlumni()" style={{"background": "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)", "color": "#070b10", "fontWeight": "800", "padding": "12px", "width": "100%"}} type="button">
              
          🔑 Sign In to Client Portal to Unlock ($65.00) →
        
            </button>
            <button className="btn-secondary-modal" data-onclick="closeAlumniAccessGateModal()" style={{"width": "100%", "padding": "10px"}} type="button">
              
          ← Return to Course Catalog
        
            </button>
          </div>
        </div>
      </div>
      {/* ================= MODAL: CLIENT PROFILE & EXPIRATION REGISTRY DEEP-DIVE ================= */}
      <div className="goal-modal-overlay" id="clientProfileModal" data-onclick="if(event.target===this) closeClientProfileModal()" style={{"display": "none"}}>
        <div aria-labelledby="clientProfileModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "760px", "borderColor": "var(--accent-amber)", "boxShadow": "0 25px 60px rgba(0,0,0,0.95), 0 0 35px var(--accent-amber-glow)"}}>
          <button aria-label="Close client profile" className="goal-modal-close-btn" data-onclick="closeClientProfileModal()" type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" style={{"background": "rgba(255,183,3,0.15)", "borderColor": "var(--accent-amber)", "color": "var(--accent-amber)"}}>
              PERMIT COMPLIANCE REGISTRY
            </span>
          </div>
          <h3 className="goal-modal-title" id="clientProfileModalTitle" style={{"color": "#fff", "margin": "4px 0 6px", "fontSize": "1.8rem", "textTransform": "uppercase"}}>
            
        🛡️ Manage Client Profile & Renewal Watch
      
          </h3>
          <div className="goal-modal-rec" style={{"color": "var(--accent-amber)", "fontWeight": "700", "marginBottom": "16px"}}>
            
        Automated 90-Day Renewal Notifications & Official Permit Expiration Tracking
      
          </div>
          <div style={{"marginBottom": "20px"}}>
            <div className="fi-section-header" id="fi-sec-profile">
              <h3>
                Client Profile & Expiration Registry
              </h3>
              <p>
                Register your permit expiration date to receive automated 90-day renewal reminders and legal compliance updates.
              </p>
            </div>
            <div className="fi-checklist-card" style={{"maxWidth": "720px", "margin": "0 auto 30px"}}>
              <div style={{"background": "rgba(16,185,129,0.06)", "border": "1px solid rgba(16,185,129,0.3)", "padding": "12px 16px", "borderRadius": "8px", "marginBottom": "20px", "display": "flex", "alignItems": "center", "gap": "10px"}}>
                <span style={{"fontSize": "1.3rem"}}>
                  🔒
                </span>
                <div style={{"fontSize": "0.85rem", "color": "#cbd5e1", "lineHeight": "1.45"}}>
                  <strong>
                    Zero Sensitive Hardware Data:
                  </strong>
                   Future Initiative strictly does not collect firearm serial numbers, makes, models, or photographs. Only your name, email, and expiration date are stored.
            
                </div>
              </div>
              <form id="fiClientProfileForm" data-onsubmit="fiSubmitClientProfile(event)">
                <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "16px", "marginBottom": "14px"}}>
                  <div className="form-group">
                    <label htmlFor="fiClientName">
                      Full Name 
                      <span className="req">
                        *
                      </span>
                    </label>
                    <input id="fiClientName" placeholder="e.g. Marcus Vance" required type="text" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fiClientEmail">
                      Email Address 
                      <span className="req">
                        *
                      </span>
                    </label>
                    <input id="fiClientEmail" placeholder="e.g. marcus@example.com" required type="email" />
                  </div>
                </div>
                <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "16px", "marginBottom": "14px"}}>
                  <div className="form-group">
                    <label htmlFor="fiClientPermitState">
                      Primary Permit State 
                      <span className="req">
                        *
                      </span>
                    </label>
                    <select
  defaultValue={"Maryland"} id="fiClientPermitState" style={{"background": "#10161f", "border": "1px solid rgba(255,255,255,0.15)", "color": "#fff", "padding": "10px 14px", "borderRadius": "8px", "width": "100%", "fontFamily": "var(--font-display)", "fontSize": "0.95rem"}}>
                      <option value="Maryland">
                        Maryland Wear & Carry
                      </option>
                      <option value="Virginia">
                        Virginia Concealed Handgun
                      </option>
                      <option value="Pennsylvania">
                        Pennsylvania LTCF
                      </option>
                      <option value="Florida">
                        Florida Non-Resident
                      </option>
                      <option value="Utah">
                        Utah Non-Resident
                      </option>
                      <option value="Other">
                        Other State Jurisdiction
                      </option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="fiClientExpDate">
                      Permit Expiration Date 
                      <span className="req">
                        *
                      </span>
                    </label>
                    <input id="fiClientExpDate" required type="date" />
                  </div>
                </div>
                <div className="form-group" style={{"marginBottom": "20px"}}>
                  <label style={{"display": "flex", "alignItems": "center", "gap": "10px", "cursor": "pointer"}}>
                    <input defaultChecked={true} id="fiClientOptIn" style={{"width": "18px", "height": "18px", "accentColor": "var(--accent-cyan)"}} type="checkbox" />
                    <span style={{"fontSize": "0.88rem", "color": "#cbd5e1"}}>
                      Send me automated 90-day renewal reminders and the 10% Future Initiative discount offer.
                    </span>
                  </label>
                </div>
                <button className="btn-primary" id="btn-client-save" style={{"width": "100%", "padding": "12px"}} type="submit">
                  
              Save Client Profile & Activate Renewal Watch 🛡️
            
                </button>
                <div className="status-msg" id="fi-profile-status" style={{"display": "none", "marginTop": "12px"}}>
                </div>
              </form>
            </div>
            {/* ================= SECTION: FUTURE INITIATIVE CLIENT SERVICES ================= */}
          </div>
          <div style={{"marginTop": "20px", "paddingTop": "14px", "borderTop": "1px solid var(--border-subtle)", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "10px"}}>
            <span style={{"fontSize": "0.78rem", "color": "var(--text-muted)"}}>
              Future Initiative Firearm Services • Client Privacy & Data Security
            </span>
            <button className="btn-secondary-modal" data-onclick="closeClientProfileModal()" style={{"padding": "10px 22px", "fontSize": "0.90rem", "fontWeight": "800"}} type="button">
              
          ← Return to Client Hub
        
            </button>
          </div>
        </div>
      </div>
      {/* Persistent Floating Contact & Live Chat Trigger Pill with Permanent Dismiss Handler */}
      <div className="floating-comm-bubble-wrapper" id="floatingCommWrapper" style={{"position": "fixed", "bottom": "24px", "right": "24px", "zIndex": "99999", "display": "flex", "alignItems": "center", "gap": "8px"}}>
        <div className="floating-comm-bubble" id="floatingCommPill" data-onclick="openContactWidgetModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).openContactWidgetModal) (window as any).openContactWidgetModal(); }} role="button" tabIndex={0} title="Contact Coach Kai Wade • Call, Email or Live Chat" style={{"position": "relative", "bottom": "auto", "right": "auto", "margin": "0", "cursor": "pointer"}}>
          <span style={{"fontSize": "1.25rem"}}>
            💬
          </span>
          <span style={{"fontFamily": "var(--font-display)", "fontSize": "0.90rem", "fontWeight": "800", "letterSpacing": "1px", "textTransform": "uppercase"}}>
            CHAT
          </span>
        </div>
        <button
          type="button"
          id="floatingChatCloseBtn"
          aria-label="Close Chat Widget"
          title="Dismiss Chat Bubble"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== 'undefined' && (window as any).dismissFloatingChat) {
              (window as any).dismissFloatingChat(e);
            }
          }}
          data-onclick="dismissFloatingChat(event)"
          style={{"width": "30px", "height": "30px", "borderRadius": "50%", "background": "rgba(9, 14, 21, 0.95)", "border": "1.5px solid #ef4444", "color": "#ef4444", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "14px", "fontWeight": "900", "cursor": "pointer", "boxShadow": "0 2px 10px rgba(0, 0, 0, 0.7)", "transition": "all 0.2s ease"}}
        >
          ✕
        </button>
      </div>
      {/* TACTICAL OPS BRIEFING SPLASH SCREEN */}
      <div id="admin-ops-briefing-modal">
        <div style={{"background": "#090e15", "border": "1.5px solid #00e5ff", "borderRadius": "16px", "maxWidth": "640px", "width": "100%", "maxHeight": "90vh", "overflowY": "auto", "padding": "24px", "boxShadow": "0 0 40px rgba(0, 229, 255, 0.3)"}}>
          <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "borderBottom": "1px solid rgba(0, 229, 255, 0.25)", "paddingBottom": "14px", "marginBottom": "18px"}}>
            <div>
              <span style={{"fontFamily": "var(--font-display)", "fontSize": "0.75rem", "color": "#00e5ff", "fontWeight": "800", "letterSpacing": "2px"}}>
                COMMAND CENTER // OPS BRIEFING
              </span>
              <h3 style={{"margin": "4px 0 0", "color": "#fff", "fontSize": "1.3rem"}}>
                ⚡ New Notifications &amp; Inquiries
              </h3>
            </div>
            <button type="button" data-onclick="closeAdminOpsBriefing()" style={{"background": "rgba(255, 255, 255, 0.08)", "border": "1px solid var(--border-subtle)", "color": "#fff", "width": "34px", "height": "34px", "borderRadius": "50%", "cursor": "pointer", "fontSize": "1.1rem"}}>
              ✕
            </button>
          </div>
          <div id="admin-splash-alerts-container">
            <div style={{"textAlign": "center", "padding": "30px", "color": "var(--text-muted)"}}>
              <span style={{"fontSize": "2rem"}}>
                📡
              </span>
              <p style={{"marginTop": "10px"}}>
                Scanning system for urgent student dispatches...
              </p>
            </div>
          </div>
          <div style={{"marginTop": "20px", "display": "flex", "gap": "12px", "justifyContent": "flex-end"}}>
            <button type="button" data-onclick="closeAdminOpsBriefing()" className="btn-spark" style={{"padding": "10px 20px", "fontSize": "0.9rem", "fontWeight": "800", "textTransform": "uppercase"}}>
              Enter Command Console →
            </button>
          </div>
        </div>
      </div>
      {/* PWA LANDING PAGE INSTALL BANNER */}
      <div id="pwa-landing-banner">
        <div style={{"display": "flex", "alignItems": "center", "gap": "14px"}}>
          <div style={{"fontSize": "2rem", "background": "rgba(0, 229, 255, 0.1)", "borderRadius": "10px", "width": "44px", "height": "44px", "display": "flex", "alignItems": "center", "justifyContent": "center", "border": "1px solid #00e5ff"}}>
            📱
          </div>
          <div>
            <div style={{"fontWeight": "800", "fontSize": "0.95rem", "color": "#fff", "fontFamily": "var(--font-display)"}}>
              SAVE TRAIN WITH FIFS TO YOUR PHONE
            </div>
            <div style={{"fontSize": "0.80rem", "color": "var(--text-muted)", "marginTop": "2px"}}>
              Install as a web app for instant offline access & training dossier
            </div>
          </div>
        </div>
        <div style={{"display": "flex", "alignItems": "center", "gap": "8px"}}>
          <button type="button" data-onclick="promptPwaInstallInstructions()" className="btn-spark" style={{"padding": "8px 14px", "fontSize": "0.80rem", "fontWeight": "800", "textTransform": "uppercase"}}>
            Install
          </button>
          <button type="button" data-onclick="dismissPwaLandingBanner()" style={{"background": "none", "border": "none", "color": "var(--text-muted)", "cursor": "pointer", "fontSize": "1.2rem", "padding": "4px"}}>
            ✕
          </button>
        </div>
      </div>
      {/* DIGITAL 2022 FIFS WAIVER & LIABILITY MODAL */}
      <div id="fifsWaiverModal">
        <div style={{"background": "#090e15", "border": "1.5px solid #00e5ff", "borderRadius": "16px", "maxWidth": "760px", "width": "100%", "maxHeight": "90vh", "overflowY": "auto", "padding": "24px", "boxShadow": "0 0 50px rgba(0, 229, 255, 0.25)"}}>
          <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "borderBottom": "1px solid rgba(0, 229, 255, 0.25)", "paddingBottom": "14px", "marginBottom": "18px"}}>
            <div>
              <span style={{"fontFamily": "var(--font-display)", "fontSize": "0.75rem", "color": "#00e5ff", "fontWeight": "800", "letterSpacing": "2px"}}>
                FUTURE INITIATIVE FIREARM SERVICES
              </span>
              <h3 style={{"margin": "4px 0 0", "color": "#fff", "fontSize": "1.35rem"}}>
                Complete & Final Safety & Liability Waiver
              </h3>
            </div>
            <button type="button" data-onclick="closeFifsWaiverModal()" style={{"background": "rgba(255, 255, 255, 0.08)", "border": "1px solid var(--border-subtle)", "color": "#fff", "width": "34px", "height": "34px", "borderRadius": "50%", "cursor": "pointer", "fontSize": "1.1rem"}}>
              ✕
            </button>
          </div>
          <form id="fifsDigitalWaiverForm" data-onsubmit="handleWaiverSubmission(event)">
            <div style={{"background": "rgba(0, 229, 255, 0.04)", "border": "1px solid rgba(0, 229, 255, 0.2)", "borderRadius": "10px", "padding": "16px", "marginBottom": "16px", "fontSize": "0.88rem", "lineHeight": "1.6", "color": "#e2e8f0", "maxHeight": "240px", "overflowY": "scroll"}}>
              <h4 style={{"color": "#00e5ff", "marginTop": "0"}}>
                COMPLETE WAIVER AND RELEASE OF LIABILITY, AGREEMENT TO HOLD FUTURE INITIATIVE FIREARM SERVICES HARMLESS AND ASSUMPTION OF RISK
              </h4>
              <p>
                <strong>
                  * * * READ CAREFULLY * * *
                </strong>
              </p>
              <p>
                I certify that I am aware that there are significant dangers and risks associated with the use of a firearm and participating in activities at a gun range and/or a class of this type. I am a United States Citizen or a LEGAL Resident Alien (with a green card) and am NOT prohibited from possessing firearms. 
                <em>
                  REQUIRED to partake in training.
                </em>
              </p>
              <p>
                I will familiarize myself with all the rules of the range. I agree to at all times conduct myself in a safe manner and promptly respond to all instructor directions. Any firearms or ammunition brought by myself shall be transported safely and compliant with all State, Federal, and local laws. I personally assume all risks in connection with Future Initiative Firearm Services, whether foreseen or unforeseen, and release and hold harmless Future Initiative Firearm Services, its instructors, officers, directors, and training range partners from any harm, death, or damages.
              </p>
              <h4 style={{"color": "#00e5ff", "marginTop": "14px"}}>
                MANDATORY TRAINING RULES
              </h4>
              <ul>
                <li>
                  Treat all firearms as if they are loaded.
                </li>
                <li>
                  ALWAYS keep firearms pointed in a safe direction and away from any persons.
                </li>
                <li>
                  ALWAYS keep your finger straight and outside the trigger guard until on target and commanded to shoot.
                </li>
                <li>
                  Be sure of your target and its foreground and background.
                </li>
                <li>
                  The STUDENT is responsible for notifying an instructor IMMEDIATELY if any unsafe condition is observed.
                </li>
                <li>
                  Keep handguns in the holster or secure case at all times unless on firing line under command.
                </li>
                <li>
                  The STUDENT is responsible for EVERY round they fire.
                </li>
              </ul>
              <h4 style={{"color": "#ff6b6b", "marginTop": "14px"}}>
                STRICTLY PROHIBITED
              </h4>
              <ul>
                <li>
                  Shooting anywhere except downrange at approved backstop.
                </li>
                <li>
                  Consumption of alcohol or drugs before or during live fire activities.
                </li>
                <li>
                  Fully automatic firearms, slide fire stocks, or armor piercing/tracer ammunition.
                </li>
                <li>
                  Bringing live ammunition into a classroom environment (range only).
                </li>
              </ul>
              <p>
                <strong>
                  CANCELLATION & DEPOSIT POLICY:
                </strong>
                 All reservations require a 30% non-refundable deposit. Tuition balance is due upon class start. In accordance with FIFS policy, no refunds are issued; reschedules are honored with advance notice.
              </p>
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "12px", "marginBottom": "12px"}}>
              <div className="form-group">
                <label style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Student Full Legal Name 
                  <span style={{"color": "#ef4444"}}>
                    *
                  </span>
                </label>
                <input type="text" id="waiverStudentName" required style={{"width": "100%", "padding": "10px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "borderRadius": "8px"}} />
              </div>
              <div className="form-group">
                <label style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Student Phone Number 
                  <span style={{"color": "#ef4444"}}>
                    *
                  </span>
                </label>
                <input type="tel" id="waiverStudentPhone" required style={{"width": "100%", "padding": "10px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "borderRadius": "8px"}} />
              </div>
            </div>
            <div className="form-group" style={{"marginBottom": "12px"}}>
              <label style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                Student Email Address 
                <span style={{"color": "#ef4444"}}>
                  *
                </span>
              </label>
              <input type="email" id="waiverStudentEmail" required style={{"width": "100%", "padding": "10px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "borderRadius": "8px"}} />
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr 1fr", "gap": "10px", "marginBottom": "14px"}}>
              <div className="form-group">
                <label style={{"fontSize": "0.80rem", "color": "var(--text-muted)"}}>
                  Emergency Contact Name 
                  <span style={{"color": "#ef4444"}}>
                    *
                  </span>
                </label>
                <input type="text" id="waiverEmergencyName" required style={{"width": "100%", "padding": "9px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "borderRadius": "8px"}} />
              </div>
              <div className="form-group">
                <label style={{"fontSize": "0.80rem", "color": "var(--text-muted)"}}>
                  Relationship 
                  <span style={{"color": "#ef4444"}}>
                    *
                  </span>
                </label>
                <input type="text" id="waiverEmergencyRel" required placeholder="Spouse / Parent / Sibling" style={{"width": "100%", "padding": "9px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "borderRadius": "8px"}} />
              </div>
              <div className="form-group">
                <label style={{"fontSize": "0.80rem", "color": "var(--text-muted)"}}>
                  Emergency Phone 
                  <span style={{"color": "#ef4444"}}>
                    *
                  </span>
                </label>
                <input type="tel" id="waiverEmergencyPhone" required style={{"width": "100%", "padding": "9px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "borderRadius": "8px"}} />
              </div>
            </div>
            <div style={{"background": "rgba(255, 255, 255, 0.03)", "border": "1px solid var(--border-subtle)", "borderRadius": "8px", "padding": "12px", "marginBottom": "14px"}}>
              <div style={{"display": "flex", "alignItems": "center", "gap": "10px", "marginBottom": "8px"}}>
                <input type="checkbox" id="waiverLegalSworn" required style={{"width": "18px", "height": "18px", "accentColor": "#00e5ff"}}  defaultChecked={false} />
                <label htmlFor="waiverLegalSworn" style={{"fontSize": "0.82rem", "color": "#fff", "cursor": "pointer"}}>
                  
            I swear I am legally allowed to possess firearms and have no felony convictions or disqualifying offenses.
          
                </label>
              </div>
              <div style={{"display": "flex", "alignItems": "center", "gap": "10px"}}>
                <input type="checkbox" id="waiverRulesSworn" required style={{"width": "18px", "height": "18px", "accentColor": "#00e5ff"}}  defaultChecked={false} />
                <label htmlFor="waiverRulesSworn" style={{"fontSize": "0.82rem", "color": "#fff", "cursor": "pointer"}}>
                  
            I have read, fully understand, and agree to adhere strictly to all 16 Training Rules & Cindy's Range Safety commands.
          
                </label>
              </div>
            </div>
            <div style={{"display": "grid", "gridTemplateColumns": "1fr 2fr", "gap": "12px", "marginBottom": "16px"}}>
              <div className="form-group">
                <label style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Initials 
                  <span style={{"color": "#ef4444"}}>
                    *
                  </span>
                </label>
                <input type="text" id="waiverInitials" maxLength={4} placeholder="e.g. KW" required style={{"width": "100%", "padding": "10px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "borderRadius": "8px", "textTransform": "uppercase", "fontWeight": "800", "textAlign": "center"}} />
              </div>
              <div className="form-group">
                <label style={{"fontSize": "0.82rem", "color": "var(--text-muted)"}}>
                  Digital Signature (Full Legal Name) 
                  <span style={{"color": "#ef4444"}}>
                    *
                  </span>
                </label>
                <input type="text" id="waiverSignature" placeholder="Type your full legal name as digital signature" required style={{"width": "100%", "padding": "10px", "background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#00e5ff", "borderRadius": "8px", "fontFamily": "cursive, sans-serif", "fontSize": "1.1rem"}} />
              </div>
            </div>
            <div style={{"display": "flex", "gap": "12px", "justifyContent": "flex-end"}}>
              <button type="button" data-onclick="closeFifsWaiverModal()" style={{"background": "rgba(255, 255, 255, 0.08)", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px 18px", "borderRadius": "8px", "cursor": "pointer"}}>
                Cancel
              </button>
              <button type="submit" id="btnSubmitWaiver" className="btn-spark" style={{"padding": "10px 22px", "fontSize": "0.92rem", "fontWeight": "800", "textTransform": "uppercase"}}>
                <span>
                  ✍️
                </span>
                <span>
                  Certify & Submit Waiver
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* STICKY BOTTOM DOCK (Visible on all pages except landing/home) */}
      <div id="sticky-bottom-dock" className="sticky-bottom-dock">
        <button aria-label="Go back to previous view" className="btn-return-home" data-onclick="navigateBack()" style={{"background": "rgba(16, 22, 31, 0.95)", "border": "2px solid var(--border-subtle)", "color": "#00f0ff", "minHeight": "42px", "padding": "8px 16px", "fontSize": "0.90rem"}} type="button">
          
    ← BACK
  
        </button>
        <button type="button" aria-label="Refresh and sync application data" className="btn-return-home btn-universal-refresh" data-onclick="window.triggerTopNavGunReload(event)" style={{"background": "rgba(16, 22, 31, 0.95)", "border": "2px solid var(--accent-cyan)", "color": "#00f0ff", "minHeight": "42px", "padding": "8px 16px", "fontSize": "0.90rem"}}>
          <span className="refresh-ui-text">
            🔄 REFRESH
          </span>
        </button>
        <button aria-label="Return to landing screen" className="btn-return-home" data-onclick="returnToHome()" style={{"minHeight": "42px", "padding": "8px 18px", "fontSize": "0.90rem"}} type="button">
          
    🏠 HOME
  
        </button>
      </div>
      {/* ================= P2P ENCRYPTED COMMS HUD MODAL ================= */}
      <div id="fifsP2pCommsModal" className="goal-modal-overlay" style={{"display": "none", "zIndex": "100000", "padding": "0"}} data-onclick="if(event.target===this) closeP2pCommsHud()">
        <div className="goal-modal-box" style={{"maxWidth": "1200px", "width": "95vw", "height": "88vh", "padding": "0", "overflow": "hidden", "border": "1.5px solid var(--accent-cyan)", "borderRadius": "14px", "background": "#070b10", "boxShadow": "0 25px 60px rgba(0,0,0,0.98), 0 0 35px rgba(0,229,255,0.25)", "position": "relative", "display": "flex", "flexDirection": "column"}} data-onclick="event.stopPropagation()">
          <button type="button" data-onclick="closeP2pCommsHud()" style={{"position": "absolute", "top": "12px", "right": "16px", "zIndex": "100", "background": "rgba(0,0,0,0.6)", "border": "1px solid rgba(244,208,63,0.3)", "color": "#EDEDED", "borderRadius": "6px", "padding": "4px 12px", "fontFamily": "'JetBrains Mono', monospace", "fontSize": "0.85rem", "cursor": "pointer"}}>
            ✕ CLOSE HUD
          </button>
          <div className="hud-scanlines">
          </div>
          <div className="app-shell">
            <div className="sidebar-overlay" id="sidebarOverlay" data-onclick="toggleMobileSidebar()">
            </div>
            {/* SIDEBAR / ROSTER */}
            <aside className="sidebar" id="sidebar">
              <div className="sidebar-header">
                <div className="brand-title">
                  <span className="brand-badge">
                  </span>
                  <span>
                    FIFS COMMS HUD
                  </span>
                </div>
                <span className="sidebar-status-tag">
                  SEC-NET v2.4
                </span>
              </div>
              <div className="sidebar-search">
                <div className="search-input-wrapper">
                  <svg className="search-icon" viewBox="0 0 24 24">
                    <path d="M9.5 3a6.5 6.5 0 0 1 5.25 10.33l4.96 4.96a1 1 0 0 1-1.42 1.42l-4.96-4.96A6.5 6.5 0 1 1 9.5 3zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z" />
                  </svg>
                  <input type="text" className="search-input" id="contactSearchInput" placeholder="SEARCH OPERATIVES / LEADS..." data-oninput="filterContacts()" />
                </div>
              </div>
              <div className="contact-roster" id="contactRosterContainer">
                {/* Contacts populated dynamically */}
              </div>
            </aside>
            {/* MAIN CHAT WINDOW */}
            <main className="main-terminal">
              {/* Chat Header */}
              <header className="chat-header">
                <div className="header-left">
                  <button className="mobile-menu-btn" data-onclick="toggleMobileSidebar()" aria-label="Open Operatives Menu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                    </svg>
                  </button>
                  <div className="header-contact-meta">
                    <h2>
                      <span id="activeContactName">
                        <span style={{"letterSpacing": "2px", "color": "#ffb703"}}>
                          ████████
                        </span>
                        <span style={{"fontSize": "0.82rem", "color": "#cbd5e1"}}>
                          [REDACTED OPERATIVE]
                        </span>
                      </span>
                      <span className="verified-chip" id="activeVerificationStatus">
                        SEC-STATUS: DIRECT
                      </span>
                    </h2>
                    <div className="header-subline">
                      <span id="activeContactRole" style={{"display": "inline-flex", "alignItems": "center", "gap": "7px", "color": "#ffb703", "fontWeight": "700", "letterSpacing": "0.5px"}}>
                        <span className="p2p-yellow-beacon" style={{"display": "inline-block", "width": "8px", "height": "8px", "borderRadius": "50%", "background": "#ffb703", "animation": "p2pYellowPulse 1.1s infinite ease-in-out"}}>
                        </span>
                        <span>
                          STATUS PENDING
                        </span>
                      </span>
                      <span>
                        •
                      </span>
                      <span id="activeContactChannel" style={{"color": "var(--brand-primary)"}}>
                        CHAN: P2P-ENC-443
                      </span>
                    </div>
                  </div>
                </div>
                <div className="telemetry-cluster">
                  <div className="telemetry-pill secure">
                    <span className="telemetry-dot">
                    </span>
                    <span>
                      256-BIT QUANTUM HUD
                    </span>
                  </div>
                  <div className="telemetry-pill">
                    <span>
                      LATENCY: 14MS
                    </span>
                  </div>
                </div>
                <div className="header-actions">
                  <button className="btn-header-action" data-onclick="exportChatSession()" title="Export Session Briefing">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    <span>
                      EXPORT
                    </span>
                  </button>
                  <button className="btn-header-action" data-onclick="clearChatStream()" title="Purge Terminal Session">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                    <span>
                      PURGE
                    </span>
                  </button>
                </div>
              </header>
              {/* Message Stream */}
              <section className="chat-stream" id="chatStream">
                <div className="system-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                  </svg>
                  <span>
                    P2P ENCRYPTED CHANNEL ESTABLISHED • ZERO PERSISTENT TRACE
                  </span>
                </div>
                {/* Incoming Sample */}
                <div className="message-row incoming">
                  <div className="message-header">
                    <span className="message-sender">
                      Tanae’ Wade [STUDENT]
                    </span>
                    <span className="message-timestamp">
                      19:42 EST
                    </span>
                  </div>
                  <div className="message-bubble">
                    
            Good evening Instructor Wade. I have completed the MD wear & carry classroom modules and acquired eye and ear protection for Cindy's Hot Shots range qualification. Are my documents synchronized?
            
                    <div className="bubble-meta-tag">
                      <span>
                        ORIGIN: MOBILE-CLIENT
                      </span>
                      <span>
                        SHA-256: 7F9A...B31C
                      </span>
                    </div>
                  </div>
                </div>
                {/* System Sample */}
                <div className="system-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                  </svg>
                  <span>
                    HANDGUN TRAINING DOCUMENTATION VERIFIED BY CHIEF INSTRUCTOR
                  </span>
                </div>
                {/* Outgoing Sample */}
                <div className="message-row outgoing">
                  <div className="message-header">
                    <span className="message-sender">
                      Instructor Kai Wade [CHIEF CMD]
                    </span>
                    <span className="message-timestamp">
                      19:45 EST
                    </span>
                  </div>
                  <div className="message-bubble">
                    
            Copy that. Your training packet and live range slot are locked for Sunday at 0900. Bring 50 rounds of factory-sealed 9mm and your government ID. Telemetry is verified in the master ledger.
            
                    <div className="bubble-meta-tag">
                      <span>
                        DISPATCH: SECURE HUD
                      </span>
                      <span style={{"color": "var(--brand-primary)"}}>
                        DELIVERED ✓
                      </span>
                    </div>
                  </div>
                </div>
              </section>
              {/* Input Console */}
              <footer className="input-console-wrapper">
                <div className="input-console-card">
                  <div className="input-row">
                    <div className="textarea-container">
                      <textarea className="chat-textarea" id="messageInput" rows={1} placeholder="ENTER TACTICAL TRANSMISSION (ENTER TO TRANSMIT, SHIFT+ENTER FOR NEWLINE)..." data-onkeydown="handleInputKey(event)" data-oninput="autoResizeInput(this)">
                      </textarea>
                    </div>
                    <div className="action-button-cluster">
                      <button className="btn-secondary-action" data-onclick="triggerSecureAction()" title="Attach Verification / Encrypt Token">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                        <span className="action-label">
                          ENCRYPT
                        </span>
                      </button>
                      <button className="btn-primary-send" data-onclick="submitCurrentMessage()" id="sendMsgBtn">
                        <span>
                          TRANSMIT
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="input-subline">
                    <span>
                      SECURITY LEVEL: ORANGE / AUTHORIZED INSTRUCTOR LINK
                    </span>
                    <span>
                      PRESS [ENTER] TO SEND
                    </span>
                  </div>
                </div>
              </footer>
            </main>
          </div>
        </div>
      </div>
      {/* ================= END P2P ENCRYPTED COMMS HUD ================= */}








      </div>
    
      {/* ================= MANDATORY FORCED PASSWORD RESET MODAL ================= */}
      <div id="forcedPasswordResetModal" style={{"display": "none", "position": "fixed", "top": "0", "left": "0", "width": "100vw", "height": "100vh", "backgroundColor": "rgba(7, 11, 16, 0.94)", "backdropFilter": "blur(8px)", "zIndex": 999999, "alignItems": "center", "justifyContent": "center", "padding": "20px"}}>
        <div style={{"background": "#0d131b", "border": "2px solid var(--accent-amber)", "borderRadius": "16px", "padding": "32px", "maxWidth": "480px", "width": "100%", "boxShadow": "0 0 35px rgba(255, 183, 3, 0.25)", "textAlign": "left", "color": "#fff"}}>
          <div style={{"display": "flex", "alignItems": "center", "gap": "12px", "marginBottom": "16px"}}>
            <span style={{"fontSize": "1.8rem"}}>🔐</span>
            <div>
              <h3 style={{"fontFamily": "var(--font-display)", "fontSize": "1.3rem", "margin": "0", "color": "#fff"}}>Action Required: Set New Password</h3>
              <p style={{"fontSize": "0.82rem", "color": "var(--accent-amber)", "margin": "4px 0 0", "fontWeight": "600"}}>You signed in with a temporary password</p>
            </div>
          </div>
          <p style={{"fontSize": "0.88rem", "color": "#94a3b8", "lineHeight": "1.5", "marginBottom": "20px"}}>
            For security, temporary credentials expire and must be replaced immediately. Please create a permanent password to access your student portal.
          </p>
          <form id="forcedPasswordResetForm" onSubmit={(e) => {
            e.preventDefault();
            const sid = (document.getElementById('resetStudentIdHidden') as HTMLInputElement)?.value;
            const np = (document.getElementById('forcedNewPassword') as HTMLInputElement)?.value;
            const cp = (document.getElementById('forcedConfirmPassword') as HTMLInputElement)?.value;
            const err = document.getElementById('forcedPasswordError');
            if (np !== cp) {
              if (err) { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; }
              return;
            }
            if (typeof window !== 'undefined' && (window as any).callFifsBackend) {
              (window as any).callFifsBackend('firstLoginPasswordChange', { studentId: sid, newPassword: np })
                .then((res: any) => {
                  if (res && res.success) {
                    const m = document.getElementById('forcedPasswordResetModal');
                    if (m) m.style.display = 'none';
                    if (typeof window !== 'undefined' && (window as any).showNotification) {
                      (window as any).showNotification('Password updated successfully! Welcome to your portal.', 'success');
                    }
                  } else if (err) {
                    err.textContent = res?.error || 'Password update failed.';
                    err.style.display = 'block';
                  }
                })
                .catch((callErr: any) => {
                  if (err) {
                    err.textContent = callErr?.message || 'Password update failed.';
                    err.style.display = 'block';
                  }
                });
            }
          }}>
            <input type="hidden" id="resetStudentIdHidden" />
            <div style={{"marginBottom": "14px"}}>
              <label style={{"display": "block", "fontSize": "0.82rem", "fontWeight": "700", "color": "#cbd5e1", "marginBottom": "6px"}}>
                New Password (Min. 12 characters, mix of cases, numbers, symbols)
              </label>
              <input type="password" id="forcedNewPassword" required style={{"width": "100%", "padding": "12px", "background": "#070b10", "border": "1px solid var(--accent-cyan)", "borderRadius": "8px", "color": "#fff", "fontSize": "0.95rem"}} />
            </div>
            <div style={{"marginBottom": "18px"}}>
              <label style={{"display": "block", "fontSize": "0.82rem", "fontWeight": "700", "color": "#cbd5e1", "marginBottom": "6px"}}>
                Confirm New Password
              </label>
              <input type="password" id="forcedConfirmPassword" required style={{"width": "100%", "padding": "12px", "background": "#070b10", "border": "1px solid var(--accent-cyan)", "borderRadius": "8px", "color": "#fff", "fontSize": "0.95rem"}} />
            </div>
            <div id="forcedPasswordError" style={{"display": "none", "color": "#ef4444", "fontSize": "0.82rem", "marginBottom": "14px", "fontWeight": "600"}}></div>
            <button type="submit" style={{"width": "100%", "padding": "13px", "background": "linear-gradient(135deg, #ffb703 0%, #d49000 100%)", "color": "#070b10", "border": "none", "borderRadius": "8px", "fontWeight": "800", "fontFamily": "var(--font-display)", "fontSize": "1rem", "cursor": "pointer", "textTransform": "uppercase"}}>
              Save Permanent Password &amp; Enter Portal →
            </button>
          </form>
        </div>
      </div>








      {/* State Detail Comparison Modal */}
      <div id="stateDetailModal" className="modal-backdrop" style={{"display": "none", "position": "fixed", "inset": 0, "backgroundColor": "rgba(3, 7, 18, 0.88)", "backdropFilter": "blur(6px)", "zIndex": 99999, "alignItems": "center", "justifyContent": "center", "padding": "16px"}}>
        <div style={{"background": "#0b1320", "border": "1px solid rgba(0, 229, 255, 0.4)", "borderRadius": "16px", "width": "100%", "maxWidth": "640px", "maxHeight": "90vh", "overflowY": "auto", "padding": "24px", "position": "relative", "boxShadow": "0 20px 50px rgba(0,0,0,0.9)"}}>
          <button type="button" data-onclick="closeStateModal()" style={{"position": "absolute", "top": "16px", "right": "16px", "background": "rgba(255,255,255,0.1)", "border": "none", "color": "#fff", "borderRadius": "50%", "width": "36px", "height": "36px", "cursor": "pointer", "fontSize": "1.2rem", "display": "flex", "alignItems": "center", "justifyContent": "center"}}>✕</button>
          <div id="stateModalContent">
            <div style={{"display": "flex", "alignItems": "center", "gap": "12px", "marginBottom": "16px"}}>
              <span id="modalStateCodeBadge" style={{"background": "var(--accent-cyan)", "color": "#000", "fontWeight": "900", "fontSize": "1.2rem", "padding": "4px 12px", "borderRadius": "8px"}}>MD</span>
              <div>
                <h3 id="modalStateTitle" style={{"margin": 0, "color": "#fff", "fontSize": "1.4rem"}}>State Details</h3>
                <span id="modalStateCategory" style={{"fontSize": "0.85rem", "color": "#38bdf8", "fontWeight": "600"}}>Reciprocity Status</span>
              </div>
            </div>
            <div id="modalStateComparisonBody" style={{"color": "#cbd5e1", "lineHeight": "1.6", "fontSize": "0.95rem"}}></div>
          </div>
        </div>
      </div>
      
      {/* ================= MODAL: CHANGE ACCOUNT PASSWORD (STUDENT & CLIENT) ================= */}
      {/* ================= PROMISE DETAIL POPUP MODAL ================= */}
      <div className="goal-modal-overlay" id="promiseDetailModal" data-onclick="if(event.target===this) closePromiseDetailModal()" style={{"display": "none", "position": "fixed", "inset": "0", "width": "100%", "height": "100%", "background": "rgba(4, 7, 11, 0.96)", "backdropFilter": "blur(16px)", "WebkitBackdropFilter": "blur(16px)", "zIndex": "999999", "alignItems": "center", "justifyContent": "center", "overflowY": "auto", "padding": "20px"}}>
        <div aria-labelledby="promiseModalTitle" aria-modal="true" className="goal-modal-box" data-onclick="event.stopPropagation()" role="dialog" style={{"maxWidth": "620px", "margin": "auto"}}>
          <button aria-label="Close promise details" className="goal-modal-close-btn" data-onclick="closePromiseDetailModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closePromiseDetailModal) (window as any).closePromiseDetailModal(); }} type="button">
            ✕
          </button>
          <div>
            <span className="goal-header-badge" id="promiseModalBadge" style={{"background": "rgba(0, 229, 255, 0.12)", "border": "1px solid var(--accent-cyan)", "color": "var(--accent-cyan)", "fontSize": "0.75rem", "fontWeight": "800", "padding": "4px 10px", "borderRadius": "4px", "letterSpacing": "0.08em", "textTransform": "uppercase"}}>
              FIFS Uncompromising Excellence Guarantee
            </span>
          </div>
          <h3 className="goal-modal-title" id="promiseModalTitle" style={{"display": "flex", "alignItems": "center", "gap": "10px", "color": "#fff", "fontSize": "1.65rem", "margin": "8px 0 4px", "fontFamily": "var(--font-display)"}}>
            <span id="promiseModalIcon">🎯</span>
            <span id="promiseModalHeading">Zero-Intimidation Mentorship</span>
          </h3>
          <div className="goal-modal-rec" id="promiseModalSubtitle" style={{"color": "var(--accent-cyan)", "fontSize": "0.92rem", "fontWeight": "700", "marginBottom": "12px"}}>
            Patient, Dignified, High-Standard Instruction
          </div>
          <div className="goal-synopsis-card" id="promiseModalSynopsis" style={{"marginBottom": "16px", "background": "rgba(13, 18, 26, 0.8)", "border": "1px solid var(--border-subtle)", "borderRadius": "10px", "padding": "14px 16px", "color": "#cbd5e1", "fontSize": "0.88rem", "lineHeight": "1.6"}}>
            Detailed synopsis
          </div>
          <div id="promiseModalSectionsGrid" style={{"display": "flex", "flexDirection": "column", "gap": "12px", "marginBottom": "20px"}}>
            {/* Populated dynamically */}
          </div>
          <div className="goal-modal-actions" style={{"display": "flex", "gap": "10px", "width": "100%", "marginTop": "16px"}}>
            <button className="btn-secondary" data-onclick="closePromiseDetailModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closePromiseDetailModal) (window as any).closePromiseDetailModal(); }} style={{"flex": "1", "padding": "12px 18px", "fontSize": "0.88rem"}} type="button">
              Close
            </button>
            <button className="btn-primary" data-onclick="closePromiseDetailModal(); openAndSwitch('booking');" onClick={() => { if (typeof window !== 'undefined') { (window as any).closePromiseDetailModal?.(); (window as any).openAndSwitch?.('booking'); } }} style={{"flex": "2", "padding": "12px 20px", "fontSize": "0.92rem", "fontWeight": "800"}} type="button">
              Reserve Your Training Seat 🎯
            </button>
          </div>
        </div>
      </div>




      {/* ================= MODAL: CHANGE ACCOUNT PASSWORD (STUDENT & CLIENT) ================= */}
      <div id="changePasswordModal" data-onclick="if(event.target===this) closeChangePasswordModal()" style={{"position": "fixed", "inset": "0", "width": "100%", "height": "100%", "background": "rgba(4, 7, 11, 0.96)", "backdropFilter": "blur(16px)", "WebkitBackdropFilter": "blur(16px)", "zIndex": "9999999", "display": "none", "alignItems": "center", "justifyContent": "center", "overflowY": "auto", "padding": "20px"}}>
        <div className="goal-modal-box" style={{"maxWidth": "480px", "width": "100%", "background": "#0b1017", "border": "1.5px solid var(--accent-cyan)", "borderRadius": "14px", "padding": "26px", "boxShadow": "0 0 35px rgba(0, 229, 255, 0.25)", "margin": "auto", "position": "relative"}}>
          <div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "16px", "borderBottom": "1px solid var(--border-subtle)", "paddingBottom": "12px"}}>
            <div>
              <span className="badge-instructor" id="changePasswordRoleBadge" style={{"marginBottom": "4px", "fontSize": "0.72rem", "background": "rgba(0, 229, 255, 0.12)", "color": "var(--accent-cyan)", "border": "1px solid var(--accent-cyan)", "padding": "3px 8px", "borderRadius": "4px", "textTransform": "uppercase", "fontWeight": "800"}}>
                Security &amp; Account Protection
              </span>
              <h3 style={{"color": "#fff", "fontFamily": "var(--font-display)", "fontSize": "1.45rem", "margin": "6px 0 0", "textTransform": "uppercase", "letterSpacing": "1px"}}>
                🔑 Change Account Password
              </h3>
            </div>
            <button className="btn-return-home" data-onclick="closeChangePasswordModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closeChangePasswordModal) (window as any).closeChangePasswordModal(); }} style={{"background": "none", "border": "none", "color": "var(--text-muted)", "fontSize": "1.4rem", "cursor": "pointer", "padding": "4px 8px"}} type="button">
              ✕
            </button>
          </div>
          <form id="changePasswordForm" data-onsubmit="submitChangePassword(event)" onSubmit={(e) => { e.preventDefault(); if (typeof window !== 'undefined' && (window as any).submitChangePassword) (window as any).submitChangePassword(e); }}>
            <div className="form-group" style={{"marginBottom": "14px"}}>
              <label htmlFor="cpUserEmail" style={{"color": "#cbd5e1", "fontSize": "0.85rem", "fontWeight": "600", "display": "block", "marginBottom": "6px"}}>
                Account Email Address <span className="req">*</span>
              </label>
              <input id="cpUserEmail" placeholder="Enter the email address for your account" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px 12px", "borderRadius": "6px", "width": "100%", "fontSize": "0.88rem"}} type="text" />
            </div>
            <div className="form-group" style={{"marginBottom": "14px"}}>
              <label htmlFor="cpCurrentPassword" style={{"color": "#cbd5e1", "fontSize": "0.85rem", "fontWeight": "600", "display": "block", "marginBottom": "6px"}}>
                Current Password <span style={{"color": "var(--text-muted)", "fontSize": "0.78rem"}}>(Optional if first-time setup)</span>
              </label>
              <input id="cpCurrentPassword" placeholder="Enter existing password" style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px 12px", "borderRadius": "6px", "width": "100%", "fontSize": "0.88rem"}} type="password" />
            </div>
            <div className="form-group" style={{"marginBottom": "14px"}}>
              <label htmlFor="cpNewPassword" style={{"color": "#cbd5e1", "fontSize": "0.85rem", "fontWeight": "600", "display": "block", "marginBottom": "6px"}}>
                New Password <span className="req">*</span>
              </label>
              <input id="cpNewPassword" placeholder="Min 12 chars (Uppercase, lowercase, number & symbol)" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px 12px", "borderRadius": "6px", "width": "100%", "fontSize": "0.88rem"}} type="password" />
              <span style={{"color": "var(--text-muted)", "fontSize": "0.72rem", "marginTop": "4px", "display": "block"}}>
                Requirements: 12+ characters, 1 uppercase, 1 lowercase, 1 number, 1 special character.
              </span>
            </div>
            <div className="form-group" style={{"marginBottom": "18px"}}>
              <label htmlFor="cpConfirmPassword" style={{"color": "#cbd5e1", "fontSize": "0.85rem", "fontWeight": "600", "display": "block", "marginBottom": "6px"}}>
                Confirm New Password <span className="req">*</span>
              </label>
              <input id="cpConfirmPassword" placeholder="Re-type new password" required style={{"background": "#070b10", "border": "1px solid var(--border-subtle)", "color": "#fff", "padding": "10px 12px", "borderRadius": "6px", "width": "100%", "fontSize": "0.88rem"}} type="password" />
            </div>
            <div id="changePasswordStatus" style={{"display": "none", "padding": "10px", "borderRadius": "6px", "marginBottom": "14px", "fontSize": "0.84rem"}}></div>
            <div style={{"display": "flex", "gap": "10px", "justifyContent": "flex-end"}}>
              <button className="btn-secondary" data-onclick="closeChangePasswordModal()" onClick={() => { if (typeof window !== 'undefined' && (window as any).closeChangePasswordModal) (window as any).closeChangePasswordModal(); }} style={{"padding": "10px 18px", "fontSize": "0.88rem"}} type="button">
                Cancel
              </button>
              <button className="btn-primary" id="btnSubmitChangePassword" style={{"padding": "10px 22px", "fontSize": "0.88rem", "fontWeight": "800"}} type="submit">
                Update Password 🔒
              </button>
            </div>
          </form>
        </div>
      </div>




    </div>
  );
}