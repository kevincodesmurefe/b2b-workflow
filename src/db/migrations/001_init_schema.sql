-- ============================================================
-- Wholesale & Distribution Platform — Initial Schema
-- PostgreSQL
-- ============================================================

-- ---------- TENANTS & AUTH ----------

CREATE TABLE tenants (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(30) NOT NULL CHECK (
                        role IN ('super_admin', 'business_admin', 'warehouse_manager', 'sales_rep', 'delivery_agent')
                    ),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- an email must be unique WITHIN a tenant, not globally
    -- (two different distributors can each have a user "admin@theirstore.com")
    UNIQUE (tenant_id, email)
);

-- refresh tokens / sessions — one row per active login session
CREATE TABLE sessions (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash  TEXT NOT NULL,
    device_name         TEXT,
    expires_at          TIMESTAMP NOT NULL,
    created_at          TIMESTAMP DEFAULT NOW(),
    is_active           BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at) WHERE is_active = true;



CREATE TABLE password_resets (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);

-- ---------- WAREHOUSES ----------

CREATE TABLE warehouses (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    address     VARCHAR(500),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warehouses_tenant_id ON warehouses(tenant_id);

-- ---------- PRODUCTS ----------

CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku         VARCHAR(100) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    unit_price  NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- SKU must be unique per tenant, not globally
    UNIQUE (tenant_id, sku)
);

CREATE INDEX idx_products_tenant_id ON products(tenant_id);

-- ---------- INVENTORY (per warehouse, NOT on product) ----------

CREATE TABLE inventory (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id    BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level   INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- one stock row per (warehouse, product) pair
    UNIQUE (warehouse_id, product_id)
);

-- the query you'll run constantly: "stock for this product across this tenant's warehouses"
CREATE INDEX idx_inventory_tenant_product ON inventory(tenant_id, product_id);
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);

-- append-only ledger — every quantity change writes a row here, quantity itself is never trusted alone
CREATE TABLE stock_movements (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id    BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    change_quantity INTEGER NOT NULL, -- positive = stock in, negative = stock out
    reason          VARCHAR(30) NOT NULL CHECK (
                        reason IN ('purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return')
                    ),
    reference_type  VARCHAR(30), -- e.g. 'order', 'transfer' — loose pointer, no FK (polymorphic)
    reference_id    BIGINT,
    created_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_tenant_product ON stock_movements(tenant_id, product_id);
CREATE INDEX idx_stock_movements_warehouse_id ON stock_movements(warehouse_id);
-- lookups like "all movements caused by order #123"
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

-- ---------- INVENTORY TRANSFERS (between warehouses) ----------

CREATE TABLE inventory_transfers (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    from_warehouse_id   BIGINT NOT NULL REFERENCES warehouses(id),
    to_warehouse_id     BIGINT NOT NULL REFERENCES warehouses(id),
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    status              VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
                            status IN ('pending', 'in_transit', 'completed', 'cancelled')
                        ),
    created_by          BIGINT REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (from_warehouse_id != to_warehouse_id)
);

CREATE INDEX idx_inventory_transfers_tenant_id ON inventory_transfers(tenant_id);

-- ---------- B2B CUSTOMERS ----------

CREATE TABLE customers (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_name   VARCHAR(255) NOT NULL,
    contact_phone   VARCHAR(30),
    contact_email   VARCHAR(255),
    address         VARCHAR(500),
    credit_limit    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
    credit_balance  NUMERIC(12,2) NOT NULL DEFAULT 0, -- can go negative? no — see app logic; amount currently owed
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);

-- ---------- ORDERS ----------

CREATE TABLE orders (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id     BIGINT NOT NULL REFERENCES customers(id),
    warehouse_id    BIGINT NOT NULL REFERENCES warehouses(id), -- fulfilling warehouse
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
                        status IN ('pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled')
                    ),
    total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    created_by      BIGINT REFERENCES users(id), -- sales rep who took the order
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- the bread-and-butter query: "this tenant's orders, filtered by status" (e.g. dashboard views)
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_warehouse_id ON orders(warehouse_id);

CREATE TABLE order_items (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES products(id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0), -- price AT TIME OF ORDER, not from products table
    line_total      NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ---------- INVOICES ----------

CREATE TABLE invoices (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id        BIGINT NOT NULL REFERENCES orders(id),
    customer_id     BIGINT NOT NULL REFERENCES customers(id),
    invoice_number  VARCHAR(50) NOT NULL,
    total_amount    NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    amount_paid     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    status          VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (
                        status IN ('unpaid', 'partially_paid', 'paid', 'void')
                    ),
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_at          TIMESTAMPTZ,

    UNIQUE (tenant_id, invoice_number)
);

CREATE INDEX idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);

-- ---------- PAYMENTS ----------

CREATE TABLE payments (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id      BIGINT NOT NULL REFERENCES invoices(id),
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    method          VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'mobile_money', 'bank_transfer')),
    -- external id from the payment provider webhook — THE idempotency key
    provider_reference VARCHAR(255),
    recorded_by     BIGINT REFERENCES users(id), -- null if system-recorded via webhook
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
-- prevents the same provider payment event from being recorded twice
CREATE UNIQUE INDEX idx_payments_provider_reference ON payments(provider_reference)
    WHERE provider_reference IS NOT NULL;

-- raw webhook log — every inbound webhook hit is recorded here BEFORE processing,
-- keyed on the provider's own event id, so a duplicate delivery is detected up front
CREATE TABLE payment_webhook_events (
    id              BIGSERIAL PRIMARY KEY,
    provider_event_id  VARCHAR(255) NOT NULL UNIQUE,
    payload         JSONB NOT NULL,
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- CUSTOMER LEDGER ----------

CREATE TABLE customer_ledger (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id     BIGINT NOT NULL REFERENCES customers(id),
    entry_type      VARCHAR(20) NOT NULL CHECK (
                        entry_type IN ('invoice', 'payment', 'adjustment', 'refund')
                    ),
    amount          NUMERIC(12,2) NOT NULL, -- positive = increases balance owed, negative = decreases
    reference_type  VARCHAR(30), -- e.g. 'invoice', 'payment'
    reference_id    BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- the query behind "customer statement" screens: this customer's ledger, in order
CREATE INDEX idx_customer_ledger_customer_id ON customer_ledger(customer_id, created_at);
CREATE INDEX idx_customer_ledger_tenant_id ON customer_ledger(tenant_id);

-- ---------- DELIVERIES ----------

CREATE TABLE deliveries (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id            BIGINT NOT NULL REFERENCES orders(id),
    delivery_agent_id   BIGINT REFERENCES users(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (
                            status IN ('assigned', 'in_transit', 'delivered', 'failed')
                        ),
    scheduled_at        TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliveries_tenant_status ON deliveries(tenant_id, status);
CREATE INDEX idx_deliveries_agent_id ON deliveries(delivery_agent_id);
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);

CREATE TABLE delivery_events (
    id              BIGSERIAL PRIMARY KEY,
    delivery_id     BIGINT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    event           VARCHAR(30) NOT NULL, -- e.g. 'picked_up', 'out_for_delivery', 'delivered', 'failed_attempt'
    notes           VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_events_delivery_id ON delivery_events(delivery_id);