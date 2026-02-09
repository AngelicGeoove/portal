/**
 * Router Module
 * Handles client-side navigation within portals
 */

/**
 * Initialize router for single-page navigation
 */
export function initRouter() {
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link, [data-route]');
        if (!link) return;

        e.preventDefault();
        
        const route = link.getAttribute('href') || link.getAttribute('data-route');
        navigateTo(route);
    });

    // Handle initial route
    const hash = window.location.hash || '#dashboard';
    navigateTo(hash);

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
        navigateTo(window.location.hash);
    });
}

/**
 * Navigate to a specific view
 */
export function navigateTo(route) {
    // Remove # if present
    route = route.replace('#', '');

    const camelRoute = toCamelRoute(route);
    const candidateViewIds = [`${route}View`, `${camelRoute}View`]
        .filter((value, index, self) => value && self.indexOf(value) === index);

    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));

    // Show target view
    const targetView = candidateViewIds
        .map((id) => document.getElementById(id))
        .find(Boolean);
    if (targetView) {
        targetView.classList.add('active');
    } else {
        // Fallback: don't leave the portal blank on an unknown route
        document.getElementById('dashboardView')?.classList.add('active');
    }

    // Update nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${route}` || href === `#${camelRoute}`) {
            link.classList.add('active');
        }
    });

    // Update URL hash
    if (window.location.hash !== `#${route}`) {
        window.location.hash = route;
    }

    // Trigger route change event
    const event = new CustomEvent('routechange', { detail: { route } });
    document.dispatchEvent(event);
}

function toCamelRoute(route) {
    return (route || '').replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Get current route
 */
export function getCurrentRoute() {
    return window.location.hash.replace('#', '') || 'dashboard';
}
