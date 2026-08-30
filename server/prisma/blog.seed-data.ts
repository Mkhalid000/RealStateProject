/**
 * Editorial seed data for the blog module.
 *
 * Kept out of seed.ts so the article bodies (markdown) don't drown the rest of
 * the file. Posts reference categories and properties by slug; the seeder
 * resolves those to ids.
 */

export const BLOG_CATEGORIES = [
  {
    slug: 'buying-guides',
    name: 'Buying Guides',
    description: 'Step-by-step help for first-time and repeat buyers.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    position: 1,
  },
  {
    slug: 'market-insights',
    name: 'Market Insights',
    description: 'Prices, demand and what the numbers actually mean.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    position: 2,
  },
  {
    slug: 'interiors-design',
    name: 'Interiors & Design',
    description: 'Making a home feel like one, square foot by square foot.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1600566753376-12c8ab8b9753?auto=format&fit=crop&w=1200&q=80',
    position: 3,
  },
  {
    slug: 'legal-finance',
    name: 'Legal & Finance',
    description: 'Loans, paperwork, taxes and the fine print.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
    position: 4,
  },
  {
    slug: 'investment',
    name: 'Investment',
    description: 'Yield, appreciation and holding costs, without the hype.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80',
    position: 5,
  },
];

type SeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  tags: string[];
  city?: string;
  state?: string;
  propertyTypes?: string[];
  featured?: boolean;
  pinned?: boolean;
  isPromoted?: boolean;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  sponsorUrl?: string;
  sponsorDisclosure?: string;
  adsEnabled?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Property slugs shown as "properties in this story". */
  properties?: string[];
  /** Days ago it went live. */
  daysAgo: number;
  views: number;
  likes: number;
};

