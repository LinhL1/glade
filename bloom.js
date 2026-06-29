'use strict';
const h = React.createElement;
const { useState, useEffect, useMemo, useCallback, useRef } = React;

const sb = window.supabase.createClient(
  'https://vpicbkvpfftqdqmyyqju.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaWNia3ZwZmZ0cWRxbXl5cWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDg0MDgsImV4cCI6MjA5Nzk4NDQwOH0.VHeHSnyyWtAnuT-VEhPPYFFYQL4RgcK2oK0wvB8zkLg'
);

// Add more filenames here to expand the collection
const FLOWERS = [
  'assets/flower1.png',
  'assets/flower2.png',
  'assets/flower3.png',
  'assets/flower4.png',
  //'assets/flower5.png',
  'assets/flower6.png',
];

function buildFlower(seed, spId, size, density) {
  const src = FLOWERS[seed % FLOWERS.length];
  return h('img', { src, width: size, height: size, style: { display: 'block', objectFit: 'contain' } });
}

const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS     = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function dateKey(d)    { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function parseKey(k)   { const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); }
function fmtLong(d)    { return MONTHS_LONG[d.getMonth()]  + ' ' + d.getDate(); }
function fmtWeekday(d) { return WEEKDAYS[d.getDay()]; }
function fmtShort(d)   { return MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate(); }

// ── Shell wrapper ────────────────────────────────────────────────────────────

function Shell({ children }) {
  return h('div', { style: { minHeight: '100dvh', display: 'flex', alignItems: 'stretch', justifyContent: 'center', background: '#e3c87a' } },
    h('div', { style: { position: 'relative', width: 'min(448px,100vw)', minHeight: '100dvh', background: '#e3c87a', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid rgba(0,0,0,.07)', borderRight: '1px solid rgba(0,0,0,.07)' } },
      children
    )
  );
}

// ── Sign In ──────────────────────────────────────────────────────────────────

function SignInScreen() {
  const [email, setEmail] = useState('');
  const [sent,  setSent]  = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  const send = async () => {
    const addr = email.trim();
    if (!addr) return;
    setBusy(true);
    setErr('');
    const { error } = await sb.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: window.location.href.split('#')[0] },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  };

  const inp = { width: '100%', background: 'none', border: 'none', outline: 'none', color: '#1a1206', fontSize: '17px', letterSpacing: '.005em' };
  const btn = { width: '100%', textAlign: 'center', fontFamily: "'Space Grotesk'", fontSize: '14px', letterSpacing: '.24em', textTransform: 'uppercase', borderRadius: '999px', padding: '16px', background: '#1a1206', color: '#e3c87a', transition: 'opacity .3s', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.55 : 1 };

  return h(Shell, null,
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 30px 44px', animation: 'fadeIn .6s ease' } },
      h('div', { style: { textAlign: 'center', fontFamily: "'Space Grotesk'", fontSize: '21px', letterSpacing: '.42em', textIndent: '.42em', color: '#1a1206', fontWeight: 500 } }, 'Glade'),
      h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center' } },
        sent
          ? h('div', { style: { textAlign: 'center', animation: 'fadeIn .5s ease' } },
              h('div', { style: { fontFamily: "'Space Grotesk'", fontSize: '26px', color: '#1a1206', letterSpacing: '.01em' } }, 'Check your email'),
              h('div', { style: { fontSize: '14px', color: '#6b5020', marginTop: '10px', letterSpacing: '.01em' } }, 'We sent a link to ' + email.trim())
            )
          : h('div', { style: { animation: 'fadeIn .5s ease' } },
              h('h1', { style: { fontFamily: "'Space Grotesk'", fontWeight: 400, fontSize: '27px', color: '#1a1206', letterSpacing: '-.01em', marginBottom: '36px' } }, 'Your garden awaits'),
              h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '16px', borderBottom: '1px solid rgba(0,0,0,.2)', paddingBottom: '11px', marginBottom: '10px' } },
                h('input', { type: 'email', value: email, onChange: e => setEmail(e.target.value), onKeyDown: e => { if (e.key === 'Enter') send(); }, placeholder: 'your@email.com', style: inp, autoFocus: true })
              ),
              err && h('div', { style: { fontSize: '13px', color: '#c0392b', marginBottom: '8px', letterSpacing: '.01em' } }, err),
              h('button', { onClick: send, disabled: busy, className: busy ? '' : 'hov-action', style: { ...btn, marginTop: '28px' } }, busy ? 'sending…' : 'send magic link')
            )
      )
    )
  );
}

