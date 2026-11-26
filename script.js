// Your details - already filled from your files
const CONFIG = {
  whatsappNumber: "2348146180433", // digits only, no + and no spaces
  whatsappMessage: "Hello, I watched the affiliate marketing training and would like to know the next steps.",
  telegramUsername: "tochukwu", // without @
  videoEmbedUrl: "", // YouTube: e.g. https://www.youtube.com/embed/VIDEO_ID - leave empty if using local file
  localVideoUrl: "assets/training.mp4" // Local file - leave empty if using YouTube
};

// --- SUPABASE SETUP - using your exact code ---
const SUPABASE_URL = "https://tegbpdthifwbefafyvsh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_F4dB6V4pThydeYReH1jotg_-P059K2e";

let supabaseClient = null;
// IMPORTANT: This check must stay as YOUR_PROJECT / YOUR_ANON_KEY.
// Do NOT change it to your real URL/key, or it will always say "Database not connected".
if (window.supabase && SUPABASE_URL && !SUPABASE_URL.includes("YOUR_PROJECT") && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("YOUR_ANON_KEY")) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.log("Supabase init failed", e);
  }
} else {
  console.log("Supabase not configured yet - fill SUPABASE_URL and SUPABASE_ANON_KEY in script.js");
}

async function trackEvent(eventType) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from("events").insert([{
      event_type: eventType,
      page_url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent
    }]);
  } catch (e) {
    console.log("Tracking failed", e);
  }
}

trackEvent("page_view");

// Display current year
document.getElementById("year").textContent = new Date().getFullYear();

// WHATSAPP LINK
const whatsappLink = document.getElementById("whatsappLink");
if (CONFIG.whatsappNumber) {
  whatsappLink.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`;
}
if (whatsappLink) whatsappLink.addEventListener("click", () => trackEvent("whatsapp_click"));

// TELEGRAM LINK
const telegramLink = document.getElementById("telegramLink");
if (CONFIG.telegramUsername) {
  telegramLink.href = `https://t.me/${CONFIG.telegramUsername}`;
}
if (telegramLink) telegramLink.addEventListener("click", () => trackEvent("telegram_click"));

// LEAD FORM - saves to Supabase leads table, then opens WhatsApp
const leadForm = document.getElementById("leadForm");
if (leadForm) {
  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("leadSubmitBtn");
    const msg = document.getElementById("leadMessage");
    const name = document.getElementById("leadName").value.trim();
    const phone = document.getElementById("leadPhone").value.trim();
    const emailEl = document.getElementById("leadEmail");
    const email = emailEl ? emailEl.value.trim() : "";

    if (!name || !phone) {
      if (msg) msg.textContent = "Please enter your name and WhatsApp number.";
      return;
    }
    if (!supabaseClient) {
      if (msg) msg.textContent = "Database not connected yet. Fill SUPABASE_URL and SUPABASE_ANON_KEY in script.js.";
      return;
    }
    if (!CONFIG.whatsappNumber) {
      if (msg) msg.textContent = "Add your WhatsApp number in CONFIG in script.js first.";
      return;
    }

    if (btn) { btn.textContent = "Saving..."; btn.disabled = true; }
    try {
      const { data, error } = await supabaseClient.from("leads").insert([{ name, phone, email: email || null, source: "landing_page", status: "new" }]).select().single();
      if (error) throw error;
      await trackEvent("lead_submit");
      if (msg) msg.textContent = "Saved! Opening WhatsApp...";
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`, "_blank");
      leadForm.reset();
    } catch (err) {
      console.log("LEAD SAVE ERROR:", err);
      if (msg) msg.textContent = "Could not save: " + (err.message || JSON.stringify(err));
    } finally {
      if (btn) { btn.textContent = "Save My Details + Chat on WhatsApp"; btn.disabled = false; }
    }
  });
}

// 24-HOUR COUNTDOWN
let remaining = 24 * 60 * 60;
function renderCountdown() {
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
  if (remaining > 0) remaining--;
}
renderCountdown();
setInterval(renderCountdown, 1000);

// VIDEO PLAYER - handles YouTube OR local mp4
const playBtn = document.getElementById("playVideo");
if (playBtn) {
  playBtn.addEventListener("click", () => {
    trackEvent("video_play");
    const frame = document.getElementById("videoFrame");
    if (CONFIG.videoEmbedUrl) {
      const iframe = document.createElement("iframe");
      iframe.src = CONFIG.videoEmbedUrl + (CONFIG.videoEmbedUrl.includes("?") ? "&" : "?") + "autoplay=1";
      iframe.title = "Affiliate marketing training";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);
      return;
    }
    if (CONFIG.localVideoUrl) {
      const video = document.createElement("video");
      video.src = encodeURI(CONFIG.localVideoUrl);
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = "100%";
      video.style.aspectRatio = "16/9";
      video.style.display = "block";
      frame.replaceChildren(video);
      return;
    }
    alert("Add your video in script.js - either CONFIG.videoEmbedUrl for YouTube, or CONFIG.localVideoUrl for a local mp4 file.");
  });
}
