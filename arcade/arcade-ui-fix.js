/* In-game controls reuse the original gameplay buttons; no duplicate save state. */
(()=>{'use strict';const $=id=>document.getElementById(id);const fire=(id)=>$(id)?.click();
$('arcadePlayIngame')?.addEventListener('click',()=>fire('playBtn'));
$('arcadePauseIngame')?.addEventListener('click',()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyP',bubbles:true})));
for(const [id,code] of [['arcadeDashIngame','KeyQ'],['arcadeShieldIngame','KeyE'],['arcadeParryIngame','KeyR'],['arcadeUltIngame','Space']])$(id)?.addEventListener('click',()=>window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true})));
$('arcadeMusicIngame')?.addEventListener('click',()=>fire('musicArcade'));
})();