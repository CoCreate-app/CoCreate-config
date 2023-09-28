// Function to get a value by key from localStorage or cookies
function get(key) {
    if (isLocalStorageSupported()) {
        // If localStorage is supported, try to get the value from it
        return localStorage.getItem(key);
    } else {
        // If localStorage is not supported, try to get the value from cookies
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split("=");
            if (cookieName === key) {
                return decodeURIComponent(cookieValue);
            }
        }
        return null; // Key not found in cookies
    }
}

// Function to set a key-value pair in localStorage or cookies
function set(key, value) {
    if (isLocalStorageSupported()) {
        // If localStorage is supported, set the value in it
        localStorage.setItem(key, value);
    } else {
        // If localStorage is not supported, set the value in cookies
        document.cookie = `${key}=${encodeURIComponent(value)}`;
    }
}

// Function to check if a key exists in localStorage or cookies
function has(key) {
    if (isLocalStorageSupported()) {
        // If localStorage is supported, check if the key exists
        return localStorage.getItem(key) !== null;
    } else {
        // If localStorage is not supported, check if the key exists in cookies
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            const [cookieName] = cookie.split("=");
            if (cookieName === key) {
                return true;
            }
        }
        return false; // Key not found in cookies
    }
}

// Function to delete a key-value pair from localStorage or cookies
function del(key) {
    if (isLocalStorageSupported()) {
        // If localStorage is supported, remove the key-value pair
        localStorage.removeItem(key);
    } else {
        // If localStorage is not supported, expire the cookie to delete it
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
}
