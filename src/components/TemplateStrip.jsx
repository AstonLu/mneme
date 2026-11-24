import { TEMPLATES, templateOf } from "../domain/templates";
import Template from "./Template";

export default function TemplateStrip({ card, onChoose }) {
  const chosen = templateOf(card);
  return (
    <div className="strip" role="group" aria-label="模板">
      {Object.entries(TEMPLATES).map(([key, name]) => (
        <button key={key} type="button" aria-pressed={key === chosen} onClick={() => onChoose(key)}>
          <span className="s box" aria-hidden="true"><Template card={{ ...card, template: key }} /></span>
          {name}
        </button>
      ))}
    </div>
  );
}
