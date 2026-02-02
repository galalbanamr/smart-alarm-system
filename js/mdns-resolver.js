/**
 * mDNS Hostname Resolver
 * Resolves .local hostnames by calling the ESP32's /status endpoint to get the IP
 */

export class MDNSResolver {
    static cachedIP = null;
    static CACHE_KEY = 'esp32_buzzer_ip';

    /**
     * Initialize - load cached IP from localStorage
     */
    static init() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                this.cachedIP = cached;
                console.log(`📡 Loaded cached ESP32 IP: ${cached}`);
            }
        } catch (e) {
            // localStorage not available
        }
    }

    /**
     * Save IP to cache
     */
    static cacheIP(ip) {
        this.cachedIP = ip;
        try {
            localStorage.setItem(this.CACHE_KEY, ip);
            console.log(`💾 Cached ESP32 IP: ${ip}`);
        } catch (e) { }
    }

    /**
     * Clear cached IP
     */
    static clearCache() {
        this.cachedIP = null;
        try {
            localStorage.removeItem(this.CACHE_KEY);
        } catch (e) { }
    }

    /**
     * Discover ESP32 IP by calling the /status endpoint on the .local hostname
     * The ESP32's /status response includes the IP address
     * @param {string} hostname - The .local hostname (e.g., 'esp32-buzzer.local')
     * @returns {Promise<string|null>} - The IP address or null if not found
     */
    static async discoverIPFromStatus(hostname) {
        try {
            console.log(`🔍 Discovering ESP32 IP from ${hostname}/status...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`http://${hostname}/status`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.ip) {
                    console.log(`✅ Discovered ESP32 IP: ${data.ip}`);
                    this.cacheIP(data.ip);
                    return data.ip;
                }
            }
        } catch (error) {
            console.log(`⚠️ Could not reach ${hostname}/status:`, error.message);
        }
        return null;
    }

    /**
     * Get the resolved IP for the ESP32
     * First tries cached IP, then discovers from /status
     * @param {string} hostname - The configured hostname
     * @returns {Promise<string|null>} - The resolved IP or null
     */
    static async resolveIP(hostname) {
        // If not a .local hostname, return as-is
        if (!hostname.endsWith('.local')) {
            return hostname;
        }

        // Try cached IP first
        if (this.cachedIP) {
            console.log(`📡 Using cached IP: ${this.cachedIP}`);
            return this.cachedIP;
        }

        // Discover IP from /status endpoint
        const ip = await this.discoverIPFromStatus(hostname);
        if (ip) {
            return ip;
        }

        // Fallback to hostname (might work in some browsers)
        console.log(`⚠️ Could not resolve ${hostname}, using hostname directly`);
        return hostname;
    }

    /**
     * Get the actual URL to use for fetch requests
     * This is a synchronous version that uses cached IP if available
     * @param {string} hostname - The hostname or IP from config
     * @param {string} path - The path to append
     * @returns {string} - The full URL
     */
    static getUrl(hostname, path = '') {
        // Remove leading slash from path if present
        if (path.startsWith('/')) {
            path = path.substring(1);
        }

        // If hostname is .local, use cached IP if available
        if (hostname.endsWith('.local') && this.cachedIP) {
            return `http://${this.cachedIP}${path ? '/' + path : ''}`;
        }

        // Return URL with original hostname
        return `http://${hostname}${path ? '/' + path : ''}`;
    }

    /**
     * Ensure we have a valid IP before making requests
     * Call this at app startup
     * @param {string} hostname - The configured hostname
     * @returns {Promise<string|null>} - Resolved IP or null
     */
    static async ensureConnection(hostname) {
        // If not a .local hostname, return as-is
        if (!hostname.endsWith('.local')) {
            return hostname;
        }

        // Discover IP from /status
        const ip = await this.discoverIPFromStatus(hostname);
        if (ip) {
            console.log(`✅ ESP32 connected at ${ip}`);
            return ip;
        }

        console.warn('⚠️ Could not connect to ESP32');
        return null;
    }
}

// Initialize on load
MDNSResolver.init();
