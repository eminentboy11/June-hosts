import { Router, type IRouter } from "express";
import { requireAdmin } from "../lib/auth";
import { getNgnPerCoin, getPlans, savePlans } from "../lib/plans";

const router: IRouter = Router();
const response = async () => {
  const [plans, ngnPerCoin] = await Promise.all([getPlans(), getNgnPerCoin()]);
  return { plans, ngnPerCoin, coinsPerNgn: 1 / ngnPerCoin, chargeCurrency: "NGN" };
};

router.get("/plans", async (_req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  res.json(await response());
});

router.get("/admin/plans", requireAdmin, async (_req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  res.json(await response());
});

router.put("/admin/plans", requireAdmin, async (req, res): Promise<void> => {
  const plans = await savePlans(req.body?.plans, req.body?.ngnPerCoin);
  if (!plans) {
    res.status(400).json({ error: "Choose a coin value from NGN 0.01 to NGN 100,000 and add 1–12 valid plans (1–365 days, 1–500,000 coins)" });
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  res.json(await response());
});

export default router;
