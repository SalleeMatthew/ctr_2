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
    const now = new Date();
    const [totalBannedRow, totalJailedRow] = await Promise.all([
      this.db.knex('ban')
        .countDistinct({ totalBanned: 'ban_member_id' })
        .where('status', 1)
        .andWhere('type', 'full')
        .andWhere('end_date', '>=', now)
        .first(),
      this.db.knex('ban')
        .countDistinct({ totalJailed: 'ban_member_id' })
        .where('status', 1)
        .andWhere('type', 'jail')
        .andWhere('end_date', '>=', now)
        .first(),
    ]);

    return {
      totalBanned: Number(totalBannedRow?.totalBanned || 0),
      totalJailed: Number(totalJailedRow?.totalJailed || 0),
    };
  }

  private async getAdminMetrics(dates: CommunityDashboardDates): Promise<any> {
    const pricedObjectInstances = this.db.knex('object_instance')
      .whereNotNull('object_price')
      .andWhere('object_price', '!=', '');

    const [
      totalDailyRow,
      totalWeeklyRow,
      totalMonthlyRow,
      newWeeklyRow,
      newMonthlyRow,
      newYearlyRow,
      totalColoniesRow,
      totalHoodsRow,
      totalBlocksRow,
      totalFreeSpotsRow,
      totalHomesRow,
      totalStoragesRow,
      totalClubsRow,
      totalPrivateRow,
      totalMembersRow,
      walletMetricsRow,
      totalUserObjectsRow,
      pricedObjectMetricsRow,
      mallPriceMetricsRow,
      totalMallObjectsRow,
      totalStockedRow,
      totalUploadedRow,
    ] = await Promise.all([
      this.db.knex('member').count({ totalDaily: 'id' }).where('last_activity', '>=', dates.pastDay).first(),
      this.db.knex('member').count({ totalWeekly: 'id' }).where('last_activity', '>=', dates.pastWeek).first(),
      this.db.knex('member').count({ totalMonthly: 'id' }).where('last_activity', '>=', dates.pastMonth).first(),
      this.db.knex('member').count({ newWeekly: 'id' }).where('created_at', '>=', dates.pastWeek).first(),
      this.db.knex('member').count({ newMonthly: 'id' }).where('created_at', '>=', dates.pastMonth).first(),
      this.db.knex('member').count({ newYearly: 'id' }).where('created_at', '>=', dates.pastYear).first(),
      this.db.knex('place').count({ totalColonies: 'id' }).where('type', 'colony').first(),
      this.db.knex('place').count({ totalHoods: 'id' }).where('type', 'hood').first(),
      this.db.knex('place').count({ totalBlocks: 'id' }).where('type', 'block').first(),
      this.db.knex('map_location').count({ totalFreeSpots: 'location' }).where('available', 1).first(),
      this.db.knex('place').count({ totalHomes: 'id' }).where('type', 'home').first(),
      this.db.knex('place').count({ totalStorages: 'id' }).where('type', 'storage').first(),
      this.db.knex('place').count({ totalClubs: 'id' }).where('type', 'club').first(),
      this.db.knex('place').count({ totalPrivate: 'id' }).where('type', 'private').first(),
      this.db.knex('member').count({ totalMembers: 'id' }).first(),
      this.db.knex('wallet')
        .avg({ averageBalance: 'balance' })
        .sum({ totalBalance: 'balance' })
        .max({ topBalance: 'balance' })
        .first(),
      this.db.knex('object_instance').count({ totalUserObjects: 'id' }).first(),
      pricedObjectInstances.clone()
        .count({ totalObjectsForSale: 'id' })
        .avg({ averageUserPrice: 'object_price' })
        .max({ highestUserPrice: 'object_price' })
        .first(),
      this.db.knex('object')
        .avg({ averageMallPrice: 'price' })
        .max({ highestMallPrice: 'price' })
        .where('status', 1)
        .first(),
      this.db.knex('object').count({ totalMallObjects: 'id' }).whereNotIn('status', [0, 2]).first(),
      this.db.knex('object').count({ totalStocked: 'id' }).where('status', 1).first(),
      this.db.knex('object').count({ totalUploaded: 'id' }).first(),
    ]);

    return this.normalizeMetricRow({
      totalDaily: totalDailyRow?.totalDaily,
      totalWeekly: totalWeeklyRow?.totalWeekly,
      totalMonthly: totalMonthlyRow?.totalMonthly,
      newWeekly: newWeeklyRow?.newWeekly,
      newMonthly: newMonthlyRow?.newMonthly,
      newYearly: newYearlyRow?.newYearly,
      totalColonies: totalColoniesRow?.totalColonies,
      totalHoods: totalHoodsRow?.totalHoods,
      totalBlocks: totalBlocksRow?.totalBlocks,
      totalFreeSpots: totalFreeSpotsRow?.totalFreeSpots,
      totalHomes: totalHomesRow?.totalHomes,
      totalStorages: totalStoragesRow?.totalStorages,
      totalClubs: totalClubsRow?.totalClubs,
      totalPrivate: totalPrivateRow?.totalPrivate,
      totalMembers: totalMembersRow?.totalMembers,
      averageBalance: walletMetricsRow?.averageBalance,
      totalBalance: walletMetricsRow?.totalBalance,
      topBalance: walletMetricsRow?.topBalance,
      totalUserObjects: totalUserObjectsRow?.totalUserObjects,
      totalObjectsForSale: pricedObjectMetricsRow?.totalObjectsForSale,
      averageUserPrice: pricedObjectMetricsRow?.averageUserPrice,
      highestUserPrice: pricedObjectMetricsRow?.highestUserPrice,
      averageMallPrice: mallPriceMetricsRow?.averageMallPrice,
      highestMallPrice: mallPriceMetricsRow?.highestMallPrice,
      totalMallObjects: totalMallObjectsRow?.totalMallObjects,
      totalStocked: totalStockedRow?.totalStocked,
      totalUploaded: totalUploadedRow?.totalUploaded,
    });
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
      .max({ latestCreatedAt: 'message.created_at' })
      .from('message')
      .innerJoin('place', 'message.place_id', 'place.id')
      .where('message.status', 1)
      .andWhere('message.created_at', '>=', time)
      .groupBy('place.id', 'place.name')
      .orderBy('latestCreatedAt', 'desc')
      .limit(5);
  }

  private async getActiveMessageboards(time: Date): Promise<any> {
    return this.db.knex
      .select('place.id', 'place.name', 'place.type')
      .max({ latestCreatedAt: 'messageboard.created_at' })
      .from('messageboard')
      .innerJoin('place', 'messageboard.place_id', 'place.id')
      .where('messageboard.created_at', '>=', time)
      .groupBy('place.id', 'place.name', 'place.type')
      .orderBy('latestCreatedAt', 'desc')
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
