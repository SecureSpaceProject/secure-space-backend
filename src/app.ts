import "dotenv/config";
import db from "./data-source";

async function bootstrap() {
  try {
    await db.initialize();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection error", err);
    process.exit(1);
  }
}

bootstrap();
