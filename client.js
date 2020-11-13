import { ReactInstance } from 'react-360-web';
import SimpleRaycaster from 'simple-raycaster';

import WebVRPolyfill from 'webvr-polyfill';
const polyfill = new WebVRPolyfill();

function init(bundle, parent, options = {}) {
  const r360 = new ReactInstance(bundle, parent, {
    fullScreen: true,
    ...options,
  });

  r360.renderToSurface(
    r360.createRoot('DivarHackathon'),
    r360.getDefaultLocation()
  );

  r360.controls.clearRaycasters();
  r360.controls.addRaycaster(SimpleRaycaster)
}

window.React360 = { init };
