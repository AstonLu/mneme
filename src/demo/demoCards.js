import walk from "./images/walk.svg";
import tide from "./images/tide.svg";
import list from "./images/list.svg";
import lamp from "./images/lamp.svg";
import ridge from "./images/ridge.svg";
import seed from "./images/seed.svg";

// Sample sentences and drawings were made for this project. Ratios and lengths vary on purpose.
const card = (id, fields) => ({
  id: `demo-${id}`, content: "", link: "", imageUrl: null, ...fields,
});

export const demoCards = [
  card("walk", { imageUrl: walk }),
  card("tide", { imageUrl: tide, content: "心情像潮水，退的時候不用追。" }),
  card("list", { imageUrl: list }),
  card("lamp", { imageUrl: lamp, content: "看不清全程時，先照亮下一步就好。" }),
  card("ridge", { imageUrl: ridge, content: "休息也算在路程裡。" }),
  card("seed", { imageUrl: seed }),
  card("short", { content: "先完成，再變好。" }),
  card("medium", { content: "你不需要每天都有進步。\n有些日子，沒有放棄就已經很好了。" }),
  card("link", { content: "把想做的事寫下來，然後刪到只剩今天做得完的。", link: "https://example.com/" }),
  card("long", {
    content: [
      "我以前覺得忙代表重要，所以把行事曆填得很滿。後來有一次連續開了六個會，回家以後想不起來任何一個會議的結論。",
      "那天我開始做一個很小的練習：每件事結束以後，留五分鐘，只寫一句「這件事改變了什麼」。寫不出來的，下次就不去。",
      "三個月以後，行事曆空了一半，做完的事卻變多了。原來我缺的不是時間，是選擇的勇氣。",
      "所以現在每次有人問我能不能加一件事，我會先問自己：如果答應，我要拿哪一件來換？答不出來，就先不答應。",
      "這不是拒絕別人，是把答應過的事好好做完。慢一點沒有關係，記得自己為什麼開始就好。",
      "如果你今天也很累，先把最不重要的那件事劃掉。那條線畫下去的感覺，比完成它還好。",
    ].join("\n\n"),
  }),
];
