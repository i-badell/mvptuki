-- Migration: Enable Supabase Realtime for order status and payment failure notifications
-- Feature: 001-festival-order-flow

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_failures;
