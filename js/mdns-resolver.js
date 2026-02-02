/**
 * mDNS Hostname Resolver with IP Discovery
 * Resolves .local hostnames by discovering ESP32 devices on the local network
 * Uses cached IP with automatic discovery fallback
 */

export class MDNSResolver {
    static CACHE_KEY = 'esp32_buzzer_ip';
    static cachedIP = null;
    static discoveryInProgress = false;

    /**
     * Initialize resolver - load cached IP from localStorage
     */
    static init() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                this.cachedIP = cached;
                console.log(`📡 Loaded cached ESP32 IP: ${cached}`);
            }
        } catch (e) {
            console.warn('Could not load cached IP from localStorage');
        }
    }

    /**
     * Get the cached IP or null if not cached
     */
    static getCachedIP() {
        if (!this.cachedIP) {
            this.init();
        }
        return this.cachedIP;
    }

    /**
     * Save discovered IP to cache
     */
    static cacheIP(ip) {
        this.cachedIP = ip;
        try {
            localStorage.setItem(this.CACHE_KEY, ip);
            console.log(`💾 Cached ESP32 IP: ${ip}`);
        } catch (e) {
            console.warn('Could not save IP to localStorage');
        }
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
     * Discover ESP32 by trying to connect to its /status endpoint
     * Scans common IP addresses in the local subnet
     * @param {string} baseSubnet - Base subnet to scan (e.g., '192.168.137')
     * @returns {Promise<string|null>} - Discovered IP or null
     */
    static async discoverESP32(baseSubnet = null) {
        if (this.discoveryInProgress) {
            console.log('Discovery already in progress...');
            return null;
        }

        this.discoveryInProgress = true;
        console.log('🔍 Discovering ESP32 on local network...');

        // Try common subnets if not specified
        const subnets = baseSubnet ? [baseSubnet] : [
            '192.168.137',  // Windows Mobile Hotspot
            '192.168.1',    // Common home router
            '192.168.0',    // Common home router
            '192.168.4',    // ESP32 AP mode
            '10.0.0',       // Some networks
        ];

        // Try cached IP first
        if (this.cachedIP) {
            console.log(`Trying cached IP: ${this.cachedIP}`);
            if (await this.probeIP(this.cachedIP)) {
                console.log(`✅ Cached IP ${this.cachedIP} is still valid`);
                this.discoveryInProgress = false;
                return this.cachedIP;
            } else {
                console.log(`❌ Cached IP ${this.cachedIP} no longer responds, scanning...`);
                this.clearCache();
            }
        }

        // Scan subnets - try common ESP32 addresses first
        const commonEndings = [1, 100, 101, 102, 130, 131, 150, 200, 254];

        for (const subnet of subnets) {
            console.log(`Scanning subnet ${subnet}.*`);

            // Try common addresses first
            for (const ending of commonEndings) {
                const ip = `${subnet}.${ending}`;
                if (await this.probeIP(ip)) {
                    console.log(`✅ Found ESP32 at ${ip}`);
                    this.cacheIP(ip);
                    this.discoveryInProgress = false;
                    return ip;
                }
            }
        }

        console.log('❌ Could not discover ESP32 on network');
        this.discoveryInProgress = false;
        return null;
    }

    /**
     * Probe an IP address to check if ESP32 is there
     * @param {string} ip - IP address to probe
     * @returns {Promise<boolean>} - True if ESP32 responds
     */
    static async probeIP(ip) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms timeout

            const response = await fetch(`http://${ip}/status`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                // Verify it's our ESP32 buzzer
                if (data.status === 'ok' && 'buzzer' in data) {
                    return true;
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get the actual URL to use for fetch requests
     * Uses cached IP if available, otherwise uses hostname
     * @param {string} hostname - The hostname or IP from config
     * @param {string} path - The path to append
     * @returns {string} - The full URL
     */
    static getUrl(hostname, path = '') {
        // Remove leading slash from path if present
        if (path.startsWith('/')) {
            path = path.substring(1);
        }

        // If hostname is .local, try to use cached IP
        if (hostname.endsWith('.local')) {
            const cachedIP = this.getCachedIP();
            if (cachedIP) {
                console.log(`Using cached IP ${cachedIP} for ${hostname}`);
                return `http://${cachedIP}${path ? '/' + path : ''}`;
            }
            // Trigger discovery in background
            this.discoverESP32().then(ip => {
                if (ip) {
                    console.log(`Discovered ESP32 at ${ip} - will use for next request`);
                }
            });
        }

        // Return URL with original hostname (fallback)
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

        // Try cached IP first
        const cachedIP = this.getCachedIP();
        if (cachedIP && await this.probeIP(cachedIP)) {
            console.log(`✅ ESP32 connected at ${cachedIP}`);
            return cachedIP;
        }

        // Discover ESP32
        const discoveredIP = await this.discoverESP32();
        if (discoveredIP) {
            console.log(`✅ ESP32 discovered at ${discoveredIP}`);
            return discoveredIP;
        }

        console.warn('⚠️ Could not connect to ESP32');
        return null;
    }

    /**
     * Manually set the ESP32 IP address
     * @param {string} ip - The IP address to use
     */
    static setManualIP(ip) {
        this.cacheIP(ip);
        console.log(`✅ ESP32 IP manually set to ${ip}`);
    }
}

// Initialize on load
MDNSResolver.init();