// ── Loading ──────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return h(Shell, null,
    h('div', { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      h('div', { style: { fontFamily: "'Space Grotesk'", fontSize: '21px', letterSpacing: '.42em', textIndent: '.42em', color: '#1a1206', opacity: 0.4 } }, 'Glade')
    )
  );
}

// ── Welcome ──────────────────────────────────────────────────────────────────

function WelcomeScreen({ heroFlower, todayEntry, now, onStart, onCalendar, installable, onInstall }) {
  return h(Shell, null,
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 30px 44px', animation: 'fadeIn .6s ease' } },
      h('div', { style: { textAlign: 'center', fontFamily: "'Space Grotesk'", fontSize: '21px', letterSpacing: '.42em', textIndent: '.42em', color: '#1a1206', fontWeight: 500 } }, 'Glade'),
      h('div', { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        h('div', { style: { animation: 'breathe 9s ease-in-out infinite' } },
          h('div', { style: { animation: 'spinslow 200s linear infinite' } }, heroFlower)
        )
      ),
      h('div', { style: { textAlign: 'center' } },
        h('div', { style: { fontSize: '12px', letterSpacing: '.28em', textTransform: 'uppercase', color: '#7a5c28' } }, fmtWeekday(now)),
        h('div', { style: { fontFamily: "'Space Grotesk'", fontSize: '15px', color: '#4a3508', marginTop: '9px', letterSpacing: '.01em' } },
          todayEntry ? 'Planted' : 'Tend to the good things'
        )
      ),
      h('button', {
        onClick: onStart,
        className: 'hov-start',
        style: { marginTop: '42px', alignSelf: 'center', fontFamily: "'Space Grotesk'", fontSize: '30px', fontWeight: 400, color: '#1a1206', letterSpacing: '.02em', padding: '6px 28px', transition: 'opacity .3s ease,letter-spacing .4s ease' }
      }, todayEntry ? 'Revisit' : 'Today'),
      h('button', {
        onClick: onCalendar,
        className: 'hov-subtle',
        style: { marginTop: '18px', alignSelf: 'center', fontSize: '12.5px', letterSpacing: '.26em', textTransform: 'uppercase', color: '#8a6c30', transition: 'color .3s ease' }
      }, 'view garden'),
      installable && h('button', {
        onClick: onInstall,
        className: 'hov-subtle',
        style: { marginTop: '10px', alignSelf: 'center', fontSize: '12.5px', letterSpacing: '.26em', textTransform: 'uppercase', color: '#8a6c30', transition: 'color .3s ease' }
      }, 'install app')
    )
  );
}

// ── Entry ────────────────────────────────────────────────────────────────────

