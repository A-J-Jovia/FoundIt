const crypto = require('crypto');
const { db } = require('../db');
const { items, itemStatusHistory, users } = require('../db/schema');
const { fuzzCoordinates, reverseGeocode } = require('../utils/geoUtils');
const { eq, and, or, ilike, gte, lte, desc, sql, asc } = require('drizzle-orm');

// Helper to map DB item to the Mongoose-like structure expected by frontend
const formatItem = (item, geoJson = null, publicGeoJson = null, histories = [], creator = null, claimant = null) => {
    return {
        ...item,
        _id: item.id,
        geoLocation: geoJson || undefined,
        publicGeoLocation: publicGeoJson || undefined,
        description: item.metadata?.description || {},
        imageURL: item.metadata?.imageURL,
        colorPalette: item.metadata?.colorPalette,
        brandModel: item.metadata?.brandModel,
        urgencyLevel: item.metadata?.urgencyLevel,
        reward: item.metadata?.reward,
        history: histories.map(h => ({
            _id: h.id,
            message: h.message,
            by: h.by ? { _id: h.by.id, name: h.by.name, email: h.by.email } : h.changedBy,
            role: h.role,
            time: h.changedAt
        })),
        createdBy: creator ? { _id: creator.id, name: creator.name, email: creator.email } : item.createdBy,
        claimant: claimant ? { _id: claimant.id, name: claimant.name, email: claimant.email } : item.claimantId,
    };
};

