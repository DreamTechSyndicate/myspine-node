import express from "express";
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = process.env.PORT;

app.use(cors());

app.get("/", (_req, res) => {
  res.send("My Spine: Powered by Node.js")
})

app.listen(process.env.PORT, () => {
  console.log(`Listening on port: ${port}!`)
})