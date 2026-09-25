import Link from "next/link";
import { getBooks, totalChapters } from "@/lib/bible";
import { chapterPath, defaultEdition, ROUTES, t, type Lang } from "@/lib/i18n";
import { dailyVerses, HERO_SLIDES, resolveVerse } from "@/lib/home";
import { ContinueCard, DailyVerse, LanguageRedirect } from "@/components/HomeProgress";
import { ArrowRightIcon, BookIcon, LeafIcon, LibraryIcon, LockIcon, MapIcon, OfflineIcon, SearchIcon, SparkIcon, TimelineIcon } from "@/components/Icons";

export default function HomeView({ lang }: { lang: Lang }) {
  const text = t(lang);
  const routes = ROUTES[lang];
  const edition = defaultEdition(lang);
  const books = getBooks(edition);
  const titles = Object.fromEntries(books.map((book) => [book.id, book.title]));
  const chapterCounts = Object.fromEntries(books.map((book) => [book.id, book.chapters.length]));
  const total = totalChapters(edition);

  const features = [
    { href: routes.library, icon: <LibraryIcon />, title: text.library, body: text.featureLibrary },
    { href: routes.timeline, icon: <TimelineIcon />, title: text.timeline, body: text.featureTimeline },
    { href: `${routes.studies}eden/`, icon: <MapIcon />, title: text.contextStudies, body: text.featureStudies },
    { href: routes.search, icon: <SearchIcon />, title: text.searchBible, body: text.featureSearch },
  ];
  const promises = [
    { icon: <LockIcon />, title: text.promisePrivacy, body: text.promisePrivacyBody },
    { icon: <OfflineIcon />, title: text.promiseOffline, body: text.promiseOfflineBody },
    { icon: <LeafIcon />, title: text.promiseFree, body: text.promiseFreeBody },
  ];

  return (
    <>
      {lang === "es" && <LanguageRedirect />}

      {/* Hero: tres fotos que se funden despacio; cada una con su lugar y un pasaje que se puede abrir. */}
      {/* Diseño partido: el texto en su columna y las fotos en un marco propio, sin velo encima. */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">{text.studyDesk}</p>
            <h1 id="hero-title" className="display">{text.heroTitle}</h1>
            <p className="lead">{text.heroIntro}</p>
            <div className="button-row">
              <Link className="button button-primary button-lg" href={chapterPath(edition, "genesis", 1)}>
                <BookIcon size={20} /> {text.startReading}
              </Link>
              <Link className="button button-ghost button-lg" href={routes.search}>
                <SearchIcon size={20} /> {text.searchBible}
              </Link>
            </div>
            <p className="hero-stats">
              {books.length} {text.books} · {total.toLocaleString(lang)} {text.chapters} · {text.heroEditions}
            </p>
          </div>
          <div className="hero-frame">
            <div className="hero-media" aria-hidden="true">
              {HERO_SLIDES.map((slide, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={slide.image}
                  className="hero-slide"
                  src={slide.image}
                  srcSet={`${slide.image.replace(".webp", "-960.webp")} 960w, ${slide.image} 1920w`}
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  alt=""
                  width={1920}
                  height={1080}
                  decoding="async"
                  fetchPriority={index === 0 ? "high" : "low"}
                />
              ))}
            </div>
            <ul className="hero-captions" aria-label={text.heroCaptions}>
              {HERO_SLIDES.map((slide) => {
                const verse = resolveVerse(edition, slide.ref);
                return (
                  <li key={slide.image} className="hero-caption">
                    <Link href={verse?.href ?? routes.library}>
                      <span className="hero-caption-place">{slide.place[lang]}</span>
                      <span className="hero-caption-ref">{verse?.reference}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <div className="container home-cards">
        <ContinueCard lang={lang} titles={titles} chapterCounts={chapterCounts} total={total} />
        <DailyVerse lang={lang} verses={dailyVerses(edition)} />
      </div>

      <section className="container section" aria-labelledby="explore-title">
        <div className="section-heading">
          <p className="eyebrow"><SparkIcon size={16} /> {text.exploreEyebrow}</p>
          <h2 id="explore-title" className="h2">{text.exploreTitle}</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href} className="card feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <span className="feature-title">{feature.title}</span>
              <span className="feature-body">{feature.body}</span>
              <span className="feature-arrow"><ArrowRightIcon size={18} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section promises" aria-label={text.promisesLabel}>
        {promises.map((item) => (
          <div key={item.title} className="promise">
            <span className="promise-icon">{item.icon}</span>
            <div>
              <p className="promise-title">{item.title}</p>
              <p className="muted small">{item.body}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
