import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Headphones, RotateCcw, ShieldCheck, Store, Truck, type LucideIcon } from 'lucide-react';

import { customerEnvelope, customerRequest } from '../../pages/shop/storeApi';
import { money } from '../../pages/shop/storeFormat';
import { useDepartments, type Department } from '../StoreLayout';
import type { Banner, Product } from '../types';
import { CardSkeletons, Img, ProductCard, useLoad } from '../ui';
import { StoreCard, type StoreSummary } from './Discover';

const off = (p: Product) => (Number(p.min_mrp) > Number(p.min_price) ? Math.round((1 - Number(p.min_price) / Number(p.min_mrp)) * 100) : 0);
const sized = (url: string | undefined, w: number) => url?.replace(/([?&])w=\d+/, `$1w=${w}`);
const bannerHref = (b: Banner) => (b.target_type === 'category' ? `/shop?category=${b.target_value}` : b.target_type === 'product' ? `/product/${b.target_value}` : '/shop');

interface Slide { id: string; title: string; href: string; image?: string; tone?: string }
/** Fallback slides when no CMS banners exist yet. */
const FALLBACK: Slide[] = [
  { id: 'f1', title: 'Big savings on mobiles & electronics', href: '/shop?category=mobiles', tone: 'blue' },
  { id: 'f2', title: 'Fashion for every occasion', href: '/shop?category=womens-fashion', tone: 'pink' },
  { id: 'f3', title: 'Everything for your home & kitchen', href: '/shop?category=kitchen', tone: 'teal' },
];

function Carousel({ banners }: { banners: Banner[] }) {
  const slides: Slide[] = banners.length ? banners.map((b) => ({ id: b.id, title: b.title, href: bannerHref(b), image: b.image_url })) : FALLBACK;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (n: number) => setI((n + slides.length) % slides.length);
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % slides.length), 4800);
    return () => window.clearInterval(t);
  }, [paused, slides.length]);
  return (
    <section className="fk-hero" aria-roledescription="carousel" aria-label="Featured offers" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="fk-slides" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, k) => (
          <Link key={s.id} to={s.href} className={`fk-slide${s.tone ? ` tone-${s.tone}` : ''}`} aria-hidden={k !== i} tabIndex={k === i ? 0 : -1}>
            {s.image && <img src={sized(s.image, 1600)} alt="" loading={k === 0 ? 'eager' : 'lazy'} />}
            <span className="fk-slide-copy"><b>{s.title}</b><span>Shop now <ArrowRight size={16} /></span></span>
          </Link>
        ))}
      </div>
      {slides.length > 1 && <>
        <button className="fk-arrow prev" aria-label="Previous offer" onClick={() => go(i - 1)}><ChevronLeft size={26} /></button>
        <button className="fk-arrow next" aria-label="Next offer" onClick={() => go(i + 1)}><ChevronRight size={26} /></button>
        <div className="fk-dots" role="tablist" aria-label="Choose offer">{slides.map((s, k) => <button key={s.id} role="tab" aria-selected={k === i} aria-label={`Offer ${k + 1}`} onClick={() => setI(k)} />)}</div>
      </>}
    </section>
  );
}

/** A white section card with a title, "View all" and a horizontally scrolling product row. */
function Row({ title, sub, to, products, loading }: { title: string; sub?: string; to: string; products: Product[]; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });
  return (
    <section className="fk-section">
      <header className="fk-section-head">
        <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
        <Link to={to} className="fk-viewall">VIEW ALL</Link>
      </header>
      <div className="fk-rowwrap">
        <button className="fk-rowarrow prev" aria-label="Scroll back" onClick={() => scroll(-1)}><ArrowLeft size={20} /></button>
        <div className="fk-row" ref={ref}>{loading ? <CardSkeletons count={6} /> : products.map((p, k) => <ProductCard key={p.id} product={p} index={k % 6} />)}</div>
        <button className="fk-rowarrow next" aria-label="Scroll forward" onClick={() => scroll(1)}><ArrowRight size={20} /></button>
      </div>
    </section>
  );
}

function DeptRow({ dept }: { dept: Department }) {
  const rows = useLoad(() => customerRequest<Product[]>(`/products?category=${dept.slug}&limit=12&sort=popularity`), [dept.slug]);
  return <Row title={`Best of ${dept.label}`} sub={dept.blurb} to={dept.slug === 'grocery' ? '/grocery' : `/shop?category=${dept.slug}`} products={rows.data ?? []} loading={rows.loading} />;
}

