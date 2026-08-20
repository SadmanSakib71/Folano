import cron from "node-cron";
import { cancelUnpaidPreorders } from "./cancelUnpaidPreorders";

export function startJobs() {
  cron.schedule("*/5 * * * *", () => {
    void cancelUnpaidPreorders();
  });
}