function EntryScreen({ it0, it1, it2, setIt0, setIt1, setIt2, onBack, onContinue, now, err }) {
  const canContinue = !!(it0.trim() && it1.trim() && it2.trim());
  const filled = [it0, it1, it2].filter(x => x.trim()).length;

  const btnBase = { marginTop: '24px', alignSelf: 'stretch', textAlign: 'center', fontFamily: "'Space Grotesk'", fontSize: '14px', letterSpacing: '.24em', textTransform: 'uppercase', borderRadius: '999px', padding: '16px', transition: 'opacity .3s,background .3s,color .3s' };
  const btnStyle = canContinue
    ? { ...btnBase, background: '#1a1206', color: '#e3c87a', cursor: 'pointer' }
    : { ...btnBase, background: 'rgba(0,0,0,.08)', color: 'rgba(0,0,0,.35)', cursor: 'default' };
  const btnLabel = canContinue ? 'plant in garden' : (filled === 0 ? 'write three things' : (3 - filled) + ' more to go');

  const row = { display: 'flex', alignItems: 'flex-end', gap: '16px', borderBottom: '1px solid rgba(0,0,0,.2)', paddingBottom: '11px' };
  const num = { fontFamily: "'Space Grotesk'", fontSize: '13px', color: '#7a4f00', letterSpacing: '.06em', paddingBottom: '3px', minWidth: '20px' };
  const inp = { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#1a1206', fontSize: '17px', letterSpacing: '.005em' };

  return h(Shell, null,
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 30px 34px', animation: 'fadeIn .45s ease' } },
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '46px' } },
        h('button', { onClick: onBack, className: 'hov-nav', style: { fontSize: '13px', letterSpacing: '.22em', textTransform: 'uppercase', color: '#7a5c28', transition: 'color .3s' } }, '← back'),
        h('span', { style: { fontSize: '11.5px', letterSpacing: '.26em', textTransform: 'uppercase', color: '#8a6c30' } }, fmtShort(now))
      ),
      h('h1', { style: { fontFamily: "'Space Grotesk'", fontWeight: 400, fontSize: '30px', lineHeight: 1.18, color: '#1a1206', letterSpacing: '-.01em', maxWidth: '13ch' } }, "Today, I'm grateful for..."),
      h('div', { style: { marginTop: '38px', display: 'flex', flexDirection: 'column', gap: '26px' } },
        h('div', { style: row },
          h('span', { style: num }, '01'),
          h('input', { value: it0, onChange: e => setIt0(e.target.value), placeholder: 'something small or large…', style: inp })
        ),
        h('div', { style: row },
          h('span', { style: num }, '02'),
          h('input', { value: it1, onChange: e => setIt1(e.target.value), placeholder: 'a person, a moment, a place…', style: inp })
        ),
        h('div', { style: row },
          h('span', { style: num }, '03'),
          h('input', { value: it2, onChange: e => setIt2(e.target.value), placeholder: 'however ordinary it seems…', style: inp })
        )
      ),
      h('div', { style: { flex: 1 } }),
      h('button', {
        onClick: canContinue ? onContinue : undefined,
        className: canContinue ? 'hov-action' : '',
        style: btnStyle
      }, btnLabel),
      err && h('div', { style: { marginTop: '12px', fontSize: '13px', color: '#c0392b', textAlign: 'center', letterSpacing: '.01em' } }, err)
    )
  );
}

// ── Saved ────────────────────────────────────────────────────────────────────

function SavedScreen({ savedKey, entries, onCalendar }) {
  const entry = savedKey && entries[savedKey];
  const flower = entry ? buildFlower(entry.seed, entry.species, 252, 1) : null;
  const dateLbl = entry ? fmtLong(parseKey(savedKey)) + ' is in your garden.' : '';

  return h(Shell, null,
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 30px', textAlign: 'center' } },
      h('div', { style: { animation: 'bloomIn 1.1s cubic-bezier(.16,1,.3,1) both' } }, flower),
      h('div', { style: { animation: 'fadeUp .7s ease .5s both', marginTop: '18px' } },
        h('div', { style: { fontFamily: "'Space Grotesk'", fontSize: '26px', color: '#1a1206', letterSpacing: '.01em' } }, 'Planted.'),
        h('div', { style: { fontSize: '13.5px', color: '#6b5020', marginTop: '10px', letterSpacing: '.02em' } }, dateLbl)
      ),
      h('button', {
        onClick: onCalendar,
        className: 'hov-garden',
        style: { animation: 'fadeUp .7s ease .75s both', marginTop: '40px', fontSize: '13px', letterSpacing: '.26em', textTransform: 'uppercase', color: '#1a1206', border: '1px solid rgba(0,0,0,.3)', borderRadius: '999px', padding: '13px 30px', transition: 'background .3s,color .3s' }
      }, 'view garden')
    )
  );
}

// ── Calendar ─────────────────────────────────────────────────────────────────

