import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { MarkNotificationReadParams, ListNotificationsQueryParams } from "@workspace/api-zod";
import { getRequestUser } from "../lib/getRequestUser";
import { resolveAuthedUser } from "../lib/authContext";
import { sendPushToUsers } from "../lib/push";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/notifications/unread-count", async (req, res): Promise<void> => {
  const user = await resolveAuthedUser(req);
  if (!user) { res.status(401).json({ error: "No autorizado" }); return; }
  const all = await db.select({ isRead: notificationsTable.isRead }).from(notificationsTable).where(eq(notificationsTable.userId, user.id));
  const unread = all.filter((n) => !n.isRead).length;
  res.json({ unread });
});

router.get("/notifications", async (req, res): Promise<void> => {
  const parsed = ListNotificationsQueryParams.safeParse(req.query);
  const user = await resolveAuthedUser(req);
  if (!user) { res.status(401).json({ error: "No autorizado" }); return; }
  let notifications = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, user.id)).orderBy(desc(notificationsTable.createdAt));
  if (parsed.success && parsed.data.unread === true) notifications = notifications.filter((n) => !n.isRead);
  res.json(notifications);
});

router.patch("/notifications/read-all", async (req, res): Promise<void> => {
  const user = await resolveAuthedUser(req);
  if (!user) { res.status(401).json({ error: "No autorizado" }); return; }
  await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false)));
  res.json({ success: true });
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const user = await resolveAuthedUser(req);
  if (!user) { res.status(401).json({ error: "No autorizado" }); return; }
  const [notification] = await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.id, params.data.id), eq(notificationsTable.userId, user.id))).returning();
  if (!notification) { res.status(404).json({ error: "Notificación no encontrada" }); return; }
  res.json(notification);
});

router.post("/notifications/send", async (req, res): Promise<void> => {
  const user = await getRequestUser(req);
  if (!user || user.role !== "admin") { res.status(403).json({ error: "Acceso denegado" }); return; }
  const { title, message, targetType, targetRole, targetUserId } = req.body as { title?: string; message?: string; targetType?: "all" | "role" | "user"; targetRole?: string; targetUserId?: number };
  if (!title || !message || !targetType) { res.status(400).json({ error: "Título, mensaje y tipo de destino son requeridos" }); return; }

  let targetUsers: { id: number }[] = [];
  if (targetType === "all") targetUsers = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.isActive, true));
  else if (targetType === "role" && targetRole) targetUsers = await db.select({ id: usersTable.id }).from(usersTable).where(and(eq(usersTable.role, targetRole), eq(usersTable.isActive, true)));
  else if (targetType === "user" && targetUserId) targetUsers = [{ id: targetUserId }];

  const externalIds = targetUsers.map((u) => u.id).filter((id) => id !== user.id);
  const dedupedExternal = Array.from(new Set(externalIds));
  const destLabel = targetType === "all" ? "todos" : targetType === "role" && targetRole ? `rol "${targetRole}"` : targetType === "user" && targetUserId ? `usuario #${targetUserId}` : "destinatarios";

  const rows = [
    ...dedupedExternal.map((id) => ({ userId: id, title, message, type: "general" as const, isRead: false })),
    { userId: user.id, title: `📤 Enviado: ${title}`, message: `${message}\n\n— Aviso enviado a ${destLabel}.`, type: "general" as const, isRead: true },
  ];

  await db.insert(notificationsTable).values(rows);
  if (dedupedExternal.length > 0) {
    sendPushToUsers(dedupedExternal, { title, body: message, url: "/notificaciones", tag: `aviso-${Date.now()}`, vibrate: [220, 100, 220, 100, 220], requireInteraction: true }).catch((err) => { logger.warn({ err }, "notifications/send: push delivery failed"); });
  }
  res.json({ sent: dedupedExternal.length });
});

export default router;