export const BLOG_POSTS: SeedPost[] = [
  {
    slug: 'best-localities-to-buy-a-home-in-bhopal',
    title: 'Where to buy in Bhopal in 2026: seven localities, honestly compared',
    excerpt:
      'Shymala Hills for the view, Kolar for the price, Katara Hills for the wait — a plain-spoken look at what each Bhopal address actually gets you.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    category: 'buying-guides',
    tags: ['Bhopal', 'Localities', 'First-time buyers'],
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    propertyTypes: ['apartment', 'villa', 'plot'],
    featured: true,
    pinned: true,
    ctaLabel: 'Browse homes in Bhopal',
    ctaUrl: '/properties?city=Bhopal',
    metaTitle: 'Best localities to buy a home in Bhopal (2026 guide)',
    metaDescription:
      'A locality-by-locality comparison of Bhopal — prices, commute, water, schools and resale — for buyers deciding where to put their money in 2026.',
    properties: [
      'lake-facing-3bhk-shymala-hills-bhopal',
      'contemporary-4bhk-villa-kerwa-dam-road-bhopal',
      'gated-residential-plot-katara-hills-bhopal',
    ],
    daysAgo: 3,
    views: 1840,
    likes: 96,
    content: `Bhopal rewards patience. It is one of the few state capitals where a lake view is still within reach of a salaried buyer, and where a thirty-minute commute counts as long. But the gap between its best and worst addresses is widening, and the marketing brochures are no help at all.

Here is how the seven localities buyers ask about most actually compare.

## Shymala Hills — the view you pay for

Nothing else in the city looks like it. Shymala Hills sits above the Upper Lake, and the homes on its western edge get an uninterrupted water view that simply cannot be built again — the land is finished. Expect a premium of thirty to forty per cent over an equivalent flat two kilometres away.

What you are really buying is scarcity. Resale here is slow but almost never a loss, and rental demand from senior government officers and doctors is steady year-round.

## Arera Colony — the safe default

The E and F sectors remain the city's most liquid market. Wide roads, mature trees, established schools and a shopping street you can walk to. Prices have moved sideways for two years, which frustrates sellers and suits buyers.

If you want a home you can resell in a month rather than a season, this is the answer.

## Kolar Road — the value play

Kolar has absorbed more new supply than any other corridor, and it shows in the price. You get meaningfully more square footage per rupee, at the cost of a longer drive to the centre and water supply that still depends on tankers in parts of the belt.

Ask two questions before you sign: which water line serves the building, and how the society funds its backup.

## Kerwa Dam Road — for people who want land

The villa and farmhouse belt. Plot sizes are generous, the forest edge is genuinely quiet, and construction quality varies enormously between builders. This is the one corridor where hiring your own structural consultant is worth the fee.

## MP Nagar — commercial first

Zone I and II are the city's business address, not a residential one. Buy here for an office, a clinic or a retail floor; the rental yield on a well-placed commercial floor comfortably beats residential across the city.

## Katara Hills — the patience trade

Prices are low because delivery is uneven and the social infrastructure is still arriving. Buyers who came in early are up; buyers who came in expecting a two-year exit are not. Treat it as a five-year hold or skip it.

## Bawadiya Kalan — the quiet compromise

Between Shahpura's convenience and Kolar's prices sits Bawadiya Kalan, which does neither spectacularly and both adequately. Good for families who want a duplex, a school run under fifteen minutes and a budget that stops short of Arera.

## The one thing that decides it

Ignore the locality argument for a moment and answer this instead: how long will you hold it? Under three years, buy liquidity — Arera or Shahpura. Over seven, buy scarcity — the lake, or land. Everything in between is a compromise you should make with your eyes open.`,
  },
  {
    slug: 'rent-or-buy-2026-five-numbers',
    title: 'Rent or buy in 2026? Run these five numbers first',
    excerpt:
      'The rent-versus-buy argument is usually decided by feelings. Here is the arithmetic that should decide it instead — with the numbers most buyers forget.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80',
    category: 'legal-finance',
    tags: ['Home loan', 'Rent vs buy', 'Personal finance'],
    featured: true,
    ctaLabel: 'Talk to an advisor',
    ctaUrl: '/contact',
    daysAgo: 8,
    views: 2450,
    likes: 131,
    content: `Everyone you know has an opinion about renting. Almost none of them have run the numbers for your situation, in your city, at today's rates.

Five figures decide it. Write them down before you fall in love with a flat.

## 1. The price-to-rent ratio

Take the purchase price and divide it by twelve months of rent for a comparable home in the same building or street. Under 20 and buying usually wins. Over 30 and renting the same home is cheaper for years, even after tax benefits.

This one ratio settles more arguments than any amount of debate.

## 2. The real cost of the loan

Not the EMI — the interest paid in the years you actually intend to stay. A twenty-year loan front-loads interest so heavily that selling in year four means you have paid rent to a bank instead of a landlord, plus stamp duty on top.

## 3. Transaction costs, both ways

Stamp duty, registration, brokerage, and the furnishing you will inevitably do. Then the cost of getting out: brokerage again, capital gains if you are early, and the months the flat sits empty while it sells.

Assume eight to twelve per cent round-trip. If your holding period cannot absorb that, rent.

## 4. Maintenance and the sinking fund

Owners underestimate this consistently. Society charges, repairs, a new water pump, painting every five years. One per cent of the property's value per year is a realistic reserve, and it is money renting does not ask of you.

## 5. What the difference earns elsewhere

If buying costs more per month than renting, the gap has an opportunity cost. Compare honestly against what that surplus would earn invested — not against the fantasy that you would have spent it anyway.

## When buying wins regardless

The arithmetic assumes you are rational and mobile. Two situations override it: you need certainty for a child's schooling, or you have found something scarce enough that it will not come back to the market. Both are legitimate reasons to pay a premium — just do it knowing the premium is what you are paying.`,
  },
  {
    slug: 'what-one-crore-buys-in-five-cities',
    title: 'What ₹1 crore buys you in five Indian cities',
    excerpt:
      'The same budget, five markets: a studio in south Mumbai, a family duplex in Bhopal. A visual guide to what your money is really worth on a map.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
    category: 'market-insights',
    tags: ['Market data', 'Mumbai', 'Bhopal', 'Bangalore'],
    featured: true,
    daysAgo: 14,
    views: 3910,
    likes: 208,
    properties: [
      'sea-facing-3bhk-marine-drive-mumbai',
      'modern-3bhk-apartment-whitefield-bangalore',
      'garden-duplex-3bhk-bawadiya-kalan-bhopal',
    ],
    content: `A crore is the number Indian buyers anchor to. It is also the number that means the least, because it buys five entirely different lives depending on the pin code.

## Mumbai: 420 sq ft, if you are lucky

In the island city, a crore is a compact one-bedroom in an ageing building, or a studio in a newer tower an hour from the centre. The trade is brutal and well understood: you are buying access, not space.

What surprises out-of-town buyers is the maintenance. Society charges on an old south Mumbai building can run higher than a full EMI in a smaller city.

## Bangalore: 1,400 sq ft with a clubhouse

The same money in Whitefield or Sarjapur buys a genuine three-bedroom apartment with amenities, in a project delivered this decade. The catch is the commute, and the fact that your building's value is tied to one industry's hiring cycle.

## Hyderabad: 1,800 sq ft and a better road

Hyderabad has done the boring thing well — infrastructure ahead of demand. A crore stretches to a large three-bedroom in the western corridor, and the road you drive to work on was probably built after your building.

## Pune: 1,300 sq ft and a shorter drive

Pune sits in the middle of every column in this comparison, which is precisely why it keeps attracting buyers who are done with Mumbai prices but want to stay in Maharashtra.

## Bhopal: a duplex, a garden, and change left over

Here the arithmetic changes character. A crore in Bhopal is not a compromise — it is a three-bedroom duplex with a garden in Bawadiya Kalan, or a lake-facing apartment with a view that costs eight times as much in Mumbai.

## Reading the table honestly

Square footage is the easiest thing to compare and the least important. The real questions are what your money does to your commute, how quickly you could sell, and whether the city's economy is broad enough to survive one industry having a bad year.

On the last two, the smaller cities are catching up faster than the price gap suggests.`,
  },
  {
    slug: 'seven-details-that-make-a-small-flat-feel-large',
    title: 'Seven details that make a small flat feel twice its size',
    excerpt:
      'None of these need a builder, a permit or a big budget. They need you to stop doing the four things that shrink a room.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=80',
    category: 'interiors-design',
    tags: ['Interiors', 'Small homes', 'Renovation'],
    daysAgo: 21,
    views: 1620,
    likes: 88,
    content: `Space is a feeling before it is a measurement. Two flats with identical carpet area can read completely differently, and the difference is rarely the floor plan.

## 1. Lift the curtains, widen the rod

Mount the rod close to the ceiling and extend it well past the window frame. The eye reads the whole height as window. It is the cheapest ten per cent of perceived space you will ever buy.

## 2. Fewer, larger pieces

Three small chairs make a room look cluttered; one generous sofa makes it look composed. Small furniture does not make a small room bigger — it makes it look like it could only fit small furniture.

## 3. Let the floor show

Leg room under furniture matters. A sofa on visible legs, a bed with clearance beneath it, a console that floats — continuous floor tells the eye the room keeps going.

## 4. One material, repeated

Changing the flooring between rooms chops a flat into fragments. Carrying the same floor through the living, dining and passage does more for a compact home than any wall you could knock down.

## 5. Light at three heights

Ceiling light alone flattens a room. Add something at eye level and something low — a lamp, a wall sconce — and the room gains depth after dark, which is when you actually live in it.

## 6. Mirrors that reflect something worth seeing

A mirror facing a blank wall doubles a blank wall. Place it to catch a window, a plant or the depth of the passage.

## 7. Storage that goes up, not out

The last half metre before the ceiling is dead space in most Indian homes. Tall, shallow cabinets beat deep, low ones — you lose fifteen centimetres of floor and gain a cupboard.

## What to stop doing

Dark grout on light tiles, a rug too small for the seating, ceiling coving that drops the height, and a feature wall in a room that has no other feature. Each one costs money and takes space away.`,
  },
  {
    slug: 'home-loan-checklist-documents-eligibility-fine-print',
    title: 'The home-loan checklist: documents, eligibility and the fine print',
    excerpt:
      'Everything a lender will ask for, in the order they will ask — plus the four clauses in a sanction letter that decide what your loan really costs.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1600&q=80',
    category: 'legal-finance',
    tags: ['Home loan', 'Documents', 'Sponsored'],
    isSponsored: true,
    sponsorName: 'Aurevia Home Finance',
    sponsorUrl: 'https://example.com/aurevia-finance',
    sponsorLogoUrl:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=200&q=60',
    sponsorDisclosure:
      'Produced in partnership with Aurevia Home Finance. Editorial control remained with Aurevia Estates.',
    adsEnabled: false,
    ctaLabel: 'Check your eligibility',
    ctaUrl: '/contact',
    daysAgo: 11,
    views: 2130,
    likes: 74,
    content: `A home loan is refused far more often for paperwork than for income. Get the file right and the rest is arithmetic.

## What every lender asks for

Identity and address proof, three years of income tax returns if you are self-employed or three months of salary slips if you are not, six months of bank statements for every account you operate, and the complete chain of title for the property.

Keep them as one PDF per category. Files that arrive organised get processed first — this is not a rule anywhere, but it is true everywhere.

## What decides your eligibility

Two ratios. Your fixed obligations to income — most lenders stop around fifty per cent including the new EMI — and the loan to the property's *valuation*, not its price. When those two disagree, the valuation wins and you make up the difference in cash.

## The four clauses that matter

**Reset frequency.** A floating rate that resets quarterly behaves very differently from one that resets annually when rates move.

**Prepayment terms.** Floating-rate loans to individuals cannot carry a prepayment penalty; fixed-rate ones can, and often do.

**The spread.** Your rate is a benchmark plus a spread. The benchmark moves for everyone; the spread is yours for the life of the loan, so negotiate it before you sign, not after.

**Insurance bundling.** A policy sold alongside the loan is rarely the cheapest one available, and is almost never mandatory in the form presented.

## Before you accept the sanction

Read the sanction letter against the term sheet you were shown. Compare the processing fee, the legal and valuation charges, and the disbursement schedule for an under-construction property. Ask for the amortisation table for year one — it is the fastest way to see what you are actually paying.

## A note on timing

Applying for a loan while you have three other applications open lowers your score at the exact moment you need it highest. Pick two lenders, not six.`,
  },
  {
    slug: 'lake-facing-property-bhopal-moment',
    title: 'Why lake-facing property in Bhopal is having a moment',
    excerpt:
      'Limited land, a protected shoreline and buyers arriving from three bigger cities — the case behind Bhopal\'s fastest-appreciating micro-market.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80',
    category: 'investment',
    tags: ['Bhopal', 'Investment', 'Lakefront'],
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    propertyTypes: ['apartment', 'villa'],
    isPromoted: true,
    ctaLabel: 'See lake-facing homes',
    ctaUrl: '/properties?city=Bhopal&q=lake',
    properties: [
      'lake-facing-3bhk-shymala-hills-bhopal',
      'contemporary-4bhk-villa-kerwa-dam-road-bhopal',
    ],
    daysAgo: 5,
    views: 1290,
    likes: 63,
    content: `The Upper Lake is not getting any bigger, and the ring of land that can see it was fully mapped decades ago. That single sentence explains most of what has happened to prices on Bhopal's western shoulder over the past three years.

## Supply that cannot respond

In every other corridor of the city, a price rise brings new supply within eighteen months. Around the lake it cannot: the catchment is protected, heights are restricted, and the plots that exist were subdivided long ago. Demand arrives, and the only thing that can move is price.

## Who is buying

Three groups, in roughly equal measure. Returning professionals from Delhi, Mumbai and Bangalore buying a second home their salary can no longer justify in those cities. Local business families upgrading. And, increasingly, buyers in their thirties who have decided a shorter commute is worth more than a bigger flat.

## What the yield looks like

Rental yield is unremarkable — two and a half to three per cent, in line with the rest of the city. This is an appreciation market, not an income one, and anyone selling it to you as both is selling.

## The risks worth naming

Environmental clearance rules around the catchment can change, and have. Older buildings on the shoulder were built to different standards, so a structural survey is not optional. And liquidity cuts both ways: scarcity holds prices up, but it also means the buyer pool is small when you want out in a hurry.

## How to enter sensibly

Buy the view, not the address — a flat two rows back at a thirty per cent discount will not appreciate the same way. Check the building's water and drainage independently. And treat this as a seven-year position; the people who did well here were not in a hurry.`,
  },
];
