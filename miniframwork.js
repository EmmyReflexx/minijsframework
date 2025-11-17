// microjs.js - The Mini Framework
class MicroJS {
    constructor() {
        this.components = new Map();
        this.state = new Proxy({}, {
            set: (target, property, value) => {
                target[property] = value;
                this._updateComponents(property);
                return true;
            }
        });
        this.routes = new Map();
        this.currentRoute = null;
    }

    // State Management
    setState(key, value) {
        this.state[key] = value;
    }

    getState(key) {
        return this.state[key];
    }

    // Component System
    component(name, renderFunction) {
        this.components.set(name, renderFunction);
    }

    render(componentName, container, props = {}) {
        const renderFunc = this.components.get(componentName);
        if (renderFunc) {
            const element = renderFunc(props, this.state);
            if (container) {
                if (typeof container === 'string') {
                    container = document.querySelector(container);
                }
                container.innerHTML = '';
                container.appendChild(element);
            }
            return element;
        }
        return null;
    }

    _updateComponents(changedStateKey) {
        // Re-render components that depend on the changed state
        this.components.forEach((renderFunc, name) => {
            const elements = document.querySelectorAll(`[data-component="${name}"]`);
            elements.forEach(element => {
                const props = JSON.parse(element.getAttribute('data-props') || '{}');
                const newElement = renderFunc(props, this.state);
                element.replaceWith(newElement);
            });
        });
    }

    // DOM Helper Methods
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.keys(attributes).forEach(key => {
            if (key.startsWith('on') && typeof attributes[key] === 'function') {
                element.addEventListener(key.slice(2).toLowerCase(), attributes[key]);
            } else if (key === 'className') {
                element.className = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });

        // Add children
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
        }

        return element;
    }

    // Event System
    on(event, selector, handler) {
        document.addEventListener(event, (e) => {
            if (e.target.matches(selector)) {
                handler(e);
            }
        });
    }

    // Router System
    route(path, component) {
        this.routes.set(path, component);
    }

    navigate(path) {
        if (this.routes.has(path)) {
            this.currentRoute = path;
            window.history.pushState({}, '', path);
            this._renderRoute();
        }
    }

    _renderRoute() {
        const component = this.routes.get(this.currentRoute);
        if (component) {
            this.render(component, '#app');
        }
    }

    // Utility Methods
    $(selector) {
        return document.querySelector(selector);
    }

    $$(selector) {
        return document.querySelectorAll(selector);
    }

    // AJAX Helper
    async fetch(url, options = {}) {
        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // Local Storage Helper
    storage = {
        set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
        get: (key) => JSON.parse(localStorage.getItem(key)),
        remove: (key) => localStorage.removeItem(key),
        clear: () => localStorage.clear()
    }
}

// Create global instance
const app = new MicroJS();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MicroJS, app };
}