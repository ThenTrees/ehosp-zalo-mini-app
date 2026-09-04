/**
 * CHỐT TRƯỚC `zmp deploy` — chạy tự động qua `predeploy`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VÌ SAO CẦN MỘT CHỐT CHỨ KHÔNG PHẢI MỘT DÒNG DẶN DÒ
 * ═══════════════════════════════════════════════════════════════════════════
 * `zmp deploy` đóng gói ĐÚNG giá trị `.env` đang có, và `vite.config.mts` nhúng
 * chúng CỨNG vào bundle. Ba cách hỏng, cả ba đều im lặng cho tới khi người bệnh
 * thật mở app:
 *
 *   · `VITE_USE_FAKE=true`  → phát hành dữ liệu bệnh nhân BỊA cho người thật.
 *   · `VITE_API_BASE_URL` trỏ tunnel tạm (ngrok) → app chết khi tunnel chết.
 *   · thiếu đuôi `/api/patient-app` → 404 mọi tuyến, màn hình trắng không lỗi.
 *
 * README dặn cả ba bằng lời từ lâu, và `.env` vẫn đang trỏ vào một tunnel
 * ngrok đã chết. Lời dặn không phải chốt.
 *
 * CHỈ ĐỌC, KHÔNG IN GIÁ TRỊ NHẠY CẢM: báo lỗi nêu TÊN biến và dạng sai, không
 * in nguyên giá trị — `.env` còn có `ZMP_TOKEN`.
 */
import { readFileSync, existsSync } from 'node:fs';

const doc = (t) => Object.fromEntries(
  t.split('\n')
    .map((d) => d.trim())
    .filter((d) => d && !d.startsWith('#'))
    .map((d) => {
      const i = d.indexOf('=');
      return i < 0 ? null : [d.slice(0, i).trim(), d.slice(i + 1).trim()];
    })
    .filter(Boolean));

if (!existsSync('.env')) {
  console.error('✗ Không có .env. Chép .env.example rồi điền.');
  process.exit(1);
}
const e = doc(readFileSync('.env', 'utf8'));
const loi = [];

if (String(e.VITE_USE_FAKE ?? '').toLowerCase() !== 'false') {
  loi.push('VITE_USE_FAKE phải là "false". Phát hành với "true" là phát hành'
    + ' dữ liệu bệnh nhân BỊA cho người dùng thật.');
}

const url = String(e.VITE_API_BASE_URL ?? '');
if (!url) {
  loi.push('VITE_API_BASE_URL trống.');
} else {
  if (!url.startsWith('https://')) {
    loi.push('VITE_API_BASE_URL phải là https:// — webview Zalo chặn HTTP.');
  }
  if (/\.ngrok(-free)?\.app/.test(url) || /\.loca\.lt|\.trycloudflare\.com/.test(url)) {
    loi.push('VITE_API_BASE_URL đang trỏ vào một TUNNEL TẠM. Tunnel chết là app'
      + ' chết, mà giá trị này bị nhúng cứng vào bundle nên không sửa được sau'
      + ' khi phát hành.');
  }
  if (!url.replace(/\/+$/, '').endsWith('/api/patient-app')) {
    loi.push('VITE_API_BASE_URL phải kết thúc bằng "/api/patient-app" — máy'
      + ' khách ghép thẳng /dang-nhap, /me, /visits vào sau. Thiếu đuôi là 404'
      + ' mọi tuyến, và màn hình chỉ trắng chứ không báo gì.');
  }
}

if (loi.length) {
  console.error('\n✗ DỪNG PHÁT HÀNH — ' + loi.length + ' vấn đề trong .env:\n');
  for (const d of loi) console.error('  · ' + d);
  console.error('');
  process.exit(1);
}
console.log('✓ .env đạt: gọi API thật, HTTPS, đúng tiền tố /api/patient-app.');
