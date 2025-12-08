-- 1. SETUP EXTENSIONS & FUNCTIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function: Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;

-- Function: Tự động sinh mã đơn hàng (ORD-YYYYMMDD-XXXXX)
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  next_number INTEGER;
  new_order_number VARCHAR(50);
BEGIN
  SELECT count(*) + 1 INTO next_number FROM orders;
  new_order_number := 'ORD-' || TO_CHAR(CURRENT_DATE,'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 5, '0');
  NEW.order_number := new_order_number;
  RETURN NEW;
END;
$$;

-- Function: Cập nhật tồn kho
CREATE OR REPLACE FUNCTION update_product_stock(product_uuid uuid, quantity_change integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + quantity_change,
      updated_at = now()
  WHERE id = product_uuid;
END;
$$;

-- Function: Trigger role permissions
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. CREATE TABLES

-- Table: Users
CREATE TABLE IF NOT EXISTS users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email character varying(255) NOT NULL UNIQUE,
    password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20),
    role character varying(50) DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    avatar_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: App Settings
CREATE TABLE IF NOT EXISTS app_settings (
    id integer DEFAULT 1 PRIMARY KEY CHECK (id = 1),
    store_name character varying(255) DEFAULT 'LOSPEC',
    store_address text,
    store_phone character varying(50),
    store_email character varying(100),
    tax_rate numeric(5,2) DEFAULT 0,
    currency character varying(10) DEFAULT 'VND',
    bank_account_no character varying(50),
    bank_name character varying(100),
    bank_owner character varying(100),
    qr_code_url text,
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: Customers
CREATE TABLE IF NOT EXISTS customers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    address text,
    city character varying(100),
    customer_type character varying(50) DEFAULT 'regular' CHECK (customer_type IN ('vip', 'regular', 'wholesale')),
    loyalty_points integer DEFAULT 0 CHECK (loyalty_points >= 0),
    total_spent numeric(15,2) DEFAULT 0 CHECK (total_spent >= 0),
    total_orders integer DEFAULT 0 CHECK (total_orders >= 0),
    notes text,
    birth_date date,
    gender character varying(20) DEFAULT 'male',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: Products
CREATE TABLE IF NOT EXISTS products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(255) NOT NULL,
    sku character varying(100) NOT NULL UNIQUE,
    barcode character varying(100),
    category character varying(100),
    description text,
    unit character varying(50) DEFAULT 'piece',
    price numeric(15,2) DEFAULT 0 CHECK (price >= 0),
    cost numeric(15,2) DEFAULT 0 CHECK (cost >= 0),
    stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock integer DEFAULT 10 CHECK (min_stock >= 0),
    max_stock integer DEFAULT 1000 CHECK (max_stock >= 0),
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(255) NOT NULL,
    contact_person character varying(255),
    email character varying(255),
    phone character varying(20),
    address text,
    city character varying(100),
    tax_code character varying(50),
    payment_terms text,
    bank_account character varying(100),
    bank_name character varying(255),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title character varying(255) NOT NULL,
    amount numeric(15,2) NOT NULL CHECK (amount > 0),
    category character varying(50) CHECK (category IN ('rent', 'utilities', 'salary', 'marketing', 'equipment', 'import', 'other', 'operating')),
    payment_method character varying(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'card')),
    expense_date date DEFAULT CURRENT_DATE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    receipt_url text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: Promotions
CREATE TABLE IF NOT EXISTS promotions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code character varying(50) NOT NULL UNIQUE,
    name character varying(255) NOT NULL,
    type character varying(20) CHECK (type IN ('percentage', 'fixed')),
    value numeric(15,2) NOT NULL CHECK (value > 0),
    min_order_value numeric(15,2) DEFAULT 0,
    max_discount numeric(15,2) DEFAULT 0,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    usage_limit integer DEFAULT 0,
    used_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: Orders
CREATE TABLE IF NOT EXISTS orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number character varying(50) UNIQUE,
    customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    order_date timestamp with time zone DEFAULT now(),
    status character varying(50) DEFAULT 'completed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded')),
    subtotal numeric(15,2) DEFAULT 0 CHECK (subtotal >= 0),
    discount numeric(15,2) DEFAULT 0 CHECK (discount >= 0),
    tax numeric(15,2) DEFAULT 0 CHECK (tax >= 0),
    total numeric(15,2) DEFAULT 0 CHECK (total >= 0),
    payment_method character varying(50) CHECK (payment_method IN ('cash', 'card', 'transfer', 'qr')),
    payment_status character varying(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    product_name character varying(255) NOT NULL,
    product_sku character varying(100),
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(15,2) NOT NULL CHECK (unit_price >= 0),
    total numeric(15,2) NOT NULL CHECK (total >= 0),
    created_at timestamp with time zone DEFAULT now()
);

