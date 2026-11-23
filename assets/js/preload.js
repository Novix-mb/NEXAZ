        try {
            if (location.hash) history.replaceState(null, "", location.pathname + location.search);
        } catch (e) {}

;
        try {
            var __s = JSON.parse(localStorage.getItem("nexa.site.v1") || "null"),
                __d = matchMedia("(prefers-color-scheme: dark)").matches;
            document.documentElement.dataset.theme = (__s && __s.themeUser) ? (__s.theme === "dark" ? "dark" : "light") : (__d ? "dark" : "light")
        } catch (e) {}

;
        window.nxThemeColor = function(c) {
            try {
                var m = document.querySelector('meta[name=theme-color]');
                if (!m) {
                    m = document.createElement("meta");
                    m.name = "theme-color";
                    document.head.appendChild(m)
                }
                m.content = c || (document.documentElement.dataset.theme === "dark" ? "#0e1916" : "#f1fbfa")
            } catch (e) {}
        };
        nxThemeColor()

;
(() => {
    const CRIT = ['assets/img/emblem.webp', 'assets/img/greeting-bg.webp', 'assets/img/backdrop.svg'];
    const BG = {
        dawn: 'assets/img/scene-dawn.webp',
        space: 'assets/img/scene-starfield.webp',
        aurora: 'assets/img/scene-aurora.webp',
        sunset: 'assets/img/scene-sunset.webp'
    };
    const SND = {
        space: 'assets/audio/deep-space.mp3',
        lofi: 'assets/audio/calm-lofi.mp3',
        fire: 'assets/audio/warm-fireplace.mp3',
        rain: 'assets/audio/soft-rain.mp3',
        ocean: 'assets/audio/ocean-waves.mp3'
    };
    const P = window.NXPRE = {
        url: {},
        imgs: []
    };
    const lite = () => {
        const c = navigator.connection || {};
        return !!c.saveData || /(^|-)2g$/.test(c.effectiveType || '');
    };
    CRIT.forEach(src => {
        const im = new Image();
        im.decoding = 'async';
        if ('fetchPriority' in im) im.fetchPriority = 'high';
        im.src = src;
        P.imgs.push(im);
        if (im.decode) im.decode().catch(() => {});
    });
    let imgsStarted = false,
        audioStarted = false;
    const loadImgs = () => {
        if (imgsStarted) return imgsStarted;
        let first;
        imgsStarted = new Promise(r => first = r);
        let want = '';
        try {
            want = localStorage.getItem('nexa.focus.background.v3') || '';
        } catch (e) {}
        const order = Object.keys(BG).sort((a, b) => (b === want) - (a === want));
        const next = () => {
            const id = order.shift();
            if (!id) {
                first();
                return;
            }
            const im = new Image();
            im.decoding = 'async';
            if ('fetchPriority' in im) im.fetchPriority = 'low';
            im.onload = im.onerror = () => {
                first();
                next();
            };
            im.src = BG[id];
            P.imgs.push(im);
            if (id === want && im.decode) im.decode().catch(() => {});
        };
        next();
        return imgsStarted;
    };
    P.loadImgs = loadImgs;
    const fetchBlob = async src => {
        const res = await fetch(src, {
            priority: 'low'
        });
        if (!res.ok) throw new Error(src);
        return res.blob();
    };
    const small = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || (navigator.deviceMemory && navigator.deviceMemory < 4);
    const readerOpen = () => {
        const r = document.getElementById('nexa-pdf-reader');
        return !!(r && r.classList.contains('open'));
    };
    P.loadAudio = () => {
        if (audioStarted || lite()) return;
        audioStarted = true;
        const queue = Object.keys(SND);
        const next = async () => {
            if (readerOpen()) return setTimeout(next, 3000);
            const id = queue.shift();
            if (!id) return;
            try {
                const blob = await fetchBlob(SND[id]);
                if (!small) P.url[id] = URL.createObjectURL(blob);
            } catch (e) {}
            return next();
        };
        next();
    };
})();

;

;
(() => {
    const V = '?v=14';
    const cache = {};
    const js = src => cache[src] || (cache[src] = new Promise((ok, no) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => ok();
        s.onerror = () => {
            delete cache[src];
            no(new Error(src));
        };
        document.head.appendChild(s);
    }));
    const css = href => cache[href] || (cache[href] = new Promise(ok => {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        l.onload = l.onerror = () => ok();
        document.head.appendChild(l);
    }));
    const pdf = () => window.pdfjsLib ? Promise.resolve() : js('assets/js/pdf-core.js').then(() => {
        try {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/pdf-worker.js';
        } catch (e) {}
    });
    const fonts = () => css('assets/css/typefaces-extra.css');
    const calc = () => js('assets/js/calculator.js' + V);
    const fx = () => js('assets/js/timer-mini.js' + V);
    const done = {};
    const section = id => {
        if (done[id]) return done[id];
        let p = Promise.resolve();
        if (id === 'library') {
            pdf().catch(() => {});
            fonts();
            fetch('assets/js/pdf-worker.js').catch(() => {});
            p = pdf().catch(() => {});
        } else if (id === 'calculator') {
            p = calc().catch(() => {});
        } else if (id === 'notes') {
            p = fonts();
        } else if (id === 'focus') {
            p = Promise.all([fx().catch(() => {}), window.NXPRE && NXPRE.loadImgs ? NXPRE.loadImgs() : null]);
        }
        done[id] = p.then(() => {}, () => {});
        return done[id];
    };
    window.NXLAZY = {
        js: js,
        css: css,
        pdf: pdf,
        fonts: fonts,
        section: section
    };
    const boot = () => {
        let on = false;
        try {
            on = localStorage.getItem('nexa.fx.mini') === '1';
        } catch (e) {}
        if (on) fx().catch(() => {});
    };
    if (document.readyState === 'complete') boot();
    else addEventListener('load', boot, {
        once: true
    });
})();

