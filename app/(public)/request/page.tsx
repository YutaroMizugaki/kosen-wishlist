"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { CATEGORIES, DEFAULT_CATEGORY, DEPARTMENTS, GRADES } from "../../../lib/constants";

type FormState = "idle" | "submitting" | "success" | "error";
type LookupState = "idle" | "loading" | "success" | "error" | "existing";
type BookFields = { title: string; author: string; book_url: string; price: string; category: string };
type ExistingRequest = {
  status: "approved" | "fulfilled" | "registered";
  title?: string;
  author?: string;
  price?: number;
  department?: string;
  grade?: string;
  book_url?: string;
};

const emptyBook: BookFields = { title: "", author: "", book_url: "", price: "", category: DEFAULT_CATEGORY };

export default function RequestPage() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [isbn, setIsbn] = useState("");
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [book, setBook] = useState<BookFields>(emptyBook);
  const [existing, setExisting] = useState<ExistingRequest | null>(null);

  async function lookupBook() {
    setLookupState("loading");
    setLookupMessage("");
    try {
      const response = await fetch(`/api/books/lookup?isbn=${encodeURIComponent(isbn)}`);
      const result = await response.json() as { data?: BookFields & { isbn: string; price: number | null }; existing?: ExistingRequest; error?: string };
      if (response.ok && result.existing) {
        setExisting(result.existing);
        setBook(emptyBook);
        setLookupState("existing");
        setLookupMessage(result.existing.status === "fulfilled" ? "この本はすでに支援済みです。" : result.existing.status === "approved" ? "この本はすでに申請されています。" : "このISBNはすでに登録されています。現在は公開されていません。");
        return;
      }
      if (!response.ok || !result.data) throw new Error(result.error || "書籍情報を取得できませんでした。");
      setExisting(null);
      setIsbn(result.data.isbn);
      setBook({ ...result.data, price: result.data.price ? String(result.data.price) : "" });
      setLookupState("success");
      setLookupMessage(result.data.price ? "書籍情報を入力しました。内容を確認してください。" : "書籍情報を入力しました。価格だけ確認して入力してください。");
    } catch (error) {
      setBook(emptyBook);
      setExisting(null);
      setLookupState("error");
      setLookupMessage(error instanceof Error ? error.message : "書籍情報を取得できませんでした。");
    }
  }

  function handleIsbnChange(value: string) {
    setIsbn(value);
    if (lookupState !== "idle") {
      setLookupState("idle");
      setLookupMessage("");
      setBook(emptyBook);
      setExisting(null);
    }
  }

  function handleIsbnKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void lookupBook();
    }
  }

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
      setIsbn("");
      setBook(emptyBook);
      setLookupState("idle");
      setLookupMessage("");
      setExisting(null);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "申請を送信できませんでした。");
    }
  }

  const showBookFields = lookupState === "success" || lookupState === "error";

  return (
    <main className="subpage">
      <section className="page-intro shell narrow">
        <p className="eyebrow">学生向け</p><h1>希望図書を申請する</h1>
        <p>ISBNから書籍情報を入力できます。送信した希望は、そのまま公開されます。</p>
      </section>
      <div className="form-layout shell narrow">
        <form className="request-form" onSubmit={handleSubmit}>
          <section><div className="form-section-title"><b>1</b><div><h2>本について</h2><p>ISBN-10・ISBN-13のどちらでも入力できます。登録時にISBN-13へ統一します。</p></div></div>
            <div className="isbn-lookup">
              <label className="field"><span>ISBN <em>必須</em></span><input name="isbn" value={isbn} onChange={(event) => handleIsbnChange(event.target.value)} onKeyDown={handleIsbnKeyDown} inputMode="text" autoComplete="off" maxLength={17} required placeholder="ISBN-10 または ISBN-13" /></label>
              <button className="button lookup-button" type="button" onClick={() => void lookupBook()} disabled={lookupState === "loading"}>{lookupState === "loading" ? "取得中…" : "書籍情報を取得"}</button>
            </div>
            {lookupMessage && <p className={`lookup-message ${lookupState}`} role="status">{lookupMessage}</p>}
            {lookupState === "existing" && existing && existing.status !== "registered" && <article className="existing-request">
              <span className="status">{existing.status === "fulfilled" ? "支援済み" : "募集中"}</span>
              <h3>{existing.title}</h3>
              <p>{existing.author}</p>
              <p>{existing.department} {existing.grade}・¥{existing.price?.toLocaleString("ja-JP")}</p>
              {existing.book_url && <a href={existing.book_url} target="_blank" rel="noreferrer">書籍ページを見る</a>}
            </article>}
            {showBookFields && <div className="field-grid book-fields">
              <label className="field full"><span>書籍名 <em>必須</em></span><input name="title" value={book.title} onChange={(event) => setBook({ ...book, title: event.target.value })} required maxLength={160} /></label>
              <label className="field"><span>著者名 <em>必須</em></span><input name="author" value={book.author} onChange={(event) => setBook({ ...book, author: event.target.value })} required maxLength={100} /></label>
              <label className="field"><span>参考税込価格（円） <em>必須</em></span><input name="price" value={book.price} onChange={(event) => setBook({ ...book, price: event.target.value })} type="number" required min="1" max="50000" placeholder="取得できない場合は入力" /><small>自動取得された場合も、現在の価格と異なることがあります。</small></label>
              <label className="field full"><span>書籍ページURL <em>必須</em></span><input name="book_url" value={book.book_url} onChange={(event) => setBook({ ...book, book_url: event.target.value })} type="url" required /></label>
              <label className="field"><span>分野 <em>必須</em></span><select name="category" value={book.category} onChange={(event) => setBook({ ...book, category: event.target.value })} required>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            </div>}
          </section>
          {lookupState !== "existing" && <><section><div className="form-section-title"><b>2</b><div><h2>申請者情報</h2><p>連絡先は公開しません。</p></div></div><div className="field-grid">
            <label className="field"><span>所属学科 <em>必須</em></span><select name="department" required defaultValue=""><option value="" disabled>選択してください</option>{DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}</select></label>
            <label className="field"><span>学年 <em>必須</em></span><select name="grade" required defaultValue=""><option value="" disabled>選択してください</option>{GRADES.map((grade) => <option key={grade}>{grade}</option>)}</select></label>
            <label className="field full"><span>学校メールアドレス <em>必須</em></span><input name="contact_email" type="email" required placeholder="学生本人の学校メールアドレス" /><small>公開されません。申請内容の確認連絡にのみ使用します。</small></label>
          </div></section>
          <label className="consent"><input type="checkbox" required /><span><a href="/privacy" target="_blank">プライバシーポリシー</a>に同意し、入力内容に個人住所や電話番号を含めていないことを確認しました。</span></label>
          <button className="button button-primary submit-button" disabled={state === "submitting" || !showBookFields} type="submit">{state === "submitting" ? "送信中…" : showBookFields ? "申請内容を送信する" : "先に書籍情報を取得してください"}</button>
          {message && <p className={`form-message ${state}`} role="status">{message}</p>}</>}
        </form>
        <aside className="form-aside"><h2>申請前に確認</h2><ul><li>申請内容は送信後、そのまま公開されます。</li><li>氏名・メールアドレスは公開されません。</li><li>学生個人の住所は収集しません。</li></ul></aside>
      </div>
    </main>
  );
}
