import { isComparisonSettings, type ComparisonSettings } from "./comparison";
import { designLabel, executionFinish, seatingFinish, physicalFinish, type DesignVariant } from "./design";

const panels = [...document.querySelectorAll<HTMLElement>("article[data-design]")];
const view = document.querySelector<HTMLSelectElement>("#view")!;
const light = document.querySelector<HTMLSelectElement>("#light")!;
const pose = document.querySelector<HTMLSelectElement>("#pose")!;
const environment = document.querySelector<HTMLSelectElement>('#environment')!;
environment.value = new URLSearchParams(location.search).get('environment') === 'bright' ? 'bright' : 'studio';
function environmentControls() {
  light.disabled=environment.value==='bright';
  if(light.disabled) light.value='neutral';
}
environmentControls();
environment.addEventListener('change',()=>{environmentControls();selectGroup();});
const sweep = document.querySelector<HTMLButtonElement>('#sweep')!;
let sweeping = false;
sweep.addEventListener('click',()=>{
  sweeping=!sweeping; sweep.setAttribute('aria-pressed',String(sweeping));
  sweep.textContent=sweeping ? 'Stop reflection sweep' : 'Reflection sweep'; sync();
});
const group = document.querySelector<HTMLSelectElement>("#group")!;
const groups: Record<string, {designs: DesignVariant[]; descriptions: string[]}> = {
  historical: {designs: ['dress1','sculptural','precise'], descriptions: [
    'Lane 1. Original warm dial, narrow lugs and exposed spring bars.',
    'Lane 2. Softer case and broader lug roots, with the crescent accent.',
    'Lane 3. The main direction: restrained furniture and a defined case.']},
  archaeology: {designs: ['dress1','dress1-clean','precise-optics'], descriptions: [
    'The historical reference, including its original rendering.',
    'Same dial, lugs and strap; corrected bezel surfaces, glass and studio reflections.',
    'Lane 3 with the same optical corrections. Compare warmth and containment before borrowing shapes.']},
  execution: {designs: ['precise','precise-optics','synthesis'], descriptions: [
    'The historical Lane 3 reference.',
    'Corrected case surfaces and glass. Original strap, lugs and crown dimensions.',
    'Adds padded leather, fitted hardware, revised lug roots and a 3 mm crown. Case height retained.']},
  character: {designs: ['synthesis','warm','contained'], descriptions: [
    'The corrected Lane 3 base. Pale champagne, dark brown leather and precise furniture.',
    'A modest move toward Lane 1’s warmth, with dial lightness and finish held steady.',
    'A quieter bezel and darker inner boundary. Aperture and bezel dimensions match A.']},
  combined: {designs: ['warm','contained','combined'], descriptions: [
    'Warmth in isolation.', 'Containment in isolation.', 'Both experiments together. An additional study, not a final selection.']},
};

function selectGroup() {
  const selected = groups[group.value] ?? groups.character;
  panels.forEach((panel,i)=>{
    const design = selected.designs[i]; panel.dataset.design = design;
    panel.querySelector('h2')!.textContent = designLabel(design);
    panel.querySelector('.number')!.textContent = `${String(i+1).padStart(2,'0')} · ${group.selectedOptions[0].textContent}`;
    panel.querySelector('.detail p')!.textContent = selected.descriptions[i];
    panel.querySelector('.status')!.textContent = 'Loading…';
    panel.querySelectorAll('.swatches i').forEach(s=>s.remove());
    const frame=panel.querySelector('iframe')!; frame.title=designLabel(design);
    const state=settings();
    frame.src=`./?${new URLSearchParams({design,embed:'1',view:state.view,light:state.light,pose:state.pose,environment:environment.value,finish:seatingFinish()?'physical2':physicalFinish()?'physical':executionFinish()?'execution':'previous'})}`;
    send(panel);
  });
  const url = new URL(location.href); url.searchParams.set('group',group.value); url.searchParams.set('environment',environment.value); history.replaceState(null,'',url);
}
const requestedGroup = new URLSearchParams(location.search).get('group') ?? 'character';
group.value = requestedGroup in groups ? requestedGroup : 'character';
group.addEventListener('change',selectGroup);

function settings(): ComparisonSettings {
  const value = {type: "nocturne:compare", view: view.value, light: light.value, pose: pose.value, sweep: sweeping};
  if (!isComparisonSettings(value)) throw new Error("Invalid comparison settings");
  return value;
}
function send(panel: HTMLElement) {
  const state = settings();
  panel.querySelector("iframe")?.contentWindow?.postMessage(state, location.origin);
  const query = new URLSearchParams({design: panel.dataset.design!, view: state.view, light: state.light, pose: state.pose, environment:environment.value,finish:seatingFinish()?'physical2':physicalFinish()?'physical':executionFinish()?'execution':'previous'});
  panel.querySelector<HTMLAnchorElement>(".open")!.href = `./?${query}`;
}
function sync() { panels.forEach(send); }
for (const select of [view, light, pose]) select.addEventListener("change", sync);
document.querySelector("#reset")!.addEventListener("click", sync);
window.addEventListener("message", event => {
  if (event.origin !== location.origin || !event.data || typeof event.data !== "object") return;
  const panel = panels.find(p => p.querySelector("iframe")?.contentWindow === event.source);
  if (!panel || panel.dataset.design !== event.data.design) return;
  if (event.data.type === "nocturne:ready") {
    panel.querySelector<HTMLElement>(".status")!.textContent = "Ready";
    send(panel);
  } else if (event.data.type === "nocturne:error") {
    panel.querySelector<HTMLElement>(".status")!.textContent = "Could not load watch. Reload to retry.";
  }
});
// Also handle cached frames that became ready before the module initialized.
for (const panel of panels) {
  const frame = panel.querySelector("iframe")!;
  if (frame.contentDocument?.body?.dataset.ready === "true") {
    panel.querySelector<HTMLElement>(".status")!.textContent = "Ready";
  }
}
selectGroup();
