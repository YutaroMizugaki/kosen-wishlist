"use client";

import { FormEvent, useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export default function RequestPage() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setState("submitting");
    setMessage("");
    const payload = Object.fromEntries(new FormData(formElement).entries());
    try {
      const response = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "申請を送信できませんでした。");
      setState("success");
      setMessage(result.message || "申請を受け付けました。");
      formElement.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "申請を送信できませんでした。");
    }
  }

  return (
    <main className="subpage">
      <section className="page-intro shell narrow">
        <p className="eyebrow">学生向け</p><h1>希望図書を申請する</h1>
        <p>送信した希望は、そのまま公開ページに掲載されます。</p>
      </section>
      <div className="form-layout shell narrow">
        <form className="request-form" onSubmit={handleSubmit}>
          <section><div className="form-section-title"><b>1</b><div><h2>本について</h2><p>書店や出版社のページを確認しながら入力してください。</p></div></div><div className="field-grid">
            <label className="field full"><span>書籍名 <em>必須</em></span><input name="title" required maxLength={160} placeholder="例：CPUの創りかた" /></label>
            <label className="field"><span>著者名 <em>必須</em></span><input name="author" required maxLength={100} placeholder="例：渡波 郁" /></label>
            <label className="field"><span>ISBN</span><input name="isbn" inputMode="numeric" maxLength={17} placeholder="978-4-..." /></label>
            <label className="field full"><span>書籍ページURL <em>必須</em></span><input name="book_url" type="url" required placeholder="https://..." /></label>
            <label className="field"><span>税込価格（円） <em>必須</em></span><input name="price" type="number" required min="1" max="50000" placeholder="3080" /></label>
            <label className="field"><span>分野 <em>必須</em></span><select name="category" required defaultValue=""><option value="" disabled>選択してください</option><option>コンピュータ</option><option>プログラミング</option><option>AI・データ</option><option>電子工学</option><option>機械工学</option><option>環境・化学</option><option>数学・自然科学</option><option>語学・教養</option><option>その他</option></select></label>
          </div></section>
          <section><div className="form-section-title"><b>2</b><div><h2>読みたい理由</h2><p>個人が特定できる内容は書かないでください。</p></div></div><label className="field full"><span>この本で学びたいこと <em>必須</em></span><textarea name="reason" required minLength={40} maxLength={300} rows={5} placeholder="40〜300字で、取り組みたいことや学びたい理由を教えてください。" /></label></section>
          <section><div className="form-section-title"><b>3</b><div><h2>申請者情報</h2><p>連絡先は公開しません。</p></div></div><div className="field-grid">
            <label className="field"><span>所属学科 <em>必須</em></span><select name="department" required defaultValue=""><option value="" disabled>選択してください</option><option>機械工学科</option><option>電気電子工学科</option><option>電子制御工学科</option><option>情報工学科</option><option>環境都市工学科</option><option>専攻科</option></select></label>
            <label className="field"><span>学年 <em>必須</em></span><select name="grade" required defaultValue=""><option value="" disabled>選択してください</option><option>1年</option><option>2年</option><option>3年</option><option>4年</option><option>5年</option><option>専攻科</option></select></label>
            <label className="field full"><span>学校メールアドレス <em>必須</em></span><input name="contact_email" type="email" required placeholder="学生本人の学校メールアドレス" /><small>公開されません。申請内容の確認連絡にのみ使用します。</small></label>
          </div></section>
          <label className="consent"><input type="checkbox" required /><span>入力内容に個人住所や電話番号を含めていないことを確認しました。</span></label>
          <button className="button button-primary submit-button" disabled={state === "submitting"} type="submit">{state === "submitting" ? "送信中…" : "申請内容を送信する"}</button>
          {message && <p className={`form-message ${state}`} role="status">{message}</p>}
        </form>
        <aside className="form-aside"><h2>申請前に確認</h2><ul><li>申請内容は送信後、そのまま公開されます。</li><li>氏名・メールアドレスは公開されません。</li><li>学生個人の住所は収集しません。</li></ul></aside>
      </div>
    </main>
  );
}