/** Four-up image card for one department (the "Top picks" tiles). */
function QuadCard({ dept }: { dept: Department }) {
  const rows = useLoad(() => customerRequest<Product[]>(`/products?category=${dept.slug}&limit=4&sort=popularity`), [dept.slug]);
  const items = (rows.data ?? []).filter((p) => p.image?.url).slice(0, 4);
  return (
    <section className="fk-quad">
      <h3>{dept.label}</h3>
      <div className="fk-quad-grid">
        {rows.loading ? Array.from({ length: 4 }, (_, k) => <div key={k} className="ms-skel" />)
          : items.map((p) => (
            <Link key={p.id} to={`/product/${p.slug}`}>
              <span><Img src={sized(p.image?.url, 320)} alt={p.title} sizes="140px" /></span>
              <small>{p.title}</small>
              <b>{off(p) > 0 ? `${off(p)}% off` : money(Number(p.min_price))}</b>
            </Link>
          ))}
      </div>
      <Link className="fk-quad-more" to={dept.slug === 'grocery' ? '/grocery' : `/shop?category=${dept.slug}`}>See all</Link>
    </section>
  );
}

const ASSURE: [LucideIcon, string, string][] = [
  [Truck, 'Fast delivery', 'Free above ₹499'],
  [ShieldCheck, 'Secure checkout', 'Cash on delivery available'],
  [RotateCcw, 'Easy returns', 'Within each item’s window'],
  [BadgeCheck, 'Verified sellers', 'Every store is reviewed'],
  [Headphones, 'Support', 'We’re here to help'],
];

export function Home() {
  const depts = useDepartments();
  const stocked = depts.filter((d) => d.count > 0);
  const bySlug = (slug: string) => stocked.find((d) => d.slug === slug);

  const meta = useLoad(async () => {
    const [banners, catalog, stores] = await Promise.all([
      customerRequest<Banner[]>('/cms/banners?placement=home_hero').catch(() => [] as Banner[]),
      customerEnvelope<Product[]>('/products?limit=100&sort=popularity'),
      customerEnvelope<StoreSummary[]>('/stores?limit=4&sort=popular'),
    ]);
    return { banners, all: catalog.data, stores: stores.data };
  }, []);
  const deals = [...(meta.data?.all ?? [])].filter((p) => off(p) >= 20).sort((a, b) => off(b) - off(a)).slice(0, 12);
  const quads = ['mobiles', 'shoes', 'watches', 'kitchen'].map(bySlug).filter((d): d is Department => Boolean(d));
  const rowDepts = ['electronics', 'womens-fashion', 'mens-fashion', 'beauty', 'grocery'].map(bySlug).filter((d): d is Department => Boolean(d));

  return (
    <div className="fk-home">
      <div className="ms-wrap fk-wrap">
        <Carousel banners={meta.data?.banners ?? []} />

        <Row title="Deals of the Day" sub="Biggest discounts right now" to="/shop?sort=price_asc" products={deals} loading={meta.loading} />

        {quads.length > 0 && <div className="fk-quads">{quads.map((d) => <QuadCard key={d.id} dept={d} />)}</div>}

        {rowDepts.slice(0, 2).map((d) => <DeptRow key={d.id} dept={d} />)}

        <section className="fk-section fk-banner" aria-label="Sell on Vastmall">
          <Store size={34} />
          <div><h2>Sell on Vastmall</h2><p>List your products and reach customers across the country. Quick approval, simple payouts.</p></div>
          <Link to="/sell" className="fk-viewall solid">Become a Seller</Link>
        </section>

        {rowDepts.slice(2).map((d) => <DeptRow key={d.id} dept={d} />)}

        <section className="fk-section">
          <header className="fk-section-head"><div><h2>Top stores</h2><p>Shop directly from verified sellers</p></div><Link to="/stores" className="fk-viewall">VIEW ALL</Link></header>
          <div className="ss-store-grid fk-stores">
            {meta.loading ? Array.from({ length: 4 }, (_, k) => <div key={k} className="ms-skel" style={{ height: 230 }} />) : (meta.data?.stores ?? []).map((s) => <StoreCard key={s.id} store={s} />)}
          </div>
        </section>

        <section className="fk-assure" aria-label="Why Vastmall">
          {ASSURE.map(([Icon, t, s]) => <div key={t}><Icon size={26} /><b>{t}</b><small>{s}</small></div>)}
        </section>
      </div>
    </div>
  );
}
