/**
 * mDNS Hostname Resolver
 * Resolves .local hostnames to IP addresses for JavaScript fetch compatibility
 */

export class MDNSResolver {
    /**
     * Resolve a hostname (especially .local) to an IP address
     * Uses a hidden image element to trigger DNS resolution
     * @param {string} hostname - The hostname to resolve (e.g., 'esp32-cam.local')
     * @returns {Promise<string>} - The IP address or original hostname if resolution fails
     */
    static async resolve(hostname) {
        // If it's not a .local domain, return as-is
        if (!hostname.endsWith('.local')) {
            return hostname;
        }

        // Try to resolve using a hidden image element
        return new Promise((resolve) => {
            const img = new Image();
            const testUrl = `http://${hostname}/favicon.ico?t=${Date.now()}`;

            // Set a timeout
            const timeout = setTimeout(() => {
                console.warn(`mDNS resolution timeout for ${hostname}, using hostname directly`);
                resolve(hostname); // Fallback to hostname
            }, 2000);

            img.onload = () => {
                clearTimeout(timeout);
                // If image loads, hostname works - return it
                // Some browsers handle .local in fetch, some don't
                resolve(hostname);
            };

            img.onerror = () => {
                clearTimeout(timeout);
                // Even on error, the hostname might work for fetch
                // Return hostname and let fetch handle it
                resolve(hostname);
            };

            // Try to load (this triggers DNS resolution)
            img.src = testUrl;
        });
    }

    /**
     * Get the actual URL to use for fetch requests
     * For .local domains, tries to use hostname directly (some browsers support it)
     * Falls back to trying IP if available
     * Uses HTTPS when page is loaded over HTTPS (required for GitHub Pages → ESP32)
     * @param {string} hostname - The hostname or IP
     * @param {string} path - The path to append
     * @returns {string} - The full URL
     */
    static getUrl(hostname, path = '') {
        // Remove leading slash from path if present
        if (path.startsWith('/')) {
            path = path.substring(1);
        }

        // Use HTTPS if the current page is HTTPS (required to avoid Mixed Content blocking)
        // ESP32 must have HTTPS enabled for this to work
        const protocol = window.location.protocol === 'https:' ? 'https' : 'http';

        return `${protocol}://${hostname}${path ? '/' + path : ''}`;
    }
}

