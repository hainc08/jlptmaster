/** Hands a same-origin URL to the browser, which saves it because the response is `Content-Disposition: attachment`. */
export function downloadFile(url: string): void {
  window.location.assign(url);
}
