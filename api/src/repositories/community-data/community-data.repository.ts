import { Service } from 'typedi';

import { Db } from '../../db/db.class';

interface CommunityDashboardDates {
  past30Min: Date;
  pastHour: Date;
  pastDay: Date;
  pastWeek: Date;
  thisWeek: Date;
  pastMonth: Date;
  pastYear: Date;
}

@Service()
export class CommunityDataRepository {
  constructor(private db: Db) {}

  public async getCommunityData(dates: CommunityDashboardDates, isAdmin: boolean): Promise<any> {
    const securityRequests = [
      this.getSecurityMetrics(),
      this.getRecentBanList(dates.pastWeek),
      this.getRecentJailList(dates.pastWeek),
      this.getBansEndingSoonList(dates.thisWeek),
      this.getNewestMembers(),
      this.getLatestTransactions(dates.pastHour),
      this.getLatestHiring(),
      this.getActiveChats(dates.past30Min),
      this.getActiveMessageboards(dates.past30Min),
    ] as const;

    const adminRequests = isAdmin
      ? [
        this.getAdminMetrics(dates),
        this.getWealthiestUsers(),
      ] as const
      : [];

    const [
      securityMetrics,
      recentBan,
      recentJail,
      banEnding,
      newestMembers,
      latestTransactions,
      latestHiring,
      latestChat,
      latestMB,
      ...adminResults
    ] = await Promise.all([
      ...securityRequests,
      ...adminRequests,
    ]);

    const communityData: any = {
      security: {
        recentBan,
        recentJail,
        banEnding,
        totalBanned: [{ count: securityMetrics.totalBanned }],
        totalJailed: [{ count: securityMetrics.totalJailed }],
      },
      member: {
        newestMembers,
      },
      money: {
        latestTransactions,
      },
      messages: {
        chat: latestChat,
        messageboard: latestMB,
      },
      hiring: {
        latestRoleHire: latestHiring,
      },
    };

    if (!isAdmin) {
      return communityData;
    }

    const [adminMetrics, wealthiestUsers] = adminResults;

    communityData.activity = {
      totalDaily: [{ count: adminMetrics.totalDaily }],
      totalWeekly: [{ count: adminMetrics.totalWeekly }],
      totalMonthly: [{ count: adminMetrics.totalMonthly }],
      newWeekly: [{ count: adminMetrics.newWeekly }],
      newMonthly: [{ count: adminMetrics.newMonthly }],
      newYearly: [{ count: adminMetrics.newYearly }],
    };
    communityData.place = {
      totalColonies: [{ count: adminMetrics.totalColonies }],
      totalHoods: [{ count: adminMetrics.totalHoods }],
      totalBlocks: [{ count: adminMetrics.totalBlocks }],
      totalFreeSpots: [{ count: adminMetrics.totalFreeSpots }],
      totalHomes: [{ count: adminMetrics.totalHomes }],
      totalStorages: [{ count: adminMetrics.totalStorages }],
      totalClubs: [{ count: adminMetrics.totalClubs }],
      totalPrivate: [{ count: adminMetrics.totalPrivate }],
    };
    communityData.member.totalMembers = [{ count: adminMetrics.totalMembers }];
    communityData.money = {
      ...communityData.money,
      wealthiestUsers,
      averageBalance: [{ balance: adminMetrics.averageBalance }],
      totalBalance: [{ balance: adminMetrics.totalBalance }],
      topBalance: adminMetrics.topBalance,
    };
    communityData.object = {
      instances: {
        totalUserObjects: adminMetrics.totalUserObjects,
        totalForSale: [{ count: adminMetrics.totalObjectsForSale }],
        averageUserPrice: [{ price: adminMetrics.averageUserPrice }],
        highestUserPrice: [{ price: adminMetrics.highestUserPrice }],
      },
      mall: {
        averagePrice: [{ price: adminMetrics.averageMallPrice }],
        highestPrice: [{ price: adminMetrics.highestMallPrice }],
        totalMallObjects: [{ count: adminMetrics.totalMallObjects }],
        totalStocked: [{ count: adminMetrics.totalStocked }],
        totalUploaded: [{ count: adminMetrics.totalUploaded }],
      },
    };

    return communityData;
  }

