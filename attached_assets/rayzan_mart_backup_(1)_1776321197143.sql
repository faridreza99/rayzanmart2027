--
-- PostgreSQL database dump
--

\restrict hI6T1XaEFWbnWgqnM604bh6me0aa0NZ95j9fgGLgSAy2egKmNoR0qQ3hghkagBy

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_user_id uuid NOT NULL,
    action_type character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid,
    old_value jsonb,
    new_value jsonb,
    description_bn text,
    description_en text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admin_audit_log OWNER TO postgres;

--
-- Name: affiliate_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id uuid NOT NULL,
    name_bn character varying(255) NOT NULL,
    name_en character varying(255) NOT NULL,
    url text NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    earnings numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.affiliate_campaigns OWNER TO postgres;

--
-- Name: affiliate_clicks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id uuid NOT NULL,
    clicked_at timestamp with time zone DEFAULT now(),
    ip_address character varying(50),
    referrer_url text,
    user_agent text
);


ALTER TABLE public.affiliate_clicks OWNER TO postgres;

--
-- Name: affiliates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    referral_code character varying(50) NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_details text,
    website_url text,
    marketing_plan text,
    status character varying(20) DEFAULT 'pending'::character varying,
    commission_rate numeric(5,2) DEFAULT 5,
    tier character varying(20) DEFAULT 'bronze'::character varying,
    total_clicks integer DEFAULT 0,
    total_sales numeric(12,2) DEFAULT 0,
    total_commission numeric(12,2) DEFAULT 0,
    pending_commission numeric(12,2) DEFAULT 0,
    paid_commission numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    available_balance numeric(12,2) DEFAULT 0 NOT NULL,
    CONSTRAINT affiliates_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.affiliates OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50),
    avatar_url text,
    address text,
    city character varying(100),
    district character varying(100),
    is_blocked boolean DEFAULT false,
    loyalty_points integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    date_of_birth date,
    occupation character varying(100),
    nid character varying(50),
    payment_method character varying(20),
    payment_number character varying(20)
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: affiliate_leaderboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.affiliate_leaderboard AS
 SELECT a.id,
    p.name,
    p.avatar_url,
    a.referral_code,
    a.tier,
    a.total_sales,
    a.total_commission,
    a.total_clicks,
    rank() OVER (ORDER BY a.total_sales DESC) AS rank
   FROM (public.affiliates a
     JOIN public.profiles p ON ((p.user_id = a.user_id)))
  WHERE ((a.status)::text = 'active'::text);


ALTER VIEW public.affiliate_leaderboard OWNER TO postgres;

--
-- Name: affiliate_page_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_page_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section text NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{"bn": "", "en": ""}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.affiliate_page_content OWNER TO postgres;

--
-- Name: affiliate_testimonials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    role_bn character varying(255),
    role_en character varying(255),
    content_bn text NOT NULL,
    content_en text NOT NULL,
    avatar_url text,
    rating integer DEFAULT 5,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.affiliate_testimonials OWNER TO postgres;

--
-- Name: affiliate_video_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_video_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title_bn character varying(255) NOT NULL,
    title_en character varying(255) NOT NULL,
    description_bn text,
    description_en text,
    video_url text NOT NULL,
    thumbnail_url text,
    is_active boolean DEFAULT true,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.affiliate_video_campaigns OWNER TO postgres;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_bn character varying(255) NOT NULL,
    name_en character varying(255) NOT NULL,
    slug character varying(255),
    logo_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    meta_title text,
    meta_description text,
    visible_on_website boolean DEFAULT true,
    visible_in_search boolean DEFAULT true
);


ALTER TABLE public.brands OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_bn character varying(255) NOT NULL,
    name_en character varying(255) NOT NULL,
    parent_id uuid,
    slug character varying(255),
    icon character varying(100),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    meta_title text,
    meta_description text,
    visible_on_website boolean DEFAULT true,
    visible_in_search boolean DEFAULT true
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: commission_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commission_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_type character varying(30) NOT NULL,
    name_bn character varying(255) NOT NULL,
    name_en character varying(255) NOT NULL,
    commission_type character varying(20) NOT NULL,
    commission_value numeric(10,2) NOT NULL,
    min_order_amount numeric(12,2),
    category_id uuid,
    product_id uuid,
    is_active boolean DEFAULT true,
    start_date date,
    end_date date,
    priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT commission_rules_commission_type_check CHECK (((commission_type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[]))),
    CONSTRAINT commission_rules_rule_type_check CHECK (((rule_type)::text = ANY ((ARRAY['global'::character varying, 'category'::character varying, 'campaign'::character varying, 'product'::character varying])::text[])))
);


ALTER TABLE public.commission_rules OWNER TO postgres;

--
-- Name: commissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id uuid NOT NULL,
    order_id uuid,
    amount numeric(12,2) NOT NULL,
    commission_type character varying(50) DEFAULT 'percentage'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    product_id uuid,
    product_name_bn character varying(500),
    product_name_en character varying(500),
    product_price numeric(12,2),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT commissions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'paid'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.commissions OWNER TO postgres;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    value numeric(10,2) NOT NULL,
    min_order_amount numeric(12,2),
    max_uses integer,
    used_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT coupons_type_check CHECK (((type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[])))
);


ALTER TABLE public.coupons OWNER TO postgres;

--
-- Name: faq_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faq_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_bn text NOT NULL,
    question_en text NOT NULL,
    answer_bn text NOT NULL,
    answer_en text NOT NULL,
    category character varying(100),
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.faq_items OWNER TO postgres;

--
-- Name: hero_banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hero_banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    title_bn character varying(255) NOT NULL,
    title_en character varying(255) NOT NULL,
    subtitle_bn text,
    subtitle_en text,
    link text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.hero_banners OWNER TO postgres;

--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    order_id uuid,
    points integer NOT NULL,
    type character varying(20) NOT NULL,
    amount numeric(12,2) DEFAULT 0,
    description_bn text NOT NULL,
    description_en text NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT loyalty_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['earn'::character varying, 'redeem'::character varying, 'refund'::character varying, 'expire'::character varying])::text[])))
);


ALTER TABLE public.loyalty_transactions OWNER TO postgres;

--
-- Name: marketing_expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketing_expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    amount numeric(12,2) NOT NULL,
    category character varying(100),
    date date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.marketing_expenses OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    variant_id uuid,
    variant_attributes jsonb,
    product_name_bn character varying(500) NOT NULL,
    product_name_en character varying(500) NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number character varying(50) NOT NULL,
    user_id uuid,
    customer_name character varying(255) NOT NULL,
    customer_phone character varying(50) NOT NULL,
    customer_email character varying(255),
    shipping_address text NOT NULL,
    city character varying(100),
    district character varying(100),
    subtotal numeric(12,2) NOT NULL,
    delivery_charge numeric(10,2) DEFAULT 0,
    discount_amount numeric(10,2) DEFAULT 0,
    total numeric(12,2) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    payment_method character varying(20) DEFAULT 'cod'::character varying,
    delivery_type character varying(20) DEFAULT 'inside_city'::character varying,
    actual_delivery_cost numeric(10,2),
    tracking_number character varying(100),
    courier character varying(100),
    affiliate_id uuid,
    affiliate_referral_code character varying(50),
    coupon_code character varying(100),
    notes text,
    delivery_fee_transaction_id character varying(255),
    points_earned integer DEFAULT 0,
    points_redeemed integer DEFAULT 0,
    points_discount_amount numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT orders_delivery_type_check CHECK (((delivery_type)::text = ANY ((ARRAY['inside_city'::character varying, 'outside_city'::character varying])::text[]))),
    CONSTRAINT orders_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['cod'::character varying, 'online'::character varying])::text[]))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'returned'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: product_activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    user_id uuid,
    action_type character varying(50),
    old_value jsonb,
    new_value jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.product_activity_log OWNER TO postgres;

--
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid,
    order_id uuid,
    rating integer NOT NULL,
    comment text,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT product_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.product_reviews OWNER TO postgres;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    name_en character varying(255) NOT NULL,
    name_bn character varying(255) NOT NULL,
    sku character varying(100),
    price numeric(12,2),
    stock integer DEFAULT 0,
    attributes jsonb DEFAULT '{}'::jsonb,
    image_url text,
    is_active boolean DEFAULT true,
    cost_price numeric(12,2),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.product_variants OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_bn character varying(500) NOT NULL,
    name_en character varying(500) NOT NULL,
    description_bn text,
    description_en text,
    price numeric(12,2) DEFAULT 0 NOT NULL,
    original_price numeric(12,2),
    image_url text,
    gallery_images jsonb DEFAULT '[]'::jsonb,
    category_id uuid,
    brand character varying(255),
    stock integer DEFAULT 0,
    rating numeric(3,2) DEFAULT 0,
    reviews_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    discount_percent numeric(5,2) DEFAULT 0,
    discount_type character varying(20),
    discount_value numeric(12,2),
    is_active boolean DEFAULT true,
    sku character varying(100),
    has_variants boolean DEFAULT false,
    variant_options jsonb,
    affiliate_commission_type character varying(20),
    affiliate_commission_value numeric(10,2),
    cost_price numeric(12,2),
    is_affiliate boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    product_status text DEFAULT 'active'::text NOT NULL,
    meta_title text,
    meta_description text,
    visible_on_website boolean DEFAULT true NOT NULL,
    visible_in_search boolean DEFAULT true NOT NULL,
    brand_id uuid,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.site_settings OWNER TO postgres;

