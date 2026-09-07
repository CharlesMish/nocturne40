# Dial, blued hands and rose-gold detail

This material refinement follows the complete-strap and presentation checkpoint `2c5f313`. The presentation now selects `surface=atelier`; existing direct viewer URLs without that parameter retain the previous materials.

## Selected changes

**Blued hands.** The previous hands used a dark navy tint with restrained environment response, which often appeared nearly black. The revised PBR material gives them a clearer blue metallic response and a slightly brighter, smoother ridge. They retain a dark silhouette head-on and gain blue highlights as the watch turns. This approximates the appearance of blued steel; it does not simulate the oxide film. Blade dimensions, positions, counterweights and collets are unchanged.

**Fine dial grain.** A deterministic 1024-pixel bump texture covers the 31.4 mm dial. It perturbs surface shading without changing the accepted warm ivory color map, dial geometry or roughness. The finish is most apparent in close views and filters down at presentation scale. The small-seconds floor remains smooth, giving the recess a quiet contrast with the main field. Fine grain was selected for this pass; a stronger sunburst was not adopted.

**A clearer rose-gold lip at the small seconds.** The existing accent had a yellow-brown material and only a 0.042 mm top land. The revised lip has a rosier metallic material and a 0.110 mm top land, with a small outer bevel. Its outer radius grows from 4.022 to 4.105 mm; the upper inner radius moves from 3.980 to 3.985 mm. The upper surface sits 0.004 mm above the dial field to avoid coincident surfaces. The well, graduations and hand clearances remain intact. The ring uses 192 radial segments for close-view smoothness.

The gold stays at the seconds recess: it identifies an existing feature in the dial hierarchy. No additional gold markers, crown treatment or decorative elements were added.

## Review and preservation

Local live comparison: `/.review/atelier/compare.html`. Saved matched comparisons: `/.review/atelier/index.html`. They cover studio and neutral environments in whole-watch, front, seconds macro and raking views. Geometry, camera, exposure and non-tested materials match between the control and refinement, apart from the explicitly revised seconds lip.

Direct refined viewer:

```text
/?design=synthesis&finish=physical2&exploration=arc&lug=flow&refinement=finish&strap=complete&strapPose=closed&size=170&surface=atelier&view=oblique&light=neutral&pose=ten-ten
```

Remove `surface=atelier` for the control. The case, lugs, strap, crown, crystal, indices (including the reduced 5/7 markers), small-seconds graduations and vendor train are preserved. Numerical scene comparisons verify that geometry and materials change only on the intended parts, including identical dial color-map data. Core, TypeScript, normal/Pages builds and the presentation are checked before saving the pass.
