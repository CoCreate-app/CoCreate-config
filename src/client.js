import localStorage from '@cocreate/local-storage'

// Function to get a value by key from localStorage or cookies
function get(key) {
    let value
    value = localStorage.getItem(key)

    if (window.CoCreateConfig && window.CoCreateConfig[key])
        return window.CoCreateConfig[key]
    else if (value = localStorage.getItem(key)) {
        return value
    } else {
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split("=");
            if (cookieName === key) {
                return decodeURIComponent(cookieValue);
            }
        }
    }
}

// Function to set a key-value pair in localStorage or cookies
function set(key, value) {
    if (!window.CoCreateConfig)
        window.CoCreateConfig = { [key]: value }
    else
        window.CoCreateConfig[key] = value
    localStorage.setItem(key, value)
    document.cookie = `${key}=${encodeURIComponent(value)}`;
}

// Function to delete a key-value pair from localStorage or cookies
function remove(key) {
    if (!window.CoCreateConfig)
        delete window.CoCreateConfig[key]
    localStorage.removeItem(key)
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export default { get, set, remove }