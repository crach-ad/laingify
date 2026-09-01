"use client";

// Renders a Sprite's avatar: a DiceBear SVG once the learner has customized
// past the legacy look, falling back to the original emoji glyph otherwise
// (every Sprite created before this feature has avatarStyle = null).

import { useMemo } from "react";
import { getSpriteStyle, buildAvatarOptions } from "@/lib/dicebear";
import { Avatar } from "@dicebear/core";

export type SpriteVisual = {
  avatar: string;
  avatarStyle?: string | null;
  avatarSeed?: string | null;
  avatarTraits?: string | null;
  avatarColors?: string | null;
};

export default function SpriteAvatar({
  sprite,
  size = 64,
  className,
  emojiClassName,
}: {
  sprite: SpriteVisual;
  size?: number;
  className?: string;
  emojiClassName?: string;
}) {
  const dataUri = useMemo(() => {
    if (!sprite.avatarStyle) return null;
    const style = getSpriteStyle(sprite.avatarStyle);
    if (!style) return null;
    try {
      const variants = JSON.parse(sprite.avatarTraits || "{}");
      const colors = JSON.parse(sprite.avatarColors || "{}");
      const options = buildAvatarOptions(style, sprite.avatarSeed || "sprite", variants, colors, size);
      return new Avatar(style, options).toDataUri();
    } catch {
      return null;
    }
  }, [sprite.avatarStyle, sprite.avatarSeed, sprite.avatarTraits, sprite.avatarColors, size]);

  if (dataUri) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={dataUri} alt="Sprite" className={className} style={{ width: size, height: size }} />;
  }
  return <span className={emojiClassName ?? className}>{sprite.avatar}</span>;
}
