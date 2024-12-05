import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

const msClientsUrl = "http://localhost:3000";
const msTicketsUrl = "http://localhost:5000";
const msProductsUrl = "http://localhost:3004";

const handleFetchResponse = async (response: globalThis.Response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "An error occurred");
    }
    return response.json();
};

app.get("/users", async (_req: Request, res: Response) => {
    try {
        const response = await fetch(`${msClientsUrl}/users`);
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/users/:id", async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${msClientsUrl}/users/${req.params.id}`);
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/users", async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${msClientsUrl}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/users/:id", async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${msClientsUrl}/users/${req.params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/users/:id", async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${msClientsUrl}/users/${req.params.id}`, {
            method: "DELETE",
        });
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/tickets", async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${msTicketsUrl}/tickets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/tickets/:id", async (req: Request, res: Response) => {
    try {
        const response = await fetch(
            `${msTicketsUrl}/tickets/${req.params.id}`
        );
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/users/:userId/tickets", async (req: Request, res: Response) => {
    try {
        const response = await fetch(
            `${msTicketsUrl}/users/${req.params.userId}/tickets`
        );
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/products/:productId/tickets", async (req: Request, res: Response) => {
    try {
        const response = await fetch(
            `${msTicketsUrl}/products/${req.params.productId}/tickets`
        );
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/products", async (_req: Request, res: Response) => {
    try {
        const response = await fetch(`${msProductsUrl}/products`);
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/products/category/:category", async (req: Request, res: Response) => {
    try {
        const response = await fetch(
            `${msProductsUrl}/products/category/${req.params.category}`
        );
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/products", async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${msProductsUrl}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/products/:id", async (req: Request, res: Response) => {
    try {
        const response = await fetch(
            `${msProductsUrl}/products/${req.params.id}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req.body),
            }
        );
        const data = await handleFetchResponse(response);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Gateway is running on http://localhost:${PORT}`);
});
