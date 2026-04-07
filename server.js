const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Calculation = require('./models/Calculation');
const Note = require('./models/Note');
const TaxRecord = require('./models/TaxRecord');

const app = express();
const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/webtech';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    return res.json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error creating user.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    return res.json({ message: 'Login successful.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

app.post('/api/calculate', async (req, res) => {
  try {
    const { expression } = req.body;

    if (!expression) {
      return res.status(400).json({ error: 'Expression is required.' });
    }

    // Simple evaluation using eval (in production, use a safer library like mathjs)
    let result;
    try {
      result = eval(expression);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid expression.' });
    }

    // Save to database
    const calc = new Calculation({
      expression,
      result: result.toString(),
    });
    await calc.save();

    return res.json({ result: result.toString() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error during calculation.' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const history = await Calculation.find().sort({ createdAt: -1 }).limit(10);
    return res.json(history);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error fetching history.' });
  }
});

app.delete('/api/history', async (req, res) => {
  try {
    await Calculation.deleteMany({});
    return res.json({ message: 'Calculation history cleared.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error clearing history.' });
  }
});

app.post('/api/tax', async (req, res) => {
  try {
    const { username, fromYear, toYear, annualIncome, deductions } = req.body;

    if (!username || !fromYear || !toYear || annualIncome === undefined || annualIncome === null || annualIncome === '') {
      return res.status(400).json({ error: 'Username, year range and income are required.' });
    }

    const from = parseInt(fromYear, 10);
    const to = parseInt(toYear, 10);
    const income = Number(annualIncome);
    const deduct = Number(deductions || 0);

    if (isNaN(from) || isNaN(to) || isNaN(income) || isNaN(deduct)) {
      return res.status(400).json({ error: 'Invalid numeric values.' });
    }

    if (from > to) {
      return res.status(400).json({ error: 'From year must be before To year.' });
    }

    const taxableIncome = Math.max(0, income - deduct);
    const years = to - from + 1;

    if (years < 1) {
      return res.status(400).json({ error: 'Invalid year range.' });
    }

    const taxAmount = 1000 + Math.max(0, years - 1) * 1200;
    const effectiveRate = taxableIncome > 0 ? Number(((taxAmount / taxableIncome) * 100).toFixed(2)) : 0;

    const taxRecord = new TaxRecord({
      username: username.trim(),
      fromYear: from,
      toYear: to,
      annualIncome: income,
      deductions: deduct,
      taxableIncome,
      taxAmount: Number(taxAmount.toFixed(2)),
      effectiveRate,
    });

    await taxRecord.save();

    return res.json({
      username: taxRecord.username,
      fromYear: taxRecord.fromYear,
      toYear: taxRecord.toYear,
      annualIncome: taxRecord.annualIncome,
      deductions: taxRecord.deductions,
      taxableIncome: taxRecord.taxableIncome,
      taxAmount: taxRecord.taxAmount,
      effectiveRate: taxRecord.effectiveRate,
      years,
      message: 'Tax record saved successfully.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error calculating tax.' });
  }
});

app.get('/api/tax-history', async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: 'Username query parameter is required.' });
    }

    const history = await TaxRecord.find({
      username: { $regex: `^${username.trim()}$`, $options: 'i' },
    }).sort({ createdAt: -1 });

    return res.json(history);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error fetching tax history.' });
  }
});

app.delete('/api/tax-history', async (req, res) => {
  try {
    await TaxRecord.deleteMany({});
    return res.json({ message: 'Tax history cleared.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error clearing tax history.' });
  }
});

app.get('/api/notes/:page', async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.page);
    const notes = await Note.find({ pageNumber }).sort({ createdAt: -1 });
    return res.json(notes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error fetching notes.' });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { pageNumber, note, author } = req.body;

    if (!pageNumber || !note) {
      return res.status(400).json({ error: 'Page number and note are required.' });
    }

    const newNote = new Note({
      pageNumber: parseInt(pageNumber),
      note,
      author: author || 'Anonymous',
    });

    await newNote.save();
    return res.json({ message: 'Note added successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error adding note.' });
  }
});

app.get('/', (req, res) => {
  return res.redirect('/login.html');
});
