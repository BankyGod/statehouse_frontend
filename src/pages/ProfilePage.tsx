import {
  Children,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Building2,
  FileBadge,
  GraduationCap,
  HeartPulse,
  Home,
  IdCard,
  MapPin,
  Plane,
  Scale,
  Skull,
  Zap,
} from 'lucide-react';
import {
  businessesApi,
  charactersApi,
  educationApi,
  housingApi,
  jobsApi,
  permitsApi,
  statesApi,
} from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useJobListing } from '../hooks/useJobDetails';
import { usePoliticalRoles } from '../hooks/usePoliticalRoles';
import { canResetHome, money, num } from '../lib/format';
import { certCssVars, institutionTheme } from '../lib/institutionTheme';
import { ConfirmModal } from '../components/ConfirmModal';
import { StateCard } from '../components/StateCard';
import { CardCarousel } from '../components/CardCarousel';
import { Timer } from '../components/Timer';
import type { Enrollment, Permit, PermitType } from '../types/api';

export function ProfilePage() {
  const { character, user, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const { isPresident, isMp, mpSeat } = usePoliticalRoles();
  const [newHome, setNewHome] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });
  const eduQ = useQuery({
    queryKey: ['education', 'me'],
    queryFn: () => educationApi.me(),
    refetchInterval: 30_000,
  });
  const permitsQ = useQuery({
    queryKey: ['permits', 'me'],
    queryFn: () => permitsApi.me(),
  });
  const housingQ = useQuery({
    queryKey: ['housing', 'me'],
    queryFn: () => housingApi.me(),
  });
  const jobQ = useQuery({
    queryKey: ['jobs', 'me'],
    queryFn: () => jobsApi.me(),
  });
  const { listing: jobListing } = useJobListing(jobQ.data);
  const bizQ = useQuery({
    queryKey: ['businesses', 'me'],
    queryFn: () => businessesApi.me(),
  });

  const resetMut = useMutation({
    mutationFn: (id: number) => charactersApi.resetHome(id),
    onSuccess: async () => {
      toast.push('Home state reset.', 'ok');
      setConfirm(false);
      setNewHome(null);
      await qc.invalidateQueries();
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const stateName = useMemo(() => {
    const map = new Map(statesQ.data?.map((s) => [s.id, s]) ?? []);
    return (id: number | null | undefined) => {
      if (id == null) return '—';
      const s = map.get(id);
      return s?.name ?? `State #${id}`;
    };
  }, [statesQ.data]);

  if (!character) return null;

  const eligible = canResetHome(character.home_state_chosen_at, character.home_state_locked);
  const home = statesQ.data?.find((s) => s.id === character.home_state_id);
  const current = statesQ.data?.find((s) => s.id === character.current_state_id);
  const initials = initialsOf(character.display_name);
  const idNo = formatId(character.id);
  const mrz = buildMrz(character.display_name, character.id, home?.name ?? 'UA');
  const completedEdu =
    eduQ.data?.filter((e) => e.status === 'completed' || e.completed_at) ?? [];
  const activeEdu =
    eduQ.data?.filter(
      (e) =>
        e.status === 'enrolled' ||
        e.status === 'in_progress' ||
        e.status === 'active',
    ) ?? [];
  const academicCerts = [
    ...completedEdu.map((e) => ({ e, provisional: false })),
    ...activeEdu.map((e) => ({ e, provisional: true })),
  ];
  const activePermits =
    permitsQ.data?.filter((p) => p.status === 'issued' || p.status === 'active') ?? [];
  const pendingPermits =
    permitsQ.data?.filter((p) => p.status === 'pending' || p.status === 'applied') ?? [];
  const residence = housingQ.data;
  const businesses = bizQ.data ?? [];
  const issued = new Date(character.home_state_chosen_at);

  return (
    <div className="profile-page">
      <header className="page-header compact">
        <h1>
          <IdCard size={22} aria-hidden /> Documents
        </h1>
        <p className="lede">Official papers issued in United Amir.</p>
      </header>

      <section className="doc-section" aria-labelledby="wallet-cards-heading">
        <header className="doc-section-head">
          <h2 id="wallet-cards-heading">Wallet cards</h2>
          <p>ID, bank, permits, and credentials you carry day to day.</p>
        </header>
        <div className="wallet-grid">
        {/* —— National ID (ISO ID-1) —— */}
        <article className="rw-card id-card">
          <div className="rw-guilloche" aria-hidden />
          <div className="rw-holo" aria-hidden />
          <div className="id-top">
            <div className="id-crest" aria-hidden>
              <span className="id-crest-ring">UA</span>
            </div>
            <div className="id-top-text">
              <p className="id-country">REPUBLIC OF UNITED AMIR</p>
              <h2>NATIONAL IDENTITY CARD</h2>
              <p className="id-micro">IDENTITY · CITIZEN · SECURITY DOCUMENT</p>
            </div>
            <div className={`id-status ${character.is_jailed ? 'bad' : 'ok'}`}>
              {character.is_jailed ? 'DETAINED' : 'VALID'}
            </div>
          </div>
          <div className="id-main">
            <div className="id-photo">
              <span className="id-photo-face">{initials}</span>
              <span className="id-photo-tag">OFFICIAL PHOTO</span>
            </div>
            <div className="id-data">
              <Field label="Surname / Given names" value={character.display_name} wide />
              <Field label="Document no." value={idNo} mono />
              <Field label="Nationality" value="United Amir" />
              <Field label="Age" value={`${num(character.age_years, 1)} years`} />
              <Field label="Sex" value="X" />
              <Field label="Home state" value={home?.name ?? String(character.home_state_id)} />
              <Field label="Place of presence" value={current?.name ?? String(character.current_state_id)} />
              <Field label="Account" value={`@${user?.username ?? '—'}`} />
              <Field label="Date of issue" value={issued.toLocaleDateString()} />
              <Field label="Reputation" value={String(character.reputation)} />
            </div>
          </div>
          <div className="id-sign-row">
            <div className="id-sign">
              <span className="id-sign-ink">{character.display_name.split(' ')[0]}</span>
              <em>Holder signature</em>
            </div>
            <div className="id-sign">
              <span className="id-sign-ink auth">Civil Registry</span>
              <em>Issuing authority</em>
            </div>
          </div>
          <div className="id-mrz" aria-hidden>
            <pre>{mrz[0]}</pre>
            <pre>{mrz[1]}</pre>
            <pre>{mrz[2]}</pre>
          </div>
        </article>

        {/* —— Bank debit (ISO ID-1) —— */}
        <article className="rw-card bank-card">
          <div className="bank-bg" aria-hidden />
          <div className="bank-top">
            <div>
              <p className="bank-bank">AMIR NATIONAL BANK</p>
              <p className="bank-product">Citizen Debit</p>
            </div>
            <div className="bank-contactless" aria-hidden title="Contactless">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="bank-chip" aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </div>
          <p className="bank-pan">{formatPan(character.id)}</p>
          <div className="bank-meta">
            <div>
              <em>VALID THRU</em>
              <strong>12/32</strong>
            </div>
            <div>
              <em>CVV</em>
              <strong>{String(100 + (character.id % 900)).padStart(3, '0')}</strong>
            </div>
            <div className="bank-net" aria-hidden>
              UA PAY
            </div>
          </div>
          <div className="bank-holder">
            <em>CARDHOLDER</em>
            <strong>{character.display_name.toUpperCase()}</strong>
          </div>
          <div className="bank-balance-strip">
            <span>Available balance</span>
            <strong>{money(character.bank_balance)}</strong>
            <span className="bank-cash">Cash {money(character.cash)}</span>
          </div>
        </article>

        <CardCarousel
          label="Permits"
          empty={
            <EmptyDoc
              title="State Permit"
              org="Licensing Office"
              note="No permits issued. Apply at the Permits desk."
              Icon={FileBadge}
            />
          }
        >
          {[
            ...activePermits.map((p) => (
              <PermitCard
                key={p.id}
                permit={p}
                holder={character.display_name}
                stateName={stateName}
              />
            )),
            ...pendingPermits.map((p) => (
              <PermitCard
                key={`pend-${p.id}`}
                permit={p}
                holder={character.display_name}
                stateName={stateName}
                pending
              />
            )),
          ]}
        </CardCarousel>

        {residence && !character.is_homeless ? (
          <article className="rw-card residence-card">
            <div className="rw-guilloche dark" aria-hidden />
            <div className="doc-banner">
              <Home size={16} aria-hidden />
              UNITED AMIR HOUSING AUTHORITY
            </div>
            <h2 className="doc-title">
              {residence.tenure === 'owned' || residence.tenure === 'owner'
                ? 'Certificate of Title'
                : 'Tenancy Agreement Card'}
            </h2>
            <div className="doc-grid">
              <Field label="Resident" value={character.display_name} wide />
              <Field label="State" value={stateName(residence.state_id)} />
              <Field label="Listing" value={`#${residence.listing_id}`} />
              <Field label="Tenure" value={residence.tenure} />
              <Field label="Weekly rent" value={money(residence.weekly_rent)} />
              <Field label="Status" value={residence.status} />
              <Field
                label="Started"
                value={new Date(residence.started_at).toLocaleDateString()}
              />
            </div>
            <div className="barcode" aria-hidden>
              {Array.from({ length: 42 }, (_, i) => (
                <i key={i} style={{ width: i % 5 === 0 ? 3 : 1 + (i % 3) }} />
              ))}
            </div>
            <p className="doc-serial mono">RES-{residence.id.toString().padStart(6, '0')}</p>
          </article>
        ) : (
          <EmptyDoc
            title="Residence"
            org="Housing Authority"
            note="No residence on file — marked homeless."
            Icon={Home}
          />
        )}

        {jobQ.data && (
          <article className="rw-card job-card">
            <div className="rw-guilloche dark" aria-hidden />
            <div className="job-badge-top">
              <div className="id-photo job-photo">
                <span className="id-photo-face">{initials}</span>
              </div>
              <div>
                <p className="bank-bank">EMPLOYER CREDENTIAL</p>
                <h2 className="doc-title tight">Work Identity Badge</h2>
                <p className="id-micro">UNITED AMIR · LABOR DIVISION</p>
              </div>
            </div>
            <div className="doc-grid">
              <Field label="Employee" value={character.display_name} wide />
              <Field
                label="Position"
                value={jobListing?.title ?? `Listing #${jobQ.data.listing_id}`}
              />
              <Field
                label="Sector"
                value={jobListing?.sector ?? `State #${jobQ.data.state_id}`}
              />
              <Field label="Shifts completed" value={String(jobQ.data.shifts_completed)} />
              <Field label="Status" value={jobQ.data.is_active ? 'ACTIVE' : 'INACTIVE'} />
            </div>
            <div className="barcode" aria-hidden>
              {Array.from({ length: 36 }, (_, i) => (
                <i key={i} style={{ width: 1 + (i % 4) }} />
              ))}
            </div>
          </article>
        )}
        </div>
      </section>

      <section className="doc-section" aria-labelledby="certificates-heading">
        <header className="doc-section-head">
          <h2 id="certificates-heading">
            <GraduationCap size={18} aria-hidden /> Certificates
          </h2>
          <p>School awards and company registrations — parchment, not wallet plastic.</p>
        </header>

        <div className="cert-gallery">
          <CertGroup label="Academic certificates">
            {academicCerts.map(({ e, provisional }) => (
              <CertificateCard
                key={provisional ? `p-${e.id}` : e.id}
                enrollment={e}
                holder={character.display_name}
                provisional={provisional}
              />
            ))}
          </CertGroup>
          <CertGroup label="Incorporation certificates">
            {businesses.map((b) => (
              <article key={b.id} className={`rw-card business-card ${b.status}`}>
                <div className="cert-ornament" aria-hidden />
                <p className="cert-org">COMPANIES REGISTRY · UNITED AMIR</p>
                <h2 className="cert-heading">Certificate of Incorporation</h2>
                <p className="cert-line">This certifies that</p>
                <p className="cert-name">{b.name}</p>
                <p className="cert-line">
                  is registered for trade in {stateName(b.state_id)} · {b.sector}
                </p>
                <div className="doc-grid soft">
                  <Field label="Address" value={b.local_address} wide />
                  <Field label="Status" value={b.status} />
                  <Field label="Treasury" value={money(b.cash_balance)} />
                </div>
                <div className="cert-signs">
                  <div>
                    <span className="id-sign-ink auth">Registrar</span>
                    <em>Companies House</em>
                  </div>
                  <div className="cert-wax" aria-hidden>
                    CR
                  </div>
                </div>
              </article>
            ))}
          </CertGroup>
          {academicCerts.length === 0 && businesses.length === 0 && (
            <EmptyDoc
              title="No certificates yet"
              org="Registry"
              note="Finish a course for an academic certificate, or register a company for incorporation papers."
              Icon={GraduationCap}
            />
          )}
        </div>
      </section>

      <header className="page-header compact profile-dossier-head">
        <h2>
          <IdCard size={18} aria-hidden /> Citizen record
        </h2>
        <p className="lede">Status, situation, and registry details outside your papers.</p>
      </header>

      <section className="tbox profile-vitals-box">
        <div className="tbox-title">
          {character.display_name}
          <span className="tbox-more">@{user?.username ?? '—'}</span>
        </div>
        <div className="tbox-body">
          <div className="profile-flag-row">
            {character.is_jailed && (
              <span className="badge warn">
                Jailed <Timer completesAt={character.jail_until} onComplete={() => void refreshCharacter()} />
              </span>
            )}
            {character.is_traveling && (
              <span className="badge pending">
                Traveling <Timer completesAt={character.travel_until} onComplete={() => void refreshCharacter()} />
              </span>
            )}
            {character.is_hospitalized && (
              <span className="badge warn">
                Hospital <Timer completesAt={character.hospital_until} onComplete={() => void refreshCharacter()} />
              </span>
            )}
            {character.is_homeless && <span className="badge warn">Homeless</span>}
            {!character.is_jailed &&
              !character.is_traveling &&
              !character.is_hospitalized &&
              !character.is_homeless && <span className="badge completed">At liberty</span>}
            {isPresident && <span className="badge">President</span>}
            {isMp && !isPresident && (
              <span className="badge">MP · {mpSeat?.state_name ?? 'Parliament'}</span>
            )}
            {character.condition && <span className="badge pending">{character.condition}</span>}
          </div>

          <div className="profile-meters">
            <div className="profile-meter tone-energy">
              <div className="profile-meter-head">
                <span>
                  <Zap size={12} aria-hidden /> Energy
                </span>
                <strong>
                  {character.energy}/{character.max_energy}
                </strong>
              </div>
              <div className="profile-meter-track">
                <div
                  className="profile-meter-fill"
                  style={{
                    width: `${pct(character.energy, character.max_energy)}%`,
                  }}
                />
              </div>
            </div>
            <div className="profile-meter tone-life">
              <div className="profile-meter-head">
                <span>
                  <HeartPulse size={12} aria-hidden /> Health
                </span>
                <strong>
                  {character.health}/{character.max_health}
                </strong>
              </div>
              <div className="profile-meter-track">
                <div
                  className="profile-meter-fill"
                  style={{
                    width: `${pct(character.health, character.max_health)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <ul className="profile-stat-strip">
            <li>
              <em>Age</em>
              <strong>{num(character.age_years, 1)} yr</strong>
            </li>
            <li>
              <em>Reputation</em>
              <strong>{character.reputation}</strong>
            </li>
            <li>
              <em>Heat</em>
              <strong className={character.heat > 0 ? 'warn-text' : undefined}>
                {Number(character.heat).toFixed(1)}
              </strong>
            </li>
            <li>
              <em>Nerve</em>
              <strong>
                {character.nerve}/{character.max_nerve}
              </strong>
            </li>
            <li>
              <em>Cash</em>
              <strong className="cash">{money(character.cash)}</strong>
            </li>
            <li>
              <em>Bank</em>
              <strong className="cash">{money(character.bank_balance)}</strong>
            </li>
          </ul>
          <ul className="profile-stat-strip" style={{ marginTop: '0.45rem' }}>
            <li>
              <em>Strength</em>
              <strong>{Number(character.strength).toFixed(1)}</strong>
            </li>
            <li>
              <em>Defense</em>
              <strong>{Number(character.defense).toFixed(1)}</strong>
            </li>
            <li>
              <em>Speed</em>
              <strong>{Number(character.speed).toFixed(1)}</strong>
            </li>
            <li>
              <em>Dexterity</em>
              <strong>{Number(character.dexterity).toFixed(1)}</strong>
            </li>
            <li>
              <em>Faction</em>
              <strong>{character.faction_id ?? '—'}</strong>
            </li>
            <li>
              <em>ID</em>
              <strong className="mono">{idNo}</strong>
            </li>
          </ul>
        </div>
      </section>

      <div className="profile-dossier-grid">
        <section className="tbox">
          <div className="tbox-title">
            <MapPin size={14} aria-hidden /> Location
          </div>
          <div className="tbox-body pad-0">
            <dl className="profile-kv">
              <div>
                <dt>Home state</dt>
                <dd>
                  {home?.slug ? (
                    <Link to={`/states/${home.slug}`}>{home.name}</Link>
                  ) : (
                    home?.name ?? `State #${character.home_state_id}`
                  )}
                  {home?.capital ? <span className="muted"> · {home.capital}</span> : null}
                </dd>
              </div>
              <div>
                <dt>Present in</dt>
                <dd>
                  {current?.slug ? (
                    <Link to={`/states/${current.slug}`}>{current.name}</Link>
                  ) : (
                    current?.name ?? `State #${character.current_state_id}`
                  )}
                  {character.is_traveling && character.travel_destination_id != null && (
                    <span className="muted">
                      {' '}
                      → {stateName(character.travel_destination_id)}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Residence</dt>
                <dd>
                  {residence && !character.is_homeless ? (
                    <>
                      Listing #{residence.listing_id} · {residence.tenure}
                      <span className="muted"> · {money(residence.weekly_rent)}/wk</span>
                    </>
                  ) : (
                    <Link to="/housing">No fixed address</Link>
                  )}
                </dd>
              </div>
              <div>
                <dt>Registry</dt>
                <dd>
                  {character.home_state_locked
                    ? 'Home locked'
                    : eligible
                      ? 'Reset window open'
                      : 'Reset window closed'}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="tbox">
          <div className="tbox-title">
            <Briefcase size={14} aria-hidden /> Situation
          </div>
          <div className="tbox-body pad-0">
            <dl className="profile-kv">
              <div>
                <dt>Employment</dt>
                <dd>
                  {jobQ.isLoading ? (
                    '…'
                  ) : jobQ.data ? (
                    <>
                      <Link to="/jobs">{jobListing?.title ?? `Job #${jobQ.data.listing_id}`}</Link>
                      <span className="muted"> · {jobQ.data.shifts_completed} shifts</span>
                      {!jobQ.data.is_active && <span className="badge warn">Inactive</span>}
                    </>
                  ) : (
                    <Link to="/jobs">Unemployed</Link>
                  )}
                </dd>
              </div>
              <div>
                <dt>Education</dt>
                <dd>
                  {activeEdu[0] ? (
                    <>
                      {activeEdu[0].title}{' '}
                      <Timer
                        completesAt={activeEdu[0].completes_at}
                        onComplete={() => {
                          void eduQ.refetch();
                          void refreshCharacter();
                        }}
                      />
                    </>
                  ) : completedEdu.length ? (
                    <>
                      {completedEdu.length} certificate{completedEdu.length === 1 ? '' : 's'}
                      <span className="muted"> · </span>
                      <Link to="/education">Study more</Link>
                    </>
                  ) : (
                    <Link to="/education">Not enrolled</Link>
                  )}
                </dd>
              </div>
              <div>
                <dt>Permits</dt>
                <dd>
                  {activePermits.length ? (
                    <>
                      {activePermits.length} active
                      {pendingPermits.length ? (
                        <span className="muted"> · {pendingPermits.length} pending</span>
                      ) : null}
                    </>
                  ) : (
                    <Link to="/permits">None on file</Link>
                  )}
                </dd>
              </div>
              <div>
                <dt>Businesses</dt>
                <dd>
                  {businesses.length ? (
                    <>
                      {businesses.length} registered
                      <span className="muted">
                        {' '}
                        · treasury{' '}
                        {money(businesses.reduce((sum, b) => sum + (b.cash_balance ?? 0), 0))}
                      </span>
                    </>
                  ) : (
                    <Link to="/business">None</Link>
                  )}
                </dd>
              </div>
              <div>
                <dt>Office</dt>
                <dd>
                  {isPresident ? (
                    <Link to="/politics">President of United Amir</Link>
                  ) : isMp ? (
                    <Link to="/politics">MP · {mpSeat?.state_name ?? 'Parliament'}</Link>
                  ) : (
                    <span className="muted">
                      Private citizen · <Link to="/politics">Politics</Link>
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <div className="profile-dossier-grid">
        <section className="tbox">
          <div className="tbox-title">Biography</div>
          <div className="tbox-body">
            {character.bio ? (
              <p className="bio">{character.bio}</p>
            ) : (
              <p className="muted">No biography on file. Your public story is blank for now.</p>
            )}
          </div>
        </section>

        <section className="tbox">
          <div className="tbox-title">
            <Skull size={14} aria-hidden /> Criminal record
          </div>
          <div className="tbox-body">
            {character.criminal_record_summary ? (
              <p className="warn-text">{character.criminal_record_summary}</p>
            ) : (
              <p className="muted">
                Clean sheet. <Link to="/crime">Crime desk</Link> stays available if you change that.
              </p>
            )}
            {character.heat > 0 && (
              <p className="warn-text" style={{ marginTop: '0.55rem' }}>
                Current heat: {character.heat}
              </p>
            )}
          </div>
        </section>
      </div>

      {(isPresident || isMp) && (
        <section className="tbox">
          <div className="tbox-title">
            <Scale size={14} aria-hidden /> Your office
          </div>
          <div className="tbox-body">
            <div className="your-office">
              {isPresident && <span className="badge">President</span>}
              {isMp && <span className="badge">MP · {mpSeat?.state_name}</span>}
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Duties live under{' '}
              <Link to="/cabinet">Cabinet</Link>, <Link to="/legislation">Legislation</Link>, and{' '}
              <Link to="/politics">Politics</Link>.
            </p>
          </div>
        </section>
      )}

      <section className="tbox">
        <div className="tbox-title">Home state reset</div>
        <div className="tbox-body">
          {!eligible && (
            <p className="muted" style={{ margin: 0 }}>
              {character.home_state_locked
                ? 'Home state is permanently locked on this character.'
                : 'One-time reset window (first 3 days after creation) has closed.'}{' '}
              Current home:{' '}
              {home?.slug ? (
                <Link to={`/states/${home.slug}`}>{home.name}</Link>
              ) : (
                home?.name ?? `State #${character.home_state_id}`
              )}
              .
            </p>
          )}
          {eligible && (
            <>
              <p className="lede">One reset only within 3 days of creation. Choose carefully.</p>
              <div className="state-grid">
                {statesQ.data
                  ?.filter((s) => s.id !== character.home_state_id)
                  .map((s) => (
                    <StateCard
                      key={s.id}
                      state={s}
                      selected={newHome === s.id}
                      onSelect={() => setNewHome(s.id)}
                    />
                  ))}
              </div>
              <button
                type="button"
                className="btn danger"
                disabled={!newHome}
                onClick={() => setConfirm(true)}
              >
                Reset home state
              </button>
            </>
          )}
        </div>
      </section>

      <ConfirmModal
        open={confirm}
        title="Reset home state?"
        confirmLabel="Reset permanently"
        danger
        busy={resetMut.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() => newHome && resetMut.mutate(newHome)}
      >
        <p>This is your only free reset. Confirm the new home state.</p>
      </ConfirmModal>
    </div>
  );
}

function pct(value: number, max: number) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

function Field({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`rw-field ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      <strong className={mono ? 'mono' : undefined}>{value}</strong>
    </div>
  );
}

function CertGroup({ label, children }: { label: string; children: ReactNode }) {
  const slides = Children.toArray(children).filter(Boolean);
  if (slides.length === 0) return null;
  if (slides.length === 1) {
    return <div className="cert-group single">{slides[0]}</div>;
  }
  return (
    <div className="cert-group multi">
      <CardCarousel label={label}>{slides}</CardCarousel>
    </div>
  );
}

function EmptyDoc({
  title,
  org,
  note,
  Icon,
}: {
  title: string;
  org: string;
  note: string;
  Icon: typeof GraduationCap;
}) {
  return (
    <article className="rw-card empty-doc">
      <div className="doc-banner muted-banner">
        <Icon size={16} aria-hidden />
        {org}
      </div>
      <h2 className="doc-title">{title}</h2>
      <p className="empty-card-note">{note}</p>
    </article>
  );
}

function CertificateCard({
  enrollment,
  holder,
  provisional,
}: {
  enrollment: Enrollment;
  holder: string;
  provisional?: boolean;
}) {
  const theme = institutionTheme(
    enrollment.institution_slug,
    enrollment.institution_kind,
    enrollment.institution_name,
  );
  const schoolName =
    enrollment.institution_name?.trim() || 'Ministry of Higher Education';
  const courseTitle = enrollment.title.includes(' — ')
    ? enrollment.title.split(' — ')[0]
    : enrollment.title;
  const date = provisional
    ? new Date(enrollment.completes_at)
    : new Date(enrollment.completed_at ?? enrollment.completes_at);

  return (
    <article
      className={`rw-card cert-card themed degree cert-inst-${theme.slug} ${provisional ? 'provisional' : ''}`}
      style={certCssVars(theme) as CSSProperties}
    >
      <div className="cert-border" aria-hidden />
      <div className="cert-watermark" aria-hidden>
        {theme.mark}
      </div>
      <p className="cert-org">{schoolName.toUpperCase()}</p>
      <p className="cert-org-sub">
        {theme.shortName}
        {enrollment.institution_kind
          ? ` · ${enrollment.institution_kind.replaceAll('_', ' ')}`
          : ''}
        {' · United Amir'}
      </p>
      <h2 className="cert-heading">Academic Certificate</h2>
      <p className="cert-line">
        {provisional
          ? 'This provisional record confirms that'
          : 'This is to certify that'}
      </p>
      <p className="cert-name">{holder}</p>
      <p className="cert-line">
        {provisional
          ? 'is duly enrolled for and pursuing'
          : 'has duly completed the prescribed course of study in'}
      </p>
      <p className="cert-course">{courseTitle}</p>
      <p className="cert-school-line">
        at <strong>{schoolName}</strong>
      </p>
      <div className="cert-meta">
        <span>Track: {enrollment.track.replaceAll('_', ' ')}</span>
        <span>Level {enrollment.education_level}</span>
        <span>+{enrollment.age_gain_years} yr age credit</span>
        <span>
          {provisional ? 'Expected' : 'Awarded'} {date.toLocaleDateString()}
        </span>
      </div>
      <div className="cert-signs">
        <div>
          <span className="id-sign-ink">Registrar</span>
          <em>{theme.shortName}</em>
        </div>
        <div className="cert-seal-stamp" aria-hidden>
          <GraduationCap size={22} />
          <small>{provisional ? 'PROV' : theme.mark}</small>
        </div>
        <div>
          <span className="id-sign-ink auth">Chancellor</span>
          <em>Institution Seal</em>
        </div>
      </div>
      <p className="doc-serial mono">
        CERT-{enrollment.id.toString().padStart(6, '0')} ·{' '}
        {provisional ? 'IN PROGRESS' : 'ORIGINAL'}
      </p>
    </article>
  );
}

function PermitCard({
  permit,
  holder,
  stateName,
  pending,
}: {
  permit: Permit;
  holder: string;
  stateName: (id: number) => string;
  pending?: boolean;
}) {
  const meta = permitMeta(permit.permit_type);
  return (
    <article
      className={`rw-card permit-card type-${permit.permit_type} ${pending ? 'pending' : ''}`}
    >
      <div className="rw-guilloche dark" aria-hidden />
      <div className="permit-head">
        <div>
          <p className="bank-bank">{stateName(permit.state_id).toUpperCase()}</p>
          <h2 className="doc-title tight">{meta.title}</h2>
          <p className="id-micro">STATE LICENSING AUTHORITY</p>
        </div>
        <div className="permit-glyph">
          <meta.Icon size={28} aria-hidden />
        </div>
      </div>
      <div className="doc-grid">
        <Field label="Permit holder" value={holder} wide />
        <Field label="Class" value={meta.label} />
        <Field label="Fee paid" value={money(permit.fee_paid)} />
        <Field
          label="Issued"
          value={permit.issued_at ? new Date(permit.issued_at).toLocaleDateString() : '—'}
        />
        <Field
          label="Expires"
          value={permit.expires_at ? new Date(permit.expires_at).toLocaleDateString() : 'Open-ended'}
        />
        <Field label="Status" value={pending ? 'PENDING' : permit.status.toUpperCase()} />
      </div>
      <div className="barcode" aria-hidden>
        {Array.from({ length: 40 }, (_, i) => (
          <i key={i} style={{ width: i % 7 === 0 ? 3 : 1 + (i % 3) }} />
        ))}
      </div>
      <p className="doc-serial mono">P-{permit.id.toString().padStart(5, '0')}</p>
    </article>
  );
}

function permitMeta(type: PermitType) {
  switch (type) {
    case 'work':
      return { title: 'Work Permit', label: 'Employment', Icon: Briefcase };
    case 'business':
      return { title: 'Business Permit', label: 'Commerce', Icon: Building2 };
    case 'travel':
      return { title: 'Travel Permit', label: 'Movement', Icon: Plane };
  }
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatId(id: number) {
  const raw = id.toString().padStart(8, '0');
  return `${raw.slice(0, 2)}-${raw.slice(2, 5)}-${raw.slice(5)}`;
}

function formatPan(id: number) {
  const base = (4000000000000000 + id * 7919).toString().slice(0, 16);
  return base.replace(/(.{4})/g, '$1 ').trim();
}

function buildMrz(name: string, id: number, state: string) {
  const clean = name
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .trim()
    .replace(/\s+/g, '<');
  const pad = (s: string, n: number) => (s + '<'.repeat(n)).slice(0, n);
  const doc = `UA${id.toString().padStart(7, '0')}`;
  const st = pad(state.toUpperCase().replace(/[^A-Z]/g, ''), 8);
  return [
    pad(`IDUA${doc}`, 30),
    pad(`${doc}${st}${id % 10}`, 30),
    pad(clean, 30),
  ];
}
