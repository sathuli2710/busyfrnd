import * as WebBrowser from 'expo-web-browser';

/**
 * Opens the hosted checkout (Cashfree, or the mock gateway) in an in-app browser.
 * The API redirects to `returnUrl` (an app deep link) when done; the browser closes automatically.
 */
export async function openCheckout(checkoutUrl: string, returnUrl: string) {
  return WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
}
