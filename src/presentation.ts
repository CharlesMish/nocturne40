import { COMPARISON_VIEWS, type ComparisonSettings } from "./comparison";

const frame = document.querySelector<HTMLIFrameElement>("#watch")!;
const status = document.querySelector<HTMLElement>("#status")!;
const finishSelect = document.querySelector<HTMLSelectElement>("#finish")!;
const technical = document.querySelector<HTMLAnchorElement>("#technical")!;
const buttons = document.querySelectorAll<HTMLButtonElement>("[data-view]");
const query = new URLSearchParams(location.search);
const viewParam = query.get("view");
let view: ComparisonSettings["view"] = COMPARISON_VIEWS.find(v => v === viewParam && Array.from(buttons).some(b => b.dataset.view === v)) ?? "oblique";
let finish = query.get("finish") === "physical2" ? "physical2" : "studio";
let ready = false;
let timeout: ReturnType<typeof setTimeout>;

function viewerQuery() {
  return new URLSearchParams({ design: "synthesis", finish, view, light: "neutral", pose: "ten-ten" });
}

function updateLinks() {
  const route = new URL(location.href);
  route.search = new URLSearchParams({ finish, view }).toString();
  history.replaceState(null, "", route);
  technical.href = `./index.html?${viewerQuery()}`;
  buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
}

function updateView() {
  updateLinks();
  if (ready) frame.contentWindow?.postMessage({ type: "nocturne:compare", view, light: "neutral", pose: "ten-ten", sweep: false } satisfies ComparisonSettings, location.origin);
}

function loadWatch() {
  ready = false;
  clearTimeout(timeout);
  status.hidden = false;
  status.textContent = "Preparing the watch…";
  const params = viewerQuery();
  params.set("embed", "1");
  params.set("presentation", "1");
  frame.src = `./index.html?${params}`;
  finishSelect.value = finish;
  updateLinks();
  // Also covers WebGL initialization failures before the viewer can send a message.
  timeout = setTimeout(() => {
    status.textContent = "The watch is taking longer to load. WebGL is required; refresh to try again, or use the source links below.";
  }, 20000);
}

buttons.forEach(button => button.addEventListener("click", () => {
  view = button.dataset.view as ComparisonSettings["view"];
  updateView();
}));
finishSelect.addEventListener("change", () => {
  finish = finishSelect.value === "physical2" ? "physical2" : "studio";
  loadWatch();
});
window.addEventListener("message", event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  if (event.data?.type === "nocturne:ready") {
    ready = true;
    clearTimeout(timeout);
    status.hidden = true;
    updateView();
  } else if (event.data?.type === "nocturne:error") {
    clearTimeout(timeout);
    status.hidden = false;
    status.textContent = "The watch could not load. Refresh to try again, or use the source links below.";
  }
});
loadWatch();