function CalendarScreen({ entries, todayKey, onToday, onDayClick, onSignOut }) {
  const currentRef = useRef(null);

  const [nowY, nowM] = useMemo(() => {
    const [y, m] = todayKey.split('-').map(Number);
    return [y, m - 1];
  }, [todayKey]);

  // Start from earliest entry month (or current month if no entries), end 12 months out
  const months = useMemo(() => {
    let startY = nowY, startM = nowM;
    const keys = Object.keys(entries).sort();
    if (keys.length > 0) {
      const [ey, em] = keys[0].split('-').map(Number);
      startY = ey; startM = em - 1;
    }
    const list = [];
    const start = startY * 12 + startM;
    const end   = nowY  * 12 + nowM + 12;
    for (let t = start; t <= end; t++) {
      list.push({ year: Math.floor(t / 12), month: t % 12 });
    }
    return list;
  }, [entries, nowY, nowM]);

  useEffect(() => {
    if (currentRef.current) currentRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);

  const monthSections = months.map(({ year, month }) => {
    const isCurrent = year === nowY && month === nowM;
    const daysInMon = new Date(year, month + 1, 0).getDate();
    const startDow  = new Date(year, month, 1).getDay();

    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMon; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    let bloomCount = 0;
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    const gridRows = rows.map((row, ri) => {
      const dayEls = row.map((d, ci) => {
        if (d == null) return h('div', { key: ci, style: { aspectRatio: '1' } });
        const k     = dateKey(new Date(year, month, d));
        const entry = entries[k];
        const isToday = k === todayKey;
        const isPast  = k < todayKey;
        if (entry) bloomCount++;

        const inner = [];
        if (entry) {
          inner.push(h('div', { key: 'f', style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' } },
            buildFlower(entry.seed, entry.species, 40, 0.32)
          ));
        } else if (!isPast) {
          inner.push(h('div', { key: 'dot', style: { width: '3px', height: '3px', borderRadius: '50%', background: isToday ? '#1a1206' : 'rgba(0,0,0,.2)' } }));
        }
        inner.push(h('div', { key: 'n', style: { position: 'absolute', bottom: '2px', right: '4px', fontSize: '9px', fontFamily: "'Space Grotesk'", letterSpacing: '.02em', color: isToday ? '#1a1206' : (isPast && !entry ? 'rgba(255,220,160,0.55)' : 'rgba(0,0,0,.3)') } }, d));

        const cellBg     = (!entry && isPast) ? 'rgba(42,20,4,0.62)' : 'transparent';
        const cellBorder = isToday ? '1px solid rgba(0,0,0,.5)' : ((!entry && isPast) ? '1px solid rgba(42,20,4,0.4)' : '1px solid rgba(0,0,0,.1)');

        return h('button', {
          key: ci,
          onClick: entry ? () => onDayClick(k) : undefined,
          className: entry ? 'hov-calday' : '',
          style: { position: 'relative', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: cellBg, border: cellBorder, cursor: entry ? 'pointer' : 'default', padding: 0, transition: 'border-color .3s,background .3s' }
        }, inner);
      });
      return h('div', { key: ri, style: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px', marginBottom: '6px' } }, dayEls);
    });

    return h('div', {
      key: year + '-' + month,
      ref: isCurrent ? currentRef : null,
      style: { paddingTop: '28px', paddingBottom: '12px' }
    },
      h('div', { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' } },
        h('h2', { style: { fontFamily: "'Space Grotesk'", fontWeight: 400, fontSize: '20px', color: '#1a1206', letterSpacing: '-.01em' } }, MONTHS_LONG[month] + ' ' + year),
        bloomCount > 0 && h('span', { style: { fontSize: '11px', letterSpacing: '.2em', textTransform: 'uppercase', color: '#8a6c30' } }, bloomCount + (bloomCount === 1 ? ' bloom' : ' blooms'))
      ),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px', marginBottom: '8px' } },
        ['S','M','T','W','T','F','S'].map((wd, i) =>
          h('div', { key: i, style: { textAlign: 'center', fontSize: '10px', letterSpacing: '.16em', color: 'rgba(0,0,0,.4)' } }, wd)
        )
      ),
      gridRows
    );
  });

  return h(Shell, null,
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
      h('div', { style: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', scrollPaddingTop: '76px' } },
        h('div', { style: { position: 'sticky', top: 0, zIndex: 2, background: '#e3c87a', padding: '26px 26px 16px', borderBottom: '1px solid rgba(0,0,0,.08)' } },
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
            h('button', { onClick: onToday, className: 'hov-nav', style: { fontSize: '13px', letterSpacing: '.22em', textTransform: 'uppercase', color: '#7a5c28', transition: 'color .3s' } }, '← today'),
            h('span', { style: { fontSize: '11.5px', letterSpacing: '.26em', textTransform: 'uppercase', color: '#8a6c30' } }, 'your garden')
          )
        ),
        h('div', { style: { padding: '0 26px 60px' } },
          monthSections,
          h('div', { style: { marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,.1)', textAlign: 'center' } },
            h('button', { onClick: onSignOut, className: 'hov-subtle', style: { fontSize: '11px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,.25)', transition: 'color .3s' } }, 'sign out')
          )
        )
      )
    )
  );
}

// ── Day Detail ───────────────────────────────────────────────────────────────

function DayScreen({ dayKey, entries, onBack }) {
  const entry = entries[dayKey];
  if (!entry) return null;
  const dd     = parseKey(dayKey);
  const flower = buildFlower(entry.seed, entry.species, 224, 1);

  return h(Shell, null,
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 30px 34px', animation: 'fadeIn .45s ease' } },
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' } },
        h('button', { onClick: onBack, className: 'hov-nav', style: { fontSize: '13px', letterSpacing: '.22em', textTransform: 'uppercase', color: '#7a5c28', transition: 'color .3s' } }, '← garden'),
        h('span', { style: { fontSize: '11.5px', letterSpacing: '.26em', textTransform: 'uppercase', color: '#8a6c30' } }, fmtWeekday(dd))
      ),
      h('div', { style: { display: 'flex', justifyContent: 'center', margin: '8px 0 6px', animation: 'bloomIn .9s cubic-bezier(.16,1,.3,1) both' } }, flower),
      h('div', { style: { textAlign: 'center' } },
        h('div', { style: { fontFamily: "'Space Grotesk'", fontSize: '24px', color: '#1a1206', letterSpacing: '.01em' } }, fmtLong(dd))
      ),
      h('div', { style: { marginTop: '34px', display: 'flex', flexDirection: 'column', gap: '22px' } },
        entry.items.map((text, i) =>
          h('div', { key: i, style: { display: 'flex', gap: '16px', alignItems: 'baseline', borderBottom: '1px solid rgba(0,0,0,.12)', paddingBottom: '16px' } },
            h('span', { style: { fontFamily: "'Space Grotesk'", fontSize: '13px', color: '#7a4f00', letterSpacing: '.06em', minWidth: '20px' } }, '0' + (i + 1)),
            h('span', { style: { flex: 1, fontSize: '17px', lineHeight: 1.45, color: '#2a1e08', letterSpacing: '.005em' } }, text)
          )
        )
      ),
      h('div', { style: { flex: 1 } })
    )
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [now]          = useState(() => new Date());
  const todayKey       = useMemo(() => dateKey(now), [now]);

  const [session,      setSession]      = useState(null);
  const [authReady,    setAuthReady]    = useState(false);
  const [entriesReady, setEntriesReady] = useState(false);

  const [screen,      setScreen]      = useState('welcome');
  const [it0,         setIt0]         = useState('');
  const [it1,         setIt1]         = useState('');
  const [it2,         setIt2]         = useState('');
  const [entries,     setEntries]     = useState({});
  const [dayKey,      setDayKey]      = useState(null);
  const [savedKey,    setSavedKey]    = useState(null);
  const [plantErr,    setPlantErr]    = useState('');
  const [installable, setInstallable] = useState(false);
  const installPrompt = useRef(null);

  // Auth — subscribe once on mount
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setEntries({});
        setEntriesReady(false);
        setScreen('welcome');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Capture the install prompt on Android (iOS uses Share → Add to Home Screen)
  useEffect(() => {
    const handler = e => { e.preventDefault(); installPrompt.current = e; setInstallable(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load entries whenever the session is established
  useEffect(() => {
    if (!session) return;

    (async () => {
      const { data, error } = await sb.from('entries').select('*').eq('user_id', session.user.id);

      if (error || !data) {
        // Network unavailable — fall back to IndexedDB cache
        try {
          const cached = await IDB.getAllEntries();
          const obj = {};
          cached.forEach(row => { obj[row.date] = { items: row.items, species: row.species, seed: row.seed }; });
          setEntries(obj);
          const t = obj[todayKey];
          if (t) { setIt0(t.items[0] || ''); setIt1(t.items[1] || ''); setIt2(t.items[2] || ''); }
        } catch (e) { console.error(e); }
        setEntriesReady(true);
        return;
      }

      const obj = {};
      data.forEach(row => { obj[row.date] = { items: row.items, species: row.species, seed: row.seed }; });
      setEntries(obj);
      const t = obj[todayKey];
      if (t) { setIt0(t.items[0] || ''); setIt1(t.items[1] || ''); setIt2(t.items[2] || ''); }

      IDB.putEntries(data.map(r => ({ date: r.date, items: r.items, species: r.species, seed: r.seed }))).catch(console.error);
      setEntriesReady(true);
    })();
  }, [session]);

  const todayEntry = entries[todayKey];
  const heroFlower = useMemo(() =>
    buildFlower(todayEntry ? todayEntry.seed : 424242, todayEntry ? todayEntry.species : 0, 296, 1),
    [todayEntry]
  );

  const plant = useCallback(async () => {
    if (!session) return;
    if (!navigator.onLine) { setPlantErr("You're offline — connect to plant a new entry."); return; }
    setPlantErr('');
    const seed = (Date.now() % 1000000) + 1;
    const species = seed % FLOWERS.length;
    const newEntry = { items: [it0.trim(), it1.trim(), it2.trim()], species, seed };

    const { error } = await sb.from('entries').upsert(
      { user_id: session.user.id, date: todayKey, ...newEntry },
      { onConflict: 'user_id,date' }
    );
    if (error) { console.error(error); setPlantErr('Something went wrong — please try again.'); return; }

    IDB.putEntry({ date: todayKey, ...newEntry }).catch(console.error);
    setEntries(prev => ({ ...prev, [todayKey]: newEntry }));
    setSavedKey(todayKey);
    setScreen('saved');
  }, [session, entries, todayKey, it0, it1, it2, now]);

  const signOut = useCallback(() => sb.auth.signOut(), []);

  const install = useCallback(() => {
    if (!installPrompt.current) return;
    installPrompt.current.prompt();
    installPrompt.current.userChoice.then(() => { installPrompt.current = null; setInstallable(false); });
  }, []);

  if (!authReady)                  return h(LoadingScreen, null);
  if (!session)                    return h(SignInScreen, null);
  if (!entriesReady)               return h(LoadingScreen, null);

  if (screen === 'welcome')  return h(WelcomeScreen,  { heroFlower, todayEntry, now, onStart: () => setScreen('entry'), onCalendar: () => setScreen('calendar'), installable, onInstall: install });
  if (screen === 'entry')    return h(EntryScreen,    { it0, it1, it2, setIt0, setIt1, setIt2, now, onBack: () => setScreen('welcome'), onContinue: plant, err: plantErr });
  if (screen === 'saved')    return h(SavedScreen,    { savedKey, entries, onCalendar: () => setScreen('calendar') });
  if (screen === 'calendar') return h(CalendarScreen, { entries, todayKey, onToday: () => setScreen('welcome'), onDayClick: k => { setDayKey(k); setScreen('day'); }, onSignOut: signOut });
  if (screen === 'day')      return h(DayScreen,      { dayKey, entries, onBack: () => setScreen('calendar') });
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(h(App, null));
