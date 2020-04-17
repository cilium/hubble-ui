// this sizes map uses for both js calculations and css styles
// all sizes in this map should be considered in pixels
export const sizes = {
  '--endpoint-width': 506,
  '--endpoint-shadow-size': 12,
  '--endpoint-icon-width': 44,
  '--endpoint-header-height': 115,
  '--endpoint-title-height': 29,
  '--endpoint-subtitle-height': 12,
  '--endpoint-h-padding': 138,
  '--endpoint-v-padding': 138,
  '--endpoint-function-height': 16,
  '--endpoint-protocol-height': 16,
  '--egress-connector-width': 38,
  '--ingress-connector-padding': 24,
  '--link-width': 2,
  '--link-curve-radius': 8,
};

export function applySizesToCss() {
  Object.keys(sizes).forEach(key => {
    const cssvar = key as keyof typeof sizes;
    document.documentElement.style.setProperty(cssvar, `${sizes[cssvar]}px`);
  });
}
