const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve frontend
app.use(express.static("public"));

// Stream TTS audio
app.get("/stream", (req, res) => {
    const text = req.query.text || "Hello student";

    const py = spawn("python3", ["test.py", text]);

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Transfer-Encoding", "chunked");

    py.stdout.on("data", (chunk) => {
        res.write(chunk);
    });

    py.on("close", () => {
        res.end();
    });

    py.stderr.on("data", (err) => {
        console.error("Python error:", err.toString());
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});