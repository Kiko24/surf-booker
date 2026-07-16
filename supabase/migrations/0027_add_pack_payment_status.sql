-- Add offline payment fields to schools
alter table schools add column payment_iban text;
alter table schools add column payment_mbway text;

-- Add payment tracking to pack_purchases
alter table pack_purchases add column payment_status text not null default 'pendente'
  check (payment_status in ('pendente', 'pago', 'reembolsado'));

alter table pack_purchases add column payment_method text
  check (payment_method in ('stripe', 'multibanco', 'mbway', 'transferencia'));

-- Allow 'pending_payment' status for packs awaiting offline payment confirmation
alter table pack_purchases drop constraint if exists pack_purchases_status_check;
alter table pack_purchases add constraint pack_purchases_status_check
  check (status in ('active', 'exhausted', 'cancelled', 'pending_payment'));
