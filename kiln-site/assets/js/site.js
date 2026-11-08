// Form handling. On Netlify, forms marked data-netlify="true" are collected
// automatically; this script submits them in the background and shows a
// confirmation instead of leaving the page.
document.querySelectorAll("form[data-netlify]").forEach((form) => {
  const status = form.querySelector(".form-status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const show = (msg) => { if (status) { status.textContent = msg; status.hidden = false; } };
    try {
      const body = new URLSearchParams(new FormData(form)).toString();
      const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      if (res.status === 404 || res.status === 405) { show("This is a preview. The form will send to your inbox once the site is live on Netlify."); return; }
      if (!res.ok) throw new Error(res.status);
      form.reset();
      show(form.name === "enquiry"
        ? "Thanks, your enquiry has been sent. I'll reply within two working days."
        : "You're on the list. Thank you.");
    } catch (err) {
      show("That didn't send. Please try again, or email me directly.");
    }
  });
});

// ---------- Listen player ----------
(() => {
  const tracks = [...document.querySelectorAll(".track")];
  if (!tracks.length) return;
  const ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z"/></svg>';
  const fmt = (s) => !isFinite(s) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  let current = null;

  tracks.forEach((li) => {
    const title = li.querySelector(".t-meta b")?.textContent || "track";
    const src = li.dataset.src, before = li.dataset.before, link = li.dataset.link;
    const role = li.querySelector(":scope > .t-role");
    if (role) li.querySelector(".t-meta").append(role);

    const play = document.createElement("button");
    play.className = "t-play"; play.type = "button"; play.innerHTML = ICON_PLAY;
    play.setAttribute("aria-label", `Play ${title}`);
    const bar = document.createElement("div"); bar.className = "t-bar";
    li.append(play, bar);

    if (link) {
      const a = document.createElement("a");
      a.className = "t-link"; a.href = link; a.target = "_blank"; a.rel = "noopener";
      a.textContent = "Full song ↗"; li.append(a);
    }
    if (!src) {
      play.disabled = true; play.setAttribute("aria-label", `${title}: clip coming soon`);
      bar.innerHTML = '<span class="t-soon">Clip coming soon</span>';
      return;
    }

    const seek = document.createElement("input");
    seek.type = "range"; seek.className = "t-seek"; seek.min = 0; seek.max = 1000; seek.value = 0;
    seek.setAttribute("aria-label", `Position in ${title}`);
    const time = document.createElement("span"); time.className = "t-time"; time.textContent = "0:00";
    bar.append(seek, time);

    // The finished clip always drives timing; the rough mix (if any) runs alongside, muted.
    const final = new Audio(); final.preload = "metadata"; final.src = src;
    const rough = before ? Object.assign(new Audio(), { preload: "auto", src: before, muted: true }) : null;
    let showBefore = false;

    if (rough) {
      const ab = document.createElement("div"); ab.className = "t-ab"; ab.setAttribute("role", "group");
      ab.setAttribute("aria-label", "Compare versions");
      ab.innerHTML = '<button type="button" aria-pressed="false" data-v="before">Rough mix</button><button type="button" aria-pressed="true" data-v="after">Final</button>';
      ab.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        showBefore = b.dataset.v === "before";
        ab.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        if (Math.abs(rough.currentTime - final.currentTime) > 0.04) rough.currentTime = final.currentTime;
        rough.muted = !showBefore; final.muted = showBefore;
      });
      li.append(ab);
    }

    const all = rough ? [final, rough] : [final];
    const setUI = (on) => {
      li.classList.toggle("is-playing", on);
      play.innerHTML = on ? ICON_PAUSE : ICON_PLAY;
      play.setAttribute("aria-label", `${on ? "Pause" : "Play"} ${title}`);
    };
    const stop = () => { all.forEach((a) => a.pause()); setUI(false); };
    li._stop = stop;

    play.addEventListener("click", async () => {
      if (!final.paused) { stop(); return; }
      if (current && current !== li) current._stop();
      current = li;
      if (rough) rough.currentTime = final.currentTime;
      try { await Promise.all(all.map((a) => a.play())); setUI(true); }
      catch { stop(); time.textContent = "Can't play"; }
    });

    final.addEventListener("timeupdate", () => {
      const p = final.duration ? final.currentTime / final.duration : 0;
      seek.value = Math.round(p * 1000); seek.style.setProperty("--p", `${p * 100}%`);
      time.textContent = `${fmt(final.currentTime)} / ${fmt(final.duration)}`;
      if (rough && !rough.paused && Math.abs(rough.currentTime - final.currentTime) > 0.12) rough.currentTime = final.currentTime;
    });
    final.addEventListener("loadedmetadata", () => { time.textContent = `0:00 / ${fmt(final.duration)}`; });
    final.addEventListener("ended", () => { stop(); final.currentTime = 0; if (rough) rough.currentTime = 0; });
    seek.addEventListener("input", () => {
      if (!final.duration) return;
      const t = (seek.value / 1000) * final.duration;
      all.forEach((a) => { a.currentTime = t; });
      seek.style.setProperty("--p", `${seek.value / 10}%`);
    });
  });
})();

