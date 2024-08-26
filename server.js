const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const cache = new NodeCache({ stdTTL: 3600 }); // Cache TTL of 1 hour

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 3600, // per 1 hour
});

const vendors = [
  {
    name: 'ipstack',
    url: `http://api.ipstack.com`,
    key: process.env.IPSTACK_API_KEY,
    getCountry: (data) => data.country_name,
  },
  {
    name: 'ipapi',
    url: `https://ipapi.co`,
    key: null,
    getCountry: (data) => data.country_name,
  },
];

app.get('/get-country', async (req, res) => {
  const ipAddress = req.query.ip;

  if (!ipAddress) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  // Check cache
  const cachedCountry = cache.get(ipAddress);
  if (cachedCountry) {
    return res.json({ country: cachedCountry, source: 'cache' });
  }

  for (let vendor of vendors) {
    try {
      await rateLimiter.consume(vendor.name); // Consume 1 point

      const response = await axios.get(
        vendor.key
          ? `${vendor.url}/${ipAddress}?access_key=${vendor.key}`
          : `${vendor.url}/${ipAddress}/json`
      );

      const country = vendor.getCountry(response.data);
      if (country) {
        cache.set(ipAddress, country); // Save to cache
        return res.json({ country, source: vendor.name });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log(`Error from ${vendor.name}:`, error.message);
      } else {
        console.log(`Rate limit exceeded for ${vendor.name}`);
      }
    }
  }

  res.status(429).json({
    error: 'Rate limit exceeded for all vendors or no valid response received',
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
