// The characters a person can choose. Drawn in src/components/Avatar.jsx.
export const AVATARS = { bean: "圓豆", cloud: "雲朵", sprout: "小芽", drop: "水滴", star: "星星", moon: "月亮" };
export const cleanAvatar = (value) => (typeof value === "string" && Object.hasOwn(AVATARS, value) ? value : null);
