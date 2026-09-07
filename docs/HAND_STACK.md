# Seated hour/minute hand stack

Following `446eeba`, the Atelier presentation now includes a socketed center-arbor extension, a concentric hour sleeve, a bored hour collet, a stationary dial/plate collar and a small steel minute-hand cap.

The original center upper pivot ends at approximately Z 1.929 mm. The new extension reads that endpoint from the loaded vendor geometry and overlaps its upper 0.190 mm with a 0.061 mm-radius socket. Its 0.100 mm-radius shaft continues to the minute hand at Z 4.360 mm. The cap ends at Z 4.400 mm.

The hour sleeve has inner/outer radii 0.125/0.210 mm and spans Z 3.490–4.125 mm. Its bored collet joins the hour hand, preserving the visible blade outline; only the concealed root is trimmed clear of the center shaft. The stationary collar has a 0.235 mm bore and seats on the existing plate around its center opening. Its 0.480 mm neck fits inside the dial's 0.520 mm opening. These parts have modeled radial clearances, rather than solid overlapping cylinders at the hour/minute interface.

This completes the visible coaxial connection, not the watch's motion works. The hour-reduction gearing and setting/friction mechanisms are not modeled or functionally simulated. Presentation hand angles remain viewer poses. The frozen train geometry, axes and ratios are unchanged.

The rose-gold lip's top land is now **0.1023 mm**, exactly **93%** of the previous 0.110 mm width. The upper inner radius, color and bevel width remain unchanged; the outer profile moves inward by 0.0077 mm.

Validation covers the socket's overlap and clearance around the original pivot, the shaft/cap junction, hour sleeve/collet connection, concentric radial clearances and lip-width ratio. Whole-watch and close/angled renders are saved locally at `/.review/hand-stack/index.html`.