  private async getSecurityMetrics(): Promise<any> {
    const [row] = await this.db.knex
      .select(
        this.db.knex.raw(
          `(
            SELECT COUNT(DISTINCT ban_member_id)
            FROM ban
            WHERE status = 1 AND type = 'full' AND end_date >= ?
          ) AS totalBanned`,
          [new Date()],
        ),
        this.db.knex.raw(
          `(
            SELECT COUNT(DISTINCT ban_member_id)
            FROM ban
            WHERE status = 1 AND type = 'jail' AND end_date >= ?
          ) AS totalJailed`,
          [new Date()],
        ),
      );

    return {
      totalBanned: Number(row.totalBanned || 0),
      totalJailed: Number(row.totalJailed || 0),
    };
  }

  private async getAdminMetrics(dates: CommunityDashboardDates): Promise<any> {
    const [row] = await this.db.knex
      .select(
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM member WHERE last_activity >= ?) AS totalDaily`,
          [dates.pastDay],
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM member WHERE last_activity >= ?) AS totalWeekly`,
          [dates.pastWeek],
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM member WHERE last_activity >= ?) AS totalMonthly`,
          [dates.pastMonth],
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM member WHERE created_at >= ?) AS newWeekly`,
          [dates.pastWeek],
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM member WHERE created_at >= ?) AS newMonthly`,
          [dates.pastMonth],
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM member WHERE created_at >= ?) AS newYearly`,
          [dates.pastYear],
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM place WHERE type = 'colony') AS totalColonies`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM place WHERE type = 'hood') AS totalHoods`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM place WHERE type = 'block') AS totalBlocks`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(location) FROM map_location WHERE available = 1) AS totalFreeSpots`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM place WHERE type = 'home') AS totalHomes`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM place WHERE type = 'storage') AS totalStorages`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM place WHERE type = 'club') AS totalClubs`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM place WHERE type = 'private') AS totalPrivate`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM member) AS totalMembers`,
        ),
        this.db.knex.raw(
          `(SELECT COALESCE(AVG(balance), 0) FROM wallet) AS averageBalance`,
        ),
        this.db.knex.raw(
          `(SELECT COALESCE(SUM(balance), 0) FROM wallet) AS totalBalance`,
        ),
        this.db.knex.raw(
          `(SELECT COALESCE(MAX(balance), 0) FROM wallet) AS topBalance`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM object_instance) AS totalUserObjects`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM object_instance
            WHERE object_price != '' OR object_price IS NOT NULL) AS totalObjectsForSale`,
        ),
        this.db.knex.raw(
          `(SELECT COALESCE(AVG(object_price), 0) FROM object_instance
            WHERE object_price != '' OR object_price IS NOT NULL) AS averageUserPrice`,
        ),
        this.db.knex.raw(
          `(SELECT COALESCE(MAX(object_price), 0) FROM object_instance
            WHERE object_price != '' OR object_price IS NOT NULL) AS highestUserPrice`,
        ),
        this.db.knex.raw(
          `(SELECT COALESCE(AVG(price), 0) FROM object WHERE status = 1) AS averageMallPrice`,
        ),
        this.db.knex.raw(
          `(SELECT COALESCE(MAX(price), 0) FROM object WHERE status = 1) AS highestMallPrice`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM object WHERE status != 0 AND status != 2) AS totalMallObjects`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM object WHERE status = 1) AS totalStocked`,
        ),
        this.db.knex.raw(
          `(SELECT COUNT(id) FROM object) AS totalUploaded`,
        ),
      );

    return this.normalizeMetricRow(row);
  }

  private async getRecentBanList(time: Date): Promise<any> {
    return this.db.knex
      .select('ban.*', 'member.username')
      .from('ban')
      .join('member', 'member.id', 'ban.ban_member_id')
      .where('ban.status', 1)
      .andWhere('ban.type', 'full')
      .andWhere('ban.created_at', '>=', time);
  }

  private async getRecentJailList(time: Date): Promise<any> {
    return this.db.knex
      .select('ban.*', 'member.username')
      .from('ban')
      .join('member', 'member.id', 'ban.ban_member_id')
      .where('ban.status', 1)
      .andWhere('ban.type', 'jail')
      .andWhere('ban.created_at', '>=', time);
  }

  private async getBansEndingSoonList(time: Date): Promise<any> {
    return this.db.knex
      .select('ban.*', 'member.username')
      .from('ban')
      .join('member', 'member.id', 'ban.ban_member_id')
      .where('ban.status', 1)
      .andWhere('ban.end_date', '<=', time)
      .andWhere('ban.end_date', '>', new Date());
  }

  private async getNewestMembers(): Promise<any> {
    return this.db.knex
      .from('member')
      .limit(5)
      .orderBy('id', 'desc');
  }

  private async getLatestTransactions(time: Date): Promise<any> {
    return this.db.knex
      .select(
        'transaction.*',
        this.db.knex.raw("COALESCE(sender_member.username, 'System') AS sender_username"),
        this.db.knex.raw("COALESCE(recipient_member.username, 'System') AS recipient_username"),
      )
      .from('transaction')
      .leftJoin('wallet as sender_wallet', 'sender_wallet.id', 'transaction.sender_wallet_id')
      .leftJoin('member as sender_member', 'sender_member.wallet_id', 'sender_wallet.id')
      .leftJoin('wallet as recipient_wallet', 'recipient_wallet.id', 'transaction.recipient_wallet_id')
      .leftJoin('member as recipient_member', 'recipient_member.wallet_id', 'recipient_wallet.id')
      .where('transaction.created_at', '>=', time)
      .orderBy('transaction.id', 'DESC')
      .limit(30);
  }

  private async getLatestHiring(): Promise<any> {
    return this.db.knex('role_assignment')
      .select('member.username', 'role.name as roleName')
      .leftJoin('member', 'role_assignment.member_id', 'member.id')
      .join('role', 'role_assignment.role_id', 'role.id')
      .limit(5)
      .orderBy('role_assignment.id', 'desc');
  }

  private async getActiveChats(time: Date): Promise<any> {
    return this.db.knex
      .select('place.id', 'place.name')
      .from('message')
      .innerJoin('place', 'message.place_id', 'place.id')
      .where('message.status', 1)
      .andWhere('message.created_at', '>=', time)
      .groupBy('place.id', 'place.name')
      .orderByRaw('MAX(message.created_at) DESC')
      .limit(5);
  }

  private async getActiveMessageboards(time: Date): Promise<any> {
    return this.db.knex
      .select('place.id', 'place.name', 'place.type')
      .from('messageboard')
      .innerJoin('place', 'messageboard.place_id', 'place.id')
      .where('messageboard.created_at', '>=', time)
      .groupBy('place.id', 'place.name', 'place.type')
      .orderByRaw('MAX(messageboard.created_at) DESC')
      .limit(5);
  }

  private async getWealthiestUsers(): Promise<any> {
    return this.db.knex('wallet')
      .select('wallet.*', 'member.username')
      .join('member', 'member.wallet_id', 'wallet.id')
      .orderBy('balance', 'DESC')
      .limit(10);
  }

  private normalizeMetricRow(row: Record<string, any>): Record<string, number> {
    return Object.entries(row).reduce((metrics, [key, value]) => {
      metrics[key] = Number(value || 0);
      return metrics;
    }, {} as Record<string, number>);
  }
}
