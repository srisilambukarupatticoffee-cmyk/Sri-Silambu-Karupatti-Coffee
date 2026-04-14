import clientPromise from './_db.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { collection, id } = req.query;
  
  if (!collection) {
    return res.status(400).json({ error: 'Collection name is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("SriSilambuPOS");
    const coll = db.collection(collection);

    switch (req.method) {
      case 'GET':
        if (id) {
          const item = await coll.findOne({ id: id });
          return res.status(200).json(item);
        }
        const items = await coll.find({}).toArray();
        return res.status(200).json(items);

      case 'POST':
        const body = req.body;
        if (Array.isArray(body)) {
          // Bulk insert (used for migration)
          await coll.deleteMany({}); // Optional: clear existing if migrating? No, let's just insert.
          await coll.insertMany(body);
          return res.status(201).json({ success: true, count: body.length });
        }
        const result = await coll.insertOne(body);
        return res.status(201).json({ ...body, _id: result.insertedId });

      case 'PUT':
        if (!id) return res.status(400).json({ error: 'ID is required' });
        const update = req.body;
        // Strip _id if present to avoid Mongo error
        delete update._id;
        await coll.updateOne({ id: id }, { $set: update });
        return res.status(200).json({ success: true });

      case 'DELETE':
        if (id === 'ALL') {
          // Clear whole collection (wipe transactions)
          await coll.deleteMany({});
          return res.status(200).json({ success: true });
        }
        if (!id) return res.status(400).json({ error: 'ID is required' });
        await coll.deleteOne({ id: id });
        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
