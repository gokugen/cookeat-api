import { NextFunction, Response } from "express";
import { Request } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function getCurrentSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user.subscriptionId) {
      return res.status(200).send({
        hasSubscription: false,
        subscription: null
      });
    }

    // Récupérer les détails de l'abonnement depuis Stripe
    const subscription = await stripe.subscriptions.retrieve(req.user.subscriptionId);

    res.status(200).send({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        items: subscription.items.data.map((item: any) => ({
          priceId: item.price.id,
          quantity: item.quantity
        }))
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
}

async function cancelSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    // Annuler l'abonnement à la fin de la période
    const subscription = await stripe.subscriptions.update(req.user.subscriptionId, {
      cancel_at_period_end: true
    });

    // Mettre à jour le statut dans notre base de données
    req.user.subscriptionStatus = subscription.status;
    await req.user.save();

    res.status(200).send({
      message: "Subscription cancelled",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
}

async function reactivateSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    // Réactiver l'abonnement
    const subscription = await stripe.subscriptions.update(req.user.subscriptionId, {
      cancel_at_period_end: false
    });

    // Mettre à jour le statut dans notre base de données
    req.user.subscriptionStatus = subscription.status;
    await req.user.save();

    res.status(200).send({
      message: "Subscription reactivated",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
}



export {
  getCurrentSubscription,
  cancelSubscription,
  reactivateSubscription
}; 