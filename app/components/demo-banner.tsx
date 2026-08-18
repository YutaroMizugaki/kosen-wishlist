import { isDemoMode } from "../../lib/supabase";

// Makes it obvious when the app is running without Supabase, so demo data
// (kept only in memory and reset on restart) is never mistaken for real data.
export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="demo-banner" role="status">
      デモ表示中です。投稿内容はメモリ上に保存され、サーバー再起動で消去されます。
    </div>
  );
}
