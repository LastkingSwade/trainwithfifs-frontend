// The few parts of the `web-push` package this site uses (the package ships no type file).
declare module 'web-push' {
  interface PushSubscriptionLike { endpoint: string; keys: { p256dh: string; auth: string } }
  interface SendOptions { TTL?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high'; topic?: string }
  const webpush: {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
    sendNotification(subscription: PushSubscriptionLike, payload?: string, options?: SendOptions): Promise<unknown>;
    generateVAPIDKeys(): { publicKey: string; privateKey: string };
  };
  export default webpush;
}
