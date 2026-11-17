import { useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../../components/UI.jsx';
import { readPublicPage } from '../catalogue/catalogueData.js';
import PagedList from '../catalogue/PagedList.jsx';
import useDetailHead from '../catalogue/useDetailHead.js';
import usePublicDocument from '../catalogue/usePublicDocument.js';

const eventDate = new Intl.DateTimeFormat('en-UG', { dateStyle: 'long', timeZone: 'UTC' });

function EventInformation({ event }) {
  const day = event.date && new Date(`${event.date}T00:00:00Z`);
  return <div className="event-information">
    {event.city && <p className="eyebrow">{event.city}</p>}
    {day && Number.isFinite(day.getTime()) ? <p><time dateTime={event.date}>{eventDate.format(day)}</time></p>
      : event.season === 'upcoming' && <p>Date to be announced</p>}
    {event.venue ? <p>{event.venue}</p> : event.season === 'upcoming' && <p>Venue to be announced</p>}
    {event.illustrative && <p className="placeholder-label">Illustrative event</p>}
  </div>;
}

function EventPhoto() {
  return <figure className="event-photo">
    <img src="/assets/campaign-960.webp" alt="AI-generated campaign image of reworked workwear" width="1536" height="1024" />
    <figcaption className="placeholder-label">AI-generated campaign placeholder</figcaption>
  </figure>;
}

export function EventsPage() {
  const [search] = useSearchParams();
  const season = search.get('view') === 'past' ? 'past' : 'upcoming';
  const read = useCallback(cursor => readPublicPage('events', sdk => [sdk.where('season', '==', season)], cursor), [season]);
  return <section className="container page-section catalogue-page stack">
    <h1>Events</h1>
    <p className="editorial">Fashion events by Night in Kampala.</p>
    <nav className="event-tabs" aria-label="Event listings">
      <Link to="/events" aria-current={season === 'upcoming' ? 'page' : undefined}>Upcoming</Link>
      <Link to="/events?view=past" aria-current={season === 'past' ? 'page' : undefined}>Past</Link>
    </nav>
    <PagedList key={season} read={read} empty={season === 'upcoming' ? 'No upcoming events have been announced.' : 'No past events have been published yet.'}>
      {rows => <div className="editorial-list">{rows.map((event, index) => <article key={event.slug} className={index === 0 && event.illustrative ? 'event-feature' : 'stack'}>
        {index === 0 && event.illustrative && <EventPhoto />}
        <div className="stack">
          <h2><Link to={`/events/${event.slug}`}>{event.title}</Link></h2>
          <EventInformation event={event} />
          <Link className="text-link" to={`/events/${event.slug}`}>Event details</Link>
        </div>
      </article>)}</div>}
    </PagedList>
  </section>;
}

export function EventPage() {
  const { slug } = useParams();
  const state = usePublicDocument('events', slug);
  useDetailHead('events', slug, state);
  if (state.loading) return <div className="container page-section"><LoadingState>Loading event…</LoadingState></div>;
  if (state.failed) return <div className="container page-section"><ErrorState onRetry={state.retry}>Could not load this event.</ErrorState></div>;
  const event = state.document;
  if (!event) return <section className="container placeholder-page"><h1>Event unavailable</h1><Link to="/events">View events</Link></section>;
  return <article className="container page-section catalogue-page stack">
    <Link className="text-link" to={event.season === 'past' ? '/events?view=past' : '/events'}>All events</Link>
    <div className={event.illustrative ? 'event-feature' : 'stack'}>
      {event.illustrative && <EventPhoto />}
      <div className="stack">
        <h1>{event.title}</h1>
        <EventInformation event={event} />
        {event.body && <p className="editorial-body">{event.body}</p>}
      </div>
    </div>
  </article>;
}
