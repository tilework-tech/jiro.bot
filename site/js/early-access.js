/*
 * jiro.bot: early-access sign-up pop-up.
 * Every link to #reserve, and the reserve section's button, opens the dialog instead of scrolling.
 * Without JavaScript those links still scroll to the reserve section.
 * The form posts to the early-access Lambda named in <meta name="early-access-endpoint">;
 * the visitor is only added after opening the emailed link and pressing Confirm my spot.
 */
(function () {
  "use strict";
  const dialog = document.getElementById("early-access");
  const endpoint = (document.querySelector('meta[name="early-access-endpoint"]') || {}).content || "";
  if (!dialog || typeof dialog.showModal !== "function") return;

  const form = dialog.querySelector(".ea-form");
  const done = dialog.querySelector(".ea-done");
  const error = dialog.querySelector(".ea-error");
  const submit = form.querySelector(".ea-submit");

  function open() {
    form.hidden = false;
    done.hidden = true;
    error.hidden = true;
    dialog.showModal();
    const first = Array.from(form.querySelectorAll("input[required]")).find((i) => !i.value);
    (first || submit).focus();
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest('a[href="#reserve"], [data-early-access]');
    if (!trigger) return;
    e.preventDefault();
    open();
  });

  // Close on a backdrop click only when the press also started there, so dragging a
  // text selection out of a field doesn't throw away what the visitor typed.
  let pressedBackdrop = false;
  dialog.addEventListener("mousedown", (e) => {
    pressedBackdrop = e.target === dialog;
  });
  dialog.addEventListener("click", (e) => {
    if ((e.target === dialog && pressedBackdrop) || e.target.closest("[data-ea-close]")) dialog.close();
  });

  // Only the campaign tags are kept from the query string; anything else may be private.
  function pageWithCampaign() {
    const kept = new URLSearchParams();
    for (const [key, value] of new URLSearchParams(location.search)) {
      if (key.startsWith("utm_")) kept.append(key, value);
    }
    const query = kept.toString();
    return location.origin + location.pathname + (query ? `?${query}` : "");
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.hidden = true;
    for (const input of form.querySelectorAll("input[required]")) input.value = input.value.trim();
    if (!form.reportValidity()) return;

    const data = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      ea_hp: form.elements.ea_hp.value,
      page: pageWithCampaign(),
      referrer: document.referrer,
    };

    submit.disabled = true;
    try {
      if (!endpoint) throw new Error("sign-up endpoint is not configured");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      dialog.querySelector("[data-ea-email]").textContent = data.email;
      form.hidden = true;
      done.hidden = false;
      dialog.querySelector("[data-ea-done-title]").focus();
    } catch (err) {
      showError("Something went wrong. Please try again in a moment.");
    } finally {
      submit.disabled = false;
    }
  });
})();
