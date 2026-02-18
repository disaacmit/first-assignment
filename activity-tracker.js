class ActivityTracker {
    constructor() {
        this.storageKey = 'activity-tracker-data';
        this.data = this.loadOrCreateSession();
        this.startTime = Date.now();

        this.renderWidget();
        this.recordPageView();
        this.attachEventListeners();
        this.updateUI();
    }
    
    loadOrCreateSession() {
        const existing = localStorage.getItem(this.storageKey);

        if (existing) {
            return JSON.parse(existing);
        }

        const newSession = {
            sessionId: this.generateSessionId(),
            startedAt: Date.now(),
            events: []
        };

        localStorage.setItem(this.storageKey, JSON.stringify(newSession));
        return newSession;
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    }

    persist() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }


    recordEvent(type, details = {}) {
        const event = {
            type,
            ...details,
            time: Date.now()
        };

        this.data.events.push(event);
        this.persist();
        this.updateUI();
    }

    recordPageView() {
        this.recordEvent('pageview', {
            page: window.location.pathname.split('/').pop()
        });
    }

   
    attachEventListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');

            if (target) {
                this.recordEvent('click', {
                    element: target.tagName,
                    text: target.textContent.trim().slice(0, 50)
                });
            }
        }, true);

        document.addEventListener('submit', (e) => {
            this.recordEvent('form_submit', {
                formId: e.target.id || 'unknown'
            });
        }, true);

        document.addEventListener('click', (e) => {
            if (e.target.id === 'tracker-toggle') {
                document.getElementById('tracker-body')
                    .classList.toggle('hidden');
            }
        });
    }

    getStats() {
        const stats = {
            pageviews: 0,
            clicks: 0,
            forms: 0,
            duration: Date.now() - this.data.startedAt
        };

        this.data.events.forEach(e => {
            if (e.type === 'pageview') stats.pageviews++;
            if (e.type === 'click') stats.clicks++;
            if (e.type === 'form_submit') stats.forms++;
        });

        return stats;
    }

    renderWidget() {
        if (document.getElementById('activity-tracker-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'activity-tracker-widget';
        widget.innerHTML = `
            <div id="tracker-header">
                <span>Activity Tracker</span>
                <button id="tracker-toggle">Click Here</button>
            </div>
            <div id="tracker-body">
                <div id="tracker-stats"></div>
                <ul id="tracker-timeline"></ul>
            </div>
        `;

        document.body.appendChild(widget);
    }

    updateUI() {
        this.updateStats();
        this.updateTimeline();
    }

    updateStats() {
        const stats = this.getStats();
        const container = document.getElementById('tracker-stats');

        container.innerHTML = `
            <p><strong>Session:</strong> ${this.data.sessionId}</p>
            <p>Page Views: ${stats.pageviews}</p>
            <p>Clicks: ${stats.clicks}</p>
            <p>Forms: ${stats.forms}</p>
            <p>Duration: ${Math.floor(stats.duration / 1000)}s</p>
        `;
    }

    updateTimeline() {
        const timeline = document.getElementById('tracker-timeline');
        timeline.innerHTML = '';

        this.data.events.slice().reverse().forEach(event => {
            const li = document.createElement('li');

            const time = new Date(event.time).toLocaleTimeString();

            li.textContent = `[${time}] ${event.type.toUpperCase()} ${
                event.page || event.element || event.formId || ''
            }`;

            timeline.appendChild(li);
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new ActivityTracker();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityTracker;
} else {
    window.ActivityTracker = ActivityTracker;
}
