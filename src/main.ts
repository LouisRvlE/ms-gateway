import express, { Request, Response, NextFunction } from "express";
import amqp from "amqplib";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const connectionString = "amqp://rabbitmq";

const app = express();
app.use(express.json());

const msClientsUrl = `http://${process.env.SERVER_IP}:3002`;
const msTicketsUrl = `http://${process.env.SERVER_IP}:5000`;
const msProductsUrl = `http://${process.env.SERVER_IP}:3004`;

function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ error: "No token provided" });
        }

        const parts = authHeader.split(" ");
        if (parts.length !== 2) {
            return res.status(401).json({ error: "Token error" });
        }

        const [scheme, token] = parts;
        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({ error: "Token malformatted" });
        }

        jwt.verify(token, jwtSecret as string, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: "Token invalid" });
            }
            next();
        });
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ error: error.message, originalError: { ...error } });
    }
}

app.use((req, res, next) => {
    if (req.path === "/login") {
        return next();
    }
    authMiddleware(req, res, next);
});

const publishMessage = async (queue: string, message: string) => {
    try {
        const connection = await amqp.connect(connectionString);
        const channel = await connection.createChannel();
        await channel.assertQueue(queue, { durable: false });
        channel.sendToQueue(queue, Buffer.from(message));
        console.log(`Message sent to queue ${queue}:`, message);
    } catch (error) {
        console.error(
            new Error("An error occurred while sending the message to RabbitMQ")
        );
    }
};

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
        publishMessage(
            "user-list",
            JSON.stringify({ date: new Date().toISOString(), users: data })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
    }
});

app.get("/users/:id", async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${msClientsUrl}/users/${req.params.id}`);
        const data = await handleFetchResponse(response);
        publishMessage(
            "user-details",
            JSON.stringify({ userId: req.params.id, details: data })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
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
        publishMessage(
            "user-creation",
            JSON.stringify({ ...req.body, date: new Date().toISOString() })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
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
        publishMessage(
            "user-update",
            JSON.stringify({ userId: req.params.id, ...req.body })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
    }
});

app.delete("/users/:id", async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${msClientsUrl}/users/${req.params.id}`, {
            method: "DELETE",
        });
        const data = await handleFetchResponse(response);
        publishMessage(
            "user-deletion",
            JSON.stringify({
                userId: req.params.id,
                date: new Date().toISOString(),
            })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
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
        publishMessage(
            "user-tickets",
            JSON.stringify({ userId: req.params.userId, tickets: data })
        );
        res.json(data);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
    }
});

app.get("/tickets/:id", async (req: Request, res: Response) => {
    try {
        const response = await fetch(
            `${msTicketsUrl}/tickets/${req.params.id}`
        );
        const data = await handleFetchResponse(response);
        publishMessage(
            "user-tickets",
            JSON.stringify({ userId: req.params.id, tickets: data })
        );
        res.json(data);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
    }
});

app.get("/users/:userId/tickets", async (req: Request, res: Response) => {
    try {
        const response = await fetch(
            `${msTicketsUrl}/users/${req.params.userId}/tickets`
        );
        const data = await handleFetchResponse(response);
        publishMessage(
            "user-tickets",
            JSON.stringify({ userId: req.params.userId, tickets: data })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
    }
});

app.get("/products/:productId/tickets", async (req: Request, res: Response) => {
    try {
        const response = await fetch(
            `${msTicketsUrl}/products/${req.params.productId}/tickets`
        );
        const data = await handleFetchResponse(response);
        publishMessage(
            "product-tickets",
            JSON.stringify({ productId: req.params.productId, tickets: data })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
    }
});

app.get("/products/:productId", async (req: Request, res: Response) => {
    try {
        const response = await fetch(
            `${msProductsUrl}/products/${req.params.productId}`
        );
        const data = await handleFetchResponse(response);
        publishMessage(
            "product-details",
            JSON.stringify({ productId: req.params.productId, details: data })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
    }
});

app.get("/products", async (_req: Request, res: Response) => {
    try {
        const response = await fetch(`${msProductsUrl}/products`);
        const data = await handleFetchResponse(response);
        publishMessage(
            "product-list",
            JSON.stringify({ date: new Date().toISOString(), products: data })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
    }
});

app.get("/products/category/:category", async (req: Request, res: Response) => {
    try {
        const response = await fetch(
            `${msProductsUrl}/products/category/${req.params.category}`
        );
        const data = await handleFetchResponse(response);
        publishMessage(
            "product-category",
            JSON.stringify({ category: req.params.category, products: data })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
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
        publishMessage(
            "product-creation",
            JSON.stringify({ ...req.body, date: new Date().toISOString() })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
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
        publishMessage(
            "product-update",
            JSON.stringify({ productId: req.params.id, ...req.body })
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
    }
});

app.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const token = jwt.sign(
            { userId: email, email: password },
            jwtSecret as string,
            { expiresIn: "1h" }
        );
        publishMessage(
            "login-attempt",
            JSON.stringify({ email, date: new Date().toISOString() })
        );
        res.json({ token });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            error: error.message,
            originalError: { ...error },
        });
    }
});

const PORT = 3006;
app.listen(PORT, () => {
    console.log(`Gateway is running on http://localhost:${PORT}`);
});
