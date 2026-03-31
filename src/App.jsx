import { useState, useMemo } from "react";

const uid = () => Math.random().toString(36).slice(2, 8);
const fmt = (n) => `¥${Number(n || 0).toLocaleString("ja-JP")}`;
const INIT = { motouke: [], sagyoin: [], anken: [], entries: [] };
const toYM = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const fmtYM = (ym) => { const [y, m] = ym.split("-"); return `${y}年${Number(m)}月`; };
const currentYM = () => toYM(new Date());
const toDateStr = (y, m, d) => `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const fmtDateShort = (ds) => { const [,m,d] = ds.split("-"); return `${Number(m)}/${Number(d)}`; };
function daysInMonth(year, month) { return new Date(year, month, 0).getDate(); }
function firstDayOfWeek(year, month) { return new Date(year, month - 1, 1).getDay(); }
function load() {
  try { return { ...INIT, ...JSON.parse(localStorage.getItem("stona-v5") || "{}") }; }
  catch { return INIT; }
}
function persist(d) {
  try { localStorage.setItem("stona-v5", JSON.stringify(d)); } catch {}
}
function calcEntry(entry) {
  const labor = (entry.kosu || []).reduce((s, k) => s + (Number(k.days) || 0) * (Number(k.dayRate) || 0), 0);
  const cost = (entry.costs || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const expense = (entry.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  return { labor, cost, expense, total: labor + cost + expense };
}
const C = {
  bg: "#0f0f0f", card: "#171717", border: "#222",
  accent: "#f0a500", text: "#e5e5e5", muted: "#5a5a5a", dim: "#2a2a2a",
  inputBg: "#1c1c1c",
};
const IS = {
  background: C.inputBg, border: `1px solid ${C.border}`, color: C.text,
  padding: "9px 12px", borderRadius: 6, fontSize: 14, outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const BP = {
  background: C.accent, color: "#111", border: "none",
  padding: "12px", borderRadius: 6, fontWeight: 800,
  cursor: "pointer", fontSize: 14, width: "100%", fontFamily: "inherit",
};
const BS = {
  background: C.dim, color: "#999", border: "none",
  padding: "8px 14px", borderRadius: 5, fontWeight: 600,
  cursor: "pointer", fontSize: 12, fontFamily: "inherit",
};
const BX = {
  background: "none", border: "1px solid #2a1a1a", color: "#774444",
  width: 30, height: 36, borderRadius: 4, cursor: "pointer",
  fontSize: 16, flexShrink: 0, fontFamily: "inherit",
};
function Divider() { return <div style={{ height: 1, background: C.border, margin: "4px 0" }} />; }
function Empty({ msg }) { return <div style={{ textAlign: "center", padding: "44px 0", color: C.muted, fontSize: 14, whiteSpace: "pre-line" }}>{msg}</div>; }
function STag({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", padding: "2px 8px", background: C.accent, color: "#111", borderRadius: 2 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}
function Lbl({ children }) {
  return <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.06em", marginBottom: 6 }}>{children}</div>;
}
const WEEKDAYS = ["日","月","火","水","木","金","土"];
function CalendarPicker({ ym, selectedDates, onChange }) {
  const [viewYM, setViewYM] = useState(ym || currentYM());
  const [year, month] = viewYM.split("-").map(Number);
  const totalDays = daysInMonth(year, month);
  const startDow = firstDayOfWeek(year, month);
  const prevMonth = () => { const d = new Date(year, month - 2, 1); setViewYM(toYM(d)); };
  const nextMonth = () => { const d = new Date(year, month, 1); setViewYM(toYM(d)); };
  const toggle = (ds) => {
    const cur = selectedDates || [];
    const next = cur.includes(ds) ? cur.filter(d => d !== ds) : [...cur, ds].sort();
    onChange(next);
  };
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  return (
    <div style={{ background: "#141414", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={prevMonth} style={{ ...BS, padding: "4px 10px" }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fmtYM(viewYM)}</span>
        <button onClick={nextMonth} style={{ ...BS, padding: "4px 10px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, paddingBottom: 4, color: i === 0 ? "#e06060" : i === 6 ? "#6090e0" : C.muted }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const ds = toDateStr(year, month, day);
          const isOn = (selectedDates || []).includes(ds);
          const dow = (startDow + day - 1) % 7;
          return (
            <button key={ds} onClick={() => toggle(ds)} style={{
              aspectRatio: "1", borderRadius: "50%", border: "none",
              cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: isOn ? 800 : 400,
              background: isOn ? C.accent : "transparent",
              color: isOn ? "#111" : dow === 0 ? "#e06060" : dow === 6 ? "#6090e0" : C.text,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{day}</button>
          );
        })}
      </div>
      {(selectedDates || []).length > 0 && (
        <div style={{ marginTop: 10, padding: "8px 10px", background: "#1a1200", borderRadius: 6 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>選択中 {selectedDates.length}日</div>
          <div style={{ fontSize: 12, color: C.accent, lineHeight: 1.8 }}>{selectedDates.map(ds => fmtDateShort(ds)).join("　")}</div>
        </div>
      )}
    </div>
  );
}
function MonthBar({ months, selected, onChange }) {
  return (
    <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "10px 20px", borderBottom: `1px solid ${C.border}`, scrollbarWidth: "none" }}>
      <button onClick={() => onChange("all")} style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontFamily: "inherit", fontWeight: selected === "all" ? 700 : 400, cursor: "pointer", border: selected === "all" ? `2px solid ${C.accent}` : `1px solid ${C.border}`, background: selected === "all" ? "#1a1200" : C.dim, color: selected === "all" ? C.accent : "#aaa" }}>全期間</button>
      {months.map(ym => (
        <button key={ym} onClick={() => onChange(ym)} style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontFamily: "inherit", fontWeight: selected === ym ? 700 : 400, cursor: "pointer", border: selected === ym ? `2px solid ${C.accent}` : `1px solid ${C.border}`, background: selected === ym ? "#1a1200" : C.dim, color: selected === ym ? C.accent : "#aaa" }}>{fmtYM(ym)}</button>
      ))}
    </div>
  );
}
function ChipSelector({ items, selected, multi, onSelect, onAdd, placeholder }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const isOn = (id) => multi ? (selected || []).includes(id) : selected === id;
  const handleAdd = () => { if (!newName.trim()) return; onAdd(newName.trim()); setNewName(""); setAdding(false); };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map(item => (
        <button key={item.id} onClick={() => onSelect(item.id)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: isOn(item.id) ? 700 : 400, border: isOn(item.id) ? `2px solid ${C.accent}` : `1px solid ${C.border}`, background: isOn(item.id) ? "#1a1200" : C.dim, color: isOn(item.id) ? C.accent : "#aaa" }}>{item.name}</button>
      ))}
      {adding ? (
        <div style={{ display: "flex", gap: 6, width: "100%" }}>
          <input autoFocus style={{ ...IS, flex: 1 }} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} placeholder={placeholder || "名前を入力"} />
          <button style={{ ...BS, padding: "8px 12px" }} onClick={handleAdd}>追加</button>
          <button style={{ ...BS, padding: "8px 10px" }} onClick={() => { setAdding(false); setNewName(""); }}>×</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: `1px dashed ${C.muted}`, background: "none", color: C.muted }}>＋ 新規追加</button>
      )}
    </div>
  );
}
function EntryForm({ entry, masters, onSave, onBack, onDelete, onMasterAdd }) {
  const [f, setF] = useState(entry);
  const selectSagyoin = (id) => {
    const current = f.sagyoinIds || [];
    const isOn = current.includes(id);
    const next = isOn ? current.filter(x => x !== id) : [...current, id];
    const kosu = next.map(sid => {
      const ex = (f.kosu || []).find(k => k.sagyoinId === sid);
      if (ex) return ex;
      const w = masters.sagyoin.find(w => w.id === sid);
      return { id: uid(), sagyoinId: sid, dates: [], dayRate: w?.dayRate || "" };
    });
    setF(p => ({ ...p, sagyoinIds: next, kosu }));
  };
  const updKosu = (id, key, val) => setF(p => ({ ...p, kosu: p.kosu.map(k => k.id === id ? { ...k, [key]: val } : k) }));
  const addCost = () => setF(p => ({ ...p, costs: [...(p.costs || []), { id: uid(), name: "", amount: "" }] }));
  const updCost = (id, key, val) => setF(p => ({ ...p, costs: p.costs.map(c => c.id === id ? { ...c, [key]: val } : c) }));
  const delCost = (id) => setF(p => ({ ...p, costs: p.costs.filter(c => c.id !== id) }));
  const addExp = () => setF(p => ({ ...p, expenses: [...(p.expenses || []), { id: uid(), name: "", amount: "" }] }));
  const updExp = (id, key, val) => setF(p => ({ ...p, expenses: p.expenses.map(e => e.id === id ? { ...e, [key]: val } : e) }));
  const delExp = (id) => setF(p => ({ ...p, expenses: p.expenses.filter(e => e.id !== id) }));
  const addMotouke = (name) => { const item = { id: uid(), name }; onMasterAdd("motouke", item); setF(p => ({ ...p, motoukeId: item.id })); };
  const addSagyoin = (name) => {
    const item = { id: uid(), name, dayRate: "" };
    onMasterAdd("sagyoin", item);
    const next = [...(f.sagyoinIds || []), item.id];
    const kosu = [...(f.kosu || []), { id: uid(), sagyoinId: item.id, dates: [], dayRate: "" }];
    setF(p => ({ ...p, sagyoinIds: next, kosu }));
  };
  const addAnken = (name) => { const item = { id: uid(), name }; onMasterAdd("anken", item); setF(p => ({ ...p, ankenId: item.id })); };
  const { labor, cost, expense, total } = calcEntry(f);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button style={BS} onClick={onBack}>← 一覧へ</button>
        {onDelete && (<button onClick={onDelete} style={{ background: "none", border: "1px solid #2a1a1a", color: "#774444", padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>削除</button>)}
      </div>
      <div><STag label="対象月" /><input type="month" style={IS} value={f.month || currentYM()} onChange={e => setF(p => ({ ...p, month: e.target.value }))} /></div>
      <Divider />
      <div><STag label="① 元請" /><ChipSelector items={masters.motouke} selected={f.motoukeId} multi={false} onSelect={id => setF(p => ({ ...p, motoukeId: p.motoukeId === id ? "" : id }))} onAdd={addMotouke} placeholder="例：松本建設" /></div>
      <Divider />
      <div>
        <STag label="② 作業員（複数選択可）" />
        <ChipSelector items={masters.sagyoin} selected={f.sagyoinIds || []} multi={true} onSelect={selectSagyoin} onAdd={addSagyoin} placeholder="例：田中 一郎" />
        {(f.kosu || []).length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 16 }}>
            {(f.kosu || []).map(k => {
              const w = masters.sagyoin.find(w => w.id === k.sagyoinId);
              const sub = (Number(k.days) || 0) * (Number(k.dayRate) || 0);
              return (
                <div key={k.id} style={{ background: "#1a1a1a", borderRadius: 8, padding: "12px 12px 14px" }}>
                  <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, marginBottom: 12 }}>{w?.name || "?"}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>施工日メモ（タップして記録）</div>
                  <CalendarPicker ym={f.month || currentYM()} selectedDates={k.dates || []} onChange={(dates) => updKosu(k.id, "dates", dates)} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                    <div><Lbl>工数（人工）</Lbl><input type="number" style={IS} value={k.days} placeholder="例：5" onChange={e => updKosu(k.id, "days", e.target.value)} /></div>
                    <div><Lbl>単価（円）</Lbl><input type="number" style={IS} value={k.dayRate} placeholder="例：25000" onChange={e => updKosu(k.id, "dayRate", e.target.value)} /></div>
                  </div>
                  <div style={{ marginTop: 8 }}><Lbl>メモ</Lbl><textarea style={{ ...IS, resize: "none", height: 64, fontSize: 13, lineHeight: 1.6 }} value={k.memo || ""} placeholder="備考・連絡事項など" onChange={e => updKosu(k.id, "memo", e.target.value)} /></div>
                  {sub > 0 && (<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "8px 10px", background: "#1a1200", borderRadius: 6 }}><span style={{ fontSize: 12, color: C.muted }}>{k.days}人工 × {fmt(k.dayRate)}</span><span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{fmt(sub)}</span></div>)}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Divider />
      <div><STag label="③ 案件" /><ChipSelector items={masters.anken} selected={f.ankenId} multi={false} onSelect={id => setF(p => ({ ...p, ankenId: p.ankenId === id ? "" : id }))} onAdd={addAnken} placeholder="例：高橋様邸 内装工事" /></div>
      <Divider />
      <div>
        <STag label="④ 原価（材料費など）" />
        {(f.costs || []).map(c => (<div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 30px", gap: 6, marginBottom: 6 }}><input style={IS} placeholder="内容" value={c.name} onChange={e => updCost(c.id, "name", e.target.value)} /><input type="number" style={IS} placeholder="金額" value={c.amount} onChange={e => updCost(c.id, "amount", e.target.value)} /><button style={BX} onClick={() => delCost(c.id)}>×</button></div>))}
        <button style={BS} onClick={addCost}>＋ 原価を追加</button>
        {cost > 0 && <div style={{ fontSize: 12, color: C.accent, textAlign: "right", marginTop: 6 }}>原価：{fmt(cost)}</div>}
      </div>
      <Divider />
      <div>
        <STag label="⑤ 経費" />
        {(f.expenses || []).map(e => (<div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 30px", gap: 6, marginBottom: 6 }}><input style={IS} placeholder="内容" value={e.name} onChange={ev => updExp(e.id, "name", ev.target.value)} /><input type="number" style={IS} placeholder="金額" value={e.amount} onChange={ev => updExp(e.id, "amount", ev.target.value)} /><button style={BX} onClick={() => delExp(e.id)}>×</button></div>))}
        <button style={BS} onClick={addExp}>＋ 経費を追加</button>
        {expense > 0 && <div style={{ fontSize: 12, color: C.accent, textAlign: "right", marginTop: 6 }}>経費：{fmt(expense)}</div>}
      </div>
      {total > 0 && (
        <div style={{ background: "#1a1200", border: `1px solid ${C.accent}`, borderRadius: 8, padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 3 }}><span>人工</span><span>{fmt(labor)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 3 }}><span>原価</span><span>{fmt(cost)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 10 }}><span>経費</span><span>{fmt(expense)}</span></div>
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: C.accent, marginTop: 8 }}><span>合計</span><span>{fmt(total)}</span></div>
        </div>
      )}
      <button style={BP} onClick={() => onSave(f)}>保存する</button>
    </div>
  );
}
function EntryCard({ entry, masters, onClick }) {
  const { total } = calcEntry(entry);
  const motouke = masters.motouke.find(m => m.id === entry.motoukeId);
  const anken = masters.anken.find(a => a.id === entry.ankenId);
  return (
    <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{anken?.name || "（案件未設定）"}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{motouke?.name || "元請未設定"}</div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>{fmt(total)}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {(entry.kosu || []).map(k => {
          const w = masters.sagyoin.find(w => w.id === k.sagyoinId);
          const days = (k.dates || []).length || Number(k.days) || 0;
          if (!w) return null;
          return (<span key={k.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.dim, color: "#999" }}>{w.name} {days}日</span>);
        })}
      </div>
    </div>
  );
}
function KojiListTab({ entries, data }) {
  if (entries.length === 0) return <Empty msg="この月の工事はありません" />;
  const { motouke, sagyoin, anken } = data;
  const ankenWithEntries = anken.map(a => ({ anken: a, entries: entries.filter(e => e.ankenId === a.id) })).filter(g => g.entries.length > 0);
  const noAnken = entries.filter(e => !anken.find(a => a.id === e.ankenId));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {ankenWithEntries.map(({ anken: ak, entries: es }) => {
        const totalDays = es.reduce((s, e) => s + (e.kosu || []).reduce((ss, k) => ss + ((k.dates||[]).length || Number(k.days)||0), 0), 0);
        const totalAmt = es.reduce((s, e) => s + calcEntry(e).total, 0);
        return (
          <div key={ak.id}>
            <div style={{ background: "#1a1200", border: `1px solid ${C.accent}33`, borderRadius: 8, padding: "12px 16px", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.accent }}>{ak.name}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>総工数 <span style={{ color: C.text, fontWeight: 600 }}>{totalDays}日</span></span>
                <span style={{ fontSize: 12, color: C.muted }}>合計 <span style={{ color: C.text, fontWeight: 600 }}>{fmt(totalAmt)}</span></span>
              </div>
            </div>
            {es.map(entry => {
              const mt = motouke.find(m => m.id === entry.motoukeId);
              return (
                <div key={entry.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px", marginBottom: 8 }}>
                  {mt && <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>元請：{mt.name}</div>}
                  {(entry.kosu || []).map(k => {
                    const w = sagyoin.find(w => w.id === k.sagyoinId);
                    const days = (k.dates || []).length || Number(k.days) || 0;
                    return (
                      <div key={k.id} style={{ marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#bbb", marginBottom: 2 }}>
                          <span>{w?.name || "?"}</span>
                          <span>{days}日 = {fmt(days * (Number(k.dayRate)||0))}</span>
                        </div>
                        {(k.dates || []).length > 0 && (<div style={{ fontSize: 11, color: C.muted, lineHeight: 1.8 }}>{k.dates.map(ds => fmtDateShort(ds)).join(" · ")}</div>)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
      {noAnken.map(entry => <EntryCard key={entry.id} entry={entry} masters={data} onClick={() => {}} />)}
    </div>
  );
}
function ShokuninListTab({ entries, data }) {
  if (entries.length === 0) return <Empty msg="この月の工事はありません" />;
  const { sagyoin, anken, motouke } = data;
  const workerStats = sagyoin.map(w => {
    const rows = [];
    entries.forEach(entry => {
      const k = (entry.kosu || []).find(k => k.sagyoinId === w.id);
      if (!k) return;
      const days = (k.dates || []).length || Number(k.days) || 0;
      if (!days) return;
      const ak = anken.find(a => a.id === entry.ankenId);
      const mt = motouke.find(m => m.id === entry.motoukeId);
      rows.push({ ankenName: ak?.name || "（案件未設定）", motoukeNmae: mt?.name || "", dates: k.dates || [], days, dayRate: Number(k.dayRate) || 0, subtotal: days * (Number(k.dayRate) || 0) });
    });
    return { worker: w, rows, totalDays: rows.reduce((s, r) => s + r.days, 0), totalAmt: rows.reduce((s, r) => s + r.subtotal, 0) };
  }).filter(ws => ws.rows.length > 0);
  if (workerStats.length === 0) return <Empty msg="この月の工数データがありません" />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {workerStats.map(({ worker, rows, totalDays, totalAmt }) => (
        <div key={worker.id}>
          <div style={{ background: "#121a1a", border: "1px solid #2a4a4a", borderRadius: 8, padding: "12px 16px", marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#5dd" }}>{worker.name}</div>
            <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: C.muted }}>総工数 <span style={{ color: C.text, fontWeight: 600 }}>{totalDays}人工</span></span>
              <span style={{ fontSize: 12, color: C.muted }}>合計人工 <span style={{ color: C.text, fontWeight: 600 }}>{fmt(totalAmt)}</span></span>
            </div>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: r.dates.length > 0 ? 6 : 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.ankenName}</div>
                  {r.motoukeNmae && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{r.motoukeNmae}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{fmt(r.subtotal)}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{r.days}日 × {fmt(r.dayRate)}</div>
                </div>
              </div>
              {r.dates.length > 0 && (<div style={{ fontSize: 11, color: C.muted, lineHeight: 1.8 }}>{r.dates.map(ds => fmtDateShort(ds)).join(" · ")}</div>)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
function ShuukeiTab({ entries, data, selectedMonth }) {
  const { motouke, sagyoin, anken } = data;
  const grand = entries.reduce((s, e) => s + calcEntry(e).total, 0);
  const grouped = motouke.map(m => ({ m, items: entries.filter(e => e.motoukeId === m.id) })).filter(g => g.items.length > 0);
  const ungrouped = entries.filter(e => !motouke.find(m => m.id === e.motoukeId));
  if (entries.length === 0) return <Empty msg="この月の工事はありません" />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {grouped.map(({ m, items }) => {
        const groupTotal = items.reduce((s, e) => s + calcEntry(e).total, 0);
        return (
          <div key={m.id}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>元請：{m.name}</div>
            {items.map(entry => {
              const { labor, cost, expense, total } = calcEntry(entry);
              const ak = anken.find(a => a.id === entry.ankenId);
              return (
                <div key={entry.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{ak?.name || "（案件未設定）"}</div>
                  {(entry.kosu || []).map(k => {
                    const w = sagyoin.find(w => w.id === k.sagyoinId);
                    const days = (k.dates || []).length || Number(k.days) || 0;
                    return (
                      <div key={k.id} style={{ marginBottom: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#aaa" }}>
                          <span>{w?.name} {days}日 × {fmt(k.dayRate)}</span>
                          <span>{fmt(days * (Number(k.dayRate)||0))}</span>
                        </div>
                        {(k.dates||[]).length > 0 && (<div style={{ fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.8 }}>{k.dates.map(ds => fmtDateShort(ds)).join(" · ")}</div>)}
                      </div>
                    );
                  })}
                  <Divider />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 2 }}><span>人工</span><span>{fmt(labor)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 2 }}><span>原価</span><span>{fmt(cost)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 8 }}><span>経費</span><span>{fmt(expense)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, color: C.accent }}><span>合計</span><span>{fmt(total)}</span></div>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 13, color: C.muted, marginBottom: 4 }}>
              {m.name} 小計：<span style={{ color: C.accent, fontWeight: 700, marginLeft: 8 }}>{fmt(groupTotal)}</span>
            </div>
            <Divider />
          </div>
        );
      })}
      {ungrouped.map(entry => {
        const { total } = calcEntry(entry);
        const ak = anken.find(a => a.id === entry.ankenId);
        return (<div key={entry.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>{ak?.name || "（案件未設定）"}</span><span style={{ color: C.accent, fontWeight: 700 }}>{fmt(total)}</span></div></div>);
      })}
      <div style={{ background: "#1a1200", border: `2px solid ${C.accent}`, borderRadius: 8, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: C.accent }}>{selectedMonth === "all" ? "全期間" : fmtYM(selectedMonth)} 合計</span>
        <span style={{ fontWeight: 900, fontSize: 26, color: C.accent }}>{fmt(grand)}</span>
      </div>
    </div>
  );
}
const TABS = [
  { key: "kiroku", label: "記録" },
  { key: "koji", label: "工事" },
  { key: "shokunin", label: "職人" },
  { key: "shuukei", label: "集計" },
];
export default function App() {
  const [data, setData] = useState(load);
  const [tab, setTab] = useState("kiroku");
  const [form, setForm] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentYM());
  const setDataP = (fn) => setData(prev => { const next = fn(prev); persist(next); return next; });
  const onMasterAdd = (type, item) => setDataP(d => ({ ...d, [type]: [...d[type], item] }));
  const months = useMemo(() => {
    const yms = new Set(data.entries.map(e => e.month || currentYM()));
    return [...yms].sort().reverse();
  }, [data.entries]);
  const filteredEntries = useMemo(() => {
    if (selectedMonth === "all") return data.entries;
    return data.entries.filter(e => (e.month || currentYM()) === selectedMonth);
  }, [data.entries, selectedMonth]);
  const openNew = () => setForm({ id: uid(), month: selectedMonth === "all" ? currentYM() : selectedMonth, motoukeId: "", sagyoinIds: [], ankenId: "", kosu: [], costs: [], expenses: [] });
  const openEdit = (entry) => setForm({ ...entry });
  const onSave = (entry) => {
    setDataP(d => ({ ...d, entries: d.entries.find(e => e.id === entry.id) ? d.entries.map(e => e.id === entry.id ? entry : e) : [...d.entries, entry] }));
    setForm(null);
  };
  const onDelete = (id) => {
    if (!window.confirm("この工事を削除しますか？")) return;
    setDataP(d => ({ ...d, entries: d.entries.filter(e => e.id !== id) }));
    setForm(null);
  };
  if (form) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Hiragino Sans','Noto Sans JP',sans-serif", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{data.entries.find(e => e.id === form.id) ? "工事を編集" : "工事を追加"}</div>
        </div>
        <div style={{ padding: 20 }}>
          <EntryForm entry={form} masters={data} onSave={onSave} onBack={() => setForm(null)} onDelete={data.entries.find(e => e.id === form.id) ? () => onDelete(form.id) : null} onMasterAdd={onMasterAdd} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Hiragino Sans','Noto Sans JP',sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 5, height: 20, background: C.accent, borderRadius: 2 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "0.04em" }}>工事・原価管理</div>
              <div style={{ fontSize: 10, color: C.muted }}>STONA</div>
            </div>
          </div>
          <div style={{ display: "flex" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, background: "none", border: "none", borderBottom: tab === t.key ? `2px solid ${C.accent}` : "2px solid transparent", color: tab === t.key ? C.accent : C.muted, fontWeight: tab === t.key ? 700 : 500, fontSize: 13, padding: "8px 0 10px", cursor: "pointer", fontFamily: "inherit" }}>{t.label}</button>
            ))}
          </div>
        </div>
        <MonthBar months={months} selected={selectedMonth} onChange={setSelectedMonth} />
      </div>
      <div style={{ padding: 20 }}>
        {tab === "kiroku" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredEntries.length === 0 && <Empty msg={selectedMonth === "all" ? "工事がまだありません" : `${fmtYM(selectedMonth)}の工事はありません`} />}
            {filteredEntries.map(entry => (<EntryCard key={entry.id} entry={entry} masters={data} onClick={() => openEdit(entry)} />))}
          </div>
        )}
        {tab === "koji" && <KojiListTab entries={filteredEntries} data={data} />}
        {tab === "shokunin" && <ShokuninListTab entries={filteredEntries} data={data} />}
        {tab === "shuukei" && <ShuukeiTab entries={filteredEntries} data={data} selectedMonth={selectedMonth} />}
      </div>
      {tab === "kiroku" && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 40px)", maxWidth: 440, zIndex: 20 }}>
          <button onClick={openNew} style={{ ...BP, boxShadow: "0 4px 20px rgba(240,165,0,0.35)" }}>＋ 工事を追加</button>
        </div>
      )}
    </div>
  );
}
