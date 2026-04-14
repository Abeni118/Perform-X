// Determine the base path dynamically based on where the app is being hosted
const getApiBase = () => {
    const origin = window.location.origin;
    // If the project is running from localhost under a specific subfolder path
    const pathArray = window.location.pathname.split('/');
    // Check if we're in a folder like "Perform-X-master" or "Perform-X"
    const projectFolder = pathArray.find(p => p.toLowerCase().includes('perform-x'));
    
    // Automatically construct the backend root
    if (projectFolder) {
        return `${origin}/${projectFolder}/backend/`;
    }
    return `${origin}/backend/`;
};

const API_BASE = getApiBase();

window.apiUrl = function apiUrl(path) {
  const base = (API_BASE || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${base}/${cleanPath}`;
};

