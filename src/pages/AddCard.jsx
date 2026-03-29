import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

export default function AddCard({ onDone }) {
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;
    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        const imageRef = ref(storage, `cards/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }
      await addDoc(collection(db, "cards"), {
        content: content.trim(),
        note: note.trim(),
        link: link.trim(),
        imageUrl,
        weight: 1,
        createdAt: serverTimestamp(),
      });
      setContent(""); setNote(""); setLink("");
      setImage(null); setImagePreview(null);
      onDone();
    } catch (err) {
      console.error(err);
      alert("儲存失敗，請再試一次");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-card">
      <h2>新增卡片</h2>
      <div className="field">
        <label>內容</label>
        <textarea
          placeholder="輸入一段話、洞察或知識..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
      </div>
      <div className="field">
        <label>圖片（選填）</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreview && <img src={imagePreview} alt="preview" className="image-preview" />}
      </div>
      <div className="field">
        <label>連結（選填）</label>
        <input
          type="url"
          placeholder="https://..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <div className="field">
        <label>我的心得（選填）</label>
        <textarea
          placeholder="這對我的意義是..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>
      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={loading || (!content.trim() && !image)}
      >
        {loading ? "儲存中..." : "儲存卡片"}
      </button>
    </div>
  );
}