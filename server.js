const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/apps/vehicle-search", async (req, res) => {
  const { make, model, year } = req.query;

  if (!make || !model || !year) {
    return res.status(400).json({ error: "Missing query params" });
  }

  const query = `
    {
      products(first: 20, query: "metafield:vehicle.make='${make}' metafield:vehicle.model='${model}' metafield:vehicle.year='${year}'") {
        edges {
          node {
            id
            title
            onlineStoreUrl
            images(first: 1) {
              edges {
                node {
                  originalSrc
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  price {
                    amount
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`${process.env.SHOPIFY_STORE}/admin/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    const products = data.data.products.edges.map(({ node }) => ({
      title: node.title,
      image: node.images.edges[0]?.node.originalSrc || "",
      price: `$${node.variants.edges[0]?.node.price.amount || "0.00"}`,
      url: node.onlineStoreUrl
    }));

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
