import app from "./app.js";

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "127.0.0.1";

app.listen(PORT, HOST, () => {
  console.log(`Academic Simulation backend running at http://${HOST}:${PORT}`);
});
