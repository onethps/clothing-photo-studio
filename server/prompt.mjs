export function buildPrompt(mode = 'natural') {
  const arrangement = mode === 'faithful'
    ? 'Primary request: Keep the original pose, garment geometry, folds, and printed marks as close to the source as possible. Keep natural wrinkles; prioritize fidelity over rearranging or smoothing anything.'
    : `Primary request:
1. Steamed & Smooth: Smooth the garment as if it had been carefully steamed and laid flat. Substantially remove all distracting temporary wrinkles, crumpled folds, fabric bunching, and creases across the entire garment:
- For tops, shirts, t-shirts, sweaters, hoodies, and jackets: smooth all fabric across the torso, chest, body, sleeves, front panels, and pockets, eliminating any crumpled appearance so the garment looks crisp, neat, and laid flat.
- For bottoms (jeans, pants, trousers, sweatpants, joggers, shorts, skirts): smooth all fabric along both legs, thighs, knees, calves, seat, waistband, and hems, substantially removing bunching, crumpled fold lines, and knee rumples so the garment lies clean, smooth, and flat.
- For dresses and one-pieces: smooth the entire garment from top to bottom, including bodice, waist, skirt, and legs.
- For all fabric types (cotton, denim, fleece, knitwear, wool, linen, synthetics): relax all temporary fold lines and creases while preserving authentic material texture, weave, and garment silhouette.
2. Bright, Punchy Background Lighting & Contrast: Significantly brighten the background with clean, vivid, luminous studio daylight—ensure the floor is bright, warm, and radiant, not dark, dim, underexposed, or muddy. Boost background contrast with rich, punchy tonal depth between lighter and darker planks/areas, deep crisp plank seams, and distinct natural grain. The garment must stand out boldly against the bright, high-contrast floor.
3. Preserve Authentic Background Texture: Do NOT replace, redraw, or synthesize a new background texture. Retain the exact existing background surface material and texture pattern from Image 1 completely intact (including all original wood grain lines, plank layout, knots, and surface details). Do not blur, wash out, or smooth the authentic surface texture.
4. Garment Lighting & Matte Pop: Enhance with crisp contrast, clear highlights, and balanced daylight across the garment. Avoid harsh brilliance or washed-out glare, keeping a rich, matte fabric appearance with crisp, well-defined highlights.
5. Clean Around the Item: Completely remove all extraneous objects, clutter, shadows, and intruding elements around the garment (including any chair legs, wheels, or objects near the edges). Clean the surrounding background floor, leaving only a soft, clean natural contact shadow directly beneath the garment.`;

  return `Use case: precise-object-edit
Asset type: realistic second-hand clothing listing photograph
Input image: Image 1 is the exact existing garment photo and the sole source of truth for garment identity.

${arrangement}

Strict preservation:
1. Do NOT add any new elements: do not add, draw, or invent any tags, labels, brand tags, size prints, graphics, embroidery, or details inside the neck, collar, waistband, pockets, or anywhere else on the garment. Never invent garment features or reconstruct unreadable letters. If an inner collar, label, or waistband mark is not clearly readable in Image 1, keep it plain and natural as in Image 1; do not invent text or graphics.
2. Do NOT alter the style, cut, neckline shape, collar construction, waistband, leg silhouette, or proportions of the garment.
3. Preserve all existing brand logos, wordmarks, and prints in their original position, orientation, size, and visual form without alteration.
4. Retain the original background: Do NOT change, replace, or redraw the main background texture, surface material, or pattern from Image 1. Keep the exact same original background surface, grain, plank seams, and natural contact shadows. Keep the exact same overhead perspective and complete garment outline. Remove only unrelated foreign objects intruding at the image edges without modifying the underlying background texture.
5. Preserve real fabric texture, stitching, seams, hems, and authentic wear or flaws (all signs of wear, damage, or stains, including pilling, fading, and holes). Change ONLY temporary fabric folds, creases, lighting/contrast, and remove surrounding clutter. No added text, watermarks, plastic sheen, or CGI look.`;
}