;
(() => {
    const KEY = 'nexa.clock.v1';
    let st = {
        off: 0,
        zone: '',
        at: 0
    };
    try {
        const c = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (c && typeof c.off === 'number') st = c;
    } catch (e) {}
    const valid = z => {
        try {
            new Intl.DateTimeFormat('en-US', {
                timeZone: z
            });
            return true;
        } catch (e) {
            return false;
        }
    };
    if (st.zone && !valid(st.zone)) st.zone = '';
    let dtf = null,
        dz = null;
    const fmt = () => {
        if (dtf && dz === st.zone) return dtf;
        const o = {
            hourCycle: 'h23',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        };
        if (st.zone) o.timeZone = st.zone;
        dtf = new Intl.DateTimeFormat('en-US', o);
        dz = st.zone;
        return dtf;
    };
    const zone = () => {
        if (st.zone) return st.zone;
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch (e) {
            return '';
        }
    };
    const parts = ms => {
        const o = {};
        fmt().formatToParts(ms).forEach(x => {
            if (x.type !== 'literal') o[x.type] = +x.value;
        });
        return {
            y: o.year,
            m: o.month,
            d: o.day,
            h: o.hour % 24,
            mi: o.minute,
            s: o.second
        };
    };
    const now = () => Date.now() + st.off;
    const date = ms => {
        const p = parts(ms == null ? now() : ms);
        return new Date(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
    };
    const epoch = (y, mo, d, h, mi) => {
        const tgt = Date.UTC(y, mo, d, h, mi);
        let g = tgt;
        for (let i = 0; i < 4; i++) {
            const p = parts(g),
                diff = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi) - tgt;
            if (!diff) break;
            g -= diff;
        }
        return g;
    };
    const timed = (url, opt, ms) => {
        const c = new AbortController(),
            t = setTimeout(() => c.abort(), ms);
        return fetch(url, Object.assign({
            signal: c.signal
        }, opt)).finally(() => clearTimeout(t));
    };
    const fromOrigin = async () => {
        const t0 = Date.now();
        const r = await timed(location.pathname + '?_t=' + t0, {
            method: 'HEAD',
            cache: 'no-store'
        }, 6000);
        const t1 = Date.now(),
            h = r.headers.get('date'),
            sv = Date.parse(h);
        if (!h || isNaN(sv)) throw new Error('no date');
        return sv + 500 - (t0 + t1) / 2;
    };
    const fromRegion = async () => {
        const urls = ['https://worldtimeapi.org/api/ip', 'https://ipapi.co/json/'];
        for (const u of urls) {
            try {
                const t0 = Date.now(),
                    r = await timed(u, {
                        cache: 'no-store'
                    }, 5000),
                    j = await r.json(),
                    t1 = Date.now(),
                    z = j && j.timezone;
                if (z && valid(z)) return {
                    zone: z,
                    off: j.unixtime ? j.unixtime * 1000 + 500 - (t0 + t1) / 2 : null
                };
            } catch (e) {}
        }
        return null;
    };
    let running = null;
    const run = () => running || (running = (async () => {
        let ch = false,
            got = false;
        try {
            const o = Math.round(await fromOrigin());
            got = true;
            if (Math.abs(o - st.off) > 500) ch = true;
            st.off = o;
        } catch (e) {}
        const g = await fromRegion();
        if (g) {
            if (g.zone !== st.zone) {
                st.zone = g.zone;
                ch = true;
            }
            if (!got && g.off != null) {
                const o = Math.round(g.off);
                if (Math.abs(o - st.off) > 500) ch = true;
                st.off = o;
            }
        }
        st.at = Date.now();
        try {
            localStorage.setItem(KEY, JSON.stringify(st));
        } catch (e) {}
        if (ch) window.dispatchEvent(new Event('nexa:clock'));
    })().finally(() => {
        running = null;
    }));
    window.NXCLOCK = {
        now: now,
        date: date,
        epoch: epoch,
        parts: parts,
        zone: zone,
        off: () => st.off,
        sync: run
    };
    const boot = () => {
        run();
        setInterval(run, 10 * 6e4);
        addEventListener('online', run);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && Date.now() - st.at > 2 * 6e4) run();
        });
    };
    if (document.readyState === 'complete') boot();
    else addEventListener('load', boot, {
        once: true
    });
})();