--
-- Name: system_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title_bn character varying(255) NOT NULL,
    title_en character varying(255) NOT NULL,
    message_bn text NOT NULL,
    message_en text NOT NULL,
    type character varying(20) DEFAULT 'info'::character varying,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT system_notifications_type_check CHECK (((type)::text = ANY ((ARRAY['info'::character varying, 'success'::character varying, 'warning'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.system_notifications OWNER TO postgres;

--
-- Name: user_login_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_login_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_type character varying(20) DEFAULT 'login'::character varying NOT NULL,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_login_logs OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK (((role)::text = ANY ((ARRAY['customer'::character varying, 'affiliate'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email_confirmed boolean DEFAULT false,
    verification_token character varying(255),
    verification_token_expires timestamp with time zone,
    reset_token character varying(255),
    reset_token_expires timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vw_profit_loss; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_profit_loss AS
 SELECT date(o.created_at) AS order_date,
    COALESCE(c.name_en, 'Uncategorized'::character varying) AS category_name,
    sum(oi.total_price) AS total_sales,
    sum((COALESCE(p.cost_price, (0)::numeric) * (oi.quantity)::numeric)) AS total_product_cost,
    sum(o.delivery_charge) AS total_delivery_cost,
    COALESCE(sum(cm.amount), (0)::numeric) AS total_commissions,
    0 AS total_marketing_expense,
    (((sum(oi.total_price) - sum((COALESCE(p.cost_price, (0)::numeric) * (oi.quantity)::numeric))) - sum(o.delivery_charge)) - COALESCE(sum(cm.amount), (0)::numeric)) AS net_profit,
    count(DISTINCT o.id) AS order_count
   FROM ((((public.orders o
     JOIN public.order_items oi ON ((oi.order_id = o.id)))
     LEFT JOIN public.products p ON ((p.id = oi.product_id)))
     LEFT JOIN public.categories c ON ((c.id = p.category_id)))
     LEFT JOIN public.commissions cm ON (((cm.order_id = o.id) AND ((cm.status)::text = 'paid'::text))))
  WHERE ((o.status)::text <> ALL ((ARRAY['cancelled'::character varying, 'returned'::character varying])::text[]))
  GROUP BY (date(o.created_at)), c.name_en;


ALTER VIEW public.vw_profit_loss OWNER TO postgres;

--
-- Name: wishlist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.wishlist OWNER TO postgres;

--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdrawals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    method character varying(20) NOT NULL,
    account_number character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT withdrawals_method_check CHECK (((method)::text = ANY ((ARRAY['bkash'::character varying, 'nagad'::character varying])::text[]))),
    CONSTRAINT withdrawals_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.withdrawals OWNER TO postgres;

--
-- Data for Name: admin_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_audit_log (id, admin_user_id, action_type, entity_type, entity_id, old_value, new_value, description_bn, description_en, created_at) FROM stdin;
\.


--
-- Data for Name: affiliate_campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliate_campaigns (id, affiliate_id, name_bn, name_en, url, status, clicks, conversions, earnings, created_at) FROM stdin;
\.


--
-- Data for Name: affiliate_clicks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliate_clicks (id, affiliate_id, clicked_at, ip_address, referrer_url, user_agent) FROM stdin;
5972e494-9d98-4a53-9468-17c38d9e5719	3e569b15-505a-484d-8633-cef9c7bbcda5	2026-04-10 18:20:34.664355+00	\N	https://0a8790f4-a369-479b-960d-5b11b1768a69-00-1zyn7y84utq7h.kirk.replit.dev/product/3edfa697-745a-4949-9dc9-29ee98d1e71d?ref=AFFMNT56ZE6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36
4469bd5a-8849-44ec-b945-8159d5d600fc	3e569b15-505a-484d-8633-cef9c7bbcda5	2026-04-11 10:58:08.907012+00	\N	https://0a8790f4-a369-479b-960d-5b11b1768a69-00-1zyn7y84utq7h.kirk.replit.dev/product/3edfa697-745a-4949-9dc9-29ee98d1e71d?ref=AFFMNT56ZE6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36
d7dd691b-83f7-4f47-80f6-2779b52b36f0	3e569b15-505a-484d-8633-cef9c7bbcda5	2026-04-11 10:58:58.898247+00	\N	https://0a8790f4-a369-479b-960d-5b11b1768a69-00-1zyn7y84utq7h.kirk.replit.dev/product/3edfa697-745a-4949-9dc9-29ee98d1e71d?ref=AFFMNT56ZE6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36
2e5b5b97-08ba-4e8b-92ed-32adf31a9eaa	3e569b15-505a-484d-8633-cef9c7bbcda5	2026-04-11 11:01:42.201895+00	\N	https://0a8790f4-a369-479b-960d-5b11b1768a69-00-1zyn7y84utq7h.kirk.replit.dev/product/3edfa697-745a-4949-9dc9-29ee98d1e71d?ref=AFFMNT56ZE6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36
2327a294-ce81-4040-a745-e025ef7ea3a7	3e569b15-505a-484d-8633-cef9c7bbcda5	2026-04-11 11:03:24.576122+00	\N	https://0a8790f4-a369-479b-960d-5b11b1768a69-00-1zyn7y84utq7h.kirk.replit.dev/product/3edfa697-745a-4949-9dc9-29ee98d1e71d?ref=AFFMNT56ZE6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36
9393bd72-7228-495b-bb14-51d56dc212b1	3e569b15-505a-484d-8633-cef9c7bbcda5	2026-04-11 11:05:31.463304+00	\N	https://0a8790f4-a369-479b-960d-5b11b1768a69-00-1zyn7y84utq7h.kirk.replit.dev/product/3edfa697-745a-4949-9dc9-29ee98d1e71d?ref=AFFMNT56ZE6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36
\.


--
-- Data for Name: affiliate_page_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliate_page_content (id, section, key, value, is_active, created_at) FROM stdin;
948d9147-1b84-4d9a-b3b3-32a24ff04f35	hero	headline	{"bn": "ঘরে বসে ইনকাম করুন রায়জনমার্ট-এর সাথে", "en": "Start Earning from Home with Rayzanmart"}	t	2026-04-11 10:11:59.836774+00
37ba82f0-f8a6-40c9-9771-4d79b0665c4d	hero	subheadline	{"bn": "আপনার মোবাইল বা কম্পিউটার ব্যবহার করেই শুরু করুন সহজ আয়ের যাত্রা—কোনো ইনভেস্টমেন্ট ছাড়াই", "en": "Use your mobile or computer to begin your earning journey—no investment required"}	t	2026-04-11 10:11:59.836774+00
2e6bc31f-6d64-47e8-a21e-ce6ad37f4d1e	hero	bullet_1	{"bn": "ফ্রি অ্যাকাউন্ট তৈরি", "en": "Free account creation"}	t	2026-04-11 10:11:59.836774+00
98a083dc-63eb-4acf-b51f-7b4d29f602f9	hero	bullet_2	{"bn": "পণ্য শেয়ার করে কমিশন আয়", "en": "Earn commission by sharing products"}	t	2026-04-11 10:11:59.836774+00
d1c51724-a9c5-4262-a483-a051041c04e5	hero	bullet_3	{"bn": "মোবাইল দিয়ে সবকিছু করা সম্ভব", "en": "Everything is possible with mobile"}	t	2026-04-11 10:11:59.836774+00
8722f638-dfcc-4023-87f1-e0353809559b	hero	cta_button	{"bn": "এখনই ফ্রি অ্যাকাউন্ট খুলুন", "en": "Create Free Account Now"}	t	2026-04-11 10:11:59.836774+00
04559c33-d8fe-4108-aef8-c30d32189f51	success_stories	heading	{"bn": "আমাদের সাথে পথচলা — সাধারণ মানুষ থেকে সফল আয়ের গল্প", "en": "A Journey With Us — From Ordinary People to Successful Earners"}	t	2026-04-11 10:11:59.836774+00
c102c691-5780-4d31-8ffe-409b5b7a280f	success_stories	subheading	{"bn": "অনেকে ছোট পরিমাণ দিয়ে শুরু করেছিল", "en": "Many started small and now earn regularly."}	t	2026-04-11 10:11:59.836774+00
96ff78df-a3e5-4acf-9fbc-f5d4c0eeb1b4	mid_cta	heading	{"bn": "আজই আপনার যাত্রা শুরু করুন", "en": "Start Your Journey Today"}	t	2026-04-11 10:11:59.836774+00
3d6297a7-8f4d-45ef-a230-47bce834f304	mid_cta	button	{"bn": "আজই শুরু করুন", "en": "Start Your Journey Today"}	t	2026-04-11 10:11:59.836774+00
91808b11-5253-49b9-a6ff-975d494d0814	faq	heading	{"bn": "সাধারণ জিজ্ঞাসাসমূহ", "en": "Frequently Asked Questions"}	t	2026-04-11 10:11:59.836774+00
31fe71f8-e71b-46c7-b7c0-074826ad2b49	final_cta	heading	{"bn": "আজই শুরু করুন আপনার অনলাইন ইনকাম যাত্রা", "en": "Start Your Online Earning Journey Today"}	t	2026-04-11 10:11:59.836774+00
b3d68ec5-3ef7-4972-9a1c-614981204eed	final_cta	subtext	{"bn": "ছোট থেকে শুরু করুন, ধাপে ধাপে শিখুন এবং আপনার ইনকাম বাড়ান", "en": "Start small, learn step by step, and build your income"}	t	2026-04-11 10:11:59.836774+00
c519a1ec-4a97-459b-9d68-20675dafe2a2	final_cta	button	{"bn": "আজই শুরু করুন", "en": "Start Your Journey Today"}	t	2026-04-11 10:11:59.836774+00
08145555-8d04-40cb-8de1-7ef06e950443	contact	label	{"bn": "জরুরি প্রয়োজনে কল করুন", "en": "Call for urgent support"}	t	2026-04-11 10:11:59.836774+00
2c74c3f8-9555-44e3-93b8-5cc3ba4a1851	contact	phone	{"bn": "+8801347195345", "en": "+8801347195345"}	t	2026-04-11 10:11:59.836774+00
\.


--
-- Data for Name: affiliate_testimonials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliate_testimonials (id, name, role_bn, role_en, content_bn, content_en, avatar_url, rating, is_active, created_at, updated_at) FROM stdin;
aab2e943-41cf-4e42-8baf-3f61077c8e3d	রাহেলা বেগম	গৃহিণী, ঢাকা	Housewife, Dhaka	রায়জান মার্টের অ্যাফিলিয়েট প্রোগ্রামে যোগ দিয়ে প্রতি মাসে ১৫,০০০ টাকার বেশি আয় করছি। পরিবারের জন্য বাড়তি আয়ের এই সুযোগ সত্যিই অসাধারণ!	I joined Rayzan Mart affiliate program and earn over 15,000 BDT monthly. This additional income for my family is truly amazing!	\N	5	t	2026-04-11 13:01:02.341521+00	2026-04-11 13:01:02.341521+00
57573210-b965-4dff-80ff-90b3edce9764	মোহাম্মদ রাকিব	ছাত্র, চট্টগ্রাম বিশ্ববিদ্যালয়	Student, Chittagong University	পড়াশোনার পাশাপাশি রায়জান মার্ট থেকে আয় করছি। মাসে গড়ে ৮,০০০-১০,০০০ টাকা পাচ্ছি।	Earning from Rayzan Mart alongside my studies. Getting an average of 8,000-10,000 BDT per month.	\N	5	t	2026-04-11 13:01:02.341521+00	2026-04-11 13:01:02.341521+00
65d98de9-8ab8-4153-b7f6-2f4f5168cf08	সুমাইয়া আক্তার	উদ্যোক্তা, সিলেট	Entrepreneur, Sylhet	রায়জান মার্টের পণ্যের মান অনেক ভালো। কাস্টমাররা সন্তুষ্ট, তাই আমার কমিশনও ভালো আসে।	The product quality at Rayzan Mart is excellent. Customers are satisfied, so my commissions are also good.	\N	5	t	2026-04-11 13:01:02.341521+00	2026-04-11 13:01:02.341521+00
\.


--
-- Data for Name: affiliate_video_campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliate_video_campaigns (id, title_bn, title_en, description_bn, description_en, video_url, thumbnail_url, is_active, views, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: affiliates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliates (id, user_id, referral_code, payment_method, payment_details, website_url, marketing_plan, status, commission_rate, tier, total_clicks, total_sales, total_commission, pending_commission, paid_commission, created_at, updated_at, available_balance) FROM stdin;
cc25c868-bc17-4117-9a72-f52cfe001a64	df9503a5-7fd3-4cad-a951-0ebe7e7d74c0	NEWAFF3006	bkash	01700000000	\N	\N	pending	5.00	bronze	0	0.00	0.00	0.00	0.00	2026-04-10 14:48:52.69776+00	2026-04-10 14:48:52.69776+00	0.00
2e9f8fa6-3cc1-41ed-b731-72d6c5041a3e	139094e1-ceef-49f4-8027-a604be12daec	FARIDR3145	bkash	01843180008	\N	\N	active	5.00	bronze	0	0.00	0.00	0.00	0.00	2026-04-10 14:49:55.949612+00	2026-04-10 14:51:22.630748+00	0.00
c4df21cf-8275-4c02-bc21-7abf2f21c9bc	9051ac6f-5c81-45b6-81b9-cf48a51018ff	AFFMNT4SX0H	bank_transfer	\N	\N	\N	approved	5.00	bronze	0	0.00	0.00	0.00	0.00	2026-04-10 16:39:50.56134+00	2026-04-10 16:39:50.56134+00	0.00
fd349a35-1e33-42ef-ba8d-f9e077235f00	d101dbfd-4399-487d-a2cd-bbb3a5f33b52	AFFMNT4Z7PP	bank_transfer	\N	\N	\N	pending	5.00	bronze	0	0.00	0.00	0.00	0.00	2026-04-10 16:44:44.365647+00	2026-04-10 16:44:44.365647+00	0.00
a87fd683-3cfb-4a1a-bff2-79c0cc4bf430	1151d93d-a4e8-41e6-8e07-1ae81db5b821	AFFILI8887	bkash	01712345678	\N	\N	active	5.00	bronze	0	180.00	5.00	5.00	0.00	2026-04-10 13:53:30.553525+00	2026-04-10 18:46:21.113711+00	0.00
31c3d41e-1fec-46df-8446-dc26076d6219	7be1f597-28b2-4e70-b82e-ecbeb175abdc	AFFMNTAW8CU	bank_transfer	\N	\N	\N	active	5.00	bronze	0	0.00	0.00	0.00	0.00	2026-04-10 19:30:22.926508+00	2026-04-10 19:31:56.104736+00	0.00
3e569b15-505a-484d-8633-cef9c7bbcda5	524565f0-ee6c-48d4-9b76-81984ac56ca7	AFFMNT56ZE6	bank_transfer	\N	\N	\N	active	5.00	bronze	6	18540.00	505.00	505.00	0.00	2026-04-10 16:50:46.830354+00	2026-04-11 11:05:56.609161+00	0.00
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brands (id, name_bn, name_en, slug, logo_url, is_active, created_at, updated_at, meta_title, meta_description, visible_on_website, visible_in_search) FROM stdin;
a983c668-f32c-4d7d-911a-eeb3f2bad039	cosrx	cosrx	cosrx	https://seeklogo.com/vector-logo/617675/cosrx	t	2026-04-11 15:25:48.844125+00	2026-04-11 15:25:48.844125+00	cosrx	cosrx	t	t
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name_bn, name_en, parent_id, slug, icon, sort_order, is_active, created_at, updated_at, meta_title, meta_description, visible_on_website, visible_in_search) FROM stdin;
92e83328-dc49-4fec-bbeb-70fa1ae289e9	Electronics	Electronics	\N	electronics	💻	1	t	2026-04-10 13:06:19.675163+00	2026-04-10 13:06:19.675163+00	\N	\N	t	t
f0e6738c-1619-4603-9329-696339996896	Clothing	Clothing	\N	clothing	👕	2	t	2026-04-10 13:06:23.397938+00	2026-04-10 13:06:23.397938+00	\N	\N	t	t
65f0c5c3-9e78-491c-b52d-a634921bcafb	Food	Food & Grocery	\N	food-grocery	🛒	3	t	2026-04-10 13:06:27.352435+00	2026-04-10 13:06:27.352435+00	\N	\N	t	t
19f94872-e5d9-4504-a36a-034f6513e5d7	Home	Home & Living	\N	home-living	🏠	4	t	2026-04-10 13:06:31.024527+00	2026-04-10 13:06:31.024527+00	\N	\N	t	t
e9a5e954-1d2b-455c-bae8-c872608106ab	Beauty	Beauty & Health	\N	beauty-health	💄	5	t	2026-04-10 13:06:35.024668+00	2026-04-10 13:06:35.024668+00	\N	\N	t	t
70ce0092-177e-4d1e-94b6-bdc0c71057ed	Books	Books	\N	books	📚	6	t	2026-04-10 13:06:38.792514+00	2026-04-10 13:06:38.792514+00	\N	\N	t	t
\.


--
-- Data for Name: commission_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commission_rules (id, rule_type, name_bn, name_en, commission_type, commission_value, min_order_amount, category_id, product_id, is_active, start_date, end_date, priority, created_at) FROM stdin;
bda2f8cb-d457-4312-8523-82247d5f1e81	product	5	pro-1	fixed	500.00	500.00	\N	3edfa697-745a-4949-9dc9-29ee98d1e71d	t	\N	\N	0	2026-04-10 18:14:38.057067+00
\.


--
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commissions (id, affiliate_id, order_id, amount, commission_type, status, product_id, product_name_bn, product_name_en, product_price, created_at) FROM stdin;
6f8b6a5f-314e-45c2-baf4-a01b38e990cf	a87fd683-3cfb-4a1a-bff2-79c0cc4bf430	154c37ab-faeb-45e3-9e96-368f16950840	5.00	fixed	approved	3edfa697-745a-4949-9dc9-29ee98d1e71d	বাংলা ব্যাকরণ	Bangla Grammar	180.00	2026-04-10 18:46:21.025778+00
04b5d2eb-f005-4b8d-a109-14ef3a1fca2a	3e569b15-505a-484d-8633-cef9c7bbcda5	6b232756-3a11-4707-ac85-4fe090c3d433	500.00	fixed	approved	3edfa697-745a-4949-9dc9-29ee98d1e71d	বাংলা ব্যাকরণ ও রচনা	Bangla Grammar & Composition	18360.00	2026-04-11 11:05:56.605784+00
199fc547-6458-4347-aa1d-8822c673fca1	3e569b15-505a-484d-8633-cef9c7bbcda5	c956b13c-67e3-4ce2-ac3a-d5140ac4fcbb	5.00	fixed	approved	3edfa697-745a-4949-9dc9-29ee98d1e71d	বাংলা ব্যাকরণ ও রচনা	Bangla Grammar & Composition	180.00	2026-04-10 18:56:29.492904+00
879ce269-43e5-4c44-857d-a4cd9145cc01	2e9f8fa6-3cc1-41ed-b731-72d6c5041a3e	f3cd48fc-4a27-4fbb-9907-76f872f573ee	12.50	percentage	approved	\N	\N	\N	\N	2026-04-10 18:54:32.121403+00
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupons (id, code, type, value, min_order_amount, max_uses, used_count, is_active, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: faq_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faq_items (id, question_bn, question_en, answer_bn, answer_en, category, is_active, sort_order, created_at, updated_at) FROM stdin;
b6ce223a-b34b-4674-9b1e-e9c286a98b32	অ্যাফিলিয়েট প্রোগ্রাম কীভাবে কাজ করে?	How does the Affiliate Program work?	আপনি পণ্যের লিংক শেয়ার করে প্রতিটি সফল বিক্রয়ে কমিশন আয় করতে পারেন। সাইন আপ করুন, লিংক তৈরি করুন এবং শেয়ার করা শুরু করুন!	You can share product links and earn commission on every successful sale made through your links. Sign up, generate a link, and start sharing!	\N	t	1	2026-04-11 13:01:02.334353+00	2026-04-11 13:01:02.334353+00
b574fef5-d94c-4c15-8c0c-923ae3b643f5	সর্বনিম্ন উত্তোলনের পরিমাণ কত?	What is the minimum withdrawal amount?	সর্বনিম্ন উত্তোলনের পরিমাণ ৫০০ টাকা। আপনি বিকাশ বা নগদের মাধ্যমে আপনার উপার্জন উত্তোলন করতে পারেন।	The minimum withdrawal amount is 500 BDT. You can withdraw your earnings via bKash or Nagad.	\N	t	2	2026-04-11 13:01:02.334353+00	2026-04-11 13:01:02.334353+00
7fdacacb-e11d-43a6-989d-6caf121c86ee	ডেলিভারি হতে কত সময় লাগে?	How long does delivery take?	ঢাকার ভিতরে ডেলিভারি ১-২ দিন এবং ঢাকার বাইরে ৩-৫ দিন সময় লাগে।	Delivery inside Dhaka takes 1-2 days, and outside Dhaka takes 3-5 days.	\N	t	3	2026-04-11 13:01:02.334353+00	2026-04-11 13:01:02.334353+00
83aa4bc4-058e-4b25-abf2-047db95f1dc5	আমি কীভাবে আমার অর্ডার ট্র্যাক করব?	How can I track my order?	আপনার অর্ডার কনফার্ম এবং শিপ করা হলে আপনি ট্র্যাকিং বিস্তারিত সহ একটি এসএমএস পাবেন।	You will receive an SMS with tracking details once your order is confirmed and shipped.	\N	t	4	2026-04-11 13:01:02.334353+00	2026-04-11 13:01:02.334353+00
cdb73c53-3673-4c73-9c66-a6dd3ef65a29	রিটার্ন পলিসি কী?	What is the return policy?	পণ্য পাওয়ার ৭ দিনের মধ্যে রিটার্ন করা যাবে, যদি পণ্যটি ক্ষতিগ্রস্ত বা ভুল হয়।	You can return the product within 7 days of receiving it if the product is damaged or incorrect.	\N	t	5	2026-04-11 13:01:02.334353+00	2026-04-11 13:01:02.334353+00
\.


--
-- Data for Name: hero_banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hero_banners (id, image_url, title_bn, title_en, subtitle_bn, subtitle_en, link, order_index, is_active, created_at, updated_at) FROM stdin;
7ce3d118-de9e-4214-8b4b-8a2b2992553b	https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200	রায়জান মার্টে স্বাগতম	Welcome to Rayzan Mart	সেরা পণ্য, সেরা দাম — ১০০০ টাকার উপরে ফ্রি ডেলিভারি	Best Products at Best Prices — Free Shipping over Tk 1000	/products	1	t	2026-04-10 13:33:41.994301+00	2026-04-10 13:33:41.994301+00
\.


--
-- Data for Name: loyalty_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.loyalty_transactions (id, user_id, order_id, points, type, amount, description_bn, description_en, expires_at, created_at) FROM stdin;
c3efbed2-0baf-4075-af93-71d83a8a9046	f1a0b7a3-3e3a-4773-a3f7-dd006e7b14e1	3b3b45e3-eaa8-47db-9eaa-0706077954a0	6	earn	60.00	অর্ডার RMEFF918F459 ডেলিভারি সম্পন্ন - 6 পয়েন্ট অর্জিত	Order RMEFF918F459 delivered - 6 points earned	2027-04-10 18:10:49.484337+00	2026-04-10 18:10:49.484337+00
93aae251-4960-4f7b-9d20-cb1f33f60208	ddbc6d25-e85c-4799-b290-3bec88430fec	9303c6a9-c442-43c8-8d1e-174d46f952e2	129	earn	1299.35	অর্ডার RMT7NAU8ZJO6 ডেলিভারি সম্পন্ন - 129 পয়েন্ট অর্জিত	Order RMT7NAU8ZJO6 delivered - 129 points earned	2027-04-10 18:10:49.484337+00	2026-04-10 18:10:49.484337+00
1862dc43-97e6-4ecc-8d7f-0fbda7491947	7316e481-7a73-4da6-b3b1-6d4ca26bd044	dfd71588-e375-4825-8020-43f1dae70eb6	18	earn	180.00	অর্ডার RMT8FV9RU3P6 ডেলিভারি সম্পন্ন - 18 পয়েন্ট অর্জিত	Order RMT8FV9RU3P6 delivered - 18 points earned	2027-04-10 18:39:52.957+00	2026-04-10 18:39:52.96431+00
30ac8ef1-63bb-4eb2-8aea-1381a2bc765c	7316e481-7a73-4da6-b3b1-6d4ca26bd044	c956b13c-67e3-4ce2-ac3a-d5140ac4fcbb	18	earn	180.00	অর্ডার RMT9ON58IEQB ডেলিভারি সম্পন্ন - 18 পয়েন্ট অর্জিত	Order RMT9ON58IEQB delivered - 18 points earned	2027-04-10 18:57:26.293+00	2026-04-10 18:57:26.297432+00
fdae64f0-5bc6-4ea3-8f78-f10011d11f2e	04b538c3-5fb5-429e-b3c8-0b0edf95487b	6b232756-3a11-4707-ac85-4fe090c3d433	1836	earn	18360.00	অর্ডার RMU8BD67W69I ডেলিভারি সম্পন্ন - 1836 পয়েন্ট অর্জিত	Order RMU8BD67W69I delivered - 1836 points earned	2027-04-11 11:06:29.851+00	2026-04-11 11:06:29.863246+00
4f2de900-ff53-4d31-b3cc-a6d86ba603ed	ddbc6d25-e85c-4799-b290-3bec88430fec	2c6efc68-878b-415e-a049-49d56d3339c5	40	earn	401.33	অর্ডার RMUCIABPME4O ডেলিভারি সম্পন্ন - 40 পয়েন্ট অর্জিত	Order RMUCIABPME4O delivered - 40 points earned	2027-04-11 13:04:06.554+00	2026-04-11 13:04:06.55718+00
523c4f3e-e039-48cc-a896-0dbbb661c6ef	bceec809-73aa-4218-bca4-a79bfe7c7fd8	\N	500	redeem	500.00	অর্ডার RMUDTWPKXQXF-এ 500 পয়েন্ট ব্যবহার করা হয়েছে	500 points redeemed on order RMUDTWPKXQXF	\N	2026-04-11 13:40:19.551536+00
5d780336-2524-49c5-818e-89fcb1cc5405	bceec809-73aa-4218-bca4-a79bfe7c7fd8	\N	500	redeem	500.00	অর্ডার RMUE8XQUSMHN-এ 500 পয়েন্ট ব্যবহার করা হয়েছে	500 points redeemed on order RMUE8XQUSMHN	\N	2026-04-11 13:52:00.742994+00
71a3681c-f6ef-4a41-8f77-4a9ba0ff220e	bceec809-73aa-4218-bca4-a79bfe7c7fd8	\N	50	redeem	50.00	অর্ডার RMUG91BPP3Z9-এ 50 পয়েন্ট ব্যবহার করা হয়েছে	50 points redeemed on order RMUG91BPP3Z9	\N	2026-04-11 14:48:04.617158+00
4e1b5149-413a-4419-8559-123e9e3bcb15	bceec809-73aa-4218-bca4-a79bfe7c7fd8	\N	25	redeem	25.00	অর্ডার RMUG91E6S8MK-এ 25 পয়েন্ট ব্যবহার করা হয়েছে	25 points redeemed on order RMUG91E6S8MK	\N	2026-04-11 14:48:04.695185+00
64ae927a-6f83-43be-b9ee-ef8239b70cdc	ddbc6d25-e85c-4799-b290-3bec88430fec	2dc2bdd7-9935-4b15-b494-d7a9257e6134	69	redeem	69.00	অর্ডার RMUGFB3WPFM7-এ 69 পয়েন্ট ব্যবহার করা হয়েছে	69 points redeemed on order RMUGFB3WPFM7	\N	2026-04-11 14:52:57.263863+00
d84b2f37-9246-43fc-8129-c2548414d59f	ddbc6d25-e85c-4799-b290-3bec88430fec	2dc2bdd7-9935-4b15-b494-d7a9257e6134	245	earn	2450.37	অর্ডার RMUGFB3WPFM7 ডেলিভারি সম্পন্ন - 245 পয়েন্ট অর্জিত	Order RMUGFB3WPFM7 delivered - 245 points earned	2027-04-11 14:53:16.505+00	2026-04-11 14:53:16.508425+00
fd4739d4-d396-408a-940a-634b3aaa8021	ddbc6d25-e85c-4799-b290-3bec88430fec	628f456f-3b47-46b3-9658-e556f2ba5c49	70	redeem	70.00	অর্ডার RMUGO6R6D80B-এ 70 পয়েন্ট ব্যবহার করা হয়েছে	70 points redeemed on order RMUGO6R6D80B	\N	2026-04-11 14:59:51.5382+00
9708940d-7cac-4f7f-8262-afd0e8fa9bb2	ddbc6d25-e85c-4799-b290-3bec88430fec	628f456f-3b47-46b3-9658-e556f2ba5c49	1	earn	179.60	অর্ডার RMUGO6R6D80B ডেলিভারি সম্পন্ন - 1 পয়েন্ট অর্জিত	Order RMUGO6R6D80B delivered - 1 points earned	2027-04-11 15:00:20.242+00	2026-04-11 15:00:20.245245+00
\.


--
-- Data for Name: marketing_expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketing_expenses (id, title, amount, category, date, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, variant_id, variant_attributes, product_name_bn, product_name_en, quantity, unit_price, total_price, created_at) FROM stdin;
44a6dc59-0186-4bf6-a90d-8fc7864da761	f3cd48fc-4a27-4fbb-9907-76f872f573ee	a678d113-6fda-41dd-a819-980cc66c895d	\N	\N	ওয়্যারলেস ব্লুটুথ হেডফোন	Wireless Bluetooth Headphones	1	1299.35	1299.35	2026-04-10 15:36:54.608065+00
f1f8cbe7-7a42-47ee-83a8-56f865e6e500	51020eef-6a59-49be-bdc7-713564f6a865	b753299c-9937-47a6-8f7e-a4cad0e89d59	\N	\N	পুরুষের কটন পোলো শার্ট	Men's Cotton Polo Shirt	1	699.30	699.30	2026-04-10 16:01:52.595934+00
e90c88d8-9020-4c47-afca-11297bb65fe0	bf4ea8ed-6591-4af3-987f-c21e879851c7	275d0210-5a65-405c-92be-cc33bb1c7957	\N	\N	মহিলার কুর্তি সেট	Women's Kurti Set	1	1205.33	1205.33	2026-04-10 16:12:53.81507+00
45375a52-dbfe-4801-a71d-a4fa6f00061e	8f7fbd72-6638-46e5-b1c0-ea794551354c	b753299c-9937-47a6-8f7e-a4cad0e89d59	\N	\N	পুরুষের কটন পোলো শার্ট	Men's Cotton Polo Shirt	1	699.30	699.30	2026-04-10 16:21:26.193427+00
15716218-1fc0-47b4-82fb-61b189700b4e	9303c6a9-c442-43c8-8d1e-174d46f952e2	a678d113-6fda-41dd-a819-980cc66c895d	\N	\N	ওয়্যারলেস ব্লুটুথ হেডফোন	Wireless Bluetooth Headphones	1	1299.35	1299.35	2026-04-10 17:59:27.861863+00
afa3d423-e720-4e2e-a2a2-5f6405430b3e	dfd71588-e375-4825-8020-43f1dae70eb6	3edfa697-745a-4949-9dc9-29ee98d1e71d	\N	\N	বাংলা ব্যাকরণ ও রচনা	Bangla Grammar & Composition	1	180.00	180.00	2026-04-10 18:21:40.520502+00
9cffe4fe-cc8b-4479-a110-555cb825b646	154c37ab-faeb-45e3-9e96-368f16950840	3edfa697-745a-4949-9dc9-29ee98d1e71d	\N	\N	বাংলা ব্যাকরণ	Bangla Grammar	1	180.00	180.00	2026-04-10 18:46:21.018983+00
7105c0d9-ec08-40f4-acad-c66fda134920	c956b13c-67e3-4ce2-ac3a-d5140ac4fcbb	3edfa697-745a-4949-9dc9-29ee98d1e71d	\N	\N	বাংলা ব্যাকরণ ও রচনা	Bangla Grammar & Composition	1	180.00	180.00	2026-04-10 18:56:29.48709+00
46046d67-62fb-400b-a190-c5218444d875	6b232756-3a11-4707-ac85-4fe090c3d433	3edfa697-745a-4949-9dc9-29ee98d1e71d	\N	\N	বাংলা ব্যাকরণ ও রচনা	Bangla Grammar & Composition	1	18360.00	18360.00	2026-04-11 11:05:56.599869+00
214586bf-7270-4321-974f-28b8faf9598e	48abf805-8aff-4559-81f3-6ba2377473d8	275d0210-5a65-405c-92be-cc33bb1c7957	\N	\N	মহিলার কুর্তি সেট	Women's Kurti Set	1	1205.33	1205.33	2026-04-11 12:34:29.456373+00
7a663b3f-e1e2-4f15-96c9-e5203f3db338	48abf805-8aff-4559-81f3-6ba2377473d8	ba9dfb07-180f-4afd-bca0-654b0602a7c0	\N	\N	নন-স্টিক কুকওয়্যার সেট	Non-stick Cookware Set	1	2519.37	2519.37	2026-04-11 12:34:29.460569+00
ef26f0b9-a297-4ac0-9ea6-9703dbe22945	2c6efc68-878b-415e-a049-49d56d3339c5	5436fcee-a268-41b7-8397-d0cea33ead0d	\N	\N	অ্যালোভেরা ফেস ক্রিম	Aloe Vera Face Cream	1	401.33	401.33	2026-04-11 13:03:18.001226+00
dd31c756-c3be-4cc5-8d96-f1f441eace82	2dc2bdd7-9935-4b15-b494-d7a9257e6134	ba9dfb07-180f-4afd-bca0-654b0602a7c0	\N	\N	নন-স্টিক কুকওয়্যার সেট	Non-stick Cookware Set	1	2519.37	2519.37	2026-04-11 14:52:57.525342+00
ab928591-e54d-4c2c-84d2-e554dfed4ffa	628f456f-3b47-46b3-9658-e556f2ba5c49	7f9938eb-ebbe-4349-b12c-4298b1dbb0af	\N	\N	খাঁটি সরিষার তেল (১ লিটার)	Pure Mustard Oil (1L)	1	249.60	249.60	2026-04-11 14:59:51.801751+00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, user_id, customer_name, customer_phone, customer_email, shipping_address, city, district, subtotal, delivery_charge, discount_amount, total, status, payment_method, delivery_type, actual_delivery_cost, tracking_number, courier, affiliate_id, affiliate_referral_code, coupon_code, notes, delivery_fee_transaction_id, points_earned, points_redeemed, points_discount_amount, created_at, updated_at) FROM stdin;
6b232756-3a11-4707-ac85-4fe090c3d433	RMU8BD67W69I	04b538c3-5fb5-429e-b3c8-0b0edf95487b	Farid Reza	01843180004	misbah.vklbd@gmail.com	fgddfg	Chattogram	Chattogram	18360.00	60.00	0.00	18360.00	delivered	cod	inside_city	\N	\N	pathao	3e569b15-505a-484d-8633-cef9c7bbcda5	AFFMNT56ZE6	\N	\N	dfgdfg	1836	0	0.00	2026-04-11 11:05:56.338725+00	2026-04-11 11:06:29.819544+00
f3cd48fc-4a27-4fbb-9907-76f872f573ee	RMT2JZ7SU53L	4c66c703-f12b-4cf4-a6e8-5e44eb945bc9	Farid Reza	01843180002	maxtechctg@gmail.com	fgf\ndfghgf	Chattogram	Chattogram	1299.35	60.00	0.00	1299.35	pending	cod	inside_city	\N	\N	pathao	\N	\N	\N	\N	0184318	129	0	0.00	2026-04-10 15:36:54.281876+00	2026-04-10 15:36:54.281876+00
51020eef-6a59-49be-bdc7-713564f6a865	RMT3G34PIGN9	9771c616-cca4-4477-8e76-9be264ea3a99	Farid Reza	01843180006	myhappy3456@gmail.com	fgf\ndfghgf	Chattogram	Chattogram	699.30	60.00	0.00	699.30	pending	cod	inside_city	\N	\N	pathao	\N	\N	\N	\N	0184318	69	0	0.00	2026-04-10 16:01:52.347266+00	2026-04-10 16:01:52.347266+00
bf4ea8ed-6591-4af3-987f-c21e879851c7	RMT3U9C0QJFJ	04b538c3-5fb5-429e-b3c8-0b0edf95487b	Farid Reza	01843180004	misbah.vklbd@gmail.com	fgf\ndfghgf	Chattogram	Chattogram	1205.33	60.00	0.00	1205.33	pending	cod	inside_city	\N	\N	pathao	\N	\N	\N	\N	0184318	120	0	0.00	2026-04-10 16:12:53.569351+00	2026-04-10 16:12:53.569351+00
8f7fbd72-6638-46e5-b1c0-ea794551354c	RMT458OSUZ9A	7d31c2e8-4b02-441b-bc64-60400cb12e83	Farid Reza	01843180006	mizandubai839@gmail.com	fgf\ndfghgf	Chattogram	Chattogram	699.30	60.00	0.00	699.30	pending	cod	inside_city	\N	\N	pathao	\N	\N	\N	\N	0184318	69	0	0.00	2026-04-10 16:21:25.950166+00	2026-04-10 16:21:25.950166+00
3b3b45e3-eaa8-47db-9eaa-0706077954a0	RMEFF918F459	f1a0b7a3-3e3a-4773-a3f7-dd006e7b14e1	Test Guest User	01811111111	newguest123@test.com	House 5, Road 10, Dhaka	Chattogram	Chattogram	0.00	60.00	0.00	60.00	delivered	cod	inside_city	\N	\N	pathao	\N	\N	\N	\N	TXN123456789	6	0	0.00	2026-04-10 14:32:41.910839+00	2026-04-10 18:05:21.328773+00
9303c6a9-c442-43c8-8d1e-174d46f952e2	RMT7NAU8ZJO6	ddbc6d25-e85c-4799-b290-3bec88430fec	Farid Reza	01843180005	faridreza99@gmail.com	fgf\ndfghgf	Chattogram	Chattogram	1299.35	60.00	0.00	1299.35	delivered	cod	inside_city	\N	\N	pathao	\N	\N	\N	\N	0184315	129	0	0.00	2026-04-10 17:59:27.402922+00	2026-04-10 18:06:28.975258+00
d9fd9601-f6a3-4f4a-a472-84797531309b	RMT1OF4KLCCN	df9503a5-7fd3-4cad-a951-0ebe7e7d74c0	Test Buyer Name	01811234567	affiliatenew2@test.com	House 10, Road 5, Dhaka	Dhaka	Dhaka	0.00	120.00	0.00	0.00	processing	cod	outside_city	\N	\N	pathao	\N	\N	\N	\N	TXN9876543210	0	0	0.00	2026-04-10 15:12:21.92036+00	2026-04-10 15:12:21.92036+00
154c37ab-faeb-45e3-9e96-368f16950840	RMT9BLGUVG0K	\N	Test Customer	01700000001	\N	Test Address	Dhaka	Dhaka	180.00	60.00	0.00	180.00	delivered	cod	inside_city	\N	\N	\N	a87fd683-3cfb-4a1a-bff2-79c0cc4bf430	AFFILI8887	\N	\N	\N	18	0	0.00	2026-04-10 18:46:20.529024+00	2026-04-11 11:06:42.799374+00
530f8f4d-9128-4c9e-9263-907aef4b7371	RMT1QNIVO50C	df9503a5-7fd3-4cad-a951-0ebe7e7d74c0	New Affiliate Test	01700000000	affiliatenew2@test.com	House 10, Road 5, Dhaka	Dhaka	Dhaka	0.00	120.00	0.00	0.00	processing	cod	outside_city	\N	\N	pathao	\N	\N	\N	\N	TXN1122334455	0	0	0.00	2026-04-10 15:14:06.11341+00	2026-04-10 18:35:04.241937+00
3add046f-12e2-4477-93df-6d2af37f6c52	RMT208LIZTVB	d5c45b25-3b27-4f36-a20e-12a390c28c2a	Farid Reza	01843180003	mydocument41@gmail.com	fgf\ndfghgf	Bagerhat	Bagerhat	0.00	120.00	0.00	0.00	pending	cod	outside_city	\N	\N	pathao	\N	\N	\N	test note	0184318	0	0	0.00	2026-04-10 15:21:33.319881+00	2026-04-10 15:21:33.319881+00
dfd71588-e375-4825-8020-43f1dae70eb6	RMT8FV9RU3P6	7316e481-7a73-4da6-b3b1-6d4ca26bd044	portal acslbd	01856874593	portalacslbd@gmail.com	F\nF	Chattogram	Chattogram	180.00	60.00	0.00	180.00	delivered	cod	inside_city	\N	\N	pathao	3e569b15-505a-484d-8633-cef9c7bbcda5	AFFMNT56ZE6	\N	\N	675757	18	0	0.00	2026-04-10 18:21:40.241461+00	2026-04-10 18:39:52.909203+00
c956b13c-67e3-4ce2-ac3a-d5140ac4fcbb	RMT9ON58IEQB	7316e481-7a73-4da6-b3b1-6d4ca26bd044	portal acslbd	01856874593	portalacslbd@gmail.com	F\nF	Chattogram	Chattogram	180.00	60.00	0.00	180.00	delivered	cod	inside_city	\N	\N	pathao	3e569b15-505a-484d-8633-cef9c7bbcda5	AFFMNT56ZE6	\N	\N	675755	18	0	0.00	2026-04-10 18:56:29.230484+00	2026-04-10 18:57:26.261016+00
48abf805-8aff-4559-81f3-6ba2377473d8	RMUBH8LPF8XX	b55dbcd5-71e2-48f1-81e1-e2381fdb6756	Salm	01788339842	salam@gmail.com	halishahar .ctg	Chattogram	Chattogram	3724.70	60.00	0.00	3724.70	pending	cod	inside_city	\N	\N	pathao	\N	\N	\N	\N	hyzkt	372	0	0.00	2026-04-11 12:34:29.199541+00	2026-04-11 12:34:29.199541+00
2c6efc68-878b-415e-a049-49d56d3339c5	RMUCIABPME4O	ddbc6d25-e85c-4799-b290-3bec88430fec	Farid Reza	01843180005	faridreza99@gmail.com	Alamgir Tower, Sk Mujib Rd, Pathantuli, Chattogram	Bhola	Bhola	401.33	120.00	0.00	401.33	delivered	cod	outside_city	\N	\N	pathao	\N	\N	\N	\N	HJYD	40	0	0.00	2026-04-11 13:03:17.70404+00	2026-04-11 13:04:06.551296+00
2dc2bdd7-9935-4b15-b494-d7a9257e6134	RMUGFB3WPFM7	ddbc6d25-e85c-4799-b290-3bec88430fec	Farid Reza	01843180005	faridreza99@gmail.com	Alamgir Tower, Sk Mujib Rd, Pathantuli, Chattogram	Barguna	Barguna	2519.37	120.00	0.00	2450.37	delivered	cod	outside_city	\N	\N	pathao	\N	\N	\N	\N	hhhjjj	245	69	69.00	2026-04-11 14:52:57.224736+00	2026-04-11 14:53:16.498623+00
628f456f-3b47-46b3-9658-e556f2ba5c49	RMUGO6R6D80B	ddbc6d25-e85c-4799-b290-3bec88430fec	Farid Reza	01843180005	faridreza99@gmail.com	Alamgir Tower, Sk Mujib Rd, Pathantuli, Chattogram	Chandpur	Chandpur	249.60	120.00	0.00	179.60	delivered	cod	outside_city	\N	\N	pathao	\N	\N	\N	\N	hhhhhh	1	70	70.00	2026-04-11 14:59:51.485745+00	2026-04-11 15:00:20.238578+00
\.


--
-- Data for Name: product_activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_activity_log (id, product_id, user_id, action_type, old_value, new_value, created_at) FROM stdin;
\.


--
-- Data for Name: product_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_reviews (id, product_id, user_id, order_id, rating, comment, is_approved, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variants (id, product_id, name_en, name_bn, sku, price, stock, attributes, image_url, is_active, cost_price, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name_bn, name_en, description_bn, description_en, price, original_price, image_url, gallery_images, category_id, brand, stock, rating, reviews_count, is_featured, discount_percent, discount_type, discount_value, is_active, sku, has_variants, variant_options, affiliate_commission_type, affiliate_commission_value, cost_price, is_affiliate, created_at, updated_at, product_status, meta_title, meta_description, visible_on_website, visible_in_search, brand_id, created_by, updated_by) FROM stdin;
a678d113-6fda-41dd-a819-980cc66c895d	ওয়্যারলেস ব্লুটুথ হেডফোন	Wireless Bluetooth Headphones	নয়েজ ক্যান্সেলেশন সহ প্রিমিয়াম মানের ওয়্যারলেস হেডফোন	Premium quality wireless headphones with noise cancellation	1299.00	1999.00	https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400	[]	92e83328-dc49-4fec-bbeb-70fa1ae289e9	\N	50	4.50	42	t	35.00	\N	\N	t	\N	f	\N	\N	\N	\N	f	2026-04-10 13:31:55.676028+00	2026-04-10 13:31:55.676028+00	active	\N	\N	t	t	\N	\N	\N
e732a88e-ea6f-4c4b-a34a-d8250b740b06	স্মার্টফোন স্ট্যান্ড ও হোল্ডার	Smartphone Stand & Holder	ডেস্ক ও বেডসাইডের জন্য অ্যাডজাস্টেবল ফোন স্ট্যান্ড	Adjustable phone stand for desk and bedside use	299.00	499.00	https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=400	[]	92e83328-dc49-4fec-bbeb-70fa1ae289e9	\N	120	4.20	87	f	40.00	\N	\N	t	\N	f	\N	\N	\N	\N	f	2026-04-10 13:31:59.64731+00	2026-04-10 13:31:59.64731+00	active	\N	\N	t	t	\N	\N	\N
b753299c-9937-47a6-8f7e-a4cad0e89d59	পুরুষের কটন পোলো শার্ট	Men's Cotton Polo Shirt	প্রতিদিনের পরিধানের জন্য আরামদায়ক কটন পোলো শার্ট	Comfortable cotton polo shirt for everyday wear	699.00	999.00	https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400	[]	f0e6738c-1619-4603-9329-696339996896	\N	200	4.30	156	t	30.00	\N	\N	t	\N	f	\N	\N	\N	\N	f	2026-04-10 13:32:03.503946+00	2026-04-10 13:32:03.503946+00	active	\N	\N	t	t	\N	\N	\N
275d0210-5a65-405c-92be-cc33bb1c7957	মহিলার কুর্তি সেট	Women's Kurti Set	ম্যাচিং দুপাট্টাসহ সুন্দর ঐতিহ্যবাহী কুর্তি সেট	Beautiful traditional kurti set with matching dupatta	1199.00	1799.00	https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400	[]	f0e6738c-1619-4603-9329-696339996896	\N	80	4.60	93	t	33.00	\N	\N	t	\N	f	\N	\N	\N	\N	f	2026-04-10 13:32:07.199746+00	2026-04-10 13:32:07.199746+00	active	\N	\N	t	t	\N	\N	\N
7c6453f6-d7ef-48a6-91c1-6dad1d4b9908	প্রিমিয়াম বাসমতি চাল (৫ কেজি)	Premium Basmati Rice (5kg)	প্রিমিয়াম ফার্ম থেকে লম্বা দানার সুগন্ধি বাসমতি চাল	Long grain aromatic basmati rice from premium farms	849.00	999.00	https://images.unsplash.com/photo-1536304993881-ff86e0c9d18d?w=400	[]	65f0c5c3-9e78-491c-b52d-a634921bcafb	\N	500	4.40	234	f	15.00	\N	\N	t	\N	f	\N	\N	\N	\N	f	2026-04-10 13:32:10.927117+00	2026-04-10 13:32:10.927117+00	active	\N	\N	t	t	\N	\N	\N
7f9938eb-ebbe-4349-b12c-4298b1dbb0af	খাঁটি সরিষার তেল (১ লিটার)	Pure Mustard Oil (1L)	রান্নার জন্য কোল্ড-প্রেসড খাঁটি সরিষার তেল	Cold-pressed pure mustard oil for cooking	249.00	320.00	https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400	[]	65f0c5c3-9e78-491c-b52d-a634921bcafb	\N	300	4.70	512	f	22.00	\N	\N	t	\N	f	\N	\N	\N	\N	f	2026-04-10 13:32:14.773393+00	2026-04-10 13:32:14.773393+00	active	\N	\N	t	t	\N	\N	\N
ba9dfb07-180f-4afd-bca0-654b0602a7c0	নন-স্টিক কুকওয়্যার সেট	Non-stick Cookware Set	হিট-রেজিস্ট্যান্ট হ্যান্ডেল সহ ৫-পিস নন-স্টিক কুকওয়্যার সেট	5-piece non-stick cookware set with heat-resistant handles	2499.00	3999.00	https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400	[]	19f94872-e5d9-4504-a36a-034f6513e5d7	\N	45	4.50	78	t	37.00	\N	\N	t	\N	f	\N	\N	\N	\N	f	2026-04-10 13:32:18.500851+00	2026-04-10 13:32:18.500851+00	active	\N	\N	t	t	\N	\N	\N
ec1e07b7-a01a-4982-8345-1800484b5ce4	কটন বেড শিট সেট (কিং)	Cotton Bed Sheet Set (King)	২টি বালিশের কভার সহ নরম ১০০% কটন কিং সাইজ বেড শিট	Soft 100% cotton king size bed sheet with 2 pillow covers	1499.00	2199.00	https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400	[]	19f94872-e5d9-4504-a36a-034f6513e5d7	\N	90	4.30	145	f	32.00	\N	\N	t	\N	f	\N	\N	\N	\N	f	2026-04-10 13:32:22.275633+00	2026-04-10 13:32:22.275633+00	active	\N	\N	t	t	\N	\N	\N
5436fcee-a268-41b7-8397-d0cea33ead0d	অ্যালোভেরা ফেস ক্রিম	Aloe Vera Face Cream	সব ধরনের ত্বকের জন্য প্রাকৃতিক অ্যালোভেরা ময়েশ্চারাইজিং ফেস ক্রিম	Natural aloe vera moisturizing face cream for all skin types	399.00	599.00	https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400	[]	e9a5e954-1d2b-455c-bae8-c872608106ab	\N	250	4.40	321	t	33.00	\N	\N	t	\N	f	\N	\N	\N	\N	f	2026-04-10 13:32:26.04068+00	2026-04-10 13:32:26.04068+00	active	\N	\N	t	t	\N	\N	\N
3edfa697-745a-4949-9dc9-29ee98d1e71d	বাংলা ব্যাকরণ ও রচনা	Bangla Grammar & Composition	শিক্ষার্থীদের জন্য ব্যাপক বাংলা ব্যাকরণ বই	Comprehensive Bangla grammar book for students	18360.00	25500.00	https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400	{}	70ce0092-177e-4d1e-94b6-bdc0c71057ed	\N	150	4.60	89	f	28.00	percentage	28.00	t	\N	f	{}	fixed	500.00	0.00	t	2026-04-10 13:32:29.823983+00	2026-04-10 13:32:29.823983+00	active	\N	\N	t	t	\N	\N	\N
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, user_id, name, email, phone, avatar_url, address, city, district, is_blocked, loyalty_points, created_at, updated_at, date_of_birth, occupation, nid, payment_method, payment_number) FROM stdin;
94ac5dc4-ed49-4ca6-a791-32ce2a43cab2	139094e1-ceef-49f4-8027-a604be12daec	Farid Reza	maxtech.material@gmail.com	01255	\N	\N	\N	\N	f	0	2026-04-10 12:53:52.826072+00	2026-04-10 12:53:52.826072+00	\N	\N	\N	\N	\N
d7368aef-5bb2-4dd1-a0bc-5b109cde1ba4	d9af9e42-1354-4ce6-8f4c-66f878ff63a1	Test User	testuser_e2e_1775825941983@test.com	01712345678	\N	\N	\N	\N	f	0	2026-04-10 13:00:26.540679+00	2026-04-10 13:00:26.540679+00	\N	\N	\N	\N	\N
100e775b-f072-4a59-b8e8-0d6aed1a985c	582eee0b-e786-40bd-83a3-8ffed5110fb5	E2E Test User	e2etest_1775826500150@test.com	01712345678	\N	\N	\N	\N	f	0	2026-04-10 13:10:01.571123+00	2026-04-10 13:10:01.571123+00	\N	\N	\N	\N	\N
d8f87b00-e581-44ce-8fb2-43058fce0945	0c357a72-0f43-4af8-aaf2-88b063c1a045	RM Test User	rm_test_e8tivh@example.com	01712345678	\N	\N	\N	\N	f	0	2026-04-10 13:49:25.688479+00	2026-04-10 13:49:25.688479+00	\N	\N	\N	\N	\N
b2f1ba3c-c644-41ac-bec8-35f8947a35bd	1151d93d-a4e8-41e6-8e07-1ae81db5b821	Affiliate Tester	afftest@rayzanmart.com	\N	\N	\N	\N	\N	f	0	2026-04-10 13:51:44.424933+00	2026-04-10 13:51:44.424933+00	\N	\N	\N	\N	\N
49a40a5d-cf26-49ca-b6c0-e033a59763c5	c8133969-8286-4015-b8b9-df1421cfb03c	maxtech	jahir.vklbd@gmail.com	01843180006	\N	\N	\N	\N	f	0	2026-04-10 13:58:45.804622+00	2026-04-10 13:58:45.804622+00	\N	\N	\N	\N	\N
b964a961-3285-4636-b628-4bb58bd3108c	eef1a365-dd1c-48f1-a9bb-a5147db71667	Test Buyer	buyer@test.com	01712345678	\N	\N	\N	\N	f	0	2026-04-10 14:22:26.730111+00	2026-04-10 14:22:26.730111+00	\N	\N	\N	\N	\N
e324b221-a500-4023-8e66-ff0f679555a6	009af679-537c-4011-87a1-b82de0fc1ac9	shipon	shipon.vklbd@gmail.com	01843180001	\N	\N	\N	\N	f	0	2026-04-10 14:35:41.570422+00	2026-04-10 14:35:41.570422+00	\N	\N	\N	\N	\N
8981aa20-821b-40e1-b132-f2c318744105	df9503a5-7fd3-4cad-a951-0ebe7e7d74c0	New Affiliate Test	affiliatenew2@test.com	01700000000	\N	\N	\N	\N	f	0	2026-04-10 14:45:36.780986+00	2026-04-10 14:45:36.780986+00	\N	\N	\N	\N	\N
8723b2a6-5e74-4c78-b109-a643f1ba5d9f	a5def310-7e86-4796-97ca-9262d9555c1b	Farid Reza	hasan.vklbd@gmail.com	01843180005	\N	\N	\N	\N	f	0	2026-04-10 14:53:59.500138+00	2026-04-10 14:53:59.500138+00	\N	\N	\N	\N	\N
8dd0cd2a-f3d3-41b1-8685-04e1136e66c2	787db3a6-ccb0-4ee0-98ca-c84dc9b0d404	Farid Reza	anowerhossenctg865@gmail.com	01843180022	\N	\N	\N	\N	f	0	2026-04-10 14:54:39.196213+00	2026-04-10 14:54:39.196213+00	\N	\N	\N	\N	\N
1c3e3d66-32df-41a8-89b5-650152651e45	d5c45b25-3b27-4f36-a20e-12a390c28c2a	Farid Reza	mydocument41@gmail.com	01843180003	\N	\N	\N	\N	f	0	2026-04-10 15:21:32.981738+00	2026-04-10 15:21:32.981738+00	\N	\N	\N	\N	\N
2da092f5-27e8-439a-a3ed-9d8b9958a765	244a82ff-73a8-4c80-8b0e-94f53c09a8e6	SMTP Test User	smtptest@rayzanmart.com	01700000001	\N	\N	\N	\N	f	0	2026-04-10 15:27:14.849127+00	2026-04-10 15:27:14.849127+00	\N	\N	\N	\N	\N
1994f0d0-aaeb-4ef6-a7e5-9883483f7ea2	4c66c703-f12b-4cf4-a6e8-5e44eb945bc9	Farid Reza	maxtechctg@gmail.com	01843180002	\N	\N	\N	\N	f	0	2026-04-10 15:36:53.898214+00	2026-04-10 15:36:53.898214+00	\N	\N	\N	\N	\N
51eacd72-7b74-4e66-97b4-d5cb8c86bcab	9771c616-cca4-4477-8e76-9be264ea3a99	Farid Reza	myhappy3456@gmail.com	01843180006	\N	\N	\N	\N	f	0	2026-04-10 16:01:52.089393+00	2026-04-10 16:01:52.089393+00	\N	\N	\N	\N	\N
5fe1ced0-7cbc-4fc9-b4f6-3d48d84e2cff	758af75e-0795-4302-b41f-34085a58b03f	Test User	testpermanent@example.com	\N	\N	\N	\N	\N	f	0	2026-04-10 16:10:27.193646+00	2026-04-10 16:10:27.193646+00	\N	\N	\N	\N	\N
57d56356-cd6c-4677-9f74-129c5c1d9a4b	7d31c2e8-4b02-441b-bc64-60400cb12e83	Farid Reza	mizandubai839@gmail.com	01843180006	\N	\N	\N	\N	f	0	2026-04-10 16:21:24.660026+00	2026-04-10 16:21:24.660026+00	\N	\N	\N	\N	\N
7aaf6ba4-e3a3-4a05-802a-6dc13af1beff	fe17967d-88d3-4465-9e42-c27119450098	Farid Reza	mohammadfarid1051994@gmail.com	mizandubai839@gmail.com	\N	\N	\N	\N	f	0	2026-04-10 16:25:45.602854+00	2026-04-10 16:25:45.602854+00	\N	\N	\N	\N	\N
ac0a1e7f-d794-4fb8-9efd-28972f98aaa4	9051ac6f-5c81-45b6-81b9-cf48a51018ff	Test Affiliate	affiliatetest1@test.com	01700000001	\N	\N	\N	\N	f	0	2026-04-10 16:39:50.428556+00	2026-04-10 16:39:50.428556+00	\N	\N	\N	\N	\N
0a92c3db-b03b-426b-ba61-246885d4102a	d101dbfd-4399-487d-a2cd-bbb3a5f33b52	Farid Reza	sumaiyaislam2039@gmail.com	01843180005	\N	\N	\N	\N	f	0	2026-04-10 16:44:44.353798+00	2026-04-10 16:44:44.353798+00	\N	\N	\N	\N	\N
d87b1c4f-ea3c-41d6-a67f-7e8ebaede023	524565f0-ee6c-48d4-9b76-81984ac56ca7	Farid Reza	emon.vklbd@gmail.com	01843180002	\N	\N	\N	\N	f	0	2026-04-10 16:50:46.821539+00	2026-04-10 16:50:46.821539+00	\N	\N	\N	\N	\N
1e8be0b2-62f6-48a2-978a-790807d01230	f1a0b7a3-3e3a-4773-a3f7-dd006e7b14e1	Test Guest User	newguest123@test.com	01811111111	\N	\N	\N	\N	f	6	2026-04-10 14:32:41.845347+00	2026-04-10 14:32:41.845347+00	\N	\N	\N	\N	\N
860e08ec-ba90-4112-a0bf-1b3d60a5753a	7316e481-7a73-4da6-b3b1-6d4ca26bd044	portal acslbd	portalacslbd@gmail.com	01856874593	\N	\N	\N	\N	f	36	2026-04-10 18:21:38.544304+00	2026-04-10 18:21:38.544304+00	\N	\N	\N	\N	\N
08dc6fee-3b64-47d8-a281-5c2b67920ed5	7be1f597-28b2-4e70-b82e-ecbeb175abdc	manager	manager.vklbd@gmail.com	01843180005	\N	\N	\N	\N	f	0	2026-04-10 19:30:22.845147+00	2026-04-10 19:30:22.845147+00	\N	\N	\N	\N	\N
7861b147-5580-42ff-a95f-d759fd961352	04b538c3-5fb5-429e-b3c8-0b0edf95487b	Farid Reza	misbah.vklbd@gmail.com	01843180004	\N	\N	\N	\N	f	1836	2026-04-10 16:12:52.825541+00	2026-04-10 16:12:52.825541+00	\N	\N	\N	\N	\N
8c111259-82c1-43d9-b58e-28023f0bd628	b55dbcd5-71e2-48f1-81e1-e2381fdb6756	Salm	salam@gmail.com	01788339842	\N	\N	\N	\N	f	0	2026-04-11 12:34:27.636165+00	2026-04-11 12:34:27.636165+00	\N	\N	\N	\N	\N
ed4d279b-6234-49de-af58-045d632eded5	bceec809-73aa-4218-bca4-a79bfe7c7fd8	Rouf	admin@rayzanmart.com	\N	\N	\N	\N	\N	f	0	2026-04-10 13:55:59.203969+00	2026-04-11 09:15:05.235394+00	\N	\N	\N	\N	\N
7baba5c8-6b6b-4a8b-91a2-7c5a2aeb58cd	ddbc6d25-e85c-4799-b290-3bec88430fec	Farid Reza	faridreza99@gmail.com	01843180005	/api/uploads/img_1775849606550_ei9vqp.png	\N	\N	\N	f	276	2026-04-10 13:39:25.662415+00	2026-04-10 13:39:25.662415+00	\N	\N	\N	\N	\N
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_settings (id, setting_key, setting_value, created_at, updated_at) FROM stdin;
2194010e-7080-463d-baba-f45aa249c3de	loyalty_points_per_order	10	2026-04-10 13:04:08.228324+00	2026-04-10 13:04:08.228324+00
19988570-964e-4e60-a280-7d94593a9360	loyalty_points_value	100	2026-04-10 13:04:11.988287+00	2026-04-10 13:04:11.988287+00
89fc621c-ae68-4c42-bb54-66db5ee71860	min_order_amount	100	2026-04-10 13:04:15.891166+00	2026-04-10 13:04:15.891166+00
9dd73e53-a9ef-4d12-9f92-37770bdf5407	free_shipping_threshold	1000	2026-04-10 13:04:19.706781+00	2026-04-10 13:04:19.706781+00
85a2731b-2803-4252-aa27-688b415b5fbc	flash_sale_enabled	false	2026-04-10 13:04:23.470643+00	2026-04-10 13:04:23.470643+00
6f6cd5b8-fb96-4aa9-b7ae-8510e218184f	maintenance_mode	false	2026-04-10 13:04:27.271491+00	2026-04-10 13:04:27.271491+00
46ad4335-59f9-4773-b08e-fa74c152b09b	currency	"BDT"	2026-04-10 13:07:07.222441+00	2026-04-10 13:07:07.222441+00
e11b5c26-9ad6-48a1-b622-a72a8138df35	phone	"+8801800000000"	2026-04-10 13:07:14.800241+00	2026-04-10 13:07:14.800241+00
dde99b31-4a9c-4e16-8a50-1b6915b56444	email	"info@rayzanmart.com"	2026-04-10 13:07:18.726907+00	2026-04-10 13:07:18.726907+00
cb38607c-606a-4560-a23d-41243b1fab24	address	"Dhaka, Bangladesh"	2026-04-10 13:07:22.731101+00	2026-04-10 13:07:22.731101+00
590e824c-edf3-4ea0-9977-4c3a3ea7085d	primary_color	"#f97316"	2026-04-10 13:07:30.319529+00	2026-04-10 13:07:30.319529+00
06f7c793-552e-4741-997d-ec80f207a4c0	modules	{"coupons": true, "affiliate": true, "demo_mode": false}	2026-04-10 13:35:10.903272+00	2026-04-10 13:35:10.903272+00
33897644-899e-4ad5-a3c6-56d4bd86bae1	delivery_charges	{"inside_city": 60, "outside_city": 120}	2026-04-10 13:35:14.734303+00	2026-04-10 13:35:14.734303+00
4e7598cb-7b72-4a8d-a625-f94b3142ad56	delivery_fee_payment	{"bkash_number": "01800000000", "instructions_bn": "বিকাশে পেমেন্ট করুন", "instructions_en": "Pay via bKash"}	2026-04-10 13:35:18.628127+00	2026-04-10 13:35:18.628127+00
870e0cc8-5079-4c73-9aa0-a82c34cf7715	flash_sale	{"end_time": null, "is_active": false}	2026-04-10 13:35:22.434517+00	2026-04-10 13:35:22.434517+00
d6b41ae2-e7c4-4bb3-971b-f2c7c7d18783	footer_pages	{"about_us": {"bn": "", "en": ""}, "contact_us": {"email": "info@rayzanmart.com", "phone": "+8801800000000", "address": "Dhaka, Bangladesh"}, "refund_policy": {"bn": "", "en": ""}, "privacy_policy": {"bn": "", "en": ""}, "terms_conditions": {"bn": "", "en": ""}}	2026-04-10 13:35:30.147698+00	2026-04-10 13:35:30.147698+00
60557ec7-6bcd-4cc3-bf86-b6c7cdf4794a	currency_symbol	"৳"	2026-04-10 13:07:11.003565+00	2026-04-10 13:07:11.003565+00
3d6cd1b8-a21b-4de1-afb1-dceb9bdef50b	site_logo	{"url": "/api/uploads/img_1775849682773_xx1atr.png"}	2026-04-10 13:35:07.06192+00	2026-04-10 13:35:07.06192+00
7744c90f-e923-404e-8289-b5ea62069ca9	site_name	{"bn": "রায়জন মার্ট", "en": "Rayzan Mart"}	2026-04-10 13:07:03.262429+00	2026-04-10 13:07:03.262429+00
485051ab-b687-4a56-bd57-de11d7985ae0	cta_section	{"title_bn": "আমাদের সাথে পথচলা শুরু করুন", "title_en": "Start Your Journey With Us", "button_link": "/products", "subtitle_bn": "সেরা পণ্য, সেরা দাম — এখনই শুরু করুন", "subtitle_en": "Best products, best prices — start now", "button_text_bn": "এখনই কেনাকাটা করুন", "button_text_en": "Shop Now"}	2026-04-11 13:00:17.173977+00	2026-04-11 13:00:17.173977+00
23fe05c8-42fd-4f8d-8823-77b9d90fd183	whatsapp_number	8801347195345	2026-04-10 13:07:26.545514+00	2026-04-10 13:07:26.545514+00
e0a7d5ec-94fd-4ef8-98d2-fbecf1ccd56f	whatsapp_message	"হ্যালো! আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।হ্যালো! আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।"	2026-04-11 13:22:38.982237+00	2026-04-11 13:22:38.982237+00
08e4b789-adb6-40f8-9fd1-fb5d71f99d49	loyalty_rules	{"enabled": true, "earn_ratio": 100, "redeem_ratio": 1, "min_redeem_points": 50, "points_validity_days": 365, "max_redeem_percentage": 50}	2026-04-10 13:35:26.228886+00	2026-04-10 13:35:26.228886+00
\.


--
-- Data for Name: system_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_notifications (id, user_id, title_bn, title_en, message_bn, message_en, type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: user_login_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_login_logs (id, user_id, event_type, ip_address, user_agent, created_at) FROM stdin;
1134fc5d-f14f-4459-928a-30aa6235ea73	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 11:44:57.056335+00
859561ac-88ab-4b82-927f-a88ba8a01a67	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	undici	2026-04-11 11:45:04.389555+00
a53ca15f-685b-46d6-b4dd-21b668672d0a	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	undici	2026-04-11 11:45:10.419181+00
31485efa-bc54-4fcc-a4dd-d7b5b0bc15da	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 11:51:46.537785+00
1fe893f4-070e-4386-bcc7-db712008f43b	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 11:54:53.425178+00
85562aba-ab40-4d4e-80e2-6152b73fcade	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	undici	2026-04-11 11:55:08.573409+00
8b2bf442-7c0c-4f4e-85fb-6b29cae90fe5	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 12:07:22.593109+00
fcc30670-4bda-4daf-b4c9-f2f3f04697c7	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 12:07:30.015037+00
41179c50-ca9f-4591-b689-6f12b36409fa	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 12:07:39.062689+00
82fdab48-ee10-4e5c-baf6-ecc231f705ab	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 12:08:26.761035+00
be3b6165-25d6-4e4a-abea-e70582666d6e	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 12:08:39.073721+00
1db4abfd-2b41-4b17-9dc5-2839e20bb717	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 12:12:46.38312+00
0c206235-3661-434e-9bf1-3b5e8bf4f444	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 12:15:11.515262+00
576ad2ef-7f54-492e-9c9f-ae75190f55ab	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 12:15:15.133928+00
e88fbc2e-415d-4f3c-9ee7-56e9c54a86e1	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 12:26:56.433936+00
79e9357f-90a0-4033-b282-ee8a3896fbc6	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 12:29:09.675591+00
c10d2378-1ed0-4871-b143-0fe6c7bd9393	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 12:31:36.611286+00
8e01aa6d-732f-46d5-8be2-744908faaabe	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 12:35:14.596564+00
557afec5-e7b6-4548-8450-dc134d0d1402	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 12:47:10.043547+00
4c838864-1595-4ecc-a15d-1abfa3ae618b	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 13:01:05.700323+00
38f20b37-c29d-4c80-a890-bddf980d6b8e	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 13:01:47.589951+00
7772fccd-2599-43c1-ac87-dac53f1f5d08	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 13:03:47.911915+00
d6c352d2-8158-4a54-a38c-f1f095225ae7	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 13:04:27.274465+00
91060a0b-4b5e-4812-b7e9-9e6b981f32c4	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 13:06:13.434084+00
6db3a214-5f0a-40d6-a7f5-69d886650c27	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 13:09:10.869544+00
8788beac-3f5e-453f-a375-2d862014c44f	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 13:17:38.353296+00
959d0087-557a-4cec-9f59-fb6a19ce9f9d	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 13:22:53.780936+00
41193f35-4cf0-443e-bbe4-97ac5db2f0c8	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 13:23:27.824059+00
5ab50e26-3d06-418d-b0ae-66602d3cce59	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 13:25:49.156427+00
ada33522-c209-4b93-b80d-a6cf1806df78	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 13:25:56.110758+00
7a30ab1d-bb6d-4cae-b300-730966e60b9c	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 13:29:26.11161+00
09d21b9a-46cf-420d-8c63-804b84edc57b	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 13:33:49.938062+00
1b10ea16-28d4-4fa3-89e6-a1a32753ef92	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 13:33:55.42546+00
b7c26493-9efc-4cb8-a9f9-21887201cf25	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 13:33:59.329041+00
95d1454d-f909-4bc3-932b-0a7da13e83df	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 13:34:06.537707+00
9944d4ed-0c9d-4c88-af7a-ee19b3c8dedd	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 13:34:13.506223+00
e8b32388-1f18-45a2-b02e-0661319687dc	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 13:34:38.234383+00
f2683f63-d3f0-46ad-903d-eebc706cb544	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 13:40:19.458027+00
4f5b1af4-8fa7-436f-8ad9-a55ae7377758	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 13:43:06.285662+00
8a8d42ce-88a2-448e-b3fc-1027ab48c4b9	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 13:46:03.867237+00
01ac0480-3406-42dc-85eb-c2c82c1d9cfd	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 13:52:00.680498+00
0819203e-9d3c-4725-818b-ce8cfebe9059	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 14:42:09.37568+00
52c16a3b-ce9d-484b-a09d-1599172adf67	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 14:44:43.164434+00
f7928494-2da3-4550-a827-e75496c03e49	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 14:45:07.205559+00
59387c9d-c09a-4aaf-9407-d4331e6ea7d7	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::1	curl/8.14.1	2026-04-11 14:48:04.521528+00
d3491f95-470b-48fa-aac7-3f1ab983cfff	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 14:53:08.734747+00
571a6c9e-1d5d-4e58-b022-3414c8e40fc4	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 14:53:24.945803+00
69c3a6c4-99df-40b2-9167-58ac5c5187fd	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 14:54:10.336552+00
7fc887e5-25da-4958-af7e-4f9a11f74f69	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 15:00:03.149378+00
963c3087-b641-4036-b1d8-c592b2f40574	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-11 15:00:28.254569+00
20aa25e2-ced3-4c0c-b93c-b18bf6085325	524565f0-ee6c-48d4-9b76-81984ac56ca7	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 15:05:14.312082+00
aaef551e-2c06-4489-8b58-c2bdba34bba5	524565f0-ee6c-48d4-9b76-81984ac56ca7	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 15:15:13.760722+00
872eadc4-af25-4ec2-9286-f95f0e611e27	524565f0-ee6c-48d4-9b76-81984ac56ca7	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 15:18:22.237286+00
6da6be85-4d68-402c-b6be-05f14d372651	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 15:18:39.345046+00
38ab2373-7156-4cb3-928a-c85d59b55119	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 15:20:04.943631+00
559d22ca-e8a6-4694-ba89-2f36b8fdf1b8	bceec809-73aa-4218-bca4-a79bfe7c7fd8	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-11 15:23:20.560074+00
e589a0f2-2f4f-4e7a-a89f-edaa4e812570	ddbc6d25-e85c-4799-b290-3bec88430fec	login	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-12 08:42:38.106625+00
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role, created_at) FROM stdin;
3b735c67-7e89-4a5c-98a9-6a4c5a0f0c82	d9af9e42-1354-4ce6-8f4c-66f878ff63a1	customer	2026-04-10 13:00:26.545057+00
73825016-cc1d-4139-829d-a37fde3a5ec1	582eee0b-e786-40bd-83a3-8ffed5110fb5	customer	2026-04-10 13:10:01.575191+00
13437dff-53b1-4f2d-a389-747e61700b1f	ddbc6d25-e85c-4799-b290-3bec88430fec	customer	2026-04-10 13:39:25.665771+00
b0350208-9268-456d-93ba-8fc02f4b0cf5	0c357a72-0f43-4af8-aaf2-88b063c1a045	customer	2026-04-10 13:49:25.692949+00
a3389221-df83-4689-b449-c059c929105b	1151d93d-a4e8-41e6-8e07-1ae81db5b821	customer	2026-04-10 13:51:48.391507+00
1286ac7e-b9a2-4b76-85a6-f280a90acb9a	bceec809-73aa-4218-bca4-a79bfe7c7fd8	admin	2026-04-10 13:56:03.422753+00
de35dd80-d7a7-4249-a5b9-cc371db9a912	c8133969-8286-4015-b8b9-df1421cfb03c	customer	2026-04-10 13:58:45.808562+00
70bca077-a9c9-4cb3-b660-45601156dd6a	1151d93d-a4e8-41e6-8e07-1ae81db5b821	affiliate	2026-04-10 14:18:45.324643+00
0ff19a2c-cc2b-47a6-8113-bca88d0b76da	eef1a365-dd1c-48f1-a9bb-a5147db71667	customer	2026-04-10 14:22:26.734541+00
ebddb964-2ed3-44dc-b283-d8ff7c0661e4	f1a0b7a3-3e3a-4773-a3f7-dd006e7b14e1	customer	2026-04-10 14:32:41.849948+00
bc803093-7dc5-4c85-84e2-c6334584d959	009af679-537c-4011-87a1-b82de0fc1ac9	customer	2026-04-10 14:35:41.573682+00
899aaa9b-18ca-44a1-a47a-e680ef521aa4	df9503a5-7fd3-4cad-a951-0ebe7e7d74c0	customer	2026-04-10 14:45:36.785671+00
7a4187ca-5b2d-461b-8706-916ceebb05eb	139094e1-ceef-49f4-8027-a604be12daec	affiliate	2026-04-10 12:53:52.829417+00
c9f666ef-2ab4-4ce8-b5b5-5c9ff88e5787	a5def310-7e86-4796-97ca-9262d9555c1b	customer	2026-04-10 14:53:59.503628+00
9519307e-7369-415a-90f0-7eecf53035e7	787db3a6-ccb0-4ee0-98ca-c84dc9b0d404	customer	2026-04-10 14:54:39.199652+00
b500e1df-8d13-49b3-97c4-469c94b4f54c	d5c45b25-3b27-4f36-a20e-12a390c28c2a	customer	2026-04-10 15:21:32.985758+00
730389c8-24e5-4a10-a32a-51efd0a087e2	244a82ff-73a8-4c80-8b0e-94f53c09a8e6	customer	2026-04-10 15:27:14.853914+00
3cc0e6b1-e7fe-48c5-a3be-21e1b025cd70	4c66c703-f12b-4cf4-a6e8-5e44eb945bc9	customer	2026-04-10 15:36:53.902712+00
1f9e319b-83b6-4f13-80d1-791517e9c4cf	9771c616-cca4-4477-8e76-9be264ea3a99	customer	2026-04-10 16:01:52.0927+00
98f33846-4253-47cf-bfe5-f045b1ff0710	758af75e-0795-4302-b41f-34085a58b03f	customer	2026-04-10 16:10:27.197963+00
167d5fd1-38d6-41cf-bae9-cda059a7ae29	04b538c3-5fb5-429e-b3c8-0b0edf95487b	customer	2026-04-10 16:12:52.829671+00
5dd82ce2-96a6-4c2b-aa32-f61d5dca94cb	7d31c2e8-4b02-441b-bc64-60400cb12e83	customer	2026-04-10 16:21:24.664023+00
7d8208ec-65e1-4e46-b0a3-6c25f59aaa74	fe17967d-88d3-4465-9e42-c27119450098	customer	2026-04-10 16:25:45.605405+00
f0916e06-393c-415a-8a96-54bbd110660c	9051ac6f-5c81-45b6-81b9-cf48a51018ff	customer	2026-04-10 16:39:50.484229+00
63672c37-06d6-4cc1-914f-9b598690d318	9051ac6f-5c81-45b6-81b9-cf48a51018ff	affiliate	2026-04-10 16:39:50.556898+00
3750a2ef-5c77-424e-906e-478f1721eab7	d101dbfd-4399-487d-a2cd-bbb3a5f33b52	customer	2026-04-10 16:44:44.358542+00
2c7f98a6-2fa2-4a6a-b3d0-dead12882a81	d101dbfd-4399-487d-a2cd-bbb3a5f33b52	affiliate	2026-04-10 16:44:44.362725+00
fe74cc20-63f1-440f-b828-b8b2ac4eb07c	524565f0-ee6c-48d4-9b76-81984ac56ca7	customer	2026-04-10 16:50:46.82443+00
4444f9d7-998e-4320-8457-fb339b9e0f42	524565f0-ee6c-48d4-9b76-81984ac56ca7	affiliate	2026-04-10 16:50:46.827153+00
fad43de3-84f1-4b35-921b-88ab451557cc	7316e481-7a73-4da6-b3b1-6d4ca26bd044	customer	2026-04-10 18:21:38.638226+00
22bee5ee-d3fb-4000-979d-2edd3f1b476a	7be1f597-28b2-4e70-b82e-ecbeb175abdc	customer	2026-04-10 19:30:22.848953+00
c6b542ac-9231-4b93-a3c5-96e9aa3bd506	7be1f597-28b2-4e70-b82e-ecbeb175abdc	affiliate	2026-04-10 19:30:22.923036+00
8886e178-386c-4855-b13b-ae7722563089	b55dbcd5-71e2-48f1-81e1-e2381fdb6756	customer	2026-04-11 12:34:27.650868+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, email_confirmed, verification_token, verification_token_expires, reset_token, reset_token_expires, created_at, updated_at) FROM stdin;
139094e1-ceef-49f4-8027-a604be12daec	maxtech.material@gmail.com	$2b$10$AePs61pVSRx1aBopObRUJ.YN.sjZipZsCvP15uXjcSDW2pDFuDDU6	t	c17242ff-0e42-4f9d-94b5-793dc1354598	2026-04-11 12:53:52.822+00	\N	\N	2026-04-10 12:53:52.823017+00	2026-04-10 12:53:52.823017+00
d9af9e42-1354-4ce6-8f4c-66f878ff63a1	testuser_e2e_1775825941983@test.com	$2b$10$DdwkOy9tKSJOERF7ZZz99uGLrgZtUWy740w7OoRKuKsL3K29ODZY2	t	\N	\N	\N	\N	2026-04-10 13:00:26.503076+00	2026-04-10 13:00:26.503076+00
582eee0b-e786-40bd-83a3-8ffed5110fb5	e2etest_1775826500150@test.com	$2b$10$OtlMy4msoNhZop657fJLCOdQuj5tiqZq.2moweQq6ZnJ2AG3uiqRi	t	\N	\N	\N	\N	2026-04-10 13:10:01.482851+00	2026-04-10 13:10:01.482851+00
1151d93d-a4e8-41e6-8e07-1ae81db5b821	afftest@rayzanmart.com	$2b$10$0QTXHZMFKirfgNdvv.ScOuUUfw91GJ8bytgCMtcGARepWfbzNEWnG	t	\N	\N	\N	\N	2026-04-10 13:51:40.432951+00	2026-04-10 13:51:40.432951+00
bceec809-73aa-4218-bca4-a79bfe7c7fd8	admin@rayzanmart.com	$2b$10$Iizq.lznekTNie6B/uwG7.ti09Js0E.fLt7.aOj8dPR7mrglpG8pa	t	\N	\N	\N	\N	2026-04-10 13:55:55.299863+00	2026-04-10 13:55:55.299863+00
df9503a5-7fd3-4cad-a951-0ebe7e7d74c0	affiliatenew2@test.com	$2b$10$Abg07QaQ6CQY9xmwcr6FzuX0K7SsoOmU50DdjakQCIQkH0s84ZwiW	t	d14e4034-253d-44ab-bfc0-5905ea9cc156	2026-04-11 14:45:36.689+00	\N	\N	2026-04-10 14:45:36.690288+00	2026-04-10 14:45:36.690288+00
244a82ff-73a8-4c80-8b0e-94f53c09a8e6	smtptest@rayzanmart.com	$2b$10$NrHYaeyCNkM5h24S66qT4.fl0f44hlWVhJ0w8105PEkuIq9IIYe3e	t	\N	\N	\N	\N	2026-04-10 15:27:14.815407+00	2026-04-10 15:27:14.815407+00
4c66c703-f12b-4cf4-a6e8-5e44eb945bc9	maxtechctg@gmail.com	$2b$10$jjRIrRDVSaroe7t5ISmCgO/xI13nJtCzPqRjAKgveFkPxW0bn8Duq	t	\N	\N	\N	\N	2026-04-10 15:36:53.665154+00	2026-04-10 15:36:53.665154+00
9771c616-cca4-4477-8e76-9be264ea3a99	myhappy3456@gmail.com	$2b$10$8T8C.UDOSbBxKQW5kVQsDuAXFk0hBM.YaZ1i6It12EopeNLNq0MgC	t	\N	\N	\N	\N	2026-04-10 16:01:51.830512+00	2026-04-10 16:01:51.830512+00
ddbc6d25-e85c-4799-b290-3bec88430fec	faridreza99@gmail.com	$2b$10$fC0Z41bWwgjW2OAtD6.cy.dbpEk7Aa7nJVD/gRNcwQ1hJic9Zwi6C	t	\N	\N	\N	\N	2026-04-10 13:39:25.629457+00	2026-04-10 13:39:25.629457+00
0c357a72-0f43-4af8-aaf2-88b063c1a045	rm_test_e8tivh@example.com	$2b$10$lrtHIijvZBDXjiRFaXfC0OlgOi2LVoHQR5sX3aFTZwGNVZ5CqiMxm	t	\N	\N	\N	\N	2026-04-10 13:49:25.515077+00	2026-04-10 13:49:25.515077+00
c8133969-8286-4015-b8b9-df1421cfb03c	jahir.vklbd@gmail.com	$2b$10$V79IeSU88WBzywyGjawxIepNhkrH.fkjo82/pIIRBHMbEy8WpFz5O	t	\N	\N	\N	\N	2026-04-10 13:58:45.76761+00	2026-04-10 13:58:45.76761+00
eef1a365-dd1c-48f1-a9bb-a5147db71667	buyer@test.com	$2b$10$XyrQs.4wBIuy6M5lqXg4KuCBmPBTVeWxweA6kb83eLTJK3OiphwQm	t	\N	\N	\N	\N	2026-04-10 14:22:26.696736+00	2026-04-10 14:22:26.696736+00
f1a0b7a3-3e3a-4773-a3f7-dd006e7b14e1	newguest123@test.com	$2b$10$sIMHMLfeVDiHyfZHwXI5F.g0/NsQZZff6VVuQBu0ZblhGO142Xhx2	t	\N	\N	\N	\N	2026-04-10 14:32:41.645271+00	2026-04-10 14:32:41.645271+00
009af679-537c-4011-87a1-b82de0fc1ac9	shipon.vklbd@gmail.com	$2b$10$8KnG8fCQcHKXdz4Ig/1k0Ofz98HAsH1gz9ni7bdr9XyqvBUgsaNvC	t	\N	\N	\N	\N	2026-04-10 14:35:41.567655+00	2026-04-10 14:35:41.567655+00
a5def310-7e86-4796-97ca-9262d9555c1b	hasan.vklbd@gmail.com	$2b$10$Klfx9n13W24usOfLozGf9e4UX6ag8Pq9vTt47vhqPw/84WV/tj6Z2	t	\N	\N	\N	\N	2026-04-10 14:53:59.470299+00	2026-04-10 14:53:59.470299+00
787db3a6-ccb0-4ee0-98ca-c84dc9b0d404	anowerhossenctg865@gmail.com	$2b$10$f/rqG9Sgez0/qKkcg9F53u6GXDtx254sHcStfsX1gDHB8DNHRI1MG	t	\N	\N	\N	\N	2026-04-10 14:54:39.191838+00	2026-04-10 14:54:39.191838+00
d5c45b25-3b27-4f36-a20e-12a390c28c2a	mydocument41@gmail.com	$2b$10$2n3eciAgXP4ke2xexhbsOucnQPihXgXq83ASe7dJUJjVhgiGPmSou	t	\N	\N	\N	\N	2026-04-10 15:21:32.894097+00	2026-04-10 15:21:32.894097+00
758af75e-0795-4302-b41f-34085a58b03f	testpermanent@example.com	$2b$10$UE8mDJFQsBX2K3T6BRcFF.mY1PRdpxhaR5b1l8L24g8t0G6PIRm.C	t	\N	\N	\N	\N	2026-04-10 16:10:27.078425+00	2026-04-10 16:10:27.078425+00
04b538c3-5fb5-429e-b3c8-0b0edf95487b	misbah.vklbd@gmail.com	$2b$10$QMfg.GTu34exbcTalNhUauAap0UBw30OfQaWE3Dt/FMEDfs4lxyYG	t	\N	\N	\N	\N	2026-04-10 16:12:52.791022+00	2026-04-10 16:12:52.791022+00
7d31c2e8-4b02-441b-bc64-60400cb12e83	mizandubai839@gmail.com	$2b$10$.ge7tyPo8XMz/BlfDmGHJOlk1X2VUTKpSVcfg5TpFr23bc4yPPbTi	t	\N	\N	\N	\N	2026-04-10 16:21:24.450717+00	2026-04-10 16:21:24.450717+00
fe17967d-88d3-4465-9e42-c27119450098	mohammadfarid1051994@gmail.com	$2b$10$SI9VCKrm0dMGis98eqCofOqwXMpsMMlbAYDdzedS9b2e8pFeNTYYS	t	\N	\N	\N	\N	2026-04-10 16:25:45.598688+00	2026-04-10 16:25:45.598688+00
9051ac6f-5c81-45b6-81b9-cf48a51018ff	affiliatetest1@test.com	$2b$10$Kxa5XuunGzCrMtu9M.j/6OKeOIOUeajH.UDgeVnM5B18HByZkRp.u	t	\N	\N	\N	\N	2026-04-10 16:39:50.222369+00	2026-04-10 16:39:50.222369+00
d101dbfd-4399-487d-a2cd-bbb3a5f33b52	sumaiyaislam2039@gmail.com	$2b$10$q1lPCEyB7xoWFD4uniy5j.Vl4xsSFMlfDC.nyyeO5JuTMXeOSbZqq	t	\N	\N	\N	\N	2026-04-10 16:44:44.135513+00	2026-04-10 16:44:44.135513+00
524565f0-ee6c-48d4-9b76-81984ac56ca7	emon.vklbd@gmail.com	$2b$10$jq84P1wRMNm8iL7O/Ts9ou1LRZ1YBBSXq.tiwJbC.vhpRf7hO03d6	t	\N	\N	\N	\N	2026-04-10 16:50:46.796017+00	2026-04-10 16:50:46.796017+00
7316e481-7a73-4da6-b3b1-6d4ca26bd044	portalacslbd@gmail.com	$2b$10$eUKvj3CFzrVXkinDeS/Cx.kJsWomreUv8c7VyywRMiLxnKMp5vyM6	t	\N	\N	\N	\N	2026-04-10 18:21:38.54106+00	2026-04-10 18:21:38.54106+00
7be1f597-28b2-4e70-b82e-ecbeb175abdc	manager.vklbd@gmail.com	$2b$10$22vd2bbsHOl/IqOFCx9aD.jusjRYAiDXhQ/Vy.RugNkhr29w19Ozy	t	\N	\N	\N	\N	2026-04-10 19:30:22.815983+00	2026-04-11 12:31:36.879367+00
b55dbcd5-71e2-48f1-81e1-e2381fdb6756	salam@gmail.com	$2b$10$HwuM8u8tEUy1V8Hlo/ieI.K5bZKEvUvh.CWFdwwkBYVijQX1zH4DS	t	\N	\N	\N	\N	2026-04-11 12:34:27.603866+00	2026-04-11 12:34:27.603866+00
\.


--
-- Data for Name: wishlist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlist (id, user_id, product_id, created_at) FROM stdin;
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.withdrawals (id, affiliate_id, amount, method, account_number, status, admin_notes, created_at, updated_at) FROM stdin;
bb97cdef-7238-41b0-8c37-f25ca28726e7	3e569b15-505a-484d-8633-cef9c7bbcda5	200.00	bkash	01843180008	approved	fdssdkf	2026-04-11 11:13:56.268591+00	2026-04-11 11:13:56.268591+00
\.


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: affiliate_campaigns affiliate_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_campaigns
    ADD CONSTRAINT affiliate_campaigns_pkey PRIMARY KEY (id);


--
-- Name: affiliate_clicks affiliate_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_clicks
    ADD CONSTRAINT affiliate_clicks_pkey PRIMARY KEY (id);


--
-- Name: affiliate_page_content affiliate_page_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_page_content
    ADD CONSTRAINT affiliate_page_content_pkey PRIMARY KEY (id);


--
-- Name: affiliate_page_content affiliate_page_content_section_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_page_content
    ADD CONSTRAINT affiliate_page_content_section_key_unique UNIQUE (section, key);


--
-- Name: affiliate_testimonials affiliate_testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_testimonials
    ADD CONSTRAINT affiliate_testimonials_pkey PRIMARY KEY (id);


--
-- Name: affiliate_video_campaigns affiliate_video_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_video_campaigns
    ADD CONSTRAINT affiliate_video_campaigns_pkey PRIMARY KEY (id);


--
-- Name: affiliates affiliates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_pkey PRIMARY KEY (id);


--
-- Name: affiliates affiliates_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_referral_code_key UNIQUE (referral_code);


--
-- Name: affiliates affiliates_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_user_id_key UNIQUE (user_id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: commission_rules commission_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT commission_rules_pkey PRIMARY KEY (id);


--
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: faq_items faq_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faq_items
    ADD CONSTRAINT faq_items_pkey PRIMARY KEY (id);


--
-- Name: hero_banners hero_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hero_banners
    ADD CONSTRAINT hero_banners_pkey PRIMARY KEY (id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- Name: marketing_expenses marketing_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketing_expenses
    ADD CONSTRAINT marketing_expenses_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_activity_log product_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_activity_log
    ADD CONSTRAINT product_activity_log_pkey PRIMARY KEY (id);


--
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: system_notifications system_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_notifications
    ADD CONSTRAINT system_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_login_logs user_login_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_login_logs
    ADD CONSTRAINT user_login_logs_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wishlist wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);


--
-- Name: wishlist wishlist_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: idx_affiliates_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_affiliates_status ON public.affiliates USING btree (status);


--
-- Name: idx_categories_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_active ON public.categories USING btree (is_active);


--
-- Name: idx_categories_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);


--
-- Name: idx_clicks_affiliate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clicks_affiliate ON public.affiliate_clicks USING btree (affiliate_id);


--
-- Name: idx_commissions_affiliate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commissions_affiliate ON public.commissions USING btree (affiliate_id);


--
-- Name: idx_commissions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commissions_created_at ON public.commissions USING btree (created_at DESC);


--
-- Name: idx_commissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commissions_status ON public.commissions USING btree (status);


--
-- Name: idx_loyalty_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loyalty_created_at ON public.loyalty_transactions USING btree (created_at DESC);


--
-- Name: idx_loyalty_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loyalty_user ON public.loyalty_transactions USING btree (user_id);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_read ON public.system_notifications USING btree (is_read);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.system_notifications USING btree (user_id);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at DESC);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_orders_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_user_status ON public.orders USING btree (user_id, status);


--
-- Name: idx_products_active_cat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_active_cat ON public.products USING btree (category_id) WHERE (is_active = true);


--
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);


--
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at DESC);


--
-- Name: idx_products_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_is_active ON public.products USING btree (is_active);


--
-- Name: idx_products_is_affiliate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_is_affiliate ON public.products USING btree (is_affiliate);


--
-- Name: idx_products_is_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_is_featured ON public.products USING btree (is_featured);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_reviews_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_product_id ON public.product_reviews USING btree (product_id);


--
-- Name: idx_user_login_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_login_logs_created_at ON public.user_login_logs USING btree (created_at DESC);


--
-- Name: idx_user_login_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_login_logs_user_id ON public.user_login_logs USING btree (user_id);


--
-- Name: affiliate_campaigns affiliate_campaigns_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_campaigns
    ADD CONSTRAINT affiliate_campaigns_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;


--
-- Name: affiliate_clicks affiliate_clicks_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_clicks
    ADD CONSTRAINT affiliate_clicks_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;


--
-- Name: affiliates affiliates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: commission_rules commission_rules_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT commission_rules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: commission_rules commission_rules_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT commission_rules_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: commissions commissions_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;


--
-- Name: commissions commissions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: commissions commissions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: loyalty_transactions loyalty_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: loyalty_transactions loyalty_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: product_activity_log product_activity_log_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_activity_log
    ADD CONSTRAINT product_activity_log_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: product_activity_log product_activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_activity_log
    ADD CONSTRAINT product_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: product_reviews product_reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_reviews product_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: system_notifications system_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_notifications
    ADD CONSTRAINT system_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_login_logs user_login_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_login_logs
    ADD CONSTRAINT user_login_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wishlist wishlist_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: wishlist wishlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: withdrawals withdrawals_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict hI6T1XaEFWbnWgqnM604bh6me0aa0NZ95j9fgGLgSAy2egKmNoR0qQ3hghkagBy

