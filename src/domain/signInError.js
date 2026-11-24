const TEXTS = { 401: "不對，再試一次", 503: "還沒有設定 code" };

export const signInErrorText = (err) => TEXTS[err?.status] ?? "沒有成功，請再試一次";
