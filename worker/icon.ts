// Hyros brand icon, served from the Worker and advertised in the MCP
// serverInfo so Claude shows it in the connectors list.
export const ICON_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="12" fill="black"/>
  <path d="M15.689 32.1338H21.2273V15.8665H15.689V32.1338ZM17.5353 23.0968H19.381V28.5198H17.5353V23.0968Z" fill="white"/>
  <path d="M13.8456 24.9045H12V30.327H13.8456V24.9045Z" fill="white"/>
  <path d="M24.9209 21.2871H23.0752V26.7095H24.9209V21.2871Z" fill="white"/>
  <path d="M26.7705 32.1338H32.3088V15.8665H26.7705V32.1338ZM28.6168 19.4816H30.4625V24.9043H28.6168V19.4816Z" fill="white"/>
  <path d="M35.9995 17.6697H34.1538V23.0926H35.9995V17.6697Z" fill="white"/>
</svg>`;

// Public URL where the icon is served. Used as the `src` in serverInfo icons.
export const ICON_URL = 'https://hyrosmcp.callwithcarlos.com/icon.svg';

export function iconResponse(): Response {
  return new Response(ICON_SVG, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  });
}