// ---------- Album preview (plays only when the visitor presses play) ----------
document.querySelectorAll(".preview[data-src]").forEach((box) => {
  const btn = box.querySelector(".preview-play"), fill = box.querySelector(".preview-line span");
  const line = box.querySelector(".preview-line"), time = box.querySelector(".preview-time"), label = box.querySelector(".preview-label");
  const audio = new Audio(); audio.preload = "metadata"; audio.src = box.dataset.src;
  const PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z"/></svg>';
  const fmt = (s) => !isFinite(s) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const ui = (on) => { btn.innerHTML = on ? PAUSE : PLAY; btn.setAttribute("aria-label", on ? "Pause preview" : "Play a preview"); label.textContent = on ? "Now playing" : "Play a preview"; };
  audio.addEventListener("error", () => { box.hidden = true; });
  audio.addEventListener("loadedmetadata", () => { time.textContent = fmt(audio.duration); });
  audio.addEventListener("timeupdate", () => { fill.style.width = `${(audio.currentTime / audio.duration) * 100 || 0}%`; time.textContent = fmt(audio.duration - audio.currentTime); });
  audio.addEventListener("ended", () => { ui(false); audio.currentTime = 0; });
  btn.addEventListener("click", async () => {
    if (!audio.paused) { audio.pause(); ui(false); return; }
    try { await audio.play(); ui(true); } catch { ui(false); }
  });
  line.addEventListener("click", (e) => { if (!audio.duration) return; const r = line.getBoundingClientRect(); audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration; });
});

// ---------- Testimonials slider ----------
document.querySelectorAll(".slider").forEach((slider) => {
  const track = slider.querySelector(".q-track"), slides = [...track.children];
  const dots = slider.querySelector(".q-dots");
  slides.forEach((s, i) => {
    s.setAttribute("role", "group"); s.setAttribute("aria-roledescription", "slide"); s.setAttribute("aria-label", `${i + 1} of ${slides.length}`);
    const d = document.createElement("button"); d.type = "button"; d.setAttribute("aria-label", `Show testimonial ${i + 1}`);
    d.addEventListener("click", () => go(i)); dots.append(d);
  });
  const idx = () => Math.round(track.scrollLeft / track.clientWidth);
  const go = (i) => track.scrollTo({ left: ((i + slides.length) % slides.length) * track.clientWidth });
  const mark = () => [...dots.children].forEach((d, i) => d.setAttribute("aria-current", String(i === idx())));
  slider.querySelectorAll(".q-btn").forEach((b) => b.addEventListener("click", () => go(idx() + Number(b.dataset.dir))));
  track.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(idx() + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(idx() - 1); } });
  let t; track.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(mark, 60); });
  mark();
});
