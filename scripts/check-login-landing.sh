#!/bin/zsh
# Signs in as a given account through the real login form and reports where
# the person lands. Used to check the role-aware landing page.
#
#   scripts/check-login-landing.sh admin@example.com /provide

set -e
B="$HOME/.claude/skills/gstack/browse/dist/browse"
EMAIL="${1:-admin@example.com}"
START="${2:-/login}"

"$B" goto "http://localhost:3001${START}" >/dev/null 2>&1
sleep 1

"$B" js "
(() => {
  const set = (sel, v) => {
    const el = document.querySelector(sel);
    if (!el) return 'missing ' + sel;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  set('input[type=email]', '${EMAIL}');
  set('input[type=password]', 'password123');
  document.querySelector('form').requestSubmit();
  return 'submitted';
})()
" 2>/dev/null | tail -1

sleep 6
"$B" js "JSON.stringify({path: location.pathname, h1: document.querySelector('h1')?.textContent?.slice(0,40)})" 2>/dev/null | tail -1
