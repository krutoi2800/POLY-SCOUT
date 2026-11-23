(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STORAGE = 'poly-scout-crm-v1';
  const MANUAL_STORAGE = 'poly-scout-manual-v9';
  let manual = []; try { manual = JSON.parse(localStorage.getItem(MANUAL_STORAGE)||'[]'); if (!Array.isArray(manual)) manual=[]; } catch { manual=[]; }
  let pageLimit = 80; let sortMode='priority'; let onlyDue=false, withContacts=false, confirmedNoSite=false;
  let crm = {};
  try { crm = JSON.parse(localStorage.getItem(STORAGE) || '{}') || {}; } catch { crm = {}; }
  const state = { leads: [...(window.POLY_SEED || []), ...manual], view: 'search', status: 'all', query: '', city: 'all', citySearch:'', niche: 'all', website: 'all', lastUpdate: null, liveCount: 0 };
  const labels = { new: 'Не писал', sent: 'Написал', replied: 'Ответили', negotiation:'Обсуждение', rejected: 'Отказ', deal: 'Договорились' };
  const normalize = v => String(v || '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim();
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = u => { try { const a = new URL(String(u)); return ['https:', 'http:'].includes(a.protocol) ? a.href : ''; } catch { return ''; } };
  const getCRM = id => crm[id] || { saved: false, status: 'new', priority:'normal', note:'', nextDate:'', verified:false, websiteChecked:'unknown', quote:0, channel:'', verifiedAt:'' };
  const dateLocal = (d=new Date()) => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const due = c => !!c.nextDate && c.nextDate <= dateLocal() && !['rejected','deal'].includes(c.status);
  const getScore = o => { const c=getCRM(o.id); let n=0; if(c.priority==='high')n+=4;if(c.verified)n+=2; if(c.saved)n+=2; if(c.websiteChecked==='no')n+=5;else if(o.site_status==='missing')n+=1; if(o.telegram||o.vk)n+=2; else if(o.phone||o.email)n+=1; if(c.status==='replied')n+=3; if(c.status==='negotiation')n+=4; if(due(c))n+=3; if(c.status==='rejected'||c.status==='deal')n-=6; return n; };
  function saveManual(){try{localStorage.setItem(MANUAL_STORAGE,JSON.stringify(manual));}catch{toast('Нет места для списка компаний');}}
  const updateCRM = (id, changes) => { crm[id] = { ...getCRM(id), ...changes }; try { localStorage.setItem(STORAGE, JSON.stringify(crm)); } catch { toast('Не удалось сохранить изменения в браузере'); } render(); };
  const mapLink = o => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([o.name, o.city, o.address].filter(Boolean).join(' '));
  let toastTimer;
  function toast(message) { const node = $('toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 3400); }
  function contactUrl(kind, raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (kind === 'phone') { const n = value.replace(/[\s()\-]/g,'').split(';')[0]; return /^\+?[\d]{8,16}$/.test(n) ? 'tel:' + n : ''; }
    if (kind === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'mailto:' + value : '';
    if (kind === 'telegram' || kind === 'vk') {
      if (value.startsWith('@') && /^[\w@.-]{3,64}$/.test(value)) return kind === 'telegram' ? 'https://t.me/' + value.slice(1) : 'https://vk.com/' + value.slice(1);
      if (/^[\w.-]{3,64}$/.test(value)) return (kind === 'telegram' ? 'https://t.me/' : 'https://vk.com/') + value;
      const url = safeUrl(value.startsWith('t.me/') || value.startsWith('vk.com/') || value.startsWith('vk.ru/') ? 'https://' + value : value);
      if (url) {const host = new URL(url).hostname.toLowerCase(); if (kind === 'telegram' ? ['t.me', 'telegram.me'].includes(host) : ['vk.com', 'www.vk.com', 'vk.ru', 'www.vk.ru'].includes(host)) return url;}
    }
    return '';
  }
  function icon(category) { if (/красот|парикмах|маникюр/i.test(category)) return ['beauty','✂']; if (/цвет/i.test(category)) return ['flowers','✿']; if (/ремонт|мастерск|техник/i.test(category)) return ['workshop','⚙']; if (/пекар|кондитер|кафе|кофе|ресторан/i.test(category)) return ['food','☕']; return ['','✳']; }
  function mergeData(data) {
    const merged = new Map();
    for (const item of [...(window.POLY_SEED || []), ...state.leads.filter(x=>!x.sample && getCRM(x.id).saved), ...(Array.isArray(data.leads) ? data.leads : []), ...manual]) {
      if (!item || typeof item !== 'object' || !item.id || !item.name || !item.city) continue;
      const name = normalize(item.name) + '/' + normalize(item.city);
      if (item.sample && [...merged.values()].some(x => normalize(x.name) + '/' + normalize(x.city) === name && !x.sample)) continue;
      if (!item.sample) for (const [key, other] of merged) if (other.sample && normalize(other.name) + '/' + normalize(other.city) === name) { if (crm[key] && !crm[item.id]) { crm[item.id] = crm[key]; try { localStorage.setItem(STORAGE, JSON.stringify(crm)); } catch {} } merged.delete(key); }
      merged.set(item.id, item);
    }
    state.leads = [...merged.values()];
    state.liveCount = state.leads.filter(x => !x.sample).length;
    state.lastUpdate = data.updated_at || null;
    fillFilters(); render();
  }
  let updating = false;
  async function reload(manual = false) {
    if (updating) return;
    updating = true;
    const button = $('refreshBtn');
    button.disabled = true;
    button.classList.add('is-loading');
    button.querySelector('.refresh-label').textContent = 'Проверяем…';
    $('freshText').textContent = 'Проверяем опубликованную базу…';
    const oldIds = new Set(state.leads.map(x => x.id));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      if (location.protocol === 'file:') {
        const cached = window.POLY_LIVE_DATA || {leads:[]};
        mergeData(cached);
        $('freshText').textContent = 'Локальная база · для новых компаний запусти ОБНОВИТЬ_БАЗУ.bat';
        if(manual) toast('Локальные данные перечитаны. После запуска BAT обнови страницу, чтобы загрузить новые компании.');
        return;
      }
      const response = await fetch('data/leads.json?reload=' + Date.now(), { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!data || !Array.isArray(data.leads)) throw new Error('Некорректный файл базы');
      mergeData(data);
      const fresh = state.leads.filter(x => !oldIds.has(x.id)).length;
      const validDate = data.updated_at ? new Date(data.updated_at) : null;
      $('freshText').textContent = validDate && !Number.isNaN(validDate.getTime())
        ? 'База от ' + validDate.toLocaleDateString('ru-RU')
        : 'Стартовая база · сбор ещё не запускался';
      if (manual) toast(fresh > 0
        ? 'Добавлено новых компаний: ' + fresh
        : 'Проверка завершена. Новых компаний в опубликованной базе пока нет.');
    } catch (error) {
      // Не очищаем ранее загруженную базу и локальные CRM-отметки при сбое сети.
      $('freshText').textContent = state.liveCount
        ? 'Не удалось проверить базу · показаны сохранённые данные'
        : 'Стартовая база · обновление недоступно';
      if (manual) toast(location.protocol === 'file:'
        ? 'Для обновлений открой сайт через локальный сервер или GitHub Pages.'
        : 'Нет связи с файлом базы. Список остался прежним.');
    } finally {
      clearTimeout(timeout);
      updating = false;
      button.disabled = false;
      button.classList.remove('is-loading');
      button.querySelector('.refresh-label').textContent = 'Обновить список';
    }
  }
  const cityCatalog = Array.isArray(window.POLY_CITY_CATALOG) ? window.POLY_CITY_CATALOG : [];
  const nicheCatalog = (window.POLY_NICHE_CATEGORIES && typeof window.POLY_NICHE_CATEGORIES === 'object') ? window.POLY_NICHE_CATEGORIES : {};
  const categoryToGroup = Object.fromEntries(Object.entries(nicheCatalog).flatMap(([group, categories]) => categories.map(category => [category,group])));
  function fillFilters() {
    const cityCounts = new Map(), nicheCounts = new Map();
    for (const lead of state.leads) {
      cityCounts.set(lead.city,(cityCounts.get(lead.city)||0)+1);
      nicheCounts.set(lead.category,(nicheCounts.get(lead.category)||0)+1);
    }
    const cities = [...new Set([...cityCatalog, ...cityCounts.keys()])].sort((a,b)=>a.localeCompare(b,'ru'));
    const cityField = $('cityFilter');
    cityField.innerHTML = '<option value="all">Все города (' + state.leads.length + ')</option>' + cities.map(city => '<option value="'+esc(city)+'">'+esc(city)+' · '+(cityCounts.get(city)||0)+'</option>').join('');
    cityField.value = cities.includes(state.city) ? state.city : 'all';
    $('cityQuickList').innerHTML = cities.map(city=>'<option value="'+esc(city)+'"></option>').join('');

    const node = $('nicheFilter');
    const groups = Object.keys(nicheCatalog);
    const uncategorized = [...nicheCounts.keys()].filter(c=>!categoryToGroup[c]);
    const categoryCount = category => nicheCounts.get(category)||0;
    node.innerHTML = '<option value="all">Все ниши ('+state.leads.length+')</option>' + groups.map(group => {
      const categories = nicheCatalog[group];
      const total = categories.reduce((sum,category)=>sum+categoryCount(category),0);
      return '<option value="group:'+esc(group)+'">'+esc(group)+' · '+total+'</option>' +
        '<optgroup label="'+esc(group)+'">' + categories.map(category=>'<option value="'+esc(category)+'">'+esc(category)+' · '+categoryCount(category)+'</option>').join('') + '</optgroup>';
    }).join('') + (uncategorized.length ? '<optgroup label="Другие категории">' + uncategorized.map(category=>'<option value="'+esc(category)+'">'+esc(category)+' · '+categoryCount(category)+'</option>').join('') + '</optgroup>':'');
    const available = new Set([...Object.keys(categoryToGroup), ...uncategorized, ...groups.map(g=>'group:'+g)]);
    if (!available.has(state.niche)) state.niche='all';
    node.value=state.niche;
    const loadedCities = cityCounts.size;
    const loadedCategories = nicheCounts.size;
    $('catalogSummary').innerHTML = '<span><strong>🌍 '+cities.length+' городов</strong> для сбора · <strong>'+loadedCities+'</strong> с данными</span><span><strong>◈ '+Object.keys(categoryToGroup).length+' ниш</strong> в каталоге · <strong>'+loadedCategories+'</strong> с данными</span><span class="catalog-summary-note">Цифра после города или ниши — количество компаний в загруженной базе, не число доступных бизнесов.</span>';
  }
  function visible() {
    let items = state.leads.filter(x => {
      const c = getCRM(x.id);
      if (state.view === 'saved' && !c.saved) return false;
      if (onlyDue && !due(c)) return false;
      if(withContacts&&!['telegram','vk','phone','email'].some(k=>contactUrl(k,x[k])))return false;
      if(confirmedNoSite&&c.websiteChecked!=='no')return false;
      if (state.view === 'pipeline' && c.status === 'new') return false;
      if (state.city !== 'all' && x.city !== state.city) return false;
      if (state.citySearch && !normalize(x.city).includes(normalize(state.citySearch))) return false;
      if (state.niche !== 'all' && (state.niche.startsWith('group:') ? (x.group || categoryToGroup[x.category]) !== state.niche.slice(6) : x.category !== state.niche)) return false;
      if (state.website !== 'all' && (state.website === 'yes' ? x.site_status !== 'yes' : x.site_status !== 'missing')) return false;
      if (state.status !== 'all' && c.status !== state.status) return false;
      return normalize([x.name,x.city,x.category,x.address].join(' ')).includes(normalize(state.query));
    });
    items.sort((a,b) => { if(sortMode==='priority')return getScore(b)-getScore(a) || a.name.localeCompare(b.name,'ru'); if(sortMode==='name')return a.name.localeCompare(b.name,'ru'); if(sortMode==='city')return a.city.localeCompare(b.city,'ru') || a.name.localeCompare(b.name,'ru'); if(sortMode==='recent')return String(b.last_seen||b.first_seen||'').localeCompare(String(a.last_seen||a.first_seen||'')); return 0; });
    return items;
  }
  function itemHTML(o) {
    const [klass, glyph] = icon(o.category || '');
    const c = getCRM(o.id);
    const contacts = [['telegram','TG',o.telegram],['vk','ВК',o.vk],['phone','Телефон',o.phone],['email','Почта',o.email]]
      .filter(([kind,,val]) => !!contactUrl(kind,val))
      .slice(0,3)
      .map(([kind,label,val]) => '<a class="contact-link" target="' + (kind === 'phone' || kind === 'email' ? '_self' : '_blank') + '" rel="noopener noreferrer" href="' + esc(contactUrl(kind,val)) + '" title="' + esc(val) + '">' + esc(label) + ' ↗</a>').join('');
    const siteFlag = c.websiteChecked==='no'?'<span class="site-flag missing">✓ Подтверждено: сайта нет</span>':c.websiteChecked==='yes'?'<span class="site-flag">✓ Проверено: сайт есть</span>':o.site_status === 'yes' ? '<span class="site-flag">Сайт в OSM</span>' : o.site_status === 'missing' ? '<span class="site-flag">В OSM сайт не указан</span>' : '<span class="site-flag">Сайт не проверен</span>';
    const source = safeUrl(o.source_url);
    const current = o.manual ? 'ДОБАВЛЕНО ВРУЧНУЮ' : o.sample ? 'СТАРТОВАЯ ПОДБОРКА' : 'OPENSTREETMAP';
    const dateText = c.nextDate && due(c) ? '<span class="lead-due">⏰ Связаться сегодня / просрочено</span>' : '';
    const websiteLink = safeUrl(o.website) ? '<a class="lead-score" href="'+esc(safeUrl(o.website))+'" target="_blank" rel="noopener noreferrer">Сайт компании ↗</a>' : '';
    const potential=getScore(o);const scoreTag='<span class="scout-score-chip" title="Оценка для сортировки: контакты, проверка, статус общения и приоритет. Не гарантирует покупку.">✦ Приоритет '+potential+'</span>';
    const details = `<details class="crm-details"><summary>✎ Заметки и следующий шаг ${c.note?'· есть заметка':''}</summary><div class="crm-fields"><label>Приоритет <select data-crm="priority"><option value="normal" ${c.priority!=='high'?'selected':''}>Обычный</option><option value="high" ${c.priority==='high'?'selected':''}>Высокий</option></select></label><label>Связаться снова <input data-crm="nextDate" type="date" value="${esc(c.nextDate||'')}"></label><label>Проверка сайта <select data-crm="websiteChecked"><option value="unknown" ${!c.websiteChecked||c.websiteChecked==='unknown'?'selected':''}>Ещё не проверял</option><option value="yes" ${c.websiteChecked==='yes'?'selected':''}>Сайт есть — проверено</option><option value="no" ${c.websiteChecked==='no'?'selected':''}>Сайта нет — проверено</option></select></label><label>Канал для связи <select data-crm="channel"><option value="" ${!c.channel?'selected':''}>Не выбрано</option>${['Telegram','ВК','Телефон','Email'].map(x=>`<option value="${x}" ${c.channel===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Предложенная цена, ₽ <input type="number" data-crm="quote" min="0" max="5000000" step="1000" value="${Number(c.quote)||0}"></label><label class="crm-check"><input type="checkbox" data-crm="verified" ${c.verified?'checked':''}> Контакты проверены</label><label class="crm-note">Мои заметки<textarea data-crm="note" rows="2" maxlength="1500" placeholder="Что ответили? Что предложить?">${esc(c.note||'')}</textarea></label></div><button type="button" class="scout-schedule-btn" data-action="schedule">↻ Напомнить через 3 дня</button><small>Данные сохраняются на этом устройстве. Поле даты поможет не пропустить повторное обращение.</small></details>`;
    return '<article class="lead" data-id="' + esc(o.id) + '"><div class="lead-main"><div class="lead-icon ' + klass + '">' + glyph + '</div><div><div class="lead-name"><strong>' + esc(o.name) + '</strong>' + (o.sample ? '<span class="new-tag">ПРОВЕРЬ</span>' : '') + '</div><div class="lead-info">' + esc(o.city) + ' · ' + esc(o.category || 'Бизнес') + (o.address ? ' · ' + esc(o.address) : '') + '</div><div class="lead-sub">' + siteFlag + scoreTag + '<span class="lead-score">' + esc(current) + '</span>' + dateText + websiteLink + (source ? '<a class="lead-score" href="' + esc(source) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">Источник ↗</a>' : '<a class="lead-score" href="' + esc(mapLink(o)) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">Найти на карте ↗</a>') + '</div></div></div><div class="lead-actions">' + contacts + '<button class="contact-link pitch-copy" data-action="pitch" title="Скопировать персональное сообщение">⧉ Копировать</button><select class="status-select" data-action="status" aria-label="Статус общения с ' + esc(o.name) + '">' + Object.entries(labels).map(([k,v]) => '<option value="' + k + '" ' + (c.status === k ? 'selected' : '') + '>' + v + '</option>').join('') + '</select><button class="save-btn ' + (c.saved ? 'saved' : '') + '" data-action="save" type="button" aria-label="' + (c.saved ? 'Убрать из избранного' : 'Добавить в избранное') + '">' + (c.saved ? '♥' : '♡')  + '</button></div><div class="lead-pitch"><div class="lead-pitch-top"><span>✦ ВОТ ЧТО МОЖНО НАПИСАТЬ</span><span class="lead-pitch-idea">Идея: ' + esc(nicheIdea(o)[0]) + '</span></div><p>' + esc(pitch(o)) + '</p><div class="scout-pitch-variants"><button class="lead-pitch-action" type="button" data-action="pitch" data-variant="short">⧉ Короткое</button><button class="lead-pitch-action" type="button" data-action="pitch" data-variant="benefits">◈ С конкретной идеей</button><button class="lead-pitch-action" type="button" data-action="pitch" data-variant="followup">↻ Повторное</button></div></div>' + details + '</article>';
  }
  function render() {
    const total = state.leads;
    const saved = total.filter(x => getCRM(x.id).saved).length;
    const contacted = total.filter(x => ['sent','replied','negotiation','rejected','deal'].includes(getCRM(x.id).status)).length;
    $('totalCount').textContent = total.length.toLocaleString('ru');
    $('noSiteCount').textContent = total.filter(x => x.site_status === 'missing' && (!getCRM(x.id).websiteChecked || getCRM(x.id).websiteChecked === 'unknown')).length;
    $('savedCount').textContent = saved; $('contactedCount').innerHTML = contacted + '<span class="stat-star">✶</span>'; $('navSaved').textContent = saved;
    const items = visible(); $('resultsCount').textContent = items.length + ' ' + (items.length % 10 === 1 && items.length % 100 !== 11 ? 'результат' : [2,3,4].includes(items.length % 10) && ![12,13,14].includes(items.length % 100) ? 'результата' : 'результатов');
    const openDetails = new Set([...$('list').querySelectorAll('.lead')].filter(el => el.querySelector('.crm-details[open]')).map(el => el.dataset.id));
    $('list').innerHTML = items.length ? items.slice(0,pageLimit).map(itemHTML).join('') : '<div class="empty"><div class="empty-visual">✳</div><h3>Пока ничего не нашлось</h3><p>' + (state.view === 'saved' ? 'Нажми на сердечко у интересной компании — она появится здесь.' : state.view === 'pipeline' ? 'Отмечай отправленные сообщения и ответы — и увидишь их в своей воронке.' : 'В выбранном городе или нише пока нет загруженных компаний. Это не значит, что там нет бизнесов. Сбор по новым городам запускается через GitHub Actions; проверь дату обновления, а пока выбери «Все города».') + '</p></div>';
    $('list').querySelectorAll('.lead').forEach(el => { if (openDetails.has(el.dataset.id)) { const details = el.querySelector('.crm-details'); if(details) details.open = true; } });
    $('showMoreLeads').hidden = items.length <= pageLimit; $('showMoreLeads').textContent = 'Показать ещё · '+Math.min(80,items.length-pageLimit)+' из '+(items.length-pageLimit);
    const today=total.filter(o=>due(getCRM(o.id))).length; const alert=$('followUpSummary'); if(alert){alert.textContent=today?'⏰ Запланированных контактов на сегодня или раньше: '+today:'✓ Срочных повторных контактов нет';alert.classList.toggle('has-due',today>0);}
    const reached=total.filter(o=>['sent','replied','negotiation','deal'].includes(getCRM(o.id).status)).length;
    const responses=total.filter(o=>['replied','negotiation','deal'].includes(getCRM(o.id).status)).length;
    const deals=total.filter(o=>getCRM(o.id).status==='deal').length;
    const checked=total.filter(o=>getCRM(o.id).websiteChecked!=='unknown'&&getCRM(o.id).websiteChecked).length;
    const board=$('scoutOverview');if(board)board.innerHTML=`<div class="scout-board-head"><div><span>POLY SALES DESK / v13</span><strong>Твой следующий заказ начинается здесь.</strong></div><div class="scout-live-dot">● ЛОКАЛЬНАЯ CRM</div></div><div class="scout-board-grid"><div><small>Написано</small><strong>${reached}</strong><span>компаниям</span></div><div><small>Ответили</small><strong>${responses}</strong><span>${reached?Math.round(responses/reached*100):0}% от написанных</span></div><div><small>Договорились</small><strong>${deals}</strong><span>подтверждённых</span></div><div><small>Сайты проверены</small><strong>${checked}</strong><span>вручную</span></div></div><div class="scout-board-foot"><span>${today?'⏰ '+today+' повторных контактов требуют внимания':'✓ Повторных контактов на сегодня нет'}</span><button id="scoutJumpDue" type="button">Открыть очередь →</button></div>`;
    $('listTitle').textContent = state.view === 'saved' ? 'Те, кто заинтересовал.' : state.view === 'pipeline' ? 'Твоя воронка.' : 'Исследуй возможности.';
    $('pageTitle').innerHTML = state.view === 'saved' ? 'Твоя личная<br/><em>подборка.</em><span class="title-spark">✳</span>' : state.view === 'pipeline' ? 'От знакомства<br/><em>до сделки.</em><span class="title-spark">✳</span>' : 'Твои будущие<br/><em>клиенты.</em><span class="title-spark">✳</span>';
    $('breadcrumb').textContent = state.view === 'saved' ? 'ИЗБРАННОЕ' : state.view === 'pipeline' ? 'МОЯ ВОРОНКА' : 'ПОИСК КЛИЕНТОВ';
    document.querySelectorAll('[data-view]').forEach(a => a.classList.toggle('active', a.dataset.view === state.view));
  }
  const nicheIdea = o => {
    const niche = normalize(o.category);
    if (/кофе|кафе|пекар|кондитер|ресторан|фастфуд/.test(niche)) return ['меню, фото и маршрут', 'Красивое мобильное меню поможет гостям быстро увидеть ассортимент и найти заведение.'];
    if (/красот|парикмах|ателье|барбер/.test(niche)) return ['услуги, цены и запись', 'Страница с услугами, ценами и записью упростит первое знакомство.'];
    if (/стоматолог|клиник|ветеринар|аптек|физиотерап/.test(niche)) return ['список услуг, часы работы и запись', 'Страница с услугами, специалистами и способом записи поможет посетителям сориентироваться.'];
    if (/фитнес|спорт|танцев|йога|боулинг/.test(niche)) return ['расписание занятий и запись', 'Можно показать тренеров, стоимость и расписание на одном мобильном сайте.'];
    if (/агентств|тур|недвижим|юридич|бухгалтер|консалт|страхован/.test(niche)) return ['описание услуг и заявку на консультацию', 'Краткая страница с преимуществами и формой обращения поможет потенциальным клиентам.'];
    if (/обучен|школ|детск|репетитор/.test(niche)) return ['программы, расписание и запись', 'Можно удобно показать программы и стоимость занятий.'];
    if (/отель|гостев|хостел|мобил|проживани/.test(niche)) return ['номера, фотографии и бронирование', 'Визитка с услугами, условиями и кнопкой связи пригодится гостям.'];
    if (/цвет/.test(niche)) return ['каталог букетов и заказ', 'Небольшой каталог с фото и кнопкой заказа пригодится покупателям.'];
    if (/авто|ремонт|техник|мастерск/.test(niche)) return ['услуги и заявку', 'Страница с услугами и быстрой заявкой помогает клиенту связаться.'];
    if (/магазин|книж|подар|зоо|одежд/.test(niche)) return ['витрину товаров и контакты', 'Удобная мини-витрина покажет ассортимент и варианты связи.'];
    if (/фото/.test(niche)) return ['портфолио и запись', 'Портфолио с примерами работ и кнопкой связи покажет сильные стороны бизнеса.'];
    return ['услуги и контакты', 'Аккуратная мобильная страница с описанием услуг и контактами поможет клиентам.'];
  };
  function pitch(o,variant='short') {
    const [idea,explain] = nicheIdea(o);
    if(variant==='benefits') return `Здравствуйте! Нашёл «${o.name}» в ${o.city}. Я разрабатываю сайты для небольших компаний. Для вашей сферы предложил бы ${idea} — ${explain} Могу показать небольшой пример без обязательств?`;
    if(variant==='followup')return `Здравствуйте! Ранее писал насчёт идеи сайта для «${o.name}». Подскажите, актуально ли вам посмотреть короткий пример? Если сейчас неинтересно, не буду отвлекать.`;
    return `Здравствуйте! Увидел «${o.name}» в ${o.city}. Делаю сайты для небольших бизнесов. Есть идея: ${idea}. Могу показать пример?`;
  }
  document.addEventListener('click', async e => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const lead = action.closest('.lead'); if (!lead) return;
    const id = lead.dataset.id; const found = state.leads.find(x => x.id === id); if (!found) return;
    if(action.dataset.action==='schedule'){const target=new Date();target.setDate(target.getDate()+3);updateCRM(id,{nextDate:dateLocal(target),updatedAt:new Date().toISOString()});toast('Повторный контакт запланирован');return;}
    if (action.dataset.action === 'save') { updateCRM(id,{ saved: !getCRM(id).saved }); toast(getCRM(id).saved ? 'Добавлено в избранное' : 'Убрано из избранного'); }
    if (action.dataset.action === 'pitch') {
      const content = pitch(found,action.dataset.variant||'short');
      try { await navigator.clipboard.writeText(content); toast('Текст сообщения скопирован'); }
      catch { const t = document.createElement('textarea'); t.value = content; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); toast(ok ? 'Текст сообщения скопирован' : 'Открой сайт через HTTPS, чтобы копировать'); }
    }
  });
  $('list').addEventListener('change', e => { const root=e.target.closest('.lead'); if(!root)return; if(e.target.matches('[data-action="status"]')){ updateCRM(root.dataset.id,{status:e.target.value,updatedAt:new Date().toISOString()}); toast('Статус сохранён'); } else if(e.target.matches('[data-crm]')){const key=e.target.dataset.crm; if(!['priority','nextDate','verified','note','websiteChecked','channel','quote'].includes(key))return;const value=key==='verified'?e.target.checked:key==='quote'?Math.max(0,Math.min(5000000,Number(e.target.value)||0)):e.target.value;updateCRM(root.dataset.id,{[key]:value,updatedAt:new Date().toISOString(),...(key==='websiteChecked'?{verifiedAt:new Date().toISOString()}: {})}); toast('Карточка сохранена'); } });
  $('list').addEventListener('focusout',e=>{if(e.target.matches('textarea[data-crm="note"]')){const root=e.target.closest('.lead');if(root&&getCRM(root.dataset.id).note!==e.target.value)updateCRM(root.dataset.id,{note:e.target.value});}});
  $('searchInput').addEventListener('input', e => { state.query = e.target.value; render(); });
  [['cityFilter','city'],['nicheFilter','niche'],['siteFilter','website']].forEach(([id,key]) => $(id).addEventListener('change', e => { state[key] = e.target.value; if(key==='city'){state.citySearch='';$('cityQuickInput').value='';}pageLimit=80; render(); }));
  $('cityQuickInput').addEventListener('input', e=>{state.citySearch=e.target.value.trim();state.city='all';$('cityFilter').value='all';pageLimit=80;render();});
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { state.status = b.dataset.status; document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b)); render(); }));
  document.querySelectorAll('[data-view]').forEach(a => a.addEventListener('click', () => { state.view = a.dataset.view; render(); document.getElementById('leadsSection').scrollIntoView({behavior:'smooth',block:'start'}); }));
  window.addEventListener('hashchange', () => { const view = location.hash.slice(1); if (['search','saved','pipeline'].includes(view)) { state.view=view; render(); }});
  $('refreshBtn').addEventListener('click', () => reload(true));
  $('showMoreLeads').addEventListener('click',()=>{pageLimit+=80;render();});
  $('sortLeads').addEventListener('change',e=>{sortMode=e.target.value;pageLimit=80;render();});
  $('withContacts').addEventListener('change',e=>{withContacts=e.target.checked;pageLimit=80;render();});
  $('confirmedNoSite').addEventListener('change',e=>{confirmedNoSite=e.target.checked;pageLimit=80;render();});
  $('scoutOverview').addEventListener('click',e=>{if(e.target.id==='scoutJumpDue'){onlyDue=true;$('dueOnly').checked=true;state.view='pipeline';render();$('leadsSection').scrollIntoView({behavior:'smooth',block:'start'});}});
  $('dueOnly').addEventListener('change',e=>{onlyDue=e.target.checked;pageLimit=80;render();});
  $('addLeadBtn').addEventListener('click',()=>{$('manualLeadDialog').hidden=!$('manualLeadDialog').hidden;});
  $('manualLeadForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);const name=String(f.get('name')||'').trim(),city=String(f.get('city')||'').trim();if(!name||!city)return toast('Нужны название и город');if(state.leads.some(o=>normalize(o.name)===normalize(name)&&normalize(o.city)===normalize(city)))return toast('Компания с таким названием и городом уже есть — открой её карточку');const lead={id:'manual:'+Date.now()+':'+Math.random().toString(36).slice(2,7),manual:true,name:name.slice(0,120),city:city.slice(0,90),category:String(f.get('category')||'Другое').trim().slice(0,80),telegram:String(f.get('telegram')||'').trim().slice(0,180),vk:String(f.get('vk')||'').trim().slice(0,180),phone:String(f.get('phone')||'').trim().slice(0,60),website:safeUrl(String(f.get('website')||'')),site_status:safeUrl(String(f.get('website')||''))?'yes':'unknown',first_seen:new Date().toISOString()}; manual.push(lead);saveManual();state.leads.push(lead);fillFilters();render();e.currentTarget.reset();$('manualLeadDialog').hidden=true;toast('Компания добавлена в личную базу');});
  const download=(name,contents,type='application/json')=>{const url=URL.createObjectURL(new Blob([contents],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);};
  $('backupCrmBtn').addEventListener('click',()=>{download('poly-scout-crm-backup-v9.json',JSON.stringify({version:9,exportedAt:new Date().toISOString(),crm,manual},null,2));toast('Резервная копия CRM создана');});
  $('restoreCrmBtn').addEventListener('click',()=>$('restoreCrmFile').click());
  $('restoreCrmFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5_000_000)throw Error('Слишком большой файл');const backup=JSON.parse(await file.text());if(!backup||!backup.crm||typeof backup.crm!=='object'||Array.isArray(backup.crm)||!Array.isArray(backup.manual))throw Error('Неверный формат');if(!confirm('Восстановить данные CRM? Текущие локальные заметки и статусы будут заменены.'))return;crm=backup.crm;manual=backup.manual.filter(x=>x&&x.manual&&x.name&&x.city).slice(0,5000);localStorage.setItem(STORAGE,JSON.stringify(crm));saveManual();mergeData({leads:state.leads.filter(o=>!o.manual)});toast('Резервная копия восстановлена');}catch(err){toast('Не удалось восстановить CRM: '+err.message);}finally{e.target.value='';}});
  $('exportBtn').addEventListener('click', () => {
    const rows = [['Название','Город','Ниша','Адрес','Телефон','Telegram','ВКонтакте','Email','Сайт','Статус','Проверка сайта','Следующий контакт','Цена предложения','Канал','Заметка','Источник'], ...visible().map(o => [o.name,o.city,o.category,o.address,o.phone,o.telegram,o.vk,o.email,o.website,labels[getCRM(o.id).status] || 'Не писал',getCRM(o.id).websiteChecked||'unknown',getCRM(o.id).nextDate||'',getCRM(o.id).quote||'',getCRM(o.id).channel||'',getCRM(o.id).note||'',o.source_url || o.source])];
    const csv = '\ufeff' + rows.map(r => r.map(c => { let val=String(c || ''); if (/^[=+@\-\t\r]/.test(val)) val="'"+val; return '"' + val.replace(/"/g,'""') + '"'; }).join(';')).join('\r\n');
    const href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); const a = document.createElement('a'); a.href=href; a.download='poly-scout-leads.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(href),2000); toast('CSV сформирован');
  });
  $('todayDate').textContent = new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(new Date()).toUpperCase();
  const initialView = location.hash.slice(1); if (['search','saved','pipeline'].includes(initialView)) state.view = initialView;
  fillFilters(); render(); if (window.POLY_LIVE_DATA) mergeData(window.POLY_LIVE_DATA); reload();
})();
