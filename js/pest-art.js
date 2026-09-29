// ============================================================
// 菌・カビの見た目(SVG)
// PEST_ICONS[type] を呼び出し側でサイズ(px)を指定してHTML化する
// ============================================================

const PEST_ICONS = {
  // 菌(バイキン):いびつな緑がかった塊+触手状の突起+内部にドット(核っぽいもの)
  bacteria: `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="50" x2="18" y2="22" stroke="#5a8a2e" stroke-width="4" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="84" y2="20" stroke="#5a8a2e" stroke-width="4" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="12" y2="60" stroke="#5a8a2e" stroke-width="4" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="88" y2="62" stroke="#5a8a2e" stroke-width="4" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="30" y2="90" stroke="#5a8a2e" stroke-width="4" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="70" y2="90" stroke="#5a8a2e" stroke-width="4" stroke-linecap="round"/>
      <circle cx="18" cy="22" r="6" fill="#8bc34a"/>
      <circle cx="84" cy="20" r="6" fill="#8bc34a"/>
      <circle cx="12" cy="60" r="6" fill="#8bc34a"/>
      <circle cx="88" cy="62" r="6" fill="#8bc34a"/>
      <circle cx="30" cy="90" r="6" fill="#8bc34a"/>
      <circle cx="70" cy="90" r="6" fill="#8bc34a"/>
      <path d="M50 15 C28 15 15 30 17 50 C15 70 28 85 50 85 C72 85 85 70 83 50 C85 30 72 15 50 15 Z" fill="#a4d24a" stroke="#4a7a20" stroke-width="4"/>
      <circle cx="40" cy="42" r="6" fill="#4a7a20"/>
      <circle cx="60" cy="48" r="5" fill="#4a7a20"/>
      <circle cx="46" cy="62" r="4.5" fill="#4a7a20"/>
    </svg>`,

  // カビ:不規則な形のフサフサした斑点の集まり(ドーム状にはせず、キノコに見えないようにする)
  mold: `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="38" cy="60" r="16" fill="#d8e6c2"/>
      <circle cx="60" cy="55" r="19" fill="#e3edc9"/>
      <circle cx="52" cy="40" r="13" fill="#eef6e2"/>
      <circle cx="70" cy="68" r="12" fill="#cddcae"/>
      <circle cx="30" cy="42" r="10" fill="#e3edc9"/>
      <circle cx="76" cy="42" r="9" fill="#d8e6c2"/>
      <g stroke="#8fae5a" stroke-width="2.5" stroke-linecap="round">
        <line x1="30" y1="30" x2="26" y2="20"/>
        <line x1="45" y1="24" x2="43" y2="13"/>
        <line x1="58" y1="22" x2="60" y2="11"/>
        <line x1="72" y1="28" x2="78" y2="18"/>
        <line x1="20" y1="50" x2="9" y2="46"/>
        <line x1="82" y1="55" x2="93" y2="52"/>
        <line x1="28" y1="72" x2="20" y2="80"/>
        <line x1="60" y1="78" x2="60" y2="90"/>
        <line x1="80" y1="76" x2="88" y2="84"/>
      </g>
      <circle cx="34" cy="58" r="3.5" fill="#5a7a3a"/>
      <circle cx="58" cy="52" r="3" fill="#4a6a2e"/>
      <circle cx="66" cy="66" r="3.2" fill="#5a7a3a"/>
      <circle cx="46" cy="66" r="2.6" fill="#4a6a2e"/>
      <circle cx="50" cy="44" r="2.4" fill="#5a7a3a"/>
      <circle cx="72" cy="46" r="2.4" fill="#4a6a2e"/>
    </svg>`,
};
