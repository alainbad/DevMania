# Original Navigation Bars V2 integration

Adapted from the user-supplied naviagtion-bars-v2.zip, dark spotlight navbar in src/App.jsx and src/App.css.

Preserved: active-indicator and spotlight layout IDs; spring stiffness 300 and damping 30; 75px pill; 36x5px light strip; 90x45px trapezoid spotlight; 0.3s icon transition.

Changes: DevMania orange accent, eight accessible destination links and responsive width. The spotlight follows pointer hover and keyboard focus, reverting to the current-page tab on exit. Native links navigate immediately. The dock fills the remaining header width next to the logo.

Rebuild with npm ci --ignore-scripts, then npm run build in this directory. Output: ../original-nav.js. The main build copies the checked-in bundle; no React dependency is added to other features.
