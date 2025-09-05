// Minimal tab switcher for Trainer Dashboard (placeholder only)
(function(){
  // Snapshot ultimo stato salvato della scheda (per Annulla modifiche)
  let savedSchedaSnapshot = null;
  // Reset UI di sessioni/esercizi quando cambia scheda o cliente
  function resetSessionsUI(){
    try {
      const sessWrap = document.getElementById('sessioniList');
      if (sessWrap) sessWrap.innerHTML = '';
      const exPanel = document.getElementById('exercisesPanel');
      if (exPanel) { exPanel.style.display = 'none'; exPanel.dataset.sid = ''; }
      const exList = document.getElementById('exercisesList');
      if (exList) exList.innerHTML = '';
      const sessForm = document.getElementById('sessQuickForm');
      const sessBtn = document.getElementById('btnToggleSessForm');
      if (sessForm) sessForm.classList.add('hidden');
      if (sessBtn) sessBtn.textContent = '＋';
    } catch (_) {}
  }
  function selectTab(name){
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===name));
    document.querySelectorAll('.tab-pane').forEach(p=>p.classList.toggle('active', p.id===`tab-${name}`));
  }
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.tab-btn');
    if(btn){ selectTab(btn.dataset.tab); }
  });

  async function fetchClients(status='all', search=''){
    const params = new URLSearchParams();
    if(status) params.set('status', status);
    if(search) params.set('search', search);
    const incAdmins = document.getElementById('includeAdmins');
    if (incAdmins && incAdmins.checked) params.set('includeAdmins','1');
    if (window.API && typeof window.API.request === 'function') {
      const data = await window.API.request(`/clients?${params.toString()}`);
      return data.clients || [];
    }
    // Fallback (dev only): try relative path
    const res = await fetch(`/api/clients?${params.toString()}`);
    if(!res.ok) throw new Error('Errore recupero clienti');
    const data = await res.json();
    return data.clients || [];
  }

  async function loadClients(){
    const status = (document.getElementById('statusFilter')?.value) || 'all';
    const clients = await fetchClients(status);
    const sel = document.getElementById('clientSelect');
    if(!sel) return;
    sel.innerHTML = '<option value="">Seleziona cliente…</option>' +
      clients.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}${c.active?'':' (non attivo)'}</option>`).join('');
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  }

  document.addEventListener('change', (e)=>{
    if(e.target && e.target.id==='statusFilter'){
      loadClients().catch(()=>{});
    }
    if(e.target && e.target.id==='includeAdmins'){
      loadClients().catch(()=>{});
    }
    if(e.target && e.target.id==='clientSelect'){
      TrainerPage.loadSchede().catch(()=>{});
    }
  });

  // Listener separato per il toggle "Mostra solo cancellate"
  document.addEventListener('change', (e)=>{
    if(e.target && e.target.id==='schedeShowDeleted'){
      TrainerPage.loadSchede().catch(()=>{});
    }
  });

  // ===== Schede (left list + detail form) =====
  async function fetchSchedeForClient(userId){
    if (!userId) return [];
    const showDeleted = document.getElementById('schedeShowDeleted')?.checked || false;
    const qs = new URLSearchParams({ user_id: userId });
    if (showDeleted) qs.set('onlyDeleted','1');
    const path = `/schede?${qs.toString()}`;
    if (window.API && typeof window.API.request === 'function'){
      const data = await window.API.request(path);
      return data.schede || [];
    }
    const res = await fetch(`/api${path}`);
    const data = await res.json();
    return data.schede || [];
  }

  function renderSchedeList(items){
    const wrap = document.getElementById('schedeListContainer');
    const count = document.getElementById('schedeCount');
    if (!wrap) return;
    count && (count.textContent = items.length);
    if (!items.length){
      wrap.innerHTML = '<div class="scheda-item"><div class="title">Nessuna scheda</div><div class="meta">Crea una nuova scheda</div></div>';
      return;
    }
    wrap.innerHTML = items.map(s => `
      <div class="scheda-item ${s.attiva ? 'state-active' : 'state-inactive'}" data-id="${s.id}">
        <div class="title">${escapeHtml(s.titolo || '(senza titolo)')}</div>
        <div class="meta">${s.attiva ? 'Attiva' : 'Non attiva'} • ${s.durata_settimane || '-'} sett • ${s.sessioni_settimana || 0}/set</div>
      </div>
    `).join('');
  }

  function bindSchedeList(items){
    const wrap = document.getElementById('schedeListContainer');
    if (!wrap) return;
    // Usa un solo handler stabile
    wrap.onclick = (e) => {
      const item = e.target.closest('.scheda-item');
      if (!item || !wrap.contains(item)) return;
      const id = item.dataset.id;
      const sel = items.find(x=>x.id===id);
      if (sel) {
        fillSchedaForm(sel);
        // snapshot per Annulla modifiche
        savedSchedaSnapshot = { ...sel };
        if (typeof updateSchedaButtonsState === 'function') updateSchedaButtonsState();
        // Cambiando scheda: pulisci e ricarica Sessioni/Esercizi per la nuova scheda
        resetSessionsUI();
        loadSessioni().catch(console.error);
      }
      wrap.querySelectorAll('.scheda-item').forEach(el=>el.classList.toggle('active', el===item));
    };
  }

  function fillSchedaForm(s){
    (document.getElementById('scId')||{}).value = s?.id || '';
    (document.getElementById('scTitolo')||{}).value = s?.titolo || '';
    (document.getElementById('scAutore')||{}).value = s?.autore || '';
    (document.getElementById('scDurata')||{}).value = s?.durata_settimane ?? '';
    (document.getElementById('scFreq')||{}).value = s?.sessioni_settimana ?? '';
    const att = document.getElementById('scAttiva'); if (att) att.checked = !!s?.attiva;
    (document.getElementById('scDescr')||{}).value = s?.descrizione || '';
    (document.getElementById('scNote')||{}).value = s?.note || '';
    // Gating UI sessioni: consentite solo se scheda ha id
    const id = s?.id || '';
    const lockNotice = document.getElementById('sessLockNotice');
    const toggleBtn = document.getElementById('btnToggleSessForm');
    const addBtn = document.getElementById('btnAddSessione');
    if (id) {
      lockNotice && (lockNotice.style.display = 'none');
      toggleBtn && (toggleBtn.disabled = false);
      addBtn && (addBtn.disabled = false);
    } else {
      lockNotice && (lockNotice.style.display = 'inline');
      toggleBtn && (toggleBtn.disabled = true);
      addBtn && (addBtn.disabled = true);
    }
    // Pulsante ripristina visibile se soft-deleted o filtro solo cancellate attivo
    const btnRestore = document.getElementById('btnRipristinaScheda');
    const onlyDeleted = document.getElementById('schedeShowDeleted')?.checked || false;
    if (btnRestore) btnRestore.style.display = (!id || (s?.attiva === false) || onlyDeleted) ? '' : 'none';
  }

  async function loadSchede(){
    const userId = document.getElementById('clientSelect')?.value || '';
    // Pulisci subito il form per evitare di vedere dati del cliente precedente
    fillSchedaForm({});
    if (!userId){
      renderSchedeList([]);
      resetSessionsUI();
      updateSchedaButtonsState && updateSchedaButtonsState();
      return;
    }
    const items = await fetchSchedeForClient(userId);
    renderSchedeList(items);
    bindSchedeList(items);
    if (items[0]) {
      fillSchedaForm(items[0]);
      savedSchedaSnapshot = { ...items[0] };
      const first = document.querySelector('#schedeListContainer .scheda-item');
      first && first.classList.add('active');
      // Carica la lista sessioni per la prima scheda del cliente selezionato
      await loadSessioni();
    } else {
      // Nessuna scheda per questo cliente: assicurati che il form resti pulito
      fillSchedaForm({});
      resetSessionsUI();
      savedSchedaSnapshot = null;
    }
    updateSchedaButtonsState && updateSchedaButtonsState();
  }

  async function saveScheda(asNew=false){
    const userId = document.getElementById('clientSelect')?.value || '';
    if (!userId) return;
    const payload = {
      user_id: userId,
      titolo: document.getElementById('scTitolo')?.value || '',
      descrizione: document.getElementById('scDescr')?.value || '',
      autore: document.getElementById('scAutore')?.value || '',
      durata_settimane: document.getElementById('scDurata')?.value || null,
      sessioni_settimana: document.getElementById('scFreq')?.value || null,
      attiva: document.getElementById('scAttiva')?.checked || false,
      note: document.getElementById('scNote')?.value || ''
    };
    const currentId = document.getElementById('scId')?.value || '';
    if (asNew || !currentId){
      const res = await window.API.request('/schede', { method:'POST', body: JSON.stringify(payload) });
      fillSchedaForm(res.scheda || {});
      savedSchedaSnapshot = { ...(res.scheda || {}) };
    } else {
      const res = await window.API.request(`/schede/${encodeURIComponent(currentId)}`, { method:'PUT', body: JSON.stringify(payload) });
      fillSchedaForm(res.scheda || {});
      savedSchedaSnapshot = { ...(res.scheda || {}) };
    }
    await loadSchede();
  }

  async function deleteScheda(){
    const id = document.getElementById('scId')?.value || '';
    if (!id) return;
    if (!confirm('Cestinare questa scheda?')) return;
    await window.API.request(`/schede/${encodeURIComponent(id)}`, { method:'DELETE' });
    fillSchedaForm({});
    await loadSchede();
    savedSchedaSnapshot = null;
  }

  async function restoreScheda(){
    const id = document.getElementById('scId')?.value || '';
    if (!id) return;
    try {
      await window.API.request(`/schede/${encodeURIComponent(id)}/restore`, { method:'POST' });
    } catch (e) {
      try {
        await window.API.request(`/schede/${encodeURIComponent(id)}`, { method:'PUT', body: JSON.stringify({ attiva: true, deleted: false }) });
      } catch (_) {}
    }
    await loadSchede();
    if (window.Utils && Utils.showSuccess) Utils.showSuccess('Scheda ripristinata');
  }

  function bindSchedeButtons(){
    const bNew = document.getElementById('btnNuovaScheda');
    const bSave = document.getElementById('btnSalvaScheda');
    const bCancel = document.getElementById('btnAnnullaScheda');
    // Nota: il bottone 'Salva come Nuova' può essere nascosto in UI,
    // ma lasciamo attivo il binding per riabilitarlo facilmente in futuro.
    const bSaveCopy = document.getElementById('btnSalvaCopiaScheda');
    const bDel = document.getElementById('btnCancellaScheda');
    const bRestore = document.getElementById('btnRipristinaScheda');
    bNew && (bNew.onclick = ()=> {
      // Nuova scheda: azzera anche sessioni ed esercizi
      fillSchedaForm({ attiva:true });
      resetSessionsUI();
      updateSchedaButtonsState();
    });
    bSave && (bSave.onclick = ()=> saveScheda(false).then(()=>{
      if (window.Utils && Utils.showSuccess) Utils.showSuccess('Scheda salvata');
    }).catch(err=>{
      console.error(err);
      if (window.Utils && Utils.showError) Utils.showError('Errore salvataggio scheda');
    }));
    bCancel && (bCancel.onclick = ()=>{
      if (!savedSchedaSnapshot) { fillSchedaForm({}); resetSessionsUI(); return; }
      fillSchedaForm(savedSchedaSnapshot);
    });
    bSaveCopy && (bSaveCopy.onclick = async ()=>{
      const id = document.getElementById('scId')?.value || '';
      if (id) {
        const res = await window.API.request(`/schede/${encodeURIComponent(id)}/clone`, { method:'POST' });
        fillSchedaForm(res.scheda || {});
        await loadSchede();
        if (window.Utils && Utils.showSuccess) Utils.showSuccess('Copia scheda creata');
      } else {
        await saveScheda(true);
        if (window.Utils && Utils.showSuccess) Utils.showSuccess('Scheda salvata come nuova');
      }
    });
    bDel && (bDel.onclick = ()=> deleteScheda().then(()=>{
      if (window.Utils && Utils.showSuccess) Utils.showSuccess('Scheda cestinata. Usa "Ripristina" per recuperarla.');
    }).catch(err=>{
      console.error(err);
      if (window.Utils && Utils.showError) Utils.showError('Errore cestinamento scheda');
    }));
    bRestore && (bRestore.onclick = ()=> restoreScheda().catch(console.error));

    // Aggiorna stato bottoni al load
    updateSchedaButtonsState();

    // Abilita/disabilita in base agli input
    const form = document.getElementById('schedaForm');
    form && form.addEventListener('input', updateSchedaButtonsState);
  }

  bindSchedeButtons();

  function updateSchedaButtonsState(){
    const clientId = document.getElementById('clientSelect')?.value || '';
    const titolo = document.getElementById('scTitolo')?.value || '';
    const id = document.getElementById('scId')?.value || '';
    const bNew = document.getElementById('btnNuovaScheda');
    const bSave = document.getElementById('btnSalvaScheda');
    const bSaveCopy = document.getElementById('btnSalvaCopiaScheda');
    const bDel = document.getElementById('btnCancellaScheda');
    const bToggleSess = document.getElementById('btnToggleSessForm');
    const bAddSess = document.getElementById('btnAddSessione');
    const lockNotice = document.getElementById('sessLockNotice');
    // Regole minime
    const canEdit = !!clientId;
    const canSave = canEdit && titolo.trim().length > 0;
    const canDelete = canEdit && id.trim().length > 0;
    if (bNew) bNew.disabled = !canEdit;
    if (bSave) bSave.disabled = !canSave;
    if (bSaveCopy) bSaveCopy.disabled = !canSave; // consenti copia anche senza id -> diventa nuova
    if (bDel) bDel.disabled = !canDelete;
    const hasId = id.trim().length > 0;
    if (bToggleSess) bToggleSess.disabled = !hasId;
    if (bAddSess) bAddSess.disabled = !hasId;
    if (lockNotice) lockNotice.style.display = hasId ? 'none' : 'inline';
  }

  window.TrainerPage = { loadClients, loadSchede };

  // ===== Sessioni della scheda =====
  async function loadSessioni(){
    const schedaId = document.getElementById('scId')?.value || '';
    if (!schedaId){
      const list = document.getElementById('sessioniList');
      if (list) list.innerHTML = '';
      return;
    }
    // 1) recupera sessioni
    const data = await window.API.request(`/schede/${encodeURIComponent(schedaId)}/sessioni`);
    const items = data.sessioni || [];
    // 2) per ciascuna sessione, carica esercizi in parallelo
    const enriched = await Promise.all(items.map(async (s)=>{
      try {
        const exData = await window.API.request(`/schede/${encodeURIComponent(schedaId)}/sessioni/${encodeURIComponent(s.id)}/exercises`);
        s.exercises = exData.exercises || [];
      } catch (_) { s.exercises = []; }
      return s;
    }));
    renderSessioniNested(enriched);
  }

  async function addSessione(){
    const schedaId = document.getElementById('scId')?.value || '';
    const name = document.getElementById('sessName')?.value || '';
    const description = document.getElementById('sessDesc')?.value || '';
    if (!schedaId || !name.trim()) return;
    await window.API.request(`/schede/${encodeURIComponent(schedaId)}/sessioni`, { method:'POST', body: JSON.stringify({ name, description }) });
    document.getElementById('sessName').value='';
    const d = document.getElementById('sessDesc'); if (d) d.value='';
    await loadSessioni();
    // chiudi il mini-form dopo inserimento
    const f = document.getElementById('sessQuickForm');
    const t = document.getElementById('btnToggleSessForm');
    f && f.classList.add('hidden');
    if (t) t.textContent = '＋';
  }

  async function deleteSessione(sid){
    const schedaId = document.getElementById('scId')?.value || '';
    if (!schedaId || !sid) return;
    if (!confirm('Eliminare questa sessione?')) return;
    await window.API.request(`/schede/${encodeURIComponent(schedaId)}/sessioni/${encodeURIComponent(sid)}`, { method:'DELETE' });
    await loadSessioni();
  }

  // Rendering nested: sessioni con esercizi visibili sotto
  function renderSessioniNested(items){
    const wrap = document.getElementById('sessioniList');
    if (!wrap) return;
    wrap.innerHTML = items.map(s => `
      <div class="sessione-item" data-id="${s.id}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;">
          <div>
            <div class="sessione-title">${escapeHtml(s.name || '(senza nome)')}</div>
            ${s.description ? `<div class=\"sessione-desc\" style=\"color:#6b7280;font-size:.9rem;\">${escapeHtml(s.description)}</div>` : ''}
            <div class="sessione-meta">${new Date(s.created_at).toLocaleDateString()}</div>
          </div>
          <div class="sessione-actions">
            <button class="btn-secondary btn-sm" data-act="ex-toggle">＋</button>
            <button class="btn-secondary btn-sm" data-act="sess-edit">Modifica</button>
            <button class="btn-danger btn-sm" data-act="sess-del">Elimina</button>
          </div>
        </div>
        <div class="ex-quick-form hidden" data-role="ex-form" style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:.5rem 0;">
          <input type="text" class="form-input ex-name" placeholder="Nome esercizio" style="width:180px" />
          <input type="number" class="form-input ex-sets" placeholder="Serie" style="width:70px" />
          <input type="number" class="form-input ex-reps" placeholder="Reps" style="width:70px" />
          <input type="number" class="form-input ex-weight" placeholder="Peso" style="width:70px" />
          <input type="number" class="form-input ex-recovery" placeholder="Rec (s)" style="width:80px" />
          <input type="number" class="form-input ex-intensity" placeholder="Intensità" style="width:90px" />
          <input type="url" class="form-input ex-url" placeholder="URL (video)" style="width:180px" />
          <button class="btn-primary btn-sm" data-act="ex-add">Aggiungi</button>
        </div>
        <div class="exercises-list">
          ${(s.exercises||[]).map(ex => `
            <div class="exercise-row" data-id="${ex.id}">
              <div class="exercise-name">${escapeHtml(ex.name)}</div>
              <div>${ex.sets || '-'}x</div>
              <div>${ex.reps || '-'} rep</div>
              <div>${(ex.weight ?? '-')}${ex.weight ? ' kg' : ''}</div>
              <div>${ex.recovery ?? '-' }${ex.recovery ? ' s' : ''}</div>
              <div>${ex.intensity ?? '-'}</div>
              <div>${ex.url ? `<a href="${escapeHtml(ex.url)}" target="_blank" rel="noopener">link</a>` : '-'}</div>
              <div class="exercise-actions">
                <button class="btn-secondary btn-sm" data-act="ex-edit">Modifica</button>
                <button class="btn-danger btn-sm" data-act="ex-del">Elimina</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Delegation per tutte le azioni (sessioni + esercizi)
    wrap.onclick = async (e) => {
      const sessEl = e.target.closest('.sessione-item');
      if (!sessEl || !wrap.contains(sessEl)) return;
      const schedaId = document.getElementById('scId')?.value || '';
      const sid = sessEl.dataset.id;
      const act = e.target.getAttribute('data-act');
      if (!act) return;
      // Toggles
      if (act === 'ex-toggle') {
        const form = sessEl.querySelector('[data-role="ex-form"]');
        const btn = e.target;
        if (form) {
          const hidden = form.classList.toggle('hidden');
          btn.textContent = hidden ? '＋' : '×';
        }
        return;
      }
      // Sessione: elimina
      if (act === 'sess-del') { await deleteSessione(sid); return; }
      // Sessione: entra in edit inline (nome + descrizione)
      if (act === 'sess-edit') {
        // se esiste già un form, non ricrearlo
        let form = sessEl.querySelector('.sess-edit-form');
        if (form) { form.classList.remove('hidden'); return; }
        const current = sessEl.querySelector('.sessione-title')?.textContent || '';
        const curDesc = sessEl.querySelector('.sessione-desc')?.textContent || '';
        form = document.createElement('div');
        form.className = 'sess-edit-form';
        form.style.cssText = 'display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:.5rem 0;';
        form.innerHTML = `
          <input type="text" class="form-input sess-name-input" placeholder="Nome sessione*" style="max-width:280px" value="${escapeHtml(current)}" />
          <input type="text" class="form-input sess-desc-input" placeholder="Descrizione (opzionale)" style="max-width:360px" value="${escapeHtml(curDesc)}" />
          <button class="btn-primary btn-sm" data-act="sess-save">Salva</button>
          <button class="btn-secondary btn-sm" data-act="sess-cancel">Annulla</button>
        `;
        const exForm = sessEl.querySelector('[data-role="ex-form"]');
        if (exForm && exForm.parentNode) exForm.parentNode.insertBefore(form, exForm);
        else sessEl.appendChild(form);
        return;
      }
      // Sessione: salva modifiche inline
      if (act === 'sess-save') {
        const form = sessEl.querySelector('.sess-edit-form');
        if (!form) return;
        const name = form.querySelector('.sess-name-input')?.value || '';
        const description = form.querySelector('.sess-desc-input')?.value || '';
        if (!name.trim()) return;
        await window.API.request(`/schede/${encodeURIComponent(schedaId)}/sessioni/${encodeURIComponent(sid)}`, { method:'PUT', body: JSON.stringify({ name: name.trim(), description: description.trim() }) });
        await loadSessioni();
        return;
      }
      // Sessione: annulla edit inline
      if (act === 'sess-cancel') {
        const form = sessEl.querySelector('.sess-edit-form');
        if (form) form.remove();
        return;
      }
      // Esercizi: aggiungi
      if (act === 'ex-add') {
        const form = sessEl.querySelector('[data-role="ex-form"]');
        if (!form) return;
        const payload = {
          name: form.querySelector('.ex-name')?.value || '',
          sets: parseInt(form.querySelector('.ex-sets')?.value || '0'),
          reps: parseInt(form.querySelector('.ex-reps')?.value || '0'),
          weight: (form.querySelector('.ex-weight')?.value ? parseFloat(form.querySelector('.ex-weight').value) : null),
          recovery: (form.querySelector('.ex-recovery')?.value ? parseInt(form.querySelector('.ex-recovery').value) : null),
          intensity: (form.querySelector('.ex-intensity')?.value ? parseInt(form.querySelector('.ex-intensity').value) : null),
          url: (form.querySelector('.ex-url')?.value || '').trim() || null
        };
        if (!payload.name || !payload.sets || !payload.reps) return;
        await window.API.request(`/schede/${encodeURIComponent(schedaId)}/sessioni/${encodeURIComponent(sid)}/exercises`, { method:'POST', body: JSON.stringify(payload) });
        // reset & richiudi
        ['ex-name','ex-sets','ex-reps','ex-weight','ex-recovery','ex-intensity','ex-url'].forEach(cls => { const el = form.querySelector('.'+cls); if (el) el.value=''; });
        form.classList.add('hidden');
        const toggleBtn = sessEl.querySelector('[data-act="ex-toggle"]'); if (toggleBtn) toggleBtn.textContent = '＋';
        await loadSessioni();
        return;
      }
      // Esercizi: elimina
      if (act === 'ex-del') {
        const row = e.target.closest('.exercise-row');
        const eid = row?.dataset?.id;
        if (!eid) return;
        if (!confirm('Eliminare questo esercizio?')) return;
        await window.API.request(`/schede/${encodeURIComponent(schedaId)}/sessioni/${encodeURIComponent(sid)}/exercises/${encodeURIComponent(eid)}`, { method:'DELETE' });
        await loadSessioni();
        return;
      }
      // Esercizi: entra in edit inline
      if (act === 'ex-edit') {
        const row = e.target.closest('.exercise-row');
        if (!row) return;
        // evita doppio form
        if (row.nextElementSibling && row.nextElementSibling.classList?.contains('ex-edit-form')) return;
        const curName = row.querySelector('.exercise-name')?.textContent || '';
        const curSets = (row.children[1]?.textContent || '').replace('x','').trim();
        const curReps = (row.children[2]?.textContent || '').replace(' rep','').trim();
        const curWeight = (row.children[3]?.textContent || '').replace(' kg','').trim();
        const curRecovery = (row.children[4]?.textContent || '').replace(' s','').trim();
        const curIntensity = (row.children[5]?.textContent || '').trim();
        const linkEl = row.children[6]?.querySelector('a');
        const curUrl = linkEl ? linkEl.getAttribute('href') : '';
        const form = document.createElement('div');
        form.className = 'ex-edit-form';
        form.style.cssText = 'display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:.25rem 0 .5rem 0;';
        form.innerHTML = `
          <input type=\"text\" class=\"form-input ex-name\" style=\"width:180px\" value=\"${escapeHtml(curName)}\" />
          <input type=\"number\" class=\"form-input ex-sets\" style=\"width:70px\" value=\"${escapeHtml(curSets)}\" />
          <input type=\"number\" class=\"form-input ex-reps\" style=\"width:70px\" value=\"${escapeHtml(curReps)}\" />
          <input type=\"number\" class=\"form-input ex-weight\" style=\"width:70px\" value=\"${escapeHtml(curWeight)}\" />
          <input type=\"number\" class=\"form-input ex-recovery\" style=\"width:80px\" value=\"${escapeHtml(curRecovery)}\" />
          <input type=\"number\" class=\"form-input ex-intensity\" style=\"width:90px\" value=\"${escapeHtml(curIntensity)}\" />
          <input type=\"url\" class=\"form-input ex-url\" style=\"width:180px\" value=\"${escapeHtml(curUrl)}\" />
          <button class=\"btn-primary btn-sm\" data-act=\"ex-save\">Salva</button>
          <button class=\"btn-secondary btn-sm\" data-act=\"ex-cancel\">Annulla</button>
        `;
        row.parentNode.insertBefore(form, row.nextSibling);
        return;
      }
      // Esercizi: salva modifiche inline
      if (act === 'ex-save') {
        const form = e.target.closest('.ex-edit-form');
        if (!form) return;
        const row = form.previousElementSibling;
        const eid = row?.dataset?.id;
        const name = form.querySelector('.ex-name')?.value || '';
        const sets = parseInt(form.querySelector('.ex-sets')?.value || '0');
        const reps = parseInt(form.querySelector('.ex-reps')?.value || '0');
        const weightStr = form.querySelector('.ex-weight')?.value;
        const weight = weightStr ? parseFloat(weightStr) : null;
        const recoveryStr = form.querySelector('.ex-recovery')?.value;
        const recovery = recoveryStr ? parseInt(recoveryStr) : null;
        const intensityStr = form.querySelector('.ex-intensity')?.value;
        const intensity = intensityStr ? parseInt(intensityStr) : null;
        const url = (form.querySelector('.ex-url')?.value || '').trim() || null;
        if (!eid || !name.trim() || !sets || !reps) return;
        await window.API.request(`/schede/${encodeURIComponent(schedaId)}/sessioni/${encodeURIComponent(sid)}/exercises/${encodeURIComponent(eid)}`, {
          method:'PUT', body: JSON.stringify({ name: name.trim(), sets, reps, weight, recovery, intensity, url })
        });
        await loadSessioni();
        return;
      }
      // Esercizi: annulla edit inline
      if (act === 'ex-cancel') {
        const form = e.target.closest('.ex-edit-form');
        if (form) form.remove();
        return;
      }
    };
  }

  // Bind quick-add session button
  document.getElementById('btnAddSessione')?.addEventListener('click', ()=> addSessione().catch(console.error));
  // Toggle per mini-form globale sessione
  function toggle(eid, btnId){
    const el = document.getElementById(eid);
    const btn = document.getElementById(btnId);
    if (!el || !btn) return;
    const isHidden = el.classList.toggle('hidden');
    btn.textContent = isHidden ? '＋' : '×';
  }
  document.getElementById('btnToggleSessForm')?.addEventListener('click', ()=> toggle('sessQuickForm','btnToggleSessForm'));

  // Quando si seleziona una scheda, ricarica anche le sessioni
  const formIdEl = document.getElementById('scId');
  formIdEl && formIdEl.addEventListener('change', ()=> loadSessioni().catch(console.error));

})();
