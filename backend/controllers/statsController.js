const { db } = require('../db');
const { items, users, itemStatusHistory } = require('../db/schema');
const { eq, sql, asc } = require('drizzle-orm');

// @desc    Get public platform stats for the Home page
// @route   GET /api/stats/public
// @access  Public
const getPublicStats = async (req, res) => {
    try {
        const [returnedResult, userResult, locationResult, historyResult] = await Promise.all([
            db.select({ count: sql`count(*)` }).from(items).where(eq(items.status, 'RETURNED')),
            db.select({ count: sql`count(*)` }).from(users),
            db.selectDistinct({ location: items.location }).from(items),
            db.select({
                itemId: itemStatusHistory.itemId,
                changedAt: itemStatusHistory.changedAt
            })
            .from(itemStatusHistory)
            .innerJoin(items, eq(itemStatusHistory.itemId, items.id))
            .where(eq(items.status, 'RETURNED'))
            .orderBy(asc(itemStatusHistory.changedAt))
        ]);

        const returnedCount = Number(returnedResult[0].count);
        const userCount = Number(userResult[0].count);
        const locationsCount = locationResult.length;

        // Group histories by itemId
        const historyMap = {};
        for (const row of historyResult) {
            if (!historyMap[row.itemId]) historyMap[row.itemId] = [];
            historyMap[row.itemId].push(row);
        }

        const validItems = Object.values(historyMap).filter(h => h.length >= 2);

        let avgResolutionHours = null;
        if (validItems.length > 0) {
            const totalMs = validItems.reduce((sum, hArr) => {
                const first = new Date(hArr[0].changedAt).getTime();
                const last = new Date(hArr[hArr.length - 1].changedAt).getTime();
                return sum + (last - first);
            }, 0);
            avgResolutionHours = Math.round(totalMs / validItems.length / 1000 / 3600);
        }

        res.json({
            returnedCount,
            userCount,
            locationCount: locationsCount,
            avgResolutionHours,
        });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

module.exports = { getPublicStats };
