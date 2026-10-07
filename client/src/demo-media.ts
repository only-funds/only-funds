import figures from './demo-figures.json';

const byPost = new Map(figures.map(figure => [figure.id, figure]));

// Resolve bundled example assets at read time so existing local demos get new
// illustrations without resetting accounts, comments, subscriptions or rewards.
export function demoMedia(postId: string) {
  const figure = byPost.get(postId);
  return figure ? {
    posterUrl: `${import.meta.env.BASE_URL}demo/figures/${figure.id}.webp`,
    posterAlt: figure.alt,
    posterCaption: figure.caption,
  } : {};
}
