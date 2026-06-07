/**
 * VATRate Widget — Vanilla JS embed script.
 * Copy and paste this into any website to show VAT rates.
 *
 * Usage:
 * <div id="vatrate-widget"></div>
 * <script src="https://vatrate.eu/widget.js"
 *   data-country="DE"
 *   data-type="saas"
 *   data-theme="light">
 * </script>
 */

(function () {
  var script = document.currentScript;
  if (!script) return;

  var country = script.getAttribute('data-country') || 'DE';
  var type = script.getAttribute('data-type') || 'saas';
  var theme = script.getAttribute('data-theme') || 'light';

  var container = document.getElementById('vatrate-widget');
  if (!container) {
    container = script.parentElement;
  }

  // Style
  container.style.display = 'inline-block';

  // Fetch rate - URL assoluto per funzionare da qualsiasi dominio
  var apiBase = 'https://vatrate.eu';
  fetch(apiBase + '/api/v1/rate?country=' + encodeURIComponent(country) + '&type=' + encodeURIComponent(type) + '&customer=consumer')

    .then(function (res) { return res.json(); })
    .then(function (data) {
      var isDark = theme === 'dark';
      var bg = isDark ? '#1e293b' : 'white';
      var text = isDark ? '#f1f5f9' : '#1a1a2e';
      var muted = isDark ? '#94a3b8' : '#6b7280';
      var accent = '#2563eb';

      container.innerHTML =
        '<div style="padding:20px;border-radius:12px;background:' + bg + ';border:1px solid ' + (isDark ? '#334155' : '#e5e7eb') + ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;color:' + text + ';min-width:200px">' +
          '<div style="font-size:13px;color:' + muted + ';margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">VAT Rate — ' + country + '</div>' +
          '<div style="font-size:36px;font-weight:800;color:' + accent + ';line-height:1">' + data.rate + '%</div>' +
          '<div style="font-size:13px;color:' + muted + ';margin-top:4px">' + type.replace('_', ' ') + ' — Consumer</div>' +
        '</div>';
    })
    .catch(function () {
      container.innerHTML = '<div style="color:#ef4444;font-size:14px">Failed to load VAT rate</div>';
    });
})();
