import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

export default function AddCard({ onDone }) {
  const [content, setContent] = useState("");
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
        link: link.trim(),
        imageUrl,
        weight: 1,
        boostCount: 0,
        noteCount: 0,
        createdAt: serverTimestamp(),
      });
      setContent(""); setLink("");
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
      <h2>Capture</h2>
      <div className="field">
        <label>內容</label>
        <textarea
          placeholder="輸入一段話、洞察或知識..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
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
      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={loading || (!content.trim() && !image)}
      >
        {loading ? "儲存中..." : "Save"}
      </button>
    </div>
  );
}
