import Pusher from "pusher";

const APP_ID = process.env.PUSHER_APP_ID;
const KEY = process.env.PUSHER_KEY;
const SECRET = process.env.PUSHER_SECRET;
const CLUSTER = process.env.PUSHER_CLUSTER ?? "us2";

let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (!APP_ID || !KEY || !SECRET) return null;
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: APP_ID,
      key: KEY,
      secret: SECRET,
      cluster: CLUSTER,
      useTLS: true,
    });
  }
  return pusherServer;
}

export function isPusherConfigured(): boolean {
  return Boolean(APP_ID && KEY && SECRET);
}

export function orgChannel(orgId: string) {
  return `private-org-${orgId}`;
}

export function userChannel(userId: string) {
  return `private-user-${userId}`;
}

export async function triggerOrg(
  orgId: string,
  event: string,
  data: unknown,
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(orgChannel(orgId), event, data);
}

export async function triggerUser(
  userId: string,
  event: string,
  data: unknown,
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(userChannel(userId), event, data);
}