const createItem = async (req, res) => {
    try {
        const { title, type, category, description, location, date, lat, lng, imageURL, colorPalette, brandModel, urgencyLevel, reward } = req.body;

        if (!title || !type || !category || !location || !date) {
            return res.status(400).json({ message: 'Title, type, category, location, and date are required.' });
        }

        if (lat && lng) {
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return res.status(400).json({ message: 'Invalid coordinates' });
            }
        }

        const metadata = {
            description,
            imageURL,
            colorPalette,
            brandModel,
            urgencyLevel,
            reward
        };

        let geoLocationStr = null;
        let publicGeoLocationStr = null;
        let address = null;
        let geoJson = null;
        let publicGeoJson = null;

        if (lat && lng) {
            address = await reverseGeocode(lat, lng);
            geoLocationStr = `SRID=4326;POINT(${lng} ${lat})`;
            const fuzzed = fuzzCoordinates(lat, lng);
            publicGeoLocationStr = `SRID=4326;POINT(${fuzzed.lng} ${fuzzed.lat})`;
            
            geoJson = { type: 'Point', coordinates: [lng, lat] };
            publicGeoJson = { type: 'Point', coordinates: [fuzzed.lng, fuzzed.lat] };
        }

        const result = await db.transaction(async (tx) => {
            const [createdItem] = await tx.insert(items).values({
                title,
                type,
                category,
                location,
                date: new Date(date),
                createdBy: req.user._id,
                status: 'AVAILABLE',
                metadata,
                address,
                geoLocation: geoLocationStr ? sql`${geoLocationStr}::geography` : null,
                publicGeoLocation: publicGeoLocationStr ? sql`${publicGeoLocationStr}::geography` : null,
            }).returning();

            const [historyEntry] = await tx.insert(itemStatusHistory).values({
                itemId: createdItem.id,
                message: `Item reported as ${type}`,
                changedBy: req.user._id,
                role: req.user.role,
            }).returning();

            return { createdItem, historyEntry };
        });

        res.status(201).json(formatItem(result.createdItem, geoJson, publicGeoJson, [result.historyEntry]));
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const getAllItems = async (req, res) => {
    try {
        const { keyword, category, location, startDate, endDate, type, status } = req.query;

        const conditions = [];

        if (keyword) {
            conditions.push(or(
                ilike(items.title, `%${keyword}%`),
                ilike(sql`${items.metadata}->'description'->>'color'`, `%${keyword}%`),
                ilike(sql`${items.metadata}->'description'->>'brand'`, `%${keyword}%`),
                ilike(sql`${items.metadata}->'description'->>'marks'`, `%${keyword}%`)
            ));
        }

        if (category) conditions.push(eq(items.category, category));
        if (location) conditions.push(ilike(items.location, `%${location}%`));
        if (type) conditions.push(eq(items.type, type));
        if (status) conditions.push(eq(items.status, status));

        if (startDate) conditions.push(gte(items.date, new Date(startDate)));
        if (endDate) conditions.push(lte(items.date, new Date(endDate)));

        const queryResult = await db.select({
            item: items,
            geoLocationJson: sql`ST_AsGeoJSON(${items.geoLocation})::jsonb`,
            publicGeoLocationJson: sql`ST_AsGeoJSON(${items.publicGeoLocation})::jsonb`,
            creator: {
                id: users.id,
                name: users.name,
                email: users.email
            }
        })
        .from(items)
        .leftJoin(users, eq(items.createdBy, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(items.createdAt));

        const formattedItems = queryResult.map(row => {
            return formatItem(row.item, row.geoLocationJson, row.publicGeoLocationJson, [], row.creator);
        });

        res.json(formattedItems);
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const getItemById = async (req, res) => {
    try {
        const [row] = await db.select({
            item: items,
            geoLocationJson: sql`ST_AsGeoJSON(${items.geoLocation})::jsonb`,
            publicGeoLocationJson: sql`ST_AsGeoJSON(${items.publicGeoLocation})::jsonb`,
            creator: { id: users.id, name: users.name, email: users.email },
        })
        .from(items)
        .leftJoin(users, eq(items.createdBy, users.id))
        .where(eq(items.id, req.params.id));

        if (!row) {
            return res.status(404).json({ message: 'Item not found' });
        }

        let claimant = null;
        if (row.item.claimantId) {
            const [claimantRow] = await db.select({ id: users.id, name: users.name, email: users.email })
                .from(users).where(eq(users.id, row.item.claimantId));
            claimant = claimantRow;
        }

        const histories = await db.select({
            id: itemStatusHistory.id,
            message: itemStatusHistory.message,
            role: itemStatusHistory.role,
            changedAt: itemStatusHistory.changedAt,
            by: { id: users.id, name: users.name, email: users.email }
        })
        .from(itemStatusHistory)
        .leftJoin(users, eq(itemStatusHistory.changedBy, users.id))
        .where(eq(itemStatusHistory.itemId, row.item.id))
        .orderBy(asc(itemStatusHistory.changedAt));

        res.json(formatItem(row.item, row.geoLocationJson, row.publicGeoLocationJson, histories, row.creator, claimant));
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const submitClaim = async (req, res) => {
    try {
        const [existing] = await db.select().from(items).where(eq(items.id, req.params.id));

        if (!existing) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (existing.createdBy === req.user._id) {
            return res.status(400).json({ message: 'You cannot claim an item you reported' });
        }

        const returnToken = crypto.randomBytes(32).toString('hex');
        
        const result = await db.transaction(async (tx) => {
            const [updatedItem] = await tx.update(items)
                .set({
                    status: 'PENDING_VERIFICATION',
                    claimantId: req.user._id,
                    returnToken,
                    updatedAt: new Date()
                })
                .where(and(eq(items.id, req.params.id), eq(items.status, 'AVAILABLE')))
                .returning();

            if (!updatedItem) return null;

            await tx.insert(itemStatusHistory).values({
                itemId: updatedItem.id,
                message: 'Claim submitted by user',
                changedBy: req.user._id,
                role: req.user.role,
            });

            return updatedItem;
        });

        if (!result) {
            return res.status(409).json({ message: 'Item is no longer available' });
        }

        // Return updated properties. We don't need fully populated data here as frontend updates local state.
        res.json({ ...formatItem(result), returnToken });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const startVerification = async (req, res) => {
    try {
        const { verificationMethod } = req.body;
        const [item] = await db.select().from(items).where(eq(items.id, req.params.id));

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.status !== 'PENDING_VERIFICATION') {
            return res.status(400).json({ message: `Cannot start verification. Current status is ${item.status}` });
        }

        await db.transaction(async (tx) => {
            await tx.update(items)
                .set({
                    status: 'UNDER_VERIFICATION',
                    verificationMethod: verificationMethod || item.verificationMethod,
                    updatedAt: new Date()
                })
                .where(eq(items.id, item.id));

            await tx.insert(itemStatusHistory).values({
                itemId: item.id,
                message: `Verification process started${verificationMethod ? ` via ${verificationMethod}` : ''}`,
                changedBy: req.user._id,
                role: req.user.role,
            });
        });

        const [updatedItem] = await db.select().from(items).where(eq(items.id, req.params.id));
        res.json(formatItem(updatedItem));
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const decideClaim = async (req, res) => {
    try {
        const { decision, adminNotes } = req.body;
        const [item] = await db.select().from(items).where(eq(items.id, req.params.id));

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (!['UNDER_VERIFICATION', 'PENDING_VERIFICATION'].includes(item.status)) {
            return res.status(400).json({ message: `Cannot decide claim. Item must be PENDING_VERIFICATION or UNDER_VERIFICATION (Current: ${item.status})` });
        }

        const validDecisions = ['RETURNED', 'REJECTED'];
        if (!validDecisions.includes(decision)) {
            return res.status(400).json({ message: 'Invalid decision. Must be RETURNED or REJECTED.' });
        }

        await db.transaction(async (tx) => {
            let updatePayload = {
                status: decision,
                adminNotes: adminNotes || item.adminNotes,
                updatedAt: new Date()
            };

            if (decision === 'REJECTED') {
                updatePayload.status = 'AVAILABLE';
                updatePayload.claimantId = null;
            }

            await tx.update(items)
                .set(updatePayload)
                .where(eq(items.id, item.id));

            await tx.insert(itemStatusHistory).values({
                itemId: item.id,
                message: `Claim decision made: ${decision}`,
                changedBy: req.user._id,
                role: req.user.role,
            });
        });

        const [updatedItem] = await db.select().from(items).where(eq(items.id, req.params.id));
        res.json(formatItem(updatedItem));
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const deleteItem = async (req, res) => {
    try {
        const [item] = await db.select().from(items).where(eq(items.id, req.params.id));

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await db.delete(items).where(eq(items.id, req.params.id));
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const getReturnToken = async (req, res) => {
    try {
        const [item] = await db.select({
            id: items.id,
            createdBy: items.createdBy,
            returnToken: items.returnToken
        }).from(items).where(eq(items.id, req.params.id));

        if (!item) return res.status(404).json({ message: 'Item not found' });

        const isFinder = item.createdBy === req.user._id;
        const isAdmin  = req.user.role === 'admin';

        if (!isFinder && !isAdmin) {
            return res.status(403).json({ message: 'Access denied: only the finder or an admin can view the return token' });
        }

        res.json({ returnToken: item.returnToken });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

const scanReturnItem = async (req, res) => {
    try {
        const { returnToken } = req.body;
        const [item] = await db.select().from(items).where(eq(items.id, req.params.id));

        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (item.createdBy !== req.user._id) {
            return res.status(403).json({ message: 'Only the reporter can mark this item as returned' });
        }

        if (item.status !== 'PENDING_VERIFICATION') {
            return res.status(400).json({ message: 'Item must be PENDING_VERIFICATION to be returned' });
        }

        if (!returnToken || returnToken !== item.returnToken) {
            return res.status(400).json({ message: 'Invalid return token' });
        }

        await db.transaction(async (tx) => {
            await tx.update(items)
                .set({
                    status: 'RETURNED',
                    returnToken: null,
                    updatedAt: new Date()
                })
                .where(eq(items.id, item.id));

            await tx.insert(itemStatusHistory).values({
                itemId: item.id,
                message: 'Item physical handover confirmed via QR',
                changedBy: req.user._id,
                role: req.user.role,
            });
        });

        const [updatedItem] = await db.select().from(items).where(eq(items.id, req.params.id));
        res.json(formatItem(updatedItem));
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

module.exports = {
    createItem,
    getAllItems,
    getItemById,
    submitClaim,
    startVerification,
    decideClaim,
    deleteItem,
    getReturnToken,
    scanReturnItem,
};
