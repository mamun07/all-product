const express = require('express');
const fetch = require('node-fetch');
const app = express();

const SHOPIFY_STORE = 'test-1300655506.myshopify.com';
const ACCESS_TOKEN = '881c8712ea55a867e62e0b4c848eaeb9'; // Your Storefront Access Token

app.use(express.json());

// Enable CORS for all origins (for demo, you can restrict to your frontend domain)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/search', async (req, res) => {
  const { make, model } = req.query;
  if (!make || !model) {
    return res.status(400).json({ error: 'Make and model query parameters required' });
  }

  const queryStr = `metafield:custom.make:'${make}' metafield:custom.model:'${model}'`;

  const graphqlQuery = `
    {
      products(first: 100, query: "${queryStr}") {
        edges {
          node {
            title
            handle
            metafields(namespace: "custom", keys: ["make", "model"]) {
              key
              value
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${SHOPIFY_STORE}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': ACCESS_TOKEN,
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    const json = await response.json();
    if (json.errors) {
      return res.status(500).json({ errors: json.errors });
    }

    // Return product edges directly
    res.json(json.data.products.edges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server listening on port ${PORT}`));
