import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'foodbridge_data.json');

export interface FoodItem {
  id: string;
  donorName: string;
  donorPhone: string;
  foodName: string;
  quantity: number; // number of servings
  quantityKg?: number;
  location: string; // city / area / address
  foodType: 'veg' | 'non_veg';
  pickupDeadline: string;
  notes?: string;
  status: 'available' | 'claimed' | 'completed';
  createdAt: string;
  claimedBy?: {
    name: string;
    type: 'NGO' | 'Helping Person';
    orgName?: string;
    phone: string;
    claimedAt: string;
  };
}

function getInitialData(): FoodItem[] {
  const now = Date.now();
  return [
    {
      id: 'f_1',
      donorName: 'Chef Vikram (Taj West End)',
      donorPhone: '9845012345',
      foodName: 'Paneer Makhani & Vegetable Pulao',
      quantity: 50,
      quantityKg: 18,
      location: 'Race Course Rd, High Grounds, Bengaluru',
      foodType: 'veg',
      pickupDeadline: new Date(now + 6 * 3600000).toISOString(),
      notes: 'Fresh buffet surplus packed in sealed food-grade containers.',
      status: 'available',
      createdAt: new Date(now - 2 * 3600000).toISOString(),
    },
    {
      id: 'f_2',
      donorName: 'Bawarchi Grand Catering',
      donorPhone: '9880198765',
      foodName: 'Hyderabadi Dum Vegetable Biryani',
      quantity: 70,
      quantityKg: 28,
      location: '100ft Road, 4th Block, Koramangala, Bengaluru',
      foodType: 'veg',
      pickupDeadline: new Date(now + 8 * 3600000).toISOString(),
      notes: 'Catering surplus prepared in pure ghee. Kept warm in thermoware boxes.',
      status: 'available',
      createdAt: new Date(now - 3 * 3600000).toISOString(),
    },
    {
      id: 'f_3',
      donorName: 'The Daily Loaf Bakery',
      donorPhone: '9741234567',
      foodName: 'Whole Wheat Bread Loaves & Pav Buns',
      quantity: 45,
      quantityKg: 14,
      location: '12th Main, HAL 2nd Stage, Indiranagar, Bengaluru',
      foodType: 'veg',
      pickupDeadline: new Date(now + 24 * 3600000).toISOString(),
      notes: 'Day-end fresh unsold loaves. Excellent for shelter breakfast.',
      status: 'available',
      createdAt: new Date(now - 4 * 3600000).toISOString(),
    },
    {
      id: 'f_4',
      donorName: 'Royal Orchid Banquets',
      donorPhone: '9448123456',
      foodName: 'South Indian Sambar, Rice & Curd Rice',
      quantity: 80,
      quantityKg: 30,
      location: 'Old Airport Road, Kodihalli, Bengaluru',
      foodType: 'veg',
      pickupDeadline: new Date(now - 2 * 3600000).toISOString(),
      notes: 'Distributed to evening shelter camp.',
      status: 'claimed',
      createdAt: new Date(now - 8 * 3600000).toISOString(),
      claimedBy: {
        name: 'Sister Anita',
        type: 'NGO',
        orgName: 'Robin Hood Army Foundation',
        phone: '9811223344',
        claimedAt: new Date(now - 4 * 3600000).toISOString(),
      },
    },
  ];
}

function readData(): FoodItem[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('Error reading foodbridge_data.json, seeding:', err);
  }
  const init = getInitialData();
  writeData(init);
  return init;
}

function writeData(data: FoodItem[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write foodbridge_data.json:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  let items = readData();

  // 1. Get all food items
  app.get('/api/food', (_req: Request, res: Response) => {
    res.json({ items });
  });

  // 2. Post new food (Donor)
  app.post('/api/food', (req: Request, res: Response) => {
    const { donorName, donorPhone, foodName, quantity, quantityKg, location, foodType, notes, pickupDeadline } = req.body;

    if (!donorName || !foodName || !quantity || !location) {
      return res.status(400).json({ error: 'Donor Name, Food Name, Quantity, and Location are required.' });
    }

    const newItem: FoodItem = {
      id: `f_${Date.now()}`,
      donorName: donorName.trim(),
      donorPhone: donorPhone?.trim() || 'Provided on pickup',
      foodName: foodName.trim(),
      quantity: Number(quantity),
      quantityKg: quantityKg ? Number(quantityKg) : Math.round(Number(quantity) * 0.35 * 10) / 10,
      location: location.trim(),
      foodType: foodType === 'non_veg' ? 'non_veg' : 'veg',
      pickupDeadline: pickupDeadline || new Date(Date.now() + 12 * 3600000).toISOString(),
      notes: notes?.trim() || '',
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    items.unshift(newItem);
    writeData(items);

    res.status(201).json({ message: 'Food posted successfully!', item: newItem });
  });

  // 3. Claim food (NGO or Helping Person)
  app.post('/api/food/:id/claim', (req: Request, res: Response) => {
    const { id } = req.params;
    const { receiverName, receiverType, orgName, phone } = req.body;

    if (!receiverName || !phone) {
      return res.status(400).json({ error: 'Name and Phone number are required.' });
    }

    const item = items.find((f) => f.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Food listing not found.' });
    }

    if (item.status !== 'available') {
      return res.status(400).json({ error: 'This food has already been claimed.' });
    }

    item.status = 'claimed';
    item.claimedBy = {
      name: receiverName.trim(),
      type: receiverType === 'Helping Person' ? 'Helping Person' : 'NGO',
      orgName: orgName?.trim() || (receiverType === 'NGO' ? 'Registered NGO' : 'Individual Volunteer'),
      phone: phone.trim(),
      claimedAt: new Date().toISOString(),
    };

    writeData(items);

    res.json({
      message: `Food successfully claimed for ${item.claimedBy.name}!`,
      item,
      donorPhone: item.donorPhone,
      location: item.location,
    });
  });

  // 4. Quick platform stats - calculated purely from real donor listings
  app.get('/api/stats', (_req: Request, res: Response) => {
    let totalMeals = 0;
    const uniqueDonors = new Set<string>();
    const uniqueCities = new Set<string>();

    for (const f of items) {
      totalMeals += Number(f.quantity) || 0;
      if (f.donorName) {
        uniqueDonors.add(f.donorName.trim().toLowerCase());
      }
      if (f.location) {
        // Extract city (last part of comma separated location, e.g. "Race Course Rd, Bengaluru" -> "Bengaluru")
        const parts = f.location.split(',');
        const cityCandidate = parts[parts.length - 1].trim();
        uniqueCities.add(cityCandidate.toLowerCase());
      }
    }

    res.json({
      mealsDonated: totalMeals,
      activeDonors: uniqueDonors.size,
      citiesCovered: Math.max(1, uniqueCities.size),
      availableCount: items.filter((f) => f.status === 'available').length,
    });
  });

  // 5. Download complete source code archive (.zip)
  app.get('/api/download', (_req: Request, res: Response) => {
    const zipPath = path.join(process.cwd(), 'public', 'fooddonors-app.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="fooddonors-app.zip"');
      return res.sendFile(zipPath);
    }
    return res.status(404).send('Archive not found. Please try again.');
  });

  // Dev server / Vite middleware mounting
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Foodbridge Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
