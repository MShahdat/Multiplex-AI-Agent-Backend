import Stripe from "stripe";
import config from "../config/index.js";


export const stripe = new Stripe(config.stripe_sercet_key as string)

