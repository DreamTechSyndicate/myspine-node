import { CorsOptions } from 'cors'
import 'dotenv/config'

type OriginCallback = (err: Error | null, origin?: boolean) => void

export const corsOptions: CorsOptions = {
  origin: (origin, callback: OriginCallback) => {
    if (origin === process.env.CLIENT_URL || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
}