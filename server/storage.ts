import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, gte, lt, desc, sql, isNull, or } from "drizzle-orm";
import {
  users,
  branches,
  roomTypes,
  rooms,
  guests,
  reservations,
  reservationRooms,
  hotelSettings,
  pushSubscriptions,
  notificationHistory,
  taxes,
  type User,
  type Branch,
  type RoomType,
  type Room,
  type Guest,
  type Reservation,
  type ReservationRoom,
  type HotelSettings,
  type PushSubscription,
  type NotificationHistory,
  type Tax,
  type InsertUser,
  type InsertBranch,
  type InsertRoomType,
  type InsertRoom,
  type InsertGuest,
  type InsertReservation,
  type InsertReservationRoom,
  type InsertHotelSettings,
  type InsertPushSubscription,
  type InsertNotificationHistory,
  type InsertTax,
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client);

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Branch operations
  getBranches(): Promise<Branch[]>;
  getBranch(id: number): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: number, branch: Partial<InsertBranch>): Promise<Branch>;
  deleteBranch(id: number): Promise<void>;

  // Room Type operations
  getRoomTypes(branchId?: number): Promise<RoomType[]>;
  getRoomType(id: number): Promise<RoomType | undefined>;
  createRoomType(roomType: InsertRoomType): Promise<RoomType>;
  updateRoomType(id: number, roomType: Partial<InsertRoomType>): Promise<RoomType>;
  deleteRoomType(id: number): Promise<void>;

  // Room operations
  getRooms(branchId?: number): Promise<(Room & { roomType: RoomType; branch: Branch })[]>;
  getRoom(id: number): Promise<(Room & { roomType: RoomType; branch: Branch }) | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room>;
  deleteRoom(id: number): Promise<void>;

  // Guest operations
  getGuests(branchId?: number): Promise<Guest[]>;
  getGuest(id: number): Promise<Guest | undefined>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  updateGuest(id: number, guest: Partial<InsertGuest>): Promise<Guest>;
  deleteGuest(id: number): Promise<void>;
  searchGuests(query: string, branchId?: number): Promise<Guest[]>;

  // Reservation operations
  getReservations(branchId?: number): Promise<(Reservation & {
    guest: Guest;
    reservationRooms: (ReservationRoom & {
      room: Room & { roomType: RoomType };
    })[];
  })[]>;
  getReservation(id: string): Promise<(Reservation & {
    guest: Guest;
    reservationRooms: (ReservationRoom & {
      room: Room & { roomType: RoomType };
    })[];
  }) | undefined>;
  createReservation(reservation: InsertReservation, roomsData?: InsertReservationRoom[]): Promise<Reservation>;
  updateReservation(id: string, reservation: Partial<InsertReservation>): Promise<Reservation>;
  deleteReservation(id: string): Promise<void>;

  // Reservation Room operations
  createReservationRoom(reservationRoom: InsertReservationRoom): Promise<ReservationRoom>;
  getReservationRooms(reservationId: string): Promise<(ReservationRoom & {
    room: Room & { roomType: RoomType };
  })[]>;

  // Hotel Settings operations
  getHotelSettings(): Promise<HotelSettings | undefined>;
  upsertHotelSettings(settings: InsertHotelSettings): Promise<HotelSettings>;

  // Push Subscription operations
  savePushSubscription(subscription: InsertPushSubscription): Promise<void>;
  getPushSubscriptions(userId?: string): Promise<PushSubscription[]>;
  removePushSubscription(endpoint: string): Promise<void>;
  clearAllPushSubscriptions(): Promise<void>;
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscription(userId: string, endpoint: string): Promise<PushSubscription | undefined>;
  deletePushSubscription(userId: string, endpoint: string): Promise<void>;
  getAllAdminSubscriptions(): Promise<(PushSubscription & { user?: User })[]>;

  // Notification History operations
  saveNotificationHistory(notification: InsertNotificationHistory): Promise<void>;
  getNotificationHistory(userId?: string, limit?: number): Promise<NotificationHistory[]>;
  createNotificationHistory(notification: InsertNotificationHistory): Promise<NotificationHistory>;
  markNotificationAsRead(notificationId: number, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Tax operations
  getTaxes(applicationType?: string): Promise<Tax[]>;
  getTax(id: number): Promise<Tax | undefined>;
  createTax(tax: InsertTax): Promise<Tax>;
  updateTax(id: number, tax: Partial<InsertTax>): Promise<Tax>;
  deleteTax(id: number): Promise<void>;

  // Analytics operations
  getRevenueAnalytics(branchId?: number, period?: string): Promise<any>;
  getOccupancyAnalytics(branchId?: number, period?: string): Promise<any>;
  getGuestAnalytics(branchId?: number): Promise<any>;
  getRoomPerformanceAnalytics(branchId?: number): Promise<any>;
  getOperationalAnalytics(branchId?: number): Promise<any>;

  // Dashboard metrics - updated for 24-hour specific data
  getDashboardMetrics(branchId?: number): Promise<{
    totalRooms: number;
    occupiedRooms: number;
    todayReservations: number;
    todayRevenue: number;
    roomStatusCounts: Record<string, number>;
  }>;

  // 24-hour specific methods
  getTodayReservations(branchId?: number): Promise<(Reservation & {
    guest: Guest;
    reservationRooms: (ReservationRoom & {
      room: Room & { roomType: RoomType };
    })[];
  })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(user: InsertUser): Promise<User> {
    const [result] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: { 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
      })
      .returning();
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const [result] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Branch operations
  async getBranches(): Promise<Branch[]> {
    return await db.select().from(branches).orderBy(branches.name);
  }

  async getBranch(id: number): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const [result] = await db.insert(branches).values(branch).returning();
    return result;
  }

  async updateBranch(id: number, branch: Partial<InsertBranch>): Promise<Branch> {
    const [result] = await db
      .update(branches)
      .set(branch)
      .where(eq(branches.id, id))
      .returning();
    return result;
  }

  async deleteBranch(id: number): Promise<void> {
    await db.delete(branches).where(eq(branches.id, id));
  }

  // Room Type operations
  async getRoomTypes(branchId?: number): Promise<RoomType[]> {
    let query = db.select().from(roomTypes);

    if (branchId) {
      query = query.where(
        or(
          eq(roomTypes.branchId, branchId),
          isNull(roomTypes.branchId)
        )
      );
    }

    return await query.orderBy(roomTypes.name);
  }

  async getRoomType(id: number): Promise<RoomType | undefined> {
    const [roomType] = await db.select().from(roomTypes).where(eq(roomTypes.id, id));
    return roomType;
  }

  async createRoomType(roomType: InsertRoomType): Promise<RoomType> {
    const [result] = await db.insert(roomTypes).values(roomType).returning();
    return result;
  }

  async updateRoomType(id: number, roomType: Partial<InsertRoomType>): Promise<RoomType> {
    const [result] = await db
      .update(roomTypes)
      .set(roomType)
      .where(eq(roomTypes.id, id))
      .returning();
    return result;
  }

  async deleteRoomType(id: number): Promise<void> {
    await db.delete(roomTypes).where(eq(roomTypes.id, id));
  }

  // Room operations
  async getRooms(branchId?: number): Promise<(Room & { roomType: RoomType; branch: Branch })[]> {
    let query = db
      .select()
      .from(rooms)
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .leftJoin(branches, eq(rooms.branchId, branches.id));

    if (branchId) {
      query = query.where(eq(rooms.branchId, branchId));
    }

    const results = await query.orderBy(rooms.number);

    return results.map(result => ({
      ...result.rooms,
      roomType: result.room_types!,
      branch: result.branches!,
    }));
  }

  async getRoom(id: number): Promise<(Room & { roomType: RoomType; branch: Branch }) | undefined> {
    const [result] = await db
      .select()
      .from(rooms)
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .leftJoin(branches, eq(rooms.branchId, branches.id))
      .where(eq(rooms.id, id));

    if (!result) return undefined;

    return {
      ...result.rooms,
      roomType: result.room_types!,
      branch: result.branches!,
    };
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [result] = await db.insert(rooms).values(room).returning();
    return result;
  }

  async updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room> {
    const [result] = await db
      .update(rooms)
      .set(room)
      .where(eq(rooms.id, id))
      .returning();
    return result;
  }

  async deleteRoom(id: number): Promise<void> {
    await db.delete(rooms).where(eq(rooms.id, id));
  }

  // Guest operations
  async getGuests(branchId?: number): Promise<Guest[]> {
    let query = db.select().from(guests);
    if (branchId) {
      query = query.where(eq(guests.branchId, branchId));
    }
    return await query.orderBy(desc(guests.createdAt));
  }

  async getGuest(id: number): Promise<Guest | undefined> {
    const [guest] = await db.select().from(guests).where(eq(guests.id, id));
    return guest;
  }

  async createGuest(guest: InsertGuest): Promise<Guest> {
    const [result] = await db.insert(guests).values(guest).returning();
    return result;
  }

  async updateGuest(id: number, guest: Partial<InsertGuest>): Promise<Guest> {
    const [result] = await db
      .update(guests)
      .set(guest)
      .where(eq(guests.id, id))
      .returning();
    return result;
  }

  async deleteGuest(id: number): Promise<void> {
    await db.delete(guests).where(eq(guests.id, id));
  }

  async searchGuests(query: string, branchId?: number): Promise<Guest[]> {
    let searchQuery = db.select().from(guests).where(
      and(
        eq(guests.isActive, true),
        or(
          sql`${guests.firstName} ILIKE ${`%${query}%`}`,
          sql`${guests.lastName} ILIKE ${`%${query}%`}`,
          sql`${guests.phone} ILIKE ${`%${query}%`}`,
          sql`${guests.email} ILIKE ${`%${query}%`}`
        ),
        branchId ? eq(guests.branchId, branchId) : undefined
      )
    );

    return await searchQuery.orderBy(desc(guests.createdAt)).limit(10);
  }

  // Reservation operations
  async getReservations(branchId?: number): Promise<(Reservation & {
    guest: Guest;
    reservationRooms: (ReservationRoom & {
      room: Room & { roomType: RoomType };
    })[];
  })[]> {
    let reservationQuery = db
      .select()
      .from(reservations)
      .leftJoin(guests, eq(reservations.guestId, guests.id));

    if (branchId) {
      reservationQuery = reservationQuery.where(eq(reservations.branchId, branchId));
    }

    const reservationResults = await reservationQuery.orderBy(desc(reservations.createdAt));

    const reservationsWithRooms = await Promise.all(
      reservationResults.map(async (result) => {
        const reservation = result.reservations;
        const guest = result.guests!;

        const roomResults = await db
          .select()
          .from(reservationRooms)
          .leftJoin(rooms, eq(reservationRooms.roomId, rooms.id))
          .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
          .where(eq(reservationRooms.reservationId, reservation.id));

        const reservationRoomsData = roomResults.map(roomResult => ({
          ...roomResult.reservation_rooms,
          room: {
            ...roomResult.rooms!,
            roomType: roomResult.room_types!,
          },
        }));

        return {
          ...reservation,
          guest,
          reservationRooms: reservationRoomsData,
        };
      })
    );

    return reservationsWithRooms;
  }

  async getReservation(id: string): Promise<(Reservation & {
    guest: Guest;
    reservationRooms: (ReservationRoom & {
      room: Room & { roomType: RoomType };
    })[];
  }) | undefined> {
    const [result] = await db
      .select()
      .from(reservations)
      .leftJoin(guests, eq(reservations.guestId, guests.id))
      .where(eq(reservations.id, id));

    if (!result) return undefined;

    const reservation = result.reservations;
    const guest = result.guests!;

    const roomResults = await db
      .select()
      .from(reservationRooms)
      .leftJoin(rooms, eq(reservationRooms.roomId, rooms.id))
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(eq(reservationRooms.reservationId, reservation.id));

    const reservationRoomsData = roomResults.map(roomResult => ({
      ...roomResult.reservation_rooms,
      room: {
        ...roomResult.rooms!,
        roomType: roomResult.room_types!,
      },
    }));

    return {
      ...reservation,
      guest,
      reservationRooms: reservationRoomsData,
    };
  }

  async createReservation(reservation: InsertReservation, roomsData?: InsertReservationRoom[]): Promise<Reservation> {
    return await db.transaction(async (tx) => {
      const [newReservation] = await tx.insert(reservations).values(reservation).returning();

      if (roomsData && roomsData.length > 0) {
        const roomsWithReservationId = roomsData.map(room => ({
          ...room,
          reservationId: newReservation.id,
        }));

        await tx.insert(reservationRooms).values(roomsWithReservationId);

        // Update guest reservation count if guest exists
        if (reservation.guestId) {
          await tx
            .update(guests)
            .set({ 
              reservationCount: sql`${guests.reservationCount} + 1`
            })
            .where(eq(guests.id, reservation.guestId));
        }
      }

      return newReservation;
    });
  }

  async updateReservation(id: string, reservation: Partial<InsertReservation>): Promise<Reservation> {
    const [result] = await db
      .update(reservations)
      .set(reservation)
      .where(eq(reservations.id, id))
      .returning();
    return result;
  }

  async deleteReservation(id: string): Promise<void> {
    await db.delete(reservations).where(eq(reservations.id, id));
  }

  // Reservation Room operations
  async createReservationRoom(reservationRoom: InsertReservationRoom): Promise<ReservationRoom> {
    const [result] = await db.insert(reservationRooms).values(reservationRoom).returning();
    return result;
  }

  async getReservationRooms(reservationId: string): Promise<(ReservationRoom & {
    room: Room & { roomType: RoomType };
  })[]> {
    const results = await db
      .select()
      .from(reservationRooms)
      .leftJoin(rooms, eq(reservationRooms.roomId, rooms.id))
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(eq(reservationRooms.reservationId, reservationId));

    return results.map(result => ({
      ...result.reservation_rooms,
      room: {
        ...result.rooms!,
        roomType: result.room_types!,
      },
    }));
  }

  // Hotel Settings operations
  async getHotelSettings(): Promise<HotelSettings | undefined> {
    const [settings] = await db.select().from(hotelSettings).limit(1);
    return settings;
  }

  async upsertHotelSettings(settings: InsertHotelSettings): Promise<HotelSettings> {
    const existingSettings = await this.getHotelSettings();

    if (existingSettings) {
      const [result] = await db
        .update(hotelSettings)
        .set(settings)
        .where(eq(hotelSettings.id, existingSettings.id))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(hotelSettings).values(settings).returning();
      return result;
    }
  }

  // Push Subscription operations
  async savePushSubscription(subscription: InsertPushSubscription): Promise<void> {
    await db
      .insert(pushSubscriptions)
      .values(subscription)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          p256dhKey: subscription.p256dhKey,
          authKey: subscription.authKey,
          updatedAt: new Date(),
        },
      });
  }

  async getPushSubscriptions(userId?: string): Promise<PushSubscription[]> {
    let query = db.select().from(pushSubscriptions);
    if (userId) {
      query = query.where(eq(pushSubscriptions.userId, userId));
    }
    return await query;
  }

  async removePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async clearAllPushSubscriptions(): Promise<void> {
    await db.delete(pushSubscriptions);
  }

  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const [result] = await db
      .insert(pushSubscriptions)
      .values({
        userId: subscription.userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.p256dh,
        authKey: subscription.auth,
      })
      .onConflictDoUpdate({
        target: [pushSubscriptions.userId, pushSubscriptions.endpoint],
        set: {
          p256dhKey: subscription.p256dh,
          authKey: subscription.auth,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getPushSubscription(userId: string, endpoint: string): Promise<PushSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );
    return subscription;
  }

  async deletePushSubscription(userId: string, endpoint: string): Promise<void> {
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );
  }

  async getAllAdminSubscriptions(): Promise<(PushSubscription & { user?: User })[]> {
    const results = await db
      .select()
      .from(pushSubscriptions)
      .leftJoin(users, eq(pushSubscriptions.userId, users.id))
      .where(
        or(
          eq(users.role, 'superadmin'),
          eq(users.role, 'branch-admin')
        )
      );

    return results.map(result => ({
      ...result.push_subscriptions,
      p256dh: result.push_subscriptions.p256dhKey,
      auth: result.push_subscriptions.authKey,
      user: result.users || undefined,
    }));
  }

  // Notification History operations
  async saveNotificationHistory(notification: InsertNotificationHistory): Promise<void> {
    await db.insert(notificationHistory).values(notification);
  }

  async getNotificationHistory(userId?: string, limit: number = 50): Promise<NotificationHistory[]> {
    let query = db.select().from(notificationHistory);
    if (userId) {
      query = query.where(eq(notificationHistory.userId, userId));
    }
    return await query.orderBy(desc(notificationHistory.createdAt)).limit(limit);
  }

  async createNotificationHistory(notification: InsertNotificationHistory): Promise<NotificationHistory> {
    const [result] = await db.insert(notificationHistory).values(notification).returning();
    return result;
  }

  async markNotificationAsRead(notificationId: number, userId: string): Promise<void> {
    await db
      .update(notificationHistory)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notificationHistory.id, notificationId),
          eq(notificationHistory.userId, userId)
        )
      );
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notificationHistory)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notificationHistory.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationHistory)
      .where(
        and(
          eq(notificationHistory.userId, userId),
          eq(notificationHistory.isRead, false)
        )
      );
    return result.count;
  }

  // Tax operations
  async getTaxes(applicationType?: string): Promise<Tax[]> {
    let query = db.select().from(taxes).where(eq(taxes.isActive, true));
    if (applicationType) {
      query = query.where(and(
        eq(taxes.isActive, true),
        eq(taxes.applicationType, applicationType)
      ));
    }
    return await query.orderBy(taxes.taxName);
  }

  async getTax(id: number): Promise<Tax | undefined> {
    const [tax] = await db.select().from(taxes).where(eq(taxes.id, id));
    return tax;
  }

  async createTax(tax: InsertTax): Promise<Tax> {
    const [result] = await db.insert(taxes).values(tax).returning();
    return result;
  }

  async updateTax(id: number, tax: Partial<InsertTax>): Promise<Tax> {
    const [result] = await db
      .update(taxes)
      .set(tax)
      .where(eq(taxes.id, id))
      .returning();
    return result;
  }

  async deleteTax(id: number): Promise<void> {
    await db.delete(taxes).where(eq(taxes.id, id));
  }

  // Analytics operations
  async getRevenueAnalytics(branchId?: number, period: string = '30d'): Promise<any> {
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split('T')[0];

    let query = db
      .select({
        date: sql<string>`DATE(${reservations.createdAt})`,
        revenue: sql<number>`SUM(CAST(${reservations.totalAmount} AS DECIMAL))`,
      })
      .from(reservations)
      .where(
        and(
          sql`DATE(${reservations.createdAt}) >= ${startDateString}`,
          branchId ? eq(reservations.branchId, branchId) : undefined
        )
      )
      .groupBy(sql`DATE(${reservations.createdAt})`)
      .orderBy(sql`DATE(${reservations.createdAt})`);

    const dailyRevenue = await query;

    const totalRevenue = dailyRevenue.reduce((sum, day) => sum + (Number(day.revenue) || 0), 0);

    return {
      dailyRevenue: dailyRevenue.map(day => ({
        date: day.date,
        revenue: Number(day.revenue) || 0
      })),
      totalRevenue,
      period: `${days} days`
    };
  }

  async getOccupancyAnalytics(branchId?: number, period: string = '30d'): Promise<any> {
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split('T')[0];

    // Get total rooms
    let totalRoomsQuery = db.select({ count: sql<number>`count(*)` }).from(rooms);
    if (branchId) {
      totalRoomsQuery = totalRoomsQuery.where(eq(rooms.branchId, branchId));
    }
    const [totalRoomsResult] = await totalRoomsQuery;
    const totalRooms = totalRoomsResult.count;

    // Get daily occupancy
    let occupancyQuery = db
      .select({
        date: sql<string>`DATE(${reservationRooms.checkInDate})`,
        occupiedRooms: sql<number>`COUNT(DISTINCT ${reservationRooms.roomId})`,
      })
      .from(reservationRooms)
      .leftJoin(reservations, eq(reservationRooms.reservationId, reservations.id))
      .where(
        and(
          sql`DATE(${reservationRooms.checkInDate}) >= ${startDateString}`,
          branchId ? eq(reservations.branchId, branchId) : undefined
        )
      )
      .groupBy(sql`DATE(${reservationRooms.checkInDate})`)
      .orderBy(sql`DATE(${reservationRooms.checkInDate})`);

    const dailyOccupancy = await occupancyQuery;

    return {
      dailyOccupancy: dailyOccupancy.map(day => ({
        date: day.date,
        occupiedRooms: day.occupiedRooms,
        occupancyRate: totalRooms > 0 ? Math.round((day.occupiedRooms / totalRooms) * 100) : 0
      })),
      totalRooms,
      averageOccupancy: dailyOccupancy.length > 0 
        ? Math.round(dailyOccupancy.reduce((sum, day) => sum + day.occupiedRooms, 0) / dailyOccupancy.length)
        : 0
    };
  }

  async getGuestAnalytics(branchId?: number): Promise<any> {
    // Guest demographics
    let guestQuery = db.select().from(guests);
    if (branchId) {
      guestQuery = guestQuery.where(eq(guests.branchId, branchId));
    }
    const allGuests = await guestQuery;

    // Top guests by reservation count with total spent
    let topGuestsQuery = db
      .select({
        guest: {
          id: guests.id,
          firstName: guests.firstName,
          lastName: guests.lastName,
          email: guests.email,
        },
        totalBookings: guests.reservationCount,
        totalSpent: sql<number>`COALESCE(SUM(CAST(${reservations.totalAmount} AS DECIMAL)), 0)`,
      })
      .from(guests)
      .leftJoin(reservations, eq(guests.id, reservations.guestId))
      .groupBy(guests.id, guests.firstName, guests.lastName, guests.email, guests.reservationCount)
      .orderBy(desc(guests.reservationCount))
      .limit(10);

    if (branchId) {
      topGuestsQuery = topGuestsQuery.where(eq(guests.branchId, branchId));
    }

    const topGuests = await topGuestsQuery;

    // Guest nationality demographics
    const guestsByNationality = await db
      .select({
        nationality: guests.nationality,
        count: sql<number>`COUNT(*)`,
      })
      .from(guests)
      .where(branchId ? eq(guests.branchId, branchId) : undefined)
      .groupBy(guests.nationality)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    // New guests this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [newGuestsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(guests)
      .where(
        and(
          gte(guests.createdAt, currentMonth),
          branchId ? eq(guests.branchId, branchId) : undefined
        )
      );

    return {
      totalGuests: allGuests.length,
      topGuests: topGuests.map(guest => ({
        guest: guest.guest,
        totalBookings: guest.totalBookings,
        totalSpent: Number(guest.totalSpent) || 0,
      })),
      guestsByNationality: guestsByNationality.filter(g => g.nationality).map(g => ({
        nationality: g.nationality || 'Unknown',
        count: g.count,
      })),
      newGuestsThisMonth: newGuestsResult.count,
      repeatGuestRate: allGuests.length > 0 
        ? Math.round((allGuests.filter(g => g.reservationCount > 1).length / allGuests.length) * 100)
        : 0
    };
  }

  async getRoomPerformanceAnalytics(branchId?: number): Promise<any> {
    // Room type performance
    let roomTypeQuery = db
      .select({
        roomTypeId: roomTypes.id,
        roomTypeName: roomTypes.name,
        totalRooms: sql<number>`COUNT(${rooms.id})`,
        totalReservations: sql<number>`COUNT(${reservationRooms.id})`,
      })
      .from(roomTypes)
      .leftJoin(rooms, eq(roomTypes.id, rooms.roomTypeId))
      .leftJoin(reservationRooms, eq(rooms.id, reservationRooms.roomId))
      .groupBy(roomTypes.id, roomTypes.name)
      .orderBy(desc(sql`COUNT(${reservationRooms.id})`));

    if (branchId) {
      roomTypeQuery = roomTypeQuery.where(eq(rooms.branchId, branchId));
    }

    const roomTypePerformance = await roomTypeQuery;

    // Room status distribution
    let statusQuery = db
      .select({
        status: rooms.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(rooms)
      .groupBy(rooms.status);

    if (branchId) {
      statusQuery = statusQuery.where(eq(rooms.branchId, branchId));
    }

    const roomStatusDistribution = await statusQuery;

    return {
      roomTypePerformance: roomTypePerformance.map(rt => ({
        roomTypeId: rt.roomTypeId,
        roomTypeName: rt.roomTypeName,
        totalRooms: rt.totalRooms,
        totalReservations: rt.totalReservations,
        utilizationRate: rt.totalRooms > 0 
          ? Math.round((rt.totalReservations / rt.totalRooms) * 100)
          : 0
      })),
      roomStatusDistribution
    };
  }

  async getOperationalAnalytics(branchId?: number): Promise<any> {
    // Reservation status distribution
    let statusQuery = db
      .select({
        status: reservations.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(reservations)
      .groupBy(reservations.status);

    if (branchId) {
      statusQuery = statusQuery.where(eq(reservations.branchId, branchId));
    }

    const reservationStatusDistribution = await statusQuery;

    // Average length of stay
    let avgStayQuery = db
      .select({
        avgStay: sql<number>`AVG(EXTRACT(DAY FROM (${reservationRooms.checkOutDate}::timestamp - ${reservationRooms.checkInDate}::timestamp)))`,
      })
      .from(reservationRooms)
      .leftJoin(reservations, eq(reservationRooms.reservationId, reservations.id))
      .where(
        and(
          sql`${reservationRooms.checkOutDate} IS NOT NULL`,
          sql`${reservationRooms.checkInDate} IS NOT NULL`
        )
      );

    if (branchId) {
      avgStayQuery = avgStayQuery.where(
        and(
          eq(reservations.branchId, branchId),
          sql`${reservationRooms.checkOutDate} IS NOT NULL`,
          sql`${reservationRooms.checkInDate} IS NOT NULL`
        )
      );
    }

    const [avgStayResult] = await avgStayQuery;

    // Check-in/out times analysis
    let checkInTimesQuery = db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${reservationRooms.actualCheckIn}::timestamp)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reservationRooms)
      .leftJoin(reservations, eq(reservationRooms.reservationId, reservations.id))
      .where(sql`${reservationRooms.actualCheckIn} IS NOT NULL`)
      .groupBy(sql`EXTRACT(HOUR FROM ${reservationRooms.actualCheckIn}::timestamp)`)
      .orderBy(sql`EXTRACT(HOUR FROM ${reservationRooms.actualCheckIn}::timestamp)`);

    if (branchId) {
      checkInTimesQuery = checkInTimesQuery.where(eq(reservations.branchId, branchId));
    }

    const checkInTimes = await checkInTimesQuery;

    return {
      reservationStatusDistribution,
      averageLengthOfStay: Math.round(Number(avgStayResult?.avgStay) || 0),
      checkInTimes: checkInTimes.map(ct => ({
        hour: ct.hour,
        count: ct.count
      }))
    };
  }

  // Dashboard metrics - updated for 24-hour specific data
  async getDashboardMetrics(branchId?: number): Promise<{
    totalRooms: number;
    occupiedRooms: number;
    todayReservations: number;
    todayRevenue: number;
    roomStatusCounts: Record<string, number>;
  }> {
    // Get today's date range (24 hours)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total rooms
    let roomQuery = db.select({ count: sql<number>`count(*)` }).from(rooms);
    if (branchId) {
      roomQuery = roomQuery.where(eq(rooms.branchId, branchId));
    }
    const [totalRoomsResult] = await roomQuery;
    const totalRooms = totalRoomsResult.count;

    // Get occupied rooms (based on current reservations)
    let occupiedQuery = db
      .select({ count: sql<number>`count(distinct ${rooms.id})` })
      .from(rooms)
      .leftJoin(reservationRooms, eq(rooms.id, reservationRooms.roomId))
      .leftJoin(reservations, eq(reservationRooms.reservationId, reservations.id))
      .where(
        and(
          eq(reservations.status, 'checked-in'),
          branchId ? eq(rooms.branchId, branchId) : undefined
        )
      );

    const [occupiedRoomsResult] = await occupiedQuery;
    const occupiedRooms = occupiedRoomsResult.count;

    // Get today's reservations (created today)
    let todayReservationsQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(
        and(
          gte(reservations.createdAt, today),
          lt(reservations.createdAt, tomorrow),
          branchId ? eq(reservations.branchId, branchId) : undefined
        )
      );

    const [todayReservationsResult] = await todayReservationsQuery;
    const todayReservations = todayReservationsResult.count;

    // Get today's revenue (from reservations created today)
    let todayRevenueQuery = db
      .select({ 
        revenue: sql<number>`coalesce(sum(cast(${reservations.totalAmount} as decimal)), 0)` 
      })
      .from(reservations)
      .where(
        and(
          gte(reservations.createdAt, today),
          lt(reservations.createdAt, tomorrow),
          branchId ? eq(reservations.branchId, branchId) : undefined
        )
      );

    const [todayRevenueResult] = await todayRevenueQuery;
    const todayRevenue = Number(todayRevenueResult.revenue);

    // Get room status counts
    let statusQuery = db
      .select({
        status: rooms.status,
        count: sql<number>`count(*)`
      })
      .from(rooms)
      .groupBy(rooms.status);

    if (branchId) {
      statusQuery = statusQuery.where(eq(rooms.branchId, branchId));
    }

    const statusResults = await statusQuery;
    const roomStatusCounts = statusResults.reduce((acc, result) => {
      acc[result.status] = result.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRooms,
      occupiedRooms,
      todayReservations,
      todayRevenue,
      roomStatusCounts,
    };
  }

  // 24-hour specific methods
  async getTodayReservations(branchId?: number, limit?: number): Promise<(Reservation & {
    guest: Guest;
    reservationRooms: (ReservationRoom & {
      room: Room & { roomType: RoomType };
    })[];
  })[]> {
    // Get today's date range (24 hours)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let reservationQuery = db
      .select()
      .from(reservations)
      .leftJoin(guests, eq(reservations.guestId, guests.id))
      .where(
        and(
          gte(reservations.createdAt, today),
          lt(reservations.createdAt, tomorrow),
          branchId ? eq(reservations.branchId, branchId) : undefined
        )
      );

    const reservationResults = await reservationQuery
      .orderBy(desc(reservations.createdAt))
      .limit(limit || 1000);

    const reservationsWithRooms = await Promise.all(
      reservationResults.map(async (result) => {
        const reservation = result.reservations;
        const guest = result.guests!;

        const roomResults = await db
          .select()
          .from(reservationRooms)
          .leftJoin(rooms, eq(reservationRooms.roomId, rooms.id))
          .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
          .where(eq(reservationRooms.reservationId, reservation.id));

        const reservationRoomsData = roomResults.map(roomResult => ({
          ...roomResult.reservation_rooms,
          room: {
            ...roomResult.rooms!,
            roomType: roomResult.room_types!,
          },
        }));

        return {
          ...reservation,
          guest,
          reservationRooms: reservationRoomsData,
        };
      })
    );

    return reservationsWithRooms;
  }

  // Super admin dashboard metrics
  async getSuperAdminDashboardMetrics(): Promise<{
    totalBranches: number;
    totalReservations: number;
    totalRevenue: number;
    totalRooms: number;
    branchMetrics: Array<{
      branchId: number;
      branchName: string;
      totalRooms: number;
      bookedRooms: number;
      availableRooms: number;
      occupancyRate: number;
      totalReservations: number;
      revenue: number;
    }>;
  }> {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total branches
    const [totalBranchesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(branches);
    const totalBranches = totalBranchesResult.count;

    // Get total reservations (today)
    const [totalReservationsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(
        and(
          gte(reservations.createdAt, today),
          lt(reservations.createdAt, tomorrow)
        )
      );
    const totalReservations = totalReservationsResult.count;

    // Get total revenue (today)
    const [totalRevenueResult] = await db
      .select({ 
        revenue: sql<number>`coalesce(sum(cast(${reservations.totalAmount} as decimal)), 0)` 
      })
      .from(reservations)
      .where(
        and(
          gte(reservations.createdAt, today),
          lt(reservations.createdAt, tomorrow)
        )
      );
    const totalRevenue = Number(totalRevenueResult.revenue);

    // Get total rooms
    const [totalRoomsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rooms);
    const totalRooms = totalRoomsResult.count;

    // Get branch metrics
    const branchResults = await db
      .select({
        branchId: branches.id,
        branchName: branches.name,
      })
      .from(branches);

    const branchMetrics = await Promise.all(
      branchResults.map(async (branch) => {
        // Get total rooms for this branch
        const [branchRoomsResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(rooms)
          .where(eq(rooms.branchId, branch.branchId));
        const branchTotalRooms = branchRoomsResult.count;

        // Get booked rooms (currently occupied)
        const [bookedRoomsResult] = await db
          .select({ count: sql<number>`count(distinct ${rooms.id})` })
          .from(rooms)
          .leftJoin(reservationRooms, eq(rooms.id, reservationRooms.roomId))
          .leftJoin(reservations, eq(reservationRooms.reservationId, reservations.id))
          .where(
            and(
              eq(rooms.branchId, branch.branchId),
              eq(reservations.status, 'checked-in')
            )
          );
        const bookedRooms = bookedRoomsResult.count;

        // Get today's reservations for this branch
        const [branchReservationsResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(reservations)
          .where(
            and(
              eq(reservations.branchId, branch.branchId),
              gte(reservations.createdAt, today),
              lt(reservations.createdAt, tomorrow)
            )
          );
        const branchTotalReservations = branchReservationsResult.count;

        // Get today's revenue for this branch
        const [branchRevenueResult] = await db
          .select({ 
            revenue: sql<number>`coalesce(sum(cast(${reservations.totalAmount} as decimal)), 0)` 
          })
          .from(reservations)
          .where(
            and(
              eq(reservations.branchId, branch.branchId),
              gte(reservations.createdAt, today),
              lt(reservations.createdAt, tomorrow)
            )
          );
        const branchRevenue = Number(branchRevenueResult.revenue);

        // Get restaurant data for this branch (using restaurant-storage import)
        const { restaurantStorage } = await import('./restaurant-storage');
        const restaurantMetrics = await restaurantStorage.getRestaurantDashboardMetrics(branch.branchId);

        const availableRooms = branchTotalRooms - bookedRooms;
        const occupancyRate = branchTotalRooms > 0 ? Math.round((bookedRooms / branchTotalRooms) * 100) : 0;

        return {
          branchId: branch.branchId,
          branchName: branch.branchName,
          totalRooms: branchTotalRooms,
          bookedRooms,
          availableRooms,
          occupancyRate,
          totalReservations: branchTotalReservations,
          revenue: branchRevenue,
          totalOrders: restaurantMetrics.totalOrders,
          restaurantRevenue: restaurantMetrics.totalRevenue,
        };
      })
    );

    return {
      totalBranches,
      totalReservations,
      totalRevenue,
      totalRooms,
      branchMetrics,
    };
  }
}

export const storage = new DatabaseStorage();