-- Table: Purchase Orders (Nhập kho)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    po_number character varying(50) NOT NULL UNIQUE,
    supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    order_date timestamp with time zone DEFAULT now(),
    expected_delivery date,
    actual_delivery date,
    status character varying(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'received', 'cancelled')),
    subtotal numeric(15,2) DEFAULT 0 CHECK (subtotal >= 0),
    tax numeric(15,2) DEFAULT 0 CHECK (tax >= 0),
    shipping_fee numeric(15,2) DEFAULT 0 CHECK (shipping_fee >= 0),
    total numeric(15,2) DEFAULT 0 CHECK (total >= 0),
    payment_status character varying(50) DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: Warehouse Transactions (Lịch sử kho)
CREATE TABLE IF NOT EXISTS warehouse_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type character varying(50) NOT NULL CHECK (transaction_type IN ('import', 'export', 'transfer', 'adjustment', 'return')),
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    quantity integer NOT NULL,
    unit_price numeric(15,2),
    total numeric(15,2),
    reference_type character varying(50), -- 'order', 'purchase_order', 'manual'
    reference_id uuid,
    from_location character varying(100),
    to_location character varying(100),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
    notes text,
    transaction_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Table: Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role character varying(20) NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
    module character varying(50) NOT NULL,
    can_view boolean DEFAULT true,
    can_create_edit boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(role, module)
);

-- Table: Staff Attendance
CREATE TABLE IF NOT EXISTS staff_attendance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    work_hours numeric(5,2),
    overtime_hours numeric(5,2) DEFAULT 0,
    date date NOT NULL,
    status character varying(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'leave', 'sick')),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, date)
);

-- 3. CREATE VIEWS

-- View: Low Stock
CREATE OR REPLACE VIEW low_stock_products AS
SELECT id, name, sku, category, stock_quantity, min_stock, price, (min_stock - stock_quantity) AS shortage
FROM products
WHERE stock_quantity <= min_stock AND is_active = true
ORDER BY stock_quantity;

-- View: Daily Sales
CREATE OR REPLACE VIEW view_daily_sales AS
SELECT date(created_at) AS date,
count(id) AS total_orders,
sum(total) AS revenue,
sum(subtotal) AS subtotal,
sum(discount) AS discount
FROM orders
WHERE status = 'completed' AND payment_status = 'paid'
GROUP BY date(created_at)
ORDER BY date(created_at) DESC;

-- View: Top Products
CREATE OR REPLACE VIEW view_top_products AS
SELECT p.id, p.name, p.sku,
sum(oi.quantity) AS sold_quantity,
sum(oi.total) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY p.id, p.name, p.sku
ORDER BY sum(oi.quantity) DESC;

-- 4. CREATE INDEXES & TRIGGERS
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON staff_attendance(user_id, date);

-- Attach Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_role_permissions_updated_at BEFORE UPDATE ON role_permissions FOR EACH ROW EXECUTE FUNCTION update_role_permissions_updated_at();

-- Auto generate Order Number
CREATE TRIGGER auto_generate_order_number BEFORE INSERT ON orders FOR EACH ROW WHEN (new.order_number IS NULL) EXECUTE FUNCTION generate_order_number();

-- 5. SEED DATA (DỮ LIỆU MẪU)

-- Seed App Settings
INSERT INTO app_settings (id, store_name, tax_rate, currency)
VALUES (1, 'LOSPEC STORE', 0, 'VND')
ON CONFLICT (id) DO NOTHING;

-- Seed Admin User (Password: admin123)
-- Hash này tương ứng với 'admin123'
INSERT INTO users (id, email, password, full_name, role, is_active)
VALUES
('5b897853-7e2c-472b-8bd9-bba6abdedcfa', 'admin@lospec.com', '$2b$10$k2FBlZYgm8pjpa0s5jXU9OPGaJu5QXgNL7adlXil7a3PI47n.QwMi', 'Administrator', 'admin', true)
ON CONFLICT (email) DO NOTHING;