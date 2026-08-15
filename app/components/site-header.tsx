/* Plain links intentionally avoid route prefetching on constrained connections. */
/* eslint-disable @next/next/no-html-link-for-pages */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="/">KOSEN BOOKS</a>
        <nav aria-label="メインナビゲーション">
          <a href="/">希望図書</a>
          <a href="/request">図書を申請</a>
        </nav>
      </div>
    </header>
  );
}
